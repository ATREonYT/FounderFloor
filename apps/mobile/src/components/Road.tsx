/**
 * The road, drawn. Three sizes: the whole road on Today (seven stops
 * down a line, the one to do now opened up with its line and a button),
 * a strip on You (seven dots and where you are), and a line on any page
 * (which stop this page belongs to). All three say the same seven words.
 */
import { Pressable, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { stopOf, type RoadStop, type StopId } from "@founderfloor/shared";
import { Body, Button, Plate, Sheen, Spec, radius, shell, wash } from "@founderfloor/ui";
import { STOP_LOOK, useRoad } from "../lib/road";

function Disc({ stop, size = 30 }: { stop: RoadStop; size?: number }) {
  const look = STOP_LOOK[stop.id];
  const on = stop.state === "now";
  const done = stop.state === "done";
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: done ? look.color : on ? shell.panel : "transparent", borderWidth: done ? 0 : 2, borderColor: on ? look.color : shell.line, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {done ? <Sheen strength={0.28} reach={0.5} /> : null}
      {done ? <Body tone="paper" medium style={{ fontSize: size * 0.5, lineHeight: size * 0.6 }}>✓</Body> : on ? <View style={{ width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2, backgroundColor: look.color }} /> : <Spec tone="faint" style={{ fontSize: 11, lineHeight: 13 }}>{String(stop.n)}</Spec>}
    </View>
  );
}

/** The whole road: Today's map of the journey. */
export function Road() {
  const router = useRouter();
  const road = useRoad();
  return (
    <Plate tone="panel" radius={radius.xl} padding={0}>
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Spec tone="muted">The road</Spec>
        <Spec tone="faint">{`Stop ${road.now.n} of 7 · ${road.done} done`}</Spec>
      </View>
      <View style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
        {road.stops.map((s, i) => {
          const look = STOP_LOOK[s.id];
          const on = s.state === "now";
          return (
            <Pressable key={s.id} onPress={() => router.push(s.route as Href)} accessibilityRole="button" accessibilityLabel={`Stop ${s.n}: ${s.title}`} style={({ pressed }) => ({ flexDirection: "row", gap: 12, opacity: pressed ? 0.85 : 1 })}>
              <View style={{ width: 30, alignItems: "center" }}>
                <View style={{ width: 2, height: i === 0 ? 6 : 10, backgroundColor: i === 0 ? "transparent" : s.state === "next" ? shell.line : look.color }} />
                <Disc stop={s} />
                <View style={{ width: 2, flex: 1, minHeight: 6, backgroundColor: i === road.stops.length - 1 ? "transparent" : s.state === "done" ? look.color : shell.line }} />
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
                  <View style={{ marginTop: 6, gap: 8, backgroundColor: wash(look.color, 0.08), borderRadius: radius.lg, padding: 12, overflow: "hidden" }}>
                    <Sheen strength={0.35} reach={0.4} />
                    <Body size="sm">{s.child}</Body>
                    <Spec tone="muted">{s.why}</Spec>
                    <Button block arrow onPress={() => router.push(s.route as Href)}>
                      {s.go}
                    </Button>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Plate>
  );
}

/** The strip: seven dots and where you are, for the top of You. */
export function RoadStrip() {
  const router = useRouter();
  const road = useRoad();
  return (
    <Pressable onPress={() => router.push(road.now.route as Href)} accessibilityRole="button" accessibilityLabel={`The road: stop ${road.now.n} of 7, ${road.now.title}`}>
      <Plate tone="panel" radius={radius.xl} padding={14}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {road.stops.map((s, i) => [
            <Disc key={s.id} stop={s} size={22} />,
            i < road.stops.length - 1 ? <View key={`${s.id}-line`} style={{ flex: 1, height: 2, marginHorizontal: 3, backgroundColor: s.state === "done" ? STOP_LOOK[s.id].color : shell.line }} /> : null,
          ])}
        </View>
        <Body size="sm" medium style={{ marginTop: 10 }}>{`Stop ${road.now.n} of 7 · ${road.now.title}`}</Body>
        <Spec tone="faint" style={{ marginTop: 2 }}>{road.now.child}</Spec>
        <Spec tone="accent" style={{ marginTop: 6 }}>{`${road.now.go} →`}</Spec>
      </Plate>
    </Pressable>
  );
}

/** One line on a page: which stop it belongs to. Tap it for the whole road on Today. */
export function StopLine({ id, label }: { id: StopId; label?: string }) {
  const router = useRouter();
  const stop = stopOf(id);
  const look = STOP_LOOK[id];
  return (
    <Pressable onPress={() => router.push("/today" as Href)} accessibilityRole="button" accessibilityLabel={`Stop ${stop.n} of 7: ${stop.title}. Open the road`} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: look.color }} />
      <Spec tone="muted">{`${label ? `${label} · ` : ""}stop ${stop.n} of 7`}</Spec>
    </Pressable>
  );
}
