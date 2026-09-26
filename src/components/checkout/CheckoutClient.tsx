"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { useCart } from "@/components/cart/CartProvider";
import type { OrderDTO, PaymentMethod } from "@/contracts";
import { presentCheckoutError } from "@/lib/checkout/checkout-errors";
import { postCheckout } from "@/lib/checkout/checkout-http";
import {
  createCheckoutInput,
  type CheckoutFieldName,
  type CheckoutFormValues,
} from "@/lib/checkout/checkout-input";
import type { CartItem } from "@/lib/cart/cart-types";
import { formatVnd } from "@/lib/storefront/product-presentation";

import { CheckoutForm } from "./CheckoutForm";
import { CheckoutSummary } from "./CheckoutSummary";

type SubmissionState =
  | { status: "idle" }
  | {
      status: "submitting";
      submittedItems: CartItem[];
    }
  | {
      status: "error";
      message: string;
      cartActionRecommended: boolean;
    }
  | {
      status: "uncertain";
      message: string;
      submittedItems: CartItem[];
    }
  | { status: "success"; order: OrderDTO };

const initialValues: CheckoutFormValues = {
  name: "",
  phone: "",
  email: "",
  address: "",
  note: "",
  paymentMethod: "",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cod: "Thanh toán khi nhận hàng",
  bank_transfer: "Chuyển khoản ngân hàng",
};

const paymentStatusLabels: Record<OrderDTO["paymentStatus"], string> = {
  unpaid: "Chưa thanh toán",
  pending: "Đang chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán chưa thành công",
  refunded: "Đã hoàn tiền",
};

function cloneCartItems(items: readonly CartItem[]): CartItem[] {
  return items.map((item) => ({
    ...item,
    image: item.image ? { ...item.image } : null,
  }));
}

