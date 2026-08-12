/**
 * FounderFloor — hall dressing: the fountain, the plaza it stands in, the
 * avenues running out of it, and the furniture along them.
 *
 * Everything here is drawn in the same flat pixel idiom as the booths: no
 * assets, no gradients, hard edges, a 1px darker lip under every surface.
 * Curves are scanline-filled with integer fillRects rather than ctx.arc,
 * because an antialiased ellipse next to a hand-placed 32px booth reads as
 * two different games.
 *
 * Cost: the fountain and the plaza paving are the two most expensive things
 * in the hall to draw, and both are almost entirely static, so both are
 * baked once onto offscreen canvases and blitted. The fountain bakes in TWO
 * halves — the basin behind the water, the pedestal and bowls in front of
 * it — so the animated water can be painted between them without redrawing
 * a few hundred scanlines every frame.
 */

import { TILE } from "../lib/types";
import type { PlazaDef, TileRect } from "../lib/types";
import { shade } from "./sprites";
import type { Cam, Drawable } from "./tilemap";

const T = TILE;

// ---------- palette ----------

const STONE_LIGHT = "#CFC8B8";
const STONE = "#B9B1A0";
const STONE_MID = "#A29A88";
const STONE_DARK = "#847C6C";
const STONE_DEEP = "#666052";

const WATER_DEEP = "#2F6B84";
const WATER = "#3F87A2";
const WATER_LIGHT = "#63A9C0";
const FOAM = "#BFE0EA";
const SPARK = "#F2FAFC";

const BRASS = "#B08D2E";
const BRASS_BRIGHT = "#DCC06B";
const BRASS_DEEP = "#7A611F";

const INK = "#23201A";
const PAPER = "#FFFDF5";
const MUTED = "#6F6A5E";
const ACCENT = "#D9480F";

const LEAF_A = "#4C7A4F";
const LEAF_B = "#3A6440";
const LEAF_HI = "#6D9A63";
const POT = "#A6633C";

const WOOD_TOP = "#D9C79B";
const WOOD_FRONT = "#A28457";

const ROPE = "#8C2F2F";

/** Inclusive tile rect -> world-pixel box. */
function box(r: TileRect): { x: number; y: number; w: number; h: number } {
  return {
    x: r.x0 * T,
    y: r.y0 * T,
    w: (r.x1 - r.x0 + 1) * T,
    h: (r.y1 - r.y0 + 1) * T,
  };
}

// ---------- pixel curve helpers ----------

/**
 * Scanline-filled ellipse. Every row is one integer fillRect, so the edge
 * steps in whole pixels exactly like the rest of the art instead of
 * feathering the way ctx.ellipse would.
 */
function pixEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string
): void {
  ctx.fillStyle = color;
  const top = Math.round(cy - ry);
  const bot = Math.round(cy + ry);
  for (let y = top; y <= bot; y++) {
    const dy = (y + 0.5 - cy) / ry;
    const k = 1 - dy * dy;
    if (k <= 0) continue;
    const half = Math.round(rx * Math.sqrt(k));
    if (half <= 0) continue;
    ctx.fillRect(Math.round(cx - half), y, half * 2, 1);
  }
}

/** The outline band of an ellipse, `w` px thick, drawn inward from the edge. */
function pixEllipseRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  w: number,
  color: string,
  alpha = 1
): void {
  if (rx <= w || ry <= w) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const top = Math.round(cy - ry);
  const bot = Math.round(cy + ry);
  const irx = rx - w;
  const iry = ry - w;
  for (let y = top; y <= bot; y++) {
    const dy = (y + 0.5 - cy) / ry;
    const k = 1 - dy * dy;
    if (k <= 0) continue;
    const outer = Math.round(rx * Math.sqrt(k));
    const dyi = (y + 0.5 - cy) / iry;
    const ki = 1 - dyi * dyi;
    const inner = ki > 0 ? Math.round(irx * Math.sqrt(ki)) : 0;
    if (inner <= 0) {
      ctx.fillRect(Math.round(cx - outer), y, outer * 2, 1);
    } else {
      ctx.fillRect(Math.round(cx - outer), y, outer - inner, 1);
      ctx.fillRect(Math.round(cx + inner), y, outer - inner, 1);
    }
  }
  ctx.restore();
}

/** An offscreen canvas, or null under SSR / a dead 2d context. */
function offscreen(w: number, h: number): {
  cv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} | null {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = Math.max(1, Math.ceil(w));
  cv.height = Math.max(1, Math.ceil(h));
  const c = cv.getContext("2d");
  if (!c) return null;
  c.imageSmoothingEnabled = false;
  return { cv, ctx: c };
}

// ======================================================================
// GROUND — the paved plaza and the avenue runners
// ======================================================================

