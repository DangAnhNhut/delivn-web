import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { ProductDetail } from "@/components/products/ProductDetail";
import {
  buildBreadcrumbJsonLd,
  buildProductGroupJsonLd,
  serializeJsonLd,
} from "@/lib/seo/structured-data";
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

  const displayName = getProductDisplayName(product);
  const description = getProductDisplayDescription(product);
  const canonicalPath = `/san-pham/${product.slug}`;

  return {
    title: `${displayName} | DELIVN`,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${displayName} | DELIVN`,
      description,
      url: canonicalPath,
    },
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

  const productJsonLd = serializeJsonLd(buildProductGroupJsonLd(product));
  const breadcrumbJsonLd = serializeJsonLd(
    buildBreadcrumbJsonLd([
      { name: "Trang chủ", path: "/" },
      { name: "Sản phẩm", path: "/san-pham" },
      { name: getProductDisplayName(product), path: `/san-pham/${product.slug}` },
    ]),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: productJsonLd }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />
      <ProductDetail
        product={product}
        initialVariantId={matchedVariant?.id ?? null}
      />
    </>
  );
}
