/**
 * THE QUIET ROOM — wherever the building told the founder to do
 * something, this is where they say what happened.
 *
 * One question, one field, one button. Nothing else is above the fold: no
 * tick to interpret, no chat to read, no chips, no coach, no second
 * button. A review in September 2026 found this page carrying a tick, an
 * explanation, a chat, suggestion chips, navigation and sometimes a
 * consent sheet, which is more to work out than the task itself.
 *
 * What the founder types is saved before anything is asked of a model,
 * and it comes straight back as a receipt in their exact words, so they
 * can see it landed. A half-written line survives backing out of the room
 * (`drafts` in the store). How to do it, everything written here before,
 * and the tick all sit under the button, where they are there when wanted
 * and quiet when not.
 */
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { parseDoor } from "@founderfloor/shared";
import { Body, Button, Input, Keeper, Message, Plate, Rise, Spec, Thinking, haptic, radius, shell, useLayout, Check } from "@founderfloor/ui";
import { useGate } from "../lib/gate";
import { aiMode } from "../lib/ai";
import { ROOM_COLOR } from "../lib/glyphs";
import { useWorkRoom } from "../lib/workRoom";
import { useFounder } from "../lib/store";
import { MemoryAsk } from "../components/MemoryAsk";
import { RECEPTIONIST } from "../lib/mock";

