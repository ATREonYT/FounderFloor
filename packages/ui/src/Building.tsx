/**
 * THE BUILDING — the map as a tower of glass floors. Six rooms stacked
 * from the top, each a pane lit in its own colour, with the room's glyph,
 * its name, how far along it is, and one small window per task the plan
 * has put there, lit when the task is done. A lift shaft runs down the
 * left with a lamp on each floor; the founder's keeper stands on the
 * floor of the room they are in and rides down when the week moves on.
 * Rooms past the gate sit dark under a "with the coaches" line.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Animated, { Easing, cancelAnimation, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Sprite, spriteMeta, type SpriteId } from "./Sprite";
import { SpriteCycle } from "./SpriteCycle";
import { Plate } from "./Plate";
import { Glow } from "./Stage";
import { GlyphTile } from "./Scene";
import { Body, Spec } from "./Text";
import { curve, shell } from "./tokens";
import { alpha, scheme } from "./theme";
import type { Look } from "./Keeper";
import type { GlyphId } from "./Sign";

export interface BuildingRoom {
  id: string;
  name: string;
  color: string;
  glyph: GlyphId;
  /** The plan's tasks that live in this room, one window each. */
  tasks: { text: string; done: boolean }[];
  /** Which week(s) of the plan are spent here: "WEEK 1". */
  week?: string;
  /** The room's own list: "0 of 5 on the list". */
  meta: string;
  progress: number;
  done: boolean;
  locked: boolean;
}

const H = 108; // one floor
const GAP = 10; // between floors
const SHAFT = 26; // the lift shaft on the left
const SCALE = 2;

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function Building({ rooms, here, look, onPress }: { rooms: BuildingRoom[]; here: number; look: Look; onPress: (i: number) => void }) {
  const [w, setW] = useState(340);
  const height = rooms.length * H + (rooms.length - 1) * GAP;
  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width))} style={{ height, position: "relative" }} accessibilityRole="list">
      {/* the lift shaft: a hairline down the left with a lamp on each floor */}
      <View pointerEvents="none" style={{ position: "absolute", left: SHAFT / 2 - 1, top: H / 2, bottom: H / 2, width: 2, backgroundColor: alpha.hairline() }} />
      {rooms.map((r, i) => (
        <Room key={r.id} r={r} i={i} width={w} here={i === here} onPress={() => onPress(i)} />
      ))}
      <Keeper look={look} here={here} width={w} />
    </View>
  );
}

