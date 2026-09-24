import { notFound } from "next/navigation";
import { connection } from "next/server";

import { ProductDetail } from "@/components/products/ProductDetail";
import { getStorefrontProductBySlug } from "@/lib/storefront/products";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Product price and availability are request-time commercial data. Calling
  // connection() keeps the database read out of Next.js prerendering/build.
  await connection();
  const product = await getStorefrontProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
