/**
 * THE BUILDING — the map as a cross-section of the hall. Six rooms
 * stacked as floors, each drawn the way every other scene in the app is
 * drawn: a wall in the room's colour, the tiled floor, real furniture
 * standing on it, a sign hanging from the ceiling with the room's name
 * and one small window per task the plan has put in that room, lit when
 * the task is done. A stair on alternating sides joins each floor to the
 * next. The founder's keeper stands on the floor of the room they are
 * in and walks the stairs when the week moves on. Rooms past the gate
 * sit in the dark under a "with the coaches" sign.
 * NEW: not on the site.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Animated, { Easing, cancelAnimation, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Sprite, spriteMeta, type SpriteId } from "./Sprite";
import { Backdrop } from "./Scene";
import { Signage, Spec } from "./Text";
import { art, shell } from "./tokens";
import { scheme } from "./theme";
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

const H = 132; // one floor
const FLOOR = 44; // the tiled part
const GAP = 12; // the slab between floors
const SCALE = 2;

/** What stands in each room, as fractions of the width; the sign hangs on the other side, so nothing hides behind it. */
const FURNITURE: { id: SpriteId; x: number }[][] = [
  [{ id: "prop-notice-board", x: 0.7 }, { id: "prop-planter", x: 0.92 }],
  [{ id: "prop-sofa", x: 0.12 }, { id: "prop-table", x: 0.34 }],
  [{ id: "prop-crates", x: 0.66 }, { id: "prop-board", x: 0.88 }],
  [{ id: "prop-kiosk", x: 0.12 }, { id: "prop-sign", x: 0.36 }],
  [{ id: "prop-bar", x: 0.7 }, { id: "prop-lamp", x: 0.93 }],
  [{ id: "prop-tree", x: 0.1 }, { id: "prop-bench", x: 0.34 }],
];
const SIGN_BG = "#15191D";
const SIGN_TEXT = "#EDF0F4";
const SIGN_QUIET = "rgba(237,240,244,0.68)";

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function Building({ rooms, here, look, onPress }: { rooms: BuildingRoom[]; here: number; look: Look; onPress: (i: number) => void }) {
  const [w, setW] = useState(340);
  const dark = scheme() === "dark";
  const height = rooms.length * H + (rooms.length - 1) * GAP;
  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width))} style={{ height, position: "relative" }} accessibilityRole="list">
      {rooms.map((r, i) => (
        <Room key={r.id} r={r} i={i} width={w} here={i === here} last={i === rooms.length - 1} dark={dark} onPress={() => onPress(i)} />
      ))}
      <Keeper look={look} here={here} width={w} />
    </View>
  );
}

