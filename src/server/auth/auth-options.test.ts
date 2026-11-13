import { describe, expect, it } from "vitest";
import { createAuthOptions } from "./auth-options";

const env = { secret: "s".repeat(32), baseURL: "http://127.0.0.1:3000", google: null };

describe("createAuthOptions", () => {
  it("uses UUID database sessions and safe credential/linking policy", () => {
    const options = createAuthOptions(env);
    expect(options.advanced?.database?.generateId).toBe("uuid");
    expect(options.emailAndPassword).toMatchObject({ enabled: true, minPasswordLength: 8, maxPasswordLength: 128 });
    expect(options.session).toMatchObject({ expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 });
    expect(options.session?.cookieCache).toBeUndefined();
    expect(options.rateLimit).toMatchObject({ enabled: true, storage: "database" });
    expect(options.account?.accountLinking?.allowDifferentEmails).toBe(false);
    expect(options.account?.accountLinking?.requireLocalEmailVerified).toBe(false);
    expect(options.account?.accountLinking?.trustedProviders).toBeUndefined();
    expect(options.socialProviders).toEqual({});
  });

  it("rejects an unverified Google profile before persistence", async () => {
    const options = createAuthOptions({ ...env, google: { clientId: "id", clientSecret: "secret" } });
    expect(options.socialProviders?.google).toMatchObject({ clientId: "id", clientSecret: "secret" });
    const validate = options.user?.validateUserInfo;
    expect(validate).toBeTypeOf("function");
    const context = {} as never;
    expect(await validate?.({ user: {}, source: { action: "create-user", method: "oauth", oauth: { providerId: "google", profile: { email_verified: false } } } }, context))
      .toMatchObject({ error: "unverified_google_email" });
    expect(await validate?.({ user: {}, source: { action: "link-account", method: "oauth", oauth: { providerId: "google", profile: { email_verified: true } } } }, context))
      .toBeUndefined();
  });
});
