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
