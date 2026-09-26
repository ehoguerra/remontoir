"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Strap, WatchModel } from "@/data/types";
import { dialLayout } from "./layout";
import {
  backRing,
  caseGeometry,
  crownGeometry,
  crystalGeometry,
  disc,
  handGeometry,
  lugGeometry,
  moonWindow,
  ringGeometry,
  swordLumeGeometry,
  type HandShape,
} from "./geometry";
import { dialMaterial, lume, metal, sapphire, subdialMaterial } from "./materials";
import { drawDialPrint } from "./dialPrint";
import { aventurineMap, engravingMap } from "./textures";
import { Movement } from "./Movement";
import { StrapPair } from "./StrapPair";
import { PHOTO_TIME, clockFromDate, genevaMinutes, handAngle, moonPhase, type ClockTime } from "./time";

export const MM = 0.05;
const LUME_TINT = new THREE.Color("#e7eee2");

export interface WatchProps {
  model: WatchModel;
  strap: Strap;
  /** "live" shows the visitor's time; a ClockTime freezes the hands (used for product renders). */
  clock?: "live" | ClockTime;
  /** 0 = new moon, 0.5 = full. Defaults to today's phase when live. */
  moon?: number;
  engraving?: string;
  night?: boolean;
  /** Sweep the hands from 10:10 to the current time on mount. */
  intro?: boolean;
  showStrap?: boolean;
  movementActive?: boolean;
  children?: ReactNode;
}

const caseMetalKey = (m: WatchModel["caseMaterial"]) => m;

