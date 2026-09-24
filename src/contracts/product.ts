export type ProductCategory = "espresso" | "rang_xay";

export type ProductMediaDTO = {
  id: string;
  type: "image";
  url: string;
  alt: string;
  sortOrder: number;
};

export type ProductVariantDTO = {
  id: string;
  sku: string;
  label: string;
  weightGrams: number;
  priceVnd: number;
  compareAtPriceVnd: number | null;
  inStock: boolean;
};

export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: ProductCategory;
  featured: boolean;
  media: ProductMediaDTO[];
  variants: ProductVariantDTO[];
};
