"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { coffeeLinesContent } from "@/data/content/home";
import { CoffeeLinesMotion } from "./CoffeeLinesMotion";
import { TayNguyenMountainBackdrop } from "./TayNguyenMountainBackdrop";

export function CoffeeLines() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-background pt-16 sm:pt-20 lg:pt-28 pb-20 sm:pb-24 lg:pb-32 overflow-hidden border-t border-border/40"
      aria-labelledby="coffee-lines-title"
    >
      {/* GSAP ScrollTrigger Motion Controller */}
      <CoffeeLinesMotion sectionRef={sectionRef} />

      <div className="site-shell flex flex-col items-center">
        {/* EDITORIAL INTRO HEADER */}
        <div className="coffee-lines-header relative w-full max-w-4xl mx-auto text-center flex flex-col items-center py-4 sm:py-6">
          <TayNguyenMountainBackdrop className="-inset-x-6 sm:-inset-x-12 -inset-y-2 opacity-85" />

          {/* Eyebrow Tag with red dot */}
          <div className="coffee-lines-eyebrow relative z-10 inline-flex items-center gap-2.5">
            <span
              className="w-2 h-2 rounded-full bg-accent flex-shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs md:text-[13px] font-semibold tracking-[0.28em] text-foreground uppercase">
              {coffeeLinesContent.eyebrow}
            </span>
          </div>

          {/* Headline: Editorial 2-line hierarchy */}
          <h2
            id="coffee-lines-title"
            className="coffee-lines-title relative z-10 mt-5 sm:mt-6 text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] font-bold text-foreground tracking-tight leading-[1.22] uppercase"
          >
            <span className="block">{coffeeLinesContent.headline.main}</span>
            <span className="block mt-1.5 sm:mt-2">
              <span className="font-display-serif font-normal italic text-foreground-muted inline-block mr-2.5 sm:mr-3">
                {coffeeLinesContent.headline.bridge}
              </span>
              <span className="font-extrabold text-[#9E6B20]">
                {coffeeLinesContent.headline.highlight}
              </span>
            </span>
          </h2>

          {/* Narrative paragraph */}
          <p className="coffee-lines-intro relative z-10 mt-5 sm:mt-6 text-base sm:text-lg text-foreground-muted font-light leading-relaxed max-w-2xl mx-auto">
            {coffeeLinesContent.intro}
          </p>
        </div>

        {/* TWO-COLUMN PRODUCT STORYTELLING SHOWCASE */}
        <div className="coffee-lines-grid mt-12 sm:mt-16 lg:mt-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 xl:gap-20 w-full items-start">
          {coffeeLinesContent.products.map((product) => (
            <article
              key={product.title}
              className="coffee-lines-card group flex flex-col items-start w-full"
            >
              {/* Tag / Meta Line */}
              <div className="w-full pb-3 sm:pb-4 border-b border-border/80 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-[0.24em] text-foreground-muted uppercase">
                  {product.index}
                </span>
                <span className="text-xs font-medium tracking-[0.1em] text-foreground-muted/80">
                  {product.weight}
                </span>
              </div>

              {/* Refined Product Photography */}
              <div className="w-full flex flex-col items-center justify-center pt-5 sm:pt-6 pb-4 sm:pb-6">
                <div className="coffee-lines-image relative w-full max-w-[500px] lg:max-w-[540px] aspect-[1456/1088] rounded-xl overflow-hidden border border-border/50 shadow-md bg-surface">
                  <Image
                    src={product.image.src}
                    alt={product.image.alt}
                    width={product.image.width}
                    height={product.image.height}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  />
                </div>
              </div>

              {/* Product Details */}
              <div className="coffee-lines-details w-full flex flex-col mt-2">
                {/* Descriptors Chips */}
                <div className="flex flex-wrap items-center gap-2 mb-3.5">
                  {product.descriptors.map((descriptor) => (
                    <span
                      key={descriptor}
                      className="px-3.5 py-1.5 rounded-full bg-surface text-foreground text-xs font-medium tracking-wide border border-border/50"
                    >
                      {descriptor}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground tracking-tight leading-[1.3]">
                  {product.title}
                </h3>

                {/* Description */}
                <p className="mt-3 text-foreground-muted text-sm sm:text-base font-light leading-relaxed">
                  {product.description}
                </p>

                {/* Text link CTA */}
                <div className="mt-5 sm:mt-6">
                  <Link
                    href={product.cta.href}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-foreground hover:text-accent group/link transition-colors pb-1 border-b border-foreground/30 hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded-xs"
                  >
                    <span>{product.cta.label}</span>
                    <span
                      className="transition-transform duration-300 group-hover/link:translate-x-1.5"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* SHARED SECONDARY CTA AT BOTTOM */}
        <div className="coffee-lines-bottom-cta mt-14 sm:mt-18 lg:mt-24 flex justify-center">
          <Link
            href={coffeeLinesContent.bottomCta.href}
            className="group inline-flex items-center gap-3 px-8 py-3.5 sm:py-4 rounded-full border border-border hover:border-foreground bg-transparent hover:bg-foreground text-foreground hover:text-background transition-all duration-300 shadow-xs hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="text-xs sm:text-sm font-bold tracking-[0.22em] uppercase">
              {coffeeLinesContent.bottomCta.label}
            </span>
            <span
              className="transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
