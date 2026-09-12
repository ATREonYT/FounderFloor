/**
 * PICTURES THAT KNOW WHAT THEY ARE A PICTURE OF.
 *
 * Every mock-up needs images, and the building cannot ship photographs:
 * a page that reaches out to a photo service is a page that breaks on a
 * plane, leaks where the founder is, and puts a stranger's licence in
 * the middle of somebody's product. So the pictures are drawn, in the
 * product's own palette, inside the document.
 *
 * What was wrong until now is that they were drawn without knowing the
 * subject: `pic()` took a manner ("blocks", "rings") and a seed and
 * produced overlapping rectangles. A bakery came out as brown boxes and
 * a community as purple ones. That, more than layout or type, is what
 * made a mock-up look unfinished — a food app with no food in it reads
 * as broken however good the grid is.
 *
 * So a picture is now asked for by subject. `sceneFor("bread")` finds
 * the drawing, and `scene()` returns flat vector art of the thing: a
 * loaf, a cup, a room, a person, a van. They are deliberately simple —
 * one light from the top left, a soft shadow under the subject, three
 * colours from the plan and nothing else — because a simple drawing
 * that is clearly a loaf beats an elaborate one that is clearly
 * nothing.
 *
 * The seam matters as much as the drawings. Everything that wants a
 * picture asks for it by meaning, never by shape, so the day there are
 * real photographs to hand — bundled, or drawn by a model for a founder
 * on Pro — they slot in behind `scene()` and every screen improves at
 * once, with nothing else rewritten.
 */

/** The drawings there are. `abstract` is the fallback: shapes, as before. */
export type SceneKind =
  | "bread"
  | "coffee"
  | "person"
  | "room"
  | "tool"
  | "workout"
  | "play"
  | "vehicle"
  | "document"
  | "parcel"
  | "plant"
  | "clothes"
  | "pet"
  | "event"
  | "chat"
  | "sound"
  | "place"
  | "abstract";

/**
 * Which drawing a noun asks for. The nouns are the ones `unitOf` can
 * return, plus the words founders reach for around them; anything
 * unrecognised gets the shapes, which is never wrong, only quiet.
 */
const WORDS: [SceneKind, string[]][] = [
  ["bread", ["bread", "loaf", "cake", "pastry", "bun", "croissant", "bake", "bakery", "dish", "meal", "menu", "food", "recipe", "portion", "snack", "dessert", "pizza", "sandwich"]],
  ["coffee", ["coffee", "drink", "cup", "mug", "tea", "juice", "bottle", "water", "cafe", "café", "espresso", "latte", "bar", "cocktail", "wine", "beer"]],
  ["person", ["person", "post", "profile", "member", "founder", "player", "client", "customer", "patient", "student", "candidate", "freelancer", "worker", "friend", "match", "date", "crew", "team", "haircut", "portrait", "people", "community", "circle", "group"]],
  ["room", ["room", "flat", "apartment", "house", "home", "property", "desk", "table", "office", "studio", "stay", "night", "space", "seat", "reservation", "viewing", "chair", "lamp", "rug", "bookcase"]],
  ["tool", ["tool", "visit", "repair", "fix", "plumber", "electrician", "clean", "service", "job", "shift", "build", "install", "maintenance", "callout", "spanner", "wrench"]],
  ["workout", ["workout", "exercise", "session", "run", "training", "gym", "fitness", "stretch", "walk", "hike", "step", "calorie", "ride", "yoga", "swim", "sport"]],
  ["play", ["lesson", "class", "course", "quiz", "game", "puzzle", "level", "round", "score", "chapter", "kid", "child", "learn", "maths", "math", "word", "study", "homework", "school"]],
  ["vehicle", ["car", "bike", "scooter", "vehicle", "trip", "delivery", "courier", "taxi", "van", "fare", "route", "parking", "transport", "drive", "driver"]],
  ["document", ["invoice", "receipt", "document", "report", "contract", "form", "file", "statement", "payslip", "timesheet", "policy", "claim", "quote", "estimate", "summary", "record", "scan", "signature", "return", "paper", "letter", "cv", "resume", "application"]],
  ["parcel", ["parcel", "order", "box", "bundle", "item", "product", "kit", "sample", "package", "stock", "shipment", "crate", "goods", "shop", "store"]],
  ["plant", ["plant", "flower", "bouquet", "garden", "tree", "seed", "herb", "pot", "florist", "leaf"]],
  ["clothes", ["dress", "shirt", "shoe", "sock", "hat", "scarf", "bag", "backpack", "wallet", "clothes", "clothing", "outfit", "wear", "fashion", "jacket", "jewellery", "jewelry", "necklace", "bracelet"]],
  ["pet", ["pet", "dog", "cat", "puppy", "kitten", "animal", "vet", "groom"]],
  ["event", ["event", "ticket", "meetup", "party", "tour", "show", "gig", "concert", "conference", "festival", "booking", "appointment", "slot", "date", "calendar", "agenda", "schedule"]],
  ["chat", ["chat", "message", "thread", "call", "comment", "question", "answer", "reply", "conversation", "inbox", "email", "note", "survey", "poll", "review", "feedback", "interview", "consultation"]],
  ["sound", ["song", "playlist", "podcast", "episode", "track", "music", "audio", "sound", "voice", "recording", "radio"]],
  ["place", ["place", "listing", "spot", "city", "town", "beach", "mountain", "view", "destination", "location", "map", "area", "harbour", "harbor", "island", "park"]],
];

