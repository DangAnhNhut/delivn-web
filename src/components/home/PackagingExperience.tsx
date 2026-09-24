"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { packagingExperienceContent } from "@/data/content/home";
import { ProductSelector } from "./ProductSelector";
import { ModelLoader } from "../three/ModelLoader";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Lazy-load R3F 3D Canvas stage with SSR disabled
const ProductStage = dynamic(
  () => import("../three/ProductStage").then((mod) => mod.ProductStage),
  {
    ssr: false,
    loading: () => <ModelLoader />,
  }
);

export function PackagingExperience() {
  const {
    eyebrow,
    headline,
    description,
    products,
    storyStates,
    interactionCaption,
    scrollCue,
    bottomMeta,
  } = packagingExperienceContent;

  const [selectedProduct, setSelectedProduct] = useState<"sand" | "black">("sand");
  const [activeStateId, setActiveStateId] = useState<number>(1);
  const [targetRotationY, setTargetRotationY] = useState<number>(0);
  const [hasEnteredView, setHasEnteredView] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const isUserInteractingRef = useRef(false);

  // Lazy-mount 3D canvas when section approaches viewport (300px ahead)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEnteredView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Static UI Entrance Animation (Eyebrow, Headline, Intro, Story nav, 3D stage)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(
          [
            ".packaging-eyebrow",
            ".packaging-headline",
            ".packaging-intro",
            ".packaging-story-nav",
            ".packaging-stage-container",
          ],
          { opacity: 1, y: 0, scale: 1, clearProps: "all" }
        );
        return;
      }

      // Initial resting states
      gsap.set(".packaging-eyebrow", { opacity: 0, y: 18 });
      gsap.set(".packaging-headline", { opacity: 0, y: 32 });
      gsap.set(".packaging-intro", { opacity: 0, y: 20 });
      gsap.set(".packaging-story-nav", { opacity: 0, x: -16 });
      gsap.set(".packaging-stage-container", {
        opacity: 0,
        y: 30,
        scale: 0.985,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          toggleActions: "play none none none",
        },
        defaults: { ease: "power3.out" },
      });

      tl.to(".packaging-eyebrow", { opacity: 1, y: 0, duration: 0.6 })
        .to(".packaging-headline", { opacity: 1, y: 0, duration: 0.75 }, 0.1)
        .to(".packaging-intro", { opacity: 1, y: 0, duration: 0.7 }, 0.2)
        .to(".packaging-story-nav", { opacity: 1, x: 0, duration: 0.8 }, 0.3)
        .to(
          ".packaging-stage-container",
          { opacity: 1, y: 0, scale: 1, duration: 0.9 },
          0.32
        );
    }, section);

    return () => ctx.revert();
  }, []);

  // Desktop ScrollTrigger narrative sequence (>= 1280px)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !hasEnteredView) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const isDesktop = window.matchMedia("(min-width: 1280px)").matches;
    if (!isDesktop) return;

    const ctx = gsap.context(() => {
      // Create ScrollTrigger tied to the section scroll progress
      ScrollTrigger.create({
        trigger: section,
        start: "top 40%",
        end: "bottom 80%",
        onUpdate: (self) => {
          // If user is actively dragging the 3D model, suspend scroll updates
          if (isUserInteractingRef.current) return;

          const progress = self.progress;

          if (progress < 0.35) {
            setActiveStateId(1);
            setTargetRotationY(storyStates[0].targetAngle);
          } else if (progress < 0.7) {
            setActiveStateId(2);
            setTargetRotationY(storyStates[1].targetAngle);
          } else {
            setActiveStateId(3);
            setTargetRotationY(storyStates[2].targetAngle);
          }
        },
      });
    }, section);

    return () => ctx.revert();
  }, [hasEnteredView, storyStates]);

  // Click handler for story state selection
  const handleSelectState = useCallback(
    (id: number) => {
      setActiveStateId(id);
      const stateObj = storyStates.find((s) => s.id === id);
      if (stateObj) {
        setTargetRotationY(stateObj.targetAngle);
      }
    },
    [storyStates]
  );

  const handleManualInteractionStart = useCallback(() => {
    isUserInteractingRef.current = true;
    // Resume scroll ownership after user finishes dragging
    setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 1800);
  }, []);

  const activeProductData = products[selectedProduct];

  return (
    <section
      ref={sectionRef}
      id="trai-nghiem-bao-bi"
      className="relative w-full min-h-screen pt-20 sm:pt-24 lg:pt-28 pb-20 sm:pb-24 lg:pb-32 bg-background border-t border-border/40 text-foreground overflow-hidden"
      aria-label="Trải nghiệm 3D bao bì DELIVN"
    >
      <div className="site-shell">
        {/* HEADER PHÂN ĐOẠN (SECTION INTRODUCTION) */}
        <div className="max-w-3xl mb-12 sm:mb-14 lg:mb-16">
          {/* Eyebrow */}
          <div className="packaging-eyebrow inline-flex items-center gap-2.5 mb-4 sm:mb-5">
            <span className="w-2 h-2 rounded-full bg-accent shrink-0" aria-hidden="true" />
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-foreground/80">
              {eyebrow}
            </span>
          </div>

          {/* Headline */}
          <h2 className="packaging-headline text-3xl sm:text-4xl lg:text-5xl xl:text-[54px] font-bold uppercase tracking-tight text-foreground leading-[1.08] mb-5 sm:mb-6 font-sans">
            <span className="block">{headline.main}</span>
            <span className="font-normal italic font-display-serif lowercase tracking-normal text-[1.06em] text-foreground/85 block mt-1">
              {headline.italic}
            </span>
          </h2>

          {/* Intro Narrative */}
          <p className="packaging-intro text-base sm:text-lg font-sans text-foreground-muted leading-relaxed font-normal max-w-2xl">
            {description}
          </p>
        </div>

        {/* MAIN SPLIT LAYOUT: STORY PROGRESSION & 3D STAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-start">
          {/* CỘT TRÁI: TIẾN TRÌNH KỂ CHUYỆN (5 COLS) — Cuộn tự nhiên qua 3 mốc câu chuyện */}
          <div className="packaging-story-nav lg:col-span-5 flex flex-col justify-between pt-1 select-none">
            {/* DANH SÁCH 3 TRẠNG THÁI KỂ CHUYỆN (EDITORIAL TYPOGRAPHY) */}
            <div className="space-y-10 xl:space-y-24 relative pl-7 border-l border-foreground/15 select-none xl:py-8">
              {storyStates.map((state) => {
                const isActive = activeStateId === state.id;

                return (
                  <div
                    key={state.id}
                    onClick={() => handleSelectState(state.id)}
                    className={`group cursor-pointer transition-all duration-300 relative select-none min-h-[140px] xl:min-h-[180px] flex flex-col justify-center ${
                      isActive ? "opacity-100" : "opacity-45 hover:opacity-85"
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectState(state.id);
                      }
                    }}
                    aria-current={isActive ? "true" : "false"}
                  >
                    {/* Active Indicator Marker on vertical line */}
                    <div
                      className={`absolute -left-[35px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? "border-foreground bg-foreground scale-110"
                          : "border-foreground/35 bg-background group-hover:border-foreground/60"
                      }`}
                      aria-hidden="true"
                    />

                    {/* State Meta Tag */}
                    <div className="flex items-baseline gap-2.5 mb-2">
                      <span
                        className={`text-xs font-mono tracking-widest font-semibold transition-colors ${
                          isActive ? "text-accent" : "text-foreground-muted"
                        }`}
                      >
                        {state.index}
                      </span>
                      <span className="text-[11px] font-sans uppercase tracking-widest font-semibold text-foreground-muted/70">
                        {state.label}
                      </span>
                    </div>

                    {/* State Title */}
                    <h3
                      className={`text-lg sm:text-xl lg:text-2xl font-sans font-bold uppercase tracking-tight mb-2.5 transition-colors ${
                        isActive ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                      }`}
                    >
                      {state.title}
                    </h3>

                    {/* State Narrative */}
                    <p className="text-sm sm:text-[15px] font-sans text-foreground-muted leading-relaxed font-normal">
                      {state.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Hướng dẫn cuộn trải nghiệm tinh tế */}
            <div className="mt-12 pt-6 border-t border-border/50 hidden xl:flex items-center gap-3 text-xs text-foreground-muted/70 select-none">
              <span className="inline-block w-4 h-[1px] bg-foreground/35" aria-hidden="true" />
              <span className="tracking-widest uppercase font-sans font-medium text-[11px]">
                {scrollCue}
              </span>
            </div>
          </div>

          {/* CỘT PHẢI: SÂN KHẤU 3D ĐỘC QUYỀN (7 COLS) — Sticky trên Desktop (>= 1280px) */}
          <div className="packaging-stage-container lg:col-span-7 xl:sticky xl:top-24 self-start relative min-h-[480px] sm:min-h-[540px] lg:min-h-[620px] flex flex-col items-center justify-center p-2 sm:p-4 select-none">
            {/* Visual Product Selector (Sand / Black) */}
            <div className="w-full flex justify-center mb-6 sm:mb-8">
              <ProductSelector
                selectedProduct={selectedProduct}
                onSelectProduct={setSelectedProduct}
              />
            </div>

            {/* 3D Canvas Stage or Lazy Loader */}
            {hasEnteredView ? (
              <ProductStage
                modelPath={activeProductData.modelPath}
                fallbackImage={activeProductData.fallbackImage}
                altText={activeProductData.alt}
                targetRotationY={targetRotationY}
                onManualInteractionStart={handleManualInteractionStart}
                className="w-full h-full max-w-[480px] aspect-[1/1.25]"
              />
            ) : (
              <ModelLoader />
            )}

            {/* Mobile / Tablet Quick Angle Controls (< 1024px only) */}
            <div className="mt-5 flex xl:hidden items-center gap-2 bg-[#F6F1E8]/90 backdrop-blur border border-border/70 px-2.5 py-1.5 rounded-full shadow-xs font-sans">
              {storyStates.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectState(s.id)}
                  className={`text-[11px] px-3 py-1 rounded-full font-medium transition-all ${
                    activeStateId === s.id
                      ? "bg-foreground text-background font-bold"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  <span className="font-mono">{s.index}</span> · {s.label === "MẶT TRƯỚC" ? "TRƯỚC" : s.label === "CẠNH BÊN" ? "HÔNG" : "SAU"}
                </button>
              ))}
            </div>

            {/* Micro-Caption Duy Nhất Dưới Sân Khấu */}
            <div className="mt-4 flex items-center justify-center gap-2 font-sans text-foreground-muted/70 text-[11px] tracking-wider uppercase font-medium select-none">
              <svg
                className="w-3.5 h-3.5 opacity-65 animate-spin"
                style={{ animationDuration: "8s" }}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
              </svg>
              <span>{interactionCaption}</span>
            </div>
          </div>
        </div>

        {/* CHÂN PHÂN ĐOẠN: DÒNG TIẾP NỐI CUỘN */}
        <div className="mt-16 sm:mt-20 pt-7 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-foreground-muted/65 select-none">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="font-mono text-[11px] tracking-wide">{bottomMeta.brand}</span>
          </div>
          <div className="tracking-widest uppercase font-sans text-[11px] font-medium">
            {bottomMeta.cue}
          </div>
        </div>
      </div>
    </section>
  );
}
