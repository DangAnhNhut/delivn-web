import { describe, expect, it } from "vitest";

import { MAX_QUANTITY_PER_VARIANT } from "@/contracts";
import type { CartItem } from "@/lib/cart/cart-types";

import { createCheckoutInput, type CheckoutFormValues } from "./checkout-input";

const items: CartItem[] = [
  {
    productId: "00000000-0000-4000-8000-000000000010",
    productSlug: "ca-phe-a",
    productName: "Cà phê A",
    variantId: "00000000-0000-4000-8000-000000000001",
    variantLabel: "250g",
    image: { url: "/products/a.png", alt: "Gói cà phê A" },
    unitPriceVndSnapshot: 125_000,
    quantity: 2,
  },
];

const values: CheckoutFormValues = {
  name: " Nguyễn Văn A ",
  phone: "+84 (912) 345-678",
  email: " CUSTOMER@EXAMPLE.COM ",
  address: " 123 Đường Cà Phê ",
  note: "  Giao buổi sáng  ",
  paymentMethod: "cod",
};

describe("createCheckoutInput", () => {
  it("returns canonical normalized customer fields and variant quantities only", () => {
    const result = createCheckoutInput(values, items);

    expect(result).toEqual({
      ok: true,
      input: {
        customer: {
          name: "Nguyễn Văn A",
          phone: "+84912345678",
          email: "customer@example.com",
          address: "123 Đường Cà Phê",
          note: "Giao buổi sáng",
        },
        paymentMethod: "cod",
        items: [
          {
            variantId: "00000000-0000-4000-8000-000000000001",
            quantity: 2,
          },
        ],
      },
    });
    expect(JSON.stringify(result)).not.toContain("unitPriceVndSnapshot");
    expect(JSON.stringify(result)).not.toContain("productName");
    expect(JSON.stringify(result)).not.toContain("productId");
    expect(JSON.stringify(result)).not.toContain("image");
  });

  it("omits blank optional email and note through canonical preprocessing", () => {
    const result = createCheckoutInput({ ...values, email: " ", note: "" }, items);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Fixture must be valid");
    expect(result.input.customer).toEqual({
      name: "Nguyễn Văn A",
      phone: "+84912345678",
      address: "123 Đường Cà Phê",
    });
  });

  it("rejects an empty cart before fetch", () => {
    const result = createCheckoutInput(values, []);

    expect(result).toMatchObject({ ok: false });
  });

  it("explains how to recover when the cart exceeds the canonical item limit", () => {
    const oversizedCart = Array.from({ length: 51 }, (_, index) => ({
      ...items[0],
      variantId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    }));

    const result = createCheckoutInput(values, oversizedCart);

    expect(result).toEqual({
      ok: false,
      summary:
        "Giỏ hàng vượt quá giới hạn 50 dòng sản phẩm. Vui lòng điều chỉnh giỏ hàng trước khi đặt hàng.",
      fieldErrors: {},
      cartActionRecommended: true,
    });
  });

  it("does not report the line limit for an excessive variant quantity", () => {
    const result = createCheckoutInput(values, [
      { ...items[0], quantity: MAX_QUANTITY_PER_VARIANT + 1 },
    ]);

    if (result.ok) throw new Error("Excessive quantity must be rejected");
    expect(result).toEqual({
      ok: false,
      summary:
        "Giỏ hàng có sản phẩm chưa hợp lệ. Vui lòng điều chỉnh giỏ hàng trước khi đặt hàng.",
      fieldErrors: {},
      cartActionRecommended: true,
    });
    expect(result.summary).not.toContain("50 dòng sản phẩm");
  });

  it("maps canonical field failures to localized field keys", () => {
    const result = createCheckoutInput(
      {
        name: "",
        phone: "abc",
        email: "bad",
        address: "",
        note: "",
        paymentMethod: "",
      },
      items,
    );

    expect(result).toEqual({
      ok: false,
      summary: "Thông tin đặt hàng chưa hợp lệ. Vui lòng kiểm tra các trường được đánh dấu.",
      fieldErrors: {
        name: "Vui lòng nhập họ và tên hợp lệ.",
        phone: "Vui lòng nhập số điện thoại hợp lệ.",
        email: "Vui lòng nhập email hợp lệ.",
        address: "Vui lòng nhập địa chỉ nhận hàng hợp lệ.",
        paymentMethod: "Vui lòng chọn phương thức thanh toán.",
      },
      cartActionRecommended: false,
    });
  });
});
