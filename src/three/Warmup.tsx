"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { texturesWarm, warmTextures } from "./textures";

/** True once the procedural textures exist, so the watch can mount without building them inline. */
export function useTexturesWarm() {
  const [warm, setWarm] = useState(texturesWarm);
  useEffect(() => {
    if (warm) return;
    let alive = true;
    warmTextures().then(() => alive && setWarm(true));
    return () => {
      alive = false;
    };
  }, [warm]);
  return warm;
}

const Revealed = createContext(true);

/** Whether the surrounding CompileGate has shown its contents yet (always true outside a gate). */
export function useRevealed() {
  return useContext(Revealed);
}

/**
 * Keeps its children hidden until every shader the scene needs has been compiled in parallel
 * (KHR_parallel_shader_compile), so the first visible frame does not stall the main thread.
 * Compiling covers hidden objects too. `onReady` fires a few frames after the reveal.
 */
export function CompileGate({ children, onReady }: { children: ReactNode; onReady?: () => void }) {
  const { gl, scene, camera } = useThree();
  const [compiled, setCompiled] = useState(false);
  const frames = useRef(0);
  const announced = useRef(false);

  useEffect(() => {
    let alive = true;
    const done = () => alive && setCompiled(true);
    gl.compileAsync(scene, camera).then(done, done);
    return () => {
      alive = false;
    };
  }, [gl, scene, camera]);

  useFrame(() => {
    if (!compiled || announced.current) return;
    frames.current += 1;
    if (frames.current > 3) {
      announced.current = true;
      onReady?.();
    }
  });

  return (
    <Revealed.Provider value={compiled}>
      <group visible={compiled}>{children}</group>
    </Revealed.Provider>
  );
}
