import type { ProductDTO, ProductVariantDTO } from "@/contracts";

import type { CartItemSnapshot } from "./cart-types";

export function createCartItemSnapshot(
  product: ProductDTO,
  variant: ProductVariantDTO,
): CartItemSnapshot {
  const primaryMedia = product.media[0];
  const imageUrl = primaryMedia?.url.trim() ?? "";

  return {
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    variantId: variant.id,
    variantLabel: variant.label,
    image:
      primaryMedia && imageUrl
        ? {
            url: imageUrl,
            alt: primaryMedia.alt.trim() || product.name,
          }
        : null,
    unitPriceVndSnapshot: variant.priceVnd,
  };
}