export default function Did() {
  const L = useLayout();
  const router = useRouter();
  const { id, text: textParam } = useLocalSearchParams<{ id?: string; text?: string }>();
  const roomId = id ?? "";
  const r = useWorkRoom(roomId, textParam);
  const gate = useGate();
  const draft = useFounder((s) => s.drafts[roomId] ?? "");
  const setDraft = useFounder((s) => s.setDraftText);
  const [ask, setAsk] = useState(false);
  const [kept, setKept] = useState<string | null>(null);
  const [how, setHow] = useState(false);
  const [all, setAll] = useState(false);

  const mine = r.turns.filter((m) => m.role === "you");
  /** How to do it opens itself the first time, when there is nothing written and the founder may not know where to start. */
  useEffect(() => {
    if (r.item && !mine.length) setHow(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.item?.id]);
  /** The notebook question comes after the first thing is written, when it means something. */
  useEffect(() => {
    if (kept && r.memoryOn === null) {
      const t = setTimeout(() => setAsk(true), 900);
      return () => clearTimeout(t);
    }
  }, [kept, r.memoryOn]);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/build" as Href));
  const keep = () => {
    const v = draft.trim();
    if (!v || r.thinking) return;
    if (aiMode() !== "rehearsal" && !gate("coachTurn", { coach: "desk" })) return;
    // the words are written down first and on their own; the desk reads them after
    r.send(v);
    setDraft(roomId, "");
    setKept(v);
    void haptic("success");
  };

  if (!r.item) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
        <Body tone="muted">That line is not on a list any more.</Body>
        <Button variant="secondary" onPress={back}>
          Back
        </Button>
      </View>
    );
  }
  const item = r.item;
  const color = item.room ? ROOM_COLOR[item.room.id] : "#3B5B92";
  const avatar = <Keeper look={RECEPTIONIST.look} scale={1} framed color={color} />;
  const last = mine.at(-1);
  const column = { width: "100%" as const, maxWidth: 640, alignSelf: "center" as const, paddingHorizontal: L.shell.paddingHorizontal };

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[column, { paddingTop: L.insets.top + 8, paddingBottom: L.insets.bottom + 24, gap: 16 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back" style={{ backgroundColor: shell.well, borderRadius: radius.full, paddingHorizontal: 14, height: 36, justifyContent: "center" }}>
              <Spec tone="ink">← Back</Spec>
            </Pressable>
            <Spec tone="faint" numberOfLines={1} style={{ flex: 1, textAlign: "right", marginLeft: 12 }}>{item.room ? `${item.room.name} room` : "From the week's reading"}</Spec>
          </View>

          {/* the one question, and the one field under it */}
          <Rise k={0} style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <Keeper look={RECEPTIONIST.look} scale={2} framed={false} color={color} />
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Body size="sm" tone="muted">{item.text.replace(/\.$/, "")}</Body>
                <Body size="lg" medium>{r.opener}</Body>
              </View>
            </View>
            {last ? <Spec tone="faint">{`Last time you wrote: "${last.text.length > 90 ? `${last.text.slice(0, 90)}…` : last.text}"`}</Spec> : null}
            <Input
              value={draft}
              onChangeText={(v) => setDraft(roomId, v)}
              placeholder="One line is enough."
              multiline
              autoFocus={!mine.length}
              style={{ minHeight: 112, textAlignVertical: "top" }}
              accessibilityLabel={r.opener}
            />
            <Button block onPress={keep} disabled={!draft.trim()}>
              Keep it
            </Button>
          </Rise>

          {/* the receipt: their words, back in their words */}
          {kept ? (
            <Rise k={1}>
              <Plate tone="panel" radius={radius.xl} padding={16} ring={color}>
                <Spec tone="verify">Kept</Spec>
                <Body style={{ marginTop: 6 }}>{`"${kept}"`}</Body>
                <Spec tone="faint" style={{ marginTop: 8 }}>{r.memoryOn === false ? "On this phone, in your notes on this line." : "In your notebook, and the desk reads it from here on."}</Spec>
              </Plate>
            </Rise>
          ) : null}

          {/* the desk, after the fact, never before it */}
          {r.thinking ? <Thinking label="Reading it…" avatar={avatar} /> : null}
          {kept
            ? r.turns
                .filter((m) => m.role === "desk")
                .slice(-1)
                .map((m) => {
                  const { text, door } = parseDoor(m.text);
                  return (
                    <View key={m.id} style={{ gap: 8 }}>
                      <Message role="desk" text={text} avatar={avatar} />
                      {door ? (
                        <View style={{ paddingLeft: 44 }}>
                          <Button size="sm" onPress={() => router.push(door.route as Href)}>
                            {door.label}
                          </Button>
                        </View>
                      ) : null}
                    </View>
                  );
                })
            : null}

          {/* everything under the button: quiet, and there when wanted */}
          <View style={{ gap: 0, marginTop: 4 }}>
            <Row label="How to do it" open={how} onPress={() => setHow((v) => !v)} />
            {how ? (
              <View style={{ paddingVertical: 10, gap: 10 }}>
                <Body size="sm">{item.how}</Body>
                {item.proof ? <Spec tone="muted">{`Done means: ${item.proof.toLowerCase()}.`}</Spec> : null}
                {item.door ? (
                  <View style={{ flexDirection: "row" }}>
                    <Button size="sm" variant="secondary" onPress={() => router.push(item.door!.route as Href)}>
                      {item.door.label}
                    </Button>
                  </View>
                ) : null}
              </View>
            ) : null}

            {mine.length > 1 ? (
              <>
                <Row label={`Everything you wrote here (${mine.length})`} open={all} onPress={() => setAll((v) => !v)} />
                {all ? (
                  <View style={{ paddingVertical: 10, gap: 10 }}>
                    {mine.map((m) => (
                      <View key={m.id} style={{ gap: 2 }}>
                        <Body size="sm">{m.text}</Body>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}

            {/* the tick, as a row: what is true, not what is intended */}
            <Pressable onPress={() => { r.tick(); void haptic(r.ticked ? "light" : "success"); }} accessibilityRole="checkbox" accessibilityState={{ checked: r.ticked }} accessibilityLabel={r.ticked ? "Mark the line not done" : "Mark the line done"} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: shell.line, opacity: pressed ? 0.75 : 1 })}>
              <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: r.ticked ? color : shell.line, backgroundColor: r.ticked ? color : "transparent", alignItems: "center", justifyContent: "center" }}>
                <Check on={r.ticked} size={16} />
              </View>
              <Body size="sm" style={{ flex: 1 }}>{r.ticked ? "Done" : "Mark it done"}</Body>
            </Pressable>
          </View>

          {r.quota ? <Spec tone="faint">{r.quota}</Spec> : null}
          {r.lastError && r.source !== "live" ? <Spec tone="faint">{r.lastError}</Spec> : null}
        </ScrollView>
      </KeyboardAvoidingView>
      <MemoryAsk open={ask} onClose={() => setAsk(false)} />
    </View>
  );
}

/** A quiet row that opens something. No card, no colour, no chevron that means "go". */
function Row({ label, open, onPress }: { label: string; open: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={label} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderTopWidth: 1, borderTopColor: shell.line, opacity: pressed ? 0.7 : 1 })}>
      <Body size="sm" medium>{label}</Body>
      <Body tone="accent">{open ? "–" : "+"}</Body>
    </Pressable>
  );
}
