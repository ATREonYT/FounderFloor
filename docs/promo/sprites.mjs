/**
 * The app's own people, for the promo sheets.
 *
 * This is a port of the avatar half of `game/sprites.ts` — the same 20x28
 * grid, the same palettes, the same four directions and three frames, and
 * the same selective 1px outline. It is a port and not an import because
 * `game/sprites.ts` is TypeScript inside the Next app and this file has to
 * be inlined into a plain page that Chromium loads from a string.
 *
 * **If the game's avatars change, change them here too.** The point of the
 * poster is that the people on it are the people you meet, so a drift
 * between the two files is a bug in the poster even though nothing breaks.
 *
 * Runs in the browser only: it paints onto real canvases.
 */

export const SPRITE_W = 20;
export const SPRITE_H = 28;

export const SKIN_TONES = ["#F3D3B3", "#E9BC93", "#D3A075", "#B27E55", "#8C5B3A", "#5F3D27"];

export const OUTFIT_COLORS = [
  "#D9480F", // persimmon
  "#2F3B52", // ink navy
  "#33623A", // forest
  "#B08D2E", // mustard gold
  "#A85560", // dusty rose
  "#2E6E6A", // teal
  "#3B382F", // charcoal
  "#CFC2A4", // oat cream
];

export const HAIR_COLORS = [
  "#241F1C", // black       (crop)
  "#4A3120", // chestnut    (long)
  "#C9A24B", // blonde      (bob)
  "#8A4B23", // auburn      (spiky)
  "#1F2A38", // blue-black  (bun)
  "#7A2E1C", // rust        (side sweep)
  "#8C8578", // grey        (buzz)
  "#3A2A20", // dark brown  (curly)
];

const SHOE = "#2B2620";
const EYE = "#2A241D";

/** Lighten (amt > 0) or darken (amt < 0) a #RRGGBB hex. amt in -1..1. */
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (c) => {
    const v = amt >= 0 ? c + (255 - c) * amt : c * (1 + amt);
    return Math.max(0, Math.min(255, Math.round(v)));
  };
  return `#${((1 << 24) | (ch((n >> 16) & 255) << 16) | (ch((n >> 8) & 255) << 8) | ch(n & 255)).toString(16).slice(1)}`;
}

/* ------------------------------------------------------- pixel grid */

const newGrid = () => new Array(SPRITE_W * SPRITE_H).fill(null);
const put = (g, x, y, c) => {
  if (x >= 0 && y >= 0 && x < SPRITE_W && y < SPRITE_H) g[y * SPRITE_W + x] = c;
};
const rect = (g, x, y, w, h, c) => {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) put(g, xx, yy, c);
};
const clr = (g, x, y) => {
  if (x >= 0 && y >= 0 && x < SPRITE_W && y < SPRITE_H) g[y * SPRITE_W + x] = null;
};

/** Grid to canvas; edge pixels get the darker outline shade. */
function renderGrid(g, flip) {
  const c = document.createElement("canvas");
  c.width = SPRITE_W;
  c.height = SPRITE_H;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const at = (x, y) => (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H ? null : g[y * SPRITE_W + x]);
  for (let y = 0; y < SPRITE_H; y++) {
    for (let x = 0; x < SPRITE_W; x++) {
      const col = at(x, y);
      if (!col) continue;
      const edge = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
      ctx.fillStyle = edge ? shade(col, -0.38) : col;
      ctx.fillRect(flip ? SPRITE_W - 1 - x : x, y, 1, 1);
    }
  }
  return c;
}

function paintHair(g, style, dir, c) {
  const side = dir === "left" || dir === "right";
  const up = dir === "up";
  const cap = () => {
    rect(g, 4, 1, 12, 3, c);
    clr(g, 4, 1);
    clr(g, 15, 1);
  };
  switch (style) {
    case 0: // crop
      cap();
      rect(g, 4, 4, 1, 2, c);
      rect(g, 15, 4, 1, 2, c);
      if (up) rect(g, 5, 4, 10, 4, c);
      if (side) rect(g, 4, 3, 3, 3, c);
      break;
    case 1: // long
      cap();
      rect(g, 3, 3, 2, 11, c);
      rect(g, 15, 3, 2, 11, c);
      if (up) rect(g, 4, 4, 12, 10, c);
      if (side) rect(g, 3, 3, 3, 11, c);
      break;
    case 2: // bob with fringe
      cap();
      rect(g, 3, 3, 2, 7, c);
      rect(g, 15, 3, 2, 7, c);
      if (!up) rect(g, 5, 4, 10, 1, c);
      if (up) rect(g, 4, 4, 12, 6, c);
      if (side) {
        rect(g, 3, 3, 3, 7, c);
        rect(g, 12, 3, 3, 2, c);
      }
      break;
    case 3: // spiky
      cap();
      put(g, 5, 0, c);
      put(g, 8, 0, c);
      put(g, 11, 0, c);
      put(g, 14, 0, c);
      if (up) rect(g, 5, 4, 10, 3, c);
      if (side) rect(g, 4, 3, 2, 3, c);
      break;
    case 4: // bun
      cap();
      rect(g, 8, 0, 4, 1, c);
      if (up) {
        rect(g, 5, 4, 10, 4, c);
        rect(g, 8, 0, 4, 2, c);
      }
      if (side) rect(g, 3, 2, 3, 3, c);
      break;
    case 5: // side sweep
      cap();
      rect(g, 9, 4, 7, 2, c);
      rect(g, 15, 6, 1, 2, c);
      if (up) rect(g, 5, 4, 10, 5, c);
      if (side) rect(g, 11, 3, 4, 3, c);
      break;
    case 6: // buzz
      rect(g, 5, 2, 10, 2, shade(c, 0.06));
      if (up) rect(g, 5, 4, 10, 3, shade(c, 0.06));
      if (side) rect(g, 5, 2, 9, 2, shade(c, 0.06));
      break;
    default: // 7 curly
      rect(g, 3, 1, 14, 4, c);
      clr(g, 3, 1);
      clr(g, 16, 1);
      put(g, 6, 0, c);
      put(g, 10, 0, c);
      put(g, 13, 0, c);
      rect(g, 3, 5, 2, 3, c);
      rect(g, 15, 5, 2, 3, c);
      if (up) rect(g, 4, 4, 12, 6, c);
      if (side) rect(g, 3, 3, 4, 6, c);
      break;
  }
}

