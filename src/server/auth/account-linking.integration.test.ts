import { loadEnvConfig } from "@next/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
const password = "ValidationPassword123!";
const emails = [
  "auth-link-same@invalid.example",
  "auth-link-unverified@invalid.example",
  "auth-link-original@invalid.example",
  "auth-link-different@invalid.example",
] as const;

type GoogleProfileInput = { sub: string; name: string; email: string; email_verified: boolean };
let activeProfile: GoogleProfileInput;
let pool: Pool;

const options = createAuthOptions({
  secret: "account-linking-integration-secret-000000000",
  baseURL,
  google: { clientId: "synthetic-google-client", clientSecret: "synthetic-google-secret" },
});
const googleProvider = options.socialProviders?.google;
if (googleProvider && typeof googleProvider !== "function") {
  googleProvider.getUserInfo = async () => ({
    user: {
      name: activeProfile.name,
      email: activeProfile.email,
      emailVerified: activeProfile.email_verified,
    },
    data: {
      aud: "synthetic-google-client",
      azp: "synthetic-google-client",
      email: activeProfile.email,
      email_verified: activeProfile.email_verified,
      exp: 4_102_444_800,
      family_name: "Customer",
      given_name: activeProfile.name,
      iat: 1_767_222_400,
      iss: "https://accounts.google.com",
      name: activeProfile.name,
      picture: "https://invalid.example/avatar.png",
      sub: activeProfile.sub,
    },
  });
}
const testAuth = isApprovedTarget
  ? betterAuth({ ...options, database: drizzleAdapter(getDb(), { provider: "pg", schema }) })
  : null;

function responseCookies(response: Response): string {
  return response.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
}

async function authRequest(path: string, init?: RequestInit): Promise<Response> {
  if (!testAuth) throw new Error("Integration target unavailable.");
  return testAuth.handler(new Request(`${baseURL}/api/auth${path}`, init));
}

async function createCredentialUser(email: string): Promise<string> {
  const response = await authRequest("/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseURL },
    body: JSON.stringify({ name: "Credential user", email, password }),
  });
  expect(response.status).toBe(200);
  const body = await response.json() as { user: { id: string } };
  return body.user.id;
}

async function completeGoogle(profile: GoogleProfileInput): Promise<Response> {
  activeProfile = profile;
  const start = await authRequest("/sign-in/social", {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseURL },
    body: JSON.stringify({ provider: "google", callbackURL: "/tai-khoan", disableRedirect: true }),
  });
  expect(start.status).toBe(200);
  const body = await start.json() as { url: string };
  const state = new URL(body.url).searchParams.get("state");
  expect(state).toBeTruthy();
  return authRequest(`/callback/google?code=synthetic-code&state=${encodeURIComponent(state!)}`, {
    headers: { cookie: responseCookies(start) },
  });
}

suite("Google account linking boundaries", () => {
  beforeAll(() => {
    pool = new Pool({ connectionString: databaseUrl });
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url !== "https://oauth2.googleapis.com/token") throw new Error(`Unexpected external request: ${url}`);
      return Response.json({
        access_token: "synthetic-access-token",
        token_type: "Bearer",
        expires_in: 3600,
        scope: "openid email profile",
      });
    }));
  });

  beforeEach(async () => {
    await pool.query('delete from "user" where email = any($1::text[])', [[...emails]]);
  });

  afterAll(async () => {
    await pool.query('delete from "user" where email = any($1::text[])', [[...emails]]);
    await pool.end();
    await closeDb();
    vi.unstubAllGlobals();
  });

  it("links a verified matching Google email to the existing credential identity", async () => {
    const userId = await createCredentialUser(emails[0]);
    const callback = await completeGoogle({ sub: "google-same", name: "Google same", email: emails[0], email_verified: true });
    expect(callback.status).toBe(302);
    const users = await pool.query<{ id: string }>('select id::text from "user" where email = $1', [emails[0]]);
    const accounts = await pool.query<{ provider_id: string; user_id: string }>('select provider_id, user_id::text from account where user_id = $1::uuid order by provider_id', [userId]);
    expect(users.rows).toEqual([{ id: userId }]);
    expect(accounts.rows).toEqual([
      { provider_id: "credential", user_id: userId },
      { provider_id: "google", user_id: userId },
    ]);
  });

  it("rejects an unverified matching Google email before persistence", async () => {
    const userId = await createCredentialUser(emails[1]);
    const callback = await completeGoogle({ sub: "google-unverified", name: "Google unverified", email: emails[1], email_verified: false });
    expect(callback.status).toBe(302);
    expect(callback.headers.get("location")).toContain("error=");
    expect(responseCookies(callback)).not.toContain("session_token");
    const accounts = await pool.query<{ provider_id: string }>('select provider_id from account where user_id = $1::uuid order by provider_id', [userId]);
    expect(accounts.rows).toEqual([{ provider_id: "credential" }]);
  });

  it("keeps a different verified Google email as a separate identity", async () => {
    const originalUserId = await createCredentialUser(emails[2]);
    const callback = await completeGoogle({ sub: "google-different", name: "Google different", email: emails[3], email_verified: true });
    expect(callback.status).toBe(302);
    const users = await pool.query<{ id: string; email: string }>('select id::text, email from "user" where email = any($1::text[]) order by email', [[emails[2], emails[3]]]);
    expect(users.rows).toHaveLength(2);
    expect(users.rows.find((row) => row.email === emails[2])?.id).toBe(originalUserId);
    expect(users.rows.find((row) => row.email === emails[3])?.id).not.toBe(originalUserId);
  });
});