const PAVE_A = "#C6BFAE";
const PAVE_B = "#BEB6A4";
const PAVE_LINE = "#A79F8D";
const PAVE_INLAY = "#9C9482";
const RUNNER = "#B4A98F";
const RUNNER_EDGE = "#9A8F76";

/**
 * The plaza floor, baked once: octagonal stone paving, a double inlaid ring
 * around the fountain, a compass rose, and a darker border course. Blitted
 * 1:1 from the bake, so the per-frame cost is one clipped drawImage.
 */
export class PlazaGround {
  private baked: HTMLCanvasElement | null = null;
  private readonly bx: number;
  private readonly by: number;
  private readonly bw: number;
  private readonly bh: number;

  constructor(private plaza: PlazaDef) {
    const b = box(plaza.rect);
    this.bx = b.x;
    this.by = b.y;
    this.bw = b.w;
    this.bh = b.h;
  }

  private bake(): HTMLCanvasElement | null {
    if (this.baked) return this.baked;
    const off = offscreen(this.bw, this.bh);
    if (!off) return null;
    const { ctx } = off;
    const w = this.bw;
    const h = this.bh;
    const cx = w / 2;
    const cy = h / 2;
    // The plaza reads as an octagon: corner triangles stay checkerboard, so
    // the paving has a shape rather than being a rectangle of a new colour.
    const cut = Math.round(Math.min(w, h) * 0.24);

    const inOctagon = (x: number, y: number): boolean => {
      const dx = x < cut ? cut - x : x > w - cut ? x - (w - cut) : 0;
      const dy = y < cut ? cut - y : y > h - cut ? y - (h - cut) : 0;
      return dx + dy <= cut;
    };

    // stone courses, 16px, offset every other row like real slabbing
    for (let y = 0; y < h; y += 16) {
      const odd = (y / 16) & 1;
      for (let x = odd ? -8 : 0; x < w; x += 16) {
        if (!inOctagon(x + 8, y + 8)) continue;
        ctx.fillStyle = ((x / 16 + y / 16) | 0) & 1 ? PAVE_A : PAVE_B;
        ctx.fillRect(x, y, 16, 16);
        ctx.fillStyle = PAVE_LINE;
        ctx.fillRect(x, y + 15, 16, 1);
        ctx.fillRect(x + 15, y, 1, 16);
      }
    }

    // Compass rose: eight rays from the centre, long on the axes. Drawn
    // BEFORE the octagon clip below — its diagonals reach past the cut
    // corners, and unclipped they trailed off across the checkerboard like
    // scratches on the floor.
    ctx.save();
    ctx.globalAlpha = 0.5;
    const rOut = Math.min(w, h) * 0.42;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const long = i % 2 === 0;
      const len = long ? rOut : rOut * 0.6;
      const spread = long ? 13 : 8;
      ctx.fillStyle = long ? PAVE_INLAY : PAVE_LINE;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.lineTo(cx + Math.cos(a + Math.PI / 2) * spread, cy + Math.sin(a + Math.PI / 2) * spread);
      ctx.lineTo(cx + Math.cos(a - Math.PI / 2) * spread, cy + Math.sin(a - Math.PI / 2) * spread);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // clip the courses back to the octagon edge, then draw a border course
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(cut, 0);
    ctx.lineTo(w - cut, 0);
    ctx.lineTo(w, cut);
    ctx.lineTo(w, h - cut);
    ctx.lineTo(w - cut, h);
    ctx.lineTo(cut, h);
    ctx.lineTo(0, h - cut);
    ctx.lineTo(0, cut);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = PAVE_INLAY;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cut, 1.5);
    ctx.lineTo(w - cut, 1.5);
    ctx.lineTo(w - 1.5, cut);
    ctx.lineTo(w - 1.5, h - cut);
    ctx.lineTo(w - cut, h - 1.5);
    ctx.lineTo(cut, h - 1.5);
    ctx.lineTo(1.5, h - cut);
    ctx.lineTo(1.5, cut);
    ctx.closePath();
    ctx.stroke();

    // two inlaid rings around where the fountain will stand
    const fb = box(this.plaza.fountain);
    const fcx = fb.x - this.bx + fb.w / 2;
    const fcy = fb.y - this.by + fb.h / 2;
    pixEllipseRing(ctx, fcx, fcy, fb.w * 0.78, fb.h * 0.52, 3, PAVE_INLAY, 0.9);
    pixEllipseRing(ctx, fcx, fcy, fb.w * 0.9, fb.h * 0.6, 2, PAVE_LINE, 0.75);

