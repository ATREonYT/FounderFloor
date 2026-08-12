/**
 * Actually play every parkour map, with the real engine, and prove a run
 * finishes inside the clock.
 *
 * scripts/parkour-check.mjs proves a route EXISTS by searching a graph of
 * standable tiles. That is a model of the physics, and a model can be
 * wrong — it was, twice. This runs the shipped ParkourRun class itself at a
 * fixed 60Hz with a bot on the controls, so what it proves is not "the
 * geometry looks fine" but "here is a run that reached the exit in 9.4
 * seconds without dying".
 *
 * The bot is deliberately unskilled. It plans a coarse route, then walks
 * towards the next waypoint and jumps only when walking will not get there
 * — no pixel-perfect take-offs, no mid-air corrections beyond steering. If
 * a map cannot be finished like that, it is too fussy for a 25-second level.
 *
 * Run: node scripts/parkour-play.mjs
 *   ONLY=2   just the third map
 *   TRACE=1  print the runner's position every six frames
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const SRC = new URL("../game/parkour.ts", import.meta.url).pathname;
const source = readFileSync(SRC, "utf8");

// Transpile the engine on its own and feed it stubs for the two things it
// imports. Nothing here touches a canvas: we only ever call step().
const dir = mkdtempSync(join(tmpdir(), "ffpk-"));
writeFileSync(
  join(dir, "sprites.js"),
  `export const SPRITE_W = 16;
   export const SPRITE_H = 24;
   export class SpriteBank { makeAvatar() { return { idle: [], walk: [], jump: null }; } }`,
);
writeFileSync(join(dir, "types.js"), "export const TILE = 32;");
// The engine imports the shared limits table (TIME_LIMIT); point it at the
// real file rather than stubbing, or this would be testing a made-up limit.
const LIMITS = new URL("../lib/data/parkour-limits.mjs", import.meta.url).href;
const js = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText
  .replace(/["']\.\.\/lib\/types["']/g, '"./types.js"')
  .replace(/["']\.\/sprites["']/g, '"./sprites.js"')
  .replace(/["']\.\.\/lib\/data\/parkour-limits\.mjs["']/g, JSON.stringify(LIMITS));
writeFileSync(join(dir, "parkour.js"), js);

const { MAPS, ParkourRun, PT, TIME_LIMIT } = await import(
  pathToFileURL(join(dir, "parkour.js")).href
);

const STEP = 1 / 60;
const LOOK = { skin: 0, outfit: 0, hair: 0 };
/** Frames the jump key is held for. Short holds cut the rise (see CUT). */
const HOLD = 24;

const SOLID = new Set(["#", "x"]);
const STANDABLE = new Set(["#", "x", "=", "-", "|"]);

/**
 * A route from the start flag to the exit, as a list of tiles to stand on.
 *
 * Coarse on purpose — one entry per hop, not per tile. The follower below
 * turns each hop into "steer that way and jump", which is what a player
 * does; if that cannot get down the route, the route is too fussy.
 */
function route(grid, W, H) {
  const at = (x, y) => (y < 0 || y >= H || x < 0 || x >= W ? "#" : grid[y][x]);
  const nodes = [];
  const idOf = new Map();
  const add = (x, y) => {
    const k = `${x},${y}`;
    if (idOf.has(k)) return;
    idOf.set(k, nodes.length);
    nodes.push({ x, y, hazard: at(x, y) === "^" });
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const c = at(x, y);
      if (SOLID.has(c) || c === "=") continue;
      if (STANDABLE.has(at(x, y + 1))) add(x, y);
    }
  // a moving platform is a floor that sweeps
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== "-") continue;
      for (let mx = Math.floor(x - 3.2); mx <= Math.ceil(x + 3.2) + 1; mx++) add(mx, y);
    }

  let from = -1;
  let to = -1;
  nodes.forEach((n, i) => {
    if (at(n.x, n.y) === "S") from = i;
    if (at(n.x, n.y) === "G") to = i;
  });
  if (from < 0 || to < 0) return null;

  // Dijkstra, not a plain BFS: a hop along the floor costs 1 and a climb
  // costs 4, so the route prefers the ground and only goes up when the
  // ground genuinely runs out. Hop-count alone happily routed the runner
  // over a ledge and back down for no reason.
  const cost = new Map([[from, 0]]);
  const prev = new Map([[from, -1]]);
  const q = [from];
  while (q.length) {
    q.sort((a, b) => cost.get(a) - cost.get(b));
    const ai = q.shift();
    const a = nodes[ai];
    for (let i = 0; i < nodes.length; i++) {
      const b = nodes[i];
      if (b.hazard) continue;
      const dx = Math.abs(b.x - a.x);
      const up = a.y - b.y;
      if (up > 3 || dx > 4 || (dx === 0 && up === 0)) continue;
      if (up > 0 && dx > 3) continue;
      const c = cost.get(ai) + (up === 0 ? 1 : 4);
      if (cost.has(i) && cost.get(i) <= c) continue;
      cost.set(i, c);
      prev.set(i, ai);
      q.push(i);
    }
  }
  if (!prev.has(to)) return null;
  const path = [];
  for (let i = to; i >= 0; i = prev.get(i)) path.push(nodes[i]);
  return path.reverse();
}

