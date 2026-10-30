import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool, type QueryResultRow } from "pg";

import type { DbTransaction } from "@/server/db";
import * as schema from "@/server/db/schema";

import type { DemoEnvironment } from "./demo-environment";

export function createDemoDatabase(environment: DemoEnvironment) {
  const pool = new Pool({ connectionString: environment.databaseUrl });
  const database = drizzle(pool, { schema });

  return {
    async assertTarget(): Promise<void> {
      const result = await pool.query<{ currentDatabase: string }>(
        'select current_database() as "currentDatabase"',
      );
      if (result.rows[0]?.currentDatabase !== environment.databaseName) {
        throw new Error("Connected database is not the validated DELIVN E2E target.");
      }
    },
    async migrate(): Promise<void> {
      await migrate(database, { migrationsFolder: "drizzle" });
    },
    withTransaction<T>(work: (transaction: DbTransaction) => Promise<T>): Promise<T> {
      return database.transaction(work, { isolationLevel: "serializable" });
    },
    query<TRow extends QueryResultRow>(text: string, values: readonly unknown[] = []) {
      return pool.query<TRow>(text, [...values]);
    },
    close(): Promise<void> {
      return pool.end();
    },
  };
}

export type DemoDatabase = ReturnType<typeof createDemoDatabase>;
