/**
 * THE PLAN — the four weeks the welcome made, with this week marked, the
 * two numbers on the stand, and a way to make it again.
 */
import { Pressable, ScrollView, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { GOALS } from "@founderfloor/shared";
import { Body, Button, ButtonRow, Display, Plate, Scene, Spec, radius, shell, useLayout } from "@founderfloor/ui";
import { useFounder } from "../lib/store";

export default function Plan() {
  const L = useLayout();
  const router = useRouter();
  const { roadmap: plan, profile, record } = useFounder();
  const weekNow = profile ? Math.min(4, Math.max(1, Math.floor((Date.now() - new Date(profile.at).getTime()) / (7 * 86_400_000)) + 1)) : 1;
  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 8, paddingBottom: L.insets.bottom + 32, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 640, alignSelf: "center", gap: 16 }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/reception"))} accessibilityRole="button" style={{ alignSelf: "flex-start", borderWidth: 1, borderColor: shell.line, borderRadius: radius.md, paddingHorizontal: 10, height: 36, justifyContent: "center" }}>
          <Spec tone="ink">← Back</Spec>
        </Pressable>
        <Scene set="lobby" height={L.compact ? 140 : 170} radiusPx={radius.xl} accessibilityLabel="Your plan">
          <Spec tone="muted">{profile ? `${GOALS.find((g) => g.id === profile.goal)?.label ?? ""} · ${profile.horizon === "3m" ? "3 months" : profile.horizon === "6m" ? "6 months" : "a year"}`.toUpperCase() : "NO PLAN YET"}</Spec>
        </Scene>
        {plan ? (
          <>
            <Display size={L.compact ? "xl" : "3xl"}>{plan.headline}</Display>
            <Body tone="muted">{plan.why}</Body>
            {plan.weeks.map((w) => (
              <Plate key={w.n} tone={w.n === weekNow ? "plate" : "panel"} radius={radius.lg} padding={14}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Spec tone={w.n === weekNow ? "paperQuiet" : "muted"}>{`WEEK ${w.n}`}</Spec>
                  {w.n === weekNow ? <Spec tone="accentLift">this week</Spec> : null}
                </View>
                <Body medium tone={w.n === weekNow ? "paper" : "ink"}>
                  {w.focus}
                </Body>
                {w.do.map((d, k) => (
                  <Body key={k} size="sm" tone={w.n === weekNow ? "paper" : "muted"} style={{ marginTop: 4 }}>
                    {`· ${d}`}
                  </Body>
                ))}
              </Plate>
            ))}
            <Plate tone="paper" radius={radius.md} padding={12}>
              <Spec tone="muted">ON THE STAND</Spec>
              <Body size="sm" style={{ marginTop: 4 }}>{`This week: ${record.weeklyGoal || plan.weeklyGoal}`}</Body>
              <Body size="sm">{`In 90 days: ${record.target90 || plan.target90}`}</Body>
            </Plate>
          </>
        ) : (
          <Body tone="muted">Answer the desk's eight questions and a plan appears here.</Body>
        )}
        <ButtonRow>
          <Button variant="secondary" onPress={() => router.push("/welcome" as Href)}>
            {plan ? "Remake the plan" : "Answer the questions"}
          </Button>
          <Button variant="ghost" onPress={() => router.navigate("/build" as Href)}>
            Open the map
          </Button>
        </ButtonRow>
      </ScrollView>
    </View>
  );
}