function Room({ r, i, width, here, last, dark, onPress }: { r: BuildingRoom; i: number; width: number; here: boolean; last: boolean; dark: boolean; onPress: () => void }) {
  const signLeft = i % 2 === 0;
  const f = art.floors["main-hall"];
  const wallTone = r.locked ? (dark ? "#2A2D31" : "#B9BCC0") : rgba(r.color, dark ? 0.5 : 0.34);
  const wallBase = dark ? "#3A3D42" : "#E9E4D8";
  return (
    <View style={{ position: "absolute", left: 0, right: 0, top: i * (H + GAP), height: H + (last ? 0 : GAP) }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${r.name}, ${r.locked ? "locked" : r.done ? "done" : r.tasks.length ? `${r.tasks.filter((t) => t.done).length} of ${r.tasks.length} tasks` : r.meta}${here ? ", you are here" : ""}`} style={({ pressed }) => ({ height: H, overflow: "hidden", borderRadius: 14, backgroundColor: wallBase, opacity: pressed ? 0.92 : 1 })}>
        {/* the wall, painted in the room's colour, and the floor */}
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: FLOOR, backgroundColor: wallTone }} />
        <Backdrop hall="main-hall" floorH={FLOOR} scale={SCALE} width={width} />
        {r.locked ? <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: dark ? "rgba(0,0,0,0.45)" : "rgba(40,44,48,0.28)" }} /> : null}

        {/* furniture, standing on the floor */}
        {(FURNITURE[i % FURNITURE.length] ?? []).map((p) => {
          const m = spriteMeta(p.id);
          const s = m.w > 40 ? 1 : SCALE;
          return (
            <View key={p.id} pointerEvents="none" style={{ position: "absolute", left: Math.round(p.x * width - (m.w * s) / 2), bottom: FLOOR - 8 * s, opacity: r.locked ? 0.45 : 1 }}>
              <Sprite id={p.id} scale={s as 1 | 2} />
            </View>
          );
        })}

        {/* the sign, hung from the ceiling on two chains */}
        <View pointerEvents="none" style={{ position: "absolute", top: 0, [signLeft ? "left" : "right"]: 14, alignItems: signLeft ? "flex-start" : "flex-end" }}>
          <View style={{ flexDirection: "row", gap: 46, marginLeft: 10 }}>
            <View style={{ width: 2, height: 10, backgroundColor: rgba(f.trim, 0.7) }} />
            <View style={{ width: 2, height: 10, backgroundColor: rgba(f.trim, 0.7) }} />
          </View>
          <View style={{ backgroundColor: r.locked ? "#3C4147" : r.done ? r.color : SIGN_BG, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7, gap: 5, minWidth: 96, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {r.locked ? <Lock /> : <Sprite id={`glyph-${r.done ? "star" : r.glyph}-paper` as SpriteId} scale={1} />}
              <Signage style={{ color: SIGN_TEXT }}>{`${i + 1} · ${r.name}`}</Signage>
            </View>
            {r.locked ? (
              <Spec style={{ color: SIGN_QUIET }}>opens with the staff</Spec>
            ) : r.tasks.length ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                {r.tasks.map((t, k) => (
                  <View key={k} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: t.done ? "#F3D37A" : "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: t.done ? "#F3D37A" : "rgba(255,255,255,0.45)" }} />
                ))}
                <Spec style={{ color: SIGN_QUIET, marginLeft: 4 }}>{r.week ?? ""}</Spec>
              </View>
            ) : (
              <Spec style={{ color: SIGN_QUIET }}>{r.done ? "done" : r.meta}</Spec>
            )}
          </View>
        </View>

        {/* you are here, on the other side */}
        {here && !r.locked ? (
          <View pointerEvents="none" style={{ position: "absolute", top: 12, [signLeft ? "right" : "left"]: 12, backgroundColor: r.color, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
            <Spec tone="paper">you are here</Spec>
          </View>
        ) : null}
        {/* the way down: a doorway in the wall over the stair */}
        {!last ? <View pointerEvents="none" style={{ position: "absolute", bottom: FLOOR, [signLeft ? "right" : "left"]: 22, width: 26, height: 44, borderTopLeftRadius: 13, borderTopRightRadius: 13, backgroundColor: dark ? "rgba(0,0,0,0.55)" : "rgba(30,26,22,0.42)", borderWidth: 3, borderBottomWidth: 0, borderColor: rgba(f.trim, 0.8) }} /> : null}

        {/* the room's own progress, as a strip of light along the skirting */}
        {!r.locked && r.progress > 0 && !r.done ? <View pointerEvents="none" style={{ position: "absolute", left: 0, bottom: FLOOR, height: 3, width: `${Math.round(r.progress * 100)}%`, backgroundColor: r.color }} /> : null}
      </Pressable>

      {/* the slab, and the stair down to the next floor on the side away from the sign */}
      {!last ? (
        <View pointerEvents="none" style={{ height: GAP, flexDirection: signLeft ? "row-reverse" : "row", alignItems: "flex-start", paddingHorizontal: 22 }}>
          <View style={{ flexDirection: "column" }}>
            {[26, 18, 10].map((wd, k) => (
              <View key={k} style={{ width: wd, height: Math.ceil(GAP / 3), backgroundColor: rgba(f.trim, dark ? 0.95 : 0.8), alignSelf: signLeft ? "flex-end" : "flex-start" }} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** The founder, standing in their room; walks down the stairs when `here` moves. */
function Keeper({ look, here, width }: { look: Look; here: number; width: number }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  const bob = useSharedValue(0);
  const [walking, setWalking] = useState(false);
  const [frame, setFrame] = useState<0 | 1 | 2>(0);
  const prev = useRef(here);
  const id0 = `avatar-outfit${look.outfit % 8}-down-0` as SpriteId;
  const m = spriteMeta(id0);
  const topFor = (i: number) => i * (H + GAP) + H - FLOOR + 8 - m.h * SCALE;
  useEffect(() => {
    const from = prev.current;
    prev.current = here;
    cancelAnimation(y);
    if (reduced || from === here) {
      y.value = topFor(here);
      return;
    }
    setWalking(true);
    y.value = withTiming(topFor(here), { duration: 500 + Math.abs(here - from) * 350, easing: Easing.inOut(Easing.quad) }, (done) => {
      if (done) runOnJS(setWalking)(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [here, reduced]);
  useEffect(() => {
    if (!walking) {
      setFrame(0);
      bob.value = reduced ? 0 : withRepeat(withSequence(withTiming(-2, { duration: 800, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) })), -1, false);
      return () => cancelAnimation(bob);
    }
    cancelAnimation(bob);
    bob.value = 0;
    const h = setInterval(() => setFrame((f) => ((f + 1) % 3) as 0 | 1 | 2), 150);
    return () => clearInterval(h);
  }, [walking, reduced, bob]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value + bob.value }] }));
  const x = Math.round(width * 0.5 - (m.w * SCALE) / 2);
  const id = `avatar-outfit${look.outfit % 8}-down-${walking ? frame : 0}` as SpriteId;
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: x, top: 0 }, style]}>
      <View style={{ position: "absolute", left: -6, right: -6, bottom: -3, height: 8, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.18)" }} />
      <Sprite id={id} scale={SCALE} />
    </Animated.View>
  );
}

function Lock() {
  return (
    <View style={{ alignItems: "center", width: 12 }}>
      <View style={{ width: 8, height: 6, borderWidth: 2, borderBottomWidth: 0, borderColor: SIGN_TEXT, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
      <View style={{ width: 11, height: 8, borderRadius: 2, backgroundColor: SIGN_TEXT }} />
    </View>
  );
}


