/**
 * THE BUILDING — the map as a cross-section of the hall, the way a
 * dollhouse shows every room at once. Six rooms stacked as floors under
 * a rooftop sign, each drawn the way the rest of the pixel world is: a
 * wall in the room's colour, the tiled floor, real furniture standing on
 * it, a sign hung from the ceiling on two chains with the room's name
 * and one small window per task the plan put there, lit when the task is
 * done. A stair on alternating sides joins each floor to the next. The
 * founder's keeper stands in the room they are in and walks the stairs
 * when the week moves on; the coaches stand in the rooms they own. A
 * warm lamp breathes in the room you are in. Rooms past the gate sit in
 * the dark under a "with the coaches" sign. A street runs under it all.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Animated, { Easing, cancelAnimation, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Sprite, spriteMeta, type SpriteId } from "./Sprite";
import { SpriteCycle } from "./SpriteCycle";
import { Backdrop } from "./Scene";
import { PixelIcon, type PixelIconId } from "./PixelIcon";
import { Glow } from "./Stage";
import { Signage, Spec } from "./Text";
import { art, curve } from "./tokens";
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
  /** Which week(s) of the plan are spent here: "Week 1". */
  week?: string;
  /** The room's own list: "0 of 5 on the list". */
  meta: string;
  progress: number;
  done: boolean;
  locked: boolean;
}

/** A member of staff standing in a room. */
export interface BuildingStaff {
  floor: number;
  look: Look;
  name: string;
}

const H = 132; // one floor
const FLOOR = 44; // the tiled part
const GAP = 12; // the slab between floors
const ROOF = 34; // the rooftop sign
const STREET = 58; // the pavement under the building
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

export function Building({ rooms, here, look, staff = [], onPress }: { rooms: BuildingRoom[]; here: number; look: Look; staff?: BuildingStaff[]; onPress: (i: number) => void }) {
  const [w, setW] = useState(340);
  const dark = scheme() === "dark";
  const floors = rooms.length * H + (rooms.length - 1) * GAP;
  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width))} style={{ borderRadius: 22, overflow: "hidden", backgroundColor: dark ? "#0E1216" : "#D9D4C8", borderWidth: 1, borderColor: alpha.hairline() }} accessibilityRole="list">
      {/* the roof: the hall's name on a sign, under a parapet */}
      <View style={{ height: ROOF, backgroundColor: SIGN_BG, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderBottomWidth: 3, borderBottomColor: rgba(art.floors["main-hall"].trim, 0.9) }}>
        <Sprite id="logo-mark" scale={1} />
        <Signage style={{ color: SIGN_TEXT }}>FounderFloor</Signage>
      </View>
      <View style={{ height: floors, position: "relative" }}>
        {rooms.map((r, i) => (
          <Room key={r.id} r={r} i={i} width={w} here={i === here} last={i === rooms.length - 1} dark={dark} staff={staff.filter((s) => s.floor === i)} onPress={() => onPress(i)} />
        ))}
        <Keeper look={look} here={here} width={w} />
      </View>
      {/* the street: pavement, a lamp and a planter, the way in */}
      <View style={{ height: STREET, position: "relative", overflow: "hidden" }}>
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 4, backgroundColor: rgba(art.floors["main-hall"].trim, dark ? 0.95 : 0.8) }} />
        <Backdrop hall="main-hall" floorH={STREET - 4} scale={SCALE} width={w} wall={false} />
        <View pointerEvents="none" style={{ position: "absolute", left: Math.round(w * 0.08), bottom: 6 }}>
          <Sprite id="prop-lamp" scale={1} />
        </View>
        <View pointerEvents="none" style={{ position: "absolute", right: Math.round(w * 0.08), bottom: 8 }}>
          <Sprite id="prop-planter" scale={1} />
        </View>
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 10, alignItems: "center" }}>
          <View style={{ backgroundColor: SIGN_BG, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Spec style={{ color: SIGN_QUIET }}>Main Hall · six rooms, one road</Spec>
          </View>
        </View>
        {dark ? <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)" }} /> : null}
      </View>
    </View>
  );
}

/** The warm lamp in the room you are in, breathing slowly. */
function Lamp({ color }: { color: string }) {
  const reduced = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    o.value = withRepeat(withSequence(withTiming(0.72, { duration: 1700, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.quad) })), -1, false);
    return () => cancelAnimation(o);
  }, [reduced, o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }, a]}>
      <Glow color={color} x={0.5} y={0.35} r={0.6} strength={0.55} />
    </Animated.View>
  );
}

