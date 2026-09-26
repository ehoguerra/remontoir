"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getProduct, strapById } from "@/data/products";
import { Studio } from "@/three/Studio";
import { Watch } from "@/three/Watch";
import { StrapOnly } from "@/three/StrapOnly";
import { PHOTO_TIME } from "@/three/time";
import { VIEW_ROTATION } from "@/three/views";

declare global {
  interface Window {
    __RENDER_READY__?: boolean;
  }
}

function ReadyFlag() {
  const frames = useRef(0);
  const fonts = useRef(false);
  useEffect(() => {
    document.fonts?.ready.then(() => {
      fonts.current = true;
    });
  }, []);
  useFrame(() => {
    frames.current += 1;
    if (fonts.current && frames.current > 45) window.__RENDER_READY__ = true;
  });
  return null;
}

export type RenderView = "front" | "back" | "night" | "hero";

/** Renders one product alone, framed, on a transparent background, for the image pipeline. */
export default function RenderStage({ slug, view }: { slug: string; view: RenderView }) {
  const product = getProduct(slug);
  if (!product) return <p>Produto não encontrado: {slug}</p>;
  const night = view === "night";

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Canvas
        dpr={1}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        camera={{ fov: 22, position: [0, 0, 10.2], near: 0.1, far: 100 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Studio night={night} />
        {product.kind === "watch" ? (
          <group
            rotation={view === "back" ? VIEW_ROTATION.back : view === "hero" ? VIEW_ROTATION.hero : VIEW_ROTATION.front}
            position={[0, view === "hero" ? 0 : 0.15, 0]}
          >
            <Watch
              model={product.model}
              strap={strapById(product.model.strapId)}
              clock={PHOTO_TIME}
              moon={0.47}
              night={night}
              movementActive={false}
            />
          </group>
        ) : (
          <group rotation={VIEW_ROTATION.strap}>
            <StrapOnly strap={product.strap} />
          </group>
        )}
        <ReadyFlag />
      </Canvas>
    </div>
  );
}
