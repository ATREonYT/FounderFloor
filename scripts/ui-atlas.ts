/**
 * THE SPRITE ATLAS, FROM THE SITE'S OWN RENDERERS.
 *
 *   npx tsx scripts/ui-atlas.ts            -> packages/ui/assets/sprites/svg/*.svg + manifest.json
 *   node scripts/ui-atlas-raster.mjs       -> packages/ui/assets/sprites/{1x,2x,3x,4x}/*.png
 *
 * The hall is drawn by code, not images. The only way to give the app the
 * same pixels is to run that code: every sprite here comes out of the real
 * drawing functions in game/ executed against SvgCtx — the recording
 * context the public stand page and the OG card already use — so the
 * atlas is the artwork by construction. Nothing is redrawn by hand, and
 * there is no second copy to drift.
 *
 * What is captured, and how:
 *   grids     avatars (6x8x8 looks x 4 dirs x 3 frames is 4,608 cels; we
 *             ship the 12 cels for every look on demand instead, so the
 *             atlas carries one representative set and the app composes
 *             looks at runtime from the SAME grid functions — this file
 *             records the palette-indexed cel for skin 0/outfit 0/hair 0
 *             to prove the pipeline and size the manifest), robots, the
 *             10 booth glyphs, the 8 emotes, the 16x16 logo mark — written
 *             as one rect per lit pixel, exactly as the OG renderer does.
 *   canvas    booth carpet (each swatch x each pattern), banner (each
 *             swatch, plain), counter, stand plinth, the vacant-stand
 *             board, and the 23 plaza drawables in decor.ts — each run
 *             through SvgCtx and cropped to what it actually painted.
 *
 * What SvgCtx cannot record it THROWS on rather than dropping paint. Any
 * drawable that hits an unimplemented call is listed in the manifest under
 * `unsupported` with the error, so the gap is visible instead of silent.
 * Extending SvgCtx is the fix; hand-drawing the sprite is not.
 */
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { SvgCtx } from "../game/svgCanvas";
import { drawCarpet, drawBoothBanner, drawBoothCounter } from "../game/boothArt";
import {
  drawStandPlinth,
  lampDrawable,
  planterDrawable,
  tableDrawable,
  kioskDrawable,
  benchDrawable,
  treeDrawable,
  sofaDrawable,
  barDrawable,
  boardDrawable,
  cratesDrawable,
  signDrawable,
  noticeBoardDrawable,
  merchantFrontDrawable,
  merchantBackDrawable,
} from "../game/decor";
import { drawVacantCarpet, drawCounterBase, hashStr } from "../game/tilemap";
import {
  avatarFrameGrid,
  robotFrameGrid,
  shade,
  SPRITE_W,
  SPRITE_H,
  SKIN_TONES,
  OUTFIT_COLORS,
  HAIR_COLORS,
  CHASSIS_COLORS,
  VISOR_COLORS,
} from "../game/sprites";
import { drawEmoteIcon, EMOTE_PX } from "../game/emotes";
import { BITMAPS } from "../components/PixelGlyph";
import { BOOTH_SWATCHES } from "../lib/data/shop";
import { TILE, EMOTES } from "../lib/types";
import type { Dir, GlyphId, CarpetPattern } from "../lib/types";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "packages/ui/assets/sprites");
const SVG_DIR = join(OUT, "svg");
rmSync(SVG_DIR, { recursive: true, force: true });
mkdirSync(SVG_DIR, { recursive: true });

type Entry = {
  id: string;
  file: string;
  /** Native size in logical px — the size the site draws it at 1x. */
  w: number;
  h: number;
  /** Where the sprite's origin sits, in native px from its top-left. */
  anchor: { x: number; y: number };
  group: string;
  note?: string;
};
const manifest: { tile: number; scales: number[]; sprites: Entry[]; unsupported: { id: string; error: string }[] } = {
  tile: TILE,
  scales: [1, 2, 3, 4],
  sprites: [],
  unsupported: [],
};

