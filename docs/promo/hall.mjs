/**
 * The isometric hall plate, as pure SVG source.
 *
 * This is NOT a screenshot. It is a drawing of the product in the same
 * palette the canvas uses (components/HeroScene.tsx), plotted on the same
 * 2:1 isometric grid, so a reader who has seen the poster recognises the
 * floor when they walk onto it. Everything here is deterministic: no
 * randomness, so a re-render is byte-identical and a change to the art is
 * visible in a diff.
 *
 * Two rules the drawing depends on:
 *
 * 1. **Paint order is depth order.** Every object carries `z = gx + gy` of
 *    its far corner and the whole scene is sorted on it before it is
 *    serialised. Objects must not overlap in grid space, or no single
 *    ordering can be correct.
 * 2. **Within a stand, order is authored, not sorted.** The founder is
 *    pushed before the desk so the desk covers them from the waist down,
 *    which is what standing behind a desk looks like.
 */

/* ---- palette, lifted from the canvas renderer so the plate cannot drift */
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

/** Booth kits, matching the three carpet/banner pairs a stand can wear. */
const KITS = [
  { carpet: "#9E3B2B", carpetAlt: "#8E3426", banner: "#D97742" },
  { carpet: "#3E5A8C", carpetAlt: "#37507D", banner: "#D9A13B" },
  { carpet: "#3F6B4F", carpetAlt: "#386044", banner: "#7FA65A" },
];
/** The unlet stand: bare boards and a blank panel. */
const VACANT = { carpet: "#E6E0D1", carpetAlt: "#DFD9C9", banner: "#BFB7A4" };

/** Shirt colours for the figures. Muted, so the banners stay loudest. */
const SHIRTS = ["#4A6C8C", "#8C5A3C", "#4F6B4A", "#6B4A6B", "#3F4A5C", "#8A6B3C"];

const TW = 58; // tile width in px
const TH = 29; // tile height — exactly TW/2, a true 2:1 isometric

const WALL_H = 54; // stand back wall
const DESK_H = 17;

const r = (n) => Math.round(n * 100) / 100;
const px = (gx, gy) => [((gx - gy) * TW) / 2, ((gx + gy) * TH) / 2];
const pt = (gx, gy, lift = 0) => {
  const [x, y] = px(gx, gy);
  return `${r(x)},${r(y - lift)}`;
};

/** Multiply a hex colour by a factor. Face shading only. */
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  return (
    "#" +
    [(n >> 16) & 255, (n >> 8) & 255, n & 255]
      .map((v) => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, "0"))
      .join("")
  );
}

/* --------------------------------------------------------------- shapes */

function tile(gx, gy, fill) {
  return `<polygon points="${pt(gx, gy)} ${pt(gx + 1, gy)} ${pt(gx + 1, gy + 1)} ${pt(gx, gy + 1)}" fill="${fill}"/>`;
}

/**
 * A cuboid. `h` is in pixels, not tiles: everything vertical in the game is
 * authored against a fixed tile size, so heights are absolute. `base` lifts
 * the whole solid off the ground, which is how a cap sits on a wall without
 * hiding the wall it caps.
 */
function box(gx, gy, w, d, h, top, opts = {}) {
  const b = opts.base || 0;
  const t = b + h;
  const left = opts.left || shade(top, 0.8);
  const right = opts.right || shade(top, 0.64);
  const s = opts.stroke === false ? "" : ` stroke="${INK}" stroke-opacity="0.2" stroke-width="1"`;
  return (
    `<polygon points="${pt(gx + w, gy, t)} ${pt(gx + w, gy + d, t)} ${pt(gx + w, gy + d, b)} ${pt(gx + w, gy, b)}" fill="${right}"${s}/>` +
    `<polygon points="${pt(gx, gy + d, t)} ${pt(gx + w, gy + d, t)} ${pt(gx + w, gy + d, b)} ${pt(gx, gy + d, b)}" fill="${left}"${s}/>` +
    `<polygon points="${pt(gx, gy, t)} ${pt(gx + w, gy, t)} ${pt(gx + w, gy + d, t)} ${pt(gx, gy + d, t)}" fill="${top}"${s}/>`
  );
}

