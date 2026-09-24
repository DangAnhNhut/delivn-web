"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Ensure ScrollTrigger is registered
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface HeroMotionProps {
  sectionRef: React.RefObject<HTMLElement | null>;
}

export function HeroMotion({ sectionRef }: HeroMotionProps) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Check accessibility: prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Use gsap.context for clean scoping and teardown
    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        // Reduced motion: reveal all elements immediately without transforms
        gsap.set(
          [
            ".hero-marginal-accent",
            ".hero-eyebrow",
            ".hero-headline-line",
            ".hero-description",
            ".hero-cta",
            ".hero-supporting-row",
            ".hero-product-stage",
            ".hero-product-shadow",
            ".hero-ambient-halo",
            ".hero-leaves",
            ".hero-bean",
            ".hero-scroll-cue",
          ],
          { opacity: 1, y: 0, x: 0, scale: 1, clearProps: "all" }
        );
        gsap.set(".hero-sun-left", { opacity: 0.05 });
        gsap.set(".hero-sun-right", { opacity: 0.045 });
        return;
      }

      // Check if viewport is desktop for full motion experience (>= 1024px)
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const isDesktopPointer = window.matchMedia(
        "(min-width: 1024px) and (pointer: fine)"
      ).matches;

      // -------------------------------------------------------------
      // 1. INITIAL HERO ENTRANCE TIMELINE
      // -------------------------------------------------------------
      const entranceTl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      // Initial states for entrance
      gsap.set(".hero-marginal-accent", { opacity: 0, y: 10 });
      gsap.set(".hero-eyebrow", { opacity: 0, y: 12 });
      gsap.set(".hero-headline-line", { opacity: 0, y: 22 });
      gsap.set(".hero-description", { opacity: 0, y: 16 });
      gsap.set(".hero-cta", { opacity: 0, y: 12 });
      gsap.set(".hero-supporting-row", { opacity: 0, y: 10 });
      gsap.set(".hero-product-stage", { opacity: 0, y: 40, scale: 0.96 });
      gsap.set(".hero-product-shadow", { opacity: 0, scaleX: 0.85 });
      gsap.set(".hero-ambient-halo", { opacity: 0 });
      gsap.set(".hero-leaves", { opacity: 0, x: 14, y: -8 });
      gsap.set(".hero-bean", { opacity: 0, scale: 0.82 });
      gsap.set(".hero-sun-left", { opacity: 0 });
      gsap.set(".hero-sun-right", { opacity: 0 });

      // Sequence:
      // A. Background brand watermarks soft fade-in (Restrained 4.5%-5% opacity)
      entranceTl
        .to(".hero-sun-left", { opacity: 0.05, duration: 1.5, ease: "power2.out" }, 0)
        .to(".hero-sun-right", { opacity: 0.045, duration: 1.5, ease: "power2.out" }, 0);

      // B. Upper-left marginal motif & eyebrow reveal
      entranceTl
        .to(".hero-marginal-accent", { opacity: 1, y: 0, duration: 0.7 }, 0.05)
        .to(".hero-eyebrow", { opacity: 1, y: 0, duration: 0.75 }, 0.1);

      // C. Sequential headline lines reveal (stagger 90ms)
      entranceTl.to(
        ".hero-headline-line",
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.09,
        },
        0.22
      );

      // D. Product Visual entrance — coordinated shortly after first headline appears
      entranceTl
        .to(
          ".hero-product-stage",
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.25,
            ease: "power3.out",
          },
          0.38
        )
        .to(
          ".hero-ambient-halo",
          {
            opacity: 1,
            duration: 1.2,
            ease: "power2.out",
          },
          0.38
        )
        .to(
          ".hero-product-shadow",
          {
            opacity: 1,
            scaleX: 1,
            duration: 1.15,
            ease: "power3.out",
          },
          0.45
        );

      // E. Foliage & Falling Beans entrance (desktop only)
      if (isDesktop) {
        entranceTl
          .to(
            ".hero-leaves",
            {
              opacity: 0.9,
              x: 0,
              y: 0,
              duration: 1.3,
              ease: "power2.out",
            },
            0.4
          )
          .to(
            ".hero-bean",
            {
              opacity: 1,
              scale: 1,
              duration: 0.9,
              stagger: 0.07,
              ease: "back.out(1.15)",
            },
            0.55
          );
      }

      // F. Supporting narrative description
      entranceTl.to(
        ".hero-description",
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
        },
        0.58
      );

      // G. CTA Button & Supporting micro-content row
      entranceTl
        .to(
          ".hero-cta",
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
          },
          0.72
        )
        .to(
          ".hero-supporting-row",
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
          },
          0.82
        );

      // -------------------------------------------------------------
      // 2. IDLE RESTING MOTIONS (Desktop only, organic, subtle)
      // -------------------------------------------------------------
      entranceTl.call(() => {
        if (!isDesktop) return;

        // A. Product float — extremely subtle breathing (y: 0 -> -5px -> 0)
        gsap.to(".hero-product-stage", {
          y: -5,
          duration: 6.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        // Complementary contact shadow breathe
        gsap.to(".hero-product-shadow", {
          scaleX: 0.97,
          opacity: 0.85,
          duration: 6.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        // B. Coffee Leaf Branch — gentle natural breeze sway from top-right anchor
        gsap.to(".hero-leaves", {
          rotation: 0.75,
          x: -2.5,
          y: 2,
          transformOrigin: "95% 5%",
          duration: 7.8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        // C. Individual Coffee Bean sprites — unsynchronized organic drift
        // Bean 1 (upper right accent near foliage)
        gsap.to(".hero-bean-1", {
          y: 8,
          x: -3,
          rotation: "-=6",
          duration: 5.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        // Bean 2 (upper drift above espresso bag)
        gsap.to(".hero-bean-2", {
          y: -10,
          x: 4,
          rotation: "+=9",
          duration: 6.4,
          delay: 0.7,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        // Bean 3 (large accent bean flanking outer right of kraft bag)
        gsap.to(".hero-bean-3", {
          y: 11,
          x: -4,
          rotation: "-=8",
          duration: 5.9,
          delay: 0.3,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        // Bean 4 (depth-of-field soft-focus bean — moves slightly more slowly)
        gsap.to(".hero-bean-4", {
          y: -6,
          x: 3,
          rotation: "+=5",
          duration: 7.8,
          delay: 1.1,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        // Bean 5 (lower-outer floater)
        gsap.to(".hero-bean-5", {
          y: 9,
          x: -3.5,
          rotation: "+=8",
          duration: 6.8,
          delay: 0.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });

      // -------------------------------------------------------------
      // 3. SCROLL CUE ANIMATION
      // -------------------------------------------------------------
      gsap.fromTo(
        ".hero-scroll-line",
        { scaleY: 0.25, opacity: 0.2, transformOrigin: "top" },
        {
          scaleY: 1,
          opacity: 0.65,
          duration: 2.0,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        }
      );

      // -------------------------------------------------------------
      // 4. SCREEN 01 -> SCREEN 02 SCROLL TRANSITION (ScrollTrigger)
      // -------------------------------------------------------------
      if (isDesktop) {
        gsap.to(".hero-left-content", {
          y: -22,
          opacity: 0.88,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });

        gsap.to(".hero-product-stage", {
          y: -12,
          scale: 0.985,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });

        gsap.to(".hero-leaves", {
          y: -16,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });
      }

      // -------------------------------------------------------------
      // 5. DESKTOP POINTER PARALLAX (Desktop only: >= 1024px, fine pointer)
      // -------------------------------------------------------------
      if (isDesktopPointer) {
        // Setup gsap.quickTo for silky smooth 60fps interpolation without state re-renders
        const moveProductX = gsap.quickTo(".hero-product-stage", "x", {
          duration: 0.9,
          ease: "power2.out",
        });
        const moveProductY = gsap.quickTo(".hero-product-stage", "y", {
          duration: 0.9,
          ease: "power2.out",
        });

        const moveBeansX = gsap.quickTo(".hero-bean-cluster", "x", {
          duration: 0.7,
          ease: "power2.out",
        });
        const moveBeansY = gsap.quickTo(".hero-bean-cluster", "y", {
          duration: 0.7,
          ease: "power2.out",
        });

        const moveLeavesX = gsap.quickTo(".hero-leaves", "x", {
          duration: 1.1,
          ease: "power2.out",
        });
        const moveLeavesY = gsap.quickTo(".hero-leaves", "y", {
          duration: 1.1,
          ease: "power2.out",
        });

        const moveSunLeftX = gsap.quickTo(".hero-sun-left", "x", {
          duration: 1.3,
          ease: "power2.out",
        });
        const moveSunLeftY = gsap.quickTo(".hero-sun-left", "y", {
          duration: 1.3,
          ease: "power2.out",
        });

        const moveSunRightX = gsap.quickTo(".hero-sun-right", "x", {
          duration: 1.3,
          ease: "power2.out",
        });
        const moveSunRightY = gsap.quickTo(".hero-sun-right", "y", {
          duration: 1.3,
          ease: "power2.out",
        });

        const handlePointerMove = (e: PointerEvent) => {
          const rect = section.getBoundingClientRect();
          // Normalized -0.5 to +0.5 from center of the hero section
          const normX = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
          const normY = (e.clientY - (rect.top + rect.height / 2)) / rect.height;

          // Subtle displacement
          moveProductX(normX * 8);
          moveProductY(normY * 6);

          moveBeansX(normX * 12);
          moveBeansY(normY * 10);

          moveLeavesX(normX * -5);
          moveLeavesY(normY * -4);

          moveSunLeftX(normX * 3);
          moveSunLeftY(normY * 2.5);

          moveSunRightX(normX * -3);
          moveSunRightY(normY * -2.5);
        };

        const handlePointerLeave = () => {
          moveProductX(0);
          moveProductY(0);
          moveBeansX(0);
          moveBeansY(0);
          moveLeavesX(0);
          moveLeavesY(0);
          moveSunLeftX(0);
          moveSunLeftY(0);
          moveSunRightX(0);
          moveSunRightY(0);
        };

        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        document.addEventListener("pointerleave", handlePointerLeave);

        // Return cleanup function to be executed when ctx is reverted
        return () => {
          window.removeEventListener("pointermove", handlePointerMove);
          document.removeEventListener("pointerleave", handlePointerLeave);
        };
      }
    }, section);

    return () => {
      ctx.revert(); // Complete GSAP cleanup on unmount
    };
  }, [sectionRef]);

  return null;
}
