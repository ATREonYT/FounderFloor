/**
 * THE BUILDING — the map as a cross-section of the hall, the way a
 * dollhouse shows every room at once. Six rooms stacked as floors under
 * a rooftop sign and a strip of sky, each drawn the way the rest of the
 * pixel world is: a wall in the room's colour with a picture rail and a
 * wainscot, a window onto the night (or the day), a pendant lamp over the
 * middle of the room, the tiled floor with a rug, real furniture standing
 * on it, and a sign hung from the ceiling on two chains with the room's
 * name and one small window per task the plan put there, lit when the
 * task is done. A stair on alternating sides joins each floor to the
 * next. On the street: the front door under a striped awning, a lamp, a
 * planter, and people walking past.
 *
 * Who is in it: the founder's keeper stands in the room they are in with
 * a red pin bobbing over their head, and walks the stairs when the week
 * moves on; the coaches stand in the rooms they own. The lamp is lit and
 * breathing only in the room you are in. Rooms past the gate sit in the
 * dark under a "with the coaches" sign.
 *
 * What you can touch: a room opens; a task window on a sign opens that
 * task; a coach says a line in a bubble and offers a chat; your own
 * keeper jumps and waves.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Animated, { Easing, FadeIn, FadeOut, cancelAnimation, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
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
  /** What they say when tapped. */
  line?: string;
}

const H = 140; // one floor
const FLOOR = 44; // the tiled part
const GAP = 16; // the slab between floors, where the stair is
const SKY = 44; // the strip of sky over the roof
const ROOF = 34; // the rooftop sign
const STREET = 64; // the pavement under the building
const SCALE = 2;
const KEEPER_W = 20 * SCALE;
const KEEPER_H = 28 * SCALE;

/** What stands in each room: a low piece under the sign, a tall piece across from it. */
const FURNITURE: { low: SpriteId; tall: SpriteId }[] = [
  { low: "prop-table", tall: "prop-board" },
  { low: "prop-sofa", tall: "prop-kiosk" },
  { low: "prop-crates", tall: "prop-sign" },
  { low: "prop-bench", tall: "prop-planter" },
  { low: "prop-table", tall: "prop-lamp" },
  { low: "prop-bench", tall: "prop-tree" },
];
const SIGN_BG = "#15191D";
const SIGN_TEXT = "#EDF0F4";
const SIGN_QUIET = "rgba(237,240,244,0.68)";
const LIT = "#F3D37A";

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Where the k-th member of staff on a floor stands: across from the sign, shoulder to shoulder. */
function staffX(floor: number, k: number, width: number): number {
  const signLeft = floor % 2 === 0;
  const fx = signLeft ? 0.62 : 0.38;
  return Math.round(fx * width) + (signLeft ? k * 26 : -k * 26) - KEEPER_W / 2;
}

/** A pixel: a square view on the 2px grid. */
function Px({ x, y, w = 2, h = 2, c }: { x: number; y: number; w?: number; h?: number; c: string }) {
  return <View pointerEvents="none" style={{ position: "absolute", left: x, top: y, width: w, height: h, backgroundColor: c }} />;
}