export function Watch({
  model,
  strap,
  clock = "live",
  moon,
  engraving,
  night = false,
  intro = false,
  showStrap = true,
  movementActive = true,
  children,
}: WatchProps) {
  const L = useMemo(() => dialLayout(model), [model]);
  const { R, T, Rd, Rc, zDial } = L;
  const Rw = R - 7.4;
  const zShift = -T / 2;

  const caseGeo = useMemo(() => caseGeometry(R, T), [R, T]);
  const lug = useMemo(() => lugGeometry(R, T), [R, T]);
  const lugX = L.lugGap / 2 + 1.1;

  const mats = useMemo(() => {
    const polished = metal(caseMetalKey(model.caseMaterial), "polished");
    const satin = metal(caseMetalKey(model.caseMaterial), "satin");
    const hands = metal(model.handFinish);
    const applied = metal(model.handFinish === "blued" ? "rhodium" : model.handFinish);
    const innerWall = satin.clone();
    innerWall.side = THREE.BackSide;
    innerWall.color.multiplyScalar(0.55);
    return { polished, satin, hands, applied, innerWall };
  }, [model.caseMaterial, model.handFinish]);

  // Dial: with a moon window cut out when needed
  const dialGeo = useMemo(() => {
    const hole = L.aperture ? moonWindow(L.aperture.y, L.aperture.r) : undefined;
    return disc(Rd, hole, 160);
  }, [Rd, L.aperture]);

  const printTex = useMemo(() => drawDialPrint(model, L), [model, L]);
  useEffect(() => {
    // redraw once web fonts are ready so dial text uses Gloock / Hanken Grotesk
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      const fresh = drawDialPrint(model, L);
      printTex.image = fresh.image;
      printTex.needsUpdate = true;
    });
    return () => {
      cancelled = true;
    };
  }, [model, L, printTex]);
  useEffect(() => () => printTex.dispose(), [printTex]);

  const printMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: printTex,
        transparent: true,
        alphaTest: 0.02,
        roughness: 0.45,
        metalness: 0,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [printTex],
  );

  const engravingMat = useMemo(() => {
    const top = `REMONTOIR    CALIBRE R.0${model.complication === "moonphase" ? 3 : 1}    SAFIRA`;
    const personal = engraving?.trim();
    const bottom = personal ? personal.toUpperCase() : "VALLÉE DE JOUX    N° 0427";
    const map = engravingMap(top, bottom, (Rw + 0.35) / (R - 3.9), !personal);
    const base = metal(caseMetalKey(model.caseMaterial), "polished").clone();
    base.roughness = 0.62;
    base.roughnessMap = map;
    base.bumpMap = map;
    base.bumpScale = -1.2;
    base.userData.ownsMap = Boolean(personal);
    return base;
  }, [engraving, model.caseMaterial, model.complication, Rw, R]);
  useEffect(
    () => () => {
      if (engravingMat.userData.ownsMap) engravingMat.roughnessMap?.dispose();
      engravingMat.dispose();
    },
    [engravingMat],
  );

  // Hands
  const handSet = useMemo(() => {
    const style = model.hands as HandShape;
    const regulator = model.complication === "regulator";
    const hour = handGeometry(style, Rd * 0.56, style === "breguet" ? 1.3 : 2.0);
    const minute = handGeometry(style, Rd * (regulator ? 0.93 : 0.9), style === "breguet" ? 1.05 : 1.6);
    const seconds = handGeometry("needle", Rd * 0.94, 0.3);
    return { hour, minute, seconds };
  }, [model.hands, model.complication, Rd]);

  const hourRef = useRef<THREE.Group>(null);
  const minuteRef = useRef<THREE.Group>(null);
  const secondsRef = useRef<THREE.Group>(null);
  const subRefs = useRef<(THREE.Group | null)[]>([]);
  const gmtRef = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);

  const lumeMat = lume();
  const secondsMat = useMemo(() => {
    if (model.complication === "chronograph") return metal("blued");
    if (model.accent && model.complication !== "gmt") {
      return new THREE.MeshStandardMaterial({ color: model.accent, roughness: 0.35, metalness: 0.2 });
    }
    return mats.hands;
  }, [model.complication, model.accent, mats.hands]);
  const gmtMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: model.accent ?? "#c2283f", roughness: 0.3, metalness: 0.3 }),
    [model.accent],
  );

  const moonPhaseValue = moon ?? (clock === "live" ? moonPhase(new Date()) : 0.47);

  useFrame((_, delta) => {
    const now = new Date();
    let time: ClockTime = clock === "live" ? clockFromDate(now) : clock;
    if (clock === "live" && intro) {
      if (start.current === null) start.current = performance.now();
      const t = Math.min(1, (performance.now() - start.current) / 1700);
      if (t < 1) {
        const e = 1 - Math.pow(1 - t, 3);
        const from = PHOTO_TIME.minutes;
        const forward = (((time.minutes - from) % 720) + 720) % 720;
        time = { minutes: from + forward * e, seconds: time.seconds };
      }
    }
    const minutes = time.minutes;
    const regulator = model.complication === "regulator";
    if (hourRef.current) hourRef.current.rotation.z = handAngle(((minutes / 60) % 12) / 12);
    if (minuteRef.current) minuteRef.current.rotation.z = handAngle((minutes % 60) / 60);
    const secFrac = time.seconds / 60;
    if (secondsRef.current) {
      // a stopped chronograph rests its central hand at zero; running seconds live in the subdial
      secondsRef.current.rotation.z = model.complication === "chronograph" ? 0 : handAngle(secFrac);
    }
    L.subdials.forEach((sd, i) => {
      const g = subRefs.current[i];
      if (!g) return;
      if (sd.kind === "seconds") g.rotation.z = handAngle(secFrac);
      else if (sd.kind === "hours12") g.rotation.z = handAngle(((minutes / 60) % 12) / 12);
      else g.rotation.z = 0;
    });
    if (regulator && hourRef.current) hourRef.current.rotation.z = 0;
    if (gmtRef.current) {
      const gm = clock === "live" ? genevaMinutes(now) : minutes + 300;
      gmtRef.current.rotation.z = handAngle((gm % 1440) / 1440);
    }
    if (moonRef.current) moonRef.current.rotation.z = -(moonPhaseValue - 0.5) * Math.PI;

    // lume charge follows the night mode smoothly
    // (the lume material is a shared singleton, fetched here rather than captured from render)
    const paint = lume();
    const target = night ? 1.15 : 0;
    paint.emissiveIntensity =
      clock === "live" ? THREE.MathUtils.damp(paint.emissiveIntensity, target, 4, delta) : target;
    // in the dark the paint itself should not look white: dim its diffuse colour with the charge
    paint.color.setScalar(1 - Math.min(1, paint.emissiveIntensity) * 0.75).multiply(LUME_TINT);
  });

  const zHands = zDial + 0.55;
  const skip = L.skipHours;

  return (
    <group scale={MM}>
      <group position-z={zShift}>
        {/* Case */}
        <mesh geometry={caseGeo.middle} material={mats.satin} />
        <mesh geometry={caseGeo.bezel} material={mats.polished} />
        <mesh geometry={caseGeo.back} material={mats.polished} />
        {[1, -1].map((side) => (
          <group key={side} rotation-z={side === 1 ? 0 : Math.PI}>
            <mesh geometry={lug} material={mats.polished} position-x={lugX} />
            <mesh geometry={lug} material={mats.polished} position-x={-lugX} />
          </group>
        ))}
        <Crown R={R} T={T} material={mats.polished} />
        {model.complication === "chronograph" && <Pushers R={R} T={T} material={mats.polished} />}

        {/* Dial */}
        <group position-z={zDial}>
          <mesh geometry={dialGeo} material={dialMaterial(model.dial.color, model.dial.finish)} />
          {L.subdials.map((sd, i) => (
            <mesh
              key={i}
              geometry={disc(sd.r, undefined, 96)}
              material={subdialMaterial(model.dial.subdial ?? model.dial.color)}
              position={[sd.x, sd.y, 0.01]}
            />
          ))}
          <mesh geometry={disc(Rd, undefined, 96)} material={printMat} position-z={0.03} />
          {L.hasIndices && (model.indices === "baton" || model.indices === "lume-dot") && (
            <Indices
              count={12}
              radius={L.indexRadius}
              length={L.indexLength}
              skip={skip}
              style={model.indices}
              metalMat={mats.applied}
              lumeMat={lumeMat}
            />
          )}
          {L.aperture && <MoonDisc aperture={L.aperture} groupRef={moonRef} />}
        </group>

        {/* Hands */}
        <group position-z={zHands}>
          {model.complication !== "regulator" && (
            <group ref={hourRef}>
              <mesh geometry={handSet.hour} material={mats.hands} />
              {model.hands === "sword" && model.lume && (
                <mesh geometry={swordLumeGeometry(Rd * 0.56, 2.0)} material={lumeMat} position-z={0.26} />
              )}
            </group>
          )}
          {model.complication === "gmt" && (
            <group ref={gmtRef} position-z={0.28}>
              <mesh geometry={handGeometry("arrow", Rd * 0.8, 1.6)} material={gmtMat} />
            </group>
          )}
          <group ref={minuteRef} position-z={0.55}>
            <mesh geometry={handSet.minute} material={mats.hands} />
            {model.hands === "sword" && model.lume && (
              <mesh geometry={swordLumeGeometry(Rd * 0.9, 1.6)} material={lumeMat} position-z={0.26} />
            )}
          </group>
          {(model.complication === "time" ||
            model.complication === "gmt" ||
            model.complication === "moonphase" ||
            model.complication === "chronograph") && (
            <group ref={secondsRef} position-z={0.95}>
              <mesh geometry={handSet.seconds} material={secondsMat} />
            </group>
          )}
          <mesh position-z={1.1} material={mats.hands}>
            <cylinderGeometry args={[0.42, 0.42, 0.2, 24]} />
          </mesh>
          {L.subdials.map((sd, i) => (
            <group
              key={i}
              ref={(g) => {
                subRefs.current[i] = g;
              }}
              position={[sd.x, sd.y, -0.35]}
            >
              <mesh
                geometry={
                  sd.kind === "hours12"
                    ? handGeometry("breguet", sd.r * 0.72, 0.75)
                    : sd.kind === "minutes30"
                      ? handGeometry("baton", sd.r * 0.8, 0.34)
                      : handGeometry("needle", sd.r * 0.86, 0.2)
                }
                material={model.dial.subdial ? metal("rhodium") : mats.hands}
              />
            </group>
          ))}
        </group>

        {/* Crystal */}
        <mesh geometry={crystalGeometry(Rc, T - 1.1, 1.4)} material={sapphire()} renderOrder={2} />

        {/* Caseback: engraved ring and sapphire window */}
        <mesh geometry={backRing(Rw + 0.35, R - 3.9)} material={engravingMat} />
        <mesh geometry={ringGeometry(Rw + 0.4, Rw - 0.05, 0.35, 0.08)} material={mats.polished} />
        <mesh
          geometry={disc(Rw, undefined, 96)}
          material={sapphire()}
          position-z={0.3}
          rotation-y={Math.PI}
          renderOrder={2}
        />
        <mesh position-z={(zDial + 0.3) / 2} rotation-x={Math.PI / 2} material={mats.innerWall}>
          <cylinderGeometry args={[R - 3.3, R - 3.3, zDial - 0.3, 96, 1, true]} />
        </mesh>
        <Movement radius={R - 3.4} zPlate={zDial - 0.9} active={movementActive} />

        {children}
      </group>

      {showStrap && (
        <StrapPair strap={strap} R={R} T={T} lugGap={L.lugGap} zShift={zShift} buckleMetal={mats.polished} />
      )}
    </group>
  );
}