/** Walk the route: steer at the next waypoint, jump only when walking will not do. */
function drive(run, path, grid, W, H) {
  const at = (x, y) => (y < 0 || y >= H || x < 0 || x >= W ? "#" : grid[y][x]);
  const dir = Math.sign(path[path.length - 1].x - path[0].x) || 1;
  let i = 1;
  let hold = 0;
  let cool = 0;
  for (let f = 0; f < Math.ceil(TIME_LIMIT / STEP) + 5; f++) {
    const s = run.status;
    if (s.finished) return s;

    const cx = run.x / PT - 0.5;
    const cy = Math.floor((run.y - 1) / PT);
    // Take the next waypoint once we are standing on this one OR have
    // overshot it — a jump usually lands past the tile it aimed at, and a
    // follower that then turns round to go back never gets anywhere.
    while (
      i < path.length - 1 &&
      cy === path[i].y &&
      (dir > 0 ? cx > path[i].x - 0.4 : cx < path[i].x + 0.4)
    ) {
      i++;
    }
    const t = path[i];

    const dx = t.x - cx;
    const climbing = t.y < cy;
    // Is the floor between here and the waypoint actually walkable? An
    // earlier version jumped whenever the waypoint was more than a tile
    // away, which launched the runner onto the first ledge it passed and
    // left it stranded up there. You walk unless something is in the way.
    let obstructed = false;
    if (!climbing && t.y === cy) {
      const step = Math.sign(dx) || 1;
      for (let x = Math.round(cx) + step; step > 0 ? x <= t.x : x >= t.x; x += step) {
        if (at(x, cy) === "^" || at(x, cy) === "#") obstructed = true;
        if (!STANDABLE.has(at(x, cy + 1))) obstructed = true;
      }
    }

    if (cool > 0) cool--;
    if (hold > 0) hold--;
    else if (run.onGround && (climbing || obstructed) && cool === 0) {
      hold = HOLD;
      cool = HOLD + 4; // a frame off the key, or the buffer never re-arms
    }

    if (process.env.TRACE && f % 6 === 0)
      console.log(
        f, "cx", cx.toFixed(2), "cy", cy, "-> wp", i, `${t.x},${t.y}`,
        "ground", run.onGround, "hold", hold, "obs", obstructed,
      );
    // Standing higher than the waypoint means we overshot upward — onto a
    // ledge, usually. Carry on forward and drop off the front, rather than
    // walking back off the end we came up, which is where spikes tend to be.
    const steer = cy < t.y ? dir : Math.abs(dx) > 0.25 ? Math.sign(dx) : 0;
    run.step(STEP, {
      left: steer < 0,
      right: steer > 0,
      jump: hold > 0,
    });
  }
  return run.status;
}

let bad = 0;
for (const map of (process.env.ONLY ? [MAPS[Number(process.env.ONLY)]] : MAPS)) {
  const W = Math.max(...map.rows.map((r) => r.length));
  const grid = map.rows.map((r) => r.padEnd(W, ".").split(""));
  const path = route(grid, W, grid.length);
  if (!path) {
    console.log(`${map.id.padEnd(14)} NO ROUTE`);
    bad++;
    continue;
  }
  const run = new ParkourRun(map, LOOK, new (class { makeAvatar() { return {}; } })());
  const s = drive(run, path, grid, W, grid.length);

  const ok = s.finished && !s.timedOut;
  console.log(
    `${map.id.padEnd(14)} ${ok ? "CLEARED" : "FAILED "} ` +
      `in ${s.time.toFixed(2)}s (par ${map.par}, limit ${TIME_LIMIT}) ` +
      `· ${s.deaths} death${s.deaths === 1 ? "" : "s"} ` +
      `· ${s.tickets}/${s.ticketsTotal} tickets`,
  );
  if (!ok) {
    bad++;
    console.log(`   the bot ${s.timedOut ? "ran out of time" : "never reached the exit"}`);
  } else if (s.deaths > 2) {
    bad++;
    console.log(`   ${s.deaths} deaths for a straight-line run is too many`);
  } else if (s.time > map.par) {
    // Gold wants par AND every ticket. If a clean bot run cannot even make
    // par empty-handed, nobody is ever getting gold on this map.
    bad++;
    console.log(`   par ${map.par}s is under the ${s.time.toFixed(2)}s a clean run takes`);
  }
}

console.log(bad === 0 ? "\nEVERY MAP PLAYED THROUGH" : `\n${bad} MAP(S) NOT PLAYABLE`);
process.exit(bad ? 1 : 0);