export function Building({
  rooms,
  here,
  look,
  staff = [],
  youSay,
  onPress,
  onTask,
  onStaff,
}: {
  rooms: BuildingRoom[];
  here: number;
  look: Look;
  staff?: BuildingStaff[];
  /** What your own keeper says when tapped. */
  youSay?: string;
  onPress: (i: number) => void;
  /** A task window on a sign was tapped: the room and the task in it. */
  onTask?: (room: number, task: number) => void;
  /** "Ask" was tapped in a coach's bubble. */
  onStaff?: (s: BuildingStaff) => void;
}) {
  const [w, setW] = useState(340);
  const dark = scheme() === "dark";
  const floors = rooms.length * H + (rooms.length - 1) * GAP;
  const ground = dark ? "#0E1216" : "#D9D4C8";
  /** The coach who was tapped, and what they say, drawn over the floors so the bubble can rise past the ceiling. */
  const [hail, setHail] = useState<{ floor: number; k: number } | null>(null);
  useEffect(() => {
    if (!hail) return;
    const t = setTimeout(() => setHail(null), 4200);
    return () => clearTimeout(t);
  }, [hail]);
  const hailed = hail ? staff.filter((s) => s.floor === hail.floor)[hail.k] : undefined;
  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width))} style={{ borderRadius: 22, overflow: "hidden", backgroundColor: ground, borderWidth: 1, borderColor: alpha.hairline() }} accessibilityRole="list">
      <Sky width={w} dark={dark} />
      {/* the roof: the hall's name on a sign, between a parapet and the top floor */}
      <View style={{ height: ROOF, backgroundColor: SIGN_BG, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderTopWidth: 3, borderTopColor: rgba(art.floors["main-hall"].trim, 0.9), borderBottomWidth: 3, borderBottomColor: rgba(art.floors["main-hall"].trim, 0.9) }}>
        <Sprite id="logo-mark" scale={1} />
        <Signage style={{ color: SIGN_TEXT }}>FounderFloor</Signage>
      </View>
      <View style={{ height: floors, position: "relative" }}>
        {rooms.map((r, i) => (
          <Room key={r.id} r={r} i={i} width={w} here={i === here} last={i === rooms.length - 1} dark={dark} staff={staff.filter((s) => s.floor === i)} hail={hail?.floor === i ? hail.k : null} onHail={(k) => setHail((h) => (h && h.floor === i && h.k === k ? null : { floor: i, k }))} onPress={() => onPress(i)} onTask={onTask ? (k) => onTask(i, k) : undefined} />
        ))}
        <Keeper look={look} here={here} width={w} say={youSay} />
        {hail && hailed ? (
          <Bubble
            text={hailed.line ?? `${hailed.name} works here.`}
            ask={onStaff ? `Ask ${hailed.name}` : undefined}
            onAsk={onStaff ? () => { setHail(null); onStaff(hailed); } : undefined}
            {...(hail.floor % 2 === 0 ? { right: Math.max(8, w - staffX(hail.floor, hail.k, w) - 4) } : { left: Math.max(8, staffX(hail.floor, hail.k, w) + KEEPER_W + 4) })}
            bottom={floors - (hail.floor * (H + GAP) + H - (FLOOR - 6) - KEEPER_H) + 2}
          />
        ) : null}
      </View>
      <Street width={w} dark={dark} ground={ground} />
    </View>
  );
}

/* ------------------------------------------------------------------ the sky */

