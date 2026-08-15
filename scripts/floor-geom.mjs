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

  // A stand's footprint is its 3 zone rows plus the carpet apron on its
  // ENTRANCE side — below when it faces down, above when it faces up. Two
  // facing ranks with a two-row aisle between their aprons is the tightest
  // legal fit, and it is also the intended one: that aisle IS the street.
  const footprint = (s) =>
    s.face === "up" ? { top: s.y - 1, bottom: s.y + 2 } : { top: s.y, bottom: s.y + 3 };
  const rows = [...byRow.keys()].sort((a, b) => a - b);
  const faceOfRow = new Map(f.boothSpots.map((s) => [s.y, s.face ?? "down"]));
  let tightV = [];
  for (let i = 1; i < rows.length; i++) {
    const prevBottom = footprint({ y: rows[i - 1], face: faceOfRow.get(rows[i - 1]) }).bottom;
    const nextTop = footprint({ y: rows[i], face: faceOfRow.get(rows[i]) }).top;
    const clear = nextTop - prevBottom - 1;
    if (clear < 2) tightV.push(`y=${rows[i - 1]}->${rows[i]} only ${clear} clear rows`);
  }
  check(tightV.length === 0, ">= 2 clear rows between stand footprints", tightV.join(", "));

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
          // zone plus its carpet apron row, on whichever side it opens
          const { top, bottom } = footprint(s);
          if (x + d >= s.x && x + d <= s.x + 3 && y >= top && y <= bottom) return true;
        }
      }
      return false;
    };
    // A walkway is an avenue OR an aisle runner. The runners used to be
    // exempt, and a lamp post standing in the middle of the carpet is
    // exactly the sort of thing you walk into and swear at.
    const onWalkway = (x, y) => {
      for (const a of p.avenues) if (inRect(x, y, a)) return true;
      for (const r of p.runners ?? []) if (inRect(x, y, r)) return true;
      return false;
    };

    // Widths must match DECOR_WIDTH in game/decor.ts. Lamps line the
    // avenues on purpose; everything else solid must keep out of them.
    const WIDTH = {
      planter: 1, lamp: 1, stanchion: 1, table: 2, kiosk: 2,
      tree: 1, sofa: 2, bar: 3, board: 2, crates: 1, sign: 1, bench: 2,
    };
    const WALK_THROUGH = new Set(["stanchion"]);
    // Nothing solid may stand on a walkway. Lamps used to be exempt and
    // lined the avenues; walking one then felt like a slalom.
    const AVENUE_OK = new Set();


    const clashes = [];
    const blocking = [];
    const offMap = [];
    const occupied = new Map();
    for (const d of p.furniture ?? []) {
      const wd = WIDTH[d.kind];
      if (wd === undefined) {
        clashes.push(`unknown kind "${d.kind}" at (${d.x},${d.y})`);
        continue;
      }
      const solidProp = !WALK_THROUGH.has(d.kind);
      const tag = `${d.kind}(${d.x},${d.y})`;
      for (let i = 0; i < wd; i++) {
        const x = d.x + i;
        if (x < 1 || x > W - 2 || d.y < 1 || d.y > H - 2) offMap.push(tag);
        if (onBooth(x, d.y)) clashes.push(`${tag} on a stand`);
        if (inRect(x, d.y, p.fountain)) clashes.push(`${tag} in the fountain`);
        if (solidProp && !AVENUE_OK.has(d.kind) && onWalkway(x, d.y)) blocking.push(tag);
        if (solidProp) {
          const k = `${x},${d.y}`;
          if (occupied.has(k)) clashes.push(`${tag} overlaps ${occupied.get(k)}`);
          occupied.set(k, tag);
          set(x, d.y);
        }
      }
    }
    check(offMap.length === 0, "every piece of furniture is inside the walls", [...new Set(offMap)].join(", "));
    check(
      clashes.length === 0,
      "no furniture lands on a stand, the fountain, or another piece",
      [...new Set(clashes)].slice(0, 8).join(", "),
    );
    check(blocking.length === 0, "no solid furniture stands on a walkway", [...new Set(blocking)].join(", "));

    // Nothing solid may sit in the two rows in front of a stand. That strip
    // is how you reach it: the interaction ring is spot.y..spot.y+5, and a
    // prop parked in it makes the stand look approachable and not be.
    const blocked = new Set();
    for (const s2 of f.boothSpots) {
      const appr = s2.face === "up" ? [s2.y - 3, s2.y - 2] : [s2.y + 4, s2.y + 5];
      for (const y of appr) {
        for (let x = s2.x; x <= s2.x + 3; x++) {
          if (occupied.has(`${x},${y}`)) blocked.add(`stand(${s2.x},${s2.y}) <- ${occupied.get(`${x},${y}`)}`);
        }
      }
    }
    check(blocked.size === 0, "the approach to every stand is clear", [...blocked].slice(0, 6).join(", "));

    // runners are decoration only — they must never be laid under a stand
    const overRun = new Set();
    for (const r of p.runners ?? []) {
      for (let y = r.y0; y <= r.y1; y++) {
        for (let x = r.x0; x <= r.x1; x++) if (onBooth(x, y)) overRun.add(`(${x},${y})`);
      }
    }
    check(overRun.size === 0, "no aisle runner is laid under a stand", [...overRun].slice(0, 4).join(", "));

    // merchant stalls: three tiles wide, solid, and never on a walkway
    const mBad = [];
    for (const m of p.merchants ?? []) {
      const tag = `merchant ${m.id}(${m.x},${m.y})`;
      for (let i = 0; i < 3; i++) {
        const x = m.x + i;
        if (x < 1 || x > W - 2 || m.y < 1 || m.y > H - 2) mBad.push(`${tag} off map`);
        if (onBooth(x, m.y)) mBad.push(`${tag} on a stand`);
        if (onWalkway(x, m.y)) mBad.push(`${tag} blocks a walkway`);
        const k = `${x},${m.y}`;
        if (occupied.has(k)) mBad.push(`${tag} overlaps ${occupied.get(k)}`);
        occupied.set(k, tag);
        set(x, m.y);
      }
    }
    check(mBad.length === 0, "merchant stalls are clear of stands and walkways", [...new Set(mBad)].join(", "));

    // The fountain has to be CENTRED in the plaza, or the inlaid rings in
    // the paving and the stonework inside them sit at different middles —
    // which is exactly what "the fountain looks off-centre" turned out to be.
    const pcx = (p.rect.x0 + p.rect.x1 + 1) / 2;
    const pcy = (p.rect.y0 + p.rect.y1 + 1) / 2;
    const fcx = (p.fountain.x0 + p.fountain.x1 + 1) / 2;
    const fcy = (p.fountain.y0 + p.fountain.y1 + 1) / 2;
    check(
      Math.abs(pcx - fcx) < 0.01 && Math.abs(pcy - fcy) < 0.01,
      "the fountain is centred in the plaza",
      `plaza centre ${pcx},${pcy} vs fountain ${fcx},${fcy}`,
    );

    // and no stand may sit ON the paving: the plaza edge running into the
    // northern rank is what made those stands look pasted down
    const touching = new Set();
    for (const s of f.boothSpots) {
      const { top, bottom } = footprint(s);
      for (let y = top; y <= bottom; y++) {
        for (let x = s.x; x <= s.x + 3; x++) {
          if (inRect(x, y, p.rect)) touching.add(`stand(${s.x},${s.y})`);
        }
      }
    }
    check(touching.size === 0, "no stand overlaps the plaza paving", [...touching].join(", "));
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
  // every stand must be approachable from the front (its apron row —
  // above the zone for a stand facing up, below it otherwise)
  const stranded = [];
  f.boothSpots.forEach((s, i) => {
    const ay = s.face === "up" ? s.y - 1 : s.y + 3;
    let ok = false;
    for (let dx = 0; dx < 4; dx++) if (seen[ay * W + s.x + dx]) ok = true;
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
