import type { ProductCategory, ProductVariantDTO } from "@/contracts";

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

export function formatVnd(priceVnd: number | bigint): string {
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

export function getProductDisplayDescription(product: {
  description: string;
  category: ProductCategory;
}): string {
  if (
    !product.description ||
    /dữ liệu sản phẩm/i.test(product.description) ||
    /phát triển cục bộ/i.test(product.description) ||
    /kiểm thử thương mại/i.test(product.description) ||
    /tây nguyên/i.test(product.description)
  ) {
    if (product.category === "espresso") {
      return "Cà phê hạt rang — lựa chọn 250g hoặc 500g.";
    }
    if (product.category === "rang_xay") {
      return "Cà phê rang xay — lựa chọn 250g hoặc 500g.";
    }
  }
  return product.description;
}

/**
 * PRODUCT_VARIANT_IMAGE_LIMITATION:
 * Current approved storefront photography represents 500g packaging while the
 * commerce selector also supports 250g.
 *
 * This is an asset limitation, not something to solve by generating fake
 * packaging.
 */

export const PRODUCT_PRINCIPAL_IMAGES: Record<ProductCategory, string> = {
  espresso: "/products/reference/500g_black_reference.jpg",
  rang_xay: "/products/reference/500g_sand_reference.jpg",
};

export function getProductPrincipalImage(product: {
  category: ProductCategory;
  media?: readonly { url: string; altText?: string | null }[];
}): { url: string; altText: string } {
  const referenceUrl = PRODUCT_PRINCIPAL_IMAGES[product.category];
  if (referenceUrl) {
    return {
      url: referenceUrl,
      altText:
        product.category === "espresso"
          ? "Bao bì DELIVN Espresso"
          : "Bao bì DELIVN Rang Xay",
    };
  }

  const fallback = product.media?.[0];
  return {
    url: fallback?.url ?? "/products/reference/500g_black_reference.jpg",
    altText: fallback?.altText ?? "Bao bì DELIVN",
  };
}
