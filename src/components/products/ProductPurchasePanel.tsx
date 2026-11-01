"use client";

import { useId, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { MAX_QUANTITY_PER_VARIANT, type ProductDTO } from "@/contracts";
import { createCartItemSnapshot } from "@/lib/cart/cart-snapshot";
import {
  formatVnd,
  getDefaultProductVariant,
} from "@/lib/storefront/product-presentation";

interface ProductPurchasePanelProps {
  product: ProductDTO;
  initialVariantId?: string | null;
}

export function ProductPurchasePanel({
  product,
  initialVariantId,
}: ProductPurchasePanelProps) {
  const { addItem, isHydrated, items } = useCart();
  const radioGroupName = useId();
  const variants = product.variants;
  const defaultVariant = getDefaultProductVariant(variants);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    initialVariantId ?? defaultVariant?.id ?? null,
  );
  const [feedback, setFeedback] = useState("");
  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ??
    defaultVariant;
  const selectedCartQuantity = selectedVariant
    ? (items.find((item) => item.variantId === selectedVariant.id)?.quantity ?? 0)
    : 0;
  const isAtMaximumQuantity =
    selectedCartQuantity >= MAX_QUANTITY_PER_VARIANT;

  const selectVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    setFeedback("");
  };

  const handleAddToCart = () => {
    if (!selectedVariant?.inStock || !isHydrated || isAtMaximumQuantity) return;

    if (addItem(createCartItemSnapshot(product, selectedVariant))) {
      setFeedback("ĐÃ THÊM VÀO GIỎ");
    }
  };

  const handleBuyNow = () => {
    if (!selectedVariant?.inStock || !isHydrated || isAtMaximumQuantity) return;

    if (addItem(createCartItemSnapshot(product, selectedVariant))) {
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/thanh-toan");
      }
    }
  };



  if (!selectedVariant) {
    return (
      <div className="border-y border-border py-6" aria-live="polite">
        <p className="text-[11px] font-bold tracking-[0.2em] text-foreground-muted uppercase">
          Thông tin sản phẩm
        </p>
        <p className="mt-2 text-xl font-bold tracking-[0.04em] text-foreground uppercase">
          ĐANG CẬP NHẬT
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          Thông tin quy cách và giá bán đang được hoàn thiện.
        </p>
      </div>
    );
  }

  return (
    <div className="border-y border-border py-6">
      {/* Variant Selection first */}
      <fieldset>
        <legend className="text-[11px] font-bold tracking-[0.2em] text-foreground-muted uppercase">
          Chọn quy cách
        </legend>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
          {variants.map((variant) => {
            const statusId = `variant-${variant.id}-status`;
            const isChecked = selectedVariant.id === variant.id;

            return (
              <label key={variant.id} className="relative flex cursor-pointer">
                <input
                  type="radio"
                  name={radioGroupName}
                  value={variant.id}
                  checked={isChecked}
                  onChange={() => selectVariant(variant.id)}
                  aria-describedby={statusId}
                  className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
                />
                <span className="flex min-h-16 w-full flex-col justify-between border border-border px-3.5 py-2.5 transition-colors duration-200 peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent motion-reduce:transition-none">
                  <span className="text-sm font-bold uppercase">{variant.label}</span>
                  <span
                    id={statusId}
                    className="text-[10px] font-semibold tracking-[0.1em] uppercase opacity-75"
                  >
                    {variant.inStock ? "Còn hàng" : "Tạm hết hàng"}
                  </span>
                </span>
              </label>


            );
          })}
        </div>
      </fieldset>

      {/* Price & Stock Display */}
      <div aria-live="polite" aria-atomic="true" className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-bold tracking-[0.2em] text-foreground-muted uppercase">
            Giá bán
          </p>
          <p className="text-[11px] font-bold tracking-[0.16em] text-foreground uppercase">
            <span
              aria-hidden="true"
              className={`mr-2 inline-block size-1.5 rounded-full align-middle ${
                selectedVariant.inStock ? "bg-accent" : "bg-foreground-muted/50"
              }`}
            />
            {selectedVariant.inStock ? "CÒN HÀNG" : "TẠM HẾT HÀNG"}
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {formatVnd(selectedVariant.priceVnd)}
          </p>
          {selectedVariant.compareAtPriceVnd !== null && (
            <del className="text-sm text-foreground-muted decoration-foreground-muted/60 sm:text-base">
              {formatVnd(selectedVariant.compareAtPriceVnd)}
            </del>
          )}
        </div>
      </div>

      {/* Dual Purchase CTAs: MUA NGAY (Primary) + THÊM VÀO GIỎ (Secondary) */}
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!isHydrated || !selectedVariant.inStock || isAtMaximumQuantity}
          className="inline-flex min-h-12 flex-1 items-center justify-center border border-foreground bg-foreground px-6 py-3.5 text-xs font-bold tracking-[0.2em] text-background uppercase transition-colors duration-200 hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-foreground-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
        >
          {!selectedVariant.inStock
            ? "TẠM HẾT HÀNG"
            : isAtMaximumQuantity
              ? "ĐÃ ĐẠT GIỚI HẠN"
              : "MUA NGAY"}
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isHydrated || !selectedVariant.inStock || isAtMaximumQuantity}
          className="inline-flex min-h-12 flex-1 items-center justify-center border border-foreground bg-transparent px-6 py-3.5 text-xs font-bold tracking-[0.2em] text-foreground uppercase transition-colors duration-200 hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-foreground-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
        >
          {!selectedVariant.inStock
            ? "TẠM HẾT HÀNG"
            : isAtMaximumQuantity
              ? "ĐÃ ĐẠT GIỚI HẠN"
              : "THÊM VÀO GIỎ"}
        </button>
      </div>

      <p
        aria-live="polite"
        aria-atomic="true"
        className="mt-2.5 min-h-5 text-center text-[11px] font-bold tracking-[0.16em] text-accent uppercase"
      >
        {isAtMaximumQuantity ? "" : feedback}
      </p>

      <p className="mt-4 text-xs leading-relaxed text-foreground-muted">
        Đang xem: <span className="font-semibold text-foreground">{product.name}</span>
        {" · "}
        <span className="font-semibold text-foreground">{selectedVariant.label}</span>
      </p>
    </div>
  );
}
