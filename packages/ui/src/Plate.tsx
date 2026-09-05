/**
 * THE PLATE — the one surface every panel, sign, chip and card sits on.
 *
 * Its signature is the site's `.clip-badge`: an 8px bevel across the
 * top-right corner only, "the corner you punch a lanyard clip through on an
 * expo badge", on every plate and nowhere else in the world. React Native
 * cannot clip-path, so the bevel is real geometry: an SVG polygon paints the
 * fill, and a matching polyline draws the hairline on top. The other three
 * corners keep the radius. Nothing else on the app may cut a corner.
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
import Svg, { Polygon, Polyline } from "react-native-svg";
import { BEVEL, radius as R, shell, shadow } from "./tokens";

export type PlateTone = "panel" | "glass" | "plate" | "paperSign" | "paper";

const TONES: Record<PlateTone, { fill: string; line: string; shadow?: "card" | "float" }> = {
  panel: { fill: shell.panel, line: "rgba(208,213,217,0.7)", shadow: "card" },
  glass: { fill: "rgba(255,255,255,0.86)", line: "rgba(208,213,217,0.6)", shadow: "float" },
  plate: { fill: shell.blackout, line: shell.blackout },
  paperSign: { fill: shell.panel, line: shell.line },
  paper: { fill: shell.paper, line: shell.line },
};

/** The bevelled outline for a w x h plate with radius r. */
function outline(w: number, h: number, r: number): string {
  // straight-edged where the bevel is; the SVG polygon cannot round the
  // other corners, so the rounding comes from the overflow:hidden host
  // View's borderRadius and the polygon simply fills the whole box minus
  // the bevel triangle.
  return `0,0 ${w - BEVEL},0 ${w},${BEVEL} ${w},${h} 0,${h}`;
}

export function Plate({
  tone = "panel",
  children,
  style,
  radius = R.lg,
  padding,
  contentStyle,
  testID,
}: {
  tone?: PlateTone;
  children?: ReactNode;
  style?: ViewStyle;
  radius?: number;
  padding?: number;
  /** Constrain the painted box (e.g. maxHeight) so a scrolling child shrinks INSIDE the plate. */
  contentStyle?: ViewStyle;
  testID?: string;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const t = TONES[tone];
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
            <Polygon points={outline(size.w, size.h, radius)} fill={t.fill} />
            <Polyline
              points={`${size.w - BEVEL},0.5 ${size.w - 0.5},${BEVEL}`}
              stroke={t.line}
              strokeWidth={1}
              fill="none"
            />
          </Svg>
        )}
        <View
          style={[
            styles.border,
            { borderRadius: radius, borderColor: t.line },
            // the hairline is drawn by the View; the bevel edge by the SVG.
          ]}
          pointerEvents="none"
        />
        <View style={[{ flexShrink: 1 }, padding !== undefined ? { padding } : null]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { overflow: "hidden", position: "relative" },
  border: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1 },
});
