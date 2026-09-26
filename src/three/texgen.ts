/**
 * Pure maths behind the procedural textures: no three.js, no DOM, so the same code runs in the
 * texture worker (off the main thread) and, as a fallback, on the main thread.
 * Every generator returns RGBA bytes in GL row order (bottom row first), ready for a DataTexture.
 */

export type GuillochePattern = "grain-orge" | "clous" | "azurage" | "soleil-ondule";
export type LeatherKind = "calf" | "alligator" | "suede" | "rubber";

export type TexJob =
  | { kind: "sunburst-aniso"; size: number }
  | { kind: "sunburst-normal"; size: number }
  | { kind: "guilloche"; pattern: GuillochePattern; size: number }
  | { kind: "grain"; size: number; seed: number; strength: number }
  | { kind: "perlage"; size: number }
  | { kind: "cotes"; size: number }
  | { kind: "leather"; leather: LeatherKind; size: number };

export interface TexData {
  data: Uint8Array;
  width: number;
  height: number;
}

export function jobKey(job: TexJob): string {
  switch (job.kind) {
    case "guilloche":
      return `guilloche-${job.pattern}-${job.size}`;
    case "grain":
      return `grain-${job.size}-${job.seed}-${job.strength}`;
    case "leather":
      return `leather-${job.leather}-${job.size}`;
    default:
      return `${job.kind}-${job.size}`;
  }
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

/**
 * Converts a height field (row 0 = top of the image) into a tangent-space normal map.
 * Output rows are flipped so row 0 is the bottom, as a DataTexture expects.
 */
function normalFromHeight(height: Float32Array, w: number, h: number, strength: number, wrap: boolean): TexData {
  const data = new Uint8Array(w * h * 4);
  const at = (x: number, y: number) => {
    if (wrap) {
      x = (x + w) % w;
      y = (y + h) % h;
    } else {
      x = Math.max(0, Math.min(w - 1, x));
      y = Math.max(0, Math.min(h - 1, y));
    }
    return height[y * w + x];
  };
  for (let y = 0; y < h; y++) {
    const row = (h - 1 - y) * w;
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      // image y grows downwards, texture v grows upwards
      const dy = (at(x, y - 1) - at(x, y + 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (row + x) * 4;
      data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  return { data, width: w, height: h };
}

/** Radial direction field for MeshPhysicalMaterial.anisotropyMap: a sunray dial. */
function sunburstAnisotropy(size: number): TexData {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    const row = (size - 1 - y) * size;
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5;
      const dy = 0.5 - (y + 0.5) / size;
      const len = Math.hypot(dx, dy) || 1;
      // tangential direction: the highlight stretches across the radial brushing
      const i = (row + x) * 4;
      data[i] = ((-dy / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((dx / len) * 0.5 + 0.5) * 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }
  return { data, width: size, height: size };
}

/** Fine radial grooves: height varies only with the angle. */
function sunburstNormal(size: number): TexData {
  const rand = rng(7);
  const rays = 1440;
  const table = new Float32Array(rays);
  for (let i = 0; i < rays; i++) table[i] = rand();
  const hgt = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5;
      const dy = 0.5 - (y + 0.5) / size;
      const a = (Math.atan2(dy, dx) / (Math.PI * 2) + 0.5) * rays;
      const i0 = Math.floor(a) % rays;
      const f = a - Math.floor(a);
      const v = table[i0] * (1 - f) + table[(i0 + 1) % rays] * f;
      const r = Math.hypot(dx, dy);
      hgt[y * size + x] = v * Math.min(1, r * 14);
    }
  }
  return normalFromHeight(hgt, size, size, 1.1, false);
}

function guilloche(pattern: GuillochePattern, size: number): TexData {
  const hgt = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size - 0.5;
      const v = 0.5 - (y + 0.5) / size;
      const r = Math.hypot(u, v);
      const a = Math.atan2(v, u);
      let h = 0;
      switch (pattern) {
        case "grain-orge":
          h = Math.sin(a * 96 + Math.sin(r * 260) * 1.6) * 0.5 + 0.5;
          h *= 0.6 + 0.4 * Math.sin(r * 150);
          break;
        case "soleil-ondule":
          h = Math.sin(a * 120 + Math.sin(r * 90) * 2.2) * 0.5 + 0.5;
          break;
        case "clous": {
          const k = 70;
          const s = Math.SQRT1_2;
          const p = (u + v) * s * k;
          const q = (u - v) * s * k;
          const fp = Math.abs(p - Math.floor(p) - 0.5);
          const fq = Math.abs(q - Math.floor(q) - 0.5);
          h = 1 - Math.max(fp, fq) * 2;
          break;
        }
        case "azurage":
          h = Math.sin(r * 900) * 0.5 + 0.5;
          break;
      }
      hgt[y * size + x] = h;
    }
  }
  const strength = pattern === "clous" ? 2.2 : pattern === "azurage" ? 0.9 : 1.6;
  return normalFromHeight(hgt, size, size, strength, false);
}

/** Sandblasted / granular finish, tileable. */
function grain(size: number, seed: number, strength: number): TexData {
  const rand = rng(seed);
  const hgt = new Float32Array(size * size);
  for (let i = 0; i < hgt.length; i++) hgt[i] = rand();
  return normalFromHeight(hgt, size, size, strength, true);
}

/** Overlapping circular grains, as stamped on the main plate. Tileable. */
function perlage(size: number): TexData {
  const hgt = new Float32Array(size * size).fill(0.5);
  const cells = 4;
  const step = size / cells;
  const radius = step * 0.82;
  for (let row = -1; row <= cells; row++) {
    for (let col = -1; col <= cells; col++) {
      const cx = col * step + (row % 2 ? step / 2 : 0);
      const cy = row * step * 0.87;
      for (let y = Math.floor(cy - radius); y < cy + radius; y++) {
        for (let x = Math.floor(cx - radius); x < cx + radius; x++) {
          const d = Math.hypot(x - cx, y - cy);
          if (d > radius) continue;
          const xx = ((x % size) + size) % size;
          const yy = ((y % size) + size) % size;
          const swirl = Math.sin(d * 0.9 + Math.atan2(y - cy, x - cx) * 2) * 0.5 + 0.5;
          hgt[yy * size + xx] = swirl * (1 - Math.pow(d / radius, 6));
        }
      }
    }
  }
  return normalFromHeight(hgt, size, size, 1.4, true);
}

/** Côtes de Genève: parallel waves with a fine brushed grain along each stripe. Tileable. */
function cotes(size: number): TexData {
  const rand = rng(11);
  const hgt = new Float32Array(size * size);
  const stripes = 4;
  const lineNoise = new Float32Array(size);
  for (let i = 0; i < size; i++) lineNoise[i] = rand();
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = ((x / size) * stripes) % 1;
      const arc = Math.sin(t * Math.PI);
      hgt[y * size + x] = arc * 0.9 + lineNoise[y] * 0.08;
    }
  }
  return normalFromHeight(hgt, size, size, 2.2, true);
}