export function CheckoutClient() {
  const { items, isHydrated, reconcileSubmittedItems } = useCart();
  const [values, setValues] = useState<CheckoutFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<CheckoutFieldName, string>>
  >({});
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });
  const submittingRef = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (submission.status === "error" || submission.status === "uncertain") {
      errorRef.current?.focus();
    }
    if (submission.status === "success") successRef.current?.focus();
  }, [submission]);

  const updateField = (field: CheckoutFieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isHydrated || items.length === 0 || submittingRef.current) return;

    submittingRef.current = true;
    setFieldErrors({});

    const inputResult = createCheckoutInput(values, items);
    if (!inputResult.ok) {
      setFieldErrors(inputResult.fieldErrors);
      setSubmission({
        status: "error",
        message: inputResult.summary,
        cartActionRecommended: inputResult.cartActionRecommended,
      });
      submittingRef.current = false;
      return;
    }

    const submittedItems = cloneCartItems(items);
    setSubmission({ status: "submitting", submittedItems });

    const result = await postCheckout(inputResult.input);
    if (result.ok) {
      reconcileSubmittedItems(inputResult.input.items);
      setSubmission({ status: "success", order: result.order });
      return;
    }

    const presentation = presentCheckoutError(result);
    if (result.kind === "uncertain") {
      setSubmission({
        status: "uncertain",
        message: presentation.message,
        submittedItems,
      });
      return;
    }

    setSubmission({
      status: "error",
      message: presentation.message,
      cartActionRecommended: presentation.cartActionRecommended,
    });
    submittingRef.current = false;
  };

  if (!isHydrated) {
    return (
      <section
        aria-busy="true"
        aria-labelledby="checkout-loading-title"
        className="min-h-[calc(100svh-var(--header-height))] bg-background py-16 sm:py-24"
      >
        <div className="site-shell">
          <p className="text-xs font-bold tracking-[0.24em] text-foreground-muted uppercase">
            THANH TOÁN
          </p>
          <h1
            id="checkout-loading-title"
            className="mt-4 text-2xl font-bold tracking-[-0.03em] text-foreground uppercase sm:text-4xl"
          >
            ĐANG TẢI THÔNG TIN THANH TOÁN
          </h1>
          <div className="mt-10 h-px w-full bg-border" aria-hidden="true" />
        </div>
      </section>
    );
  }

  if (submission.status === "success") {
    const { order } = submission;
    return (
      <section className="flex min-h-[calc(100svh-var(--header-height))] items-center bg-background py-16 sm:py-24">
        <div className="site-shell">
          <div className="border-y border-border bg-surface px-6 py-16 text-center sm:px-10 sm:py-24">
            <p className="text-xs font-bold tracking-[0.24em] text-foreground-muted uppercase">
              XÁC NHẬN ĐƠN HÀNG
            </p>
            <h1
              ref={successRef}
              tabIndex={-1}
              className="mx-auto mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-[-0.04em] text-foreground uppercase outline-none sm:text-5xl"
            >
              ĐƠN HÀNG ĐÃ ĐƯỢC TIẾP NHẬN
            </h1>
            <dl className="mx-auto mt-9 grid max-w-2xl gap-5 border-y border-border py-7 text-left sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-bold tracking-[0.18em] text-foreground-muted uppercase">
                  MÃ ĐƠN HÀNG
                </dt>
                <dd className="mt-2 break-words text-base font-semibold text-foreground">
                  {order.orderNumber}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold tracking-[0.18em] text-foreground-muted uppercase">
                  TỔNG XÁC NHẬN
                </dt>
                <dd className="mt-2 text-xl font-semibold text-foreground">
                  {formatVnd(order.totalVnd)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold tracking-[0.18em] text-foreground-muted uppercase">
                  THANH TOÁN
                </dt>
                <dd className="mt-2 text-sm text-foreground">
                  {paymentMethodLabels[order.paymentMethod]}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold tracking-[0.18em] text-foreground-muted uppercase">
                  TRẠNG THÁI THANH TOÁN
                </dt>
                <dd className="mt-2 text-sm text-foreground">
                  {paymentStatusLabels[order.paymentStatus]}
                </dd>
              </div>
            </dl>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/san-pham"
                className="inline-flex min-h-12 items-center justify-center border border-foreground bg-foreground px-7 py-3 text-xs font-bold tracking-[0.18em] text-background uppercase transition-colors hover:border-accent hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
              >
                TIẾP TỤC XEM SẢN PHẨM
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center border border-foreground px-7 py-3 text-xs font-bold tracking-[0.18em] text-foreground uppercase transition-colors hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
              >
                VỀ TRANG CHỦ
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const keepsSubmittedView =
    submission.status === "submitting" || submission.status === "uncertain";
  if (items.length === 0 && !keepsSubmittedView) {
    return (
      <section className="flex min-h-[calc(100svh-var(--header-height))] items-center bg-background py-16">
        <div className="site-shell">
          <div className="border-y border-border bg-surface px-6 py-20 text-center sm:px-10 sm:py-28">
            <p className="text-xs font-bold tracking-[0.24em] text-foreground-muted uppercase">
              THANH TOÁN
            </p>
            <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-[-0.04em] text-foreground uppercase sm:text-5xl">
              GIỎ HÀNG CỦA BẠN ĐANG TRỐNG
            </h1>
            <Link
              href="/san-pham"
              className="mt-8 inline-flex min-h-12 items-center justify-center border border-foreground px-7 py-3.5 text-xs font-bold tracking-[0.18em] text-foreground uppercase transition-colors hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
            >
              KHÁM PHÁ SẢN PHẨM
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const summaryItems = keepsSubmittedView ? submission.submittedItems : items;
  const isSubmitting = submission.status === "submitting";
  const isUncertain = submission.status === "uncertain";
  const errorMessage =
    submission.status === "error" || submission.status === "uncertain"
      ? submission.message
      : null;

  return (
    <article className="overflow-x-clip bg-background pb-20 pt-14 sm:pb-24 sm:pt-20 lg:pb-32 lg:pt-24">
      <div className="site-shell">
        <header className="border-b border-border pb-10 sm:pb-14">
          <p className="text-xs font-bold tracking-[0.24em] text-foreground-muted uppercase">
            THANH TOÁN
          </p>
          <h1 className="mt-4 max-w-5xl text-[clamp(2.7rem,6.7vw,6.8rem)] font-bold leading-[0.92] tracking-[-0.055em] text-foreground uppercase">
            HOÀN TẤT ĐƠN HÀNG.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground-muted sm:text-lg">
            Thông tin sản phẩm, giá và khả năng đáp ứng sẽ được máy chủ xác nhận khi bạn đặt hàng.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16 xl:gap-24">
          <section className="lg:col-span-7">
            {errorMessage ? (
              <div
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                aria-live="assertive"
                data-checkout-error
                className="mb-8 border-l-4 border-accent bg-surface px-5 py-5 outline-none"
              >
                <h2 className="text-sm font-bold tracking-[0.12em] text-foreground uppercase">
                  {isUncertain ? "CHƯA THỂ XÁC NHẬN ĐƠN HÀNG" : "VUI LÒNG KIỂM TRA LẠI"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  {errorMessage}
                </p>
                {submission.status === "error" && submission.cartActionRecommended ? (
                  <Link
                    href="/gio-hang"
                    className="mt-4 inline-flex min-h-11 items-center text-xs font-bold tracking-[0.16em] text-foreground underline decoration-border underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    QUAY LẠI GIỎ HÀNG
                  </Link>
                ) : null}
              </div>
            ) : null}

            <form noValidate onSubmit={handleSubmit} aria-busy={isSubmitting}>
              <CheckoutForm
                values={values}
                fieldErrors={fieldErrors}
                isSubmitting={isSubmitting}
                submitBlocked={isUncertain}
                onChange={updateField}
              />
            </form>
          </section>
          <div className="lg:col-span-5">
            <CheckoutSummary items={summaryItems} />
          </div>
        </div>
      </div>
    </article>
  );
}
