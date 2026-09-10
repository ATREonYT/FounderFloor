/**
 * TODAY — the first tab, in the shape every daily app has settled on
 * (Headspace's Today, Finch's goals, Noom's task list): one thing to do
 * next, big, with a Start button; this week's three tasks under it as a
 * checklist; two small doors for the week's rituals. Nothing to read,
 * nothing to configure. The keeper says one line. Everything else in the
 * building is behind the bar below, and this page never tries to be it.
 */
import { Pressable, ScrollView, View } from "react-native";
import { useIsFocused, useRouter, type Href } from "expo-router";
import { STAGES } from "@founderfloor/shared";
import { Body, Button, Display, Glyph, GlyphTile, Plate, Spec, Stage, Streak, Tap, haptic, radius, shell, useLayout, wash } from "@founderfloor/ui";
import { TopBar } from "../../components/TopBar";
import { Hint } from "../../components/Hint";
import { TourTarget } from "../../components/TourTarget";
import { Road } from "../../components/Road";
import { COLUMN, useBottomChrome } from "../../lib/chrome";
import { ROOM_COLOR, ROOM_GLYPH } from "../../lib/glyphs";
import { RECEPTIONIST, greeting } from "../../lib/mock";
import { useStand } from "../../lib/stand";
import { isoWeek, useFounder } from "../../lib/store";
import { roomOfWeek, taskKey, weekNow } from "../../lib/taskDesk";
import { useTour } from "../../lib/tour";

