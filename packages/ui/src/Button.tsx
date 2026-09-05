/**
 * The button, with the site's press feel.
 *
 * `.btn-press`: a control answers before it is pressed. Hover (pointer
 * devices) lifts it 1px and deepens its cast; the press puts it down 2px,
 * harder than it came up — "what a real key feels like" — over 60ms, and
 * the RELEASE settles back on the site's one overshoot curve (220ms,
 * --ease-release). That spring is the only overshoot in the whole app.
 *
 * Variants (app/page.tsx, EmailCapture, StallPanel):
 *   primary    accent-strong fill, paper text
 *   secondary  1px ink hairline, ink text (on dark: paper/40 hairline, paper text)
 *   ghost      1px line hairline, muted text → ink on hover
 * Disabled is opacity .5 with no colour change; min touch height 44.
 */
import type { ReactNode } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { Body } from "./Text";
import { ease, ms, radius, shell } from "./tokens";

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

  const down = () => {
    y.value = withTiming(2, { duration: ms.press, easing: Easing.bezier(...ease.out) });
    dx.value = withTiming(3, { duration: ms.release, easing: Easing.bezier(...ease.release) });
  };
  const up = () => {
    y.value = withTiming(0, { duration: ms.release, easing: Easing.bezier(...ease.release) });
    dx.value = withTiming(0, { duration: ms.release, easing: Easing.bezier(...ease.release) });
  };
  const hoverIn = () => {
    y.value = withTiming(-1, { duration: ms.release, easing: Easing.bezier(...ease.release) });
    dx.value = withTiming(3, { duration: ms.release, easing: Easing.bezier(...ease.release) });
  };

  const pad = size === "sm" ? { paddingVertical: 6, paddingHorizontal: 12 } : size === "lg" ? { paddingVertical: 14, paddingHorizontal: 28 } : { paddingVertical: 12, paddingHorizontal: 24 };
  const look: ViewStyle =
    variant === "primary"
      ? { backgroundColor: shell.accent }
      : variant === "secondary"
        ? { borderWidth: 1, borderColor: onDark ? "rgba(237,240,244,0.4)" : shell.ink }
        : { borderWidth: 1, borderColor: onDark ? "rgba(237,240,244,0.25)" : shell.line };
  const textTone = variant === "primary" ? "paper" : onDark ? "paper" : variant === "ghost" ? "muted" : "ink";

  return (
    <Pressable
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
          { borderRadius: radius.md, minHeight: 44, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6 },
          pad,
          look,
          variant === "primary" && {
            shadowColor: "rgba(18,23,27,0.08)",
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 16,
            shadowOpacity: 1,
            elevation: 3,
          },
          press,
          style,
        ]}
      >
        <Body size="sm" medium tone={textTone as "paper" | "ink" | "muted"}>
          {children}
        </Body>
        {arrow && (
          <Animated.View style={lean}>
            <Body size="sm" medium tone={textTone as "paper" | "ink" | "muted"}>
              →
            </Body>
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

/** A row of buttons, the site's `flex flex-wrap gap-3`. */
export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center" }}>{children}</View>;
}
