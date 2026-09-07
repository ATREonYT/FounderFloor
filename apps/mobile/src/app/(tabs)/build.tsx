/**
 * BUILD — the workshop. Six rooms, each a door on the wall with its sign
 * over it and a stepped meter under it. A room opens as the Dialogue: the
 * site's quest list with ticks, and two things to ask the guide, whose
 * answer types itself out character by character the way the floor's
 * dialogue does. A room at 100% puts a badge on the stand.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { STAGES, stageProgress, currentStage, pathProgress, DOC_KINDS, draftDocument, type BuildStage } from "@founderfloor/shared";
import { useRouter } from "expo-router";
import { useGate } from "../../lib/gate";
import { Body, Button, ButtonRow, Calendar, Dialogue, Display, GlyphTile, Journey, Keeper, Plate, Progress, Scene, Spec, Stage, Tick, Toast, art, haptic, radius, scheme, shell, useLayout, wash, type Mood } from "@founderfloor/ui";
import { effectivePlan } from "../../lib/billing";
import { roomGate, trialLeft, FREE_ROOMS } from "../../lib/trial";
import { ROOM_GLYPH } from "../../lib/glyphs";
import { TopBar } from "../../components/TopBar";
import { COLUMN, useBottomChrome } from "../../lib/chrome";
import { useFounder } from "../../lib/store";
import { useStand } from "../../lib/stand";
import { askGuide, whereAmI } from "@founderfloor/shared";
import { COACHES } from "../../lib/mock";

const DOOR = ["#8C3B2E", "#3B5B92", "#4E6E4E", "#B4762E", "#2F6F6A", "#6B4E71"];

export default function Build() {
  const L = useLayout();
  const router = useRouter();
  const gate = useGate();
  const bottom = useBottomChrome();
  const { ticks, toggleTick, saveDoc, kpi, interviews, visits, streak } = useFounder();
  const opened = effectivePlan() !== "free" || !!trialLeft();
  const stand = useStand();
  const [open, setOpen] = useState<BuildStage | null>(null);
  const [guide, setGuide] = useState<{ q: string; text: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mood, setMood] = useState<Mood>("idle");
  const [opening, setOpening] = useState<string | null>(null);
  const cur = currentStage(ticks);
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
  const stops = STAGES.map((s, i) => {
    const p = stageProgress(s, ticks);
    return { id: s.id, name: s.name, meta: `${s.items.filter((x) => ticks.includes(x.id)).length} of ${s.items.length}`, color: DOOR[i], progress: p, done: p >= 1, locked: s.n > FREE_ROOMS && !opened };
  });
  const hereIndex = STAGES.findIndex((s) => s.id === cur.id);

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <TopBar center={<Spec tone="muted">{`The map · ${Math.round(pathProgress(ticks) * 100)}% walked`}</Spec>} />
      <ScrollView contentContainerStyle={{ width: "100%", maxWidth: COLUMN + 120, alignSelf: "center", paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: bottom, gap: 16 }}>
        <Scene set="workshop" height={L.compact ? 150 : 180} radiusPx={radius.xl} accessibilityLabel="The map">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <GlyphTile id={ROOM_GLYPH[cur.id] ?? "bolt"} color={DOOR[cur.n - 1]} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Spec tone="muted">YOU ARE IN</Spec>
              <Body medium numberOfLines={1}>{`${cur.name} · ${cur.items.filter((x) => ticks.includes(x.id)).length} of ${cur.items.length} done`}</Body>
            </View>
          </View>
        </Scene>
        <Display size={L.compact ? "3xl" : "4xl"}>The map</Display>
        <Plate tone="panel" radius={radius.xxl} padding={12}>
          <View style={{ borderRadius: 20, overflow: "hidden", backgroundColor: wash(art.floors["main-hall"].a, scheme() === "dark" ? 0.12 : 0.3), paddingVertical: 8 }}>
            <Journey stops={stops} here={hereIndex} look={stand.look} onPress={(i) => void openRoom(STAGES[i])} />
          </View>
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

      <Dialogue open={!!open} onClose={() => setOpen(null)} sign={open?.sign ?? ""} keeper={ines.name} blurb={open?.blurb} color={open ? DOOR[open.n - 1] : shell.accent} wide footer="Tick what is true, not what you intend.">
        {open ? (
          <View style={{ gap: 12 }}>
            <Stage look={ines.look} color={DOOR[open.n - 1]} scale={2} height={128} radiusPx={16} set="workshop" ambient={false} who={ines.name} say={mood === "cheer" ? "That is the room. Badge is on the stand." : mood === "nod" ? "Written down." : open.blurb} mood={mood} />
            <Progress value={stageProgress(open, ticks)} label={open.name} right={`${Math.round(stageProgress(open, ticks) * 100)}%`} color={stageProgress(open, ticks) >= 1 ? shell.verify : shell.accent} />
            <View>
              {open.items.map((it, i) => (
                <View key={it.id} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: shell.line }}>
                  <Tick done={ticks.includes(it.id)} text={it.text} proof={it.proof} onToggle={() => tick(open, it.id)} />
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
                <Spec tone="muted">DRAFT IT FOR ME</Spec>
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
