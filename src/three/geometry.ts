import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Geometry builders, all in millimetres. The watch faces +Z, 12 o'clock is +Y, 3 o'clock is +X,
 * and z = 0 is the caseback.
 */

const cache = new Map<string, THREE.BufferGeometry>();
function memo(key: string, make: () => THREE.BufferGeometry) {
  const hit = cache.get(key);
  if (hit) return hit;
  const g = make();
  cache.set(key, g);
  return g;
}

/** Revolve a (radius, z) profile around the Z axis. */
function revolve(points: [number, number][], segments = 128) {
  const g = new THREE.LatheGeometry(
    points.map(([r, z]) => new THREE.Vector2(r, z)),
    segments,
  );
  g.rotateX(Math.PI / 2);
  return g;
}

/** Rounds a polyline profile by inserting points along small arcs at each corner. */
function smoothProfile(points: [number, number][], radius = 0.25, steps = 4): [number, number][] {
  const out: [number, number][] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const d0 = Math.hypot(cx - px, cy - py);
    const d1 = Math.hypot(nx - cx, ny - cy);
    const r = Math.min(radius, d0 / 2, d1 / 2);
    const a: [number, number] = [cx + ((px - cx) / d0) * r, cy + ((py - cy) / d0) * r];
    const b: [number, number] = [cx + ((nx - cx) / d1) * r, cy + ((ny - cy) / d1) * r];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      // quadratic Bézier through the corner
      const x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cx + t * t * b[0];
      const y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cy + t * t * b[1];
      out.push([x, y]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

export function caseGeometry(R: number, T: number) {
  const key = `case-${R}-${T}`;
  const middle = memo(`${key}-middle`, () =>
    revolve(
      smoothProfile(
        [
          [R - 2.7, 0.95],
          [R - 1.0, 0.95],
          [R - 0.3, 1.45],
          [R, 2.3],
          [R, T - 3.1],
          [R - 0.22, T - 2.55],
        ],
        0.35,
      ),
    ),
  );
  const bezel = memo(`${key}-bezel`, () =>
    revolve(
      smoothProfile(
        [
          [R - 0.22, T - 2.55],
          [R - 0.6, T - 1.75],
          [R - 1.15, T - 0.95],
          [R - 1.8, T - 0.32],
          [R - 2.45, T - 0.02],
          [R - 2.8, T - 0.12],
          [R - 2.95, T - 0.55],
          [R - 2.95, T - 1.1],
        ],
        0.28,
      ),
    ),
  );
  const back = memo(`${key}-back`, () =>
    revolve(
      smoothProfile(
        [
          [R - 3.9, 0.0],
          [R - 3.45, 0.1],
          [R - 3.0, 0.45],
          [R - 2.7, 0.95],
        ],
        0.25,
      ),
    ),
  );
  return { middle, bezel, back };
}

/** Flat annulus facing -Z (the engraved caseback ring) with UVs spanning the full disc. */
export function backRing(inner: number, outer: number) {
  return memo(`back-ring-${inner}-${outer}`, () => {
    const g = new THREE.RingGeometry(inner, outer, 128, 1);
    // map UVs to a square covering the outer circle, so a disc texture lines up
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, pos.getX(i) / (2 * outer) + 0.5, pos.getY(i) / (2 * outer) + 0.5);
    }
    g.rotateY(Math.PI);
    return g;
  });
}

/** Disc in the XY plane with UVs mapped to [0,1] across its diameter, optionally with a hole shape. */
export function disc(radius: number, hole?: THREE.Path, segments = 128) {
  const key = `disc-${radius}-${hole ? "h" : "n"}-${segments}`;
  return memo(key, () => {
    let g: THREE.BufferGeometry;
    if (hole) {
      const shape = new THREE.Shape();
      shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
      shape.holes.push(hole);
      g = new THREE.ShapeGeometry(shape, segments);
    } else {
      g = new THREE.CircleGeometry(radius, segments);
    }
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, pos.getX(i) / (2 * radius) + 0.5, pos.getY(i) / (2 * radius) + 0.5);
    }
    return g;
  });
}

/**
 * The classic moon-phase window: an upper half disc with two "humps" the size of the moon on its
 * baseline. A full moon sits exactly in the gap between them.
 */
export function moonWindow(y: number, r: number) {
  const p = new THREE.Path();
  p.moveTo(-r, y);
  p.absarc(0, y, r, Math.PI, 0, true);
  p.absarc((2 * r) / 3, y, r / 3, 0, Math.PI, false);
  p.lineTo(-r / 3, y);
  p.absarc((-2 * r) / 3, y, r / 3, 0, Math.PI, false);
  return p;
}

