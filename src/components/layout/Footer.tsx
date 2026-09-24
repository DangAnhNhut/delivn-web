"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { footerContent } from "@/data/content/home";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const { brandLine, summary, tag, company, navigation, copyright } =
    footerContent;

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set([".footer-inner", ".footer-col"], {
          opacity: 1,
          y: 0,
          clearProps: "all",
        });
        return;
      }

      // Initial state
      gsap.set(".footer-inner", { opacity: 0, y: 24 });
      gsap.set(".footer-col", { opacity: 0, y: 16 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: footer,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        defaults: { ease: "power3.out" },
      });

      tl.to(".footer-inner", {
        opacity: 1,
        y: 0,
        duration: 0.8,
      }).to(
        ".footer-col",
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.08,
        },
        "-=0.5"
      );
    }, footer);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      id="site-footer"
      className="bg-[#161616] text-[#FAF6F1]/80 relative z-20 border-t border-neutral-800"
    >
      <div className="footer-inner site-shell pt-14 sm:pt-16 lg:pt-20 pb-10 sm:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* COL 1: Brand Wordmark & Tag (lg:col-span-5) */}
          <div className="footer-col lg:col-span-5 flex flex-col items-start pr-0 lg:pr-6">
            {/* Official White Logo with authentic Red Seal - ZERO CSS filters */}
            <Link
              href="/"
              aria-label="DELIVN — Về trang chủ"
              className="inline-block mb-5 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
            >
              <Image
                src="/brand/delivn-logo-white.svg"
                alt="DELIVN Logo"
                width={96}
                height={72}
                className="h-9 sm:h-10 w-auto object-contain select-none"
              />
            </Link>

            {/* Brand Closing Line */}
            <p className="text-white text-sm sm:text-base font-semibold tracking-[0.08em] uppercase mb-3">
              {brandLine}
            </p>

            {/* Brand Narrative Summary */}
            <p className="text-xs sm:text-[13px] text-neutral-400 leading-relaxed font-light mb-5 max-w-md">
              {summary}
            </p>

            {/* Origin Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xs bg-[#1F1F1F] border border-neutral-800 text-[10px] sm:text-[10.5px] uppercase font-mono tracking-widest text-neutral-400 select-none">
              <span
                className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"
                aria-hidden="true"
              />
              <span>{tag}</span>
            </div>
          </div>

          {/* COL 2: Verified Company Legal Information (lg:col-span-4) */}
          <div className="footer-col lg:col-span-4 flex flex-col items-start text-xs text-neutral-400 leading-relaxed space-y-2.5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/90 mb-2">
              THÔNG TIN DOANH NGHIỆP
            </h3>
            <p className="text-white font-medium text-[12.5px]">
              {company.name}
            </p>
            <p>
              <span className="text-neutral-500 font-mono">MST:</span>{" "}
              <span className="font-mono text-neutral-300">{company.mst}</span>
            </p>
            <p className="text-neutral-400">
              <span className="text-neutral-500 font-mono">Địa chỉ:</span>{" "}
              {company.address}
            </p>
            <p>
              <span className="text-neutral-500 font-mono">Hotline:</span>{" "}
              <a
                href={`tel:${company.phone}`}
                className="text-neutral-300 hover:text-white transition-colors"
              >
                {company.phone}
              </a>
            </p>
          </div>

          {/* COL 3: Primary Navigation Links (lg:col-span-3) */}
          <div className="footer-col lg:col-span-3 flex flex-col items-start lg:items-end">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/90 mb-4 lg:mb-5">
              KHÁM PHÁ DELIVN
            </h3>
            <nav
              aria-label="Menu chân trang"
              className="flex flex-col items-start lg:items-end gap-3.5"
            >
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-xs sm:text-[13px] font-medium tracking-[0.2em] text-neutral-400 hover:text-white transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* BOTTOM: Minimal Hairline Divider & Copyright */}
        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-light">
          <p>{copyright}</p>
          <p className="text-[11px] font-mono tracking-wider text-neutral-500/80 uppercase">
            BẢN SẮC TÂY NGUYÊN · THIẾT KẾ ĐƯƠNG ĐẠI
          </p>
        </div>
      </div>
    </footer>
  );
}
