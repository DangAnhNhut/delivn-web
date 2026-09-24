export type ProductCategory = "ground_coffee" | "coffee_beans";

export interface ProductVariant {
  id: string;
  weightGrams: 250 | 500;
  priceVnd: number | null;
  sku: string | null;
  isActive: boolean;
}

export interface ProductImages {
  front: string;
  threeQuarter: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: ProductCategory;
  images: ProductImages;
  isActive: boolean;
  variants: ProductVariant[];
}
