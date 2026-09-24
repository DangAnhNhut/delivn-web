import Image from "next/image";

/**
 * TayNguyenMotifs
 * Subtle, refined ethnic decorative motifs inspired by DELIVN packaging artwork
 * and Central Highlands (Tây Nguyên) visual language:
 * - Ghosted circular tribal sunburst watermark in upper-left
 * - Subtle marginal coordinates & indigenous chevron accent
 * - Geometric ethnic pattern border for supporting content
 *
 * All motifs maintain low contrast (opacity 4%–10% for watermarks, 25%–35% for thin vector accents)
 * to enrich the layout without adding clutter or impairing typography readability.
 */

export function UpperLeftWatermark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute -top-12 -left-12 sm:-top-16 sm:-left-16 lg:-top-20 lg:-left-20 xl:-top-24 xl:-left-24 w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] lg:w-[580px] lg:h-[580px] xl:w-[680px] xl:h-[680px] min-[1920px]:w-[760px] min-[1920px]:h-[760px] pointer-events-none select-none -z-10 opacity-[0.04] lg:opacity-[0.05] min-[1920px]:opacity-[0.055] transition-opacity duration-500 ${className}`}
      aria-hidden="true"
    >
      <Image
        src="/brand/delivn-sun-motif.png"
        alt=""
        fill
        sizes="(min-width: 1920px) 760px, (min-width: 1280px) 680px, 580px"
        className="object-contain"
        priority={false}
      />
    </div>
  );
}

/**
 * Upper-left marginal editorial accent
 * Combines Central Highlands coordinates with subtle ethnic chevron marks
 */
export function UpperLeftMarginalAccent({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none select-none flex items-center gap-3 text-[#8C6D48] opacity-35 min-[1920px]:opacity-45 ${className}`}
      aria-hidden="true"
    >
      <svg
        width="38"
        height="10"
        viewBox="0 0 38 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 8L5 2L9 8L13 2L17 8L21 2L25 8L29 2L33 8L37 2" />
      </svg>
      <span className="text-[10px] font-mono tracking-[0.22em] uppercase">
        12°40′N 108°03′E
      </span>
      <span className="w-1.5 h-1.5 rotate-45 border border-current bg-current/20 inline-block shrink-0" />
    </div>
  );
}

/**
 * Subtle indigenous chevron / diamond pattern divider
 * Inspired by the traditional brocade (thổ cẩm) borders on DELIVN coffee bags
 */
export function EthnicDividerLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-2 pointer-events-none select-none text-[#8C6D48] opacity-30 min-[1920px]:opacity-35 ${className}`}
      aria-hidden="true"
    >
      <svg
        width="64"
        height="8"
        viewBox="0 0 64 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 6L5 2L9 6L13 2L17 6L21 2L25 6L29 2L33 6L37 2L41 6L45 2L49 6L53 2L57 6L61 2" />
      </svg>
      <span className="w-1 h-1 rotate-45 border border-current bg-current shrink-0" />
      <div className="flex-1 h-[1px] bg-current opacity-40 max-w-[200px]" />
    </div>
  );
}
