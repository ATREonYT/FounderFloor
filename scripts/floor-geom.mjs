/**
 * Validate a FloorDef's geometry before any art gets drawn against it.
 *
 * A hand-placed layout is very easy to get subtly wrong — a planter one
 * tile into a booth zone, an avenue that a stand quietly blocks, a corner
 * of the hall that nothing can walk to. None of that shows up as an error;
 * it shows up as a room that feels broken. So: assert it.
 *
 * Checks per floor:
 *   1. every booth zone is inside the walls
 *   2. no two booth zones overlap, and their 1-tile interaction rings clear
 *   3. >= 2 clear tiles between zones on a row, >= 3 clear rows between rows
 *   4. the fountain sits inside the plaza
 *   5. no decoration lands on a booth zone, its apron, or the fountain
 *   6. no decoration blocks an avenue
 *   7. the spawn tile is walkable
 *   8. flood fill from spawn reaches every booth's approach tile and every
 *      avenue tile — i.e. the whole hall is actually connected
 */
import { readFileSync } from "node:fs";

const SRC = new URL("../lib/data/floors.ts", import.meta.url).pathname;
const raw = readFileSync(SRC, "utf8");

// The file is pure data with one type-only import; strip the TS surface and
// evaluate it. Cheaper and far less brittle than a real parser for one file.
const body = raw
  .replace(/^import type .*$/gm, "")
  .replace(/:\s*FloorDef\[\]/g, "")
  .replace(/export const /g, "const ")
  // the one real function in the file is a typed lookup helper we don't need
  .replace(/export function floorById[\s\S]*?\n}\n/, "");
const FLOORS = new Function(`${body}; return FLOORS;`)();

let bad = 0;
const check = (ok, msg, extra = "") => {
  if (!ok) {
    console.log(`  FAIL  ${msg}${extra ? "  — " + extra : ""}`);
    bad++;
  }
};
const pass = (msg) => console.log(`  ok    ${msg}`);

