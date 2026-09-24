/* eslint-disable @next/next/no-img-element -- ProductDTO media can use runtime URLs that are not known to Next's static image allowlist. */
import Link from "next/link";

import type { ProductCategory, ProductDTO } from "@/contracts";
import {
  formatVnd,
  getProductAvailability,
  getProductPrice,
  type ProductAvailability,
} from "@/lib/storefront/product-presentation";

const categoryLabels: Record<ProductCategory, string> = {
  espresso: "CÀ PHÊ HẠT RANG ESPRESSO",
  rang_xay: "CÀ PHÊ RANG XAY",
};

const availabilityLabels: Record<ProductAvailability, string> = {
  available: "CÒN HÀNG",
  unavailable: "TẠM HẾT HÀNG",
  pending: "THÔNG TIN ĐANG CẬP NHẬT",
};

interface ProductCatalogProps {
  products: readonly ProductDTO[];
}

function ProductVisual({ product, index }: { product: ProductDTO; index: number }) {
  const primaryMedia = product.media[0];

  return (
    <div
      className={`relative aspect-[4/5] min-h-[360px] overflow-hidden sm:min-h-[480px] lg:min-h-[620px] ${
        product.category === "espresso"
          ? "bg-[#242321]"
          : "bg-[#D8C4A3]"
      }`}
    >
      {primaryMedia ? (
        <img
          src={primaryMedia.url}
          alt={primaryMedia.alt}
          width={1200}
          height={1500}
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-contain p-7 transition-transform duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:transform-none sm:p-10 lg:p-14"
        />
      ) : (
        <div className="flex h-full flex-col justify-between p-7 sm:p-10 lg:p-14">
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.24em] uppercase opacity-70">
            <span>DELIVN</span>
            <span>{String(index + 1).padStart(2, "0")}</span>
          </div>
          <div aria-hidden="true" className="self-center text-[clamp(4rem,9vw,8rem)] font-bold leading-none tracking-[-0.08em] opacity-10">
            D
          </div>
          <p className="max-w-[15rem] text-xs font-medium leading-relaxed tracking-[0.18em] uppercase opacity-70">
            Hình ảnh sản phẩm đang được cập nhật
          </p>
        </div>
      )}
    </div>
  );
}

function ProductBlock({ product, index }: { product: ProductDTO; index: number }) {
  const price = getProductPrice(product.variants);
  const availability = getProductAvailability(product.variants);
  const visualOrder = index % 2 === 0 ? "lg:order-1" : "lg:order-2";
  const contentOrder = index % 2 === 0 ? "lg:order-2" : "lg:order-1";

  return (
    <article className="group grid grid-cols-1 border-t border-border lg:grid-cols-2">
      <div className={visualOrder}>
        <ProductVisual product={product} index={index} />
      </div>

      <div
        className={`flex items-center px-0 py-10 sm:py-14 lg:px-[clamp(3rem,6vw,7rem)] lg:py-20 ${contentOrder}`}
      >
        <div className="w-full max-w-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <p className="text-[11px] font-bold tracking-[0.22em] text-foreground-muted uppercase">
              {String(index + 1).padStart(2, "0")} / {categoryLabels[product.category]}
            </p>
            <p
              className={`text-[11px] font-bold tracking-[0.18em] uppercase ${
                availability === "available" ? "text-foreground" : "text-foreground-muted"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mr-2 inline-block size-1.5 rounded-full align-middle ${
                  availability === "available" ? "bg-accent" : "bg-foreground-muted/50"
                }`}
              />
              {availabilityLabels[availability]}
            </p>
          </div>

          <h3 className="mt-8 text-3xl font-bold leading-[1.08] tracking-[-0.035em] text-foreground uppercase sm:text-4xl xl:text-5xl">
            {product.name}
          </h3>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground-muted sm:text-lg">
            {product.description}
          </p>

          {product.variants.length > 0 && (
            <div className="mt-8">
              <p className="text-[11px] font-bold tracking-[0.2em] text-foreground-muted uppercase">
                Quy cách
              </p>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Các phiên bản sản phẩm">
                {product.variants.map((variant) => (
                  <li
                    key={variant.id}
                    className="border border-border px-4 py-2 text-sm font-semibold text-foreground"
                  >
                    {variant.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-9 flex flex-col items-start justify-between gap-6 border-t border-border pt-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-foreground-muted uppercase">
                Giá bán
              </p>
              {price ? (
                <p className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {price.showFrom ? "Từ " : ""}
                  {formatVnd(price.priceVnd)}
                </p>
              ) : (
                <p className="mt-2 text-sm text-foreground-muted">Đang cập nhật</p>
              )}
            </div>

            <Link
              href={`/san-pham/${product.slug}`}
              className="group/link inline-flex w-full items-center justify-center gap-3 bg-foreground px-6 py-4 text-xs font-bold tracking-[0.2em] text-background uppercase transition-colors duration-300 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none sm:w-auto"
            >
              Xem chi tiết
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover/link:translate-x-1 motion-reduce:transition-none motion-reduce:transform-none"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductCatalog({ products }: ProductCatalogProps) {
  return (
    <section
      aria-labelledby="product-selection-title"
      className="bg-background pb-20 sm:pb-24 lg:pb-32"
    >
      <div className="site-shell">
        <div className="flex flex-col justify-between gap-4 py-10 sm:flex-row sm:items-end sm:py-14 lg:py-16">
          <div>
            <p className="text-xs font-bold tracking-[0.24em] text-accent uppercase">
              Bộ sưu tập
            </p>
            <h2
              id="product-selection-title"
              className="mt-3 text-2xl font-bold tracking-[-0.025em] text-foreground uppercase sm:text-3xl"
            >
              Tuyển chọn của DELIVN
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-foreground-muted sm:text-right">
            Khám phá các dòng cà phê hiện có và lựa chọn quy cách phù hợp với bạn.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="relative overflow-hidden border-y border-border bg-surface px-6 py-20 text-center sm:px-10 sm:py-28 lg:py-36">
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-1/2 w-px bg-border/60"
            />
            <div className="relative mx-auto flex max-w-2xl flex-col items-center bg-surface px-4 sm:px-10">
              <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
              <h3 className="mt-6 text-2xl font-bold leading-tight tracking-[-0.025em] text-foreground uppercase sm:text-3xl lg:text-4xl">
                SẢN PHẨM ĐANG ĐƯỢC CẬP NHẬT
              </h3>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground-muted sm:text-lg">
                DELIVN đang hoàn thiện thông tin sản phẩm.
                <br />
                Vui lòng quay lại sau.
              </p>
              <Link
                href="/"
                className="mt-8 inline-flex items-center gap-3 border border-foreground px-7 py-3.5 text-xs font-bold tracking-[0.2em] text-foreground uppercase transition-colors duration-300 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
              >
                Về trang chủ <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {products.map((product, index) => (
              <ProductBlock key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
