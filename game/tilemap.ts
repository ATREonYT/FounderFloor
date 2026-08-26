/**
 * FounderFloor — tile map builder.
 * Turns a FloorDef + startup roster into collision data and draw lists:
 * checkerboard floor, perimeter walls, booth stalls per the 4x3 convention
 * (banner wall / founder lane / counter, facing down), and deterministic
 * ambient props (plants, benches, a coffee cart, floor mats) seeded from
 * the floor id so every visitor sees the same hall.
 */

import { TILE } from "../lib/types";
import type { BoardRow, BoothClaim, BoothInstance, FloorDef, Startup, TileRect } from "../lib/types";
import { shade } from "./sprites";
import { drawBoothBanner, drawBoothCounter, drawCarpet as paintCarpet } from "./boothArt";
import {
  DECOR_WIDTH,
  HallFloor,
  PlazaGround,
  archDrawable,
  decorBlocks,
  decorDrawable,
  drawAvenue,
  drawRunner,
  drawStandPlinth,
  fountainDrawable,
  merchantBackDrawable,
  merchantFrontDrawable,
  noticeBoardDrawable,
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
  /**
   * Hand a notice board its rows. Read at draw time, so standings that
   * arrive over the network after the floor was built still appear —
   * which is every time, since they always do.
   */
  setBoard(id: string, rows: BoardRow[]): void;
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
// The floor of an unlet stand: shell-scheme carpet. Deliberately darker
// AND warmer than the hall's paving — the old near-white made every empty
// stand a bright rectangle, and a grey one merged into the grey stall
// walls, which read as one flat box with a sign on it.
const VACANT_SLAB = "#9E947C";
// dressing for an unclaimed slot: slate board with brass fittings, hung on
// a built stall shell — panelled back wall, two side returns, open front
const SLOT_FACE = "#3A3830";
const SLOT_FRAME = "#26241E";
const SLOT_BRASS = "#B08D2E";
const STALL_BACK = "#BDB6A5";
const STALL_BACK_HI = "#D2CCBC";
const STALL_BACK_DARK = "#948D7D";
const STALL_SIDE = "#A69F8F";
const STALL_SIDE_HI = "#C0B9A8";
const STALL_SIDE_DARK = "#7E7768";
const STALL_TRIM = "#8A8272";
/**
 * The organiser's shell scheme. A real expo sells bare stands with a
 * coloured fascia over the back wall, and the reason is the same one that
 * applies here: twenty identical grey booths is a warehouse, and the same
 * twenty with a colour running along the top is a hall. Muted on purpose —
 * these must never out-shout a stand somebody has actually dressed.
 */
const SHELL_COLORS = [
  "#8C6E5A", // clay
  "#5F7360", // moss
  "#5E6B80", // slate blue
  "#8A7A52", // ochre
  "#7A6070", // plum
  "#4F6E6B", // teal
];
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
  // TODO(spot-id): validate by BoothSpot.id once claims carry ids — an id
  // survives a relayout, so this stops dropping claims it doesn't need to.
  if (!Number.isInteger(idx) || idx < 0 || idx >= floor.boothSpots.length) return false;
  return seedIdAt(floor, idx) === undefined;
}

/**
 * Which seeded startup, if any, stands at this spot index.
 *
 * With `seedSpots` the mapping is explicit, which is how the sample stands
 * stay on the outer bands and leave the plaza rim open for real founders.
 * Without it, the old behaviour: fill in array order, skipping the
 * reserved spot.
 */
export function seedIdAt(floor: FloorDef, idx: number): string | undefined {
  if (floor.seedSpots) {
    const k = floor.seedSpots.indexOf(idx);
    return k >= 0 ? floor.startupIds[k] : undefined;
  }
  let assigned = 0;
  for (let i = 0; i < floor.boothSpots.length && assigned < floor.startupIds.length; i++) {
    if (i === floor.reservedSpot) continue;
    if (i === idx) return floor.startupIds[assigned];
    assigned++;
  }
  return undefined;
}

