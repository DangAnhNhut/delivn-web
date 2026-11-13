import type {
  CheckoutFieldName,
  CheckoutFormValues,
} from "@/lib/checkout/checkout-input";
import { MAX_ADDRESS_DETAIL_LENGTH } from "@/lib/checkout/checkout-input";
import {
  VIETNAM_PROVINCES,
  getCommunesByProvinceCode,
} from "@/data/vietnam-administrative-units";
import { LEGAL_ROUTE_LINKS } from "@/data/legal";

import { AdministrativeCombobox } from "./AdministrativeCombobox";

type CheckoutFormProps = {
  values: CheckoutFormValues;
  fieldErrors: Partial<Record<CheckoutFieldName, string>>;
  isSubmitting: boolean;
  submitBlocked: boolean;
  termsAccepted: boolean;
  termsError?: string;
  onChange: (field: CheckoutFieldName, value: string) => void;
  onTermsChange: (accepted: boolean) => void;
};

const inputClassName =
  "mt-2 min-h-12 w-full border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-foreground-muted/60 focus:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none";

const paymentMethods = [
  {
    value: "cod",
    name: "Thanh toán khi nhận hàng",
    description: "Thanh toán khi đơn hàng được giao đến bạn.",
    disabled: false,
  },
  {
    value: "bank_transfer",
    name: "Chuyển khoản ngân hàng",
    description: "Chuyển khoản ngân hàng / QR sẽ được cập nhật.",
    disabled: true,
  },
] as const;

function FieldError({ field, message }: { field: CheckoutFieldName; message?: string }) {
  if (!message) return null;
  return (
    <p id={`checkout-${field}-error`} className="mt-2 text-sm text-accent">
      {message}
    </p>
  );
}

