import type { ProductDTO, ProductVariantDTO } from "@/contracts";
import {
  getProductDisplayName,
  getProductVariantImage,
} from "@/lib/storefront/product-presentation";

import type { CartItemSnapshot } from "./cart-types";

export function createCartItemSnapshot(
  product: ProductDTO,
  variant: ProductVariantDTO,
): CartItemSnapshot {
  const primaryMedia = product.media[0];
  const primaryUrl = primaryMedia?.url.trim() ?? "";

  // Preserve explicit fixture no-media / custom-media behavior unless this is a DELIVN SKU/slug
  const isMappedVariant =
    /^(DEV-LOCAL-|DEV-DEMO-|DELIVN-)?(ESPRESSO|RANG-XAY)-(250|500)$/i.test(
      variant.sku,
    );

  let image: { url: string; alt: string } | null = null;
  if (isMappedVariant) {
    const { url, alt } = getProductVariantImage(product, variant);
    image = { url, alt };
  } else if (primaryMedia && primaryUrl) {
    image = {
      url: primaryUrl,
      alt: primaryMedia.alt.trim() || product.name,
    };
  }

  return {
    productId: product.id,
    productSlug: product.slug,
    productName: getProductDisplayName(product),
    variantId: variant.id,
    variantLabel: variant.label,
    image,
    unitPriceVndSnapshot: variant.priceVnd,
  };
}
