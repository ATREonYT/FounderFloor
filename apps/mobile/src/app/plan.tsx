/**
 * THE PLAN — the four weeks the welcome made, with this week marked, the
 * two numbers on the stand, and a way to make it again.
 */
import { Pressable, ScrollView, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { GOALS } from "@founderfloor/shared";
import { Body, Button, ButtonRow, Display, Scene, Spec, radius, shell, useLayout } from "@founderfloor/ui";
import { useFounder } from "../lib/store";
import { PlanView } from "../components/PlanView";

export default function Plan() {
  const L = useLayout();
  const router = useRouter();
  const { roadmap: plan, profile } = useFounder();
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
        {plan ? <Body size="sm" tone="muted">Tap a task to open its page and write your work in its steps. Each week gets read back with a score.</Body> : null}
        {plan ? (
          <PlanView plan={plan} profile={profile} weekNow={weekNow} color="#4F6E6B" animate={false} onOpen={(week, i) => router.push({ pathname: "/task", params: { week: String(week), i: String(i) } } as Href)} onReview={(week) => router.push({ pathname: "/review", params: { week: String(week) } } as Href)} />
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