const inRect = (x, y, r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;

for (const f of FLOORS) {
  console.log(`\n${f.id}  ${f.width}x${f.height}  ${f.boothSpots.length} stands`);
  const W = f.width;
  const H = f.height;
  const solid = new Uint8Array(W * H);
  const set = (x, y) => {
    if (x >= 0 && y >= 0 && x < W && y < H) solid[y * W + x] = 1;
  };
  const isSolid = (x, y) => x < 0 || y < 0 || x >= W || y >= H || solid[y * W + x] === 1;

  // walls
  for (let x = 0; x < W; x++) {
    set(x, 0);
    set(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    set(0, y);
    set(W - 1, y);
  }

  // ---- 1 & 2: booth zones ----
  const zoneOwner = new Map();
  let overlaps = 0;
  let outside = 0;
  f.boothSpots.forEach((s, i) => {
    if (s.x < 1 || s.y < 1 || s.x + 3 > W - 2 || s.y + 2 > H - 2) outside++;
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 4; dx++) {
        const k = (s.y + dy) * W + (s.x + dx);
        if (zoneOwner.has(k)) overlaps++;
        zoneOwner.set(k, i);
        set(s.x + dx, s.y + dy);
      }
    }
  });
  check(outside === 0, "every booth zone is inside the walls", `${outside} out of bounds`);
  check(overlaps === 0, "no two booth zones overlap", `${overlaps} shared tiles`);

  // ---- 3: spacing ----
  const byRow = new Map();
  for (const s of f.boothSpots) {
    if (!byRow.has(s.y)) byRow.set(s.y, []);
    byRow.get(s.y).push(s.x);
  }
  let tightH = [];
  for (const [y, xs] of byRow) {
    xs.sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) {
      const gap = xs[i] - (xs[i - 1] + 4);
      if (gap < 2) tightH.push(`y=${y} x=${xs[i - 1]}->${xs[i]} gap ${gap}`);
    }
  }
  check(tightH.length === 0, ">= 2 clear tiles between stands on a row", tightH.join(", "));

  const rows = [...byRow.keys()].sort((a, b) => a - b);
  let tightV = [];
  for (let i = 1; i < rows.length; i++) {
    // previous row occupies rows y..y+2 plus a carpet apron at y+3
    const clear = rows[i] - (rows[i - 1] + 4);
    if (clear < 3) tightV.push(`y=${rows[i - 1]}->${rows[i]} only ${clear} clear rows`);
  }
  check(tightV.length === 0, ">= 3 clear rows between stand rows", tightV.join(", "));

  const p = f.plaza;
  if (p) {
    // ---- 4: fountain inside the plaza ----
    check(
      p.fountain.x0 >= p.rect.x0 &&
        p.fountain.x1 <= p.rect.x1 &&
        p.fountain.y0 >= p.rect.y0 &&
        p.fountain.y1 <= p.rect.y1,
      "the fountain sits inside the plaza",
    );
    for (let y = p.fountain.y0; y <= p.fountain.y1; y++) {
      for (let x = p.fountain.x0; x <= p.fountain.x1; x++) set(x, y);
    }

    // ---- 5 & 6: decoration placement ----
    const onBooth = (x, y, w = 1) => {
      for (let d = 0; d < w; d++) {
        for (const s of f.boothSpots) {
          // zone plus its carpet apron row
          if (x + d >= s.x && x + d <= s.x + 3 && y >= s.y && y <= s.y + 3) return true;
        }
      }
      return false;
    };
    const onFountain = (x, y, w = 1) => {
      for (let d = 0; d < w; d++) if (inRect(x + d, y, p.fountain)) return true;
      return false;
    };
    const onAvenue = (x, y, w = 1) => {
      for (let d = 0; d < w; d++) {
        for (const a of p.avenues) if (inRect(x + d, y, a)) return true;
      }
      return false;
    };

    const clashes = [];
    const blocking = [];
    const place = (list, w, label, isSolidProp, avenueOk) => {
      for (const d of list ?? []) {
        if (onBooth(d.x, d.y, w)) clashes.push(`${label}(${d.x},${d.y}) on a stand`);
        if (onFountain(d.x, d.y, w)) clashes.push(`${label}(${d.x},${d.y}) in the fountain`);
        if (isSolidProp && !avenueOk && onAvenue(d.x, d.y, w)) {
          blocking.push(`${label}(${d.x},${d.y})`);
        }
        if (isSolidProp) for (let i = 0; i < w; i++) set(d.x + i, d.y);
      }
    };
    // lamps live IN the avenues on purpose — they line them. They sit on the
    // outer tiles, which the connectivity flood below has to prove is fine.
    place(p.lamps, 1, "lamp", true, true);
    place(p.planters, 1, "planter", true, false);
    place(p.tables, 2, "table", true, false);
    place(p.kiosks, 2, "kiosk", true, false);
    place(p.stanchions, 1, "stanchion", false, false); // walk-through
    check(clashes.length === 0, "no decoration lands on a stand or the fountain", clashes.join(", "));
    check(blocking.length === 0, "no solid decoration blocks an avenue", blocking.join(", "));
  }

  // ---- 7: spawn ----
  const sx = Math.floor(W / 2);
  const sy = H - 5;
  check(!isSolid(sx, sy), `the spawn tile (${sx},${sy}) is walkable`);

  // ---- 8: connectivity ----
  const seen = new Uint8Array(W * H);
  const q = [sy * W + sx];
  seen[sy * W + sx] = 1;
  let reached = 0;
  while (q.length) {
    const cur = q.pop();
    reached++;
    const cx = cur % W;
    const cy = (cur / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (isSolid(nx, ny)) continue;
      const k = ny * W + nx;
      if (seen[k]) continue;
      seen[k] = 1;
      q.push(k);
    }
  }
  // every stand must be approachable from the front (the apron row)
  const stranded = [];
  f.boothSpots.forEach((s, i) => {
    let ok = false;
    for (let dx = 0; dx < 4; dx++) if (seen[(s.y + 3) * W + s.x + dx]) ok = true;
    if (!ok) stranded.push(`#${i}(${s.x},${s.y})`);
  });
  check(stranded.length === 0, "every stand can be walked up to", stranded.join(", "));

  // and no walkable tile may be cut off from the rest of the hall
  let islands = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (!isSolid(x, y) && !seen[y * W + x]) islands++;
    }
  }
  check(islands === 0, "no walkable tile is cut off from the hall", `${islands} stranded tiles`);

  if (p) {
    let unreachableAvenue = 0;
    for (const a of p.avenues) {
      for (let y = a.y0; y <= a.y1; y++) {
        for (let x = a.x0; x <= a.x1; x++) {
          if (!isSolid(x, y) && !seen[y * W + x]) unreachableAvenue++;
        }
      }
    }
    check(unreachableAvenue === 0, "every avenue is walkable end to end", `${unreachableAvenue} tiles`);
  }

  const walkable = reached;
  const total = (W - 2) * (H - 2);
  console.log(`        ${walkable} walkable tiles of ${total} interior (${Math.round((walkable / total) * 100)}%)`);
  if (bad === 0) pass("geometry clean");
}

console.log(bad === 0 ? "\nALL GEOMETRY CHECKS PASSED" : `\n${bad} CHECK(S) FAILED`);
process.exit(bad ? 1 : 0);
