import type { ProductCategory, ProductVariantDTO } from "@/contracts";
import { COFFEE_LINE_DETAILS } from "@/data/content/products";

export type ProductPricePresentation = {
  priceVnd: number;
  showFrom: boolean;
};

export type ProductAvailability = "available" | "unavailable" | "pending";

export type VariantImageAsset = {
  url: string;
  alt: string;
  objectPosition?: string;
  presentationScale?: number;
  fitMode?: "contain" | "cover";
};

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export const PRODUCT_VARIANT_IMAGES: Record<
  ProductCategory,
  Record<250 | 500, VariantImageAsset>
> = {
  espresso: {
    250: {
      url: "/products/variants/espresso-250g.png",
      alt: "Cà phê hạt rang Espresso Special Tây Nguyên VietNam — 250g",
      objectPosition: "center center",
      presentationScale: 1,
      fitMode: "contain",
    },
    500: {
      url: "/products/variants/espresso-500g.png",
      alt: "Cà phê hạt rang Espresso Special Tây Nguyên VietNam — 500g",
      objectPosition: "center center",
      presentationScale: 1,
      fitMode: "contain",
    },
  },
  rang_xay: {
    250: {
      url: "/products/variants/rang-xay-250g-v2.png",
      alt: "Cà phê rang xay pha phin truyền thống Tây Nguyên VietNam — 250g",
      objectPosition: "center center",
      presentationScale: 1,
      fitMode: "contain",
    },
    500: {
      url: "/products/variants/rang-xay-500g.png",
      alt: "Cà phê rang xay pha phin truyền thống Tây Nguyên VietNam — 500g",
      objectPosition: "center center",
      presentationScale: 1,
      fitMode: "contain",
    },
  },
};

export const PRODUCT_DETAIL_IMAGES: Record<
  ProductCategory,
  Record<250 | 500, VariantImageAsset>
> = {
  espresso: {
    250: PRODUCT_VARIANT_IMAGES.espresso[250],
    500: {
      url: "/products/detail/espresso-500g-detail.webp",
      alt: "Cà phê hạt rang Espresso Special Tây Nguyên VietNam — 500g",
    },
  },
  rang_xay: {
    250: {
      url: "/products/detail/rang-xay-250g-detail.webp",
      alt: "Cà phê rang xay pha phin truyền thống Tây Nguyên VietNam — 250g",
    },
    500: {
      url: "/products/detail/rang-xay-500g-detail.webp",
      alt: "Cà phê rang xay pha phin truyền thống Tây Nguyên VietNam — 500g",
    },
  },
};

export const VARIANT_IMAGE_BY_SKU: Record<string, VariantImageAsset> = {
  "DELIVN-ESPRESSO-250": PRODUCT_VARIANT_IMAGES.espresso[250],
  "DELIVN-ESPRESSO-500": PRODUCT_VARIANT_IMAGES.espresso[500],
  "DEV-LOCAL-ESPRESSO-250": PRODUCT_VARIANT_IMAGES.espresso[250],
  "DEV-LOCAL-ESPRESSO-500": PRODUCT_VARIANT_IMAGES.espresso[500],
  "DEV-DEMO-ESPRESSO-250": PRODUCT_VARIANT_IMAGES.espresso[250],
  "DEV-DEMO-ESPRESSO-500": PRODUCT_VARIANT_IMAGES.espresso[500],
  "ESPRESSO-250": PRODUCT_VARIANT_IMAGES.espresso[250],
  "ESPRESSO-500": PRODUCT_VARIANT_IMAGES.espresso[500],
  "DELIVN-RANG-XAY-250": PRODUCT_VARIANT_IMAGES.rang_xay[250],
  "DELIVN-RANG-XAY-500": PRODUCT_VARIANT_IMAGES.rang_xay[500],
  "DEV-LOCAL-RANG-XAY-250": PRODUCT_VARIANT_IMAGES.rang_xay[250],
  "DEV-LOCAL-RANG-XAY-500": PRODUCT_VARIANT_IMAGES.rang_xay[500],
  "DEV-DEMO-RANG-XAY-250": PRODUCT_VARIANT_IMAGES.rang_xay[250],
  "DEV-DEMO-RANG-XAY-500": PRODUCT_VARIANT_IMAGES.rang_xay[500],
  "RANG-XAY-250": PRODUCT_VARIANT_IMAGES.rang_xay[250],
  "RANG-XAY-500": PRODUCT_VARIANT_IMAGES.rang_xay[500],
};

