/**
 * THE DESK — the home screen, in the shape every assistant app shares: a
 * greeting, four things to try, a composer at the bottom, a picker pill at
 * the top. What makes it this building: the picker shows the hall you are
 * in and who is there; the assistant is a keeper standing at a pixel
 * counter; the suggestion chips are paper signs; the reply reads like a
 * page beside the keeper. `?coach=` puts a stall keeper behind the desk.
 */
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import { Body, Button, Chip, Composer, Dialogue, Display, Glyph, GlyphTile, Keeper, Message, Pill, Plate, Spec, Stage, Streak, Thinking, radius, shell, useLayout, type Mood } from "@founderfloor/ui";
import { TopBar } from "../../components/TopBar";
import { COLUMN, useBottomChrome, takePendingSay } from "../../lib/chrome";
import { COACH_SET } from "../../lib/glyphs";
import { COACHES, HALLS, STARTERS, greeting, type HallId } from "../../lib/mock";
import { useStand } from "../../lib/stand";
import { useGate } from "../../lib/gate";
import { aiMode, MODE_LINE } from "../../lib/ai";
import { useReceptionist } from "../../lib/receptionist";
import { effectivePlan } from "../../lib/billing";
import { trialLeft } from "../../lib/trial";
import { useFounder, isoWeek } from "../../lib/store";
import { remembers, MINES, STAGES, currentStage, stageProgress } from "@founderfloor/shared";
import { ROOM_GLYPH } from "../../lib/glyphs";
import { roomOfWeek } from "../../lib/taskDesk";
import { Hint } from "../../components/Hint";
import { TourTarget } from "../../components/TourTarget";
import { useTour } from "../../lib/tour";

