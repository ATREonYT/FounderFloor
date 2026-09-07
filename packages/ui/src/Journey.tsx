/**
 * THE JOURNEY — the track map. Six rooms as stops on a path that winds
 * down the screen, the founder's keeper standing at the room they are in,
 * done rooms stamped, the rooms past the gate drawn with a lock until the
 * week of the whole staff (or Pro) opens them. Props from the hall stand
 * along the path so it reads as a place walked through, not a checklist.
 *
 * Everything here is derived: which stop is "here", what is done, what is
 * locked. The screen decides what a tap does.
 * NEW: not on the site.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Animated, { Easing, cancelAnimation, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Sprite, type SpriteId } from "./Sprite";
import { Body, Spec } from "./Text";
import { Glyph } from "./Scene";
import { shell } from "./tokens";
import { scheme } from "./theme";
import type { Look } from "./Keeper";

export interface JourneyStop {
  id: string;
  name: string;
  /** "2/5" — what is done in the room. */
  meta: string;
  color: string;
  progress: number;
  done: boolean;
  locked: boolean;
}

const STEP = 104;
const DISC = 46;
const LABEL_W = 128;
const PROPS: SpriteId[] = ["prop-lamp", "prop-planter", "prop-crates", "prop-tree", "prop-bench", "prop-planter"];

export function Journey({ stops, here, look, onPress, width: forced }: { stops: JourneyStop[]; here: number; look: Look; onPress: (i: number) => void; width?: number }) {
  const [w, setW] = useState(forced ?? 340);
  const dark = scheme() === "dark";
  const xs = stops.map((_, i) => Math.round((i % 2 === 0 ? 0.26 : 0.74) * w));
  const ys = stops.map((_, i) => 44 + i * STEP);
  const height = 44 + (stops.length - 1) * STEP + 80;
  return (
    <View onLayout={(e: LayoutChangeEvent) => !forced && setW(Math.round(e.nativeEvent.layout.width))} style={{ height, position: "relative" }} accessibilityRole="list">
      {/* the path: a segment between each pair of stops, solid where walked, dashed ahead */}
      {stops.slice(1).map((_, i) => {
        const x1 = xs[i], y1 = ys[i], x2 = xs[i + 1], y2 = ys[i + 1];
        const len = Math.hypot(x2 - x1, y2 - y1);
        const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
        const walked = i < here;
        return (
          <View key={`seg${i}`} pointerEvents="none" style={{ position: "absolute", left: (x1 + x2) / 2 - len / 2, top: (y1 + y2) / 2 - 7, width: len, height: 14, transform: [{ rotate: `${ang}deg` }], alignItems: "center", justifyContent: "center" }}>
            {/* the road: a pale band, with the walked part drawn on it */}
            <View style={{ position: "absolute", left: 0, right: 0, height: 14, borderRadius: 7, backgroundColor: shell.well, opacity: 0.9 }} />
            <View style={{ width: len, height: 0, borderTopWidth: 4, borderColor: walked ? shell.accent : shell.line, borderStyle: walked ? "solid" : "dashed" }} />
          </View>
        );
      })}
      {/* furniture along the way, on the side away from the label */}
      {stops.map((_, i) => (
        <View key={`prop${i}`} pointerEvents="none" style={{ position: "absolute", left: i % 2 === 0 ? w - 70 : 8, top: ys[i] - 36, opacity: 0.85 }}>
          <Sprite id={PROPS[i % PROPS.length]} scale={1} />
        </View>
      ))}
      {stops.map((s, i) => (
        <Stop key={s.id} s={s} i={i} x={xs[i]} y={ys[i]} here={i === here} onPress={() => onPress(i)} left={i % 2 === 1} dark={dark} />
      ))}
      <Walker xs={xs} ys={ys} here={here} look={look} />
    </View>
  );
}

/**
 * The founder on the road. Stands on the current stop; when the map opens
 * it walks there from the stop before, and whenever `here` advances it
 * walks the new segment. The walk cycle is the floor's three frames; the
 * direction comes from which way the road goes.
 */
