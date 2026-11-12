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
    expect(resolveAuthEnvironment({ ...valid, GOOGLE_CLIENT_ID: "client", GOOGLE_CLIENT_SECRET: "secret" }).google)
      .toEqual({ clientId: "client", clientSecret: "secret" });
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
