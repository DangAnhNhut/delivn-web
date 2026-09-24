import { and, asc, eq, inArray } from "drizzle-orm";

import type { ProductCategory } from "@/contracts";
import { getDb, type Database, type DbTransaction } from "@/server/db";
import {
  inventory,
  productMedia,
  products,
  productVariants,
  type ProductStatus,
} from "@/server/db/schema";

import { assertSortedUniqueIds } from "./types";

export type ProductMediaRecord = {
  id: string;
  type: "image";
  url: string;
  alt: string;
  sortOrder: number;
};

export type ProductVariantRecord = {
  id: string;
  sku: string;
  label: string;
  weightGrams: number;
  priceVnd: number;
  compareAtPriceVnd: number | null;
  active: boolean;
  quantity: number | null;
  reservedQuantity: number | null;
};

export type ProductStoreRecord = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: ProductCategory;
  status: ProductStatus;
  featured: boolean;
  media: ProductMediaRecord[];
  variants: ProductVariantRecord[];
};

export type VariantRelationship = { variantId: string; productId: string };
export type LockedProduct = { id: string; name: string; status: ProductStatus };
export type LockedVariant = {
  id: string;
  productId: string;
  label: string;
  sku: string;
  active: boolean;
  priceVnd: number;
};

type DatabaseProvider = () => Database;

async function hydrateProducts(
  db: Database,
  productRows: Array<Omit<ProductStoreRecord, "media" | "variants">>,
): Promise<ProductStoreRecord[]> {
  if (productRows.length === 0) {
    return [];
  }

  const productIds = productRows.map((product) => product.id);
  const [mediaRows, variantRows] = await Promise.all([
    db
      .select({
        id: productMedia.id,
        productId: productMedia.productId,
        type: productMedia.type,
        url: productMedia.url,
        alt: productMedia.alt,
        sortOrder: productMedia.sortOrder,
      })
      .from(productMedia)
      .where(inArray(productMedia.productId, productIds))
      .orderBy(asc(productMedia.productId), asc(productMedia.sortOrder)),
    db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        sku: productVariants.sku,
        label: productVariants.label,
        weightGrams: productVariants.weightGrams,
        priceVnd: productVariants.priceVnd,
        compareAtPriceVnd: productVariants.compareAtPriceVnd,
        active: productVariants.active,
        quantity: inventory.quantity,
        reservedQuantity: inventory.reservedQuantity,
      })
      .from(productVariants)
      .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
      .where(and(inArray(productVariants.productId, productIds), eq(productVariants.active, true)))
      .orderBy(asc(productVariants.productId), asc(productVariants.weightGrams), asc(productVariants.sku)),
  ]);

  return productRows.map((product) => ({
    ...product,
    media: mediaRows.filter((media) => media.productId === product.id),
    variants: variantRows.filter((variant) => variant.productId === product.id),
  }));
}

export function createProductRepository(provider: DatabaseProvider = getDb) {
  return {
    async listActiveProducts(): Promise<ProductStoreRecord[]> {
      const db = provider();
      const rows = await db
        .select({
          id: products.id,
          slug: products.slug,
          name: products.name,
          shortName: products.shortName,
          description: products.description,
          category: products.category,
          status: products.status,
          featured: products.featured,
        })
        .from(products)
        .where(eq(products.status, "active"))
        .orderBy(asc(products.name));
      return hydrateProducts(db, rows);
    },

    async findActiveProductBySlug(slug: string): Promise<ProductStoreRecord | null> {
      const db = provider();
      const rows = await db
        .select({
          id: products.id,
          slug: products.slug,
          name: products.name,
          shortName: products.shortName,
          description: products.description,
          category: products.category,
          status: products.status,
          featured: products.featured,
        })
        .from(products)
        .where(and(eq(products.slug, slug), eq(products.status, "active")))
        .limit(1);
      return (await hydrateProducts(db, rows))[0] ?? null;
    },

    async discoverVariantRelationships(
      tx: DbTransaction,
      variantIds: readonly string[],
    ): Promise<VariantRelationship[]> {
      return tx
        .select({ variantId: productVariants.id, productId: productVariants.productId })
        .from(productVariants)
        .where(inArray(productVariants.id, [...variantIds]))
        .orderBy(asc(productVariants.id));
    },

    async lockProductsForShare(
      tx: DbTransaction,
      productIds: readonly string[],
    ): Promise<LockedProduct[]> {
      assertSortedUniqueIds(productIds);
      return tx
        .select({ id: products.id, name: products.name, status: products.status })
        .from(products)
        .where(inArray(products.id, [...productIds]))
        .orderBy(asc(products.id))
        .for("share");
    },

    async lockVariantsForShare(
      tx: DbTransaction,
      variantIds: readonly string[],
    ): Promise<LockedVariant[]> {
      assertSortedUniqueIds(variantIds);
      return tx
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          label: productVariants.label,
          sku: productVariants.sku,
          active: productVariants.active,
          priceVnd: productVariants.priceVnd,
        })
        .from(productVariants)
        .where(inArray(productVariants.id, [...variantIds]))
        .orderBy(asc(productVariants.id))
        .for("share");
    },
  };
}

export type ProductRepository = ReturnType<typeof createProductRepository>;
