import type { CheckoutHttpResult } from "./checkout-http";

export type CheckoutFailure = Exclude<CheckoutHttpResult, { ok: true }>;

export type CheckoutErrorPresentation = {
  message: string;
  canRetry: boolean;
  cartActionRecommended: boolean;
};

const GENERIC_ERROR = "Không thể hoàn tất đơn hàng lúc này. Vui lòng thử lại sau.";

const apiMessages: Record<string, Omit<CheckoutErrorPresentation, "canRetry">> = {
  INVALID_JSON: {
    message: "Không thể gửi thông tin đặt hàng. Vui lòng kiểm tra và thử lại.",
    cartActionRecommended: false,
  },
  VALIDATION_ERROR: {
    message:
      "Thông tin đặt hàng chưa hợp lệ. Vui lòng kiểm tra các trường được đánh dấu.",
    cartActionRecommended: false,
  },
  ITEM_UNAVAILABLE: {
    message: "Một hoặc nhiều sản phẩm không còn khả dụng. Vui lòng kiểm tra lại giỏ hàng.",
    cartActionRecommended: true,
  },
  INSUFFICIENT_INVENTORY: {
    message: "Số lượng sản phẩm hiện không còn đủ. Vui lòng điều chỉnh giỏ hàng.",
    cartActionRecommended: true,
  },
  ORDER_VALUE_LIMIT_EXCEEDED: {
    message: "Giá trị đơn hàng vượt giới hạn hỗ trợ. Vui lòng điều chỉnh giỏ hàng.",
    cartActionRecommended: true,
  },
  SERVER_CONFIGURATION_ERROR: {
    message: "Hệ thống đặt hàng tạm thời chưa sẵn sàng. Vui lòng thử lại sau.",
    cartActionRecommended: false,
  },
  INTERNAL_ERROR: {
    message: GENERIC_ERROR,
    cartActionRecommended: false,
  },
};

export function presentCheckoutError(
  failure: CheckoutFailure,
): CheckoutErrorPresentation {
  if (failure.kind === "uncertain") {
    return {
      message:
        "Chưa thể xác nhận kết quả đặt hàng. Giỏ hàng của bạn vẫn được giữ nguyên; vui lòng không gửi lại ngay để tránh tạo đơn trùng.",
      canRetry: false,
      cartActionRecommended: false,
    };
  }

  const known = Object.hasOwn(apiMessages, failure.code)
    ? apiMessages[failure.code]
    : {
        message: GENERIC_ERROR,
        cartActionRecommended: false,
      };
  return { ...known, canRetry: true };
}