    this.baked = off.cv;
    return this.baked;
  }

  /** Paint the visible part of the plaza. Call from BuiltFloor.drawUnder. */
  draw(ctx: CanvasRenderingContext2D, cam: Cam): void {
    const img = this.bake();
    if (!img) return;
    const x0 = Math.max(this.bx, Math.floor(cam.x));
    const y0 = Math.max(this.by, Math.floor(cam.y));
    const x1 = Math.min(this.bx + this.bw, Math.ceil(cam.x + cam.w));
    const y1 = Math.min(this.by + this.bh, Math.ceil(cam.y + cam.h));
    if (x1 <= x0 || y1 <= y0) return;
    ctx.drawImage(img, x0 - this.bx, y0 - this.by, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
  }
}

/**
 * An avenue runner: a wide band of smoother stone with a darker kerb down
 * each long edge, so the walkways read as routes rather than gaps between
 * the furniture. Cheap enough to paint per frame — it is flat fills.
 */
export function drawAvenue(ctx: CanvasRenderingContext2D, av: TileRect, cam: Cam): void {
  const b = box(av);
  if (b.x + b.w < cam.x || b.x > cam.x + cam.w) return;
  if (b.y + b.h < cam.y || b.y > cam.y + cam.h) return;
  const x = Math.max(b.x, Math.floor(cam.x));
  const w = Math.min(b.x + b.w, Math.ceil(cam.x + cam.w)) - x;
  const y = Math.max(b.y, Math.floor(cam.y));
  const h = Math.min(b.y + b.h, Math.ceil(cam.y + cam.h)) - y;
  if (w <= 0 || h <= 0) return;

  ctx.fillStyle = RUNNER;
  ctx.fillRect(x, y, w, h);

  const horizontal = b.w >= b.h;
  ctx.fillStyle = RUNNER_EDGE;
  if (horizontal) {
    ctx.fillRect(x, b.y, w, 3);
    ctx.fillRect(x, b.y + b.h - 3, w, 3);
    // sleeper lines across the run
    ctx.fillStyle = shade(RUNNER, -0.07);
    for (let sx = Math.floor(b.x / 24) * 24; sx < x + w; sx += 24) {
      if (sx < x) continue;
      ctx.fillRect(sx, b.y + 3, 2, b.h - 6);
    }
  } else {
    ctx.fillRect(b.x, y, 3, h);
    ctx.fillRect(b.x + b.w - 3, y, 3, h);
    ctx.fillStyle = shade(RUNNER, -0.07);
    for (let sy = Math.floor(b.y / 24) * 24; sy < y + h; sy += 24) {
      if (sy < y) continue;
      ctx.fillRect(b.x + 3, sy, b.w - 6, 2);
    }
  }
}

// ======================================================================
// THE FOUNTAIN
// ======================================================================

interface FountainGeom {
  cx: number;
  baseY: number;
  rx: number;
  ry: number;
  bottom: number;
  midY: number;
  midRx: number;
  midRy: number;
  topY: number;
  topRx: number;
  topRy: number;
  finialY: number;
}

function fountainGeom(rect: TileRect): FountainGeom {
  const b = box(rect);
  const cx = b.x + b.w / 2;
  const bottom = b.y + b.h;
  // the basin sits low in the footprint; the tiers rise out of the top of it
  const baseY = b.y + b.h * 0.66;
  const rx = b.w / 2 - 5;
  const ry = b.h * 0.27;
  return {
    cx,
    baseY,
    rx,
    ry,
    bottom,
    midY: baseY - ry - 22,
    midRx: rx * 0.5,
    midRy: ry * 0.34,
    topY: baseY - ry - 60,
    topRx: rx * 0.28,
    topRy: ry * 0.2,
    finialY: baseY - ry - 78,
  };
}

/** Basin and everything BEHIND the water surface. */
function bakeBasin(g: FountainGeom, w: number, h: number, ox: number, oy: number): HTMLCanvasElement | null {
  const off = offscreen(w, h);
  if (!off) return null;
  const { ctx } = off;
  const cx = g.cx - ox;
  const by = g.baseY - oy;

  // contact shadow on the paving
  ctx.save();
  ctx.globalAlpha = 0.18;
  pixEllipse(ctx, cx, by + g.ry * 0.75, g.rx + 6, g.ry * 0.5, "#000000");
  ctx.restore();

  // the basin's front wall: the same ellipse dropped a few px, in shadow
  pixEllipse(ctx, cx, by + 12, g.rx, g.ry, STONE_DEEP);
  pixEllipse(ctx, cx, by + 8, g.rx, g.ry, STONE_DARK);
  // the rim itself
  pixEllipse(ctx, cx, by, g.rx, g.ry, STONE_LIGHT);
  pixEllipseRing(ctx, cx, by, g.rx, g.ry, 4, STONE, 1);
  // moulding: a brass band let into the rim
  pixEllipseRing(ctx, cx, by, g.rx - 5, g.ry - 3, 2, BRASS, 0.75);
  // the inner wall of the bowl, darker as it goes down
  pixEllipse(ctx, cx, by + 2, g.rx - 9, g.ry - 6, STONE_MID);
  pixEllipse(ctx, cx, by + 3, g.rx - 12, g.ry - 8, STONE_DARK);

  // still water, before the animation goes on top
  pixEllipse(ctx, cx, by + 3, g.rx - 14, g.ry - 9, WATER_DEEP);
  pixEllipse(ctx, cx, by + 4, g.rx - 16, g.ry - 11, WATER);

  return off.cv;
}

