"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface ProductModelProps {
  modelPath: string;
  targetRotationY: number;
  isUserInteractingRef: React.RefObject<boolean>;
  manualRotationRef: React.RefObject<number>;
}

export function ProductModel({
  modelPath,
  targetRotationY,
  isUserInteractingRef,
  manualRotationRef,
}: ProductModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Load GLTF model
  const { scene } = useGLTF(modelPath);

  // Clone scene so material and instance remain pristine
  const clonedScene = scene.clone();

  // B4 specification:
  // Mesh bounds: X -0.075 to +0.075, Y 0 to +0.265, Z -0.0425 to +0.0425.
  // Center is Y = 0.1325.
  // The GLB material has: metallic = 0, roughness = 0.62, coat = 0.
  // DO NOT mutate material properties (preserve authoring values).
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
  }, [clonedScene]);

  // Smooth interpolation in animation loop
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isUserInteractingRef.current) {
      // While dragging, follow manual rotation with high responsiveness
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        manualRotationRef.current ?? targetRotationY,
        14,
        delta
      );
    } else {
      // Reconcile smoothly toward target story state angle
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetRotationY,
        4.5,
        delta
      );
      // Keep manual ref in sync with current resting rotation
      if (manualRotationRef.current !== undefined) {
        manualRotationRef.current = groupRef.current.rotation.y;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}
