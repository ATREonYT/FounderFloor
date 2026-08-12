/**
 * FounderFloor — tile map builder.
 * Turns a FloorDef + startup roster into collision data and draw lists:
 * checkerboard floor, perimeter walls, booth stalls per the 4x3 convention
 * (banner wall / founder lane / counter, facing down), and deterministic
 * ambient props (plants, benches, a coffee cart, floor mats) seeded from
 * the floor id so every visitor sees the same hall.
 */

import { TILE } from "../lib/types";
import type { BoothClaim, BoothInstance, FloorDef, Startup, TileRect } from "../lib/types";
import { shade } from "./sprites";
import { drawBoothBanner, drawBoothCounter, drawCarpet as paintCarpet } from "./boothArt";
import {
  PlazaGround,
  archDrawable,
  drawAvenue,
  fountainDrawable,
  kioskDrawable,
  lampDrawable,
  planterDrawable,
  stanchionDrawable,
  tableDrawable,
  wallBannerDrawable,
} from "./decor";

// ---------- shared shapes ----------

/** Camera rect in world px. */
export interface Cam {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A y-sortable world object; the engine merges these with avatars. */
export interface Drawable {
  sortY: number;
  /**
   * Horizontal extent in world px, when known — lets the engine skip
   * drawables that are off-screen sideways (the y-band cull alone repaints
   * the full width of the hall every frame on wide floors).
   */
  minX?: number;
  maxX?: number;
  draw(ctx: CanvasRenderingContext2D): void;
}

/** A live player's stand on this floor (the local player's has isYours=true). */
export interface ClaimEntry {
  claim: BoothClaim;
  isYours: boolean;
  ownerId?: string;
  ownerName?: string;
  /** False = the stand's owner has left the floor (rendered as "away"). */
  online?: boolean;
}

export interface BuiltFloor {
  widthPx: number;
  heightPx: number;
  /** Every booth spot — occupied ones carry a startup, vacant stands carry null. */
  booths: BoothInstance[];
  /** Tile-coordinate walkability. Out-of-bounds counts as solid. */
  solid(tx: number, ty: number): boolean;
  /** Floor, carpets and mats — everything avatars stand on. Camera-culled. */
  drawUnder(ctx: CanvasRenderingContext2D, cam: Cam): void;
  /** Walls, banners, counters, props — pre-sorted by sortY ascending. */
  drawables: Drawable[];
}

// ---------- deterministic randomness ----------

/** FNV-1a string hash -> uint32. */
export function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Tiny seeded PRNG (mulberry32). Returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- fixed prop palette (theme-agnostic, warm) ----------

const WOOD_TOP = "#D9C79B";
const WOOD_FRONT = "#A28457";
const POT = "#A6633C";
const LEAF_A = "#4C7A4F";
const LEAF_B = "#3A6440";
const CARD = "#FAF7EF";
const CARD_LINE = "#C6BCA4";
const VACANT_FACE = "#CFC8B8";
// dressing for an unclaimed slot: slate board, brass fittings, stone posts
const SLOT_FACE = "#3A3830";
const SLOT_FRAME = "#26241E";
const SLOT_BRASS = "#B08D2E";
const SLOT_POST = "#B9B1A0";
const SLOT_POST_DARK = "#847C6C";
const MUTED = "#6F6A5E";
const ACCENT = "#D9480F";

const T = TILE;

/**
 * Uploaded booth logos (tiny data-URL PNGs), cached as decoded images.
 * Bounded: keyed by the full data URL, so every logo edit is a new entry —
 * without a cap a long session would hold every version ever seen.
 */
const logoCache = new Map<string, HTMLImageElement>();
const LOGO_CACHE_MAX = 64;
function logoImage(dataUrl: string): HTMLImageElement | null {
  // Re-check the rule at the point of use, not just on save: a live peer's
  // booth logo arrives over the wire, so refuse anything that isn't a tiny
  // base64 PNG (no external URLs / SVG that could beacon or spoof).
  if (!(dataUrl.startsWith("data:image/png;base64,") && dataUrl.length <= 8000)) return null;
  let img = logoCache.get(dataUrl);
  if (!img) {
    if (typeof Image === "undefined") return null; // SSR guard
    if (logoCache.size >= LOGO_CACHE_MAX) {
      // evict the oldest half — cheap, and misses just re-decode a tiny PNG
      let drop = LOGO_CACHE_MAX / 2;
      for (const key of logoCache.keys()) {
        if (drop-- <= 0) break;
        logoCache.delete(key);
      }
    }
    img = new Image();
    img.src = dataUrl;
    logoCache.set(dataUrl, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/**
 * Is this boothSpots index open to player claims on this floor def?
 * Seed startups fill spots in order, skipping reservedSpot — everything they
 * cover is taken; the reserved spot and any leftovers are claimable. Used to
 * drop stored claims that no longer match the floor (defs change between
 * versions; a stale index would announce an invisible stand that still
 * blocks arbitration for everyone else).
 */
export function isClaimableSpot(floor: FloorDef, idx: number): boolean {
  if (!Number.isInteger(idx) || idx < 0 || idx >= floor.boothSpots.length) return false;
  let assigned = 0;
  for (let i = 0; i < floor.boothSpots.length && assigned < floor.startupIds.length; i++) {
    if (i === floor.reservedSpot) continue;
    if (i === idx) return false; // covered by a seed startup
    assigned++;
  }
  return true;
}

/** The boothSpots index a seed startup renders at (skips reservedSpot). */
export function seedSpotIndex(floor: FloorDef, startupId: string): number {
  const order = floor.startupIds.indexOf(startupId);
  if (order < 0) return -1;
  let assigned = 0;
  for (let i = 0; i < floor.boothSpots.length; i++) {
    if (i === floor.reservedSpot) continue;
    if (assigned === order) return i;
    assigned++;
  }
  return -1;
}


// ---------- builder ----------

export function buildFloor(
  floor: FloorDef,
  startups: Record<string, Startup>,
  claims: ClaimEntry[] = []
): BuiltFloor {
  const w = floor.width;
  const h = floor.height;
  const grid = new Uint8Array(w * h); // 1 = solid
  const mark = (tx: number, ty: number): void => {
    if (tx >= 0 && ty >= 0 && tx < w && ty < h) grid[ty * w + tx] = 1;
  };
  const drawables: Drawable[] = [];

  // ----- perimeter walls -----
  const wallTiles: { x: number; y: number }[] = [];
  for (let x = 0; x < w; x++) {
    wallTiles.push({ x, y: 0 }, { x, y: h - 1 });
  }
  for (let y = 1; y < h - 1; y++) {
    wallTiles.push({ x: 0, y }, { x: w - 1, y });
  }
  const wallBody = floor.theme.wall;
  const wallDark = shade(wallBody, -0.2);
  for (const wt of wallTiles) {
    mark(wt.x, wt.y);
    drawables.push({
      sortY: (wt.y + 1) * T,
      minX: wt.x * T,
      maxX: (wt.x + 1) * T,
      draw(ctx) {
        ctx.fillStyle = wallBody;
        ctx.fillRect(wt.x * T, wt.y * T, T, T);
        ctx.fillStyle = floor.theme.trim;
        ctx.fillRect(wt.x * T, wt.y * T, T, 5);
        ctx.fillStyle = wallDark;
        ctx.fillRect(wt.x * T, wt.y * T + T - 3, T, 3);
      },
    });
  }

  // ----- the plaza: paved centre, fountain, avenues and their furniture ---
  // Placed before the ambient props below so the random scatter sees these
  // tiles as taken and never drops a pot plant in the fountain.
  const plaza = floor.plaza;
  const plazaGround = plaza ? new PlazaGround(plaza) : null;
  const inRect = (tx: number, ty: number, r: TileRect): boolean =>
    tx >= r.x0 && tx <= r.x1 && ty >= r.y0 && ty <= r.y1;
  const onAvenue = (tx: number, ty: number): boolean => {
    if (!plaza) return false;
    for (const a of plaza.avenues) if (inRect(tx, ty, a)) return true;
    return false;
  };

  if (plaza) {
    for (let ty = plaza.fountain.y0; ty <= plaza.fountain.y1; ty++) {
      for (let tx = plaza.fountain.x0; tx <= plaza.fountain.x1; tx++) mark(tx, ty);
    }
    drawables.push(fountainDrawable(plaza.fountain));

    for (const p of plaza.planters ?? []) {
      mark(p.x, p.y);
      drawables.push(planterDrawable(p.x, p.y, hashStr(`${floor.id}:planter:${p.x}:${p.y}`)));
    }
    for (const l of plaza.lamps ?? []) {
      mark(l.x, l.y);
      drawables.push(lampDrawable(l.x, l.y));
    }
    for (const tb of plaza.tables ?? []) {
      mark(tb.x, tb.y);
      mark(tb.x + 1, tb.y);
      drawables.push(tableDrawable(tb.x, tb.y, hashStr(`${floor.id}:table:${tb.x}:${tb.y}`)));
    }
    for (const k of plaza.kiosks ?? []) {
      mark(k.x, k.y);
      mark(k.x + 1, k.y);
      drawables.push(kioskDrawable(k.x, k.y));
    }
    // Stanchions stay walk-through — a solid rim would fence the plaza off.
    // A post slings its rope to the right only when the next post along is
    // exactly two tiles away, which is what keeps the rope out of the
    // avenue mouths without listing the gaps by hand.
    const posts = plaza.stanchions ?? [];
    const postAt = new Set(posts.map((p) => `${p.x},${p.y}`));
    for (const p of posts) {
      drawables.push(stanchionDrawable(p.x, p.y, postAt.has(`${p.x + 2},${p.y}`)));
    }

    if (plaza.arch) {
      // the two posts are solid; the beam and board hang over the walkway
      mark(plaza.arch.x0, plaza.arch.y0);
      mark(plaza.arch.x1, plaza.arch.y0);
      drawables.push(archDrawable(plaza.arch, floor.name, "YOU ARE HERE"));
    }

    // banners either side of whichever avenue meets the top wall
    for (const a of plaza.avenues) {
      if (a.y0 > 1) continue;
      drawables.push(wallBannerDrawable(a.x0 - 2, floor.theme.trim));
      drawables.push(wallBannerDrawable(a.x1 + 2, ACCENT));
    }
  }

  // ----- posters along the top wall: cheap set dressing so the hall reads
  // as a real expo, not an empty corridor. Deterministic per floor. -----
  const posterRng = mulberry32(hashStr(floor.id) ^ 0x51ab);
  const POSTER_FACES = ["#C4562B", "#4E6E4E", "#3B5B92", "#A98C5B", "#6B4E71", "#2F6F6A"];
  for (let px = 2; px < w - 3; px += 5 + Math.floor(posterRng() * 3)) {
    if (posterRng() < 0.25) continue; // gaps keep it casual
    // leave the avenue mouth and its two banners alone — a poster tucked
    // behind a hanging banner is just a smear of colour
    if (plaza && plaza.avenues.some((a) => a.y0 <= 1 && px >= a.x0 - 4 && px <= a.x1 + 4)) continue;
    const face = POSTER_FACES[Math.floor(posterRng() * POSTER_FACES.length)]!;
    const tall = posterRng() > 0.5;
    const x0 = px * T + 6 + Math.floor(posterRng() * 8);
    drawables.push({
      sortY: 1 * T, // same layer as the top wall
      minX: x0 - 2,
      maxX: x0 + 22,
      draw(ctx) {
        const ph = tall ? 22 : 18;
        ctx.fillStyle = shade(face, -0.35);
        ctx.fillRect(x0 - 1, 7, 20, ph);
        ctx.fillStyle = face;
        ctx.fillRect(x0, 8, 18, ph - 2);
        // headline block + text lines, abstract on purpose
        ctx.fillStyle = "#FFFDF5";
        ctx.fillRect(x0 + 3, 11, 12, 3);
        ctx.fillStyle = shade(face, 0.35);
        ctx.fillRect(x0 + 3, 17, 10, 1);
        ctx.fillRect(x0 + 3, 20, 12, 1);
        if (tall) ctx.fillRect(x0 + 3, 23, 8, 1);
      },
    });
  }

  // ----- booth assignment: seed startups first, then live claims on leftovers -----
  const claimBySpot = new Map<number, ClaimEntry>();
  for (const c of claims) claimBySpot.set(c.claim.spotIndex, c);

  const booths: BoothInstance[] = [];
  let nextStartup = 0;
  floor.boothSpots.forEach((spot, i) => {
    // solid: banner wall, founder lane (players keep out) and counter
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 4; dx++) mark(spot.x + dx, spot.y + dy);
    const base = { spot: { x: spot.x, y: spot.y }, spotIndex: i };
    // seed booths own their spots outright; the reserved spot skips seeding
    if (i !== floor.reservedSpot) {
      const id = floor.startupIds[nextStartup++];
      const s = id !== undefined ? startups[id] : undefined;
      if (s) {
        booths.push({ ...base, startup: s, isYours: false });
        return;
      }
    }
    // vacant after seeding: a live claim may occupy it (first claim wins)
    const c = claimBySpot.get(i);
    if (c) {
      booths.push({
        ...base,
        startup: c.claim.startup,
        isYours: c.isYours,
        ownerId: c.ownerId,
        ownerName: c.ownerName,
        ownerOnline: c.isYours ? true : c.online,
      });
    } else {
      booths.push({ ...base, startup: null, isYours: false });
    }
  });

  for (const b of booths) {
    if (b.startup) {
      const occupied = { ...b, startup: b.startup };
      drawables.push(bannerDrawable(occupied), counterDrawable(occupied));
    } else {
      drawables.push(vacantBannerDrawable(b.spot, b.spotIndex), vacantCounterDrawable(b.spot));
    }
  }

  // ----- ambient props, seeded from floor.id -----
  // Keep clear of: booth rects + their 1-tile interaction ring, the border,
  // and a 2-tile aisle lattice (tiles with x%4<2 or y%4<2 stay empty) so
  // every part of the hall remains reachable on foot.
  const nearBoothRing = (tx: number, ty: number): boolean => {
    for (const s of floor.boothSpots) {
      if (tx >= s.x - 1 && tx <= s.x + 4 && ty >= s.y - 1 && ty <= s.y + 3) return true;
    }
    return false;
  };
  const taken = new Set<number>();
  const canProp = (tx: number, ty: number): boolean =>
    tx >= 1 &&
    ty >= 1 &&
    tx < w - 1 &&
    ty < h - 1 &&
    tx % 4 >= 2 &&
    ty % 4 >= 2 &&
    !nearBoothRing(tx, ty) &&
    // the plaza is composed, not scattered, and the avenues have to stay
    // clear or the walk to the fountain turns into a slalom
    !(plaza && inRect(tx, ty, plaza.rect)) &&
    !onAvenue(tx, ty) &&
    grid[ty * w + tx] === 0 &&
    !taken.has(ty * w + tx);

  const rng = mulberry32(hashStr(floor.id));
  const tryPlace = (tw: number, tries: number): { x: number; y: number } | null => {
    for (let i = 0; i < tries; i++) {
      const tx = 1 + Math.floor(rng() * (w - 2));
      const ty = 1 + Math.floor(rng() * (h - 2));
      let ok = true;
      for (let d = 0; d < tw; d++) if (!canProp(tx + d, ty)) ok = false;
      if (!ok) continue;
      for (let d = 0; d < tw; d++) taken.add(ty * w + tx + d);
      return { x: tx, y: ty };
    }
    return null;
  };

  const mats: { x: number; y: number }[] = [];
  const area = w * h;

  // one coffee cart per floor, if it fits
  const cart = tryPlace(2, 60);
  if (cart) {
    mark(cart.x, cart.y);
    mark(cart.x + 1, cart.y);
    drawables.push(cartDrawable(cart.x, cart.y));
  }
  // The caps, not the divisors, are what decide density on a large floor:
  // every one of these was already pinned at its old ceiling when the Main
  // Hall was 34x28, so growing the hall without raising them would have
  // spread the same furniture over twice the area and made the bigger room
  // read as an emptier one. Smaller floors are below the caps and unaffected.
  const benchCount = Math.max(1, Math.min(8, Math.floor(area / 200)));
  for (let i = 0; i < benchCount; i++) {
    const p = tryPlace(2, 40);
    if (!p) break;
    mark(p.x, p.y);
    mark(p.x + 1, p.y);
    drawables.push(benchDrawable(p.x, p.y));
  }
  const plantCount = Math.max(3, Math.min(18, Math.floor(area / 90)));
  for (let i = 0; i < plantCount; i++) {
    const p = tryPlace(1, 40);
    if (!p) break;
    mark(p.x, p.y);
    drawables.push(plantDrawable(p.x, p.y, rng()));
  }
  const matCount = Math.max(2, Math.min(9, Math.floor(area / 200)));
  for (let i = 0; i < matCount; i++) {
    const p = tryPlace(2, 40);
    if (!p) break;
    mats.push(p); // walkable — no mark()
  }

  drawables.sort((a, b) => a.sortY - b.sortY);

  // ----- under-layer -----
  const matFill = shade(floor.theme.floorB, -0.1);
  const matRib = shade(floor.theme.floorB, -0.18);
  const matLine = shade(floor.theme.floorB, -0.26);
  const drawUnder = (ctx: CanvasRenderingContext2D, cam: Cam): void => {
    const x0 = Math.max(0, Math.floor(cam.x / T));
    const y0 = Math.max(0, Math.floor(cam.y / T));
    const x1 = Math.min(w - 1, Math.floor((cam.x + cam.w) / T));
    const y1 = Math.min(h - 1, Math.floor((cam.y + cam.h) / T));
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        ctx.fillStyle = (tx + ty) & 1 ? floor.theme.floorB : floor.theme.floorA;
        ctx.fillRect(tx * T, ty * T, T, T);
      }
    }
    // Avenues first, then the plaza on top: the plaza is the destination and
    // its border course should close over the runners meeting it, not the
    // other way round.
    if (plaza) {
      for (const a of plaza.avenues) drawAvenue(ctx, a, cam);
      plazaGround?.draw(ctx, cam);
    }
    // carpets: booth zone + 1-tile apron row below (4 x 4 tiles) — only the
    // ones actually in view; painting every booth's carpet each frame is
    // most of the ground cost on wide floors
    for (const b of booths) {
      const bx = b.spot.x * T;
      const by = b.spot.y * T;
      if (bx + 4 * T < cam.x || bx > cam.x + cam.w || by + 4 * T < cam.y || by > cam.y + cam.h) {
        continue;
      }
      if (b.startup) drawCarpet(ctx, b.spot.x, b.spot.y, b.startup.booth.carpet, b.startup.booth.pattern);
      else drawCarpet(ctx, b.spot.x, b.spot.y, VACANT_FACE, "border");
    }
    // mats — woven doormats, not flat rectangles (a plain fill at 2x zoom
    // reads as an unfinished placeholder)
    for (const m of mats) {
      if (m.x * T + 2 * T < cam.x || m.x * T > cam.x + cam.w || m.y * T + T < cam.y || m.y * T > cam.y + cam.h) {
        continue;
      }
      const mx = m.x * T + 3;
      const my = m.y * T + 4;
      const mw = 2 * T - 6;
      const mh = T - 8;
      ctx.fillStyle = matFill;
      ctx.fillRect(mx, my, mw, mh);
      // weave: alternating vertical ribs
      ctx.fillStyle = matRib;
      for (let sx = mx + 4; sx < mx + mw - 4; sx += 6) {
        ctx.fillRect(sx, my + 3, 3, mh - 6);
      }
      // bound edges top/bottom
      ctx.fillStyle = matLine;
      ctx.fillRect(mx, my, mw, 2);
      ctx.fillRect(mx, my + mh - 2, mw, 2);
      ctx.strokeStyle = matLine;
      ctx.lineWidth = 1;
      ctx.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
    }
  };

  return {
    widthPx: w * T,
    heightPx: h * T,
    booths,
    solid: (tx: number, ty: number): boolean =>
      tx < 0 || ty < 0 || tx >= w || ty >= h || grid[ty * w + tx] === 1,
    drawUnder,
    drawables,
  };
}

// ---------- booth pieces ----------

/** Tile coords in, world pixels out — the art itself lives in boothArt. */
function drawCarpet(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  color: string,
  pattern?: "solid" | "border" | "stripes"
): void {
  paintCarpet(ctx, sx * T, sy * T, color, pattern);
}

function bannerDrawable(b: BoothInstance & { startup: Startup }): Drawable {
  const { x: sx, y: sy } = b.spot;
  const th = b.startup.booth;
  const bx = sx * T;
  const by = sy * T;
  return {
    sortY: (sy + 1) * T,
    minX: bx - 2,
    maxX: bx + 4 * T + 2,
    draw(ctx) {
      drawBoothBanner(ctx, {
        bx,
        by,
        theme: th,
        yours: b.isYours,
        tier: b.startup.tier,
        logoImg: th.logo ? logoImage(th.logo) : null,
        ownerLamp: b.ownerId ? { online: b.ownerOnline === true } : null,
        seed: hashStr(b.startup.id),
      });
    },
  };
}

function counterDrawable(b: BoothInstance & { startup: Startup }): Drawable {
  const { x: sx, y: sy } = b.spot;
  const th = b.startup.booth;
  const bx = sx * T;
  const by = sy * T;
  return {
    minX: bx - 2,
    maxX: bx + 4 * T + 2,
    sortY: (sy + 3) * T,
    draw(ctx) {
      drawBoothCounter(ctx, {
        bx,
        by,
        theme: th,
        seed: hashStr(b.startup.id),
      });
    },
  };
}

function drawCounterBase(ctx: CanvasRenderingContext2D, bx: number, y0: number): void {
  ctx.fillStyle = WOOD_FRONT;
  ctx.fillRect(bx, y0 + 12, 4 * T, T - 12);
  ctx.fillStyle = shade(WOOD_FRONT, -0.24);
  ctx.fillRect(bx, y0 + T - 3, 4 * T, 3);
  ctx.fillStyle = WOOD_TOP;
  ctx.fillRect(bx, y0, 4 * T, 12);
  ctx.fillStyle = shade(WOOD_TOP, -0.2);
  ctx.fillRect(bx, y0 + 12, 4 * T, 2);
}

/**
 * An unclaimed pitch. This used to be a flat grey board reading OPEN SPOT,
 * which made two thirds of a young hall look like scaffolding. It is now a
 * dressed slot: a slate board in a brass-cornered frame on two posts, hung
 * with the spot's number, waiting for somebody. Empty should read as
 * *available*, not as unfinished.
 */
function vacantBannerDrawable(v: { x: number; y: number }, index: number): Drawable {
  const bx = v.x * T;
  const by = v.y * T;
  const w = 4 * T;
  const no = String(index + 1).padStart(2, "0");
  return {
    sortY: (v.y + 1) * T,
    minX: bx - 2,
    maxX: bx + w + 2,
    draw(ctx) {
      // back wall of the stall, so the slot still has depth
      ctx.fillStyle = shade(VACANT_FACE, -0.32);
      ctx.fillRect(bx, by, w, T);
      ctx.fillStyle = shade(VACANT_FACE, -0.18);
      ctx.fillRect(bx, by, w, 4);

      // the two posts the board hangs between
      ctx.fillStyle = SLOT_POST_DARK;
      ctx.fillRect(bx + 5, by - 12, 6, T + 8);
      ctx.fillRect(bx + w - 11, by - 12, 6, T + 8);
      ctx.fillStyle = SLOT_POST;
      ctx.fillRect(bx + 5, by - 12, 3, T + 8);
      ctx.fillRect(bx + w - 11, by - 12, 3, T + 8);

      // board
      const sx = bx + 10;
      const sy = by - 10;
      const sw = w - 20;
      const sh = T + 2;
      ctx.fillStyle = SLOT_FRAME;
      ctx.fillRect(sx - 2, sy - 2, sw + 4, sh + 4);
      ctx.fillStyle = SLOT_FACE;
      ctx.fillRect(sx, sy, sw, sh);
      ctx.fillStyle = shade(SLOT_FACE, 0.1);
      ctx.fillRect(sx, sy, sw, 2);
      // brass corner studs
      ctx.fillStyle = SLOT_BRASS;
      for (const [dx, dy] of [
        [2, 2],
        [sw - 5, 2],
        [2, sh - 5],
        [sw - 5, sh - 5],
      ]) {
        ctx.fillRect(sx + dx, sy + dy, 3, 3);
      }
      // hairline inner rule
      ctx.strokeStyle = shade(SLOT_FACE, 0.18);
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 5.5, sy + 5.5, sw - 11, sh - 11);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#EDE7D8";
      ctx.font = "700 9px Georgia, 'Times New Roman', serif";
      ctx.fillText("OPEN STAND", bx + w / 2, sy + 13, sw - 14);
      ctx.fillStyle = SLOT_BRASS;
      ctx.font = "700 7px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(`NO. ${no}`, bx + w / 2, sy + 25, sw - 14);
    },
  };
}

