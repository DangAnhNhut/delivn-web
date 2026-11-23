import { loadEnvConfig } from "@next/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { closeDb, getDb } from "@/server/db";
import * as schema from "@/server/db/schema";
import { createCustomerOrderRepository } from "@/server/repositories/customer-order.repository";
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
  "auth-link-opt-b-user@invalid.example",
  "auth-link-opt-b-diff@invalid.example",
  "auth-link-opt-b-foreign@invalid.example",
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

let requestCounter = 0;

async function authRequest(path: string, init?: RequestInit): Promise<Response> {
  if (!testAuth) throw new Error("Integration target unavailable.");
  requestCounter++;
  const headers = new Headers(init?.headers);
  if (!headers.has("x-forwarded-for")) {
    headers.set("x-forwarded-for", `198.51.100.${10 + (requestCounter % 50)}`);
  }
  return testAuth.handler(new Request(`${baseURL}/api/auth${path}`, { ...init, headers }));
}

async function createCredentialUser(email: string): Promise<{ userId: string; sessionCookie: string }> {
  const response = await authRequest("/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseURL },
    body: JSON.stringify({ name: "Credential user", email, password }),
  });
  expect(response.status).toBe(200);
  const body = (await response.json()) as { user: { id: string } };
  return { userId: body.user.id, sessionCookie: responseCookies(response) };
}

async function loginCredentialUser(email: string): Promise<{ userId: string; sessionCookie: string }> {
  const response = await authRequest("/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseURL },
    body: JSON.stringify({ email, password }),
  });
  expect(response.status).toBe(200);
  const body = (await response.json()) as { user: { id: string } };
  return { userId: body.user.id, sessionCookie: responseCookies(response) };
}

async function markLocalEmailVerified(userId: string): Promise<void> {
  await pool.query('update "user" set email_verified = true where id = $1::uuid', [userId]);
}

async function completeGoogle(profile: GoogleProfileInput): Promise<Response> {
  activeProfile = profile;
  const start = await authRequest("/sign-in/social", {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseURL },
    body: JSON.stringify({ provider: "google", callbackURL: "/tai-khoan", disableRedirect: true }),
  });
  expect(start.status).toBe(200);
  const body = (await start.json()) as { url: string };
  const state = new URL(body.url).searchParams.get("state");
  expect(state).toBeTruthy();
  return authRequest(`/callback/google?code=synthetic-code&state=${encodeURIComponent(state!)}`, {
    headers: { cookie: responseCookies(start) },
  });
}

async function completeLinkGoogle(sessionCookie: string, profile: GoogleProfileInput): Promise<Response> {
  activeProfile = profile;
  const start = await authRequest("/link-social", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: baseURL,
      cookie: sessionCookie,
    },
    body: JSON.stringify({
      provider: "google",
      callbackURL: "/tai-khoan",
      errorCallbackURL: "/tai-khoan",
      disableRedirect: true,
    }),
  });
  expect(start.status).toBe(200);
  const body = (await start.json()) as { url: string };
  const state = new URL(body.url).searchParams.get("state");
  expect(state).toBeTruthy();
  const linkCookies = responseCookies(start);
  const combinedCookies = [sessionCookie, linkCookies].filter(Boolean).join("; ");
  return authRequest(
    `/callback/google?code=synthetic-code&state=${encodeURIComponent(state!)}`,
    {
      headers: { cookie: combinedCookies },
    },
  );
}

async function cancelLinkGoogle(sessionCookie: string): Promise<Response> {
  const start = await authRequest("/link-social", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: baseURL,
      cookie: sessionCookie,
    },
    body: JSON.stringify({
      provider: "google",
      callbackURL: "/tai-khoan",
      errorCallbackURL: "/tai-khoan",
      disableRedirect: true,
    }),
  });
  expect(start.status).toBe(200);
  const body = (await start.json()) as { url: string };
  const state = new URL(body.url).searchParams.get("state");
  expect(state).toBeTruthy();
  const linkCookies = responseCookies(start);
  const combinedCookies = [sessionCookie, linkCookies].filter(Boolean).join("; ");
  return authRequest(
    `/callback/google?error=access_denied&error_description=The+user+denied+the+request&state=${encodeURIComponent(state!)}`,
    {
      headers: { cookie: combinedCookies },
    },
  );
}

