import { describe, expect, it } from "vitest";

import type { ProductDTO } from "@/contracts";
import {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildProductGroupJsonLd,
  buildWebSiteJsonLd,
  serializeJsonLd,
} from "./structured-data";

const sampleProduct: ProductDTO = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "ca-phe-hat-rang-espresso",
  name: "CÀ PHÊ HẠT RANG ESPRESSO",
  shortName: "Hạt Rang",
  description: "Mô tả thử nghiệm <script>alert(1)</script>",
  category: "espresso",
  featured: false,
  media: [
    {
      id: "00000000-0000-4000-8000-000000000011",
      type: "image",
      url: "/products/black/front.png",
      alt: "Espresso front",
      sortOrder: 0,
    },
  ],
  variants: [
    {
      id: "00000000-0000-4000-8000-000000000101",
      sku: "DELIVN-ESPRESSO-250",
      label: "250g",
      weightGrams: 250,
      priceVnd: 162000,
      compareAtPriceVnd: null,
      inStock: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000102",
      sku: "DELIVN-ESPRESSO-500",
      label: "500g",
      weightGrams: 500,
      priceVnd: 297000,
      compareAtPriceVnd: null,
      inStock: false,
    },
  ],
};

describe("structured-data helpers", () => {
  it("escapes < characters in serializeJsonLd to prevent script injection", () => {
    const serialized = serializeJsonLd({ text: "</script><img onerror=alert(1)>" });
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual({ text: "</script><img onerror=alert(1)>" });
  });

  it("builds Organization and WebSite JSON-LD from verified business identity", () => {
    const org = buildOrganizationJsonLd();
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe("CÔNG TY TNHH CÀ PHÊ DELIVN");
    expect(org.taxID).toBe("3703119501");
    expect(org.url).toBe("https://delivn.com.vn");
    expect(org.sameAs).not.toContain("#");

    const site = buildWebSiteJsonLd();
    expect(site["@type"]).toBe("WebSite");
    expect(site.url).toBe("https://delivn.com.vn");
  });

  it("builds ProductGroup JSON-LD dynamically from ProductDTO variants without invented fields", () => {
    const ld = buildProductGroupJsonLd(sampleProduct);
    expect(ld["@type"]).toBe("ProductGroup");
    expect(ld.hasVariant).toHaveLength(2);
    expect(ld.hasVariant[0].sku).toBe("DELIVN-ESPRESSO-250");
    expect(ld.hasVariant[0].offers.price).toBe("162000");
    expect(ld.hasVariant[0].offers.priceCurrency).toBe("VND");
    expect(ld.hasVariant[0].offers.availability).toBe("https://schema.org/InStock");
    expect(ld.hasVariant[1].offers.availability).toBe("https://schema.org/OutOfStock");
    expect(JSON.stringify(ld)).not.toMatch(/aggregateRating|reviewCount|gtin/i);

    const bc = buildBreadcrumbJsonLd([
      { name: "Trang chủ", path: "/" },
      { name: "Sản phẩm", path: "/san-pham" },
    ]);
    expect(bc.itemListElement).toHaveLength(2);
    expect(bc.itemListElement[1].item).toBe("https://delivn.com.vn/san-pham");
  });
});

