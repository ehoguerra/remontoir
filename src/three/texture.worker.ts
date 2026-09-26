/// <reference lib="webworker" />
import { generate, type TexJob } from "./texgen";

// Generates procedural textures off the main thread; the pixel buffer is transferred, not copied.
self.onmessage = (e: MessageEvent<{ id: number; job: TexJob }>) => {
  const out = generate(e.data.job);
  (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id: e.data.id, ...out }, [out.data.buffer]);
};
