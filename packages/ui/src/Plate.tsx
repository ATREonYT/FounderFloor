/**
 * THE PLATE — the one surface every panel, sheet, chip and card sits on:
 * a pane of frosted glass in the night hall.
 *
 * Anatomy, back to front: a real blur of whatever is behind (the hall's
 * lights, a scene, a list scrolling under a bar), the tint fill, a
 * one-pixel hairline, and the light on the top edge, a highlight that
 * fades across the first third of the height. Depth comes from the blur
 * and the light, not from a shadow; only the float tone casts one, and
 * only because it hangs over content.
 *
 * Tones:
 *   panel   the card: white at 7% by night, 72% by day, blur 24
 *   glass   the bar and the composer: stronger, blur 40, sits over content
 *   paper   the quiet inset: a well, blur 12
 *   plate   the one opaque dark sign (the stand's name)
 *   paperSign  the same as panel (kept for the screens that ask for it)
 *
 * A ring is a 1.5px stroke in a colour on the same outline: the card that
 * is lit, the task that is done. Never a border on the outside.
 */
import type { ReactNode } from "react";
import { Platform, View, type ViewStyle, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { radius as R, shell, shadow } from "./tokens";
import { alpha, scheme } from "./theme";

export type PlateTone = "panel" | "glass" | "plate" | "paperSign" | "paper";

const TONES = (): Record<PlateTone, { fill: string; line: string; blur: number; shadow?: "card" | "float"; gloss: boolean; foot: string }> => ({
  // the card: a near-solid panel with a hairline and a two-pixel foot, the thing a hand can rest on
  panel: { fill: alpha.panelFill(), line: alpha.hairline(), blur: 10, gloss: false, foot: alpha.foot() },
  paperSign: { fill: alpha.panelFill(), line: alpha.hairline(), blur: 10, gloss: false, foot: alpha.foot() },
  // the bar, the composer, the sheet: real glass, because they float over content
  glass: { fill: alpha.glassFill(), line: alpha.hairline(), blur: 40, shadow: "float", gloss: true, foot: "transparent" },
  paper: { fill: alpha.wellFill(), line: "transparent", blur: 0, gloss: false, foot: "transparent" },
  plate: { fill: shell.blackout, line: "rgba(255,255,255,0.08)", blur: 0, gloss: true, foot: "transparent" },
});

export function Plate({
  tone = "panel",
  children,
  style,
  radius = R.lg,
  padding,
  contentStyle,
  lineColor,
  ring,
  testID,
}: {
  tone?: PlateTone;
  children?: ReactNode;
  style?: ViewStyle;
  radius?: number;
  padding?: number;
  /** Constrain the painted box (e.g. maxHeight) so a scrolling child shrinks INSIDE the plate. */
  contentStyle?: ViewStyle;
  /** Override the hairline — the composer speaks fountain while focused. */
  lineColor?: string;
  /** A 1.5px ring in this colour on the same outline: the card that is lit, the task that is done. */
  ring?: string;
  testID?: string;
}) {
  const t = TONES()[tone];
  const cast = t.shadow ? shadow[t.shadow][1] : null;
  const dark = scheme() === "dark";
  return (
    <View
      testID={testID}
      style={[
        cast && {
          shadowColor: cast.color,
          shadowOffset: cast.offset,
          shadowRadius: cast.radius,
          shadowOpacity: 1,
          elevation: 8,
        },
        style,
      ]}
    >
      <View style={[styles.host, { borderRadius: radius }, contentStyle]}>
        {t.blur > 0 ? (
          <BlurView
            pointerEvents="none"
            intensity={t.blur}
            tint={dark ? "dark" : "light"}
            experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: t.fill }]} />
        {t.gloss ? (
          <LinearGradient
            pointerEvents="none"
            colors={[alpha.gloss(), "rgba(255,255,255,0)"]}
            locations={[0, 1]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: 28, opacity: dark ? 0.5 : 0.9 }}
          />
        ) : null}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: lineColor ?? t.line, borderBottomWidth: t.foot === "transparent" ? 1 : 2, borderBottomColor: t.foot === "transparent" ? (lineColor ?? t.line) : t.foot }]} />
        {ring ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1.5, borderColor: ring }]} /> : null}
        <View style={[{ flexShrink: 1 }, padding !== undefined ? { padding } : null]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { overflow: "hidden", position: "relative" },
});
