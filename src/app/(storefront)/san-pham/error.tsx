"use client";

import Link from "next/link";

export default function ProductsError({ retry }: { retry: () => void }) {
  return (
    <section
      aria-labelledby="products-error-title"
      className="flex min-h-[calc(100svh-var(--header-height))] items-center bg-background py-16"
    >
      <div className="site-shell">
        <div className="relative overflow-hidden border-y border-border bg-surface px-6 py-20 text-center sm:px-10 sm:py-28 lg:py-36">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-1/2 w-px bg-border/60"
          />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center bg-surface px-4 sm:px-10">
            <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
            <p className="mt-5 text-xs font-bold tracking-[0.24em] text-foreground-muted uppercase">
              Cà phê DELIVN
            </p>
            <h1
              id="products-error-title"
              className="mt-4 text-2xl font-bold leading-tight tracking-[-0.025em] text-foreground uppercase sm:text-3xl lg:text-4xl"
            >
              KHÔNG THỂ TẢI SẢN PHẨM
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground-muted sm:text-lg">
              Đã có lỗi khi tải thông tin sản phẩm.
              <br />
              Vui lòng thử lại.
            </p>
            <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={() => retry()}
                className="inline-flex items-center justify-center bg-foreground px-7 py-3.5 text-xs font-bold tracking-[0.2em] text-background uppercase transition-colors duration-300 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
              >
                Thử lại
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center border border-foreground px-7 py-3.5 text-xs font-bold tracking-[0.2em] text-foreground uppercase transition-colors duration-300 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
