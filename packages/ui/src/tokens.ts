/**
 * THE TOKENS — every colour, size, radius and easing the app may use.
 *
 * Copied from the site, not designed here. Two palettes coexist and must
 * not be merged: `shell` is the marketing chrome (oklch on hue 250, cool),
 * `art` is the hall's own warm hex. Chrome uses shell; anything drawn —
 * sprites, the booth, the plaza — uses art. See docs/ui-inventory.md §1.
 *
 * If a new state truly needs a colour, derive it from one of these and
 * add a row to the inventory with the reason. Do not add a hue.
 */

// ─── colour: the shell (app/globals.css :root, resolved to sRGB) ──────────
// Mutable on purpose: theme.ts swaps every value for the dark scheme and the
// root remounts, so components keep reading `shell.x` at render and never
// carry a stale colour. Never destructure a colour at module scope.
export type ShellKey = "panel" | "paper" | "well" | "line" | "faint" | "muted" | "strong" | "ink" | "blackout" | "accent" | "accentLift" | "accentSoft" | "accentFill" | "onAccent" | "gold" | "goldDeep" | "fountain" | "verify";
export const shell: Record<ShellKey, string> = {
  panel: "#FAFDFF", // foamcore — cards, header, footer
  paper: "#EDF0F4", // screed — page ground, inputs
  well: "#E3E7EB", // laminate — inset wells
  line: "#D0D5D9", // trestle — hairlines
  faint: "#8D9399", // gantry — faint labels, code slots on dark
  muted: "#4D535A", // conduit — secondary text (never on dark)
  strong: "#3D434A", // flightcase
  ink: "#12171B", // gaffer — text, dark fills
  blackout: "#020508", // sign plates, the darkest ground
  accent: "#BE241B", // tarp — CTAs, live dots (on paper)
  accentLift: "#E05B4C", // tarp-lift — the accent ON DARK grounds only
  accentSoft: "#FBE1DD", // tarp-wash
  accentFill: "#BE241B", // the accent as a fill under white text: the tarp red by day, a shade deeper by night (5.6:1)
  onAccent: "#FFFFFF", // the text on the red: white, bold
  gold: "#B18C39", // brass — membership fills/dots/borders only
  goldDeep: "#775800", // brass-deep — membership as TEXT
  fountain: "#207582", // WAYFINDING ONLY — input focus
  verify: "#298646", // exitsign — online, success, verified
};

/** Paper at the alphas the site uses on dark grounds (composited on blackout). */
export const onDark = {
  text: shell.paper,
  quiet: "rgba(237,240,244,0.60)", // 6.54:1 — the floor for small text
  faint: "rgba(237,240,244,0.40)", // hairlines only, never text
  rule: "rgba(237,240,244,0.15)",
} as const;

// ─── colour: the art (game/*.ts — the hall as the canvas knows it) ────────
export const art = {
  ink: "#23201A",
  paper: "#F2EFE7",
  bubblePaper: "#FFFDF5",
  muted: "#6F6A5E",
  hairline: "#E4DFD3",
  accent: "#D9480F",
  accentRed: "#C03A2B",
  gold: "#B08D2E",
  goldBright: "#DCC06B",
  goldDeep: "#7A611F",
  woodTop: "#D9C79B",
  woodFront: "#A28457",
  card: "#FAF7EF",
  cardLine: "#C6BCA4",
  lampOn: "#2B8A3E",
  lampOff: "#9A937F",
  floors: {
    "main-hall": { a: "#D8D2C4", b: "#D1CABA", wall: "#8A8272", trim: "#6F6A5E" },
    "indie-alley": { a: "#CBB89A", b: "#C2AE8E", wall: "#7A6248", trim: "#5C4A36" },
    "ramen-district": { a: "#4A4A52", b: "#44444C", wall: "#2F2F36", trim: "#A63D2F" },
    "cofounder-row": { a: "#39493E", b: "#344439", wall: "#24312A", trim: "#B08D2E" },
    "tutorial-hall": { a: "#D9D6CB", b: "#D1CEC1", wall: "#7E8578", trim: "#5E665E" },
  },
} as const;

/** lib/ranks.ts — badge colour and threshold. */
export const ranks = [
  { id: "garage", name: "Garage", min: 0, color: "#6F6A5E" },
  { id: "first-dollar", name: "First Dollar", min: 1, color: "#9C6B30" },
  { id: "ramen", name: "Ramen Profitable", min: 1_000, color: "#2B8A3E" },
  { id: "default-alive", name: "Default Alive", min: 10_000, color: "#1971C2" },
  { id: "escape", name: "Escape Velocity", min: 100_000, color: "#B08D2E" },
] as const;
export type RankId = (typeof ranks)[number]["id"];
export function rankFor(monthlyRevenue: number): (typeof ranks)[number] {
  let r: (typeof ranks)[number] = ranks[0];
  for (const x of ranks) if (monthlyRevenue >= x.min) r = x;
  return r;
}

