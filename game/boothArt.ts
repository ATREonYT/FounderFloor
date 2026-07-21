/**
 * FounderFloor — booth architecture art, shared by the floor renderer
 * (game/tilemap.ts) and the profile's live preview (BoothPreview.tsx) so
 * what you buy in the editor is EXACTLY what the hall sees.
 *
 * Five styles, structurally different builds — not palette swaps:
 *   classic  the original stall: banner wall, wooden counter
 *   bigtop   striped circus tent with a peak flag and hanging sign board
 *   garden   lattice + pergola kiosk with vines and planter boxes
 *   arcade   glowing arcade cabinet: marquee lights, scanlined screen
 *   neon     dark stage wrapped in a neon tube in the banner color
 *
 * Every style keeps the 4x3 footprint and the banner / founder-lane /
 * counter rows, so collision, claiming, and interaction never change.
 * Rendering is split into the same two layers the tilemap uses
 * ("banner" = back row, "counter" = front row) so painter's-order
 * sorting with avatars keeps working.
 */

import type { BoothTheme, GlyphId } from "@/lib/types";
import { TILE } from "@/lib/types";
import { drawGlyph, luma, shade } from "@/game/sprites";

const T = TILE;

// palette (matches tilemap's fixed prop palette)
const INK = "#23201A";
const PAPER = "#F2EFE7";
const GOLD = "#B08D2E";
const WOOD_TOP = "#D9C79B";
const WOOD_FRONT = "#A28457";
const POT = "#A6633C";
const LEAF_A = "#4C7A4F";
const LEAF_B = "#3A6440";
const CARD = "#FAF7EF";
const CARD_LINE = "#C6BCA4";
const MUTED = "#6F6A5E";
const LATTICE = "#C9B586";
const CABINET = "#2A2733";
const STAGE = "#211E29";
const ACCENT_RED = "#C03A2B";

const SIGN_FONT = "700 9px ui-monospace, SFMono-Regular, Menlo, monospace";

