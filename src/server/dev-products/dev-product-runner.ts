import type { DbTransaction } from "@/server/db";

import {
  createDevProductDatabase,
  DevProductDatabaseTargetError,
  type DevProductDatabase,
} from "./dev-product-database";
import {
  DevProductEnvironmentError,
  loadDevProductEnvironment,
  type DevProductEnvironment,
} from "./dev-product-environment";
import { createDevProductRepository } from "./dev-product-repository";
import {
  createDevProductService,
  DevProductIdentityConflictError,
} from "./dev-product-service";

type DevProductSeedService = { seed(): Promise<void> };

export type DevProductRunnerDependencies<TTransaction = DbTransaction> = {
  createDatabase(environment: DevProductEnvironment): DevProductDatabase<TTransaction>;
  createService(database: DevProductDatabase<TTransaction>): DevProductSeedService;
};

function productionDependencies(): DevProductRunnerDependencies<DbTransaction> {
  return {
    createDatabase: createDevProductDatabase,
    createService(database) {
      return createDevProductService({
        withTransaction: database.withTransaction,
        repository: createDevProductRepository(),
      });
    },
  };
}

export async function runDevProductSeed<TTransaction = DbTransaction>(
  environment: Record<string, string | undefined> = process.env,
  dependencies: DevProductRunnerDependencies<TTransaction> =
    productionDependencies() as unknown as DevProductRunnerDependencies<TTransaction>,
): Promise<void> {
  const validated = loadDevProductEnvironment(environment);
  const database = dependencies.createDatabase(validated);
  try {
    await database.assertTarget();
    await dependencies.createService(database).seed();
  } finally {
    await database.close();
  }
}

export function formatDevProductSeedError(error: unknown): string {
  if (
    error instanceof DevProductEnvironmentError ||
    error instanceof DevProductDatabaseTargetError ||
    error instanceof DevProductIdentityConflictError
  ) {
    return error.message;
  }
  return "Persistent development product seed failed.";
}
