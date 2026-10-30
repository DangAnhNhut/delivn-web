import {
  DEMO_MEDIA,
  DEMO_PRODUCTS,
  DEMO_STOCK,
  DEMO_VARIANT_IDS,
  DEMO_VARIANTS,
  type DemoMedia,
  type DemoProduct,
  type DemoStock,
  type DemoVariant,
} from "./demo-data";

export type DemoTransaction<T> = T;

type ProductIdentity = Pick<DemoProduct, "id" | "slug">;
type VariantIdentity = Pick<DemoVariant, "id" | "productId" | "sku">;
type MediaIdentity = Pick<DemoMedia, "id" | "productId">;
type CandidateOrderItem = { orderId: string; variantId: string };

export type DemoFixtures = {
  products: readonly DemoProduct[];
  variants: readonly DemoVariant[];
  media: readonly DemoMedia[];
  stock: readonly DemoStock[];
};

export type DemoRepositoryProtocol<TTransaction> = {
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
  readMediaIdentities(transaction: TTransaction, ids: readonly string[]): Promise<MediaIdentity[]>;
  insertProductsIfMissing(transaction: TTransaction, rows: readonly DemoProduct[]): Promise<void>;
  insertVariantsIfMissing(transaction: TTransaction, rows: readonly DemoVariant[]): Promise<void>;
  insertMediaIfMissing(transaction: TTransaction, rows: readonly DemoMedia[]): Promise<void>;
  insertInventoryIfMissing(transaction: TTransaction, rows: readonly DemoStock[]): Promise<void>;
  lockDemoRows(
    transaction: TTransaction,
    productIds: readonly string[],
    variantIds: readonly string[],
  ): Promise<void>;
  readCandidateOrderItems(
    transaction: TTransaction,
    demoVariantIds: readonly string[],
  ): Promise<CandidateOrderItem[]>;
  deleteOrderStatusHistory(transaction: TTransaction, orderIds: readonly string[]): Promise<void>;
  deleteOrderItems(transaction: TTransaction, orderIds: readonly string[]): Promise<void>;
  deleteOrders(transaction: TTransaction, orderIds: readonly string[]): Promise<void>;
  reconcileFixtures(transaction: TTransaction, fixtures: DemoFixtures): Promise<void>;
};

export type DemoServiceDependencies<TTransaction> = {
  withTransaction<T>(work: (transaction: TTransaction) => Promise<T>): Promise<T>;
  repository: DemoRepositoryProtocol<TTransaction>;
};

const FIXTURES: DemoFixtures = {
  products: DEMO_PRODUCTS,
  variants: DEMO_VARIANTS,
  media: DEMO_MEDIA,
  stock: DEMO_STOCK,
};

function identityConflict(kind: string, value: string): never {
  throw new Error(`Demo identity conflict for ${kind} ${value}.`);
}

async function verifyOwnership<TTransaction>(
  transaction: TTransaction,
  repository: DemoRepositoryProtocol<TTransaction>,
): Promise<void> {
  const [products, variants, media] = await Promise.all([
    repository.readProductIdentities(
      transaction,
      DEMO_PRODUCTS.map((row) => row.id),
      DEMO_PRODUCTS.map((row) => row.slug),
    ),
    repository.readVariantIdentities(
      transaction,
      DEMO_VARIANTS.map((row) => row.id),
      DEMO_VARIANTS.map((row) => row.sku),
    ),
    repository.readMediaIdentities(transaction, DEMO_MEDIA.map((row) => row.id)),
  ]);

  for (const row of products) {
    const expected = DEMO_PRODUCTS.find((item) => item.id === row.id || item.slug === row.slug);
    if (!expected || expected.id !== row.id || expected.slug !== row.slug) {
      identityConflict("product", row.slug);
    }
  }
  for (const row of variants) {
    const expected = DEMO_VARIANTS.find((item) => item.id === row.id || item.sku === row.sku);
    if (
      !expected || expected.id !== row.id || expected.sku !== row.sku ||
      expected.productId !== row.productId
    ) {
      identityConflict("variant", row.sku);
    }
  }
  for (const row of media) {
    const expected = DEMO_MEDIA.find((item) => item.id === row.id);
    if (!expected || expected.productId !== row.productId) identityConflict("media", row.id);
  }
}

export function createDemoService<TTransaction>(dependencies: DemoServiceDependencies<TTransaction>) {
  const { repository } = dependencies;

  return {
    async seed(): Promise<void> {
      await dependencies.withTransaction(async (transaction) => {
        await verifyOwnership(transaction, repository);
        await repository.insertProductsIfMissing(transaction, DEMO_PRODUCTS);
        await repository.insertVariantsIfMissing(transaction, DEMO_VARIANTS);
        await repository.insertMediaIfMissing(transaction, DEMO_MEDIA);
        await repository.insertInventoryIfMissing(transaction, DEMO_STOCK);
        await verifyOwnership(transaction, repository);
      });
    },

    async reset(): Promise<void> {
      await dependencies.withTransaction(async (transaction) => {
        await verifyOwnership(transaction, repository);
        await repository.lockDemoRows(
          transaction,
          DEMO_PRODUCTS.map((row) => row.id),
          DEMO_VARIANT_IDS,
        );
        await verifyOwnership(transaction, repository);
        const items = await repository.readCandidateOrderItems(transaction, DEMO_VARIANT_IDS);
        const demoIds = new Set<string>(DEMO_VARIANT_IDS);
        if (items.some((item) => !demoIds.has(item.variantId))) {
          throw new Error("Mixed demo/non-demo order detected; reset aborted.");
        }

        const orderIds = [...new Set(items.map((item) => item.orderId))].sort();
        if (orderIds.length > 0) {
          await repository.deleteOrderStatusHistory(transaction, orderIds);
          await repository.deleteOrderItems(transaction, orderIds);
          await repository.deleteOrders(transaction, orderIds);
        }
        await repository.reconcileFixtures(transaction, FIXTURES);
      });
    },
  };
}
