import { loadEnvConfig } from "@next/env";

import { runDemoOperation } from "../src/server/demo/demo-runner";
import { cleanupE2eAuthUsers } from "./support/auth";

export default async function globalTeardown(): Promise<void> {
  loadEnvConfig(process.cwd());
  await runDemoOperation("reset");
  await cleanupE2eAuthUsers();
}
