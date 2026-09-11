/**
 * The road, drawn as a stamp card. Seven stops down a dotted path in one
 * ink; a stop that is done carries a red seal, stamped a little askew the
 * way a real one lands; the stop you are at has your own keeper standing
 * on it; the stops ahead are empty slots with their number. No colour per
 * stop, no coloured rings: one ink, one red, and a person. Three sizes:
 * the whole road on Today (the stop to do now opened up with its line and
 * its key), a strip on You, and a line on any page saying which stop it
 * belongs to. All three say the same seven words.
 *
 * Motion: the seal lands on a spring when a stop is done while you watch;
 * the opened stop unfolds in 220 ms and the rows below make room; the
 * keeper breathes. Nothing moves on the page's own arrival.
 */
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, { Easing, FadeIn, LinearTransition, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useRouter, type Href } from "expo-router";
import { stopOf, type RoadStop, type StopId } from "@founderfloor/shared";
import { Body, Button, Mono, PixelIcon, Plate, Spec, Sprite, Stamp, alpha, radius, shell, type Look, type SpriteId } from "@founderfloor/ui";
import { useRoad } from "../lib/road";
import { useStand } from "../lib/stand";

const OUT = Easing.bezier(0.23, 1, 0.32, 1);

/** An empty slot on the card: a dotted ring with the stop's number. */
function Slot({ n, size, strong = false }: { n: number; size: number; strong?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderStyle: "dotted", borderColor: strong ? shell.ink : alpha.hairline(), alignItems: "center", justifyContent: "center" }}>
      <Mono size="xs" tone={strong ? "ink" : "faint"}>{String(n)}</Mono>
    </View>
  );
}

/** Your keeper, standing on the stop you are at, breathing. */
function Here({ look, scale = 1 }: { look: Look; scale?: 1 | 2 }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    y.value = withRepeat(withSequence(withTiming(-1.5, { duration: 900, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })), -1, false);
  }, [reduced, y]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const id = `avatar-outfit${look.outfit % 8}-down-0` as SpriteId;
  return (
    <View style={{ width: 20 * scale, height: 28 * scale, alignItems: "center", justifyContent: "flex-end" }}>
      <View pointerEvents="none" style={{ position: "absolute", left: -3, right: -3, bottom: -2, height: 6, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.35)" }} />
      <Animated.View style={a}>
        <Sprite id={id} scale={scale} />
      </Animated.View>
    </View>
  );
}

/** The mark for one stop: a seal, your keeper, or an empty slot. */
function Mark({ stop, look, size = 30 }: { stop: RoadStop; look: Look; size?: number }) {
  if (stop.state === "done") return <Stamp on size={size} />;
  if (stop.state === "now") return <Here look={look} />;
  return <Slot n={stop.n} size={size} />;
}

/** The dotted path between two stops, in ink where it has been walked. */
function Path({ walked, height, flex = false }: { walked: boolean; height?: number; flex?: boolean }) {
  return <View style={{ width: 0, height, flex: flex ? 1 : undefined, minHeight: flex ? 6 : undefined, borderLeftWidth: 2, borderStyle: "dotted", borderColor: walked ? shell.accent : alpha.hairline() }} />;
}

/** The whole road: Today's card. */
export function Road() {
  const router = useRouter();
  const road = useRoad();
  const look = useStand().look;
  return (
    <Plate tone="panel" radius={radius.xl} padding={0}>
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Body medium>The road</Body>
        <Spec tone="faint">{`Stop ${road.now.n} of 7`}</Spec>
      </View>
      <Animated.View layout={LinearTransition.duration(220).easing(OUT)} style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
        {road.stops.map((s, i) => {
          const on = s.state === "now";
          const last = i === road.stops.length - 1;
          return (
            <Animated.View key={s.id} layout={LinearTransition.duration(220).easing(OUT)}>
              <Pressable onPress={() => router.push(s.route as Href)} accessibilityRole="button" accessibilityLabel={`Stop ${s.n}: ${s.title}${s.state === "done" ? ", done" : on ? ", you are here" : ""}`} style={({ pressed }) => ({ flexDirection: "row", gap: 12, opacity: pressed ? 0.85 : 1 })}>
                <View style={{ width: 32, alignItems: "center" }}>
                  <Path walked={s.state === "done" || on} height={i === 0 ? 6 : 10} />
                  <Mark stop={s} look={look} />
                  <Path walked={s.state === "done"} flex={!last} height={last ? 6 : undefined} />
                </View>
                <View style={{ flex: 1, minWidth: 0, paddingTop: on ? 8 : 10, paddingBottom: on ? 12 : 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Body size={on ? "base" : "sm"} medium tone={s.state === "next" ? "muted" : "ink"} style={{ flex: 1 }}>
                      {s.title}
                    </Body>
                    {s.progress ? <Spec tone="faint">{s.progress}</Spec> : null}
                    {s.state === "done" ? <Spec tone="faint">Done</Spec> : null}
                    <Body tone={on ? "accent" : "muted"} accessibilityElementsHidden importantForAccessibility="no">›</Body>
                  </View>
                  {on ? (
                    <Animated.View entering={FadeIn.duration(220).easing(OUT)} style={{ marginTop: 6, gap: 8, backgroundColor: alpha.wellFill(), borderWidth: 1, borderColor: alpha.hairline(), borderRadius: radius.md, padding: 12 }}>
                      <Body size="sm">{s.child}</Body>
                      <Spec tone="muted">{s.why}</Spec>
                      <Button block onPress={() => router.push(s.route as Href)}>
                        {s.go}
                      </Button>
                    </Animated.View>
                  ) : null}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>
    </Plate>
  );
}

/** The strip: seven slots and where you are, for the top of You. */
export function RoadStrip() {
  const router = useRouter();
  const road = useRoad();
  return (
    <Pressable onPress={() => router.push(road.now.route as Href)} accessibilityRole="button" accessibilityLabel={`The road: stop ${road.now.n} of 7, ${road.now.title}`}>
      <Plate tone="panel" radius={radius.xl} padding={14}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {road.stops.map((s, i) => [
            s.state === "done" ? <Stamp key={s.id} on size={24} /> : <Slot key={s.id} n={s.n} size={24} strong={s.state === "now"} />,
            i < road.stops.length - 1 ? <View key={`${s.id}-line`} style={{ flex: 1, height: 0, marginHorizontal: 3, borderTopWidth: 2, borderStyle: "dotted", borderColor: s.state === "done" ? shell.accent : alpha.hairline() }} /> : null,
          ])}
        </View>
        <Body size="sm" medium style={{ marginTop: 10 }}>{`Stop ${road.now.n} of 7: ${road.now.title}`}</Body>
        <Spec tone="faint" style={{ marginTop: 2 }}>{road.now.child}</Spec>
        <Spec tone="accent" style={{ marginTop: 6 }}>{`${road.now.go}`}</Spec>
      </Plate>
    </Pressable>
  );
}

/** One line on a page: which stop it belongs to. Tap it for the whole road on Today. */
export function StopLine({ id, label }: { id: StopId; label?: string }) {
  const router = useRouter();
  const stop = stopOf(id);
  return (
    <Pressable onPress={() => router.push("/today" as Href)} accessibilityRole="button" accessibilityLabel={`Stop ${stop.n} of 7: ${stop.title}. Open the road`} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, opacity: pressed ? 0.7 : 1 })}>
      <PixelIcon id="flag" color={shell.muted} size={12} flat />
      <Spec tone="muted">{`${label ? `${label}: ` : ""}stop ${stop.n} of 7`}</Spec>
    </Pressable>
  );
}
