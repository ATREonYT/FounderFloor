/**
 * ONE TASK — a plan line, opened into a room. The page the desk wrote for
 * it (steps with a tip each, how long, when it is done), the founder's own
 * notes, and the desk at the bottom answering about this task only. The
 * room is drawn for the kind of work: conversations in the café, building
 * in the workshop, writing in the mailroom, numbers in the office, selling
 * on the market. Tick the steps; when they are all ticked the task marks
 * itself done on the plan and the next one is a tap away.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { TASK_KINDS, type TaskKind } from "@founderfloor/shared";
import { Body, Button, ButtonRow, Chip, Composer, Display, Glyph, GlyphTile, Input, Message, Plate, Ring, Scene, Spec, Sparks, Tap, Thinking, haptic, radius, shell, useLayout, wash, type GlyphId, type SceneSet } from "@founderfloor/ui";
import { useFounder } from "../lib/store";
import { useGate } from "../lib/gate";
import { aiMode } from "../lib/ai";
import { taskKey, useTask, weekNow } from "../lib/taskDesk";

/** The room each kind of work is drawn in. */
export const KIND_ROOM: Record<TaskKind, { set: SceneSet; glyph: GlyphId; color: string }> = {
  talk: { set: "cafe", glyph: "heart", color: "#2F6F6A" },
  build: { set: "workshop", glyph: "cube", color: "#A28457" },
  write: { set: "mailroom", glyph: "wave", color: "#3B5B92" },
  research: { set: "archive", glyph: "flask", color: "#6B4E71" },
  numbers: { set: "office", glyph: "coin", color: "#5E7C93" },
  sell: { set: "market", glyph: "rocket", color: "#8C3B2E" },
  plan: { set: "lobby", glyph: "star", color: "#4F6E6B" },
};

