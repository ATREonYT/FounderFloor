/**
 * THE JOURNEY — the track map. Six rooms as stops on a road that curves
 * down the screen like a garden path: a warm sand band with soft bends,
 * the walked part tinted in the next room's colour, the founder's keeper
 * walking it to the room they are in, done rooms stamped in their own
 * colour, the rooms past the gate resting under a lock. Hall props stand
 * in the bends. Nothing is drawn with a hard line: bends are made of many
 * short pieces, rings are washes, shadows are soft.
 * NEW: not on the site.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Animated, { Easing, cancelAnimation, runOnJS, useAnimatedReaction, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Sprite, type SpriteId } from "./Sprite";
import { Body, Spec } from "./Text";
import { Glyph } from "./Scene";
import { art, shell } from "./tokens";
import { scheme } from "./theme";
import type { Look } from "./Keeper";

export interface JourneyStop {
  id: string;
  name: string;
  /** "2 of 5" — what is done in the room. */
  meta: string;
  color: string;
  progress: number;
  done: boolean;
  locked: boolean;
}

const STEP = 112;
const DISC = 50;
const ROAD = 20;
const PIECES = 18;
const LABEL_W = 132;
const PROPS: SpriteId[] = ["prop-tree", "prop-lamp", "prop-planter", "prop-bench", "prop-tree", "prop-planter"];

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Points along a soft S-bend from one stop to the next. */
function bend(x1: number, y1: number, x2: number, y2: number, k: number): { x: number; y: number }[] {
  // a cubic with vertical tangents at both ends: the road leaves a stop straight down and arrives straight down
  const c1 = { x: x1, y: y1 + (y2 - y1) * 0.55 };
  const c2 = { x: x2, y: y2 - (y2 - y1) * 0.55 };
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= k; i++) {
    const t = i / k, u = 1 - t;
    pts.push({ x: u * u * u * x1 + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * x2, y: u * u * u * y1 + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * y2 });
  }
  return pts;
}

export function Journey({ stops, here, look, onPress, width: forced }: { stops: JourneyStop[]; here: number; look: Look; onPress: (i: number) => void; width?: number }) {
  const [w, setW] = useState(forced ?? 340);
  const dark = scheme() === "dark";
  const xs = stops.map((_, i) => Math.round((i % 2 === 0 ? 0.3 : 0.7) * w));
  const ys = stops.map((_, i) => 56 + i * STEP);
  const height = 56 + (stops.length - 1) * STEP + 84;
  const links = stops.slice(1).map((_, i) => bend(xs[i], ys[i], xs[i + 1], ys[i + 1], PIECES));
  const sand = dark ? rgba("#8A8272", 0.35) : art.floors["main-hall"].a;
  return (
    <View onLayout={(e: LayoutChangeEvent) => !forced && setW(Math.round(e.nativeEvent.layout.width))} style={{ height, position: "relative" }} accessibilityRole="list">
      {/* the road, in short pieces so the bends are soft; walked pieces tinted with the next room's colour */}
      {links.map((pts, i) =>
        pts.slice(1).map((p, j) => {
          const q = pts[j];
          const len = Math.hypot(p.x - q.x, p.y - q.y) + 7;
          const ang = (Math.atan2(p.y - q.y, p.x - q.x) * 180) / Math.PI;
          const walked = i < here;
          const tint = walked ? rgba(stops[i + 1].color, dark ? 0.55 : 0.4) : "transparent";
          return (
            <View key={`r${i}-${j}`} pointerEvents="none" style={{ position: "absolute", left: (p.x + q.x) / 2 - len / 2, top: (p.y + q.y) / 2 - ROAD / 2, width: len, height: ROAD, borderRadius: 2, backgroundColor: sand, transform: [{ rotate: `${ang}deg` }] }}>
              <View style={{ position: "absolute", left: 0, right: 0, top: 5, bottom: 5, backgroundColor: tint }} />
            </View>
          );
        }),
      )}
      {/* footprints ahead: small dots where the road is still to walk */}
      {links.map((pts, i) =>
        i >= here
          ? pts.filter((_, j) => j % 4 === 2).map((p, j) => <View key={`d${i}-${j}`} pointerEvents="none" style={{ position: "absolute", left: p.x - 2, top: p.y - 2, width: 4, height: 4, borderRadius: 2, backgroundColor: rgba(art.muted, 0.35) }} />)
          : null,
      )}
      {/* furniture in the bends, on the side away from the label */}
      {stops.map((_, i) => (
        <View key={`prop${i}`} pointerEvents="none" style={{ position: "absolute", left: i % 2 === 0 ? w - 74 : 10, top: ys[i] - 48, opacity: 0.9 }}>
          <Sprite id={PROPS[i % PROPS.length]} scale={1} />
        </View>
      ))}
      {stops.map((s, i) => (
        <Stop key={s.id} s={s} i={i} x={xs[i]} y={ys[i]} here={i === here} onPress={() => onPress(i)} left={i % 2 === 1} dark={dark} />
      ))}
      <Walker links={links} xs={xs} ys={ys} here={here} look={look} />
    </View>
  );
}

/**
 * The founder on the road. Stands on the current stop; when the map opens
 * it walks there from the stop before along the bend, and whenever `here`
 * advances it walks the new bend. The walk cycle is the floor's three
 * frames; the direction comes from which way the road goes.
 */