/** One pose. "left" is drawn as "right" and mirrored. frame: 0 idle, 1/2 step. */
function buildGrid(look, dir, frame) {
  const g = newGrid();
  const skin = SKIN_TONES[((look.skin % 6) + 6) % 6];
  const outfitIdx = ((look.outfit % 8) + 8) % 8;
  const hairIdx = ((look.hair % 8) + 8) % 8;
  const outfit = OUTFIT_COLORS[outfitIdx];
  const hair = HAIR_COLORS[hairIdx];
  const pants = shade(outfit, -0.42);
  const isSide = dir === "left" || dir === "right";

  if (!isSide) {
    const liftL = frame === 1 ? 2 : 0;
    const liftR = frame === 2 ? 2 : 0;
    rect(g, 6, 21, 3, 5 - liftL, pants);
    rect(g, 6, 26 - liftL, 3, 2, SHOE);
    rect(g, 11, 21, 3, 5 - liftR, pants);
    rect(g, 11, 26 - liftR, 3, 2, SHOE);
    rect(g, 5, 12, 10, 9, outfit);
    rect(g, 5, 12, 10, 1, shade(outfit, 0.18));
    const swing = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    rect(g, 3, 13 + swing, 2, 6, outfit);
    rect(g, 3, 19 + swing, 2, 2, skin);
    rect(g, 15, 13 - swing, 2, 6, outfit);
    rect(g, 15, 19 - swing, 2, 2, skin);
    rect(g, 5, 3, 10, 9, skin);
    clr(g, 5, 3);
    clr(g, 14, 3);
    clr(g, 5, 11);
    clr(g, 14, 11);
    if (dir === "down") {
      rect(g, 7, 7, 1, 2, EYE);
      rect(g, 12, 7, 1, 2, EYE);
      rect(g, 9, 10, 2, 1, shade(skin, -0.22));
    }
  } else {
    const back = frame === 1 ? 5 : frame === 2 ? 9 : 7;
    const front = frame === 1 ? 12 : frame === 2 ? 9 : 10;
    rect(g, back, 21, 3, 5, shade(pants, -0.14));
    rect(g, back, 26, 3, 2, shade(SHOE, -0.1));
    rect(g, front, 21, 3, 5, pants);
    rect(g, front, 26, 4, 2, SHOE);
    rect(g, 6, 12, 9, 9, outfit);
    rect(g, 6, 12, 9, 1, shade(outfit, 0.18));
    const armX = frame === 1 ? 12 : frame === 2 ? 8 : 10;
    rect(g, armX, 13, 2, 6, shade(outfit, 0.1));
    rect(g, armX, 19, 2, 2, skin);
    rect(g, 5, 3, 10, 9, skin);
    clr(g, 5, 3);
    clr(g, 14, 3);
    clr(g, 5, 11);
    clr(g, 14, 11);
    put(g, 15, 7, skin);
    put(g, 15, 8, skin);
    rect(g, 12, 7, 1, 2, EYE);
  }

  paintHair(g, hairIdx, dir, hair);
  return g;
}

const DIRS = ["down", "up", "left", "right"];

/** Idle + two walk frames for all four directions, built once per look. */
const bank = new Map();
export function avatarFrames(look) {
  const key = `${look.skin}|${look.outfit}|${look.hair}`;
  const hit = bank.get(key);
  if (hit) return hit;
  const frames = {};
  for (const dir of DIRS) {
    const src = dir === "left" ? "right" : dir;
    frames[dir] = [0, 1, 2].map((f) => renderGrid(buildGrid(look, src, f), dir === "left"));
  }
  bank.set(key, frames);
  return frames;
}

/* ------------------------------------------------------------ glyphs */

const GLYPHS = {
  wave: ["........", ".XX..XX.", "X..XX..X", "........", ".XX..XX.", "X..XX..X", "........", "........"],
  bolt: ["....XXX.", "...XXX..", "..XXX...", ".XXXXXX.", "...XXX..", "..XXX...", ".XXX....", ".XX....."],
  heart: [".XX..XX.", "XXXXXXXX", "XXXXXXXX", "XXXXXXXX", ".XXXXXX.", "..XXXX..", "...XX...", "........"],
  star: ["...XX...", "...XX...", "XXXXXXXX", ".XXXXXX.", "..XXXX..", ".XXXXXX.", ".XX..XX.", "XX....XX"],
  rocket: ["...XX...", "..XXXX..", "..XXXX..", "..X..X..", "..XXXX..", ".XXXXXX.", "XX.XX.XX", "...XX..."],
};

/** One of the app's 8x8 emote bitmaps, drawn into a size x size box. */
export function drawGlyph(ctx, glyph, x, y, size, color) {
  const rows = GLYPHS[glyph];
  const s = size / 8;
  ctx.fillStyle = color;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (rows[r].charAt(c) === "X") ctx.fillRect(x + c * s, y + r * s, s, s);
}
