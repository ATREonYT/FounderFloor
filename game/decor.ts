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
import type { DecorItem, DecorKind, PlazaDef, TileRect } from "../lib/types";
import { shade } from "./sprites";
import type { Cam, Drawable } from "./tilemap";

const T = TILE;

// ---------- palette ----------

const STONE_LIGHT = "#CFC8B8";
const STONE = "#B9B1A0";
const STONE_MID = "#A29A88";
const STONE_DARK = "#847C6C";
const STONE_DEEP = "#666052";

// Water, pulled back toward the hall's warm stone palette. The first pass
// used a saturated swimming-pool blue that was the only pure hue in the
// room and read as clip-art dropped into a hand-drawn scene. These are
// greener, greyer, and only four steps — a small palette is most of what
// makes pixel art look drawn rather than generated.
const WATER_DEEP = "#3C6670";
const WATER = "#57909A";
const WATER_LIGHT = "#7CB0B6";
const FOAM = "#AFD0D0";
const SPARK = "#E4F0EC";

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
const CARD = "#FAF7EF";

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
 * Scanline-filled ellipse, drawn on a coarse pixel grid.
 *
 * `q` is the size of one "pixel": rows are filled in bands q tall and the
 * half-width snaps to a multiple of q. At q=1 this is a smooth curve, which
 * is exactly what made the first fountain look machine-made next to booths
 * whose curves are all hand-stepped. At q=2 the arc visibly staircases, and
 * that staircase is most of what reads as drawn by a person.
 */
function pixEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  q = 2
): void {
  ctx.fillStyle = color;
  const top = Math.floor((cy - ry) / q) * q;
  const bot = Math.ceil((cy + ry) / q) * q;
  for (let y = top; y <= bot; y += q) {
    // measure at the band's middle so the top and bottom caps stay even
    const dy = (y + q / 2 - cy) / ry;
    const k = 1 - dy * dy;
    if (k <= 0) continue;
    const half = Math.round((rx * Math.sqrt(k)) / q) * q;
    if (half <= 0) continue;
    ctx.fillRect(cx - half, y, half * 2, q);
  }
}

/**
 * Ordered 2x2 dither between two colours across an elliptical band — the
 * gradient tool of a palette that has four blues in it. Used where the
 * water shades from deep to shallow; a smooth alpha ramp there was the
 * other half of the plastic look.
 */