export const PRODUCT_PRINCIPAL_IMAGES: Record<ProductCategory, string> = {
  espresso: PRODUCT_VARIANT_IMAGES.espresso[500].url,
  rang_xay: PRODUCT_VARIANT_IMAGES.rang_xay[500].url,
};

function isKnownDelivnSlug(slug?: string): boolean {
  if (!slug) return false;
  return /delivn-(espresso|rang-xay)$|san-pham-(espresso|rang-xay)$/i.test(slug);
}

function parseWeightBucket(weightGrams?: number, label?: string): 250 | 500 | null {
  if (weightGrams === 250 || /250/.test(label ?? "")) return 250;
  if (weightGrams === 500 || /500/.test(label ?? "")) return 500;
  return null;
}

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

export function getProductBuyerLabel(category: ProductCategory): string {
  return COFFEE_LINE_DETAILS[category].buyerLabel;
}

export function getProductDisplayName(product: {
  slug?: string;
  name: string;
  category: ProductCategory;
}): string {
  if (
    isKnownDelivnSlug(product.slug) ||
    /CÀ PHÊ (HẠT RANG ESPRESSO|RANG XAY)/i.test(product.name)
  ) {
    return COFFEE_LINE_DETAILS[product.category].officialName;
  }
  return product.name;
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
    return COFFEE_LINE_DETAILS[product.category].catalogDescription;
  }
  return product.description;
}

export function getProductVariantImage(
  product: {
    slug?: string;
    category: ProductCategory;
    media?: readonly { url: string; alt?: string | null; altText?: string | null }[];
  },
  variant?: Pick<ProductVariantDTO, "sku" | "weightGrams" | "label"> | null,
): VariantImageAsset {
  if (variant?.sku) {
    const bySku = VARIANT_IMAGE_BY_SKU[variant.sku.toUpperCase()];
    if (bySku) return bySku;
  }

  const bucket = parseWeightBucket(variant?.weightGrams, variant?.label);
  if (bucket && (isKnownDelivnSlug(product.slug) || !product.media?.length)) {
    return PRODUCT_VARIANT_IMAGES[product.category][bucket];
  }

  if (isKnownDelivnSlug(product.slug)) {
    return PRODUCT_VARIANT_IMAGES[product.category][500];
  }

  const fallback = product.media?.[0];
  if (fallback?.url?.trim()) {
    return {
      url: fallback.url.trim(),
      alt: (fallback.alt ?? fallback.altText ?? "").trim() || "Bao bì DELIVN",
    };
  }

  return PRODUCT_VARIANT_IMAGES[product.category][bucket ?? 500];
}

export function getProductDetailImage(
  product: {
    slug?: string;
    category: ProductCategory;
    media?: readonly { url: string; alt?: string | null; altText?: string | null }[];
  },
  variant?: Pick<ProductVariantDTO, "sku" | "weightGrams" | "label"> | null,
): VariantImageAsset {
  const bucket = parseWeightBucket(variant?.weightGrams, variant?.label);
  if (
    bucket &&
    (isKnownDelivnSlug(product.slug) ||
      (variant?.sku && VARIANT_IMAGE_BY_SKU[variant.sku.toUpperCase()]) ||
      !product.media?.length)
  ) {
    return PRODUCT_DETAIL_IMAGES[product.category][bucket];
  }

  return getProductVariantImage(product, variant);
}

export function getProductPrincipalImage(
  product: {
    slug?: string;
    category: ProductCategory;
    media?: readonly { url: string; alt?: string | null; altText?: string | null }[];
  },
  variant?: Pick<ProductVariantDTO, "sku" | "weightGrams" | "label"> | null,
): { url: string; altText: string } {
  const resolved = getProductVariantImage(product, variant);
  return {
    url: resolved.url,
    altText: resolved.alt,
  };
}

function getCategoryFromSlug(slug: string): ProductCategory | null {
  if (/espresso/i.test(slug)) return "espresso";
  if (/rang-xay/i.test(slug)) return "rang_xay";
  return null;
}

export function getCartProductDisplayImage(item: {
  productSlug: string;
  variantLabel?: string;
  image: { url: string; alt: string } | null;
}): { url: string; alt: string } | null {
  if (item.image?.url.startsWith("/products/variants/")) {
    return item.image;
  }

  if (isKnownDelivnSlug(item.productSlug)) {
    const category = getCategoryFromSlug(item.productSlug);
    if (category) {
      const bucket = parseWeightBucket(undefined, item.variantLabel) ?? 500;
      const resolved = PRODUCT_VARIANT_IMAGES[category][bucket];
      return { url: resolved.url, alt: resolved.alt };
    }
  }

  return item.image;
}
