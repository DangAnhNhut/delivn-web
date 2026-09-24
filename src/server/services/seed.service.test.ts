import { describe, expect, it } from "vitest";

import {
  loadDevelopmentSeedTemplate,
  type DevelopmentSeedTemplate,
} from "@/server/db/seed-data";
import { SeedIdentityConflictError } from "@/server/errors/commerce-error";

import { createSeedService, type SeedServiceDependencies } from "./seed.service";

const ENV = {
  DELIVN_SEED_ESPRESSO_250_SKU: "ESP-250",
  DELIVN_SEED_ESPRESSO_250_PRICE_VND: "100000",
  DELIVN_SEED_ESPRESSO_250_STOCK: "8",
  DELIVN_SEED_ESPRESSO_500_SKU: "ESP-500",
  DELIVN_SEED_ESPRESSO_500_PRICE_VND: "180000",
  DELIVN_SEED_ESPRESSO_500_STOCK: "5",
  DELIVN_SEED_RANG_XAY_250_SKU: "RX-250",
  DELIVN_SEED_RANG_XAY_250_PRICE_VND: "90000",
  DELIVN_SEED_RANG_XAY_250_STOCK: "7",
  DELIVN_SEED_RANG_XAY_500_SKU: "RX-500",
  DELIVN_SEED_RANG_XAY_500_PRICE_VND: "160000",
  DELIVN_SEED_RANG_XAY_500_STOCK: "4",
} as const;

type Product = ReturnType<typeof productRow>;
type Variant = ReturnType<typeof variantRow>;
type Media = ReturnType<typeof mediaRow>;
type State = {
  products: Map<string, Product>;
  variants: Map<string, Variant>;
  inventory: Map<string, { variantId: string; quantity: number; reservedQuantity: number }>;
  media: Map<string, Media>;
  events: string[];
};

function productRow(id: string, input: DevelopmentSeedTemplate["products"][number]) {
  return { id, ...input, status: "draft" as "draft" | "active" | "archived", featured: false };
}

function variantRow(
  id: string,
  productId: string,
  input: DevelopmentSeedTemplate["products"][number]["variants"][number],
) {
  return {
    id,
    productId,
    sku: input.sku,
    label: input.label,
    weightGrams: input.weightGrams,
    priceVnd: input.priceVnd,
    compareAtPriceVnd: null as number | null,
    active: false as boolean,
  };
}

function mediaRow(
  input: Omit<NonNullable<DevelopmentSeedTemplate["media"]>[number], "productSlug"> & {
    productId: string;
  },
) {
  return { ...input, type: "image" as const };
}

function clone(state: State): State {
  return structuredClone(state);
}

function createHarness(initial?: Partial<State>) {
  let state: State = {
    products: new Map(),
    variants: new Map(),
    inventory: new Map(),
    media: new Map(),
    events: [],
    ...initial,
  };

  const dependencies: SeedServiceDependencies<State> = {
    async withTransaction(work) {
      const transaction = clone(state);
      const result = await work(transaction);
      state = transaction;
      return result;
    },
    repository: {
      async insertProductIfMissing(tx, input) {
        if (![...tx.products.values()].some((row) => row.slug === input.slug)) {
          tx.products.set(`product-${tx.products.size + 1}`, productRow(`product-${tx.products.size + 1}`, { ...input, variants: [] }));
        }
      },
      async findProductBySlug(tx, slug) {
        return [...tx.products.values()].find((row) => row.slug === slug) ?? null;
      },
      async lockProductsForShare(tx, ids) {
        tx.events.push(`products:${ids.join(",")}`);
        return ids.map((id) => tx.products.get(id)).filter((row): row is Product => Boolean(row));
      },
      async insertVariantIfMissing(tx, input) {
        if (![...tx.variants.values()].some((row) => row.sku === input.sku)) {
          const id = `variant-${tx.variants.size + 1}`;
          tx.variants.set(id, variantRow(id, input.productId, { ...input, stock: 0 }));
        }
      },
      async findVariantBySku(tx, sku) {
        return [...tx.variants.values()].find((row) => row.sku === sku) ?? null;
      },
      async lockVariantsForShare(tx, ids) {
        tx.events.push(`variants:${ids.join(",")}`);
        return ids.map((id) => tx.variants.get(id)).filter((row): row is Variant => Boolean(row));
      },
      async insertInventoryIfMissing(tx, input) {
        if (!tx.inventory.has(input.variantId)) {
          tx.inventory.set(input.variantId, { ...input, reservedQuantity: 0 });
        }
      },
      async insertMediaIfMissing(tx, input) {
        if (!tx.media.has(input.id)) tx.media.set(input.id, mediaRow(input));
      },
      async findMediaById(tx, id) {
        return tx.media.get(id) ?? null;
      },
    },
  };

  return { service: createSeedService(dependencies), state: () => state };
}

