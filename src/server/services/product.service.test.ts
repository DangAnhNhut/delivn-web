import { describe, expect, it } from "vitest";

import type { ProductStoreRecord } from "@/server/repositories/product.repository";

import { createProductService, mapProductRecordToDto } from "./product.service";

const productRecord: ProductStoreRecord = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "ca-phe-rang-xay",
  name: "CÀ PHÊ RANG XAY",
  shortName: "Rang Xay",
  description: "Cà phê rang xay.",
  category: "rang_xay",
  status: "active",
  featured: true,
  media: [
    {
      id: "00000000-0000-4000-8000-000000000012",
      type: "image",
      url: "/second.png",
      alt: "Second",
      sortOrder: 2,
    },
    {
      id: "00000000-0000-4000-8000-000000000011",
      type: "image",
      url: "/first.png",
      alt: "First",
      sortOrder: 1,
    },
  ],
  variants: [
    {
      id: "00000000-0000-4000-8000-000000000022",
      sku: "RX-500",
      label: "500g",
      weightGrams: 500,
      priceVnd: 220_000,
      compareAtPriceVnd: null,
      active: true,
      quantity: 5,
      reservedQuantity: 5,
    },
    {
      id: "00000000-0000-4000-8000-000000000021",
      sku: "RX-250",
      label: "250g",
      weightGrams: 250,
      priceVnd: 125_000,
      compareAtPriceVnd: 140_000,
      active: true,
      quantity: 3,
      reservedQuantity: 1,
    },
    {
      id: "00000000-0000-4000-8000-000000000023",
      sku: "RX-INACTIVE",
      label: "Inactive",
      weightGrams: 1000,
      priceVnd: 1,
      compareAtPriceVnd: null,
      active: false,
      quantity: 10,
      reservedQuantity: 0,
    },
    {
      id: "00000000-0000-4000-8000-000000000024",
      sku: "RX-MISSING-INVENTORY",
      label: "No inventory",
      weightGrams: 750,
      priceVnd: 1,
      compareAtPriceVnd: null,
      active: true,
      quantity: null,
      reservedQuantity: null,
    },
  ],
};

describe("mapProductRecordToDto", () => {
  it("preserves rang_xay, orders media and variants, and derives inStock", () => {
    const result = mapProductRecordToDto(productRecord);

    expect(result.category).toBe("rang_xay");
    expect(result.media.map((media) => media.sortOrder)).toEqual([1, 2]);
    expect(result.variants.map((variant) => variant.sku)).toEqual([
      "RX-250",
      "RX-500",
      "RX-MISSING-INVENTORY",
    ]);
    expect(result.variants.map((variant) => variant.inStock)).toEqual([true, false, false]);
  });

  it("does not expose raw inventory quantities", () => {
    const result = mapProductRecordToDto(productRecord);
    expect(JSON.stringify(result)).not.toContain("quantity");
    expect(JSON.stringify(result)).not.toContain("reservedQuantity");
  });
});

describe("createProductService", () => {
  it("maps repository results and preserves an empty list", async () => {
    const repository = {
      listActiveProducts: async () => [productRecord],
      findActiveProductBySlug: async () => null,
    };
    const service = createProductService(repository);

    await expect(service.listActiveProducts()).resolves.toEqual([
      mapProductRecordToDto(productRecord),
    ]);
    await expect(service.getActiveProductBySlug("missing")).resolves.toBeNull();
  });
});
