/**
 * The button, with the site's press feel.
 *
 * A control answers before it is pressed: hover (pointer devices) lifts
 * it 1px, the press puts it down 2px over 100ms, the release settles back
 * with no bounce. A button is pressed all day.
 *
 * Shape: a pill, every size, on glass.
 *   primary    ember, lit from the top, ink text (never white on ember)
 *   secondary  raised glass, ink text
 *   ghost      no fill, muted text
 * Disabled is opacity .5 with no colour change; heights 36 / 44 / 52, and
 * the small one reaches 44 through its slop.
 */
import type { ReactNode } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Body } from "./Text";
import { curve, ms, radius, shell } from "./tokens";
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

  const pad = size === "sm" ? { minHeight: 36, paddingHorizontal: 14 } : size === "lg" ? { minHeight: 52, paddingHorizontal: 28 } : { minHeight: 44, paddingHorizontal: 20 };
  const look: ViewStyle =
    variant === "primary"
      ? { backgroundColor: shell.accentFill }
      : variant === "secondary"
        ? { backgroundColor: onDark ? "rgba(244,246,248,0.14)" : alpha.raisedFill(), borderWidth: 1, borderColor: onDark ? "rgba(244,246,248,0.16)" : alpha.hairline() }
        : { backgroundColor: "transparent", paddingHorizontal: size === "sm" ? 8 : 12 };
  const textTone: "onAccent" | "paper" | "paperQuiet" | "ink" | "muted" = variant === "primary" ? "onAccent" : onDark ? (variant === "ghost" ? "paperQuiet" : "paper") : variant === "ghost" ? "muted" : "ink";
  const textColor = textTone === "onAccent" ? shell.onAccent : undefined;

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
      style={{ alignSelf: "flex-start", opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View
        style={[
          { borderRadius: radius.full },
          variant === "primary" && {
            shadowColor: dark ? "rgba(255,107,61,0.45)" : "rgba(242,97,63,0.35)",
            shadowOffset: { width: 0, height: 10 },
            shadowRadius: 20,
            shadowOpacity: 1,
            elevation: 4,
          },
          press,
          style,
        ]}
      >
        <View style={[{ borderRadius: radius.full, overflow: "hidden", justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6 }, pad, look]}>
          {/* the light on the top half: lacquer, not plastic */}
          {variant === "primary" ? (
            <LinearGradient pointerEvents="none" colors={["rgba(255,255,255,0.38)", "rgba(255,255,255,0.06)", "rgba(0,0,0,0.06)"]} locations={[0, 0.55, 1]} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
          ) : variant === "secondary" ? (
            <LinearGradient pointerEvents="none" colors={[dark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.9)", "rgba(255,255,255,0)"]} style={{ position: "absolute", left: 0, right: 0, top: 0, height: "55%" }} />
          ) : null}
          <Body size="sm" medium tone={textTone === "onAccent" ? "ink" : textTone} style={textColor ? { color: textColor, fontWeight: "600" } : { fontWeight: "600" }}>
            {children}
          </Body>
          {arrow && (
            <Animated.View style={lean}>
              <Body size="sm" medium tone={textTone === "onAccent" ? "ink" : textTone} style={textColor ? { color: textColor, fontWeight: "600" } : { fontWeight: "600" }}>
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
