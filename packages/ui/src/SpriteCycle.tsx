/**
 * A sprite that cycles through its frames on the UI thread. Every frame is
 * drawn once and stacked; a shared value counts through them and each
 * frame's opacity is 1 only on its turn. React renders this component
 * once and never again while it plays, so a hall full of walkers costs
 * the JS thread nothing. `playing` false holds the first frame.
 */
import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, type SharedValue } from "react-native-reanimated";
import { Sprite, spriteMeta, type SpriteId } from "./Sprite";

export function SpriteCycle({ ids, playing, period = 150, scale = 2 }: { ids: SpriteId[]; playing: boolean; /** Milliseconds per frame. */ period?: number; scale?: 1 | 2 | 3 }) {
  const reduced = useReducedMotion();
  const n = ids.length;
  const f = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(f);
    if (!playing || reduced || n < 2) {
      f.value = 0;
      return;
    }
    f.value = 0;
    f.value = withRepeat(withTiming(n, { duration: n * period, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(f);
  }, [playing, reduced, n, period, f]);
  const m = spriteMeta(ids[0]);
  return (
    <View style={{ width: m.w * scale, height: m.h * scale }}>
      {ids.map((id, i) => (
        <Frame key={`${id}-${i}`} id={id} i={i} n={n} f={f} scale={scale} />
      ))}
    </View>
  );
}

function Frame({ id, i, n, f, scale }: { id: SpriteId; i: number; n: number; f: SharedValue<number>; scale: 1 | 2 | 3 }) {
  const style = useAnimatedStyle(() => ({ opacity: Math.floor(f.value) % n === i ? 1 : 0 }));
  return (
    <Animated.View style={[{ position: "absolute", left: 0, top: 0 }, style]}>
      <Sprite id={id} scale={scale} />
    </Animated.View>
  );
}
