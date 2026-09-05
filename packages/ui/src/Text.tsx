/**
 * Type, in the site's roles. Every on-screen string goes through one of
 * these so weight, family and tracking cannot drift per screen.
 *
 *   Display  Archivo — headlines, panel signs, floor names. Over 30px it
 *            takes the negative tracking the site applies (a grotesque's
 *            sidebearings read as gaps at poster size).
 *   Body     IBM Plex Sans 16/24. Emphasis is ONE weight step, never italic.
 *   Mono     IBM Plex Mono — data, HUD, labels; tabular figures always.
 *   Spec     the `.micro` label: mono 12/16, normal case, normal tracking.
 *   Signage  the ONE uppercase + wide-tracked style, only inside a Sign.
 *   Kbd      a key cap: mono 12 in a hairline box, ink or paper tone.
 */
import type { ReactNode } from "react";
import { Text as RNText, View, type TextStyle, type StyleProp } from "react-native";
import { fontFamily as F, type as T, shell, onDark, radius, signage } from "./tokens";

type Tone = "ink" | "muted" | "paper" | "paperQuiet" | "accent" | "accentLift" | "goldDeep" | "verify" | "faint";
const TONE: Record<Tone, string> = {
  ink: shell.ink,
  muted: shell.muted,
  paper: shell.paper,
  paperQuiet: onDark.quiet,
  accent: shell.accent,
  accentLift: shell.accentLift,
  goldDeep: shell.goldDeep,
  verify: shell.verify,
  faint: shell.faint,
};

type Common = { children: ReactNode; tone?: Tone; style?: StyleProp<TextStyle>; numberOfLines?: number; accessibilityRole?: "header" | "text" };

export function Display({ children, tone = "ink", size = "xl", style, ...rest }: Common & { size?: "lg" | "xl" | "3xl" | "4xl" }) {
  const s = T[size];
  return (
    <RNText
      {...rest}
      accessibilityRole={rest.accessibilityRole ?? "header"}
      style={[
        { fontFamily: F.display, fontSize: s.size, lineHeight: s.line, color: TONE[tone] },
        "tracking" in s ? { letterSpacing: s.tracking } : null,
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export function Body({ children, tone = "ink", size = "base", medium = false, style, ...rest }: Common & { size?: "xs" | "sm" | "base" | "lg"; medium?: boolean }) {
  const s = T[size];
  return (
    <RNText {...rest} style={[{ fontFamily: medium ? F.bodyMedium : F.body, fontWeight: medium ? "500" : "400", fontSize: s.size, lineHeight: s.line, color: TONE[tone] }, style]}>
      {children}
    </RNText>
  );
}

export function Mono({ children, tone = "ink", size = "sm", medium = false, style, ...rest }: Common & { size?: "xs" | "sm" | "base"; medium?: boolean }) {
  const s = T[size];
  return (
    <RNText {...rest} style={[{ fontFamily: medium ? F.monoMedium : F.mono, fontSize: s.size, lineHeight: s.line, color: TONE[tone], fontVariant: ["tabular-nums"] }, style]}>
      {children}
    </RNText>
  );
}

/** `.micro` — the metadata label. Mono 12, normal case, normal tracking. */
export function Spec({ children, tone = "muted", style, ...rest }: Common) {
  return (
    <RNText {...rest} style={[{ fontFamily: F.mono, fontSize: T.xs.size, lineHeight: T.xs.line, color: TONE[tone], fontVariant: ["tabular-nums"] }, style]}>
      {children}
    </RNText>
  );
}

/** Sign lettering. The only uppercase on the app, and only inside a Sign. */
export function Signage({ children, tone = "paper", style, ...rest }: Common) {
  return (
    <RNText
      {...rest}
      style={[
        { fontFamily: F.display, fontSize: signage.size, lineHeight: 14, letterSpacing: signage.letterSpacing, textTransform: "uppercase", color: TONE[tone] },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

/** A key cap: `rounded-sm border px-1.5 py-0.5 font-mono text-xs`. */
export function Kbd({ children, tone = "ink" }: { children: ReactNode; tone?: "ink" | "paper" }) {
  const dark = tone === "paper";
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: dark ? "rgba(237,240,244,0.4)" : shell.line,
        borderRadius: radius.sm,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: "flex-start",
      }}
    >
      <RNText style={{ fontFamily: F.mono, fontSize: T.xs.size, lineHeight: T.xs.line, color: dark ? shell.paper : shell.ink }}>{children}</RNText>
    </View>
  );
}
