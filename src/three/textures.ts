import * as THREE from "three";
import { generate, jobKey, type GuillochePattern, type LeatherKind, type TexData, type TexJob } from "./texgen";

/**
 * Procedural textures for the watch. Everything is generated at runtime (surface relief in a
 * worker, printed and painted maps on a canvas), so the site ships no image textures for the 3D.
 * Results are cached by key: switching views or straps never regenerates a texture.
 */

const cache = new Map<string, THREE.Texture>();

function memo<T extends THREE.Texture>(key: string, make: () => T): T {
  const hit = cache.get(key);
  if (hit) return hit as T;
  const tex = make();
  cache.set(key, tex);
  return tex;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: false })!;
  return { c, ctx };
}

function dataTexture(c: HTMLCanvasElement, opts: { repeat?: [number, number]; color?: boolean } = {}) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = opts.color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = tex.wrapT = opts.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  if (opts.repeat) tex.repeat.set(opts.repeat[0], opts.repeat[1]);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Wraps generated pixels in a DataTexture that samples like the canvas textures around it. */
function toDataTexture({ data, width, height }: TexData, opts: TexOptions) {
  const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.colorSpace = THREE.NoColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.wrapS = tex.wrapT = opts.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  if (opts.repeat) tex.repeat.set(opts.repeat[0], opts.repeat[1]);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

type TexOptions = { repeat?: [number, number] };

function optionsFor(job: TexJob): TexOptions {
  switch (job.kind) {
    case "grain":
      return { repeat: [6, 6] };
    case "perlage":
    case "cotes":
      return { repeat: [1, 1] };
    default:
      return {};
  }
}

/** Returns the texture for a job, from the cache (usually filled by the worker) or built right here. */
function procedural(job: TexJob) {
  return memo(jobKey(job), () => toDataTexture(generate(job), optionsFor(job)));
}

/** Radial direction field for MeshPhysicalMaterial.anisotropyMap: a sunray dial. */
export function sunburstAnisotropy(size = 512) {
  return procedural({ kind: "sunburst-aniso", size });
}

/** Fine radial grooves: height varies only with the angle. */
export function sunburstNormal(size = 1024) {
  return procedural({ kind: "sunburst-normal", size });
}

export function guillocheNormal(pattern: GuillochePattern, size = 1024) {
  return procedural({ kind: "guilloche", pattern, size });
}

/** Sandblasted / granular finish, tileable. */
export function grainNormal(size = 256, seed = 3, strength = 2.4) {
  return procedural({ kind: "grain", size, seed, strength });
}

/** Overlapping circular grains, as stamped on the main plate. Tileable. */
export function perlageNormal(size = 512) {
  return procedural({ kind: "perlage", size });
}

/** Côtes de Genève: parallel waves with a fine brushed grain along each stripe. Tileable. */
export function cotesNormal(size = 512) {
  return procedural({ kind: "cotes", size });
}

/** Leather surfaces, tileable. UV u runs along the strap, v across it. */
export function leatherNormal(kind: LeatherKind, size = 512) {
  return procedural({ kind: "leather", leather: kind, size });
}

/** Every procedural texture the watches and straps use, at the sizes the materials ask for. */
const PROCEDURAL_JOBS: TexJob[] = [
  { kind: "sunburst-aniso", size: 512 },
  { kind: "sunburst-normal", size: 1024 },
  { kind: "guilloche", pattern: "grain-orge", size: 1024 },
  { kind: "guilloche", pattern: "azurage", size: 512 },
  { kind: "grain", size: 256, seed: 5, strength: 1.6 },
  { kind: "grain", size: 256, seed: 9, strength: 0.8 },
  { kind: "perlage", size: 512 },
  { kind: "cotes", size: 512 },
  { kind: "leather", leather: "calf", size: 512 },
  { kind: "leather", leather: "alligator", size: 512 },
  { kind: "leather", leather: "suede", size: 512 },
  { kind: "leather", leather: "rubber", size: 512 },
];

let warming: Promise<void> | null = null;

export function texturesWarm() {
  return PROCEDURAL_JOBS.every((job) => cache.has(jobKey(job)));
}

/**
 * Builds every procedural texture in a small pool of workers so the main thread stays free while
 * the page is still settling. If workers are unavailable the textures are built on first use.
 */
export function warmTextures(): Promise<void> {
  if (warming) return warming;
  const jobs = PROCEDURAL_JOBS.filter((job) => !cache.has(jobKey(job)));
  if (jobs.length === 0 || typeof Worker === "undefined") return (warming = Promise.resolve());
  warming = new Promise<void>((resolve) => {
    const threads = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1, jobs.length));
    const workers: Worker[] = [];
    let next = 0;
    let pending = jobs.length;
    const finish = () => {
      workers.forEach((w) => w.terminate());
      resolve();
    };
    const feed = (w: Worker) => {
      if (next < jobs.length) {
        const id = next++;
        w.postMessage({ id, job: jobs[id] });
      }
    };
    try {
      for (let t = 0; t < threads; t++) {
        const w = new Worker(new URL("./texture.worker.ts", import.meta.url), { type: "module" });
        w.onmessage = (e: MessageEvent<TexData & { id: number }>) => {
          const job = jobs[e.data.id];
          const key = jobKey(job);
          if (!cache.has(key)) cache.set(key, toDataTexture(e.data, optionsFor(job)));
          pending -= 1;
          if (pending === 0) finish();
          else feed(w);
        };
        // a failing worker is not fatal: whatever is missing gets built on first use
        w.onerror = finish;
        workers.push(w);
        feed(w);
      }
    } catch {
      finish();
    }
  });
  return warming;
}

