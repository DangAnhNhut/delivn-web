"use client";

import { useRef } from "react";
import Image from "next/image";
import { brandStoryContent } from "@/data/content/home";
import { BrandStoryMotion } from "./BrandStoryMotion";

export function BrandStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const { eyebrow, headline, sublead, steps, closing } = brandStoryContent;

  return (
    <section
      ref={sectionRef}
      id="nguon-cam-hung"
      className="relative w-full bg-background overflow-hidden border-t border-border/40 scroll-mt-20 pb-16 sm:pb-20 lg:pb-24"
      aria-labelledby="brand-story-title"
    >
      {/* GSAP Entrance Controller & IntersectionObserver Loop State Manager */}
      <BrandStoryMotion sectionRef={sectionRef} />

      {/* Subtle organic paper grain overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.025] select-none"
        style={{
          backgroundImage:
            "radial-gradient(#161616 0.45px, transparent 0.45px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Background Cultural Sunburst Motif Accent with Gentle Continuous Loop Sway */}
      <div
        aria-hidden="true"
        className="story-sunburst-ambient absolute top-8 right-4 sm:top-12 sm:right-10 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 opacity-[0.07] pointer-events-none text-foreground select-none z-0"
      >
        <svg
          className="story-sunburst-rotate w-full h-full"
          fill="currentColor"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="14" />
          <path d="M50 8 L53 30 L47 30 Z" />
          <path d="M50 92 L53 70 L47 70 Z" />
          <path d="M8 50 L30 53 L30 47 Z" />
          <path d="M92 50 L70 53 L70 47 Z" />
          <path d="M20 20 L37 34 L33 38 Z" />
          <path d="M80 80 L63 66 L67 62 Z" />
          <path d="M80 20 L66 37 L62 33 Z" />
          <path d="M20 80 L34 63 L38 67 Z" />
        </svg>
      </div>

      {/* Background Ambient Contour Ring Motif at bottom left */}
      <div
        aria-hidden="true"
        className="story-ambient-ring absolute -bottom-12 -left-12 sm:-bottom-16 sm:-left-16 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 opacity-[0.04] pointer-events-none text-foreground select-none z-0"
      >
        <svg
          className="story-ambient-drift w-full h-full"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="50" cy="50" r="46" strokeWidth="0.8" strokeDasharray="4 4" />
          <circle cx="50" cy="50" r="32" strokeWidth="0.6" />
          <ellipse cx="50" cy="50" rx="20" ry="12" strokeWidth="0.8" strokeDasharray="2 3" transform="rotate(30 50 50)" />
        </svg>
      </div>

      {/* SECTION INTRO HEADER (ALIGNED WITH SITE-SHELL) */}
      <header className="story-intro-header relative z-10 site-shell pt-14 sm:pt-18 lg:pt-22 pb-6 sm:pb-8 lg:pb-10 border-b border-border/40">
        <div className="story-intro-eyebrow flex items-center gap-2.5 mb-3 sm:mb-4">
          <span
            className="w-2 h-2 rounded-full bg-accent story-dot-pulse flex-shrink-0"
            aria-hidden="true"
          />
          <span className="text-xs sm:text-[13px] font-semibold tracking-[0.28em] text-foreground uppercase">
            {eyebrow}
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 xl:gap-16 items-end">
          <div className="lg:col-span-7">
            <h2
              id="brand-story-title"
              className="story-intro-title text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground uppercase leading-[1.1]"
            >
              <span>{headline.line1}</span>
              <span className="block text-foreground-muted">{headline.line2}</span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="story-intro-sublead text-base sm:text-lg lg:text-xl font-display-serif italic text-foreground-muted font-light leading-relaxed">
              {sublead}
            </p>
          </div>
        </div>
      </header>

      {/* 3 INDEPENDENT STORY CHAPTERS IN NATURAL DOCUMENT FLOW */}
      <div className="relative z-10 flex flex-col w-full">
        {steps.map((step, idx) => {
          const isEven = idx % 2 === 1; // Step 02 has inverted layout: Text left, Image right

          return (
            <article
              key={step.id}
              className={`story-chapter-card relative w-full h-auto min-h-0 ${
                idx === 0
                  ? "pt-10 sm:pt-12 lg:pt-14 pb-12 sm:pb-14 lg:pb-16"
                  : "pt-12 sm:pt-14 lg:pt-16 pb-12 sm:pb-14 lg:pb-16 border-t border-border/30"
              }`}
              aria-label={`Chương ${step.number}: ${step.name}`}
            >
              {/* CROSS-CHAPTER CONTINUITY NODE ON DIVIDER */}
              {idx > 0 && (
                <div
                  aria-hidden="true"
                  className="story-connector-node absolute -top-[5px] left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none select-none z-20"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-background border border-border/80 flex items-center justify-center shadow-xs">
                    <div className="w-1 h-1 rounded-full bg-accent/70 story-dot-pulse" />
                  </div>
                </div>
              )}

              <div className="site-shell">
                {isEven ? (
                  /* CHAPTER 02: INVERTED LAYOUT (TEXT LEFT 39%, IMAGE RIGHT 61% ON DESKTOP; IMAGE TOP ON MOBILE) */
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.55fr] gap-8 sm:gap-10 lg:gap-14 xl:gap-16 items-center">
                    {/* TEXT COLUMN (Desktop: col 1 / Mobile: order-2) */}
                    <div className="story-text-column order-2 lg:order-1 flex flex-col justify-center w-full">
                      <div className="w-full max-w-[580px] lg:max-w-[620px]">
                        {/* Chapter Pill & Visual Continuity Indicator */}
                        <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
                          <div className="story-pill inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-surface border border-border/70 rounded-full shadow-xs">
                            <span
                              className="story-dot story-dot-pulse w-1.5 h-1.5 rounded-full bg-accent"
                              aria-hidden="true"
                            />
                            <span className="font-mono text-xs font-bold text-accent">
                              CHƯƠNG {step.number}
                            </span>
                            <span className="text-foreground-muted/40">•</span>
                            <span className="text-[11.5px] font-bold tracking-[0.2em] uppercase text-foreground">
                              {step.name}
                            </span>
                          </div>

                          {/* Visual Continuity Thread & Step Counter */}
                          <div className="flex items-center gap-2">
                            <span
                              className="story-line story-line-pulse hidden sm:block w-7 h-[1px] bg-border/80"
                              aria-hidden="true"
                            />
                            <span className="story-indicator-shimmer font-mono text-xs sm:text-[13px] font-bold text-foreground-muted/70 tracking-widest">
                              {step.number} / 03
                            </span>
                          </div>
                        </div>

                        {/* Tagline */}
                        <p className="story-tagline text-xs sm:text-sm font-bold tracking-[0.22em] text-accent uppercase mb-3">
                          {step.tagline}
                        </p>

                        {/* Chapter Title */}
                        <h3 className="story-title text-2xl sm:text-3xl md:text-4xl lg:text-[40px] xl:text-[44px] 2xl:text-[48px] font-extrabold tracking-tight text-foreground uppercase leading-[1.12]">
                          {step.title}
                        </h3>

                        {/* Narrative Description */}
                        <p className="story-desc mt-5 sm:mt-6 text-base sm:text-[17px] lg:text-[18px] text-foreground-muted leading-[1.75] font-normal">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* IMAGE COLUMN (Desktop: col 2 / Mobile: order-1) */}
                    <div className="story-image-column order-1 lg:order-2 w-full">
                      <div className="group/img story-frame-glow relative w-full h-[360px] sm:h-[440px] md:h-[500px] lg:h-[540px] xl:h-[600px] 2xl:h-[640px] rounded-xs border border-border/60 bg-[#F4EFE6] overflow-hidden shadow-xs flex items-center justify-center p-3 sm:p-5 lg:p-6 transition-all duration-500 ease-out hover:border-border hover:shadow-md">
                        {/* CHAPTER 02 DECORATIVE MICRO-MOTION: ARTISANAL COFFEE PHIN STEAM WISPS LOOP */}
                        <div
                          aria-hidden="true"
                          className="absolute top-4 right-5 sm:top-6 sm:right-7 flex items-center gap-1.5 opacity-70 pointer-events-none select-none z-20"
                        >
                          <svg
                            width="28"
                            height="32"
                            viewBox="0 0 28 32"
                            fill="none"
                            className="text-accent/80"
                          >
                            <path
                              className="steam-wisp-1"
                              d="M6 28 C4 21 8 16 6 11 C4 7 7 3 6 0"
                              stroke="currentColor"
                              strokeWidth="1.3"
                              strokeLinecap="round"
                            />
                            <path
                              className="steam-wisp-2"
                              d="M14 30 C11 23 16 17 13 12 C11 8 14 4 13 0"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path
                              className="steam-wisp-3"
                              d="M22 27 C19 21 24 16 21 10 C19 6 22 2 21 0"
                              stroke="currentColor"
                              strokeWidth="1.3"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>

                        {/* Image Canvas */}
                        <div className="relative w-full h-full flex items-center justify-center">
                          <Image
                            src={step.image.src}
                            alt={step.image.alt}
                            fill
                            sizes="(max-width: 1024px) 100vw, 62vw"
                            style={{
                              objectFit: step.image.fit,
                              objectPosition: step.image.objectPosition,
                            }}
                            priority={idx === 0}
                            loading={idx === 0 ? "eager" : "lazy"}
                            className="transition-transform duration-700 ease-out group-hover/img:scale-[1.018]"
                          />
                        </div>

                        {/* Inner rim overlay */}
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none z-20"
                        />

                        {/* Badge on Image Frame */}
                        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-30 pointer-events-none">
                          <div className="bg-background/90 backdrop-blur-md px-3 sm:px-3.5 py-1.5 border border-border/60 shadow-xs flex items-center gap-2">
                            <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-foreground uppercase block">
                              {step.image.badge}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* CHAPTER 01 & 03: STANDARD LAYOUT (IMAGE LEFT 61%, TEXT RIGHT 39% ON DESKTOP; IMAGE TOP ON MOBILE) */
                  <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-8 sm:gap-10 lg:gap-14 xl:gap-16 items-center">
                    {/* IMAGE COLUMN (Desktop: col 1 / Mobile: top) */}
                    <div className="story-image-column w-full">
                      <div className="group/img story-frame-glow relative w-full h-[360px] sm:h-[440px] md:h-[500px] lg:h-[540px] xl:h-[600px] 2xl:h-[640px] rounded-xs border border-border/60 bg-[#F4EFE6] overflow-hidden shadow-xs flex items-center justify-center p-3 sm:p-5 lg:p-6 transition-all duration-500 ease-out hover:border-border hover:shadow-md">
                        {/* CHAPTER 01 DECORATIVE MOTIF: DELICATE SOLAR ORBIT EMBLEM */}
                        {idx === 0 && (
                          <div
                            aria-hidden="true"
                            className="story-orbit-c1 absolute -top-8 -left-8 w-32 h-32 opacity-10 pointer-events-none select-none text-accent"
                          >
                            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                              <circle cx="50" cy="50" r="42" strokeWidth="1" strokeDasharray="3 3" />
                              <circle cx="50" cy="50" r="28" strokeWidth="1.2" />
                              <circle cx="50" cy="8" r="3" fill="currentColor" />
                            </svg>
                          </div>
                        )}

                        {/* CHAPTER 03 DECORATIVE MOTIF: DELICATE ROAST DEVELOPMENT ARC AURA */}
                        {idx === 2 && (
                          <div
                            aria-hidden="true"
                            className="story-roast-arc absolute -top-8 -right-8 w-36 h-36 opacity-[0.08] pointer-events-none select-none text-accent"
                          >
                            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                              <circle cx="50" cy="50" r="44" strokeWidth="1" strokeDasharray="4 4" />
                              <circle cx="50" cy="50" r="30" strokeWidth="1.2" />
                              <path d="M50 6 A44 44 0 0 1 94 50" strokeWidth="1.8" />
                            </svg>
                          </div>
                        )}

                        {/* Image Canvas */}
                        <div className="relative w-full h-full flex items-center justify-center">
                          <Image
                            src={step.image.src}
                            alt={step.image.alt}
                            fill
                            sizes="(max-width: 1024px) 100vw, 62vw"
                            style={{
                              objectFit: step.image.fit,
                              objectPosition: step.image.objectPosition,
                            }}
                            priority={idx === 0}
                            loading={idx === 0 ? "eager" : "lazy"}
                            className="transition-transform duration-700 ease-out group-hover/img:scale-[1.018]"
                          />
                        </div>

                        {/* Inner rim overlay */}
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none z-20"
                        />

                        {/* Badge on Image Frame */}
                        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-30 pointer-events-none">
                          <div className="bg-background/90 backdrop-blur-md px-3 sm:px-3.5 py-1.5 border border-border/60 shadow-xs flex items-center gap-2">
                            <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-foreground uppercase block">
                              {step.image.badge}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TEXT COLUMN (Desktop: col 2 / Mobile: bottom) */}
                    <div className="story-text-column flex flex-col justify-center w-full">
                      <div className="w-full max-w-[580px] lg:max-w-[620px]">
                        {/* Chapter Pill & Visual Continuity Indicator */}
                        <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
                          <div className="story-pill inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-surface border border-border/70 rounded-full shadow-xs">
                            <span
                              className="story-dot story-dot-pulse w-1.5 h-1.5 rounded-full bg-accent"
                              aria-hidden="true"
                            />
                            <span className="font-mono text-xs font-bold text-accent">
                              CHƯƠNG {step.number}
                            </span>
                            <span className="text-foreground-muted/40">•</span>
                            <span className="text-[11.5px] font-bold tracking-[0.2em] uppercase text-foreground">
                              {step.name}
                            </span>
                          </div>

                          {/* Visual Continuity Thread & Step Counter */}
                          <div className="flex items-center gap-2">
                            <span
                              className="story-line story-line-pulse hidden sm:block w-7 h-[1px] bg-border/80"
                              aria-hidden="true"
                            />
                            <span className="story-indicator-shimmer font-mono text-xs sm:text-[13px] font-bold text-foreground-muted/70 tracking-widest">
                              {step.number} / 03
                            </span>
                          </div>
                        </div>

                        {/* Tagline */}
                        <p className="story-tagline text-xs sm:text-sm font-bold tracking-[0.22em] text-accent uppercase mb-3">
                          {step.tagline}
                        </p>

                        {/* Chapter Title */}
                        <h3 className="story-title text-2xl sm:text-3xl md:text-4xl lg:text-[40px] xl:text-[44px] 2xl:text-[48px] font-extrabold tracking-tight text-foreground uppercase leading-[1.12]">
                          {step.title}
                        </h3>

                        {/* Narrative Description */}
                        <p className="story-desc mt-5 sm:mt-6 text-base sm:text-[17px] lg:text-[18px] text-foreground-muted leading-[1.75] font-normal">
                          {step.description}
                        </p>

                        {/* Closing statement on Screen 03 with subtle draw underline & coffee bean icon */}
                        {idx === 2 && (
                          <div className="story-closing-wrap mt-8 pt-6 border-t border-border/60 relative">
                            <div className="flex items-center gap-3 mb-2">
                              {/* CHAPTER 03 DECORATIVE MOTIF: MINIMALIST COFFEE BEAN LINE SILHOUETTE */}
                              <svg
                                className="story-bean-sway w-4 h-4 text-accent/80 shrink-0"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                aria-hidden="true"
                              >
                                <ellipse cx="12" cy="12" rx="9" ry="6" transform="rotate(45 12 12)" />
                                <path d="M8 8 C10 11 14 13 16 16" strokeLinecap="round" />
                              </svg>
                              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                                DI SẢN & SỨ MỆNH
                              </span>
                            </div>

                            <p className="text-base sm:text-lg font-display-serif italic text-accent/95 leading-relaxed">
                              &ldquo;{closing.headline.line1} {closing.headline.line2}&rdquo;
                            </p>

                            {/* Animated underline reveal */}
                            <div
                              aria-hidden="true"
                              className="story-closing-draw h-[1.5px] w-28 bg-accent/60 mt-3 rounded-full origin-left"
                            />

                            <p className="text-xs tracking-[0.2em] uppercase text-foreground-muted/80 mt-3 font-medium">
                              {closing.scrollCue}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
