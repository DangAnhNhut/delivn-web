"use client";

/* eslint-disable @next/next/no-img-element -- Cart snapshots can contain runtime ProductDTO media URLs outside Next's static image allowlist. */
import Link from "next/link";

import { MAX_QUANTITY_PER_VARIANT } from "@/contracts";
import {
  selectCartItemCount,
  selectCartLineTotalVnd,
  selectCartSubtotalVnd,
} from "@/lib/cart/cart-selectors";
import {
  formatVnd,
  getCartProductDisplayImage,
} from "@/lib/storefront/product-presentation";

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
        className="min-h-[calc(100svh-var(--header-height))] bg-background py-12 sm:py-16"
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
        className="min-h-[calc(100svh-var(--header-height))] bg-background py-12 sm:py-16"
      >
        <div className="site-shell">
          <div className="relative overflow-hidden border-y border-border bg-surface px-6 py-14 text-center sm:px-10 sm:py-20">
            <span className="mx-auto block size-2 rounded-full bg-accent" aria-hidden="true" />
            <p className="mt-5 text-xs font-bold tracking-[0.24em] text-foreground-muted uppercase">
              Giỏ hàng
            </p>
            <h1
              id="empty-cart-title"
              className="mx-auto mt-4 max-w-3xl text-2xl font-bold leading-tight tracking-[-0.035em] text-foreground uppercase sm:text-4xl"
            >
              GIỎ HÀNG CỦA BẠN ĐANG TRỐNG
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-foreground-muted sm:text-lg">
              Chọn cà phê DELIVN phù hợp để bắt đầu đơn hàng.
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
  const itemCount = selectCartItemCount(items);

  return (
    <article className="overflow-x-clip bg-background py-12 sm:py-16 lg:py-20">
      <div className="site-shell">
        <header className="border-b border-border pb-8 sm:pb-10">
          <p className="text-xs font-bold tracking-[0.24em] text-accent uppercase">
            GIỎ HÀNG
          </p>
          <h1 className="mt-3 max-w-4xl break-words text-[clamp(2.25rem,4.5vw,4.5rem)] font-bold leading-[0.98] tracking-[-0.045em] text-foreground uppercase">
            LỰA CHỌN CỦA BẠN
          </h1>
          <p className="mt-4 text-base leading-7 text-foreground-muted sm:text-lg">
            {itemCount} sản phẩm đang chờ bạn hoàn tất đơn hàng.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:mt-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <section aria-label="Sản phẩm trong giỏ hàng" className="lg:col-span-8">
            <div className="divide-y divide-border border-y border-border">
              {items.map((item) => {
                const description = `${item.productName} – ${item.variantLabel}`;
                const displayImage = getCartProductDisplayImage(item);

                return (
                  <article
                    key={item.variantId}
                    className="grid grid-cols-1 gap-6 py-7 sm:grid-cols-[16rem_minmax(0,1fr)] sm:gap-8 lg:py-8"
                  >
                    <div className="aspect-[5/4] overflow-hidden bg-surface">
                      {displayImage ? (
                        <img
                          src={displayImage.url}
                          alt={displayImage.alt}
                          width={520}
                          height={390}
                          className="h-full w-full object-contain p-2 sm:p-3"
                        />
                      ) : (
                        <div className="flex h-full min-h-44 items-end bg-[#D8C4A3] p-5 text-[10px] font-bold tracking-[0.16em] text-foreground/65 uppercase">
                          HÌNH ẢNH ĐANG CẬP NHẬT
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-col justify-between gap-6">
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

                      <div className="flex flex-wrap items-end justify-between gap-5 border-t border-border pt-5">
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
                          <p className="text-[10px] font-bold tracking-[0.16em] text-foreground-muted uppercase">
                            Thành tiền
                          </p>
                          <p className="mt-1 text-lg font-semibold text-foreground">
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
            <div className="border-y border-border bg-cream px-6 py-8 sm:px-8 lg:sticky lg:top-[calc(var(--header-height)+2.5rem)]">
              <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-accent uppercase">
                <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
                CÀ PHÊ DELIVN
              </p>
              <h2 className="mt-3 text-xl font-bold tracking-[-0.025em] text-foreground uppercase sm:text-2xl">
                TÓM TẮT ĐƠN HÀNG
              </h2>
              <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-border pt-5">
                <p className="text-xs font-bold tracking-[0.16em] text-foreground-muted uppercase">
                  TẠM TÍNH
                </p>
                <p className="text-xl font-semibold text-foreground sm:text-2xl">
                  {formatVnd(subtotalVnd)}
                </p>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-foreground-muted">
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