/** The boothSpots index a seed startup renders at. */
export function seedSpotIndex(floor: FloorDef, startupId: string): number {
  const order = floor.startupIds.indexOf(startupId);
  if (order < 0) return -1;
  if (floor.seedSpots) return floor.seedSpots[order] ?? -1;
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
  const boardRows = new Map<string, BoardRow[]>();

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

    // A post slings its rope to the right only when the next post along is
    // exactly two tiles away, which keeps rope out of the avenue mouths
    // without having to list the gaps by hand.
    const furniture = plaza.furniture ?? [];
    const postAt = new Set(
      furniture.filter((f) => f.kind === "stanchion").map((f) => `${f.x},${f.y}`)
    );
    for (const item of furniture) {
      if (decorBlocks(item.kind)) {
        for (let d = 0; d < DECOR_WIDTH[item.kind]; d++) mark(item.x + d, item.y);
      }
      drawables.push(
        decorDrawable(item, hashStr(`${floor.id}:${item.kind}:${item.x}:${item.y}`), {
          ropeRight: postAt.has(`${item.x + 2},${item.y}`),
          label: item.label,
        })
      );
    }

    for (const m of plaza.merchants ?? []) {
      for (let d = 0; d < 3; d++) mark(m.x + d, m.y);
      if (m.style === "board") {
        // Rows are read at draw time from a box the floor page fills in, so
        // the standings can land after the tilemap is built — which they
        // always do; they come off the network.
        drawables.push(noticeBoardDrawable(m.x, m.y, m.sign, m.color, () => boardRows.get(m.id) ?? []));
      } else {
        drawables.push(
          merchantBackDrawable(m.x, m.y, m.sign, m.color),
          merchantFrontDrawable(m.x, m.y, m.color, hashStr(m.id))
        );
      }
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
  // TODO(spot-id): key this map by BoothSpot.id once claims carry ids.
  const claimBySpot = new Map<number, ClaimEntry>();
  for (const c of claims) claimBySpot.set(c.claim.spotIndex, c);

  const booths: BoothInstance[] = [];
  floor.boothSpots.forEach((spot, i) => {
    // solid: banner wall, founder lane (players keep out) and counter —
    // the same three rows whichever way the stand faces; only the art and
    // the walkable apron flip
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 4; dx++) mark(spot.x + dx, spot.y + dy);
    const base = { spot: { x: spot.x, y: spot.y, face: spot.face }, spotIndex: i };
    // seed booths own their spots outright; the reserved spot skips seeding
    if (i !== floor.reservedSpot) {
      const id = seedIdAt(floor, i);
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
  //
  // ─── COMPOSED FLOORS DO NOT SCATTER ────────────────────────────────
  // A floor with an authored `plaza.furniture` list has had every prop
  // placed on purpose, checked by scripts/floor-geom.mjs. Dropping eight
  // more benches and eighteen plants at random on top of that is what
  // made the Main Hall read as "everything thrown at you": a bench alone
  // in the middle of the floor with nothing around it, because nothing
  // put it there. Floors with no authored list still scatter — they have
  // no other source of ambience.
  const composed = (plaza?.furniture?.length ?? 0) > 0;
  const nearBoothRing = (tx: number, ty: number): boolean => {
    for (const s of floor.boothSpots) {
      // As far as the interaction ring reaches on EITHER side — the strip
      // somebody has to stand in to use the stand, whichever way it faces.
      if (tx >= s.x - 1 && tx <= s.x + 4 && ty >= s.y - 3 && ty <= s.y + 5) return true;
    }
    return false;
  };
  const onRunner = (tx: number, ty: number): boolean =>
    (plaza?.runners ?? []).some((r) => inRect(tx, ty, r));
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
    !onRunner(tx, ty) &&
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
  const cart = composed ? null : tryPlace(2, 60);
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
  const benchCount = composed ? 0 : Math.max(1, Math.min(8, Math.floor(area / 200)));
  for (let i = 0; i < benchCount; i++) {
    const p = tryPlace(2, 40);
    if (!p) break;
    mark(p.x, p.y);
    mark(p.x + 1, p.y);
    drawables.push(benchDrawable(p.x, p.y));
  }
  const plantCount = composed ? 0 : Math.max(3, Math.min(18, Math.floor(area / 90)));
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
  const hallFloor = new HallFloor(floor.theme, w, h);
  const matFill = shade(floor.theme.floorB, -0.1);
  const matRib = shade(floor.theme.floorB, -0.18);
  const matLine = shade(floor.theme.floorB, -0.26);
  const drawUnder = (ctx: CanvasRenderingContext2D, cam: Cam): void => {
    const x0 = Math.max(0, Math.floor(cam.x / T));
    const y0 = Math.max(0, Math.floor(cam.y / T));
    const x1 = Math.min(w - 1, Math.floor((cam.x + cam.w) / T));
    const y1 = Math.min(h - 1, Math.floor((cam.y + cam.h) / T));
    hallFloor.draw(ctx, cam);
    // Aisle runners, then avenues, then the plaza on top: each is a bigger
    // destination than the last, and the more important surface should
    // close over the one meeting it rather than the other way round.
    if (plaza) {
      for (const r of plaza.runners ?? []) drawRunner(ctx, r, cam);
      for (const a of plaza.avenues) drawAvenue(ctx, a, cam);
      plazaGround?.draw(ctx, cam);
    }
    // carpets: booth zone + 1-tile apron row on the ENTRANCE side (4 x 4
    // tiles) — below for a stand facing down, above for one facing up.
    // Only the ones actually in view; painting every booth's carpet each
    // frame is most of the ground cost on wide floors.
    for (const b of booths) {
      const bx = b.spot.x * T;
      const by = (b.spot.y - (b.spot.face === "up" ? 1 : 0)) * T;
      if (bx + 4 * T < cam.x || bx > cam.x + cam.w || by + 4 * T < cam.y || by > cam.y + cam.h) {
        continue;
      }
      // The plinth goes under BOTH kinds of stand — a claimed stand and an
      // open one are the same piece of built furniture, and only one of
      // them having a base is what made the rim of the plaza look wrong.
      drawStandPlinth(ctx, bx, by);
      if (b.startup) paintCarpet(ctx, bx, by, b.startup.booth.carpet, b.startup.booth.pattern);
      else drawVacantCarpet(ctx, bx, by);
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
    setBoard(id, rows) {
      boardRows.set(id, rows);
    },
  };
}

// ---------- booth pieces ----------

/**
 * Shell-scheme carpet for an unlet stand: a woven texture and a bound edge
 * rather than a flat fill. A rank of twenty flat rectangles is the single
 * biggest reason an early hall looks unfinished, and weave costs one extra
 * pass of 4px squares.
 */
function drawVacantCarpet(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const cw = 4 * T;
  const ch = 4 * T;
  ctx.fillStyle = VACANT_SLAB;
  ctx.fillRect(x, y, cw, ch);
  ctx.fillStyle = shade(VACANT_SLAB, -0.05);
  for (let yy = y; yy < y + ch; yy += 8) {
    for (let xx = x + (((yy - y) / 8) & 1 ? 4 : 0); xx < x + cw; xx += 8) {
      ctx.fillRect(xx, yy, 4, 4);
    }
  }
  // bound edge, taped down like a real stand's carpet
  ctx.fillStyle = shade(VACANT_SLAB, -0.2);
  ctx.fillRect(x, y, cw, 3);
  ctx.fillRect(x, y + ch - 3, cw, 3);
  ctx.fillRect(x, y, 3, ch);
  ctx.fillRect(x + cw - 3, y, 3, ch);
  ctx.fillStyle = shade(VACANT_SLAB, 0.1);
  ctx.fillRect(x + 3, y + 3, cw - 6, 1);
}

function bannerDrawable(b: BoothInstance & { startup: Startup }): Drawable {
  const { x: sx, y: sy } = b.spot;
  const up = b.spot.face === "up";
  const th = b.startup.booth;
  const bx = sx * T;
  /**
   * Where the sign wall stands. Facing down it is the zone's TOP row;
   * facing up it moves to the BOTTOM row, so the stand reads counter,
   * open lane, then the wall closing it off from behind — the camera
   * never rotates, so "facing away" is drawn by rearranging rows, never
   * by mirroring art. sortY moves to the wall's new base so a player
   * walking the row below it is drawn in front of it, not through it.
   */
  const by = (sy + (up ? 2 : 0)) * T;
  return {
    sortY: up ? (sy + 3) * T : (sy + 1) * T,
    minX: bx - 2,
    maxX: bx + 4 * T + 2,
    draw(ctx) {
      drawBoothBanner(ctx, {
        bx,
        by,
        theme: th,
        // the gold "yours" threshold is drawn on the entrance side by
        // hand below — drawBoothBanner would put it under the wall, which
        // for a flipped stand is the back
        yours: up ? false : b.isYours,
        tier: b.startup.tier,
        logoImg: th.logo ? logoImage(th.logo) : null,
        ownerLamp: b.ownerId ? { online: b.ownerOnline === true } : null,
        seed: hashStr(b.startup.id),
      });
      if (up && b.isYours) {
        ctx.fillStyle = "#B08D2E";
        ctx.fillRect(bx + 2, sy * T - 4, 4 * T - 4, 3);
      }
      // A sample stand says so on the stand. Small, in the corner, and not
      // negotiable: a made-up company on a floor full of real ones has to
      // be legible as made up without anybody having to click it.
      if (b.startup.demo) {
        ctx.fillStyle = "rgba(35,32,26,0.82)";
        ctx.fillRect(bx + 4 * T - 46, by - 7, 42, 11);
        ctx.fillStyle = "#EDE7D8";
        ctx.font = "700 7px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("SAMPLE", bx + 4 * T - 25, by - 1, 38);
      }
    },
  };
}

function counterDrawable(b: BoothInstance & { startup: Startup }): Drawable {
  const { x: sx, y: sy } = b.spot;
  const up = b.spot.face === "up";
  const th = b.startup.booth;
  const bx = sx * T;
  // drawBoothCounter paints at by + 2 tiles, so shifting the origin up two
  // rows lands the counter on the zone's TOP row for a stand facing up.
  const by = (sy - (up ? 2 : 0)) * T;
  return {
    minX: bx - 2,
    maxX: bx + 4 * T + 2,
    sortY: up ? (sy + 1) * T : (sy + 3) * T,
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
function vacantBannerDrawable(
  v: { x: number; y: number; face?: "up" | "down" },
  index: number,
): Drawable {
  const bx = v.x * T;
  const by = v.y * T;
  const up = v.face === "up";
  const w = 4 * T;
  const no = String(index + 1).padStart(2, "0");
  const shell = SHELL_COLORS[index % SHELL_COLORS.length];
  return {
    sortY: up ? (v.y + 3) * T : (v.y + 1) * T,
    minX: bx - 4,
    maxX: bx + w + 4,
    draw(ctx) {
      // ---- the shell of the stall ----
      // An empty stand used to be a sign standing on a rectangle of carpet,
      // which is why a rank of them read as flat cards rather than as
      // built stalls. It is now a booth: back wall, two returns down each
      // side, and an open front you look into.
      //
      // Facing up, the rows rearrange rather than mirror (the camera
      // never rotates): the wall moves to the BOTTOM row so it closes the
      // stall off from behind, the returns run up from it to the counter
      // now at the top, and the chair and bin stay in the open lane
      // between them.
      const backTop = up ? (v.y + 2) * T - 12 : by - 12;
      // where the side returns stop: at the counter, whichever row it is on
      const lane = up ? (v.y + 3) * T - 2 : by + 2 * T;
      const retTop = up ? v.y * T + 14 : backTop;

      // side returns first, so the back wall closes over their inner edge
      for (const side of [0, 1]) {
        const rx = side === 0 ? bx : bx + w - 12;
        ctx.fillStyle = STALL_SIDE_DARK;
        ctx.fillRect(rx, retTop, 12, lane - retTop);
        ctx.fillStyle = STALL_SIDE;
        ctx.fillRect(rx + (side === 0 ? 0 : 3), retTop, 9, lane - retTop);
        ctx.fillStyle = STALL_SIDE_HI;
        ctx.fillRect(rx + (side === 0 ? 0 : 9), retTop, 3, lane - retTop);
        // the fascia colour carries round the returns
        ctx.fillStyle = shade(shell, -0.12);
        ctx.fillRect(rx, retTop, 12, 7);
        // a foot rail where the return meets the floor
        ctx.fillStyle = STALL_TRIM;
        ctx.fillRect(rx, lane - 4, 12, 3);
      }

      // back wall panel
      ctx.fillStyle = STALL_BACK_DARK;
      ctx.fillRect(bx + 6, backTop, w - 12, T + 14);
      ctx.fillStyle = STALL_BACK;
      ctx.fillRect(bx + 6, backTop, w - 12, T + 10);
      // panel seams — a wall built from boards, not one flat fill
      ctx.fillStyle = STALL_BACK_DARK;
      for (let i = 1; i < 3; i++) {
        ctx.fillRect(bx + 6 + i * ((w - 12) / 3), backTop + 3, 1, T + 7);
      }
      // the shell scheme's coloured fascia across the top of the wall
      ctx.fillStyle = shell;
      ctx.fillRect(bx + 6, backTop, w - 12, 7);
      ctx.fillStyle = shade(shell, 0.22);
      ctx.fillRect(bx + 6, backTop, w - 12, 2);
      ctx.fillStyle = shade(shell, -0.3);
      ctx.fillRect(bx + 6, backTop + 7, w - 12, 2);
      // two downlights on the underside of the fascia
      ctx.fillStyle = STALL_TRIM;
      ctx.fillRect(bx + 30, backTop + 9, 7, 4);
      ctx.fillRect(bx + w - 37, backTop + 9, 7, 4);
      ctx.fillStyle = "#F6E2B0";
      ctx.fillRect(bx + 31, backTop + 12, 5, 2);
      ctx.fillRect(bx + w - 36, backTop + 12, 5, 2);

      // shadow the wall throws onto the floor at its base
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#2A251D";
      ctx.fillRect(bx + 6, backTop + T + 14, w - 12, 7);
      ctx.restore();

      // The kit that comes with a bare stand: a folding chair and a bin.
      // An empty stall with nothing in it reads as a hole in the wall; the
      // same stall with a chair in it reads as ready for somebody. Sides
      // alternate by spot so a rank of them is not a rhythm of identical
      // furniture.
      const chairLeft = index % 2 === 0;
      const cyp = up ? (v.y + 1) * T + 2 : by + T + 12;

      // Chair: legs, a seat, and a GAP under the backrest. The gap is the
      // whole silhouette — without it a chair and a bin are two grey lumps
      // of the same size and neither reads as anything.
      const cxp = chairLeft ? bx + 22 : bx + w - 42;
      ctx.fillStyle = "#3B3830";
      ctx.fillRect(cxp + 2, cyp + 9, 3, 8);
      ctx.fillRect(cxp + 14, cyp + 9, 3, 8);
      ctx.fillStyle = "#57534A";
      ctx.fillRect(cxp, cyp + 4, 19, 5);
      ctx.fillStyle = "#6E6A60";
      ctx.fillRect(cxp, cyp + 4, 19, 2);
      // backrest, floating two pixels clear of the seat
      ctx.fillStyle = "#3B3830";
      ctx.fillRect(cxp + 2, cyp - 9, 3, 12);
      ctx.fillRect(cxp + 14, cyp - 9, 3, 12);
      ctx.fillStyle = "#57534A";
      ctx.fillRect(cxp + 1, cyp - 9, 17, 6);
      ctx.fillStyle = "#7C786C";
      ctx.fillRect(cxp + 1, cyp - 9, 17, 2);

      // Bin: narrow, tapered, with a rim — a different silhouette entirely.
      const bxp = chairLeft ? bx + w - 30 : bx + 18;
      ctx.fillStyle = "#4E4A42";
      ctx.fillRect(bxp + 1, cyp - 1, 11, 17);
      ctx.fillStyle = "#666158";
      ctx.fillRect(bxp + 2, cyp - 1, 5, 17);
      ctx.fillStyle = "#3B3830";
      ctx.fillRect(bxp + 2, cyp + 14, 9, 3);
      // rim
      ctx.fillStyle = "#7A7568";
      ctx.fillRect(bxp - 1, cyp - 4, 15, 4);
      ctx.fillStyle = "#938E7E";
      ctx.fillRect(bxp - 1, cyp - 4, 15, 1);
      // a dark mouth, so it is obviously open
      ctx.fillStyle = "#2A2721";
      ctx.fillRect(bxp + 2, cyp - 3, 9, 2);

      // board
      const sx = bx + 14;
      const sy = backTop + 4;
      const sw = w - 28;
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

function vacantCounterDrawable(v: { x: number; y: number; face?: "up" | "down" }): Drawable {
  const bx = v.x * T;
  const up = v.face === "up";
  const y0 = (v.y + (up ? 0 : 2)) * T;
  const w = 4 * T;
  return {
    sortY: (v.y + (up ? 1 : 3)) * T,
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
