"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
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
      className="relative w-full pb-16 sm:pb-20 lg:pb-24 bg-background border-t border-border/40 text-foreground overflow-hidden"
      aria-label="Khám phá sản phẩm DELIVN 3D"
    >
      {/* Seamless Cinematic Tây Nguyên Upper Backdrop (matches Screen 01 artwork & motion) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[470px] sm:h-[510px] lg:h-[560px] overflow-hidden bg-[#171717]"
      >
        {/* Ambient blurred edge-to-edge extension (desktop) */}
        <div
          className="taynguyen-bg-ambient absolute inset-0 hidden lg:block bg-cover bg-center blur-[26px] saturate-[0.88] brightness-[0.72] will-change-transform"
          style={{
            backgroundImage: `url("${tayNguyenHeroContent.image.src}")`,
          }}
        />

        {/* Crisp Tây Nguyên artwork with gentle breathing zoom */}
        <div className="taynguyen-fg-feather relative mx-auto h-full w-full lg:w-[min(94vw,1440px)] overflow-hidden">
          <Image
            src={tayNguyenHeroContent.image.src}
            alt=""
            fill
            sizes="(min-width: 1280px) 1440px, 100vw"
            className="taynguyen-fg-breath object-cover object-[center_38%] will-change-transform"
          />
        </div>

        {/* Subtle atmospheric mist drift */}
        <div className="taynguyen-mist-1 absolute -inset-x-[12%] top-[18%] h-[42%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(250,246,241,0.22)_0%,rgba(244,239,230,0.08)_48%,transparent_76%)] blur-[30px] will-change-transform" />
        <div className="taynguyen-mist-2 absolute -inset-x-[10%] bottom-[22%] h-[38%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,252,246,0.20)_0%,rgba(244,239,230,0.06)_50%,transparent_78%)] blur-[34px] will-change-transform" />

        {/* Balanced cinematic scrim for crisp white heading readability without washing out artwork */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(18,14,10,0.62) 0%, rgba(18,14,10,0.44) 48%, rgba(18,14,10,0.24) 76%, rgba(250,246,241,0) 100%)",
          }}
        />

        {/* Seamless multi-stop transition into the warm cream 3D inspection stage */}
        <div
          className="absolute inset-x-0 bottom-0 h-[150px] sm:h-[180px] lg:h-[210px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(250,246,241,0) 0%, rgba(250,246,241,0.42) 45%, rgba(250,246,241,0.88) 80%, #FAF6F1 100%)",
          }}
        />
      </div>

      <div className="site-shell relative z-10 flex flex-col items-center pt-14 sm:pt-18 lg:pt-24">
        {/* Heading over cinematic Tây Nguyên landscape */}
        <div className="relative w-full max-w-3xl mx-auto text-center flex flex-col items-center pb-4 sm:pb-6 mb-3 sm:mb-5">
          <div className="packaging-eyebrow relative z-10 inline-flex items-center gap-2.5 mb-3.5 sm:mb-4">
            <span
              className="taynguyen-dot-pulse w-2 h-2 rounded-full bg-[#EF4E3E] shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#FAF6F1]/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.65)]">
              {eyebrow}
            </span>
          </div>

          <h2 className="packaging-headline relative z-10 text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] font-bold uppercase tracking-tight text-[#FAF6F1] leading-[1.15] font-sans drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)]">
            {headline}
          </h2>

          <p className="relative z-10 mt-2.5 sm:mt-3 text-sm sm:text-base font-sans text-[#F4EFE6]/90 font-normal drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">
            {subtitle}
          </p>
        </div>

        {/* Product Selector: CÀ PHÊ PHA MÁY | CÀ PHÊ PHA PHIN (high-contrast cream panels) */}
        <div className="packaging-selector w-full flex justify-center mb-4 sm:mb-6">
          <ProductSelector
            selectedProduct={selectedProduct}
            onSelectProduct={setSelectedProduct}
          />
        </div>

        {/* Centered Large 3D Model Stage on neutral cream ground for maximum product visibility */}
        <div className="packaging-stage-container relative w-full max-w-[520px] flex flex-col items-center justify-center select-none">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 top-6 bottom-14 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.75)_0%,rgba(250,246,241,0)_72%)]"
          />
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
