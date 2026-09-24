import type { ProductDTO } from "@/contracts";
import {
  createProductRepository,
  type ProductRepository,
  type ProductStoreRecord,
} from "@/server/repositories/product.repository";

type ProductReadRepository = Pick<
  ProductRepository,
  "listActiveProducts" | "findActiveProductBySlug"
>;

export function mapProductRecordToDto(record: ProductStoreRecord): ProductDTO {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    shortName: record.shortName,
    description: record.description,
    category: record.category,
    featured: record.featured,
    media: [...record.media]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map(({ id, type, url, alt, sortOrder }) => ({ id, type, url, alt, sortOrder })),
    variants: record.variants
      .filter((variant) => variant.active)
      .sort(
        (left, right) =>
          left.weightGrams - right.weightGrams || left.sku.localeCompare(right.sku),
      )
      .map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        label: variant.label,
        weightGrams: variant.weightGrams,
        priceVnd: variant.priceVnd,
        compareAtPriceVnd: variant.compareAtPriceVnd,
        inStock:
          variant.quantity !== null &&
          variant.reservedQuantity !== null &&
          variant.quantity - variant.reservedQuantity > 0,
      })),
  };
}

export function createProductService(
  repository: ProductReadRepository = createProductRepository(),
) {
  return {
    async listActiveProducts(): Promise<ProductDTO[]> {
      return (await repository.listActiveProducts()).map(mapProductRecordToDto);
    },

    async getActiveProductBySlug(slug: string): Promise<ProductDTO | null> {
      const product = await repository.findActiveProductBySlug(slug);
      return product ? mapProductRecordToDto(product) : null;
    },
  };
}
