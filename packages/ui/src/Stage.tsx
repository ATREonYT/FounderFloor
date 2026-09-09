/**
 * THE STAGE — the companion. A keeper standing at a counter, on a card at
 * the top of a screen, who talks in the floor's typed dialogue and reacts
 * to what the founder just did. This is the one place the app is allowed
 * to be warm: the card wears the keeper's awning colour as a wash, the
 * floor is the hall's carpet, and the figure is the same 20×28 sprite that
 * walks the floor, at 3×.
 *
 * Moods, each tied to a real event and nothing else:
 *   idle   the 2px breathing bob the floor uses
 *   talk   mouth frames alternate while a reply streams
 *   nod    two quick dips: something was saved
 *   cheer  a jump, six pixel sparks, a heart that floats up: a room done,
 *          a week logged, a first customer
 *   rest   still, eyes down: a rest day, never a sick face
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, withSpring, useReducedMotion } from "react-native-reanimated";
import { Sprite, type SpriteId } from "./Sprite";
import { SpriteCycle } from "./SpriteCycle";
import { Sparks } from "./Sparks";
import { Backdrop, Furniture, SCENE_SETS, type SceneSet } from "./Scene";
import { Body, Spec } from "./Text";
import { art, shell } from "./tokens";
import type { Look } from "./Keeper";

export type Mood = "idle" | "talk" | "nod" | "cheer" | "rest";

/** A hex colour at an alpha, for the wash. */
export function wash(hex: string, a: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function Stage({
  look,
  color = shell.accent,
  say,
  who,
  mood = "idle",
  scale = 3,
  height = 200,
  onPress,
  children,
  radiusPx = 28,
  set = "lobby",
  ambient = true,
}: {
  look: Look;
  /** The keeper's awning colour: the wash, the bubble tail, the sparks' partner. */
  color?: string;
  /** What the keeper says, typed out. Change it and it retypes. */
  say?: string;
  who?: string;
  mood?: Mood;
  scale?: 2 | 3;
  height?: number;
  onPress?: () => void;
  /** Anything to stand on the counter (a ticket chip, a streak). */
  children?: ReactNode;
  radiusPx?: number;
  /** The vignette behind the keeper: which hall, which props, who walks past. */
  set?: SceneSet;
  ambient?: boolean;
}) {
  const [width, setWidth] = useState(360);
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  const jump = useSharedValue(0);
  const [burst, setBurst] = useState(0);
  const [heart, setHeart] = useState(0);
  const [typed, setTyped] = useState("");
  const typer = useRef<ReturnType<typeof setInterval> | null>(null);

  // breathing, talking, resting
  useEffect(() => {
    cancelAnimation(y);
    if (reduced || mood === "rest") {
      y.value = withTiming(0, { duration: 120 });
      return;
    }
    y.value = withRepeat(withSequence(withTiming(-2, { duration: mood === "talk" ? 200 : 800, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: mood === "talk" ? 200 : 800, easing: Easing.inOut(Easing.quad) })), -1, false);
  }, [mood, reduced, y]);
  // reactions
  useEffect(() => {
    if (reduced) return;
    if (mood === "nod") jump.value = withSequence(withTiming(3, { duration: 90 }), withTiming(0, { duration: 90 }), withTiming(3, { duration: 90 }), withTiming(0, { duration: 120 }));
    if (mood === "cheer") {
      jump.value = withSequence(withTiming(-12, { duration: 140, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 9, stiffness: 240 }));
      setBurst((b) => b + 1);
      setHeart((h) => h + 1);
    }
  }, [mood, reduced, jump]);
  // the typed line
  useEffect(() => {
    if (typer.current) clearInterval(typer.current);
    if (!say) {
      setTyped("");
      return;
    }
    if (reduced) {
      setTyped(say);
      return;
    }
    let i = 0;
    setTyped("");
    typer.current = setInterval(() => {
      i = Math.min(say.length, i + 1);
      setTyped(say.slice(0, i));
      if (i >= say.length && typer.current) clearInterval(typer.current);
    }, 18);
    return () => {
      if (typer.current) clearInterval(typer.current);
    };
  }, [say, reduced]);

  const body = useAnimatedStyle(() => ({ transform: [{ translateY: y.value + jump.value }] }));
  const ids = [0, 1].map((k) => `avatar-outfit${look.outfit % 8}-down-${k}` as SpriteId);
  // a short stage has no counter: the keeper stands on the floor, so the head is never clipped
  const withCounter = height >= 170;
  const counterW = 128 * scale, counterH = withCounter ? 34 * scale : 0;
  const keeperW = 20 * scale, keeperH = 28 * scale;
  const floorH = Math.round(height * 0.3);
  // keeper stands right of centre so the bubble on the left never covers the face
  const keeperX = Math.round(counterW * 0.8) - keeperW / 2;
  const done = typed.length >= (say?.length ?? 0);

  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? "button" : undefined} accessibilityLabel={who ? `${who}: ${say ?? ""}` : say}>
      <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))} style={{ height, borderRadius: radiusPx, overflow: "hidden", backgroundColor: wash(color, scheme() === "dark" ? 0.22 : 0.16), position: "relative" }}>
        {/* the wall, the floor, and the hall behind the counter */}
        <Backdrop hall={SCENE_SETS[set].hall} floorH={floorH} scale={scale} width={width} />
        <Furniture set={set} width={width} floorH={floorH} scale={scale} ambient={false} only="props" edges />
        {/* the counter, and the keeper behind it */}
        <View style={{ position: "absolute", left: "50%", bottom: withCounter ? floorH - 10 * scale : floorH - 6, marginLeft: -counterW / 2, width: counterW, height: counterH + keeperH, alignItems: "center" }}>
          <Animated.View style={[{ position: "absolute", bottom: withCounter ? counterH - 2 : 0, left: keeperX }, body]}>
            <SpriteCycle ids={ids} playing={mood === "talk" && !reduced} period={260} scale={scale} />
            <View style={{ position: "absolute", left: keeperW / 2, top: keeperH / 2 }}>
              <Sparks burst={burst} reach={26 + 4 * scale} />
            </View>
          </Animated.View>
          {withCounter ? (
            <View style={{ position: "absolute", bottom: 0 }}>
              <Sprite id="counter" scale={scale} />
            </View>
          ) : null}
          {heart ? <Heart key={heart} x={keeperX + keeperW + 4} y={counterH + keeperH - 12} /> : null}
        </View>
        {/* people walk past in front of the counter, where they can be seen */}
        <Furniture set={set} width={width} floorH={floorH} scale={scale} ambient={ambient} only="walkers" />
        {/* the bubble */}
        {say ? (
          <View style={{ position: "absolute", left: 14, top: 14, right: 14 }}>
            <View style={{ alignSelf: "flex-start", maxWidth: "60%", backgroundColor: scheme() === "dark" ? shell.panel : art.bubblePaper, borderWidth: 2, borderColor: shell.ink, borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 12, paddingVertical: 8 }}>
              {who ? (
                <Spec tone="muted" style={{ marginBottom: 2 }}>
                  {who}
                </Spec>
              ) : null}
              <Body size="sm">
                {typed}
                {!done ? <Body size="sm" tone="accent">▍</Body> : null}
              </Body>
            </View>
          </View>
        ) : null}
        {children ? <View style={{ position: "absolute", right: 14, bottom: 12 }}>{children}</View> : null}
      </View>
    </Pressable>
  );
}

function Heart({ x, y }: { x: number; y: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [t]);
  const s = useAnimatedStyle(() => ({ opacity: 1 - t.value * t.value, transform: [{ translateY: -36 * t.value }, { scale: 0.8 + 0.4 * t.value }] }));
  return (
    <Animated.View style={[{ position: "absolute", left: x, bottom: y }, s]}>
      <Sprite id="emote-heart" scale={2} />
    </Animated.View>
  );
}

import { scheme } from "./theme";
