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
  selectedVariantId?: string | null;
  onSelectVariant?: (variantId: string) => void;
}

export function ProductPurchasePanel({
  product,
  initialVariantId,
  selectedVariantId: controlledVariantId,
  onSelectVariant,
}: ProductPurchasePanelProps) {
  const { addItem, isHydrated, items } = useCart();
  const radioGroupName = useId();
  const variants = product.variants;
  const defaultVariant = getDefaultProductVariant(variants);
  const [uncontrolledVariantId, setUncontrolledVariantId] = useState<
    string | null
  >(initialVariantId ?? defaultVariant?.id ?? null);
  const [quantity, setQuantity] = useState<number>(1);
  const [feedback, setFeedback] = useState("");

  const activeVariantId =
    controlledVariantId !== undefined
      ? controlledVariantId
      : uncontrolledVariantId;

  const selectedVariant =
    variants.find((variant) => variant.id === activeVariantId) ??
    defaultVariant;
  const selectedCartQuantity = selectedVariant
    ? (items.find((item) => item.variantId === selectedVariant.id)?.quantity ?? 0)
    : 0;
  const remainingCapacity = Math.max(
    0,
    MAX_QUANTITY_PER_VARIANT - selectedCartQuantity,
  );
  const isAtMaximumQuantity = remainingCapacity === 0;
  const effectiveQuantity = isAtMaximumQuantity
    ? 1
    : Math.min(Math.max(1, quantity), remainingCapacity);

  const selectVariant = (variantId: string) => {
    if (controlledVariantId === undefined) {
      setUncontrolledVariantId(variantId);
    }
    onSelectVariant?.(variantId);
    const nextCartQty =
      items.find((item) => item.variantId === variantId)?.quantity ?? 0;
    const nextCap = Math.max(1, MAX_QUANTITY_PER_VARIANT - nextCartQty);
    setQuantity((prev) => Math.min(Math.max(1, prev), nextCap));
    setFeedback("");
  };

  const handleAddToCart = () => {
    if (!selectedVariant?.inStock || !isHydrated || isAtMaximumQuantity) return;

    const snapshot = createCartItemSnapshot(product, selectedVariant);
    let added = 0;
    for (let i = 0; i < effectiveQuantity; i++) {
      if (addItem(snapshot)) {
        added++;
      }
    }
    if (added > 0) {
      setFeedback(
        added === 1 ? "ĐÃ THÊM VÀO GIỎ" : `ĐÃ THÊM ${added} VÀO GIỎ`,
      );
      setQuantity(1);
    }
  };

  const handleBuyNow = () => {
    if (!selectedVariant?.inStock || !isHydrated || isAtMaximumQuantity) return;

    const snapshot = createCartItemSnapshot(product, selectedVariant);
    let added = 0;
    for (let i = 0; i < effectiveQuantity; i++) {
      if (addItem(snapshot)) {
        added++;
      }
    }
    if (added > 0 && typeof window !== "undefined") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/thanh-toan");
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
      {/* 4. Weight / Variant Selection (with green in-stock indicator dot) */}
      <fieldset>
        <legend className="text-[11px] font-bold tracking-[0.2em] text-foreground-muted uppercase">
          Chọn trọng lượng
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
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold uppercase">
                      {variant.label}
                    </span>
                    <span className="text-xs font-semibold opacity-80">
                      {formatVnd(variant.priceVnd)}
                    </span>
                  </span>
                  <span
                    id={statusId}
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase opacity-85"
                  >
                    <span
                      aria-hidden="true"
                      className={`size-1.5 shrink-0 rounded-full ${
                        variant.inStock
                          ? "bg-emerald-500"
                          : "bg-foreground-muted/50"
                      }`}
                    />
                    <span>{variant.inStock ? "Còn hàng" : "Tạm hết hàng"}</span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 5. Clean Price Display (no redundant stock badge or DEV-LOCAL SKU) */}
      <div aria-live="polite" aria-atomic="true" className="mt-6">
        <p className="text-[11px] font-bold tracking-[0.2em] text-foreground-muted uppercase">
          Giá bán
        </p>

        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
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

      {/* 6. Quantity Selector */}
      {selectedVariant.inStock && !isAtMaximumQuantity && (
        <div className="mt-5 flex items-center justify-between gap-4 border border-border/80 px-3.5 py-2">
          <span className="text-[11px] font-bold tracking-[0.18em] text-foreground-muted uppercase">
            Số lượng
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Giảm số lượng"
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              disabled={effectiveQuantity <= 1}
              className="flex size-8 items-center justify-center border border-border text-sm font-bold text-foreground transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              −
            </button>
            <span
              aria-live="polite"
              className="min-w-6 text-center text-sm font-bold text-foreground"
            >
              {effectiveQuantity}
            </span>
            <button
              type="button"
              aria-label="Tăng số lượng"
              onClick={() =>
                setQuantity((prev) => Math.min(remainingCapacity, prev + 1))
              }
              disabled={effectiveQuantity >= remainingCapacity}
              className="flex size-8 items-center justify-center border border-border text-sm font-bold text-foreground transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* 7. Dual Purchase CTAs: MUA NGAY + THÊM VÀO GIỎ */}
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={
            !isHydrated || !selectedVariant.inStock || isAtMaximumQuantity
          }
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
          disabled={
            !isHydrated || !selectedVariant.inStock || isAtMaximumQuantity
          }
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
    </div>
  );
}
