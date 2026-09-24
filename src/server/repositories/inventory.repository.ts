import { and, asc, eq, inArray, sql } from "drizzle-orm";

import type { DbTransaction } from "@/server/db";
import { inventory } from "@/server/db/schema";

import { assertSortedUniqueIds } from "./types";

export type LockedInventory = {
  variantId: string;
  quantity: number;
  reservedQuantity: number;
};

export type InventoryReservation = { variantId: string; quantity: number };

export function createInventoryRepository() {
  return {
    async lockInventoryForUpdate(
      tx: DbTransaction,
      variantIds: readonly string[],
    ): Promise<LockedInventory[]> {
      assertSortedUniqueIds(variantIds);
      return tx
        .select({
          variantId: inventory.variantId,
          quantity: inventory.quantity,
          reservedQuantity: inventory.reservedQuantity,
        })
        .from(inventory)
        .where(inArray(inventory.variantId, [...variantIds]))
        .orderBy(asc(inventory.variantId))
        .for("update");
    },

    async reserveInventory(
      tx: DbTransaction,
      reservations: readonly InventoryReservation[],
    ): Promise<void> {
      assertSortedUniqueIds(reservations.map((reservation) => reservation.variantId));
      for (const reservation of reservations) {
        const updated = await tx
          .update(inventory)
          .set({
            reservedQuantity: sql`${inventory.reservedQuantity} + ${reservation.quantity}`,
            updatedAt: sql`now()`,
          })
          .where(
            and(
              eq(inventory.variantId, reservation.variantId),
              sql`${inventory.reservedQuantity} + ${reservation.quantity} <= ${inventory.quantity}`,
            ),
          )
          .returning({ variantId: inventory.variantId });
        if (updated.length !== 1) {
          throw new Error("Inventory reservation failed.");
        }
      }
    },
  };
}

export type InventoryRepository = ReturnType<typeof createInventoryRepository>;
