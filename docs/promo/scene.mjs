/**
 * The Main Hall plate, drawn to a canvas, with the app's own people in it.
 *
 * This replaced an SVG version of the same drawing. The reason is occlusion:
 * once the people move, they have to pass BEHIND the front row of stands and
 * IN FRONT of the back row, and an overlay can only ever be on top of
 * everything. Sorting people into the same paint order as the furniture
 * needs one renderer that owns both, so this file owns both.
 *
 * Rules it depends on, every one of which has already been got wrong once:
 *
 * 1. **The ground is a base layer, not a participant in the depth sort.**
 *    Floor tiles and carpets go down first and stay out of it. Nothing flat
 *    on the ground plane can occlude anything.
 * 2. **Everything standing up is sorted by the `gx + gy` of its far corner,
 *    people included, and nothing standing up is wider than one tile.** The
 *    walls and desks are emitted as one-tile columns for exactly this
 *    reason. A whole 3-tile wall sorted as a single object compares its
 *    far-left corner against a walker who is level with its far RIGHT
 *    corner, decides the walker is nearer, and paints them straight over
 *    the panel. That is what "walking through the stands" looked like.
 *
 * Vector work is drawn in viewBox units through `S()`. Sprites are drawn in
 * device pixels with smoothing off, so the app's pixel art stays pixel art.
 *
 * Runs in the browser only. `drawScene` is pure in `frame`: the same frame
 * number always produces the same picture, so the stills and the video
 * cannot drift apart and a re-render is reproducible.
 */
import { avatarFrames, SPRITE_W, SPRITE_H, shade, drawGlyph } from "./sprites.mjs";

/* ------------------------------------------------------------ geometry */

const TW = 58;
const TH = 29;
const WALL_H = 54;
const DESK_H = 17;
const COLS = 13;
const ROWS = 10;
const AISLE_ROWS = [4, 5];

/** viewBox, tight to the drawing. Slack here shrinks the hall on the sheet. */
export const VB = { x: -302, y: -54, w: 702, h: 396 };
export const VB_PLAIN = { x: -300, y: -44, w: 690, h: 380 };

/** 24 seconds at 30fps. Frame 0 and frame LOOP are the same picture. */
export const LOOP = 720;
/**
 * The frame the still sheets are printed from. Chosen, not defaulted: at
 * 550 the hall is at its fullest, the one bubble up clears both stand
 * signs, and the line in it is stop 03 of the route the sheet describes.
 */
export const POSTER_FRAME = 550;

/* -------------------------------------------------------------- colour */

const FLOOR_A = "#D8D2C4";
const FLOOR_B = "#D1CABA";
const AISLE = "#E3DED2";
const INK = "#23201A";
const WOOD_TOP = "#D9C79B";
const WOOD_SIDE = "#A28457";
const WOOD_FRONT = "#8E7149";
const CARD = "#FAF7EF";
const CARD_LINE = "#C6BCA4";
const ACCENT = "#D9480F";
const GOLD = "#B08D2E";
const POT = "#A6633C";
const LEAF = "#4C7A4F";
const MUTED = "#6F6A5E";

const KITS = [
  { carpet: "#9E3B2B", carpetAlt: "#8E3426", banner: "#D97742" },
  { carpet: "#3E5A8C", carpetAlt: "#37507D", banner: "#D9A13B" },
  { carpet: "#3F6B4F", carpetAlt: "#386044", banner: "#7FA65A" },
];
const VACANT = { carpet: "#E6E0D1", carpetAlt: "#DFD9C9", banner: "#BFB7A4" };

/* ---------------------------------------------------------------- cast */

/** Looks are indices into the app's own palettes: skin 0-5, outfit 0-7, hair 0-7. */
const BACK = [
  { gx: 0.5, kit: 0, label: "01", gold: true, look: { skin: 1, outfit: 5, hair: 2 } },
  { gx: 4.5, kit: 1, label: "02", look: { skin: 3, outfit: 0, hair: 0 } },
  { gx: 8.5, kit: 2, label: "03", look: { skin: 0, outfit: 6, hair: 5 } },
];
const FRONT = [
  { gx: 1.5, kit: 2, label: "07", look: { skin: 4, outfit: 3, hair: 7 } },
  { gx: 5.5, kit: 0, label: "08", look: { skin: 2, outfit: 1, hair: 4 } },
  { gx: 9.5, label: "09", vacant: true },
];
const BACK_GY = 1;
const FRONT_GY = 6.6;