/** Tight bounds of everything a recording painted, from its own rects. */
function bounds(body: string): { x: number; y: number; w: number; h: number } | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const re = /<rect x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const x = +m[1];
    const y = +m[2];
    const w = +m[3];
    const h = +m[4];
    if (w <= 0 || h <= 0) continue;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  }
  if (!Number.isFinite(minX)) return null;
  return { x: Math.floor(minX), y: Math.floor(minY), w: Math.ceil(maxX - minX), h: Math.ceil(maxY - minY) };
}

/** Run a drawing routine against SvgCtx, crop to what it painted, save. */
function capture(id: string, group: string, draw: (ctx: CanvasRenderingContext2D) => void, note?: string): void {
  const raw = new SvgCtx();
  try {
    draw(raw as unknown as CanvasRenderingContext2D);
  } catch (e) {
    manifest.unsupported.push({ id, error: (e as Error).message.slice(0, 160) });
    return;
  }
  const body = raw.body();
  const b = bounds(body);
  if (!b) {
    manifest.unsupported.push({ id, error: "painted nothing SvgCtx could record as rects" });
    return;
  }
  const svg = raw.toSvg(b.w, b.h, -b.x, -b.y);
  const file = `${id}.svg`;
  writeFileSync(join(SVG_DIR, file), svg);
  // The anchor is the drawing's own origin expressed inside the crop: a
  // sprite drawn at (0,0) that starts painting at (-3,-10) anchors at (3,10).
  manifest.sprites.push({ id, file, w: b.w, h: b.h, anchor: { x: -b.x, y: -b.y }, group, note });
}

/**
 * A flat colour grid straight to rects — the OG renderer's move.
 *
 * `outline` applies the sprite rasterizer's edge rule: any lit pixel with
 * an unlit 4-neighbour is drawn at shade(col, -0.38). renderGrid does this
 * for every avatar on the floor and standScene replicates it by hand for
 * the OG card; without it a figure is a pile of colour at 20x28. Glyphs,
 * emotes and the logo have no such rule and are written as-is.
 */
function gridSvg(
  id: string,
  group: string,
  w: number,
  h: number,
  at: (x: number, y: number) => string | null,
  note?: string,
  outline = false,
): void {
  let parts = "";
  const lit = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < w && y < h && at(x, y) !== null;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = at(x, y);
      if (!c) continue;
      const edge = outline && (!lit(x - 1, y) || !lit(x + 1, y) || !lit(x, y - 1) || !lit(x, y + 1));
      parts += `<rect x="${x}" y="${y}" width="1" height="1" fill="${edge ? shade(c, -0.38) : c}"/>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges">${parts}</svg>`;
  const file = `${id}.svg`;
  writeFileSync(join(SVG_DIR, file), svg);
  manifest.sprites.push({ id, file, w, h, anchor: { x: 0, y: 0 }, group, note });
}

/* ─────────────────────────────────────────────────────────── grids */

