"use client";

import { Html } from "@react-three/drei";

/**
 * Standard HTML loader for outside <Canvas> (e.g. Next.js dynamic import loading fallback)
 */
export function ModelLoader() {
  return (
    <div className="w-full h-full min-h-[440px] flex flex-col items-center justify-center select-none" aria-live="polite">
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Subtle pulsing ring in DELIVN sand tone */}
        <div className="absolute inset-0 rounded-full border border-sand/40 animate-ping opacity-35" />
        <div className="w-8 h-8 rounded-full border border-[#9A7B56]/50 border-t-[#EF4E3E] animate-spin" />
      </div>
      <span className="mt-4 text-[11px] font-mono tracking-[0.22em] uppercase text-foreground-muted/60">
        Đang tải mô hình...
      </span>
    </div>
  );
}

/**
 * Drei <Html> wrapped loader for inside R3F <Canvas> Suspense fallback
 */
export function CanvasModelLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center select-none whitespace-nowrap pointer-events-none" aria-live="polite">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[#9A7B56]/30 animate-ping opacity-30" />
          <div className="w-7 h-7 rounded-full border-2 border-[#9A7B56]/40 border-t-[#EF4E3E] animate-spin" />
        </div>
        <span className="mt-3 text-[10px] font-mono tracking-[0.2em] uppercase text-stone-600/70">
          Đang tải 3D...
        </span>
      </div>
    </Html>
  );
}
