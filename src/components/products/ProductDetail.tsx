/* eslint-disable @next/next/no-img-element -- ProductDTO media can use runtime URLs that are not known to Next's static image allowlist. */
import Link from "next/link";

import type {
  ProductCategory,
  ProductDTO,
  ProductMediaDTO,
} from "@/contracts";

import { ProductPurchasePanel } from "./ProductPurchasePanel";

const categoryLabels: Record<ProductCategory, string> = {
  espresso: "CÀ PHÊ HẠT RANG ESPRESSO",
  rang_xay: "CÀ PHÊ RANG XAY",
};

function ProductImage({
  media,
  eager = false,
}: {
  media: ProductMediaDTO;
  eager?: boolean;
}) {
  return (
    <img
      src={media.url}
      alt={media.alt}
      width={1200}
      height={1500}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className="h-full w-full object-contain p-7 transition-transform duration-500 ease-out group-hover/media:scale-[1.02] motion-reduce:transition-none motion-reduce:transform-none sm:p-10 lg:p-14"
    />
  );
}

function ProductMedia({ product }: { product: ProductDTO }) {
  if (product.media.length === 0) {
    return (
      <div
        className={`flex aspect-[4/5] min-h-[420px] flex-col justify-between p-7 sm:min-h-[560px] sm:p-10 lg:min-h-[680px] lg:p-14 ${
          product.category === "espresso"
            ? "bg-[#242321] text-background"
            : "bg-[#D8C4A3] text-foreground"
        }`}
      >
        <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.24em] uppercase opacity-70">
          <span>DELIVN</span>
          <span>PRODUCT / 01</span>
        </div>
        <span
          aria-hidden="true"
          className="self-center text-[clamp(6rem,15vw,12rem)] font-bold leading-none tracking-[-0.09em] opacity-10"
        >
          D
        </span>
        <p className="max-w-xs text-xs font-semibold leading-relaxed tracking-[0.18em] uppercase opacity-70">
          HÌNH ẢNH SẢN PHẨM ĐANG ĐƯỢC CẬP NHẬT
        </p>
      </div>
    );
  }

  const primaryMedia = product.media[0]!;
  const supportingMedia = product.media.slice(1);

  return (
    <div>
      <div className="group/media relative aspect-[4/5] min-h-[420px] overflow-hidden bg-surface sm:min-h-[560px] lg:min-h-[680px]">
        <ProductImage media={primaryMedia} eager />
      </div>

      {supportingMedia.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {supportingMedia.map((media) => (
            <div
              key={media.id}
              className="group/media relative aspect-square overflow-hidden bg-surface"
            >
              <ProductImage media={media} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetail({ product }: { product: ProductDTO }) {
  return (
    <article className="overflow-x-clip bg-background pb-20 sm:pb-24 lg:pb-32">
      <div className="site-shell">
        <nav aria-label="Điều hướng sản phẩm" className="py-6 sm:py-8">
          <Link
            href="/san-pham"
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-foreground-muted uppercase transition-colors duration-200 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
          >
            <span aria-hidden="true">←</span>
            Quay lại sản phẩm
          </Link>
        </nav>

        <div className="grid grid-cols-1 gap-10 border-t border-border pt-8 sm:gap-14 sm:pt-10 lg:grid-cols-12 lg:gap-14 lg:pt-14 xl:gap-20">
          <div className="lg:col-span-7">
            <ProductMedia product={product} />
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--header-height)+2.5rem)]">
              <div className="flex items-center gap-3">
                <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
                <p className="text-[11px] font-bold tracking-[0.22em] text-foreground-muted uppercase">
                  {categoryLabels[product.category]}
                </p>
              </div>

              <h1 className="mt-5 max-w-2xl text-[clamp(2.4rem,5vw,5.75rem)] font-bold leading-[0.98] tracking-[-0.05em] text-foreground uppercase">
                {product.name}
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground-muted sm:text-lg">
                {product.description}
              </p>

              <div className="mt-8 sm:mt-10">
                <ProductPurchasePanel
                  productName={product.name}
                  variants={product.variants}
                />
              </div>

              <div className="mt-8 flex items-center justify-between gap-4 border-b border-border pb-4 text-[10px] font-semibold tracking-[0.16em] text-foreground-muted uppercase sm:text-[11px]">
                <span>DELIVN / PRODUCT</span>
                <span>{product.shortName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex justify-center border-t border-border pt-10 sm:mt-20 sm:pt-12 lg:mt-28">
          <Link
            href="/san-pham"
            className="inline-flex w-full items-center justify-center gap-3 border border-foreground px-8 py-4 text-xs font-bold tracking-[0.2em] text-foreground uppercase transition-colors duration-300 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none sm:w-auto"
          >
            Xem tất cả sản phẩm <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProductNotFoundState() {
  return (
    <section
      aria-labelledby="product-not-found-title"
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
              id="product-not-found-title"
              className="mt-4 text-2xl font-bold leading-tight tracking-[-0.025em] text-foreground uppercase sm:text-3xl lg:text-4xl"
            >
              KHÔNG TÌM THẤY SẢN PHẨM
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground-muted sm:text-lg">
              Sản phẩm bạn đang tìm hiện không có trong danh mục DELIVN.
            </p>
            <Link
              href="/san-pham"
              className="mt-8 inline-flex items-center justify-center gap-3 border border-foreground px-7 py-3.5 text-xs font-bold tracking-[0.2em] text-foreground uppercase transition-colors duration-300 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
            >
              Về trang sản phẩm <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
