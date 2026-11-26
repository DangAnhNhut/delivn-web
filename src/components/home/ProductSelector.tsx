"use client";

import Image from "next/image";
import { packagingExperienceContent } from "@/data/content/home";

interface ProductSelectorProps {
  selectedProduct: "sand" | "black";
  onSelectProduct: (product: "sand" | "black") => void;
  className?: string;
}

export function ProductSelector({
  selectedProduct,
  onSelectProduct,
  className = "",
}: ProductSelectorProps) {
  const { products, selectorLabel } = packagingExperienceContent;

  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-[780px] w-full items-stretch"
        role="group"
        aria-label={selectorLabel}
      >
        {/* Black Product Option — CÀ PHÊ PHA MÁY */}
        <button
          type="button"
          aria-pressed={selectedProduct === "black"}
          onClick={() => onSelectProduct("black")}
          className={`h-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-300 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer ${
            selectedProduct === "black"
              ? "border-foreground bg-[#F5EFE6]/90 shadow-sm"
              : "border-border/60 bg-transparent hover:bg-[#F7F2E9]/60 hover:border-foreground/40"
          }`}
        >
          <div className="w-16 h-12 sm:w-20 sm:h-[60px] rounded-lg bg-[#222120] overflow-hidden flex-shrink-0 border border-foreground/10">
            <Image
              src={products.black.thumbnail}
              alt=""
              width={160}
              height={120}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-[13px] font-sans font-bold uppercase tracking-tight text-foreground leading-tight">
              {products.black.title}
            </div>
            <div className="text-xs font-sans font-normal text-foreground-muted leading-snug mt-1">
              {products.black.subtitle}
            </div>
          </div>
        </button>

        {/* Sand Product Option — CÀ PHÊ PHA PHIN */}
        <button
          type="button"
          aria-pressed={selectedProduct === "sand"}
          onClick={() => onSelectProduct("sand")}
          className={`h-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-300 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer ${
            selectedProduct === "sand"
              ? "border-foreground bg-[#F5EFE6]/90 shadow-sm"
              : "border-border/60 bg-transparent hover:bg-[#F7F2E9]/60 hover:border-foreground/40"
          }`}
        >
          <div className="w-16 h-12 sm:w-20 sm:h-[60px] rounded-lg bg-[#EFE7DA] overflow-hidden flex-shrink-0 border border-foreground/10">
            <Image
              src={products.sand.thumbnail}
              alt=""
              width={160}
              height={120}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-[13px] font-sans font-bold uppercase tracking-tight text-foreground leading-tight">
              {products.sand.title}
            </div>
            <div className="text-xs font-sans font-normal text-foreground-muted leading-snug mt-1">
              {products.sand.subtitle}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