function Walker({ xs, ys, here, look }: { xs: number[]; ys: number[]; here: number; look: Look }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(1);
  const bob = useSharedValue(0);
  const from = useRef(-1);
  const [seg, setSeg] = useState({ a: Math.max(0, here - 1), b: here });
  const [walking, setWalking] = useState(false);
  const [frame, setFrame] = useState<0 | 1 | 2>(0);
  const layoutKey = xs.join(",");

  useEffect(() => {
    // first time: from the stop before; afterwards: from wherever we stood
    const a = from.current < 0 || from.current === here ? Math.max(0, here - 1) : from.current;
    from.current = here;
    setSeg({ a, b: here });
    cancelAnimation(t);
    if (reduced || a === here) {
      t.value = 1;
      setWalking(false);
      return;
    }
    t.value = 0;
    setWalking(true);
    const ms = 700 + Math.hypot((xs[here] ?? 0) - (xs[a] ?? 0), (ys[here] ?? 0) - (ys[a] ?? 0)) * 7;
    t.value = withTiming(1, { duration: ms, easing: Easing.inOut(Easing.quad) }, (done) => {
      if (done) runOnJS(setWalking)(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [here, layoutKey, reduced]);

  useEffect(() => {
    if (!walking) {
      setFrame(0);
      bob.value = reduced ? 0 : withRepeat(withSequence(withTiming(-2, { duration: 700, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 700, easing: Easing.inOut(Easing.quad) })), -1, false);
      return () => cancelAnimation(bob);
    }
    cancelAnimation(bob);
    bob.value = 0;
    const h = setInterval(() => setFrame((f) => ((f + 1) % 3) as 0 | 1 | 2), 150);
    return () => clearInterval(h);
  }, [walking, reduced, bob]);

  const x1 = xs[seg.a] ?? 0, y1 = ys[seg.a] ?? 0, x2 = xs[seg.b] ?? 0, y2 = ys[seg.b] ?? 0;
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x1 + (x2 - x1) * t.value }, { translateY: y1 + (y2 - y1) * t.value + bob.value }] }));
  const dir = !walking ? "down" : x2 > x1 ? "right" : x2 < x1 ? "left" : "down";
  const id = `avatar-outfit${look.outfit % 8}-${dir}-${walking ? frame : 0}` as SpriteId;
  // the sprite is 20×28 at 2×: feet land on the disc's centre
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: -20, top: -50 }, style]}>
      <Sprite id={id} scale={2} />
    </Animated.View>
  );
}

function Stop({ s, i, x, y, here, onPress, left, dark }: { s: JourneyStop; i: number; x: number; y: number; here: boolean; onPress: () => void; left: boolean; dark: boolean }) {
  const bg = s.done ? shell.accent : here ? shell.ink : s.locked ? shell.well : shell.panel;
  const ring = here ? s.color : s.done ? shell.accent : shell.line;
  // the disc must land on (x, y) whichever side the label sits: a reversed row puts the disc last
  const boxLeft = left ? x - DISC / 2 - LABEL_W - 10 : x - DISC / 2;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${s.name}, ${s.locked ? "locked" : s.done ? "done" : s.meta}${here ? ", you are here" : ""}`} style={{ position: "absolute", left: boxLeft, top: y - DISC / 2, width: DISC + 10 + LABEL_W, flexDirection: left ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
      <View style={{ width: DISC, height: DISC, borderRadius: DISC / 2, backgroundColor: bg, borderWidth: 3, borderColor: ring, alignItems: "center", justifyContent: "center", position: "relative" }}>
        {s.done ? <Glyph id="star" tone={dark ? "ink" : "paper"} scale={2} /> : s.locked ? <Lock /> : <Spec tone={here ? (dark ? "ink" : "paper") : "ink"}>{String(i + 1)}</Spec>}
        {/* the room's progress, as a small arc-less ring segment: a bar under the disc */}
        {!s.done && !s.locked && s.progress > 0 ? (
          <View pointerEvents="none" style={{ position: "absolute", bottom: -10, left: 6, right: 6, height: 4, borderRadius: 2, backgroundColor: shell.line, overflow: "hidden" }}>
            <View style={{ width: `${Math.round(s.progress * 100)}%`, height: 4, backgroundColor: s.color }} />
          </View>
        ) : null}
      </View>
      <View style={{ width: LABEL_W, alignItems: left ? "flex-end" : "flex-start" }}>
        <Body size="sm" medium numberOfLines={2} style={{ textAlign: left ? "right" : "left" }}>
          {s.name}
        </Body>
        <Spec tone={s.locked ? "faint" : s.done ? "verify" : "muted"}>{s.locked ? "with the staff" : s.done ? "done" : here ? `here · ${s.meta}` : s.meta}</Spec>
      </View>
    </Pressable>
  );
}

/** A small padlock, drawn: a shackle over a body. */
function Lock() {
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: 10, height: 8, borderWidth: 2, borderBottomWidth: 0, borderColor: shell.muted, borderTopLeftRadius: 5, borderTopRightRadius: 5 }} />
      <View style={{ width: 14, height: 10, borderRadius: 2, backgroundColor: shell.muted }} />
    </View>
  );
}
