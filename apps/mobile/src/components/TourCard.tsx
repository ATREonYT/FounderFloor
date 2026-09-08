/**
 * The tour, on the map: the six guide cards in one compact card that sits
 * at the top of the map the first time a founder lands there after the
 * questions. Next walks the cards; the last one says Start and, when a
 * route was given, goes to the first idea.
 */
import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useRouter, type Href } from "expo-router";
import { Body, Button, ButtonRow, GlyphTile, Plate, Scene, Spec, radius, shell } from "@founderfloor/ui";
import { PAGES } from "../lib/guidePages";
import { useFounder } from "../lib/store";

export function TourCard({ then, onDone }: { then?: string; onDone?: () => void }) {
  const router = useRouter();
  const setGuided = useFounder((s) => s.setGuided);
  const [i, setI] = useState(0);
  const p = PAGES[i];
  const finish = () => {
    setGuided();
    onDone?.();
    if (then) router.push(then as Href);
  };
  return (
    <Animated.View entering={FadeIn.duration(240)} exiting={FadeOut.duration(160)}>
      <Plate tone="panel" radius={radius.xxl} padding={12} lineColor={p.color}>
        <Scene key={p.set} set={p.set} height={132} radiusPx={16} color={p.color} ambient={false} accessibilityLabel={p.title}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <GlyphTile id={p.glyph} color={p.color} size={26} scale={1} />
            <Spec tone="ink">{p.tab.toUpperCase()}</Spec>
          </View>
        </Scene>
        <View style={{ padding: 6, paddingTop: 12, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Spec tone="muted">{`How it works · ${i + 1} of ${PAGES.length}`}</Spec>
            <Pressable onPress={finish} accessibilityRole="button" accessibilityLabel="Skip the tour">
              <Spec tone="accent">Skip</Spec>
            </Pressable>
          </View>
          <Body medium>{p.title}</Body>
          <Body size="sm" tone="muted">
            {p.line}
          </Body>
          <View style={{ flexDirection: "row", gap: 5, alignItems: "center", marginTop: 4 }}>
            {PAGES.map((_, k) => (
              <View key={k} style={{ width: k === i ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: k === i ? shell.ink : shell.line }} />
            ))}
          </View>
          <ButtonRow>
            <View style={{ marginTop: 8 }}>
              <Button size="sm" arrow onPress={() => (i + 1 < PAGES.length ? setI(i + 1) : finish())}>
                {i + 1 < PAGES.length ? "Next" : then ? "Start with the first idea" : "Start"}
              </Button>
            </View>
            {i > 0 ? (
              <View style={{ marginTop: 8 }}>
                <Button size="sm" variant="ghost" onPress={() => setI(i - 1)}>
                  Back
                </Button>
              </View>
            ) : null}
          </ButtonRow>
        </View>
      </Plate>
    </Animated.View>
  );
}