function Crown({ R, T, material }: { R: number; T: number; material: THREE.Material }) {
  const geo = useMemo(() => crownGeometry(2.7, 2.7), []);
  const z = T * 0.47;
  return (
    <group position={[0, 0, z]}>
      <mesh geometry={geo} material={material} position-x={R + 2.05} />
      <mesh material={material} position-x={R + 0.2} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[1.25, 1.25, 1.8, 32]} />
      </mesh>
    </group>
  );
}

function Pushers({ R, T, material }: { R: number; T: number; material: THREE.Material }) {
  const z = T * 0.47;
  return (
    <group position-z={z}>
      {[30, -30].map((deg) => (
        <group key={deg} rotation-z={(deg * Math.PI) / 180}>
          <mesh material={material} position-x={R + 1.9} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[1.35, 1.35, 2.2, 32]} />
          </mesh>
          <mesh material={material} position-x={R + 0.4} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.85, 0.85, 1.6, 24]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Indices({
  count,
  radius,
  length,
  skip,
  style,
  metalMat,
  lumeMat,
}: {
  count: number;
  radius: number;
  length: number;
  skip: Set<number>;
  style: "baton" | "lume-dot";
  metalMat: THREE.Material;
  lumeMat: THREE.Material;
}) {
  const geos = useMemo(
    () => ({
      baton: new RoundedBoxGeometry(0.95, length, 0.55, 2, 0.16),
      wide: new RoundedBoxGeometry(1.7, length * 1.05, 0.55, 2, 0.16),
      lumeBar: new RoundedBoxGeometry(1.15, length * 0.86, 0.3, 2, 0.1),
      dot: ringGeometry(1.25, 0.95, 0.42, 0.08),
      dotFill: new THREE.CylinderGeometry(0.95, 0.95, 0.3, 32).rotateX(Math.PI / 2),
    }),
    [length],
  );
  const items = [];
  for (let h = 0; h < count; h++) {
    const hour = h === 0 ? 12 : h;
    if (skip.has(hour)) continue;
    const a = (h / count) * Math.PI * 2;
    const x = Math.sin(a) * radius;
    const y = Math.cos(a) * radius;
    const cardinal = h % 3 === 0;
    if (style === "baton") {
      items.push(
        <group key={h} position={[x, y, 0.3]} rotation-z={-a}>
          {h === 0 ? (
            <>
              <mesh geometry={geos.baton} material={metalMat} position-x={-0.75} />
              <mesh geometry={geos.baton} material={metalMat} position-x={0.75} />
            </>
          ) : (
            <mesh geometry={geos.baton} material={metalMat} />
          )}
        </group>,
      );
    } else if (cardinal) {
      items.push(
        <group key={h} position={[x, y, 0.3]} rotation-z={-a}>
          <mesh geometry={geos.wide} material={metalMat} />
          <mesh geometry={geos.lumeBar} material={lumeMat} position-z={0.16} />
        </group>,
      );
    } else {
      const r = radius + length * 0.25;
      items.push(
        <group key={h} position={[Math.sin(a) * r, Math.cos(a) * r, 0.02]}>
          <mesh geometry={geos.dot} material={metalMat} />
          <mesh geometry={geos.dotFill} material={lumeMat} position-z={0.18} />
        </group>,
      );
    }
  }
  return <group>{items}</group>;
}

function MoonDisc({
  aperture,
  groupRef,
}: {
  aperture: { y: number; r: number };
  groupRef: React.RefObject<THREE.Group | null>;
}) {
  // moon radius equals the humps: a full moon fits exactly between them
  const moonR = aperture.r / 3;
  const orbit = moonR * 2.3;
  const centreY = aperture.y + moonR - orbit;
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: aventurineMap(), roughness: 0.4, metalness: 0.2 }),
    [],
  );
  const moonMat = useMemo(() => {
    const m = metal("yellow-gold").clone();
    m.roughness = 0.28;
    return m;
  }, []);
  return (
    <group position-z={-0.5}>
      {/* a fixed aventurine sky fills the window; only the moons travel */}
      <mesh geometry={disc(aperture.r + 0.4, undefined, 96)} material={mat} position={[0, aperture.y, -0.1]} />
      <group ref={groupRef} position={[0, centreY, 0]}>
        <mesh geometry={disc(moonR, undefined, 64)} material={moonMat} position={[0, orbit, 0]} />
        <mesh geometry={disc(moonR, undefined, 64)} material={moonMat} position={[0, -orbit, 0]} />
      </group>
    </group>
  );
}
