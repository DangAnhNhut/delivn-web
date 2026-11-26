"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  packagingExperienceContent,
  tayNguyenHeroContent,
} from "@/data/content/home";
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
  const { eyebrow, headline, subtitle, products, interactionCaption } =
    packagingExperienceContent;

  const [selectedProduct, setSelectedProduct] = useState<"sand" | "black">(
    "black"
  );
  const [hasEnteredView, setHasEnteredView] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);

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

  // Subtle one-shot UI entrance
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
            ".packaging-selector",
            ".packaging-stage-container",
          ],
          { opacity: 1, y: 0, scale: 1, clearProps: "all" }
        );
        return;
      }

      gsap.set(".packaging-eyebrow", { opacity: 0, y: 14 });
      gsap.set(".packaging-headline", { opacity: 0, y: 24 });
      gsap.set(".packaging-selector", { opacity: 0, y: 16 });
      gsap.set(".packaging-stage-container", {
        opacity: 0,
        y: 24,
        scale: 0.985,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 82%",
          once: true,
        },
        defaults: { ease: "power3.out" },
      });

      tl.to(".packaging-eyebrow", { opacity: 1, y: 0, duration: 0.55 })
        .to(".packaging-headline", { opacity: 1, y: 0, duration: 0.65 }, 0.08)
        .to(".packaging-selector", { opacity: 1, y: 0, duration: 0.6 }, 0.16)
        .to(
          ".packaging-stage-container",
          { opacity: 1, y: 0, scale: 1, duration: 0.8 },
          0.22
        );
    }, section);

    return () => ctx.revert();
  }, []);

  const activeProductData = products[selectedProduct];

  return (
    <section
      ref={sectionRef}
      id="trai-nghiem-bao-bi"
      className="relative w-full py-16 sm:py-20 lg:py-24 bg-background border-t border-border/40 text-foreground overflow-hidden"
      aria-label="Khám phá sản phẩm DELIVN 3D"
    >
      <div className="site-shell flex flex-col items-center">
        {/* Heading with clearly visible, softly feathered Tây Nguyên backdrop */}
        <div className="relative w-full max-w-4xl mx-auto text-center flex flex-col items-center py-7 sm:py-9 mb-4 sm:mb-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-4 sm:-inset-x-10 lg:-inset-x-16 -inset-y-2 overflow-hidden taynguyen-mountain-mask"
          >
            <div
              className="absolute inset-0 bg-no-repeat bg-[length:145%_auto] bg-[38%_19%] sm:bg-[length:130%_auto] sm:bg-[44%_19%] opacity-[0.32] blur-[2.5px] saturate-[0.92] contrast-[1.04]"
              style={{
                backgroundImage: `url("${tayNguyenHeroContent.image.src}")`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6F1]/35 via-transparent to-[#FAF6F1]/68" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,246,241,0.40)_0%,rgba(250,246,241,0.10)_54%,transparent_82%)]" />
          </div>

          <div className="packaging-eyebrow relative z-10 inline-flex items-center gap-2.5 mb-3.5 sm:mb-4">
            <span
              className="w-2 h-2 rounded-full bg-accent shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-foreground/80">
              {eyebrow}
            </span>
          </div>

          <h2 className="packaging-headline relative z-10 text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] font-bold uppercase tracking-tight text-foreground leading-[1.15] font-sans">
            {headline}
          </h2>

          <p className="relative z-10 mt-2.5 sm:mt-3 text-sm sm:text-base font-sans text-foreground-muted font-normal">
            {subtitle}
          </p>
        </div>

        {/* Product Selector: CÀ PHÊ PHA MÁY | CÀ PHÊ PHA PHIN */}
        <div className="packaging-selector w-full flex justify-center mb-4 sm:mb-6">
          <ProductSelector
            selectedProduct={selectedProduct}
            onSelectProduct={setSelectedProduct}
          />
        </div>

        {/* Centered Large 3D Model Stage */}
        <div className="packaging-stage-container w-full max-w-[520px] flex flex-col items-center justify-center select-none">
          {hasEnteredView ? (
            <ProductStage
              modelPath={activeProductData.modelPath}
              fallbackImage={activeProductData.fallbackImage}
              altText={activeProductData.alt}
              targetRotationY={0}
              freeRotate
              className="w-full max-w-[460px] sm:max-w-[500px] aspect-[1/1.15]"
            />
          ) : (
            <ModelLoader />
          )}

          {/* Active Product Official Name */}
          <p className="mt-2 text-center text-sm sm:text-base font-medium text-foreground max-w-md px-4">
            {activeProductData.fullName}
          </p>

          {/* Interaction Hint */}
          <div className="mt-3 flex items-center justify-center gap-2 font-sans text-foreground-muted/70 text-[11px] tracking-[0.2em] uppercase font-medium select-none">
            <svg
              className="w-3.5 h-3.5 opacity-65"
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
    </section>
  );
}
