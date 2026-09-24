"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { finalCtaContent } from "@/data/content/home";
import { FinalCTAMotion } from "./FinalCTAMotion";

export function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const { eyebrow, headline, description, cta, footnote, productImage } =
    finalCtaContent;

  return (
    <section
      ref={sectionRef}
      id="chon-gu-ca-phe"
      aria-labelledby="final-cta-heading"
      className="relative w-full bg-background border-t border-border/40 overflow-hidden pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-24 lg:pb-32"
    >
      {/* GSAP ScrollTrigger entrance motion */}
      <FinalCTAMotion sectionRef={sectionRef} />

      {/* Subtle ambient radial glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none select-none -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 65% 50%, rgba(234, 225, 213, 0.42) 0%, rgba(250, 246, 241, 0) 70%)",
        }}
      />

      <div className="site-shell relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 xl:gap-16 items-center">
          {/* LEFT COLUMN: Editorial CTA Copy (approx 42% on desktop: 5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-start order-1">
            {/* Eyebrow with Brand Terracotta Dot */}
            <div className="final-cta-eyebrow inline-flex items-center gap-2.5 mb-4 sm:mb-5">
              <span
                className="w-2 h-2 rounded-full bg-accent shrink-0"
                aria-hidden="true"
              />
              <span className="text-xs sm:text-[13px] font-bold tracking-[0.24em] uppercase text-foreground-muted/90">
                {eyebrow}
              </span>
            </div>

            {/* Dominant Headline */}
            <h2
              id="final-cta-heading"
              className="final-cta-headline text-3xl sm:text-4xl lg:text-[44px] xl:text-[50px] font-extrabold tracking-tight text-foreground uppercase leading-[1.08]"
            >
              {headline.main}
            </h2>

            {/* Editorial Serif Subtitle */}
            <p className="final-cta-serif text-2xl sm:text-3xl lg:text-[32px] xl:text-[36px] font-display-serif italic text-foreground/90 font-light mt-1.5 sm:mt-2 leading-snug">
              {headline.serif}
            </p>

            {/* Supporting Brand Narrative */}
            <p className="final-cta-desc text-foreground-muted text-base sm:text-lg leading-relaxed max-w-lg mt-5 sm:mt-6 font-normal">
              {description}
            </p>

            {/* Primary Action Button — established DELIVN CTA design language */}
            <div className="final-cta-action mt-8 sm:mt-9 w-full sm:w-auto">
              <Link
                href={cta.href}
                className="group/cta inline-flex items-center justify-center gap-3 w-full sm:w-auto px-9 sm:px-10 xl:px-11 py-4 sm:py-4.5 bg-foreground text-background font-semibold text-sm xl:text-[15px] tracking-[0.14em] uppercase rounded-sm hover:bg-foreground/85 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent shadow-sm"
              >
                <span>{cta.label}</span>
                <span
                  className="text-base xl:text-lg leading-none transition-transform duration-200 group-hover/cta:translate-x-1 text-sand"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            </div>

            {/* Editorial Footnote Marker (Desktop only under CTA) */}
            <div className="final-cta-footnote hidden lg:flex mt-9 sm:mt-11 pt-5 sm:pt-6 border-t border-border/50 items-center gap-4 text-xs font-mono tracking-wider text-foreground-muted/75">
              <span className="font-semibold uppercase">{footnote.left}</span>
              <span className="w-1 h-1 rounded-full bg-sand shrink-0" aria-hidden="true" />
              <span className="font-semibold uppercase">{footnote.right}</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Studio Duo-Product Composition (approx 58% on desktop: 7 cols) */}
          <div className="lg:col-span-7 relative flex flex-col items-center justify-center order-2">
            {/* Single subtle packaging-derived concentric contour behind product */}
            <div
              aria-hidden="true"
              className="final-cta-motif absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[500px] lg:w-[620px] aspect-square rounded-full border border-[#C5A988]/20 pointer-events-none -z-10 select-none"
            />

            {/* Dual Product Image Container */}
            <div className="final-cta-product relative w-full max-w-[500px] sm:max-w-[560px] lg:max-w-[620px] overflow-visible">
              <Image
                src={productImage.src}
                alt={productImage.alt}
                width={productImage.width}
                height={productImage.height}
                loading="lazy"
                sizes="(max-width: 768px) 92vw, (max-width: 1280px) 52vw, 620px"
                className="w-full h-auto object-contain block drop-shadow-[0_24px_36px_rgba(22,22,22,0.16)] drop-shadow-[0_8px_16px_rgba(22,22,22,0.08)] select-none"
              />
            </div>

            {/* Under-product editorial caption tags */}
            <div className="final-cta-caption mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10.5px] sm:text-[11.5px] font-semibold uppercase tracking-[0.18em] text-foreground-muted/75 select-none">
              <span>{productImage.caption.espresso}</span>
              <span className="w-1 h-1 rounded-full bg-sand shrink-0" aria-hidden="true" />
              <span>{productImage.caption.rangXay}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