/** The pedestal, bowls and finial — everything IN FRONT of the water. */
function bakeTiers(g: FountainGeom, w: number, h: number, ox: number, oy: number): HTMLCanvasElement | null {
  const off = offscreen(w, h);
  if (!off) return null;
  const { ctx } = off;
  const cx = g.cx - ox;
  const by = g.baseY - oy;
  const midY = g.midY - oy;
  const topY = g.topY - oy;
  const finY = g.finialY - oy;

  // lower column, tapered
  for (let y = midY; y < by + 6; y++) {
    const k = (y - midY) / Math.max(1, by + 6 - midY);
    const half = Math.round(11 + k * 9);
    ctx.fillStyle = STONE;
    ctx.fillRect(Math.round(cx - half), y, half * 2, 1);
    ctx.fillStyle = shade(STONE, 0.16);
    ctx.fillRect(Math.round(cx - half), y, 3, 1);
    ctx.fillStyle = STONE_DARK;
    ctx.fillRect(Math.round(cx + half - 3), y, 3, 1);
  }

  // middle bowl
  pixEllipse(ctx, cx, midY + 7, g.midRx, g.midRy, STONE_DARK);
  pixEllipse(ctx, cx, midY, g.midRx, g.midRy, STONE_LIGHT);
  pixEllipseRing(ctx, cx, midY, g.midRx, g.midRy, 3, STONE, 1);
  pixEllipse(ctx, cx, midY + 1, g.midRx - 6, g.midRy - 3, WATER);
  pixEllipse(ctx, cx, midY + 1, g.midRx - 9, g.midRy - 5, WATER_LIGHT);

  // upper column
  for (let y = topY; y < midY; y++) {
    const k = (y - topY) / Math.max(1, midY - topY);
    const half = Math.round(5 + k * 5);
    ctx.fillStyle = STONE;
    ctx.fillRect(Math.round(cx - half), y, half * 2, 1);
    ctx.fillStyle = shade(STONE, 0.16);
    ctx.fillRect(Math.round(cx - half), y, 2, 1);
    ctx.fillStyle = STONE_DARK;
    ctx.fillRect(Math.round(cx + half - 2), y, 2, 1);
  }

  // top bowl
  pixEllipse(ctx, cx, topY + 5, g.topRx, g.topRy, STONE_DARK);
  pixEllipse(ctx, cx, topY, g.topRx, g.topRy, STONE_LIGHT);
  pixEllipse(ctx, cx, topY + 1, g.topRx - 4, g.topRy - 2, WATER_LIGHT);

  // finial: a small brass star on a stem
  ctx.fillStyle = STONE;
  ctx.fillRect(Math.round(cx - 2), Math.round(finY + 6), 4, Math.round(topY - finY - 5));
  ctx.fillStyle = BRASS;
  ctx.fillRect(Math.round(cx - 5), Math.round(finY + 2), 10, 4);
  ctx.fillRect(Math.round(cx - 2), Math.round(finY - 2), 4, 12);
  ctx.fillStyle = BRASS_BRIGHT;
  ctx.fillRect(Math.round(cx - 4), Math.round(finY + 2), 3, 2);
  ctx.fillRect(Math.round(cx - 1), Math.round(finY - 1), 2, 3);

  // brass plaque on the front of the basin
  const px = Math.round(cx - 20);
  const py = Math.round(by + g.ry - 4);
  ctx.fillStyle = BRASS_DEEP;
  ctx.fillRect(px, py, 40, 11);
  ctx.fillStyle = BRASS;
  ctx.fillRect(px + 1, py + 1, 38, 9);
  ctx.fillStyle = BRASS_DEEP;
  for (let i = 0; i < 3; i++) ctx.fillRect(px + 6, py + 3 + i * 3, 28 - i * 6, 1);

  return off.cv;
}

/**
 * The fountain: one drawable, sorted at the bottom of its footprint so
 * anybody standing in front of it draws over it and anybody behind it
 * doesn't. It is solid, so nobody is ever inside it and one sort key is
 * enough.
 */
