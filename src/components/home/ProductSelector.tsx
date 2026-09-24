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
    <div className={`flex flex-col ${className}`}>
      <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.14em] text-foreground-muted/75 mb-3 select-none">
        {selectorLabel}
      </span>
      <div
        className="grid grid-cols-2 gap-3 max-w-md w-full"
        role="group"
        aria-label={selectorLabel}
      >
        {/* Sand Product Option */}
        <button
          type="button"
          aria-pressed={selectedProduct === "sand"}
          onClick={() => onSelectProduct("sand")}
          className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-300 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            selectedProduct === "sand"
              ? "border-foreground bg-[#F5EFE6]/90 shadow-sm"
              : "border-border/60 bg-transparent hover:bg-[#F7F2E9]/60 hover:border-foreground/40"
          }`}
        >
          <div className="w-11 h-13 rounded-lg bg-[#EFE7DA] overflow-hidden flex-shrink-0 flex items-center justify-center p-1 border border-foreground/10 group-hover:scale-105 transition-transform duration-300">
            <Image
              src={products.sand.thumbnail}
              alt=""
              width={80}
              height={100}
              className="h-full w-auto object-contain drop-shadow-sm"
            />
          </div>
          <div className="min-w-0 pr-1">
            <div className="text-xs font-sans font-bold uppercase tracking-tight text-foreground leading-tight">
              {products.sand.title}
            </div>
            <div className="text-[11px] font-sans font-normal text-foreground-muted/80 leading-snug mt-0.5 truncate">
              {products.sand.subtitle}
            </div>
          </div>
        </button>

        {/* Black Product Option */}
        <button
          type="button"
          aria-pressed={selectedProduct === "black"}
          onClick={() => onSelectProduct("black")}
          className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-300 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            selectedProduct === "black"
              ? "border-foreground bg-[#F5EFE6]/90 shadow-sm"
              : "border-border/60 bg-transparent hover:bg-[#F7F2E9]/60 hover:border-foreground/40"
          }`}
        >
          <div className="w-11 h-13 rounded-lg bg-[#222120] overflow-hidden flex-shrink-0 flex items-center justify-center p-1 border border-foreground/10 group-hover:scale-105 transition-transform duration-300">
            <Image
              src={products.black.thumbnail}
              alt=""
              width={80}
              height={100}
              className="h-full w-auto object-contain drop-shadow-sm"
            />
          </div>
          <div className="min-w-0 pr-1">
            <div className="text-xs font-sans font-bold uppercase tracking-tight text-foreground leading-tight">
              {products.black.title}
            </div>
            <div className="text-[11px] font-sans font-normal text-foreground-muted/80 leading-snug mt-0.5 truncate">
              {products.black.subtitle}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
