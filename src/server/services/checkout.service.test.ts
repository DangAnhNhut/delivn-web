import { describe, expect, it } from "vitest";

import type { NormalizedCheckoutInput } from "@/server/validation/checkout-normalization";
import { InsufficientInventoryError, ItemUnavailableError, MoneyLimitError } from "@/server/errors/commerce-error";

import {
  createCheckoutService,
  type CheckoutDependencies,
} from "./checkout.service";

type FakeProduct = { id: string; name: string; status: "draft" | "active" | "archived" };
type FakeVariant = {
  id: string;
  productId: string;
  label: string;
  sku: string;
  active: boolean;
  priceVnd: number;
};
type FakeInventory = { variantId: string; quantity: number; reservedQuantity: number };
type FakeState = {
  products: FakeProduct[];
  relationships: Array<{ variantId: string; productId: string }>;
  variants: FakeVariant[];
  inventory: FakeInventory[];
  orders: Array<Record<string, unknown>>;
  items: Array<Record<string, unknown>>;
  history: Array<Record<string, unknown>>;
};
type FakeTransaction = { state: FakeState; log: string[] };

const PRODUCT_A = "00000000-0000-4000-8000-000000000010";
const PRODUCT_B = "00000000-0000-4000-8000-000000000020";
const VARIANT_A = "00000000-0000-4000-8000-000000000001";
const VARIANT_B = "00000000-0000-4000-8000-000000000002";
const ORDER_ID = "00000000-0000-4000-8000-000000000099";

const input: NormalizedCheckoutInput = {
  customer: {
    name: "Nguyễn Văn A",
    phone: "0912345678",
    email: "customer@example.com",
    address: "123 Đường Cà Phê",
    note: "Giao buổi sáng",
  },
  paymentMethod: "cod",
  items: [
    { variantId: VARIANT_A, quantity: 2 },
    { variantId: VARIANT_B, quantity: 1 },
  ],
};

function initialState(): FakeState {
  return {
    products: [
      { id: PRODUCT_B, name: "Product B", status: "active" },
      { id: PRODUCT_A, name: "Product A", status: "active" },
    ],
    relationships: [
      { variantId: VARIANT_B, productId: PRODUCT_B },
      { variantId: VARIANT_A, productId: PRODUCT_A },
    ],
    variants: [
      {
        id: VARIANT_B,
        productId: PRODUCT_B,
        label: "500g",
        sku: "B-500",
        active: true,
        priceVnd: 220_000,
      },
      {
        id: VARIANT_A,
        productId: PRODUCT_A,
        label: "250g",
        sku: "A-250",
        active: true,
        priceVnd: 125_000,
      },
    ],
    inventory: [
      { variantId: VARIANT_B, quantity: 5, reservedQuantity: 0 },
      { variantId: VARIANT_A, quantity: 5, reservedQuantity: 1 },
    ],
    orders: [],
    items: [],
    history: [],
  };
}

