"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface FinalCTAMotionProps {
  sectionRef: React.RefObject<HTMLElement | null>;
}

export function FinalCTAMotion({ sectionRef }: FinalCTAMotionProps) {
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
            ".final-cta-eyebrow",
            ".final-cta-headline",
            ".final-cta-serif",
            ".final-cta-desc",
            ".final-cta-action",
            ".final-cta-footnote",
            ".final-cta-product",
            ".final-cta-caption",
            ".final-cta-motif",
          ],
          { opacity: 1, y: 0, scale: 1, clearProps: "all" }
        );
        return;
      }

      // Initial resting states (clearly perceptible deltas)
      gsap.set(".final-cta-eyebrow", { opacity: 0, y: 18 });
      gsap.set(".final-cta-headline", { opacity: 0, y: 32 });
      gsap.set(".final-cta-serif", { opacity: 0, y: 24 });
      gsap.set(".final-cta-desc", { opacity: 0, y: 20 });
      gsap.set(".final-cta-action", { opacity: 0, y: 20 });
      gsap.set(".final-cta-footnote", { opacity: 0, y: 14 });
      gsap.set(".final-cta-product", { opacity: 0, y: 36, scale: 0.98 });
      gsap.set(".final-cta-caption", { opacity: 0, y: 12 });
      gsap.set(".final-cta-motif", { opacity: 0, scale: 0.94 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          toggleActions: "play none none none",
        },
        defaults: { ease: "power3.out" },
      });

      // 1. Eyebrow reveal (t = 0.0s)
      tl.to(".final-cta-eyebrow", {
        opacity: 1,
        y: 0,
        duration: 0.55,
      })

      // ↓ 80–120ms (t = 0.10s)
      // 2. Headline reveal
      .to(
        ".final-cta-headline",
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
        },
        0.10
      )
      .to(
        ".final-cta-serif",
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
        },
        0.16
      )

      // ↓ 100ms (t = 0.26s)
      // 3. Body reveal (supporting copy + CTA button)
      .to(
        ".final-cta-desc",
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
        },
        0.26
      )
      .to(
        ".final-cta-action",
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
        },
        0.34
      )

      // ↓
      // 4. Image / Product reveal
      .to(
        ".final-cta-product",
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.85,
        },
        0.44
      )

      // ↓
      // 5. Decorative details
      .to(
        ".final-cta-motif",
        {
          opacity: 0.05,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
        },
        0.58
      )
      .to(
        ".final-cta-caption",
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        0.65
      )
      .to(
        ".final-cta-footnote",
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        0.70
      );
    }, section);

    return () => ctx.revert();
  }, [sectionRef]);

  return null;
}