// Avatars: one full 12-cel set per look is 4,608 files, so the atlas
// carries the walk cycle for a representative look per palette index and
// the app composes the rest at runtime from avatarFrameGrid. Here: every
// skin tone at outfit 0 / hair 0 (6 sets), every outfit at skin 2 / hair 0
// (8), every hair at skin 2 / outfit 1 (8) — enough for the kit gallery to
// show every colour the site owns.
const DIRS: Dir[] = ["down", "up", "left", "right"];
const looks: { id: string; look: { skin: number; outfit: number; hair: number } }[] = [];
SKIN_TONES.forEach((_, i) => looks.push({ id: `skin${i}`, look: { skin: i, outfit: 0, hair: 0 } }));
OUTFIT_COLORS.forEach((_, i) => looks.push({ id: `outfit${i}`, look: { skin: 2, outfit: i, hair: 0 } }));
HAIR_COLORS.forEach((_, i) => looks.push({ id: `hair${i}`, look: { skin: 2, outfit: 1, hair: i } }));
for (const { id, look } of looks) {
  for (const dir of DIRS) {
    for (const frame of [0, 1, 2] as const) {
      const g = avatarFrameGrid(look, dir, frame);
      const flip = dir === "left";
      gridSvg(
        `avatar-${id}-${dir}-${frame}`,
        "avatar",
        SPRITE_W,
        SPRITE_H,
        (x, y) => g[y * SPRITE_W + (flip ? SPRITE_W - 1 - x : x)],
        "anchor at feet-centre: (10, 28); edge-darkened like renderGrid",
        true,
      );
    }
  }
}
CHASSIS_COLORS.forEach((_, ci) =>
  VISOR_COLORS.forEach((_, vi) => {
    for (const dir of DIRS) {
      const g = robotFrameGrid({ chassis: ci, visor: vi }, dir, 0);
      const flip = dir === "left";
      gridSvg(`robot-c${ci}v${vi}-${dir}`, "robot", SPRITE_W, SPRITE_H, (x, y) => g[y * SPRITE_W + (flip ? SPRITE_W - 1 - x : x)], undefined, true);
    }
  }),
);

// Booth glyphs, 8x8, in ink and in paper (the two colours the site uses).
for (const [glyph, rows] of Object.entries(BITMAPS) as [GlyphId, string[]][]) {
  for (const [tone, fill] of [["ink", "#23201A"], ["paper", "#F2EFE7"], ["accent", "#D9480F"]] as const) {
    gridSvg(`glyph-${glyph}-${tone}`, "glyph", 8, 8, (x, y) => (rows[y][x] === "#" ? fill : null));
  }
}

// Emotes, native 10px.
for (const { kind } of EMOTES) {
  capture(`emote-${kind}`, "emote", (ctx) => drawEmoteIcon(ctx, kind, 0, 0, EMOTE_PX));
}

// The logo mark, 16x16, as the site's PixelLogo draws it.
gridSvg("logo-mark", "logo", 16, 16, (x, y) => {
  const R = (x0: number, y0: number, w: number, h: number) => x >= x0 && x < x0 + w && y >= y0 && y < y0 + h;
  if (R(5, 11, 3, 1) || R(9, 11, 2, 1)) return "#B08D2E";
  if (R(4, 10, 8, 3)) return "#F2EFE7";
  if (R(3, 9, 10, 5)) return "#23201A";
  if (R(1, 5, 1, 9) || R(14, 5, 1, 9)) return "#23201A";
  if (R(2, 5, 2, 1) || R(6, 5, 2, 1) || R(10, 5, 2, 1)) return "#D9480F";
  if (R(3, 2, 2, 3) || R(7, 2, 2, 3) || R(11, 2, 2, 3)) return "#F2EFE7";
  if (R(1, 2, 14, 3)) return "#D9480F";
  if (R(1, 1, 14, 1)) return "#23201A";
  return null;
});

/* ─────────────────────────────────────────────────────── canvas art */

const PATTERNS: CarpetPattern[] = ["solid", "border", "stripes"];
BOOTH_SWATCHES.forEach((hex, i) => {
  for (const pattern of PATTERNS) {
    capture(`carpet-${i}-${pattern}`, "booth", (ctx) => drawCarpet(ctx, 0, 0, hex, pattern), `swatch ${hex}`);
  }
  capture(
    `banner-${i}`,
    "booth",
    (ctx) =>
      drawBoothBanner(ctx, {
        bx: 0,
        by: 0,
        theme: { carpet: BOOTH_SWATCHES[(i + 3) % BOOTH_SWATCHES.length], banner: hex, sign: "YOUR STAND", glyph: "rocket", pattern: "solid" },
        yours: false,
        logoImg: null,
        ownerLamp: null,
        seed: hashStr(`banner-${i}`),
      }),
    `swatch ${hex}; sign text is fillText and will not record — see manifest.unsupported`,
  );
});
capture("counter", "booth", (ctx) =>
  drawBoothCounter(ctx, { bx: 0, by: 0, theme: { carpet: "#C2B8A3", banner: "#8C3B2E", sign: "X", glyph: "star", pattern: "solid" }, seed: 7 }),
);
capture("stand-plinth", "booth", (ctx) => drawStandPlinth(ctx, 0, 0));
capture("vacant-carpet", "booth", (ctx) => drawVacantCarpet(ctx, 0, 0));
capture("vacant-counter", "booth", (ctx) => drawCounterBase(ctx, 0, 0));

