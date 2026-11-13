import type { CheckoutInput, PaymentMethod } from "@/contracts";
import {
  checkoutSchema,
  MAX_CHECKOUT_ITEMS,
} from "@/contracts/checkout-schema";
import {
  VIETNAM_COMMUNES,
  getCommuneByCode,
  getProvinceByCode,
  isCommuneInProvince,
} from "@/data/vietnam-administrative-units";
import { selectCheckoutItems } from "@/lib/cart/cart-selectors";
import type { CartItem } from "@/lib/cart/cart-types";

export type CheckoutFormValues = {
  name: string;
  phone: string;
  email: string;
  provinceCode: string;
  communeCode: string;
  addressDetail: string;
  note: string;
  paymentMethod: PaymentMethod | "";
};

export type CheckoutFieldName =
  | "name"
  | "phone"
  | "email"
  | "provinceCode"
  | "communeCode"
  | "addressDetail"
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
  provinceCode: "Vui lòng chọn tỉnh / thành phố.",
  communeCode: "Vui lòng chọn phường / xã / đặc khu.",
  addressDetail: "Vui lòng nhập địa chỉ chi tiết.",
  note: "Ghi chú không được vượt quá 1.000 ký tự.",
  paymentMethod: "Vui lòng chọn phương thức thanh toán.",
};

function fieldFromPath(path: PropertyKey[]): CheckoutFieldName | null {
  if (path[0] === "paymentMethod") return "paymentMethod";
  if (path[0] !== "customer" || typeof path[1] !== "string") return null;
  if (path[1] === "address") return "addressDetail";
  return path[1] in fieldMessages ? (path[1] as CheckoutFieldName) : null;
}

const MAX_CUSTOMER_ADDRESS_LENGTH = 500;
const longestAdministrativeSuffixLength = VIETNAM_COMMUNES.reduce((longest, commune) => {
  const province = getProvinceByCode(commune.provinceCode);
  if (!province) return longest;
  return Math.max(longest, `, ${commune.name}, ${province.name}, Việt Nam`.length);
}, 0);

export const MAX_ADDRESS_DETAIL_LENGTH =
  MAX_CUSTOMER_ADDRESS_LENGTH - longestAdministrativeSuffixLength;

export function normalizeAddressDetail(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function composeCustomerAddress(
  addressDetail: string,
  communeName: string,
  provinceName: string,
): string {
  return `${addressDetail}, ${communeName}, ${provinceName}, Việt Nam`;
}

export function createCheckoutInput(
  values: CheckoutFormValues,
  items: readonly CartItem[],
): CheckoutInputResult {
  const province = getProvinceByCode(values.provinceCode);
  const commune = getCommuneByCode(values.communeCode);
  const addressDetail = normalizeAddressDetail(values.addressDetail);
  const structuredFieldErrors: Partial<Record<CheckoutFieldName, string>> = {};

  if (!province) structuredFieldErrors.provinceCode = fieldMessages.provinceCode;
  if (!commune || (province && !isCommuneInProvince(commune.code, province.code))) {
    structuredFieldErrors.communeCode = fieldMessages.communeCode;
  }
  if (!addressDetail || addressDetail.length > MAX_ADDRESS_DETAIL_LENGTH) {
    structuredFieldErrors.addressDetail = fieldMessages.addressDetail;
  }
  if (values.paymentMethod === "bank_transfer") {
    structuredFieldErrors.paymentMethod =
      "Phương thức chuyển khoản ngân hàng đang được cập nhật, vui lòng chọn Thanh toán khi nhận hàng (COD).";
  }

  const composedAddress =
    province && commune && isCommuneInProvince(commune.code, province.code) && addressDetail
      ? composeCustomerAddress(addressDetail, commune.name, province.name)
      : addressDetail;

  const parsed = checkoutSchema.safeParse({
    customer: {
      name: values.name,
      phone: values.phone,
      email: values.email,
      address: composedAddress,
      note: values.note,
    },
    paymentMethod: values.paymentMethod,
    items: selectCheckoutItems(items),
  });

  if (parsed.success && Object.keys(structuredFieldErrors).length === 0) {
    return { ok: true, input: parsed.data };
  }

  const fieldErrors: Partial<Record<CheckoutFieldName, string>> = {
    ...structuredFieldErrors,
  };
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = fieldFromPath(issue.path);
      if (field && !fieldErrors[field]) fieldErrors[field] = fieldMessages[field];
    }
  }

  const issues = parsed.success ? [] : parsed.error.issues;
  const itemIssues = issues.filter((issue) => issue.path[0] === "items");
  const exceedsItemLimit = issues.some(
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
