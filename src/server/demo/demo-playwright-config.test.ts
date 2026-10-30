import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { resolveDemoPlaywrightConfig } from "./demo-playwright-config";

describe("resolveDemoPlaywrightConfig", () => {
  it("preserves Playwright-managed Chromium when the browser channel is unset", () => {
    const result = resolveDemoPlaywrightConfig({
      NODE_ENV: "test",
      DELIVN_ENABLE_DEMO_SEED: "true",
      DELIVN_E2E_DATABASE_URL: "postgresql://e2e:secret@localhost/delivn_e2e",
    });

    expect(result).not.toHaveProperty("browserChannel");
  });

  it.each(["chrome", "msedge"] as const)(
    "selects the installed %s browser channel while preserving it for Playwright workers",
    (browserChannel) => {
      const environment = {
        NODE_ENV: "test" as const,
        DELIVN_ENABLE_DEMO_SEED: "true",
        DELIVN_E2E_DATABASE_URL: "postgresql://e2e:secret@localhost/delivn_e2e",
        DELIVN_E2E_BROWSER_CHANNEL: browserChannel,
      };
      const result = resolveDemoPlaywrightConfig(environment);

      expect(result.browserChannel).toBe(browserChannel);
      expect(environment.DELIVN_E2E_BROWSER_CHANNEL).toBe(browserChannel);
      expect(result.webServer.env).toHaveProperty("DELIVN_E2E_BROWSER_CHANNEL", undefined);

      const effectiveChildEnvironment: NodeJS.ProcessEnv = {
        ...environment,
        ...result.webServer.env,
      };
      const child = spawnSync(
        process.execPath,
        [
          "-e",
          "process.stdout.write(String(Object.hasOwn(process.env, 'DELIVN_E2E_BROWSER_CHANNEL')))",
        ],
        { encoding: "utf8", env: effectiveChildEnvironment },
      );

      expect(child.status).toBe(0);
      expect(child.stdout).toBe("false");
    },
  );

  it("rejects unsupported browser channels", () => {
    expect(() =>
      resolveDemoPlaywrightConfig({
        NODE_ENV: "test",
        DELIVN_ENABLE_DEMO_SEED: "true",
        DELIVN_E2E_DATABASE_URL: "postgresql://e2e:secret@localhost/delivn_e2e",
        DELIVN_E2E_BROWSER_CHANNEL: "chromium",
      }),
    ).toThrow(/DELIVN_E2E_BROWSER_CHANNEL.*chrome.*msedge/i);
  });

  it("binds the browser and Next.js server to the fixed local E2E target", () => {
    const e2eUrl = "postgresql://e2e:secret@127.0.0.1:5432/delivn_e2e";
    const result = resolveDemoPlaywrightConfig({
      NODE_ENV: "test",
      DELIVN_ENABLE_DEMO_SEED: "true",
      DELIVN_E2E_DATABASE_URL: e2eUrl,
      DATABASE_URL: "postgresql://app:secret@127.0.0.1:5432/delivn_dev",
    });

    expect(result).toEqual({
      baseURL: "http://127.0.0.1:3100",
      databaseUrl: e2eUrl,
      webServer: {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
        env: expect.objectContaining({ DATABASE_URL: e2eUrl }),
        reuseExistingServer: false,
        url: "http://127.0.0.1:3100",
      },
    });
    expect(result.webServer.env.DATABASE_URL).not.toContain("delivn_dev");
  });

  it("inherits no undefined environment entries", () => {
    const result = resolveDemoPlaywrightConfig({
      NODE_ENV: "test",
      DELIVN_ENABLE_DEMO_SEED: "true",
      DELIVN_E2E_DATABASE_URL: "postgresql://e2e:secret@localhost/delivn_e2e",
      OPTIONAL_VALUE: undefined,
    });

    expect(Object.values(result.webServer.env).every((value) => typeof value === "string")).toBe(true);
    expect(result.webServer.env).not.toHaveProperty("OPTIONAL_VALUE");
  });
});
