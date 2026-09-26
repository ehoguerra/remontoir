"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { heroWatch, strapById } from "@/data/products";
import { Studio } from "@/three/Studio";
import { CompileGate, useTexturesWarm } from "@/three/Warmup";
import { Watch } from "@/three/Watch";
import { dialLayout } from "@/three/layout";
import { VIEW_ROTATION } from "@/three/views";
import { moonIllumination, moonName, moonPhase } from "@/three/time";

export interface HeroCanvasProps {
  /** scroll progress through the hero section, 0..1 */
  progress: RefObject<number>;
  reducedMotion: boolean;
  onReady: () => void;
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Places, turns and gently animates the watch according to scroll, pointer and viewport. */
function Rig({
  progress,
  reducedMotion,
  children,
}: {
  progress: RefObject<number>;
  reducedMotion: boolean;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const { viewport, size } = useThree();

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const p = progress.current ?? 0;
    const flip = smoothstep(0.3, 0.62, p);
    const wide = size.width >= 768;
    const aspect = viewport.width / viewport.height;
    // on phones the calibre text is taller, so the turned-over watch rises and shrinks a little
    const scale = wide ? 1 : Math.min(1, 1.6 * aspect) * (1 - 0.2 * flip);
    const t = state.clock.elapsedTime;
    const float = reducedMotion ? 0 : Math.sin(t * 0.9) * 0.035;

    const front = VIEW_ROTATION.hero;
    const back = VIEW_ROTATION.heroBack;
    const rx = THREE.MathUtils.lerp(front.x, back.x, flip) + pointer.current.y * 0.06;
    const ry = THREE.MathUtils.lerp(front.y, back.y, flip) + pointer.current.x * 0.12;
    const rz = THREE.MathUtils.lerp(front.z, back.z, flip) + (reducedMotion ? 0 : Math.sin(t * 0.6) * 0.012);

    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, rx, 6, delta);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ry, 6, delta);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, rz, 6, delta);

    const x = wide ? viewport.width * 0.2 : 0;
    const y = wide ? -0.05 : viewport.height * (0.16 + 0.07 * flip);
    g.position.x = THREE.MathUtils.damp(g.position.x, x, 5, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, y + float, 5, delta);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, scale, 5, delta));

    // callouts follow the side of the watch facing the visitor
    state.scene.userData.flip = flip;
  });

  return <group ref={group}>{children}</group>;
}

interface CalloutDef {
  id: string;
  position: [number, number, number];
  side: "left" | "right";
  show: "front" | "back";
  text: string;
}

/** Projects 3D anchor points to screen space each frame and moves plain DOM labels there. */
function Projector({
  defs,
  anchors,
  labels,
}: {
  defs: CalloutDef[];
  anchors: RefObject<Map<string, THREE.Object3D>>;
  labels: RefObject<Map<string, HTMLElement>>;
}) {
  const v = useRef(new THREE.Vector3());
  useFrame(({ camera, size, scene }) => {
    const flip = (scene.userData.flip as number) ?? 0;
    for (const d of defs) {
      const a = anchors.current.get(d.id);
      const el = labels.current.get(d.id);
      if (!a || !el) continue;
      a.getWorldPosition(v.current).project(camera);
      const x = (v.current.x * 0.5 + 0.5) * size.width;
      const y = (-v.current.y * 0.5 + 0.5) * size.height;
      const o = d.show === "front" ? 1 - smoothstep(0.02, 0.2, flip) : smoothstep(0.82, 0.98, flip);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o < 0.01 ? "hidden" : "visible";
    }
  });
  return null;
}

function PauseOffscreen() {
  const { gl, setFrameloop } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const io = new IntersectionObserver(([entry]) => setFrameloop(entry.isIntersecting ? "always" : "never"), {
      rootMargin: "100px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [gl, setFrameloop]);
  return null;
}

export default function HeroCanvas({ progress, reducedMotion, onReady }: HeroCanvasProps) {
  // phones get a lighter render target; PerformanceMonitor steps down further if frames drop
  const [maxDpr] = useState(() => (window.matchMedia("(max-width: 767px)").matches ? 1.5 : 1.75));
  const [dpr, setDpr] = useState(maxDpr);
  const warm = useTexturesWarm();
  const model = heroWatch.model;
  const L = dialLayout(model);
  const [phase] = useState(() => moonPhase(new Date()));
  const anchors = useRef(new Map<string, THREE.Object3D>());
  const labels = useRef(new Map<string, HTMLElement>());

  const defs: CalloutDef[] = [
    {
      id: "moon",
      position: [-L.Rd * 0.3, L.aperture ? L.aperture.y + 1.4 : 0, L.zDial + 0.2],
      side: "left",
      show: "front",
      text: `A lua de hoje: ${moonName(phase)}, ${Math.round(moonIllumination(phase) * 100)}% iluminada`,
    },
    {
      id: "time",
      position: [L.Rd * 0.2, L.Rd * 0.62, L.zDial + 1.2],
      side: "right",
      show: "front",
      text: "A sua hora, em oito batidas por segundo",
    },
    {
      id: "crystal",
      position: [-(L.R - 2.2), L.R * 0.42, L.T + 0.2],
      side: "left",
      show: "front",
      text: "Safira abaulada com antirreflexo",
    },
    {
      id: "balance",
      position: [5.8, -4.2, L.zDial - 1.95],
      side: "left",
      show: "back",
      text: "Balanço a 4 Hz",
    },
    {
      id: "jewels",
      position: [-4.4, -3.2, L.zDial - 2.35],
      side: "right",
      show: "back",
      text: "Rubis em chatons de ouro",
    },
    {
      id: "cotes",
      position: [-8.6, 1.5, L.zDial - 2.2],
      side: "right",
      show: "back",
      text: "Côtes de Genève riscadas à mão",
    },
  ];

  return (
    <>
      <Canvas
        dpr={[1, dpr]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ fov: 26, position: [0, 0, 11.7], near: 0.1, far: 60 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
        }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(maxDpr)} />
        <Studio />
        {warm && (
          <CompileGate onReady={onReady}>
            <Rig progress={progress} reducedMotion={reducedMotion}>
              <Watch model={model} strap={strapById(model.strapId)} clock="live" intro={!reducedMotion}>
                {defs.map((d) => (
                  <group
                    key={d.id}
                    position={d.position}
                    ref={(g) => {
                      if (g) anchors.current.set(d.id, g);
                      else anchors.current.delete(d.id);
                    }}
                  />
                ))}
              </Watch>
            </Rig>
          </CompileGate>
        )}
        <Projector defs={defs} anchors={anchors} labels={labels} />
        <PauseOffscreen />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block" aria-hidden>
        {defs.map((d) => (
          <div
            key={d.id}
            className="callout absolute top-0 left-0"
            data-side={d.side}
            style={{ opacity: 0, visibility: "hidden" }}
            ref={(el) => {
              if (el) labels.current.set(d.id, el);
              else labels.current.delete(d.id);
            }}
          >
            <span className="callout-dot" />
            <span className="callout-line" />
            <span className="callout-label">{d.text}</span>
          </div>
        ))}
      </div>
    </>
  );
}