export default function Today() {
  const L = useLayout();
  const router = useRouter();
  const bottom = useBottomChrome();
  const focused = useIsFocused();
  const stand = useStand();
  const plan = useFounder((s) => s.roadmap);
  const profile = useFounder((s) => s.profile);
  const planDone = useFounder((s) => s.planDone);
  const toggle = useFounder((s) => s.togglePlanStep);
  const tasks = useFounder((s) => s.tasks);
  const kpi = useFounder((s) => s.kpi);
  const reviews = useFounder((s) => s.reviews);
  const wk = weekNow(profile, plan);
  const week = plan?.weeks.find((w) => w.n === wk) ?? null;
  const roomIdx = plan ? roomOfWeek(plan, wk) : 0;
  const room = STAGES[roomIdx];
  const color = ROOM_COLOR[room.id];
  const nextI = week ? week.do.findIndex((_, i) => !planDone.includes(taskKey(wk, i))) : -1;
  const next = week && nextI >= 0 ? { i: nextI, text: week.do[nextI], guide: tasks[taskKey(wk, nextI)]?.guide ?? null } : null;
  const doneCount = week ? week.do.filter((_, i) => planDone.includes(taskKey(wk, i))).length : 0;
  const weekLogged = kpi.some((e) => e.week === isoWeek());
  const friday = new Date().getDay() === 5;
  const review = reviews[wk];
  const openTask = (i: number) => router.push({ pathname: "/task", params: { week: String(wk), i: String(i) } } as Href);
  const say = !plan ? "Eight questions and you have a plan. Start there." : next ? `${greeting(stand.founder || profile?.name || undefined)} One thing today: ${next.text.replace(/\.$/, "").toLowerCase()}.` : `${greeting(stand.founder || profile?.name || undefined)} Week ${wk} is done. Read it back, or open the map.`;
  const column = { width: "100%" as const, maxWidth: COLUMN, alignSelf: "center" as const, paddingHorizontal: L.shell.paddingHorizontal };
  const today = new Date();

  return (
    <View style={{ flex: 1 }}>
      <TopBar center={<Spec tone="muted">{today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</Spec>} />
      <ScrollView contentContainerStyle={[column, { paddingBottom: bottom, gap: 16 }]}>
        <Stage look={RECEPTIONIST.look} color={RECEPTIONIST.color} who="The desk" say={say} mood="idle" scale={2} height={L.compact ? 160 : 190} ambient={focused} set="lobby">
          <Streak days={Array.from({ length: 7 }, (_, i) => i >= 7 - Math.min(7, stand.streak))} label={stand.streak === 1 ? "day one" : stand.streak ? `${stand.streak}-day streak` : "day one"} />
        </Stage>
        <Hint id="today" text="Today is one thing to do next. Under it, the road: seven stops from your idea to your first paying customer, and where you are on it. Tap any stop to go there." />

        {/* the one thing */}
        <TourTarget id="home-next">
          <Tap onPress={() => { if (useTour.getState().active) return; if (!plan) router.push("/welcome" as Href); else if (next) openTask(next.i); else router.push({ pathname: "/review", params: { week: String(wk) } } as Href); }} accessibilityLabel={!plan ? "Make your plan" : next ? `Next up: ${next.text}` : "Read the week back"} scale={0.985}>
            <Plate tone="panel" radius={radius.xxl} padding={0} ring={wash(color, 0.5)}>
              <View style={{ backgroundColor: wash(color, 0.1), borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <GlyphTile id={plan ? ROOM_GLYPH[room.id] ?? "bolt" : "bolt"} color={color} size={32} scale={1} />
                <Spec tone="muted" style={{ flex: 1 }}>{!plan ? "First thing" : next ? `Next up · Week ${wk} · ${room.name} room` : `Week ${wk} · All done`}</Spec>
                {next?.guide?.time ? <Spec tone="faint">{next.guide.time}</Spec> : null}
              </View>
              <View style={{ padding: 16, gap: 14 }}>
                <Display size={L.compact ? "xl" : "3xl"}>{!plan ? "Make your plan" : next ? (next.guide?.title ?? next.text.replace(/\.$/, "")) : "Every task this week is done"}</Display>
                {!plan ? (
                  <Body tone="muted">Eight questions, two minutes. Then the desk writes your first four weeks.</Body>
                ) : next?.guide?.why ? (
                  <Body tone="muted" size="sm">
                    {next.guide.why}
                  </Body>
                ) : next ? (
                  <Body tone="muted" size="sm">
                    Open it and the desk writes the steps.
                  </Body>
                ) : (
                  <Body tone="muted" size="sm">
                    The desk reads the week back and says what to fix.
                  </Body>
                )}
                <Button arrow onPress={() => { if (useTour.getState().active) return; if (!plan) router.push("/welcome" as Href); else if (next) openTask(next.i); else router.push({ pathname: "/review", params: { week: String(wk) } } as Href); }}>
                  {!plan ? "Answer the questions" : next ? "Start" : "Read the week back"}
                </Button>
              </View>
            </Plate>
          </Tap>
        </TourTarget>

        {/* the road: seven stops, where you are, what to do now */}
        <Road />

        {/* this week, as a checklist */}
        {week ? (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
              <Body medium>{`This week · ${week.focus.replace(/\.$/, "")}`}</Body>
              <Spec tone="faint">{`${doneCount} of ${week.do.length}`}</Spec>
            </View>
            <Plate tone="panel" radius={radius.xl} padding={6}>
              {week.do.map((d, i) => {
                const key = taskKey(wk, i);
                const on = planDone.includes(key);
                const steps = tasks[key]?.guide?.steps.length ?? 0;
                const ticked = steps ? Math.min(steps, (tasks[key]?.ticks ?? []).filter((x) => x < steps).length) : 0;
                return (
                  <Pressable key={key} onPress={() => openTask(i)} accessibilityRole="button" accessibilityLabel={d} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderTopWidth: i ? 1 : 0, borderTopColor: shell.line, opacity: pressed ? 0.8 : 1 })}>
                    <Pressable onPress={() => { toggle(key); void haptic(on ? "light" : "success"); }} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={on ? "Mark not done" : "Mark done"} hitSlop={10} style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: on ? color : shell.line, backgroundColor: on ? color : "transparent", alignItems: "center", justifyContent: "center" }}>
                      {on ? <Glyph id="star" tone="paper" scale={1} /> : null}
                    </Pressable>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Body size="sm" tone={on ? "muted" : "ink"} style={{ textDecorationLine: on ? "line-through" : "none" }}>
                        {d}
                      </Body>
                      {!on && ticked ? <Spec tone="faint">{`${ticked} of ${steps} steps`}</Spec> : null}
                    </View>
                    <Body tone="accent" accessibilityElementsHidden importantForAccessibility="no">›</Body>
                  </Pressable>
                );
              })}
            </Plate>
            <Pressable onPress={() => router.push("/plan" as Href)} accessibilityRole="button" accessibilityLabel="All four weeks of the plan" style={{ alignSelf: "flex-start", minHeight: 44, justifyContent: "center", paddingRight: 8 }}>
              <Spec tone="accent">All four weeks →</Spec>
            </Pressable>
          </View>
        ) : null}

        {/* the week's two rituals */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Tap onPress={() => router.push("/office" as Href)} accessibilityLabel={weekLogged ? "Week logged. Open the Office" : "Log the week"} style={{ flex: 1 }} scale={0.98}>
            <Plate tone="panel" radius={radius.xl} padding={14} ring={friday && !weekLogged ? shell.accent : undefined}>
              <GlyphTile id="coin" color="#5E7C93" size={32} scale={1} />
              <Body size="sm" medium style={{ marginTop: 10 }}>
                {weekLogged ? "Week logged ✓" : "Log the week"}
              </Body>
              <Spec tone="faint">{weekLogged ? "Five numbers, in" : friday ? "It is Friday. Two minutes." : "Five numbers, Fridays"}</Spec>
            </Plate>
          </Tap>
          <Tap onPress={() => router.push({ pathname: "/review", params: { week: String(wk) } } as Href)} accessibilityLabel="Read the week back" style={{ flex: 1 }} scale={0.98}>
            <Plate tone="panel" radius={radius.xl} padding={14}>
              <GlyphTile id="flask" color="#6B4E71" size={32} scale={1} />
              <Body size="sm" medium style={{ marginTop: 10 }}>
                {review ? review.verdict : `Week ${wk}, read back`}
              </Body>
              <Spec tone="faint">{review ? `${review.score} of 100 · what to fix` : "A score, and what to fix"}</Spec>
            </Plate>
          </Tap>
        </View>
      </ScrollView>
    </View>
  );
}
