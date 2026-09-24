import { describe, expect, it } from "vitest";

import type { CartItem } from "./cart-types";
import {
  selectCartItemCount,
  selectCartLineTotalVnd,
  selectCartSubtotalVnd,
  selectCheckoutItems,
} from "./cart-selectors";

function item(variantId: string, quantity: number, unitPriceVndSnapshot: number): CartItem {
  return {
    productId: "00000000-0000-4000-8000-000000000001",
    productSlug: "ca-phe",
    productName: "Cà phê",
    variantId,
    variantLabel: "Gói",
    image: null,
    unitPriceVndSnapshot,
    quantity,
  };
}

const first = item("00000000-0000-4000-8000-000000000002", 2, 2_147_483_647);
const second = item("00000000-0000-4000-8000-000000000003", 4, 125_000);

describe("cart selectors", () => {
  it("sums quantities rather than line count", () => {
    expect(selectCartItemCount([first, second])).toBe(6);
  });

  it("uses BigInt for line totals", () => {
    expect(selectCartLineTotalVnd(first)).toBe(BigInt("4294967294"));
  });

  it("uses BigInt for the snapshot subtotal", () => {
    expect(selectCartSubtotalVnd([first, second])).toBe(BigInt("4295467294"));
  });

  it("projects only variantId and quantity for future checkout", () => {
    expect(selectCheckoutItems([first, second])).toEqual([
      { variantId: "00000000-0000-4000-8000-000000000002", quantity: 2 },
      { variantId: "00000000-0000-4000-8000-000000000003", quantity: 4 },
    ]);
  });
});
