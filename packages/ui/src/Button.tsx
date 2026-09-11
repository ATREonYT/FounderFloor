/**
 * The button, the way the apps people already trust draw it: a rounded
 * rectangle (14 on the corners, never a pill), 48 high, bold white text
 * on the brand's red, a specular light across the top half so it reads
 * as lacquer, and a soft cast in its own colour. Secondary is a pane of
 * raised glass with ink text; ghost is red text and nothing else, the
 * "plain" style every iOS sheet uses for Cancel and Skip.
 *
 * Press feel: down 2px over 100ms the instant the finger lands, back up
 * on release with no bounce. Disabled is opacity .5 with no colour
 * change; heights 36 / 48 / 54, and the small one reaches 44 through its
 * slop. `block` stretches it to the row, the way a hero action sits.
 */
import type { ReactNode } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Body } from "./Text";
import { curve, ms, shell } from "./tokens";
import { alpha, scheme } from "./theme";

type Variant = "primary" | "secondary" | "ghost";

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
  /** Appends the → which leans 3px on hover/press. */
  arrow?: boolean;
  size?: "sm" | "md" | "lg";
  /** Stretch to the row: the one action a card is for. */
  block?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  testID?: string;
}) {
  const y = useSharedValue(0);
  const dx = useSharedValue(0);
  const press = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const lean = useAnimatedStyle(() => ({ transform: [{ translateX: dx.value }] }));
  const dark = scheme() === "dark";

  const down = () => {
    y.value = withTiming(2, { duration: ms.press, easing: Easing.bezier(...curve.out) });
  };
  const up = () => {
    y.value = withTiming(0, { duration: ms.release, easing: Easing.bezier(...curve.out) });
    dx.value = withTiming(0, { duration: ms.release, easing: Easing.bezier(...curve.out) });
  };
  const hoverIn = () => {
    y.value = withTiming(-1, { duration: ms.release, easing: Easing.bezier(...curve.out) });
    dx.value = withTiming(3, { duration: ms.release, easing: Easing.bezier(...curve.out) });
  };

  const geometry = size === "sm" ? { minHeight: 36, paddingHorizontal: 14, radius: 10 } : size === "lg" ? { minHeight: 54, paddingHorizontal: 24, radius: 16 } : { minHeight: 48, paddingHorizontal: 20, radius: 14 };
  const look: ViewStyle =
    variant === "primary"
      ? { backgroundColor: shell.accentFill }
      : variant === "secondary"
        ? { backgroundColor: onDark ? "rgba(244,246,248,0.14)" : alpha.raisedFill(), borderWidth: 1, borderColor: onDark ? "rgba(244,246,248,0.16)" : alpha.hairline() }
        : { backgroundColor: "transparent", paddingHorizontal: size === "sm" ? 8 : 12 };
  const color = variant === "primary" ? shell.onAccent : variant === "secondary" ? (onDark ? "#F4F6F8" : shell.ink) : onDark ? "rgba(244,246,248,0.8)" : shell.accent;
  const fontSize = size === "sm" ? 15 : 17;

  const label = (
    <Body size="sm" medium style={{ color, fontWeight: "600", fontSize, lineHeight: fontSize + 6 }}>
      {children}
    </Body>
  );

  return (
    <Pressable
      hitSlop={size === "sm" ? 4 : undefined}
      onPress={onPress}
      onPressIn={down}
      onPressOut={up}
      onHoverIn={hoverIn}
      onHoverOut={up}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      testID={testID}
      style={{ alignSelf: block ? "stretch" : "flex-start", opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View
        style={[
          { borderRadius: geometry.radius },
          variant === "primary" && {
            shadowColor: dark ? "rgba(224,91,76,0.45)" : "rgba(190,36,27,0.32)",
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 18,
            shadowOpacity: 1,
            elevation: 4,
          },
          press,
          style,
        ]}
      >
        <View style={[{ borderRadius: geometry.radius, overflow: "hidden", justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6, minHeight: geometry.minHeight, paddingHorizontal: geometry.paddingHorizontal }, look]}>
          {/* the specular: light across the top half, a hairline of light on the top edge, a little shade at the foot */}
          {variant === "primary" ? (
            <>
              <LinearGradient pointerEvents="none" colors={["rgba(255,255,255,0.30)", "rgba(255,255,255,0.10)", "rgba(255,255,255,0)", "rgba(0,0,0,0.10)"]} locations={[0, 0.45, 0.55, 1]} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
              <View pointerEvents="none" style={{ position: "absolute", left: 1, right: 1, top: 0, height: 1, backgroundColor: "rgba(255,255,255,0.45)" }} />
            </>
          ) : variant === "secondary" ? (
            <LinearGradient pointerEvents="none" colors={[dark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.9)", "rgba(255,255,255,0)"]} style={{ position: "absolute", left: 0, right: 0, top: 0, height: "55%" }} />
          ) : null}
          {label}
          {arrow && (
            <Animated.View style={lean}>
              <Body size="sm" medium style={{ color, fontWeight: "600", fontSize, lineHeight: fontSize + 6 }}>
                →
              </Body>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

/** A row of buttons, the site's `flex flex-wrap gap-3`. */
export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center" }}>{children}</View>;
}
