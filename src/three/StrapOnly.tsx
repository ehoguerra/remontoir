"use client";

import type { Strap } from "@/data/types";
import { StrapPiece } from "./StrapPair";
import { MM } from "./Watch";
import { metal } from "./materials";

const R = 19.5;
const T = 11.4;

/**
 * A strap on its own, as sold: the two pieces side by side, each with its quick-release
 * spring bar, the buckle on the short piece.
 */
export function StrapOnly({ strap }: { strap: Strap }) {
  const steel = metal("steel");
  const bar = (y: number) => (
    <mesh material={steel} position={[0, y, T * 0.44 - T / 2]} rotation-z={Math.PI / 2}>
      <cylinderGeometry args={[0.8, 0.8, 21.6, 24]} />
    </mesh>
  );
  return (
    <group scale={MM}>
      <group position={[-12.5, -(R + 30), 6]}>
        <StrapPiece strap={strap} piece="top" R={R} T={T} lugGap={20} zShift={-T / 2} buckleMetal={steel} />
        {bar(R + 3.2)}
      </group>
      {/* the long piece is turned half a circle so it rises alongside the short one */}
      <group position={[12.5, -(R + 30), 6]} rotation-z={Math.PI}>
        <StrapPiece strap={strap} piece="tail" R={R} T={T} lugGap={20} zShift={-T / 2} />
        {bar(-(R + 3.2))}
      </group>
    </group>
  );
}
