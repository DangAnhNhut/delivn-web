import { describe, expect, it } from "vitest";

import type { CheckoutInput } from "@/contracts";

import { CheckoutValidationError } from "@/server/errors/commerce-error";

import { normalizeCheckoutInput } from "./checkout-normalization";

const base: Omit<CheckoutInput, "items"> = {
  customer: { name: "A Customer", phone: "0912345678", address: "An address" },
  paymentMethod: "cod",
};

describe("normalizeCheckoutInput", () => {
  it("groups duplicate variants into one line at the allowed boundary", () => {
    const variantId = "00000000-0000-4000-8000-000000000002";
    const result = normalizeCheckoutInput({
      ...base,
      items: [
        { variantId, quantity: 12 },
        { variantId, quantity: 8 },
      ],
    });
    expect(result.items).toEqual([{ variantId, quantity: 20 }]);
  });

  it("rejects a grouped quantity above 20", () => {
    const variantId = "00000000-0000-4000-8000-000000000002";
    expect(() =>
      normalizeCheckoutInput({
        ...base,
        items: [
          { variantId, quantity: 12 },
          { variantId, quantity: 9 },
        ],
      }),
    ).toThrow(CheckoutValidationError);
  });

  it("sorts normalized variant IDs ascending", () => {
    const result = normalizeCheckoutInput({
      ...base,
      items: [
        { variantId: "00000000-0000-4000-8000-000000000003", quantity: 1 },
        { variantId: "00000000-0000-4000-8000-000000000001", quantity: 2 },
        { variantId: "00000000-0000-4000-8000-000000000002", quantity: 3 },
      ],
    });
    expect(result.items.map((item) => item.variantId)).toEqual([
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002",
      "00000000-0000-4000-8000-000000000003",
    ]);
  });
});