export function fountainDrawable(rect: TileRect): Drawable {
  const g = fountainGeom(rect);
  const b = box(rect);
  // the tiers rise well above the tile footprint, so the bake is taller
  const ox = b.x - 8;
  const oy = g.finialY - 12;
  const w = b.w + 16;
  const h = b.y + b.h - oy + 8;

  let basin: HTMLCanvasElement | null = null;
  let tiers: HTMLCanvasElement | null = null;
  let baked = false;

  // Fixed sparkle seats on the water — random per frame would fizz.
  const sparks = [
    { a: 0.35, r: 0.55, p: 0.0 },
    { a: 2.1, r: 0.72, p: 0.4 },
    { a: 3.9, r: 0.48, p: 0.8 },
    { a: 5.2, r: 0.78, p: 1.6 },
    { a: 1.3, r: 0.86, p: 2.3 },
  ];

  return {
    sortY: b.y + b.h,
    minX: ox - 4,
    maxX: ox + w + 4,
    draw(ctx) {
      if (!baked) {
        basin = bakeBasin(g, w, h, ox, oy);
        tiers = bakeTiers(g, w, h, ox, oy);
        baked = true;
      }
      const t = performance.now() / 1000;

      if (basin) ctx.drawImage(basin, ox, oy);

      // ---- animated water in the main basin ----
      const wx = g.cx;
      const wy = g.baseY + 4;
      const wrx = g.rx - 16;
      const wry = g.ry - 11;

      // three ripple rings, each expanding from the pedestal and fading out
      for (let i = 0; i < 3; i++) {
        const phase = ((t * 0.42 + i / 3) % 1 + 1) % 1;
        const k = 0.22 + phase * 0.78;
        pixEllipseRing(
          ctx,
          wx,
          wy,
          wrx * k,
          wry * k,
          2,
          i === 1 ? FOAM : WATER_LIGHT,
          (1 - phase) * 0.5
        );
      }
      // a lighter crescent where the light falls
      pixEllipseRing(ctx, wx, wy - 1, wrx * 0.92, wry * 0.9, 2, WATER_LIGHT, 0.35);

      // sparkles
      ctx.save();
      for (const s of sparks) {
        const tw = Math.sin(t * 2.4 + s.p);
        if (tw < 0.35) continue;
        ctx.globalAlpha = Math.min(1, (tw - 0.35) / 0.65) * 0.85;
        ctx.fillStyle = SPARK;
        const px = Math.round(wx + Math.cos(s.a) * wrx * s.r);
        const py = Math.round(wy + Math.sin(s.a) * wry * s.r);
        ctx.fillRect(px, py, 2, 2);
        ctx.fillRect(px - 1, py + 1, 1, 1);
      }
      ctx.restore();

      if (tiers) ctx.drawImage(tiers, ox, oy);

      // ---- falling water, drawn over the stonework ----
      // sheets spilling off both bowl rims
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = FOAM;
      const wob = Math.sin(t * 3.1) * 1.2;
      for (const side of [-1, 1]) {
        const mx = Math.round(g.cx + side * (g.midRx - 3) + wob * side);
        ctx.fillRect(mx - 1, Math.round(g.midY + g.midRy - 2), 3, Math.round(g.baseY - g.midY - g.midRy - 2));
        const tx = Math.round(g.cx + side * (g.topRx - 2) - wob * side);
        ctx.fillRect(tx - 1, Math.round(g.topY + g.topRy - 1), 2, Math.round(g.midY - g.topY - g.topRy));
      }
      ctx.restore();

      // droplets peeling off the top bowl and arcing into the basin
      ctx.fillStyle = SPARK;
      for (let i = 0; i < 6; i++) {
        const ph = ((t * 0.9 + i / 6) % 1 + 1) % 1;
        const side = i % 2 === 0 ? -1 : 1;
        const spread = g.topRx + 4 + ph * (g.rx * 0.5);
        const dx = g.cx + side * spread;
        // parabola from the top bowl down to the water line
        const fall = g.baseY - g.topY;
        const dy = g.topY + ph * ph * fall;
        if (dy > g.baseY + 2) continue;
        ctx.globalAlpha = 0.9 - ph * 0.5;
        ctx.fillRect(Math.round(dx), Math.round(dy), 2, 3);
      }
      ctx.globalAlpha = 1;
    },
  };
}

// ======================================================================
// THE HALL SIGN
// ======================================================================

/**
 * The overhead gantry sign at the mouth of the south avenue: two posts, a
 * beam, and a hanging board with the floor's name on it. It is the first
 * thing in view when you arrive, because arriving somewhere and not being
 * told where you are is the cheapest kind of confusing.
 */
