/**
 * COACHES — the hall's keepers, laid out the way assistant apps lay out
 * their personas: a grid of cards, one face each, a line on what they know,
 * and a button that puts them behind the desk. Each card wears its stall's
 * awning stripe so the coach is recognisably the counter you walk to on
 * the floor.
 */
import { ScrollView, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Body, Button, Display, Keeper, Plate, Spec, radius, shell, useLayout } from "@founderfloor/ui";
import { TopBar } from "../../components/TopBar";
import { COLUMN, useBottomChrome } from "../../lib/chrome";
import { COACHES } from "../../lib/mock";

export default function Coaches() {
  const L = useLayout();
  const router = useRouter();
  const bottom = useBottomChrome();
  const cols = L.compact ? 1 : 2;
  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <TopBar center={<Spec tone="muted">Main Hall · six counters</Spec>} />
      <ScrollView contentContainerStyle={{ width: "100%", maxWidth: COLUMN + 240, alignSelf: "center", paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: bottom, gap: 16 }}>
        <View style={{ gap: 8, paddingBottom: 4 }}>
          <Display size={L.compact ? "3xl" : "4xl"}>Coaches</Display>
          <Body tone="muted" size="lg" style={{ maxWidth: 560 }}>
            Every keeper in the hall will talk. Each one knows their own counter and nothing else, which is the point.
          </Body>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {COACHES.map((c) => (
            <Plate key={c.id} tone="panel" radius={radius.xl} style={{ flexBasis: cols === 1 ? "100%" : "48%", flexGrow: 1 }}>
              <View style={{ flexDirection: "row", height: 6 }}>
                {Array.from({ length: 14 }).map((_, i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? shell.panel : c.color }} />
                ))}
              </View>
              <View style={{ padding: 16, gap: 12 }}>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                  <Keeper look={c.look} scale={2} color={c.color} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Display size="lg">{c.name}</Display>
                    <Spec tone="muted">{c.title}</Spec>
                  </View>
                </View>
                <Body size="sm" tone="muted">
                  {c.blurb}
                </Body>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {c.topics.map((t) => (
                    <View key={t} style={{ backgroundColor: shell.well, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Spec tone="ink">{t}</Spec>
                    </View>
                  ))}
                </View>
                <Button variant="secondary" size="sm" arrow onPress={() => router.navigate({ pathname: "/reception", params: { coach: c.id } } as Href)}>
                  {`Talk to ${c.name}`}
                </Button>
              </View>
            </Plate>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
