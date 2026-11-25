"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface TayNguyenHeroMotionProps {
  sectionRef: React.RefObject<HTMLElement | null>;
}

export function TayNguyenHeroMotion({ sectionRef }: TayNguyenHeroMotionProps) {
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
            ".taynguyen-eyebrow",
            ".taynguyen-wordmark",
            ".taynguyen-heading-group",
            ".taynguyen-mountain-reveal",
            ".taynguyen-title-3d",
            ".taynguyen-accent-line",
            ".taynguyen-narrative-p",
            ".taynguyen-scroll-cue",
          ],
          {
            opacity: 1,
            y: 0,
            scale: 1,
            scaleX: 1,
            filter: "blur(0px)",
            clearProps: "all",
          }
        );
        return;
      }

      gsap.set([".taynguyen-eyebrow", ".taynguyen-wordmark"], {
        opacity: 0,
        y: 14,
        filter: "blur(4px)",
      });
      gsap.set(".taynguyen-heading-group", {
        opacity: 0,
        y: 18,
        filter: "blur(5px)",
      });
      gsap.set(".taynguyen-mountain-reveal", {
        opacity: 0,
        y: 14,
        scale: 1.04,
      });
      gsap.set(".taynguyen-title-3d", {
        opacity: 0,
        y: 22,
        scale: 0.97,
        filter: "blur(6px)",
      });
      gsap.set(".taynguyen-cast-edge", {
        opacity: 0,
      });
      gsap.set(".taynguyen-accent-line", {
        scaleX: 0,
        transformOrigin: "left center",
      });
      gsap.set(".taynguyen-narrative-p", {
        opacity: 0,
        y: 16,
        filter: "blur(3px)",
      });
      gsap.set(".taynguyen-scroll-cue", { opacity: 0, y: 8 });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: ".taynguyen-story-zone",
          start: "top 88%",
          once: true,
        },
      });

      tl.to(
        [".taynguyen-eyebrow", ".taynguyen-wordmark"],
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.65,
          stagger: 0.08,
        },
        0.04
      )
        .to(
          ".taynguyen-heading-group",
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.7,
          },
          0.16
        )
        .to(
          ".taynguyen-mountain-reveal",
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.1,
            ease: "power2.out",
          },
          0.26
        )
        .to(
          ".taynguyen-title-3d",
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power3.out",
          },
          0.36
        )
        .to(
          ".taynguyen-cast-edge",
          {
            opacity: 0.92,
            duration: 0.9,
            ease: "power2.out",
          },
          0.42
        )
        .to(
          ".taynguyen-accent-line",
          { scaleX: 1, duration: 0.65, ease: "power2.out" },
          0.42
        )
        .to(
          ".taynguyen-narrative-p",
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.68,
            stagger: 0.1,
          },
          0.46
        )
        .to(".taynguyen-scroll-cue", { opacity: 1, y: 0, duration: 0.55 }, 0.72);
    }, section);

    return () => {
      ctx.revert();
    };
  }, [sectionRef]);

  return null;
}