/** The founder of stand 02, who is the one being talked to. */
const HOST = { gx: BACK[1].gx + 1.5, gy: BACK_GY + 0.9 };

/* ------------------------------------------------------ choreography */

/**
 * A closed path: `[frame, gx, gy]` waypoints, walked in order. It must end
 * where it starts or the loop visibly jumps; repeat a position to stand
 * still.
 *
 * Paths are laid out as a walk down the aisle and then a turn towards a
 * stand, not as one diagonal from the door to the destination. People in a
 * hall walk the aisle and then step out of it, and the corner is most of
 * what makes the movement read as navigation rather than drift.
 *
 * The lanes are deliberate. The aisle is grid rows 4 and 5; the back row's
 * carpets stop at gy 4.0 and the front row's panels start at gy 6.3, so
 * anything between about 4.15 and 6.2 is clear floor. test.mjs checks every
 * visitor at every frame against the furniture, so a lane edited into a
 * desk fails a test instead of shipping.
 */
const LANE_VISITOR = 4.85;
const LANE_PAIR_A = 5.5;
const LANE_PAIR_B = 5.9;

/** The visitor who walks up to stand 02 and has the conversation. */
const visitorPath = [
  [0, 0.9, LANE_VISITOR],
  [30, 0.9, LANE_VISITOR],
  [152, 6.0, LANE_VISITOR], // down the aisle
  [178, 6.0, 4.1], // turn, step up to the stand
  [588, 6.0, 4.1], // the conversation
  [614, 6.0, LANE_VISITOR], // back into the aisle
  [716, 0.9, LANE_VISITOR],
  [LOOP, 0.9, LANE_VISITOR],
];
/** Two people doing the rounds together, up to stand 03 and back. */
const pairAPath = [
  [0, 1.6, LANE_PAIR_A],
  [40, 1.6, LANE_PAIR_A],
  [258, 10.4, LANE_PAIR_A],
  [282, 10.4, 4.45],
  [430, 10.4, 4.45],
  [454, 10.4, LANE_PAIR_A],
  [672, 1.6, LANE_PAIR_A],
  [LOOP, 1.6, LANE_PAIR_A],
];
const pairBPath = [
  [0, 0.9, LANE_PAIR_B],
  [40, 0.9, LANE_PAIR_B],
  [258, 9.7, LANE_PAIR_B],
  [282, 9.7, 4.85],
  [430, 9.7, 4.85],
  [454, 9.7, LANE_PAIR_B],
  [672, 0.9, LANE_PAIR_B],
  [LOOP, 0.9, LANE_PAIR_B],
];
/** A slow browser at the far end, so the hall is never completely still. */
const strollerPath = [
  [0, 12.2, 4.35],
  [30, 12.2, 4.35],
  [260, 7.8, 4.35],
  [320, 7.8, 4.35],
  [560, 12.2, 4.35],
  [LOOP, 12.2, 4.35],
];

export const VISITORS = [
  { id: "v3", path: visitorPath, look: { skin: 2, outfit: 4, hair: 1 }, facesHost: true },
  { id: "p1", path: pairAPath, look: { skin: 5, outfit: 2, hair: 6 }, partner: "p2" },
  { id: "p2", path: pairBPath, look: { skin: 0, outfit: 7, hair: 3 }, partner: "p1" },
  { id: "s1", path: strollerPath, look: { skin: 3, outfit: 6, hair: 0 } },
];

/**
 * What gets said, and when, in the app's own bubble.
 *
 * The exchange has to survive a stranger reading it once with the sound
 * off, so it is a real conversation with a beginning and an end rather
 * than a slogan: someone walks up, asks what the founder is building, gets
 * a specific answer, digs once, and connects. Nobody is given a company
 * name — inventing a customer to put on the poster would be inventing the
 * product, and the sheet's whole claim is that the people on it are real.
 *
 * Windows are spaced so two cards are almost never up at once, and where
 * they are, the speakers are at opposite ends of the hall. test.mjs checks
 * that, because two overlapping bubbles read as noise, not as a busy room.
 */
