"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Product } from "@/data/types";
import { strapById } from "@/data/products";
import { Studio } from "@/three/Studio";
import { CompileGate, useTexturesWarm } from "@/three/Warmup";
import { Watch } from "@/three/Watch";
import { StrapOnly } from "@/three/StrapOnly";
import { VIEW_ROTATION } from "@/three/views";

export type ViewerView = "front" | "back" | "night";

export interface ProductCanvasProps {
  product: Product;
  strapId?: string;
  engraving?: string;
  view: ViewerView;
  onReady: () => void;
}

function Turntable({ view, strap, children }: { view: ViewerView; strap: boolean; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!g.current) return;
    const target = strap ? VIEW_ROTATION.strap : view === "back" ? VIEW_ROTATION.back : VIEW_ROTATION.front;
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, target.x, 5, delta);
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, target.y, 5, delta);
    g.current.rotation.z = THREE.MathUtils.damp(g.current.rotation.z, target.z, 5, delta);
  });
  const initial = strap ? VIEW_ROTATION.strap : view === "back" ? VIEW_ROTATION.back : VIEW_ROTATION.front;
  return (
    <group ref={g} rotation={[initial.x, initial.y, initial.z]}>
      {children}
    </group>
  );
}

function Controls({ view }: { view: ViewerView }) {
  const ref = useRef<OrbitControlsImpl>(null);
  useEffect(() => {
    ref.current?.reset();
  }, [view]);
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.7}
      minPolarAngle={Math.PI * 0.2}
      maxPolarAngle={Math.PI * 0.8}
    />
  );
}

function PauseOffscreen() {
  const { gl, setFrameloop } = useThree();
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setFrameloop(e.isIntersecting ? "always" : "never"));
    io.observe(gl.domElement);
    return () => io.disconnect();
  }, [gl, setFrameloop]);
  return null;
}

export default function ProductCanvas({ product, strapId, engraving, view, onReady }: ProductCanvasProps) {
  const [maxDpr] = useState(() => (window.matchMedia("(max-width: 767px)").matches ? 1.5 : 1.75));
  const [dpr, setDpr] = useState(maxDpr);
  const warm = useTexturesWarm();
  const night = view === "night";
  return (
    <Canvas
      dpr={[1, dpr]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 22, position: [0, 0, 10.2], near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
      }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(maxDpr)} />
      <Studio night={night} />
      {warm && (
        <CompileGate onReady={onReady}>
          <Turntable view={view} strap={product.kind === "strap"}>
            {product.kind === "watch" ? (
              <group position-y={0.15}>
                <Watch
                  model={product.model}
                  strap={strapById(strapId ?? product.model.strapId)}
                  clock="live"
                  intro
                  night={night}
                  engraving={engraving}
                />
              </group>
            ) : (
              <StrapOnly strap={product.strap} />
            )}
          </Turntable>
        </CompileGate>
      )}
      <Controls view={view} />
      <PauseOffscreen />
    </Canvas>
  );
}
