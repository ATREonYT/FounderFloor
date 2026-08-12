/**
 * Prove every parkour map can actually be finished.
 *
 * "I think that gap is jumpable" is how you ship a level nobody can beat.
 * This works out what the physics in game/parkour.ts can actually do — how
 * high a jump goes, how far it carries — and then does a reachability
 * search over the map's standable surfaces from the start flag to the exit.
 *
 * Checks per map:
 *   1. exactly one start and one exit
 *   2. the exit stands on something
 *   3. every spike sits ON solid ground (a floating spike reads as a bug)
 *   4. no gap is wider than a jump, no step higher than a jump
 *   5. a route exists from the start to the exit
 *   6. every collectable is on that route's reachable set
 *   7. the route is short enough to run inside the time limit
 */
import { readFileSync } from "node:fs";
import { MIN_TIME, TIME_LIMIT } from "../lib/data/parkour-limits.mjs";

const SRC = new URL("../game/parkour.ts", import.meta.url).pathname;
const raw = readFileSync(SRC, "utf8");

const num = (name) => {
  const m = raw.match(new RegExp(`const ${name} = ([0-9.]+);`));
  if (!m) throw new Error(`could not read ${name} from parkour.ts`);
  return Number(m[1]);
};
const PT = num("PT");
const GRAVITY = num("GRAVITY");
const FALL_GRAVITY = num("FALL_GRAVITY");
const RUN = num("RUN");
const JUMP_V = num("JUMP_V");
const MOVER_SPAN = 3.2; // tiles either side of where a '-' or '|' is written

/**
 * How much of the theoretical budget a map is allowed to use.
 *
 * A jump that only works if you take off on the exact pixel and hold right
 * for the whole arc is not a jump, it is a coin flip. Everything below is
 * measured against 80% of what the physics can do, so a map has a real
 * margin rather than a mathematical one.
 */
const MARGIN = 0.8;

// what one jump buys, in tiles
const risePx = (JUMP_V * JUMP_V) / (2 * GRAVITY);
const RISE = risePx / PT;
const airtime = JUMP_V / GRAVITY + Math.sqrt((2 * risePx) / FALL_GRAVITY);
const REACH = (airtime * RUN) / PT;
/** The highest step a map may ask for: a tile of headroom under the ceiling of the jump. */
const MAX_UP = Math.floor(RISE - 1);

console.log(
  `jump budget: ${RISE.toFixed(2)} tiles up, ${REACH.toFixed(2)} tiles across ` +
    `(v=${JUMP_V}, g=${GRAVITY}/${FALL_GRAVITY}, run=${RUN})\n` +
    `authoring limits at ${MARGIN * 100}%: climb <= ${MAX_UP}, ` +
    `flat gap <= ${(REACH * MARGIN).toFixed(1)} tiles\n`,
);

const body = raw.slice(raw.indexOf("export const MAPS"));
const mapsSrc = body.slice(0, body.indexOf("\n];") + 3).replace("export const MAPS: MapDef[] =", "return");
const MAPS = new Function(mapsSrc)();

let bad = 0;
const check = (ok, msg, extra = "") => {
  if (!ok) {
    console.log(`  FAIL  ${msg}${extra ? "  — " + extra : ""}`);
    bad++;
  }
};

const SOLID = new Set(["#", "x"]);
const STANDABLE = new Set(["#", "x", "=", "-", "|"]);