async function createTestOrder(userId: string, orderNumber: string): Promise<void> {
  await pool.query(
    `insert into orders (
      user_id, order_number, customer_name, phone, address,
      subtotal_vnd, shipping_fee_vnd, total_vnd,
      payment_method, payment_status, order_status
    ) values (
      $1::uuid, $2, 'Option B Customer', '0901234567', '123 Nguyen Trai, Q1, HCM',
      250000, 30000, 280000,
      'cod', 'unpaid', 'pending'
    )`,
    [userId, orderNumber],
  );
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
    await pool.query('delete from orders where user_id in (select id from "user" where email = any($1::text[]))', [[...emails]]);
    await pool.query('delete from "user" where email = any($1::text[])', [[...emails]]);
  });

  afterAll(async () => {
    await pool.query('delete from orders where user_id in (select id from "user" where email = any($1::text[]))', [[...emails]]);
    await pool.query('delete from "user" where email = any($1::text[])', [[...emails]]);
    await pool.end();
    await closeDb();
    vi.unstubAllGlobals();
  });

  it("links a verified matching Google email to the existing verified credential identity", async () => {
    const { userId } = await createCredentialUser(emails[0]);
    await markLocalEmailVerified(userId);
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

  it("signs in through an existing Google link without creating duplicate users or accounts", async () => {
    const { userId } = await createCredentialUser(emails[0]);
    await markLocalEmailVerified(userId);
    const profile = { sub: "google-repeat", name: "Google repeat", email: emails[0], email_verified: true };
    expect((await completeGoogle(profile)).status).toBe(302);

    const repeat = await completeGoogle(profile);
    expect(repeat.status).toBe(302);
    expect(responseCookies(repeat)).toContain("session_token");
    const users = await pool.query<{ count: string }>('select count(*)::text as count from "user" where email = $1', [emails[0]]);
    const accounts = await pool.query<{ count: string }>('select count(*)::text as count from account where user_id = $1::uuid and provider_id = $2', [userId, "google"]);
    expect(users.rows).toEqual([{ count: "1" }]);
    expect(accounts.rows).toEqual([{ count: "1" }]);
  });

  it("rejects implicit linking when the matching local identity is unverified", async () => {
    const { userId } = await createCredentialUser(emails[1]);
    const callback = await completeGoogle({ sub: "google-local-unverified", name: "Google local unverified", email: emails[1], email_verified: true });
    expect(callback.status).toBe(302);
    expect(callback.headers.get("location")).toContain("error=");
    expect(responseCookies(callback)).not.toContain("session_token");
    const accounts = await pool.query<{ provider_id: string }>('select provider_id from account where user_id = $1::uuid order by provider_id', [userId]);
    expect(accounts.rows).toEqual([{ provider_id: "credential" }]);
  });

  it("rejects an unverified matching Google email before persistence", async () => {
    const { userId } = await createCredentialUser(emails[1]);
    await markLocalEmailVerified(userId);
    const callback = await completeGoogle({ sub: "google-unverified", name: "Google unverified", email: emails[1], email_verified: false });
    expect(callback.status).toBe(302);
    expect(callback.headers.get("location")).toContain("error=");
    expect(responseCookies(callback)).not.toContain("session_token");
    const accounts = await pool.query<{ provider_id: string }>('select provider_id from account where user_id = $1::uuid order by provider_id', [userId]);
    expect(accounts.rows).toEqual([{ provider_id: "credential" }]);
  });

  it("keeps a different verified Google email as a separate identity", async () => {
    const { userId: originalUserId } = await createCredentialUser(emails[2]);
    const callback = await completeGoogle({ sub: "google-different", name: "Google different", email: emails[3], email_verified: true });
    expect(callback.status).toBe(302);
    const users = await pool.query<{ id: string; email: string }>('select id::text, email from "user" where email = any($1::text[]) order by email', [[emails[2], emails[3]]]);
    expect(users.rows).toHaveLength(2);
    expect(users.rows.find((row) => row.email === emails[2])?.id).toBe(originalUserId);
    expect(users.rows.find((row) => row.email === emails[3])?.id).not.toBe(originalUserId);
  });

  describe("Option B: explicit Google account linking lifecycle (A through L)", () => {
    const targetEmail = emails[4];
    const differentEmail = emails[5];
    const foreignEmail = emails[6];

    it("executes the full Option B policy: unverified local blocks implicit linking, explicit linking attaches Google without duplicate user/account, preserves order ownership, and allows subsequent Google and password logins", async () => {
      // Step A: unverified password user exists -> Google login while logged out has implicit linking blocked
      const { userId: originalUserId, sessionCookie: originalSessionCookie } = await createCredentialUser(targetEmail);
      const userBefore = await pool.query<{ email_verified: boolean }>('select email_verified from "user" where id = $1::uuid', [originalUserId]);
      expect(userBefore.rows[0].email_verified).toBe(false);

      // Attach an existing order to originalUserId
      const orderNumber = `DLV-OPTB-${Date.now()}`;
      await createTestOrder(originalUserId, orderNumber);

      // A: Logged-out Google login attempt with same email
      const implicitAttempt = await completeGoogle({
        sub: "google-opt-b-sub",
        name: "Google Option B",
        email: targetEmail,
        email_verified: true,
      });
      expect(implicitAttempt.status).toBe(302);
      const implicitLocation = implicitAttempt.headers.get("location");
      expect(implicitLocation).toContain("error=");
      expect(implicitLocation).toMatch(/account_not_linked|account%20not%20linked/);
      expect(responseCookies(implicitAttempt)).not.toContain("session_token");

      // Verify no duplicate user and no google account row was created during implicit attempt
      const usersAfterImplicit = await pool.query<{ count: string }>('select count(*)::text as count from "user" where email = $1', [targetEmail]);
      expect(usersAfterImplicit.rows[0].count).toBe("1");
      const accountsAfterImplicit = await pool.query<{ provider_id: string }>('select provider_id from account where user_id = $1::uuid', [originalUserId]);
      expect(accountsAfterImplicit.rows).toEqual([{ provider_id: "credential" }]);

      // Step B: Authenticated DELIVN user explicitly links Google account via linkSocial
      const linkResult = await completeLinkGoogle(originalSessionCookie, {
        sub: "google-opt-b-sub",
        name: "Google Option B",
        email: targetEmail,
        email_verified: true,
      });
      expect(linkResult.status).toBe(302);
      expect(linkResult.headers.get("location")).toBe("/tai-khoan");

      // Step C: Exactly one user row remains and retains the original user ID
      const usersAfterLink = await pool.query<{ id: string }>('select id::text from "user" where email = $1', [targetEmail]);
      expect(usersAfterLink.rows).toEqual([{ id: originalUserId }]);

      // Step D: Credential provider remains
      // Step E: Google provider exists
      const accountsAfterLink = await pool.query<{ provider_id: string; user_id: string }>(
        'select provider_id, user_id::text from account where user_id = $1::uuid order by provider_id',
        [originalUserId],
      );
      expect(accountsAfterLink.rows).toEqual([
        { provider_id: "credential", user_id: originalUserId },
        { provider_id: "google", user_id: originalUserId },
      ]);

      // Step F: Same Google account signs in later while logged out -> resolves to the same user
      const googleLogin = await completeGoogle({
        sub: "google-opt-b-sub",
        name: "Google Option B",
        email: targetEmail,
        email_verified: true,
      });
      expect(googleLogin.status).toBe(302);
      expect(googleLogin.headers.get("location")).toBe("/tai-khoan");
      const googleSessionCookie = responseCookies(googleLogin);
      expect(googleSessionCookie).toContain("session_token");

      // Verify session is for originalUserId
      const googleSession = await authRequest("/get-session", { headers: { cookie: googleSessionCookie } });
      expect(googleSession.status).toBe(200);
      const googleSessionBody = (await googleSession.json()) as { user: { id: string; email: string } };
      expect(googleSessionBody.user.id).toBe(originalUserId);
      expect(googleSessionBody.user.email).toBe(targetEmail);

      // Step G: Password login still works and resolves to the same user
      const { userId: passwordUserId, sessionCookie: newPasswordSessionCookie } = await loginCredentialUser(targetEmail);
      expect(passwordUserId).toBe(originalUserId);
      expect(newPasswordSessionCookie).toContain("session_token");

      // Step I: Repeat explicit link attempt does not create duplicate provider account rows
      const repeatLinkResult = await completeLinkGoogle(newPasswordSessionCookie, {
        sub: "google-opt-b-sub",
        name: "Google Option B",
        email: targetEmail,
        email_verified: true,
      });
      expect(repeatLinkResult.status).toBe(302);
      const googleAccountsCount = await pool.query<{ count: string }>(
        'select count(*)::text as count from account where user_id = $1::uuid and provider_id = $2',
        [originalUserId, "google"],
      );
      expect(googleAccountsCount.rows[0].count).toBe("1");

      // Step K: Existing orders remain attached to the original DELIVN user UUID
      const repository = createCustomerOrderRepository(getDb());
      const ownedOrders = await repository.listByUserId(originalUserId);
      expect(ownedOrders.map((o) => o.orderNumber)).toContain(orderNumber);
      const orderDetail = await repository.findDetailByOrderNumberAndUserId(orderNumber, originalUserId);
      expect(orderDetail).not.toBeNull();
      expect(orderDetail?.order.orderNumber).toBe(orderNumber);

      // Step L: Foreign order authorization remains strict
      const { userId: foreignUserId } = await createCredentialUser(foreignEmail);
      const foreignOrderNumber = `DLV-FOREIGN-${Date.now()}`;
      await createTestOrder(foreignUserId, foreignOrderNumber);

      // Original user cannot access foreign user's order
      expect(await repository.findDetailByOrderNumberAndUserId(foreignOrderNumber, originalUserId)).toBeNull();
      // Nonexistent order returns null
      expect(await repository.findDetailByOrderNumberAndUserId("DLV-NONEXISTENT", originalUserId)).toBeNull();
    });

    it("H. rejects explicit linking when Google email differs from authenticated DELIVN user email", async () => {
      const { userId, sessionCookie } = await createCredentialUser(targetEmail);
      const linkResult = await completeLinkGoogle(sessionCookie, {
        sub: "google-diff-sub",
        name: "Google Diff",
        email: differentEmail,
        email_verified: true,
      });
      expect(linkResult.status).toBe(302);
      const location = linkResult.headers.get("location");
      expect(location).toContain("/tai-khoan");
      expect(location).toContain("error=email_does_not_match");

      // Verify no google account was created for this user
      const accounts = await pool.query<{ provider_id: string }>(
        'select provider_id from account where user_id = $1::uuid and provider_id = $2',
        [userId, "google"],
      );
      expect(accounts.rows).toHaveLength(0);
    });

    it("J. handles Google OAuth cancel during explicit linking safely and returns to account page", async () => {
      const { sessionCookie } = await createCredentialUser(targetEmail);
      const cancelResult = await cancelLinkGoogle(sessionCookie);
      expect(cancelResult.status).toBe(302);
      const location = cancelResult.headers.get("location");
      expect(location).toContain("/tai-khoan");
      expect(location).toContain("error=access_denied");
    });
  });
});