/** #rrggbb -> rgba() string (neon halos need real alpha). */
function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** mulberry32 (same as tilemap's) — deterministic counter clutter. */
function rand(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BoothArtOpts {
  /** Left edge of the 4-tile booth zone, in world px. */
  bx: number;
  /** Top edge of the banner row, in world px. */
  by: number;
  theme: BoothTheme;
  /** Draws the gold "yours" underline on the floor. */
  yours?: boolean;
  /** Founder+ gold edge perk. */
  tier?: "pro" | "founder";
  /** Pre-decoded custom logo, if any (cached in tilemap, async in preview). */
  logoImg?: CanvasImageSource | null;
  /** Presence lamp for player-owned stands (omit to skip). */
  ownerLamp?: { online: boolean } | null;
  /** Deterministic seed for counter clutter (hash of the startup id). */
  seed: number;
}

/** Sign text + icon colors per style, so labels stay readable everywhere. */
function signColors(theme: BoothTheme): { face: string; fg: string; dark: string } {
  const face = theme.banner;
  return { face, fg: luma(face) > 0.62 ? INK : "#FFFDF5", dark: shade(face, -0.42) };
}

// ---------- the two layers ----------

export function drawBoothBanner(ctx: CanvasRenderingContext2D, o: BoothArtOpts): void {
  const style = o.theme.style ?? "classic";
  if (style === "bigtop") bannerBigtop(ctx, o);
  else if (style === "garden") bannerGarden(ctx, o);
  else if (style === "arcade") bannerArcade(ctx, o);
  else if (style === "neon") bannerNeon(ctx, o);
  else bannerClassic(ctx, o);

  const props = o.theme.props ?? [];
  if (props.includes("spotlight")) propSpotlight(ctx, o);
  if (props.includes("balloons")) propBalloons(ctx, o);

  // shared markers, on top of any architecture
  const { dark } = signColors(o.theme);
  if (o.yours) {
    ctx.fillStyle = GOLD;
    ctx.fillRect(o.bx + 3, o.by + T - 7, 4 * T - 6, 3);
  }
  if (o.tier === "founder") {
    ctx.fillStyle = GOLD;
    ctx.fillRect(o.bx + 3, o.by - 8, 4 * T - 6, 2);
    ctx.fillRect(o.bx + 3, o.by - 8, 2, 8);
    ctx.fillRect(o.bx + 4 * T - 5, o.by - 8, 2, 8);
  }
  if (o.ownerLamp) {
    ctx.fillStyle = dark;
    ctx.fillRect(o.bx + 4 * T - 15, o.by - 6, 8, 8);
    ctx.fillStyle = o.ownerLamp.online ? "#2B8A3E" : "#9A937F";
    ctx.fillRect(o.bx + 4 * T - 13, o.by - 4, 4, 4);
  }
}

export function drawBoothCounter(ctx: CanvasRenderingContext2D, o: BoothArtOpts): void {
  const style = o.theme.style ?? "classic";
  const y0 = o.by + 2 * T;
  if (style === "bigtop") counterBigtop(ctx, o, y0);
  else if (style === "garden") counterGarden(ctx, o, y0);
  else if (style === "arcade") counterArcade(ctx, o, y0);
  else if (style === "neon") counterNeon(ctx, o, y0);
  else counterClassic(ctx, o, y0);

  const props = o.theme.props ?? [];
  if (props.includes("plant")) propPlant(ctx, o);
  if (props.includes("trophy")) propTrophy(ctx, o, y0);
}

// ---------- shared bits ----------

function signAndIcon(
  ctx: CanvasRenderingContext2D,
  o: BoothArtOpts,
  ix: number,
  iy: number,
  tx: number,
  ty: number,
  maxW: number,
  fg: string,
): void {
  if (o.logoImg) {
    ctx.drawImage(o.logoImg, ix, iy, 16, 16);
  } else {
    drawGlyph(ctx, o.theme.glyph as GlyphId, ix + 2, iy + 1, 14, fg);
  }
  ctx.fillStyle = fg;
  ctx.font = SIGN_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(o.theme.sign.toUpperCase(), tx, ty, maxW);
}

function trimBand(ctx: CanvasRenderingContext2D, o: BoothArtOpts): void {
  const trim = o.theme.trim ?? "plain";
  if (trim === "plain") return;
  const { fg, dark } = signColors(o.theme);
  const ty = o.by + T - 7;
  const tw = 4 * T - 6;
  const bx = o.bx;
  ctx.fillStyle = dark;
  ctx.fillRect(bx + 3, ty, tw, 4);
  ctx.fillStyle = fg;
  if (trim === "stripes") {
    for (let x = 0; x < tw - 3; x += 8) ctx.fillRect(bx + 3 + x + 2, ty, 4, 4);
  } else if (trim === "checker") {
    for (let x = 0; x < tw - 1; x += 4) {
      const odd = (x / 4) % 2 === 1;
      ctx.fillRect(bx + 3 + x, odd ? ty + 2 : ty, 2, 2);
    }
  } else if (trim === "dots") {
    for (let x = 4; x < tw - 3; x += 9) ctx.fillRect(bx + 3 + x, ty + 1, 2, 2);
  }
}

function counterBase(
  ctx: CanvasRenderingContext2D,
  bx: number,
  y0: number,
  top: string,
  front: string,
): void {
  ctx.fillStyle = front;
  ctx.fillRect(bx, y0 + 12, 4 * T, T - 12);
  ctx.fillStyle = shade(front, -0.24);
  ctx.fillRect(bx, y0 + T - 3, 4 * T, 3);
  ctx.fillStyle = top;
  ctx.fillRect(bx, y0, 4 * T, 12);
  ctx.fillStyle = shade(top, -0.2);
  ctx.fillRect(bx, y0 + 12, 4 * T, 2);
}

/** The classic counter clutter (laptop, flyers, maybe a mug), seeded. */
function counterClutter(ctx: CanvasRenderingContext2D, o: BoothArtOpts, y0: number): void {
  const bx = o.bx;
  const r = rand(o.seed ^ 0x9e3779b9);
  const laptopSlot = Math.floor(r() * 4);
  const flyerSlot = (laptopSlot + 1 + Math.floor(r() * 3)) % 4;
  const hasMug = r() < 0.75;
  const mugSlot = (flyerSlot + 1 + Math.floor(r() * 2)) % 4;
  const mugColor = shade(o.theme.banner, -0.1);
  const lx = bx + laptopSlot * T;
  ctx.fillStyle = "#33302A";
  ctx.fillRect(lx + 8, y0 - 2, 16, 10);
  ctx.fillStyle = "#4A463E";
  ctx.fillRect(lx + 8, y0 - 2, 16, 2);
  ctx.fillStyle = mugColor;
  ctx.fillRect(lx + 15, y0 + 2, 2, 2);
  const fx = bx + flyerSlot * T;
  ctx.fillStyle = CARD;
  ctx.fillRect(fx + 10, y0 + 1, 14, 9);
  ctx.strokeStyle = CARD_LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(fx + 10.5, y0 + 1.5, 13, 8);
  ctx.fillStyle = "#D9480F";
  ctx.fillRect(fx + 12, y0 + 3, 10, 1);
  ctx.fillStyle = MUTED;
  ctx.fillRect(fx + 12, y0 + 5, 8, 1);
  ctx.fillRect(fx + 12, y0 + 7, 9, 1);
  if (hasMug) {
    const mx = bx + mugSlot * T;
    ctx.fillStyle = mugColor;
    ctx.fillRect(mx + 13, y0 - 1, 6, 7);
    ctx.fillRect(mx + 19, y0 + 1, 2, 3);
  }
}

// ---------- classic ----------

function bannerClassic(ctx: CanvasRenderingContext2D, o: BoothArtOpts): void {
  const { bx, by } = o;
  const { face, fg, dark } = signColors(o.theme);
  ctx.fillStyle = dark;
  ctx.fillRect(bx, by, 4 * T, T);
  ctx.fillStyle = face;
  ctx.fillRect(bx + 3, by - 8, 4 * T - 6, T + 4);
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  ctx.strokeRect(bx + 4, by - 7, 4 * T - 8, T + 2);
  signAndIcon(ctx, o, bx + 8, by, bx + 2 * T + 7, by + 9, 4 * T - 44, fg);
  trimBand(ctx, o);
}

function counterClassic(ctx: CanvasRenderingContext2D, o: BoothArtOpts, y0: number): void {
  counterBase(ctx, o.bx, y0, WOOD_TOP, WOOD_FRONT);
  counterClutter(ctx, o, y0);
}

// ---------- big top ----------

function bannerBigtop(ctx: CanvasRenderingContext2D, o: BoothArtOpts): void {
  const { bx, by } = o;
  const { face, dark } = signColors(o.theme);
  const stripeB = luma(face) > 0.8 ? shade(face, -0.25) : PAPER;
  // tent canvas: three stepped bands widening toward the bottom
  // (integer insets — fractional edges would smear on the pixel grid)
  const bands: [number, number, number][] = [
    // [xInset, yTop, height]
    [44, by - 14, 6],
    [23, by - 8, 8],
    [2, by, T],
  ];
  for (const [inset, y, h] of bands) {
    const w = 4 * T - inset * 2;
    for (let x = 0; x < w; x += 8) {
      ctx.fillStyle = Math.floor((x + inset) / 8) % 2 ? stripeB : face;
      ctx.fillRect(bx + inset + x, y, Math.min(8, w - x), h);
    }
  }
  // scalloped hem along the bottom edge
  for (let x = 0; x < 4 * T - 4; x += 8) {
    ctx.fillStyle = Math.floor(x / 8) % 2 ? stripeB : face;
    ctx.fillRect(bx + 2 + x, by + T - 4, 8, 4);
    ctx.fillStyle = dark;
    ctx.fillRect(bx + 2 + x + 2, by + T, 4, 2);
  }
  // peak pole + flag
  ctx.fillStyle = dark;
  ctx.fillRect(bx + 2 * T - 1, by - 22, 2, 9);
  ctx.fillStyle = face;
  ctx.fillRect(bx + 2 * T + 1, by - 22, 8, 5);
  // side poles
  ctx.fillStyle = shade(dark, -0.2);
  ctx.fillRect(bx + 1, by - 2, 3, T + 2);
  ctx.fillRect(bx + 4 * T - 4, by - 2, 3, T + 2);
  // hanging wooden sign board
  ctx.fillStyle = shade(WOOD_FRONT, -0.35);
  ctx.fillRect(bx + T + 6, by + 2, 1, 5);
  ctx.fillRect(bx + 3 * T - 7, by + 2, 1, 5);
  ctx.fillStyle = WOOD_TOP;
  ctx.fillRect(bx + T - 4, by + 7, 2 * T + 8, 15);
  ctx.strokeStyle = shade(WOOD_TOP, -0.35);
  ctx.lineWidth = 2;
  ctx.strokeRect(bx + T - 3, by + 8, 2 * T + 6, 13);
  signAndIcon(ctx, o, bx + T, by + 7, bx + 2 * T + 8, by + 15, 2 * T - 16, INK);
}

function counterBigtop(ctx: CanvasRenderingContext2D, o: BoothArtOpts, y0: number): void {
  const { face } = signColors(o.theme);
  const stripeB = luma(face) > 0.8 ? shade(face, -0.25) : PAPER;
  // trestle table with a striped cloth skirt
  counterBase(ctx, o.bx, y0, WOOD_TOP, shade(face, -0.12));
  for (let x = 0; x < 4 * T; x += 8) {
    ctx.fillStyle = Math.floor(x / 8) % 2 ? stripeB : shade(face, -0.12);
    ctx.fillRect(o.bx + x, y0 + 14, Math.min(8, 4 * T - x), T - 17);
  }
  counterClutter(ctx, o, y0);
}

// ---------- garden ----------

function bannerGarden(ctx: CanvasRenderingContext2D, o: BoothArtOpts): void {
  const { bx, by } = o;
  const { face } = signColors(o.theme);
  // lattice back wall
  ctx.fillStyle = LATTICE;
  ctx.fillRect(bx, by, 4 * T, T);
  ctx.fillStyle = shade(LATTICE, -0.22);
  for (let x = 0; x < 4 * T; x += 6) ctx.fillRect(bx + x, by, 1, T);
  for (let y = 0; y < T; y += 6) ctx.fillRect(bx, by + y, 4 * T, 1);
  // pergola beam with rafter nubs
  ctx.fillStyle = WOOD_FRONT;
  ctx.fillRect(bx - 2, by - 8, 4 * T + 4, 5);
  ctx.fillStyle = shade(WOOD_FRONT, -0.25);
  for (let x = 4; x < 4 * T; x += 12) ctx.fillRect(bx + x, by - 3, 4, 3);
  // draped vines from the beam
  for (let x = 2; x < 4 * T - 4; x += 10) {
    const drop = 4 + ((x * 7) % 9);
    ctx.fillStyle = LEAF_B;
    ctx.fillRect(bx + x, by - 3, 2, drop);
    ctx.fillStyle = LEAF_A;
    ctx.fillRect(bx + x - 1, by - 4 + drop, 4, 3);
  }
  // wooden sign plaque with a bloom-colored border
  ctx.fillStyle = WOOD_TOP;
  ctx.fillRect(bx + T - 6, by + 4, 2 * T + 12, 18);
  ctx.strokeStyle = face;
  ctx.lineWidth = 2;
  ctx.strokeRect(bx + T - 5, by + 5, 2 * T + 10, 16);
  signAndIcon(ctx, o, bx + T - 2, by + 5, bx + 2 * T + 8, by + 13, 2 * T - 12, INK);
  // planter boxes at the wall base, flowers in the banner color
  for (const px of [bx + 4, bx + 4 * T - 26]) {
    ctx.fillStyle = shade(POT, -0.15);
    ctx.fillRect(px, by + T - 8, 22, 8);
    ctx.fillStyle = LEAF_A;
    ctx.fillRect(px + 1, by + T - 12, 20, 5);
    ctx.fillStyle = face;
    for (let i = 0; i < 3; i++) ctx.fillRect(px + 3 + i * 7, by + T - 14, 3, 3);
  }
}

function counterGarden(ctx: CanvasRenderingContext2D, o: BoothArtOpts, y0: number): void {
  // grass-topped planter counter
  counterBase(ctx, o.bx, y0, LEAF_A, WOOD_FRONT);
  ctx.fillStyle = LEAF_B;
  for (let x = 2; x < 4 * T; x += 7) ctx.fillRect(o.bx + x, y0 + 1, 2, 4);
  counterClutter(ctx, o, y0);
}

// ---------- arcade ----------

function bannerArcade(ctx: CanvasRenderingContext2D, o: BoothArtOpts): void {
  const { bx, by } = o;
  const { face } = signColors(o.theme);
  const glow = shade(face, 0.3);
  // cabinet body, taller than the wall
  ctx.fillStyle = CABINET;
  ctx.fillRect(bx, by - 12, 4 * T, T + 12);
  ctx.fillStyle = shade(CABINET, 0.15);
  ctx.fillRect(bx, by - 12, 2, T + 12);
  ctx.fillRect(bx + 4 * T - 2, by - 12, 2, T + 12);
  // marquee: sign text over the banner color, framed by chase lights
  ctx.fillStyle = shade(face, -0.25);
  ctx.fillRect(bx + 3, by - 10, 4 * T - 6, 12);
  for (let x = 0; x < 4 * T - 10; x += 8) {
    ctx.fillStyle = Math.floor(x / 8) % 2 ? GOLD : PAPER;
    ctx.fillRect(bx + 6 + x, by - 9, 3, 2);
  }
  ctx.fillStyle = luma(face) > 0.62 ? INK : "#FFFDF5";
  ctx.font = SIGN_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(o.theme.sign.toUpperCase(), bx + 2 * T, by - 3, 4 * T - 24);
  // screen: glowing center, scanlines, the glyph/logo as the game running
  ctx.fillStyle = shade(face, -0.5);
  ctx.fillRect(bx + 6, by + 4, 4 * T - 12, T - 6);
  ctx.fillStyle = glow;
  ctx.fillRect(bx + 8, by + 6, 4 * T - 16, T - 10);
  if (o.logoImg) ctx.drawImage(o.logoImg, bx + 2 * T - 8, by + 6, 16, 16);
  else drawGlyph(ctx, o.theme.glyph as GlyphId, bx + 2 * T - 6, by + 7, 13, shade(face, -0.55));
  ctx.fillStyle = rgba(INK, 0.22);
  for (let y = by + 6; y < by + T - 5; y += 3) ctx.fillRect(bx + 8, y, 4 * T - 16, 1);
}

function counterArcade(ctx: CanvasRenderingContext2D, o: BoothArtOpts, y0: number): void {
  const { face } = signColors(o.theme);
  // control deck: dark console with buttons and a joystick
  counterBase(ctx, o.bx, y0, shade(CABINET, 0.22), CABINET);
  ctx.fillStyle = ACCENT_RED;
  ctx.fillRect(o.bx + T + 4, y0 + 3, 5, 5);
  ctx.fillStyle = GOLD;
  ctx.fillRect(o.bx + T + 14, y0 + 3, 5, 5);
  ctx.fillStyle = shade(face, 0.3);
  ctx.fillRect(o.bx + T + 24, y0 + 3, 5, 5);
  // joystick
  ctx.fillStyle = shade(CABINET, 0.35);
  ctx.fillRect(o.bx + 2 * T + 14, y0 + 2, 2, 7);
  ctx.fillStyle = ACCENT_RED;
  ctx.fillRect(o.bx + 2 * T + 12, y0, 6, 4);
  // coin door on the front
  ctx.fillStyle = shade(CABINET, 0.18);
  ctx.fillRect(o.bx + 2 * T - 7, y0 + 17, 14, 10);
  ctx.fillStyle = GOLD;
  ctx.fillRect(o.bx + 2 * T - 2, y0 + 20, 4, 1);
}

// ---------- neon ----------

function bannerNeon(ctx: CanvasRenderingContext2D, o: BoothArtOpts): void {
  const { bx, by } = o;
  const { face } = signColors(o.theme);
  const tube = shade(face, 0.45);
  // dark stage backdrop
  ctx.fillStyle = STAGE;
  ctx.fillRect(bx, by - 8, 4 * T, T + 8);
  // neon tube frame: soft halo, bright core, hot inner line
  ctx.fillStyle = rgba(face, 0.35);
  ctx.fillRect(bx + 2, by - 7, 4 * T - 4, 5);
  ctx.fillRect(bx + 2, by + T - 6, 4 * T - 4, 5);
  ctx.fillRect(bx + 2, by - 7, 5, T + 6);
  ctx.fillRect(bx + 4 * T - 7, by - 7, 5, T + 6);
  ctx.strokeStyle = tube;
  ctx.lineWidth = 2;
  ctx.strokeRect(bx + 4, by - 5, 4 * T - 8, T + 2);
  ctx.strokeStyle = shade(face, 0.7);
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 4, by - 5, 4 * T - 8, T + 2);
  // sign + icon glow in the tube color
  if (o.logoImg) ctx.drawImage(o.logoImg, bx + 8, by, 16, 16);
  else drawGlyph(ctx, o.theme.glyph as GlyphId, bx + 10, by + 1, 14, tube);
  ctx.fillStyle = rgba(face, 0.4);
  ctx.font = SIGN_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(o.theme.sign.toUpperCase(), bx + 2 * T + 8, by + 10, 4 * T - 44);
  ctx.fillStyle = tube;
  ctx.fillText(o.theme.sign.toUpperCase(), bx + 2 * T + 7, by + 9, 4 * T - 44);
}

function counterNeon(ctx: CanvasRenderingContext2D, o: BoothArtOpts, y0: number): void {
  const { face } = signColors(o.theme);
  const tube = shade(face, 0.45);
  counterBase(ctx, o.bx, y0, shade(STAGE, 0.18), STAGE);
  // neon underglow strip along the counter front
  ctx.fillStyle = rgba(face, 0.3);
  ctx.fillRect(o.bx + 2, y0 + T - 6, 4 * T - 4, 4);
  ctx.fillStyle = tube;
  ctx.fillRect(o.bx + 2, y0 + T - 5, 4 * T - 4, 1);
  counterClutter(ctx, o, y0);
}

// ---------- props ----------

function propBalloons(ctx: CanvasRenderingContext2D, o: BoothArtOpts): void {
  const { face } = signColors(o.theme);
  const x = o.bx + 4 * T - 8;
  const y = o.by - 12;
  // strings tied to the right post
  ctx.strokeStyle = rgba(INK, 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 2);
  ctx.lineTo(x - 1, y + 12);
  ctx.moveTo(x + 1, y - 5);
  ctx.lineTo(x - 1, y + 12);
  ctx.moveTo(x + 6, y - 1);
  ctx.lineTo(x - 1, y + 12);
  ctx.stroke();
  const balloon = (cx: number, cy: number, color: string): void => {
    ctx.fillStyle = color;
    ctx.fillRect(cx - 3, cy - 4, 7, 8);
    ctx.fillRect(cx - 4, cy - 3, 9, 6);
    ctx.fillStyle = rgba("#FFFFFF", 0.5);
    ctx.fillRect(cx - 2, cy - 3, 2, 2);
  };
  balloon(x - 5, y - 6, face);
  balloon(x + 2, y - 9, shade(face, 0.25));
  balloon(x + 7, y - 4, GOLD);
}

function propSpotlight(ctx: CanvasRenderingContext2D, o: BoothArtOpts): void {
  const { bx, by } = o;
  const laneMidX = bx + 2 * T;
  const laneY = by + 2 * T - 2;
  for (const [hx, dir] of [
    [bx + 6, 1],
    [bx + 4 * T - 6, -1],
  ] as const) {
    // warm beam down toward the lane center
    ctx.fillStyle = "rgba(255,238,180,0.26)";
    ctx.beginPath();
    ctx.moveTo(hx, by - 8);
    ctx.lineTo(laneMidX + dir * 6, laneY);
    ctx.lineTo(laneMidX - dir * 14, laneY);
    ctx.closePath();
    ctx.fill();
    // housing
    ctx.fillStyle = "#33302A";
    ctx.fillRect(hx - 4, by - 14, 8, 7);
    ctx.fillStyle = "#FFEEB4";
    ctx.fillRect(hx - 2, by - 9, 4, 2);
  }
}

function propPlant(ctx: CanvasRenderingContext2D, o: BoothArtOpts): void {
  // tall monstera in the founder lane's left corner
  const x = o.bx + 2;
  const y = o.by + T + 2;
  ctx.fillStyle = shade(POT, -0.25);
  ctx.fillRect(x + 3, y + 22, 14, 3);
  ctx.fillStyle = POT;
  ctx.fillRect(x + 4, y + 15, 12, 8);
  ctx.fillStyle = shade(POT, 0.15);
  ctx.fillRect(x + 2, y + 13, 16, 3);
  ctx.fillStyle = LEAF_B;
  ctx.fillRect(x + 4, y + 2, 12, 12);
  ctx.fillStyle = LEAF_A;
  ctx.fillRect(x + 6, y - 3, 8, 9);
  ctx.fillRect(x + 1, y + 4, 7, 7);
  ctx.fillRect(x + 12, y + 4, 7, 7);
  ctx.fillStyle = shade(LEAF_A, 0.18);
  ctx.fillRect(x + 8, y - 1, 3, 3);
}

function propTrophy(ctx: CanvasRenderingContext2D, o: BoothArtOpts, y0: number): void {
  // golden cup at the right end of the counter
  const x = o.bx + 4 * T - 16;
  ctx.fillStyle = shade(GOLD, -0.3);
  ctx.fillRect(x + 1, y0 + 6, 10, 2);
  ctx.fillStyle = GOLD;
  ctx.fillRect(x + 4, y0 + 3, 4, 4);
  ctx.fillRect(x + 2, y0 - 4, 8, 7);
  ctx.fillRect(x, y0 - 3, 2, 4);
  ctx.fillRect(x + 10, y0 - 3, 2, 4);
  ctx.fillStyle = shade(GOLD, 0.35);
  ctx.fillRect(x + 3, y0 - 3, 2, 3);
}
