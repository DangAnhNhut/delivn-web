import { describe, expect, it } from "vitest";

import { MAX_QUANTITY_PER_VARIANT } from "@/contracts";

import { checkoutSchema } from "./checkout.schema";

const validInput = {
  customer: {
    name: " Nguyễn Văn A ",
    phone: "+84 (912) 345-678",
    email: " CUSTOMER@EXAMPLE.COM ",
    address: " 123 Đường Cà Phê ",
    note: "  Giao buổi sáng  ",
  },
  paymentMethod: "cod",
  items: [{ variantId: "00000000-0000-4000-8000-000000000001", quantity: 1 }],
};

describe("checkoutSchema", () => {
  it("normalizes practical customer strings", () => {
    const result = checkoutSchema.parse(validInput);
    expect(result.customer).toEqual({
      name: "Nguyễn Văn A",
      phone: "+84912345678",
      email: "customer@example.com",
      address: "123 Đường Cà Phê",
      note: "Giao buổi sáng",
    });
  });

  it("turns empty optional fields into undefined", () => {
    const result = checkoutSchema.parse({
      ...validInput,
      customer: { ...validInput.customer, email: "  ", note: "" },
    });
    expect(result.customer.email).toBeUndefined();
    expect(result.customer.note).toBeUndefined();
  });

  it.each([
    [{ ...validInput, items: [] }, "empty items"],
    [{ ...validInput, items: [{ variantId: "bad", quantity: 1 }] }, "invalid UUID"],
    [{ ...validInput, items: [{ variantId: validInput.items[0].variantId, quantity: 0 }] }, "zero"],
    [{ ...validInput, items: [{ variantId: validInput.items[0].variantId, quantity: 1.5 }] }, "fractional"],
    [{ ...validInput, items: [{ variantId: validInput.items[0].variantId, quantity: 21 }] }, "oversized"],
    [{ ...validInput, paymentMethod: "card" }, "unsupported payment"],
    [{ ...validInput, customer: { ...validInput.customer, phone: "abc" } }, "invalid phone"],
  ])("rejects %s (%s)", (input) => {
    expect(checkoutSchema.safeParse(input).success).toBe(false);
  });

  it("rejects more than 50 submitted entries", () => {
    const items = Array.from({ length: 51 }, (_, index) => ({
      variantId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      quantity: 1,
    }));
    expect(checkoutSchema.safeParse({ ...validInput, items }).success).toBe(false);
  });

  it("uses the shared per-variant quantity boundary", () => {
    const variantId = validInput.items[0].variantId;

    expect(
      checkoutSchema.safeParse({
        ...validInput,
        items: [{ variantId, quantity: MAX_QUANTITY_PER_VARIANT }],
      }).success,
    ).toBe(true);
    expect(
      checkoutSchema.safeParse({
        ...validInput,
        items: [{ variantId, quantity: MAX_QUANTITY_PER_VARIANT + 1 }],
      }).success,
    ).toBe(false);
  });
});
