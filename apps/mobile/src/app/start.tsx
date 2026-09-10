/**
 * THE DOORS — first launch. Three ways into the building, and none of them
 * is a form. "Find me one" goes to the idea finder; "I have one" to the
 * second opinion; "I already run something" straight to the Office, with
 * the stand to fill in when they like. The floor is not mentioned yet: it
 * is the last room, for when there is something to show.
 */
import { View, ScrollView } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Body, Display, Glyph, Plate, Signage, Spec, Sprite, Stage, Tap, radius, shell, useLayout, type GlyphId } from "@founderfloor/ui";
import { RECEPTIONIST } from "../lib/mock";
import { useFounder, type Door } from "../lib/store";

const DOORS: { door: Door; sign: string; title: string; line: string; color: string; to: string; glyph: GlyphId }[] = [
  { door: "find", sign: "IDEAS", title: "I need an idea", line: "Five ideas from what you know and who you know, each with the first ten people to call.", color: "#3B5B92", to: "/idea/find", glyph: "bolt" },
  { door: "have", sign: "SECOND OPINION", title: "I have an idea", line: "A sentence is enough. You get what is strong, and the questions only customers can answer.", color: "#4E6E4E", to: "/idea/check", glyph: "star" },
  { door: "running", sign: "THE OFFICE", title: "I already run something", line: "Skip the building. The weekly log, the runway, the calendar, and four coaches who know your numbers.", color: "#B4762E", to: "/office", glyph: "coin" },
];

export default function Start() {
  const L = useLayout();
  const router = useRouter();
  const setDoor = useFounder((s) => s.setDoor);
  const guided = useFounder((s) => s.guided);
  const go = (d: (typeof DOORS)[number]) => {
    setDoor(d.door);
    // the first time, the six-card guide comes first and then the door
    if (!guided) router.replace({ pathname: "/guide", params: { then: d.to } } as Href);
    else router.replace(d.to as Href);
  };
  return (
    <ScrollView style={{ flex: 1, backgroundColor: shell.paper }} contentContainerStyle={{ paddingTop: L.insets.top + 32, paddingBottom: L.insets.bottom + 32, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 760, alignSelf: "center", gap: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Sprite id="logo-mark" scale={2} />
        <Spec tone="muted">FounderFloor</Spec>
      </View>
      <Stage look={RECEPTIONIST.look} color={RECEPTIONIST.color} who="The desk" say="Hi. Three doors, pick whichever fits today." height={L.compact ? 200 : 230} scale={2} set="doors" />
      <Display size={L.compact ? "3xl" : "4xl"}>Where are you starting from?</Display>
      <Body tone="muted" size="lg">
        Pick the door that fits. You can switch later.
      </Body>
      <View style={{ gap: 12 }}>
        {DOORS.map((d) => (
          <Tap key={d.door} onPress={() => go(d)} accessibilityLabel={d.title}>
            <Plate tone="panel" radius={radius.xl}>
              <View style={{ flexDirection: "row", gap: 16, padding: 16, alignItems: "center" }}>
                <View style={{ width: 48, height: 64, backgroundColor: d.color, borderRadius: 3, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 2, borderColor: shell.ink, alignItems: "center", justifyContent: "center" }}>
                  <Glyph id={d.glyph} tone="paper" scale={2} />
                  <View style={{ position: "absolute", right: 6, top: 30, width: 4, height: 4, borderRadius: 2, backgroundColor: shell.accentLift }} />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <View style={{ alignSelf: "flex-start", backgroundColor: shell.blackout, borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Signage>{d.sign}</Signage>
                  </View>
                  <Display size="lg">{d.title}</Display>
                  <Body size="sm" tone="muted">
                    {d.line}
                  </Body>
                </View>
                <Body tone="accent">→</Body>
              </View>
            </Plate>
          </Tap>
        ))}
      </View>
      <Spec tone="faint">Change doors any time. Nothing here is a test.</Spec>
    </ScrollView>
  );
}
