import { describe, expect, it } from "vitest";

import {
  DEV_MEDIA,
  DEV_PRODUCTS,
  DEV_STOCK,
  DEV_VARIANTS,
  type DevMedia,
  type DevProduct,
  type DevVariant,
} from "./dev-product-data";
import {
  createDevProductService,
  DevProductIdentityConflictError,
  type DevProductRepositoryProtocol,
} from "./dev-product-service";

type InventoryRow = { variantId: string; quantity: number; reservedQuantity: number };
type State = {
  products: DevProduct[];
  variants: DevVariant[];
  media: DevMedia[];
  inventory: InventoryRow[];
  unrelated: { marker: string }[];
  events: string[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function emptyState(): State {
  return { products: [], variants: [], media: [], inventory: [], unrelated: [], events: [] };
}

function createHarness(initial: State = emptyState(), failAt?: string) {
  let state = clone(initial);

  const repository: DevProductRepositoryProtocol<State> = {
    async readProductIdentities(tx, ids, slugs) {
      return tx.products
        .filter((row) => ids.includes(row.id) || slugs.includes(row.slug))
        .map(({ id, slug }) => ({ id, slug }));
    },
    async readVariantIdentities(tx, ids, skus) {
      return tx.variants
        .filter((row) => ids.includes(row.id) || skus.includes(row.sku))
        .map(({ id, productId, sku }) => ({ id, productId, sku }));
    },
    async readMediaIdentities(tx, ids) {
      return tx.media
        .filter((row) => ids.includes(row.id))
        .map(({ id, productId }) => ({ id, productId }));
    },
    async insertProductsIfMissing(tx, rows) {
      tx.events.push("insert:products");
      for (const row of rows) if (!tx.products.some((item) => item.id === row.id)) tx.products.push(clone(row));
    },
    async insertVariantsIfMissing(tx, rows) {
      tx.events.push("insert:variants");
      for (const row of rows) if (!tx.variants.some((item) => item.id === row.id)) tx.variants.push(clone(row));
    },
    async insertMediaIfMissing(tx, rows) {
      tx.events.push("insert:media");
      for (const row of rows) if (!tx.media.some((item) => item.id === row.id)) tx.media.push(clone(row));
    },
    async insertInventoryIfMissing(tx, rows) {
      tx.events.push("insert:inventory");
      for (const row of rows) {
        if (!tx.inventory.some((item) => item.variantId === row.variantId)) tx.inventory.push(clone(row));
      }
    },
    async lockProducts(tx, ids) {
      tx.events.push(`lock:products:${ids.join(",")}`);
    },
    async lockVariants(tx, ids) {
      tx.events.push(`lock:variants:${ids.join(",")}`);
    },
    async restoreProducts(tx, rows) {
      tx.events.push("restore:products");
      for (const row of rows) {
        const index = tx.products.findIndex((item) => item.id === row.id);
        tx.products[index] = clone(row);
      }
    },
    async restoreVariants(tx, rows) {
      tx.events.push("restore:variants");
      if (failAt === "restore:variants") throw new Error("injected write failure");
      for (const row of rows) {
        const index = tx.variants.findIndex((item) => item.id === row.id);
        tx.variants[index] = clone(row);
      }
    },
    async restoreMedia(tx, rows) {
      tx.events.push("restore:media");
      for (const row of rows) {
        const index = tx.media.findIndex((item) => item.id === row.id);
        tx.media[index] = clone(row);
      }
    },
  };

  const service = createDevProductService({
    repository,
    async withTransaction(work) {
      const transaction = clone(state);
      const result = await work(transaction);
      state = transaction;
      return result;
    },
  });

  return { service, state: () => state, repository };
}

describe("persistent development product seed service", () => {
  it("inserts missing active fixtures and baseline inventory in the approved order", async () => {
    const harness = createHarness();

    await harness.service.seed();

    expect(harness.state().products).toEqual(DEV_PRODUCTS);
    expect(harness.state().variants).toEqual(DEV_VARIANTS);
    expect(harness.state().media).toEqual(DEV_MEDIA);
    expect(harness.state().inventory).toEqual(DEV_STOCK);
    expect(harness.state().events.map((event) => event.split(":").slice(0, 2).join(":"))).toEqual([
      "insert:products",
      "insert:variants",
      "insert:media",
      "insert:inventory",
      "lock:products",
      "lock:variants",
      "restore:products",
      "restore:variants",
      "restore:media",
    ]);
  });

  it("restores owned fields and prices while preserving existing inventory and unrelated rows", async () => {
    const initial: State = {
      products: DEV_PRODUCTS.map((row) => clone(row)),
      variants: DEV_VARIANTS.map((row) => clone(row)),
      media: DEV_MEDIA.map((row) => clone(row)),
      inventory: DEV_STOCK.map((row) => clone(row)),
      unrelated: [{ marker: "leave me" }],
      events: [],
    };
    initial.products[0] = {
      ...initial.products[0]!,
      slug: "stale-local-slug",
      name: "Stale name",
      status: "draft",
      featured: true as false,
    };
    initial.variants[0] = {
      ...initial.variants[0]!,
      sku: "STALE-LOCAL-SKU",
      priceVnd: 1,
      active: false as true,
    };
    initial.media[0] = { ...initial.media[0]!, url: "/stale.png", alt: "Stale", sortOrder: 9 };
    initial.inventory[0] = { ...initial.inventory[0]!, quantity: 87, reservedQuantity: 6 };
    const harness = createHarness(initial);

    await harness.service.seed();

    expect(harness.state().products).toEqual(DEV_PRODUCTS);
    expect(harness.state().variants).toEqual(DEV_VARIANTS);
    expect(harness.state().media).toEqual(DEV_MEDIA);
    expect(harness.state().inventory[0]).toEqual({
      variantId: DEV_VARIANTS[0].id,
      quantity: 87,
      reservedQuantity: 6,
    });
    expect(harness.state().unrelated).toEqual([{ marker: "leave me" }]);
  });

  it.each([
    [
      "reserved product slug on a different ID",
      (state: State) =>
        state.products.push({ ...clone(DEV_PRODUCTS[0]), id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }),
    ],
    [
      "reserved variant SKU on a different ID",
      (state: State) =>
        state.variants.push({ ...clone(DEV_VARIANTS[0]), id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }),
    ],
    [
      "owned variant with the wrong parent",
      (state: State) =>
        state.variants.push({ ...clone(DEV_VARIANTS[0]), productId: DEV_PRODUCTS[1].id }),
    ],
    [
      "owned media with the wrong parent",
      (state: State) => state.media.push({ ...clone(DEV_MEDIA[0]), productId: DEV_PRODUCTS[1].id }),
    ],
  ])("aborts before mutation for %s", async (_label, arrange) => {
    const initial = emptyState();
    arrange(initial);
    const before = clone(initial);
    const harness = createHarness(initial);

    await expect(harness.service.seed()).rejects.toBeInstanceOf(DevProductIdentityConflictError);
    expect(harness.state()).toEqual(before);
  });

  it("rolls back all writes when an injected write fails", async () => {
    const initial = emptyState();
    const harness = createHarness(initial, "restore:variants");

    await expect(harness.service.seed()).rejects.toThrow("injected write failure");
    expect(harness.state()).toEqual(initial);
  });

  it("has no order, delete, or reset operation in the seed repository protocol", () => {
    const keys = Object.keys(createHarness().repository);
    expect(keys.some((key) => /order|delete|reset/i.test(key))).toBe(false);
  });
});