/**
 * Words that name the transaction rather than the thing in it. "Order
 * tomorrow's bread tonight" is a picture of bread, not of a cardboard
 * box, so these only win when nothing concrete is in the phrase.
 */
const WEAK = new Set(["order", "item", "product", "shop", "store", "listing", "booking", "service", "job", "kit", "sample", "goods", "stock", "package", "session", "visit", "slot", "date", "note", "record", "file", "form"]);

/**
 * The drawing a phrase asks for.
 *
 * The head noun of an English phrase is usually the last one — "quiet
 * room", "prepaid pass", "tomorrow's bread" — so the scan runs from the
 * end, and words that name the transaction rather than the thing are
 * held back until every concrete word has been tried.
 */
export function sceneFor(subject: string | null | undefined): SceneKind {
  const words = (subject ?? "").toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const hit = (w: string): SceneKind | null => {
    const stem = w.replace(/(ies|es|s)$/, (m) => (m === "ies" ? "y" : ""));
    for (const [kind, list] of WORDS) if (list.includes(w) || list.includes(stem)) return kind;
    return null;
  };
  let weak: SceneKind | null = null;
  for (let i = words.length - 1; i >= 0; i--) {
    const found = hit(words[i]);
    if (!found) continue;
    if (WEAK.has(words[i])) weak ??= found;
    else return found;
  }
  return weak ?? "abstract";
}

/** A number from a seed, in a range, so two pictures of the same thing differ a little. */
const vary = (seed: number, n: number, lo: number, hi: number): number => lo + ((Math.abs(Math.imul(seed + 1, 2654435761 + n * 40503)) >>> 8) % (hi - lo + 1));

/**
 * The colours a drawing uses.
 *
 * Not the palette directly but three slots, filled per picture by the
 * element that uses it. That is what lets one definition of a loaf be
 * drawn six times, each in its own size, lean and colour order, for the
 * cost of one line each — and the picture still moves with the palette,
 * because the slots are filled from it.
 */
const P = "var(--a1)";
const A = "var(--a2)";
const S = "var(--a3)";

/**
 * The ground every scene sits on.
 *
 * Held well back on purpose. A picture in an app stands in for a
 * photograph, and a photograph is not a slab of the brand colour — when
 * the ground is saturated the whole screen reads as a themed website
 * rather than an app with pictures in it. So: a light wash with the
 * brand's hue in it, and the subject carries the colour.
 */
