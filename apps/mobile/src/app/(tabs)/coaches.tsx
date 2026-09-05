/**
 * COACHES — the staff at your stand. Four people drawn in the hall's avatar
 * style standing at your booth, and under them their cards: what each one
 * does, in one line, and a button that puts them behind the desk. The
 * Investor's card carries the pitch-score history as a pixel bar chart.
 */
import { ScrollView, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Bars, Body, Booth, Button, Display, Keeper, Plate, Spec, art, radius, shell, useLayout } from "@founderfloor/ui";
import { TopBar } from "../../components/TopBar";
import { COLUMN, useBottomChrome } from "../../lib/chrome";
import { COACHES } from "../../lib/mock";
import { useFounder } from "../../lib/store";
import { useStand } from "../../lib/stand";

export default function Coaches() {
  const L = useLayout();
  const router = useRouter();
  const bottom = useBottomChrome();
  const stand = useStand();
  const scores = useFounder((s) => s.scores);
  const quota = useFounder((s) => s.quota);
  const floor = art.floors[(stand.hall as keyof typeof art.floors) ?? "main-hall"] ?? art.floors["main-hall"];
  const cols = L.compact ? 1 : 2;
  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <TopBar center={<Spec tone="muted">{`${stand.name} · four at the counter`}</Spec>} />
      <ScrollView contentContainerStyle={{ width: "100%", maxWidth: COLUMN + 240, alignSelf: "center", paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: bottom, gap: 16 }}>
        <View style={{ gap: 8, paddingBottom: 4 }}>
          <Display size={L.compact ? "3xl" : "4xl"}>Coaches</Display>
          <Body tone="muted" size="lg" style={{ maxWidth: 560 }}>
            Four people who know the company and remember what you said last week. Each one owns one thing and will not talk about the others.
          </Body>
        </View>

        {/* the staff at the booth */}
        <Plate tone="panel" radius={radius.xl}>
          <View style={{ backgroundColor: floor.a, borderBottomWidth: 4, borderBottomColor: floor.wall, paddingVertical: 16, alignItems: "center" }}>
            <Booth swatch={stand.swatch} carpetSwatch={stand.carpetSwatch} pattern={stand.pattern} look={stand.look} scale={L.compact ? 1 : 2} parts={["plinth", "carpet", "banner", "counter"]} />
            <View style={{ flexDirection: "row", gap: L.compact ? 16 : 40, marginTop: -8 }}>
              {COACHES.map((c) => (
                <Keeper key={c.id} look={c.look} scale={L.compact ? 2 : 3} framed={false} />
              ))}
            </View>
          </View>
          <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            <Spec tone="muted">{COACHES.map((c) => c.name).join(" · ")}</Spec>
          </View>
        </Plate>

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
                {c.id === "investor" ? (
                  <View style={{ gap: 4 }}>
                    <Bars values={scores.map((s) => s.total)} labels={[scores.length ? `${scores.length} pitch${scores.length === 1 ? "" : "es"} scored` : "no pitch scored yet", scores.length ? `latest ${scores.at(-1)!.total}/10` : "score one"]} color={c.color} />
                  </View>
                ) : c.id === "sales" ? (
                  <Spec tone="muted">{`This week: ${quota.sent} of ${quota.target} out`}</Spec>
                ) : c.id === "finance" ? (
                  <Spec tone="muted">{stand.record.burn ? `Runway on the stand · ${stand.record.entity !== "none" ? "calendar ready" : "no entity yet"}` : "Burn and cash missing from the stand"}</Spec>
                ) : (
                  <Spec tone="muted">{stand.record.weeklyGoal ? `This week: ${stand.record.weeklyGoal}` : "No weekly goal written yet"}</Spec>
                )}
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
        <Spec tone="faint">Free: Ines on Mondays and Fridays, ten turns a day. Pro opens all four, unlimited. Limits are enforced at the desk, not here.</Spec>
      </ScrollView>
    </View>
  );
}
