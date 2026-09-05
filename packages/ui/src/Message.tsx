/**
 * A turn in a conversation, in the pattern every assistant app has settled
 * on: what you said sits on the right in a soft plate; what the desk says
 * sits on the left as plain text beside its keeper, with no bubble, so the
 * reply reads like a page and not like a text message. New turns rise 6px
 * over the site's bubble timing. While a reply is still arriving the last
 * character is an accent block cursor.
 *
 * Thinking is not a shimmer: it is three ink pixels lighting in a row, the
 * `.glyph-draw` row cascade from the landing page at 3 cells wide.
 * NEW: not on the site.
 */
import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Plate } from "./Plate";
import { Body, Spec } from "./Text";
import { ease, ms, radius, shell } from "./tokens";

export type Role = "you" | "desk";

function Rise({ children, style }: { children: ReactNode; style?: object }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: ms.bubbleRise, easing: Easing.bezier(...ease.out) });
  }, [t]);
  const a = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: (1 - t.value) * 6 }] }));
  return <Animated.View style={[a, style]}>{children}</Animated.View>;
}

export function Message({ role, text, streaming = false, avatar, maxWidth = "80%" }: { role: Role; text: string; streaming?: boolean; avatar?: ReactNode; maxWidth?: number | `${number}%` }) {
  if (role === "you") {
    return (
      <Rise style={{ alignSelf: "flex-end", maxWidth }}>
        <Plate tone="panel" radius={radius.xxl}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            <Body>{text}</Body>
          </View>
        </Plate>
      </Rise>
    );
  }
  return (
    <Rise style={{ flexDirection: "row", gap: 12, alignItems: "flex-start", alignSelf: "stretch" }}>
      {avatar ? <View style={{ paddingTop: 2 }}>{avatar}</View> : null}
      <View style={{ flex: 1, minWidth: 0, paddingTop: 6 }}>
        <Body>
          {text}
          {streaming ? <Body tone="accent">▍</Body> : null}
        </Body>
      </View>
    </Rise>
  );
}

function Cell({ i }: { i: number }) {
  const o = useSharedValue(0.25);
  useEffect(() => {
    o.value = withDelay(i * 140, withRepeat(withSequence(withTiming(1, { duration: 220 }), withTiming(0.25, { duration: 420 })), -1, false));
  }, [i, o]);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width: 6, height: 6, backgroundColor: shell.ink }, s]} />;
}

export function Thinking({ label = "At the desk…", avatar }: { label?: string; avatar?: ReactNode }) {
  return (
    <Rise style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
      {avatar}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 3 }}>
          {[0, 1, 2].map((i) => (
            <Cell key={i} i={i} />
          ))}
        </View>
        <Spec tone="muted">{label}</Spec>
      </View>
    </Rise>
  );
}
