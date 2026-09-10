/**
 * The button, with the site's press feel.
 *
 * `.btn-press`: a control answers before it is pressed. Hover (pointer
 * devices) lifts it 1px and deepens its cast; the press puts it down 2px,
 * harder than it came up — "what a real key feels like" — over 60ms, and
 * the RELEASE settles back on the site's one overshoot curve (220ms,
 * --ease-release). That spring is the only overshoot in the whole app.
 *
 * Shape: a pill, every size. The app's controls are soft fills, not
 * hairline boxes: the box was the site's marketing idiom and read as
 * blocky next to the pixel keepers.
 *   primary    accent fill, paper text
 *   secondary  well fill (laminate), ink text (on dark: paper/12 fill, paper text)
 *   ghost      no fill, muted text; on dark, paper/70
 * Disabled is opacity .5 with no colour change; heights 36 / 44 / 52.
 */
import type { ReactNode } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { Body } from "./Text";
import { Sheen } from "./Sheen";
import { curve, ms, radius, shell } from "./tokens";

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
  /** Sitting on a blackout/ink ground — flips the hairline tones. */
  onDark?: boolean;
  disabled?: boolean;
  /** Appends the site's → which leans 3px on hover/press. */
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

  // the key goes down the instant the finger lands and comes back up on release, no bounce: a button is pressed all day
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
        ? { backgroundColor: onDark ? "rgba(237,240,244,0.12)" : shell.well }
        : { backgroundColor: "transparent", paddingHorizontal: size === "sm" ? 8 : 12 };
  const textTone = variant === "primary" ? "paper" : onDark ? (variant === "ghost" ? "paperQuiet" : "paper") : variant === "ghost" ? "muted" : "ink";

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
            shadowColor: "rgba(190,36,27,0.4)",
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 16,
            shadowOpacity: 1,
            elevation: 4,
          },
          press,
          style,
        ]}
      >
        <View style={[{ borderRadius: radius.full, overflow: "hidden", justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6 }, pad, look]}>
          {/* the light on the top half: lacquer, not plastic */}
          {variant === "primary" ? <Sheen strength={0.26} reach={0.5} /> : variant === "secondary" && !onDark ? <Sheen strength={0.5} reach={0.5} /> : null}
          <Body size="sm" medium tone={textTone as "paper" | "paperQuiet" | "ink" | "muted"}>
            {children}
          </Body>
          {arrow && (
            <Animated.View style={lean}>
              <Body size="sm" medium tone={textTone as "paper" | "paperQuiet" | "ink" | "muted"}>
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
