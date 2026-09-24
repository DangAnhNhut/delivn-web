import { describe, expect, it } from "vitest";

import { cartStorageV1Schema } from "./cart-schema";

const productId = "00000000-0000-4000-8000-000000000001";
const variantId = "00000000-0000-4000-8000-000000000002";

const validItem = {
  productId,
  productSlug: "ca-phe-hat-rang",
  productName: "Cà phê hạt rang",
  variantId,
  variantLabel: "250g",
  image: { url: "/products/ca-phe.png", alt: "Gói cà phê DELIVN" },
  unitPriceVndSnapshot: 125_000,
  quantity: 1,
};

function payloadWith(item: Record<string, unknown>) {
  return { version: 1, items: [item] };
}

describe("cartStorageV1Schema", () => {
  it("accepts the strict v1 payload and relative ProductDTO media paths", () => {
    expect(
      cartStorageV1Schema.parse(payloadWith(validItem)),
    ).toEqual(payloadWith(validItem));
  });

  it("accepts non-empty ProductDTO media strings without requiring absolute URLs", () => {
    const relativeWithoutLeadingSlash = {
      ...validItem,
      image: { url: "products/ca-phe.png", alt: "Gói cà phê DELIVN" },
    };

    expect(cartStorageV1Schema.safeParse(payloadWith(relativeWithoutLeadingSlash)).success).toBe(
      true,
    );
  });

  it.each([
    ["wrong version", { version: 2, items: [validItem] }],
    ["invalid product UUID", payloadWith({ ...validItem, productId: "product-1" })],
    ["invalid variant UUID", payloadWith({ ...validItem, variantId: "variant-1" })],
    ["blank slug", payloadWith({ ...validItem, productSlug: "   " })],
    ["malformed slug", payloadWith({ ...validItem, productSlug: "Cà phê" })],
    ["blank product name", payloadWith({ ...validItem, productName: " " })],
    ["blank variant label", payloadWith({ ...validItem, variantLabel: " " })],
    ["empty image URL", payloadWith({ ...validItem, image: { url: " ", alt: "Alt" } })],
    ["blank image alt", payloadWith({ ...validItem, image: { url: "/image.png", alt: " " } })],
    ["invalid image shape", payloadWith({ ...validItem, image: { url: "/image.png" } })],
    [
      "unexpected image field",
      payloadWith({ ...validItem, image: { ...validItem.image, sortOrder: 0 } }),
    ],
    ["negative price", payloadWith({ ...validItem, unitPriceVndSnapshot: -1 })],
    ["fractional price", payloadWith({ ...validItem, unitPriceVndSnapshot: 1.5 })],
    ["NaN price", payloadWith({ ...validItem, unitPriceVndSnapshot: Number.NaN })],
    ["infinite price", payloadWith({ ...validItem, unitPriceVndSnapshot: Infinity })],
    ["overflow price", payloadWith({ ...validItem, unitPriceVndSnapshot: 2_147_483_648 })],
    ["zero quantity", payloadWith({ ...validItem, quantity: 0 })],
    ["fractional quantity", payloadWith({ ...validItem, quantity: 1.5 })],
    ["quantity above max", payloadWith({ ...validItem, quantity: 21 })],
    ["unexpected item field", payloadWith({ ...validItem, sku: "SECRET" })],
    ["unexpected root field", { version: 1, items: [validItem], total: 125_000 }],
  ])("rejects %s", (_label, payload) => {
    expect(cartStorageV1Schema.safeParse(payload).success).toBe(false);
  });

  it("rejects duplicate variant lines", () => {
    const payload = {
      version: 1,
      items: [validItem, { ...validItem, productName: "Snapshot khác" }],
    };

    expect(cartStorageV1Schema.safeParse(payload).success).toBe(false);
  });

  it("accepts a null image snapshot", () => {
    expect(
      cartStorageV1Schema.safeParse(payloadWith({ ...validItem, image: null })).success,
    ).toBe(true);
  });

  it("does not reject valid ProductDTO text only because it exceeds cart-only lengths", () => {
    const canonicalTextItem = {
      ...validItem,
      productName: "C".repeat(400),
      variantLabel: "V".repeat(200),
      image: {
        url: `/${"media-segment".repeat(220)}`,
        alt: "A".repeat(600),
      },
    };

    expect(cartStorageV1Schema.safeParse(payloadWith(canonicalTextItem)).success).toBe(true);
  });
});
