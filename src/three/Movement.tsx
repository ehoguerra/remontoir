"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { disc, gearGeometry, hairspringGeometry, plateGeometry, ringGeometry } from "./geometry";
import { metal, ruby } from "./materials";
import { cotesNormal, perlageNormal, sunburstNormal } from "./textures";

/**
 * Manual-winding calibre seen through the sapphire caseback. Built facing -Z: z grows towards the
 * dial, and the visible faces of the bridges look at the caseback.
 */

const TAU = Math.PI * 2;

function capsule(ax: number, ay: number, bx: number, by: number, r: number) {
  const s = new THREE.Shape();
  const a = Math.atan2(by - ay, bx - ax);
  s.absarc(bx, by, r, a - Math.PI / 2, a + Math.PI / 2, false);
  s.absarc(ax, ay, r, a + Math.PI / 2, a + (3 * Math.PI) / 2, false);
  s.closePath();
  return s;
}

function blob(cx: number, cy: number, r: number) {
  const s = new THREE.Shape();
  s.absellipse(cx, cy, r, r * 0.92, 0, TAU, false, 0.2);
  return s;
}

export function Movement({ radius, zPlate, active = true }: { radius: number; zPlate: number; active?: boolean }) {
  const balance = useRef<THREE.Group>(null);
  const escape = useRef<THREE.Mesh>(null);
  const fourth = useRef<THREE.Mesh>(null);
  const third = useRef<THREE.Mesh>(null);
  const centre = useRef<THREE.Mesh>(null);

  const mats = useMemo(() => {
    const plate = metal("plate", "polished").clone();
    plate.roughness = 0.42;
    plate.normalMap = perlageNormal();
    plate.normalMap.repeat.set(radius / 1.8, radius / 1.8);
    plate.normalScale.set(1.1, 1.1);
    plate.color.set("#b9bec6");

    const bridge = metal("plate", "polished").clone();
    bridge.roughness = 0.24;
    const cotes = cotesNormal().clone();
    cotes.wrapS = cotes.wrapT = THREE.RepeatWrapping;
    // ExtrudeGeometry uses shape coordinates (mm) as UVs: 4 stripes per 10 mm
    cotes.repeat.set(0.1, 0.1);
    cotes.rotation = 0.35;
    cotes.needsUpdate = true;
    bridge.normalMap = cotes;
    bridge.normalScale.set(0.7, 0.7);

    const ratchet = metal("plate", "polished").clone();
    ratchet.roughness = 0.2;
    const sun = sunburstNormal().clone();
    sun.repeat.set(1 / 9.4, 1 / 9.4);
    sun.offset.set(0.5, 0.5);
    sun.needsUpdate = true;
    ratchet.normalMap = sun;
    ratchet.normalScale.set(0.6, 0.6);

    return {
      plate,
      bridge,
      ratchet,
      gilt: metal("gilt"),
      blued: metal("blued"),
      gold: metal("yellow-gold"),
      ruby: ruby(),
      slot: new THREE.MeshStandardMaterial({ color: "#14161c", roughness: 0.6 }),
    };
  }, [radius]);

  const geo = useMemo(() => {
    const zb = zPlate;
    return {
      plate: disc(radius, undefined, 96),
      barrelBridge: plateGeometry("barrel", blob(-3.0, 4.2, 6.9), 1.25),
      keyless: plateGeometry("keyless", blob(6.4, 5.4, 3.4), 1.25),
      trainA: plateGeometry("trainA", capsule(0.2, -0.6, -4.4, -3.2, 2.5), 1.25),
      trainB: plateGeometry("trainB", capsule(-4.4, -3.2, -1.6, -7.6, 2.4), 1.25),
      trainC: plateGeometry("trainC", capsule(-4.4, -3.2, -9.4, -1.4, 2.6), 1.25),
      trainD: plateGeometry("trainD", capsule(-1.6, -7.6, -6.8, -8.4, 2.2), 1.25),
      cockArm: plateGeometry("cockArm", capsule(5.8, -4.2, 9.6, 0.8, 1.35), 1.1),
      cockPad: plateGeometry("cockPad", blob(5.8, -4.2, 2.1), 1.1),
      ratchet: gearGeometry(4.7, 72, 0, 0.5),
      crownWheel: gearGeometry(2.3, 36, 0, 0.45),
      centreWheel: gearGeometry(3.7, 80, 4),
      thirdWheel: gearGeometry(3.3, 72, 4),
      fourthWheel: gearGeometry(2.9, 70, 5),
      escapeWheel: gearGeometry(1.9, 15, 0, 0.2),
      balanceRim: ringGeometry(4.2, 3.72, 0.42, 0.05),
      hairspring: hairspringGeometry(0.55, 2.3, 10),
      chaton: ringGeometry(0.98, 0.56, 0.2, 0.04),
      jewel: new THREE.CylinderGeometry(0.56, 0.56, 0.12, 24).rotateX(Math.PI / 2),
      screw: new THREE.CylinderGeometry(0.62, 0.62, 0.34, 32).rotateX(Math.PI / 2),
      bigScrew: new THREE.CylinderGeometry(1.05, 1.05, 0.4, 40).rotateX(Math.PI / 2),
      slot: new THREE.BoxGeometry(0.16, 1.1, 0.12),
      bigSlot: new THREE.BoxGeometry(0.22, 1.8, 0.14),
      arm: new THREE.BoxGeometry(7.6, 0.42, 0.3),
      zb,
    };
  }, [radius, zPlate]);

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;
    if (balance.current) balance.current.rotation.z = 4.1 * Math.sin(TAU * 4 * t);
    const beats = Math.floor(t * 8);
    if (escape.current) escape.current.rotation.z = -beats * (TAU / 30);
    if (fourth.current) fourth.current.rotation.z = (beats / 480) * TAU;
    if (third.current) third.current.rotation.z = -(t / 450) * TAU;
    if (centre.current) centre.current.rotation.z = (t / 3600) * TAU;
  });

  const zb = geo.zb;
  const bridgeFace = zb - 1.25;
  const jewel = (x: number, y: number, z: number, key: string) => (
    <group key={key} position={[x, y, z]}>
      <mesh geometry={geo.chaton} material={mats.gold} position-z={-0.02} />
      <mesh geometry={geo.jewel} material={mats.ruby} position-z={0.04} />
    </group>
  );
  const screw = (x: number, y: number, z: number, angle: number, key: string, big = false) => (
    <group key={key} position={[x, y, z]} rotation-z={angle}>
      <mesh geometry={big ? geo.bigScrew : geo.screw} material={mats.blued} />
      <mesh geometry={big ? geo.bigSlot : geo.slot} material={mats.slot} position-z={big ? -0.16 : -0.13} />
    </group>
  );

  return (
    <group>
      {/* Main plate, facing the caseback */}
      <mesh geometry={geo.plate} material={mats.plate} position-z={zb} rotation-y={Math.PI} />

      {/* Wheels under the bridges */}
      <mesh ref={centre} geometry={geo.centreWheel} material={mats.gilt} position={[0.2, -0.6, zb - 0.55]} />
      <mesh ref={third} geometry={geo.thirdWheel} material={mats.gilt} position={[-4.4, -3.2, zb - 0.62]} />
      <mesh ref={fourth} geometry={geo.fourthWheel} material={mats.gilt} position={[-1.6, -7.6, zb - 0.55]} />
      <mesh ref={escape} geometry={geo.escapeWheel} material={mats.gilt} position={[2.2, -7.6, zb - 0.9]} />

      {/* Bridges */}
      <group position-z={bridgeFace}>
        <mesh geometry={geo.barrelBridge} material={mats.bridge} />
        <mesh geometry={geo.trainA} material={mats.bridge} />
        <mesh geometry={geo.trainB} material={mats.bridge} />
        <mesh geometry={geo.trainC} material={mats.bridge} />
        <mesh geometry={geo.trainD} material={mats.bridge} />
        <mesh geometry={geo.keyless} material={mats.bridge} />
      </group>

      {/* Ratchet and crown wheels on the barrel bridge */}
      <mesh geometry={geo.ratchet} material={mats.ratchet} position={[-3.4, 3.8, bridgeFace - 0.55]} />
      <mesh geometry={geo.crownWheel} material={mats.ratchet} position={[2.9, 6.6, bridgeFace - 0.5]} />
      {screw(-3.4, 3.8, bridgeFace - 0.75, 0.6, "ratchet", true)}
      {screw(2.9, 6.6, bridgeFace - 0.68, 1.2, "crownwheel")}

      {/* Balance, hairspring and cock */}
      <group ref={balance} position={[5.8, -4.2, zb - 1.05]}>
        <mesh geometry={geo.balanceRim} material={mats.gold} />
        <mesh geometry={geo.arm} material={mats.gold} position-z={0.2} />
        <mesh geometry={geo.arm} material={mats.gold} position-z={0.2} rotation-z={Math.PI / 2} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * TAU + 0.2;
          return (
            <mesh
              key={i}
              geometry={geo.screw}
              material={mats.gold}
              position={[Math.cos(a) * 4.25, Math.sin(a) * 4.25, 0.2]}
              scale={0.42}
            />
          );
        })}
      </group>
      <mesh geometry={geo.hairspring} material={mats.plate} position={[5.8, -4.2, zb - 1.3]} />
      <group position-z={zb - 2.75}>
        <mesh geometry={geo.cockArm} material={mats.bridge} />
        <mesh geometry={geo.cockPad} material={mats.bridge} />
      </group>

      {/* Jewels in gold chatons, and heat-blued screws */}
      {jewel(0.2, -0.6, bridgeFace - 0.18, "j-centre")}
      {jewel(-4.4, -3.2, bridgeFace - 0.18, "j-third")}
      {jewel(-1.6, -7.6, bridgeFace - 0.18, "j-fourth")}
      {jewel(-6.8, -8.4, bridgeFace - 0.18, "j-pallet")}
      {jewel(-9.4, -1.4, bridgeFace - 0.18, "j-escape")}
      {jewel(5.8, -4.2, zb - 2.75 - 0.18, "j-balance")}
      {screw(-8.6, 6.2, bridgeFace - 0.2, 0.3, "s1")}
      {screw(-0.4, 10.2, bridgeFace - 0.2, 1.1, "s2")}
      {screw(-10.9, -3.6, bridgeFace - 0.2, 2.2, "s3")}
      {screw(-4.2, -9.6, bridgeFace - 0.2, 0.9, "s4")}
      {screw(8.4, 7.0, bridgeFace - 0.2, 1.9, "s6")}
      {screw(9.6, 0.8, zb - 2.75 - 0.2, 1.7, "s5")}
    </group>
  );
}
