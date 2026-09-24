import { asc, eq, inArray } from "drizzle-orm";

import type { ProductCategory } from "@/contracts";
import type { DbTransaction } from "@/server/db";
import { inventory, productMedia, products, productVariants } from "@/server/db/schema";

import { assertSortedUniqueIds } from "./types";

export type SeedProductInput = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: ProductCategory;
};

export type SeedVariantInput = {
  productId: string;
  sku: string;
  label: string;
  weightGrams: number;
  priceVnd: number;
};

export function createSeedRepository() {
  return {
    async insertProductIfMissing(tx: DbTransaction, data: SeedProductInput): Promise<void> {
      await tx.insert(products).values({ ...data, status: "draft", featured: false }).onConflictDoNothing({
        target: products.slug,
      });
    },

    async findProductBySlug(tx: DbTransaction, slug: string) {
      return (
        await tx.select().from(products).where(eq(products.slug, slug)).limit(1)
      )[0] ?? null;
    },

    async lockProductsForShare(tx: DbTransaction, productIds: readonly string[]) {
      assertSortedUniqueIds(productIds);
      return tx
        .select()
        .from(products)
        .where(inArray(products.id, [...productIds]))
        .orderBy(asc(products.id))
        .for("share");
    },

    async insertVariantIfMissing(tx: DbTransaction, data: SeedVariantInput): Promise<void> {
      await tx
        .insert(productVariants)
        .values({ ...data, active: false, compareAtPriceVnd: null })
        .onConflictDoNothing({ target: productVariants.sku });
    },

    async findVariantBySku(tx: DbTransaction, sku: string) {
      return (
        await tx.select().from(productVariants).where(eq(productVariants.sku, sku)).limit(1)
      )[0] ?? null;
    },

    async lockVariantsForShare(tx: DbTransaction, variantIds: readonly string[]) {
      assertSortedUniqueIds(variantIds);
      return tx
        .select()
        .from(productVariants)
        .where(inArray(productVariants.id, [...variantIds]))
        .orderBy(asc(productVariants.id))
        .for("share");
    },

    async insertInventoryIfMissing(
      tx: DbTransaction,
      data: { variantId: string; quantity: number },
    ): Promise<void> {
      await tx
        .insert(inventory)
        .values({ ...data, reservedQuantity: 0 })
        .onConflictDoNothing({ target: inventory.variantId });
    },

    async insertMediaIfMissing(
      tx: DbTransaction,
      data: { id: string; productId: string; url: string; alt: string; sortOrder: number },
    ): Promise<void> {
      await tx
        .insert(productMedia)
        .values({ ...data, type: "image" })
        .onConflictDoNothing({ target: productMedia.id });
    },

    async findMediaById(tx: DbTransaction, id: string) {
      return (
        await tx.select().from(productMedia).where(eq(productMedia.id, id)).limit(1)
      )[0] ?? null;
    },
  };
}

export type SeedRepository = ReturnType<typeof createSeedRepository>;