function Sky({ width, dark }: { width: number; dark: boolean }) {
  const sky = dark ? "#0D1426" : "#C9DFF0";
  const trim = art.floors["main-hall"].trim;
  const mast = dark ? "#4A4F57" : "#6F6A5E";
  return (
    <View style={{ height: SKY, backgroundColor: sky, overflow: "hidden" }}>
      {dark ? (
        <>
          {[[0.08, 10], [0.2, 26], [0.34, 8], [0.46, 20], [0.6, 6], [0.72, 24], [0.9, 12]].map(([fx, y], k) => (
            <Star key={k} x={Math.round(fx * width)} y={y} twinkle={k % 2 === 0} delay={k * 400} />
          ))}
          {/* the moon: a disc, and the sky biting into it */}
          <View pointerEvents="none" style={{ position: "absolute", right: Math.round(width * 0.16), top: 8, width: 14, height: 14, borderRadius: 7, backgroundColor: "#E9E4D2" }} />
          <View pointerEvents="none" style={{ position: "absolute", right: Math.round(width * 0.16) - 5, top: 5, width: 14, height: 14, borderRadius: 7, backgroundColor: sky }} />
        </>
      ) : (
        <>
          {/* the sun, and two clouds going nowhere */}
          <View pointerEvents="none" style={{ position: "absolute", right: Math.round(width * 0.18), top: 8, width: 16, height: 16, borderRadius: 8, backgroundColor: "#E0B84E" }} />
          <View pointerEvents="none" style={{ position: "absolute", right: Math.round(width * 0.18) + 2, top: 10, width: 12, height: 12, borderRadius: 6, backgroundColor: LIT }} />
          <Cloud x={Math.round(width * 0.12)} y={12} />
          <Cloud x={Math.round(width * 0.55)} y={20} small />
        </>
      )}
      {/* the antenna on the left, with its red light */}
      <Px x={26} y={SKY - 26} w={2} h={26} c={mast} />
      <Px x={22} y={SKY - 18} w={10} h={2} c={mast} />
      <Px x={23} y={SKY - 10} w={8} h={2} c={mast} />
      <Beacon x={25} y={SKY - 30} />
      {/* the water tank on the right, on its legs */}
      <Px x={width - 66} y={SKY - 22} w={26} h={14} c={dark ? "#3C4147" : "#7E7668"} />
      <Px x={width - 66} y={SKY - 22} w={26} h={2} c={dark ? "#4E545B" : "#948B7B"} />
      <Px x={width - 66} y={SKY - 14} w={26} h={2} c={dark ? "#2B2F34" : "#6F6A5E"} />
      <Px x={width - 62} y={SKY - 8} w={3} h={8} c={dark ? "#2B2F34" : trim} />
      <Px x={width - 47} y={SKY - 8} w={3} h={8} c={dark ? "#2B2F34" : trim} />
      <Px x={width - 56} y={SKY - 26} w={6} h={4} c={dark ? "#4E545B" : "#948B7B"} />
    </View>
  );
}

function Star({ x, y, twinkle, delay }: { x: number; y: number; twinkle: boolean; delay: number }) {
  const reduced = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduced || !twinkle) return;
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(0.25, { duration: 1400, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) })), -1, false));
    return () => cancelAnimation(o);
  }, [reduced, twinkle, delay, o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View pointerEvents="none" style={[{ position: "absolute", left: x, top: y, width: 2, height: 2, backgroundColor: "#F4F6F8" }, a]} />;
}

function Cloud({ x, y, small = false }: { x: number; y: number; small?: boolean }) {
  const c = "rgba(255,255,255,0.92)";
  const s = small ? 0.75 : 1;
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: x, top: y, width: 34 * s, height: 16 * s }}>
      <View style={{ position: "absolute", left: 0, top: 6 * s, width: 34 * s, height: 10 * s, borderRadius: 5 * s, backgroundColor: c }} />
      <View style={{ position: "absolute", left: 8 * s, top: 0, width: 14 * s, height: 14 * s, borderRadius: 7 * s, backgroundColor: c }} />
      <View style={{ position: "absolute", left: 18 * s, top: 3 * s, width: 12 * s, height: 12 * s, borderRadius: 6 * s, backgroundColor: c }} />
    </View>
  );
}

/** The red light on the mast, blinking the way they do. */
function Beacon({ x, y }: { x: number; y: number }) {
  const reduced = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    o.value = withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0.15, { duration: 120 }), withTiming(0.15, { duration: 700 }), withTiming(1, { duration: 120 })), -1, false);
    return () => cancelAnimation(o);
  }, [reduced, o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View pointerEvents="none" style={[{ position: "absolute", left: x, top: y, width: 4, height: 4, backgroundColor: "#E8665A" }, a]} />;
}

/* ----------------------------------------------------------------- the rooms */

/** The pendant over the middle of the room: a cord, a shade, a bulb; lit only where you are. */
function Pendant({ x, lit, dark }: { x: number; lit: boolean; dark: boolean }) {
  const shade = dark ? "#2B2F34" : "#5C564A";
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: x - 10, top: 0, width: 20, height: 26 }}>
      <Px x={9} y={0} w={2} h={12} c={shade} />
      <Px x={4} y={12} w={12} h={2} c={shade} />
      <Px x={2} y={14} w={16} h={4} c={shade} />
      <Px x={0} y={18} w={20} h={2} c={shade} />
      <Px x={7} y={20} w={6} h={4} c={lit ? LIT : dark ? "#3C4147" : "#B9B2A4"} />
      {lit ? <Px x={8} y={24} w={4} h={2} c="rgba(243,211,122,0.5)" /> : null}
    </View>
  );
}

