/**
 * FounderFloor — floor ("server") definitions.
 *
 * Booth geometry (see lib/types.ts): each booth spot is the TOP-LEFT tile of a
 * 4x3 zone that faces DOWN — banner wall (row 0), founder lane (row 1),
 * counter (row 2) — plus a 1-tile carpet apron rendered below the zone.
 *
 * Every spot on every public floor is claimable by a real founder — there
 * are no seeded demo booths (startupIds stays as a mechanism but ships
 * empty). The one exception is the hidden Tutorial Hall, staffed by a
 * clearly-labeled guide bot.
 *
 * Layout rules kept throughout:
 *   - >= 2 clear tiles between zones horizontally (gaps here are 4-5 tiles)
 *   - >= 3 clear rows between booth rows vertically (7 here, apron included)
 *   - >= 2 tiles between any zone edge and the surrounding wall
 */

import type { FloorDef } from "@/lib/types";

/**
 * The practice floor: claims here are rehearsal, exempt from the
 * one-stand-per-startup rule, and never listed in the directory.
 * Must match PRACTICE_FLOOR in server/index.mjs.
 */
export const PRACTICE_FLOOR_ID = "tutorial-hall";

/**
 * ─── FOCUS MODE ───────────────────────────────────────────────────────
 * Only the Main Hall is open right now. Ten people spread over four
 * floors reads as four empty rooms; the same ten in one room reads as a
 * busy one — and an empty room is the single biggest reason a first-time
 * visitor never comes back. The other floors are built, tested and
 * finished; they are only un-advertised.
 *
 * `hidden: true` removes a floor from the lobby, the landing page, the
 * "floors open" counter and the membership grid. It stays reachable by
 * direct link (that is how the Tutorial Hall works), so nobody's stand is
 * stranded and nothing breaks.
 *
 * TO RE-OPEN ONE: delete its `hidden: true` line and redeploy. Suggested
 * order as the Main Hall fills up — Indie Alley once the Main Hall's 12
 * spots are mostly taken, then the paid floors when there are enough
 * paying members to make them feel occupied. Re-check the tier blurbs in
 * app/page.tsx and components/MembershipWatcher.tsx when the paid floors
 * come back: they no longer promise floor access.
 * ──────────────────────────────────────────────────────────────────────
 */
