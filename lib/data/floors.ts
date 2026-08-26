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
 * Layout rules kept throughout (scripts/floor-geom.mjs enforces them):
 *   - >= 2 clear tiles between zones horizontally (gaps here are 2+ tiles)
 *   - >= 2 walkable rows between one row's footprint (zone + apron) and
 *     the next's — on the Main Hall those two rows ARE the aisle runner,
 *     with the facing ranks' aprons on its edges
 *   - >= 2 tiles between any zone edge and the surrounding wall
 */

import type { BoothSpot, FloorDef } from "@/lib/types";

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
    // again: append, never reorder. Every spot now also carries a permanent
    // `id` (see BoothSpot) — the identity claims will migrate onto, so the
    // NEXT relayout never has to spend this rule at all.
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
    // Avenues    N x27..30 y1..16   S x27..30 y27..40
    //            W x1..19 y19..23   E x38..56 y19..23
    // Booth rows y=5  (zone 5-7, apron 8)     outer north, faces down
    //            y=12 (zone 12-14, apron 11)  north rim, faces up
    //            y=27 (zone 27-29, apron 30)  south rim, faces down
    //            y=34 (zone 34-36, apron 33)  outer south, faces up
    // The rim ranks clear the paving by AT LEAST one clear row — flush
    // against it, a stand reads as standing on the stonework rather than
    // beside it (there is no gap for the eye to put an edge in). The south
    // rim sits at exactly one row (26); the north rim clears by two
    // (15-16) because flipping it to face up moved its apron to y=11, the
    // far side. scripts/floor-geom.mjs asserts the never-flush rule.
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
    // The player spawns at `spawn` (29, 37) — see THE ARRIVAL note by the
    // field — inside the south avenue: you arrive at the bottom of the
    // hall looking straight up the avenue, under the MAIN HALL sign, at
    // the fountain.
    // The east and west wings are deliberately stand-free — they are the
    // lounge and café side of a real expo hall, and they give the eye
    // somewhere to rest between two dense banks of stands. A hall where
    // every square metre is monetised reads as a car park; the empty wings
    // are what make the dense parts read as dense.
    //
    // ─── THE VALUE GRADIENT ────────────────────────────────────────────
    // Real exhibitions price position: a row stand and an island stand at
    // the same show differ by ~30%, and corner premiums run 5-12%. This
    // hall does the same, and the shape is the explanation — value falls
    // off with distance from the two things every visitor's walk touches:
    // the spawn tile and the fountain.
    //
    //   gold (6)    the inner rank flanking both avenue mouths on the
    //               plaza rims (rim-n-inner-*, rim-s-inner-*), plus the
    //               entrance pair (outer-s-w1/e1). You cannot arrive
    //               without walking between the entrance pair, cannot
    //               reach the plaza without passing the south rim pair
    //               face-on, and cannot stand at the fountain without
    //               seeing all four rim spots framing the two exits.
    //   silver (8)  the rims' outer pairs (on the plaza, off the arrival
    //               sightline), the north band's avenue-mouth pair, and
    //               the entrance street's second pair (outer-s-w2/e2 —
    //               everyone crosses that street; nobody has to walk the
    //               north one).
    //   bronze (10) the outer bands' far columns, out to the side walls —
    //               everything the walk never touches.
    //
    // The asymmetry is the point: outer-s-w2/e2 outrank their mirror
    // images outer-n-w2/e2 because the south band flanks the door and the
    // north band is the far side of the building. If the gradient reads
    // as unfair, it is priced correctly.
    //
    // IDS ARE IDENTITY: every spot's permanent `id` names the pitch, so a
    // future relayout is free to MOVE spots — change x/y, reflow ranks —
    // and every claim follows its id. The one remaining restriction is
    // array ORDER (claims still travel as indexes until the TODO(spot-id)
    // migration lands): append, never reorder.
    id: "main-hall",
    name: "Main Hall",
    tagline: "The free floor. Twenty-four stands, first come first served. Everyone starts here.",
    tier: "free",
    width: 58,
    height: 42,
    // ─── THE ARRIVAL ───────────────────────────────────────────────────
    // Chosen, not computed. You land on the south avenue's paving, two
    // rows below the arch, facing up — and from this tile, without
    // moving, the view is the sales pitch in miniature: the MAIN HALL
    // sign overhead, an OPEN STAND board on either side (the two gold
    // entrance pitches, the first readable thing after the arch), and
    // the fountain dead ahead up the avenue with the gold south-rim pair
    // framing the plaza mouth. x=29 is the avenue column nearest the
    // fountain's centreline; y=37 rather than deeper south because the
    // tutorial coach card sits along the bottom edge of the screen — the
    // same reason the engine's fallback formula is height-5, not
    // height-2. This tile happens to equal that fallback (width/2,
    // height-5), so pinning it costs nothing and frees a future relayout
    // to move the door without touching engine code.
    spawn: { x: 29, y: 37 },
    theme: {
      floorA: "#D8D2C4",
      floorB: "#D1CABA",
      wall: "#8A8272",
      trim: "#6F6A5E",
    },
    // Ordered inner ring first, alternating north/south so the hall fills
    // outward from the fountain and stays visually balanced while it does.
    // ─── WHICH WAY EACH ROW FACES ──────────────────────────────────────
    // Every aisle runner is a two-sided shopping street: the row above it
    // faces down, the row below it faces UP, so their fronts meet across
    // the carpet and their aprons touch its two edges symmetrically.
    // Before this, every stand faced down — each runner had storefronts on
    // one side and the backs of the next rank sitting on the carpet on the
    // other, which is the "stands go onto the carpet" complaint verbatim.
    // The flipped rows show the plaza their sign walls, which is what a
    // town square surrounded by shop backs looks like, and the square
    // keeps its own attractions: the fountain, the boards, the stalls.
    //
    // ORDER IS IDENTITY: ClaimEntry.spotIndex indexes this array. Append,
    // never reorder. Flipping a row changes `face`, never position.
    //
    // SPOT IDS ARE PERMANENT. Each id names WHERE the pitch stands — rim
    // vs outer band, north vs south of the fountain, and either the
    // inner/outer pair on a rim or w1..w4 / e1..e4 counting outward from
    // the avenue. Once shipped an id is never reused or renamed: stored
    // claims will migrate onto these ids, and an id that moves a stand is
    // the same bug as a reordered array.
    boothSpots: [
      // GOLD — the inner rank, flanking the two avenue mouths. The four
      // best places in the building, one street back from the fountain:
      // the south pair meets every arrival face-on, the north pair shows
      // its sign wall across the water.
      { id: "rim-n-inner-w", x: 21, y: 12, face: "up", tier: "gold" },
      { id: "rim-n-inner-e", x: 33, y: 12, face: "up", tier: "gold" },
      { id: "rim-s-inner-w", x: 21, y: 27, tier: "gold" },
      { id: "rim-s-inner-e", x: 33, y: 27, tier: "gold" },
      // SILVER — the inner rank's outer pair on each rim: on the plaza,
      // off the arrival sightline.
      { id: "rim-n-outer-w", x: 15, y: 12, face: "up", tier: "silver" },
      { id: "rim-n-outer-e", x: 39, y: 12, face: "up", tier: "silver" },
      { id: "rim-s-outer-w", x: 15, y: 27, tier: "silver" },
      { id: "rim-s-outer-e", x: 39, y: 27, tier: "silver" },
      // Outer band, working away from the avenues. SILVER at the north
      // avenue mouth; GOLD at the south one — the entrance pair is the
      // first thing every visitor walks between.
      { id: "outer-n-w1", x: 21, y: 5, tier: "silver" },
      { id: "outer-n-e1", x: 33, y: 5, tier: "silver" },
      { id: "outer-s-w1", x: 21, y: 34, face: "up", tier: "gold" },
      { id: "outer-s-e1", x: 33, y: 34, face: "up", tier: "gold" },
      // SILVER second-from-the-avenue on the entrance street only; the
      // north band's second pair is already past the traffic.
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
    ],
    // ─── THE HALL SHIPS EMPTY ──────────────────────────────────────────
    // No seeded sample stands and no ambient staff. Every one of the
    // twenty-four spots below is open, and every person you see in this
    // room is a person.
    //
    // This reverses two earlier decisions, so the reasoning they were made
    // for is worth keeping next to the thing that overruled it. Sixteen
    // sample stands and nine wandering stewards were here because a room
    // with nothing in it reads as closed, and "closed" loses a first-time
    // visitor faster than anything else on the floor.
    //
    // That is still true, and it is no longer the deciding argument. What
    // this hall sells is that the people in it are real, and a visitor who
    // works out on their own that the crowd was set dressing does not go
    // back and re-read the SAMPLE tag charitably — they conclude the whole
    // room is a prop. An empty hall costs a first impression once. A hall
    // caught faking one costs the claim it is built on.
    //
    // startupIds stays as a mechanism (the Tutorial Hall still uses it) and
    // ships empty here. To put the samples back, restore the sixteen ids
    // from lib/data/startups.ts and the seedSpots list from git history.
    startupIds: [],
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
        { x0: 27, y0: 27, x1: 30, y1: 40 }, // south
        { x0: 1, y0: 19, x1: 19, y1: 23 }, // west
        { x0: 38, y0: 19, x1: 56, y1: 23 }, // east
      ],
      // Hung across the south avenue AT THE DOOR — you spawn two rows
      // south of it and walk in underneath. It used to stand at y=32,
      // which put its two solid posts in the middle of what is now the
      // south shopping street: walking the carpet meant hitting a pillar.
      // Down here the posts flank the avenue mouth in the entrance
      // walkway, where the only way past them is the way you were going.
      arch: { x0: 26, y0: 35, x1: 31, y1: 35 },
      // Carpet down the two cross-aisles. Two rows wide, not three: each
      // aisle now has a carpet apron on BOTH edges (the row above faces
      // down, the row below faces up), and 8|9-10|11 is the exact fit —
      // apron, carpet, carpet, apron, perfectly mirrored. Three rows of
      // carpet would run under one rank's apron and not the other's,
      // which is the asymmetry this whole arrangement exists to kill.
      runners: [
        { x0: 1, y0: 9, x1: 56, y1: 10 },
        { x0: 1, y0: 31, x1: 56, y1: 32 },
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

        // --- plaza: posts at the two side corners only. The north edge
        //     has the leaderboards and the south edge has the two stalls,
        //     so the shape is already described; a rope in front of either
        //     would just be something to walk round.
        { kind: "stanchion", x: 20, y: 21 }, { kind: "stanchion", x: 37, y: 21 },

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

        // --- BETWEEN THE STANDS: one plant in each two-tile gap ─────
        //     A rank of stands with bare checkerboard between them reads
        //     as gaps in the teeth. One tree or planter per gap, on the
        //     zone's middle row so it stands BESIDE the stalls rather
        //     than in front of them — never two, because the stands are
        //     the point and the greenery is the grout. Mirror-symmetric
        //     about the hall's centreline (x -> 57-x), trees at the outer
        //     gaps, planters nearer the middle, and only planters on the
        //     plaza rims where anything taller would crowd the square.
        // outer north rank (y=5, faces down)
        { kind: "tree", x: 7, y: 6 }, { kind: "planter", x: 13, y: 6 },
        { kind: "tree", x: 19, y: 6 },
        { kind: "tree", x: 38, y: 6 }, { kind: "planter", x: 44, y: 6 },
        { kind: "tree", x: 50, y: 6 },
        // north plaza rim (y=12, faces up)
        { kind: "planter", x: 19, y: 13 }, { kind: "planter", x: 38, y: 13 },
        // south plaza rim (y=27, faces down)
        { kind: "planter", x: 19, y: 28 }, { kind: "planter", x: 38, y: 28 },
        // outer south rank (y=34, faces up)
        { kind: "tree", x: 7, y: 35 }, { kind: "planter", x: 13, y: 35 },
        { kind: "tree", x: 19, y: 35 },
        { kind: "tree", x: 38, y: 35 }, { kind: "planter", x: 44, y: 35 },
        { kind: "tree", x: 50, y: 35 },
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
          x: 21,
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
          x: 34,
          y: 24,
          action: "records",
          sign: "THE RECORDS",
          keeper: "Bea",
          blurb: "Who is top of the hall this week, and what you are holding.",
          color: "#B08D2E",
          look: { skin: 0, outfit: 1, hair: 3 },
        },
        // ─── THE LEADERBOARDS ───────────────────────────────────────
        // Two notice boards on the plaza's north edge, facing the water.
        // The standings existed already; you had to walk to a stall and
        // press E to see any of them, which is a leaderboard nobody looks
        // at. These paint the top three straight onto the board, so you
        // read them from across the plaza and press E only if you want the
        // whole table. They have no keeper — nobody stands behind a
        // notice board.
        {
          id: "board-time",
          x: 21,
          y: 18,
          action: "records",
          sign: "TIME HERE",
          keeper: "",
          blurb: "Longest in the building this week. Measured, not reported.",
          color: "#4F6E6B",
          style: "board",
          board: "time",
        },
        {
          id: "board-parkour",
          x: 34,
          y: 18,
          action: "records",
          sign: "AFTER HOURS",
          keeper: "",
          blurb: "This week's best runs across the scaffolding.",
          color: "#5E7C93",
          style: "board",
          board: "parkour",
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
    // SPOT IDS ARE PERMANENT — named by row (north/mid/back) and position.
    // Never reused, never renamed once shipped.
    boothSpots: [
      { id: "north-w", x: 3, y: 3 },
      { id: "north-c", x: 11, y: 3 },
      { id: "north-e", x: 19, y: 3 },
      { id: "mid-w", x: 3, y: 11 },
      { id: "mid-e", x: 19, y: 11 },
      { id: "mid-c", x: 11, y: 11 }, // front row center — reserved for you
      { id: "back-w", x: 7, y: 19 }, // open stands (claimable): zone rows 19-21, apron 22, wall at 25
      { id: "back-e", x: 15, y: 19 },
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
    // SPOT IDS ARE PERMANENT — named by row (north/mid/back) and position.
    // Never reused, never renamed once shipped.
    boothSpots: [
      { id: "north-w", x: 3, y: 3 },
      { id: "north-c", x: 12, y: 3 },
      { id: "north-e", x: 21, y: 3 },
      { id: "mid-w", x: 3, y: 11 },
      { id: "mid-c", x: 12, y: 11 },
      { id: "mid-e", x: 21, y: 11 },
      { id: "back-w", x: 7, y: 19 }, // open stands (claimable): zone rows 19-21, apron 22, wall at 25
      { id: "back-e", x: 16, y: 19 },
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
    // SPOT IDS ARE PERMANENT — named by row (north/mid/back) and position.
    // Never reused, never renamed once shipped.
    boothSpots: [
      { id: "north-w", x: 3, y: 3 },
      { id: "north-c", x: 12, y: 3 },
      { id: "north-e", x: 21, y: 3 },
      { id: "mid-w", x: 3, y: 11 },
      { id: "mid-c", x: 12, y: 11 },
      { id: "mid-e", x: 21, y: 11 },
      { id: "back-w", x: 7, y: 19 }, // open stands (claimable): zone rows 19-21, apron 22, wall at 25
      { id: "back-e", x: 16, y: 19 },
    ],
    startupIds: [],
  },
];

export function floorById(id: string): FloorDef | undefined {
  return FLOORS.find((f) => f.id === id);
}

/** The pitch carrying this permanent id, if the floor has one. */
export function spotById(floor: FloorDef, id: string): BoothSpot | undefined {
  return floor.boothSpots.find((s) => s.id === id);
}

/**
 * Where an id currently sits in boothSpots (-1 when absent) — the bridge
 * between permanent ids and the index-shaped claims still on the wire.
 */
export function spotIndexById(floor: FloorDef, id: string): number {
  return floor.boothSpots.findIndex((s) => s.id === id);
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
  // SPOT IDS ARE PERMANENT. Never reused, never renamed once shipped.
  boothSpots: [
    { id: "west", x: 4, y: 3 },
    { id: "east", x: 13, y: 3 },
  ],
  startupIds: ["tutorial-guide"],
  hidden: true,
});
