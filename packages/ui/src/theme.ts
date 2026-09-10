/**
 * Two schemes, one shell. LIGHT is the site's palette; DARK is the same
 * building at night: the same hue 250, the same accent family, lifted for
 * contrast. `applyScheme` writes the chosen set INTO `shell`, and the root
 * layout remounts on change, so every component keeps reading `shell.x`
 * at render time and nothing holds a stale colour. The art palette never
 * changes — sprites and the stand look the same by night, which is true of
 * a real hall too.
 */
import { shell, type ShellKey } from "./tokens";

export type Scheme = "light" | "dark";

export const LIGHT: Record<ShellKey, string> = {
  panel: "#FFFFFF",
  paper: "#F2F4F7",
  well: "#E9ECF0",
  line: "#E1E4E8",
  faint: "#646B73",
  muted: "#5B626A",
  strong: "#3D434A",
  ink: "#101418",
  blackout: "#0B0E12",
  accent: "#BE241B",
  accentLift: "#E05B4C",
  accentSoft: "#FDE4DC",
  accentFill: "#F2613F",
  onAccent: "#101418",
  gold: "#B18C39",
  goldDeep: "#775800",
  fountain: "#207582",
  verify: "#298646",
};

export const DARK: Record<ShellKey, string> = {
  panel: "#1C1F23",
  paper: "#0B0E12",
  well: "#171A1E",
  line: "#22262B",
  faint: "#888A8E",
  muted: "#A6A9AB",
  strong: "#C9CFD5",
  ink: "#F4F6F8",
  blackout: "#05070A",
  accent: "#FF6B3D",
  accentLift: "#FF8A5B",
  accentSoft: "#3A2118",
  accentFill: "#FF6B3D",
  onAccent: "#101418",
  gold: "#E4C77A",
  goldDeep: "#E4C77A",
  fountain: "#6FD3E0",
  verify: "#4CD08A",
};

let current: Scheme = "light";
export const scheme = () => current;

/** Write a scheme into `shell`. Call before rendering, then remount (key the tree on the scheme). */
export function applyScheme(s: Scheme): void {
  current = s;
  const src = s === "dark" ? DARK : LIGHT;
  for (const k of Object.keys(src) as ShellKey[]) shell[k] = src[k];
}

/** Hairline and scrim alphas that depend on the scheme. */
/** The glass: fills, hairlines and lights that depend on the scheme. Every value is white or black at an alpha, so it composes over the hall's lights. */
export const alpha = {
  hairline: () => (current === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)"),
  /** The card: white over the blur. */
  panelFill: () => (current === "dark" ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.72)"),
  /** The bar and the composer: a little stronger, so they sit over content. */
  glassFill: () => (current === "dark" ? "rgba(22,26,31,0.72)" : "rgba(255,255,255,0.80)"),
  /** A lit or pressed surface. */
  raisedFill: () => (current === "dark" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.92)"),
  /** The quiet inset. */
  wellFill: () => (current === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
  scrim: () => (current === "dark" ? "rgba(0,0,0,0.62)" : "rgba(16,20,24,0.40)"),
  placeholder: () => (current === "dark" ? "rgba(244,246,248,0.42)" : "rgba(16,20,24,0.42)"),
  /** The light on a surface's top edge. */
  gloss: () => (current === "dark" ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.95)"),
  /** The blur behind a pane, for expo-blur. */
  blurTint: () => (current === "dark" ? "dark" : "light") as "dark" | "light",
};
