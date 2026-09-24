import { loadEnvConfig } from "@next/env";

import { closeDb } from "@/server/db";
import { loadDevelopmentSeedTemplate } from "@/server/db/seed-data";
import {
  SeedConfigurationError,
  SeedIdentityConflictError,
} from "@/server/errors/commerce-error";
import { createSeedService } from "@/server/services/seed.service";

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());
  const template = loadDevelopmentSeedTemplate(process.env);
  await createSeedService().seed(template);
  console.info("Development seed completed without overwriting existing rows.");
}

main()
  .catch((error: unknown) => {
    if (error instanceof SeedConfigurationError || error instanceof SeedIdentityConflictError) {
      console.error(error.message);
    } else {
      console.error("Development seed failed.");
    }
    process.exitCode = 1;
  })
  .finally(closeDb);
