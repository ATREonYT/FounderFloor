/**
 * Pixel sparks — six ink-and-accent squares thrown out from a point and
 * gone in 600ms. The hall's version of confetti: whole pixels on the unit
 * grid, no gradients, no particles that outlive the moment. `burst` is a
 * counter; every increment throws once. Renders nothing between bursts.
 */
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, useReducedMotion } from "react-native-reanimated";
import { shell, u } from "./tokens";

const DIRS = [
  [-1, -1.2],
  [1, -1.1],
  [-1.3, -0.2],
  [1.3, -0.3],
  [-0.6, 0.9],
  [0.7, 0.8],
] as const;

function Spark({ dx, dy, color, size, key_ }: { dx: number; dy: number; color: string; size: number; key_: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = 0;
    t.value = withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) });
  }, [key_, t]);
  const s = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ translateX: dx * t.value }, { translateY: dy * t.value + 10 * t.value * t.value }, { scale: 1 - 0.5 * t.value }],
  }));
  return <Animated.View style={[{ position: "absolute", width: size, height: size, backgroundColor: color }, s]} />;
}

export function Sparks({ burst, size = u, reach = 28 }: { burst: number; size?: number; reach?: number }) {
  const reduced = useReducedMotion();
  const [live, setLive] = useState(0);
  useEffect(() => {
    if (!burst || reduced) return;
    setLive(burst);
    const t = setTimeout(() => setLive(0), 700);
    return () => clearTimeout(t);
  }, [burst, reduced]);
  if (!live) return null;
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0 }}>
      {DIRS.map(([x, y], i) => (
        <Spark key={`${live}-${i}`} key_={live} dx={x * reach} dy={y * reach} color={i % 2 ? shell.ink : shell.accent} size={size} />
      ))}
    </View>
  );
}
