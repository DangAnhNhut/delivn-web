import type { OrderDTO } from "@/contracts";
import { withTransaction, type DbTransaction } from "@/server/db";
import {
  InsufficientInventoryError,
  ItemUnavailableError,
} from "@/server/errors/commerce-error";
import {
  createInventoryRepository,
  type InventoryReservation,
  type LockedInventory,
} from "@/server/repositories/inventory.repository";
import {
  createOrderRepository,
  type NewOrder,
  type NewOrderItem,
  type OrderRecord,
} from "@/server/repositories/order.repository";
import {
  createProductRepository,
  type LockedProduct,
  type LockedVariant,
  type VariantRelationship,
} from "@/server/repositories/product.repository";
import { assertSortedUniqueIds } from "@/server/repositories/types";
import { checkedAddVnd, checkedMultiplyVnd } from "@/server/utils/money";
import { formatOrderNumber } from "@/server/utils/order-number";
import type { NormalizedCheckoutInput } from "@/server/validation/checkout-normalization";

import { mapOrderToDto } from "./order.service";
import { calculateShippingFeeVnd, type ShippingQuoteInput } from "./shipping.service";

type ProductCheckoutRepository<TTransaction> = {
  discoverVariantRelationships(
    transaction: TTransaction,
    variantIds: readonly string[],
  ): Promise<VariantRelationship[]>;
  lockProductsForShare(
    transaction: TTransaction,
    productIds: readonly string[],
  ): Promise<LockedProduct[]>;
  lockVariantsForShare(
    transaction: TTransaction,
    variantIds: readonly string[],
  ): Promise<LockedVariant[]>;
};

type InventoryCheckoutRepository<TTransaction> = {
  lockInventoryForUpdate(
    transaction: TTransaction,
    variantIds: readonly string[],
  ): Promise<LockedInventory[]>;
  reserveInventory(
    transaction: TTransaction,
    reservations: readonly InventoryReservation[],
  ): Promise<void>;
};

type OrderCheckoutRepository<TTransaction> = {
  getNextOrderNumberParts(
    transaction: TTransaction,
  ): Promise<{ createdAt: Date; sequenceValue: string }>;
  insertOrder(transaction: TTransaction, order: NewOrder): Promise<OrderRecord>;
  insertOrderItems(transaction: TTransaction, items: readonly NewOrderItem[]): Promise<void>;
  insertInitialStatus(transaction: TTransaction, orderId: string): Promise<void>;
};

export type CheckoutDependencies<TTransaction> = {
  withTransaction<T>(work: (transaction: TTransaction) => Promise<T>): Promise<T>;
  productRepository: ProductCheckoutRepository<TTransaction>;
  inventoryRepository: InventoryCheckoutRepository<TTransaction>;
  orderRepository: OrderCheckoutRepository<TTransaction>;
  calculateShippingFeeVnd(input: ShippingQuoteInput): number;
};

function productionDependencies(): CheckoutDependencies<DbTransaction> {
  return {
    withTransaction,
    productRepository: createProductRepository(),
    inventoryRepository: createInventoryRepository(),
    orderRepository: createOrderRepository(),
    calculateShippingFeeVnd,
  };
}

function requireCompleteSet<T extends { id?: string; variantId?: string }>(
  rows: readonly T[],
  expectedIds: readonly string[],
): void {
  const actualIds = rows.map((row) => row.id ?? row.variantId).sort();
  if (actualIds.length !== expectedIds.length || actualIds.some((id, index) => id !== expectedIds[index])) {
    throw new ItemUnavailableError();
  }
}