/** Exported so test.mjs can check the bubbles do not collide. */
export const SCRIPT = [
  { from: "p1", at: [70, 124], kind: "chat", text: "who should we talk to?" },
  { from: "p2", at: [130, 178], kind: "chat", text: "03 is hiring, apparently" },

  { from: "v3", at: [186, 222], kind: "prompt", text: "E · talk" },
  { from: "v3", at: [230, 294], kind: "chat", text: "hey, what are you building?" },
  { from: "host", at: [300, 368], kind: "chat", text: "invoicing for freelancers" },
  { from: "v3", at: [376, 430], kind: "chat", text: "who's it for?" },
  { from: "p1", at: [386, 428], kind: "emote", glyph: "star" },
  { from: "host", at: [438, 514], kind: "chat", text: "designers who hate chasing payment" },
  { from: "v3", at: [522, 584], kind: "chat", text: "nice. connecting now" },

  { from: "p2", at: [600, 656], kind: "chat", text: "worth a demo" },
];

/** What a person must never be standing inside. Walls and desks; the
    carpets are floor, and in the real game you can walk on them. */
export const OBSTACLES = [];
for (const [row, gy] of [[BACK, BACK_GY], [FRONT, FRONT_GY]])
  for (const s of row) {
    OBSTACLES.push({ what: `wall ${s.label}`, x0: s.gx, x1: s.gx + 3, y0: gy - 0.36, y1: gy });
    if (!s.vacant)
      OBSTACLES.push({ what: `desk ${s.label}`, x0: s.gx + 0.6, x1: s.gx + 2.4, y0: gy + 2, y1: gy + 2.6 });
  }

/* ------------------------------------------------------------- helpers */

const lerp = (a, b, t) => a + (b - a) * t;
const segLen = (a, b) => Math.hypot(b[1] - a[1], b[2] - a[2]);

/**
 * A trapezoidal speed profile over a run of movement: accelerate for the
 * first `EASE` of it, cruise, decelerate into the stop. Returns the
 * fraction of the run's DISTANCE covered at progress `p`.
 *
 * Linear interpolation was what made the walking look wrong. People do not
 * reach full speed on the first frame and they do not stop dead on the
 * last, and at 30fps the eye reads that instantly even when it cannot say
 * why. Peak speed is 1/(1-e) so the areas still integrate to exactly 1,
 * which keeps the run arriving on the frame it is supposed to.
 */
const EASE = 0.16;
function speedProfile(p) {
  const e = EASE;
  const v = 1 / (1 - e);
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  if (p < e) return (v * p * p) / (2 * e);
  if (p > 1 - e) {
    const q = 1 - p;
    return 1 - (v * q * q) / (2 * e);
  }
  return v * (e / 2 + (p - e));
}

/**
 * Split a path into runs of continuous movement, with the cumulative
 * distance at each waypoint. Held positions are the gaps between runs.
 * Memoised per path: the tables never change, and this is called for every
 * person on every frame.
 */
const runCache = new WeakMap();
function runsFor(path) {
  const hit = runCache.get(path);
  if (hit) return hit;
  const cum = [0];
  for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + segLen(path[i - 1], path[i]));
  const runs = [];
  let i = 0;
  while (i < path.length - 1) {
    if (segLen(path[i], path[i + 1]) < 1e-6) {
      i++;
      continue;
    }
    const from = i;
    while (i < path.length - 1 && segLen(path[i], path[i + 1]) > 1e-6) i++;
    runs.push({ from, to: i, t0: path[from][0], t1: path[i][0], dist: cum[i] - cum[from] });
  }
  const table = { cum, runs };
  runCache.set(path, table);
  return table;
}

