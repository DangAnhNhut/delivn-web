import { describe, expect, it } from "vitest";

import {
  DEMO_MEDIA,
  DEMO_PRODUCTS,
  DEMO_STOCK,
  DEMO_VARIANTS,
  type DemoMedia,
  type DemoProduct,
  type DemoVariant,
} from "./demo-data";
import {
  createDemoService,
  type DemoRepositoryProtocol,
  type DemoTransaction,
} from "./demo-service";

type State = {
  products: DemoProduct[];
  variants: DemoVariant[];
  media: DemoMedia[];
  inventory: Array<{ variantId: string; quantity: number; reservedQuantity: number }>;
  orders: Array<{ id: string }>;
  items: Array<{ orderId: string; variantId: string }>;
  history: Array<{ orderId: string }>;
  unrelated: string[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function baseline(): State {
  return {
    products: clone([...DEMO_PRODUCTS]),
    variants: clone([...DEMO_VARIANTS]),
    media: clone([...DEMO_MEDIA]),
    inventory: clone([...DEMO_STOCK]),
    orders: [],
    items: [],
    history: [],
    unrelated: [],
  };
}

function harness(initial: State = baseline(), failDuringReset = false) {
  let state = clone(initial);
  const repository: DemoRepositoryProtocol<State> = {
    readProductIdentities(tx) {
      return Promise.resolve(clone(tx.products));
    },
    readVariantIdentities(tx) {
      return Promise.resolve(clone(tx.variants));
    },
    readMediaIdentities(tx) {
      return Promise.resolve(clone(tx.media));
    },
    insertProductsIfMissing(tx, rows) {
      for (const row of rows) if (!tx.products.some((item) => item.id === row.id)) tx.products.push(clone(row));
      return Promise.resolve();
    },
    insertVariantsIfMissing(tx, rows) {
      for (const row of rows) if (!tx.variants.some((item) => item.id === row.id)) tx.variants.push(clone(row));
      return Promise.resolve();
    },
    insertMediaIfMissing(tx, rows) {
      for (const row of rows) if (!tx.media.some((item) => item.id === row.id)) tx.media.push(clone(row));
      return Promise.resolve();
    },
    insertInventoryIfMissing(tx, rows) {
      for (const row of rows) {
        if (!tx.inventory.some((item) => item.variantId === row.variantId)) tx.inventory.push(clone(row));
      }
      return Promise.resolve();
    },
    lockDemoRows() {
      return Promise.resolve();
    },
    readCandidateOrderItems(tx, demoVariantIds) {
      const candidates = new Set(
        tx.items.filter((item) => demoVariantIds.includes(item.variantId)).map((item) => item.orderId),
      );
      return Promise.resolve(clone(tx.items.filter((item) => candidates.has(item.orderId))));
    },
    deleteOrderStatusHistory(tx, orderIds) {
      tx.history = tx.history.filter((row) => !orderIds.includes(row.orderId));
      return Promise.resolve();
    },
    deleteOrderItems(tx, orderIds) {
      tx.items = tx.items.filter((row) => !orderIds.includes(row.orderId));
      return Promise.resolve();
    },
    deleteOrders(tx, orderIds) {
      if (
        tx.history.some((row) => orderIds.includes(row.orderId)) ||
        tx.items.some((row) => orderIds.includes(row.orderId))
      ) {
        throw new Error("FK restrict violation");
      }
      tx.orders = tx.orders.filter((row) => !orderIds.includes(row.id));
      return Promise.resolve();
    },
    reconcileFixtures(tx, fixtures) {
      if (failDuringReset) throw new Error("injected reset failure");
      tx.products = clone([...fixtures.products]);
      tx.variants = clone([...fixtures.variants]);
      tx.media = clone([...fixtures.media]);
      for (const stock of fixtures.stock) {
        const existing = tx.inventory.find((row) => row.variantId === stock.variantId);
        if (existing) Object.assign(existing, stock);
        else tx.inventory.push(clone(stock));
      }
      return Promise.resolve();
    },
  };

  return {
    get state() {
      return state;
    },
    dependencies: {
      repository,
      async withTransaction<T>(work: (transaction: DemoTransaction<State>) => Promise<T>) {
        const working = clone(state);
        const result = await work(working);
        state = working;
        return result;
      },
    },
  };
}

describe("demo service", () => {
  it("seeds missing deterministic fixtures and leaves existing inventory unchanged on rerun", async () => {
    const test = harness({
      products: [], variants: [], media: [], inventory: [], orders: [], items: [], history: [], unrelated: [],
    });
    const service = createDemoService(test.dependencies);

    await service.seed();
    test.state.inventory[0].quantity = 88;
    test.state.inventory[0].reservedQuantity = 7;
    await service.seed();

    expect(test.state.products).toEqual(DEMO_PRODUCTS);
    expect(test.state.variants).toEqual(DEMO_VARIANTS);
    expect(test.state.media).toEqual(DEMO_MEDIA);
    expect(test.state.inventory[0]).toEqual({
      variantId: DEMO_VARIANTS[0].id,
      quantity: 88,
      reservedQuantity: 7,
    });
  });

  it("rejects a reserved slug owned by a foreign product before mutation", async () => {
    const initial = baseline();
    initial.products[0] = { ...initial.products[0], id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" };
    const test = harness(initial);

    await expect(createDemoService(test.dependencies).seed()).rejects.toThrow(/identity/i);
    expect(test.state).toEqual(initial);
  });

  it("rolls back when a reserved identity appears during seed insertion", async () => {
    const initial: State = {
      products: [], variants: [], media: [], inventory: [], orders: [], items: [], history: [], unrelated: [],
    };
    const test = harness(initial);
    test.dependencies.repository.insertProductsIfMissing = async (transaction, rows) => {
      transaction.products.push({ ...rows[0], id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
      transaction.products.push(clone(rows[1]));
    };

    await expect(createDemoService(test.dependencies).seed()).rejects.toThrow(/identity/i);
    expect(test.state).toEqual(initial);
  });

  it.each([
    ["product UUID", (state: State) => { state.products[0] = { ...state.products[0], slug: "foreign-slug" }; }],
    ["variant SKU", (state: State) => { state.variants[0] = { ...state.variants[0], id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }; }],
    ["variant UUID", (state: State) => { state.variants[0] = { ...state.variants[0], sku: "FOREIGN-SKU" }; }],
    ["variant parent", (state: State) => { state.variants[0] = { ...state.variants[0], productId: DEMO_PRODUCTS[1].id }; }],
    ["media parent", (state: State) => { state.media[0] = { ...state.media[0], productId: DEMO_PRODUCTS[1].id }; }],
  ])("rejects a reserved %s identity conflict before mutation", async (_label, mutate) => {
    const initial = baseline();
    mutate(initial);
    const expected = clone(initial);
    const test = harness(initial);

    await expect(createDemoService(test.dependencies).seed()).rejects.toThrow(/identity/i);
    expect(test.state).toEqual(expected);
  });

  it("deletes demo-only orders and restores demo inventory while preserving unrelated data", async () => {
    const initial = baseline();
    initial.inventory[0] = { ...initial.inventory[0], reservedQuantity: 2 };
    initial.inventory.push({ variantId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", quantity: 9, reservedQuantity: 4 });
    initial.orders.push({ id: "demo-order" }, { id: "normal-order" });
    initial.items.push(
      { orderId: "demo-order", variantId: DEMO_VARIANTS[0].id },
      { orderId: "normal-order", variantId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
    );
    initial.history.push({ orderId: "demo-order" }, { orderId: "normal-order" });
    initial.unrelated.push("preserve-me");
    const test = harness(initial);

    await createDemoService(test.dependencies).reset();

    expect(test.state.orders).toEqual([{ id: "normal-order" }]);
    expect(test.state.items).toEqual([
      { orderId: "normal-order", variantId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
    ]);
    expect(test.state.history).toEqual([{ orderId: "normal-order" }]);
    expect(test.state.inventory.slice(0, 4)).toEqual(DEMO_STOCK);
    expect(test.state.inventory[4]).toEqual({
      variantId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      quantity: 9,
      reservedQuantity: 4,
    });
    expect(test.state.unrelated).toEqual(["preserve-me"]);
  });

  it("locks demo products, variants, and inventory before discovering candidate orders", async () => {
    const test = harness();
    const events: string[] = [];
    const repository = test.dependencies.repository as typeof test.dependencies.repository & {
      lockDemoRows(transaction: State, productIds: readonly string[], variantIds: readonly string[]): Promise<void>;
    };
    repository.lockDemoRows = async () => { events.push("lock"); };
    const readCandidates = repository.readCandidateOrderItems;
    repository.readCandidateOrderItems = async (...args) => {
      events.push("discover-orders");
      return readCandidates(...args);
    };

    await createDemoService(test.dependencies).reset();

    expect(events).toEqual(["lock", "discover-orders"]);
  });

  it("rolls back when a missing deterministic identity appears after preflight", async () => {
    const initial = baseline();
    initial.media.shift();
    const expected = clone(initial);
    const test = harness(initial);
    test.dependencies.repository.lockDemoRows = async (transaction) => {
      transaction.media.push({
        ...DEMO_MEDIA[0],
        productId: DEMO_PRODUCTS[1].id,
      });
    };

    await expect(createDemoService(test.dependencies).reset()).rejects.toThrow(/identity/i);
    expect(test.state).toEqual(expected);
  });

  it("never deletes a mixed demo and non-demo order or clears its reservation", async () => {
    const initial = baseline();
    initial.inventory[0] = { ...initial.inventory[0], reservedQuantity: 1 };
    initial.orders.push({ id: "mixed-order" });
    initial.items.push(
      { orderId: "mixed-order", variantId: DEMO_VARIANTS[0].id },
      { orderId: "mixed-order", variantId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
    );
    initial.history.push({ orderId: "mixed-order" });
    const test = harness(initial);

    await expect(createDemoService(test.dependencies).reset()).rejects.toThrow(/mixed/i);
    expect(test.state).toEqual(initial);
  });

  it("rolls back order deletion when fixture reconciliation fails", async () => {
    const initial = baseline();
    initial.inventory[0] = { ...initial.inventory[0], reservedQuantity: 1 };
    initial.orders.push({ id: "demo-order" });
    initial.items.push({ orderId: "demo-order", variantId: DEMO_VARIANTS[0].id });
    initial.history.push({ orderId: "demo-order" });
    const test = harness(initial, true);

    await expect(createDemoService(test.dependencies).reset()).rejects.toThrow("injected reset failure");
    expect(test.state).toEqual(initial);
  });
});
