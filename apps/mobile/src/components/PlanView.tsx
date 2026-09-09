/**
 * THE PLAN, drawn: a rail down the left with one node per week, the
 * current week open in the step's colour with a progress ring, each
 * action a tickable row, the goal and the pace as glyph chips, and the
 * two numbers on the stand as a card. The same view serves the welcome's
 * last step and the plan page. On the plan page each action is a door:
 * the row opens the task's own page, the box on its left ticks it.
 */
import { Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GOALS, LIKES, STAGES, type FounderPlan, type Profile } from "@founderfloor/shared";
import { roomOfWeek } from "../lib/taskDesk";
import { Body, Display, Glyph, GlyphTile, Plate, Ring, Spec, Tap, haptic, radius, shell, wash, type GlyphId } from "@founderfloor/ui";
import { useFounder } from "../lib/store";

const GOAL_GLYPH: Record<string, GlyphId> = { "first-customer": "heart", "side-income": "coin", "quit-job": "rocket", raise: "flask", learn: "leaf" };
const WEEK_GLYPH: GlyphId[] = ["bolt", "wave", "coin", "star"];

export function PlanView({ plan, profile, color = "#4F6E6B", weekNow = 1, animate = true, onOpen, onReview }: { plan: FounderPlan; profile: Profile | null; color?: string; weekNow?: number; animate?: boolean; /** Tapping a step opens its page; without this the row only ticks. */ onOpen?: (week: number, i: number) => void; /** The week read back: score and words. */ onReview?: (week: number) => void }) {
  const done = useFounder((s) => s.planDone);
  const toggle = useFounder((s) => s.togglePlanStep);
  const tasks = useFounder((s) => s.tasks);
  const reviews = useFounder((s) => s.reviews);
  const total = plan.weeks.reduce((n, w) => n + w.do.length, 0);
  const doneCount = plan.weeks.reduce((n, w) => n + w.do.filter((_, i) => done.includes(`${w.n}-${i}`)).length, 0);
  const horizon = profile?.horizon === "3m" ? "3 months" : profile?.horizon === "6m" ? "6 months" : "a year";
  const pace = profile?.pace === "evenings" ? "Evenings" : profile?.pace === "all-in" ? "All in" : "Part-time";
  const enter = (k: number) => (animate ? FadeInDown.delay(80 + k * 70).duration(240) : undefined);
  return (
    <View style={{ gap: 14 }}>
      {/* the goal strip: what the plan is for, and how much of it is done */}
      <Animated.View entering={enter(0)}>
        <Plate tone="panel" radius={radius.xl} padding={14}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Ring value={total ? doneCount / total : 0} size={64} label={`${Math.round((total ? doneCount / total : 0) * 100)}%`} sub="done" color={color} />
            <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
              <Body medium>{plan.headline}</Body>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {profile ? <Chip glyph={GOAL_GLYPH[profile.goal] ?? "star"} label={GOALS.find((g) => g.id === profile.goal)?.label ?? ""} color={color} /> : null}
                <Chip glyph="bolt" label={horizon} color={color} />
                <Chip glyph="leaf" label={pace} color={color} />
              </View>
            </View>
          </View>
        </Plate>
      </Animated.View>

      {/* the weeks, on a rail */}
      <View>
        {plan.weeks.map((w, k) => {
          const open = w.n === weekNow;
          const wDone = w.do.filter((_, i) => done.includes(`${w.n}-${i}`)).length;
          const finished = wDone === w.do.length && w.do.length > 0;
          const last = k === plan.weeks.length - 1;
          return (
            <Animated.View key={w.n} entering={enter(k + 1)} style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ width: 36, alignItems: "center" }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: finished || open ? color : wash(color, 0.14), alignItems: "center", justifyContent: "center" }}>
                  {finished ? <Glyph id="star" tone="paper" scale={2} /> : <Glyph id={WEEK_GLYPH[k % WEEK_GLYPH.length]} tone={open ? "paper" : "auto"} scale={2} />}
                </View>
                {!last ? <View style={{ flex: 1, width: 3, backgroundColor: finished ? color : wash(color, 0.18), marginVertical: 4, borderRadius: 2 }} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: last ? 0 : 14 }}>
                <View style={{ backgroundColor: open ? wash(color, 0.1) : shell.panel, borderRadius: 16, borderWidth: 1.5, borderColor: open ? color : shell.line, padding: 12, gap: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Spec tone="muted">{`WEEK ${w.n} · ${STAGES[roomOfWeek(plan, w.n)].name.toUpperCase()} ROOM`}</Spec>
                    {open ? (
                      <View style={{ backgroundColor: color, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Spec tone="paper">this week</Spec>
                      </View>
                    ) : null}
                    <Spec tone="faint" style={{ marginLeft: "auto" }}>{`${wDone} of ${w.do.length}`}</Spec>
                  </View>
                  <Body medium>{w.focus}</Body>
                  {onReview && w.n <= weekNow ? (
                    <Pressable onPress={() => onReview(w.n)} accessibilityRole="button" accessibilityLabel={`Read week ${w.n} back`} style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: wash(color, open ? 0.16 : 0.08), borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10 }}>
                      <Glyph id="coin" tone="auto" scale={1} />
                      <Spec tone="ink" style={{ flex: 1 }}>{reviews[w.n] ? `${reviews[w.n].verdict} · ${reviews[w.n].score} of 100` : w.n === weekNow ? "How is the week going?" : "Read the week back"}</Spec>
                      <Spec tone="accent">→</Spec>
                    </Pressable>
                  ) : null}
                  <View style={{ gap: 6 }}>
                    {w.do.map((d, i) => {
                      const key = `${w.n}-${i}`;
                      const on = done.includes(key);
                      const tick = () => { toggle(key); void haptic(on ? "light" : "success"); };
                      const steps = tasks[key]?.guide?.steps.length ?? 0;
                      const ticked = steps ? Math.min(steps, tasks[key]?.ticks.filter((x) => x < steps).length ?? 0) : 0;
                      return (
                        <Tap key={key} onPress={onOpen ? () => onOpen(w.n, i) : tick} accessibilityLabel={d} accessibilityRole={onOpen ? "button" : "checkbox"} scale={0.985}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: shell.paper, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 10 }}>
                            <Pressable onPress={onOpen ? tick : undefined} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={on ? "Mark not done" : "Mark done"} hitSlop={8} style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: on ? color : shell.line, backgroundColor: on ? color : "transparent", alignItems: "center", justifyContent: "center" }}>
                              {on ? <Glyph id="star" tone="paper" scale={1} /> : null}
                            </Pressable>
                            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                              <Body size="sm" tone={on ? "muted" : "ink"} style={{ textDecorationLine: on ? "line-through" : "none" }}>
                                {d}
                              </Body>
                              {onOpen && !on && ticked > 0 ? <Spec tone="faint">{`${ticked} of ${steps} steps`}</Spec> : null}
                            </View>
                            {onOpen ? <Body tone={on ? "muted" : "accent"}>›</Body> : null}
                          </View>
                        </Tap>
                      );
                    })}
                  </View>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* the two numbers on the stand */}
      <Animated.View entering={enter(plan.weeks.length + 1)}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Plate tone="panel" radius={radius.lg} padding={12} style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <GlyphTile id="bolt" color={color} size={28} scale={1} />
              <Spec tone="muted">THIS WEEK</Spec>
            </View>
            <Body size="sm" medium style={{ marginTop: 6 }}>
              {plan.weeklyGoal}
            </Body>
          </Plate>
          <Plate tone="panel" radius={radius.lg} padding={12} style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <GlyphTile id="rocket" color={color} size={28} scale={1} />
              <Spec tone="muted">IN 90 DAYS</Spec>
            </View>
            <Body size="sm" medium style={{ marginTop: 6 }}>
              {plan.target90}
            </Body>
          </Plate>
        </View>
      </Animated.View>
      <Body size="sm" tone="muted">
        {plan.why}
      </Body>
    </View>
  );
}

function Chip({ glyph, label, color }: { glyph: GlyphId; label: string; color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: wash(color, 0.12), borderRadius: radius.full, paddingLeft: 6, paddingRight: 10, paddingVertical: 4 }}>
      <Glyph id={glyph} tone="auto" scale={1} />
      <Spec tone="ink">{label}</Spec>
    </View>
  );
}