/** Where someone is on frame `frame`, and how far they have walked. */
function walk(path, frame) {
  const t = ((frame % LOOP) + LOOP) % LOOP;
  const { cum, runs } = runsFor(path);

  const run = runs.find((r) => t >= r.t0 && t <= r.t1);
  if (!run) {
    // standing: the last waypoint whose time has passed
    let i = 0;
    while (i < path.length - 1 && path[i + 1][0] <= t) i++;
    return { gx: path[i][1], gy: path[i][2], dx: 0, dy: 0, moving: false, dist: cum[i] };
  }

  const target = cum[run.from] + speedProfile((t - run.t0) / (run.t1 - run.t0)) * run.dist;
  for (let i = run.from; i < run.to; i++) {
    if (target <= cum[i + 1] || i === run.to - 1) {
      const seg = cum[i + 1] - cum[i];
      const u = seg > 0 ? Math.min(1, (target - cum[i]) / seg) : 0;
      return {
        gx: lerp(path[i][1], path[i + 1][1], u),
        gy: lerp(path[i][2], path[i + 1][2], u),
        dx: path[i + 1][1] - path[i][1],
        dy: path[i + 1][2] - path[i][2],
        moving: true,
        dist: target,
      };
    }
  }
  const last = path[run.to];
  return { gx: last[1], gy: last[2], dx: 0, dy: 0, moving: false, dist: cum[run.to] };
}

/**
 * The walk cycle, keyed off distance travelled rather than frame count, so
 * the feet stay in step with the ground while the trapezoid speeds up and
 * slows down. Four phases, not two: the app's idle pose doubles as the
 * passing pose between strides, which is what stops the legs looking like
 * they are scissoring.
 */
const CYCLE = [1, 0, 2, 0];
const STEP = 0.3;
const walkFrame = (w) => (w.moving ? CYCLE[Math.floor(w.dist / STEP) % 4] : 0);

/** Every visitor's position on a frame. Exported for test.mjs. */
export function castAt(frame) {
  return VISITORS.map((v) => ({ id: v.id, ...walk(v.path, frame) }));
}

/**
 * Sprite direction from a movement or look vector, in GRID space. The
 * screen is isometric, so +gx runs down-right and +gy runs down-left; the
 * direction that reads as "right" on screen is the larger of the two
 * projected components, not the larger grid component.
 */
function dirFrom(dgx, dgy) {
  const sx = (dgx - dgy) * (TW / 2);
  const sy = (dgx + dgy) * (TH / 2);
  if (Math.abs(sx) >= Math.abs(sy)) return sx >= 0 ? "right" : "left";
  return sy >= 0 ? "down" : "up";
}

/**
 * Close-ups, for the vertical slides.
 *
 * A phone thumbnail is about 200px wide. The whole hall shown at that size
 * is a smudge — the people are four pixels tall and the thing the slide is
 * pointing at is invisible. Each of these frames one moment instead, at
 * roughly 3x, so a person is a person and the bubble over their head can be
 * read at a glance.
 *
 * Written in the same viewBox units the drawing uses and derived from the
 * grid where it matters, so they follow the hall if it is rearranged. Each
 * is 0.867 wide-to-tall, which is the shape of the art box on a slide;
 * anything else letterboxes and wastes the only screen a viewer gives you.
 */
const around = (cx, cy, w) => ({ x: cx - w / 2, y: cy - w / 0.867 / 2, w, h: w / 0.867 });
const at = (gx, gy, lift = 0) => [((gx - gy) * TW) / 2, ((gx + gy) * TH) / 2 - lift];

export const VIEWS = {
  /** The whole hall, landscape. Tighter than VB, which leaves room down
      each side for the printed sheet's callout labels; a slide has none. */
  full: { x: -296, y: -28, w: 680, h: 384 },
  /** Stand 02: the founder, the visitor, and whatever is being said. */
  talk: around(...at(HOST.gx - 0.6, HOST.gy + 1.1, 26), 250),
  /**
   * The same corner, pulled back, for the frames where the founder is
   * mid-sentence. A bubble is as wide as its text, and the founder's
   * longest line runs about 224 units — wider than the `talk` view, so it
   * loses its last two words to the frame edge. Widened here rather than
   * shortening the line, because the line is the product working.
   */
  answer: around(120, 100, 344),
  /** The gold-trimmed stand and the founder standing at it. */
  gold: around(...at(BACK[0].gx + 1.6, BACK_GY + 1.2, 22), 240),
  /** The unlet stand, for the "claim one" slide. */
  vacant: around(...at(FRONT[2].gx + 1.5, FRONT_GY + 0.4, 18), 240),
  /** The two visitors doing the rounds, at the stop where they pause and
      react. Framed on the pause rather than mid-walk: a bubble follows its
      speaker, so a view aimed at the middle of a walk crops the speech in
      half more often than not. */
  pair: around(...at(10.05, 4.65, 26), 250),
};

/* -------------------------------------------------------------- render */

