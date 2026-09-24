import { withTransaction, type DbTransaction } from "@/server/db";
import type {
  DevelopmentSeedMedia,
  DevelopmentSeedProduct,
  DevelopmentSeedTemplate,
  DevelopmentSeedVariant,
} from "@/server/db/seed-data";
import { SeedIdentityConflictError } from "@/server/errors/commerce-error";
import { createSeedRepository } from "@/server/repositories/seed.repository";

type SeedProductRow = Omit<DevelopmentSeedProduct, "variants"> & { id: string };
type SeedVariantRow = Omit<DevelopmentSeedVariant, "stock"> & {
  id: string;
  productId: string;
};
type SeedMediaRow = Omit<DevelopmentSeedMedia, "productSlug"> & {
  productId: string;
  type: "image";
};

type SeedRepositoryProtocol<TTransaction> = {
  insertProductIfMissing(
    transaction: TTransaction,
    input: Omit<DevelopmentSeedProduct, "variants">,
  ): Promise<void>;
  findProductBySlug(transaction: TTransaction, slug: string): Promise<SeedProductRow | null>;
  lockProductsForShare(
    transaction: TTransaction,
    productIds: readonly string[],
  ): Promise<SeedProductRow[]>;
  insertVariantIfMissing(
    transaction: TTransaction,
    input: Omit<DevelopmentSeedVariant, "stock"> & { productId: string },
  ): Promise<void>;
  findVariantBySku(transaction: TTransaction, sku: string): Promise<SeedVariantRow | null>;
  lockVariantsForShare(
    transaction: TTransaction,
    variantIds: readonly string[],
  ): Promise<SeedVariantRow[]>;
  insertInventoryIfMissing(
    transaction: TTransaction,
    input: { variantId: string; quantity: number },
  ): Promise<void>;
  insertMediaIfMissing(
    transaction: TTransaction,
    input: Omit<DevelopmentSeedMedia, "productSlug"> & { productId: string },
  ): Promise<void>;
  findMediaById(transaction: TTransaction, id: string): Promise<SeedMediaRow | null>;
};

export type SeedServiceDependencies<TTransaction> = {
  withTransaction<T>(work: (transaction: TTransaction) => Promise<T>): Promise<T>;
  repository: SeedRepositoryProtocol<TTransaction>;
};

function productionDependencies(): SeedServiceDependencies<DbTransaction> {
  return { withTransaction, repository: createSeedRepository() };
}

function sameMedia(row: SeedMediaRow, input: Omit<DevelopmentSeedMedia, "productSlug"> & { productId: string }) {
  return row.productId === input.productId && row.type === "image" && row.url === input.url &&
    row.alt === input.alt && row.sortOrder === input.sortOrder;
}

export function createSeedService<TTransaction = DbTransaction>(
  dependencies?: SeedServiceDependencies<TTransaction>,
) {
  const deps = dependencies ??
    (productionDependencies() as unknown as SeedServiceDependencies<TTransaction>);

  return {
    async seed(template: DevelopmentSeedTemplate): Promise<void> {
      await deps.withTransaction(async (transaction) => {
        const productsBySlug = new Map<string, SeedProductRow>();

        // Global writer stage 1: products. Do not return here after variants begin.
        for (const templateProduct of template.products) {
          const product = {
            slug: templateProduct.slug,
            name: templateProduct.name,
            shortName: templateProduct.shortName,
            description: templateProduct.description,
            category: templateProduct.category,
          };
          await deps.repository.insertProductIfMissing(transaction, product);
          const resolved = await deps.repository.findProductBySlug(transaction, product.slug);
          if (!resolved) throw new SeedIdentityConflictError(`product slug ${product.slug}`);
          productsBySlug.set(product.slug, resolved);
        }
        const productIds = [...productsBySlug.values()].map((row) => row.id).sort();
        const lockedProducts = await deps.repository.lockProductsForShare(transaction, productIds);
        if (lockedProducts.length !== productIds.length) {
          throw new SeedIdentityConflictError("product lock set");
        }

        // Global writer stage 2: product variants.
        const variantsBySku = new Map<string, SeedVariantRow>();
        const templateVariants = new Map<string, { productId: string; variant: DevelopmentSeedVariant }>();
        for (const product of template.products) {
          const productId = productsBySlug.get(product.slug)?.id;
          if (!productId) throw new SeedIdentityConflictError(`product slug ${product.slug}`);
          for (const { stock: _stock, ...variant } of product.variants) {
            await deps.repository.insertVariantIfMissing(transaction, { ...variant, productId });
            const resolved = await deps.repository.findVariantBySku(transaction, variant.sku);
            if (!resolved) throw new SeedIdentityConflictError(`SKU ${variant.sku}`);
            variantsBySku.set(variant.sku, resolved);
            templateVariants.set(variant.sku, { productId, variant: { ...variant, stock: _stock } });
          }
        }
        const variantIds = [...variantsBySku.values()].map((row) => row.id).sort();
        const lockedVariants = await deps.repository.lockVariantsForShare(transaction, variantIds);
        if (lockedVariants.length !== variantIds.length) {
          throw new SeedIdentityConflictError("variant lock set");
        }
        const lockedVariantBySku = new Map(lockedVariants.map((row) => [row.sku, row]));
        for (const [sku, expected] of templateVariants) {
          const actual = lockedVariantBySku.get(sku);
          if (
            !actual || actual.productId !== expected.productId ||
            actual.weightGrams !== expected.variant.weightGrams ||
            actual.label !== expected.variant.label
          ) {
            throw new SeedIdentityConflictError(`SKU ${sku}`);
          }
        }

        // Global writer stage 3: inventory. Existing rows are never updated.
        for (const variantId of variantIds) {
          const row = lockedVariants.find((variant) => variant.id === variantId);
          const expected = row ? templateVariants.get(row.sku) : undefined;
          if (!row || !expected) throw new SeedIdentityConflictError(`variant ${variantId}`);
          await deps.repository.insertInventoryIfMissing(transaction, {
            variantId,
            quantity: expected.variant.stock,
          });
        }

        for (const media of template.media ?? []) {
          const productId = productsBySlug.get(media.productSlug)?.id;
          if (!productId) throw new SeedIdentityConflictError(`media product ${media.productSlug}`);
          const input = {
            id: media.id,
            productId,
            url: media.url,
            alt: media.alt,
            sortOrder: media.sortOrder,
          };
          await deps.repository.insertMediaIfMissing(transaction, input);
          const resolved = await deps.repository.findMediaById(transaction, media.id);
          if (!resolved || !sameMedia(resolved, input)) {
            throw new SeedIdentityConflictError(`media ${media.id}`);
          }
        }
      });
    },
  };
}
