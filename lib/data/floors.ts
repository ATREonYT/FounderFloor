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

export const FLOORS: FloorDef[] = [
  {
    // 34x28. Three rows of four stands, all claimable.
    // Row A: y=3 (zone rows 3-5, apron 6). Row B: y=13 (zone rows 13-15, apron 16).
    // Row C: y=21 (zone rows 21-23, apron 24), walls at 0 and 27.
    // x = 3 / 11 / 19 / 27 -> rightmost zone ends at col 30, walls at 0 and 33.
    id: "main-hall",
    name: "Main Hall",
    tagline: "The free floor. Twelve stands, first come first served. Everyone starts here.",
    tier: "free",
    width: 34,
    height: 28,
    theme: {
      floorA: "#D8D2C4",
      floorB: "#D1CABA",
      wall: "#8A8272",
      trim: "#6F6A5E",
    },
    boothSpots: [
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
    tagline: "Verified revenue only past this door. The lanterns are decorative; the MRR is not.",
    tier: "pro",
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
