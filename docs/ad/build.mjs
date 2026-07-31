/**
 * Cuts the filmed beats into the finished ad.
 *
 *   raw/<beat>.webm + beats.json  ->  out/*.mp4 / .webm / .png
 *
 * Every beat is trimmed with `-ss` AFTER `-i` (accurate, decode-and-discard)
 * and re-encoded to identical H.264 so the pieces concatenate without a
 * second generation of loss. The end card dissolves in; everything else is a
 * hard cut, which reads faster.
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
// FF_FFMPEG overrides; otherwise the ffmpeg-static devDependency.
const FF = process.env.FF_FFMPEG || require("ffmpeg-static");
const OUT = "out";
const TMP = "cut";
const FPS = 30;
const W = 1920;
const H = 1080;
const DISSOLVE = 0.45; // only into the end card

/** Per-beat trim, relative to that beat's `start`. `out: null` = to the end. */
const CUTS = [
  { name: "walk", in: 0, out: null },
  { name: "stand", in: 0, out: null },
  { name: "chat", in: 0, out: null },
  { name: "directory", in: 0, out: null },
  { name: "designer", in: 0, out: null },
  { name: "claim", in: 0, out: null },
  { name: "demonight", in: 0, out: null },
];
const END = { name: "endcard", in: 0, out: null };

const ff = (args) => execFileSync(FF, ["-hide_banner", "-loglevel", "error", "-y", ...args]);
const beats = new Map(
  JSON.parse(readFileSync("beats.json", "utf8")).map((b) => [b.name, b]),
);

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });

function cut(spec, idx) {
  const b = beats.get(spec.name);
  if (!b) throw new Error(`no beat filmed for "${spec.name}"`);
  const ss = b.start + spec.in;
  const dur = (spec.out ?? b.dur) - spec.in;
  const dest = `${TMP}/${String(idx).padStart(2, "0")}-${spec.name}.mp4`;
  ff([
    "-i", b.file,
    "-ss", ss.toFixed(3),
    "-t", dur.toFixed(3),
    "-vf", `fps=${FPS},scale=${W}:${H}:flags=lanczos,format=yuv420p`,
    "-c:v", "libx264", "-crf", "16", "-preset", "slow",
    "-pix_fmt", "yuv420p", "-an", dest,
  ]);
  return { dest, dur };
}

console.log("[build] trimming beats");
const pieces = CUTS.map((c, i) => ({ ...cut(c, i + 1), name: c.name }));
const endPiece = { ...cut(END, 90), name: END.name };
for (const p of [...pieces, endPiece]) console.log(`  ${p.name.padEnd(10)} ${p.dur.toFixed(2)}s`);

// ---- body: hard cuts, concat demuxer (no re-encode) ----
writeFileSync(
  `${TMP}/list.txt`,
  pieces.map((p) => `file '${p.dest.split("/").pop()}'`).join("\n") + "\n",
);
ff(["-f", "concat", "-safe", "0", "-i", `${TMP}/list.txt`, "-c", "copy", `${TMP}/body.mp4`]);
const bodyDur = pieces.reduce((a, p) => a + p.dur, 0);

// ---- dissolve into the end card ----
const MAIN = `${OUT}/founderfloor-ad-1080p.mp4`;
ff([
  "-i", `${TMP}/body.mp4`,
  "-i", endPiece.dest,
  "-f", "lavfi", "-t", String(bodyDur + endPiece.dur), "-i", "anullsrc=r=48000:cl=stereo",
  "-filter_complex",
  `[0:v][1:v]xfade=transition=fade:duration=${DISSOLVE}:offset=${(bodyDur - DISSOLVE).toFixed(3)},format=yuv420p[v]`,
  "-map", "[v]", "-map", "2:a",
  "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-profile:v", "high", "-level", "4.0",
  "-c:a", "aac", "-b:a", "96k", "-shortest",
  "-movflags", "+faststart",
  MAIN,
]);
const total = bodyDur + endPiece.dur - DISSOLVE;
console.log(`[build] main cut ${total.toFixed(2)}s -> ${MAIN}`);

// ---- 720p travel copy ----
ff([
  "-i", MAIN,
  "-vf", "scale=1280:720:flags=lanczos",
  "-c:v", "libx264", "-crf", "21", "-preset", "slow",
  "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart",
  `${OUT}/founderfloor-ad-720p.mp4`,
]);

// ---- webm for the site itself (no audio track needed there) ----
ff([
  "-i", MAIN,
  "-c:v", "libvpx-vp9", "-crf", "34", "-b:v", "0", "-row-mt", "1", "-speed", "2",
  "-an", `${OUT}/founderfloor-ad.webm`,
]);

// ---- square feed cut: the 16:9 frame on paper, no crop, branded bands ----
// squareframe.png is a transparent 1080x1080 overlay (render-frame.mjs).
const squareArgs = ["-i", MAIN];
if (existsSync("squareframe.png")) {
  squareArgs.push("-i", "squareframe.png",
    "-filter_complex",
    "[0:v]scale=1080:608:flags=lanczos,pad=1080:1080:0:236:color=0xF2EFE7[bg];[bg][1:v]overlay=0:0[v]",
    "-map", "[v]", "-map", "0:a");
} else {
  squareArgs.push("-vf", "scale=1080:608:flags=lanczos,pad=1080:1080:0:236:color=0xF2EFE7");
}
ff([
  ...squareArgs,
  "-c:v", "libx264", "-crf", "20", "-preset", "slow",
  "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart",
  `${OUT}/founderfloor-ad-square.mp4`,
]);

// ---- poster frame + a still from the hall ----
ff(["-i", MAIN, "-ss", "2.40", "-frames:v", "1", `${OUT}/founderfloor-ad-poster.png`]);
ff(["-i", MAIN, "-ss", (total - 1.2).toFixed(2), "-frames:v", "1", `${OUT}/founderfloor-ad-endframe.png`]);

// ---- a short cut for feeds: opener + stand + claim + end card ----
const SHORT = ["walk", "stand", "claim"];
writeFileSync(
  `${TMP}/short.txt`,
  pieces
    .filter((p) => SHORT.includes(p.name))
    .map((p) => `file '${p.dest.split("/").pop()}'`)
    .join("\n") + "\n",
);
ff(["-f", "concat", "-safe", "0", "-i", `${TMP}/short.txt`, "-c", "copy", `${TMP}/shortbody.mp4`]);
const shortDur = pieces.filter((p) => SHORT.includes(p.name)).reduce((a, p) => a + p.dur, 0);
ff([
  "-i", `${TMP}/shortbody.mp4`,
  "-i", endPiece.dest,
  "-f", "lavfi", "-t", String(shortDur + endPiece.dur), "-i", "anullsrc=r=48000:cl=stereo",
  "-filter_complex",
  `[0:v][1:v]xfade=transition=fade:duration=${DISSOLVE}:offset=${(shortDur - DISSOLVE).toFixed(3)},format=yuv420p[v]`,
  "-map", "[v]", "-map", "2:a",
  "-c:v", "libx264", "-crf", "18", "-preset", "slow",
  "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart",
  `${OUT}/founderfloor-ad-short.mp4`,
]);
console.log(`[build] short cut ${(shortDur + endPiece.dur - DISSOLVE).toFixed(2)}s`);

for (const f of [
  "founderfloor-ad-1080p.mp4",
  "founderfloor-ad-720p.mp4",
  "founderfloor-ad.webm",
  "founderfloor-ad-square.mp4",
  "founderfloor-ad-short.mp4",
]) {
  if (!existsSync(`${OUT}/${f}`)) console.log(`  MISSING ${f}`);
}
console.log("[build] done");
