import { describe, expect, it } from "vitest";

import { presentCheckoutError } from "./checkout-errors";

describe("presentCheckoutError", () => {
  it.each([
    ["INVALID_JSON", "Không thể gửi thông tin đặt hàng", false],
    ["VALIDATION_ERROR", "Thông tin đặt hàng chưa hợp lệ", false],
    ["ITEM_UNAVAILABLE", "Một hoặc nhiều sản phẩm không còn khả dụng", true],
    ["INSUFFICIENT_INVENTORY", "Số lượng sản phẩm hiện không còn đủ", true],
    ["ORDER_VALUE_LIMIT_EXCEEDED", "Giá trị đơn hàng vượt giới hạn hỗ trợ", true],
    ["SERVER_CONFIGURATION_ERROR", "Hệ thống đặt hàng tạm thời chưa sẵn sàng", false],
    ["INTERNAL_ERROR", "Không thể hoàn tất đơn hàng lúc này", false],
  ])("maps %s to safe localized copy", (code, message, cartActionRecommended) => {
    expect(
      presentCheckoutError({ ok: false, kind: "api", status: 400, code }),
    ).toEqual({ message: expect.stringContaining(message), canRetry: true, cartActionRecommended });
  });

  it("maps unknown API codes without rendering raw server text", () => {
    const result = presentCheckoutError({
      ok: false,
      kind: "api",
      status: 500,
      code: "UNKNOWN_BACKEND_CODE",
    });

    expect(result.message).toBe("Không thể hoàn tất đơn hàng lúc này. Vui lòng thử lại sau.");
    expect(result.canRetry).toBe(true);
  });

  it.each(["constructor", "toString", "__proto__"])(
    "uses the generic fallback for inherited object property code %s",
    (code) => {
      const result = presentCheckoutError({
        ok: false,
        kind: "api",
        status: 500,
        code,
      });

      expect(result).toEqual({
        message:
          "Không thể hoàn tất đơn hàng lúc này. Vui lòng thử lại sau.",
        canRetry: true,
        cartActionRecommended: false,
      });
    },
  );

  it.each(["network", "malformed_response"] as const)(
    "presents %s as uncertain and blocks immediate retry",
    (reason) => {
      expect(presentCheckoutError({ ok: false, kind: "uncertain", reason })).toEqual({
        message:
          "Chưa thể xác nhận kết quả đặt hàng. Giỏ hàng của bạn vẫn được giữ nguyên; vui lòng không gửi lại ngay để tránh tạo đơn trùng.",
        canRetry: false,
        cartActionRecommended: false,
      });
    },
  );
});
