import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { ServerConfigurationError } from "@/server/errors/commerce-error";

import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;
type TransactionCallback = Parameters<Database["transaction"]>[0];
export type DbTransaction = Parameters<TransactionCallback>[0];

let pool: Pool | undefined;
let database: Database | undefined;

export function getDb(): Database {
  if (database) {
    return database;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new ServerConfigurationError();
  }

  pool = new Pool({ connectionString: databaseUrl });
  database = drizzle(pool, { schema });
  return database;
}

export async function withTransaction<T>(
  work: (transaction: DbTransaction) => Promise<T>,
): Promise<T> {
  return getDb().transaction(work);
}

export async function closeDb(): Promise<void> {
  const activePool = pool;
  pool = undefined;
  database = undefined;
  await activePool?.end();
}
