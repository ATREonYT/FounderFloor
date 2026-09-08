/**
 * The tour's overlay: a dark scrim in four pieces around the current
 * target, so the target itself stays live and receives the tap; a soft
 * ring around it; and a callout from the keeper saying what to do, above
 * or below the target, whichever has room. Message-only steps show the
 * callout centred with a button.
 */
import { useEffect, useState } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { usePathname, useRouter, type Href } from "expo-router";
import { Body, Button, Keeper, Spec, radius, shell } from "@founderfloor/ui";
import { RECEPTIONIST } from "../lib/mock";
import { TOUR, useTour } from "../lib/tour";
import { useFounder } from "../lib/store";

const SCRIM = "rgba(8,10,14,0.62)";
/** The hole view's border: wide enough to cover any screen from any target. */
const BIG = 4000;
/** The corner radius of each target's own shape, so the hole hugs it. */
const RADIUS: Record<string, number> = { map: 20, tabs: 999, "home-next": 16, "stand-numbers": 12, "office-log": 12 };
const radiusOf = (id: string | null) => (id ? RADIUS[id] ?? 16 : 16);

export function TourOverlay() {
  const { width: W, height: H } = useWindowDimensions();
  const router = useRouter();
  const path = usePathname();
  const active = useTour((s) => s.active);
  const step = useTour((s) => s.step);
  const targets = useTour((s) => s.targets);
  const routed = useTour((s) => s.routed);
  const next = useTour((s) => s.next);
  const stop = useTour((s) => s.stop);
  const then = useTour((s) => s.then);
  const setGuided = useFounder((s) => s.setGuided);
  const [calloutH, setCalloutH] = useState(160);
  useEffect(() => {
    if (active) routed(path);
  }, [path, active, routed]);
  if (!active) return null;
  const cur = TOUR[step];
  const rect = cur.target ? targets[cur.target] : undefined;
  const last = step === TOUR.length - 1;
  const finish = () => {
    setGuided();
    stop();
    if (then) router.push(then as Href);
  };
  const pad = 8;
  const r = rect ? { x: Math.max(0, rect.x - pad), y: Math.max(0, rect.y - pad), w: rect.w + pad * 2, h: rect.h + pad * 2 } : null;
  const below = r ? r.y + r.h + calloutH + 24 < H : false;
  const calloutTop = r ? (below ? r.y + r.h + 14 : Math.max(60, r.y - 12 - calloutH)) : H * 0.34;
  const waitingOnModal = cur.id === "room";
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 0, top: 0, width: W, height: H }}>
      {/* the scrim: four invisible blockers around the target keep taps off the rest of the screen,
          and one view with an enormous border paints the dark with a rounded hole exactly the target's shape */}
      {r ? (
        <>
          <View style={{ position: "absolute", left: 0, top: 0, width: W, height: r.y }} />
          <View style={{ position: "absolute", left: 0, top: r.y + r.h, width: W, height: Math.max(0, H - r.y - r.h) }} />
          <View style={{ position: "absolute", left: 0, top: r.y, width: r.x, height: r.h }} />
          <View style={{ position: "absolute", left: r.x + r.w, top: r.y, width: Math.max(0, W - r.x - r.w), height: r.h }} />
          <Animated.View key={`hole-${cur.id}`} entering={FadeIn.duration(200)} pointerEvents="none" style={{ position: "absolute", left: r.x - BIG, top: r.y - BIG, width: r.w + BIG * 2, height: r.h + BIG * 2, borderWidth: BIG, borderColor: SCRIM, borderRadius: BIG + radiusOf(cur.target) }} />
          <Animated.View key={`ring-${cur.id}`} entering={FadeIn.duration(220)} pointerEvents="none" style={{ position: "absolute", left: r.x - 3, top: r.y - 3, width: r.w + 6, height: r.h + 6, borderRadius: radiusOf(cur.target) + 3, borderWidth: 3, borderColor: shell.accentLift }} />
        </>
      ) : !waitingOnModal ? (
        <View style={{ position: "absolute", left: 0, top: 0, width: W, height: H, backgroundColor: SCRIM }} />
      ) : null}
      {!waitingOnModal ? (
        <Animated.View key={`c-${cur.id}`} entering={FadeIn.duration(240)} exiting={FadeOut.duration(120)} pointerEvents="box-none" onLayout={(e) => setCalloutH(Math.round(e.nativeEvent.layout.height))} style={{ position: "absolute", left: 16, right: 16, top: calloutTop }}>
          <View style={{ backgroundColor: shell.panel, borderRadius: radius.xl, padding: 14, gap: 10, borderWidth: 1, borderColor: shell.line, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <Keeper look={RECEPTIONIST.look} scale={1} color={RECEPTIONIST.color} speaking />
              <View style={{ flex: 1, gap: 4 }}>
                <Spec tone="muted">{`The tour · ${step + 1} of ${TOUR.length}`}</Spec>
                <Body>{cur.say}</Body>
              </View>
              <Pressable onPress={finish} accessibilityRole="button" accessibilityLabel="Leave the tour" hitSlop={8} style={({ pressed }) => ({ width: 30, height: 30, borderRadius: 15, backgroundColor: pressed ? shell.line : shell.well, alignItems: "center", justifyContent: "center" })}>
                <Body medium>×</Body>
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {last || !cur.target ? (
                <Button size="sm" arrow onPress={last ? finish : next}>
                  {last ? (then ? "Start with the first idea" : "Done") : "Next"}
                </Button>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: shell.accent }} />
                  <Spec tone="accent">{cur.route ? `Tap ${cur.tab} in the bar below` : "Tap the lit part to continue"}</Spec>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
