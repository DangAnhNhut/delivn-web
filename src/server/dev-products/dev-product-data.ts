import type { ProductCategory } from "@/contracts";
import type { ProductStatus } from "@/server/db/schema/products";

export type DevProduct = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: ProductCategory;
  status: ProductStatus;
  featured: false;
};

export type DevVariant = {
  id: string;
  productId: string;
  sku: string;
  label: string;
  weightGrams: number;
  priceVnd: number;
  compareAtPriceVnd: null;
  active: true;
};

export type DevMedia = {
  id: string;
  productId: string;
  type: "image";
  url: string;
  alt: string;
  sortOrder: number;
};

export type DevStock = {
  variantId: string;
  quantity: 100;
  reservedQuantity: 0;
};

export const DEV_PRODUCTS = [
  {
    id: "d3120000-0000-4000-8000-000000000001",
    slug: "dev-local-delivn-espresso",
    name: "CÀ PHÊ HẠT RANG ESPRESSO",
    shortName: "Hạt Rang",
    description: "Dữ liệu sản phẩm DELIVN dùng cho phát triển cục bộ.",
    category: "espresso",
    status: "active",
    featured: false,
  },
  {
    id: "d3120000-0000-4000-8000-000000000002",
    slug: "dev-local-delivn-rang-xay",
    name: "CÀ PHÊ RANG XAY",
    shortName: "Rang Xay",
    description: "Dữ liệu sản phẩm DELIVN dùng cho phát triển cục bộ.",
    category: "rang_xay",
    status: "active",
    featured: false,
  },
] as const satisfies readonly DevProduct[];

export const DEV_VARIANTS = [
  {
    id: "d3120000-0000-4000-8000-000000000101",
    productId: DEV_PRODUCTS[0].id,
    sku: "DEV-LOCAL-ESPRESSO-250",
    label: "250g",
    weightGrams: 250,
    priceVnd: 173_000,
    compareAtPriceVnd: null,
    active: true,
  },
  {
    id: "d3120000-0000-4000-8000-000000000102",
    productId: DEV_PRODUCTS[0].id,
    sku: "DEV-LOCAL-ESPRESSO-500",
    label: "500g",
    weightGrams: 500,
    priceVnd: 345_000,
    compareAtPriceVnd: null,
    active: true,
  },
  {
    id: "d3120000-0000-4000-8000-000000000201",
    productId: DEV_PRODUCTS[1].id,
    sku: "DEV-LOCAL-RANG-XAY-250",
    label: "250g",
    weightGrams: 250,
    priceVnd: 168_000,
    compareAtPriceVnd: null,
    active: true,
  },
  {
    id: "d3120000-0000-4000-8000-000000000202",
    productId: DEV_PRODUCTS[1].id,
    sku: "DEV-LOCAL-RANG-XAY-500",
    label: "500g",
    weightGrams: 500,
    priceVnd: 335_000,
    compareAtPriceVnd: null,
    active: true,
  },
] as const satisfies readonly DevVariant[];

export const DEV_MEDIA = [
  {
    id: "d3120000-0000-4000-8000-000000000301",
    productId: DEV_PRODUCTS[0].id,
    type: "image",
    url: "/products/black/front.png",
    alt: "Bao bì DELIVN Espresso màu đen dùng cho phát triển cục bộ",
    sortOrder: 0,
  },
  {
    id: "d3120000-0000-4000-8000-000000000302",
    productId: DEV_PRODUCTS[0].id,
    type: "image",
    url: "/products/black/three-quarter.png",
    alt: "Bao bì DELIVN Espresso màu đen góc nghiêng dùng cho phát triển cục bộ",
    sortOrder: 1,
  },
  {
    id: "d3120000-0000-4000-8000-000000000303",
    productId: DEV_PRODUCTS[1].id,
    type: "image",
    url: "/products/sand/front.png",
    alt: "Bao bì DELIVN Rang Xay màu cát dùng cho phát triển cục bộ",
    sortOrder: 0,
  },
  {
    id: "d3120000-0000-4000-8000-000000000304",
    productId: DEV_PRODUCTS[1].id,
    type: "image",
    url: "/products/sand/three-quarter.png",
    alt: "Bao bì DELIVN Rang Xay màu cát góc nghiêng dùng cho phát triển cục bộ",
    sortOrder: 1,
  },
] as const satisfies readonly DevMedia[];

export const DEV_STOCK = DEV_VARIANTS.map((variant) => ({
  variantId: variant.id,
  quantity: 100 as const,
  reservedQuantity: 0 as const,
})) satisfies readonly DevStock[];

export const DEV_PRODUCT_IDS = DEV_PRODUCTS.map((product) => product.id);
export const DEV_VARIANT_IDS = DEV_VARIANTS.map((variant) => variant.id);
