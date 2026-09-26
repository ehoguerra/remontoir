// Photographs every product from its own 3D model and writes WebP images to public/renders.
// Usage: start `npm run dev -- -p 3100`, then `npm run render` (optionally: `npm run render -- lune-39`).
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.RENDER_BASE ?? "http://localhost:3100";
const size = Number(process.env.RENDER_SIZE ?? 1600);
const filter = process.argv.slice(2);
const outDir = path.join(root, "public", "renders");
await mkdir(outDir, { recursive: true });

const jobs = await (await fetch(`${base}/render/manifest`)).json();
const selected = filter.length ? jobs.filter((j) => filter.some((f) => `${j.slug}-${j.view}`.includes(f))) : jobs;

const browser = await chromium.launch({ args: ["--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("  page error:", e.message));

for (const { slug, view } of selected) {
  const t0 = Date.now();
  await page.goto(`${base}/render/${slug}?view=${view}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__RENDER_READY__ === true, null, { timeout: 120_000 });
  // read the WebGL buffer directly so the alpha channel is preserved
  const dataUrl = await page.evaluate(() => document.querySelector("canvas").toDataURL("image/png"));
  const png = Buffer.from(dataUrl.split(",")[1], "base64");
  const file = path.join(outDir, `${slug}-${view}.webp`);
  const info = await sharp(png).webp({ quality: 84, alphaQuality: 90, effort: 6 }).toFile(file);
  console.log(`${slug}-${view}.webp  ${(info.size / 1024).toFixed(0)} KB  ${Date.now() - t0} ms`);
}


// Open Graph card for the home page
if (!filter.length || filter.includes("og")) {
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await og.goto(`${base}/render/og`, { waitUntil: "networkidle" });
  await og.evaluate(() => document.fonts.ready);
  const png = await og.locator("#og").screenshot();
  await sharp(png).png({ compressionLevel: 9 }).toFile(path.join(root, "src", "app", "opengraph-image.png"));
  await sharp(png).png({ compressionLevel: 9 }).toFile(path.join(root, "src", "app", "twitter-image.png"));
  console.log("opengraph-image.png / twitter-image.png");
  await og.close();
}

await browser.close();
