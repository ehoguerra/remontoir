export const SYNODIC_MONTH = 29.530588853;
const NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14);

/** 0 = new moon, 0.5 = full moon. */
export function moonPhase(date: Date) {
  const days = (date.getTime() - NEW_MOON_EPOCH) / 86_400_000;
  const age = ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  return age / SYNODIC_MONTH;
}

export function moonIllumination(phase: number) {
  return (1 - Math.cos(phase * Math.PI * 2)) / 2;
}

export function moonName(phase: number) {
  const names = [
    "lua nova",
    "lua crescente",
    "quarto crescente",
    "crescente gibosa",
    "lua cheia",
    "minguante gibosa",
    "quarto minguante",
    "lua minguante",
  ];
  return names[Math.round(phase * 8) % 8];
}

export interface ClockTime {
  /** minutes since midnight, fractional */
  minutes: number;
  /** seconds within the minute, stepped to the 8 beats per second of a 4 Hz movement */
  seconds: number;
}

export function clockFromDate(date: Date): ClockTime {
  const ms = date.getSeconds() * 1000 + date.getMilliseconds();
  const beats = Math.floor(ms / 125);
  return {
    minutes: date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60,
    seconds: beats / 8,
  };
}

/** The classic 10:10 of watch photography, with the seconds at 30. */
export const PHOTO_TIME: ClockTime = { minutes: 10 * 60 + 9 + 0.5, seconds: 30 };

const zurich = (() => {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Zurich",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    return null;
  }
})();

/** Minutes since midnight in Geneva, for the GMT hand. */
export function genevaMinutes(date: Date) {
  if (!zurich) return (date.getUTCHours() + 1) * 60 + date.getUTCMinutes();
  const parts = zurich.formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m + date.getSeconds() / 60;
}

export const TAU = Math.PI * 2;

/** Clockwise hand angle (three.js rotates counter-clockwise around +Z). */
export const handAngle = (fraction: number) => -fraction * TAU;
