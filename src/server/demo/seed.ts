import { loadEnvConfig } from "@next/env";

import { runDemoOperation } from "./demo-runner";

loadEnvConfig(process.cwd());

runDemoOperation("seed")
  .then(() => console.info("DELIVN development demo data is ready."))
  .catch(() => {
    console.error("DELIVN development demo seed failed.");
    process.exitCode = 1;
  });
