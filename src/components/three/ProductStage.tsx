"use client";

import { Suspense, useState, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import Image from "next/image";
import { ProductModel } from "./ProductModel";
import { CanvasModelLoader } from "./ModelLoader";

interface ProductStageProps {
  modelPath: string;
  fallbackImage: string;
  altText: string;
  targetRotationY: number;
  onManualInteractionStart?: () => void;
  className?: string;
}

export function ProductStage({
  modelPath,
  fallbackImage,
  altText,
  targetRotationY,
  onManualInteractionStart,
  className = "",
}: ProductStageProps) {
  const [hasWebGLError, setHasWebGLError] = useState(false);

  const isDraggingRef = useRef(false);
  const manualRotationRef = useRef(targetRotationY);
  const dragStartXRef = useRef(0);
  const startRotationRef = useRef(targetRotationY);
  const releaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pointer drag handling for 360-degree rotation
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only primary mouse button or touch
      if (e.button !== 0 && e.pointerType === "mouse") return;

      // Prevent browser default text/element drag-selection
      e.preventDefault();
      if (typeof window !== "undefined") {
        window.getSelection()?.removeAllRanges();
      }

      if (releaseTimeoutRef.current) {
        clearTimeout(releaseTimeoutRef.current);
        releaseTimeoutRef.current = null;
      }

      isDraggingRef.current = true;
      dragStartXRef.current = e.clientX;
      startRotationRef.current = manualRotationRef.current;

      // Capture pointer
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

      onManualInteractionStart?.();
    },
    [onManualInteractionStart]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();

    const deltaX = e.clientX - dragStartXRef.current;
    // Sensitivity: drag width of ~400px corresponds to approx Math.PI radians
    const sensitivity = 0.0075;
    manualRotationRef.current = startRotationRef.current + deltaX * sensitivity;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    // Keep user's angle momentarily (1200ms grace period before scroll resumes ownership)
    releaseTimeoutRef.current = setTimeout(() => {
      isDraggingRef.current = false;
    }, 1200);
  }, []);

  const handlePointerCancel = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // WebGL Fallback if canvas crashes or WebGL is disabled
  if (hasWebGLError) {
    return (
      <div className={`relative flex items-center justify-center select-none ${className}`}>
        <Image
          src={fallbackImage}
          alt={altText}
          width={440}
          height={560}
          priority
          className="max-h-[480px] w-auto object-contain drop-shadow-2xl"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center select-none [&_*::selection]:bg-transparent cursor-grab active:cursor-grabbing touch-none ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      role="region"
      aria-label={`${altText}. Kéo để xoay 360 độ.`}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {/* Soft warm ambient radial glow halo */}
      <div
        className="absolute w-[440px] h-[440px] lg:w-[520px] lg:h-[520px] bg-[radial-gradient(circle,rgba(235,226,211,0.72)_0%,rgba(242,234,224,0.35)_46%,rgba(250,246,241,0)_72%)] rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* 3D Canvas Stage */}
      <div className="w-full h-full min-h-[440px] lg:min-h-[520px] relative z-10 select-none outline-hidden focus:outline-hidden [&_*::selection]:bg-transparent">
        <Canvas
          dpr={[1, 1.5]}
          camera={{
            position: [0.32, 0.22, 0.42],
            fov: 35,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          style={{
            background: "transparent",
            outline: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          onCreated={({ gl, camera }) => {
            // Point camera lookAt directly to center of pouch: [0, 0.1325, 0]
            camera.lookAt(0, 0.1325, 0);
            camera.updateProjectionMatrix();

            // WebGL context loss listener
            gl.domElement.addEventListener("webglcontextlost", () => {
              setHasWebGLError(true);
            });
          }}
        >
          {/* Conservative, warm neutral lighting to preserve B4 material parity */}
          <ambientLight intensity={0.9} color="#FCF9F4" />
          <directionalLight
            position={[1.5, 2.5, 2.0]}
            intensity={1.15}
            color="#FFF8EE"
            castShadow={false}
          />
          <directionalLight
            position={[-1.5, 1.5, -1.5]}
            intensity={0.35}
            color="#E8DFD0"
          />
          <hemisphereLight
            groundColor="#F0E8DC"
            color="#FFFDF9"
            intensity={0.45}
          />

          <Suspense fallback={<CanvasModelLoader />}>
            <ProductModel
              modelPath={modelPath}
              targetRotationY={targetRotationY}
              isUserInteractingRef={isDraggingRef}
              manualRotationRef={manualRotationRef}
            />
            {/* Ground contact shadow under pouch */}
            <ContactShadows
              position={[0, -0.001, 0]}
              opacity={0.28}
              scale={0.65}
              blur={2.2}
              far={0.5}
              color="#2A241E"
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
