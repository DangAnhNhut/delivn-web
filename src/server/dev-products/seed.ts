import { loadEnvConfig } from "@next/env";

import { formatDevProductSeedError, runDevProductSeed } from "./dev-product-runner";

loadEnvConfig(process.cwd());

runDevProductSeed()
  .then(() => {
    console.info("Persistent development products are ready in local delivn_dev.");
  })
  .catch((error: unknown) => {
    console.error(formatDevProductSeedError(error));
    process.exitCode = 1;
  });