const ground = `<rect width="100" height="100" fill="url(#scg)"/>`;

/** The soft shadow under a subject, so it sits on the ground instead of floating on it. */
const shadow = (cx: number, cy: number, rx: number): string => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${(rx * 0.22).toFixed(1)}" fill="#000" opacity=".13"/>`;

/** The one highlight, top left, that tells the eye where the light is. */
const shine = (d: string): string => `<path d="${d}" fill="#fff" opacity=".3"/>`;

function art(kind: SceneKind): string {
  const v = (_n: number, lo: number, hi: number) => Math.round((lo + hi) / 2);
  switch (kind) {
    case "bread": {
      const slash = v(1, 3, 5);
      return `${shadow(50, 78, 30)}<path d="M18 72q-6 0-6-9 0-16 10-26t28-10 28 10 10 26q0 9-6 9z" fill="${P}"/><path d="M18 72q-6 0-6-9 0-13 7-22 10 10 30 10t30-10q7 9 7 22 0 9-6 9z" fill="${A}" opacity=".55"/>${Array.from({ length: slash }, (_, i) => {
        const x = 26 + i * (48 / (slash - 1 || 1));
        return `<path d="M${x} 40l7 12" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>`;
      }).join("")}${shine("M24 44q6-14 24-16-16 6-20 18z")}`;
    }
    case "coffee": {
      return `${shadow(48, 80, 26)}<path d="M74 40h8a10 10 0 0 1 0 20h-8" fill="none" stroke="${P}" stroke-width="6"/><path d="M22 34h52v22a20 20 0 0 1-20 20H42a20 20 0 0 1-20-20z" fill="${P}"/><path d="M22 34h52v9a20 20 0 0 1-20 6H42a20 20 0 0 1-20-6z" fill="${A}" opacity=".75"/><path d="M36 24q4-6 0-12M50 24q4-6 0-12M64 24q4-6 0-12" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".55"/>${shine("M28 40h6v26q-6-4-6-14z")}`;
    }
    case "person": {
      const r = v(1, 13, 16);
      return `${shadow(50, 84, 30)}<circle cx="50" cy="${40 - r / 2}" r="${r}" fill="${P}"/><path d="M18 88q0-24 32-24t32 24z" fill="${P}"/><path d="M18 88q0-24 32-24 0 12 0 24z" fill="${A}" opacity=".5"/>${shine(`M${44 - r / 2} ${34 - r / 2}a6 6 0 0 1 8-4q-7 2-8 8z`)}`;
    }
    case "room": {
      // A window with light in it, a table under it and a chair beside:
      // the three things that say "a room you can sit in". The window is
      // kept clear of the table's legs so it does not read as furniture.
      return `${shadow(52, 80, 30)}<rect x="16" y="20" width="30" height="26" rx="3" fill="${A}" opacity=".45"/><rect x="16" y="20" width="30" height="26" rx="3" fill="none" stroke="${P}" stroke-width="3"/><path d="M31 20v26M16 33h30" stroke="${P}" stroke-width="3"/><rect x="22" y="60" width="56" height="5" rx="2.5" fill="${P}"/><rect x="26" y="65" width="4" height="15" rx="2" fill="${P}"/><rect x="70" y="65" width="4" height="15" rx="2" fill="${P}"/><rect x="56" y="46" width="16" height="14" rx="2" fill="${P}" opacity=".35"/><rect x="61" y="38" width="6" height="9" rx="3" fill="${P}"/><path d="M56 38h16l-4-8h-8z" fill="${A}"/>${shine("M19 24h10v9H19z")}`;
    }
    case "tool": {
      return `${shadow(50, 82, 26)}<path d="M62 20a16 16 0 0 0-14 24L24 68a7 7 0 0 0 10 10l24-24a16 16 0 0 0 20-22l-10 10-10-3-3-10z" fill="${P}"/><path d="M62 20a16 16 0 0 0-14 24l6-6a16 16 0 0 1 8-18z" fill="${A}" opacity=".7"/><circle cx="30" cy="72" r="3" fill="#fff" opacity=".55"/>${shine("M66 24l6-2-6 8z")}`;
    }
    case "workout": {
      return `${shadow(50, 80, 30)}<rect x="14" y="42" width="10" height="18" rx="3" fill="${P}"/><rect x="22" y="36" width="9" height="30" rx="3" fill="${P}"/><rect x="31" y="47" width="38" height="8" rx="4" fill="${A}"/><rect x="69" y="36" width="9" height="30" rx="3" fill="${P}"/><rect x="76" y="42" width="10" height="18" rx="3" fill="${P}"/>${shine("M24 40h5v8h-5z")}`;
    }
    case "play": {
      const n = v(1, 2, 3);
      return `${shadow(50, 82, 30)}<rect x="16" y="46" width="30" height="30" rx="5" fill="${P}"/><rect x="50" y="46" width="30" height="30" rx="5" fill="${A}"/><rect x="33" y="14" width="30" height="30" rx="5" fill="${S}" opacity=".9"/><circle cx="41" cy="61" r="3.5" fill="#fff" opacity=".85"/><circle cx="65" cy="61" r="3.5" fill="#fff" opacity=".85"/>${Array.from({ length: n }, (_, i) => `<circle cx="${42 + i * 8}" cy="29" r="3.5" fill="#fff" opacity=".85"/>`).join("")}${shine("M20 50h8v8h-8z")}`;
    }
    case "vehicle": {
      return `${shadow(50, 80, 32)}<path d="M16 60V48q0-4 4-5l8-12q2-3 6-3h32q4 0 6 3l8 12q4 1 4 5v12z" fill="${P}"/><path d="M30 34q2-3 6-3h28q4 0 6 3l6 10H24z" fill="${A}" opacity=".6"/><circle cx="30" cy="64" r="8" fill="${S}"/><circle cx="70" cy="64" r="8" fill="${S}"/><circle cx="30" cy="64" r="3" fill="#fff" opacity=".7"/><circle cx="70" cy="64" r="3" fill="#fff" opacity=".7"/>${shine("M34 36h10l-4 8H29z")}`;
    }
    case "document": {
      const lines = v(1, 3, 4);
      return `${shadow(50, 84, 26)}<path d="M26 22h30l18 18v40a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V26a4 4 0 0 1 4-4z" fill="#fff" opacity=".92"/><path d="M56 22l18 18H60a4 4 0 0 1-4-4z" fill="${A}" opacity=".8"/>${Array.from({ length: lines }, (_, i) => `<rect x="30" y="${48 + i * 10}" width="${i === lines - 1 ? 24 : 36}" height="5" rx="2.5" fill="${P}" opacity="${i === 0 ? 1 : 0.4}"/>`).join("")}<rect x="30" y="36" width="16" height="5" rx="2.5" fill="${P}" opacity=".25"/>`;
    }
    case "parcel": {
      return `${shadow(50, 82, 30)}<path d="M50 20l32 14v32L50 80 18 66V34z" fill="${P}"/><path d="M50 20l32 14-32 14-32-14z" fill="${A}" opacity=".75"/><path d="M50 48v32L18 66V34z" fill="#000" opacity=".1"/><path d="M44 25v17l-14-6V19z" fill="#fff" opacity=".35"/>${shine("M22 34l28-12 6 3-28 12z")}`;
    }
    case "plant": {
      return `${shadow(50, 84, 22)}<path d="M50 76V40" stroke="${P}" stroke-width="4" stroke-linecap="round"/><path d="M50 46q-18 0-20-18 18-2 20 18zM50 38q16-2 18-18-16 0-18 18z" fill="${P}"/><path d="M50 38q16-2 18-18-10 4-18 18z" fill="${A}" opacity=".6"/><path d="M34 62h32l-4 22a4 4 0 0 1-4 3H42a4 4 0 0 1-4-3z" fill="${S}"/>${shine("M38 64h5l3 20h-5z")}`;
    }
    case "clothes": {
      return `${shadow(50, 84, 26)}<path d="M38 18l12 7 12-7 18 10-7 14-7-4v42a4 4 0 0 1-4 4H38a4 4 0 0 1-4-4V38l-7 4-7-14z" fill="${P}"/><path d="M38 18l12 7 12-7-3 6q-9 5-18 0z" fill="${A}" opacity=".8"/>${shine("M27 28l9-5 3 5-8 9z")}`;
    }
    case "pet": {
      return `${shadow(50, 82, 26)}<path d="M28 40q0-16 22-16t22 16v18q0 16-22 16T28 58z" fill="${P}"/><path d="M28 34q-8-16 2-18t10 10zM72 34q8-16-2-18t-10 10z" fill="${P}"/><circle cx="41" cy="46" r="3.5" fill="#fff"/><circle cx="59" cy="46" r="3.5" fill="#fff"/><path d="M50 54a6 6 0 0 0 6 6 6 6 0 0 0-12 0 6 6 0 0 0 6-6z" fill="${A}"/>${shine("M34 34q3-8 10-10-7 5-8 12z")}`;
    }
    case "event": {
      return `${shadow(50, 82, 30)}<rect x="18" y="30" width="64" height="46" rx="6" fill="#fff" opacity=".92"/><rect x="18" y="30" width="64" height="14" rx="6" fill="${P}"/><rect x="18" y="38" width="64" height="6" fill="${P}"/><rect x="32" y="24" width="6" height="12" rx="3" fill="${P}"/><rect x="62" y="24" width="6" height="12" rx="3" fill="${P}"/><rect x="27" y="50" width="13" height="11" rx="3" fill="${A}"/><rect x="45" y="50" width="13" height="11" rx="3" fill="${P}" opacity=".28"/><rect x="63" y="50" width="12" height="11" rx="3" fill="${P}" opacity=".28"/><rect x="27" y="64" width="13" height="6" rx="3" fill="${P}" opacity=".28"/>`;
    }
    case "chat": {
      return `${shadow(50, 84, 28)}<path d="M16 26h48a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H36l-14 10V60h-6a6 6 0 0 1-6-6V32a6 6 0 0 1 6-6z" fill="${P}"/><path d="M52 44h30a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6h-4v8l-11-8H52a6 6 0 0 1-6-6V50a6 6 0 0 1 6-6z" fill="${A}"/><circle cx="30" cy="43" r="3" fill="#fff" opacity=".8"/><circle cx="40" cy="43" r="3" fill="#fff" opacity=".8"/><circle cx="50" cy="43" r="3" fill="#fff" opacity=".8"/>${shine("M18 30h14v6H18z")}`;
    }
    case "sound": {
      const bars = 9;
      return `${Array.from({ length: bars }, (_, i) => {
        const h = 14 + ((i * 37) % 43);
        return `<rect x="${13 + i * 8.6}" y="${(100 - h) / 2}" width="5" height="${h}" rx="2.5" fill="${i % 3 === 1 ? A : P}" opacity="${i % 2 ? 0.75 : 1}"/>`;
      }).join("")}`;
    }
    case "place": {
      const peak = v(1, 30, 42);
      return `<circle cx="74" cy="26" r="11" fill="${A}" opacity=".85"/><path d="M0 100V64l22-18 18 14 16-16 22 20 22-14v50z" fill="${P}" opacity=".45"/><path d="M0 100V72l26-${peak} 20 18 18-14 36 26v28z" fill="${P}"/><path d="M26 ${72 - peak}l10 9-20 0z" fill="#fff" opacity=".45"/>`;
    }
    default: {
      const a = v(1, 8, 34);
      const b = v(2, 10, 40);
      return `<circle cx="${a}" cy="${b}" r="34" fill="${P}" opacity=".7"/><circle cx="${100 - b}" cy="${100 - a}" r="30" fill="${A}" opacity=".75"/><circle cx="${50 + (a % 14)}" cy="${46 + (b % 14)}" r="18" fill="${S}" opacity=".6"/>`;
    }
  }
}

