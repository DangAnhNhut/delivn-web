"use client";

/* eslint-disable @next/next/no-img-element -- Cart snapshots can contain runtime ProductDTO media URLs outside Next's static image allowlist. */
import Link from "next/link";

import { MAX_QUANTITY_PER_VARIANT } from "@/contracts";
import {
  selectCartLineTotalVnd,
  selectCartSubtotalVnd,
} from "@/lib/cart/cart-selectors";
import { formatVnd } from "@/lib/storefront/product-presentation";

import { useCart } from "./CartProvider";

export function CartPage() {
  const {
    items,
    isHydrated,
    increment,
    decrement,
    removeItem,
    clearCart,
  } = useCart();

  if (!isHydrated) {
    return (
      <section
        aria-busy="true"
        aria-labelledby="cart-loading-title"
        className="min-h-[calc(100svh-var(--header-height))] bg-background py-16 sm:py-24"
      >
        <div className="site-shell">
          <p className="text-xs font-bold tracking-[0.24em] text-foreground-muted uppercase">
            Giỏ hàng
          </p>
          <h1
            id="cart-loading-title"
            className="mt-4 text-2xl font-bold tracking-[-0.03em] text-foreground uppercase sm:text-4xl"
          >
            ĐANG TẢI GIỎ HÀNG
          </h1>
          <div className="mt-10 h-px w-full bg-border" aria-hidden="true" />
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section
        aria-labelledby="empty-cart-title"
        className="flex min-h-[calc(100svh-var(--header-height))] items-center bg-background py-16"
      >
        <div className="site-shell">
          <div className="relative overflow-hidden border-y border-border bg-surface px-6 py-20 text-center sm:px-10 sm:py-28 lg:py-36">
            <span className="mx-auto block size-2 rounded-full bg-accent" aria-hidden="true" />
            <p className="mt-5 text-xs font-bold tracking-[0.24em] text-foreground-muted uppercase">
              Giỏ hàng
            </p>
            <h1
              id="empty-cart-title"
              className="mx-auto mt-4 max-w-3xl text-2xl font-bold leading-tight tracking-[-0.035em] text-foreground uppercase sm:text-4xl lg:text-5xl"
            >
              GIỎ HÀNG CỦA BẠN ĐANG TRỐNG
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-foreground-muted sm:text-lg">
              Chọn dòng cà phê phù hợp để bắt đầu giỏ hàng của bạn.
            </p>
            <Link
              href="/san-pham"
              className="mt-8 inline-flex items-center justify-center gap-3 border border-foreground px-7 py-3.5 text-xs font-bold tracking-[0.2em] text-foreground uppercase transition-colors duration-300 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
            >
              KHÁM PHÁ SẢN PHẨM <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const subtotalVnd = selectCartSubtotalVnd(items);

  return (
    <article className="overflow-x-clip bg-background pb-20 pt-14 sm:pb-24 sm:pt-20 lg:pb-32 lg:pt-24">
      <div className="site-shell">
        <header className="border-b border-border pb-10 sm:pb-14">
          <p className="text-xs font-bold tracking-[0.24em] text-foreground-muted uppercase">
            GIỎ HÀNG
          </p>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.8rem,7vw,7rem)] font-bold leading-[0.92] tracking-[-0.055em] text-foreground uppercase">
            LỰA CHỌN CỦA BẠN.
          </h1>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16 xl:gap-24">
          <section aria-label="Sản phẩm trong giỏ hàng" className="lg:col-span-8">
            <div className="divide-y divide-border border-y border-border">
              {items.map((item) => {
                const description = `${item.productName} – ${item.variantLabel}`;

                return (
                  <article
                    key={item.variantId}
                    className="grid grid-cols-1 gap-6 py-8 sm:grid-cols-[11rem_1fr] sm:gap-8 lg:grid-cols-[13rem_1fr] lg:py-10"
                  >
                    <div className="aspect-square overflow-hidden bg-surface">
                      {item.image ? (
                        <img
                          src={item.image.url}
                          alt={item.image.alt}
                          width={520}
                          height={520}
                          className="h-full w-full object-contain p-5 sm:p-6"
                        />
                      ) : (
                        <div className="flex h-full min-h-44 items-end bg-[#D8C4A3] p-5 text-[10px] font-bold tracking-[0.16em] text-foreground/65 uppercase">
                          HÌNH ẢNH ĐANG CẬP NHẬT
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-col justify-between gap-7">
                      <div>
                        <Link
                          href={`/san-pham/${item.productSlug}`}
                          className="text-xl font-bold leading-tight tracking-[-0.025em] text-foreground uppercase transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none sm:text-2xl"
                        >
                          {item.productName}
                        </Link>
                        <p className="mt-2 text-xs font-bold tracking-[0.16em] text-foreground-muted uppercase">
                          {item.variantLabel}
                        </p>
                        <p className="mt-4 text-sm text-foreground-muted">
                          Đơn giá: {formatVnd(item.unitPriceVndSnapshot)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-end justify-between gap-5">
                        <div>
                          <p className="mb-2 text-[10px] font-bold tracking-[0.16em] text-foreground-muted uppercase">
                            Số lượng
                          </p>
                          <div className="inline-flex min-h-11 items-stretch border border-border">
                            <button
                              type="button"
                              aria-label={`Giảm số lượng ${description}`}
                              disabled={!isHydrated || item.quantity <= 1}
                              onClick={() => decrement(item.variantId)}
                              className="min-w-11 px-3 text-lg text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:text-foreground-muted/40 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none"
                            >
                              <span aria-hidden="true">−</span>
                            </button>
                            <output
                              data-quantity
                              aria-label={`Số lượng ${description}`}
                              className="flex min-w-12 items-center justify-center border-x border-border px-3 text-sm font-semibold"
                            >
                              {item.quantity}
                            </output>
                            <button
                              type="button"
                              aria-label={`Tăng số lượng ${description}`}
                              disabled={
                                !isHydrated || item.quantity >= MAX_QUANTITY_PER_VARIANT
                              }
                              onClick={() => increment(item.variantId)}
                              className="min-w-11 px-3 text-lg text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:text-foreground-muted/40 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none"
                            >
                              <span aria-hidden="true">+</span>
                            </button>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-lg font-semibold text-foreground">
                            {formatVnd(selectCartLineTotalVnd(item))}
                          </p>
                          <button
                            type="button"
                            aria-label={`Xóa ${description} khỏi giỏ hàng`}
                            onClick={() => removeItem(item.variantId)}
                            className="mt-1 inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-[10px] font-bold tracking-[0.16em] text-foreground-muted underline decoration-border underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
                          >
                            XÓA
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <button
              type="button"
              aria-label="Xóa giỏ hàng"
              onClick={clearCart}
              className="mt-5 inline-flex min-h-11 items-center px-2 text-[10px] font-bold tracking-[0.18em] text-foreground-muted underline decoration-border underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
            >
              XÓA GIỎ HÀNG
            </button>
          </section>

          <aside className="lg:col-span-4">
            <div className="border-y border-border bg-surface px-6 py-8 sm:px-8 lg:sticky lg:top-[calc(var(--header-height)+2.5rem)]">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">
                  TẠM TÍNH
                </h2>
                <p className="text-xl font-semibold text-foreground sm:text-2xl">
                  {formatVnd(subtotalVnd)}
                </p>
              </div>
              <p className="mt-6 border-t border-border pt-5 text-sm leading-relaxed text-foreground-muted">
                Giá và tình trạng sản phẩm sẽ được xác nhận lại khi thanh toán.
              </p>
              <Link
                href="/thanh-toan"
                className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-3 border border-foreground bg-foreground px-5 py-3.5 text-center text-[11px] font-bold tracking-[0.17em] text-background uppercase transition-colors duration-300 hover:border-accent hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
              >
                TIẾP TỤC THANH TOÁN <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/san-pham"
                className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-3 border border-foreground px-5 py-3.5 text-center text-[11px] font-bold tracking-[0.17em] text-foreground uppercase transition-colors duration-300 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
              >
                TIẾP TỤC CHỌN CÀ PHÊ <span aria-hidden="true">→</span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
