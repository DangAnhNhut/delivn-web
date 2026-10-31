import { asc, eq, inArray, or } from "drizzle-orm";

import type { DbTransaction } from "@/server/db";
import { inventory, productMedia, products, productVariants } from "@/server/db/schema";
import { assertSortedUniqueIds } from "@/server/repositories/types";

import type { DevProductRepositoryProtocol } from "./dev-product-service";

export function createDevProductRepository(): DevProductRepositoryProtocol<DbTransaction> {
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
      await tx
        .insert(inventory)
        .values(rows.map((row) => ({ ...row })))
        .onConflictDoNothing({ target: inventory.variantId });
    },

    async lockProducts(tx, ids) {
      assertSortedUniqueIds(ids);
      await tx
        .select({ id: products.id })
        .from(products)
        .where(inArray(products.id, [...ids]))
        .orderBy(asc(products.id))
        .for("update");
    },

    async lockVariants(tx, ids) {
      assertSortedUniqueIds(ids);
      await tx
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(inArray(productVariants.id, [...ids]))
        .orderBy(asc(productVariants.id))
        .for("update");
    },

    async restoreProducts(tx, rows) {
      const updatedAt = new Date();
      for (const row of rows) {
        await tx
          .update(products)
          .set({
            slug: row.slug,
            name: row.name,
            shortName: row.shortName,
            description: row.description,
            category: row.category,
            status: row.status,
            featured: row.featured,
            updatedAt,
          })
          .where(eq(products.id, row.id));
      }
    },

    async restoreVariants(tx, rows) {
      const updatedAt = new Date();
      for (const row of rows) {
        await tx
          .update(productVariants)
          .set({
            productId: row.productId,
            sku: row.sku,
            label: row.label,
            weightGrams: row.weightGrams,
            priceVnd: row.priceVnd,
            compareAtPriceVnd: row.compareAtPriceVnd,
            active: row.active,
            updatedAt,
          })
          .where(eq(productVariants.id, row.id));
      }
    },

    async restoreMedia(tx, rows) {
      for (const row of rows) {
        await tx
          .update(productMedia)
          .set({
            productId: row.productId,
            type: row.type,
            url: row.url,
            alt: row.alt,
            sortOrder: row.sortOrder,
          })
          .where(eq(productMedia.id, row.id));
      }
    },
  };
}
