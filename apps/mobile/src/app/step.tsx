/**
 * THE ROOM AT ONE STEP — where the work gets written. The step sits at
 * the top in the task's colour with its tip and a tick; under it the
 * desk asks the question for this kind of work, and the founder writes
 * what they did, found or decided, so it is here and not in some other
 * app. Every line goes into the notebook; the desk answers over the whole
 * task and the notebook, and says when the step is done.
 */
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { TASK_KINDS, parseDoor } from "@founderfloor/shared";
import { Body, Chip, Composer, Glyph, GlyphTile, Keeper, Message, Spec, Tap, Thinking, haptic, radius, shell, useLayout, wash } from "@founderfloor/ui";
import { useFounder } from "../lib/store";
import { useGate } from "../lib/gate";
import { aiMode } from "../lib/ai";
import { taskKey, useStepRoom } from "../lib/taskDesk";
import { KIND_ROOM } from "./task";
import { RECEPTIONIST } from "../lib/mock";

export default function Step() {
  const L = useLayout();
  const router = useRouter();
  const { week: weekParam, i: iParam, s: sParam } = useLocalSearchParams<{ week?: string; i?: string; s?: string }>();
  const wN = Number(weekParam) || 1;
  const idx = Number(iParam) || 0;
  const sIdx = Number(sParam) || 0;
  const plan = useFounder((s) => s.roadmap);
  const week = plan?.weeks.find((w) => w.n === wN) ?? null;
  const text = week?.do[idx] ?? "";
  const key = taskKey(wN, idx);
  const r = useStepRoom(key, text, week, sIdx);
  const gate = useGate();
  const [draft, setDraft] = useState("");
  const scroll = useRef<ScrollView>(null);
  const kind = r.guide?.kind ?? "plan";
  const room = KIND_ROOM[kind];
  const total = r.guide?.steps.length ?? 0;
  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 120);
  }, [r.turns.length, r.thinking]);

  const back = () => (router.canGoBack() ? router.back() : router.replace({ pathname: "/task", params: { week: String(wN), i: String(idx) } } as Href));
  const submit = (s = draft) => {
    const v = s.trim();
    if (!v || r.thinking) return;
    if (aiMode() !== "rehearsal" && !gate("coachTurn", { coach: "desk" })) return;
    setDraft("");
    r.send(v);
  };
  const goStep = (n: number) => router.replace({ pathname: "/step", params: { week: String(wN), i: String(idx), s: String(n) } } as Href);

  if (!r.guide || !r.step) {
    return (
      <View style={{ flex: 1, backgroundColor: shell.paper, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
        <Body tone="muted">Open the task first; its page writes the steps.</Body>
        <Pressable onPress={back} accessibilityRole="button" style={{ backgroundColor: shell.well, borderRadius: radius.full, paddingHorizontal: 14, height: 36, justifyContent: "center" }}>
          <Spec tone="ink">← Back</Spec>
        </Pressable>
      </View>
    );
  }
  const status = r.quota ? r.quota : r.source === "live" ? "Live · written to your notebook, read by the desk" : aiMode() === "rehearsal" ? "Practice mode · written to your notebook" : r.lastError ? `Practice mode · ${r.lastError}` : "Written to your notebook";
  const avatar = <Keeper look={RECEPTIONIST.look} scale={1} framed color={room.color} />;

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* the step, pinned: what it is, its tip, and the tick */}
        <View style={{ paddingTop: L.insets.top + 8, paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: 12, backgroundColor: wash(room.color, 0.1), borderBottomWidth: 1.5, borderBottomColor: wash(room.color, 0.35) }}>
          <View style={{ width: "100%", maxWidth: 640, alignSelf: "center", gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back to the task" style={{ borderRadius: radius.full, paddingHorizontal: 12, height: 36, justifyContent: "center", backgroundColor: shell.panel }}>
                <Spec tone="ink">← Task</Spec>
              </Pressable>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <GlyphTile id={room.glyph} color={room.color} size={24} scale={1} />
                <Spec tone="muted">{`${TASK_KINDS[kind].label.toUpperCase()} · STEP ${sIdx + 1} OF ${total}`}</Spec>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <Tap onPress={() => { r.tick(); void haptic(r.ticked ? "light" : "success"); }} accessibilityRole="checkbox" accessibilityLabel={r.ticked ? "Mark the step not done" : "Mark the step done"}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: r.ticked ? room.color : shell.panel, borderWidth: 2, borderColor: room.color, alignItems: "center", justifyContent: "center" }}>
                  {r.ticked ? <Glyph id="star" tone="paper" scale={2} /> : <Spec tone="ink">{String(sIdx + 1)}</Spec>}
                </View>
              </Tap>
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Body medium size="lg" style={{ textDecorationLine: r.ticked ? "line-through" : "none" }} tone={r.ticked ? "muted" : "ink"}>
                  {r.step.do}
                </Body>
                {r.step.tip ? (
                  <Body size="sm" tone="muted">
                    {r.step.tip}
                  </Body>
                ) : null}
              </View>
            </View>
            {/* the other steps, as dots you can walk */}
            <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
              {r.guide.steps.map((_, k) => (
                <Pressable key={k} onPress={() => goStep(k)} accessibilityRole="button" accessibilityLabel={`Step ${k + 1}`} hitSlop={6} style={{ width: k === sIdx ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: k === sIdx ? room.color : wash(room.color, 0.35) }} />
              ))}
              <Spec tone="faint" style={{ marginLeft: "auto" }}>{r.ticked ? "Done" : "Tap the circle when done"}</Spec>
            </View>
          </View>
        </View>

        {/* the room */}
        <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 640, alignSelf: "center", gap: 14 }}>
          <Message role="desk" text={r.opener} avatar={avatar} />
          {r.turns.map((m) => {
            const { text, door } = m.role === "desk" ? parseDoor(m.text) : { text: m.text, door: null };
            return (
              <View key={m.id} style={{ gap: 8 }}>
                <Message role={m.role} text={text} avatar={m.role === "desk" ? avatar : undefined} />
                {door ? (
                  <View style={{ paddingLeft: 44 }}>
                    <Pressable onPress={() => router.push(door.route as Href)} accessibilityRole="button" style={{ alignSelf: "flex-start", backgroundColor: room.color, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8 }}>
                      <Spec tone="paper">{`${door.label} →`}</Spec>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
          {r.thinking ? <Thinking label="Reading it…" avatar={avatar} /> : null}
          {r.turns.length === 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              {["Here is what I did: ", "I am stuck because ", "I decided to "].map((s) => (
                <Chip key={s} grow={false} onPress={() => setDraft(s)}>
                  {s.trim() + "…"}
                </Chip>
              ))}
            </View>
          ) : null}
          {r.quota ? (
            <Pressable onPress={() => router.push({ pathname: "/plans", params: { why: r.quota } } as Href)} accessibilityRole="button">
              <Chip grow={false} hint="See the plans →">{r.quota}</Chip>
            </Pressable>
          ) : null}
        </ScrollView>

        {/* the composer, pinned, and the way to the next step */}
        <View style={{ paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: L.insets.bottom + 10, paddingTop: 6, width: "100%", maxWidth: 640, alignSelf: "center", gap: 8 }}>
          <Composer value={draft} onChange={setDraft} onSend={() => submit()} busy={r.thinking} placeholder="Write what you did, found, or decided…" status={status} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {sIdx > 0 ? (
              <Pressable onPress={() => goStep(sIdx - 1)} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.full, backgroundColor: shell.panel, borderWidth: 1, borderColor: shell.line }}>
                <Spec tone="ink">← Step {sIdx}</Spec>
              </Pressable>
            ) : null}
            {sIdx + 1 < total ? (
              <Pressable onPress={() => goStep(sIdx + 1)} accessibilityRole="button" style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.full, backgroundColor: r.ticked ? room.color : shell.panel, borderWidth: 1, borderColor: r.ticked ? room.color : shell.line }}>
                <Spec tone={r.ticked ? "paper" : "ink"}>Step {sIdx + 2} →</Spec>
              </Pressable>
            ) : (
              <Pressable onPress={back} accessibilityRole="button" style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.full, backgroundColor: r.ticked ? room.color : shell.panel, borderWidth: 1, borderColor: r.ticked ? room.color : shell.line }}>
                <Spec tone={r.ticked ? "paper" : "ink"}>Back to the task →</Spec>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
