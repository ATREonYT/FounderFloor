/**
 * Frame-steps scene.html and pipes the frames straight into ffmpeg.
 *
 * Nothing is captured in real time: the page exposes __seek(t), which sets
 * the virtual clock, seeks every visible plate to the matching source frame,
 * and resolves once the compositor has painted. So a slow filter costs render
 * minutes, never dropped frames — which is what lets the cut carry blur,
 * 3D transforms and per-word type without stuttering.
 *
 *   node render.mjs            1920x1080 master  -> out/founderfloor-ad2.mp4
 *   node render.mjs --preview  960x540 draft, every 2nd frame
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { once } from "node:events";
import { mkdirSync, readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const FF =
  process.env.FF_FFMPEG || require("ffmpeg-static");

const PREVIEW = process.argv.includes("--preview");
const FPS = PREVIEW ? 15 : 30;
const DSF = PREVIEW ? 0.5 : 1;
const OUT = PREVIEW ? "out/preview.mp4" : "out/founderfloor-ad2-1080p.mp4";
mkdirSync("out", { recursive: true });

const plates = JSON.parse(readFileSync("../plates.json", "utf8"));
const PLATES = Object.fromEntries(plates.map((p) => [p.name, p]));

const browser = await chromium.launch({
  executablePath: process.env.FF_CHROME || undefined,
  args: ["--hide-scrollbars", "--autoplay-policy=no-user-gesture-required"],
});
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: DSF,
});
// hand the compositor the plate paths + their in-points before any script runs
await ctx.addInitScript((p) => {
  window.PLATES = p;
}, PLATES);
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", String(e).slice(0, 200)));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE", m.text().slice(0, 200));
});

await page.goto(`file://${process.cwd()}/scene.html`, { waitUntil: "load" });
const ready = await page.evaluate(() => window.__ready());
console.log("[render] plates loaded:", ready.join("  "));

const TOTAL = await page.evaluate(() => window.__total);
// every shot's source in-point is relative to that plate's measured start
await page.evaluate((p) => {
  window.__plateStart = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v.start]));
}, PLATES);

const frames = Math.round(TOTAL * FPS);
console.log(`[render] ${TOTAL.toFixed(2)}s -> ${frames} frames at ${FPS}fps, dsf ${DSF}`);

const ff = spawn(FF, [
  "-hide_banner", "-loglevel", "error", "-y",
  "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
  "-f", "lavfi", "-t", String(TOTAL), "-i", "anullsrc=r=48000:cl=stereo",
  "-map", "0:v", "-map", "1:a",
  "-c:v", "libx264", "-crf", PREVIEW ? "26" : "17", "-preset", PREVIEW ? "veryfast" : "slow",
  "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.0",
  "-c:a", "aac", "-b:a", "96k", "-shortest",
  "-movflags", "+faststart", OUT,
]);
ff.stderr.on("data", (d) => process.stdout.write(`[ffmpeg] ${d}`));

const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  const t = i / FPS;
  await page.evaluate((tt) => window.__seek(tt), t);
  const buf = await page.screenshot({ type: "png" });
  if (!ff.stdin.write(buf)) await once(ff.stdin, "drain");
  if (i % 60 === 0) {
    const el = (Date.now() - t0) / 1000;
    const eta = i ? (el / i) * (frames - i) : 0;
    console.log(`  ${i}/${frames}  t=${t.toFixed(1)}s  elapsed ${el.toFixed(0)}s  eta ${eta.toFixed(0)}s`);
  }
}
ff.stdin.end();
await once(ff, "close");
await browser.close();
console.log(`[render] done -> ${OUT} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
