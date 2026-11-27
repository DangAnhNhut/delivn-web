"use client";

import { useRef } from "react";
import Image, { getImageProps } from "next/image";
import { tayNguyenHeroContent } from "@/data/content/home";
import { TayNguyenHeroMotion } from "./TayNguyenHeroMotion";

export function TayNguyenHero() {
  const sectionRef = useRef<HTMLElement>(null);

  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    src: tayNguyenHeroContent.panoramaImage.src,
    alt: tayNguyenHeroContent.panoramaImage.alt,
    width: tayNguyenHeroContent.panoramaImage.width,
    height: tayNguyenHeroContent.panoramaImage.height,
    priority: true,
    sizes: "100vw",
  });

  const {
    props: { srcSet: mobileSrcSet, ...mobileImgProps },
  } = getImageProps({
    src: tayNguyenHeroContent.image.src,
    alt: tayNguyenHeroContent.image.alt,
    width: tayNguyenHeroContent.image.width,
    height: tayNguyenHeroContent.image.height,
    priority: true,
    sizes: "100vw",
  });

  return (
    <section
      ref={sectionRef}
      aria-label="DELIVN — Câu chuyện cà phê Tây Nguyên"
      className="relative w-full overflow-x-clip bg-[#F4EFE6] text-[#1A1A1A]"
    >
      <TayNguyenHeroMotion sectionRef={sectionRef} />

      {/* Zone A: Art-directed Hero (original 1282x869 on mobile/tablet, balanced roof-to-xà-rông panorama on desktop) */}
      <div className="relative w-full overflow-hidden bg-[#F4EFE6] aspect-[1282/869] lg:aspect-[1774/650]">
        <picture className="block w-full h-full">
          <source
            media="(min-width: 1024px)"
            srcSet={desktopSrcSet}
            sizes="100vw"
          />
          <img
            {...mobileImgProps}
            srcSet={mobileSrcSet}
            alt={tayNguyenHeroContent.image.alt}
            className="block w-full h-full object-cover object-center lg:object-[center_36%]"
          />
        </picture>
      </div>

      {/* Zone B: Brand Statement & Story Intro */}
      <div className="taynguyen-story-zone w-full lg:w-[92vw] max-w-[1520px] mx-auto px-6 sm:px-8 lg:px-0 pt-12 pb-10 sm:pt-14 sm:pb-12 lg:pt-12 lg:pb-14 xl:pt-14 xl:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-8 sm:gap-10 lg:gap-14 xl:gap-20 lg:items-center">
          {/* Left: Official DELIVN Wordmark + Unified Uppercase Heading + Monumental TÂY NGUYÊN */}
          <div className="relative">
            <div className="taynguyen-eyebrow inline-flex items-center gap-2.5 mb-3.5 sm:mb-4">
              <span
                className="taynguyen-dot-pulse w-2 h-2 rounded-full bg-[#EF4E3E] shrink-0"
                aria-hidden="true"
              />
              <span className="text-[11px] lg:text-xs font-sans font-semibold tracking-[0.22em] uppercase text-[#6B6259]">
                {tayNguyenHeroContent.indexLabel}
              </span>
            </div>

            {/* Official DELIVN Black Vector Wordmark */}
            <div className="taynguyen-wordmark mb-4 sm:mb-5">
              <Image
                src="/brand/delivn-wordmark.svg"
                alt={tayNguyenHeroContent.brandLabel}
                width={612}
                height={80}
                className="w-[168px] sm:w-[192px] lg:w-[238px] xl:w-[264px] h-auto object-contain select-none"
              />
            </div>

            <h1 className="relative">
              <span className="sr-only">{tayNguyenHeroContent.brandLabel} — </span>

              {/* Unified, all-caps 2-font heading: Playfair Display + Be Vietnam Pro */}
              <span className="taynguyen-heading-group block text-[clamp(22px,5.5vw,30px)] lg:text-[clamp(28px,2.15vw,38px)] leading-[1.28] text-[#1A1A1A]">
                <span className="font-display-serif font-semibold tracking-[0.02em] uppercase">
                  {tayNguyenHeroContent.headline.lead}
                </span>{" "}
                <span className="font-sans font-extrabold tracking-[0.06em] uppercase border-b-2 border-[#EF4E3E] pb-0.5 whitespace-nowrap">
                  {tayNguyenHeroContent.headline.highlight}
                </span>
              </span>

              {/* Mountain / Sky / Mist Landscape Lockup + Monumental "TÂY NGUYÊN" */}
              <span className="relative block mt-2 sm:mt-3 pt-9 sm:pt-11 lg:pt-14 pb-6 sm:pb-8 lg:pb-9">
                {/* Feathered mountain-sky crop from existing DELIVN asset */}
                <span
                  aria-hidden="true"
                  className="taynguyen-mountain-reveal pointer-events-none absolute -left-[4%] -right-[4%] lg:-left-[5%] lg:-right-[10%] bottom-0 h-[140px] sm:h-[160px] lg:h-[205px] xl:h-[225px] overflow-hidden taynguyen-mountain-mask"
                >
                  {/* Mist layer 1 — behind mountain ridge */}
                  <span className="taynguyen-mist-1 pointer-events-none absolute -inset-x-[12%] top-[8%] h-[62%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(250,246,241,0.94)_0%,rgba(244,239,230,0.48)_45%,transparent_76%)] blur-[26px] lg:blur-[38px] z-0 will-change-transform" />

                  {/* Mountain ridge + sunset sky crop (softly grouped, subdued detail) */}
                  <span
                    className="absolute inset-0 z-[1] bg-no-repeat opacity-[0.36] md:opacity-[0.46] lg:opacity-[0.52] saturate-[0.82] contrast-[1.04] brightness-[1.02] blur-[0.5px]"
                    style={{
                      backgroundImage: `url("${tayNguyenHeroContent.image.src}")`,
                      backgroundPosition: "66% 30%",
                      backgroundSize: "175% auto",
                    }}
                  />

                  {/* Mist layer 2 — in front of mountain ridge, around foot of title */}
                  <span className="taynguyen-mist-2 pointer-events-none absolute -inset-x-[10%] bottom-[0%] h-[58%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,252,246,0.92)_0%,rgba(244,239,230,0.48)_50%,transparent_78%)] blur-[28px] lg:blur-[42px] z-[2] will-change-transform" />

                  {/* Soft warm halo behind title for crisp readability */}
                  <span className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(ellipse_at_42%_58%,rgba(250,246,241,0.68)_0%,rgba(244,239,230,0.28)_48%,transparent_76%)]" />
                </span>

                {/* Monumental Cast Earth-Gold "TÂY NGUYÊN" */}
                <span className="taynguyen-title-3d taynguyen-monumental-wrap relative z-10 inline-block font-sans font-black uppercase text-[clamp(44px,11.2vw,54px)] lg:text-[clamp(74px,5.5vw,104px)] leading-[0.98] tracking-[-0.045em]">
                  <span
                    aria-hidden="true"
                    className="taynguyen-cast-edge absolute inset-0 translate-x-[1.5px] translate-y-[2px] select-none pointer-events-none"
                  >
                    {tayNguyenHeroContent.headline.region}
                  </span>
                  <span className="taynguyen-monumental-face relative z-10 block">
                    {tayNguyenHeroContent.headline.region}
                  </span>
                </span>
              </span>
            </h1>
          </div>

          {/* Right: Story Narrative */}
          <div className="relative z-10">
            <div
              className="taynguyen-accent-line w-12 lg:w-14 h-[1.5px] lg:h-[2px] bg-[#EF4E3E]/80 mb-5 sm:mb-6"
              aria-hidden="true"
            />
            <div className="text-[15.5px] sm:text-[17px] lg:text-[18px] xl:text-[19px] leading-[1.72] font-normal text-[#2C2C2C] max-w-[540px] space-y-4 lg:space-y-5">
              {tayNguyenHeroContent.paragraphs.map((paragraph, index) => (
                <p key={index} className="taynguyen-narrative-p">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          className="taynguyen-scroll-cue mt-8 sm:mt-9 lg:mt-8 flex flex-col items-center justify-center gap-1.5 select-none"
          aria-hidden="true"
        >
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#6B6259]">
            {tayNguyenHeroContent.scrollCue}
          </span>
          <span className="taynguyen-scroll-arrow text-sm text-[#6B6259]">
            ↓
          </span>
        </div>
      </div>
    </section>
  );
}
