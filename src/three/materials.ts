import * as THREE from "three";
import type { CaseMaterial, DialFinish, HandFinish, Strap } from "@/data/types";
import { grainNormal, guillocheNormal, leatherNormal, sunburstAnisotropy, sunburstNormal } from "./textures";

const cache = new Map<string, THREE.Material>();

function memo<T extends THREE.Material>(key: string, make: () => T): T {
  const hit = cache.get(key);
  if (hit) return hit as T;
  const m = make();
  cache.set(key, m);
  return m;
}

const METAL: Record<CaseMaterial | HandFinish | "gilt" | "plate", { color: string; roughness: number }> = {
  steel: { color: "#dfe3e8", roughness: 0.16 },
  titanium: { color: "#b8bbc0", roughness: 0.42 },
  "rose-gold": { color: "#ffd0bd", roughness: 0.13 },
  "yellow-gold": { color: "#f3cf85", roughness: 0.15 },
  rhodium: { color: "#eef1f5", roughness: 0.1 },
  gold: { color: "#f3cf85", roughness: 0.12 },
  rose: { color: "#ffd0bd", roughness: 0.12 },
  blued: { color: "#2440b0", roughness: 0.2 },
  gilt: { color: "#e2bd72", roughness: 0.3 },
  plate: { color: "#cdd2d8", roughness: 0.34 },
};

export function metal(kind: keyof typeof METAL, variant: "polished" | "satin" = "polished") {
  return memo(`metal-${kind}-${variant}`, () => {
    const spec = METAL[kind];
    const m = new THREE.MeshPhysicalMaterial({
      color: spec.color,
      metalness: 1,
      roughness: variant === "satin" ? Math.min(0.55, spec.roughness + 0.2) : spec.roughness,
      envMapIntensity: 1.25,
    });
    if (kind === "blued") {
      m.iridescence = 0.55;
      m.iridescenceIOR = 1.9;
      m.iridescenceThicknessRange = [260, 420];
    }
    if (variant === "satin") {
      m.anisotropy = 0.6;
    }
    return m;
  });
}

export function sapphire() {
  return memo("sapphire", () => {
    return new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      metalness: 0,
      roughness: 0.02,
      transparent: true,
      opacity: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      ior: 1.77,
      envMapIntensity: 2.2,
      depthWrite: false,
      side: THREE.FrontSide,
    });
  });
}

export function lume() {
  return memo("lume", () => {
    return new THREE.MeshStandardMaterial({
      color: "#e7eee2",
      roughness: 0.55,
      metalness: 0,
      emissive: new THREE.Color("#3dff8f"),
      emissiveIntensity: 0,
    });
  });
}

export function ruby() {
  return memo("ruby", () => {
    return new THREE.MeshPhysicalMaterial({
      color: "#a30f2c",
      roughness: 0.06,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      emissive: new THREE.Color("#3a0010"),
      emissiveIntensity: 0.6,
      envMapIntensity: 1.6,
    });
  });
}

export function dialMaterial(color: string, finish: DialFinish) {
  return memo(`dial-${color}-${finish}`, () => {
    const m = new THREE.MeshPhysicalMaterial({ color, envMapIntensity: 1 });
    switch (finish) {
      case "sunburst":
        m.metalness = 0.55;
        m.roughness = 0.34;
        m.anisotropy = 0.85;
        m.anisotropyMap = sunburstAnisotropy();
        m.normalMap = sunburstNormal();
        m.normalScale.set(0.35, 0.35);
        m.clearcoat = 0.6;
        m.clearcoatRoughness = 0.08;
        break;
      case "guilloche":
        m.metalness = 0.45;
        m.roughness = 0.36;
        m.normalMap = guillocheNormal("grain-orge");
        m.normalScale.set(0.9, 0.9);
        break;
      case "grain":
        m.metalness = 0;
        m.roughness = 0.82;
        m.normalMap = grainNormal(256, 5, 1.6);
        m.normalScale.set(0.35, 0.35);
        break;
      case "enamel":
        m.metalness = 0;
        m.roughness = 0.12;
        m.clearcoat = 1;
        m.clearcoatRoughness = 0.04;
        break;
      case "opaline":
        m.metalness = 0.12;
        m.roughness = 0.58;
        m.normalMap = grainNormal(256, 9, 0.8);
        m.normalScale.set(0.25, 0.25);
        break;
    }
    return m;
  });
}

export function subdialMaterial(color: string) {
  return memo(`subdial-${color}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.35,
      roughness: 0.3,
      normalMap: guillocheNormal("azurage", 512),
      envMapIntensity: 1,
    });
    m.normalScale.set(0.6, 0.6);
    return m;
  });
}

/** Smooth calf lining under every strap. */
export function liningMaterial(strap: Strap) {
  return memo(`lining-${strap.id}`, () => {
    const base = new THREE.Color(strap.color);
    const lining = base.clone().multiplyScalar(strap.material === "rubber" ? 1 : 0.82);
    return new THREE.MeshPhysicalMaterial({
      color: lining,
      roughness: strap.material === "rubber" ? 0.6 : 0.55,
      normalMap: leatherNormal("suede"),
      normalScale: new THREE.Vector2(0.15, 0.15),
      envMapIntensity: 0.5,
    });
  });
}

/**
 * One material per strap piece: the colour map differs (stitching, holes) and the leather normal
 * map is tiled to the piece's physical size.
 */
export function strapMaterial(
  strap: Strap,
  piece: string,
  map: THREE.Texture,
  size: { lengthMm: number; widthMm: number },
) {
  return memo(`strap-${strap.id}-${piece}`, () => {
    const normal = leatherNormal(strap.material).clone();
    normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
    const tile = strap.material === "alligator" ? size.widthMm : 12;
    normal.repeat.set(size.lengthMm / tile, size.widthMm / tile);
    normal.needsUpdate = true;
    const m = new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      map,
      normalMap: normal,
      envMapIntensity: 0.7,
    });
    switch (strap.material) {
      case "alligator":
        m.roughness = 0.34;
        m.clearcoat = 0.35;
        m.clearcoatRoughness = 0.3;
        m.normalScale.set(0.9, 0.9);
        break;
      case "calf":
        m.roughness = 0.5;
        m.clearcoat = 0.15;
        m.normalScale.set(0.45, 0.45);
        break;
      case "suede":
        m.roughness = 0.95;
        m.sheen = 0.5;
        m.sheenRoughness = 0.8;
        m.sheenColor = new THREE.Color(strap.color).offsetHSL(0, -0.05, 0.12);
        m.normalScale.set(0.3, 0.3);
        break;
      case "rubber":
        m.roughness = 0.62;
        m.normalScale.set(0.5, 0.5);
        break;
    }
    return m;
  });
}
