/**
 * The button: a key, not a sticker. Flat brand red, a hard 3px foot in
 * a deeper red under it, a one-pixel light along the top edge, white
 * text set in the display face. Pressing it pushes the key down onto
 * its foot (the foot vanishes, the face drops 3px) and it comes back up
 * on release with no bounce. No gradient, no glow, no arrow by default:
 * the things a generator reaches for. The retro is in the hard foot and
 * the crisp edge, the same physics as the pixel keepers' world.
 *
 *   primary    red key, white text
 *   secondary  a panel key: the card's fill with a hairline and a foot in the line colour, ink text
 *   ghost      red text and nothing else, the plain style for Cancel, Skip, Back
 * Disabled is opacity .5; heights 36 / 48 / 54, the small one reaches 44
 * through its slop. `block` stretches it to the row.
 */
import type { ReactNode } from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { curve, fontFamily, ms, shell } from "./tokens";
import { alpha, scheme } from "./theme";

type Variant = "primary" | "secondary" | "ghost";
const FOOT = 3;

function shade(hex: string, t: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 + t))));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

export function Button({
  children,
  onPress,
  variant = "primary",
  onDark = false,
  disabled = false,
  arrow = false,
  size = "md",
  block = false,
  style,
  accessibilityLabel,
  testID,
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: Variant;
  /** Sitting on an opaque dark ground: the secondary and ghost read in paper. */
  onDark?: boolean;
  disabled?: boolean;
  /** Appends a small → after the label. Off by default. */
  arrow?: boolean;
  size?: "sm" | "md" | "lg";
  /** Stretch to the row: the one action a card is for. */
  block?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  testID?: string;
}) {
  const y = useSharedValue(0);
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const dark = scheme() === "dark";
  const flat = variant === "ghost";
  const foot = flat ? 0 : FOOT;

  const down = () => {
    y.value = withTiming(foot, { duration: ms.press, easing: Easing.bezier(...curve.out) });
  };
  const up = () => {
    y.value = withTiming(0, { duration: ms.release, easing: Easing.bezier(...curve.out) });
  };

  const height = size === "sm" ? 36 : size === "lg" ? 54 : 48;
  const radius = size === "sm" ? 9 : 11;
  const padX = variant === "ghost" ? (size === "sm" ? 6 : 10) : size === "sm" ? 14 : size === "lg" ? 24 : 20;
  const fontSize = size === "sm" ? 15 : 17;

  const fill = variant === "primary" ? shell.accentFill : variant === "secondary" ? (onDark ? "rgba(244,246,248,0.14)" : dark ? "#262B31" : "#FFFFFF") : "transparent";
  const footColor = variant === "primary" ? shade(shell.accentFill, -0.34) : variant === "secondary" ? (onDark ? "rgba(244,246,248,0.22)" : dark ? "#0E1114" : "#CDD2D8") : "transparent";
  const color = variant === "primary" ? "#FFFFFF" : variant === "secondary" ? (onDark ? "#F4F6F8" : shell.ink) : onDark ? "rgba(244,246,248,0.85)" : shell.accent;
  const hairline = variant === "secondary" ? (onDark ? "rgba(244,246,248,0.16)" : alpha.hairline()) : "transparent";

  return (
    <Pressable
      hitSlop={size === "sm" ? 4 : undefined}
      onPress={onPress}
      onPressIn={down}
      onPressOut={up}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      testID={testID}
      style={[{ alignSelf: block ? "stretch" : "flex-start", opacity: disabled ? 0.5 : 1 }, style]}
    >
      {/* the foot: the key's own colour, deeper, that the face sits on */}
      <View style={{ borderRadius: radius, backgroundColor: footColor, paddingBottom: foot }}>
        <Animated.View style={[{ borderRadius: radius, backgroundColor: fill, borderWidth: variant === "secondary" ? 1 : 0, borderColor: hairline, minHeight: height, paddingHorizontal: padX, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6, overflow: "hidden" }, face]}>
          {variant === "primary" ? <View pointerEvents="none" style={{ position: "absolute", left: 2, right: 2, top: 0, height: 1, backgroundColor: "rgba(255,255,255,0.28)" }} /> : null}
          <Text style={{ fontFamily: fontFamily.display, fontWeight: "600", fontSize, lineHeight: fontSize + 6, color, letterSpacing: -0.1 }}>
            {children}
            {arrow ? "  →" : ""}
          </Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

/** A row of buttons, the site's `flex flex-wrap gap-3`. */
export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center" }}>{children}</View>;
}
