/**
 * THE TAP — the press feel, for anything that is not a button.
 *
 * `.btn-press` is the button's; a card, a chip, a booth tile has no key
 * to put down, so it breathes instead: the whole thing shrinks to `scale`
 * over the press tick (60ms) and springs back on release. That spring is
 * loose on purpose — a card should feel picked up, not clicked. A haptic
 * fires on the press itself so the finger hears it before the eye does.
 *
 * `haptic()` is exported on its own so a screen can tick on a state change
 * (a toast landing, a sale ringing) without wrapping anything in a Tap.
 * Web has no motor; every haptic is a no-op there and never throws.
 * Reduced motion keeps the haptic and drops the scale.
 */
import type { ReactNode } from "react";
import { Platform, Pressable, type AccessibilityRole, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ease, ms } from "./tokens";

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
  haptic: kind = "light",
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
    s.value = withTiming(scale, { duration: ms.press, easing: Easing.bezier(...ease.out) });
  };
  const up = () => {
    if (reduced) return;
    s.value = withSpring(1, { damping: 12, stiffness: 260 });
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
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Animated.View style={[{ opacity: disabled ? 0.5 : 1 }, breathe, style]}>{children}</Animated.View>
    </Pressable>
  );
}