export function crystalGeometry(Rc: number, zBase: number, dome: number) {
  return memo(`crystal-${Rc}-${zBase}-${dome}`, () => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 24; i++) {
      const r = (i / 24) * Rc;
      pts.push([r, zBase + dome * (1 - (r / Rc) ** 2)]);
    }
    // lathe expects the profile ordered from axis outwards for outward-facing normals
    return revolve(pts.reverse(), 96);
  });
}

/** One lug horn, extruded along X. `s` is the distance from the case centre. */
export function lugGeometry(R: number, T: number) {
  return memo(`lug-${R}-${T}`, () => {
    const shape = new THREE.Shape();
    shape.moveTo(R - 3.2, 1.1);
    shape.lineTo(R + 3.4, 1.1);
    shape.quadraticCurveTo(R + 5.6, 1.15, R + 5.85, 2.5);
    shape.quadraticCurveTo(R + 5.95, 3.4, R + 5.3, 3.75);
    shape.quadraticCurveTo(R + 3.4, T - 3.25, R + 0.6, T - 2.85);
    shape.lineTo(R - 3.2, T - 2.7);
    shape.closePath();
    const depth = 2.2;
    const g = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.35,
      bevelSize: 0.3,
      bevelSegments: 4,
      curveSegments: 24,
    });
    g.translate(0, 0, -depth / 2);
    // shape (x, y, extrude z) -> world (y, z, x)
    const m = new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1);
    g.applyMatrix4(m);
    g.computeVertexNormals();
    return g;
  });
}

/** Knurled crown along +X. */
export function crownGeometry(radius: number, length: number) {
  return memo(`crown-${radius}-${length}`, () => {
    const g = new THREE.CylinderGeometry(radius, radius, length, 144, 1, false);
    const pos = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const a = Math.atan2(v.z, v.x);
      const edge = Math.abs(v.y) > length / 2 - 0.01;
      const k = edge ? 1 : 1 + 0.045 * Math.sign(Math.sin(a * 36));
      const r = Math.hypot(v.x, v.z);
      if (r > 0.001) {
        pos.setX(i, (v.x / r) * radius * k);
        pos.setZ(i, (v.z / r) * radius * k);
      }
    }
    g.computeVertexNormals();
    g.rotateZ(-Math.PI / 2);
    return g;
  });
}

const extrudeHand = (shape: THREE.Shape, depth = 0.2) =>
  new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
    curveSegments: 24,
  });

export type HandShape = "dauphine" | "leaf" | "sword" | "breguet" | "needle" | "baton" | "arrow";

/** Hand pointing to +Y with its pivot at the origin. */
export function handGeometry(style: HandShape, length: number, width: number) {
  return memo(`hand-${style}-${length.toFixed(2)}-${width.toFixed(2)}`, () => {
    const parts: THREE.BufferGeometry[] = [];
    const boss = new THREE.Shape();
    boss.absarc(0, 0, Math.max(width * 0.55, 0.55), 0, Math.PI * 2, false);
    switch (style) {
      case "dauphine": {
        for (const side of [1, -1]) {
          const s = new THREE.Shape();
          s.moveTo(0, -length * 0.1);
          s.lineTo((side * width) / 2, length * 0.02);
          s.lineTo(0, length);
          s.closePath();
          const g = extrudeHand(s, 0.16);
          // tilt each half to form a faceted ridge
          g.rotateY(side * 0.22);
          parts.push(g);
        }
        parts.push(extrudeHand(boss));
        break;
      }
      case "leaf": {
        const s = new THREE.Shape();
        s.moveTo(0, -length * 0.06);
        s.quadraticCurveTo(width * 0.95, length * 0.42, 0, length);
        s.quadraticCurveTo(-width * 0.95, length * 0.42, 0, -length * 0.06);
        parts.push(extrudeHand(s), extrudeHand(boss));
        break;
      }
      case "sword": {
        const s = new THREE.Shape();
        s.moveTo(-width * 0.32, 0);
        s.lineTo(-width * 0.5, length * 0.84);
        s.lineTo(0, length);
        s.lineTo(width * 0.5, length * 0.84);
        s.lineTo(width * 0.32, 0);
        s.closePath();
        parts.push(extrudeHand(s), extrudeHand(boss));
        break;
      }
      case "breguet": {
        const ringY = length * 0.74;
        const ringR = width * 1.05;
        const stem = new THREE.Shape();
        stem.moveTo(-width * 0.22, 0);
        stem.lineTo(-width * 0.12, ringY - ringR * 0.9);
        stem.lineTo(width * 0.12, ringY - ringR * 0.9);
        stem.lineTo(width * 0.22, 0);
        stem.closePath();
        const ring = new THREE.Shape();
        ring.absarc(0, ringY, ringR, 0, Math.PI * 2, false);
        const hole = new THREE.Path();
        hole.absarc(0, ringY, ringR * 0.58, 0, Math.PI * 2, true);
        ring.holes.push(hole);
        const tip = new THREE.Shape();
        tip.moveTo(-width * 0.2, ringY + ringR * 0.9);
        tip.lineTo(0, length);
        tip.lineTo(width * 0.2, ringY + ringR * 0.9);
        tip.closePath();
        parts.push(extrudeHand(stem), extrudeHand(ring), extrudeHand(tip), extrudeHand(boss));
        break;
      }
      case "baton": {
        const s = new THREE.Shape();
        s.moveTo(-width / 2, -length * 0.12);
        s.lineTo(-width / 2, length);
        s.lineTo(width / 2, length);
        s.lineTo(width / 2, -length * 0.12);
        s.closePath();
        parts.push(extrudeHand(s, 0.14), extrudeHand(boss, 0.14));
        break;
      }
      case "needle": {
        const s = new THREE.Shape();
        s.moveTo(-width / 2, -length * 0.26);
        s.lineTo(-width * 0.25, length);
        s.lineTo(width * 0.25, length);
        s.lineTo(width / 2, -length * 0.26);
        s.closePath();
        const weight = new THREE.Shape();
        weight.absarc(0, -length * 0.2, width * 2.4, 0, Math.PI * 2, false);
        parts.push(extrudeHand(s, 0.1), extrudeHand(weight, 0.1), extrudeHand(boss, 0.12));
        break;
      }
      case "arrow": {
        const s = new THREE.Shape();
        s.moveTo(-width * 0.18, 0);
        s.lineTo(-width * 0.14, length * 0.8);
        s.lineTo(-width * 0.9, length * 0.8);
        s.lineTo(0, length);
        s.lineTo(width * 0.9, length * 0.8);
        s.lineTo(width * 0.14, length * 0.8);
        s.lineTo(width * 0.18, 0);
        s.closePath();
        parts.push(extrudeHand(s, 0.1), extrudeHand(boss, 0.1));
        break;
      }
    }
    const merged = mergeGeometries(parts);
    merged.computeVertexNormals();
    return merged;
  });
}

