"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * A photographic studio made of light panels (no HDR download): a large softbox above, long
 * strip lights either side for the crisp reflections on polished steel, and a dim back panel so
 * the caseback reads when the watch turns over.
 */
export function Studio({ night = false }: { night?: boolean }) {
  const k = night ? 0.1 : 1;
  return (
    <>
      <ambientLight intensity={0.28 * k} />
      <directionalLight position={[2.5, 4, 6]} intensity={1.9 * k} />
      <directionalLight position={[-5, -1, 2]} intensity={0.5 * k} color="#d8e0ff" />
      <directionalLight position={[0, 1, -6]} intensity={0.9 * k} />
      <Environment resolution={256} frames={1} environmentIntensity={k}>
        <color attach="background" args={["#454b57"]} />
        <Lightformer form="rect" intensity={2.6} position={[0, 7, 3]} scale={[12, 5, 1]} />
        <Lightformer form="rect" intensity={3} position={[-7, 1.5, 2]} scale={[1.1, 14, 1]} />
        <Lightformer form="rect" intensity={2.2} position={[7, 0, 2.5]} scale={[1.6, 14, 1]} />
        <Lightformer form="rect" intensity={1.3} position={[0, -6, 3]} scale={[14, 4, 1]} color="#e6ebff" />
        <Lightformer form="rect" intensity={0.8} position={[0, 0, 9]} scale={[16, 5, 1]} color="#dfe6f3" />
        <Lightformer form="ring" intensity={2.4} position={[3.5, 2.5, 8]} scale={2.2} />
        <Lightformer form="rect" intensity={1.4} position={[0, 2, -8]} scale={[10, 6, 1]} />
        <Lightformer form="rect" intensity={1.8} position={[-5, -3, -6]} scale={[1.2, 10, 1]} />
      </Environment>
    </>
  );
}