function Room({ r, i, width, here, onPress }: { r: BuildingRoom; i: number; width: number; here: boolean; onPress: () => void }) {
  const dark = scheme() === "dark";
  const lamp = r.locked ? alpha.hairline() : r.done ? shell.verify : here ? r.color : alpha.hairline();
  return (
    <View style={{ position: "absolute", left: 0, right: 0, top: i * (H + GAP), height: H, flexDirection: "row", alignItems: "center" }}>
      {/* the lamp on the shaft */}
      <View pointerEvents="none" style={{ width: SHAFT, alignItems: "center" }}>
        <View style={{ width: here ? 12 : 8, height: here ? 12 : 8, borderRadius: 6, backgroundColor: lamp, shadowColor: lamp, shadowOpacity: here ? 0.9 : 0, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }} />
      </View>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${r.name}, ${r.locked ? "locked" : r.done ? "done" : r.tasks.length ? `${r.tasks.filter((t) => t.done).length} of ${r.tasks.length} tasks` : r.meta}${here ? ", you are here" : ""}`} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.92 : 1 })}>
        <Plate tone="panel" radius={22} contentStyle={{ height: H }} ring={here && !r.locked ? rgba(r.color, 0.7) : undefined}>
          <View style={{ height: H, paddingHorizontal: 16, paddingVertical: 14, justifyContent: "space-between", opacity: r.locked ? 0.55 : 1 }}>
            {!r.locked ? <Glow color={r.color} x={0.15} y={0.1} r={0.7} strength={r.done ? 0.35 : here ? 0.7 : 0.45} /> : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <GlyphTile id={r.done ? "star" : r.glyph} color={r.locked ? undefined : r.color} size={38} scale={2} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Body medium numberOfLines={1} style={{ flexShrink: 1 }}>{`${i + 1} · ${r.name}`}</Body>
                  {here && !r.locked ? (
                    <View style={{ backgroundColor: r.color, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Spec style={{ color: "#FFFFFF" }}>you are here</Spec>
                    </View>
                  ) : null}
                </View>
                <Spec tone="faint" numberOfLines={1}>{r.locked ? "Opens with the coaches" : r.done ? "Done" : r.tasks.length ? `${r.week ?? ""} · ${r.tasks.filter((t) => t.done).length} of ${r.tasks.length} tasks` : r.meta}</Spec>
              </View>
              {r.locked ? <Lock /> : null}
            </View>
            {/* the windows: one per task, lit when done; else the room's own progress as a strip of light */}
            {!r.locked && r.tasks.length ? (
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                {r.tasks.map((t, k) => (
                  <View key={k} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: t.done ? r.color : alpha.hairline() }} />
                ))}
              </View>
            ) : (
              <View style={{ height: 6, borderRadius: 3, backgroundColor: alpha.hairline(), overflow: "hidden" }}>
                <View style={{ width: `${Math.round((r.done ? 1 : r.progress) * 100)}%`, height: 6, borderRadius: 3, backgroundColor: r.locked ? (dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)") : r.done ? shell.verify : r.color }} />
              </View>
            )}
          </View>
        </Plate>
      </Pressable>
    </View>
  );
}

/** The founder, standing on their floor at the right; rides down the tower when `here` moves. */
function Keeper({ look, here, width }: { look: Look; here: number; width: number }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  const bob = useSharedValue(0);
  const [walking, setWalking] = useState(false);
  const prev = useRef(here);
  const id0 = `avatar-outfit${look.outfit % 8}-down-0` as SpriteId;
  const m = spriteMeta(id0);
  const topFor = (i: number) => i * (H + GAP) + H - 14 - m.h * SCALE;
  useEffect(() => {
    const from = prev.current;
    prev.current = here;
    cancelAnimation(y);
    if (reduced || from === here) {
      y.value = topFor(here);
      return;
    }
    setWalking(true);
    y.value = withTiming(topFor(here), { duration: 500 + Math.abs(here - from) * 300, easing: Easing.bezier(...curve.inOut) }, (done) => {
      if (done) runOnJS(setWalking)(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [here, reduced]);
  useEffect(() => {
    if (!walking) {
      bob.value = reduced ? 0 : withRepeat(withSequence(withTiming(-2, { duration: 800, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) })), -1, false);
      return () => cancelAnimation(bob);
    }
    cancelAnimation(bob);
    bob.value = 0;
  }, [walking, reduced, bob]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value + bob.value }] }));
  const x = Math.round(width - 22 - m.w * SCALE);
  const ids = [0, 1, 2].map((k) => `avatar-outfit${look.outfit % 8}-down-${k}` as SpriteId);
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: x, top: 0 }, style]}>
      <View style={{ position: "absolute", left: -6, right: -6, bottom: -3, height: 8, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.35)" }} />
      <SpriteCycle ids={ids} playing={walking} period={150} scale={SCALE} />
    </Animated.View>
  );
}

function Lock() {
  const c = shell.faint;
  return (
    <View style={{ alignItems: "center", width: 14 }}>
      <View style={{ width: 9, height: 7, borderWidth: 2, borderBottomWidth: 0, borderColor: c, borderTopLeftRadius: 5, borderTopRightRadius: 5 }} />
      <View style={{ width: 13, height: 9, borderRadius: 3, backgroundColor: c }} />
    </View>
  );
}
