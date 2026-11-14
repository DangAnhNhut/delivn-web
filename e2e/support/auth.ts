import { expect, type BrowserContext, type Page } from "@playwright/test";

import { createDemoDatabase } from "../../src/server/demo/demo-database";
import { loadDemoEnvironment } from "../../src/server/demo/demo-environment";

export const E2E_AUTH_EMAILS = [
  "e2e-legacy@invalid.example",
  "e2e-insufficient@invalid.example",
  "e2e-auth-journey-a@invalid.example",
  "e2e-auth-journey-b@invalid.example",
  "e2e-auth-session-expiry@invalid.example",
] as const;

export const E2E_AUTH_PASSWORD = "E2eValidationPassword123!";
export const E2E_LEGACY_EMAIL = "e2e-legacy@invalid.example";
type BrowserCookies = Awaited<ReturnType<BrowserContext["cookies"]>>;
const cachedCookies = new Map<string, BrowserCookies>();

export async function clearDemoRateLimits(): Promise<void> {
  const environment = loadDemoEnvironment(process.env);
  const database = createDemoDatabase(environment);
  try {
    await database.assertTarget();
    await database.query('delete from "rate_limit"');
  } finally {
    await database.close();
  }
}

export async function authenticateE2eUser(
  page: Page,
  email: string,
  name = "DELIVN E2E Customer",
): Promise<void> {
  const cached = cachedCookies.get(email);
  if (cached) {
    await page.context().addCookies(cached);
    return;
  }
  await clearDemoRateLimits();
  const origin = "http://127.0.0.1:3100";
  const registration = await page.request.post("/api/auth/sign-up/email", {
    headers: { origin },
    data: { name, email, password: E2E_AUTH_PASSWORD },
  });
  if (registration.ok()) {
    cachedCookies.set(email, await page.context().cookies(origin));
    return;
  }

  await clearDemoRateLimits();
  const login = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin },
    data: { email, password: E2E_AUTH_PASSWORD },
  });
  expect(login.status()).toBe(200);
  cachedCookies.set(email, await page.context().cookies(origin));
}

export async function cleanupE2eAuthUsers(
  emails: readonly string[] = E2E_AUTH_EMAILS,
): Promise<void> {
  if (emails.some((email) => !E2E_AUTH_EMAILS.includes(email as (typeof E2E_AUTH_EMAILS)[number]))) {
    throw new Error("Refusing to clean a non-E2E identity.");
  }
  cachedCookies.clear();
  const environment = loadDemoEnvironment(process.env);
  const database = createDemoDatabase(environment);
  try {
    await database.assertTarget();
    await database.query('delete from "user" where email = any($1::text[])', [[...emails]]);
    await database.query('delete from "rate_limit"');
  } finally {
    await database.close();
  }
}

export async function expireE2eUserSessions(email: string): Promise<void> {
  if (!E2E_AUTH_EMAILS.includes(email as (typeof E2E_AUTH_EMAILS)[number])) {
    throw new Error("Refusing to expire sessions for a non-E2E identity.");
  }
  const environment = loadDemoEnvironment(process.env);
  const database = createDemoDatabase(environment);
  try {
    await database.assertTarget();
    await database.query(
      `update session set expires_at = now() - interval '1 minute'
       where user_id = (select id from "user" where email = $1)`,
      [email],
    );
  } finally {
    await database.close();
  }
}

export async function readE2eUserId(email: string): Promise<string | null> {
  if (!E2E_AUTH_EMAILS.includes(email as (typeof E2E_AUTH_EMAILS)[number])) {
    throw new Error("Refusing to inspect a non-E2E identity.");
  }
  const environment = loadDemoEnvironment(process.env);
  const database = createDemoDatabase(environment);
  try {
    await database.assertTarget();
    const result = await database.query<{ id: string }>(
      'select id::text from "user" where email = $1',
      [email],
    );
    return result.rows[0]?.id ?? null;
  } finally {
    await database.close();
  }
}
