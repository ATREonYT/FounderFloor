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
    // 58x42. A fountain plaza with four avenues running out of it, and the
    // twenty-four stands ringed around it in two bands per side.
    //
    // ─── WHY THIS REPLACED THE OLD GRID ────────────────────────────────
    // The old hall was four straight rows of six on a 50x38 rectangle. It
    // was efficient and it read as a car park: nothing drew the eye, so
    // with two or three stands claimed the room looked abandoned rather
    // than early. A plaza gives the room a middle to point at, and the
    // spot ORDER below fills that middle first — with four stands taken
    // the hall reads as a busy centre, not four dots in a field.
    //
    // ─── THE ONE RULE THAT MATTERS ─────────────────────────────────────
    // A claim is stored as an index into boothSpots (ClaimEntry.spotIndex),
    // so an entry's POSITION IN THIS ARRAY is its identity. Reordering
    // moves somebody's stand somewhere else in the hall. This redesign
    // knowingly spent that once — the layout changed underneath, so every
    // index had to be re-pointed anyway, and a stand only lives on a floor
    // while its owner is standing there. From here on the old rule holds
    // again: append, never reorder.
    //
    // ─── GEOMETRY ──────────────────────────────────────────────────────
    // Plaza      x 21..36, y 14..27   (paved, walkable)
    // Fountain   x 26..31, y 18..23   (solid; centre 29, 21 — dead centre
    //                                  of both the plaza and the avenues)
    // Avenues    N x27..30 y1..13   S x27..30 y28..40
    //            W x1..20 y19..22   E x37..56 y19..22
    // Booth rows y=3 (zone 3-5, apron 6)    outer north
    //            y=10 (zone 10-12, apron 13) inner north, on the plaza rim
    //            y=29 (zone 29-31, apron 32) inner south, on the plaza rim
    //            y=36 (zone 36-38, apron 39) outer south
    // Columns    x = 3 / 9 / 15 / 21 | avenue | 33 / 39 / 45 / 51
    //            — zones are 4 wide, so every gap is exactly 2 clear tiles,
    //            and the avenue keeps 2 clear on each side of it too.
    //
    // The player spawns at (width/2, height-5) = tile (29, 37), which is
    // inside the south avenue: you arrive at the bottom of the hall looking
    // straight up the avenue, under the MAIN HALL sign, at the fountain.
    // The east and west wings are deliberately stand-free — they are the
    // lounge and café side of a real expo hall, and they give the eye
    // somewhere to rest between two dense banks of stands.
    id: "main-hall",
    name: "Main Hall",
    tagline: "The free floor. Twenty-four stands, first come first served. Everyone starts here.",
    tier: "free",
    width: 58,
    height: 42,
    theme: {
      floorA: "#D8D2C4",
      floorB: "#D1CABA",
      wall: "#8A8272",
      trim: "#6F6A5E",
    },
    // Ordered inner ring first, alternating north/south so the hall fills
    // outward from the fountain and stays visually balanced while it does.
    boothSpots: [
      // inner ring — the four stands flanking the avenues on the plaza rim
      { x: 21, y: 10 },
      { x: 33, y: 10 },
      { x: 21, y: 29 },
      { x: 33, y: 29 },
      // inner ring — the outer pair on each rim
      { x: 15, y: 10 },
      { x: 39, y: 10 },
      { x: 15, y: 29 },
      { x: 39, y: 29 },
      // outer band, working away from the avenues
      { x: 21, y: 3 },
      { x: 33, y: 3 },
      { x: 21, y: 36 },
      { x: 33, y: 36 },
      { x: 15, y: 3 },
      { x: 39, y: 3 },
      { x: 15, y: 36 },
      { x: 39, y: 36 },
      { x: 9, y: 3 },
      { x: 45, y: 3 },
      { x: 9, y: 36 },
      { x: 45, y: 36 },
      { x: 3, y: 3 },
      { x: 51, y: 3 },
      { x: 3, y: 36 },
      { x: 51, y: 36 },
    ],
    // Sixteen sample stands (see lib/data/startups.ts), placed on the OUTER
    // bands only. seedSpots is what keeps them off indices 0-7 — the inner
    // ring on the plaza rim, which stays open so the first real founders
    // through the door get the best places in the hall rather than the back.
    startupIds: [
      "soup-ticket", "night-shift-audio", "crate-and-pallet", "zine-machine",
      "sheet-metal", "on-call-room", "lower-third", "second-stove",
      "pocket-notary", "grave-matters", "kerb-appeal", "second-fiddle",
      "damp-patrol", "the-long-table", "pothole-index", "ferrule-repairs",
    ],
    seedSpots: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    ambientBots: 9,
    plaza: {
      // The plaza clears BOTH inner stand rows by exactly one row (14 above,
      // 28 below). It used to butt straight up against the northern row's
      // carpet, so the octagon's cut corner ran into the stands and they
      // looked pasted onto the paving instead of standing on the floor.
      rect: { x0: 21, y0: 15, x1: 36, y1: 27 },
      // Centred in the plaza, and the art centres the basin inside this —
      // 6x3 tiles is the basin's own 2:1 footprint, so the stonework, the
      // tile block and the inlaid rings all share one middle.
      fountain: { x0: 26, y0: 20, x1: 31, y1: 22 },
      avenues: [
        { x0: 27, y0: 1, x1: 30, y1: 14 }, // north
        { x0: 27, y0: 28, x1: 30, y1: 40 }, // south
        { x0: 1, y0: 19, x1: 20, y1: 22 }, // west
        { x0: 37, y0: 19, x1: 56, y1: 22 }, // east
      ],
      // hung across the south avenue, in front of where everyone arrives
      arch: { x0: 26, y0: 33, x1: 31, y1: 33 },
      // Carpet down the two cross-aisles. Bare floor between two banks of
      // stands is the single thing that made the hall read as unfinished.
      runners: [
        { x0: 1, y0: 7, x1: 56, y1: 9 },
        { x0: 1, y0: 33, x1: 56, y1: 35 },
      ],
      furniture: [
        // --- plaza rim: rope posts, leaving every avenue mouth open ---
        { kind: "stanchion", x: 21, y: 15 }, { kind: "stanchion", x: 23, y: 15 },
        { kind: "stanchion", x: 25, y: 15 },
        { kind: "stanchion", x: 32, y: 15 }, { kind: "stanchion", x: 34, y: 15 },
        { kind: "stanchion", x: 36, y: 15 },
        { kind: "stanchion", x: 21, y: 27 }, { kind: "stanchion", x: 23, y: 27 },
        { kind: "stanchion", x: 25, y: 27 },
        { kind: "stanchion", x: 32, y: 27 }, { kind: "stanchion", x: 34, y: 27 },
        { kind: "stanchion", x: 36, y: 27 },
        { kind: "stanchion", x: 21, y: 17 }, { kind: "stanchion", x: 21, y: 24 },
        { kind: "stanchion", x: 36, y: 17 }, { kind: "stanchion", x: 36, y: 24 },
        // --- inside the plaza: somewhere to sit and look at the water ---
        // The benches are double-sided, so the pair north of the fountain
        // and the pair south of it are both the right way round.
        { kind: "bench", x: 22, y: 18 }, { kind: "bench", x: 33, y: 18 },
        { kind: "bench", x: 22, y: 24 }, { kind: "bench", x: 33, y: 24 },
        { kind: "tree", x: 24, y: 16 }, { kind: "tree", x: 33, y: 16 },
        { kind: "tree", x: 24, y: 26 }, { kind: "tree", x: 33, y: 26 },
        // --- plaza corners and the two side avenue mouths ---
        { kind: "planter", x: 22, y: 16 }, { kind: "planter", x: 35, y: 16 },
        { kind: "planter", x: 22, y: 26 }, { kind: "planter", x: 35, y: 26 },
        { kind: "planter", x: 19, y: 18 }, { kind: "planter", x: 19, y: 23 },
        { kind: "planter", x: 38, y: 18 }, { kind: "planter", x: 38, y: 23 },
        // --- lamps ALONGSIDE every avenue, never in one ---
        // They used to stand on the avenues' outer tiles, which looked like
        // lining a street and walked like an obstacle course. Nothing solid
        // belongs on a walkway; the geometry check now refuses it outright.
        { kind: "lamp", x: 26, y: 5 }, { kind: "lamp", x: 31, y: 5 },
        { kind: "lamp", x: 26, y: 12 }, { kind: "lamp", x: 31, y: 12 },
        { kind: "lamp", x: 26, y: 31 }, { kind: "lamp", x: 31, y: 31 },
        { kind: "lamp", x: 26, y: 38 }, { kind: "lamp", x: 31, y: 38 },
        { kind: "lamp", x: 5, y: 18 }, { kind: "lamp", x: 5, y: 23 },
        { kind: "lamp", x: 12, y: 18 }, { kind: "lamp", x: 12, y: 23 },
        { kind: "lamp", x: 45, y: 18 }, { kind: "lamp", x: 45, y: 23 },
        { kind: "lamp", x: 52, y: 18 }, { kind: "lamp", x: 52, y: 23 },
        // --- WEST WING: café above the avenue, lounge below ---
        { kind: "tree", x: 2, y: 11 }, { kind: "tree", x: 13, y: 11 },
        { kind: "table", x: 4, y: 11 }, { kind: "table", x: 9, y: 11 },
        { kind: "table", x: 4, y: 15 }, { kind: "table", x: 9, y: 15 },
        { kind: "bar", x: 2, y: 17 },
        { kind: "kiosk", x: 17, y: 16 },
        { kind: "sign", x: 19, y: 12, label: "PLAZA" },
        { kind: "sofa", x: 3, y: 25 }, { kind: "sofa", x: 3, y: 29 },
        { kind: "tree", x: 7, y: 27 },
        { kind: "table", x: 10, y: 25 }, { kind: "table", x: 10, y: 29 },
        { kind: "board", x: 15, y: 25 },
        { kind: "crates", x: 2, y: 31 }, { kind: "crates", x: 14, y: 31 },
        { kind: "tree", x: 19, y: 30 },
        // --- EAST WING: mirrored, different furniture so it is not a copy ---
        { kind: "tree", x: 44, y: 11 }, { kind: "tree", x: 55, y: 11 },
        { kind: "sofa", x: 46, y: 11 }, { kind: "sofa", x: 51, y: 11 },
        { kind: "board", x: 46, y: 15 },
        { kind: "table", x: 51, y: 15 },
        { kind: "kiosk", x: 39, y: 16 },
        { kind: "sign", x: 38, y: 12, label: "STANDS" },
        { kind: "table", x: 45, y: 25 }, { kind: "table", x: 50, y: 25 },
        { kind: "bar", x: 53, y: 27 },
        { kind: "tree", x: 43, y: 27 },
        { kind: "sofa", x: 45, y: 29 }, { kind: "sofa", x: 50, y: 29 },
        { kind: "board", x: 39, y: 25 },
        { kind: "crates", x: 43, y: 31 }, { kind: "crates", x: 55, y: 31 },
        // --- corners of the hall, so the outer band is not bare ---
        { kind: "tree", x: 1, y: 1 }, { kind: "tree", x: 56, y: 1 },
        { kind: "tree", x: 1, y: 40 }, { kind: "tree", x: 56, y: 40 },
        { kind: "crates", x: 25, y: 1 }, { kind: "crates", x: 32, y: 1 },
        { kind: "board", x: 24, y: 40 }, { kind: "board", x: 32, y: 40 },
      ],
      // Four traders along the east and west avenues. They are the only
      // decor you can walk up to and use, and they exist so the two long
      // side approaches have a reason to be walked down: the shop, the
      // sign painter, the records board and the way to the directory are
      // all things in the hall now, not only entries in a menu.
      merchants: [
        {
          id: "tickets",
          x: 8,
          y: 17,
          action: "tickets",
          sign: "TICKET BOOTH",
          keeper: "Wren",
          blurb: "Buy tickets, or see the ways to earn them.",
          color: "#B4762E",
          look: { skin: 2, outfit: 2, hair: 5 },
        },
        {
          id: "signwright",
          x: 8,
          y: 24,
          action: "editor",
          sign: "SIGN PAINTER",
          keeper: "Alder",
          blurb: "Repaint your stand — colours, banner, sign, props.",
          color: "#5E7C93",
          look: { skin: 4, outfit: 6, hair: 1 },
        },
        {
          id: "porter",
          x: 46,
          y: 17,
          action: "porter",
          sign: "PORTER'S LODGE",
          keeper: "Halloway",
          blurb: "Which floors are open, and who is on them right now.",
          color: "#4F6E6B",
          look: { skin: 1, outfit: 3, hair: 4 },
        },
        {
          id: "register",
          x: 46,
          y: 24,
          action: "register",
          sign: "THE REGISTER",
          keeper: "Odile",
          blurb: "Every stand in the hall, listed and searchable.",
          color: "#7A6070",
          look: { skin: 5, outfit: 5, hair: 2 },
        },
        {
          id: "arcade",
          x: 46,
          y: 31,
          action: "arcade",
          sign: "THE ARCADE",
          keeper: "Bram",
          blurb: "Three games, one run. A good score is worth tickets.",
          color: "#C4562B",
          look: { skin: 3, outfit: 7, hair: 6 },
        },
      ],
    },
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