export default function Reception() {
  const L = useLayout();
  const router = useRouter();
  const bottom = useBottomChrome();
  const { coach: coachParam } = useLocalSearchParams<{ coach?: string }>();
  const gate = useGate();
  const focused = useIsFocused();
  const { coach, messages, busy, thinking, send, reset, starters, source, quota, lastError } = useReceptionist(coachParam);
  const stand = useStand();
  const [draft, setDraft] = useState("");
  const [hallId, setHallId] = useState<HallId>("main-hall");
  const [halls, setHalls] = useState(false);
  const hall = HALLS.find((h) => h.id === hallId)!;
  const scroll = useRef<ScrollView>(null);
  const empty = messages.length === 0;
  const atDesk = coach.id === "desk";
  const streaming = messages.some((m) => m.streaming);
  const mood: Mood = thinking || streaming ? "talk" : "idle";
  const lastDesk = [...messages].reverse().find((m) => m.role === "desk");
  const streak = stand.streak;
  const notes = useFounder((s) => s.notes);
  const ticks = useFounder((s) => s.ticks);
  const roadmap = useFounder((s) => s.roadmap);
  const profile = useFounder((s) => s.profile);
  const weekNow = profile ? Math.min(4, Math.max(1, Math.floor((Date.now() - new Date(profile.at).getTime()) / (7 * 86_400_000)) + 1)) : 1;
  const focus = roadmap?.weeks.find((w) => w.n === weekNow)?.focus;
  const planDone = useFounder((s) => s.planDone);
  // the first task of this week not yet done, so Home can open it in one tap
  const weekTask = (() => {
    const w = roadmap?.weeks.find((x) => x.n === weekNow);
    if (!w) return null;
    const i = w.do.findIndex((_, k) => !planDone.includes(`${w.n}-${k}`));
    return i < 0 ? null : { week: w.n, i, text: w.do[i] };
  })();
  const weekTotal = roadmap?.weeks.find((x) => x.n === weekNow)?.do.length ?? 0;
  const weekDoneCount = roadmap ? (roadmap.weeks.find((x) => x.n === weekNow)?.do.filter((_, k) => planDone.includes(`${weekNow}-${k}`)).length ?? 0) : 0;
  /** The room this week is spent in on the map. */
  const weekRoom = roadmap ? STAGES[roomOfWeek(roadmap, weekNow)] : currentStage(ticks);
  const kpi = useFounder((s) => s.kpi);
  const cur = currentStage(ticks);
  const curDone = cur.items.filter((x) => ticks.includes(x.id)).length;
  const nextItem = cur.items.find((x) => !ticks.includes(x.id));
  const weekLogged = kpi.some((e) => e.week === isoWeek());
  const DOOR = ["#8C3B2E", "#3B5B92", "#4E6E4E", "#B4762E", "#2F6F6A", "#6B4E71"];
  const week = trialLeft();
  const forgets = !remembers(effectivePlan()) && !atDesk && notes.some((n) => n.coach === coach.name);

  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 40);
    return () => clearTimeout(t);
  }, [messages, thinking]);

  const submit = (text = draft) => {
    if (!text.trim() || busy) return;
    // Free's turns are counted only when a model will answer; a script is free
    if (aiMode() !== "rehearsal" && !gate("coachTurn", { coach: coach.id })) return;
    send(text);
    setDraft("");
  };
  useEffect(() => {
    const say = takePendingSay(coach.id);
    if (say && !busy) {
      const t = setTimeout(() => submit(say), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coach.id]);
  const column = { width: "100%" as const, maxWidth: COLUMN, alignSelf: "center" as const, paddingHorizontal: L.shell.paddingHorizontal };

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <TopBar
        center={<Pill label={hall.name} meta={L.compact && !empty ? undefined : `${hall.here} here`} live onPress={() => setHalls(true)} />}
        right={
          !empty ? (
            <Button
              size="sm"
              variant="ghost"
              onPress={() => {
                reset();
                if (!atDesk) router.setParams({ coach: undefined });
              }}
            >
              New
            </Button>
          ) : null
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          contentContainerStyle={[column, { flexGrow: 1, justifyContent: empty ? "flex-end" : "flex-start", paddingTop: 8, paddingBottom: 16, gap: 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          {empty ? (
            <View style={{ gap: 20, paddingBottom: 8 }}>
              <Stage look={coach.look} color={coach.color} who={atDesk ? "The desk" : coach.name} say={atDesk ? `${greeting(stand.founder || undefined)} ${stand.record.weeklyGoal ? `This week: ${stand.record.weeklyGoal}.` : "The desk is open."}` : coach.greeting} mood="idle" scale={2} height={L.compact ? 200 : 240} ambient={focused} set={atDesk ? "lobby" : COACH_SET[coach.id as keyof typeof COACH_SET] ?? "lobby"}>
                <Streak days={Array.from({ length: 7 }, (_, i) => i >= 7 - Math.min(7, streak))} label={streak === 1 ? "day one" : streak ? `${streak}-day streak` : "day one"} />
              </Stage>
              {week ? (
                <Pressable onPress={() => router.push("/plans")} accessibilityRole="button" style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: shell.line, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: week.days <= 2 ? shell.accent : shell.verify }} />
                  <Spec tone="ink">{week.days <= 2 ? `The whole staff: ${week.days === 1 ? "last day" : "two days left"}. Keep them for $19/month.` : `The whole staff · ${week.days} days left`}</Spec>
                </Pressable>
              ) : null}
              {forgets ? (
                <Pressable onPress={() => router.push({ pathname: "/plans", params: { why: MINES["coach-memory"].why } })} accessibilityRole="button" accessibilityLabel="The staff remember, on Pro">
                  <Plate tone="paper" radius={radius.lg} padding={12} lineColor={coach.color}>
                    <Spec tone="muted">{`${coach.name.toUpperCase()} · ${notes.filter((n) => n.coach === coach.name).length} NOTES, UNREAD`}</Spec>
                    <Body size="sm" style={{ marginTop: 4 }}>
                      {`${MINES["coach-memory"].title} ${MINES["coach-memory"].line}`}
                    </Body>
                    <Spec tone="accent" style={{ marginTop: 4 }}>
                      Keep the notes · Pro →
                    </Spec>
                  </Plate>
                </Pressable>
              ) : null}
              {atDesk ? <Hint id="home" text="This is Home. The card below says what to do next; the box at the bottom asks the desk anything. The tabs underneath are the whole building." /> : null}
              {atDesk ? (
                <TourTarget id="home-next">
                <Pressable onPress={() => { if (useTour.getState().active) return; /* on the tour the tap only moves the tour on; the tabs must stay in view */ if (weekTask) router.push({ pathname: "/task", params: { week: String(weekTask.week), i: String(weekTask.i) } }); else router.navigate("/build"); }} accessibilityRole="button" accessibilityLabel={weekTask ? "Next on your plan" : "Next on the map"}>
                  <Plate tone="panel" radius={radius.xl} padding={14}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <GlyphTile id={ROOM_GLYPH[weekRoom.id] ?? "bolt"} color={DOOR[weekRoom.n - 1]} size={44} />
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <Spec tone="muted">{roadmap ? `Up next · Week ${weekNow} · ${weekRoom.name} room` : `Up next · Room ${cur.n}, ${cur.name} · ${curDone} of ${cur.items.length}`}</Spec>
                        <Body size="sm" medium numberOfLines={2}>
                          {roadmap ? (weekTask ? weekTask.text : `Every task of week ${weekNow} is done. Read the week back.`) : nextItem ? nextItem.text : "Every room walked. Time for the floor."}
                        </Body>
                      </View>
                      <Body tone="accent">›</Body>
                    </View>
                    {focus ? (
                      <Pressable onPress={() => router.navigate("/build")} accessibilityRole="button" accessibilityLabel="Open the map" style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: shell.paper, borderRadius: 12, padding: 10 }}>
                        <Glyph id="cube" tone="auto" scale={1} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Spec tone="muted">{`THIS WEEK · ${focus.replace(/\.$/, "").toUpperCase()}`}</Spec>
                          <Spec tone="ink">{`${weekDoneCount} of ${weekTotal} tasks done · in the ${weekRoom.name} room on the map`}</Spec>
                        </View>
                        <Body tone="accent">›</Body>
                      </Pressable>
                    ) : null}
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                      <Chip grow={false} onPress={() => router.navigate("/office")}>{weekLogged ? "Week logged ✓" : "Log the week"}</Chip>
                      <Chip grow={false} onPress={() => router.push(roadmap ? "/plan" : "/welcome")}>{roadmap ? "My plan" : "Make my plan"}</Chip>
                      {roadmap ? <Chip grow={false} onPress={() => router.push({ pathname: "/review", params: { week: String(weekNow) } })}>{`Week ${weekNow}, read back`}</Chip> : null}
                      <Chip grow={false} onPress={() => router.push("/guide")}>How it works</Chip>
                    </View>
                  </Plate>
                </Pressable>
                </TourTarget>
              ) : null}
              <View style={{ gap: 6 }}>
                <Display size={L.compact ? "3xl" : "4xl"}>{atDesk ? "What do you need?" : coach.title}</Display>
                <Body tone="muted" size={L.compact ? "base" : "lg"} style={{ maxWidth: 560 }}>
                  {atDesk ? "Ask about your company, or pick a coach." : coach.blurb}
                </Body>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {STARTERS.map((s) => (
                  <Chip key={s.text} hint={s.hint} onPress={() => submit(s.text)}>
                    {s.text}
                  </Chip>
                ))}
              </View>
              <View style={{ gap: 8 }}>
                <Body medium>Coaches</Body>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {COACHES.map((c) => (
                    <Pressable key={c.id} onPress={() => router.setParams({ coach: c.id })} accessibilityRole="button" accessibilityLabel={`Talk to ${c.name}`} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: shell.line, borderRadius: radius.full, paddingRight: 12, paddingLeft: 4, paddingVertical: 4 })}>
                      <Keeper look={c.look} scale={1} color={c.color} />
                      <View>
                        <Body size="sm" medium>
                          {c.name}
                        </Body>
                        <Spec tone="faint">{c.title}</Spec>
                      </View>
                    </Pressable>
                  ))}
                  <Pressable onPress={() => router.push("/coaches")} accessibilityRole="button" style={{ justifyContent: "center", paddingHorizontal: 8 }}>
                    <Spec tone="accent">Who they are →</Spec>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <>
              <Stage look={coach.look} color={coach.color} mood={mood} scale={2} height={112} radiusPx={20} ambient={false} set={atDesk ? "lobby" : COACH_SET[coach.id as keyof typeof COACH_SET] ?? "lobby"} who={atDesk ? "The desk" : coach.name} say={lastDesk && !lastDesk.streaming ? undefined : undefined} />
              {messages.map((m) => (
                <Message key={m.id} role={m.role} text={m.text} streaming={m.streaming} avatar={m.role === "desk" ? <Keeper look={coach.look} scale={1} speaking={!!m.streaming} color={coach.color} /> : undefined} />
              ))}
              {quota ? (
                <Pressable onPress={() => router.push({ pathname: "/plans", params: { why: quota } })} accessibilityRole="button">
                  <Chip grow={false} hint="See the plans →">{quota}</Chip>
                </Pressable>
              ) : null}
              {thinking ? <Thinking label={atDesk ? "At the desk…" : `${coach.name} is looking…`} avatar={<Keeper look={coach.look} scale={1} speaking color={coach.color} />} /> : null}
            </>
          )}
        </ScrollView>

        <View style={[column, { paddingBottom: bottom, gap: 8 }]}>
          {!atDesk && messages.length <= 1 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {starters.map((t) => (
                <Chip key={t} grow={false} onPress={() => submit(t)}>
                  {t}
                </Chip>
              ))}
            </View>
          ) : null}
          <Composer
            value={draft}
            onChange={setDraft}
            onSend={() => submit()}
            onAttach={() => router.push("/drawer")}
            placeholder={atDesk ? "Ask the desk…" : `Ask ${coach.name}…`}
            busy={busy}
            status={aiMode() === "rehearsal" ? `${MODE_LINE.rehearsal} · ${hall.name}` : source === "live" ? `${MODE_LINE[aiMode()]} · ${hall.name}` : lastError ? `Scripted reply. ${lastError}` : `${MODE_LINE[aiMode()]} · ${hall.name}`}
          />
        </View>
      </KeyboardAvoidingView>

      <Dialogue open={halls} onClose={() => setHalls(false)} sign="PORTER'S LODGE" keeper="Halloway" blurb="Which floors are open, and who is on them right now." color="#4F6E6B">
        <View style={{ gap: 8 }}>
          {HALLS.map((h) => (
            <View key={h.id} style={{ opacity: h.open ? 1 : 0.5 }}>
              <Chip
                grow={false}
                hint={`${h.here} here · ${h.tagline}`}
                onPress={() => {
                  setHallId(h.id);
                  setHalls(false);
                }}
              >
                {h.id === hallId ? `→ ${h.name}` : h.name}
              </Chip>
            </View>
          ))}
          <Spec tone="faint" style={{ marginTop: 8 }}>
            Counts are live on the floor; the desk answers for the hall you pick.
          </Spec>
        </View>
      </Dialogue>
    </View>
  );
}
