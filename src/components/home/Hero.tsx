"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { heroContent } from "@/data/content/home";
import {
  UpperLeftWatermark,
  UpperLeftMarginalAccent,
  EthnicDividerLine,
} from "./TayNguyenMotifs";
import { HeroMotion } from "./HeroMotion";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full min-h-0 lg:h-[var(--hero-usable-height)] lg:min-h-[660px] min-[1920px]:min-h-[760px] flex flex-col justify-center overflow-hidden"
      aria-label="Giới thiệu DELIVN"
    >
      {/* GSAP Motion Controller */}
      <HeroMotion sectionRef={sectionRef} />

      {/* AUTHENTIC DELIVN BRAND ARTWORK LAYER 1 — Ghosted sunburst in upper-left corner */}
      <UpperLeftWatermark className="hero-sun-left" />

      {/* AUTHENTIC DELIVN BRAND ARTWORK LAYER 2 — One dominant motif behind product stage */}
      <div
        className="hero-sun-right absolute -top-16 -right-16 sm:-top-24 sm:-right-24 lg:-top-28 lg:-right-28 xl:-top-36 xl:-right-32 min-[1920px]:-top-44 min-[1920px]:-right-40 w-[540px] h-[540px] sm:w-[700px] sm:h-[700px] lg:w-[880px] lg:h-[880px] xl:w-[1000px] xl:h-[1000px] min-[1920px]:w-[1140px] min-[1920px]:h-[1140px] pointer-events-none select-none -z-10 opacity-[0.035] lg:opacity-[0.04] min-[1920px]:opacity-[0.05] transition-opacity duration-500"
        aria-hidden="true"
      >
        <Image
          src="/brand/delivn-sun-motif.png"
          alt=""
          fill
          sizes="(min-width: 1920px) 1140px, (min-width: 1280px) 1000px, (min-width: 1024px) 880px, 700px"
          className="object-contain"
          priority={false}
        />
      </div>

      {/* LAYER 1: COFFEE LEAF BRANCH — Natural framing from top-right edge (behind product & beans) */}
      <div
        className="hero-leaves absolute -top-6 sm:-top-8 lg:-top-10 xl:-top-12 -right-14 sm:-right-18 lg:-right-20 xl:-right-24 2xl:-right-28 min-[1920px]:-right-32 w-[340px] sm:w-[380px] lg:w-[440px] xl:w-[480px] 2xl:w-[540px] min-[1920px]:w-[580px] aspect-[1800/1151] pointer-events-none select-none z-[1] hidden lg:block opacity-90 will-change-transform"
        aria-hidden="true"
      >
        <Image
          src="/decor/coffee-leaves.png"
          alt=""
          fill
          sizes="(min-width: 1920px) 580px, (min-width: 1536px) 540px, (min-width: 1280px) 480px, 440px"
          className="object-contain"
          priority
        />
      </div>

      <div className="site-shell w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-center min-h-0 py-4 lg:py-0 relative z-10">
        {/* LEFT COLUMN: Dominant Editorial Text Block (~41.7% width, elevated & shifted inward) */}
        <div className="hero-left-content lg:col-span-5 flex flex-col justify-center py-3 lg:py-0 pr-0 lg:pr-4 xl:pr-6 lg:-translate-y-4 xl:-translate-y-7 min-[1920px]:-translate-y-9 xl:translate-x-6 min-[1920px]:translate-x-10 min-[2560px]:translate-x-14 relative z-20">
          {/* Subtle indigenous Tây Nguyên graphic motif accent */}
          <UpperLeftMarginalAccent className="hero-marginal-accent mb-4 sm:mb-5 hidden sm:flex" />

          {/* Editorial index anchor and eyebrow */}
          <div className="hero-eyebrow inline-flex items-center gap-3 mb-4 sm:mb-5 xl:mb-6">
            <span className="text-[11px] xl:text-xs font-mono tracking-[0.25em] text-foreground-muted/45 uppercase select-none">
              01
            </span>
            <span className="w-6 h-[1px] bg-border" aria-hidden="true" />
            <span
              className="w-2.5 h-2.5 rounded-full bg-accent shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs sm:text-[13px] xl:text-[13.5px] min-[1920px]:text-[14px] font-bold tracking-[0.24em] uppercase text-foreground-muted/90">
              {heroContent.eyebrow}
            </span>
          </div>

          {/* Editorial Title Headline — dominant high contrast typography (76px at 1440, 88px at 1920, 96px at 2560) */}
          <h1 className="text-4xl sm:text-5xl lg:text-[clamp(3.75rem,5.1vw,4.75rem)] xl:text-[76px] min-[1920px]:text-[88px] min-[2560px]:text-[96px] font-extrabold text-foreground tracking-tight leading-[0.96] xl:leading-[0.94] min-[1920px]:leading-[0.92] mb-5 sm:mb-6 xl:mb-7">
            <span className="hero-headline-line block">{heroContent.headline.line1}</span>
            <span className="hero-headline-line block">{heroContent.headline.line2}</span>
            <span className="hero-headline-line block text-accent">{heroContent.headline.highlight}</span>
          </h1>

          {/* Brand Narrative Description — comfortable editorial line length (18.5px at 1440, 19.5px at 1920) */}
          <p className="hero-description text-foreground-muted text-base sm:text-[17px] xl:text-[18.5px] min-[1920px]:text-[19.5px] min-[2560px]:text-[20px] leading-relaxed xl:leading-[1.65] min-[1920px]:leading-[1.7] max-w-md sm:max-w-[490px] xl:max-w-[530px] min-[1920px]:max-w-[560px] min-[2560px]:max-w-[580px] mb-7 sm:mb-8 xl:mb-9 font-normal">
            {heroContent.description}
          </p>

          {/* CTA Action Button — substantial, dark, matching stronger hierarchy */}
          <div className="hero-cta flex flex-wrap items-center gap-5">
            <Link
              href={heroContent.cta.href}
              className="group/cta inline-flex items-center justify-center gap-3 px-9 sm:px-10 xl:px-11 min-[1920px]:px-12 py-4 sm:py-4.5 xl:py-5 bg-foreground text-background font-semibold text-sm xl:text-[15px] min-[1920px]:text-[15.5px] tracking-[0.14em] uppercase rounded-sm hover:bg-foreground/85 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent shadow-sm"
            >
              <span>{heroContent.cta.label}</span>
              <span className="text-base xl:text-lg leading-none transition-transform duration-200 group-hover/cta:translate-x-1" aria-hidden="true">→</span>
            </Link>
          </div>

          {/* SUBTLE SUPPORTING MICRO-CONTENT ROW UNDER CTA WITH ETHNIC DIVIDER */}
          <div className="hero-supporting-row mt-7 sm:mt-8 xl:mt-9">
            <EthnicDividerLine className="mb-3.5" />
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-y-1.5 gap-x-3 sm:gap-x-4 text-[10.5px] sm:text-[11px] xl:text-[11.5px] min-[1920px]:text-[12px] font-medium tracking-[0.18em] text-foreground-muted/70 uppercase select-none">
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C6D48]/70" aria-hidden="true" />
                02 DÒNG CÀ PHÊ
              </span>
              <span className="text-border shrink-0" aria-hidden="true">·</span>
              <span className="shrink-0">ESPRESSO / PHA PHIN</span>
              <span className="text-border shrink-0" aria-hidden="true">·</span>
              <span className="shrink-0">CẢM HỨNG TỪ TÂY NGUYÊN</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Dominant Product Visual Stage (~58.3% width) */}
        <div className="lg:col-span-7 relative flex items-center justify-center lg:justify-end py-4 lg:py-0 lg:translate-x-3 xl:translate-x-6 min-[1920px]:translate-x-10 2xl:translate-x-14 z-10">
          {/* Multi-stop warm ambient halo — soft radial dissipation */}
          <div
            className="hero-ambient-halo w-[clamp(400px,44vw,880px)] h-[clamp(400px,44vw,880px)] min-[1920px]:w-[980px] min-[1920px]:h-[980px] bg-[radial-gradient(circle,rgba(235,227,213,0.72)_0%,rgba(242,234,224,0.40)_46%,rgba(250,246,241,0)_74%)] rounded-full blur-3xl absolute -z-10 pointer-events-none will-change-opacity"
            aria-hidden="true"
          />

          {/* Soft grounding contact shadow underneath the physical product bags */}
          <div
            className="hero-product-shadow w-[74%] max-w-[520px] min-[1920px]:max-w-[620px] h-6 sm:h-8 bg-[#2C2C2C]/[0.08] blur-xl rounded-full absolute bottom-2 sm:bottom-4 pointer-events-none -z-10 will-change-transform"
            aria-hidden="true"
          />

          {/* LAYER 2: FALLING COFFEE BEANS — Loose diagonal trajectory around product stage */}
          <div className="hero-bean-cluster absolute inset-0 pointer-events-none z-[2] will-change-transform" aria-hidden="true">
            {/* Bean 1: Upper right accent near foliage */}
            <div className="hero-bean hero-bean-1 absolute top-[8%] right-[8%] xl:top-[9%] xl:right-[10%] w-8 xl:w-9 rotate-[-22deg] hidden xl:block select-none drop-shadow-[0_4px_8px_rgba(44,44,44,0.12)] will-change-transform">
              <Image
                src="/decor/beans/bean-01.png"
                alt=""
                width={240}
                height={118}
                className="w-full h-auto object-contain"
                priority
              />
            </div>

            {/* Bean 2: Product upper drift above espresso bag */}
            <div className="hero-bean hero-bean-2 absolute top-[12%] left-[16%] lg:top-[10%] lg:left-[18%] xl:top-[12%] xl:left-[20%] w-10 lg:w-11 xl:w-12 rotate-[16deg] hidden lg:block select-none drop-shadow-[0_6px_12px_rgba(44,44,44,0.14)] will-change-transform">
              <Image
                src="/decor/beans/bean-03.png"
                alt=""
                width={240}
                height={233}
                className="w-full h-auto object-contain"
                priority
              />
            </div>

            {/* Bean 3: Large accent bean flanking outer right of kraft bag */}
            <div className="hero-bean hero-bean-3 absolute top-[34%] right-[0%] lg:top-[32%] lg:-right-[1%] xl:top-[35%] xl:right-[2%] w-14 lg:w-14 xl:w-16 2xl:w-[66px] rotate-[32deg] hidden lg:block select-none drop-shadow-[0_8px_18px_rgba(44,44,44,0.18)] will-change-transform">
              <Image
                src="/decor/beans/bean-02.png"
                alt=""
                width={240}
                height={214}
                className="w-full h-auto object-contain"
                priority
              />
            </div>

            {/* Bean 4: Depth-of-field soft-focus bean with subtle blur & opacity */}
            <div className="hero-bean hero-bean-4 absolute top-[58%] right-[6%] lg:top-[56%] lg:right-[5%] xl:top-[59%] xl:right-[7%] w-9 lg:w-9 xl:w-10 rotate-[-38deg] hidden xl:block select-none opacity-85 blur-[0.4px] will-change-transform">
              <Image
                src="/decor/beans/bean-05.png"
                alt=""
                width={240}
                height={215}
                className="w-full h-auto object-contain"
                priority
              />
            </div>

            {/* Bean 5: Lower-outer floater rounding out the diagonal path */}
            <div className="hero-bean hero-bean-5 absolute top-[78%] right-[14%] lg:top-[76%] lg:right-[12%] xl:top-[79%] xl:right-[15%] w-7 lg:w-7 xl:w-8 rotate-[55deg] hidden lg:block select-none drop-shadow-[0_4px_10px_rgba(44,44,44,0.12)] will-change-transform">
              <Image
                src="/decor/beans/bean-04.png"
                alt=""
                width={240}
                height={142}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>

          {/* LAYER 3: Dominant Master Product Composite — 720-820px visual width at large desktop */}
          <div className="hero-product-stage relative z-[3] will-change-transform">
            <Image
              src={heroContent.productImage.src}
              alt={heroContent.productImage.alt}
              width={heroContent.productImage.width}
              height={heroContent.productImage.height}
              priority
              sizes="(min-width: 1920px) 820px, (min-width: 1280px) 760px, (min-width: 1024px) 680px, (min-width: 640px) 520px, 420px"
              className="w-full max-w-[400px] sm:max-w-[500px] lg:max-w-[660px] xl:max-w-[750px] min-[1920px]:max-w-[810px] 2xl:max-w-[830px] h-auto object-contain drop-shadow-[0_22px_34px_rgba(44,44,44,0.11)] drop-shadow-[0_42px_65px_rgba(201,185,154,0.22)] transition-transform duration-700 hover:scale-[1.015]"
            />
          </div>
        </div>
      </div>

      {/* BOTTOM MINIMAL SCROLL INDICATOR — Positioned absolutely to avoid pushing flow height */}
      <div
        className="hero-scroll-cue absolute bottom-3 sm:bottom-5 min-[1920px]:bottom-7 inset-x-0 hidden lg:flex flex-col items-center justify-center gap-2 select-none pointer-events-none z-20"
        aria-hidden="true"
      >
        <span className="text-[11px] font-medium tracking-[0.3em] uppercase text-foreground-muted/50 font-sans">
          {heroContent.scrollCue}
        </span>
        <div className="hero-scroll-line w-[1.5px] h-7 min-[1920px]:h-9 bg-gradient-to-b from-foreground-muted/40 via-foreground-muted/20 to-transparent will-change-transform" />
      </div>
    </section>
  );
}
