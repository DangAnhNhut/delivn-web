import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

type PackageManifest = {
  dependencies?: Record<string, string>;
};

type PackageLock = {
  packages?: Record<string, { version?: string }>;
};

const APPROVED_VERSION = "1.7.17";

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
}

describe("Better Auth dependency policy", () => {
  it("pins Better Auth and every committed companion package to stable 1.7.17", () => {
    const manifest = readJson<PackageManifest>("package.json");
    const lock = readJson<PackageLock>("package-lock.json");

    expect(manifest.dependencies?.["better-auth"]).toBe(APPROVED_VERSION);
    expect(lock.packages?.["node_modules/better-auth"]?.version).toBe(
      APPROVED_VERSION,
    );

    const companionDependencies = Object.entries(manifest.dependencies ?? {}).filter(
      ([name]) => name === "auth" || name.startsWith("@better-auth/"),
    );
    for (const [name, version] of companionDependencies) {
      expect(version, name).toBe(APPROVED_VERSION);
      expect(version, name).not.toMatch(/beta|rc/i);
      expect(lock.packages?.[`node_modules/${name}`]?.version, name).toBe(
        APPROVED_VERSION,
      );
    }
  });
});
