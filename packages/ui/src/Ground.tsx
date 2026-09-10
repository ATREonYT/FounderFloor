/**
 * THE GROUND — the hall's lights. Every screen sits on the same dark
 * ground, and near the top of it hang a few large, soft lights: the ember
 * of the accent to the right, a cool blue to the left, a little brass
 * low down. They are what the glass panes refract; without them glass is
 * grey. Drawn once, in the root layout, behind every page, and never
 * moving except in the opening. Under Reduce Motion nothing here moves
 * anyway.
 */
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { scheme } from "./theme";

export type Light = { x: number; y: number; r: number; color: string; alpha: number };

/** The lights, as fractions of the screen: x, y from the top-left, r of the width. */
export function hallLights(dark: boolean): Light[] {
  return dark
    ? [
        { x: 0.92, y: 0.02, r: 0.62, color: "#FF6B3D", alpha: 0.26 },
        { x: 0.06, y: 0.16, r: 0.62, color: "#4C7DFF", alpha: 0.22 },
        { x: 0.5, y: 1.04, r: 0.55, color: "#E4C77A", alpha: 0.10 },
      ]
    : [
        { x: 0.92, y: 0.02, r: 0.6, color: "#FF8A5B", alpha: 0.22 },
        { x: 0.06, y: 0.16, r: 0.6, color: "#7FA3FF", alpha: 0.22 },
        { x: 0.5, y: 1.04, r: 0.5, color: "#E4C77A", alpha: 0.16 },
      ];
}

export function Ground({ lights, opacity = 1 }: { lights?: Light[]; opacity?: number }) {
  const dark = scheme() === "dark";
  const L = lights ?? hallLights(dark);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          {L.map((l, i) => (
            <RadialGradient key={i} id={`hl${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={l.color} stopOpacity={l.alpha} />
              <Stop offset="0.55" stopColor={l.color} stopOpacity={l.alpha * 0.35} />
              <Stop offset="1" stopColor={l.color} stopOpacity="0" />
            </RadialGradient>
          ))}
        </Defs>
        {L.map((l, i) => (
          // the viewBox is 100 wide and 100 tall stretched to the screen, so the light is an ellipse at the screen's aspect: that is fine, a hall light is not a circle either
          <Circle key={i} cx={l.x * 100} cy={l.y * 100} r={l.r * 100} fill={`url(#hl${i})`} />
        ))}
      </Svg>
    </View>
  );
}
