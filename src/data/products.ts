import type { Product } from "@/domain/product/types";

export const products: Product[] = [
  {
    id: "sand-ground",
    slug: "ca-phe-rang-xay",
    name: "Cà Phê Rang Xay",
    shortName: "Rang Xay",
    description:
      "Cà phê rang xay pha phin truyền thống, khơi nguồn từ vùng đất Tây Nguyên.",
    category: "ground_coffee",
    images: {
      front: "/products/sand/front.png",
      threeQuarter: "/products/sand/three-quarter.png",
    },
    isActive: true,
    variants: [
      {
        id: "sand-250",
        weightGrams: 250,
        priceVnd: null,
        sku: null,
        isActive: true,
      },
      {
        id: "sand-500",
        weightGrams: 500,
        priceVnd: null,
        sku: null,
        isActive: true,
      },
    ],
  },
  {
    id: "black-espresso",
    slug: "ca-phe-hat-rang-espresso",
    name: "Cà Phê Hạt Rang Espresso",
    shortName: "Hạt Rang",
    description:
      "Cà phê hạt rang espresso đặc biệt, chế tác từ nguồn nguyên liệu Tây Nguyên.",
    category: "coffee_beans",
    images: {
      front: "/products/black/front.png",
      threeQuarter: "/products/black/three-quarter.png",
    },
    isActive: true,
    variants: [
      {
        id: "black-250",
        weightGrams: 250,
        priceVnd: null,
        sku: null,
        isActive: true,
      },
      {
        id: "black-500",
        weightGrams: 500,
        priceVnd: null,
        sku: null,
        isActive: true,
      },
    ],
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