/**
 * A picture of something, filling whatever box it is put in.
 *
 * `slice` rather than `meet` so a wide banner and a small square
 * thumbnail both look composed instead of letterboxed; the subject sits
 * in the middle third of the square so neither crop loses it.
 */
export function scene(subject: string | SceneKind, seed = 0): string {
  const kind = sceneKind(subject);
  // Two things to get right at once.
  //
  // The crop: the same drawing has to sit in a 64 px thumbnail, a 170 px
  // tile and a 350 by 210 banner. The banner is the tight one — filling
  // its width leaves only the middle half of the square showing — so
  // everything is scaled into that middle band. A square box then has
  // air around the subject, which composes; the banner keeps it whole.
  //
  // The variety: six of one thing in a grid must not be six identical
  // drawings, or the screen reads as one sticker repeated. Each gets its
  // own size, lean and offset, and every third swaps the body and detail
  // colours — which is now a pair of custom properties on the instance
  // rather than a second copy of the drawing.
  const k = vary(seed, 3, 66, 80) / 100;
  const dx = vary(seed, 4, -7, 7);
  const dy = vary(seed, 5, -4, 4);
  const lean = vary(seed, 6, -5, 5);
  const swap = vary(seed, 7, 0, 2) === 0;
  const ink = swap ? "--a1:var(--a);--a2:var(--p)" : "--a1:var(--p);--a2:var(--a)";
  return `<svg class="art" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="${ink};--a3:var(--s)">${ground}<g transform="translate(${dx} ${dy}) rotate(${lean} 50 52) scale(${k}) translate(${((50 * (1 - k)) / k).toFixed(1)} ${((52 * (1 - k)) / k).toFixed(1)})"><use href="#sc-${kind}"/></g></svg>`;
}

