import type {
  CheckoutFieldName,
  CheckoutFormValues,
} from "@/lib/checkout/checkout-input";

type CheckoutFormProps = {
  values: CheckoutFormValues;
  fieldErrors: Partial<Record<CheckoutFieldName, string>>;
  isSubmitting: boolean;
  submitBlocked: boolean;
  onChange: (field: CheckoutFieldName, value: string) => void;
};

const inputClassName =
  "mt-2 min-h-12 w-full border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-foreground-muted/60 focus:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none";

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
  onChange,
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

        <label className="block text-sm font-semibold text-foreground sm:col-span-2">
          Địa chỉ nhận hàng <span aria-hidden="true">*</span>
          <textarea
            name="address"
            autoComplete="street-address"
            required
            minLength={5}
            maxLength={500}
            rows={4}
            value={values.address}
            aria-invalid={fieldErrors.address ? true : undefined}
            aria-describedby={fieldErrors.address ? "checkout-address-error" : undefined}
            onChange={(event) => onChange("address", event.target.value)}
            className={`${inputClassName} resize-y`}
          />
          <FieldError field="address" message={fieldErrors.address} />
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
          {[
            { value: "cod", label: "THANH TOÁN KHI NHẬN HÀNG" },
            { value: "bank_transfer", label: "CHUYỂN KHOẢN NGÂN HÀNG" },
          ].map((method) => (
            <label
              key={method.value}
              className="flex min-h-14 cursor-pointer items-center gap-3 border border-border bg-background px-4 py-3 text-xs font-bold tracking-[0.12em] text-foreground transition-colors has-[:checked]:border-foreground has-[:checked]:bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent motion-reduce:transition-none"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.value}
                required
                checked={values.paymentMethod === method.value}
                onChange={(event) => onChange("paymentMethod", event.target.value)}
                className="size-4 accent-[var(--accent)]"
              />
              {method.label}
            </label>
          ))}
        </div>
        <FieldError field="paymentMethod" message={fieldErrors.paymentMethod} />
      </fieldset>

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