function vacantCounterDrawable(v: { x: number; y: number }): Drawable {
  const bx = v.x * T;
  const y0 = (v.y + 2) * T;
  const w = 4 * T;
  return {
    sortY: (v.y + 3) * T,
    minX: bx - 2,
    maxX: bx + w + 2,
    draw(ctx) {
      drawCounterBase(ctx, bx, y0);
      // a brass rail along the counter top: the detail that separates
      // "ready for you" from "nobody has been here"
      ctx.fillStyle = SLOT_BRASS;
      ctx.fillRect(bx + 6, y0 - 3, w - 12, 2);
      ctx.fillStyle = shade(SLOT_BRASS, -0.35);
      ctx.fillRect(bx + 6, y0 - 1, w - 12, 1);
      ctx.fillStyle = SLOT_BRASS;
      ctx.fillRect(bx + 7, y0 - 3, 3, 6);
      ctx.fillRect(bx + w - 10, y0 - 3, 3, 6);
      // a small easel card on the counter
      ctx.fillStyle = shade(CARD, -0.3);
      ctx.fillRect(bx + 2 * T + 5, y0 + 3, 14, 9);
      ctx.fillStyle = CARD;
      ctx.fillRect(bx + 2 * T + 4, y0 + 2, 14, 9);
      ctx.strokeStyle = CARD_LINE;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 2 * T + 4.5, y0 + 2.5, 13, 8);
      ctx.fillStyle = ACCENT;
      ctx.fillRect(bx + 2 * T + 6, y0 + 4, 10, 2);
      ctx.fillStyle = MUTED;
      ctx.fillRect(bx + 2 * T + 6, y0 + 8, 7, 1);
    },
  };
}