export function CheckoutForm({
  values,
  fieldErrors,
  isSubmitting,
  submitBlocked,
  termsAccepted,
  termsError,
  onChange,
  onTermsChange,
}: CheckoutFormProps) {
  return (
    <fieldset disabled={isSubmitting} className="min-w-0 disabled:opacity-90">
      <legend className="text-xs font-bold tracking-[0.22em] text-foreground uppercase">
        THÔNG TIN NHẬN HÀNG
      </legend>

      <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-foreground sm:col-span-2">
          Họ và tên <span aria-hidden="true">*</span>
          <input
            name="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            value={values.name}
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? "checkout-name-error" : undefined}
            onChange={(event) => onChange("name", event.target.value)}
            className={inputClassName}
          />
          <FieldError field="name" message={fieldErrors.name} />
        </label>

        <label className="block text-sm font-semibold text-foreground">
          Số điện thoại <span aria-hidden="true">*</span>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={values.phone}
            aria-invalid={fieldErrors.phone ? true : undefined}
            aria-describedby={fieldErrors.phone ? "checkout-phone-error" : undefined}
            onChange={(event) => onChange("phone", event.target.value)}
            className={inputClassName}
          />
          <FieldError field="phone" message={fieldErrors.phone} />
        </label>

        <label className="block text-sm font-semibold text-foreground">
          Email <span className="font-normal text-foreground-muted">(không bắt buộc)</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={values.email}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? "checkout-email-error" : undefined}
            onChange={(event) => onChange("email", event.target.value)}
            className={inputClassName}
          />
          <FieldError field="email" message={fieldErrors.email} />
        </label>

        <AdministrativeCombobox
          id="checkout-province"
          label="Tỉnh / thành phố"
          value={values.provinceCode}
          options={VIETNAM_PROVINCES}
          required
          placeholder="Tìm tỉnh / thành phố"
          error={fieldErrors.provinceCode}
          onValueChange={(code) => onChange("provinceCode", code)}
        />

        <AdministrativeCombobox
          id="checkout-commune"
          label="Phường / xã / đặc khu"
          value={values.communeCode}
          options={getCommunesByProvinceCode(values.provinceCode)}
          disabled={!values.provinceCode}
          required
          placeholder={values.provinceCode ? "Tìm phường / xã / đặc khu" : "Chọn tỉnh / thành phố trước"}
          error={fieldErrors.communeCode}
          onValueChange={(code) => onChange("communeCode", code)}
        />

        <label className="block text-sm font-semibold text-foreground sm:col-span-2">
          Địa chỉ chi tiết <span aria-hidden="true">*</span>
          <textarea
            name="addressDetail"
            autoComplete="street-address"
            required
            maxLength={MAX_ADDRESS_DETAIL_LENGTH}
            rows={4}
            value={values.addressDetail}
            aria-invalid={fieldErrors.addressDetail ? true : undefined}
            aria-describedby={
              fieldErrors.addressDetail ? "checkout-addressDetail-error" : undefined
            }
            onChange={(event) => onChange("addressDetail", event.target.value)}
            className={`${inputClassName} resize-y`}
          />
          <FieldError field="addressDetail" message={fieldErrors.addressDetail} />
        </label>

        <label className="block text-sm font-semibold text-foreground sm:col-span-2">
          Ghi chú <span className="font-normal text-foreground-muted">(không bắt buộc)</span>
          <textarea
            name="note"
            maxLength={1_000}
            rows={3}
            value={values.note}
            aria-invalid={fieldErrors.note ? true : undefined}
            aria-describedby={fieldErrors.note ? "checkout-note-error" : undefined}
            onChange={(event) => onChange("note", event.target.value)}
            className={`${inputClassName} resize-y`}
          />
          <FieldError field="note" message={fieldErrors.note} />
        </label>
      </div>

      <fieldset className="mt-10 border-t border-border pt-8">
        <legend className="pr-4 text-xs font-bold tracking-[0.22em] text-foreground uppercase">
          PHƯƠNG THỨC THANH TOÁN <span aria-hidden="true">*</span>
        </legend>
        <div
          role="radiogroup"
          aria-invalid={fieldErrors.paymentMethod ? true : undefined}
          aria-describedby={
            fieldErrors.paymentMethod ? "checkout-paymentMethod-error" : undefined
          }
          className="mt-5 grid gap-3 sm:grid-cols-2"
        >
          {paymentMethods.map((method) => {
            const isSelected = values.paymentMethod === method.value;
            const isDisabled = "disabled" in method && Boolean(method.disabled);
            return (
              <label
                key={method.value}
                className={`relative flex min-h-28 items-start gap-4 border px-5 py-5 transition-colors motion-reduce:transition-none ${
                  isDisabled
                    ? "cursor-not-allowed border-border bg-surface/50 opacity-60"
                    : isSelected
                      ? "cursor-pointer border-accent bg-cream focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent"
                      : "cursor-pointer border-border bg-background hover:border-foreground-muted focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  required
                  disabled={isDisabled}
                  checked={isSelected}
                  onChange={(event) => {
                    if (!isDisabled) onChange("paymentMethod", event.target.value);
                  }}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--accent)] disabled:cursor-not-allowed"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-xs font-bold tracking-[0.08em] text-foreground uppercase">
                      {method.name}
                    </span>
                    <span className="shrink-0 text-[9px] font-bold tracking-[0.14em] text-accent uppercase">
                      {isDisabled ? "ĐANG CẬP NHẬT" : isSelected ? "ĐÃ CHỌN" : "CHỌN"}
                    </span>
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-foreground-muted">
                    {method.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <FieldError field="paymentMethod" message={fieldErrors.paymentMethod} />

        {values.paymentMethod === "bank_transfer" ? (
          <section
            data-bank-transfer-placeholder
            aria-live="polite"
            className="mt-5 border border-border bg-cream px-5 py-6 sm:px-7"
          >
            <p className="text-xs font-bold tracking-[0.18em] text-foreground uppercase">
              THANH TOÁN CHUYỂN KHOẢN
            </p>
            <div className="mt-4 max-w-lg">
              <p className="text-sm font-semibold text-foreground">
                Chuyển khoản ngân hàng / QR sẽ được cập nhật.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-foreground-muted">
                Phương thức chuyển khoản ngân hàng đang được cập nhật hạ tầng tài khoản doanh nghiệp chính thức. Quý khách vui lòng chọn phương thức Thanh toán khi nhận hàng (COD).
              </p>
            </div>
          </section>
        ) : null}
      </fieldset>

      <div className="mt-8 border-y border-border bg-surface px-4 py-5 sm:px-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-foreground">
          <input
            type="checkbox"
            name="termsAccepted"
            required
            checked={termsAccepted}
            aria-invalid={termsError ? true : undefined}
            aria-describedby={termsError ? "checkout-terms-error" : "checkout-terms-help"}
            onChange={(event) => onTermsChange(event.target.checked)}
            className="mt-1 size-5 shrink-0 accent-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <span>
            Tôi đã đọc và đồng ý với{" "}
            {LEGAL_ROUTE_LINKS.slice(2).map((link, index, links) => (
              <span key={link.href}>
                <a
                  href={link.href}
                  className="font-semibold underline decoration-border underline-offset-4 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {link.label.toLocaleLowerCase("vi-VN")}
                </a>
                {index < links.length - 1 ? ", " : "."}
              </span>
            ))}
          </span>
        </label>
        <p id="checkout-terms-help" className="mt-3 pl-8 text-xs leading-relaxed text-foreground-muted">
          Việc đồng ý là điều kiện gửi yêu cầu đặt hàng trên website.
        </p>
        {termsError ? (
          <p id="checkout-terms-error" className="mt-3 pl-8 text-sm font-medium text-accent">
            {termsError}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || submitBlocked}
        className="mt-9 inline-flex min-h-12 w-full items-center justify-center border border-foreground bg-foreground px-6 py-3.5 text-xs font-bold tracking-[0.2em] text-background uppercase transition-colors duration-200 hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-foreground-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
      >
        {isSubmitting ? "ĐANG GỬI ĐƠN HÀNG" : "ĐẶT HÀNG"}
      </button>
    </fieldset>
  );
}