function createHarness(options?: {
  state?: FakeState;
  failAt?: "order" | "items" | "reservation" | "history";
  shippingFeeVnd?: number;
}) {
  let committed = structuredClone(options?.state ?? initialState());
  const transactionLogs: string[][] = [];

  const dependencies: CheckoutDependencies<FakeTransaction> = {
    async withTransaction(work) {
      const transaction: FakeTransaction = { state: structuredClone(committed), log: [] };
      transactionLogs.push(transaction.log);
      const result = await work(transaction);
      committed = transaction.state;
      return result;
    },
    productRepository: {
      async discoverVariantRelationships(transaction, variantIds) {
        transaction.log.push(`discovery:${variantIds.join(",")}`);
        return transaction.state.relationships.filter((row) => variantIds.includes(row.variantId));
      },
      async lockProductsForShare(transaction, productIds) {
        transaction.log.push(`products:share:${productIds.join(",")}`);
        return transaction.state.products.filter((row) => productIds.includes(row.id));
      },
      async lockVariantsForShare(transaction, variantIds) {
        transaction.log.push(`variants:share:${variantIds.join(",")}`);
        return transaction.state.variants.filter((row) => variantIds.includes(row.id));
      },
    },
    inventoryRepository: {
      async lockInventoryForUpdate(transaction, variantIds) {
        transaction.log.push(`inventory:update:${variantIds.join(",")}`);
        return transaction.state.inventory.filter((row) => variantIds.includes(row.variantId));
      },
      async reserveInventory(transaction, reservations) {
        if (options?.failAt === "reservation") throw new Error("reservation failure");
        for (const reservation of reservations) {
          const row = transaction.state.inventory.find(
            (item) => item.variantId === reservation.variantId,
          );
          if (!row) throw new Error("missing inventory");
          row.reservedQuantity += reservation.quantity;
        }
      },
    },
    orderRepository: {
      async getNextOrderNumberParts() {
        return { createdAt: new Date("2026-09-23T09:00:00.000Z"), sequenceValue: "41" };
      },
      async insertOrder(transaction, order) {
        if (options?.failAt === "order") throw new Error("order failure");
        const record = { id: ORDER_ID, ...order };
        transaction.state.orders.push(record);
        return {
          id: ORDER_ID,
          orderNumber: order.orderNumber,
          totalVnd: order.totalVnd,
          paymentMethod: order.paymentMethod,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt,
        };
      },
      async insertOrderItems(transaction, items) {
        if (options?.failAt === "items") throw new Error("items failure");
        transaction.state.items.push(...items);
      },
      async insertInitialStatus(transaction, orderId) {
        if (options?.failAt === "history") throw new Error("history failure");
        transaction.state.history.push({ orderId, fromStatus: null, toStatus: "pending" });
      },
    },
    calculateShippingFeeVnd: () => options?.shippingFeeVnd ?? 0,
  };

  return {
    service: createCheckoutService(dependencies),
    getState: () => committed,
    getLogs: () => transactionLogs,
  };
}