export function drawScene(ctx, cssW, cssH, dpr, frame, opts = {}) {
  const withNotes = opts.callouts !== false;
  const vb = opts.view || (withNotes ? VB : VB_PLAIN);
  const W = cssW * dpr;
  const H = cssH * dpr;
  const k = Math.min(W / vb.w, H / vb.h);
  const ox = (W - vb.w * k) / 2 - vb.x * k;
  const oy = (H - vb.h * k) / 2 - vb.y * k;

  /** viewBox units to device px. */
  const S = (gx, gy, lift = 0) => [
    ox + ((gx - gy) * (TW / 2)) * k,
    oy + (((gx + gy) * (TH / 2)) - lift) * k,
  ];
  /** Straight viewBox-space point to device px, for hand-placed labels. */
  const P = (x, y) => [ox + x * k, oy + y * k];

  ctx.clearRect(0, 0, W, H);
  ctx.lineJoin = "miter";

  const poly = (pts, fill, stroke) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = k;
      ctx.stroke();
    }
  };

  const tile = (gx, gy, fill) =>
    poly([S(gx, gy), S(gx + 1, gy), S(gx + 1, gy + 1), S(gx, gy + 1)], fill);

  const EDGE = "rgba(35,32,26,0.2)";
  /** A cuboid. `h` in viewBox px; `base` lifts it, which is how a cap sits
      on a wall without hiding the wall it caps. */
  const box = (gx, gy, w, d, h, top, o = {}) => {
    const b = o.base || 0;
    const t = b + h;
    const stroke = o.stroke === false ? null : EDGE;
    poly([S(gx + w, gy, t), S(gx + w, gy + d, t), S(gx + w, gy + d, b), S(gx + w, gy, b)],
      o.right || shade(top, -0.36), stroke);
    poly([S(gx, gy + d, t), S(gx + w, gy + d, t), S(gx + w, gy + d, b), S(gx, gy + d, b)],
      o.left || shade(top, -0.2), stroke);
    poly([S(gx, gy, t), S(gx + w, gy, t), S(gx + w, gy + d, t), S(gx, gy + d, t)], top, stroke);
  };

  /* ------------------------------------------------- ground base layer */
  for (let gy = 0; gy < ROWS; gy++)
    for (let gx = 0; gx < COLS; gx++)
      tile(gx, gy, AISLE_ROWS.includes(gy) ? AISLE : (gx + gy) % 2 ? FLOOR_B : FLOOR_A);

  ctx.strokeStyle = "rgba(35,32,26,0.09)";
  ctx.lineWidth = k;
  for (const row of [AISLE_ROWS[0], AISLE_ROWS[1] + 1]) {
    ctx.beginPath();
    const a = S(0, row);
    const b = S(COLS, row);
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }

  const stands = [
    ...BACK.map((s) => ({ ...s, gy: BACK_GY })),
    ...FRONT.map((s) => ({ ...s, gy: FRONT_GY })),
  ];
  for (const s of stands) {
    const kit = s.vacant ? VACANT : KITS[s.kit];
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        tile(s.gx + i, s.gy + j, (i + j) % 2 ? kit.carpetAlt : kit.carpet);
  }

  /* ------------------------------------------------------ standing things */
  const scene = [];
  const put = (z, draw) => scene.push({ z, draw });

  for (const s of stands) {
    const kit = s.vacant ? VACANT : KITS[s.kit];
    const { gx, gy } = s;

    /** The sign, lying on the wall face. 0.5 is TH/TW: the isometric skew
        of that face. Any other value and it peels off the wall. */
    const sign = () => {
      const [wx, wy] = S(gx, gy, WALL_H - 12);
      const cw = (3 * TW) / 2 - 20;
      ctx.save();
      ctx.transform(k, 0.5 * k, 0, k, wx + 10 * k, wy);
      ctx.fillStyle = s.vacant ? "#EDE8DC" : CARD;
      ctx.strokeStyle = CARD_LINE;
      ctx.lineWidth = 1;
      ctx.fillRect(0, 0, cw, 27);
      ctx.strokeRect(0.5, 0.5, cw - 1, 26);
      ctx.textBaseline = "alphabetic";
      if (s.vacant) {
        ctx.fillStyle = "#7C766A";
        ctx.font = "10px 'DejaVu Sans Mono', monospace";
        ctx.letterSpacing = "1.6px";
        ctx.textAlign = "end";
        ctx.fillText("TO LET", cw - 6, 18.5);
        ctx.letterSpacing = "0px";
      } else {
        ctx.fillStyle = "rgba(35,32,26,0.7)";
        ctx.fillRect(6, 7, cw * 0.5, 5);
        ctx.fillStyle = "rgba(35,32,26,0.3)";
        ctx.fillRect(6, 16, cw * 0.33, 4);
        ctx.fillStyle = s.gold ? GOLD : MUTED;
        ctx.font = "9px 'DejaVu Sans Mono', monospace";
        ctx.letterSpacing = "1px";
        ctx.textAlign = "end";
        ctx.fillText(s.label, cw - 6, 19);
        ctx.letterSpacing = "0px";
      }
      ctx.restore();
      ctx.textAlign = "start";
    };

    /* The wall goes in as three one-tile panels, each sorted on its own
       column, so someone level with the right-hand panel is not compared
       against the left-hand one. The seams this leaves are the reason
       exhibition walls look modular in the first place, so they stay. The
       sign is drawn whole inside each panel's clip: drawing it once at any
       single column's depth would put it in front of, or behind, everyone
       standing at the other end of the same wall. */
    for (let i = 0; i < 3; i++) {
      put(gx + i + gy - 0.3, () => {
        box(gx + i, gy - 0.3, 1, 0.3, WALL_H, kit.banner);
        if (s.gold) box(gx + i, gy - 0.36, 1, 0.42, 6, GOLD, { base: WALL_H });
        ctx.save();
        ctx.beginPath();
        const e = 0.004; // overlap the clips a hair, or the seams show white
        [
          S(gx + i - e, gy, WALL_H),
          S(gx + i + 1 + e, gy, WALL_H),
          S(gx + i + 1 + e, gy, -2),
          S(gx + i - e, gy, -2),
        ].forEach(([x, y], n) => (n ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.clip();
        sign();
        ctx.restore();
      });
    }

    if (s.vacant) continue;

    // the desk, likewise in columns
    for (let j = 0; j < 2; j++) {
      put(gx + 0.6 + j * 0.9 + gy + 2, () => {
        box(gx + 0.6 + j * 0.9, gy + 2, 0.9, 0.6, DESK_H, WOOD_TOP, {
          left: WOOD_SIDE,
          right: WOOD_FRONT,
        });
        if (j === 0) return;
        const [dx, dy] = S(gx + 1.5, gy + 2.3, DESK_H);
        const leaf = (cx, cy) =>
          poly(
            [[cx - 11 * k, cy], [cx, cy - 5.5 * k], [cx + 11 * k, cy], [cx, cy + 5.5 * k]],
            "#FFFFFF",
            CARD_LINE,
          );
        leaf(dx - 19 * k, dy + 4 * k);
        leaf(dx + 4 * k, dy);
      });
    }
  }

  const plant = (gx, gy) => {
    const [x, y] = S(gx, gy);
    ctx.fillStyle = "rgba(35,32,26,0.12)";
    ctx.beginPath();
    ctx.ellipse(x, y, 9 * k, 4.5 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    box(gx - 0.22, gy - 0.22, 0.44, 0.44, 13, POT, { stroke: false });
    const blob = (dx, dy, r, c) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + dx * k, y + dy * k, r * k, 0, Math.PI * 2);
      ctx.fill();
    };
    blob(-5, -21, 7, LEAF);
    blob(5, -19, 6, shade(LEAF, -0.16));
    blob(0, -27, 6.5, shade(LEAF, 0.08));
  };
  put(12.2 + 0.4, () => plant(12.2, 0.4));
  put(0.5 + 8.8, () => plant(0.5, 8.8));

  /* -------------------------------------------------------------- people */
  /* The sprite is upscaled by a fraction, not an integer. Rounding the
     factor instead would make the people jump a whole 28px in height
     between formats, because `k` runs from 0.78 on the link card to 2.75 on
     a 2x still. Nearest-neighbour on an integer-sized destination rect is
     crisp at any factor; only the run lengths vary, which is what pixel art
     upscaled by 2.4 looks like anyway. */
  const sw = Math.round(SPRITE_W * 1.8 * k);
  const sh = Math.round(SPRITE_H * 1.8 * k);

  const drawPerson = (gx, gy, look, dir, frameIdx) => {
    const [x, y] = S(gx, gy);
    ctx.fillStyle = "rgba(35,32,26,0.16)";
    ctx.beginPath();
    ctx.ellipse(x, y, 9 * k, 4 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    const img = avatarFrames(look)[dir][frameIdx];
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(x - sw / 2), Math.round(y - sh), sw, sh);
    ctx.imageSmoothingEnabled = true;
  };

  // where every visitor is this frame — founders use it to turn and look
  const live = VISITORS.map((v) => ({ v, w: walk(v.path, frame) }));

  const speakers = {};
  for (const s of SCRIPT)
    if (frame >= s.at[0] && frame < s.at[1]) speakers[s.from] = s;

  const bubbles = [];

  for (const s of stands) {
    if (s.vacant) continue;
    const gx = s.gx + 1.5;
    const gy = s.gy + 0.9;
    const isHost = s.gx === BACK[1].gx && s.gy === BACK_GY;
    // a founder looks at whoever is closest, and holds the look while
    // someone is standing at their stand
    let dir = "down";
    let near = null;
    let best = 3.6;
    for (const { w } of live) {
      const d = Math.hypot(w.gx - gx, w.gy - gy);
      if (d < best) {
        best = d;
        near = w;
      }
    }
    if (near) dir = dirFrom(near.gx - gx, near.gy - gy);
    put(gx + gy, () => drawPerson(gx, gy, s.look, dir, 0));
    if (isHost && speakers.host)
      bubbles.push({ gx, gy, spec: speakers.host, t: frame - speakers.host.at[0] });
  }

  for (const { v, w } of live) {
    let dir;
    if (w.moving) dir = dirFrom(w.dx, w.dy);
    else if (v.facesHost) dir = dirFrom(HOST.gx - w.gx, HOST.gy - w.gy);
    else if (v.partner) {
      const p = live.find((l) => l.v.id === v.partner);
      dir = p ? dirFrom(p.w.gx - w.gx, p.w.gy - w.gy) : "down";
    } else dir = "down";
    put(w.gx + w.gy, () => drawPerson(w.gx, w.gy, v.look, dir, walkFrame(w)));
    if (speakers[v.id])
      bubbles.push({ gx: w.gx, gy: w.gy, spec: speakers[v.id], t: frame - speakers[v.id].at[0] });
  }

  scene.sort((a, b) => a.z - b.z);
  for (const o of scene) o.draw();

  /* ------------------------------------------------------------ bubbles */
  for (const b of bubbles) drawBubble(ctx, S(b.gx, b.gy), sh, k, b.spec, b.t);

  /* ----------------------------------------------------------- callouts */
  if (withNotes) drawCallouts(ctx, S, P, k);
}

