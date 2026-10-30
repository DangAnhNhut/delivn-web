import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

import { resolveDemoPlaywrightConfig } from "./src/server/demo/demo-playwright-config";

loadEnvConfig(process.cwd());
const local = resolveDemoPlaywrightConfig(process.env);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: local.baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(local.browserChannel ? { channel: local.browserChannel } : {}),
      },
    },
  ],
  webServer: {
    ...local.webServer,
    // The helper uses an undefined sentinel so Node omits the runner-only
    // browser channel when Playwright spawns the Next.js child process.
    env: local.webServer.env as Record<string, string>,
  },
});