// Plaza and props. Each is placed at tile (0,0); the crop finds its extent.
const t = (tx: number, ty: number, tw: number, th: number) => ({ tx, ty, tw, th });
// NOT SPRITES, and recorded as such rather than approximated: the fountain
// and the arch are ANIMATED — their sparkle and shimmer positions come off
// a clock the engine supplies, so drawn without one they paint NaN — and
// the stanchion's rope is a quadratic curve SvgCtx does not record. All
// three live only on the floor, which the app shows through the WebView,
// so nothing on a native screen needs them. If one ever does, extend
// SvgCtx (curves) or pass a fixed clock (animation) — do not hand-draw.
for (const [id, why] of [
  ["prop-fountain", "animated: sparkle positions come from the engine clock (NaN without it) — floor-only, in the WebView"],
  ["prop-arch", "animated shimmer, as the fountain — floor-only, in the WebView"],
  ["prop-stanchion", "rope is ctx.quadraticCurveTo, which SvgCtx does not record — floor-only, in the WebView"],
  ["prop-wall-banner", "uses ctx.clearRect, which SvgCtx does not record — floor-only, in the WebView"],
] as const) {
  manifest.unsupported.push({ id, error: why });
}
const props: { id: string; d: () => { draw(ctx: CanvasRenderingContext2D): void } }[] = [
  { id: "lamp", d: () => lampDrawable(0, 0) },
  { id: "planter", d: () => planterDrawable(0, 0, 3) },
  { id: "table", d: () => tableDrawable(0, 0, 5) },
  { id: "kiosk", d: () => kioskDrawable(0, 0) },
  { id: "bench", d: () => benchDrawable(0, 0) },
  { id: "tree", d: () => treeDrawable(0, 0, 11) },
  { id: "sofa", d: () => sofaDrawable(0, 0, 2) },
  { id: "bar", d: () => barDrawable(0, 0) },
  { id: "board", d: () => boardDrawable(0, 0, 4) },
  { id: "crates", d: () => cratesDrawable(0, 0, 9) },
  { id: "sign", d: () => signDrawable(0, 0, "ARCADE") },
  { id: "notice-board", d: () => noticeBoardDrawable(0, 0, "NOTICES", "#3B5B92", () => []) },
  { id: "merchant-front", d: () => merchantFrontDrawable(0, 0, "#3B5B92", 5) },
  { id: "merchant-back", d: () => merchantBackDrawable(0, 0, "PORTER", "#3B5B92") },
];
for (const { id, d } of props) {
  capture(`prop-${id}`, "prop", (ctx) => {
    const drawable = d();
    drawable.draw(ctx);
  });
}

writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
const groups = manifest.sprites.reduce<Record<string, number>>((acc, s) => ((acc[s.group] = (acc[s.group] ?? 0) + 1), acc), {});
console.log(`atlas: ${manifest.sprites.length} sprites ->`, groups);
if (manifest.unsupported.length) {
  console.log(`\n${manifest.unsupported.length} could not be recorded by SvgCtx (listed in manifest.unsupported):`);
  for (const u of manifest.unsupported) console.log(`  ${u.id}: ${u.error}`);
}
