"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Strap } from "@/data/types";
import { roundedRectShape, strapGeometry } from "./geometry";
import { liningMaterial, strapMaterial } from "./materials";
import { strapColorMap } from "./textures";

interface PieceProps {
  strap: Strap;
  piece: "top" | "tail";
  R: number;
  T: number;
  lugGap: number;
  /** z offset applied to the whole watch (the case is centred on z = 0) */
  zShift: number;
  buckleMetal?: THREE.Material;
}

function useStrapPiece({ strap, piece, R, T, lugGap, zShift }: Omit<PieceProps, "buckleMetal">) {
  return useMemo(() => {
    const w0 = lugGap - 0.2;
    const w1 = Math.max(14, lugGap - 4);
    const dir = piece === "top" ? 1 : -1;
    const reach = piece === "top" ? 1 : 1.28;
    const pts = [
      [R + 0.4, T * 0.46],
      [R + 6.5, T * 0.4],
      [R + 15, T * 0.14 - 0.5],
      [R + 26 * reach, -5.5],
      [R + 36 * reach, -15],
      [R + 43 * reach, -27],
    ].map(([y, z]) => new THREE.Vector3(0, dir * y, z + zShift));
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    const length = curve.getLength();
    const geometry = strapGeometry({
      key: `${piece}-${R}-${T}-${lugGap}-${zShift}`,
      curve,
      w0,
      w1,
      t0: strap.material === "rubber" ? 3.8 : 3.4,
      t1: 2.5,
      side: piece === "top" ? 1 : -1,
    });
    const map = strapColorMap({
      color: strap.color,
      stitch: strap.stitch,
      lengthMm: length,
      widthMm: w0,
      holes: piece === "tail",
      stitched: strap.material === "calf" || strap.material === "alligator",
      key: `${strap.id}-${piece}-${Math.round(length)}-${w0}`,
    });
    const material = strapMaterial(strap, `${piece}-${Math.round(length)}`, map, { lengthMm: length, widthMm: w0 });
    return { geometry, materials: [material, liningMaterial(strap)], curve, w1 };
  }, [strap, piece, R, T, lugGap, zShift]);
}

/** One strap piece; the top piece carries the buckle, the tail piece the adjustment holes. */
export function StrapPiece(props: PieceProps) {
  const part = useStrapPiece(props);
  const buckle = useMemo(() => {
    if (props.piece !== "top") return null;
    const { curve, w1 } = part;
    const p = curve.getPointAt(0.93);
    const t = curve.getTangentAt(0.93);
    const x = new THREE.Vector3(1, 0, 0);
    const n = new THREE.Vector3().crossVectors(x, t).normalize();
    const frame = roundedRectShape(w1 + 3.2, 7.2, 1.6);
    frame.holes.push(roundedRectShape(w1 + 0.6, 4.8, 0.8));
    const geometry = new THREE.ExtrudeGeometry(frame, {
      depth: 1.1,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.3,
      bevelSegments: 3,
      curveSegments: 12,
    });
    geometry.translate(0, 0, -0.55);
    const matrix = new THREE.Matrix4().makeBasis(x, t, n).setPosition(p.clone().addScaledVector(n, 0.4));
    return { geometry, matrix };
  }, [part, props.piece]);

  return (
    <group>
      <mesh geometry={part.geometry} material={part.materials} />
      {buckle && props.buckleMetal && (
        <mesh geometry={buckle.geometry} material={props.buckleMetal} matrixAutoUpdate={false} matrix={buckle.matrix} />
      )}
    </group>
  );
}

/** Both pieces bending back from the lugs, the way a watch sits on a display cushion. */
export function StrapPair(props: Omit<PieceProps, "piece">) {
  return (
    <group>
      <StrapPiece {...props} piece="top" />
      <StrapPiece {...props} piece="tail" />
    </group>
  );
}