/** The warm light the pendant throws, breathing slowly. */
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
      <Glow color={color} x={0.5} y={0.3} r={0.62} strength={0.55} />
    </Animated.View>
  );
}

/** A window in the back wall, onto whatever the sky is doing. */
function Window({ x, y, dark, dim }: { x: number; y: number; dark: boolean; dim: boolean }) {
  const frame = dark ? "#4A4F57" : "#8A8272";
  const pane = dark ? "#16203A" : "#D6E8F5";
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: x - 16, top: y, width: 32, height: 28, backgroundColor: frame, opacity: dim ? 0.5 : 1 }}>
      <Px x={2} y={2} w={13} h={11} c={pane} />
      <Px x={17} y={2} w={13} h={11} c={pane} />
      <Px x={2} y={15} w={13} h={11} c={pane} />
      <Px x={17} y={15} w={13} h={11} c={pane} />
      {dark ? <Px x={6} y={5} w={2} h={2} c="#F4F6F8" /> : <Px x={20} y={18} w={8} h={3} c="rgba(255,255,255,0.8)" />}
      {/* the sill */}
      <Px x={-2} y={28} w={36} h={3} c={dark ? "#565C64" : "#6F6A5E"} />
    </View>
  );
}

/** What a coach says when tapped, with the door to a chat. */
function Bubble({ text, ask, onAsk, left, right, bottom }: { text: string; ask?: string; onAsk?: () => void; left?: number; right?: number; bottom: number }) {
  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(140)} style={{ position: "absolute", left, right, bottom, maxWidth: 210, zIndex: 5 }}>
      <Pressable onPress={onAsk} disabled={!onAsk} accessibilityRole={onAsk ? "button" : undefined} accessibilityLabel={onAsk ? `${text} ${ask}` : text} style={{ backgroundColor: "#F4F6F8", borderRadius: 12, borderBottomLeftRadius: left !== undefined ? 3 : 12, borderBottomRightRadius: right !== undefined ? 3 : 12, paddingHorizontal: 10, paddingVertical: 7, gap: 2, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 }}>
        <Spec style={{ color: "#101418" }}>{text}</Spec>
        {ask ? <Spec style={{ color: "#BE241B" }}>{`${ask} →`}</Spec> : null}
      </Pressable>
    </Animated.View>
  );
}