/**
 * Colour map for one strap piece: base colour with subtle tonal variation, edge stitching and
 * (on the tail piece) adjustment holes. `lengthMm` keeps stitch spacing physically consistent.
 */
export function strapColorMap(opts: {
  color: string;
  stitch: string;
  lengthMm: number;
  widthMm: number;
  holes: boolean;
  stitched: boolean;
  key: string;
}) {
  return memo(`strap-color-${opts.key}`, () => {
    const ppm = 12;
    const w = Math.round(opts.lengthMm * ppm);
    const h = Math.round(opts.widthMm * ppm);
    const { c, ctx } = canvas(w, h);
    ctx.fillStyle = opts.color;
    ctx.fillRect(0, 0, w, h);
    // gentle tonal variation along the length
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "rgba(255,255,255,0.05)");
    grad.addColorStop(0.5, "rgba(0,0,0,0.04)");
    grad.addColorStop(1, "rgba(255,255,255,0.03)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    if (opts.stitched) {
      ctx.strokeStyle = opts.stitch;
      ctx.lineWidth = 0.55 * ppm;
      ctx.lineCap = "round";
      const inset = 1.6 * ppm;
      const pitch = 2.3 * ppm;
      for (const y of [inset, h - inset]) {
        for (let x = 1.5 * ppm; x < w - 2 * ppm; x += pitch) {
          ctx.beginPath();
          ctx.moveTo(x, y - 0.25 * ppm);
          ctx.lineTo(x + pitch * 0.62, y + 0.25 * ppm);
          ctx.stroke();
        }
      }
    }
    if (opts.holes) {
      ctx.fillStyle = "rgba(6,6,8,0.92)";
      for (let i = 0; i < 6; i++) {
        const x = w - (18 + i * 7) * ppm;
        if (x < 10 * ppm) break;
        ctx.beginPath();
        ctx.ellipse(x, h / 2, 1.1 * ppm, 1.0 * ppm, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return dataTexture(c, { color: true });
  });
}

/** Deep blue aventurine with sparkles and a scatter of gold stars, for the moon disc. */
export function aventurineMap(size = 1024) {
  return memo(`aventurine-${size}`, () => {
    const rand = rng(29);
    const { c, ctx } = canvas(size);
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "#1c2d78");
    g.addColorStop(1, "#0d1540");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 2600; i++) {
      const a = rand() * 0.55 + 0.1;
      ctx.fillStyle = `rgba(200,215,255,${a})`;
      const s = rand() < 0.97 ? 1 : 2;
      ctx.fillRect(rand() * size, rand() * size, s, s);
    }
    ctx.fillStyle = "#e6c677";
    const star = (x: number, y: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 ? r * 0.42 : r;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
    };
    for (let i = 0; i < 26; i++) star(rand() * size, rand() * size, size * (0.008 + rand() * 0.01));
    return dataTexture(c, { color: true });
  });
}

/** Radially engraved text around the caseback ring; returns a bump/roughness map. */
export function engravingMap(top: string, bottom: string, innerRatio: number, cached = true) {
  const make = () => {
    const size = 2048;
    const { c, ctx } = canvas(size);
    // dark = polished, light = engraved (rougher and sunk through the bump map)
    ctx.fillStyle = "#3a3a3a";
    ctx.fillRect(0, 0, size, size);
    const centre = size / 2;
    const outer = size / 2;
    const inner = outer * innerRatio;
    const radius = (outer + inner) / 2;
    const px = (outer - inner) * 0.42;
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 ${px}px ${fontFamily("--font-hanken")}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const writeArc = (text: string, onTop: boolean) => {
      const spacing = px * 0.18;
      const widths = [...text].map((ch) => ctx.measureText(ch).width + spacing);
      const total = widths.reduce((a, b) => a + b, 0);
      let angle = -total / radius / 2;
      [...text].forEach((ch, i) => {
        const a = angle + widths[i] / radius / 2;
        ctx.save();
        ctx.translate(centre, centre);
        if (onTop) {
          ctx.rotate(a);
          ctx.translate(0, -radius);
        } else {
          ctx.rotate(-a);
          ctx.translate(0, radius);
        }
        ctx.fillText(ch, 0, 0);
        ctx.restore();
        angle += widths[i] / radius;
      });
    };
    writeArc(top, true);
    if (bottom) writeArc(bottom, false);
    return dataTexture(c);
  };
  // personal engravings change on every keystroke: those are built fresh and disposed by the caller
  return cached ? memo(`engrave-${top}-${bottom}-${innerRatio.toFixed(3)}`, make) : make();
}

/** Reads a next/font family from its CSS variable so canvas text matches the page. */
export function fontFamily(variable: "--font-gloock" | "--font-hanken") {
  if (typeof window === "undefined") return "serif";
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || (variable === "--font-gloock" ? "Georgia, serif" : "Helvetica, sans-serif");
}

export function clearTextureCache(prefix: string) {
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) {
      cache.get(key)?.dispose();
      cache.delete(key);
    }
  }
}
