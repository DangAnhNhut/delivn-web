import { describe, expect, it } from "vitest";

import { MAX_QUANTITY_PER_VARIANT } from "@/contracts";

import type { CartItem, CartItemSnapshot } from "./cart-types";
import { cartReducer } from "./cart-reducer";

const snapshot: CartItemSnapshot = {
  productId: "00000000-0000-4000-8000-000000000001",
  productSlug: "ca-phe-a",
  productName: "Cà phê A",
  variantId: "00000000-0000-4000-8000-000000000002",
  variantLabel: "250g",
  image: { url: "/products/a.png", alt: "Cà phê A" },
  unitPriceVndSnapshot: 100_000,
};

function line(overrides: Partial<CartItem> = {}): CartItem {
  return { ...snapshot, quantity: 1, ...overrides };
}

describe("cartReducer", () => {
  it("adds the first variant as one line with quantity one", () => {
    expect(cartReducer([], { type: "add", item: snapshot })).toEqual([line()]);
  });

  it("merges the same variant and refreshes every presentation snapshot", () => {
    const stale = line({ quantity: 2, productName: "Tên cũ", image: null });
    const refreshed: CartItemSnapshot = {
      ...snapshot,
      productName: "Tên mới",
      variantLabel: "Gói mới",
      image: { url: "products/new.png", alt: "Ảnh mới" },
      unitPriceVndSnapshot: 120_000,
    };

    expect(cartReducer([stale], { type: "add", item: refreshed })).toEqual([
      { ...refreshed, quantity: 3 },
    ]);
  });

  it("clamps repeated adds at the canonical maximum", () => {
    const current = line({ quantity: MAX_QUANTITY_PER_VARIANT });

    expect(cartReducer([current], { type: "add", item: snapshot })[0]?.quantity).toBe(
      MAX_QUANTITY_PER_VARIANT,
    );
  });

  it("keeps different variants as separate lines", () => {
    const other = { ...snapshot, variantId: "00000000-0000-4000-8000-000000000003" };

    expect(cartReducer([line()], { type: "add", item: other })).toEqual([
      line(),
      { ...other, quantity: 1 },
    ]);
  });

  it("increments and clamps at the maximum", () => {
    const almostMax = line({ quantity: MAX_QUANTITY_PER_VARIANT - 1 });
    const atMax = cartReducer([almostMax], {
      type: "increment",
      variantId: snapshot.variantId,
    });

    expect(atMax[0]?.quantity).toBe(MAX_QUANTITY_PER_VARIANT);
    expect(
      cartReducer(atMax, { type: "increment", variantId: snapshot.variantId })[0]
        ?.quantity,
    ).toBe(MAX_QUANTITY_PER_VARIANT);
  });

  it("decrements but never removes or drops below one", () => {
    const two = line({ quantity: 2 });
    const one = cartReducer([two], { type: "decrement", variantId: snapshot.variantId });

    expect(one[0]?.quantity).toBe(1);
    expect(
      cartReducer(one, { type: "decrement", variantId: snapshot.variantId }),
    ).toEqual(one);
  });

  it("removes one line and clears all lines explicitly", () => {
    const other = line({ variantId: "00000000-0000-4000-8000-000000000003" });
    const remaining = cartReducer([line(), other], {
      type: "remove",
      variantId: snapshot.variantId,
    });

    expect(remaining).toEqual([other]);
    expect(cartReducer(remaining, { type: "clear" })).toEqual([]);
  });

  it("replaces lines for validated hydration and ignores unknown line actions", () => {
    const existing = [line()];
    const replacement = [line({ quantity: 4 })];

    expect(cartReducer(existing, { type: "replace", items: replacement })).toBe(replacement);
    expect(
      cartReducer(existing, { type: "increment", variantId: "missing" }),
    ).toBe(existing);
    expect(
      cartReducer(existing, { type: "decrement", variantId: "missing" }),
    ).toBe(existing);
    expect(cartReducer(existing, { type: "remove", variantId: "missing" })).toBe(existing);
  });

  it("removes a line when submitted quantity equals or exceeds the current quantity", () => {
    expect(
      cartReducer([line({ quantity: 2 })], {
        type: "reconcileSubmitted",
        items: [{ variantId: snapshot.variantId, quantity: 2 }],
      }),
    ).toEqual([]);
    expect(
      cartReducer([line({ quantity: 1 })], {
        type: "reconcileSubmitted",
        items: [{ variantId: snapshot.variantId, quantity: 2 }],
      }),
    ).toEqual([]);
  });

  it("keeps the current refreshed snapshot with the remaining quantity", () => {
    const refreshed = line({
      quantity: 3,
      productName: "Tên mới từ tab khác",
      variantLabel: "Gói mới",
      image: { url: "/products/refreshed.png", alt: "Ảnh mới" },
      unitPriceVndSnapshot: 135_000,
    });

    expect(
      cartReducer([refreshed], {
        type: "reconcileSubmitted",
        items: [{ variantId: snapshot.variantId, quantity: 2 }],
      }),
    ).toEqual([{ ...refreshed, quantity: 1 }]);
  });

  it("leaves absent and unrelated current variants untouched", () => {
    const other = line({
      variantId: "00000000-0000-4000-8000-000000000003",
      quantity: 4,
    });

    expect(
      cartReducer([other], {
        type: "reconcileSubmitted",
        items: [{ variantId: snapshot.variantId, quantity: 2 }],
      }),
    ).toEqual([other]);
  });

  it("aggregates duplicate submitted quantities defensively", () => {
    expect(
      cartReducer([line({ quantity: 4 })], {
        type: "reconcileSubmitted",
        items: [
          { variantId: snapshot.variantId, quantity: 1 },
          { variantId: snapshot.variantId, quantity: 2 },
        ],
      }),
    ).toEqual([line({ quantity: 1 })]);
  });
});
