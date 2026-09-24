import type { ProductVariantDTO } from "@/contracts";

export type ProductPricePresentation = {
  priceVnd: number;
  showFrom: boolean;
};

export type ProductAvailability = "available" | "unavailable" | "pending";

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function getProductPrice(
  variants: readonly ProductVariantDTO[],
): ProductPricePresentation | null {
  if (variants.length === 0) {
    return null;
  }

  const prices = variants.map((variant) => variant.priceVnd);
  const minimumPrice = Math.min(...prices);

  return {
    priceVnd: minimumPrice,
    showFrom: prices.some((price) => price !== minimumPrice),
  };
}

export function formatVnd(priceVnd: number): string {
  return vndFormatter.format(priceVnd);
}

export function getProductAvailability(
  variants: readonly ProductVariantDTO[],
): ProductAvailability {
  if (variants.length === 0) {
    return "pending";
  }

  return variants.some((variant) => variant.inStock)
    ? "available"
    : "unavailable";
}

export function getDefaultProductVariant(
  variants: readonly ProductVariantDTO[],
): ProductVariantDTO | null {
  return variants.find((variant) => variant.inStock) ?? variants[0] ?? null;
}
