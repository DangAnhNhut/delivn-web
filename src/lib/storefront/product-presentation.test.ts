import { describe, expect, it } from "vitest";

import type { ProductVariantDTO } from "@/contracts";

import {
  formatVnd,
  getDefaultProductVariant,
  getProductAvailability,
  getProductPrice,
} from "./product-presentation";

function variant(
  id: string,
  priceVnd: number,
  inStock = true,
): ProductVariantDTO {
  return {
    id,
    sku: `SKU-${id}`,
    label: `${id}g`,
    weightGrams: Number(id),
    priceVnd,
    compareAtPriceVnd: null,
    inStock,
  };
}

describe("getProductPrice", () => {
  it("returns the minimum price with a from qualifier when variant prices differ", () => {
    expect(getProductPrice([variant("500", 220_000), variant("250", 125_000)])).toEqual({
      priceVnd: 125_000,
      showFrom: true,
    });
  });

  it("returns the shared price without a from qualifier when all prices are equal", () => {
    expect(getProductPrice([variant("250", 150_000), variant("500", 150_000)])).toEqual({
      priceVnd: 150_000,
      showFrom: false,
    });
  });

  it("returns the only real price for one variant", () => {
    expect(getProductPrice([variant("250", 125_000)])).toEqual({
      priceVnd: 125_000,
      showFrom: false,
    });
  });

  it("returns null when no variants are available", () => {
    expect(getProductPrice([])).toBeNull();
  });
});

describe("formatVnd", () => {
  it("formats integer đồng values with the Vietnamese VND currency formatter", () => {
    expect(formatVnd(125_000)).toBe("125.000 ₫");
  });

  it("formats BigInt snapshot totals without converting through floating point", () => {
    expect(formatVnd(BigInt("4294967294"))).toBe("4.294.967.294 ₫");
  });
});

describe("getProductAvailability", () => {
  it("reports available when at least one variant is in stock", () => {
    expect(
      getProductAvailability([
        variant("250", 125_000, false),
        variant("500", 220_000, true),
      ]),
    ).toBe("available");
  });

  it("reports unavailable when variants exist but none is in stock", () => {
    expect(getProductAvailability([variant("250", 125_000, false)])).toBe(
      "unavailable",
    );
  });

  it("reports pending when the product has no variants", () => {
    expect(getProductAvailability([])).toBe("pending");
  });
});

describe("getDefaultProductVariant", () => {
  it("selects the first in-stock variant even when it is not first", () => {
    const unavailable = variant("250", 125_000, false);
    const available = variant("500", 220_000, true);

    expect(getDefaultProductVariant([unavailable, available])).toBe(available);
  });

  it("selects the first variant when all variants are unavailable", () => {
    const first = variant("250", 125_000, false);
    const second = variant("500", 220_000, false);

    expect(getDefaultProductVariant([first, second])).toBe(first);
  });

  it("returns null when there are no variants", () => {
    expect(getDefaultProductVariant([])).toBeNull();
  });
});
