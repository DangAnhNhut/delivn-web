import { loadEnvConfig } from "@next/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { closeDb, getDb } from "@/server/db";
import * as schema from "@/server/db/schema";
import { createAuthOptions } from "./auth-options";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
const isApprovedTarget = (() => {
  if (!databaseUrl) return false;
  const url = new URL(databaseUrl);
  return (url.hostname === "127.0.0.1" || url.hostname === "localhost") && url.pathname === "/delivn_dev";
})();

const suite = isApprovedTarget ? describe : describe.skip;
const baseURL = "http://127.0.0.1:3000";

let pool: Pool;

function createTestAuthInstance(secretSuffix: string) {
  return betterAuth({
    ...createAuthOptions({
      secret: `rate-limit-integration-secret-${secretSuffix}`,
      baseURL,
      google: null,
    }),
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
  });
}

suite("database-backed distributed rate limiting", () => {
  let authA: ReturnType<typeof createTestAuthInstance>;
  let authB: ReturnType<typeof createTestAuthInstance>;

  beforeAll(async () => {
    pool = new Pool({ connectionString: databaseUrl });
    authA = createTestAuthInstance("instance-a-000000000000");
    authB = createTestAuthInstance("instance-b-000000000000");
  });

  afterAll(async () => {
    await pool.query('delete from "rate_limit" where key like $1', ["%198.51.100.9%"]);
    await pool.end();
    await closeDb();
  });

  beforeEach(async () => {
    await pool.query('delete from "rate_limit" where key like $1', ["%198.51.100.9%"]);
  });

  it("1. selects database storage in auth options and context", () => {
    const options = createAuthOptions({
      secret: "rate-limit-config-secret-0000000000",
      baseURL,
      google: null,
    });
    expect(options.rateLimit).toMatchObject({
      enabled: true,
      storage: "database",
    });

    expect(authA.options.rateLimit).toMatchObject({
      enabled: true,
      storage: "database",
    });
  });

  it("2. allows requests under threshold and persists state in postgres", async () => {
    const testIp = "198.51.100.92";
    const req1 = new Request(`${baseURL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseURL,
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({ email: "invalid@example.com", password: "wrong-password" }),
    });

    const res1 = await authA.handler(req1);
    expect(res1.status).not.toBe(429);

    const dbRows = await pool.query('select * from "rate_limit" where key like $1', [`%${testIp}%`]);
    expect(dbRows.rows.length).toBe(1);
    expect(dbRows.rows[0].count).toBe(1);
    expect(Number(dbRows.rows[0].last_request)).toBeGreaterThan(0);
  });

  it("3. produces HTTP 429 when threshold is reached", async () => {
    const testIp = "198.51.100.93";
    // /sign-in/email has default rule max: 3, window: 10s
    for (let i = 1; i <= 3; i++) {
      const req = new Request(`${baseURL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: baseURL,
          "x-forwarded-for": testIp,
        },
        body: JSON.stringify({ email: "invalid@example.com", password: "wrong-password" }),
      });
      const res = await authA.handler(req);
      expect(res.status).not.toBe(429);
    }

    // 4th request must be rejected with 429
    const req4 = new Request(`${baseURL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseURL,
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({ email: "invalid@example.com", password: "wrong-password" }),
    });
    const res4 = await authA.handler(req4);
    expect(res4.status).toBe(429);
    expect(res4.headers.get("x-retry-after")).toBeTruthy();

    const body = await res4.json();
    expect(body).toMatchObject({
      message: "Too many requests. Please try again later.",
    });
  });

  it("4. counter expires and resets after window elapsed", async () => {
    const testIp = "198.51.100.94";
    // Fill up to threshold (3 requests)
    for (let i = 1; i <= 3; i++) {
      const req = new Request(`${baseURL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: baseURL,
          "x-forwarded-for": testIp,
        },
        body: JSON.stringify({ email: "invalid@example.com", password: "wrong-password" }),
      });
      await authA.handler(req);
    }

    // Verify 4th is blocked
    const reqBlocked = new Request(`${baseURL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseURL,
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({ email: "invalid@example.com", password: "wrong-password" }),
    });
    const resBlocked = await authA.handler(reqBlocked);
    expect(resBlocked.status).toBe(429);

    // Simulate window expiry: set last_request to 15 seconds in the past
    const expiredTimestamp = Date.now() - 15_000;
    await pool.query(
      'update "rate_limit" set last_request = $1 where key like $2',
      [expiredTimestamp, `%${testIp}%`],
    );

    // Next request should now succeed because window expired
    const reqAfterExpiry = new Request(`${baseURL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseURL,
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({ email: "invalid@example.com", password: "wrong-password" }),
    });
    const resAfterExpiry = await authA.handler(reqAfterExpiry);
    expect(resAfterExpiry.status).not.toBe(429);

    // Verify database counter was reset to 1
    const dbRows = await pool.query('select * from "rate_limit" where key like $1', [`%${testIp}%`]);
    expect(dbRows.rows[0].count).toBe(1);
  });

  it("5. two independent auth instances sharing database enforce shared limits across alternating requests", async () => {
    const testIp = "198.51.100.95";
    // Alternating between authA and authB:
    // Req 1 -> Instance A (count 1)
    const req1 = new Request(`${baseURL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseURL,
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({ email: "invalid@example.com", password: "wrong-password" }),
    });
    const res1 = await authA.handler(req1);
    expect(res1.status).not.toBe(429);

    // Req 2 -> Instance B (count 2)
    const req2 = new Request(`${baseURL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseURL,
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({ email: "invalid@example.com", password: "wrong-password" }),
    });
    const res2 = await authB.handler(req2);
    expect(res2.status).not.toBe(429);

    // Req 3 -> Instance A (count 3)
    const req3 = new Request(`${baseURL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseURL,
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({ email: "invalid@example.com", password: "wrong-password" }),
    });
    const res3 = await authA.handler(req3);
    expect(res3.status).not.toBe(429);

    // Req 4 -> Instance B: MUST be 429 even though Instance B only handled 1 request earlier!
    const req4 = new Request(`${baseURL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseURL,
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({ email: "invalid@example.com", password: "wrong-password" }),
    });
    const res4 = await authB.handler(req4);
    expect(res4.status).toBe(429);
    expect(res4.headers.get("x-retry-after")).toBeTruthy();

    const body4 = await res4.json();
    expect(body4).toMatchObject({
      message: "Too many requests. Please try again later.",
    });
  });
});
