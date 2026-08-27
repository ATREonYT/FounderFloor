/**
 * FounderFloor — the spot plans the floor server shares with the web app.
 *
 * Plain .mjs for the same reason event-window.mjs is: the floor server
 * (server/index.mjs) has to know WHERE the pitches are and WHAT tier each
 * one is, because a lapsed gold hold is handled server-side — the stand
 * relocates to the nearest free bronze spot even while its owner is
 * offline. The web app needs the identical table for the floor renderer
 * and the claim UI. Two copies of a floor plan drift; this is the one.
 *
 * lib/data/floors.ts spreads MAIN_HALL_SPOTS into the Main Hall FloorDef
 * verbatim — the array HERE is the source of truth for that floor's
 * pitches. Every rule from floors.ts still binds:
 *
 *   ORDER IS IDENTITY  claims travel as indexes until the TODO(spot-id)
 *                      migration lands: append, never reorder.
 *   IDS ARE PERMANENT  never reused, never renamed once shipped.
 *   TIERS              the value gradient is documented at length in
 *                      floors.ts (THE VALUE GRADIENT); the short form is
 *                      that value falls off with distance from the spawn
 *                      tile and the fountain.
 */

import { nextWindow } from "./event-window.mjs";

/** @typedef {{id: string, x: number, y: number, face?: "up"|"down", tier?: "gold"|"silver"|"bronze"}} PlanSpot */

/** @type {PlanSpot[]} */
export const MAIN_HALL_SPOTS = [
  // GOLD — the inner rank, flanking the two avenue mouths. The four best
  // places in the building, one street back from the fountain: the south
  // pair meets every arrival face-on, the north pair shows its sign wall
  // across the water.
  { id: "rim-n-inner-w", x: 21, y: 12, face: "up", tier: "gold" },
  { id: "rim-n-inner-e", x: 33, y: 12, face: "up", tier: "gold" },
  { id: "rim-s-inner-w", x: 21, y: 27, tier: "gold" },
  { id: "rim-s-inner-e", x: 33, y: 27, tier: "gold" },
  // SILVER — the inner rank's outer pair on each rim: on the plaza, off
  // the arrival sightline.
  { id: "rim-n-outer-w", x: 15, y: 12, face: "up", tier: "silver" },
  { id: "rim-n-outer-e", x: 39, y: 12, face: "up", tier: "silver" },
  { id: "rim-s-outer-w", x: 15, y: 27, tier: "silver" },
  { id: "rim-s-outer-e", x: 39, y: 27, tier: "silver" },
  // Outer band, working away from the avenues. SILVER at the north avenue
  // mouth; GOLD at the south one — the entrance pair is the first thing
  // every visitor walks between.
  { id: "outer-n-w1", x: 21, y: 5, tier: "silver" },
  { id: "outer-n-e1", x: 33, y: 5, tier: "silver" },
  { id: "outer-s-w1", x: 21, y: 34, face: "up", tier: "gold" },
  { id: "outer-s-e1", x: 33, y: 34, face: "up", tier: "gold" },
  // SILVER second-from-the-avenue on the entrance street only; the north
  // band's second pair is already past the traffic.
  { id: "outer-n-w2", x: 15, y: 5, tier: "bronze" },
  { id: "outer-n-e2", x: 39, y: 5, tier: "bronze" },
  { id: "outer-s-w2", x: 15, y: 34, face: "up", tier: "silver" },
  { id: "outer-s-e2", x: 39, y: 34, face: "up", tier: "silver" },
  // BRONZE — the far columns, out toward the side walls.
  { id: "outer-n-w3", x: 9, y: 5, tier: "bronze" },
  { id: "outer-n-e3", x: 45, y: 5, tier: "bronze" },
  { id: "outer-s-w3", x: 9, y: 34, face: "up", tier: "bronze" },
  { id: "outer-s-e3", x: 45, y: 34, face: "up", tier: "bronze" },
  { id: "outer-n-w4", x: 3, y: 5, tier: "bronze" },
  { id: "outer-n-e4", x: 51, y: 5, tier: "bronze" },
  { id: "outer-s-w4", x: 3, y: 34, face: "up", tier: "bronze" },
  { id: "outer-s-e4", x: 51, y: 34, face: "up", tier: "bronze" },
];

/**
 * Floors with position pricing. A floor absent from this table has no
 * paid tiers — every spot on it is bronze and nothing ever lapses.
 * @type {Record<string, PlanSpot[]>}
 */
export const SPOT_PLANS = {
  "main-hall": MAIN_HALL_SPOTS,
};

