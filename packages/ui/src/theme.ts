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
  panel: "#FAFDFF",
  paper: "#EDF0F4",
  well: "#E3E7EB",
  line: "#D0D5D9",
  faint: "#656C73",
  muted: "#4D535A",
  strong: "#3D434A",
  ink: "#12171B",
  blackout: "#020508",
  accent: "#BE241B",
  accentLift: "#E05B4C",
  accentSoft: "#FBE1DD",
  accentFill: "#BE241B",
  gold: "#B18C39",
  goldDeep: "#775800",
  fountain: "#207582",
  verify: "#298646",
};

export const DARK: Record<ShellKey, string> = {
  panel: "#1A2026",
  paper: "#12171B",
  well: "#232A31",
  line: "#2E353C",
  faint: "#8A929A",
  muted: "#A7AEB5",
  strong: "#C9CFD5",
  ink: "#EDF0F4",
  blackout: "#020508",
  accent: "#E05B4C",
  accentLift: "#F0806F",
  accentSoft: "#3A1F1C",
  accentFill: "#C93F31",
  gold: "#D7B15B",
  goldDeep: "#E4C77A",
  fountain: "#4FA3B0",
  verify: "#4CAF6A",
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
export const alpha = {
  hairline: () => (current === "dark" ? "rgba(237,240,244,0.12)" : "rgba(208,213,217,0.7)"),
  glassFill: () => (current === "dark" ? "rgba(26,32,38,0.92)" : "rgba(255,255,255,0.86)"),
  scrim: () => (current === "dark" ? "rgba(0,0,0,0.6)" : "rgba(18,23,27,0.45)"),
  placeholder: () => (current === "dark" ? "rgba(167,174,181,0.6)" : "rgba(77,83,90,0.6)"),
  /** The light on a surface's top edge: the one line that makes a plate read as lacquer. */
  gloss: () => (current === "dark" ? "rgba(237,240,244,0.10)" : "rgba(255,255,255,0.75)"),
};