function Room({ r, i, width, here, last, dark, staff, onPress }: { r: BuildingRoom; i: number; width: number; here: boolean; last: boolean; dark: boolean; staff: BuildingStaff[]; onPress: () => void }) {
  const signLeft = i % 2 === 0;
  const f = art.floors["main-hall"];
  const wallTone = r.locked ? (dark ? "#23262A" : "#B9BCC0") : rgba(r.color, dark ? 0.5 : 0.34);
  const wallBase = dark ? "#33373C" : "#E9E4D8";
  return (
    <View style={{ position: "absolute", left: 0, right: 0, top: i * (H + GAP), height: H + (last ? 0 : GAP) }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${r.name}, ${r.locked ? "locked" : r.done ? "done" : r.tasks.length ? `${r.tasks.filter((t) => t.done).length} of ${r.tasks.length} tasks` : r.meta}${here ? ", you are here" : ""}`} style={({ pressed }) => ({ height: H, overflow: "hidden", backgroundColor: wallBase, opacity: pressed ? 0.92 : 1 })}>
        {/* the wall, painted in the room's colour, and the floor */}
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: FLOOR, backgroundColor: wallTone }} />
        {/* a hairline of picture rail on the wall */}
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 22, height: 1, backgroundColor: "rgba(0,0,0,0.12)" }} />
        {here && !r.locked ? <Lamp color={r.color} /> : null}
        <Backdrop hall="main-hall" floorH={FLOOR} scale={SCALE} width={width} />
        {r.locked ? <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: dark ? "rgba(0,0,0,0.55)" : "rgba(40,44,48,0.3)" }} /> : null}

        {/* furniture, standing on the floor */}
        {(FURNITURE[i % FURNITURE.length] ?? []).map((p) => {
          const m = spriteMeta(p.id);
          const s = m.w > 40 ? 1 : SCALE;
          return (
            <View key={p.id} pointerEvents="none" style={{ position: "absolute", left: Math.round(p.x * width - (m.w * s) / 2), bottom: FLOOR - 8 * s, opacity: r.locked ? 0.4 : 1 }}>
              <Sprite id={p.id} scale={s as 1 | 2} />
            </View>
          );
        })}

        {/* the staff who work here */}
        {staff.map((s, k) => {
          const id = `avatar-outfit${s.look.outfit % 8}-down-0` as SpriteId;
          const x = Math.round(width * (signLeft ? 0.58 : 0.26)) + k * 30;
          return (
            <View key={s.name} pointerEvents="none" style={{ position: "absolute", left: x, bottom: FLOOR - 6, opacity: r.locked ? 0.5 : 1 }}>
              <View style={{ position: "absolute", left: -5, right: -5, bottom: -3, height: 7, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.25)" }} />
              <Sprite id={id} scale={SCALE} accessibilityLabel={s.name} />
            </View>
          );
        })}

        {/* the sign, hung from the ceiling on two chains */}
        <View pointerEvents="none" style={{ position: "absolute", top: 0, [signLeft ? "left" : "right"]: 14, alignItems: signLeft ? "flex-start" : "flex-end" }}>
          <View style={{ flexDirection: "row", gap: 46, marginLeft: 10 }}>
            <View style={{ width: 2, height: 10, backgroundColor: rgba(f.trim, 0.7) }} />
            <View style={{ width: 2, height: 10, backgroundColor: rgba(f.trim, 0.7) }} />
          </View>
          <View style={{ backgroundColor: r.locked ? "#3C4147" : r.done ? r.color : SIGN_BG, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7, gap: 5, minWidth: 104, shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <PixelIcon id={r.locked ? "lock" : r.done ? "stamp" : (r.glyph as PixelIconId)} color={r.locked ? SIGN_QUIET : r.done ? "#BE241B" : SIGN_TEXT} size={16} flat={!r.done} />
              <Signage style={{ color: SIGN_TEXT }}>{`${i + 1} · ${r.name}`}</Signage>
            </View>
            {r.locked ? (
              <Spec style={{ color: SIGN_QUIET }}>with the coaches</Spec>
            ) : r.tasks.length ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                {r.tasks.map((t, k) => (
                  <View key={k} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: t.done ? "#F3D37A" : "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: t.done ? "#F3D37A" : "rgba(255,255,255,0.4)" }} />
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
          <View pointerEvents="none" style={{ position: "absolute", top: 12, [signLeft ? "right" : "left"]: 12, backgroundColor: SIGN_BG, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 5 }}>
            <PixelIcon id="pin" color="#E8665A" size={12} flat />
            <Spec style={{ color: SIGN_TEXT }}>you are here</Spec>
          </View>
        ) : null}
        {/* the way down: a doorway in the wall over the stair */}
        {!last ? <View pointerEvents="none" style={{ position: "absolute", bottom: FLOOR, [signLeft ? "right" : "left"]: 22, width: 26, height: 44, borderTopLeftRadius: 13, borderTopRightRadius: 13, backgroundColor: dark ? "rgba(0,0,0,0.6)" : "rgba(30,26,22,0.42)", borderWidth: 3, borderBottomWidth: 0, borderColor: rgba(f.trim, 0.8) }} /> : null}

        {/* the room's own progress, as a strip of light along the skirting */}
        {!r.locked && r.progress > 0 && !r.done ? <View pointerEvents="none" style={{ position: "absolute", left: 0, bottom: FLOOR, height: 3, width: `${Math.round(r.progress * 100)}%`, backgroundColor: r.color }} /> : null}
      </Pressable>

      {/* the slab, and the stair down to the next floor on the side away from the sign */}
      {!last ? (
        <View pointerEvents="none" style={{ height: GAP, backgroundColor: dark ? "#0E1216" : "#D9D4C8", flexDirection: signLeft ? "row-reverse" : "row", alignItems: "flex-start", paddingHorizontal: 22 }}>
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
    y.value = withTiming(topFor(here), { duration: 500 + Math.abs(here - from) * 350, easing: Easing.bezier(...curve.inOut) }, (done) => {
      if (done) runOnJS(setWalking)(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [here, reduced]);
  useEffect(() => {
    if (!walking) {
      bob.value = reduced ? 0 : withRepeat(withSequence(withTiming(-2, { duration: 900, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })), -1, false);
      return () => cancelAnimation(bob);
    }
    cancelAnimation(bob);
    bob.value = 0;
  }, [walking, reduced, bob]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value + bob.value }] }));
  const x = Math.round(width * 0.5 - (m.w * SCALE) / 2);
  const ids = [0, 1, 2].map((k) => `avatar-outfit${look.outfit % 8}-down-${k}` as SpriteId);
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: x, top: 0 }, style]}>
      <View style={{ position: "absolute", left: -6, right: -6, bottom: -3, height: 8, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.28)" }} />
      <SpriteCycle ids={ids} playing={walking} period={150} scale={SCALE} />
    </Animated.View>
  );
}


