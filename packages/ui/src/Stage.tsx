/**
 * THE STAGE — the companion. A keeper standing on a pane of glass at the
 * top of a screen, in a soft glow of their own colour, who talks in a
 * clean bubble and reacts to what the founder just did. The figure is the
 * same 20×28 sprite that walks the floor, at 3×; everything around it is
 * the night hall's glass, not the tiled floor.
 *
 * Moods, each tied to a real event and nothing else:
 *   idle   the 2px breathing bob
 *   talk   mouth frames alternate while a reply streams
 *   nod    two quick dips: something was saved
 *   cheer  a jump, six sparks, a heart that floats up
 *   rest   still: a rest day, never a sick face
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, withSpring, useReducedMotion } from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { Sprite, type SpriteId } from "./Sprite";
import { SpriteCycle } from "./SpriteCycle";
import { Sparks } from "./Sparks";
import { Plate } from "./Plate";
import { Body, Spec } from "./Text";
import { shell } from "./tokens";
import { alpha, scheme } from "./theme";
import type { SceneSet } from "./Scene";
import type { Look } from "./Keeper";

export type Mood = "idle" | "talk" | "nod" | "cheer" | "rest";

/** A hex colour at an alpha, for the wash. */
export function wash(hex: string, a: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** A soft light in a colour, for the glass behind a keeper or a room. */
export function Glow({ color, x = 0.5, y = 0.9, r = 0.7, strength }: { color: string; x?: number; y?: number; r?: number; strength?: number }) {
  const dark = scheme() === "dark";
  const a = strength ?? (dark ? 0.55 : 0.4);
  const id = `glow${color.replace("#", "")}${Math.round(x * 100)}${Math.round(y * 100)}`;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={a} />
            <Stop offset="0.6" stopColor={color} stopOpacity={a * 0.3} />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={x * 100} cy={y * 100} r={r * 100} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
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
  radiusPx = 30,
}: {
  look: Look;
  /** The keeper's colour: the glow, the sparks' partner. */
  color?: string;
  /** What the keeper says, typed out. Change it and it retypes. */
  say?: string;
  who?: string;
  mood?: Mood;
  scale?: 2 | 3;
  height?: number;
  onPress?: () => void;
  /** Anything to stand on the glass (a ticket chip, a streak). */
  children?: ReactNode;
  radiusPx?: number;
  /** Kept for the screens that pass them; the night hall has no tiled sets. */
  set?: SceneSet;
  ambient?: boolean;
}) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  const jump = useSharedValue(0);
  const [burst, setBurst] = useState(0);
  const [heart, setHeart] = useState(0);
  const [typed, setTyped] = useState("");
  const typer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    cancelAnimation(y);
    if (reduced || mood === "rest") {
      y.value = withTiming(0, { duration: 120 });
      return;
    }
    y.value = withRepeat(withSequence(withTiming(-2, { duration: mood === "talk" ? 200 : 800, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: mood === "talk" ? 200 : 800, easing: Easing.inOut(Easing.quad) })), -1, false);
  }, [mood, reduced, y]);
  useEffect(() => {
    if (reduced) return;
    if (mood === "nod") jump.value = withSequence(withTiming(3, { duration: 90 }), withTiming(0, { duration: 90 }), withTiming(3, { duration: 90 }), withTiming(0, { duration: 120 }));
    if (mood === "cheer") {
      jump.value = withSequence(withTiming(-12, { duration: 140, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 9, stiffness: 240 }));
      setBurst((b) => b + 1);
      setHeart((h) => h + 1);
    }
  }, [mood, reduced, jump]);
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
    }, 16);
    return () => {
      if (typer.current) clearInterval(typer.current);
    };
  }, [say, reduced]);

  const body = useAnimatedStyle(() => ({ transform: [{ translateY: y.value + jump.value }] }));
  const ids = [0, 1].map((k) => `avatar-outfit${look.outfit % 8}-down-${k}` as SpriteId);
  const keeperW = 20 * scale, keeperH = 28 * scale;
  const done = typed.length >= (say?.length ?? 0);
  const dark = scheme() === "dark";
  const pad = 16;

  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? "button" : undefined} accessibilityLabel={who ? `${who}: ${say ?? ""}` : say}>
      <Plate tone="panel" radius={radiusPx} contentStyle={{ height }}>
        <View style={{ height }}>
        <Glow color={color} x={0.78} y={0.95} r={0.75} />
        {/* the floor line the keeper stands on: a hairline of light */}
        <View pointerEvents="none" style={{ position: "absolute", left: pad, right: pad, bottom: pad + 6, height: 1, backgroundColor: alpha.hairline() }} />
        {/* the keeper, standing to the right */}
        <View style={{ position: "absolute", right: pad + 18 + (children ? 0 : 0), bottom: pad + 7, width: keeperW, height: keeperH }}>
          <View pointerEvents="none" style={{ position: "absolute", left: -8, right: -8, bottom: -4, height: 10, borderRadius: 999, backgroundColor: dark ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.14)" }} />
          <Animated.View style={body}>
            <SpriteCycle ids={ids} playing={mood === "talk" && !reduced} period={260} scale={scale} />
            <View style={{ position: "absolute", left: keeperW / 2, top: keeperH / 2 }}>
              <Sparks burst={burst} reach={26 + 4 * scale} />
            </View>
          </Animated.View>
          {heart ? <Heart key={heart} x={keeperW + 2} y={keeperH - 8} /> : null}
        </View>
        {/* the bubble: what they say, on raised glass */}
        {say ? (
          <View style={{ position: "absolute", left: pad, top: pad, right: pad + keeperW + 44 }}>
            <View style={{ alignSelf: "flex-start", maxWidth: "100%", backgroundColor: alpha.raisedFill(), borderWidth: 1, borderColor: alpha.hairline(), borderRadius: 18, borderBottomLeftRadius: 6, paddingHorizontal: 14, paddingVertical: 10 }}>
              {who ? (
                <Spec tone="faint" style={{ marginBottom: 2 }}>
                  {who}
                </Spec>
              ) : null}
              <Body size="sm" medium>
                {typed}
                {!done ? <Body size="sm" tone="accent">▍</Body> : null}
              </Body>
            </View>
          </View>
        ) : null}
        {children ? <View style={{ position: "absolute", left: pad, bottom: pad + 12 }}>{children}</View> : null}
        </View>
      </Plate>
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