/** The subject, resolved to a drawing, whether it came in as a noun or a kind. */
function sceneKind(subject: string | SceneKind): SceneKind {
  return (WORDS.some(([k]) => k === subject) || subject === "abstract" ? subject : sceneFor(String(subject))) as SceneKind;
}

/**
 * The drawings a document needs, defined once at the top of it.
 *
 * Inlining the whole of a loaf at every one of a dozen breads on a shop
 * screen is most of a page's weight for no benefit: the drawing is the
 * same drawing. So each kind is defined once here and every picture is
 * one `<use>` with its own transform and its own two colours.
 */
export function sceneDefs(subjects: (string | SceneKind)[]): string {
  const kinds = [...new Set([...subjects.map(sceneKind), "abstract" as SceneKind])];
  // The slots are given the palette's own values here as well as on each
  // picture. A gradient resolves a custom property against ITS OWN place
  // in the tree, not the element that references it, so the shared ground
  // gradient would otherwise draw with nothing in its stops and come out
  // grey. The per-picture values still win for the drawing itself, which
  // is what lets one instance swap its two colours.
  return `<svg width="0" height="0" style="position:absolute;--a1:var(--p);--a2:var(--a);--a3:var(--s)" aria-hidden="true"><defs><linearGradient id="scg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--a3)" stop-opacity=".26"/><stop offset="1" stop-color="var(--a1)" stop-opacity=".10"/></linearGradient>${kinds.map((k) => `<g id="sc-${k}">${art(k)}</g>`).join("")}</defs></svg>`;
}

/** The one rule the drawings need from the page's stylesheet. */
export const SCENE_CSS = `.pic .art{position:absolute;inset:0;width:100%;height:100%;display:block}`;
