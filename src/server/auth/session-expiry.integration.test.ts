import { loadEnvConfig } from "@next/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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
const email = "auth-session-expiry-integration@invalid.example";
const password = "ValidationPassword123!";
let pool: Pool;

const testAuth = isApprovedTarget
  ? betterAuth({
      ...createAuthOptions({
        secret: "session-expiry-integration-secret-000000000",
        baseURL: "http://127.0.0.1:3000",
        google: null,
      }),
      database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    })
  : null;

function cookieHeader(response: Response): string {
  return response.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
}

async function authRequest(path: string, init?: RequestInit): Promise<Response> {
  if (!testAuth) throw new Error("Integration target is unavailable.");
  return testAuth.handler(new Request(`http://127.0.0.1:3000/api/auth${path}`, init));
}

suite("database-backed session expiry", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: databaseUrl });
    await pool.query('delete from "user" where email = $1', [email]);
  });

  afterAll(async () => {
    await pool.query('delete from "user" where email = $1', [email]);
    await pool.end();
    await closeDb();
  });

  it("rejects an expired database session instead of refreshing it", async () => {
    const registration = await authRequest("/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:3000" },
      body: JSON.stringify({ name: "Expiry integration", email, password }),
    });
    expect(registration.status).toBe(200);
    const body = await registration.clone().json() as { user: { id: string } };
    const cookie = cookieHeader(registration);

    await pool.query('update session set expires_at = now() - interval \'1 minute\' where user_id = $1::uuid', [body.user.id]);
    const databaseState = await pool.query<{ expired: boolean }>(
      'select expires_at < now() as expired from session where user_id = $1::uuid',
      [body.user.id],
    );
    expect(databaseState.rows[0]?.expired).toBe(true);

    const response = await authRequest("/get-session", { headers: { cookie } });
    expect(response.status).toBe(200);
    expect(await response.json()).toBeNull();
  });
});