/** A member of staff: taps to say their line; an emote pops over their head. */
function Staff({ s, x, dim, hailed, onHail }: { s: BuildingStaff; x: number; dim: boolean; hailed: boolean; onHail: () => void }) {
  const id = `avatar-outfit${s.look.outfit % 8}-down-0` as SpriteId;
  return (
    <Pressable onPress={onHail} accessibilityRole="button" accessibilityLabel={`${s.name}. Tap for a word`} hitSlop={6} style={{ position: "absolute", left: x, bottom: FLOOR - 6, opacity: dim ? 0.5 : 1 }}>
      <View pointerEvents="none" style={{ position: "absolute", left: -5, right: -5, bottom: -3, height: 7, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.25)" }} />
      <Sprite id={id} scale={SCALE} />
      {hailed ? (
        <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(120)} pointerEvents="none" style={{ position: "absolute", left: KEEPER_W - 6, top: -14 }}>
          <Sprite id="emote-wave" scale={2} />
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

function Room({ r, i, width, here, last, dark, staff, hail, onHail, onPress, onTask }: { r: BuildingRoom; i: number; width: number; here: boolean; last: boolean; dark: boolean; staff: BuildingStaff[]; hail: number | null; onHail: (k: number) => void; onPress: () => void; onTask?: (k: number) => void }) {
  const signLeft = i % 2 === 0;
  const f = art.floors["main-hall"];
  const wallTone = r.locked ? (dark ? "#23262A" : "#B9BCC0") : rgba(r.color, dark ? 0.5 : 0.34);
  const wallBase = dark ? "#33373C" : "#E9E4D8";
  const furn = FURNITURE[i % FURNITURE.length];
  /** Fractions of the width, mirrored when the sign hangs on the right. */
  const at = (fx: number) => Math.round((signLeft ? fx : 1 - fx) * width);
  const lowMeta = spriteMeta(furn.low);
  const lowScale = lowMeta.w > 40 ? 1 : SCALE;
  const tallMeta = spriteMeta(furn.tall);
  const tallScale = tallMeta.w > 40 ? 1 : SCALE;
  const windows = r.locked ? [] : r.tasks;
  return (
    <View style={{ position: "absolute", left: 0, right: 0, top: i * (H + GAP), height: H + (last ? 0 : GAP) }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${r.name}, ${r.locked ? "locked" : r.done ? "done" : r.tasks.length ? `${r.tasks.filter((t) => t.done).length} of ${r.tasks.length} tasks` : r.meta}${here ? ", you are here" : ""}`} style={({ pressed }) => ({ height: H, overflow: "hidden", backgroundColor: wallBase, opacity: pressed ? 0.92 : 1 })}>
        {/* the wall, painted in the room's colour; the ceiling, the picture rail, the wainscot */}
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: FLOOR, backgroundColor: wallTone }} />
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 3, backgroundColor: "rgba(0,0,0,0.2)" }} />
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 22, height: 1, backgroundColor: "rgba(0,0,0,0.12)" }} />
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: FLOOR, height: 14, backgroundColor: "rgba(0,0,0,0.1)", borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.14)" }} />
        {here && !r.locked ? <Lamp color={r.color} /> : null}
        <Window x={at(0.53)} y={26} dark={dark} dim={r.locked} />
        <Pendant x={at(0.5)} lit={here && !r.locked} dark={dark} />
        <Backdrop hall="main-hall" floorH={FLOOR} scale={SCALE} width={width} />
        {/* the rug, across from the sign, where the coach stands */}
        <View pointerEvents="none" style={{ position: "absolute", left: at(0.72) - Math.round(width * 0.17), bottom: FLOOR - 18, width: Math.round(width * 0.34), height: 14, backgroundColor: rgba(r.color, dark ? 0.55 : 0.5), borderWidth: 2, borderColor: rgba(r.color, dark ? 0.8 : 0.7) }} />
        {r.locked ? <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: dark ? "rgba(0,0,0,0.55)" : "rgba(40,44,48,0.3)" }} /> : null}

        {/* furniture, standing on the floor: the tall piece at the back, the low piece under the sign */}
        <View pointerEvents="none" style={{ position: "absolute", left: at(0.76) - (tallMeta.w * tallScale) / 2, bottom: FLOOR - 8 * tallScale, opacity: r.locked ? 0.4 : 1 }}>
          <Sprite id={furn.tall} scale={tallScale as 1 | 2} />
        </View>
        <View pointerEvents="none" style={{ position: "absolute", left: at(0.18) - (lowMeta.w * lowScale) / 2, bottom: FLOOR - 8 * lowScale, opacity: r.locked ? 0.4 : 1 }}>
          <Sprite id={furn.low} scale={lowScale as 1 | 2} />
        </View>

        {/* the staff who work here */}
        {staff.map((s, k) => (
          <Staff key={s.name} s={s} x={staffX(i, k, width)} dim={r.locked} hailed={hail === k} onHail={() => onHail(k)} />
        ))}

        {/* the sign, hung from the ceiling on two chains; its windows open the tasks */}
        <View pointerEvents="box-none" style={{ position: "absolute", top: 0, [signLeft ? "left" : "right"]: 14, alignItems: signLeft ? "flex-start" : "flex-end", maxWidth: Math.round(width * 0.44) }}>
          <View pointerEvents="none" style={{ flexDirection: "row", gap: 46, marginLeft: 10 }}>
            <View style={{ width: 2, height: 10, backgroundColor: rgba(f.trim, 0.7) }} />
            <View style={{ width: 2, height: 10, backgroundColor: rgba(f.trim, 0.7) }} />
          </View>
          <View pointerEvents="box-none" style={{ backgroundColor: r.locked ? "#3C4147" : r.done ? r.color : SIGN_BG, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7, gap: 5, minWidth: 104, shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 }}>
            <View pointerEvents="none" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <PixelIcon id={r.locked ? "lock" : r.done ? "stamp" : (r.glyph as PixelIconId)} color={r.locked ? SIGN_QUIET : r.done ? "#BE241B" : SIGN_TEXT} size={16} flat={!r.done} />
              <Signage style={{ color: SIGN_TEXT, flexShrink: 1 }}>{`${i + 1} · ${r.name}`}</Signage>
            </View>
            {r.locked ? (
              <Spec style={{ color: SIGN_QUIET }}>with the coaches</Spec>
            ) : windows.length ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                {windows.map((t, k) => (
                  <Pressable key={k} onPress={onTask ? () => onTask(k) : onPress} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${t.done ? "Done: " : "Open task: "}${t.text}`} style={({ pressed }) => ({ width: 13, height: 13, borderRadius: 2, backgroundColor: t.done ? LIT : "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: t.done ? LIT : "rgba(255,255,255,0.45)", opacity: pressed ? 0.6 : 1 })}>
                    {t.done ? <View pointerEvents="none" style={{ position: "absolute", left: 2, top: 2, width: 3, height: 3, backgroundColor: "rgba(255,255,255,0.7)" }} /> : null}
                  </Pressable>
                ))}
                <Spec style={{ color: SIGN_QUIET, marginLeft: 3 }}>{r.week ?? ""}</Spec>
              </View>
            ) : (
              <Spec style={{ color: SIGN_QUIET }}>{r.done ? "done" : r.meta}</Spec>
            )}
          </View>
        </View>

        {/* the room's number on a brass plate beside the door */}
        {!last ? (
          <View pointerEvents="none" style={{ position: "absolute", bottom: FLOOR + 48, [signLeft ? "right" : "left"]: 26, backgroundColor: dark ? "#8A7A4E" : "#B99A4A", borderWidth: 1, borderColor: dark ? "#5E5334" : "#8A7233", paddingHorizontal: 3, paddingVertical: 1 }}>
            <Spec style={{ color: "#1A1408", fontSize: 9, lineHeight: 11 }}>{`${i + 1}F`}</Spec>
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
            {[32, 24, 16, 8].map((wd, k) => (
              <View key={k} style={{ width: wd, height: GAP / 4, backgroundColor: rgba(f.trim, dark ? 0.95 : 0.8), borderTopWidth: 1, borderTopColor: rgba(f.a, dark ? 0.35 : 0.8), alignSelf: signLeft ? "flex-end" : "flex-start" }} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

/* ---------------------------------------------------------------- the founder */

/** The founder, standing in their room under a red pin; walks down the stairs when `here` moves; jumps and waves when tapped. */
function Keeper({ look, here, width, say }: { look: Look; here: number; width: number; say?: string }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  const bob = useSharedValue(0);
  const jump = useSharedValue(0);
  const pinY = useSharedValue(0);
  const [walking, setWalking] = useState(false);
  const [wave, setWave] = useState(false);
  const prev = useRef(here);
  const topFor = (i: number) => i * (H + GAP) + H - FLOOR + 8 - KEEPER_H;
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
      pinY.value = reduced ? 0 : withRepeat(withSequence(withTiming(-3, { duration: 600, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 600, easing: Easing.inOut(Easing.quad) })), -1, false);
      return () => {
        cancelAnimation(bob);
        cancelAnimation(pinY);
      };
    }
    cancelAnimation(bob);
    cancelAnimation(pinY);
    bob.value = 0;
    pinY.value = 0;
  }, [walking, reduced, bob, pinY]);
  useEffect(() => {
    if (!wave) return;
    const t = setTimeout(() => setWave(false), say ? 2600 : 1400);
    return () => clearTimeout(t);
  }, [wave, say]);
  const hop = () => {
    setWave(true);
    if (reduced) return;
    jump.value = withSequence(withTiming(-12, { duration: 140, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 12, stiffness: 240 }));
  };
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value + bob.value + jump.value }] }));
  const pin = useAnimatedStyle(() => ({ transform: [{ translateY: pinY.value }] }));
  const x = Math.round(width * 0.5 - KEEPER_W / 2);
  const ids = [0, 1, 2].map((k) => `avatar-outfit${look.outfit % 8}-down-${k}` as SpriteId);
  return (
    <Animated.View style={[{ position: "absolute", left: x, top: 0, width: KEEPER_W, height: KEEPER_H }, style]}>
      <View pointerEvents="none" style={{ position: "absolute", left: -6, right: -6, bottom: -3, height: 8, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.28)" }} />
      {/* the pin: you are here */}
      {!walking && !(wave && say) ? (
        <Animated.View pointerEvents="none" style={[{ position: "absolute", left: KEEPER_W / 2 - 8, top: -22 }, pin]}>
          <PixelIcon id="pin" color="#E8665A" size={16} accessibilityLabel="You are here" />
        </Animated.View>
      ) : null}
      <Pressable onPress={hop} accessibilityRole="button" accessibilityLabel="You. Tap to wave" hitSlop={8}>
        <SpriteCycle ids={ids} playing={walking} period={150} scale={SCALE} />
      </Pressable>
      {wave ? (
        <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(140)} pointerEvents="none" style={{ position: "absolute", left: KEEPER_W - 4, top: -8 }}>
          <Sprite id="emote-wave" scale={2} />
        </Animated.View>
      ) : null}
      {wave && say ? (
        <View pointerEvents="none" style={{ position: "absolute", left: KEEPER_W / 2, bottom: KEEPER_H + 10, width: 0, alignItems: "center" }}>
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(140)} style={{ width: 200, alignItems: "center" }}>
            <View style={{ backgroundColor: "#F4F6F8", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 }}>
              <Spec style={{ color: "#101418", textAlign: "center" }}>{say}</Spec>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </Animated.View>
  );
}

/* ----------------------------------------------------------------- the street */

/** Someone walking past on the pavement. */
function Passer({ outfit, from, to, seconds, delay = 0, width }: { outfit: number; from: number; to: number; seconds: number; delay?: number; width: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  const dir = to > from ? "right" : "left";
  useEffect(() => {
    if (reduced) {
      t.value = 0.5;
      return;
    }
    cancelAnimation(t);
    t.value = 0;
    t.value = withDelay(delay * 1000, withRepeat(withSequence(withTiming(1, { duration: seconds * 1000, easing: Easing.linear }), withTiming(0, { duration: 0 })), -1, false));
    return () => cancelAnimation(t);
  }, [reduced, t, seconds, delay]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: (from + (to - from) * t.value) * width }] }));
  const ids = [0, 1, 2].map((k) => `avatar-outfit${outfit % 8}-${dir}-${k}` as SpriteId);
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: -KEEPER_W / 2, bottom: 5, opacity: 0.92 }, style]}>
      <SpriteCycle ids={ids} playing={!reduced} period={180} scale={SCALE} />
    </Animated.View>
  );
}