function ditherEllipseBand(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rxOuter: number,
  ryOuter: number,
  rxInner: number,
  ryInner: number,
  color: string
): void {
  ctx.fillStyle = color;
  const top = Math.floor((cy - ryOuter) / 2) * 2;
  const bot = Math.ceil((cy + ryOuter) / 2) * 2;
  for (let y = top; y <= bot; y += 2) {
    const dy = (y + 1 - cy) / ryOuter;
    const k = 1 - dy * dy;
    if (k <= 0) continue;
    const outer = Math.round((rxOuter * Math.sqrt(k)) / 2) * 2;
    const dyi = (y + 1 - cy) / ryInner;
    const ki = 1 - dyi * dyi;
    const inner = ki > 0 ? Math.round((rxInner * Math.sqrt(ki)) / 2) * 2 : 0;
    const row = ((y / 2) | 0) & 1;
    for (let x = cx - outer; x < cx + outer; x += 4) {
      const px = x + (row ? 2 : 0);
      if (Math.abs(px + 1 - cx) < inner) continue;
      ctx.fillRect(px, y, 2, 2);
    }
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
  alpha = 1,
  q = 2
): void {
  if (rx <= w || ry <= w) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const top = Math.floor((cy - ry) / q) * q;
  const bot = Math.ceil((cy + ry) / q) * q;
  const irx = rx - w;
  const iry = ry - w;
  for (let y = top; y <= bot; y += q) {
    const dy = (y + q / 2 - cy) / ry;
    const k = 1 - dy * dy;
    if (k <= 0) continue;
    const outer = Math.round((rx * Math.sqrt(k)) / q) * q;
    const dyi = (y + q / 2 - cy) / iry;
    const ki = 1 - dyi * dyi;
    const inner = ki > 0 ? Math.round((irx * Math.sqrt(ki)) / q) * q : 0;
    if (inner <= 0) {
      ctx.fillRect(cx - outer, y, outer * 2, q);
    } else {
      ctx.fillRect(cx - outer, y, outer - inner, q);
      ctx.fillRect(cx + inner, y, outer - inner, q);
    }
  }
  ctx.restore();
}

/**
 * Radial joints cut across a rim band, so the stonework reads as blocks
 * somebody laid rather than an extruded ring. This is the single detail
 * that stops a large curved object looking machine-turned.
 */
function masonryJoints(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  band: number,
  count: number,
  color: string
): void {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    // the half-step offset keeps a joint off the dead centre of the front,
    // where the plaque goes
    const a = ((i + 0.5) / count) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    for (let d = 0; d <= band; d += 2) {
      const k = 1 - d / (rx * 0.9);
      const px = Math.round((cx + ca * (rx - d)) / 2) * 2;
      const py = Math.round((cy + sa * (ry - d * (ry / rx))) / 2) * 2;
      if (k <= 0) continue;
      ctx.fillRect(px - 1, py, 2, 2);
    }
  }
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

// Aisle carpet — warmer and darker than the stone, so an aisle reads as a
// laid runner rather than another shade of floor. Pulled back from the
// first, brighter terracotta: at three tiles deep and the full width of
// the hall it was the loudest thing in the room, which is not what a
// carpet is for.
const CARPET = "#8A6551";
const CARPET_WEFT = "#82604D";
const CARPET_EDGE = "#6B4F3F";
const CARPET_LINE = "#AE8B72";

/**
 * The floor of the hall itself.
 *
 * It used to be a plain two-tone checkerboard, which at 32px reads as a
 * chessboard and made every unfurnished part of the room look like a
 * placeholder waiting for art. This lays it as 2x2-tile stone slabs with
 * grout, four tones of variation, and a darker, finer border course two
 * tiles deep along the walls — the same move a real hall makes to stop a
 * big floor reading as one flat plane.
 *
 * One 8x8-tile patch is baked and tiled, so a viewport costs ~20 blits
 * instead of a few thousand fills. The patch is aligned to world
 * coordinates, never to the camera, so it does not crawl when you walk.
 */
export class HallFloor {
  private patch: HTMLCanvasElement | null = null;
  private baked = false;
  private readonly slab: string[];
  private readonly grout: string;
  private readonly groutSoft: string;
  private readonly edge: string[];
  private readonly edgeGrout: string;

  /** 8x8 tiles: big enough that the repeat is not readable while walking. */
  static readonly PATCH = 8 * T;

  constructor(
    theme: { floorA: string; floorB: string },
    private w: number,
    private h: number
  ) {
    const a = theme.floorA;
    const b = theme.floorB;
    this.slab = [shade(a, 0.025), a, shade(a, -0.03), shade(b, 0.015)];
    this.grout = shade(b, -0.17);
    this.groutSoft = shade(b, -0.07);
    this.edge = [shade(b, -0.07), shade(b, -0.03)];
    this.edgeGrout = shade(b, -0.22);
  }

  private bake(): HTMLCanvasElement | null {
    if (this.baked) return this.patch;
    this.baked = true;
    const P = HallFloor.PATCH;
    const off = offscreen(P, P);
    if (!off) return null;
    const { ctx } = off;
    // A hand-picked 4x4 arrangement of the four tones rather than a hash:
    // it tiles without a readable seam and never clumps, which random
    // per-slab picking does about one patch in five.
    const TONES = [
      [1, 0, 2, 1],
      [2, 1, 1, 3],
      [0, 3, 1, 0],
      [1, 1, 3, 2],
    ];
    for (let sy = 0; sy < 4; sy++) {
      for (let sx = 0; sx < 4; sx++) {
        ctx.fillStyle = this.slab[TONES[sy][sx]];
        ctx.fillRect(sx * 2 * T, sy * 2 * T, 2 * T, 2 * T);
      }
    }
    // grout on the slab joints, a fainter score line inside each slab
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = this.groutSoft;
      ctx.fillRect(i * 2 * T + T - 1, 0, 1, P);
      ctx.fillRect(0, i * 2 * T + T - 1, P, 1);
    }
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = this.grout;
      ctx.fillRect(i * 2 * T + 2 * T - 2, 0, 2, P);
      ctx.fillRect(0, i * 2 * T + 2 * T - 2, P, 2);
    }
    this.patch = off.cv;
    return this.patch;
  }

  draw(ctx: CanvasRenderingContext2D, cam: Cam): void {
    const img = this.bake();
    const P = HallFloor.PATCH;
    const x0 = Math.max(0, Math.floor(cam.x));
    const y0 = Math.max(0, Math.floor(cam.y));
    const x1 = Math.min(this.w * T, Math.ceil(cam.x + cam.w));
    const y1 = Math.min(this.h * T, Math.ceil(cam.y + cam.h));
    if (img) {
      for (let py = Math.floor(y0 / P) * P; py < y1; py += P) {
        for (let px = Math.floor(x0 / P) * P; px < x1; px += P) {
          ctx.drawImage(img, px, py);
        }
      }
    } else {
      ctx.fillStyle = this.slab[1];
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }

    // Border course: finer, darker slabs two tiles deep along every wall.
    // Painted per tile, but only for the perimeter tiles actually in view,
    // so it is a rounding error next to the blits above.
    const tx0 = Math.max(0, Math.floor(x0 / T));
    const ty0 = Math.max(0, Math.floor(y0 / T));
    const tx1 = Math.min(this.w - 1, Math.floor((x1 - 1) / T));
    const ty1 = Math.min(this.h - 1, Math.floor((y1 - 1) / T));
    for (let ty = ty0; ty <= ty1; ty++) {
      const nearY = ty <= 2 || ty >= this.h - 3;
      for (let tx = tx0; tx <= tx1; tx++) {
        if (!nearY && !(tx <= 2 || tx >= this.w - 3)) continue;
        ctx.fillStyle = this.edge[(tx + ty) & 1];
        ctx.fillRect(tx * T, ty * T, T, T);
        ctx.fillStyle = this.edgeGrout;
        ctx.fillRect(tx * T, ty * T + T - 2, T, 2);
        ctx.fillRect(tx * T + T - 2, ty * T, 2, T);
      }
    }
  }
}

/**
 * The stone platform every stand sits on.
 *
 * Without it a stand's carpet is a rectangle of colour lying flat on the
 * floor, and where it met the plaza paving it looked pasted on rather than
 * built — worst at the plaza rim, where the octagon's edge ran straight
 * into it. A kerb plus a contact shadow is all it takes for the eye to
 * read the whole stand as a thing standing on the ground.
 */
export function drawStandPlinth(ctx: CanvasRenderingContext2D, bx: number, by: number): void {
  const w = 4 * T;
  const h = 4 * T;
  // Contact shadow, down and slightly right. This is what actually seats
  // the stand on the floor; the kerb below is trim.
  ctx.save();
  ctx.globalAlpha = 0.17;
  ctx.fillStyle = "#2A251D";
  ctx.fillRect(bx - 2, by + h + 1, w + 9, 6);
  ctx.fillRect(bx + w + 1, by + 2, 6, h - 1);
  ctx.restore();
  // A THIN kerb, four pixels of it. The first attempt filled the whole
  // footprint with stone before laying the carpet on top, which turned
  // every stand into a pale slab bigger than the stand — twenty of those
  // read far worse than the problem being fixed.
  ctx.fillStyle = STONE_MID;
  ctx.fillRect(bx - 4, by - 4, w + 8, h + 8);
  ctx.fillStyle = STONE_LIGHT;
  ctx.fillRect(bx - 4, by - 4, w + 8, 2);
  ctx.fillStyle = STONE_DARK;
  ctx.fillRect(bx - 4, by + h + 2, w + 8, 2);
}

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

    // Two inlaid rings around where the fountain will stand. They take the
    // BASIN's radii and aspect, not the tile footprint's — rings drawn to
    // the footprint sat at a different ellipse ratio from the stonework
    // inside them, which is the sort of near-miss that reads as sloppy
    // without anyone being able to say why.
    const fb = box(this.plaza.fountain);
    const fcx = fb.x - this.bx + fb.w / 2;
    const fcy = fb.y - this.by + fb.h / 2;
    const frx = fb.w / 2 - 4;
    const fry = fb.h / 2 - 3;
    pixEllipseRing(ctx, fcx, fcy, frx * 1.28, fry * 1.28, 4, PAVE_INLAY, 0.9);
    pixEllipseRing(ctx, fcx, fcy, frx * 1.52, fry * 1.52, 2, PAVE_LINE, 0.8);
    pixEllipseRing(ctx, fcx, fcy, frx * 2.1, fry * 2.1, 2, PAVE_LINE, 0.55);

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