export function archDrawable(rect: TileRect, label: string, sub: string): Drawable {
  const b = box(rect);
  const leftX = b.x + 6;
  const rightX = b.x + b.w - 16;
  const beamY = b.y - 34;
  const footY = b.y + T - 2;

  return {
    sortY: footY,
    minX: b.x - 6,
    maxX: b.x + b.w + 6,
    draw(ctx) {
      // posts
      for (const px of [leftX, rightX]) {
        ctx.fillStyle = STONE_DARK;
        ctx.fillRect(px, beamY, 10, footY - beamY);
        ctx.fillStyle = STONE;
        ctx.fillRect(px, beamY, 7, footY - beamY);
        ctx.fillStyle = shade(STONE, 0.18);
        ctx.fillRect(px, beamY, 2, footY - beamY);
        // brass collars
        ctx.fillStyle = BRASS;
        ctx.fillRect(px - 2, beamY + 10, 14, 4);
        ctx.fillRect(px - 2, footY - 16, 14, 4);
        ctx.fillStyle = BRASS_BRIGHT;
        ctx.fillRect(px - 2, beamY + 10, 14, 1);
        // base plinth
        ctx.fillStyle = STONE_DEEP;
        ctx.fillRect(px - 4, footY - 6, 18, 6);
        ctx.fillStyle = STONE_MID;
        ctx.fillRect(px - 4, footY - 6, 18, 2);
      }

      // beam
      const bw = rightX + 10 - leftX;
      ctx.fillStyle = STONE_DEEP;
      ctx.fillRect(leftX - 6, beamY + 12, bw + 12, 5);
      ctx.fillStyle = STONE;
      ctx.fillRect(leftX - 6, beamY, bw + 12, 13);
      ctx.fillStyle = shade(STONE, 0.2);
      ctx.fillRect(leftX - 6, beamY, bw + 12, 3);
      ctx.fillStyle = BRASS;
      ctx.fillRect(leftX - 8, beamY - 3, 6, 18);
      ctx.fillRect(rightX + 12, beamY - 3, 6, 18);

      // the board itself, hung under the beam
      const sw = bw - 4;
      const sh = 30;
      const sx = leftX + 2;
      const sy = beamY + 17;
      ctx.fillStyle = INK;
      ctx.fillRect(sx - 2, sy - 2, sw + 4, sh + 4);
      ctx.fillStyle = "#2E2A22";
      ctx.fillRect(sx, sy, sw, sh);
      ctx.fillStyle = BRASS;
      ctx.fillRect(sx, sy, sw, 2);
      ctx.fillRect(sx, sy + sh - 2, sw, 2);
      // brass corner studs
      ctx.fillStyle = BRASS_BRIGHT;
      for (const [dx, dy] of [[2, 4], [sw - 5, 4], [2, sh - 7], [sw - 5, sh - 7]]) {
        ctx.fillRect(sx + dx, sy + dy, 3, 3);
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = PAPER;
      ctx.font = "700 13px Georgia, 'Times New Roman', serif";
      ctx.fillText(label.toUpperCase(), sx + sw / 2, sy + 12, sw - 14);
      ctx.fillStyle = BRASS_BRIGHT;
      ctx.font = "700 7px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(sub, sx + sw / 2, sy + 23, sw - 14);
    },
  };
}

// ======================================================================
// FURNITURE
// ======================================================================

/** A tall standing lamp with a warm pool of light under it. */
export function lampDrawable(tx: number, ty: number): Drawable {
  const x = tx * T + T / 2;
  const y = ty * T + T - 4;
  return {
    sortY: ty * T + T,
    minX: x - 14,
    maxX: x + 14,
    draw(ctx) {
      // light pool on the floor
      ctx.save();
      ctx.globalAlpha = 0.13;
      pixEllipse(ctx, x, y + 1, 15, 6, "#F6E2B0");
      ctx.restore();
      // base
      ctx.fillStyle = STONE_DEEP;
      ctx.fillRect(x - 7, y - 5, 14, 5);
      ctx.fillStyle = STONE_MID;
      ctx.fillRect(x - 7, y - 5, 14, 2);
      // column
      ctx.fillStyle = shade(BRASS_DEEP, -0.1);
      ctx.fillRect(x - 2, y - 40, 5, 36);
      ctx.fillStyle = BRASS;
      ctx.fillRect(x - 2, y - 40, 3, 36);
      ctx.fillStyle = BRASS_BRIGHT;
      ctx.fillRect(x - 2, y - 30, 1, 18);
      // lantern head
      ctx.fillStyle = BRASS_DEEP;
      ctx.fillRect(x - 7, y - 52, 15, 13);
      ctx.fillStyle = "#F6E2B0";
      ctx.fillRect(x - 5, y - 50, 11, 9);
      ctx.fillStyle = "#FFF6DC";
      ctx.fillRect(x - 4, y - 49, 5, 4);
      ctx.fillStyle = BRASS;
      ctx.fillRect(x - 8, y - 54, 17, 3);
      ctx.fillRect(x - 3, y - 57, 7, 3);
      // glow
      ctx.save();
      ctx.globalAlpha = 0.18;
      pixEllipse(ctx, x, y - 45, 16, 13, "#FFE9B8");
      ctx.restore();
    },
  };
}

/** A formal square planter with a clipped shrub in it. */
export function planterDrawable(tx: number, ty: number, seed: number): Drawable {
  const x = tx * T;
  const y = ty * T;
  const tall = seed % 2 === 0;
  return {
    sortY: y + T,
    minX: x - 2,
    maxX: x + T + 2,
    draw(ctx) {
      // planter box
      ctx.fillStyle = STONE_DEEP;
      ctx.fillRect(x + 3, y + 24, 26, 4);
      ctx.fillStyle = STONE_MID;
      ctx.fillRect(x + 4, y + 14, 24, 12);
      ctx.fillStyle = STONE_LIGHT;
      ctx.fillRect(x + 2, y + 11, 28, 4);
      ctx.fillStyle = STONE;
      ctx.fillRect(x + 4, y + 15, 24, 2);
      // brass band
      ctx.fillStyle = BRASS;
      ctx.fillRect(x + 4, y + 19, 24, 2);
      // soil
      ctx.fillStyle = "#4A3A2A";
      ctx.fillRect(x + 6, y + 12, 20, 2);
      // clipped shrub
      const top = tall ? y - 6 : y + 1;
      ctx.fillStyle = LEAF_B;
      ctx.fillRect(x + 7, top + 5, 18, 9);
      ctx.fillStyle = LEAF_A;
      ctx.fillRect(x + 9, top, 14, 9);
      ctx.fillRect(x + 5, top + 7, 6, 6);
      ctx.fillRect(x + 21, top + 7, 6, 6);
      ctx.fillStyle = LEAF_HI;
      ctx.fillRect(x + 12, top + 2, 5, 3);
      ctx.fillRect(x + 8, top + 8, 3, 2);
      if (tall) {
        ctx.fillStyle = LEAF_A;
        ctx.fillRect(x + 12, top - 5, 8, 6);
        ctx.fillStyle = LEAF_HI;
        ctx.fillRect(x + 14, top - 4, 3, 2);
      }
    },
  };
}

/**
 * A rope-and-post stanchion. Walk-through on purpose: a rim of solid posts
 * would turn the plaza into a pen, and the point of them is to say "this is
 * the centre of the room", not to stop anybody.
 */
export function stanchionDrawable(tx: number, ty: number, ropeRight: boolean): Drawable {
  const x = tx * T + T / 2;
  const y = ty * T + T - 6;
  return {
    sortY: ty * T + T - 8,
    minX: x - 8,
    maxX: x + T + 8,
    draw(ctx) {
      // the rope, slung to the next post
      if (ropeRight) {
        ctx.strokeStyle = ROPE;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 1, y - 17);
        ctx.quadraticCurveTo(x + T, y - 9, x + 2 * T - 1, y - 17);
        ctx.stroke();
        ctx.strokeStyle = shade(ROPE, 0.25);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 1, y - 18);
        ctx.quadraticCurveTo(x + T, y - 10, x + 2 * T - 1, y - 18);
        ctx.stroke();
      }
      // base
      ctx.fillStyle = STONE_DEEP;
      ctx.fillRect(x - 5, y - 3, 11, 4);
      ctx.fillStyle = BRASS_DEEP;
      ctx.fillRect(x - 4, y - 5, 9, 3);
      // post
      ctx.fillStyle = BRASS_DEEP;
      ctx.fillRect(x - 2, y - 22, 4, 18);
      ctx.fillStyle = BRASS;
      ctx.fillRect(x - 2, y - 22, 2, 18);
      ctx.fillStyle = BRASS_BRIGHT;
      ctx.fillRect(x - 2, y - 18, 1, 9);
      // ball finial
      ctx.fillStyle = BRASS;
      ctx.fillRect(x - 3, y - 26, 7, 5);
      ctx.fillStyle = BRASS_BRIGHT;
      ctx.fillRect(x - 2, y - 25, 3, 2);
    },
  };
}