export const FLOORS: FloorDef[] = [
  {
    // 50x38. Four rows of six stands, all claimable.
    //
    // GROWN FROM 34x28 / 12 STANDS, BY APPENDING ONLY. A claim is stored as
    // an index into boothSpots (ClaimEntry.spotIndex), so moving or
    // reordering an entry silently moves somebody's stand to a different
    // part of the hall. The original twelve keep their exact coordinates
    // AND their positions in this array; everything new is added after them.
    // Any future growth has to follow the same rule.
    //
    // Rows: y=3 / 13 / 21 / 29 (zone rows y..y+2, carpet apron y+3).
    // Cols: x=3 / 11 / 19 / 27 / 35 / 43 (zones 4 wide, so 4 clear tiles
    // between them; the rightmost ends at col 46, wall at 49).
    // The last apron is row 32 and the bottom wall is 37, which leaves four
    // rows of open floor along the bottom — that band is where players spawn
    // (engine.ts uses height - 5), and spawning inside a booth alley reads
    // as being dumped behind somebody's counter.
    id: "main-hall",
    name: "Main Hall",
    tagline: "The free floor. Twenty-four stands, first come first served. Everyone starts here.",
    tier: "free",
    width: 50,
    height: 38,
    theme: {
      floorA: "#D8D2C4",
      floorB: "#D1CABA",
      wall: "#8A8272",
      trim: "#6F6A5E",
    },
    boothSpots: [
      // --- the original twelve. Do not move, reorder or renumber. ---
      { x: 3, y: 3 },
      { x: 11, y: 3 },
      { x: 19, y: 3 },
      { x: 27, y: 3 },
      { x: 3, y: 13 },
      { x: 11, y: 13 },
      { x: 19, y: 13 },
      { x: 27, y: 13 },
      { x: 3, y: 21 },
      { x: 11, y: 21 },
      { x: 19, y: 21 },
      { x: 27, y: 21 },
      // --- added when the hall grew: two more columns on the east side ---
      { x: 35, y: 3 },
      { x: 43, y: 3 },
      { x: 35, y: 13 },
      { x: 43, y: 13 },
      { x: 35, y: 21 },
      { x: 43, y: 21 },
      // --- and a fourth row across the bottom ---
      { x: 3, y: 29 },
      { x: 11, y: 29 },
      { x: 19, y: 29 },
      { x: 27, y: 29 },
      { x: 35, y: 29 },
      { x: 43, y: 29 },
    ],
    startupIds: [],
  },
  {
    // 26x26. Two rows of three stands plus two below — all claimable.
    // Row A: y=3 (zone rows 3-5, apron 6). Row B: y=11 (zone rows 11-13, apron 14).
    // x = 3 / 11 / 19 -> rightmost zone ends at col 22, walls at 0 and 25.
    id: "indie-alley",
    name: "Indie Alley",
    tagline: "Folding tables, real users, no adult supervision.",
    tier: "free",
    hidden: true, // FOCUS MODE — see the note above FLOORS
    width: 26,
    height: 26,
    theme: {
      floorA: "#CBB89A",
      floorB: "#C2AE8E",
      wall: "#7A6248",
      trim: "#5C4A36",
    },
    boothSpots: [
      { x: 3, y: 3 },
      { x: 11, y: 3 },
      { x: 19, y: 3 },
      { x: 3, y: 11 },
      { x: 19, y: 11 },
      { x: 11, y: 11 }, // front row center — reserved for you
      { x: 7, y: 19 }, // open stands (claimable): zone rows 19-21, apron 22, wall at 25
      { x: 15, y: 19 },
    ],
    startupIds: [],
  },
  {
    // 28x18. Two rows of three booths.
    // Row A: y=3 (zone rows 3-5, apron 6). Row B: y=11 (zone rows 11-13, apron 14).
    // x = 3 / 12 / 21 -> rightmost zone ends at col 24, walls at 0 and 27.
    id: "ramen-district",
    name: "Ramen District",
    tagline: "Revenue-ranked stands past this door. The lanterns are decorative; the MRR is self-reported.",
    tier: "pro",
    hidden: true, // FOCUS MODE — see the note above FLOORS
    width: 28,
    height: 26,
    theme: {
      floorA: "#4A4A52",
      floorB: "#44444C",
      wall: "#2F2F36",
      trim: "#A63D2F",
    },
    boothSpots: [
      { x: 3, y: 3 },
      { x: 12, y: 3 },
      { x: 21, y: 3 },
      { x: 3, y: 11 },
      { x: 12, y: 11 },
      { x: 21, y: 11 },
      { x: 7, y: 19 }, // open stands (claimable): zone rows 19-21, apron 22, wall at 25
      { x: 16, y: 19 },
    ],
    startupIds: [],
  },
  {
    // 28x18. Same layout as Ramen District, different company.
    id: "cofounder-row",
    name: "Co-founder Row",
    tagline: "Everyone on this floor is looking for the other half of their cap table. Yes, everyone.",
    tier: "founder",
    hidden: true, // FOCUS MODE — see the note above FLOORS
    width: 28,
    height: 26,
    theme: {
      floorA: "#39493E",
      floorB: "#344439",
      wall: "#24312A",
      trim: "#B08D2E",
    },
    boothSpots: [
      { x: 3, y: 3 },
      { x: 12, y: 3 },
      { x: 21, y: 3 },
      { x: 3, y: 11 },
      { x: 12, y: 11 },
      { x: 21, y: 11 },
      { x: 7, y: 19 }, // open stands (claimable): zone rows 19-21, apron 22, wall at 25
      { x: 16, y: 19 },
    ],
    startupIds: [],
  },
];

export function floorById(id: string): FloorDef | undefined {
  return FLOORS.find((f) => f.id === id);
}

// The practice hall: hidden from the lobby list, reached via "Start the
// tutorial". One booth staffed by the guide bot, one open spot to look at.
// 22x14: zones at x=4 (4-7) and x=13 (13-16), rows 3-5, apron 6, walls at
// 0/21 and 0/13 — same spacing rules as the public halls.
FLOORS.push({
  id: "tutorial-hall",
  name: "Tutorial Hall",
  tagline: "A quiet practice hall with a patient robot. Learn the ropes, leave with a badge.",
  tier: "free",
  width: 22,
  height: 14,
  theme: {
    floorA: "#D9D6CB",
    floorB: "#D1CEC1",
    wall: "#7E8578",
    trim: "#5E665E",
  },
  boothSpots: [
    { x: 4, y: 3 },
    { x: 13, y: 3 },
  ],
  startupIds: ["tutorial-guide"],
  hidden: true,
});