// ─── the unit grid ────────────────────────────────────────────────────────
/** u = 4px = TILE/8. Every spacing value is a multiple of it. */
export const u = 4;
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 } as const;

/** Radii are 1u/2u/3u/4u and CONCENTRIC (child = parent − gap). */
export const radius = { sm: 10, md: 14, lg: 18, xl: 22, xxl: 30, full: 999 } as const;
// xxl is the app's own addition (not on the site): the soft pill every 2026
// assistant app draws its composer and its picker in. Still concentric.

/** lib/data/shop.ts BOOTH_SWATCHES — the fourteen banner/carpet colours. */
export const swatches = ["#8C3B2E", "#C4562B", "#4E6E4E", "#7A8C50", "#3B5B92", "#57829B", "#6B4E71", "#2F6F6A", "#A98C5B", "#8A6B4D", "#555049", "#B08D2E", "#A64D79", "#3F4A5A"] as const;

/** The first world's clipped corner. Kept as a number for the site's badge; the app's glass draws no bevel. */
export const BEVEL = 0;

/** The hall's tile and sprite metrics (lib/types.ts, game/sprites.ts). */
export const TILE = 32;
export const SPRITE = { w: 20, h: 28 } as const;

// ─── type (tailwind.config.ts fontSize, on the unit) ─────────────────────
export const type = {
  xs: { size: 13, line: 18 },
  sm: { size: 15, line: 21 },
  base: { size: 16, line: 24 },
  lg: { size: 18, line: 26 },
  xl: { size: 26, line: 31, tracking: -0.01 * 26 },
  "3xl": { size: 33, line: 38, tracking: -0.015 * 33 },
  "4xl": { size: 42, line: 46, tracking: -0.02 * 42 },
} as const;

/** Archivo carries headlines and controls, Plex Sans the body, Plex Mono code and pasted text. */
export const fontFamily = {
  display: "Archivo-SemiBold",
  displayMedium: "Archivo-Bold",
  body: "IBMPlexSans",
  bodyMedium: "IBMPlexSans-Medium",
  mono: "IBMPlexMono",
  monoMedium: "IBMPlexMono-Medium",
} as const;

/** Signage lettering — the ONE place uppercase + wide tracking survives. */
export const signage = { size: 12, letterSpacing: 0.12 * 12, uppercase: true } as const;

// ─── depth (tailwind boxShadow: layered and soft) ────────────────────────
export const shadow = {
  card: [
    { color: "rgba(0,0,0,0.04)", offset: { width: 0, height: 1 }, radius: 2 },
    { color: "rgba(0,0,0,0.12)", offset: { width: 0, height: 12 }, radius: 28 },
  ],
  float: [
    { color: "rgba(0,0,0,0.10)", offset: { width: 0, height: 4 }, radius: 10 },
    { color: "rgba(0,0,0,0.35)", offset: { width: 0, height: 20 }, radius: 44 },
  ],
} as const;

// ─── motion (globals.css --ease-*, StallPanel, bubbles.ts) ───────────────
export const ease = {
  out: [0.22, 1, 0.36, 1],
  spring: [0.34, 1.4, 0.64, 1],
  release: [0.32, 1.72, 0.42, 0.9],
} as const;
/**
 * The curves for motion without a finger on it (Apple's, via Emil
 * Kowalski's tables): a strong ease-out for anything entering or leaving,
 * a strong ease-in-out for anything moving across the screen, the iOS
 * sheet curve for a sheet that opens on its own. Never ease-in on UI.
 */
export const curve = {
  out: [0.23, 1, 0.32, 1],
  inOut: [0.77, 0, 0.175, 1],
  sheet: [0.32, 0.72, 0, 1],
} as const;
/** The springs for motion a finger started: settle (no overshoot) unless the gesture carried momentum. */
export const spring = {
  settle: { duration: 400, dampingRatio: 1 },
  snap: { duration: 400, dampingRatio: 0.8 },
  sheet: { duration: 300, dampingRatio: 0.8 },
} as const;
export const ms = {
  press: 100,
  release: 140,
  colour: 150,
  panelIn: 200,
  panelOut: 190,
  reveal: 420,
  revealStagger: 60,
  toast: 220,
  bubbleRise: 220,
  bubbleFade: 300,
  bubbleLife: 5000,
  emotePop: 250,
  emoteLife: 2500,
  walkFps: 7,
} as const;
