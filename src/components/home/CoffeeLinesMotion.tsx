"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface CoffeeLinesMotionProps {
  sectionRef: React.RefObject<HTMLElement | null>;
}

export function CoffeeLinesMotion({ sectionRef }: CoffeeLinesMotionProps) {
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
            ".coffee-lines-eyebrow",
            ".coffee-lines-title",
            ".coffee-lines-intro",
            ".coffee-lines-card",
            ".coffee-lines-image",
            ".coffee-lines-bottom-cta",
          ],
          { opacity: 1, y: 0, scale: 1, clearProps: "all" }
        );
        return;
      }

      // Initial resting states
      gsap.set(".coffee-lines-eyebrow", { opacity: 0, y: 18 });
      gsap.set(".coffee-lines-title", { opacity: 0, y: 34 });
      gsap.set(".coffee-lines-intro", { opacity: 0, y: 22 });
      gsap.set(".coffee-lines-card", { opacity: 0, y: 36 });
      gsap.set(".coffee-lines-image", { scale: 0.97 });
      gsap.set(".coffee-lines-bottom-cta", { opacity: 0, y: 20 });

      // Screen 02 Entrance Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          toggleActions: "play none none none",
        },
        defaults: { ease: "power3.out" },
      });

      // 1. Eyebrow: opacity 0 -> 1, y: 18 -> 0
      tl.to(".coffee-lines-eyebrow", {
        opacity: 1,
        y: 0,
        duration: 0.75,
      })
        // 2. Headline: opacity 0 -> 1, y: 34 -> 0 (~100ms later)
        .to(
          ".coffee-lines-title",
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
          },
          0.1
        )
        // 3. Intro: opacity 0 -> 1, y: 22 -> 0 (~100ms later)
        .to(
          ".coffee-lines-intro",
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
          },
          0.2
        )
        // 4. Two coffee lines with ~140ms stagger & product image scale 0.97 -> 1
        .to(
          ".coffee-lines-card",
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.14,
          },
          0.32
        )
        .to(
          ".coffee-lines-image",
          {
            scale: 1,
            duration: 0.95,
            stagger: 0.14,
          },
          0.32
        )
        // 5. Shared bottom CTA
        .to(
          ".coffee-lines-bottom-cta",
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
          },
          "-=0.4"
        );
    }, section);

    return () => {
      ctx.revert();
    };
  }, [sectionRef]);

  return null;
}
