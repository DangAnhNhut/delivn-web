import type { DbTransaction } from "@/server/db";

export type TransactionRunner = <T>(
  work: (transaction: DbTransaction) => Promise<T>,
) => Promise<T>;

export function assertSortedUniqueIds(ids: readonly string[]): void {
  for (let index = 0; index < ids.length; index += 1) {
    if (index > 0 && ids[index - 1] >= ids[index]) {
      throw new Error("Repository IDs must be unique and sorted ascending.");
    }
  }
}
