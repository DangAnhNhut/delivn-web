"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type { VariantImageAsset } from "@/lib/storefront/product-presentation";

interface ProductMediaStageProps {
  asset: VariantImageAsset;
  href: string;
  ariaLabel: string;
  priority?: boolean;
  sizeBadge?: string | null;
}

const TRANSITION_MS = 320;
const RESPONSIVE_SIZES = "(min-width: 1280px) 640px, (min-width: 768px) 46vw, 94vw";
const loadedUrlCache = new Set<string>();

export function ProductMediaStage({
  asset,
  href,
  ariaLabel,
  priority = false,
  sizeBadge,
}: ProductMediaStageProps) {
  const [currentAsset, setCurrentAsset] = useState<VariantImageAsset>(asset);
  const [pendingAsset, setPendingAsset] = useState<VariantImageAsset | null>(
    null,
  );
  const [outgoingAsset, setOutgoingAsset] = useState<VariantImageAsset | null>(
    null,
  );
  const [isEntered, setIsEntered] = useState(true);

  const requestIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const currentAssetRef = useRef<VariantImageAsset>(asset);

  const commitSwap = (nextAsset: VariantImageAsset, reqId: number) => {
    if (reqId !== requestIdRef.current) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const previous = currentAssetRef.current;
    currentAssetRef.current = nextAsset;
    setPendingAsset(null);

    if (prefersReducedMotion) {
      setOutgoingAsset(null);
      setCurrentAsset(nextAsset);
      setIsEntered(true);
      return;
    }

    setOutgoingAsset(previous);
    setCurrentAsset(nextAsset);
    setIsEntered(false);

    rafRef.current = requestAnimationFrame(() => {
      if (reqId !== requestIdRef.current) return;
      setIsEntered(true);
    });

    timerRef.current = setTimeout(() => {
      if (reqId !== requestIdRef.current) return;
      setOutgoingAsset(null);
    }, TRANSITION_MS + 40);
  };

  useEffect(() => {
    if (asset.url === currentAssetRef.current.url) {
      setPendingAsset(null);
      return;
    }

    const reqId = ++requestIdRef.current;
    const isJsdom =
      typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent);

    if (loadedUrlCache.has(asset.url) || isJsdom) {
      commitSwap(asset, reqId);
    } else {
      // Load optimized Next.js Image in hidden layer; keep current image visible with zero raw PNG download
      setPendingAsset(asset);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [asset]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const renderLayerImage = (
    layerAsset: VariantImageAsset,
    isPriority: boolean,
    onLoadHandler?: () => void,
  ) => {
    const scale = layerAsset.presentationScale ?? 1;
    const fitClass =
      layerAsset.fitMode === "cover" ? "object-cover" : "object-contain";

    return (
      <Image
        src={layerAsset.url}
        alt={layerAsset.alt}
        fill
        sizes={RESPONSIVE_SIZES}
        priority={isPriority}
        onLoad={() => {
          loadedUrlCache.add(layerAsset.url);
          onLoadHandler?.();
        }}
        className={`${fitClass} transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none`}
        style={{
          objectPosition: layerAsset.objectPosition ?? "center center",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
        }}
      />
    );
  };

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      data-product-media-stage="true"
      className="relative block aspect-[5/4] w-full overflow-hidden border border-border/50 bg-[#F4EFE6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {/* Outgoing layer: exits softly upward with slight scale down */}
      {outgoingAsset && (
        <div
          aria-hidden="true"
          data-stage-layer="outgoing"
          className="pointer-events-none absolute inset-0 will-change-[transform,opacity] motion-reduce:hidden"
          style={{
            opacity: isEntered ? 0 : 1,
            transform: isEntered
              ? "scale(0.985) translateY(-5px)"
              : "scale(1) translateY(0)",
            transition:
              "opacity 300ms cubic-bezier(0.22, 1, 0.36, 1), transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {renderLayerImage(outgoingAsset, false)}
        </div>
      )}

      {/* Incoming / Active layer */}
      <div
        data-stage-layer="active"
        className="absolute inset-0 will-change-[transform,opacity] motion-reduce:!transform-none motion-reduce:!transition-none"
        style={{
          opacity: isEntered ? 1 : 0,
          transform: isEntered
            ? "perspective(900px) scale(1) translateY(0) rotateY(0deg)"
            : "perspective(900px) scale(0.975) translateY(8px) rotateY(-4deg)",
          transition:
            "opacity 320ms cubic-bezier(0.22, 1, 0.36, 1), transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {renderLayerImage(currentAsset, priority)}
      </div>

      {/* Hidden Next.js Image pre-decoder for pending variant switch (uses optimized AVIF/WebP, never raw 2.66MB PNG) */}
      {pendingAsset && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0"
        >
          <Image
            src={pendingAsset.url}
            alt=""
            fill
            sizes={RESPONSIVE_SIZES}
            onLoad={() => {
              loadedUrlCache.add(pendingAsset.url);
              commitSwap(pendingAsset, requestIdRef.current);
            }}
            className={
              pendingAsset.fitMode === "cover"
                ? "object-cover"
                : "object-contain"
            }
          />
        </div>
      )}

      {sizeBadge && (
        <span className="pointer-events-none absolute top-3 left-3 z-10 border border-border/60 bg-background/90 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.16em] text-foreground uppercase backdrop-blur-sm">
          {sizeBadge}
        </span>
      )}
    </Link>
  );
}
