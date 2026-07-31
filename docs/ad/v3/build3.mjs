/**
 * Wraps the rendered master into everything the channels want.
 *
 *   out/founderfloor-ad3-1080p.mp4  (silent, from render.mjs)
 *   out/bed.wav                     (from audio.mjs)
 *        ->  16:9 with sound, 720p, 1:1, 9:16, webm, poster, silent copy
 *
 * The square and vertical cuts letterbox rather than crop: cut 2 puts the
 * type on one side and the product on the other, so a centre crop would
 * behead half the words.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const FF =
  process.env.FF_FFMPEG || require("ffmpeg-static");
const ff = (args) => execFileSync(FF, ["-hide_banner", "-loglevel", "error", "-y", ...args]);

const OUT = "out";
const MASTER = `${OUT}/founderfloor-ad3-1080p.mp4`;
const SILENT = `${OUT}/founderfloor-ad3-silent.mp4`;
const BED = `${OUT}/bed.wav`;
const INK = "0x140F0A";
mkdirSync(OUT, { recursive: true });

if (!existsSync(MASTER)) throw new Error(`${MASTER} missing — run render.mjs first`);

// ---- social frame overlays (transparent PNGs from frames.html) ----
if (!existsSync("sq-frame.png") || !existsSync("vt-frame.png")) {
  const { chromium } = require("playwright");
  const browser = await chromium.launch({
    executablePath: process.env.FF_CHROME || undefined,
    args: ["--hide-scrollbars"],
  });
  for (const [id, w, h, file] of [["sq", 1080, 1080, "sq-frame.png"], ["vt", 1080, 1920, "vt-frame.png"]]) {
    const page = await (await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage();
    await page.goto(`file://${process.cwd()}/frames.html`, { waitUntil: "load" });
    await page.evaluate((k) => {
      for (const el of document.querySelectorAll(".frame")) el.classList.remove("on");
      document.getElementById(k).classList.add("on");
    }, id);
    await page.waitForTimeout(400);
    await page.screenshot({ path: file, omitBackground: true });
    console.log(`[build3] ${file}`);
  }
  await browser.close();
}

// ---- keep a silent master, then lay the bed under the graded one ----
ff(["-i", MASTER, "-c:v", "copy", "-an", SILENT]);
const WITH_SOUND = `${OUT}/founderfloor-ad3-sound.mp4`;
ff([
  "-i", SILENT, "-i", BED,
  "-map", "0:v", "-map", "1:a", "-shortest",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
  "-movflags", "+faststart", WITH_SOUND,
]);
console.log("[build3] 16:9 with sound");

const A = ["-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart"];

// ---- 720p travel copy ----
ff(["-i", WITH_SOUND, "-vf", "scale=1280:720:flags=lanczos",
    "-c:v", "libx264", "-crf", "19", "-preset", "slow", ...A, `${OUT}/founderfloor-ad3-720p.mp4`]);

// ---- 1:1 ----
ff([
  "-i", WITH_SOUND, "-i", "sq-frame.png",
  "-filter_complex",
  `[0:v]scale=1080:608:flags=lanczos,pad=1080:1080:0:236:color=${INK}[bg];[bg][1:v]overlay=0:0[v]`,
  "-map", "[v]", "-map", "0:a",
  "-c:v", "libx264", "-crf", "18", "-preset", "slow", ...A, `${OUT}/founderfloor-ad3-square.mp4`,
]);

// ---- 9:16 (Shorts / Reels / TikTok) ----
ff([
  "-i", WITH_SOUND, "-i", "vt-frame.png",
  "-filter_complex",
  `[0:v]scale=1080:608:flags=lanczos,pad=1080:1920:0:656:color=${INK}[bg];[bg][1:v]overlay=0:0[v]`,
  "-map", "[v]", "-map", "0:a",
  "-c:v", "libx264", "-crf", "18", "-preset", "slow", ...A, `${OUT}/founderfloor-ad3-vertical.mp4`,
]);

// ---- webm for the site ----
ff(["-i", SILENT, "-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-row-mt", "1",
    "-speed", "2", "-an", `${OUT}/founderfloor-ad3.webm`]);

// ---- poster ----
ff(["-i", MASTER, "-ss", "26.30", "-frames:v", "1", `${OUT}/founderfloor-ad3-poster.png`]);

for (const f of ["founderfloor-ad3-sound.mp4", "founderfloor-ad3-silent.mp4", "founderfloor-ad3-720p.mp4",
                 "founderfloor-ad3-square.mp4", "founderfloor-ad3-vertical.mp4",
                 "founderfloor-ad3.webm", "founderfloor-ad3-poster.png"]) {
  const p = `${OUT}/${f}`;
  const r = spawnSync(FF, ["-hide_banner", "-i", p], { encoding: "utf8" });
  const d = (r.stderr.match(/Duration: ([\d:.]+)/) || [])[1] || "still";
  console.log(`  ${f.padEnd(34)} ${existsSync(p) ? d : "MISSING"}`);
}
console.log("[build3] done");
