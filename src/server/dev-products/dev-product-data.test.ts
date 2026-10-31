import { describe, expect, it } from "vitest";

import { DEMO_PRODUCTS, DEMO_VARIANTS } from "@/server/demo/demo-data";

import { DEV_MEDIA, DEV_PRODUCTS, DEV_STOCK, DEV_VARIANTS } from "./dev-product-data";

describe("persistent development product fixtures", () => {
  it("defines the two active DEV-LOCAL products with deterministic ownership", () => {
    expect(DEV_PRODUCTS).toEqual([
      expect.objectContaining({
        id: "d3120000-0000-4000-8000-000000000001",
        slug: "dev-local-delivn-espresso",
        name: "CÀ PHÊ HẠT RANG ESPRESSO",
        category: "espresso",
        status: "active",
        featured: false,
      }),
      expect.objectContaining({
        id: "d3120000-0000-4000-8000-000000000002",
        slug: "dev-local-delivn-rang-xay",
        name: "CÀ PHÊ RANG XAY",
        category: "rang_xay",
        status: "active",
        featured: false,
      }),
    ]);
    expect(DEV_PRODUCTS.every((product) => /phát triển cục bộ/i.test(product.description))).toBe(true);
  });

  it("defines exact active variants and current business-provided prices", () => {
    expect(DEV_VARIANTS).toEqual([
      {
        id: "d3120000-0000-4000-8000-000000000101",
        productId: "d3120000-0000-4000-8000-000000000001",
        sku: "DEV-LOCAL-ESPRESSO-250",
        label: "250g",
        weightGrams: 250,
        priceVnd: 173_000,
        compareAtPriceVnd: null,
        active: true,
      },
      {
        id: "d3120000-0000-4000-8000-000000000102",
        productId: "d3120000-0000-4000-8000-000000000001",
        sku: "DEV-LOCAL-ESPRESSO-500",
        label: "500g",
        weightGrams: 500,
        priceVnd: 345_000,
        compareAtPriceVnd: null,
        active: true,
      },
      {
        id: "d3120000-0000-4000-8000-000000000201",
        productId: "d3120000-0000-4000-8000-000000000002",
        sku: "DEV-LOCAL-RANG-XAY-250",
        label: "250g",
        weightGrams: 250,
        priceVnd: 168_000,
        compareAtPriceVnd: null,
        active: true,
      },
      {
        id: "d3120000-0000-4000-8000-000000000202",
        productId: "d3120000-0000-4000-8000-000000000002",
        sku: "DEV-LOCAL-RANG-XAY-500",
        label: "500g",
        weightGrams: 500,
        priceVnd: 335_000,
        compareAtPriceVnd: null,
        active: true,
      },
    ]);
  });

  it("defines exact local media and insert-only baseline inventory", () => {
    expect(DEV_MEDIA).toEqual([
      expect.objectContaining({
        id: "d3120000-0000-4000-8000-000000000301",
        productId: "d3120000-0000-4000-8000-000000000001",
        url: "/products/black/front.png",
        sortOrder: 0,
      }),
      expect.objectContaining({
        id: "d3120000-0000-4000-8000-000000000302",
        productId: "d3120000-0000-4000-8000-000000000001",
        url: "/products/black/three-quarter.png",
        sortOrder: 1,
      }),
      expect.objectContaining({
        id: "d3120000-0000-4000-8000-000000000303",
        productId: "d3120000-0000-4000-8000-000000000002",
        url: "/products/sand/front.png",
        sortOrder: 0,
      }),
      expect.objectContaining({
        id: "d3120000-0000-4000-8000-000000000304",
        productId: "d3120000-0000-4000-8000-000000000002",
        url: "/products/sand/three-quarter.png",
        sortOrder: 1,
      }),
    ]);
    expect(DEV_MEDIA.every((media) => /phát triển cục bộ/i.test(media.alt))).toBe(true);
    expect(DEV_STOCK).toEqual(
      DEV_VARIANTS.map((variant) => ({
        variantId: variant.id,
        quantity: 100,
        reservedQuantity: 0,
      })),
    );
  });

  it("uses an ownership namespace distinct from resettable E2E fixtures", () => {
    const demoProductIds = new Set<string>(DEMO_PRODUCTS.map((row) => row.id));
    const demoSlugs = new Set<string>(DEMO_PRODUCTS.map((row) => row.slug));
    const demoVariantIds = new Set<string>(DEMO_VARIANTS.map((row) => row.id));
    const demoSkus = new Set<string>(DEMO_VARIANTS.map((row) => row.sku));
    expect(DEV_PRODUCTS.every((row) => !demoProductIds.has(row.id))).toBe(true);
    expect(DEV_PRODUCTS.every((row) => !demoSlugs.has(row.slug))).toBe(true);
    expect(DEV_VARIANTS.every((row) => !demoVariantIds.has(row.id))).toBe(true);
    expect(DEV_VARIANTS.every((row) => !demoSkus.has(row.sku))).toBe(true);
  });
});