/** A person. Torso block, head, and a contact shadow so they stand on the floor. */
function figure(gx, gy, shirt) {
  const [x, y] = px(gx, gy);
  return (
    `<ellipse cx="${r(x)}" cy="${r(y)}" rx="10" ry="5" fill="${INK}" opacity="0.13"/>` +
    box(gx - 0.2, gy - 0.2, 0.4, 0.4, 23, shirt, { stroke: false }) +
    `<circle cx="${r(x)}" cy="${r(y - 29.5)}" r="6.4" fill="#C9A183"/>` +
    `<path d="M ${r(x - 6.4)} ${r(y - 30.4)} a 6.4 6.4 0 0 1 12.8 0 z" fill="#3A3129"/>`
  );
}

/** A potted plant, to break up an empty corner of floor. */
function plant(gx, gy) {
  const [x, y] = px(gx, gy);
  return (
    `<ellipse cx="${r(x)}" cy="${r(y)}" rx="9" ry="4.5" fill="${INK}" opacity="0.12"/>` +
    box(gx - 0.22, gy - 0.22, 0.44, 0.44, 13, POT, { stroke: false }) +
    `<circle cx="${r(x - 5)}" cy="${r(y - 21)}" r="7" fill="${LEAF}"/>` +
    `<circle cx="${r(x + 5)}" cy="${r(y - 19)}" r="6" fill="${shade(LEAF, 0.84)}"/>` +
    `<circle cx="${r(x)}" cy="${r(y - 27)}" r="6.5" fill="${shade(LEAF, 1.08)}"/>`
  );
}

/**
 * A stand: carpet, back wall, mounted sign, desk, and the founder behind it.
 * Occupies 3 tiles wide by 3 deep at (gx, gy); the wall sits on the far edge
 * so nothing in the stand is hidden by it.
 */
function stand(gx, gy, kit, label, opts = {}) {
  const out = [];
  const carpet = [];
  const W = 3;

  for (let i = 0; i < W; i++)
    for (let j = 0; j < 3; j++)
      carpet.push(tile(gx + i, gy + j, (i + j) % 2 ? kit.carpetAlt : kit.carpet));

  // back wall, on the far edge, with the visitor-facing side toward us
  out.push(box(gx, gy - 0.3, W, 0.3, WALL_H, kit.banner));

  // gold rail capping the wall — the trim a ranked stand wears. It sits ON
  // the wall (base: WALL_H) rather than in front of it, or it would hide
  // the banner it is meant to crown.
  if (opts.gold) out.push(box(gx - 0.04, gy - 0.36, W + 0.08, 0.42, 6, GOLD, { base: WALL_H }));

  // the sign card, mounted flat on the wall face. skewY(26.57deg) is the
  // isometric left-face angle: atan(TH/TW) — anything else and it peels off.
  const [wx, wy] = px(gx, gy);
  const faceW = (W * TW) / 2;
  const cw = faceW - 20;
  out.push(
    `<g transform="translate(${r(wx + 10)},${r(wy - WALL_H + 12)}) skewY(26.57)">` +
      `<rect width="${r(cw)}" height="27" fill="${opts.vacant ? "#EDE8DC" : CARD}" stroke="${CARD_LINE}"/>` +
      (opts.vacant
        ? `<text x="${r(cw - 6)}" y="18.5" text-anchor="end" font-family="DejaVu Sans Mono, monospace" ` +
          `font-size="10" letter-spacing="1.6" fill="#7C766A">TO LET</text>`
        : `<rect x="6" y="7" width="${r(cw * 0.5)}" height="5" fill="${INK}" opacity="0.7"/>` +
          `<rect x="6" y="16" width="${r(cw * 0.33)}" height="4" fill="${INK}" opacity="0.3"/>` +
          `<text x="${r(cw - 6)}" y="19" text-anchor="end" font-family="DejaVu Sans Mono, monospace" ` +
          `font-size="9" letter-spacing="1" fill="${opts.gold ? GOLD : "#6F6A5E"}">${label}</text>`) +
      `</g>`,
  );

  /* The founder goes in BEFORE the desk, so the desk crops them at the
     waist — which is what standing behind a desk looks like. The two rows
     are a tuned pair: the desk must clear the shoulders or the person
     disappears behind the furniture, which is the opposite of the point. */
  if (!opts.vacant) out.push(figure(gx + 1.5, gy + 0.9, SHIRTS[opts.shirt ?? 0]));

  /* An unlet stand is a cleared plot: pale boards, a blank panel, and
     nothing else. Furniture on it read as somebody's stand, which is the
     opposite of what the label beside it says. */
  if (opts.vacant) return { carpet, solid: out };

  out.push(box(gx + 0.6, gy + 2, 1.8, 0.6, DESK_H, WOOD_TOP, { left: WOOD_SIDE, right: WOOD_FRONT }));

  const [dx, dy] = px(gx + 1.5, gy + 2.3);
  out.push(
    `<g transform="translate(${r(dx)},${r(dy - DESK_H)})">` +
      `<polygon points="-19,-1.5 -8,4 -19,9.5 -30,4" fill="#FFFFFF" stroke="${CARD_LINE}"/>` +
      `<polygon points="4,-5 15,0.5 4,6 -7,0.5" fill="#FFFFFF" stroke="${CARD_LINE}"/></g>`,
  );
  return { carpet, solid: out };
}