/** Leather surfaces, tileable. UV u runs along the strap, v across it. */
function leather(kind: LeatherKind, size: number): TexData {
  const rand = rng(kind.length * 97);
  const hgt = new Float32Array(size * size);
  if (kind === "alligator") {
    // Rows of rounded rectangular scales; the tile covers the strap width once.
    const rows = 7;
    const colsPerTile = 5;
    for (let y = 0; y < size; y++) {
      const vy = y / size;
      // scales are larger in the centre of the strap
      const centre = 1 - Math.abs(vy - 0.5) * 2;
      const rowF = vy * rows;
      const row = Math.floor(rowF);
      const fy = rowF - row;
      for (let x = 0; x < size; x++) {
        const cols = colsPerTile * (centre > 0.45 ? 1 : 2);
        const xf = (x / size) * cols + (row % 2) * 0.5;
        const fx = xf - Math.floor(xf);
        const ex = Math.min(fx, 1 - fx) * 2;
        const ey = Math.min(fy, 1 - fy) * 2;
        const edge = Math.min(ex * (cols / rows), ey);
        hgt[y * size + x] = Math.pow(Math.min(1, edge * 3.2), 0.6) + rand() * 0.04;
      }
    }
    return normalFromHeight(hgt, size, size, 3.2, true);
  }
  if (kind === "rubber") {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const t = (x / size) * 10;
        hgt[y * size + x] = Math.pow(Math.abs(Math.sin(t * Math.PI)), 0.35);
      }
    }
    return normalFromHeight(hgt, size, size, 1.6, true);
  }
  // calf and suede: blurred value noise
  const grid = kind === "suede" ? 256 : 96;
  const g = new Float32Array(grid * grid);
  for (let i = 0; i < g.length; i++) g[i] = rand();
  const sample = (u: number, v: number) => {
    const x = u * grid;
    const y = v * grid;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const s = (i: number, j: number) => g[(((j % grid) + grid) % grid) * grid + (((i % grid) + grid) % grid)];
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    return (
      s(x0, y0) * (1 - sx) * (1 - sy) +
      s(x0 + 1, y0) * sx * (1 - sy) +
      s(x0, y0 + 1) * (1 - sx) * sy +
      s(x0 + 1, y0 + 1) * sx * sy
    );
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const h = sample(u, v) * 0.7 + sample(u * 3, v * 3) * 0.3;
      hgt[y * size + x] = kind === "calf" ? Math.pow(h, 1.8) : h;
    }
  }
  return normalFromHeight(hgt, size, size, kind === "suede" ? 1.2 : 2.6, true);
}

export function generate(job: TexJob): TexData {
  switch (job.kind) {
    case "sunburst-aniso":
      return sunburstAnisotropy(job.size);
    case "sunburst-normal":
      return sunburstNormal(job.size);
    case "guilloche":
      return guilloche(job.pattern, job.size);
    case "grain":
      return grain(job.size, job.seed, job.strength);
    case "perlage":
      return perlage(job.size);
    case "cotes":
      return cotes(job.size);
    case "leather":
      return leather(job.leather, job.size);
  }
}
