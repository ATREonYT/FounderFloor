/**
 * THE TAP — the press feel, for anything that is not a button.
 *
 * `.btn-press` is the button's; a card, a chip, a booth tile has no key
 * to put down, so it shrinks to `scale` the instant the finger lands
 * (100ms, strong ease-out) and settles back on release (140ms, the same
 * curve, no bounce). No overshoot: a card is tapped dozens of times a
 * day, and bounce belongs to things that were thrown. No haptic by
 * default either; a haptic on every card trains the hand to ignore the
 * ones that matter, so screens fire `haptic()` themselves at the moment
 * that earns it (a step ticked, a task finished, a sheet snapping home).
 *
 * Web has no motor; every haptic is a no-op there and never throws.
 * Reduced motion drops the scale.
 */
import type { ReactNode } from "react";
import { Platform, Pressable, type AccessibilityRole, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { curve, ms } from "./tokens";

export type HapticKind = "light" | "medium" | "success" | "warning" | "error";

/** Fire one haptic. Silent on web and on any device that refuses. */
export async function haptic(kind: HapticKind): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    switch (kind) {
      case "light":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "success":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "warning":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "error":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    // no motor, or the platform said no — the press still happened.
  }
}

export function Tap({
  children,
  onPress,
  haptic: kind = "none",
  scale = 0.97,
  disabled,
  style,
  accessibilityLabel,
  accessibilityRole = "button",
}: {
  children: ReactNode;
  onPress?: () => void;
  haptic?: HapticKind | "none";
  /** How far the card shrinks under the finger. */
  scale?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
}) {
  const reduced = useReducedMotion();
  const s = useSharedValue(1);
  const breathe = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));

  const down = () => {
    if (reduced) return;
    s.value = withTiming(scale, { duration: ms.press, easing: Easing.bezier(...curve.out) });
  };
  const up = () => {
    if (reduced) return;
    s.value = withTiming(1, { duration: ms.release, easing: Easing.bezier(...curve.out) });
  };
  const press = () => {
    if (kind !== "none") void haptic(kind);
    onPress?.();
  };

  return (
    <Pressable
      onPress={press}
      onPressIn={down}
      onPressOut={up}
      pressRetentionOffset={16}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Animated.View style={[{ opacity: disabled ? 0.5 : 1 }, breathe, style]}>{children}</Animated.View>
    </Pressable>
  );
}
