import * as THREE from "three";

/** Rotation of the whole watch for each presentation. */
export const VIEW_ROTATION = {
  front: new THREE.Euler(-0.32, -0.42, -0.06),
  back: new THREE.Euler(-0.28, Math.PI + 0.42, 0.06),
  hero: new THREE.Euler(-0.18, -0.3, -0.04),
  heroBack: new THREE.Euler(-0.12, Math.PI + 0.36, 0.05),
  strap: new THREE.Euler(0.62, -0.32, 0.1),
} as const;

export type ViewName = keyof typeof VIEW_ROTATION;
