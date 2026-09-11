/**
 * The tick, with its arrival. A check pictogram that is simply there
 * when the page opens, and that lands when the founder ticks something
 * while looking: from a little larger and invisible to its place, on a
 * spring that settles without a bounce, 220 ms. Nothing in the real world
 * appears from nothing, and a tick the founder did not just make should
 * not move. Under Reduce Motion it is there or it is not.
 */
import { useEffect, useRef } from "react";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { PixelIcon } from "./PixelIcon";

export function Check({ on, size = 16, color = "#F4F6F8" }: { on: boolean; size?: number; color?: string }) {
  const reduced = useReducedMotion();
  const first = useRef(true);
  const s = useSharedValue(on ? 1 : 0);
  const o = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) {
      s.value = on ? 1 : 0;
      o.value = on ? 1 : 0;
      return;
    }
    if (on) {
      s.value = 1.45;
      o.value = 0;
      s.value = withSpring(1, { damping: 18, stiffness: 320, mass: 0.7 });
      o.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) });
    } else {
      s.value = withTiming(0.6, { duration: 140, easing: Easing.bezier(0.23, 1, 0.32, 1) });
      o.value = withTiming(0, { duration: 140 });
    }
  }, [on, reduced, s, o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={[{ width: size, height: size }, a]} pointerEvents="none">
      <PixelIcon id="check" color={color} size={size} flat />
    </Animated.View>
  );
}

/** The stamp: the red seal a done stop gets, which lands like a real one, from above, on a spring, a little askew. */
export function Stamp({ on, size = 26 }: { on: boolean; size?: number }) {
  const reduced = useReducedMotion();
  const first = useRef(true);
  const s = useSharedValue(on ? 1 : 0);
  const o = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) {
      s.value = on ? 1 : 0;
      o.value = on ? 1 : 0;
      return;
    }
    if (on) {
      s.value = 1.7;
      o.value = 0;
      s.value = withSpring(1, { damping: 20, stiffness: 380, mass: 0.8 });
      o.value = withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) });
    } else {
      s.value = withTiming(0.7, { duration: 140 });
      o.value = withTiming(0, { duration: 140 });
    }
  }, [on, reduced, s, o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }, { rotate: "-7deg" }] }));
  return (
    <Animated.View style={[{ width: size, height: size }, a]} pointerEvents="none">
      <PixelIcon id="stamp" color="#BE241B" size={size} />
    </Animated.View>
  );
}
