import type { ProductCategory } from "@/contracts";
import type { ProductStatus } from "@/server/db/schema/products";

export type DemoProduct = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: ProductCategory;
  status: ProductStatus;
  featured: false;
};

export type DemoVariant = {
  id: string;
  productId: string;
  sku: string;
  label: string;
  weightGrams: number;
  priceVnd: number;
  compareAtPriceVnd: null;
  active: true;
};

export type DemoMedia = {
  id: string;
  productId: string;
  type: "image";
  url: string;
  alt: string;
  sortOrder: number;
};

export type DemoStock = {
  variantId: string;
  quantity: 100;
  reservedQuantity: 0;
};

export const DEMO_PRODUCTS = [
  {
    id: "d3110000-0000-4000-8000-000000000001",
    slug: "dev-demo-delivn-espresso",
    name: "DELIVN ESPRESSO — DEMO PHÁT TRIỂN",
    shortName: "Espresso Demo",
    description: "Dữ liệu sản phẩm tổng hợp chỉ dùng cho phát triển và kiểm thử thương mại.",
    category: "espresso",
    status: "active",
    featured: false,
  },
  {
    id: "d3110000-0000-4000-8000-000000000002",
    slug: "dev-demo-delivn-rang-xay",
    name: "DELIVN RANG XAY — DEMO PHÁT TRIỂN",
    shortName: "Rang Xay Demo",
    description: "Dữ liệu sản phẩm tổng hợp chỉ dùng cho phát triển và kiểm thử thương mại.",
    category: "rang_xay",
    status: "active",
    featured: false,
  },
] as const satisfies readonly DemoProduct[];

// Prices are the current business-provided DELIVN values. Deterministic IDs,
// DEV-DEMO identities, and stock remain development/E2E-only fixtures.
export const DEMO_VARIANTS = [
  {
    id: "d3110000-0000-4000-8000-000000000101",
    productId: DEMO_PRODUCTS[0].id,
    sku: "DEV-DEMO-ESPRESSO-250",
    label: "250g",
    weightGrams: 250,
    priceVnd: 173_000,
    compareAtPriceVnd: null,
    active: true,
  },
  {
    id: "d3110000-0000-4000-8000-000000000102",
    productId: DEMO_PRODUCTS[0].id,
    sku: "DEV-DEMO-ESPRESSO-500",
    label: "500g",
    weightGrams: 500,
    priceVnd: 345_000,
    compareAtPriceVnd: null,
    active: true,
  },
  {
    id: "d3110000-0000-4000-8000-000000000201",
    productId: DEMO_PRODUCTS[1].id,
    sku: "DEV-DEMO-RANG-XAY-250",
    label: "250g",
    weightGrams: 250,
    priceVnd: 168_000,
    compareAtPriceVnd: null,
    active: true,
  },
  {
    id: "d3110000-0000-4000-8000-000000000202",
    productId: DEMO_PRODUCTS[1].id,
    sku: "DEV-DEMO-RANG-XAY-500",
    label: "500g",
    weightGrams: 500,
    priceVnd: 335_000,
    compareAtPriceVnd: null,
    active: true,
  },
] as const satisfies readonly DemoVariant[];

export const DEMO_MEDIA = [
  {
    id: "d3110000-0000-4000-8000-000000000301",
    productId: DEMO_PRODUCTS[0].id,
    type: "image",
    url: "/products/black/front.png",
    alt: "Bao bì Espresso màu đen dùng cho dữ liệu demo phát triển",
    sortOrder: 0,
  },
  {
    id: "d3110000-0000-4000-8000-000000000302",
    productId: DEMO_PRODUCTS[0].id,
    type: "image",
    url: "/products/black/three-quarter.png",
    alt: "Bao bì Espresso màu đen góc nghiêng dùng cho dữ liệu demo phát triển",
    sortOrder: 1,
  },
  {
    id: "d3110000-0000-4000-8000-000000000303",
    productId: DEMO_PRODUCTS[1].id,
    type: "image",
    url: "/products/sand/front.png",
    alt: "Bao bì Rang Xay màu cát dùng cho dữ liệu demo phát triển",
    sortOrder: 0,
  },
  {
    id: "d3110000-0000-4000-8000-000000000304",
    productId: DEMO_PRODUCTS[1].id,
    type: "image",
    url: "/products/sand/three-quarter.png",
    alt: "Bao bì Rang Xay màu cát góc nghiêng dùng cho dữ liệu demo phát triển",
    sortOrder: 1,
  },
] as const satisfies readonly DemoMedia[];

export const DEMO_STOCK = DEMO_VARIANTS.map((variant) => ({
  variantId: variant.id,
  quantity: 100 as const,
  reservedQuantity: 0 as const,
})) satisfies readonly DemoStock[];

export const DEMO_VARIANT_IDS = DEMO_VARIANTS.map((variant) => variant.id);
