/**
 * BUILD — the map, drawn as the building itself: six rooms stacked as
 * floors, the founder standing in the one their plan has them in this
 * week. The plan's four weeks are spent in the rooms from the one it
 * named first, so week one's tasks hang as windows on that room's sign,
 * week two's on the next, and the keeper walks down a floor when the
 * week moves on. A room opens as the Dialogue: this month's tasks in it
 * (each a door to its page), the room's own list with ticks, the week
 * read back, and two things to ask the guide. A room at 100% puts a
 * badge on the stand.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { STAGES, stageProgress, currentStage, pathProgress, DOC_KINDS, draftDocument, type BuildStage } from "@founderfloor/shared";
import { useIsFocused, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useGate } from "../../lib/gate";
import { Body, Building, Button, ButtonRow, Calendar, Dialogue, Display, Glyph, GlyphTile, Keeper, Plate, Progress, Scene, Spec, Stage, Tap, Tick, Toast, haptic, radius, shell, useLayout, wash, type Mood } from "@founderfloor/ui";
import { effectivePlan } from "../../lib/billing";
import { roomGate, trialLeft, FREE_ROOMS } from "../../lib/trial";
import { ROOM_COLOR, ROOM_GLYPH } from "../../lib/glyphs";
import { Hint } from "../../components/Hint";
import { TourTarget } from "../../components/TourTarget";
import { useTour } from "../../lib/tour";
import { TopBar } from "../../components/TopBar";
import { COLUMN, useBottomChrome } from "../../lib/chrome";
import { useFounder } from "../../lib/store";
import { roomOfWeek, taskKey, weekNow } from "../../lib/taskDesk";
import { useStand } from "../../lib/stand";
import { askGuide, whereAmI } from "@founderfloor/shared";
import { COACHES } from "../../lib/mock";

const DOOR = STAGES.map((s) => ROOM_COLOR[s.id]);

export default function Build() {
  const L = useLayout();
  const router = useRouter();
  const gate = useGate();
  const bottom = useBottomChrome();
  const ticks = useFounder((s) => s.ticks);
  const toggleTick = useFounder((s) => s.toggleTick);
  const work = useFounder((s) => s.work);
  const saveDoc = useFounder((s) => s.saveDoc);
  const kpi = useFounder((s) => s.kpi);
  const interviews = useFounder((s) => s.interviews);
  const visits = useFounder((s) => s.visits);
  const streak = useFounder((s) => s.streak);
  const guided = useFounder((s) => s.guided);
  const plan = useFounder((s) => s.roadmap);
  const profile = useFounder((s) => s.profile);
  const planDone = useFounder((s) => s.planDone);
  const reviews = useFounder((s) => s.reviews);
  const focused = useIsFocused();
  const { tour, then, room } = useLocalSearchParams<{ tour?: string; then?: string; room?: string }>();
  const startTour = useTour((s) => s.start);
  const closedStep = useTour((s) => s.closed);
  useEffect(() => {
    if (tour === "1") {
      const t = setTimeout(() => startTour(then || undefined), 120);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour]);
  const opened = effectivePlan() !== "free" || !!trialLeft();
  useEffect(() => {
    const st = room ? STAGES.find((x) => x.id === room) : null;
    if (st) {
      const t = setTimeout(() => void openRoom(st), 200);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);
  const stand = useStand();
  const [open, setOpen] = useState<BuildStage | null>(null);
  const [guide, setGuide] = useState<{ q: string; text: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mood, setMood] = useState<Mood>("idle");
  const [opening, setOpening] = useState<string | null>(null);
  const cur = currentStage(ticks);
  const wk = weekNow(profile, plan);
  /** Which room each week of the plan is spent in, and the plan's tasks by room. */
  const roomWeeks = useMemo(() => (plan ? plan.weeks.map((w) => ({ w, room: roomOfWeek(plan, w.n) })) : []), [plan]);
  const tasksIn = (i: number) => roomWeeks.filter((x) => x.room === i).flatMap((x) => x.w.do.map((text, k) => ({ text, week: x.w.n, i: k, done: planDone.includes(taskKey(x.w.n, k)) })));
  const hereIndex = plan ? roomOfWeek(plan, wk) : STAGES.findIndex((s) => s.id === cur.id);
  const here = STAGES[hereIndex];
  const react = (m: Mood) => {
    setMood(m);
    setTimeout(() => setMood("idle"), 900);
  };
  const ines = COACHES.find((c) => c.id === "strategy")!;

  const tick = (stage: BuildStage, id: string) => {
    const before = stageProgress(stage, ticks);
    const on = !ticks.includes(id);
    toggleTick(id);
    const after = stageProgress(stage, on ? [...ticks, id] : ticks.filter((t) => t !== id));
    if (on) {
      void haptic(after >= 1 ? "success" : "light");
      react(after >= 1 ? "cheer" : "nod");
    }
    if (before < 1 && after >= 1) {
      setToast(`${stage.name} is done — a badge is on your stand.`);
      setTimeout(() => setToast(null), 2800);
    }
  };
  const openRoom = async (s: BuildStage) => {
    setGuide(null);
    void haptic("light");
    // the mine: the rooms past the gate open with the week of the whole staff, or Pro
    if (!(await roomGate(s.n))) return;
    setOpening(s.id);
    setTimeout(() => {
      setOpen(s);
      setOpening(null);
    }, 260);
  };
  const rooms = useMemo(
    () =>
      STAGES.map((s, i) => {
        const p = stageProgress(s, ticks);
        const weeks = roomWeeks.filter((x) => x.room === i).map((x) => x.w.n);
        return { id: s.id, name: s.name, color: DOOR[i], glyph: ROOM_GLYPH[s.id] ?? "bolt", tasks: tasksIn(i).map((t) => ({ text: t.text, done: t.done })), week: weeks.length ? `Week ${weeks.join(" & ")}` : undefined, meta: `${s.items.filter((x) => ticks.includes(x.id)).length} of ${s.items.length} on the list`, progress: p, done: p >= 1, locked: s.n > FREE_ROOMS && !opened };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ticks, roomWeeks, planDone, opened],
  );
  const walked = plan ? planDone.length / Math.max(1, plan.weeks.reduce((n, w) => n + w.do.length, 0)) : pathProgress(ticks);

  return (
    <View style={{ flex: 1 }}>
      <TopBar center={<Spec tone="muted">{`The map · ${Math.round(walked * 100)}% walked`}</Spec>} />
      <ScrollView contentContainerStyle={{ width: "100%", maxWidth: COLUMN + 120, alignSelf: "center", paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: bottom, gap: 16 }}>
        <Scene set="workshop" height={L.compact ? 150 : 180} radiusPx={radius.xl} ambient={focused} accessibilityLabel="The map">
          <Pressable onPress={() => void openRoom(here)} accessibilityRole="button" accessibilityLabel="Open the room you are in" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <GlyphTile id={ROOM_GLYPH[here.id] ?? "bolt"} color={DOOR[hereIndex]} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Spec tone="muted">{plan ? `You are in · Week ${wk}` : "YOU ARE IN"}</Spec>
              <Body medium numberOfLines={1}>{plan ? `${here.name} · ${tasksIn(hereIndex).filter((t) => t.done).length} of ${tasksIn(hereIndex).length} tasks done` : `${cur.name} · ${cur.items.filter((x) => ticks.includes(x.id)).length} of ${cur.items.length} done`}</Body>
            </View>
            <Body tone="accent">›</Body>
          </Pressable>
        </Scene>
        <Display size={L.compact ? "3xl" : "4xl"}>The map</Display>
        {guided ? <Hint id="map" text={plan ? "The building, floor by floor. Your plan's weeks are spent in these rooms; the windows on a sign are that week's tasks. Tap a room to open it." : "Six rooms, floor by floor. Tap the room you are in to see what to do there and tick what is done."} /> : null}
        <Plate tone="panel" radius={radius.xxl} padding={12}>
          <TourTarget id="map" style={{ borderRadius: 20, overflow: "hidden" }}>
            <Building rooms={rooms} here={hereIndex} look={stand.look} onPress={(i) => void openRoom(STAGES[i])} />
          </TourTarget>
          {!opened ? (
            <Spec tone="faint" style={{ marginTop: 4 }}>
              {`Rooms 1 to ${FREE_ROOMS} are every founder's. The last three open with your free week with the whole staff.`}
            </Spec>
          ) : null}
        </Plate>
        <Plate tone="panel" radius={radius.xl} padding={16}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Body medium>Your trail</Body>
            <Spec tone="faint">{streak.days ? `${streak.days}-day streak` : "day one"}</Spec>
          </View>
          <View style={{ flexDirection: "row", marginTop: 12, marginBottom: 12 }}>
            {[
              ["Done", ticks.length],
              ["Weeks", kpi.length],
              ["Talks", interviews.length],
              ["Days", visits.length],
            ].map(([k, v], i) => (
              <View key={String(k)} style={{ flex: 1, borderLeftWidth: i ? 1 : 0, borderLeftColor: shell.line, paddingLeft: i ? 12 : 0 }}>
                <Display size="lg">{String(v)}</Display>
                <Spec tone="muted">{String(k)}</Spec>
              </View>
            ))}
          </View>
          <Calendar active={visits} />
        </Plate>
      </ScrollView>

      <Dialogue open={!!open} onClose={() => { setOpen(null); closedStep("room"); }} sign={open?.sign ?? ""} keeper={ines.name} blurb={open?.blurb} color={open ? DOOR[open.n - 1] : shell.accent} wide footer="Tap a line for how to do it and to write what you did. Tick what is true, not what you intend.">
        {open ? (
          <View style={{ gap: 12 }}>
            <Stage look={ines.look} color={DOOR[open.n - 1]} scale={2} height={128} radiusPx={16} set="workshop" ambient={false} who={ines.name} say={mood === "cheer" ? "That is the room. Badge is on the stand." : mood === "nod" ? "Written down." : open.blurb} mood={mood} />
            {tasksIn(open.n - 1).length ? (
              <View style={{ gap: 8 }}>
                <Spec tone="muted">{`Your plan, in this room · ${roomWeeks.filter((x) => x.room === open.n - 1).map((x) => `WEEK ${x.w.n}`).join(" & ")}`}</Spec>
                {tasksIn(open.n - 1).map((t) => (
                  <Tap key={`${t.week}-${t.i}`} onPress={() => { setOpen(null); router.push({ pathname: "/task", params: { week: String(t.week), i: String(t.i) } } as Href); }} accessibilityRole="button" accessibilityLabel={`Open task: ${t.text}`} scale={0.985}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: t.done ? wash(DOOR[open.n - 1], 0.1) : shell.paper, borderRadius: 16, borderWidth: 1, borderColor: t.done ? DOOR[open.n - 1] : shell.line, paddingVertical: 9, paddingHorizontal: 10 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: t.done ? DOOR[open.n - 1] : wash(DOOR[open.n - 1], 0.14), alignItems: "center", justifyContent: "center" }}>
                        {t.done ? <Glyph id="star" tone="paper" scale={1} /> : <Spec tone="ink">{String(t.i + 1)}</Spec>}
                      </View>
                      <Body size="sm" tone={t.done ? "muted" : "ink"} style={{ flex: 1, textDecorationLine: t.done ? "line-through" : "none" }}>
                        {t.text}
                      </Body>
                      <Body tone="accent">›</Body>
                    </View>
                  </Tap>
                ))}
                {roomWeeks.some((x) => x.room === open.n - 1 && x.w.n <= wk) ? (
                  <Pressable onPress={() => { const w = roomWeeks.find((x) => x.room === open.n - 1 && x.w.n <= wk)!.w.n; setOpen(null); router.push({ pathname: "/review", params: { week: String(w) } } as Href); }} accessibilityRole="button" accessibilityLabel="Read the week back" style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 }}>
                    <Glyph id="coin" tone="auto" scale={1} />
                    <Spec tone="accent">{(() => { const w = roomWeeks.find((x) => x.room === open.n - 1 && x.w.n <= wk)!.w.n; return reviews[w] ? `Week ${w}: ${reviews[w].verdict}, ${reviews[w].score} of 100 →` : `Read week ${w} back →`; })()}</Spec>
                  </Pressable>
                ) : null}
                <Spec tone="muted" style={{ marginTop: 4 }}>The room's own list · Tap A line</Spec>
              </View>
            ) : null}
            <Progress value={stageProgress(open, ticks)} label={open.name} right={`${Math.round(stageProgress(open, ticks) * 100)}%`} color={stageProgress(open, ticks) >= 1 ? shell.verify : shell.accent} />
            <View>
              {open.items.map((it, i) => (
                <View key={it.id} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: shell.line }}>
                  <Tick done={ticks.includes(it.id)} text={it.text} proof={it.proof} onToggle={() => tick(open, it.id)} written={(work[it.id] ?? []).filter((m) => m.role === "you").length} onOpen={() => { setOpen(null); router.push({ pathname: "/did", params: { id: it.id } } as Href); }} />
                </View>
              ))}
            </View>
            <ButtonRow>
              <Button size="sm" onPress={() => setGuide({ q: "Ask the guide", text: askGuide(stand.record, ticks, open.id) })}>
                Ask the guide
              </Button>
              <Button size="sm" variant="secondary" onPress={() => setGuide({ q: "Where am I really?", text: whereAmI(stand.record, ticks) })}>
                Where am I really?
              </Button>
            </ButtonRow>
            {guide ? <Typed q={guide.q} text={guide.text} look={ines.look} color={ines.color} /> : null}
            {DOC_KINDS.filter((k) => k.room === open.id && k.kind !== "update").length ? (
              <View style={{ gap: 8, marginTop: 4 }}>
                <Spec tone="muted">Draft it for me</Spec>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {DOC_KINDS.filter((k) => k.room === open.id && k.kind !== "update").map((k) => (
                    <Button
                      key={k.kind}
                      size="sm"
                      variant="ghost"
                      onPress={() => {
                        if (!gate("draft")) return;
                        saveDoc(draftDocument(k.kind, stand.record), "rehearsal");
                        setToast(`${k.title} is in the drawer.`);
                        setTimeout(() => setToast(null), 2600);
                        setOpen(null);
                        router.push("/drawer");
                      }}
                    >
                      {k.title}
                    </Button>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </Dialogue>
      <Toast text={toast ?? ""} visible={!!toast} />
    </View>
  );
}

/** The site's dialogue box: text typed out character by character. */
function Typed({ q, text, look, color }: { q: string; text: string; look: { skin: number; outfit: number; hair: number }; color: string }) {
  const [n, setN] = useState(0);
  const t = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    setN(0);
    t.current = setInterval(() => setN((x) => (x >= text.length ? x : x + 2)), 14);
    return () => {
      if (t.current) clearInterval(t.current);
    };
  }, [text]);
  return (
    <Plate tone="paper" radius={radius.lg} padding={14}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
        <Keeper look={look} scale={1} color={color} speaking={n < text.length} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Spec tone="muted">{q}</Spec>
          <Body style={{ marginTop: 4 }}>
            {text.slice(0, n)}
            {n < text.length ? <Body tone="accent">▍</Body> : null}
          </Body>
        </View>
      </View>
    </Plate>
  );
}
