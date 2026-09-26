import * as THREE from "three";
import type { WatchModel } from "@/data/types";
import type { DialLayout, Subdial } from "./layout";
import { fontFamily } from "./textures";

const ROMAN = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

const modelLine: Partial<Record<WatchModel["complication"], string>> = {
  moonphase: "Phases de lune",
  chronograph: "Chronographe",
  gmt: "GMT",
};

/**
 * Draws everything printed on the dial (tracks, numerals, brand, subdial scales) onto a
 * transparent canvas that sits a hair above the dial surface.
 */
export function drawDialPrint(model: WatchModel, layout: DialLayout, size = 2048) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const { Rd } = layout;
  const s = size / (2 * Rd);
  const X = (x: number) => size / 2 + x * s;
  const Y = (y: number) => size / 2 - y * s;
  const ink = model.dial.print;
  const serif = fontFamily("--font-gloock");
  const sans = fontFamily("--font-hanken");

  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineCap = "butt";

  const circle = (x: number, y: number, r: number, width: number) => {
    ctx.lineWidth = width * s;
    ctx.beginPath();
    ctx.arc(X(x), Y(y), r * s, 0, Math.PI * 2);
    ctx.stroke();
  };

  const ticks = (
    cx: number,
    cy: number,
    count: number,
    r0: number,
    r1: number,
    width: number,
    every?: { n: number; r0: number; width: number },
  ) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const major = every && i % every.n === 0;
      const inner = major ? every.r0 : r0;
      ctx.lineWidth = (major ? every.width : width) * s;
      ctx.beginPath();
      ctx.moveTo(X(cx + Math.sin(a) * inner), Y(cy + Math.cos(a) * inner));
      ctx.lineTo(X(cx + Math.sin(a) * r1), Y(cy + Math.cos(a) * r1));
      ctx.stroke();
    }
  };

  const text = (
    str: string,
    x: number,
    y: number,
    sizeMm: number,
    font: string,
    opts: { weight?: number; tracking?: number; alpha?: number; color?: string } = {},
  ) => {
    ctx.save();
    ctx.globalAlpha = opts.alpha ?? 1;
    ctx.fillStyle = opts.color ?? ink;
    ctx.font = `${opts.weight ?? 400} ${sizeMm * s}px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if ("letterSpacing" in ctx && opts.tracking) {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${opts.tracking * sizeMm * s}px`;
    }
    ctx.fillText(str, X(x), Y(y));
    ctx.restore();
  };

  // Railway minute track
  const outer = Rd - 0.75;
  const innerTrack = Rd - 1.75;
  circle(0, 0, outer, 0.09);
  circle(0, 0, innerTrack, 0.09);
  ticks(0, 0, 60, innerTrack, outer, 0.1, { n: 5, r0: innerTrack - 0.55, width: 0.26 });

  // Hour numerals
  if (layout.hasIndices && (model.indices === "roman" || model.indices === "breguet")) {
    const r = Rd - 4.3;
    for (let h = 0; h < 12; h++) {
      const hour = h === 0 ? 12 : h;
      if (layout.skipHours.has(hour)) continue;
      const a = (h / 12) * Math.PI * 2;
      ctx.save();
      ctx.translate(X(Math.sin(a) * r), Y(Math.cos(a) * r));
      if (model.indices === "roman") ctx.rotate(a);
      ctx.font = `400 ${(model.indices === "roman" ? 2.5 : 2.8) * s}px ${serif}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(model.indices === "roman" ? ROMAN[h] : String(hour), 0, 0);
      ctx.restore();
    }
  }

  // Regulator: minute numerals around the track
  if (model.complication === "regulator") {
    const r = Rd - 3.3;
    for (let m = 5; m <= 60; m += 5) {
      const a = (m / 60) * Math.PI * 2;
      text(String(m), Math.sin(a) * r, Math.cos(a) * r, 1.55, serif);
    }
  }

  // GMT: 24-hour ring
  if (model.complication === "gmt") {
    const r = Rd - 3.1;
    for (let h = 1; h <= 24; h++) {
      const a = (h / 24) * Math.PI * 2;
      if (h % 2 === 0) {
        text(String(h), Math.sin(a) * r, Math.cos(a) * r, 1.15, sans, { weight: 600 });
      } else {
        ctx.beginPath();
        ctx.arc(X(Math.sin(a) * r), Y(Math.cos(a) * r), 0.22 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Subdials
  for (const sd of layout.subdials) drawSubdial(sd);

  function drawSubdial(sd: Subdial) {
    circle(sd.x, sd.y, sd.r - 0.15, 0.08);
    const color = model.dial.subdial ? "#e9ebef" : ink;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    const count = sd.kind === "minutes30" ? 30 : sd.kind === "hours12" ? 60 : 60;
    ticks(sd.x, sd.y, count, sd.r - 0.75, sd.r - 0.3, 0.08, {
      n: sd.kind === "minutes30" ? 5 : 5,
      r0: sd.r - 1.1,
      width: 0.16,
    });
    const labels =
      sd.kind === "seconds"
        ? [60, 15, 30, 45].map((v, i) => ({ v, a: (i / 4) * Math.PI * 2 }))
        : sd.kind === "minutes30"
          ? [30, 10, 20].map((v, i) => ({ v, a: (i / 3) * Math.PI * 2 }))
          : [12, 3, 6, 9].map((v, i) => ({ v, a: (i / 4) * Math.PI * 2 }));
    const lr = sd.r - 2.1;
    for (const { v, a } of labels) {
      if (sd.kind === "hours12") {
        text(String(v), sd.x + Math.sin(a) * lr, sd.y + Math.cos(a) * lr, 1.35, serif, { color });
      } else {
        text(String(v), sd.x + Math.sin(a) * lr, sd.y + Math.cos(a) * lr, 0.95, sans, { weight: 600, color });
      }
    }
    ctx.restore();
  }

  // Moon window outline
  if (layout.aperture) {
    const { y, r } = layout.aperture;
    ctx.lineWidth = 0.14 * s;
    ctx.beginPath();
    ctx.moveTo(X(-r), Y(y));
    ctx.arc(X(0), Y(y), r * s, Math.PI, 0, false);
    ctx.arc(X((2 * r) / 3), Y(y), (r / 3) * s, 0, Math.PI, true);
    ctx.lineTo(X(-r / 3), Y(y));
    ctx.arc(X((-2 * r) / 3), Y(y), (r / 3) * s, 0, Math.PI, true);
    ctx.stroke();
  }

  // Brand and model lines
  if (model.complication === "regulator") {
    text("REMONTOIR", 0, 0.1 * Rd, 1.1, serif, { tracking: 0.22 });
    text("Régulateur", 0, -0.12 * Rd, 1.0, serif, { alpha: 0.8 });
  } else {
    const brandY = model.complication === "chronograph" ? 0.5 * Rd : 0.47 * Rd;
    text("REMONTOIR", 0, brandY, 1.45, serif, { tracking: 0.22 });
    text("Vallée de Joux", 0, brandY - 1.8, 0.78, sans, { weight: 500, alpha: 0.75, tracking: 0.04 });
    const line = modelLine[model.complication];
    if (line) {
      const lineY =
        model.complication === "chronograph" ? -0.5 * Rd : layout.aperture ? layout.aperture.y - 2.1 : -0.4 * Rd;
      text(line, 0, lineY, model.complication === "gmt" ? 1.4 : 1.0, model.complication === "gmt" ? sans : serif, {
        weight: model.complication === "gmt" ? 700 : 400,
        color: model.complication === "gmt" ? model.accent : undefined,
        tracking: model.complication === "gmt" ? 0.12 : 0,
      });
    }
    if (model.lume) text("100 M", 0, -0.42 * Rd, 0.95, sans, { weight: 600, alpha: 0.85, tracking: 0.14 });
  }

  // Swiss made, split around 6 o'clock at the very edge
  text("SWISS", -1.9, -(Rd - 2.45), 0.62, sans, { weight: 600, tracking: 0.14, alpha: 0.85 });
  text("MADE", 1.9, -(Rd - 2.45), 0.62, sans, { weight: 600, tracking: 0.14, alpha: 0.85 });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}