export function createCheckoutService<TTransaction = DbTransaction>(
  dependencies?: CheckoutDependencies<TTransaction>,
) {
  const deps =
    dependencies ??
    (productionDependencies() as unknown as CheckoutDependencies<TTransaction>);

  return {
    async createOrder(input: NormalizedCheckoutInput): Promise<OrderDTO> {
      const variantIds = input.items.map((item) => item.variantId);
      assertSortedUniqueIds(variantIds);

      return deps.withTransaction(async (transaction) => {
        const relationships = await deps.productRepository.discoverVariantRelationships(
          transaction,
          variantIds,
        );
        requireCompleteSet(
          relationships.map((row) => ({ id: row.variantId })),
          variantIds,
        );

        const discoveredProductByVariant = new Map(
          relationships.map((row) => [row.variantId, row.productId]),
        );
        const productIds = [...new Set(relationships.map((row) => row.productId))].sort();
        assertSortedUniqueIds(productIds);

        const lockedProducts = await deps.productRepository.lockProductsForShare(
          transaction,
          productIds,
        );
        requireCompleteSet(lockedProducts, productIds);

        const lockedVariants = await deps.productRepository.lockVariantsForShare(
          transaction,
          variantIds,
        );
        requireCompleteSet(lockedVariants, variantIds);

        const productById = new Map(lockedProducts.map((product) => [product.id, product]));
        const variantById = new Map(lockedVariants.map((variant) => [variant.id, variant]));

        for (const variantId of variantIds) {
          const variant = variantById.get(variantId);
          const discoveredProductId = discoveredProductByVariant.get(variantId);
          if (
            !variant ||
            !discoveredProductId ||
            variant.productId !== discoveredProductId ||
            !productById.has(variant.productId)
          ) {
            throw new ItemUnavailableError();
          }
        }

        if (
          lockedProducts.some((product) => product.status !== "active") ||
          lockedVariants.some((variant) => !variant.active)
        ) {
          throw new ItemUnavailableError();
        }

        const lockedInventory = await deps.inventoryRepository.lockInventoryForUpdate(
          transaction,
          variantIds,
        );
        requireCompleteSet(lockedInventory, variantIds);
        const inventoryByVariant = new Map(
          lockedInventory.map((row) => [row.variantId, row]),
        );

        let subtotalVnd = 0;
        const pendingItems = input.items.map((item) => {
          const variant = variantById.get(item.variantId);
          const stock = inventoryByVariant.get(item.variantId);
          if (!variant || !stock) {
            throw new ItemUnavailableError();
          }
          if (stock.quantity - stock.reservedQuantity < item.quantity) {
            throw new InsufficientInventoryError();
          }
          const product = productById.get(variant.productId);
          if (!product) {
            throw new ItemUnavailableError();
          }
          const lineTotalVnd = checkedMultiplyVnd(variant.priceVnd, item.quantity);
          subtotalVnd = checkedAddVnd(subtotalVnd, lineTotalVnd);
          return {
            productId: product.id,
            variantId: variant.id,
            productNameSnapshot: product.name,
            variantNameSnapshot: variant.label,
            skuSnapshot: variant.sku,
            unitPriceVndSnapshot: variant.priceVnd,
            quantity: item.quantity,
            lineTotalVnd,
          };
        });

        const shippingFeeVnd = deps.calculateShippingFeeVnd({
          subtotalVnd,
          address: input.customer.address,
        });
        const totalVnd = checkedAddVnd(subtotalVnd, shippingFeeVnd);
        const { createdAt, sequenceValue } = await deps.orderRepository.getNextOrderNumberParts(
          transaction,
        );
        const orderNumber = formatOrderNumber(createdAt, sequenceValue);
        const paymentStatus = input.paymentMethod === "bank_transfer" ? "pending" : "unpaid";

        const order = await deps.orderRepository.insertOrder(transaction, {
          orderNumber,
          customerName: input.customer.name,
          phone: input.customer.phone,
          email: input.customer.email ?? null,
          address: input.customer.address,
          note: input.customer.note ?? null,
          subtotalVnd,
          shippingFeeVnd,
          totalVnd,
          paymentMethod: input.paymentMethod,
          paymentStatus,
          orderStatus: "pending",
          createdAt,
          updatedAt: createdAt,
        });

        const orderItems = pendingItems.map((item) => ({ ...item, orderId: order.id }));
        await deps.orderRepository.insertOrderItems(transaction, orderItems);
        await deps.inventoryRepository.reserveInventory(transaction, input.items);
        await deps.orderRepository.insertInitialStatus(transaction, order.id);

        return mapOrderToDto(order);
      });
    },
  };
}
