import type { WatchModel } from "@/data/types";

export interface Subdial {
  x: number;
  y: number;
  r: number;
  kind: "seconds" | "minutes30" | "hours12";
}

export interface Aperture {
  /** baseline of the moon window (the line through the two humps) */
  y: number;
  /** radius of the window's upper arc */
  r: number;
}

export interface DialLayout {
  R: number;
  T: number;
  /** dial radius */
  Rd: number;
  /** crystal radius */
  Rc: number;
  /** z of the dial surface, measured from the caseback */
  zDial: number;
  subdials: Subdial[];
  skipHours: Set<number>;
  aperture?: Aperture;
  indexRadius: number;
  indexLength: number;
  lugGap: number;
  hasIndices: boolean;
}

/** Physical layout of a watch, in millimetres. Shared by the 3D parts and the dial printing. */
export function dialLayout(model: WatchModel): DialLayout {
  const R = model.diameter / 2;
  const T = model.thickness;
  const Rd = R - 3.1;
  const skipHours = new Set<number>();
  const subdials: Subdial[] = [];
  let aperture: Aperture | undefined;
  let indexRadius = Rd - 3.2;
  let indexLength = 3.2;
  let hasIndices = true;

  switch (model.complication) {
    case "small-seconds":
      subdials.push({ x: 0, y: -0.47 * Rd, r: 0.27 * Rd, kind: "seconds" });
      skipHours.add(6);
      break;
    case "moonphase":
      aperture = { y: -0.46 * Rd, r: 0.37 * Rd };
      skipHours.add(6);
      break;
    case "chronograph":
      subdials.push(
        { x: -0.47 * Rd, y: 0, r: 0.27 * Rd, kind: "seconds" },
        { x: 0.47 * Rd, y: 0, r: 0.27 * Rd, kind: "minutes30" },
      );
      skipHours.add(3).add(9);
      break;
    case "regulator":
      subdials.push(
        { x: 0, y: 0.45 * Rd, r: 0.28 * Rd, kind: "hours12" },
        { x: 0, y: -0.48 * Rd, r: 0.24 * Rd, kind: "seconds" },
      );
      hasIndices = false;
      break;
    case "gmt":
      indexRadius = Rd - 5.2;
      indexLength = 2.6;
      break;
    default:
      break;
  }

  const lugGap = model.diameter >= 40 ? 20 : model.diameter <= 36 ? 18 : 20;

  return {
    R,
    T,
    Rd,
    Rc: R - 2.95,
    zDial: T - 3.4,
    subdials,
    skipHours,
    aperture,
    indexRadius,
    indexLength,
    lugGap,
    hasIndices,
  };
}
