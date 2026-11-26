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
const decodedUrlCache = new Set<string>();

function preloadAndDecode(url: string): Promise<void> {
  if (typeof window === "undefined" || decodedUrlCache.has(url)) {
    return Promise.resolve();
  }

  const img = new window.Image();
  if (typeof img.decode !== "function") {
    decodedUrlCache.add(url);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    img.src = url;
    img
      .decode()
      .then(() => {
        decodedUrlCache.add(url);
        resolve();
      })
      .catch(() => resolve());
  });
}

export function ProductMediaStage({
  asset,
  href,
  ariaLabel,
  priority = false,
  sizeBadge,
}: ProductMediaStageProps) {
  const [currentAsset, setCurrentAsset] = useState<VariantImageAsset>(asset);
  const [outgoingAsset, setOutgoingAsset] = useState<VariantImageAsset | null>(
    null,
  );
  const [isEntered, setIsEntered] = useState(true);

  const requestIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const currentUrlRef = useRef(asset.url);

  useEffect(() => {
    if (asset.url === currentUrlRef.current) {
      return;
    }

    const reqId = ++requestIdRef.current;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const commitSwap = () => {
      if (reqId !== requestIdRef.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      const previous: VariantImageAsset = {
        url: currentUrlRef.current,
        alt: currentAsset.alt,
        objectPosition: currentAsset.objectPosition,
        presentationScale: currentAsset.presentationScale,
        fitMode: currentAsset.fitMode,
      };
      currentUrlRef.current = asset.url;

      if (prefersReducedMotion) {
        setOutgoingAsset(null);
        setCurrentAsset(asset);
        setIsEntered(true);
        return;
      }

      setOutgoingAsset(previous);
      setCurrentAsset(asset);
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

    if (decodedUrlCache.has(asset.url) || prefersReducedMotion) {
      commitSwap();
    } else {
      void preloadAndDecode(asset.url).then(commitSwap);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- currentAsset is read synchronously on swap
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
  ) => {
    const scale = layerAsset.presentationScale ?? 1;
    const fitClass =
      layerAsset.fitMode === "cover" ? "object-cover" : "object-contain";

    return (
      <Image
        src={layerAsset.url}
        alt={layerAsset.alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        priority={isPriority}
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

      {/* Incoming / Active layer: enters with subtle depth and opacity */}
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

      {sizeBadge && (
        <span className="pointer-events-none absolute top-3 left-3 z-10 border border-border/60 bg-background/90 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.16em] text-foreground uppercase backdrop-blur-sm">
          {sizeBadge}
        </span>
      )}
    </Link>
  );
}
