import "server-only";

import type { ProductDTO } from "@/contracts";
import { createProductService } from "@/server/services/product.service";

type StorefrontProductListService = Pick<
  ReturnType<typeof createProductService>,
  "listActiveProducts"
>;

type StorefrontProductDetailService = Pick<
  ReturnType<typeof createProductService>,
  "getActiveProductBySlug"
>;

export async function getStorefrontProducts(
  productService: StorefrontProductListService = createProductService(),
): Promise<ProductDTO[]> {
  return productService.listActiveProducts();
}

export async function getStorefrontProductBySlug(
  slug: string,
  productService: StorefrontProductDetailService = createProductService(),
): Promise<ProductDTO | null> {
  return productService.getActiveProductBySlug(slug);
}