/**
 * The basin is centred in its own footprint, and the footprint hugs the
 * basin. That is what makes "centre the fountain in the plaza" a matter of
 * centring one tile rect inside another.
 *
 * The first version had the basin sitting two thirds of the way down a
 * square footprint while the paving rings were drawn around the footprint's
 * middle, so the stonework and the inlay were thirty pixels apart and the
 * whole thing looked nudged off its mark. Everything below hangs off `cy`.
 */
function fountainGeom(rect: TileRect): FountainGeom {
  const b = box(rect);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const bottom = b.y + b.h;
  const rx = b.w / 2 - 4;
  const ry = b.h / 2 - 3;
  const midY = cy - ry - 22;
  const topY = midY - 34;
  return {
    cx,
    baseY: cy,
    rx,
    ry,
    bottom,
    midY,
    midRx: rx * 0.46,
    midRy: rx * 0.46 * 0.36,
    topY,
    topRx: rx * 0.24,
    topRy: rx * 0.24 * 0.36,
    finialY: topY - 16,
  };
}

/** A tapered stone shaft, drawn in 2px courses with a lit and a shaded face. */
function stoneColumn(
  ctx: CanvasRenderingContext2D,
  cx: number,
  yTop: number,
  yBot: number,
  halfTop: number,
  halfBot: number
): void {
  for (let y = Math.round(yTop / 2) * 2; y < yBot; y += 2) {
    const k = (y - yTop) / Math.max(1, yBot - yTop);
    const half = Math.round((halfTop + k * (halfBot - halfTop)) / 2) * 2;
    ctx.fillStyle = STONE;
    ctx.fillRect(cx - half, y, half * 2, 2);
    ctx.fillStyle = shade(STONE, 0.17);
    ctx.fillRect(cx - half, y, 4, 2);
    ctx.fillStyle = STONE_DARK;
    ctx.fillRect(cx + half - 4, y, 4, 2);
    // a course line every four rows, so the shaft reads as stacked blocks
    if (((y / 2) | 0) % 4 === 0) {
      ctx.fillStyle = STONE_MID;
      ctx.fillRect(cx - half, y, half * 2, 1);
    }
  }
}

/** Basin and everything BEHIND the water surface. */
function bakeBasin(g: FountainGeom, w: number, h: number, ox: number, oy: number): HTMLCanvasElement | null {
  const off = offscreen(w, h);
  if (!off) return null;
  const { ctx } = off;
  const cx = Math.round((g.cx - ox) / 2) * 2;
  const by = Math.round((g.baseY - oy) / 2) * 2;

  // contact shadow, dithered rather than a soft blob
  ctx.save();
  ctx.globalAlpha = 0.22;
  ditherEllipseBand(ctx, cx, by + g.ry * 0.62, g.rx + 8, g.ry * 0.62, g.rx * 0.5, g.ry * 0.3, "#3A352C");
  ctx.restore();

  // the basin wall, dropped to give the rim thickness
  pixEllipse(ctx, cx, by + 14, g.rx, g.ry, STONE_DEEP);
  pixEllipse(ctx, cx, by + 9, g.rx, g.ry, STONE_DARK);
  masonryJoints(ctx, cx, by + 9, g.rx, g.ry, 8, 18, shade(STONE_DEEP, -0.15));

  // the rim: laid stones, not an extruded band
  pixEllipse(ctx, cx, by, g.rx, g.ry, STONE);
  pixEllipseRing(ctx, cx, by, g.rx, g.ry, 4, STONE_LIGHT);
  pixEllipseRing(ctx, cx, by, g.rx, g.ry, 2, STONE_MID);
  masonryJoints(ctx, cx, by, g.rx, g.ry, 12, 18, STONE_MID);
  // a thin brass moulding let into the inner lip
  pixEllipseRing(ctx, cx, by, g.rx - 12, g.ry - 7, 2, BRASS, 0.85);

  // the inside face of the bowl, in shadow under the near rim
  pixEllipse(ctx, cx, by + 2, g.rx - 14, g.ry - 8, STONE_MID);
  pixEllipse(ctx, cx, by + 3, g.rx - 17, g.ry - 10, STONE_DARK);

  // Water, shallow at the edge and deep in the middle, stepped through
  // three colours. The dither is a NARROW join between bands, not a wash
  // over the whole surface — a 2px checker spread across a basin this size
  // stops reading as shading and starts reading as static.
  const wrx = g.rx - 19;
  const wry = g.ry - 11;
  pixEllipse(ctx, cx, by + 4, wrx, wry, WATER_LIGHT);
  ditherEllipseBand(ctx, cx, by + 4, wrx * 0.9, wry * 0.9, wrx * 0.8, wry * 0.8, WATER);
  pixEllipse(ctx, cx, by + 4, wrx * 0.8, wry * 0.8, WATER);
  ditherEllipseBand(ctx, cx, by + 4, wrx * 0.56, wry * 0.56, wrx * 0.46, wry * 0.46, WATER_DEEP);
  pixEllipse(ctx, cx, by + 4, wrx * 0.46, wry * 0.46, WATER_DEEP);
  // a green line of algae where the water meets the stone
  pixEllipseRing(ctx, cx, by + 4, wrx, wry, 2, "#4E7A6B", 0.4);

  return off.cv;
}

