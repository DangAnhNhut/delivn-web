import type { CheckoutInput, PaymentMethod } from "@/contracts";
import {
  checkoutSchema,
  MAX_CHECKOUT_ITEMS,
} from "@/contracts/checkout-schema";
import { selectCheckoutItems } from "@/lib/cart/cart-selectors";
import type { CartItem } from "@/lib/cart/cart-types";

export type CheckoutFormValues = {
  name: string;
  phone: string;
  email: string;
  address: string;
  note: string;
  paymentMethod: PaymentMethod | "";
};

export type CheckoutFieldName =
  | "name"
  | "phone"
  | "email"
  | "address"
  | "note"
  | "paymentMethod";

export type CheckoutInputResult =
  | { ok: true; input: CheckoutInput }
  | {
      ok: false;
      fieldErrors: Partial<Record<CheckoutFieldName, string>>;
      summary: string;
      cartActionRecommended: boolean;
    };

const fieldMessages: Record<CheckoutFieldName, string> = {
  name: "Vui lòng nhập họ và tên hợp lệ.",
  phone: "Vui lòng nhập số điện thoại hợp lệ.",
  email: "Vui lòng nhập email hợp lệ.",
  address: "Vui lòng nhập địa chỉ nhận hàng hợp lệ.",
  note: "Ghi chú không được vượt quá 1.000 ký tự.",
  paymentMethod: "Vui lòng chọn phương thức thanh toán.",
};

function fieldFromPath(path: PropertyKey[]): CheckoutFieldName | null {
  if (path[0] === "paymentMethod") return "paymentMethod";
  if (path[0] !== "customer" || typeof path[1] !== "string") return null;
  return path[1] in fieldMessages ? (path[1] as CheckoutFieldName) : null;
}

export function createCheckoutInput(
  values: CheckoutFormValues,
  items: readonly CartItem[],
): CheckoutInputResult {
  const parsed = checkoutSchema.safeParse({
    customer: {
      name: values.name,
      phone: values.phone,
      email: values.email,
      address: values.address,
      note: values.note,
    },
    paymentMethod: values.paymentMethod,
    items: selectCheckoutItems(items),
  });

  if (parsed.success) return { ok: true, input: parsed.data };

  const fieldErrors: Partial<Record<CheckoutFieldName, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = fieldFromPath(issue.path);
    if (field && !fieldErrors[field]) fieldErrors[field] = fieldMessages[field];
  }

  const itemIssues = parsed.error.issues.filter((issue) => issue.path[0] === "items");
  const exceedsItemLimit = parsed.error.issues.some(
    (issue) =>
      issue.path.length === 1 &&
      issue.path[0] === "items" &&
      issue.code === "too_big",
  );

  return {
    ok: false,
    summary: exceedsItemLimit
      ? `Giỏ hàng vượt quá giới hạn ${MAX_CHECKOUT_ITEMS} dòng sản phẩm. Vui lòng điều chỉnh giỏ hàng trước khi đặt hàng.`
      : itemIssues.length > 0
        ? "Giỏ hàng có sản phẩm chưa hợp lệ. Vui lòng điều chỉnh giỏ hàng trước khi đặt hàng."
        : "Thông tin đặt hàng chưa hợp lệ. Vui lòng kiểm tra các trường được đánh dấu.",
    fieldErrors,
    cartActionRecommended: itemIssues.length > 0,
  };
}
