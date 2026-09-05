/**
 * The meter — RankMeter's `.meter-fill`, as a pixel bar.
 *
 * A hairline track on the well colour, a fill that steps in whole units
 * (4px) so it reads as built rather than poured, the label in mono with
 * tabular figures. Fills over the site's reveal timing when it first
 * appears; instant under reduced motion.
 */
import { useEffect } from "react";
import { AccessibilityInfo, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Spec } from "./Text";
import { ease, ms, radius, shell, u } from "./tokens";

export function Progress({
  value,
  label,
  right,
  color = shell.ink,
  height = 8,
}: {
  /** 0..1 */
  value: number;
  label?: string;
  right?: string;
  color?: string;
  height?: number;
}) {
  const v = Math.max(0, Math.min(1, value));
  const w = useSharedValue(0);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!alive) return;
      w.value = reduce ? v : withTiming(v, { duration: ms.reveal, easing: Easing.bezier(...ease.out) });
    });
    return () => {
      alive = false;
    };
  }, [v, w]);
  const fill = useAnimatedStyle(() => ({ width: `${Math.round((w.value * 100) / 2.5) * 2.5}%` }));
  return (
    <View style={{ gap: 6 }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}>
      {label || right ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {label ? <Spec tone="muted">{label}</Spec> : <View />}
          {right ? <Spec tone="ink">{right}</Spec> : null}
        </View>
      ) : null}
      <View style={{ height, backgroundColor: shell.well, borderRadius: radius.sm, overflow: "hidden", borderWidth: 1, borderColor: shell.line }}>
        <Animated.View style={[{ height: "100%", backgroundColor: color, minWidth: v > 0 ? u : 0 }, fill]} />
      </View>
    </View>
  );
}
