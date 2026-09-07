/**
 * THE PATH — the map, in the shape people already know from Duolingo: a
 * road of round buttons that snakes down the screen, one button per thing
 * to do, grouped under a banner per room. Done buttons wear the room's
 * colour and a star; the next one to do has a pulsing ring and a small
 * "next" flag; rooms past the gate are grey with a lock. The founder's
 * keeper stands beside the button they are on, and hall props stand in
 * the bends. No lines: the buttons are the road.
 *
 * Tapping a button asks the screen to show its card; the screen owns what
 * "done" means. NEW: not on the site.
 */
import { useEffect, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Sprite, type SpriteId } from "./Sprite";
import { Body, Spec } from "./Text";
import { Glyph } from "./Scene";
import { shell } from "./tokens";
import { scheme } from "./theme";
import type { Look } from "./Keeper";

export interface PathItem {
  id: string;
  text: string;
  done: boolean;
}
export interface PathUnit {
  id: string;
  n: number;
  name: string;
  color: string;
  locked: boolean;
  items: PathItem[];
}

const NODE = 66;
const ROW = 92;
const SWING = [0, -1, -2, -1, 0, 1, 2, 1];
const AMP = 46;
const PROPS: SpriteId[] = ["prop-lamp", "prop-tree", "prop-planter", "prop-crates", "prop-bench", "prop-planter"];

/** A hex colour darkened for the button's edge. */
function edge(hex: string, k = 0.28): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = (v: number) => Math.max(0, Math.round(v * (1 - k)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

export function Journey({
  units,
  hereId,
  look,
  picked,
  onPick,
  onOpenUnit,
  card,
}: {
  units: PathUnit[];
  /** The item to do next: gets the ring, the flag and the keeper. */
  hereId: string | null;
  look: Look;
  /** The item whose card is open, if any. */
  picked: string | null;
  onPick: (item: PathItem, unit: PathUnit) => void;
  onOpenUnit: (unit: PathUnit) => void;
  /** Rendered under the picked button. */
  card?: ReactNode;
}) {
  const dark = scheme() === "dark";
  let k = 0; // running index across units, so the road keeps its curve past a banner
  return (
    <View style={{ gap: 4 }}>
      {units.map((u) => {
        const done = u.items.filter((i) => i.done).length;
        const rows = u.items.map((it) => {
          const x = SWING[k % SWING.length] * AMP;
          const prop = k % 3 === 1 ? PROPS[Math.floor(k / 3) % PROPS.length] : null;
          k++;
          return { it, x, prop };
        });
        return (
          <View key={u.id} style={{ gap: 4 }}>
            <Pressable onPress={() => onOpenUnit(u)} accessibilityRole="button" accessibilityLabel={`Room ${u.n}, ${u.name}${u.locked ? ", locked" : `, ${done} of ${u.items.length} done`}`}>
              <View style={{ backgroundColor: u.locked ? shell.well : u.color, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 4, borderBottomColor: u.locked ? shell.line : edge(u.color) }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Spec tone={u.locked ? "muted" : "paperQuiet"}>{`ROOM ${u.n} · ${done} OF ${u.items.length}`}</Spec>
                  <Body medium tone={u.locked ? "muted" : "paper"} size="lg">
                    {u.name}
                  </Body>
                </View>
                {u.locked ? <Lock /> : <Spec tone="paper">{done === u.items.length ? "done ✓" : "open →"}</Spec>}
              </View>
            </Pressable>
            {rows.map(({ it, x, prop }) => {
              const here = it.id === hereId;
              const open = it.id === picked;
              return (
                <View key={it.id}>
                  <View style={{ height: ROW, alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {prop ? (
                      <View pointerEvents="none" style={{ position: "absolute", left: x < 0 ? undefined : 18, right: x < 0 ? 18 : undefined, bottom: 8, opacity: 0.9 }}>
                        <Sprite id={prop} scale={1} />
                      </View>
                    ) : null}
                    {here ? (
                      <View pointerEvents="none" style={{ position: "absolute", top: ROW / 2 - 28 - 4, left: "50%", marginLeft: x + (x <= 0 ? NODE / 2 + 8 : -NODE / 2 - 8 - 40) }}>
                        <Sprite id={`avatar-outfit${look.outfit % 8}-${x <= 0 ? "left" : "right"}-0` as SpriteId} scale={2} />
                      </View>
                    ) : null}
                    <Node it={it} unit={u} here={here} open={open} x={x} dark={dark} onPress={() => onPick(it, u)} />
                  </View>
                  {open && card ? <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>{card}</View> : null}
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

function Node({ it, unit, here, open, x, dark, onPress }: { it: PathItem; unit: PathUnit; here: boolean; open: boolean; x: number; dark: boolean; onPress: () => void }) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(1);
  const press = useSharedValue(0);
  useEffect(() => {
    if (!here || reduced) return;
    pulse.value = withRepeat(withSequence(withTiming(1.14, { duration: 900, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) })), -1, false);
  }, [here, reduced, pulse]);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 2 - pulse.value }));
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: press.value * 5 }] }));
  const active = it.done || here;
  const fill = unit.locked ? shell.well : active ? unit.color : dark ? shell.panel : "#E4E8EE";
  const rim = unit.locked ? shell.line : active ? edge(unit.color) : dark ? shell.line : "#C5CBD3";
  return (
    <Pressable onPress={onPress} disabled={unit.locked} onPressIn={() => (press.value = withTiming(1, { duration: 60 }))} onPressOut={() => (press.value = withTiming(0, { duration: 90 }))} accessibilityRole="button" accessibilityLabel={`${it.text}${it.done ? ", done" : here ? ", next" : ""}`} accessibilityState={{ selected: open }} style={{ transform: [{ translateX: x }], width: NODE + 20, height: NODE + 20, alignItems: "center", justifyContent: "center" }}>
      {here ? <Animated.View pointerEvents="none" style={[{ position: "absolute", width: NODE + 14, height: NODE + 14, borderRadius: (NODE + 14) / 2, borderWidth: 3, borderColor: unit.color }, ring]} /> : null}
      {/* the edge: a darker disc under the face gives the button its 3D lift */}
      <View style={{ position: "absolute", top: 10 + 5, width: NODE, height: NODE, borderRadius: NODE / 2, backgroundColor: rim }} />
      <Animated.View style={[{ width: NODE, height: NODE, borderRadius: NODE / 2, backgroundColor: fill, alignItems: "center", justifyContent: "center", marginTop: -5 }, face]}>
        {unit.locked ? <Lock /> : it.done ? <Glyph id="star" tone="paper" scale={3} /> : here ? <Glyph id="bolt" tone="paper" scale={3} /> : <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: rim }} />}
      </Animated.View>
      {here && !open ? (
        <View pointerEvents="none" style={{ position: "absolute", top: -18, backgroundColor: shell.ink, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
          <Spec tone={dark ? "ink" : "paper"}>NEXT</Spec>
          <View style={{ position: "absolute", bottom: -5, left: "50%", marginLeft: -5, width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 5, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: shell.ink }} />
        </View>
      ) : null}
    </Pressable>
  );
}

function Lock() {
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: 12, height: 9, borderWidth: 2.5, borderBottomWidth: 0, borderColor: shell.muted, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
      <View style={{ width: 18, height: 13, borderRadius: 3, backgroundColor: shell.muted }} />
    </View>
  );
}
