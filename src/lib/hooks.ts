"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** Subscribes to a media query without effects; false on the server. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Reads a sessionStorage entry on the client; undefined during server render. */
export function useSessionItem(key: string) {
  return useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => undefined,
  );
}

/**
 * Hardware-accelerated WebGL only. Visitors whose browser would render WebGL in software (no GPU,
 * blocklisted driver, headless) keep the poster, which shows the same watch, instead of a scene
 * that would stutter and pin the CPU.
 */
function hasHardwareWebGL() {
  try {
    const c = document.createElement("canvas");
    const opts: WebGLContextAttributes = { failIfMajorPerformanceCaveat: true };
    const gl = c.getContext("webgl2", opts) ?? c.getContext("webgl", opts);
    if (!gl) return false;
    // Firefox reports the real renderer directly; Chromium and WebKit mask it behind the debug extension
    let renderer = String(gl.getParameter(gl.RENDERER));
    if (/webkit webgl/i.test(renderer)) {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      if (info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render|\bwarp\b/i.test(renderer);
  } catch {
    return false;
  }
}

/**
 * True once the page has fully loaded (posters included) and the main thread is idle, on devices
 * with hardware WebGL. Heavy 3D mounts behind this so it never competes with the first paint.
 */
export function useLive3d() {
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!hasHardwareWebGL()) return;
    const start = () => setLive(true);
    let idle = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(start, { timeout: 2000 });
      else timer = setTimeout(start, 700);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (idle) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, []);
  return live;
}