/** A café table with two chairs and something on it. */
export function tableDrawable(tx: number, ty: number, seed: number): Drawable {
  const x = tx * T;
  const y = ty * T;
  const cup = seed % 3 !== 0;
  return {
    sortY: y + T,
    minX: x - 4,
    maxX: x + 2 * T + 4,
    draw(ctx) {
      // chairs, one each side, drawn first so the table overlaps them
      for (const cxo of [x - 2, x + 2 * T - 10]) {
        ctx.fillStyle = shade(WOOD_FRONT, -0.3);
        ctx.fillRect(cxo + 2, y + 16, 8, 10);
        ctx.fillStyle = WOOD_FRONT;
        ctx.fillRect(cxo + 2, y + 16, 8, 3);
        ctx.fillStyle = shade(WOOD_FRONT, -0.15);
        ctx.fillRect(cxo + 3, y + 8, 6, 8);
      }
      // pedestal
      ctx.fillStyle = STONE_DARK;
      ctx.fillRect(x + T - 8, y + 22, 16, 4);
      ctx.fillStyle = STONE_MID;
      ctx.fillRect(x + T - 3, y + 12, 6, 11);
      // top
      pixEllipse(ctx, x + T, y + 14, 24, 8, shade(WOOD_TOP, -0.28));
      pixEllipse(ctx, x + T, y + 11, 24, 8, WOOD_TOP);
      pixEllipse(ctx, x + T, y + 10, 20, 6, shade(WOOD_TOP, 0.12));
      // a cup and a folded card
      if (cup) {
        ctx.fillStyle = PAPER;
        ctx.fillRect(x + T - 9, y + 5, 6, 6);
        ctx.fillStyle = MUTED;
        ctx.fillRect(x + T - 3, y + 6, 2, 3);
        ctx.fillStyle = "#6B4A2F";
        ctx.fillRect(x + T - 8, y + 5, 4, 2);
      }
      ctx.fillStyle = PAPER;
      ctx.fillRect(x + T + 4, y + 4, 8, 7);
      ctx.fillStyle = ACCENT;
      ctx.fillRect(x + T + 5, y + 5, 6, 2);
      ctx.fillStyle = "#C6BCA4";
      ctx.fillRect(x + T + 5, y + 8, 5, 1);
    },
  };
}