/* ------------------------------------------------------------- callouts */

/**
 * An annotation with a leader line, the way a printed plate labels its
 * parts. `ax,ay` is what it points at; `tx,ty` is the text block; `lx,ly`
 * is where the leader leaves the text. All hand-placed against the drawing
 * rather than computed, because a leader that dodges the art is a
 * judgement, not an algorithm.
 */
function callout({ tag, micro, lines, tx, ty, ax, ay, lx, ly, anchor = "start" }) {
  const end = anchor === "end";
  const tagX = end ? tx - 15 : tx;
  return (
    `<g>` +
    `<rect x="${tagX}" y="${ty - 14}" width="15" height="15" fill="${ACCENT}"/>` +
    `<text x="${tagX + 7.5}" y="${ty - 2.6}" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" ` +
    `font-size="10" font-weight="bold" fill="#F2EFE7">${tag}</text>` +
    `<text x="${end ? tx - 21 : tx + 21}" y="${ty - 2.6}" text-anchor="${anchor}" ` +
    `font-family="DejaVu Sans Mono, monospace" font-size="10.5" letter-spacing="1.5" fill="${ACCENT}">${micro}</text>` +
    lines
      .map(
        (t, i) =>
          `<text x="${tx}" y="${ty + 21 + i * 20}" text-anchor="${anchor}" ` +
          `font-family="Liberation Sans, DejaVu Sans, sans-serif" font-size="14.5" fill="${INK}">${t}</text>`,
      )
      .join("") +
    `<polyline points="${r(lx)},${r(ly)} ${r(ax)},${r(ay)}" fill="none" stroke="${INK}" ` +
    `stroke-opacity="0.55" stroke-width="1.2" stroke-dasharray="5 3.5"/>` +
    `<circle cx="${r(ax)}" cy="${r(ay)}" r="3.6" fill="none" stroke="${INK}" stroke-opacity="0.7" stroke-width="1.5"/>` +
    `</g>`
  );
}

/* ---------------------------------------------------------------- plate */

const COLS = 13;
const ROWS = 10;
/** The two rows of floor that make the walking aisle. */
const AISLE_ROWS = [4, 5];

/** Back row, wall against the far edge. Front row is staggered half a bay. */
const BACK = [
  { gx: 0.5, kit: 0, label: "01", gold: true, shirt: 0 },
  { gx: 4.5, kit: 1, label: "02", shirt: 1 },
  { gx: 8.5, kit: 2, label: "03", shirt: 2 },
];
const FRONT = [
  { gx: 1.5, kit: 2, label: "07", shirt: 3 },
  { gx: 5.5, kit: 0, label: "08", shirt: 4 },
  { gx: 9.5, label: "09", vacant: true },
];
const BACK_GY = 1;
const FRONT_GY = 6.6;

/** Where the E prompt hangs, and therefore what callout B points at. */
const TALK_GX = 6.1;
const TALK_GY = 4.2;
const PROMPT_LIFT = 74;

