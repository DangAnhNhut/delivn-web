import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { DbTransaction } from "@/server/db";
import * as schema from "@/server/db/schema";

import type { DevProductEnvironment } from "./dev-product-environment";

export class DevProductDatabaseTargetError extends Error {
  constructor() {
    super("Connected database is not the validated local delivn_dev target.");
    this.name = "DevProductDatabaseTargetError";
  }
}

export type DevProductDatabase<TTransaction = DbTransaction> = {
  assertTarget(): Promise<void>;
  withTransaction<T>(work: (transaction: TTransaction) => Promise<T>): Promise<T>;
  close(): Promise<void>;
};

export function createDevProductDatabase(
  environment: DevProductEnvironment,
): DevProductDatabase<DbTransaction> {
  const pool = new Pool({ connectionString: environment.databaseUrl });
  const database = drizzle(pool, { schema });

  return {
    async assertTarget(): Promise<void> {
      const result = await pool.query<{ currentDatabase: string }>(
        'select current_database() as "currentDatabase"',
      );
      if (result.rows[0]?.currentDatabase !== environment.databaseName) {
        throw new DevProductDatabaseTargetError();
      }
    },
    withTransaction<T>(work: (transaction: DbTransaction) => Promise<T>): Promise<T> {
      return database.transaction(work, { isolationLevel: "serializable" });
    },
    close(): Promise<void> {
      return pool.end();
    },
  };
}
