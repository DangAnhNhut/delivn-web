import { loadEnvConfig } from "@next/env";

import { runDemoOperation } from "../src/server/demo/demo-runner";

export default async function globalSetup(): Promise<void> {
  loadEnvConfig(process.cwd());
  await runDemoOperation("reset");
}
