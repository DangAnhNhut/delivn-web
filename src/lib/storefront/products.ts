import "server-only";

import type { ProductDTO } from "@/contracts";
import { createProductService } from "@/server/services/product.service";

type StorefrontProductService = Pick<
  ReturnType<typeof createProductService>,
  "listActiveProducts"
>;

export async function getStorefrontProducts(
  productService: StorefrontProductService = createProductService(),
): Promise<ProductDTO[]> {
  return productService.listActiveProducts();
}
