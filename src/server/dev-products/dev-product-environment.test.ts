import { describe, expect, it } from "vitest";

import { loadDevProductEnvironment } from "./dev-product-environment";

const LOCAL_URL = "postgresql://delivn_app:secret@127.0.0.1:5432/delivn_dev";

describe("persistent development product environment", () => {
  it.each([
    LOCAL_URL,
    "postgres://delivn_app:secret@localhost/delivn_dev",
    `${LOCAL_URL}?sslmode=disable`,
  ])("accepts the validated local delivn_dev target: %s", (databaseUrl) => {
    expect(loadDevProductEnvironment({ DATABASE_URL: databaseUrl })).toEqual({
      databaseName: "delivn_dev",
      databaseUrl,
    });
  });

  it("ignores E2E variables and uses only the ordinary DATABASE_URL", () => {
    expect(
      loadDevProductEnvironment({
        DATABASE_URL: LOCAL_URL,
        DELIVN_E2E_DATABASE_URL:
          "postgresql://delivn_app:secret@127.0.0.1:5432/delivn_e2e",
        DELIVN_ENABLE_DEMO_SEED: "true",
      }),
    ).toEqual({ databaseName: "delivn_dev", databaseUrl: LOCAL_URL });
  });

  it.each([
    ["production", { DATABASE_URL: LOCAL_URL, NODE_ENV: "production" }, /production/i],
    ["missing URL", {}, /DATABASE_URL/i],
    ["unsupported protocol", { DATABASE_URL: "mysql://localhost/delivn_dev" }, /PostgreSQL/i],
    [
      "remote host",
      { DATABASE_URL: "postgresql://delivn_app:secret@db.example.com/delivn_dev" },
      /loopback/i,
    ],
    [
      "E2E database",
      { DATABASE_URL: "postgresql://delivn_app:secret@127.0.0.1/delivn_e2e" },
      /delivn_dev/i,
    ],
    [
      "different local database",
      { DATABASE_URL: "postgresql://delivn_app:secret@127.0.0.1/postgres" },
      /delivn_dev/i,
    ],
    ["malformed URL", { DATABASE_URL: "not a URL" }, /valid PostgreSQL URL/i],
  ])("rejects %s", (_label, environment, message) => {
    expect(() => loadDevProductEnvironment(environment)).toThrow(message);
  });

  it.each(["host", "port", "database", "user", "password", "application_name"])(
    "rejects routing or unknown query parameter %s",
    (parameter) => {
      expect(() =>
        loadDevProductEnvironment({ DATABASE_URL: `${LOCAL_URL}?${parameter}=override` }),
      ).toThrow(new RegExp(parameter, "i"));
    },
  );
});