// ─── THE SAMPLE STANDS, AND THE DIAL THAT RETIRES THEM ─────────────────
//
// lib/data/startups.ts ships sixteen sample companies (demo: true — every
// surface labels them SAMPLE and every server-fed listing structurally
// excludes them, because they never register). They exist so an empty
// entrance doesn't read as a hall that closed down; they are a liability
// the moment a visitor mistakes one for a real company.
//
// SEED_VISIBLE_COUNT is the one dial. It defaults to 0 — the hall ships
// EMPTY, which is the standing decision recorded above startupIds in
// floors.ts ("every person you see in this room is a person"). Raising it
// seats the first N samples below, fully labelled; lowering it retires
// them again, newest-seated first, and their spots simply show as OPEN
// STAND boards. Fiction retreats as reality arrives, one number, no
// layout edit.
//
// The seat order never touches a GOLD spot — the plaza rim and the
// entrance pair stay open for people — and fills bronze before silver,
// nearest the entrance street first, so a small N still makes the walk
// from the door read as inhabited.
export const SEED_VISIBLE_COUNT = 0;

/** The sixteen sample startups, in seating order. */
export const MAIN_HALL_SEED_IDS = [
  "soup-ticket", "night-shift-audio", "crate-and-pallet", "zine-machine",
  "sheet-metal", "on-call-room", "lower-third", "second-stove",
  "pocket-notary", "grave-matters", "kerb-appeal", "second-fiddle",
  "damp-patrol", "the-long-table", "pothole-index", "ferrule-repairs",
];

/**
 * Where each seed sits (indexes into MAIN_HALL_SPOTS, paired with
 * MAIN_HALL_SEED_IDS by position): the ten bronze spots first — the
 * entrance street's pair, then the north band working outward — then six
 * silver. Never gold. scripts/floor-geom.mjs asserts all of that.
 */
export const MAIN_HALL_SEED_SPOTS = [
  18, 19, // outer-s-w3/e3 — bronze, on the entrance street
  12, 13, // outer-n-w2/e2 — bronze
  16, 17, // outer-n-w3/e3 — bronze
  20, 21, // outer-n-w4/e4 — bronze
  22, 23, // outer-s-w4/e4 — bronze
  4, 5,   // rim-n-outer-w/e — silver, far side of the plaza
  8, 9,   // outer-n-w1/e1 — silver
  6, 7,   // rim-s-outer-w/e — silver
];

/** The spot indexes currently occupied by visible samples on a floor —
 * the server keeps relocated stands off them, the client already treats
 * them as unclaimable. */
export function seededSpotIndexes(floorId) {
  if (floorId !== "main-hall") return [];
  return MAIN_HALL_SEED_SPOTS.slice(0, SEED_VISIBLE_COUNT);
}

/**
 * The tier of a spot, by floor and index. Bronze for unknown floors,
 * unknown indexes, and spots with no tier set — absence of a price is
 * the safe default everywhere this is read.
 * @param {string} floorId
 * @param {number} spotIndex
 * @returns {"gold"|"silver"|"bronze"}
 */
export function tierOfSpot(floorId, spotIndex) {
  return SPOT_PLANS[floorId]?.[spotIndex]?.tier ?? "bronze";
}

/**
 * How long a paid hold lasts: to the END of the next Open Doors window
 * plus one week. Claim on a Tuesday and the hold covers the coming
 * Sunday's show and the week after it — the position is bought for a
 * show cycle, not forever. (FF_SPOT_HOLD_MS overrides this on the server
 * for tests only.)
 */
export const HOLD_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

/** @param {number} nowMs @returns {number} */
export function holdUntilFor(nowMs) {
  return nextWindow(nowMs).endMs + HOLD_GRACE_MS;
}

/**
 * Where a lapsed stand goes: the free bronze spot nearest (by straight
 * tile distance) to where it stood, so a lapse reads as "moved along",
 * never "teleported across the hall". -1 when every bronze spot is taken
 * — the caller leaves the stand in place and tries again next sweep.
 * @param {string} floorId
 * @param {number} fromIndex
 * @param {Set<number>} takenIndexes
 * @returns {number}
 */
export function nearestFreeBronzeIndex(floorId, fromIndex, takenIndexes) {
  const plan = SPOT_PLANS[floorId];
  if (!plan) return -1;
  const from = plan[fromIndex] ?? plan[0];
  let best = -1;
  let bestD = Infinity;
  plan.forEach((s, i) => {
    if ((s.tier ?? "bronze") !== "bronze") return;
    if (takenIndexes.has(i)) return;
    const d = (s.x - from.x) ** 2 + (s.y - from.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}
