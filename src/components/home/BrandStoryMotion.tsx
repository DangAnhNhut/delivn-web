"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface BrandStoryMotionProps {
  sectionRef: React.RefObject<HTMLElement | null>;
}

export function BrandStoryMotion({ sectionRef }: BrandStoryMotionProps) {
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
            ".story-header-item",
            ".story-sunburst",
            ".story-image-container",
            ".story-image-badge",
            ".story-content-item",
            ".story-closing-item",
          ],
          { opacity: 1, y: 0, scale: 1, clearProps: "all" }
        );
        return;
      }

      // Initial resting states
      gsap.set(".story-header-item", { opacity: 0, y: 28 });
      gsap.set(".story-sunburst", { opacity: 0, scale: 0.92, rotation: -8 });
      gsap.set(".story-image-container", { opacity: 0, y: 32, scale: 0.985 });
      gsap.set(".story-image-badge", { opacity: 0, y: 10 });
      gsap.set(".story-step-nav", { opacity: 0, x: 18 });
      gsap.set(".story-active-panel", { opacity: 0, y: 16 });
      gsap.set(".story-closing-item", { opacity: 0, y: 24 });

      // Screen 04 Initial Section Entrance Timeline
      const sectionTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          toggleActions: "play none none none",
        },
        defaults: { ease: "power3.out" },
      });

      sectionTl
        .to(".story-header-item", {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.12,
        })
        .to(
          ".story-sunburst",
          {
            opacity: 0.08,
            scale: 1,
            rotation: 0,
            duration: 1.2,
            ease: "power2.out",
          },
          "-=0.6"
        )
        .to(
          ".story-image-container",
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
          },
          "-=0.5"
        )
        .to(
          ".story-image-badge",
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
          },
          "-=0.4"
        )
        .to(
          ".story-step-nav",
          {
            opacity: 1,
            x: 0,
            duration: 0.75,
          },
          "-=0.6"
        )
        .to(
          ".story-active-panel",
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
          },
          "-=0.5"
        );

      // Sunburst parallax on section scroll
      gsap.to(".story-sunburst", {
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
        yPercent: -15,
        rotation: 6,
        ease: "none",
      });

      // Closing Statement entrance
      gsap.to(".story-closing-item", {
        scrollTrigger: {
          trigger: ".story-closing-wrapper",
          start: "top 80%",
          toggleActions: "play none none none",
        },
        opacity: 1,
        y: 0,
        duration: 0.85,
        stagger: 0.14,
        ease: "power3.out",
      });
    }, section);

    return () => ctx.revert();
  }, [sectionRef]);

  return null;
}
