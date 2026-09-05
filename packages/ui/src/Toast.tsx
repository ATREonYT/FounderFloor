/**
 * The toast — `glass anim-pop px-4 py-2 text-sm shadow-float`, fixed at the
 * top-centre, popping in over 300ms on the site's spring. Copy is a
 * complete sentence in the venue's voice with no exclamation mark:
 * "Stand updated — the whole floor sees it."
 */
import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Plate } from "./Plate";
import { Body } from "./Text";
import { useLayout } from "./Responsive";
import { ease, ms, radius } from "./tokens";

export function Toast({ text, visible }: { text: string; visible: boolean }) {
  const L = useLayout();
  const t = useSharedValue(0);
  useEffect(() => {
    const bz = visible ? ease.spring : ease.out;
    t.value = withTiming(visible ? 1 : 0, { duration: visible ? ms.toast : 200, easing: Easing.bezier(bz[0], bz[1], bz[2], bz[3]) });
  }, [visible, t]);
  const style = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scale: 0.92 + 0.08 * t.value }] }));
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: L.insets.top + (L.compact ? 96 : 72), alignItems: "center" }}>
      <Animated.View style={style} accessibilityLiveRegion="polite" accessibilityRole="alert">
        <Plate tone="glass" radius={radius.md}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <Body size="sm">{text}</Body>
          </View>
        </Plate>
      </Animated.View>
    </View>
  );
}