function Walker({ links, xs, ys, here, look }: { links: { x: number; y: number }[][]; xs: number[]; ys: number[]; here: number; look: Look }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(1);
  const bob = useSharedValue(0);
  const from = useRef(-1);
  const [seg, setSeg] = useState({ a: Math.max(0, here - 1), b: here });
  const [walking, setWalking] = useState(false);
  const [frame, setFrame] = useState<0 | 1 | 2>(0);
  const layoutKey = xs.join(",");

  useEffect(() => {
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
    const ms = 900 + Math.abs(here - a) * 700;
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

  // the route: every bend between a and b, flattened to one list of points
  const lo = Math.min(seg.a, seg.b), hi = Math.max(seg.a, seg.b);
  let route: { x: number; y: number }[] = [];
  for (let i = lo; i < hi; i++) route = route.concat(i === lo ? links[i] : links[i].slice(1));
  if (seg.b < seg.a) route = route.slice().reverse();
  if (!route.length) route = [{ x: xs[here] ?? 0, y: ys[here] ?? 0 }];
  const px = route.map((p) => p.x), py = route.map((p) => p.y);
  const [facing, setFacing] = useState<"left" | "right" | "down">("down");
  const style = useAnimatedStyle(() => {
    const n = px.length - 1;
    const f = t.value * n;
    const i = Math.min(n - 1, Math.max(0, Math.floor(f)));
    const k = n ? f - i : 0;
    const x = n ? px[i] + (px[i + 1] - px[i]) * k : px[0];
    const y = n ? py[i] + (py[i + 1] - py[i]) * k : py[0];
    return { transform: [{ translateX: x }, { translateY: y + bob.value }] };
  }, [px, py]);
  // which way the road goes, sent to React only when it changes, never per frame
  useAnimatedReaction(
    () => {
      const n = px.length - 1;
      if (!n) return "down";
      const i = Math.min(n - 1, Math.max(0, Math.floor(t.value * n)));
      const dx = px[i + 1] - px[i];
      return Math.abs(dx) < 0.6 ? "down" : dx > 0 ? "right" : "left";
    },
    (dir, prev) => {
      if (dir !== prev) runOnJS(setFacing)(dir as "left" | "right" | "down");
    },
    [px, py],
  );
  const dir = walking ? facing : "down";
  const id = `avatar-outfit${look.outfit % 8}-${dir}-${walking ? frame : 0}` as SpriteId;
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: -20, top: -52 }, style]}>
      <Sprite id={id} scale={2} />
    </Animated.View>
  );
}

function Stop({ s, i, x, y, here, onPress, left, dark }: { s: JourneyStop; i: number; x: number; y: number; here: boolean; onPress: () => void; left: boolean; dark: boolean }) {
  const reduced = useReducedMotion();
  const halo = useSharedValue(1);
  useEffect(() => {
    if (!here || reduced) return;
    halo.value = withRepeat(withSequence(withTiming(1.18, { duration: 1100, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) })), -1, false);
  }, [here, reduced, halo]);
  const glow = useAnimatedStyle(() => ({ transform: [{ scale: halo.value }], opacity: 1.35 - halo.value * 0.55 }));
  const fill = s.locked ? shell.well : s.done || here ? s.color : rgba(s.color, dark ? 0.28 : 0.16);
  const boxLeft = left ? x - DISC / 2 - LABEL_W - 12 : x - DISC / 2;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${s.name}, ${s.locked ? "locked" : s.done ? "done" : s.meta}${here ? ", you are here" : ""}`} style={{ position: "absolute", left: boxLeft, top: y - DISC / 2, width: DISC + 12 + LABEL_W, flexDirection: left ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
      <View style={{ width: DISC, height: DISC, alignItems: "center", justifyContent: "center" }}>
        {here ? <Animated.View pointerEvents="none" style={[{ position: "absolute", width: DISC + 22, height: DISC + 22, borderRadius: (DISC + 22) / 2, backgroundColor: rgba(s.color, 0.22) }, glow]} /> : null}
        <View style={{ width: DISC, height: DISC, borderRadius: DISC / 2, backgroundColor: fill, alignItems: "center", justifyContent: "center", shadowColor: s.color, shadowOpacity: s.done || here ? 0.35 : 0, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: s.done || here ? 4 : 0 }}>
          {s.done ? <Glyph id="star" tone="paper" scale={2} /> : s.locked ? <Lock /> : here ? <Glyph id="bolt" tone="paper" scale={2} /> : <Spec tone={dark ? "paper" : "ink"}>{String(i + 1)}</Spec>}
        </View>
        {!s.done && !s.locked && s.progress > 0 ? (
          <View pointerEvents="none" style={{ position: "absolute", bottom: -9, left: 9, right: 9, height: 4, borderRadius: 2, backgroundColor: rgba(s.color, 0.2), overflow: "hidden" }}>
            <View style={{ width: `${Math.round(s.progress * 100)}%`, height: 4, backgroundColor: s.color }} />
          </View>
        ) : null}
      </View>
      <View style={{ width: LABEL_W, alignItems: left ? "flex-end" : "flex-start" }}>
        <View style={{ backgroundColor: dark ? shell.panel : "rgba(255,255,255,0.86)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, alignItems: left ? "flex-end" : "flex-start", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}>
          <Body size="sm" medium numberOfLines={2} style={{ textAlign: left ? "right" : "left" }}>
            {s.name}
          </Body>
          <Spec tone={s.locked ? "faint" : s.done ? "verify" : "muted"}>{s.locked ? "with the coaches" : s.done ? "done" : here ? `you are here · ${s.meta}` : s.meta}</Spec>
        </View>
      </View>
    </Pressable>
  );
}

function Lock() {
  return (
    <View style={{ alignItems: "center", opacity: 0.7 }}>
      <View style={{ width: 10, height: 8, borderWidth: 2, borderBottomWidth: 0, borderColor: shell.muted, borderTopLeftRadius: 5, borderTopRightRadius: 5 }} />
      <View style={{ width: 14, height: 10, borderRadius: 3, backgroundColor: shell.muted }} />
    </View>
  );
}
