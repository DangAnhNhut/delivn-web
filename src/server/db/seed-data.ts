import type { ProductCategory } from "@/contracts";
import { SeedConfigurationError } from "@/server/errors/commerce-error";
import { POSTGRES_INTEGER_MAX } from "@/server/utils/money";

export type DevelopmentSeedVariant = {
  sku: string;
  label: string;
  weightGrams: number;
  priceVnd: number;
  stock: number;
};

export type DevelopmentSeedProduct = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: ProductCategory;
  variants: DevelopmentSeedVariant[];
};

export type DevelopmentSeedMedia = {
  id: string;
  productSlug: string;
  url: string;
  alt: string;
  sortOrder: number;
};

export type DevelopmentSeedTemplate = {
  products: DevelopmentSeedProduct[];
  media?: DevelopmentSeedMedia[];
};

type Environment = Record<string, string | undefined>;

function requiredText(environment: Environment, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new SeedConfigurationError(`${name} is required for the development seed.`);
  return value;
}

function requiredInteger(
  environment: Environment,
  name: string,
  minimum: number,
  maximum: number,
): number {
  const raw = requiredText(environment, name);
  if (!/^\d+$/.test(raw)) {
    throw new SeedConfigurationError(`${name} must be an integer from ${minimum} to ${maximum}.`);
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new SeedConfigurationError(`${name} must be an integer from ${minimum} to ${maximum}.`);
  }
  return value;
}

function variant(
  environment: Environment,
  prefix: string,
  weightGrams: number,
): DevelopmentSeedVariant {
  return {
    sku: requiredText(environment, `${prefix}_SKU`),
    label: `${weightGrams}g`,
    weightGrams,
    priceVnd: requiredInteger(environment, `${prefix}_PRICE_VND`, 1, POSTGRES_INTEGER_MAX),
    stock: requiredInteger(environment, `${prefix}_STOCK`, 0, POSTGRES_INTEGER_MAX),
  };
}

export function loadDevelopmentSeedTemplate(environment: Environment): DevelopmentSeedTemplate {
  return {
    products: [
      {
        slug: "ca-phe-hat-rang-espresso",
        name: "CÀ PHÊ HẠT RANG ESPRESSO",
        shortName: "Hạt Rang",
        description:
          "Cà phê hạt rang espresso đặc biệt, chế tác từ nguồn nguyên liệu Tây Nguyên.",
        category: "espresso",
        variants: [
          variant(environment, "DELIVN_SEED_ESPRESSO_250", 250),
          variant(environment, "DELIVN_SEED_ESPRESSO_500", 500),
        ],
      },
      {
        slug: "ca-phe-rang-xay",
        name: "CÀ PHÊ RANG XAY",
        shortName: "Rang Xay",
        description:
          "Cà phê rang xay pha phin truyền thống, khơi nguồn từ vùng đất Tây Nguyên.",
        category: "rang_xay",
        variants: [
          variant(environment, "DELIVN_SEED_RANG_XAY_250", 250),
          variant(environment, "DELIVN_SEED_RANG_XAY_500", 500),
        ],
      },
    ],
  };
}
