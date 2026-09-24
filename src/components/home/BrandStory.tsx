"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { brandStoryContent } from "@/data/content/home";
import { BrandStoryMotion } from "./BrandStoryMotion";
import { gsap } from "gsap";

export function BrandStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const isTransitioningRef = useRef(false);

  const { eyebrow, headline, sublead, steps, closing } = brandStoryContent;
  const activeStep = steps[activeStepIndex];

  // Image and text refs for refined editorial transitions
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const stepButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Transition handler
  // Transition handler with editorial crossfade, masked reveal, and subtle scale
  const goToStep = useCallback(
    (newIndex: number) => {
      if (newIndex === activeStepIndex) return;

      const prevIndex = activeStepIndex;
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      setActiveStepIndex(newIndex);

      if (prefersReducedMotion) {
        // Instant/opacity-only switch for reduced motion
        imageRefs.current.forEach((el, idx) => {
          if (!el) return;
          gsap.killTweensOf(el);
          if (idx === newIndex) {
            gsap.set(el, {
              opacity: 1,
              zIndex: 10,
              scale: 1,
              x: 0,
              clipPath: "inset(0 0% 0 0)",
              clearProps: "transform,clipPath",
            });
          } else {
            gsap.set(el, {
              opacity: 0,
              zIndex: 1,
              scale: 1,
              x: 0,
              clipPath: "inset(0 0% 0 0)",
              clearProps: "transform,clipPath",
            });
          }
        });
        if (titleRef.current) {
          gsap.killTweensOf(titleRef.current);
          gsap.set(titleRef.current, { opacity: 1, y: 0, clearProps: "transform" });
        }
        if (descRef.current) {
          gsap.killTweensOf(descRef.current);
          gsap.set(descRef.current, { opacity: 1, y: 0, clearProps: "transform" });
        }
        if (badgeRef.current) {
          gsap.killTweensOf(badgeRef.current);
          gsap.set(badgeRef.current, { opacity: 1, clearProps: "opacity" });
        }
        return;
      }

      isTransitioningRef.current = true;

      const prevImage = imageRefs.current[prevIndex];
      const nextImage = imageRefs.current[newIndex];

      // Kill any running tweens to prevent glitching on rapid clicks
      imageRefs.current.forEach((el, idx) => {
        if (!el) return;
        gsap.killTweensOf(el);
        if (idx !== prevIndex && idx !== newIndex) {
          gsap.set(el, {
            opacity: 0,
            zIndex: 1,
            x: 0,
            scale: 1,
            clipPath: "inset(0 0% 0 0)",
            clearProps: "transform,clipPath",
          });
        }
      });
      if (titleRef.current) gsap.killTweensOf(titleRef.current);
      if (descRef.current) gsap.killTweensOf(descRef.current);
      if (badgeRef.current) gsap.killTweensOf(badgeRef.current);

      // 1. Outgoing image transition:
      // opacity: 1 -> 0, scale: 1 -> 1.012, x: 0 -> -6px, duration: ~0.45s
      if (prevImage) {
        gsap.set(prevImage, { zIndex: 5 });
        gsap.to(prevImage, {
          opacity: 0,
          scale: 1.012,
          x: -6,
          duration: 0.45,
          ease: "power3.out",
          onComplete: () => {
            gsap.set(prevImage, {
              zIndex: 1,
              opacity: 0,
              x: 0,
              scale: 1,
              clipPath: "inset(0 0% 0 0)",
              clearProps: "transform,clipPath",
            });
          },
        });
      }

      // 2. Incoming image transition:
      // opacity: 0 -> 1, scale: 1.018 -> 1, x: 8px -> 0,
      // clip-path: inset(0 6% 0 0) -> inset(0 0% 0 0), duration: ~0.6s, ease: power3.out
      if (nextImage) {
        gsap.fromTo(
          nextImage,
          {
            opacity: 0,
            scale: 1.018,
            x: 8,
            clipPath: "inset(0 6% 0 0)",
            zIndex: 10,
          },
          {
            opacity: 1,
            scale: 1,
            x: 0,
            clipPath: "inset(0 0% 0 0)",
            duration: 0.6,
            ease: "power3.out",
            onComplete: () => {
              isTransitioningRef.current = false;
            },
          }
        );
      }

      // 3. Text transition: Title (opacity 0 -> 1, y 10px -> 0), Description (opacity 0 -> 1, y 12px -> 0)
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.38, ease: "power2.out" }
        );
      }

      if (descRef.current) {
        gsap.fromTo(
          descRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.42, delay: 0.06, ease: "power2.out" }
        );
      }

      // Counter / badge: short fade only (no y movement)
      if (badgeRef.current) {
        gsap.fromTo(
          badgeRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power2.out" }
        );
      }
    },
    [activeStepIndex]
  );

  // Keyboard navigation for accessible tabs
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = index;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      targetIndex = (index + 1) % steps.length;
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      targetIndex = (index - 1 + steps.length) % steps.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      targetIndex = steps.length - 1;
    }

    if (targetIndex !== index) {
      goToStep(targetIndex);
      stepButtonsRef.current[targetIndex]?.focus();
    }
  };

  return (
    <section
      ref={sectionRef}
      id="nguon-cam-hung"
      className="relative w-full bg-background overflow-hidden border-t border-border/40 pt-20 sm:pt-24 lg:pt-32 pb-20 sm:pb-24 lg:pb-32 scroll-mt-20"
      aria-labelledby="brand-story-title"
    >
      {/* GSAP ScrollTrigger Motion Controller */}
      <BrandStoryMotion sectionRef={sectionRef} />

      {/* Subtle organic paper grain overlay for editorial tactility */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.025] select-none"
        style={{
          backgroundImage: "radial-gradient(#161616 0.45px, transparent 0.45px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Sunburst Motif Accent (Packaging visual language origin) */}
      <div
        aria-hidden="true"
        className="story-sunburst absolute -top-8 -right-8 sm:-top-10 sm:-right-10 w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 opacity-[0.08] pointer-events-none text-foreground select-none z-0"
      >
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 100 100">
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

      <div className="site-shell relative z-10 flex flex-col">
        {/* SECTION HEADER */}
        <header className="w-full max-w-4xl">
          {/* Eyebrow with Brand Terracotta Dot */}
          <div className="story-header-item inline-flex items-center gap-2.5 mb-5 sm:mb-6">
            <span
              className="w-2 h-2 rounded-full bg-accent flex-shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs md:text-[13px] font-semibold tracking-[0.28em] text-foreground uppercase">
              {eyebrow}
            </span>
          </div>

          {/* Main Editorial Headline */}
          <h2
            id="brand-story-title"
            className="story-header-item text-[28px] xs:text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold tracking-tight text-foreground leading-[1.15] sm:leading-[1.1] uppercase"
          >
            <span className="block">{headline.line1}</span>
            <span className="block">{headline.line2}</span>
          </h2>

          {/* Supporting Serif Quotation */}
          <p className="story-header-item text-lg sm:text-xl font-display-serif italic text-foreground-muted font-light mt-5 sm:mt-6 max-w-3xl leading-relaxed">
            {sublead}
          </p>
        </header>

        {/* ASYMMETRIC INTERACTIVE 3-STEP STORY AREA */}
        <div className="story-spread-grid grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-18 items-center mt-12 sm:mt-16 lg:mt-20">
          {/* LEFT: Large Visual Frame displaying ONE active image (approx 58-60% on desktop: 7 cols) */}
          <div className="lg:col-span-7 relative order-1">
            {/* Mountain Line Motif Accent (Extending beyond image frame) */}
            <div
              aria-hidden="true"
              className="absolute -bottom-6 -left-6 sm:-bottom-8 sm:-left-8 w-28 h-28 sm:w-36 sm:h-36 opacity-10 pointer-events-none text-foreground select-none z-0"
            >
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 120 120">
                <path d="M10 110 Q 30 60 70 80 T 110 50 L 110 110 Z" />
                <circle cx="35" cy="40" r="8" />
                <path d="M30 50 Q 50 20 85 45" fill="none" stroke="currentColor" strokeWidth="6" />
              </svg>
            </div>

            {/* Editorial Photography Frame: Consistent 16/10 aspect ratio */}
            <div className="story-image-container relative overflow-hidden rounded-xs border border-border/40 bg-surface/40 aspect-[16/10] shadow-xs z-10">
              {/* Stacked Image Layers */}
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  ref={(el) => {
                    imageRefs.current[idx] = el;
                  }}
                  className={`absolute inset-0 w-full h-full will-change-transform ${
                    idx === 0 ? "opacity-100 z-10" : "opacity-0 z-1 pointer-events-none"
                  }`}
                  style={{
                    transformOrigin: "center center",
                  }}
                  aria-hidden={idx !== activeStepIndex}
                >
                  <Image
                    src={step.image.src}
                    alt={step.image.alt}
                    fill
                    quality={90}
                    sizes="(max-width: 768px) 100vw, (max-width: 1279px) 100vw, 60vw"
                    style={{
                      objectFit: "cover",
                      objectPosition: step.image.objectPosition,
                    }}
                    priority={idx === 0}
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                </div>
              ))}

              {/* Subtle inner rim */}
              <div
                aria-hidden="true"
                className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none z-20"
              />

              {/* Editorial Image Caption Badge */}
              <div className="story-image-badge absolute bottom-3 left-3 sm:bottom-5 sm:left-5 z-30 bg-background/90 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 border border-border/60 shadow-xs">
                <span
                  ref={badgeRef}
                  className="text-[9.5px] sm:text-[11px] font-medium tracking-[0.18em] sm:tracking-[0.22em] text-foreground uppercase block"
                >
                  {activeStep.image.badge}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Interactive Editorial Story Navigation & Active Content (approx 40% on desktop: 5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center order-2">
            {/* Step Selector: Clean Editorial Styling (Horizontal row on mobile, vertical stack on desktop) */}
            <div
              role="tablist"
              aria-label="Các chặng câu chuyện thương hiệu DELIVN"
              className="story-step-nav flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 sm:gap-6 border-b sm:border-b-0 border-border/40 pb-3 sm:pb-0"
            >
              {steps.map((step, idx) => {
                const isActive = activeStepIndex === idx;
                return (
                  <button
                    key={step.id}
                    ref={(el) => {
                      stepButtonsRef.current[idx] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`story-tab-${step.id}`}
                    aria-selected={isActive}
                    aria-controls={`story-panel-${step.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => goToStep(idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className="relative group text-left flex items-center gap-2 sm:gap-4 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xs py-1.5 px-1"
                  >
                    <span
                      className={`font-mono text-xs sm:text-[13px] tracking-wider transition-colors duration-300 ${
                        isActive
                          ? "text-accent font-bold"
                          : "text-foreground-muted/50 group-hover:text-foreground"
                      }`}
                    >
                      {step.number}
                    </span>
                    <span
                      className={`text-[11.5px] xs:text-xs sm:text-base tracking-[0.16em] sm:tracking-[0.2em] uppercase font-semibold transition-colors duration-300 whitespace-nowrap ${
                        isActive
                          ? "text-foreground font-bold"
                          : "text-foreground-muted/60 group-hover:text-foreground"
                      }`}
                    >
                      {step.name}
                    </span>
                    {/* Animated hairline indicator on desktop */}
                    <span
                      className={`hidden sm:inline-block h-[1.5px] transition-all duration-500 ease-out ${
                        isActive
                          ? "w-12 sm:w-16 lg:w-20 bg-accent opacity-100"
                          : "w-0 bg-border opacity-0 group-hover:w-6 group-hover:opacity-40"
                      }`}
                      aria-hidden="true"
                    />
                    {/* Active underline indicator on mobile */}
                    {isActive && (
                      <span
                        className="sm:hidden absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-full"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>


            {/* Active Content Container */}
            <div
              id={`story-panel-${activeStep.id}`}
              role="tabpanel"
              aria-labelledby={`story-tab-${activeStep.id}`}
              className="story-active-panel mt-6 sm:mt-8 lg:mt-10 pt-4 sm:pt-6 border-t-0 sm:border-t border-border/50"
            >
              {/* Active Step Title */}
              <h3
                ref={titleRef}
                className="story-content-item text-xl sm:text-2xl lg:text-[30px] font-bold tracking-tight text-foreground uppercase leading-snug"
              >
                {activeStep.title}
              </h3>

              {/* Active Step Description */}
              <p
                ref={descRef}
                className="story-content-item mt-3.5 sm:mt-5 text-sm sm:text-base lg:text-[16.5px] text-foreground-muted leading-relaxed font-normal"
              >
                {activeStep.description}
              </p>

              {/* Subtle Step Progress Indicator */}
              <div className="story-content-item mt-6 sm:mt-8 pt-4 border-t border-border/40 flex items-center justify-between text-xs text-foreground-muted/60 select-none">
                <span className="font-mono tracking-widest text-[11px]">
                  CHẶNG {activeStep.number} / 03
                </span>
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        activeStepIndex === i ? "w-6 bg-accent" : "w-1.5 bg-border/80"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CLOSING BRAND STATEMENT ANCHOR */}
        <div className="story-closing-wrapper max-w-5xl mx-auto px-4 sm:px-8 pt-16 sm:pt-20 text-center border-t border-border/60 mt-16 sm:mt-24 w-full">
          <h3 className="story-closing-item text-2xl sm:text-3xl md:text-[34px] font-bold tracking-tight text-foreground uppercase max-w-3xl mx-auto leading-snug">
            <span className="block">{closing.headline.line1}</span>
            <span className="block">{closing.headline.line2}</span>
          </h3>

          <div className="story-closing-item mt-6 flex flex-col items-center justify-center">
            <span className="text-xs uppercase tracking-[0.2em] text-foreground-muted font-medium inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-foreground select-none">
              {closing.scrollCue}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
