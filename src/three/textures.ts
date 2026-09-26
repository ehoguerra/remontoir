import * as THREE from "three";

/**
 * Procedural textures for the watch. Everything is generated on a canvas at runtime,
 * so the site ships no image textures for the 3D and every finish is tunable.
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

/** Converts a height field into a tangent-space normal map. */
function normalFromHeight(
  height: Float32Array,
  w: number,
  h: number,
  strength: number,
  wrap: boolean,
): HTMLCanvasElement {
  const { c, ctx } = canvas(w, h);
  const img = ctx.createImageData(w, h);
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
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      // canvas y grows downwards, texture v grows upwards
      const dy = (at(x, y - 1) - at(x, y + 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Radial direction field for MeshPhysicalMaterial.anisotropyMap: a sunray dial. */
export function sunburstAnisotropy(size = 512) {
  return memo(`sunburst-aniso-${size}`, () => {
    const { c, ctx } = canvas(size);
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x + 0.5) / size - 0.5;
        const dy = 0.5 - (y + 0.5) / size;
        const len = Math.hypot(dx, dy) || 1;
        // tangential direction: the highlight stretches across the radial brushing
        const tx = -dy / len;
        const ty = dx / len;
        const i = (y * size + x) * 4;
        img.data[i] = (tx * 0.5 + 0.5) * 255;
        img.data[i + 1] = (ty * 0.5 + 0.5) * 255;
        img.data[i + 2] = 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return dataTexture(c);
  });
}

/** Fine radial grooves: height varies only with the angle. */
export function sunburstNormal(size = 1024) {
  return memo(`sunburst-normal-${size}`, () => {
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
    return dataTexture(normalFromHeight(hgt, size, size, 1.1, false));
  });
}

type GuillochePattern = "grain-orge" | "clous" | "azurage" | "soleil-ondule";

export function guillocheNormal(pattern: GuillochePattern, size = 1024) {
  return memo(`guilloche-${pattern}-${size}`, () => {
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
    return dataTexture(normalFromHeight(hgt, size, size, strength, false));
  });
}

/** Sandblasted / granular finish, tileable. */
export function grainNormal(size = 256, seed = 3, strength = 2.4) {
  return memo(`grain-${size}-${seed}-${strength}`, () => {
    const rand = rng(seed);
    const hgt = new Float32Array(size * size);
    for (let i = 0; i < hgt.length; i++) hgt[i] = rand();
    const tex = dataTexture(normalFromHeight(hgt, size, size, strength, true), { repeat: [6, 6] });
    return tex;
  });
}

/** Overlapping circular grains, as stamped on the main plate. Tileable. */
export function perlageNormal(size = 512) {
  return memo(`perlage-${size}`, () => {
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
    return dataTexture(normalFromHeight(hgt, size, size, 1.4, true), { repeat: [1, 1] });
  });
}

/** Côtes de Genève: parallel waves with a fine brushed grain along each stripe. Tileable. */
export function cotesNormal(size = 512) {
  return memo(`cotes-${size}`, () => {
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
    return dataTexture(normalFromHeight(hgt, size, size, 2.2, true), { repeat: [1, 1] });
  });
}

type LeatherKind = "calf" | "alligator" | "suede" | "rubber";

/** Leather surfaces, tileable. UV u runs along the strap, v across it. */
export function leatherNormal(kind: LeatherKind, size = 512) {
  return memo(`leather-${kind}-${size}`, () => {
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
      return dataTexture(normalFromHeight(hgt, size, size, 3.2, true));
    }
    if (kind === "rubber") {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const t = (x / size) * 10;
          hgt[y * size + x] = Math.pow(Math.abs(Math.sin(t * Math.PI)), 0.35);
        }
      }
      return dataTexture(normalFromHeight(hgt, size, size, 1.6, true));
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
    return dataTexture(normalFromHeight(hgt, size, size, kind === "suede" ? 1.2 : 2.6, true));
  });
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
