import type { ProductDTO } from "@/contracts";
import { CONTACT_CHANNELS } from "@/data/contact";
import { COMPANY_INFORMATION } from "@/data/legal";
import {
  getProductDisplayDescription,
  getProductDisplayName,
  getProductVariantImage,
} from "@/lib/storefront/product-presentation";

export const SITE_ORIGIN = "https://delivn.com.vn";

export type BreadcrumbEntry = {
  name: string;
  path: string;
};

/**
 * Serializes JSON-LD safely for inline <script type="application/ld+json"> tags
 * by escaping `<` to `\u003c` so product or CMS text cannot break out of the script element.
 */
export function serializeJsonLd(payload: unknown): string {
  return JSON.stringify(payload).replaceAll("<", "\\u003c");
}

function toAbsoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return `${SITE_ORIGIN}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

export function buildOrganizationJsonLd() {
  const officialSameAs = CONTACT_CHANNELS.flatMap((channel) =>
    channel.status === "active" ? [channel.href] : [],
  );

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY_INFORMATION.legalName,
    alternateName: "DELIVN Coffee",
    url: SITE_ORIGIN,
    taxID: COMPANY_INFORMATION.enterpriseNumber,
    telephone: COMPANY_INFORMATION.phone,
    email: COMPANY_INFORMATION.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY_INFORMATION.registeredOffice,
      addressLocality: "Thành phố Hồ Chí Minh",
      addressCountry: "VN",
    },
    ...(officialSameAs.length > 0 ? { sameAs: officialSameAs } : {}),
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DELIVN",
    url: SITE_ORIGIN,
    inLanguage: "vi-VN",
  };
}

export function buildBreadcrumbJsonLd(items: readonly BreadcrumbEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

export function buildProductGroupJsonLd(product: ProductDTO) {
  const displayName = getProductDisplayName(product);
  const description = getProductDisplayDescription(product);
  const canonicalProductUrl = `${SITE_ORIGIN}/san-pham/${product.slug}`;
  const productImages = product.media.map((item) => toAbsoluteUrl(item.url));

  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: displayName,
    description,
    url: canonicalProductUrl,
    ...(productImages.length > 0 ? { image: productImages } : {}),
    brand: {
      "@type": "Brand",
      name: "DELIVN",
    },
    productGroupID: product.slug,
    variesBy: ["https://schema.org/weight"],
    hasVariant: product.variants.map((variant) => {
      const variantImage = getProductVariantImage(product, variant);
      return {
        "@type": "Product",
        name: `${displayName} — ${variant.label}`,
        description,
        sku: variant.sku,
        image: toAbsoluteUrl(variantImage.url),
        brand: {
          "@type": "Brand",
          name: "DELIVN",
        },
        weight: {
          "@type": "QuantitativeValue",
          value: variant.weightGrams,
          unitCode: "GRM",
        },
        offers: {
          "@type": "Offer",
          url: `${canonicalProductUrl}?size=${variant.weightGrams}`,
          price: String(variant.priceVnd),
          priceCurrency: "VND",
          availability: variant.inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        },
      };
    }),
  };
}
