"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { MAX_QUANTITY_PER_VARIANT, type ProductDTO } from "@/contracts";
import { createCartItemSnapshot } from "@/lib/cart/cart-snapshot";
import {
  formatVnd,
  getDefaultProductVariant,
  getProductAvailability,
  getProductBuyerLabel,
  getProductDisplayDescription,
  getProductDisplayName,
  getProductVariantImage,
  type ProductAvailability,
} from "@/lib/storefront/product-presentation";

import { ProductMediaStage } from "./ProductMediaStage";

const availabilityLabels: Record<ProductAvailability, string> = {
  available: "CÒN HÀNG",
  unavailable: "TẠM HẾT HÀNG",
  pending: "THÔNG TIN ĐANG CẬP NHẬT",
};

interface ProductCatalogProps {
  products: readonly ProductDTO[];
}

interface ProductCardProps {
  product: ProductDTO;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const { addItem, isHydrated, items } = useCart();
  const defaultVariant = getDefaultProductVariant(product.variants);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    defaultVariant?.id ?? null,
  );
  const [feedback, setFeedback] = useState("");

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? defaultVariant;

  const selectedCartQuantity = selectedVariant
    ? (items.find((item) => item.variantId === selectedVariant.id)?.quantity ?? 0)
    : 0;
  const isAtMaximumQuantity = selectedCartQuantity >= MAX_QUANTITY_PER_VARIANT;

  const availability = selectedVariant
    ? selectedVariant.inStock
      ? "available"
      : "unavailable"
    : getProductAvailability(product.variants);

  const displayName = getProductDisplayName(product);
  const buyerLabel = getProductBuyerLabel(product.category);
  const description = getProductDisplayDescription(product);
  const variantImage = getProductVariantImage(product, selectedVariant);
  const detailHref = selectedVariant
    ? `/san-pham/${product.slug}?size=${selectedVariant.weightGrams}`
    : `/san-pham/${product.slug}`;

  const handleBuyNow = () => {
    if (!selectedVariant?.inStock || !isHydrated || isAtMaximumQuantity) return;

    if (addItem(createCartItemSnapshot(product, selectedVariant))) {
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/thanh-toan");
      }
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant?.inStock || !isHydrated || isAtMaximumQuantity) return;

    if (addItem(createCartItemSnapshot(product, selectedVariant))) {
      setFeedback("ĐÃ THÊM VÀO GIỎ");
    }
  };

  return (
    <article className="group flex h-full flex-col justify-between transition-all duration-300">
      <div className="flex flex-1 flex-col">
        {/* Unified Product Media Stage with optical normalization & smooth variant swap */}
        <ProductMediaStage
          asset={variantImage}
          href={detailHref}
          ariaLabel={`Xem chi tiết ${displayName}`}
          priority={index === 0}
          sizeBadge={selectedVariant?.label ?? null}
        />

        {/* Category descriptor & Stock status */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 sm:mt-5">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-foreground-muted uppercase sm:text-[11px]">
            {String(index + 1).padStart(2, "0")} / {buyerLabel}
          </p>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-foreground-muted uppercase sm:text-[11px]">
            <span
              aria-hidden="true"
              className={`inline-block size-[7px] shrink-0 rounded-full ${
                availability === "available"
                  ? "bg-[#16A34A]"
                  : "bg-foreground-muted/50"
              }`}
            />
            <span>{availabilityLabels[availability]}</span>
          </p>
        </div>

        {/* Official Product Title linking to PDP */}
        <h3 className="mt-2 text-xl font-bold leading-snug tracking-tight text-foreground sm:text-2xl">
          <Link
            href={detailHref}
            className="transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {displayName}
          </Link>
        </h3>

        {/* Neutral factual description */}
        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-foreground-muted sm:text-sm">
          {description}
        </p>

        {/* Variant selection */}
        {product.variants.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-bold tracking-[0.2em] text-foreground-muted uppercase">
              Quy cách
            </p>
            <div
              role="radiogroup"
              aria-label={`Chọn quy cách cho ${displayName}`}
              className="mt-2 flex flex-wrap gap-2 sm:gap-2.5"
            >
              {product.variants.map((variant) => {
                const isSelected = selectedVariant?.id === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setSelectedVariantId(variant.id);
                      setFeedback("");
                    }}
                    className={`border px-5 py-2 text-xs font-bold tracking-[0.14em] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none ${
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/80 bg-background text-foreground hover:border-foreground/60 hover:bg-surface/60"
                    }`}
                  >
                    <span>{variant.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Price & Detail Link */}
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-border/50 pt-3.5">
          <div
            aria-live="polite"
            className="flex items-baseline gap-2.5 transition-opacity duration-200 motion-reduce:transition-none"
          >
            {selectedVariant ? (
              <>
                <p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {formatVnd(selectedVariant.priceVnd)}
                </p>
                {selectedVariant.compareAtPriceVnd !== null && (
                  <del className="text-xs text-foreground-muted decoration-foreground-muted/60">
                    {formatVnd(selectedVariant.compareAtPriceVnd)}
                  </del>
                )}
              </>
            ) : (
              <p className="text-sm text-foreground-muted">Đang cập nhật</p>
            )}
          </div>
          <Link
            href={detailHref}
            className="text-[11px] font-bold tracking-[0.16em] text-foreground-muted uppercase underline-offset-4 transition-colors hover:text-accent hover:underline"
          >
            Chi tiết sản phẩm →
          </Link>
        </div>
      </div>

      {/* Actions: MUA NGAY (Primary) + THÊM VÀO GIỎ (Secondary) */}
      <div className="mt-4 sm:mt-5">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!isHydrated || !selectedVariant?.inStock || isAtMaximumQuantity}
            className="inline-flex min-h-11 flex-1 items-center justify-center border border-foreground bg-foreground px-5 py-3 text-xs font-bold tracking-[0.2em] text-background uppercase transition-colors duration-200 hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-foreground-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none sm:min-h-12"
          >
            {!selectedVariant || !selectedVariant.inStock
              ? "TẠM HẾT HÀNG"
              : isAtMaximumQuantity
                ? "ĐÃ ĐẠT GIỚI HẠN"
                : "MUA NGAY"}
          </button>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isHydrated || !selectedVariant?.inStock || isAtMaximumQuantity}
            className="inline-flex min-h-11 flex-1 items-center justify-center border border-foreground/80 bg-transparent px-5 py-3 text-xs font-bold tracking-[0.2em] text-foreground uppercase transition-colors duration-200 hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-foreground-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none sm:min-h-12"
          >
            {!selectedVariant || !selectedVariant.inStock
              ? "TẠM HẾT HÀNG"
              : isAtMaximumQuantity
                ? "ĐÃ ĐẠT GIỚI HẠN"
                : "THÊM VÀO GIỎ"}
          </button>
        </div>

        {/* Feedback message */}
        <p
          aria-live="polite"
          aria-atomic="true"
          className="mt-1.5 min-h-4 text-center text-[11px] font-bold tracking-[0.16em] text-accent uppercase"
        >
          {isAtMaximumQuantity ? "" : feedback}
        </p>
      </div>
    </article>
  );
}

export function ProductCatalog({ products }: ProductCatalogProps) {
  return (
    <section
      aria-labelledby="product-catalog-title"
      className="bg-background pt-4 pb-12 sm:pt-5 sm:pb-16 lg:pt-6 lg:pb-20"
    >
      <div className="site-shell">
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
          <div className="grid grid-cols-1 items-stretch gap-12 md:grid-cols-2 md:gap-x-10 lg:gap-x-14 xl:gap-x-16">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
