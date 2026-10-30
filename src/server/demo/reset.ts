import { loadEnvConfig } from "@next/env";

import { runDemoOperation } from "./demo-runner";

loadEnvConfig(process.cwd());

runDemoOperation("reset")
  .then(() => console.info("DELIVN development demo data was reset."))
  .catch(() => {
    console.error("DELIVN development demo reset failed.");
    process.exitCode = 1;
  });