/** Lume insert for sword hands: an inset shape laid on top. */
export function swordLumeGeometry(length: number, width: number) {
  return memo(`sword-lume-${length}-${width}`, () => {
    const s = new THREE.Shape();
    const w = width * 0.62;
    s.moveTo(-w * 0.3, length * 0.18);
    s.lineTo(-w * 0.5, length * 0.83);
    s.lineTo(0, length * 0.95);
    s.lineTo(w * 0.5, length * 0.83);
    s.lineTo(w * 0.3, length * 0.18);
    s.closePath();
    return new THREE.ShapeGeometry(s, 8);
  });
}

/** A wheel with trapezoid teeth and spoke windows, extruded along Z. */
export function gearGeometry(radius: number, teeth: number, spokes: number, depth = 0.24) {
  return memo(`gear-${radius}-${teeth}-${spokes}-${depth}`, () => {
    const toothDepth = Math.min(0.32, radius * 0.1);
    const root = radius - toothDepth;
    const shape = new THREE.Shape();
    const step = (Math.PI * 2) / teeth;
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      const pts: [number, number][] = [
        [root, a],
        [radius, a + step * 0.18],
        [radius, a + step * 0.42],
        [root, a + step * 0.6],
      ];
      pts.forEach(([r, ang], j) => {
        const x = Math.cos(ang) * r;
        const y = Math.sin(ang) * r;
        if (i === 0 && j === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });
    }
    shape.closePath();
    if (spokes > 0 && radius > 1.5) {
      const rimInner = root * 0.8;
      const hub = Math.max(0.5, radius * 0.2);
      const spokeHalf = 0.28 / rimInner + 0.05;
      for (let k = 0; k < spokes; k++) {
        const a0 = (k / spokes) * Math.PI * 2 + spokeHalf;
        const a1 = ((k + 1) / spokes) * Math.PI * 2 - spokeHalf;
        const w = new THREE.Path();
        w.absarc(0, 0, rimInner, a0, a1, false);
        w.absarc(0, 0, hub + 0.3, a1, a0, true);
        w.closePath();
        shape.holes.push(w);
      }
    }
    const g = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 1,
      curveSegments: 6,
    });
    return g;
  });
}

/** An annulus extruded along Z (balance rims, chatons, bezels). */
export function ringGeometry(outer: number, inner: number, depth: number, bevel = 0.04) {
  return memo(`ring-${outer}-${inner}-${depth}-${bevel}`, () => {
    const s = new THREE.Shape();
    s.absarc(0, 0, outer, 0, Math.PI * 2, false);
    const h = new THREE.Path();
    h.absarc(0, 0, inner, 0, Math.PI * 2, true);
    s.holes.push(h);
    return new THREE.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: 64,
    });
  });
}