describe("checkout service", () => {
  it("uses locked server prices, snapshots lines, reserves stock, and returns OrderDTO", async () => {
    const harness = createHarness();
    const result = await harness.service.createOrder(input);

    expect(result).toEqual({
      id: ORDER_ID,
      orderNumber: "DLV-20260923-000041",
      totalVnd: 470_000,
      paymentMethod: "cod",
      orderStatus: "pending",
      paymentStatus: "unpaid",
      createdAt: "2026-09-23T09:00:00.000Z",
    });
    expect(harness.getState().items).toEqual([
      expect.objectContaining({
        productId: PRODUCT_A,
        variantId: VARIANT_A,
        productNameSnapshot: "Product A",
        variantNameSnapshot: "250g",
        skuSnapshot: "A-250",
        unitPriceVndSnapshot: 125_000,
        quantity: 2,
        lineTotalVnd: 250_000,
      }),
      expect.objectContaining({
        productId: PRODUCT_B,
        variantId: VARIANT_B,
        unitPriceVndSnapshot: 220_000,
        quantity: 1,
        lineTotalVnd: 220_000,
      }),
    ]);
    expect(harness.getState().inventory.map((row) => row.reservedQuantity)).toEqual([1, 3]);
    expect(harness.getState().history).toEqual([
      { orderId: ORDER_ID, fromStatus: null, toStatus: "pending" },
    ]);
  });

  it("starts bank-transfer checkout in pending payment state", async () => {
    const harness = createHarness();
    const result = await harness.service.createOrder({ ...input, paymentMethod: "bank_transfer" });

    expect(result).toMatchObject({
      paymentMethod: "bank_transfer",
      paymentStatus: "pending",
      orderStatus: "pending",
    });
  });

  it("locks each table in the global order with ascending IDs", async () => {
    const harness = createHarness();
    await harness.service.createOrder(input);
    expect(harness.getLogs()[0]).toEqual([
      `discovery:${VARIANT_A},${VARIANT_B}`,
      `products:share:${PRODUCT_A},${PRODUCT_B}`,
      `variants:share:${VARIANT_A},${VARIANT_B}`,
      `inventory:update:${VARIANT_A},${VARIANT_B}`,
    ]);
  });

  it("rejects stale discovery without a late product or inventory lock", async () => {
    const state = initialState();
    state.variants.find((variant) => variant.id === VARIANT_A)!.productId = PRODUCT_B;
    const harness = createHarness({ state });

    await expect(harness.service.createOrder(input)).rejects.toBeInstanceOf(ItemUnavailableError);
    expect(harness.getLogs()[0]).toEqual([
      `discovery:${VARIANT_A},${VARIANT_B}`,
      `products:share:${PRODUCT_A},${PRODUCT_B}`,
      `variants:share:${VARIANT_A},${VARIANT_B}`,
    ]);
    expect(harness.getState().orders).toEqual([]);
  });

  it.each([
    ["inactive product", (state: FakeState) => (state.products[0].status = "draft"), ItemUnavailableError],
    ["inactive variant", (state: FakeState) => (state.variants[0].active = false), ItemUnavailableError],
    ["missing inventory", (state: FakeState) => state.inventory.pop(), ItemUnavailableError],
    [
      "insufficient inventory",
      (state: FakeState) => (state.inventory.find((row) => row.variantId === VARIANT_A)!.reservedQuantity = 4),
      InsufficientInventoryError,
    ],
  ])("rejects %s without writes", async (_label, mutate, ErrorType) => {
    const state = initialState();
    mutate(state);
    const harness = createHarness({ state });
    await expect(harness.service.createOrder(input)).rejects.toBeInstanceOf(ErrorType);
    expect(harness.getState().orders).toEqual([]);
  });

  it.each(["order", "items", "reservation", "history"] as const)(
    "rolls back when %s writing fails",
    async (failAt) => {
      const harness = createHarness({ failAt });
      const before = structuredClone(harness.getState());
      await expect(harness.service.createOrder(input)).rejects.toThrow(`${failAt} failure`);
      expect(harness.getState()).toEqual(before);
    },
  );

  it("accepts a total exactly at the PostgreSQL integer maximum", async () => {
    const state = initialState();
    state.variants = [
      { ...state.variants[0], id: VARIANT_A, productId: PRODUCT_A, priceVnd: 2_147_483_647 },
    ];
    state.relationships = [{ variantId: VARIANT_A, productId: PRODUCT_A }];
    state.inventory = [{ variantId: VARIANT_A, quantity: 1, reservedQuantity: 0 }];
    const harness = createHarness({ state });
    const oneItem = { ...input, items: [{ variantId: VARIANT_A, quantity: 1 }] };
    await expect(harness.service.createOrder(oneItem)).resolves.toMatchObject({
      totalVnd: 2_147_483_647,
    });
  });

  it("rejects multiplication overflow before inserting an order", async () => {
    const state = initialState();
    state.variants.find((variant) => variant.id === VARIANT_A)!.priceVnd = 1_073_741_824;
    const harness = createHarness({ state });
    await expect(harness.service.createOrder(input)).rejects.toBeInstanceOf(MoneyLimitError);
    expect(harness.getState().orders).toEqual([]);
  });

  it("rejects subtotal accumulation overflow before inserting an order", async () => {
    const state = initialState();
    state.variants.find((variant) => variant.id === VARIANT_A)!.priceVnd = 750_000_000;
    state.variants.find((variant) => variant.id === VARIANT_B)!.priceVnd = 1_000_000_000;
    const harness = createHarness({ state });
    await expect(harness.service.createOrder(input)).rejects.toBeInstanceOf(MoneyLimitError);
    expect(harness.getState().orders).toEqual([]);
  });

  it("rejects subtotal plus shipping overflow before inserting an order", async () => {
    const state = initialState();
    state.variants.find((variant) => variant.id === VARIANT_A)!.priceVnd = 2_147_483_647;
    const harness = createHarness({ state, shippingFeeVnd: 1 });
    const oneItem = { ...input, items: [{ variantId: VARIANT_A, quantity: 1 }] };
    await expect(harness.service.createOrder(oneItem)).rejects.toBeInstanceOf(MoneyLimitError);
    expect(harness.getState().orders).toEqual([]);
  });
});
