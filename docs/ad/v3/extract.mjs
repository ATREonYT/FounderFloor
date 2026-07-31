/**
 * Explodes each plate into a PNG frame sequence at its native rate.
 *
 * The judder in cut 2 came from driving <video> elements with
 * currentTime seeks: VP8 seeks land on whatever frame the decoder felt like,
 * and a 25fps source resampled to 30fps output repeats frames in an
 * irregular 1-2-1-2-1-1 pattern. Frames on disk plus a 50fps output (exactly
 * 2x the source) removes both problems: every source frame is shown for
 * exactly two output frames, and nothing is ever approximate.
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
import { mkdirSync, readFileSync, readdirSync } from "node:fs";

const FF = process.env.FF_FFMPEG || require("ffmpeg-static");
const SRC_FPS = 25;
const plates = JSON.parse(readFileSync("../plates.json", "utf8"));

for (const p of plates) {
  const dir = `frames/${p.name}`;
  mkdirSync(dir, { recursive: true });
  execFileSync(FF, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", `../${p.file}`,
    "-vf", `fps=${SRC_FPS}`, "-vsync", "0",
    "-compression_level", "1",
    `${dir}/%05d.png`,
  ]);
  const n = readdirSync(dir).length;
  console.log(`  ${p.name.padEnd(10)} ${n} frames  (start ${p.start}s, usable ${p.dur}s)`);
}
console.log("[extract] done");