function Street({ width, dark, ground }: { width: number; dark: boolean; ground: string }) {
  const trim = art.floors["main-hall"].trim;
  const doorW = 36;
  const doorX = Math.round(width / 2 - doorW / 2);
  const leaf = dark ? "#5A4632" : "#7A5C3A";
  const leafLine = dark ? "#3E3022" : "#5A4229";
  return (
    <View style={{ height: STREET, position: "relative", overflow: "hidden", backgroundColor: ground }}>
      <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 4, backgroundColor: rgba(trim, dark ? 0.95 : 0.8) }} />
      <Backdrop hall="main-hall" floorH={STREET - 4} scale={SCALE} width={width} wall={false} />
      {/* the front door: two leaves with a lit pane each, a mat, and the striped awning over it */}
      <View pointerEvents="none" style={{ position: "absolute", left: doorX - 4, top: 4, width: doorW + 8, height: 46, backgroundColor: dark ? "#0B0E12" : "#3A342C", borderWidth: 3, borderBottomWidth: 0, borderColor: rgba(trim, 0.9) }} />
      <View pointerEvents="none" style={{ position: "absolute", left: doorX, top: 10, width: doorW / 2 - 1, height: 40, backgroundColor: leaf, borderWidth: 1, borderColor: leafLine }}>
        <Px x={4} y={4} w={8} h={10} c={dark ? LIT : "#D6E8F5"} />
        <Px x={4} y={20} w={8} h={12} c={leafLine} />
        <Px x={13} y={18} w={2} h={2} c="#B99A4A" />
      </View>
      <View pointerEvents="none" style={{ position: "absolute", left: doorX + doorW / 2 + 1, top: 10, width: doorW / 2 - 1, height: 40, backgroundColor: leaf, borderWidth: 1, borderColor: leafLine }}>
        <Px x={4} y={4} w={8} h={10} c={dark ? LIT : "#D6E8F5"} />
        <Px x={4} y={20} w={8} h={12} c={leafLine} />
        <Px x={1} y={18} w={2} h={2} c="#B99A4A" />
      </View>
      <View pointerEvents="none" style={{ position: "absolute", left: doorX - 6, top: 50, width: doorW + 12, height: 5, backgroundColor: "#7A2E22" }} />
      <View pointerEvents="none" style={{ position: "absolute", left: doorX - 12, top: 2, width: doorW + 24, height: 10, flexDirection: "row", overflow: "hidden" }}>
        {Array.from({ length: Math.ceil((doorW + 24) / 6) }).map((_, k) => (
          <View key={k} style={{ width: 6, height: 10, backgroundColor: k % 2 ? "#F4F6F8" : "#BE241B" }} />
        ))}
      </View>
      {/* the plate by the door */}
      <View pointerEvents="none" style={{ position: "absolute", left: doorX + doorW + 10, top: 16, backgroundColor: dark ? "#8A7A4E" : "#B99A4A", borderWidth: 1, borderColor: dark ? "#5E5334" : "#8A7233", paddingHorizontal: 4, paddingVertical: 1 }}>
        <Spec style={{ color: "#1A1408", fontSize: 9, lineHeight: 11 }}>Main hall</Spec>
      </View>
      <View pointerEvents="none" style={{ position: "absolute", left: Math.round(width * 0.08), bottom: 6 }}>
        <Sprite id="prop-lamp" scale={1} />
      </View>
      <View pointerEvents="none" style={{ position: "absolute", right: Math.round(width * 0.06), bottom: 8 }}>
        <Sprite id="prop-planter" scale={1} />
      </View>
      {dark ? <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.38)" }} /> : null}
      {/* the lamp's pool of light on the pavement, by night */}
      {dark ? (
        <View pointerEvents="none" style={{ position: "absolute", left: Math.round(width * 0.08) - 10, bottom: 0, width: 52, height: 30 }}>
          <Glow color={LIT} x={0.5} y={0.4} r={0.6} strength={0.35} />
        </View>
      ) : null}
      <Passer outfit={3} from={-0.15} to={1.15} seconds={22} width={width} />
      <Passer outfit={6} from={1.15} to={-0.15} seconds={30} delay={11} width={width} />
    </View>
  );
}
