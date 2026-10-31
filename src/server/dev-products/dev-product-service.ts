import {
  DEV_MEDIA,
  DEV_PRODUCTS,
  DEV_STOCK,
  DEV_VARIANTS,
  type DevMedia,
  type DevProduct,
  type DevStock,
  type DevVariant,
} from "./dev-product-data";

type ProductIdentity = Pick<DevProduct, "id" | "slug">;
type VariantIdentity = Pick<DevVariant, "id" | "productId" | "sku">;
type MediaIdentity = Pick<DevMedia, "id" | "productId">;

export type DevProductRepositoryProtocol<TTransaction> = {
  readProductIdentities(
    transaction: TTransaction,
    ids: readonly string[],
    slugs: readonly string[],
  ): Promise<ProductIdentity[]>;
  readVariantIdentities(
    transaction: TTransaction,
    ids: readonly string[],
    skus: readonly string[],
  ): Promise<VariantIdentity[]>;
  readMediaIdentities(
    transaction: TTransaction,
    ids: readonly string[],
  ): Promise<MediaIdentity[]>;
  insertProductsIfMissing(transaction: TTransaction, rows: readonly DevProduct[]): Promise<void>;
  insertVariantsIfMissing(transaction: TTransaction, rows: readonly DevVariant[]): Promise<void>;
  insertMediaIfMissing(transaction: TTransaction, rows: readonly DevMedia[]): Promise<void>;
  insertInventoryIfMissing(transaction: TTransaction, rows: readonly DevStock[]): Promise<void>;
  lockProducts(transaction: TTransaction, ids: readonly string[]): Promise<void>;
  lockVariants(transaction: TTransaction, ids: readonly string[]): Promise<void>;
  restoreProducts(transaction: TTransaction, rows: readonly DevProduct[]): Promise<void>;
  restoreVariants(transaction: TTransaction, rows: readonly DevVariant[]): Promise<void>;
  restoreMedia(transaction: TTransaction, rows: readonly DevMedia[]): Promise<void>;
};

export type DevProductServiceDependencies<TTransaction> = {
  withTransaction<T>(work: (transaction: TTransaction) => Promise<T>): Promise<T>;
  repository: DevProductRepositoryProtocol<TTransaction>;
};

export class DevProductIdentityConflictError extends Error {
  constructor(identity: string) {
    super(`Persistent development product identity conflict: ${identity}.`);
    this.name = "DevProductIdentityConflictError";
  }
}

function conflict(identity: string): never {
  throw new DevProductIdentityConflictError(identity);
}

async function verifyOwnership<TTransaction>(
  transaction: TTransaction,
  repository: DevProductRepositoryProtocol<TTransaction>,
  requireComplete: boolean,
): Promise<void> {
  const [products, variants, media] = await Promise.all([
    repository.readProductIdentities(
      transaction,
      DEV_PRODUCTS.map((row) => row.id),
      DEV_PRODUCTS.map((row) => row.slug),
    ),
    repository.readVariantIdentities(
      transaction,
      DEV_VARIANTS.map((row) => row.id),
      DEV_VARIANTS.map((row) => row.sku),
    ),
    repository.readMediaIdentities(
      transaction,
      DEV_MEDIA.map((row) => row.id),
    ),
  ]);

  for (const row of products) {
    const expectedById = DEV_PRODUCTS.find((item) => item.id === row.id);
    const expectedBySlug = DEV_PRODUCTS.find((item) => item.slug === row.slug);
    if (!expectedById || (expectedBySlug && expectedBySlug.id !== row.id)) {
      conflict(`product ${row.id}/${row.slug}`);
    }
  }
  for (const row of variants) {
    const expectedById = DEV_VARIANTS.find((item) => item.id === row.id);
    const expectedBySku = DEV_VARIANTS.find((item) => item.sku === row.sku);
    if (
      !expectedById ||
      expectedById.productId !== row.productId ||
      (expectedBySku && expectedBySku.id !== row.id)
    ) {
      conflict(`variant ${row.id}/${row.sku}`);
    }
  }
  for (const row of media) {
    const expected = DEV_MEDIA.find((item) => item.id === row.id);
    if (!expected || expected.productId !== row.productId) {
      conflict(`media ${row.id}`);
    }
  }

  if (
    requireComplete &&
    (products.length !== DEV_PRODUCTS.length ||
      variants.length !== DEV_VARIANTS.length ||
      media.length !== DEV_MEDIA.length)
  ) {
    conflict("incomplete deterministic fixture set");
  }
}

export function createDevProductService<TTransaction>(
  dependencies: DevProductServiceDependencies<TTransaction>,
) {
  const { repository } = dependencies;

  return {
    async seed(): Promise<void> {
      await dependencies.withTransaction(async (transaction) => {
        await verifyOwnership(transaction, repository, false);

        await repository.insertProductsIfMissing(transaction, DEV_PRODUCTS);
        await repository.insertVariantsIfMissing(transaction, DEV_VARIANTS);
        await repository.insertMediaIfMissing(transaction, DEV_MEDIA);
        await repository.insertInventoryIfMissing(transaction, DEV_STOCK);

        await repository.lockProducts(
          transaction,
          DEV_PRODUCTS.map((row) => row.id).sort(),
        );
        await repository.lockVariants(
          transaction,
          DEV_VARIANTS.map((row) => row.id).sort(),
        );
        await verifyOwnership(transaction, repository, true);

        await repository.restoreProducts(transaction, DEV_PRODUCTS);
        await repository.restoreVariants(transaction, DEV_VARIANTS);
        await repository.restoreMedia(transaction, DEV_MEDIA);
      });
    },
  };
}