/** Extrude an arbitrary outline (bridges) with a polished bevel (anglage). */
export function plateGeometry(key: string, shape: THREE.Shape, depth: number) {
  return memo(
    `plate-${key}-${depth}`,
    () =>
      new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: 0.16,
        bevelSize: 0.16,
        bevelSegments: 3,
        curveSegments: 32,
      }),
  );
}

/** A flat spiral tube for the hairspring. */
export function hairspringGeometry(r0: number, r1: number, turns: number) {
  return memo(`hairspring-${r0}-${r1}-${turns}`, () => {
    const pts: THREE.Vector3[] = [];
    const n = turns * 48;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = t * turns * Math.PI * 2;
      const r = r0 + (r1 - r0) * t;
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, n, 0.045, 5, false);
  });
}

/**
 * A strap piece swept along a curve in the YZ plane. The cross-section is a rounded, slightly
 * domed rectangle that tapers in width and thickness. UV u runs along the strap, v across it.
 */
export function strapGeometry(opts: {
  key: string;
  curve: THREE.Curve<THREE.Vector3>;
  w0: number;
  w1: number;
  t0: number;
  t1: number;
  /** +1 when the outer face should point along X × tangent, -1 for the opposite */
  side: 1 | -1;
  samples?: number;
  profile?: number;
}) {
  return memo(`strap-${opts.key}`, () => {
    const samples = opts.samples ?? 120;
    const profile = opts.profile ?? 40;
    const X = new THREE.Vector3(1, 0, 0);
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const lengths = opts.curve.getLengths(samples);
    const total = lengths[lengths.length - 1];
    const P = new THREE.Vector3();
    const Tn = new THREE.Vector3();
    const N = new THREE.Vector3();
    const ring = profile + 1;

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      opts.curve.getPointAt(t, P);
      opts.curve.getTangentAt(t, Tn);
      N.crossVectors(X, Tn).multiplyScalar(opts.side).normalize();
      // taper mostly in the last two thirds, like a real strap
      const k = Math.min(1, Math.max(0, (t - 0.15) / 0.85));
      const hw = (opts.w0 + (opts.w1 - opts.w0) * k) / 2;
      const ht = (opts.t0 + (opts.t1 - opts.t0) * k) / 2;
      for (let j = 0; j <= profile; j++) {
        // start at the underside centre so the seam is hidden
        const phi = -Math.PI / 2 + (j / profile) * Math.PI * 2;
        const c = Math.cos(phi);
        const s = Math.sin(phi);
        const e = 0.28;
        const px = Math.sign(c) * Math.pow(Math.abs(c), e) * hw;
        let py = Math.sign(s) * Math.pow(Math.abs(s), e) * ht;
        // padded, domed top surface
        if (py > 0) py *= 1 + 0.25 * (1 - (px / hw) ** 2);
        positions.push(P.x + X.x * px + N.x * py, P.y + X.y * px + N.y * py, P.z + X.z * px + N.z * py);
        uvs.push(lengths[i] / total, px / (2 * hw) + 0.5);
      }
    }
    // group 0: outer face and edges, group 1: the lining underneath
    const lining: number[] = [];
    for (let i = 0; i < samples; i++) {
      for (let j = 0; j < profile; j++) {
        const a = i * ring + j;
        const b = (i + 1) * ring + j;
        const target = j < profile / 4 - 1 || j >= (3 * profile) / 4 + 1 ? lining : indices;
        if (opts.side > 0) target.push(a, b, a + 1, b, b + 1, a + 1);
        else target.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    // end caps
    for (const end of [0, samples]) {
      const centre = positions.length / 3;
      let cx = 0;
      let cy = 0;
      let cz = 0;
      for (let j = 0; j < profile; j++) {
        const idx = (end * ring + j) * 3;
        cx += positions[idx];
        cy += positions[idx + 1];
        cz += positions[idx + 2];
      }
      positions.push(cx / profile, cy / profile, cz / profile);
      uvs.push(end === 0 ? 0 : 1, 0.5);
      for (let j = 0; j < profile; j++) {
        const a = end * ring + j;
        const b = end * ring + j + 1;
        const flip = (end === 0) === opts.side > 0;
        if (flip) indices.push(centre, b, a);
        else indices.push(centre, a, b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex([...indices, ...lining]);
    g.addGroup(0, indices.length, 0);
    g.addGroup(indices.length, lining.length, 1);
    g.computeVertexNormals();
    return g;
  });
}

export function roundedRectShape(w: number, h: number, r: number, cx = 0, cy = 0) {
  const s = new THREE.Shape();
  const x = cx - w / 2;
  const y = cy - h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