describe("development seed input", () => {
  it("rejects missing or invalid numeric input before opening a transaction", () => {
    expect(() => loadDevelopmentSeedTemplate({})).toThrow(/DELIVN_SEED_ESPRESSO_250_SKU/);
    expect(() =>
      loadDevelopmentSeedTemplate({ ...ENV, DELIVN_SEED_ESPRESSO_250_PRICE_VND: "0" }),
    ).toThrow(/PRICE_VND/);
    expect(() =>
      loadDevelopmentSeedTemplate({ ...ENV, DELIVN_SEED_ESPRESSO_250_STOCK: "-1" }),
    ).toThrow(/STOCK/);
  });
});

describe("safe development seed", () => {
  it("inserts draft products, inactive variants, and unreserved inventory in global order", async () => {
    const template = loadDevelopmentSeedTemplate(ENV);
    const harness = createHarness();
    await harness.service.seed(template);

    expect([...harness.state().products.values()]).toHaveLength(2);
    expect([...harness.state().products.values()].every((row) => row.status === "draft")).toBe(true);
    expect([...harness.state().variants.values()]).toHaveLength(4);
    expect([...harness.state().variants.values()].every((row) => !row.active)).toBe(true);
    expect([...harness.state().inventory.values()].every((row) => row.reservedQuantity === 0)).toBe(true);
    expect(harness.state().events.map((event) => event.split(":")[0])).toEqual(["products", "variants"]);
  });

  it("preserves every existing commercial value on rerun", async () => {
    const template = loadDevelopmentSeedTemplate(ENV);
    const harness = createHarness();
    await harness.service.seed(template);
    const firstVariant = [...harness.state().variants.values()][0];
    const firstProduct = harness.state().products.get(firstVariant.productId)!;
    firstProduct.status = "active";
    firstProduct.name = "Operator content";
    firstVariant.active = true;
    firstVariant.priceVnd = 777;
    firstVariant.compareAtPriceVnd = 999;
    harness.state().inventory.set(firstVariant.id, {
      variantId: firstVariant.id,
      quantity: 20,
      reservedQuantity: 11,
    });

    await harness.service.seed(template);
    expect(harness.state().products.get(firstProduct.id)?.name).toBe("Operator content");
    expect(harness.state().products.get(firstProduct.id)?.status).toBe("active");
    expect(harness.state().variants.get(firstVariant.id)).toMatchObject({
      active: true,
      priceVnd: 777,
      compareAtPriceVnd: 999,
    });
    expect(harness.state().inventory.get(firstVariant.id)).toMatchObject({
      quantity: 20,
      reservedQuantity: 11,
    });
  });

  it("rolls back the entire seed on conflicting SKU ownership or weight", async () => {
    const template = loadDevelopmentSeedTemplate(ENV);
    const harness = createHarness();
    await harness.service.seed(template);
    const before = clone(harness.state());
    const conflicting = structuredClone(template);
    conflicting.products[0].variants[0].weightGrams = 251;

    await expect(harness.service.seed(conflicting)).rejects.toBeInstanceOf(SeedIdentityConflictError);
    expect(harness.state()).toEqual(before);
  });

  it("rolls back a conflicting deterministic media identity", async () => {
    const template = loadDevelopmentSeedTemplate(ENV);
    template.media = [{
      id: "11111111-1111-4111-8111-111111111111",
      productSlug: template.products[0].slug,
      url: "/seed/image.png",
      alt: "Seed image",
      sortOrder: 0,
    }];
    const harness = createHarness();
    await harness.service.seed(template);
    const before = clone(harness.state());
    template.media[0].url = "/different.png";

    await expect(harness.service.seed(template)).rejects.toBeInstanceOf(SeedIdentityConflictError);
    expect(harness.state()).toEqual(before);
  });
});