// ---------- props ----------

function plantDrawable(tx: number, ty: number, variant: number): Drawable {
  const x = tx * T;
  const y = ty * T;
  const tall = variant > 0.5;
  return {
    sortY: (ty + 1) * T,
    minX: x - 2,
    maxX: x + T + 2,
    draw(ctx) {
      // pot
      ctx.fillStyle = shade(POT, -0.25);
      ctx.fillRect(x + 9, y + 24, 14, 3);
      ctx.fillStyle = POT;
      ctx.fillRect(x + 10, y + 17, 12, 8);
      ctx.fillStyle = shade(POT, 0.15);
      ctx.fillRect(x + 8, y + 15, 16, 3);
      // foliage
      const top = tall ? y - 2 : y + 3;
      ctx.fillStyle = LEAF_B;
      ctx.fillRect(x + 10, top + 4, 12, 10);
      ctx.fillStyle = LEAF_A;
      ctx.fillRect(x + 12, top, 8, 8);
      ctx.fillRect(x + 7, top + 6, 7, 6);
      ctx.fillRect(x + 18, top + 6, 7, 6);
      ctx.fillStyle = shade(LEAF_A, 0.18);
      ctx.fillRect(x + 14, top + 2, 3, 3);
    },
  };
}

function benchDrawable(tx: number, ty: number): Drawable {
  const x = tx * T;
  const y = ty * T;
  return {
    sortY: (ty + 1) * T,
    minX: x - 2,
    maxX: x + 2 * T + 2,
    draw(ctx) {
      ctx.fillStyle = shade(WOOD_FRONT, -0.3);
      ctx.fillRect(x + 5, y + 20, 3, 7);
      ctx.fillRect(x + 2 * T - 8, y + 20, 3, 7);
      ctx.fillStyle = WOOD_TOP;
      ctx.fillRect(x + 2, y + 12, 2 * T - 4, 7);
      ctx.fillStyle = shade(WOOD_TOP, -0.2);
      ctx.fillRect(x + 2, y + 19, 2 * T - 4, 2);
      // slat lines
      ctx.fillStyle = shade(WOOD_TOP, -0.12);
      ctx.fillRect(x + 2, y + 15, 2 * T - 4, 1);
    },
  };
}

