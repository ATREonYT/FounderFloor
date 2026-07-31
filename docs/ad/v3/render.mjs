/**
 * Frame-steps scene.html straight into ffmpeg at 50fps — exactly twice the
 * 25fps plates, so every source frame occupies exactly two output frames and
 * nothing judders. Everything the compositor draws is genuinely 50fps.
 *
 *   node render.mjs            1920x1080 master
 *   node render.mjs --preview  960x540, 25fps, quick look at the motion
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { once } from "node:events";
import { mkdirSync } from "node:fs";
import { loadPlates } from "./plates-lib.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const FF = process.env.FF_FFMPEG || require("ffmpeg-static");

const PREVIEW = process.argv.includes("--preview");
const FPS = PREVIEW ? 25 : 50;
const DSF = PREVIEW ? 0.5 : 1;
const OUT = PREVIEW ? "out/preview.mp4" : "out/founderfloor-ad3-1080p.mp4";
mkdirSync("out", { recursive: true });

const PLATES = loadPlates();
const browser = await chromium.launch({
  executablePath: process.env.FF_CHROME || undefined,
  args: ["--hide-scrollbars"],
});
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: DSF,
});
await ctx.addInitScript((p) => { window.PLATES = p; }, PLATES);
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", String(e).slice(0, 240)));
await page.goto(`file://${process.cwd()}/scene.html`, { waitUntil: "load" });
console.log("[render] plates:", (await page.evaluate(() => window.__ready())).join("  "));

const TOTAL = await page.evaluate(() => window.__total);
const frames = Math.round(TOTAL * FPS);
console.log(`[render] ${TOTAL.toFixed(2)}s -> ${frames} frames at ${FPS}fps, dsf ${DSF}`);

const ff = spawn(FF, [
  "-hide_banner", "-loglevel", "error", "-y",
  "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
  "-f", "lavfi", "-t", String(TOTAL), "-i", "anullsrc=r=48000:cl=stereo",
  "-map", "0:v", "-map", "1:a",
  "-c:v", "libx264", "-crf", PREVIEW ? "26" : "14",
  "-preset", PREVIEW ? "veryfast" : "slow",
  "-x264-params", "keyint=100:min-keyint=25",
  "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.2",
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
  if (i % 100 === 0) {
    const el = (Date.now() - t0) / 1000;
    console.log(`  ${i}/${frames}  t=${t.toFixed(1)}s  elapsed ${el.toFixed(0)}s  eta ${(i ? (el / i) * (frames - i) : 0).toFixed(0)}s`);
  }
}
ff.stdin.end();
await once(ff, "close");
await browser.close();
console.log(`[render] done -> ${OUT} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
