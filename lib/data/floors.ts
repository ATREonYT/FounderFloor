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
    // The stands stand ON the plaza rim. That is the whole point of the
    // shape: the hall exists to show companies, so the first thing you
    // meet walking in should be a company, not a water feature with the
    // companies four rows behind it. The inner rank's carpet apron is the
    // plaza's own top row — you step off the paving straight onto a stand.
    //
    // Plaza      x 20..37, y 17..25   (paved, walkable)
    // Fountain   x 26..31, y 20..22   (solid; centre 29, 21.5 — the exact
    //                                  centre of the plaza, which the
    //                                  geometry check asserts)
    // Avenues    N x27..30 y1..16   S x27..30 y26..40
    //            W x1..19 y19..23   E x38..56 y19..23
    // Booth rows y=5  (zone 5-7, apron 8)     outer north
    //            y=13 (zone 13-15, apron 16)  inner north, ON the plaza rim
    //            y=26 (zone 26-28, apron 29)  inner south, ON the plaza rim
    //            y=34 (zone 34-36, apron 37)  outer south
    // Columns    x = 3 / 9 / 15 / 21 | avenue | 33 / 39 / 45 / 51
    //            — zones are 4 wide, so every gap is exactly 2 clear tiles,
    //            and the avenue keeps 2 clear on each side of it too.
    //
    // WHY THE INNER RANK IS ONLY FOUR WIDE EITHER SIDE: booths face DOWN,
    // so a stand north of the plaza shows the fountain its front and a
    // stand south of it shows its back. The southern rank is therefore
    // placed to be met FACE ON by somebody walking up the south avenue
    // from the door — you pass between two shopfronts and then the plaza
    // opens up in front of you.
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
      // Inner rank, flanking the two avenue mouths — the four best places
      // in the building. You cannot stand at the fountain without one of
      // these in view, and they are the ones kept open for real founders.
      { x: 21, y: 13 },
      { x: 33, y: 13 },
      { x: 21, y: 26 },
      { x: 33, y: 26 },
      // Inner rank, the outer pair on each rim — still on the plaza, one
      // stand further from the water.
      { x: 15, y: 13 },
      { x: 39, y: 13 },
      { x: 15, y: 26 },
      { x: 39, y: 26 },
      // Outer band, working away from the avenues.
      { x: 21, y: 5 },
      { x: 33, y: 5 },
      { x: 21, y: 34 },
      { x: 33, y: 34 },
      { x: 15, y: 5 },
      { x: 39, y: 5 },
      { x: 15, y: 34 },
      { x: 39, y: 34 },
      { x: 9, y: 5 },
      { x: 45, y: 5 },
      { x: 9, y: 34 },
      { x: 45, y: 34 },
      { x: 3, y: 5 },
      { x: 51, y: 5 },
      { x: 3, y: 34 },
      { x: 51, y: 34 },
    ],
    // Sixteen sample stands (see lib/data/startups.ts). seedSpots decides
    // which of the two things the plaza rim is doing at any moment.
    //
    // 2 and 3 are seeded: they are the pair you walk between coming in
    // from the door, and two empty boards as the first thing anybody sees
    // reads as a hall that closed down rather than one that is filling up.
    // 0 and 1 are NOT: they face the fountain from the north side, so an
    // OPEN STAND board is the invitation, in the place everybody looks,
    // and the first real founders through the door get it rather than the
    // back wall.
    startupIds: [
      "soup-ticket", "night-shift-audio", "crate-and-pallet", "zine-machine",
      "sheet-metal", "on-call-room", "lower-third", "second-stove",
      "pocket-notary", "grave-matters", "kerb-appeal", "second-fiddle",
      "damp-patrol", "the-long-table", "pothole-index", "ferrule-repairs",
    ],
    seedSpots: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    ambientBots: 9,
    plaza: {
      // The paving runs from the northern rank's apron row to the southern
      // rank's top row, so the stands are literally on its edge: step off
      // the carpet and you are at the water.
      rect: { x0: 20, y0: 17, x1: 37, y1: 25 },
      // Centred in the plaza, and the art centres the basin inside this —
      // 6x3 tiles is the basin's own 2:1 footprint, so the stonework, the
      // tile block and the inlaid rings all share one middle.
      fountain: { x0: 26, y0: 20, x1: 31, y1: 22 },
      avenues: [
        { x0: 27, y0: 1, x1: 30, y1: 16 }, // north
        { x0: 27, y0: 26, x1: 30, y1: 40 }, // south
        { x0: 1, y0: 19, x1: 19, y1: 23 }, // west
        { x0: 38, y0: 19, x1: 56, y1: 23 }, // east
      ],
      // hung across the south avenue, in front of where everyone arrives
      arch: { x0: 26, y0: 32, x1: 31, y1: 32 },
      // Carpet down the two cross-aisles, in the three clear rows between
      // each pair of stand ranks.
      runners: [
        { x0: 1, y0: 9, x1: 56, y1: 11 },
        { x0: 1, y0: 31, x1: 56, y1: 33 },
      ],
      furniture: [
        // ─── WHAT IS AND IS NOT ALLOWED TO BE HERE ──────────────────
        // Everything in this list is solid except a stanchion. So the
        // rules, which scripts/floor-geom.mjs now enforces rather than
        // trusting:
        //   nothing on an avenue, nothing on an aisle runner, and nothing
        //   in the two rows in front of a stand — that strip is how you
        //   reach it, and a prop parked there makes a stand look
        //   approachable and not be.
        // What is left is the quiet band beside each walkway and the
        // strip against each wall, which is where furniture belongs in a
        // real hall anyway. The previous version had eight solid props
        // standing in walkways and four stands you could not walk up to.

        // --- plaza: four posts, one per chamfered corner, and nothing
        //     else. The paving, its border course and the eight stands on
        //     the rim already say where the plaza is; a bench in the
        //     middle of it just said "somebody had furniture left over".
        { kind: "stanchion", x: 20, y: 17 }, { kind: "stanchion", x: 37, y: 17 },
        { kind: "stanchion", x: 20, y: 25 }, { kind: "stanchion", x: 37, y: 25 },

        // --- lamps: two at each avenue mouth, framing the four ways in.
        //     Beside the walkway, never on it.
        { kind: "lamp", x: 26, y: 12 }, { kind: "lamp", x: 31, y: 12 },
        { kind: "lamp", x: 26, y: 30 }, { kind: "lamp", x: 31, y: 30 },
        { kind: "lamp", x: 12, y: 18 }, { kind: "lamp", x: 12, y: 24 },
        { kind: "lamp", x: 45, y: 18 }, { kind: "lamp", x: 45, y: 24 },

        // --- WEST WING: café above the side avenue, lounge below it.
        //     Each cluster is a group of things that belong together in one
        //     band, not one of everything spread evenly across the floor.
        { kind: "bar", x: 2, y: 17 }, { kind: "table", x: 6, y: 17 },
        { kind: "bench", x: 10, y: 18 }, { kind: "tree", x: 13, y: 17 },
        { kind: "sofa", x: 2, y: 24 }, { kind: "sofa", x: 5, y: 24 },
        { kind: "planter", x: 13, y: 24 }, { kind: "tree", x: 13, y: 25 },
        { kind: "planter", x: 3, y: 12 }, { kind: "bench", x: 9, y: 30 },
        { kind: "crates", x: 2, y: 38 }, { kind: "crates", x: 13, y: 38 },

        // --- EAST WING: the same idea, the other way round, so the two
        //     sides are a pair rather than a copy ---
        { kind: "sofa", x: 49, y: 17 }, { kind: "sofa", x: 52, y: 17 },
        { kind: "bench", x: 46, y: 18 }, { kind: "tree", x: 44, y: 17 },
        { kind: "table", x: 49, y: 24 }, { kind: "bar", x: 52, y: 24 },
        { kind: "planter", x: 44, y: 24 }, { kind: "tree", x: 44, y: 25 },
        { kind: "planter", x: 54, y: 12 }, { kind: "bench", x: 47, y: 30 },
        { kind: "crates", x: 44, y: 38 }, { kind: "crates", x: 55, y: 38 },

        // --- against the walls, so the outer band is not bare ---
        { kind: "tree", x: 1, y: 1 }, { kind: "tree", x: 56, y: 1 },
        { kind: "tree", x: 1, y: 40 }, { kind: "tree", x: 56, y: 40 },
        { kind: "crates", x: 25, y: 1 }, { kind: "crates", x: 32, y: 1 },
        { kind: "board", x: 24, y: 40 }, { kind: "board", x: 32, y: 40 },
      ],
      // Four traders along the east and west avenues, and two in the plaza
      // itself. They are the only decor you can walk up to and use, and
      // they exist so the two long side approaches have a reason to be
      // walked down: the shop, the sign painter, the records board and the
      // way to the directory are all things in the hall now, not only
      // entries in a menu.
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
          x: 34,
          y: 24,
          action: "arcade",
          sign: "THE ARCADE",
          keeper: "Bram",
          blurb: "Parkour, quizzes and a quick run. Tickets for a good one.",
          color: "#C4562B",
          look: { skin: 3, outfit: 7, hair: 6 },
        },
        {
          id: "records",
          x: 21,
          y: 24,
          action: "records",
          sign: "THE RECORDS",
          keeper: "Bea",
          blurb: "Who is top of the hall this week, and what you are holding.",
          color: "#B08D2E",
          look: { skin: 0, outfit: 1, hair: 3 },
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
