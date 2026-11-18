import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveAuthEnvironment } from "./auth-environment";

const valid = {
  BETTER_AUTH_SECRET: "s".repeat(32),
  BETTER_AUTH_URL: "http://127.0.0.1:3000",
};

describe("resolveAuthEnvironment", () => {
  it("accepts email/password-only configuration", () => {
    expect(resolveAuthEnvironment(valid)).toEqual({
      secret: valid.BETTER_AUTH_SECRET,
      baseURL: valid.BETTER_AUTH_URL,
      google: null,
    });
  });

  it("accepts complete Google configuration", () => {
    expect(resolveAuthEnvironment({ ...valid, GOOGLE_CLIENT_ID: "  client  ", GOOGLE_CLIENT_SECRET: "  secret  " }).google)
      .toEqual({ clientId: "client", clientSecret: "secret" });
  });

  it("treats two whitespace-only Google values as disabled", () => {
    expect(resolveAuthEnvironment({
      ...valid,
      GOOGLE_CLIENT_ID: "   ",
      GOOGLE_CLIENT_SECRET: "\t",
    }).google).toBeNull();
  });

  it("keeps Google credentials as empty placeholders in the committed environment example", () => {
    const example = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
    expect(example).toMatch(/^GOOGLE_CLIENT_ID=\s*$/m);
    expect(example).toMatch(/^GOOGLE_CLIENT_SECRET=\s*$/m);
    expect(example).not.toMatch(/^GOOGLE_(?:CLIENT_ID|CLIENT_SECRET)=.+$/m);
  });

  it("keeps Google credentials out of the client-side auth boundary", () => {
    const clientSources = [
      "src/components/auth/AuthForm.tsx",
      "src/lib/auth/auth-client.ts",
      "src/lib/auth/google-oauth.ts",
    ].map((path) => readFileSync(resolve(process.cwd(), path), "utf8"));

    for (const source of clientSources) {
      expect(source).not.toContain("GOOGLE_CLIENT_ID");
      expect(source).not.toContain("GOOGLE_CLIENT_SECRET");
      expect(source).not.toContain("clientSecret");
      expect(source).not.toContain("@/server/auth");
    }
  });

  it.each([
    [{ ...valid, BETTER_AUTH_SECRET: undefined }, "BETTER_AUTH_SECRET"],
    [{ ...valid, BETTER_AUTH_SECRET: "too-short" }, "BETTER_AUTH_SECRET"],
    [
      { ...valid, BETTER_AUTH_SECRET: "CHANGE_ME_TO_A_LONG_RANDOM_SECRET" },
      "BETTER_AUTH_SECRET",
    ],
    [
      { ...valid, BETTER_AUTH_SECRET: "replace-me-with-a-real-secret-value-now" },
      "BETTER_AUTH_SECRET",
    ],
    [
      { ...valid, BETTER_AUTH_SECRET: "your-secret-here-123456789012345" },
      "BETTER_AUTH_SECRET",
    ],
    [
      { ...valid, BETTER_AUTH_SECRET: "better-auth-secret-1234567890123" },
      "BETTER_AUTH_SECRET",
    ],
    [
      { ...valid, BETTER_AUTH_SECRET: "development-secret-1234567890123" },
      "BETTER_AUTH_SECRET",
    ],
    [
      { ...valid, BETTER_AUTH_SECRET: "test-secret-12345678901234567890" },
      "BETTER_AUTH_SECRET",
    ],
    [{ ...valid, BETTER_AUTH_URL: "ftp://example.test" }, "BETTER_AUTH_URL"],
    [{ ...valid, BETTER_AUTH_URL: "not a url" }, "BETTER_AUTH_URL"],
    [{ ...valid, GOOGLE_CLIENT_ID: "private-client" }, "GOOGLE_CLIENT_SECRET"],
    [{ ...valid, GOOGLE_CLIENT_SECRET: "private-secret" }, "GOOGLE_CLIENT_ID"],
    [{ ...valid, GOOGLE_CLIENT_ID: "private-client", GOOGLE_CLIENT_SECRET: "   " }, "GOOGLE_CLIENT_SECRET"],
    [{ ...valid, GOOGLE_CLIENT_ID: "   ", GOOGLE_CLIENT_SECRET: "private-secret" }, "GOOGLE_CLIENT_ID"],
  ])("rejects invalid configuration without leaking values", (environment, variable) => {
    expect(() => resolveAuthEnvironment(environment)).toThrow(variable);
    try {
      resolveAuthEnvironment(environment);
    } catch (error) {
      expect(String(error)).not.toContain("private-client");
      expect(String(error)).not.toContain("private-secret");
    }
  });
});
