import { describe, expect, it, vi } from "vitest";

import type { ProductDTO } from "@/contracts";

vi.mock("server-only", () => ({}));

import {
  getStorefrontProductBySlug,
  getStorefrontProducts,
} from "./products";

const canonicalProduct: ProductDTO = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "ca-phe-rang-xay",
  name: "CÀ PHÊ RANG XAY",
  shortName: "Rang Xay",
  description: "Cà phê rang xay DELIVN.",
  category: "rang_xay",
  featured: true,
  media: [],
  variants: [],
};

describe("getStorefrontProducts", () => {
  it("returns the canonical ProductDTO values supplied by the product service", async () => {
    const service = {
      listActiveProducts: async (): Promise<ProductDTO[]> => [canonicalProduct],
    };

    await expect(getStorefrontProducts(service)).resolves.toEqual([canonicalProduct]);
  });

  it("preserves a successful empty product result", async () => {
    const service = {
      listActiveProducts: async (): Promise<ProductDTO[]> => [],
    };

    await expect(getStorefrontProducts(service)).resolves.toEqual([]);
  });

  it("propagates product service failures instead of converting them to an empty result", async () => {
    const infrastructureError = new Error("database unavailable");
    const service = {
      listActiveProducts: async (): Promise<ProductDTO[]> => {
        throw infrastructureError;
      },
    };

    await expect(getStorefrontProducts(service)).rejects.toBe(infrastructureError);
  });
});

describe("getStorefrontProductBySlug", () => {
  it("returns the canonical ProductDTO supplied by the product service", async () => {
    const service = {
      getActiveProductBySlug: async (): Promise<ProductDTO | null> => canonicalProduct,
    };

    await expect(
      getStorefrontProductBySlug("ca-phe-rang-xay", service),
    ).resolves.toBe(canonicalProduct);
  });

  it("preserves a missing or inactive product result as null", async () => {
    const service = {
      getActiveProductBySlug: async (): Promise<ProductDTO | null> => null,
    };

    await expect(
      getStorefrontProductBySlug("khong-ton-tai", service),
    ).resolves.toBeNull();
  });

  it("propagates infrastructure failures instead of converting them to null", async () => {
    const infrastructureError = new Error("database unavailable");
    const service = {
      getActiveProductBySlug: async (): Promise<ProductDTO | null> => {
        throw infrastructureError;
      },
    };

    await expect(
      getStorefrontProductBySlug("ca-phe-rang-xay", service),
    ).rejects.toBe(infrastructureError);
  });
});
