/**
 * Renders the promotional sheets to PNG, and the square one to MP4.
 *
 *   node render.mjs              # all three stills
 *   node render.mjs tall         # just one
 *   node render.mjs --video      # the animated square, for subreddits that take video
 *   node render.mjs --slides     # the 1080x1920 TikTok slideshow
 *   node render.mjs --html       # dump the HTML instead, to poke at in a browser
 *
 * Output lands in ../../public/promo/ so the sheets are servable from the
 * site itself (handy when a platform wants a URL rather than an upload).
 *
 * The video is captured frame by frame rather than screen-recorded: the
 * scene is a pure function of a frame number, so every frame is asked for
 * by index and the result is reproducible and drops nothing. It is slower
 * than a recording and that is the trade.
 *
 * Chromium comes from FF_CHROME or Playwright's bundled build; ffmpeg from
 * FF_FFMPEG or the ffmpeg-static devDependency, the same pair the ad
 * pipeline uses. Playwright ships its own ffmpeg, but that build carries
 * VP8 only, so it cannot make the H.264 file the platforms want.
 */
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { posterHtml, SIZES } from "./poster.mjs";
import { LOOP, POSTER_FRAME } from "./scene.mjs";
import { SLIDES, SLIDE_SIZE, slideHtml } from "./slides.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../../public/promo");
const FRAMES = join(HERE, ".frames");

const FPS = 30;

const args = process.argv.slice(2);
const htmlOnly = args.includes("--html");
const video = args.includes("--video");
const slides = args.includes("--slides");
const wanted = args.filter((a) => !a.startsWith("--"));
const formats = wanted.length ? wanted : Object.keys(SIZES);

for (const f of formats)
  if (!SIZES[f]) throw new Error(`unknown format "${f}" (have: ${Object.keys(SIZES).join(", ")})`);

mkdirSync(OUT, { recursive: true });

if (htmlOnly) {
  for (const f of formats) {
    const p = join(OUT, `founderfloor-${f}.html`);
    writeFileSync(p, posterHtml(f));
    console.log(p);
  }
  process.exit(0);
}

// playwright is a dev-time dependency of the ad pipeline, not of the app
const require = createRequire(process.env.FF_PLAYWRIGHT_FROM || import.meta.url);
const { chromium } = require("playwright");

const browser = await chromium.launch({
  executablePath: process.env.FF_CHROME || undefined,
  args: ["--hide-scrollbars", "--force-color-profile=srgb", "--font-render-hinting=none"],
});

/** Open a sheet and wait until its plate has actually painted. */
async function openSheet(format, deviceScaleFactor) {
  const { w, h } = SIZES[format];
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor });
  const page = await ctx.newPage();
  await page.setContent(posterHtml(format), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page, w, h };
}

if (slides) {
  // One page per card: each carries its own canvas, close-up and frame, so
  // there is nothing to reset between them and a broken card cannot poison
  // the next one.
  for (let i = 0; i < SLIDES.length; i++) {
    const ctx = await browser.newContext({
      viewport: { width: SLIDE_SIZE.w, height: SLIDE_SIZE.h },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await page.setContent(slideHtml(i), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const path = join(OUT, `founderfloor-slide-${String(i + 1).padStart(2, "0")}.png`);
    await page.locator("#sheet").screenshot({ path });
    await ctx.close();
    console.log(`${path}  ${SLIDE_SIZE.w}x${SLIDE_SIZE.h} @2x`);
  }
}

if (video) {
  const { ctx, page, w, h } = await openSheet("square", 1);
  rmSync(FRAMES, { recursive: true, force: true });
  mkdirSync(FRAMES, { recursive: true });

  const sheet = page.locator("#sheet");
  for (let f = 0; f < LOOP; f++) {
    await page.evaluate((n) => window.__paint(n), f);
    await sheet.screenshot({ path: join(FRAMES, `${String(f).padStart(5, "0")}.png`) });
    if (f % 60 === 0) console.log(`  frame ${f}/${LOOP}`);
  }
  await ctx.close();

  const mp4 = join(OUT, "founderfloor-square.mp4");
  execFileSync(
    process.env.FF_FFMPEG || require("ffmpeg-static"),
    [
      "-y", "-loglevel", "error",
      "-framerate", String(FPS),
      "-i", join(FRAMES, "%05d.png"),
      "-c:v", "libx264",
      "-preset", "slow",
      "-crf", "19",
      // yuv420p and even dimensions: without both, some players and some
      // phone browsers refuse the file outright
      "-pix_fmt", "yuv420p",
      "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-movflags", "+faststart",
      mp4,
    ],
    { stdio: "inherit" },
  );
  rmSync(FRAMES, { recursive: true, force: true });
  console.log(`${mp4}  ${w}x${h}  ${(LOOP / FPS).toFixed(1)}s @${FPS}fps, loops`);
}

if ((!video && !slides) || wanted.length) {
  for (const f of formats) {
    const { ctx, page, w, h } = await openSheet(f, 2);
    await page.evaluate((n) => window.__paint(n), POSTER_FRAME);
    const path = join(OUT, `founderfloor-${f}.png`);
    await page.locator("#sheet").screenshot({ path });
    await ctx.close();
    console.log(`${path}  ${w}x${h} @2x`);
  }
}

await browser.close();
