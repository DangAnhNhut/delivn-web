"use client";
/* eslint-disable @next/next/no-img-element -- ProductDTO media can use runtime URLs that are not known to Next's static image allowlist. */

import { useState } from "react";
import Link from "next/link";

import type { ProductDTO, ProductVariantDTO } from "@/contracts";
import {
  COFFEE_LINE_DETAILS,
  SHARED_COFFEE_SPECS,
} from "@/data/content/products";
import {
  formatVnd,
  getDefaultProductVariant,
  getProductBuyerLabel,
  getProductDetailImage,
  getProductDisplayName,
} from "@/lib/storefront/product-presentation";

import { ProductPurchasePanel } from "./ProductPurchasePanel";

interface ProductDetailProps {
  product: ProductDTO;
  initialVariantId?: string | null;
}

export function ProductDetail({
  product,
  initialVariantId,
}: ProductDetailProps) {
  const defaultVariant = getDefaultProductVariant(product.variants);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    initialVariantId ?? defaultVariant?.id ?? null,
  );

  const selectedVariant: ProductVariantDTO | null =
    product.variants.find((v) => v.id === selectedVariantId) ?? defaultVariant;

  const displayName = getProductDisplayName(product);
  const buyerLabel = getProductBuyerLabel(product.category);
  const lineDetail = COFFEE_LINE_DETAILS[product.category];

  const handleSelectVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    const chosen = product.variants.find((v) => v.id === variantId);
    if (chosen && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("size", String(chosen.weightGrams));
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Resolve primary gallery image from detail variant map (preserving explicit empty-media test fixtures)
  const hasMappedVariant = product.variants.some((v) =>
    /^(DEV-LOCAL-|DEV-DEMO-|DELIVN-)?(ESPRESSO|RANG-XAY)-(250|500)$/i.test(
      v.sku,
    ),
  );
  const shouldShowNoMediaState = product.media.length === 0 && !hasMappedVariant;
  const activeImage = getProductDetailImage(product, selectedVariant);

  const variantThumbnails = hasMappedVariant
    ? product.variants.map((variant) => ({
        variant,
        image: getProductDetailImage(product, variant),
      }))
    : [];

  return (
    <article className="overflow-x-clip bg-background pb-20 sm:pb-24 lg:pb-32">
      <div className="site-shell">
        <nav aria-label="Điều hướng sản phẩm" className="py-5 sm:py-7">
          <Link
            href="/san-pham"
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-foreground-muted uppercase transition-colors duration-200 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
          >
            <span aria-hidden="true">←</span>
            Quay lại sản phẩm
          </Link>
        </nav>

        {/* Above-the-fold: Square Detail Gallery (Left) + Streamlined Purchase Column (Right) */}
        <div className="grid grid-cols-1 gap-8 border-t border-border pt-7 sm:gap-12 sm:pt-9 lg:grid-cols-12 lg:gap-12 lg:pt-12 xl:gap-16">
          {/* Product Gallery */}
          <div className="lg:col-span-6 xl:col-span-7">
            {shouldShowNoMediaState ? (
              <div
                className={`flex aspect-square min-h-[340px] flex-col justify-between p-7 sm:min-h-[460px] sm:p-10 lg:p-14 ${
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
            ) : (
              <div>
                <div className="group/media relative aspect-square w-full overflow-hidden border border-border/50 bg-[#F4EFE6]">
                  <img
                    key={activeImage.url}
                    src={activeImage.url}
                    alt={activeImage.alt}
                    width={1200}
                    height={1200}
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/media:scale-[1.02] motion-reduce:transition-none motion-reduce:transform-none"
                  />
                  {selectedVariant && (
                    <span className="absolute top-3.5 left-3.5 border border-border/70 bg-background/90 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-foreground uppercase backdrop-blur-sm">
                      {selectedVariant.label}
                    </span>
                  )}
                </div>

                {variantThumbnails.length > 1 && (
                  <div
                    className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:gap-4"
                    role="group"
                    aria-label="Ảnh theo trọng lượng"
                  >
                    {variantThumbnails.map(({ variant, image }) => {
                      const isActive = selectedVariant?.id === variant.id;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => handleSelectVariant(variant.id)}
                          className={`flex items-center gap-3.5 border p-2.5 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                            isActive
                              ? "border-foreground bg-surface ring-1 ring-foreground/15"
                              : "border-border/60 bg-background opacity-80 hover:border-foreground/50 hover:opacity-100"
                          }`}
                        >
                          <div className="relative size-14 shrink-0 overflow-hidden bg-surface sm:size-16">
                            <img
                              src={image.url}
                              alt={image.alt}
                              width={160}
                              height={160}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold tracking-[0.14em] text-foreground uppercase">
                              GÓI {variant.label}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-foreground-muted">
                              {formatVnd(variant.priceVnd)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Streamlined Right Purchase Column */}
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
              {/* 1. Product Line Label */}
              <div className="flex items-center gap-3">
                <span
                  className="size-2 rounded-full bg-accent"
                  aria-hidden="true"
                />
                <p className="text-[11px] font-bold tracking-[0.22em] text-foreground-muted uppercase">
                  {buyerLabel}
                </p>
              </div>

              {/* 2. Large Product Name */}
              <h1 className="mt-3 text-2xl font-bold leading-[1.2] tracking-tight text-foreground sm:text-3xl lg:text-[34px]">
                {displayName}
              </h1>

              {/* 3. Concise 1–2 line blending description */}
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted sm:text-base">
                {hasMappedVariant ||
                !product.description ||
                /dữ liệu sản phẩm|phát triển cục bộ|kiểm thử thương mại|tây nguyên/i.test(
                  product.description,
                )
                  ? lineDetail.detailShortDescription
                  : product.description}
              </p>

              {/* 4–7. Weight Selector, Price, Quantity, CTAs */}
              <div className="mt-6">
                <ProductPurchasePanel
                  product={product}
                  initialVariantId={initialVariantId}
                  selectedVariantId={selectedVariantId}
                  onSelectVariant={handleSelectVariant}
                />
              </div>

              {/* 8. Clean Compact Summary Info */}
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
                <div>
                  <dt className="text-[10px] font-bold tracking-[0.16em] text-foreground-muted uppercase">
                    Loại cà phê
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {lineDetail.productType}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold tracking-[0.16em] text-foreground-muted uppercase">
                    Khối lượng tịnh
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {selectedVariant
                      ? `${selectedVariant.weightGrams}g`
                      : "250g / 500g"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold tracking-[0.16em] text-foreground-muted uppercase">
                    Xuất xứ
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {SHARED_COFFEE_SPECS.origin}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold tracking-[0.16em] text-foreground-muted uppercase">
                    Hạn sử dụng
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {SHARED_COFFEE_SPECS.shelfLife}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Below-the-fold: Structured Product Specifications & Guides */}
        <section
          aria-label="Thông tin chi tiết sản phẩm"
          className="mt-14 border-t border-border pt-10 sm:mt-16 sm:pt-12 lg:mt-20"
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Thành phần & Đặc tính hương vị */}
            <div className="border border-border/60 bg-surface/40 p-6 sm:p-8">
              <h2 className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">
                Thành phần &amp; Đặc tính
              </h2>
              <p className="mt-3 text-sm font-semibold text-foreground sm:text-base">
                {lineDetail.ingredients}
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-foreground-muted">
                {lineDetail.characteristics.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hướng dẫn sử dụng / Cách pha */}
            <div className="border border-border/60 bg-surface/40 p-6 sm:p-8">
              <h2 className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">
                Hướng dẫn sử dụng
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground sm:text-base">
                {lineDetail.brewing.intro}
              </p>
              {lineDetail.brewing.steps && (
                <ol className="mt-4 space-y-2.5 text-sm leading-relaxed text-foreground-muted">
                  {lineDetail.brewing.steps.map((step, idx) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="flex size-5 shrink-0 items-center justify-center border border-border text-[11px] font-bold text-foreground">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Thông tin sản xuất & Đóng gói (dynamic weight!) */}
            <div className="border border-border/60 bg-surface/40 p-6 sm:p-8">
              <h2 className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">
                Thông tin sản xuất &amp; Quy cách
              </h2>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex flex-wrap justify-between gap-2 border-b border-border/40 pb-2">
                  <dt className="text-foreground-muted">Thương hiệu</dt>
                  <dd className="font-medium text-foreground">
                    {SHARED_COFFEE_SPECS.brand}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2 border-b border-border/40 pb-2">
                  <dt className="text-foreground-muted">Khối lượng tịnh</dt>
                  <dd className="font-semibold text-foreground">
                    {selectedVariant
                      ? `${selectedVariant.weightGrams}g`
                      : "250g / 500g"}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2 border-b border-border/40 pb-2">
                  <dt className="text-foreground-muted">Xuất xứ</dt>
                  <dd className="font-medium text-foreground">
                    {SHARED_COFFEE_SPECS.origin}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2 border-b border-border/40 pb-2">
                  <dt className="text-foreground-muted">Hạn sử dụng</dt>
                  <dd className="font-medium text-foreground">
                    {SHARED_COFFEE_SPECS.shelfLife}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2 border-b border-border/40 pb-2">
                  <dt className="text-foreground-muted">Ngày sản xuất</dt>
                  <dd className="font-medium text-foreground">
                    {SHARED_COFFEE_SPECS.manufactureDate}
                  </dd>
                </div>
                <div className="pt-1">
                  <dt className="text-foreground-muted">Quy cách đóng gói</dt>
                  <dd className="mt-1 leading-relaxed text-foreground">
                    {SHARED_COFFEE_SPECS.packaging}
                  </dd>
                </div>
                <div className="pt-1">
                  <dt className="text-foreground-muted">
                    Khuyến nghị sau khi mở
                  </dt>
                  <dd className="mt-1 leading-relaxed text-foreground">
                    {SHARED_COFFEE_SPECS.afterOpening}
                  </dd>
                </div>
                <div className="pt-1">
                  <dt className="text-foreground-muted">
                    Tổ chức chịu trách nhiệm sản xuất
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {SHARED_COFFEE_SPECS.manufacturer}
                  </dd>
                  <dd className="mt-0.5 leading-relaxed text-foreground-muted">
                    {SHARED_COFFEE_SPECS.address}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Bảo quản, Cảnh báo & Giao nhận / Đổi trả */}
            <div className="space-y-6 border border-border/60 bg-surface/40 p-6 sm:p-8">
              <div>
                <h2 className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">
                  Hướng dẫn bảo quản
                </h2>
                <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-foreground-muted">
                  {SHARED_COFFEE_SPECS.storage.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1 shrink-0 rounded-full bg-foreground-muted"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-border/50 pt-5">
                <h2 className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">
                  Cảnh báo an toàn
                </h2>
                <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-foreground-muted">
                  {SHARED_COFFEE_SPECS.safetyWarnings.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1 shrink-0 rounded-full bg-accent"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-border/50 pt-5 space-y-3 text-sm leading-relaxed text-foreground-muted">
                <div>
                  <h2 className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">
                    Giao hàng &amp; Đổi trả
                  </h2>
                  <p className="mt-2">{SHARED_COFFEE_SPECS.deliveryNote}</p>
                  <p className="mt-2">
                    {SHARED_COFFEE_SPECS.returnNote}{" "}
                    <Link
                      href="/chinh-sach-doi-tra-hoan-tien"
                      className="font-semibold text-foreground underline underline-offset-4 hover:text-accent"
                    >
                      Xem chính sách đổi trả &amp; hoàn tiền →
                    </Link>
                  </p>
                  <p className="mt-3 border-t border-border/50 pt-3">
                    Hồ sơ công bố chất lượng ({product.category === "espresso" ? "Số 01/CÔNG TY TNHH CÀ PHÊ DELIVN/2026" : "Số 02/CÔNG TY TNHH CÀ PHÊ DELIVN/2026"}):{" "}
                    <Link
                      href="/ban-tu-cong-bo-san-pham"
                      className="font-semibold text-foreground underline underline-offset-4 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      Bản tự công bố sản phẩm →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-14 flex justify-center border-t border-border pt-10 sm:mt-16 sm:pt-12 lg:mt-20">
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
            <h1
              id="product-not-found-title"
              className="mt-6 text-2xl font-bold leading-tight tracking-[-0.025em] text-foreground uppercase sm:text-3xl lg:text-4xl"
            >
              KHÔNG TÌM THẤY SẢN PHẨM
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground-muted sm:text-lg">
              Sản phẩm bạn đang tìm không tồn tại hoặc đã ngừng kinh doanh.
            </p>
            <Link
              href="/san-pham"
              className="mt-8 inline-flex items-center gap-3 border border-foreground px-7 py-3.5 text-xs font-bold tracking-[0.2em] text-foreground uppercase transition-colors duration-300 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
            >
              Xem danh mục sản phẩm <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
