import { describe, expect, it } from "vitest";

import { DevProductEnvironmentError } from "./dev-product-environment";
import { DevProductDatabaseTargetError } from "./dev-product-database";
import { DevProductIdentityConflictError } from "./dev-product-service";
import {
  formatDevProductSeedError,
  runDevProductSeed,
  type DevProductRunnerDependencies,
} from "./dev-product-runner";

const LOCAL_URL = "postgresql://delivn_app:secret@127.0.0.1:5432/delivn_dev";

function createHarness(targetError?: Error, seedError?: Error) {
  const events: string[] = [];
  let receivedDatabaseUrl: string | undefined;

  const dependencies: DevProductRunnerDependencies<Record<string, never>> = {
    createDatabase(environment) {
      receivedDatabaseUrl = environment.databaseUrl;
      events.push("database:create");
      return {
        async assertTarget() {
          events.push("database:assert-target");
          if (targetError) throw targetError;
        },
        async withTransaction(work) {
          return work({});
        },
        async close() {
          events.push("database:close");
        },
      };
    },
    createService() {
      events.push("service:create");
      return {
        async seed() {
          events.push("service:seed");
          if (seedError) throw seedError;
        },
      };
    },
  };

  return { dependencies, events, receivedDatabaseUrl: () => receivedDatabaseUrl };
}

describe("persistent development product runner", () => {
  it("validates and routes only the ordinary DATABASE_URL", async () => {
    const harness = createHarness();

    await runDevProductSeed(
      {
        DATABASE_URL: LOCAL_URL,
        DELIVN_E2E_DATABASE_URL:
          "postgresql://delivn_app:secret@127.0.0.1:5432/delivn_e2e",
        DELIVN_ENABLE_DEMO_SEED: "true",
      },
      harness.dependencies,
    );

    expect(harness.receivedDatabaseUrl()).toBe(LOCAL_URL);
    expect(harness.events).toEqual([
      "database:create",
      "database:assert-target",
      "service:create",
      "service:seed",
      "database:close",
    ]);
  });

  it("rejects invalid environment before creating a database", async () => {
    const harness = createHarness();

    await expect(
      runDevProductSeed({ DATABASE_URL: LOCAL_URL, NODE_ENV: "production" }, harness.dependencies),
    ).rejects.toBeInstanceOf(DevProductEnvironmentError);
    expect(harness.events).toEqual([]);
  });

  it("rejects a resolved database mismatch before seed and still closes", async () => {
    const harness = createHarness(new DevProductDatabaseTargetError());

    await expect(
      runDevProductSeed({ DATABASE_URL: LOCAL_URL }, harness.dependencies),
    ).rejects.toBeInstanceOf(DevProductDatabaseTargetError);
    expect(harness.events).toEqual([
      "database:create",
      "database:assert-target",
      "database:close",
    ]);
  });

  it("closes the database when seed fails", async () => {
    const harness = createHarness(undefined, new Error("write failed"));

    await expect(runDevProductSeed({ DATABASE_URL: LOCAL_URL }, harness.dependencies)).rejects.toThrow(
      "write failed",
    );
    expect(harness.events.at(-1)).toBe("database:close");
  });

  it("formats expected errors without exposing unexpected details", () => {
    expect(formatDevProductSeedError(new DevProductEnvironmentError("Invalid local target."))).toBe(
      "Invalid local target.",
    );
    expect(formatDevProductSeedError(new DevProductDatabaseTargetError())).toMatch(/delivn_dev/i);
    expect(formatDevProductSeedError(new DevProductIdentityConflictError("product"))).toMatch(
      /identity conflict/i,
    );
    expect(formatDevProductSeedError(new Error(`password=${LOCAL_URL}`))).toBe(
      "Persistent development product seed failed.",
    );
  });
});
