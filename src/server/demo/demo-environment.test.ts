import { describe, expect, it } from "vitest";

import { loadDemoEnvironment } from "./demo-environment";

const VALID_URL = "postgresql://delivn_app:secret@127.0.0.1:5432/delivn_e2e";

function environment(overrides: Record<string, string | undefined> = {}) {
  return {
    NODE_ENV: "test",
    DELIVN_ENABLE_DEMO_SEED: "true",
    DELIVN_E2E_DATABASE_URL: VALID_URL,
    DATABASE_URL: "postgresql://delivn_app:secret@127.0.0.1:5432/delivn_dev",
    ...overrides,
  };
}

describe("loadDemoEnvironment", () => {
  it.each([
    ["production mode", { NODE_ENV: "production" }],
    ["missing opt-in", { DELIVN_ENABLE_DEMO_SEED: undefined }],
    ["incorrect opt-in", { DELIVN_ENABLE_DEMO_SEED: "TRUE" }],
    ["missing URL", { DELIVN_E2E_DATABASE_URL: undefined }],
    ["invalid protocol", { DELIVN_E2E_DATABASE_URL: "https://127.0.0.1/delivn_e2e" }],
    [
      "remote host",
      { DELIVN_E2E_DATABASE_URL: "postgresql://user:secret@db.example.com:5432/delivn_e2e" },
    ],
    [
      "wrong database",
      { DELIVN_E2E_DATABASE_URL: "postgresql://user:secret@127.0.0.1:5432/delivn_dev" },
    ],
  ])("rejects %s", (_label, overrides) => {
    expect(() => loadDemoEnvironment(environment(overrides))).toThrow();
  });

  it.each(["host", "port", "db", "database"])(
    "rejects the PostgreSQL query parameter %s because it can override the validated target",
    (parameter) => {
      const value = parameter === "host" ? "db.example.com" : parameter === "port" ? "6543" : "delivn_dev";
      expect(() =>
        loadDemoEnvironment(
          environment({
            DELIVN_E2E_DATABASE_URL: `${VALID_URL}?${parameter}=${value}`,
          }),
        ),
      ).toThrow(/query parameter/i);
    },
  );

  it("rejects an E2E target that resolves to the ordinary application database", () => {
    expect(() =>
      loadDemoEnvironment(
        environment({
          DELIVN_E2E_DATABASE_URL:
            "postgresql://e2e_user:e2e_secret@localhost:5432/delivn_e2e?sslmode=disable",
          DATABASE_URL: "postgresql://normal_user:normal_secret@127.0.0.1/delivn_e2e",
        }),
      ),
    ).toThrow(/ordinary DATABASE_URL/i);
  });

  it("uses PostgreSQL routing overrides when comparing the ordinary application database", () => {
    expect(() =>
      loadDemoEnvironment(
        environment({
          DATABASE_URL:
            "postgresql://normal_user:normal_secret@db.example.com:6543/delivn_e2e?host=localhost&port=5432",
        }),
      ),
    ).toThrow(/ordinary DATABASE_URL/i);
  });

  it.each([
    VALID_URL,
    "postgres://delivn_app:secret@localhost/delivn_e2e?sslmode=disable",
  ])("accepts the guarded local E2E target %s", (databaseUrl) => {
    expect(
      loadDemoEnvironment(
        environment({
          DELIVN_E2E_DATABASE_URL: databaseUrl,
        }),
      ),
    ).toEqual({
      databaseName: "delivn_e2e",
      databaseUrl,
    });
  });
});
