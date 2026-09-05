/**
 * THE DOORS — first launch. Three ways into the building, and none of them
 * is a form. "Find me one" goes to the idea finder; "I have one" to the
 * second opinion; "I already run something" straight to the Office, with
 * the stand to fill in when they like. The floor is not mentioned yet: it
 * is the last room, for when there is something to show.
 */
import { View, ScrollView, Pressable } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Body, Display, Plate, Signage, Spec, Sprite, radius, shell, useLayout } from "@founderfloor/ui";
import { useFounder, type Door } from "../lib/store";

const DOORS: { door: Door; sign: string; title: string; line: string; color: string; to: string }[] = [
  { door: "find", sign: "IDEAS", title: "I need an idea", line: "Tell us what you know and who you know. Five ideas you could start this month, each with the first ten people to talk to.", color: "#3B5B92", to: "/idea/find" },
  { door: "have", sign: "SECOND OPINION", title: "I have an idea", line: "Write it in a sentence or a paragraph. You get what is already strong, the questions only customers can answer, and how to ask them.", color: "#4E6E4E", to: "/idea/check" },
  { door: "running", sign: "THE OFFICE", title: "I already run something", line: "Skip the building. The weekly log, the runway, the filing calendar, four coaches who know your numbers, and updates that write themselves.", color: "#B4762E", to: "/office" },
];

export default function Start() {
  const L = useLayout();
  const router = useRouter();
  const setDoor = useFounder((s) => s.setDoor);
  const go = (d: (typeof DOORS)[number]) => {
    setDoor(d.door);
    router.replace(d.to as Href);
  };
  return (
    <ScrollView style={{ flex: 1, backgroundColor: shell.paper }} contentContainerStyle={{ paddingTop: L.insets.top + 32, paddingBottom: L.insets.bottom + 32, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 760, alignSelf: "center", gap: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Sprite id="logo-mark" scale={2} />
        <Spec tone="muted">FounderFloor</Spec>
      </View>
      <Display size={L.compact ? "3xl" : "4xl"}>Three doors. Take the one that is true today.</Display>
      <Body tone="muted" size="lg">
        A building for one founder alone: an idea, a plan, the numbers, and staff who remember. The hall full of other founders is at the end, when you have a stand worth showing.
      </Body>
      <View style={{ gap: 12 }}>
        {DOORS.map((d) => (
          <Pressable key={d.door} onPress={() => go(d)} accessibilityRole="button" accessibilityLabel={d.title} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Plate tone="panel" radius={radius.xl}>
              <View style={{ flexDirection: "row", gap: 16, padding: 16, alignItems: "center" }}>
                <View style={{ width: 44, height: 60, backgroundColor: d.color, borderRadius: 2, borderWidth: 2, borderColor: shell.ink, alignItems: "flex-end", justifyContent: "center", paddingRight: 6 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: shell.accentLift }} />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <View style={{ alignSelf: "flex-start", backgroundColor: shell.blackout, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 }}>
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
          </Pressable>
        ))}
      </View>
      <Spec tone="faint">You can change doors any time. Nothing here is a commitment, and nothing is a test.</Spec>
    </ScrollView>
  );
}
