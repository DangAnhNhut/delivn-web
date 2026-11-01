import { describe, expect, it } from "vitest";

import type { ProductVariantDTO } from "@/contracts";

import {
  formatVnd,
  getDefaultProductVariant,
  getProductAvailability,
  getProductDisplayDescription,
  getProductPrice,
  getProductPrincipalImage,
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

describe("getProductDisplayDescription", () => {
  it("replaces development copy with neutral factual copy for espresso", () => {
    expect(
      getProductDisplayDescription({
        description: "Dữ liệu sản phẩm DELIVN dùng cho phát triển cục bộ.",
        category: "espresso",
      }),
    ).toBe("Cà phê hạt rang — lựa chọn 250g hoặc 500g.");
  });

  it("replaces development copy with neutral factual copy for rang xay", () => {
    expect(
      getProductDisplayDescription({
        description: "Dữ liệu sản phẩm tổng hợp chỉ dùng cho phát triển và kiểm thử thương mại.",
        category: "rang_xay",
      }),
    ).toBe("Cà phê rang xay — lựa chọn 250g hoặc 500g.");
  });

  it("replaces unverified regional claims with neutral factual copy", () => {
    expect(
      getProductDisplayDescription({
        description: "Cà phê hạt rang espresso đặc biệt, chế tác từ nguồn nguyên liệu Tây Nguyên.",
        category: "espresso",
      }),
    ).toBe("Cà phê hạt rang — lựa chọn 250g hoặc 500g.");
  });

  it("preserves verified business description when provided", () => {
    const verified = "Mô tả sản phẩm cao cấp chính thức từ thương hiệu.";
    expect(
      getProductDisplayDescription({
        description: verified,
        category: "espresso",
      }),
    ).toBe(verified);
  });
});

describe("getProductPrincipalImage", () => {
  it("resolves the approved reference JPG for espresso", () => {
    expect(getProductPrincipalImage({ category: "espresso" })).toEqual({
      url: "/products/reference/500g_black_reference.jpg",
      altText: "Bao bì DELIVN Espresso",
    });
  });

  it("resolves the approved reference JPG for rang_xay", () => {
    expect(getProductPrincipalImage({ category: "rang_xay" })).toEqual({
      url: "/products/reference/500g_sand_reference.jpg",
      altText: "Bao bì DELIVN Rang Xay",
    });
  });
});
