"use client";

import { useId, useState } from "react";

import type { ProductVariantDTO } from "@/contracts";
import {
  formatVnd,
  getDefaultProductVariant,
} from "@/lib/storefront/product-presentation";

interface ProductPurchasePanelProps {
  productName: string;
  variants: readonly ProductVariantDTO[];
}

export function ProductPurchasePanel({
  productName,
  variants,
}: ProductPurchasePanelProps) {
  const radioGroupName = useId();
  const defaultVariant = getDefaultProductVariant(variants);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    defaultVariant?.id ?? null,
  );
  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ??
    defaultVariant;

  if (!selectedVariant) {
    return (
      <div className="border-y border-border py-7" aria-live="polite">
        <p className="text-[11px] font-bold tracking-[0.2em] text-foreground-muted uppercase">
          Thông tin sản phẩm
        </p>
        <p className="mt-3 text-xl font-bold tracking-[0.04em] text-foreground uppercase">
          ĐANG CẬP NHẬT
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          Thông tin quy cách và giá bán đang được hoàn thiện.
        </p>
      </div>
    );
  }

  return (
    <div className="border-y border-border py-7">
      <div aria-live="polite" aria-atomic="true">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-bold tracking-[0.2em] text-foreground-muted uppercase">
            Giá bán
          </p>
          <p className="text-[11px] font-bold tracking-[0.18em] text-foreground uppercase">
            <span
              aria-hidden="true"
              className={`mr-2 inline-block size-1.5 rounded-full align-middle ${
                selectedVariant.inStock ? "bg-accent" : "bg-foreground-muted/50"
              }`}
            />
            {selectedVariant.inStock ? "CÒN HÀNG" : "TẠM HẾT HÀNG"}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {formatVnd(selectedVariant.priceVnd)}
          </p>
          {selectedVariant.compareAtPriceVnd !== null && (
            <del className="text-sm text-foreground-muted decoration-foreground-muted/60 sm:text-base">
              {formatVnd(selectedVariant.compareAtPriceVnd)}
            </del>
          )}
        </div>
      </div>

      <fieldset className="mt-8">
        <legend className="text-[11px] font-bold tracking-[0.2em] text-foreground-muted uppercase">
          Chọn quy cách
        </legend>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {variants.map((variant) => {
            const statusId = `variant-${variant.id}-status`;

            return (
              <label key={variant.id} className="relative cursor-pointer">
                <input
                  type="radio"
                  name={radioGroupName}
                  value={variant.id}
                  checked={selectedVariant.id === variant.id}
                  onChange={() => setSelectedVariantId(variant.id)}
                  aria-describedby={statusId}
                  className="peer sr-only"
                />
                <span className="flex min-h-20 items-center justify-between gap-4 border border-border px-4 py-3 transition-colors duration-200 peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent motion-reduce:transition-none">
                  <span className="text-sm font-semibold">{variant.label}</span>
                  <span
                    id={statusId}
                    className="text-right text-[10px] font-bold tracking-[0.12em] uppercase opacity-70"
                  >
                    {variant.inStock ? "Còn hàng" : "Tạm hết hàng"}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <p className="mt-6 text-xs leading-relaxed text-foreground-muted">
        Đang xem: <span className="font-semibold text-foreground">{productName}</span>
        {" · "}
        <span className="font-semibold text-foreground">{selectedVariant.label}</span>
      </p>
    </div>
  );
}
