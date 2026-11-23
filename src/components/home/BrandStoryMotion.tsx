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

    // 0. ACCESSIBILITY OVERRIDE: If user prefers reduced motion, set everything static immediately
    if (prefersReducedMotion) {
      section.classList.remove("story-motion-in-view");
      gsap.set(
        [
          ".story-intro-eyebrow",
          ".story-intro-title",
          ".story-intro-sublead",
          ".story-chapter-card",
          ".story-image-column",
          ".story-text-column",
          ".story-pill",
          ".story-tagline",
          ".story-title",
          ".story-desc",
          ".story-closing-wrap",
          ".story-closing-draw",
          ".story-sunburst-rotate",
          ".story-orbit-c1",
          ".steam-wisp-1",
          ".steam-wisp-2",
          ".steam-wisp-3",
          ".story-bean-sway",
          ".story-roast-arc",
          ".story-dot-pulse",
          ".story-line-pulse",
          ".story-indicator-shimmer",
          ".story-frame-glow",
          ".story-ambient-drift",
        ],
        { opacity: 1, y: 0, x: 0, scale: 1, scaleX: 1, rotation: 0, clearProps: "all" }
      );
      return;
    }

    // 1. PERFORMANCE: Viewport Visibility Manager via IntersectionObserver
    // Activates GPU CSS loop animations ONLY when the Brand Story section is within viewport
    // Automatically pauses all CSS loops when the user scrolls away to save CPU/GPU cycles
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("story-motion-in-view");
        } else {
          section.classList.remove("story-motion-in-view");
        }
      },
      { rootMargin: "150px 0px 150px 0px", threshold: 0 }
    );

    io.observe(section);

    // 2. GSAP ENTRANCE STAGGER (Fires once on scroll into view, zero scroll jank)
    const ctx = gsap.context(() => {
      // Intro header entrance
      const introTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".story-intro-header",
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });

      introTl
        .from(".story-intro-eyebrow", {
          opacity: 0,
          y: 14,
          duration: 0.6,
          ease: "power2.out",
        })
        .from(
          ".story-intro-title",
          {
            opacity: 0,
            y: 22,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.4"
        )
        .from(
          ".story-intro-sublead",
          {
            opacity: 0,
            y: 18,
            duration: 0.7,
            ease: "power2.out",
          },
          "-=0.5"
        );

      // Chapter cards entrance (Image + Text elements stagger)
      const chapters = gsap.utils.toArray<HTMLElement>(".story-chapter-card");
      chapters.forEach((chapterEl, idx) => {
        const imgCol = chapterEl.querySelector(".story-image-column");
        const pill = chapterEl.querySelector(".story-pill");
        const tagline = chapterEl.querySelector(".story-tagline");
        const title = chapterEl.querySelector(".story-title");
        const desc = chapterEl.querySelector(".story-desc");

        const chTl = gsap.timeline({
          scrollTrigger: {
            trigger: chapterEl,
            start: "top 82%",
            toggleActions: "play none none none",
          },
        });

        // Image entrance: subtle scale 0.985 -> 1, translateY 22px -> 0, opacity 0 -> 1
        if (imgCol) {
          chTl.from(imgCol, {
            opacity: 0,
            y: 22,
            scale: 0.985,
            duration: 0.8,
            ease: "power2.out",
          });
        }

        // Text stagger: pill -> tagline -> title -> desc
        const textElements = [pill, tagline, title, desc].filter(Boolean);
        if (textElements.length > 0) {
          chTl.from(
            textElements,
            {
              opacity: 0,
              y: 16,
              duration: 0.65,
              stagger: 0.1,
              ease: "power2.out",
            },
            "-=0.55"
          );
        }

        // Chapter 03 specific: Closing statement & animated underline draw
        if (idx === 2) {
          const closingWrap = chapterEl.querySelector(".story-closing-wrap");
          const underline = chapterEl.querySelector(".story-closing-draw");
          if (closingWrap && underline) {
            chTl.from(
              closingWrap,
              {
                opacity: 0,
                y: 16,
                duration: 0.6,
                ease: "power2.out",
              },
              "-=0.2"
            );
            chTl.fromTo(
              underline,
              { scaleX: 0, transformOrigin: "left" },
              { scaleX: 1, duration: 0.85, ease: "power2.out" },
              "-=0.25"
            );
          }
        }
      });
    }, section);

    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, [sectionRef]);

  return null;
}