/* ------------------------------------------------------------- bubbles */

/**
 * The app's own bubble: paper card, hairline border, ink text, small tail,
 * with the same rise-in the engine uses. Drawn in device space so the text
 * stays crisp instead of inheriting the scene's scale.
 */
function drawBubble(ctx, [x, y], spriteH, k, spec, t) {
  const PAPER = "#FFFDF5";
  const HAIRLINE = "#E4DFD3";
  const TAIL = 5 * k;
  const padX = 8 * k;
  const padY = 6 * k;
  const rise = Math.min(1, t / 7);
  const ease = 1 - (1 - rise) * (1 - rise);
  const lift = (1 - ease) * 6 * k;

  ctx.save();
  ctx.globalAlpha = ease;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  let w;
  let h;
  if (spec.kind === "emote") {
    w = 30 * k;
    h = 30 * k;
  } else {
    ctx.font = `${spec.kind === "prompt" ? 11 : 11.5}px ${
      spec.kind === "prompt" ? "'DejaVu Sans Mono', monospace" : "'Liberation Sans', sans-serif"
    }`;
    w = ctx.measureText(spec.text).width * k + padX * 2;
    h = 14 * k + padY * 2;
  }

  const bx = x - w / 2;
  const by = y - spriteH - 10 * k - h + lift;

  ctx.fillStyle = PAPER;
  ctx.strokeStyle = spec.kind === "prompt" ? "rgba(35,32,26,0.45)" : HAIRLINE;
  ctx.lineWidth = Math.max(1, k);
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, 6 * k);
  ctx.fill();
  ctx.stroke();

  // tail, drawn as a filled wedge with the seam painted back over
  ctx.beginPath();
  ctx.moveTo(x - 4 * k, by + h - 1);
  ctx.lineTo(x, by + h + TAIL);
  ctx.lineTo(x + 4 * k, by + h - 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PAPER;
  ctx.fillRect(x - 3.6 * k, by + h - 1.6, 7.2 * k, 2.2);

  if (spec.kind === "emote") {
    drawGlyph(ctx, spec.glyph, bx + w / 2 - 7 * k, by + h / 2 - 7 * k, 14 * k, "#23201A");
  } else {
    // the scene's scale is folded into the font size, so text is laid out
    // at device resolution and never resampled
    ctx.save();
    ctx.scale(k, k);
    ctx.fillStyle = "#23201A";
    ctx.fillText(spec.text, (bx + w / 2) / k, (by + h / 2) / k);
    ctx.restore();
  }
  ctx.restore();
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

/* ------------------------------------------------------------ callouts */

/**
 * Three labels in the three quarters the drawing leaves empty, each
 * answering a different question a stranger has about the picture. The
 * positions are hand-placed against the art rather than computed: a leader
 * line that dodges the furniture is a judgement, not an algorithm.
 */
const NOTES = [
  {
    tag: "A", micro: "GOLD TRIM",
    lines: ["Ranks reflect revenue.", "Self-reported in this beta."],
    tx: -292, ty: -34, lx: -150, ly: -8,
    anchor: () => [BACK[0].gx + 1.5, BACK_GY - 0.3, WALL_H + 5],
  },
  {
    tag: "B", micro: "PRESS E",
    lines: ["Walk up to anyone and ask", "what they actually do."],
    tx: 392, ty: 6, align: "end", lx: 232, ly: 30,
    anchor: () => [HOST.gx + 0.35, HOST.gy - 0.1, 74],
  },
  {
    tag: "C", micro: "SPOT 09, TO LET",
    lines: ["Claim a stand, dress it, and", "put your startup on the floor."],
    tx: 392, ty: 292, align: "end", lx: 236, ly: 288,
    anchor: () => [FRONT[2].gx + 3, FRONT_GY - 0.3, 12],
  },
];

function drawCallouts(ctx, S, P, k) {
  ctx.textBaseline = "alphabetic";
  for (const n of NOTES) {
    const end = n.align === "end";
    const [ax, ay] = S(...n.anchor());
    const [lx, ly] = P(n.lx, n.ly);
    const [tx, ty] = P(n.tx, n.ty);

    ctx.save();
    ctx.setLineDash([5 * k, 3.5 * k]);
    ctx.strokeStyle = "rgba(35,32,26,0.55)";
    ctx.lineWidth = 1.2 * k;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = "rgba(35,32,26,0.7)";
    ctx.lineWidth = 1.5 * k;
    ctx.beginPath();
    ctx.arc(ax, ay, 3.6 * k, 0, Math.PI * 2);
    ctx.stroke();

    const tagX = end ? tx - 15 * k : tx;
    ctx.fillStyle = ACCENT;
    ctx.fillRect(tagX, ty - 14 * k, 15 * k, 15 * k);
    ctx.save();
    ctx.scale(k, k);
    ctx.fillStyle = "#F2EFE7";
    ctx.font = "bold 10px 'DejaVu Sans Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(n.tag, (tagX + 7.5 * k) / k, (ty - 2.6 * k) / k);

    ctx.fillStyle = ACCENT;
    ctx.font = "10.5px 'DejaVu Sans Mono', monospace";
    ctx.letterSpacing = "1.5px";
    ctx.textAlign = end ? "end" : "start";
    ctx.fillText(n.micro, (end ? tx - 21 * k : tx + 21 * k) / k, (ty - 2.6 * k) / k);
    ctx.letterSpacing = "0px";

    ctx.fillStyle = INK;
    ctx.font = "14.5px 'Liberation Sans', 'DejaVu Sans', sans-serif";
    n.lines.forEach((l, i) => ctx.fillText(l, tx / k, (ty + (21 + i * 20) * k) / k));
    ctx.restore();
    ctx.textAlign = "start";
  }
}
