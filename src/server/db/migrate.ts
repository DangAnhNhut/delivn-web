import { loadEnvConfig } from "@next/env";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { closeDb, getDb } from "./index";

loadEnvConfig(process.cwd());

async function runMigrations(): Promise<void> {
  try {
    await migrate(getDb(), { migrationsFolder: "drizzle" });
    console.info("DELIVN database migrations applied.");
  } catch {
    console.error("DELIVN database migration failed.");
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

void runMigrations();