for (const m of MAPS) {
  const before = bad;
  console.log(`${m.id}  (${m.rows[0].length}x${m.rows.length})  par ${m.par}s`);
  const W = Math.max(...m.rows.map((r) => r.length));
  const grid = m.rows.map((r) => r.padEnd(W, ".").split(""));
  const H = grid.length;
  const at = (x, y) => (y < 0 || y >= H || x < 0 || x >= W ? "#" : grid[y][x]);

  let starts = 0;
  let exits = 0;
  let start = null;
  let exit = null;
  const coins = [];
  const spikes = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = at(x, y);
      if (c === "S") {
        starts++;
        start = { x, y };
      } else if (c === "G") {
        exits++;
        exit = { x, y };
      } else if (c === "o") coins.push({ x, y });
      else if (c === "^") spikes.push({ x, y });
    }
  }
  check(starts === 1, "exactly one start", `${starts}`);
  check(exits === 1, "exactly one exit", `${exits}`);
  if (!start || !exit) {
    console.log("");
    continue;
  }
  check(SOLID.has(at(start.x, start.y + 1)), "the start stands on something");
  check(STANDABLE.has(at(exit.x, exit.y + 1)), "the exit stands on something");

  // 3: spikes must sit on the floor, not hang in the air
  const floating = spikes.filter((s) => !SOLID.has(at(s.x, s.y + 1)));
  check(floating.length === 0, "every spike sits on solid ground",
    floating.map((s) => `(${s.x},${s.y})`).join(" "));

  // ---- reachability over standable surface tiles ----
  // A "node" is a tile you can stand ON: air (or a hazard) with something
  // solid directly beneath it.
  const nodes = [];
  const idOf = new Map();
  const addNode = (x, y, extra) => {
    const key = `${x},${y}`;
    if (idOf.has(key)) return;
    idOf.set(key, nodes.length);
    nodes.push({ x, y, hazard: at(x, y) === "^", ...extra });
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const here = at(x, y);
      if (SOLID.has(here) || here === "=") continue;
      if (!STANDABLE.has(at(x, y + 1))) continue;
      // Whether the thing under your feet can be jumped THROUGH from below
      // decides whether you may approach it from directly underneath.
      addNode(x, y, { oneWay: at(x, y + 1) === "=" });
    }
  }
  // A moving platform is a floor that sweeps. Anywhere its top face reaches
  // is somewhere you can stand, including over a pit with nothing under it.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = at(x, y);
      if (c !== "-" && c !== "|") continue;
      const lo = c === "-" ? Math.floor(x - MOVER_SPAN) : x;
      const hi = c === "-" ? Math.ceil(x + MOVER_SPAN) + 1 : x;
      const loY = c === "|" ? Math.floor(y - MOVER_SPAN) : y;
      const hiY = c === "|" ? Math.ceil(y + MOVER_SPAN) : y;
      for (let mx = lo; mx <= hi; mx++) {
        for (let my = loY; my <= hiY; my++) {
          if (mx < 0 || mx >= W || my < 0 || my >= H) continue;
          if (SOLID.has(at(mx, my))) continue;
          addNode(mx, my, { oneWay: true, mover: true });
        }
      }
    }
  }

  /**
   * Can you get from a to b in one jump (or one walk, or one fall)?
   *
   * Two things this gets right that the first version did not:
   *
   *   - horizontal reach is measured at the DESCENDING crossing of the
   *     target height. You land on the way down; measuring on the way up
   *     says a tall climb carries almost nothing sideways, and fails maps
   *     that play fine.
   *   - a solid ledge cannot be entered from directly underneath — you
   *     bang your head on it. Only one-way platforms allow dx = 0.
   */
  const canStep = (a, b) => {
    const dx = Math.abs(b.x - a.x);
    const up = a.y - b.y; // positive = climbing
    if (dx === 0 && up === 0) return false;
    if (up > MAX_UP) return false;
    if (up > 0 && dx === 0 && !b.oneWay) return false;
    const upPx = up * PT;
    const tApex = JUMP_V / GRAVITY;
    const tDown = Math.sqrt((2 * Math.max(0, risePx - upPx)) / FALL_GRAVITY);
    const maxDx = ((tApex + tDown) * RUN) / PT;
    return dx <= maxDx * MARGIN;
  };

  // A spring throws you much higher; treat a node above a spring as a
  // launch pad with its own budget.
  const springRise = ((num("SPRING_V") ** 2) / (2 * GRAVITY)) / PT;

  const from = idOf.get(`${start.x},${start.y}`);
  const to = idOf.get(`${exit.x},${exit.y}`);
  check(from !== undefined, "the start is a standable tile");
  check(to !== undefined, "the exit is a standable tile");
  if (from === undefined || to === undefined) {
    console.log("");
    continue;
  }

  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const a = nodes[queue.shift()];
    const boosted = at(a.x, a.y) === "B" || at(a.x, a.y + 1) === "B";
    for (let i = 0; i < nodes.length; i++) {
      if (seen.has(i)) continue;
      const b = nodes[i];
      if (b.hazard) continue; // you may cross a spike mid-air, never land on it
      const ok = boosted
        ? b.y >= a.y - springRise && Math.abs(b.x - a.x) <= REACH + 2
        : canStep(a, b);
      if (!ok) continue;
      seen.add(i);
      queue.push(i);
    }
  }

  check(seen.has(to), "there is a route from the start to the exit");

  const lost = coins.filter((c) => {
    // a collectable counts as reachable if you can stand under or on it
    for (const dy of [0, 1, -1]) {
      const id = idOf.get(`${c.x},${c.y + dy}`);
      if (id !== undefined && seen.has(id)) return false;
    }
    return true;
  });
  check(lost.length === 0, "every ticket is reachable",
    lost.map((c) => `(${c.x},${c.y})`).join(" "));

  // 7: could a competent run make the time limit? Straight-line distance at
  // run speed, doubled for jumping and backtracking, must fit.
  const runSeconds = ((Math.abs(exit.x - start.x) * PT) / RUN) * 2.2;
  check(runSeconds < TIME_LIMIT,
    `the map is runnable inside the ${TIME_LIMIT}s limit`,
    `needs about ${runSeconds.toFixed(1)}s`);
  check(m.par <= TIME_LIMIT, "par is inside the time limit", `${m.par}s`);

  // 8: the leaderboard rejects times under MIN_TIME as fabricated, so that
  // floor has to sit BELOW the fastest possible honest run — straight from
  // the start flag to the exit at full speed, no jumps, no hazards. Set it
  // too high and a genuinely quick player gets called a cheat.
  const floor = MIN_TIME[m.id];
  const dash = (Math.abs(exit.x - start.x) * PT) / RUN;
  check(typeof floor === "number", `${m.id} has an entry in MIN_TIME`);
  check(
    typeof floor !== "number" || floor < dash,
    "the cheat floor is under the fastest possible run",
    `floor ${floor}s vs ${dash.toFixed(2)}s of pure sprinting`,
  );

  if (bad === before) console.log("  ok    beatable\n");
  else console.log("");
}

console.log(bad === 0 ? "ALL PARKOUR CHECKS PASSED" : `${bad} CHECK(S) FAILED`);
process.exit(bad ? 1 : 0);
