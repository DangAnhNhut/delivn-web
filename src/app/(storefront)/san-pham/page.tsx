import type { Metadata } from "next";
import Image from "next/image";
import { connection } from "next/server";

import { ProductCatalog } from "@/components/products/ProductCatalog";
import { getStorefrontProducts } from "@/lib/storefront/products";

export const metadata: Metadata = {
  title: "Sản phẩm",
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
      <section
        aria-labelledby="products-page-title"
        className="border-b border-border bg-background"
      >
        <div className="site-shell grid min-h-[calc(100svh-var(--header-height))] grid-cols-1 items-center gap-10 py-14 sm:py-16 lg:grid-cols-12 lg:gap-14 lg:py-20 xl:gap-20">
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
              <p className="text-xs font-bold tracking-[0.26em] text-foreground uppercase">
                Cà phê DELIVN
              </p>
            </div>

            <h1
              id="products-page-title"
              className="mt-6 text-[clamp(2.65rem,6vw,6.5rem)] font-bold leading-[0.96] tracking-[-0.055em] text-foreground uppercase"
            >
              <span className="block">Chọn gu cà phê</span>
              <span className="mt-2 block font-display-serif font-medium italic tracking-[-0.045em] normal-case">
                phù hợp với bạn.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-foreground-muted sm:text-lg lg:mt-9">
              Hai dòng cà phê, hai cách thưởng thức. DELIVN giúp bạn đi thẳng đến lựa chọn phù hợp với nhịp cà phê mỗi ngày.
            </p>

            <a
              href="#product-selection-title"
              className="mt-8 inline-flex items-center gap-3 border-b border-foreground/40 pb-1.5 text-xs font-bold tracking-[0.2em] text-foreground uppercase transition-colors duration-300 hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
            >
              Khám phá sản phẩm <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="relative lg:col-span-6 lg:col-start-7 xl:col-span-7 xl:col-start-6">
            <div className="relative aspect-[5/4] overflow-hidden bg-surface">
              <Image
                src="/products/hero/delivn-hero-products.png"
                alt="Hai dòng cà phê DELIVN"
                fill
                preload
                sizes="(max-width: 1023px) calc(100vw - 48px), 55vw"
                className="object-cover object-center"
              />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[10px] font-semibold tracking-[0.18em] text-foreground-muted uppercase sm:text-[11px]">
              <span>01 / Espresso</span>
              <span>02 / Rang xay</span>
            </div>
          </div>
        </div>
      </section>

      <ProductCatalog products={products} />
    </div>
  );
}
