/**
 * THE GUIDE — six cards, one per place in the building, each a scene and
 * two lines. Shown once after the doors (skippable), and from Home any
 * time. It is the whole manual: if a page needs more words than this, the
 * page is wrong, not the guide.
 */
import { useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Body, Button, ButtonRow, Display, GlyphTile, Scene, Spec, radius, shell, useLayout, type GlyphId, type SceneSet } from "@founderfloor/ui";
import { useFounder } from "../lib/store";

const PAGES: { set: SceneSet; glyph: GlyphId; color: string; title: string; line: string; tab: string }[] = [
  { set: "lobby", glyph: "wave", color: "#4F6E6B", title: "Start at home.", line: "Your streak, what to do next, and a desk that answers questions about your company.", tab: "Home" },
  { set: "workshop", glyph: "cube", color: "#A28457", title: "Follow the map.", line: "Six rooms from idea to money, one step at a time. Tap the next button, do the thing, mark it done. The first three rooms are free.", tab: "Map" },
  { set: "stand", glyph: "star", color: "#8C3B2E", title: "Your stand is your company.", line: "Your numbers, your runway, your rank, in one place you can share. The coaches read from it.", tab: "Stand" },
  { set: "office", glyph: "coin", color: "#5E7C93", title: "Fridays are for the Office.", line: "Log five numbers, two minutes. Theo reads them back. Drafts the coaches wrote for you live here too.", tab: "Office" },
  { set: "cafe", glyph: "heart", color: "#2F6F6A", title: "Free does a lot. Pro remembers.", line: "Everything you need to start is free, and your first week with all four coaches is free too. Pro keeps their notes between visits.", tab: "Plans" },
  { set: "market", glyph: "flask", color: "#3B5B92", title: "The floor comes last.", line: "When you have something to show, take a spot in the hall with other founders. Visitors leave notes and the receptionist keeps them for you.", tab: "Floor" },
];

export default function Guide() {
  const L = useLayout();
  const router = useRouter();
  const { then } = useLocalSearchParams<{ then?: string }>();
  const setGuided = useFounder((s) => s.setGuided);
  const [i, setI] = useState(0);
  const scroll = useRef<ScrollView>(null);
  const done = () => {
    setGuided();
    if (then) router.replace(then as Href);
    else if (router.canGoBack()) router.back();
    else router.replace("/reception");
  };
  const p = PAGES[i];
  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <ScrollView ref={scroll} contentContainerStyle={{ paddingTop: L.insets.top + 16, paddingBottom: L.insets.bottom + 24, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 560, alignSelf: "center", gap: 18, flexGrow: 1, justifyContent: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Spec tone="muted">{`How it works · ${i + 1} of ${PAGES.length}`}</Spec>
          <Pressable onPress={done} accessibilityRole="button" accessibilityLabel="Skip the guide">
            <Spec tone="accent">Skip</Spec>
          </Pressable>
        </View>
        <Scene key={p.set} set={p.set} height={L.compact ? 210 : 260} radiusPx={radius.xl} color={p.color} accessibilityLabel={p.title}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <GlyphTile id={p.glyph} color={p.color} size={28} scale={1} />
            <Spec tone="ink">{p.tab.toUpperCase()}</Spec>
          </View>
        </Scene>
        <Display size={L.compact ? "xl" : "3xl"}>{p.title}</Display>
        <Body tone="muted" size="lg">
          {p.line}
        </Body>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          {PAGES.map((_, k) => (
            <Pressable key={k} onPress={() => setI(k)} accessibilityRole="button" accessibilityLabel={`Page ${k + 1}`} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: k === i ? shell.ink : shell.line }} />
          ))}
        </View>
        <ButtonRow>
          <Button arrow onPress={() => (i + 1 < PAGES.length ? setI(i + 1) : done())}>
            {i + 1 < PAGES.length ? "Next" : "Start"}
          </Button>
          {i > 0 ? (
            <Button variant="ghost" onPress={() => setI(i - 1)}>
              Back
            </Button>
          ) : null}
        </ButtonRow>
      </ScrollView>
    </View>
  );
}
