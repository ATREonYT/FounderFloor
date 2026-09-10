/**
 * The sheen: a soft light falling on the top of a surface, the way glass
 * and lacquer catch it. An SVG gradient laid over the parent (which must
 * clip to its radius), from a little white at the top to nothing past
 * the middle. Pointer events pass through. Used on the primary button,
 * the tab bar's disc, glossy plates and the accent card on Today; never
 * on text, never on the keepers. In the dark scheme it is a third as strong.
 */
import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { scheme } from "./theme";

let seq = 0;

export function Sheen({ strength = 0.22, reach = 0.55, tint = "255,255,255" }: { /** Opacity at the top edge. */ strength?: number; /** How far down the light reaches, 0 to 1. */ reach?: number; /** The light's colour, as r,g,b. */ tint?: string }) {
  const id = `sheen${(seq++).toString(36)}`;
  // in the dark a light this strong reads as fog; a third of it is a glint
  if (scheme() === "dark") strength *= 0.35;
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={`rgb(${tint})`} stopOpacity={strength} />
          <Stop offset={String(reach)} stopColor={`rgb(${tint})`} stopOpacity={strength * 0.35} />
          <Stop offset="1" stopColor={`rgb(${tint})`} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill={`url(#${id})`} />
    </Svg>
  );
}
