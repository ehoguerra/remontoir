// Photographs every product from its own 3D model and writes WebP images to public/renders.
// Usage: start `npm run dev -- -p 3100`, then `npm run render` (optionally: `npm run render -- lune-39`).
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.RENDER_BASE ?? "http://localhost:3100";
const size = Number(process.env.RENDER_SIZE ?? 1600);
const filter = process.argv.slice(2);
const outDir = path.join(root, "public", "renders");
await mkdir(outDir, { recursive: true });

const jobs = await (await fetch(`${base}/render/manifest`)).json();
const ogOnly = filter.length === 1 && filter[0] === "og";
const selected = ogOnly
  ? []
  : filter.length
    ? jobs.filter((j) => filter.some((f) => `${j.slug}-${j.view}`.includes(f)))
    : jobs;

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


// Share cards (1200×630 JPEG, well under the ~300 KB some apps accept): the home card, plus one per product
if (!filter.length || ogOnly) {
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const shoot = async (url) => {
    await og.goto(url, { waitUntil: "networkidle" });
    await og.evaluate(() => document.fonts.ready);
    return sharp(await og.locator("#og").screenshot()).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  };
  const write = async (buffer, file) => {
    await writeFile(file, buffer);
    console.log(path.relative(root, file), `${Math.round(buffer.length / 1024)} KB`);
  };
  const ogDir = path.join(root, "public", "og");
  await mkdir(ogDir, { recursive: true });
  for (const slug of [...new Set(jobs.map((j) => j.slug))]) {
    await write(await shoot(`${base}/render/og?slug=${slug}`), path.join(ogDir, `${slug}.jpg`));
  }
  // written last: a new file under src/app makes the dev server reload the page
  const home = await shoot(`${base}/render/og`);
  await og.close();
  await write(home, path.join(root, "src", "app", "opengraph-image.jpg"));
  await write(home, path.join(root, "src", "app", "twitter-image.jpg"));
}

await browser.close();
