import type { Metadata } from "next";
import { connection } from "next/server";

import { ProductCatalog } from "@/components/products/ProductCatalog";
import { getStorefrontProducts } from "@/lib/storefront/products";

export const metadata: Metadata = {
  title: "Sản phẩm | Cà phê DELIVN",
  description:
    "Khám phá các dòng cà phê DELIVN và lựa chọn quy cách phù hợp với bạn.",
};

export default async function ProductsPage() {
  // Product availability is request-time commercial data. This Next.js 16 API
  // prevents the direct database read below from running during prerender/build.
  await connection();
  const products = await getStorefrontProducts();

  return (
    <div className="overflow-x-clip bg-background">
      <header
        aria-labelledby="product-catalog-title"
        className="site-shell pt-6 pb-2 sm:pt-7 sm:pb-3 lg:pt-8 lg:pb-3"
      >
        <div className="border-b border-border/60 pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            <p className="text-[10px] font-bold tracking-[0.24em] text-foreground-muted uppercase">
              Danh mục sản phẩm
            </p>
          </div>
          <h1
            id="product-catalog-title"
            className="mt-1.5 text-2xl font-bold tracking-tight text-foreground uppercase sm:text-3xl lg:text-4xl"
          >
            Cà phê DELIVN
          </h1>
        </div>
      </header>

      <ProductCatalog products={products} />
    </div>
  );
}
