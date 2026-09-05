/**
 * Rasterize the atlas SVGs to PNG at integer scales.
 *
 *   node scripts/ui-atlas-raster.mjs [1 2 3 4]
 *
 * Reads packages/ui/assets/sprites/manifest.json, renders each SVG with the
 * repo's Playwright Chromium at exactly (w*scale) x (h*scale) device pixels
 * with `image-rendering: pixelated` and `shape-rendering: crispEdges`, and
 * writes packages/ui/assets/sprites/<scale>x/<id>.png with a transparent
 * background. Integer scales only — a 1.5x sprite is a blurred sprite, and
 * the whole point of this pipeline is that nothing here is ever blurred.
 *
 * Chromium is the rasterizer for the same reason the atlas comes from
 * SvgCtx: it is what the site's own OG images are rendered through, so a
 * PNG here matches a card there pixel for pixel.
 */
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "packages/ui/assets/sprites");
const manifest = JSON.parse(readFileSync(join(OUT, "manifest.json"), "utf8"));
const scales = process.argv.slice(2).map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 8);
const SCALES = scales.length ? scales : manifest.scales;

// playwright-core lives wherever the dev set it up; try the repo, then the
// well-known scratch install, then give a useful error.
const require = createRequire(import.meta.url);
const candidates = [
  "playwright-core",
  process.env.PW_CORE,
  "/tmp/claude-0/-home-user-TRADING/1449c8d0-9897-58cc-9817-f06389ed6d17/scratchpad/pw/node_modules/playwright-core/index.js",
].filter(Boolean);
let chromium = null;
for (const c of candidates) {
  try {
    chromium = require(c).chromium;
    break;
  } catch {
    /* next */
  }
}
if (!chromium) {
  console.error("playwright-core not found — npm i -D playwright-core, or set PW_CORE to its index.js");
  process.exit(1);
}
const executablePath =
  process.env.PW_CHROME || (existsSync("/opt/pw-browsers/chromium-1194/chrome-linux/chrome") ? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" : undefined);

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage();
let done = 0;
for (const scale of SCALES) {
  const dir = join(OUT, `${scale}x`);
  mkdirSync(dir, { recursive: true });
  for (const s of manifest.sprites) {
    const svg = readFileSync(join(OUT, "svg", s.file), "utf8");
    const W = s.w * scale;
    const H = s.h * scale;
    await page.setViewportSize({ width: Math.max(1, W), height: Math.max(1, H) });
    await page.setContent(
      `<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${W}px;height:${H}px;image-rendering:pixelated;shape-rendering:crispEdges}</style>${svg}`,
    );
    await page.screenshot({ path: join(dir, `${s.id}.png`), omitBackground: true, clip: { x: 0, y: 0, width: W, height: H } });
    done++;
  }
}
await browser.close();
console.log(`rasterized ${done} PNGs across scales ${SCALES.join(", ")}x -> ${OUT}/{${SCALES.map((s) => s + "x").join(",")}}`);
