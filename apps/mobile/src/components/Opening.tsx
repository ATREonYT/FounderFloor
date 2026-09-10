/**
 * THE OPENING — the one authored moment of motion in the building. The
 * hall's lights come up, a pane of glass breathes once with the mark on
 * it, the name settles under it, and the founder's keeper walks in from
 * the left and stops at the glass. Under 1.4 seconds, then the app. Under
 * Reduce Motion it is a cross-fade and a still keeper, 300 ms. Shown once
 * per launch, while the store hydrates; never on a warm return.
 */
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming, runOnJS } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Display, Ground, Plate, Spec, Sprite, SpriteCycle, alpha, radius, scheme, shell, type Look, type SpriteId } from "@founderfloor/ui";

const OUT = Easing.bezier(0.23, 1, 0.32, 1);

export function Opening({ look, onDone, minimum = 1300 }: { look: Look; onDone: () => void; /** How long the opening holds even when the store is already here. */ minimum?: number }) {
  const reduced = useReducedMotion();
  const lights = useSharedValue(0);
  const tile = useSharedValue(0);
  const name = useSharedValue(0);
  const walk = useSharedValue(0);
  const sweep = useSharedValue(0);
  const [walking, setWalking] = useState(!reduced);
  const dark = scheme() === "dark";

  useEffect(() => {
    if (reduced) {
      lights.value = withTiming(1, { duration: 200 });
      tile.value = withTiming(1, { duration: 200 });
      name.value = withTiming(1, { duration: 200 });
      walk.value = 1;
      const t = setTimeout(onDone, 320);
      return () => clearTimeout(t);
    }
    lights.value = withTiming(1, { duration: 700, easing: OUT });
    tile.value = withDelay(120, withTiming(1, { duration: 520, easing: OUT }));
    sweep.value = withDelay(380, withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }));
    name.value = withDelay(360, withTiming(1, { duration: 480, easing: OUT }));
    walk.value = withDelay(
      200,
      withTiming(1, { duration: 820, easing: Easing.inOut(Easing.quad) }, (finished) => {
        if (finished) runOnJS(setWalking)(false);
      }),
    );
    const t = setTimeout(onDone, minimum);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const groundStyle = useAnimatedStyle(() => ({ opacity: lights.value }));
  const tileStyle = useAnimatedStyle(() => ({ opacity: tile.value, transform: [{ scale: 0.86 + 0.14 * tile.value }, { translateY: (1 - tile.value) * 10 }] }));
  const sweepStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -120 + 260 * sweep.value }, { rotate: "18deg" }], opacity: sweep.value > 0 && sweep.value < 1 ? 1 : 0 }));
  const nameStyle = useAnimatedStyle(() => ({ opacity: name.value, transform: [{ translateY: (1 - name.value) * 8 }] }));
  const walkStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -160 + 160 * walk.value }] }));

  const ids = [0, 1, 2].map((k) => `avatar-outfit${look.outfit % 8}-right-${k}` as SpriteId);
  const standing = `avatar-outfit${look.outfit % 8}-down-0` as SpriteId;

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper, alignItems: "center", justifyContent: "center" }} accessibilityLabel="FounderFloor is opening" accessibilityRole="image">
      <Animated.View style={[{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }, groundStyle]}>
        <Ground />
      </Animated.View>
      <Animated.View style={[{ alignItems: "center", gap: 18 }, tileStyle]}>
        <Plate tone="glass" radius={radius.xxl} contentStyle={{ width: 112, height: 112 }}>
          <View style={{ width: 112, height: 112, alignItems: "center", justifyContent: "center" }}>
            <Sprite id="logo-mark" scale={3} />
            {/* the light sweeping across the glass, once */}
            <Animated.View pointerEvents="none" style={[{ position: "absolute", top: -40, left: 0, width: 60, height: 200 }, sweepStyle]}>
              <LinearGradient colors={["rgba(255,255,255,0)", dark ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.9)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
            </Animated.View>
          </View>
        </Plate>
        <Animated.View style={[{ alignItems: "center", gap: 4 }, nameStyle]}>
          <Display size="xl">FounderFloor</Display>
          <Spec tone="faint">The hall is opening</Spec>
        </Animated.View>
      </Animated.View>
      {/* the keeper walks in along the bottom and stops under the glass */}
      <View pointerEvents="none" style={{ position: "absolute", left: "50%", bottom: "26%", marginLeft: -20 }}>
        <Animated.View style={walkStyle}>
          <View style={{ position: "absolute", left: -6, right: -6, bottom: -3, height: 8, borderRadius: 999, backgroundColor: dark ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.14)" }} />
          {walking ? <SpriteCycle ids={ids} playing period={140} scale={2} /> : <Sprite id={standing} scale={2} />}
        </Animated.View>
        <View style={{ position: "absolute", left: -60, right: -60, bottom: -10, height: 1, backgroundColor: alpha.hairline() }} />
      </View>
    </View>
  );
}
