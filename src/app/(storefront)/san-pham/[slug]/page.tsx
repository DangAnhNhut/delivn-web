import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { ProductDetail } from "@/components/products/ProductDetail";
import {
  getProductDisplayDescription,
  getProductDisplayName,
} from "@/lib/storefront/product-presentation";
import { getStorefrontProductBySlug } from "@/lib/storefront/products";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await connection();
  const product = await getStorefrontProductBySlug(slug);

  if (!product) {
    return { title: "Không tìm thấy sản phẩm | DELIVN" };
  }

  return {
    title: `${getProductDisplayName(product)} | DELIVN`,
    description: getProductDisplayDescription(product),
  };
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ size?: string; variant?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  // Product price and availability are request-time commercial data. Calling
  // connection() keeps the database read out of Next.js prerendering/build.
  await connection();
  const product = await getStorefrontProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const matchedVariant = product.variants.find(
    (v) =>
      (query.variant && v.id === query.variant) ||
      (query.size && String(v.weightGrams) === query.size),
  );

  return (
    <ProductDetail
      product={product}
      initialVariantId={matchedVariant?.id ?? null}
    />
  );
}
