import { describe, expect, it } from "vitest";

import type { ProductDTO } from "@/contracts";

import { createCartItemSnapshot } from "./cart-snapshot";

const product: ProductDTO = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "ca-phe-delivn",
  name: "Cà phê DELIVN",
  shortName: "DELIVN",
  description: "Fixture kiểm thử.",
  category: "espresso",
  featured: false,
  media: [
    {
      id: "00000000-0000-4000-8000-000000000002",
      type: "image",
      url: "/products/delivn.png",
      alt: "Gói cà phê DELIVN",
      sortOrder: 0,
    },
  ],
  variants: [
    {
      id: "00000000-0000-4000-8000-000000000003",
      sku: "FIXTURE-250",
      label: "250g",
      weightGrams: 250,
      priceVnd: 125_000,
      compareAtPriceVnd: 150_000,
      inStock: true,
    },
  ],
};

describe("createCartItemSnapshot", () => {
  it("copies only ProductDTO presentation fields needed by the cart", () => {
    expect(createCartItemSnapshot(product, product.variants[0]!)).toEqual({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantId: product.variants[0]!.id,
      variantLabel: product.variants[0]!.label,
      image: { url: "/products/delivn.png", alt: "Gói cà phê DELIVN" },
      unitPriceVndSnapshot: 125_000,
    });
  });

  it("uses null rather than fabricating product media", () => {
    expect(
      createCartItemSnapshot({ ...product, media: [] }, product.variants[0]!).image,
    ).toBeNull();
  });

  it("uses the real product name when primary media alt is blank", () => {
    const blankAltProduct = {
      ...product,
      media: [{ ...product.media[0]!, alt: "   " }],
    };

    expect(createCartItemSnapshot(blankAltProduct, product.variants[0]!).image).toEqual({
      url: "/products/delivn.png",
      alt: "Cà phê DELIVN",
    });
  });

  it("uses null when the primary media URL is empty instead of fabricating media", () => {
    const emptyUrlProduct = {
      ...product,
      media: [{ ...product.media[0]!, url: "   " }],
    };

    expect(createCartItemSnapshot(emptyUrlProduct, product.variants[0]!).image).toBeNull();
  });

  it("does not include SKU, stock, compare-at price, or quantity", () => {
    const snapshot = createCartItemSnapshot(product, product.variants[0]!);

    expect(snapshot).not.toHaveProperty("sku");
    expect(snapshot).not.toHaveProperty("inStock");
    expect(snapshot).not.toHaveProperty("compareAtPriceVnd");
    expect(snapshot).not.toHaveProperty("quantity");
  });
});
