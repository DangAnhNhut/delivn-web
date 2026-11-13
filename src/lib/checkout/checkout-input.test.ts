import { describe, expect, it } from "vitest";

import { MAX_QUANTITY_PER_VARIANT } from "@/contracts";
import {
  VIETNAM_COMMUNES,
  getProvinceByCode,
} from "@/data/vietnam-administrative-units";
import type { CartItem } from "@/lib/cart/cart-types";

import {
  MAX_ADDRESS_DETAIL_LENGTH,
  composeCustomerAddress,
  createCheckoutInput,
  normalizeAddressDetail,
  type CheckoutFormValues,
} from "./checkout-input";

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
  provinceCode: "01",
  communeCode: "00004",
  addressDetail: " 123   Đường Cà Phê ",
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
          address: "123 Đường Cà Phê, Phường Ba Đình, Thành phố Hà Nội, Việt Nam",
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
      address: "123 Đường Cà Phê, Phường Ba Đình, Thành phố Hà Nội, Việt Nam",
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
        provinceCode: "",
        communeCode: "",
        addressDetail: "",
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
        provinceCode: "Vui lòng chọn tỉnh / thành phố.",
        communeCode: "Vui lòng chọn phường / xã / đặc khu.",
        addressDetail: "Vui lòng nhập địa chỉ chi tiết.",
        paymentMethod: "Vui lòng chọn phương thức thanh toán.",
      },
      cartActionRecommended: false,
    });
  });

  it("rejects bank_transfer while payment method is updating", () => {
    const result = createCheckoutInput({ ...values, paymentMethod: "bank_transfer" }, items);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("bank_transfer must be rejected");
    expect(result.fieldErrors.paymentMethod).toBe(
      "Phương thức chuyển khoản ngân hàng đang được cập nhật, vui lòng chọn Thanh toán khi nhận hàng (COD).",
    );
  });

  it.each([
    ["an unknown province", { provinceCode: "99" }, "provinceCode", "Vui lòng chọn tỉnh / thành phố."],
    ["an unknown commune", { communeCode: "99999" }, "communeCode", "Vui lòng chọn phường / xã / đặc khu."],
    ["a commune from another province", { communeCode: "26740" }, "communeCode", "Vui lòng chọn phường / xã / đặc khu."],
    ["blank detail", { addressDetail: "   " }, "addressDetail", "Vui lòng nhập địa chỉ chi tiết."],
  ])("rejects %s", (_caseName, overrides, field, message) => {
    const result = createCheckoutInput({ ...values, ...overrides }, items);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Fixture must be invalid");
    expect(result.fieldErrors[field as keyof typeof result.fieldErrors]).toBe(message);
  });

  it("normalizes detail whitespace while preserving case and punctuation", () => {
    expect(normalizeAddressDetail("  148/4   Đường ABC,  Tòa A  ")).toBe(
      "148/4 Đường ABC, Tòa A",
    );
    expect(
      composeCustomerAddress(
        "148/4 Đường ABC, Tòa A",
        "Phường Ba Đình",
        "Thành phố Hà Nội",
      ),
    ).toBe("148/4 Đường ABC, Tòa A, Phường Ba Đình, Thành phố Hà Nội, Việt Nam");
  });

  it("never inserts a district into the canonical payload", () => {
    const result = createCheckoutInput(values, items);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Fixture must be valid");
    expect(result.input.customer.address).not.toMatch(/Quận|Huyện|district/i);
    expect(result.input.customer).not.toHaveProperty("provinceCode");
    expect(result.input.customer).not.toHaveProperty("communeCode");
    expect(result.input.customer).not.toHaveProperty("addressDetail");
  });

  it("keeps the detail cap within the server address limit for every official pair", () => {
    for (const commune of VIETNAM_COMMUNES) {
      const province = getProvinceByCode(commune.provinceCode);
      if (!province) throw new Error(`Missing province ${commune.provinceCode}`);
      const composed = composeCustomerAddress(
        "x".repeat(MAX_ADDRESS_DETAIL_LENGTH),
        commune.name,
        province.name,
      );
      expect(composed.length).toBeLessThanOrEqual(500);
    }

    const result = createCheckoutInput(
      { ...values, addressDetail: "x".repeat(MAX_ADDRESS_DETAIL_LENGTH + 1) },
      items,
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Over-limit detail must be invalid");
    expect(result.fieldErrors.addressDetail).toBe("Vui lòng nhập địa chỉ chi tiết.");
  });
});