function cartDrawable(tx: number, ty: number): Drawable {
  const x = tx * T;
  const y = ty * T;
  return {
    sortY: (ty + 1) * T,
    minX: x - 4,
    maxX: x + 2 * T + 4,
    draw(ctx) {
      // awning
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i & 1 ? "#F2EFE7" : ACCENT;
        ctx.fillRect(x + i * 8, y - 8, 8, 7);
      }
      ctx.fillStyle = shade(ACCENT, -0.35);
      ctx.fillRect(x, y - 2, 2 * T, 1);
      // body
      ctx.fillStyle = "#8A6F4B";
      ctx.fillRect(x + 3, y + 6, 2 * T - 6, 18);
      ctx.fillStyle = shade("#8A6F4B", -0.25);
      ctx.fillRect(x + 3, y + 22, 2 * T - 6, 2);
      ctx.fillStyle = WOOD_TOP;
      ctx.fillRect(x + 1, y + 2, 2 * T - 2, 6);
      // kettle + cup on the counter
      ctx.fillStyle = "#3B382F";
      ctx.fillRect(x + 10, y - 4, 8, 7);
      ctx.fillStyle = CARD;
      ctx.fillRect(x + 2 * T - 18, y - 2, 5, 5);
      ctx.fillStyle = MUTED;
      ctx.fillRect(x + 2 * T - 13, y - 1, 2, 2);
      // wheels
      ctx.fillStyle = "#2B2620";
      ctx.fillRect(x + 8, y + 24, 5, 4);
      ctx.fillRect(x + 2 * T - 13, y + 24, 5, 4);
    },
  };
}