/** The pedestal, bowls and finial — everything IN FRONT of the water. */
function bakeTiers(g: FountainGeom, w: number, h: number, ox: number, oy: number): HTMLCanvasElement | null {
  const off = offscreen(w, h);
  if (!off) return null;
  const { ctx } = off;
  const cx = Math.round((g.cx - ox) / 2) * 2;
  const by = Math.round((g.baseY - oy) / 2) * 2;
  const midY = Math.round((g.midY - oy) / 2) * 2;
  const topY = Math.round((g.topY - oy) / 2) * 2;
  const finY = Math.round((g.finialY - oy) / 2) * 2;

  // plinth the whole thing stands on, inside the water
  pixEllipse(ctx, cx, by + 8, 26, 10, STONE_DARK);
  pixEllipse(ctx, cx, by + 5, 26, 10, STONE);
  pixEllipseRing(ctx, cx, by + 5, 26, 10, 2, STONE_LIGHT);

  stoneColumn(ctx, cx, midY, by + 6, 12, 20);

  // middle bowl
  pixEllipse(ctx, cx, midY + 8, g.midRx, g.midRy, STONE_DEEP);
  pixEllipse(ctx, cx, midY + 4, g.midRx, g.midRy, STONE_DARK);
  pixEllipse(ctx, cx, midY, g.midRx, g.midRy, STONE);
  pixEllipseRing(ctx, cx, midY, g.midRx, g.midRy, 3, STONE_LIGHT);
  masonryJoints(ctx, cx, midY, g.midRx, g.midRy, 6, 10, STONE_MID);
  pixEllipse(ctx, cx, midY + 2, g.midRx - 7, g.midRy - 4, WATER);
  pixEllipse(ctx, cx, midY + 2, g.midRx - 12, g.midRy - 6, WATER_LIGHT);

  stoneColumn(ctx, cx, topY, midY, 6, 11);

  // top bowl
  pixEllipse(ctx, cx, topY + 5, g.topRx, g.topRy, STONE_DARK);
  pixEllipse(ctx, cx, topY, g.topRx, g.topRy, STONE);
  pixEllipseRing(ctx, cx, topY, g.topRx, g.topRy, 2, STONE_LIGHT);
  pixEllipse(ctx, cx, topY + 2, g.topRx - 5, g.topRy - 2, WATER_LIGHT);

  // finial: a small brass sun on a stem
  ctx.fillStyle = STONE;
  ctx.fillRect(cx - 2, finY + 6, 4, Math.max(2, topY - finY - 4));
  ctx.fillStyle = BRASS_DEEP;
  ctx.fillRect(cx - 6, finY, 12, 8);
  ctx.fillStyle = BRASS;
  ctx.fillRect(cx - 6, finY, 12, 6);
  ctx.fillRect(cx - 2, finY - 6, 4, 6);
  ctx.fillRect(cx - 10, finY + 1, 4, 4);
  ctx.fillRect(cx + 6, finY + 1, 4, 4);
  ctx.fillStyle = BRASS_BRIGHT;
  ctx.fillRect(cx - 5, finY + 1, 4, 2);
  ctx.fillRect(cx - 1, finY - 5, 2, 3);

  // brass plaque, centred on the front of the basin
  const px = cx - 22;
  const py = by + Math.round(g.ry) - 6;
  ctx.fillStyle = BRASS_DEEP;
  ctx.fillRect(px, py, 44, 13);
  ctx.fillStyle = BRASS;
  ctx.fillRect(px + 2, py + 2, 40, 9);
  ctx.fillStyle = BRASS_BRIGHT;
  ctx.fillRect(px + 2, py + 2, 40, 1);
  ctx.fillStyle = BRASS_DEEP;
  for (let i = 0; i < 3; i++) ctx.fillRect(px + 8, py + 4 + i * 3, 28 - i * 7, 1);

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
  const ox = b.x - 10;
  const oy = g.finialY - 16;
  const w = b.w + 20;
  const h = b.y + b.h - oy + 12;

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
      const wx = Math.round(g.cx / 2) * 2;
      const wy = Math.round((g.baseY + 4) / 2) * 2;
      const wrx = g.rx - 19;
      const wry = g.ry - 11;

      // three ripple rings, each expanding from the pedestal and fading out
      for (let i = 0; i < 3; i++) {
        const phase = ((t * 0.4 + i / 3) % 1 + 1) % 1;
        const k = 0.3 + phase * 0.7;
        pixEllipseRing(
          ctx,
          wx,
          wy,
          wrx * k,
          wry * k,
          2,
          i === 1 ? FOAM : WATER_LIGHT,
          (1 - phase) * 0.45
        );
      }

      // sparkles — two pixels, never one, so they read at the hall's scale
      ctx.save();
      for (const s of sparks) {
        const tw = Math.sin(t * 2.2 + s.p);
        if (tw < 0.4) continue;
        ctx.globalAlpha = Math.min(1, (tw - 0.4) / 0.6) * 0.8;
        ctx.fillStyle = SPARK;
        const px = Math.round((wx + Math.cos(s.a) * wrx * s.r) / 2) * 2;
        const py = Math.round((wy + Math.sin(s.a) * wry * s.r) / 2) * 2;
        ctx.fillRect(px, py, 2, 2);
      }
      ctx.restore();

      if (tiers) ctx.drawImage(tiers, ox, oy);

      // ---- falling water, drawn over the stonework ----
      // Sheets spilling off both bowl rims, broken into 4px segments that
      // scroll downward. A solid bar of translucent white is the tell of a
      // fountain nobody drew; a stuttering column of chunks is water.
      const wob = Math.sin(t * 2.6) * 2;
      const scroll = Math.round(((t * 44) % 8) / 2) * 2;
      for (const side of [-1, 1]) {
        const mx = Math.round((g.cx + side * (g.midRx - 4) + wob * side) / 2) * 2;
        const mTop = Math.round((g.midY + g.midRy - 2) / 2) * 2;
        const mBot = Math.round((g.baseY - 2) / 2) * 2;
        for (let y = mTop + scroll - 8; y < mBot; y += 8) {
          if (y < mTop) continue;
          ctx.fillStyle = FOAM;
          ctx.fillRect(mx - 2, y, 4, 4);
          ctx.fillStyle = WATER_LIGHT;
          ctx.fillRect(mx - 2, y + 4, 4, 2);
        }
        const tx = Math.round((g.cx + side * (g.topRx - 2) - wob * side) / 2) * 2;
        const tTop = Math.round((g.topY + g.topRy - 1) / 2) * 2;
        const tBot = Math.round((g.midY - 2) / 2) * 2;
        for (let y = tTop + scroll - 8; y < tBot; y += 8) {
          if (y < tTop) continue;
          ctx.fillStyle = FOAM;
          ctx.fillRect(tx - 1, y, 3, 4);
        }
      }

      // droplets peeling off the top bowl and arcing into the basin
      ctx.fillStyle = SPARK;
      for (let i = 0; i < 6; i++) {
        const ph = ((t * 0.85 + i / 6) % 1 + 1) % 1;
        const side = i % 2 === 0 ? -1 : 1;
        const spread = g.topRx + 4 + ph * (g.rx * 0.45);
        const dx = Math.round((g.cx + side * spread) / 2) * 2;
        const fall = g.baseY - g.topY;
        const dy = Math.round((g.topY + ph * ph * fall) / 2) * 2;
        if (dy > g.baseY) continue;
        ctx.globalAlpha = 0.85 - ph * 0.45;
        ctx.fillRect(dx, dy, 2, 2);
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

/**
 * A double-sided plaza bench: one central back rail, a seat either side.
 * Double-sided on purpose — benches ringing a fountain have to face inward,
 * and a one-sided bench is right on the north side and backwards on the
 * south. This one is right everywhere and is what real squares use.
 */
export function benchDrawable(tx: number, ty: number): Drawable {
  const x = tx * T;
  const y = ty * T;
  const w = 2 * T - 4;
  return {
    sortY: y + T,
    minX: x - 2,
    maxX: x + 2 * T + 2,
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#2A251D";
      ctx.fillRect(x + 4, y + 25, w, 4);
      ctx.restore();
      // cast-iron legs
      ctx.fillStyle = "#3B3830";
      ctx.fillRect(x + 5, y + 16, 4, 10);
      ctx.fillRect(x + 2 * T - 9, y + 16, 4, 10);
      ctx.fillStyle = "#555146";
      ctx.fillRect(x + 5, y + 16, 2, 10);
      // far seat
      ctx.fillStyle = shade(WOOD_TOP, -0.24);
      ctx.fillRect(x + 2, y + 8, w, 6);
      ctx.fillStyle = shade(WOOD_TOP, -0.1);
      ctx.fillRect(x + 2, y + 8, w, 4);
      // central back rail
      ctx.fillStyle = shade(WOOD_FRONT, -0.2);
      ctx.fillRect(x + 2, y + 1, w, 8);
      ctx.fillStyle = WOOD_FRONT;
      ctx.fillRect(x + 2, y + 1, w, 6);
      ctx.fillStyle = shade(WOOD_FRONT, 0.18);
      ctx.fillRect(x + 2, y + 1, w, 2);
      // near seat
      ctx.fillStyle = WOOD_TOP;
      ctx.fillRect(x + 2, y + 14, w, 7);
      ctx.fillStyle = shade(WOOD_TOP, -0.14);
      ctx.fillRect(x + 2, y + 18, w, 1);
      ctx.fillStyle = shade(WOOD_TOP, -0.28);
      ctx.fillRect(x + 2, y + 21, w, 2);
      // arm scrolls
      ctx.fillStyle = "#3B3830";
      ctx.fillRect(x, y + 6, 3, 14);
      ctx.fillRect(x + 2 * T - 3, y + 6, 3, 14);
    },
  };
}

/** A big potted tree — the tall vertical the wings were missing. */
export function treeDrawable(tx: number, ty: number, seed: number): Drawable {
  const x = tx * T;
  const y = ty * T;
  const lean = seed % 3 === 0 ? -2 : seed % 3 === 1 ? 2 : 0;
  return {
    sortY: y + T,
    minX: x - 10,
    maxX: x + T + 10,
    draw(ctx) {
      // pot
      ctx.fillStyle = shade(POT, -0.3);
      ctx.fillRect(x + 6, y + 23, 20, 5);
      ctx.fillStyle = POT;
      ctx.fillRect(x + 7, y + 13, 18, 11);
      ctx.fillStyle = shade(POT, 0.15);
      ctx.fillRect(x + 5, y + 10, 22, 4);
      ctx.fillStyle = shade(POT, -0.18);
      ctx.fillRect(x + 7, y + 19, 18, 2);
      ctx.fillStyle = "#4A3A2A";
      ctx.fillRect(x + 9, y + 11, 14, 2);
      // trunk
      ctx.fillStyle = "#6E5334";
      ctx.fillRect(x + 14 + lean / 2, y - 16, 5, 28);
      ctx.fillStyle = "#8A6A44";
      ctx.fillRect(x + 14 + lean / 2, y - 16, 2, 28);
      // canopy, three overlapping clumps so it is not a lollipop
      const cx = x + 16 + lean;
      ctx.fillStyle = LEAF_B;
      ctx.fillRect(cx - 15, y - 34, 30, 16);
      ctx.fillRect(cx - 10, y - 42, 20, 12);
      ctx.fillStyle = LEAF_A;
      ctx.fillRect(cx - 12, y - 38, 12, 12);
      ctx.fillRect(cx + 1, y - 40, 12, 13);
      ctx.fillRect(cx - 16, y - 28, 10, 9);
      ctx.fillRect(cx + 7, y - 27, 10, 9);
      ctx.fillStyle = LEAF_HI;
      ctx.fillRect(cx - 8, y - 40, 6, 5);
      ctx.fillRect(cx + 4, y - 34, 5, 4);
      ctx.fillRect(cx - 13, y - 26, 4, 3);
    },
  };
}

/** A two-seat lounge sofa. */
export function sofaDrawable(tx: number, ty: number, seed: number): Drawable {
  const x = tx * T;
  const y = ty * T;
  const FABRIC = seed % 2 === 0 ? "#7C6A58" : "#6B6A5A";
  return {
    sortY: y + T,
    minX: x - 2,
    maxX: x + 2 * T + 2,
    draw(ctx) {
      const w = 2 * T - 6;
      // back
      ctx.fillStyle = shade(FABRIC, -0.28);
      ctx.fillRect(x + 3, y + 2, w, 14);
      ctx.fillStyle = FABRIC;
      ctx.fillRect(x + 3, y + 2, w, 11);
      ctx.fillStyle = shade(FABRIC, 0.14);
      ctx.fillRect(x + 3, y + 2, w, 2);
      // seat
      ctx.fillStyle = shade(FABRIC, 0.06);
      ctx.fillRect(x + 3, y + 14, w, 9);
      ctx.fillStyle = shade(FABRIC, -0.16);
      ctx.fillRect(x + 3 + w / 2 - 1, y + 14, 2, 9);
      // arms
      ctx.fillStyle = shade(FABRIC, -0.2);
      ctx.fillRect(x + 1, y + 8, 6, 16);
      ctx.fillRect(x + w - 1, y + 8, 6, 16);
      ctx.fillStyle = shade(FABRIC, 0.1);
      ctx.fillRect(x + 1, y + 8, 6, 2);
      ctx.fillRect(x + w - 1, y + 8, 6, 2);
      // feet
      ctx.fillStyle = "#4A3A2A";
      ctx.fillRect(x + 5, y + 24, 4, 4);
      ctx.fillRect(x + w, y + 24, 4, 4);
      // a cushion, because empty furniture reads as a showroom
      ctx.fillStyle = ACCENT;
      ctx.fillRect(x + 10, y + 8, 9, 8);
      ctx.fillStyle = shade(ACCENT, -0.25);
      ctx.fillRect(x + 10, y + 14, 9, 2);
    },
  };
}

/** The refreshment counter: three tiles of bar with an urn and cups. */
export function barDrawable(tx: number, ty: number): Drawable {
  const x = tx * T;
  const y = ty * T;
  const w = 3 * T;
  return {
    sortY: y + T,
    minX: x - 4,
    maxX: x + w + 4,
    draw(ctx) {
      // back gantry with a menu slate
      ctx.fillStyle = STONE_DARK;
      ctx.fillRect(x + 4, y - 26, w - 8, 20);
      ctx.fillStyle = "#2E2A22";
      ctx.fillRect(x + 7, y - 23, w - 14, 14);
      ctx.fillStyle = BRASS;
      ctx.fillRect(x + 7, y - 23, w - 14, 1);
      ctx.fillStyle = "#8E8974";
      for (let i = 0; i < 3; i++) ctx.fillRect(x + 12, y - 19 + i * 4, w - 30 - i * 8, 2);
      // counter body
      ctx.fillStyle = "#7A5F3E";
      ctx.fillRect(x + 2, y + 6, w - 4, 18);
      ctx.fillStyle = shade("#7A5F3E", -0.28);
      ctx.fillRect(x + 2, y + 22, w - 4, 3);
      // panel lines
      ctx.fillStyle = shade("#7A5F3E", -0.14);
      for (let i = 1; i < 3; i++) ctx.fillRect(x + i * T, y + 8, 2, 14);
      // counter top
      ctx.fillStyle = WOOD_TOP;
      ctx.fillRect(x, y + 1, w, 7);
      ctx.fillStyle = shade(WOOD_TOP, -0.22);
      ctx.fillRect(x, y + 8, w, 2);
      // brass foot rail
      ctx.fillStyle = BRASS;
      ctx.fillRect(x + 4, y + 20, w - 8, 2);
      // urn, cups, a jar
      ctx.fillStyle = "#4A4640";
      ctx.fillRect(x + 10, y - 8, 12, 10);
      ctx.fillStyle = "#6B6660";
      ctx.fillRect(x + 10, y - 8, 4, 10);
      ctx.fillStyle = BRASS;
      ctx.fillRect(x + 15, y + 1, 3, 2);
      ctx.fillStyle = CARD;
      for (let i = 0; i < 3; i++) ctx.fillRect(x + 34 + i * 7, y - 3, 5, 5);
      ctx.fillStyle = "#B4762E";
      ctx.fillRect(x + w - 22, y - 6, 9, 8);
      ctx.fillStyle = shade("#B4762E", 0.2);
      ctx.fillRect(x + w - 22, y - 6, 3, 8);
    },
  };
}

/** A freestanding poster board — two panels on an A-frame. */
export function boardDrawable(tx: number, ty: number, seed: number): Drawable {
  const x = tx * T;
  const y = ty * T;
  const POSTERS = ["#C4562B", "#4E6E4E", "#3B5B92", "#6B4E71", "#A98C5B"];
  const a = POSTERS[seed % POSTERS.length];
  const b = POSTERS[(seed + 2) % POSTERS.length];
  return {
    sortY: y + T,
    minX: x - 4,
    maxX: x + 2 * T + 4,
    draw(ctx) {
      // legs
      ctx.fillStyle = "#4A3A2A";
      ctx.fillRect(x + 6, y + 18, 4, 10);
      ctx.fillRect(x + 2 * T - 10, y + 18, 4, 10);
      ctx.fillStyle = shade("#4A3A2A", 0.2);
      ctx.fillRect(x + 4, y + 26, 2 * T - 8, 3);
      // frame
      ctx.fillStyle = "#6E5334";
      ctx.fillRect(x + 2, y - 22, 2 * T - 4, 42);
      ctx.fillStyle = "#8A6A44";
      ctx.fillRect(x + 2, y - 22, 2 * T - 4, 2);
      // two pinned posters
      ctx.fillStyle = shade(a, -0.3);
      ctx.fillRect(x + 6, y - 18, 22, 32);
      ctx.fillStyle = a;
      ctx.fillRect(x + 5, y - 19, 22, 32);
      ctx.fillStyle = shade(b, -0.3);
      ctx.fillRect(x + 34, y - 16, 22, 30);
      ctx.fillStyle = b;
      ctx.fillRect(x + 33, y - 17, 22, 30);
      // headline blocks and text rules
      ctx.fillStyle = "#FFFDF5";
      ctx.fillRect(x + 8, y - 15, 15, 4);
      ctx.fillRect(x + 36, y - 13, 15, 3);
      ctx.fillStyle = shade(a, 0.35);
      for (let i = 0; i < 4; i++) ctx.fillRect(x + 8, y - 7 + i * 4, 16 - i * 2, 1);
      ctx.fillStyle = shade(b, 0.35);
      for (let i = 0; i < 3; i++) ctx.fillRect(x + 36, y - 5 + i * 4, 15 - i * 3, 1);
      // pins
      ctx.fillStyle = BRASS_BRIGHT;
      ctx.fillRect(x + 15, y - 19, 2, 2);
      ctx.fillRect(x + 43, y - 17, 2, 2);
    },
  };
}

/** A stack of shipping crates — the backstage of any expo hall. */
export function cratesDrawable(tx: number, ty: number, seed: number): Drawable {
  const x = tx * T;
  const y = ty * T;
  const tall = seed % 2 === 0;
  return {
    sortY: y + T,
    minX: x - 2,
    maxX: x + T + 2,
    draw(ctx) {
      const crate = (cx: number, cy: number, w: number, h: number): void => {
        ctx.fillStyle = shade(WOOD_FRONT, -0.32);
        ctx.fillRect(cx, cy, w, h);
        ctx.fillStyle = WOOD_FRONT;
        ctx.fillRect(cx, cy, w - 2, h - 2);
        ctx.fillStyle = shade(WOOD_FRONT, 0.16);
        ctx.fillRect(cx, cy, w - 2, 2);
        // braces
        ctx.fillStyle = shade(WOOD_FRONT, -0.2);
        ctx.fillRect(cx, cy + h / 2 - 1, w - 2, 2);
        ctx.fillRect(cx + w / 2 - 1, cy, 2, h - 2);
      };
      crate(x + 3, y + 12, 24, 15);
      if (tall) {
        crate(x + 6, y - 1, 18, 13);
        ctx.fillStyle = ACCENT;
        ctx.fillRect(x + 9, y + 2, 8, 3);
      } else {
        ctx.fillStyle = ACCENT;
        ctx.fillRect(x + 7, y + 16, 9, 3);
      }
    },
  };
}

/** A wayfinding sign on a weighted post. */
export function signDrawable(tx: number, ty: number, label: string): Drawable {
  const x = tx * T + T / 2;
  const y = ty * T + T - 6;
  return {
    sortY: ty * T + T,
    minX: x - 22,
    maxX: x + 22,
    draw(ctx) {
      // base
      ctx.fillStyle = STONE_DEEP;
      ctx.fillRect(x - 8, y - 4, 17, 5);
      ctx.fillStyle = STONE_MID;
      ctx.fillRect(x - 8, y - 4, 17, 2);
      // post
      ctx.fillStyle = shade(BRASS_DEEP, -0.15);
      ctx.fillRect(x - 2, y - 30, 5, 27);
      ctx.fillStyle = BRASS;
      ctx.fillRect(x - 2, y - 30, 2, 27);
      // the plate, pointing off to one side like a real wayfinder
      ctx.fillStyle = INK;
      ctx.fillRect(x - 20, y - 44, 40, 15);
      ctx.fillStyle = "#2E2A22";
      ctx.fillRect(x - 19, y - 43, 38, 13);
      ctx.fillStyle = BRASS;
      ctx.fillRect(x - 19, y - 43, 38, 1);
      ctx.fillStyle = PAPER;
      ctx.font = "700 7px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x, y - 36, 34);
      // arrow
      ctx.fillStyle = BRASS_BRIGHT;
      ctx.fillRect(x + 13, y - 38, 5, 2);
      ctx.fillRect(x + 15, y - 40, 2, 2);
      ctx.fillRect(x + 15, y - 36, 2, 2);
    },
  };
}

/**
 * A carpeted aisle laid over the hall floor. This is the cheapest fix for
 * a room that reads as empty: bare floor between two banks of stands looks
 * like nothing has been finished, and the same floor with a runner down it
 * looks like somebody laid a runner down it.
 */
export function drawRunner(ctx: CanvasRenderingContext2D, r: TileRect, cam: Cam): void {
  const b = box(r);
  if (b.x + b.w < cam.x || b.x > cam.x + cam.w) return;
  if (b.y + b.h < cam.y || b.y > cam.y + cam.h) return;
  const x = Math.max(b.x, Math.floor(cam.x));
  const w = Math.min(b.x + b.w, Math.ceil(cam.x + cam.w)) - x;
  const y = Math.max(b.y, Math.floor(cam.y));
  const h = Math.min(b.y + b.h, Math.ceil(cam.y + cam.h)) - y;
  if (w <= 0 || h <= 0) return;

  ctx.fillStyle = CARPET;
  ctx.fillRect(x, y, w, h);
  // woven texture: a 4px grid of slightly darker weft
  ctx.fillStyle = CARPET_WEFT;
  const gx = Math.floor(x / 8) * 8;
  const gy = Math.floor(y / 8) * 8;
  for (let sy = gy; sy < y + h; sy += 8) {
    for (let sx = gx + (((sy / 8) | 0) & 1 ? 4 : 0); sx < x + w; sx += 8) {
      if (sx < x || sy < y) continue;
      ctx.fillRect(sx, sy, 4, 4);
    }
  }
  const horizontal = b.w >= b.h;
  ctx.fillStyle = CARPET_EDGE;
  if (horizontal) {
    ctx.fillRect(x, b.y, w, 4);
    ctx.fillRect(x, b.y + b.h - 4, w, 4);
    ctx.fillStyle = CARPET_LINE;
    ctx.fillRect(x, b.y + 6, w, 2);
    ctx.fillRect(x, b.y + b.h - 8, w, 2);
  } else {
    ctx.fillRect(b.x, y, 4, h);
    ctx.fillRect(b.x + b.w - 4, y, 4, h);
    ctx.fillStyle = CARPET_LINE;
    ctx.fillRect(b.x + 6, y, 2, h);
    ctx.fillRect(b.x + b.w - 8, y, 2, h);
  }
}

// ---------- one table, so a layout only names a kind and a corner ----------

/** Footprint in tiles. Everything is one tile tall. */
export const DECOR_WIDTH: Record<DecorKind, number> = {
  planter: 1,
  lamp: 1,
  stanchion: 1,
  table: 2,
  kiosk: 2,
  tree: 1,
  sofa: 2,
  bar: 3,
  board: 2,
  crates: 1,
  sign: 1,
  bench: 2,
};

/**
 * Stanchions are the one walk-through kind: a solid rim of them would fence
 * the plaza off, and their job is to say "this is the middle of the room",
 * not to stop anybody.
 */
export function decorBlocks(kind: DecorKind): boolean {
  return kind !== "stanchion";
}

/**
 * Build the drawable for one piece of furniture.
 * `ropeRight` only means anything for stanchions; `label` only for signs.
 */
export function decorDrawable(
  item: DecorItem,
  seed: number,
  opts: { ropeRight?: boolean; label?: string } = {}
): Drawable {
  switch (item.kind) {
    case "planter":
      return planterDrawable(item.x, item.y, seed);
    case "lamp":
      return lampDrawable(item.x, item.y);
    case "stanchion":
      return stanchionDrawable(item.x, item.y, opts.ropeRight === true);
    case "table":
      return tableDrawable(item.x, item.y, seed);
    case "kiosk":
      return kioskDrawable(item.x, item.y);
    case "tree":
      return treeDrawable(item.x, item.y, seed);
    case "sofa":
      return sofaDrawable(item.x, item.y, seed);
    case "bar":
      return barDrawable(item.x, item.y);
    case "board":
      return boardDrawable(item.x, item.y, seed);
    case "crates":
      return cratesDrawable(item.x, item.y, seed);
    case "sign":
      return signDrawable(item.x, item.y, opts.label ?? "THIS WAY");
    case "bench":
      return benchDrawable(item.x, item.y);
  }
}

/**
 * A merchant stall: awning, sign board, counter, goods on top.
 *
 * Three tiles wide and one deep, facing down like a booth. These are the
 * only decor you can walk up to and use — they put the shop, the sign
 * painter, the records board and the register in the hall itself, and
 * they give the two long side avenues a reason to be walked down.
 *
 * Drawn in two parts, like a booth: the awning and sign sort at the back
 * of the stall, the counter at the front, so the keeper standing between
 * them is drawn in the right order.
 */
export function merchantBackDrawable(tx: number, ty: number, sign: string, color: string): Drawable {
  const x = tx * T;
  const y = ty * T;
  const w = 3 * T;
  return {
    sortY: y + 2,
    minX: x - 6,
    maxX: x + w + 6,
    draw(ctx) {
      // posts holding the awning up
      ctx.fillStyle = shade(WOOD_FRONT, -0.35);
      ctx.fillRect(x + 2, y - 44, 6, 48);
      ctx.fillRect(x + w - 8, y - 44, 6, 48);
      ctx.fillStyle = WOOD_FRONT;
      ctx.fillRect(x + 2, y - 44, 3, 48);
      ctx.fillRect(x + w - 8, y - 44, 3, 48);

      // sign board slung under the awning
      const sw = w - 26;
      const sx = x + 13;
      const sy = y - 40;
      ctx.fillStyle = INK;
      ctx.fillRect(sx - 2, sy - 2, sw + 4, 20);
      ctx.fillStyle = "#2E2A22";
      ctx.fillRect(sx, sy, sw, 16);
      ctx.fillStyle = color;
      ctx.fillRect(sx, sy, sw, 2);
      ctx.fillRect(sx, sy + 14, sw, 2);
      ctx.fillStyle = PAPER;
      ctx.font = "700 8px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sign, x + w / 2, sy + 8, sw - 8);

      // scalloped striped awning above the sign
      const ah = 13;
      const ay = y - 58;
      for (let i = 0; i < w; i += 12) {
        ctx.fillStyle = (i / 12) & 1 ? "#F2EFE7" : color;
        ctx.fillRect(x + i, ay, Math.min(12, w - i), ah);
      }
      ctx.fillStyle = shade(color, -0.4);
      ctx.fillRect(x, ay + ah, w, 2);
      // scallops along the front edge
      for (let i = 0; i < w; i += 12) {
        ctx.fillStyle = (i / 12) & 1 ? "#F2EFE7" : color;
        ctx.fillRect(x + i + 2, ay + ah + 2, 8, 3);
      }
      ctx.fillStyle = shade(color, 0.25);
      ctx.fillRect(x, ay, w, 2);
    },
  };
}

export function merchantFrontDrawable(tx: number, ty: number, color: string, seed: number): Drawable {
  const x = tx * T;
  const y = ty * T;
  const w = 3 * T;
  return {
    sortY: y + T,
    minX: x - 6,
    maxX: x + w + 6,
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#2A251D";
      ctx.fillRect(x - 2, y + T - 2, w + 8, 6);
      ctx.restore();
      // counter body
      ctx.fillStyle = "#7A5F3E";
      ctx.fillRect(x + 2, y + 12, w - 4, T - 14);
      ctx.fillStyle = shade("#7A5F3E", -0.3);
      ctx.fillRect(x + 2, y + T - 4, w - 4, 4);
      ctx.fillStyle = shade("#7A5F3E", -0.14);
      for (let i = 1; i < 3; i++) ctx.fillRect(x + i * T, y + 14, 2, T - 18);
      // counter top
      ctx.fillStyle = WOOD_TOP;
      ctx.fillRect(x, y + 6, w, 8);
      ctx.fillStyle = shade(WOOD_TOP, -0.24);
      ctx.fillRect(x, y + 14, w, 2);
      // a bunting swag along the counter's front edge
      ctx.fillStyle = color;
      for (let i = 4; i < w - 8; i += 10) {
        ctx.fillRect(x + i, y + 18, 6, 4);
        ctx.fillRect(x + i + 1, y + 22, 4, 3);
        ctx.fillRect(x + i + 2, y + 25, 2, 2);
      }
      // goods on the counter, varied by seed so no two stalls match
      const kind = seed % 3;
      if (kind === 0) {
        ctx.fillStyle = CARD;
        for (let i = 0; i < 4; i++) ctx.fillRect(x + 10 + i * 9, y + 1, 7, 6);
        ctx.fillStyle = color;
        ctx.fillRect(x + 10, y + 1, 7, 2);
      } else if (kind === 1) {
        ctx.fillStyle = "#4A4640";
        ctx.fillRect(x + 12, y - 6, 11, 12);
        ctx.fillStyle = "#6B6660";
        ctx.fillRect(x + 12, y - 6, 4, 12);
        ctx.fillStyle = BRASS;
        ctx.fillRect(x + w - 30, y - 2, 16, 8);
        ctx.fillStyle = BRASS_BRIGHT;
        ctx.fillRect(x + w - 30, y - 2, 16, 2);
      } else {
        ctx.fillStyle = "#B4762E";
        ctx.fillRect(x + 14, y - 4, 9, 10);
        ctx.fillStyle = shade("#B4762E", 0.22);
        ctx.fillRect(x + 14, y - 4, 3, 10);
        ctx.fillStyle = CARD;
        ctx.fillRect(x + w - 32, y, 12, 6);
        ctx.fillStyle = MUTED;
        ctx.fillRect(x + w - 30, y + 2, 8, 1);
      }
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
