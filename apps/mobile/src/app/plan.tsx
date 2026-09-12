/**
 * THE PLAN — the four weeks the welcome made, with the week the founder
 * is on marked, a deliberate way to move to the next one, and the plans
 * they made before this, kept whole.
 *
 * The week moves only from here or by finishing the week's tasks. Nothing
 * else moves it: not the calendar, not being away, not pausing a week.
 * Remaking the plan does not erase the old one; it is put away with every
 * task page, note and reading under it, and can be read again below.
 */
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { GOALS } from "@founderfloor/shared";
import { Body, Button, ButtonRow, Dialogue, Display, Plate, Rise, Spec, radius, shell, useLayout } from "@founderfloor/ui";
import { useFounder } from "../lib/store";
import { useWeekNow } from "../lib/taskDesk";
import { PlanView } from "../components/PlanView";
import { StopLine } from "../components/Road";

export default function Plan() {
  const L = useLayout();
  const router = useRouter();
  const { roadmap: plan, profile } = useFounder();
  const plans = useFounder((s) => s.plans);
  const goToWeek = useFounder((s) => s.goToWeek);
  const planDone = useFounder((s) => s.planDone);
  const weekNow = useWeekNow();
  const [old, setOld] = useState<string | null>(null);
  const opened = plans.find((p) => p.id === old) ?? null;
  const week = plan?.weeks.find((w) => w.n === weekNow) ?? null;
  const left = week ? week.do.filter((_, i) => !planDone.includes(`${weekNow}-${i}`)).length : 0;
  const last = !!plan && weekNow >= plan.weeks.length;
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 8, paddingBottom: L.insets.bottom + 32, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 640, alignSelf: "center", gap: 16 }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/today"))} accessibilityRole="button" style={{ alignSelf: "flex-start", backgroundColor: shell.well, borderRadius: radius.full, paddingHorizontal: 14, height: 36, justifyContent: "center" }}>
          <Spec tone="ink">← Back</Spec>
        </Pressable>
        <StopLine id={plan ? "week" : "plan"} label="Your plan" />
        <Rise k={0} style={{ gap: 4 }}>
          <Display size={L.compact ? "3xl" : "4xl"}>Your plan</Display>
          <Body tone="muted">{profile ? `${GOALS.find((g) => g.id === profile.goal)?.label ?? ""}, ${profile.horizon === "3m" ? "3 months" : profile.horizon === "6m" ? "6 months" : "a year"}` : "No plan yet."}</Body>
        </Rise>
        {plan ? <Body size="sm" tone="muted">Tap a task to open its page and write your work in its steps. Each week gets read back with a score.</Body> : null}
        {plan ? (
          <Rise k={1}>
            <PlanView plan={plan} profile={profile} weekNow={weekNow} color="#4F6E6B" animate={false} onOpen={(week, i) => router.push({ pathname: "/task", params: { week: String(week), i: String(i) } } as Href)} onReview={(week) => router.push({ pathname: "/review", params: { week: String(week) } } as Href)} />
          </Rise>
        ) : (
          <Body tone="muted">Answer the desk's eight questions and a plan appears here.</Body>
        )}

        {/* the week moves when the founder says so, and only forward */}
        {plan && !last ? (
          <Rise k={2} style={{ gap: 6 }}>
            <Button block variant="secondary" onPress={() => goToWeek(weekNow + 1)}>
              {`Start week ${weekNow + 1}`}
            </Button>
            <Spec tone="faint">
              {left ? `Week ${weekNow} has ${left} ${left === 1 ? "task" : "tasks"} still open. They stay on the plan and you can come back to them whenever you like.` : `Week ${weekNow} is done. This moves you on.`}
            </Spec>
          </Rise>
        ) : null}

        <ButtonRow>
          <Button variant={plan ? "secondary" : "primary"} onPress={() => router.push("/welcome" as Href)}>
            {plan ? "Remake the plan" : "Answer the questions"}
          </Button>
          <Button variant="ghost" onPress={() => router.push("/workshop" as Href)}>
            Mock it up
          </Button>
        </ButtonRow>
        {plan ? <Spec tone="faint">Remaking the plan keeps this one. Everything you wrote under it is put away below, not thrown away.</Spec> : null}

        {/* the plans before this one, whole */}
        {plans.length ? (
          <Rise k={3} style={{ gap: 8 }}>
            <Body medium>Plans before this one</Body>
            <Plate tone="panel" radius={radius.xl} padding={6}>
              {[...plans].reverse().map((p, i) => {
                const done = Object.keys(p.tasks).length;
                return (
                  <Pressable key={p.id} onPress={() => setOld(p.id)} accessibilityRole="button" accessibilityLabel={`Read the plan from ${p.at.slice(0, 10)}`} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderTopWidth: i ? 1 : 0, borderTopColor: shell.line, opacity: pressed ? 0.8 : 1 })}>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Body size="sm" medium numberOfLines={1}>{p.headline}</Body>
                      <Spec tone="faint">{`Put away ${p.at.slice(0, 10)}. ${p.planDone.length} ${p.planDone.length === 1 ? "task" : "tasks"} finished, ${done} ${done === 1 ? "page" : "pages"} written.`}</Spec>
                    </View>
                    <Body tone="accent">›</Body>
                  </Pressable>
                );
              })}
            </Plate>
          </Rise>
        ) : null}
      </ScrollView>

      {/* an old plan, read only: the weeks it had and what was finished in them */}
      <Dialogue open={!!opened} onClose={() => setOld(null)} sign="AN EARLIER PLAN" keeper="The desk" blurb={opened ? `Made before ${opened.at.slice(0, 10)}. Kept whole.` : ""} color="#4F6E6B" wide footer="Everything you wrote under this plan is still in the notebook.">
        {opened ? (
          <View style={{ gap: 12 }}>
            <Body medium>{opened.headline}</Body>
            {opened.roadmap.weeks.map((w) => (
              <View key={w.n} style={{ gap: 4 }}>
                <Spec tone="muted">{`Week ${w.n}: ${w.focus.replace(/\.$/, "")}`}</Spec>
                {w.do.map((d, i) => (
                  <Body key={i} size="sm" tone={opened.planDone.includes(`${w.n}-${i}`) ? "muted" : "ink"} style={opened.planDone.includes(`${w.n}-${i}`) ? { textDecorationLine: "line-through" } : undefined}>
                    {d}
                  </Body>
                ))}
              </View>
            ))}
            <Button variant="ghost" onPress={() => { setOld(null); router.push("/memory" as Href); }}>
              Read what you wrote
            </Button>
          </View>
        ) : null}
      </Dialogue>
    </View>
  );
}