export function hallPlate({ callouts = false } = {}) {
  const scene = [];
  const put = (z, s) => scene.push({ z, s });

  /* The floor is a flat base layer, not a participant in the depth sort.
     It was one once, and tiles with a high gx+gy painted straight over the
     stand carpets in front of them — the stands lost their floor. Nothing
     flat on the ground plane can ever occlude anything, so it goes down
     first and stays out of the sort. */
  const ground = [];
  for (let gy = 0; gy < ROWS; gy++)
    for (let gx = 0; gx < COLS; gx++)
      ground.push(tile(gx, gy, AISLE_ROWS.includes(gy) ? AISLE : (gx + gy) % 2 ? FLOOR_B : FLOOR_A));

  // the two edges of the walking lane, so the aisle reads as a lane
  for (const row of [AISLE_ROWS[0], AISLE_ROWS[1] + 1])
    ground.push(
      `<line x1="${px(0, row)[0]}" y1="${r(px(0, row)[1])}" x2="${px(COLS, row)[0]}" y2="${r(px(COLS, row)[1])}" stroke="${INK}" stroke-opacity="0.09"/>`,
    );

  const place = (row, gy) => {
    for (const s of row) {
      const kit = s.vacant ? VACANT : KITS[s.kit];
      const { carpet, solid } = stand(s.gx, gy, kit, s.label, s);
      ground.push(...carpet);
      // one z for the whole stand: the sort is stable, so the authored
      // order inside the stand survives
      solid.forEach((f) => put(s.gx + gy, f));
    }
  };
  place(BACK, BACK_GY);
  place(FRONT, FRONT_GY);

  // plants in the two corners the stands leave bare
  put(12.2 + 0.4, plant(12.2, 0.4));
  put(0.5 + 8.8, plant(0.5, 8.8));

  // people walking the aisle, and one visitor stopped at stand 02
  for (const [gx, gy, c] of [
    [1.6, 4.5, 5],
    [9.4, 5.3, 2],
    [12.2, 4.4, 3],
  ])
    put(gx + gy, figure(gx, gy, SHIRTS[c]));
  put(TALK_GX + TALK_GY, figure(TALK_GX, TALK_GY, SHIRTS[1]));

  scene.sort((a, b) => a.z - b.z);

  /* the E prompt, over the pair mid-conversation */
  const [tx, ty] = px(TALK_GX, TALK_GY);
  const py = ty - PROMPT_LIFT;
  const prompt =
    `<g transform="translate(${r(tx)},${r(py)})">` +
    `<polygon points="-5,13 5,13 0,25" fill="${CARD}" stroke="${INK}" stroke-opacity="0.45"/>` +
    `<rect x="-34" y="-13" width="68" height="26" rx="4" fill="${CARD}" stroke="${INK}" stroke-opacity="0.45"/>` +
    `<line x1="-4.4" y1="13" x2="4.4" y2="13" stroke="${CARD}" stroke-width="2"/>` +
    `<text x="0" y="5" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="12" ` +
    `letter-spacing="0.5" fill="${INK}">E · talk</text></g>`;

  /* Three labels in the three quarters the drawing leaves empty. Each one
     answers a different question a stranger has about the picture. */
  const [goldX, goldY] = px(BACK[0].gx + 1.5, BACK_GY - 0.3);
  // callout C lands on the near corner of the blank panel. The panel is
  // what reads as "this one is free"; its middle is where the lettering is,
  // so the leader goes to the corner instead.
  const [vacX, vacY] = px(FRONT[2].gx + 3, FRONT_GY - 0.3);
  const notes = !callouts
    ? ""
    : callout({
        tag: "A",
        micro: "GOLD TRIM",
        lines: ["Ranks reflect revenue.", "Self-reported in this beta."],
        tx: -292,
        ty: -34,
        lx: -150,
        ly: -8,
        ax: r(goldX),
        ay: r(goldY - WALL_H - 5),
      }) +
      callout({
        tag: "B",
        micro: "PRESS E",
        lines: ["Walk up to anyone and ask", "what they actually do."],
        tx: 392,
        ty: 6,
        anchor: "end",
        lx: 232,
        ly: 30,
        ax: r(tx + 34),
        ay: r(py - 10),
      }) +
      callout({
        tag: "C",
        micro: "SPOT 09, TO LET",
        lines: ["Claim a stand, dress it, and", "put your startup on the floor."],
        tx: 392,
        ty: 292,
        anchor: "end",
        lx: 236,
        ly: 288,
        ax: r(vacX),
        ay: r(vacY - 12),
      });

  /* Tight to the drawing. Slack here is not neutral: the SVG scales to fit
     its box, so every unused unit shrinks the hall on the sheet. */
  const vb = callouts ? [-302, -54, 702, 396] : [-300, -44, 690, 380];

  return {
    svg:
      `<svg class="plate-svg" viewBox="${vb.join(" ")}" xmlns="http://www.w3.org/2000/svg">` +
      ground.join("") +
      scene.map((l) => l.s).join("") +
      prompt +
      notes +
      `</svg>`,
    aspect: vb[2] / vb[3],
  };
}
