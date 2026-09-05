/**
 * A person from the hall, as the app's "avatar": the pixel sprite, at an
 * integer scale, in a rounded well. Where an assistant app draws an orb or
 * a logo beside its replies, the desk here has a keeper standing at it —
 * the same 20×28 figure that walks the floor. `speaking` gives it the
 * 2px idle bob the floor uses when a keeper talks; nothing else moves.
 */
import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, cancelAnimation } from "react-native-reanimated";
import { Sprite, type SpriteId } from "./Sprite";
import { Booth } from "./Booth";
import { radius, shell } from "./tokens";

export type Look = { skin: number; outfit: number; hair: number };

export function Keeper({ look, scale = 2, speaking = false, framed = true, color }: { look: Look; scale?: 1 | 2 | 3; speaking?: boolean; framed?: boolean; color?: string }) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (speaking) {
      y.value = withRepeat(withSequence(withTiming(-2, { duration: 260, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 260, easing: Easing.inOut(Easing.quad) })), -1, false);
    } else {
      cancelAnimation(y);
      y.value = withTiming(0, { duration: 120 });
    }
  }, [speaking, y]);
  const bob = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const id = `avatar-outfit${look.outfit % 8}-down-0` as SpriteId;
  const w = 20 * scale;
  const h = 28 * scale;
  const body = (
    <Animated.View style={bob}>
      <Sprite id={id} scale={scale} />
    </Animated.View>
  );
  if (!framed) return body;
  return (
    <View
      style={{
        width: w + 8 * scale,
        height: h + 4 * scale,
        borderRadius: radius.md,
        backgroundColor: color ? color : shell.well,
        alignItems: "center",
        justifyContent: "flex-end",
        overflow: "hidden",
      }}
    >
      {body}
    </View>
  );
}

/** A keeper behind a counter — the reception desk itself. */
export function Desk({ look, scale = 2, speaking = false }: { look: Look; scale?: 1 | 2 | 3; speaking?: boolean }) {
  return (
    <View accessibilityRole="image" accessibilityLabel="The reception desk">
      <Booth swatch={0} look={look} scale={scale} parts={["counter", "founder"]} frame={speaking ? 1 : 0} />
    </View>
  );
}
