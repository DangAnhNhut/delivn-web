import { asc, eq, inArray, or } from "drizzle-orm";

import type { DbTransaction } from "@/server/db";
import {
  inventory,
  orderItems,
  orders,
  orderStatusHistory,
  productMedia,
  products,
  productVariants,
} from "@/server/db/schema";

import type { DemoRepositoryProtocol } from "./demo-service";

export function createDemoRepository(): DemoRepositoryProtocol<DbTransaction> {
  return {
    readProductIdentities(tx, ids, slugs) {
      return tx
        .select({ id: products.id, slug: products.slug })
        .from(products)
        .where(or(inArray(products.id, [...ids]), inArray(products.slug, [...slugs])))
        .orderBy(asc(products.id));
    },

    readVariantIdentities(tx, ids, skus) {
      return tx
        .select({ id: productVariants.id, productId: productVariants.productId, sku: productVariants.sku })
        .from(productVariants)
        .where(or(inArray(productVariants.id, [...ids]), inArray(productVariants.sku, [...skus])))
        .orderBy(asc(productVariants.id));
    },

    readMediaIdentities(tx, ids) {
      return tx
        .select({ id: productMedia.id, productId: productMedia.productId })
        .from(productMedia)
        .where(inArray(productMedia.id, [...ids]))
        .orderBy(asc(productMedia.id));
    },

    async insertProductsIfMissing(tx, rows) {
      await tx.insert(products).values(rows.map((row) => ({ ...row }))).onConflictDoNothing();
    },

    async insertVariantsIfMissing(tx, rows) {
      await tx.insert(productVariants).values(rows.map((row) => ({ ...row }))).onConflictDoNothing();
    },

    async insertMediaIfMissing(tx, rows) {
      await tx.insert(productMedia).values(rows.map((row) => ({ ...row }))).onConflictDoNothing();
    },

    async insertInventoryIfMissing(tx, rows) {
      await tx.insert(inventory).values(rows.map((row) => ({ ...row }))).onConflictDoNothing();
    },

    async lockDemoRows(tx, productIds, variantIds) {
      await tx
        .select({ id: products.id })
        .from(products)
        .where(inArray(products.id, [...productIds]))
        .orderBy(asc(products.id))
        .for("update");
      await tx
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(inArray(productVariants.id, [...variantIds]))
        .orderBy(asc(productVariants.id))
        .for("update");
      await tx
        .select({ variantId: inventory.variantId })
        .from(inventory)
        .where(inArray(inventory.variantId, [...variantIds]))
        .orderBy(asc(inventory.variantId))
        .for("update");
    },

    async readCandidateOrderItems(tx, demoVariantIds) {
      const candidateRows = await tx
        .select({ orderId: orderItems.orderId })
        .from(orderItems)
        .where(inArray(orderItems.variantId, [...demoVariantIds]));
      const orderIds = [...new Set(candidateRows.map((row) => row.orderId))].sort();
      if (orderIds.length === 0) return [];

      await tx
        .select({ id: orders.id })
        .from(orders)
        .where(inArray(orders.id, orderIds))
        .orderBy(asc(orders.id))
        .for("update");

      return tx
        .select({ orderId: orderItems.orderId, variantId: orderItems.variantId })
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds))
        .orderBy(asc(orderItems.orderId), asc(orderItems.variantId))
        .for("update");
    },

    async deleteOrderStatusHistory(tx, orderIds) {
      await tx.delete(orderStatusHistory).where(inArray(orderStatusHistory.orderId, [...orderIds]));
    },

    async deleteOrderItems(tx, orderIds) {
      await tx.delete(orderItems).where(inArray(orderItems.orderId, [...orderIds]));
    },

    async deleteOrders(tx, orderIds) {
      await tx.delete(orders).where(inArray(orders.id, [...orderIds]));
    },

    async reconcileFixtures(tx, fixtures) {
      await this.insertProductsIfMissing(tx, fixtures.products);
      for (const row of fixtures.products) {
        await tx.update(products).set({ ...row, updatedAt: new Date() }).where(eq(products.id, row.id));
      }

      await this.insertVariantsIfMissing(tx, fixtures.variants);
      for (const row of fixtures.variants) {
        await tx
          .update(productVariants)
          .set({ ...row, updatedAt: new Date() })
          .where(eq(productVariants.id, row.id));
      }

      await this.insertMediaIfMissing(tx, fixtures.media);
      for (const row of fixtures.media) {
        await tx.update(productMedia).set({ ...row }).where(eq(productMedia.id, row.id));
      }

      for (const row of fixtures.stock) {
        await tx
          .insert(inventory)
          .values({ ...row })
          .onConflictDoUpdate({
            target: inventory.variantId,
            set: { quantity: row.quantity, reservedQuantity: row.reservedQuantity, updatedAt: new Date() },
          });
      }
    },
  };
}