/** The hall directory: a lit board on a stand, with a map on it. */
export function kioskDrawable(tx: number, ty: number): Drawable {
  const x = tx * T;
  const y = ty * T;
  return {
    sortY: y + T,
    minX: x - 4,
    maxX: x + 2 * T + 4,
    draw(ctx) {
      // legs
      ctx.fillStyle = STONE_DEEP;
      ctx.fillRect(x + 8, y + 18, 5, 10);
      ctx.fillRect(x + 2 * T - 13, y + 18, 5, 10);
      ctx.fillStyle = STONE_MID;
      ctx.fillRect(x + 4, y + 26, 2 * T - 8, 4);
      // board
      ctx.fillStyle = INK;
      ctx.fillRect(x + 2, y - 16, 2 * T - 4, 36);
      ctx.fillStyle = "#2E2A22";
      ctx.fillRect(x + 4, y - 14, 2 * T - 8, 32);
      ctx.fillStyle = BRASS;
      ctx.fillRect(x + 4, y - 14, 2 * T - 8, 2);
      // a little abstract map: booth blocks around a pale plaza
      ctx.fillStyle = "#4A4638";
      ctx.fillRect(x + 9, y - 9, 2 * T - 18, 22);
      ctx.fillStyle = "#8E8974";
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + 11 + i * 10, y - 7, 7, 4);
        ctx.fillRect(x + 11 + i * 10, y + 7, 7, 4);
      }
      ctx.fillStyle = WATER_LIGHT;
      ctx.fillRect(x + 2 * T / 2 - 4, y - 1, 9, 6);
      ctx.fillStyle = ACCENT;
      ctx.fillRect(x + 2 * T / 2 - 1, y + 1, 3, 3);
      // header
      ctx.fillStyle = PAPER;
      ctx.font = "700 6px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("HALL DIRECTORY", x + T, y - 11, 2 * T - 12);
    },
  };
}

/** Tall cloth banners hung either side of an avenue mouth on the top wall. */
export function wallBannerDrawable(tx: number, color: string): Drawable {
  const x = tx * T;
  return {
    sortY: T, // same layer as the top wall
    minX: x - 2,
    maxX: x + T + 2,
    draw(ctx) {
      const w = 18;
      const h = 54;
      const bx = x + (T - w) / 2;
      ctx.fillStyle = BRASS_DEEP;
      ctx.fillRect(bx - 3, 4, w + 6, 4);
      ctx.fillStyle = BRASS;
      ctx.fillRect(bx - 3, 4, w + 6, 2);
      ctx.fillStyle = shade(color, -0.3);
      ctx.fillRect(bx + 1, 8, w, h);
      ctx.fillStyle = color;
      ctx.fillRect(bx, 8, w - 1, h);
      ctx.fillStyle = shade(color, 0.22);
      ctx.fillRect(bx + 2, 8, 3, h);
      // swallowtail hem
      ctx.clearRect(bx - 1, 8 + h - 8, w + 2, 8);
      ctx.fillStyle = color;
      ctx.fillRect(bx, 8 + h - 8, 6, 8);
      ctx.fillRect(bx + w - 7, 8 + h - 8, 6, 8);
      ctx.fillStyle = shade(color, -0.3);
      ctx.fillRect(bx + w - 7, 8 + h - 8, 2, 8);
      // device
      ctx.fillStyle = BRASS_BRIGHT;
      ctx.fillRect(bx + 6, 20, 6, 6);
      ctx.fillRect(bx + 8, 18, 2, 10);
      ctx.fillRect(bx + 4, 22, 10, 2);
    },
  };
}
