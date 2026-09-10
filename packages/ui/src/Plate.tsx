/**
 * THE PLATE — the one surface every panel, sign, chip and card sits on.
 *
 * Its signature is the site's `.clip-badge`: an 8px bevel across the
 * top-right corner only, "the corner you punch a lanyard clip through on an
 * expo badge", on every plate and nowhere else in the world. React Native
 * cannot clip-path, so the bevel is real geometry: one SVG path with three
 * round corners and the cut, painted as the fill and stroked as the
 * hairline, so the outline is exactly the shape. Nothing else on the app
 * may cut a corner.
 *
 * Tones (globals.css):
 *   panel   .panel  — foamcore fill, line/70 hairline, card shadow
 *   glass   .glass  — rgba(255,255,255,.86), line/60 hairline, float shadow.
 *           The site blurs what is behind glass; RN has no cheap backdrop
 *           blur, and glass only ever sits over the hall (a WebView), so
 *           the fill alone is used. Recorded as a deviation.
 *   plate   the Sign plate — blackout fill, blackout hairline
 *   paperSign — the quiet sign: foamcore fill, trestle hairline
 */
import { useState, type ReactNode } from "react";
import { View, type LayoutChangeEvent, type ViewStyle, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { BEVEL, radius as R, shell, shadow } from "./tokens";
import { alpha } from "./theme";

export type PlateTone = "panel" | "glass" | "plate" | "paperSign" | "paper";

// computed per render: the shell's colours change with the scheme
const TONES = (): Record<PlateTone, { fill: string; line: string; shadow?: "card" | "float" }> => ({
  panel: { fill: shell.panel, line: alpha.hairline(), shadow: "card" },
  glass: { fill: alpha.glassFill(), line: alpha.hairline(), shadow: "float" },
  plate: { fill: shell.blackout, line: shell.blackout },
  paperSign: { fill: shell.panel, line: shell.line },
  paper: { fill: shell.paper, line: shell.line },
});

/**
 * The plate's outline as one path: round corners at top-left, bottom-left
 * and bottom-right, the clip corner cut at top-right, inset by `i` so a
 * hairline stroked on it sits inside the box. Fill and stroke share it, so
 * the outline is the shape and nothing is square that the surface is not.
 */
function outline(w: number, h: number, r: number, i = 0): string {
  const rr = Math.max(0, Math.min(r, (Math.min(w, h) - 2 * i) / 2));
  const x0 = i, y0 = i, x1 = w - i, y1 = h - i;
  const b = BEVEL;
  return [
    `M${x0 + rr},${y0}`,
    `H${x1 - b}`,
    `L${x1},${y0 + b}`,
    `V${y1 - rr}`,
    `A${rr},${rr} 0 0 1 ${x1 - rr},${y1}`,
    `H${x0 + rr}`,
    `A${rr},${rr} 0 0 1 ${x0},${y1 - rr}`,
    `V${y0 + rr}`,
    `A${rr},${rr} 0 0 1 ${x0 + rr},${y0}`,
    "Z",
  ].join(" ");
}

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
  /** A 1.5px ring in this colour on the same outline: the card that is lit, the task that is done. Never a square border on the outside. */
  ring?: string;
  testID?: string;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const base = TONES()[tone];
  const t = lineColor ? { ...base, line: lineColor } : base;
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };
  const cast = t.shadow ? shadow[t.shadow][1] : null;
  return (
    <View
      testID={testID}
      onLayout={onLayout}
      style={[
        cast && {
          shadowColor: cast.color,
          shadowOffset: cast.offset,
          shadowRadius: cast.radius,
          shadowOpacity: 1,
          elevation: t.shadow === "float" ? 8 : 3,
        },
        style,
      ]}
    >
      <View style={[styles.host, { borderRadius: radius }, contentStyle]}>
        {size.w > 0 && (
          <Svg
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
          >
            <Path d={outline(size.w, size.h, radius)} fill={t.fill} />
            <Path d={outline(size.w, size.h, radius, 0.5)} stroke={t.line} strokeWidth={1} fill="none" />
            {ring ? <Path d={outline(size.w, size.h, radius, 1)} stroke={ring} strokeWidth={1.5} fill="none" /> : null}
          </Svg>
        )}
        {/* the light on the top edge: what makes foamcore read as lacquer */}
        {tone !== "plate" ? <View pointerEvents="none" style={{ position: "absolute", top: 1, left: radius, right: radius + BEVEL, height: 1, backgroundColor: alpha.gloss() }} /> : null}
        <View style={[{ flexShrink: 1 }, padding !== undefined ? { padding } : null]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { overflow: "hidden", position: "relative" },
});