export default function Task() {
  const L = useLayout();
  const router = useRouter();
  const { week: weekParam, i: iParam } = useLocalSearchParams<{ week?: string; i?: string }>();
  const wN = Number(weekParam) || 1;
  const idx = Number(iParam) || 0;
  const { roadmap: plan, profile, planDone, togglePlanStep } = useFounder();
  const week = plan?.weeks.find((w) => w.n === wN) ?? null;
  const text = week?.do[idx] ?? "";
  const key = taskKey(wN, idx);
  const t = useTask(key, text, week);
  const gate = useGate();
  const [draft, setDraft] = useState("");
  const [burst, setBurst] = useState(0);
  const scroll = useRef<ScrollView>(null);
  const kind: TaskKind = t.guide?.kind ?? "plan";
  const room = KIND_ROOM[kind];
  const done = planDone.includes(key);
  const total = t.guide?.steps.length ?? 0;
  const ticked = t.guide ? t.ticks.filter((i) => i < total).length : 0;
  const allTicked = total > 0 && ticked === total;
  const now = weekNow(profile, plan);

  // every step ticked: the task marks itself done on the plan, once, with a small celebration
  useEffect(() => {
    if (allTicked && !done) {
      togglePlanStep(key);
      setBurst((b) => b + 1);
      void haptic("success");
    }
  }, [allTicked, done, key, togglePlanStep]);

  /** The next task not yet done: the rest of this week, then the weeks after, then back to the plan. */
  const next = useMemo((): Href | null => {
    if (!plan) return null;
    for (const w of plan.weeks) {
      if (w.n < wN) continue;
      for (let i = 0; i < w.do.length; i++) {
        if (w.n === wN && i <= idx) continue;
        if (!planDone.includes(taskKey(w.n, i))) return { pathname: "/task", params: { week: String(w.n), i: String(i) } } as Href;
      }
    }
    return null;
  }, [plan, planDone, wN, idx]);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/plan" as Href));
  const submit = (s = draft) => {
    const v = s.trim();
    if (!v || t.thinking) return;
    if (aiMode() !== "rehearsal" && !gate("coachTurn", { coach: "desk" })) return;
    setDraft("");
    t.send(v);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80);
  };

  if (!plan || !week || !text) {
    return (
      <View style={{ flex: 1, backgroundColor: shell.paper, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
        <Body tone="muted">That task is not on your plan any more.</Body>
        <Button variant="secondary" onPress={back}>
          Back
        </Button>
      </View>
    );
  }

  const enter = (k: number) => FadeInDown.delay(60 + k * 60).duration(240);
  const status = t.quota ? t.quota : t.source === "live" ? "Live · the desk knows this task, your plan and your notes" : aiMode() === "rehearsal" ? "Practice mode · the desk answers from the page" : t.lastError ? `Practice mode · ${t.lastError}` : "The desk is open";

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: L.insets.top + 8, paddingBottom: L.insets.bottom + 24, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 640, alignSelf: "center", gap: 16 }}>
          {/* the way back, and where this sits in the plan */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back to the plan" style={{ borderWidth: 1, borderColor: shell.line, borderRadius: radius.md, paddingHorizontal: 10, height: 36, justifyContent: "center" }}>
              <Spec tone="ink">← Plan</Spec>
            </Pressable>
            <Spec tone="muted">{`WEEK ${wN}${wN === now ? " · THIS WEEK" : ""} · TASK ${idx + 1} OF ${week.do.length}`}</Spec>
          </View>

          {/* the room */}
          <Scene key={room.set} set={room.set} height={L.compact ? 150 : 180} radiusPx={radius.xl} color={room.color} accessibilityLabel={TASK_KINDS[kind].label}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <GlyphTile id={room.glyph} color={room.color} size={28} scale={1} />
              <Spec tone="ink">{TASK_KINDS[kind].label.toUpperCase()}</Spec>
            </View>
          </Scene>

          {/* the task, in the desk's words */}
          <View style={{ gap: 8 }}>
            <Display size={L.compact ? "xl" : "3xl"}>{t.guide?.title ?? text.replace(/[.。]$/, "")}</Display>
            {t.guide ? (
              <Body tone="muted" size="lg">
                {t.guide.why}
              </Body>
            ) : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
              {t.guide ? <Tag glyph="bolt" color={room.color} label={t.guide.time} /> : null}
              <Tag glyph="leaf" color={room.color} label={week.focus.replace(/\.$/, "")} />
            </View>
          </View>

          {t.guide ? (
            <>
              {/* how far along, and the switch on the plan */}
              <Animated.View entering={enter(0)}>
                <Plate tone="panel" radius={radius.xl} padding={14} style={done ? { borderWidth: 1.5, borderColor: room.color } : undefined}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                    <View style={{ width: 64, height: 64 }}>
                      <Ring value={total ? ticked / total : 0} size={64} label={done ? "✓" : `${ticked}/${total}`} sub={done ? "done" : "steps"} color={room.color} />
                      <View style={{ position: "absolute", left: 32, top: 32 }}>
                        <Sparks burst={burst} reach={34} />
                      </View>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
                      <Body size="sm" medium>
                        {done ? "Done. It is ticked on your plan." : ticked === 0 ? "Tick each step as you do it." : allTicked ? "Every step ticked." : `${total - ticked} step${total - ticked === 1 ? "" : "s"} to go.`}
                      </Body>
                      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                        <Button size="sm" variant={done ? "ghost" : allTicked ? "primary" : "secondary"} onPress={() => { togglePlanStep(key); void haptic(done ? "light" : "success"); if (!done) setBurst((b) => b + 1); }}>
                          {done ? "Mark not done" : "Mark the task done"}
                        </Button>
                      </View>
                    </View>
                  </View>
                </Plate>
              </Animated.View>

              {/* the steps */}
              <View style={{ gap: 8 }}>
                <Spec tone="muted">THE STEPS</Spec>
                {t.guide.steps.map((s, i) => {
                  const on = t.ticks.includes(i);
                  return (
                    <Animated.View key={i} entering={enter(i + 1)}>
                      <Tap onPress={() => { t.tick(i); void haptic(on ? "light" : "medium"); }} accessibilityRole="checkbox" accessibilityLabel={s.do} scale={0.985}>
                        <View style={{ flexDirection: "row", gap: 12, backgroundColor: on ? wash(room.color, 0.1) : shell.panel, borderRadius: 16, borderWidth: 1.5, borderColor: on ? room.color : shell.line, padding: 12 }}>
                          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: on ? room.color : wash(room.color, 0.14), alignItems: "center", justifyContent: "center" }}>
                            {on ? <Glyph id="star" tone="paper" scale={1} /> : <Spec tone="ink">{String(i + 1)}</Spec>}
                          </View>
                          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                            <Body medium tone={on ? "muted" : "ink"} style={{ textDecorationLine: on ? "line-through" : "none" }}>
                              {s.do}
                            </Body>
                            {s.tip ? (
                              <Body size="sm" tone="muted">
                                {s.tip}
                              </Body>
                            ) : null}
                          </View>
                        </View>
                      </Tap>
                    </Animated.View>
                  );
                })}
              </View>

              {/* when it is finished */}
              <Animated.View entering={enter(t.guide.steps.length + 1)}>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: wash(room.color, 0.08), borderRadius: 16, padding: 12 }}>
                  <GlyphTile id="star" color={room.color} size={36} scale={1} />
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Spec tone="muted">YOU ARE DONE WHEN</Spec>
                    <Body size="sm" medium>
                      {t.guide.done}
                    </Body>
                  </View>
                </View>
              </Animated.View>

              {/* the founder's own notes */}
              <Animated.View entering={enter(t.guide.steps.length + 2)}>
                <Input label="YOUR NOTES" value={t.notes} onChangeText={t.setNotes} multiline placeholder="Names, quotes, what happened, what you would change…" style={{ minHeight: 88, textAlignVertical: "top" }} />
              </Animated.View>

              {/* the desk, on this task */}
              <View style={{ gap: 10 }}>
                <Spec tone="muted">ASK THE DESK ABOUT THIS</Spec>
                {t.chat.length === 0 ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {t.guide.starters.map((s) => (
                      <Chip key={s} onPress={() => submit(s)}>
                        {s}
                      </Chip>
                    ))}
                  </View>
                ) : null}
                {t.chat.length ? (
                  <View style={{ gap: 12 }}>
                    {t.chat.map((m) => (
                      <Message key={m.id} role={m.role} text={m.text} />
                    ))}
                  </View>
                ) : null}
                {t.thinking ? <Thinking label="At the desk…" /> : null}
                {t.quota ? (
                  <Pressable onPress={() => router.push({ pathname: "/plans", params: { why: t.quota } } as Href)} accessibilityRole="button">
                    <Chip grow={false} hint="See the plans →">{t.quota}</Chip>
                  </Pressable>
                ) : null}
                <Composer value={draft} onChange={setDraft} onSend={() => submit()} busy={t.thinking} placeholder="Ask about this task, or say where you are stuck…" status={status} />
                {t.chat.length ? (
                  <Pressable onPress={t.clearChat} accessibilityRole="button" style={{ alignSelf: "flex-start" }}>
                    <Spec tone="faint">Clear this conversation</Spec>
                  </Pressable>
                ) : null}
              </View>

              <ButtonRow>
                {next ? (
                  <Button arrow onPress={() => router.replace(next)}>
                    Next task
                  </Button>
                ) : (
                  <Button arrow onPress={() => router.replace("/plan" as Href)}>
                    Back to the plan
                  </Button>
                )}
                <Button variant="ghost" onPress={t.rewrite} disabled={t.writing}>
                  {t.writing ? "Writing…" : "Rewrite the page"}
                </Button>
              </ButtonRow>
              {t.lastError && t.source !== "live" ? <Spec tone="faint">{t.lastError}</Spec> : null}
            </>
          ) : (
            // the page being written: the desk's three cells, and the shape of what is coming
            <View style={{ gap: 12 }}>
              <Thinking label="The desk is writing your page…" />
              {[0, 1, 2].map((k) => (
                <View key={k} style={{ height: 72, borderRadius: 16, backgroundColor: shell.well }} />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Tag({ glyph, label, color }: { glyph: GlyphId; label: string; color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: wash(color, 0.12), borderRadius: radius.full, paddingLeft: 6, paddingRight: 10, paddingVertical: 4 }}>
      <Glyph id={glyph} tone="auto" scale={1} />
      <Spec tone="ink">{label}</Spec>
    </View>
  );
}
