/**
 * THE ROOM AT ONE LINE — wherever the building told the founder to do
 * something, this is where they say what happened. The line sits at the
 * top in its room's colour with the tick; under it, how to do it in plain
 * words and the door that does it for them; then the desk's question and
 * everything written so far. Every line goes into the notebook, and from
 * then on the desk, the coaches and the Workshop read it.
 */
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { parseDoor } from "@founderfloor/shared";
import { Body, Button, Chip, Composer, Glyph, GlyphTile, Keeper, Message, Plate, Spec, Tap, Thinking, haptic, radius, shell, useLayout, wash, PixelIcon } from "@founderfloor/ui";
import { useGate } from "../lib/gate";
import { aiMode } from "../lib/ai";
import { ROOM_COLOR, ROOM_GLYPH } from "../lib/glyphs";
import { useWorkRoom } from "../lib/workRoom";
import { MemoryAsk } from "../components/MemoryAsk";
import { RECEPTIONIST } from "../lib/mock";

export default function Did() {
  const L = useLayout();
  const router = useRouter();
  const { id, text: textParam } = useLocalSearchParams<{ id?: string; text?: string }>();
  const r = useWorkRoom(id ?? "", textParam);
  const gate = useGate();
  const [draft, setDraft] = useState("");
  const [ask, setAsk] = useState(false);
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 120);
  }, [r.turns.length, r.thinking]);
  // the notebook question, once, after the page has been read for a moment
  useEffect(() => {
    if (r.item && r.memoryOn === null) {
      const t = setTimeout(() => setAsk(true), 1400);
      return () => clearTimeout(t);
    }
  }, [r.item, r.memoryOn]);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/build" as Href));
  const submit = (s = draft) => {
    const v = s.trim();
    if (!v || r.thinking) return;
    if (aiMode() !== "rehearsal" && !gate("coachTurn", { coach: "desk" })) return;
    setDraft("");
    r.send(v);
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
  const glyph = item.room ? ROOM_GLYPH[item.room.id] ?? "bolt" : "bolt";
  const label = item.room ? `${item.room.name} room · Room ${item.room.n} of 6` : "FROM THE WEEK'S READING";
  const status = r.quota ? r.quota : r.source === "live" ? "Live · kept here, in your notebook, and read by the desk and the Workshop" : aiMode() === "rehearsal" ? "Practice mode · kept here and in your notebook" : r.lastError ? `Practice mode · ${r.lastError}` : "Kept here and in your notebook";
  const avatar = <Keeper look={RECEPTIONIST.look} scale={1} framed color={color} />;
  const mine = r.turns.filter((m) => m.role === "you").length;

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* the line, pinned: what it is, and the tick */}
        <View style={{ paddingTop: L.insets.top + 8, paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: 12, backgroundColor: wash(color, 0.1), borderBottomWidth: 1.5, borderBottomColor: wash(color, 0.35) }}>
          <View style={{ width: "100%", maxWidth: 640, alignSelf: "center", gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back" style={{ backgroundColor: shell.panel, borderRadius: radius.full, paddingHorizontal: 12, height: 36, justifyContent: "center" }}>
                <Spec tone="ink">← Back</Spec>
              </Pressable>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <GlyphTile id={glyph} color={color} size={24} scale={1} />
                <Spec tone="muted">{label}</Spec>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <Tap onPress={() => { r.tick(); void haptic(r.ticked ? "light" : "success"); }} accessibilityRole="checkbox" accessibilityLabel={r.ticked ? "Mark the line not done" : "Mark the line done"}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: r.ticked ? color : shell.panel, borderWidth: 2, borderColor: color, alignItems: "center", justifyContent: "center" }}>
                  {r.ticked ? <PixelIcon id="check" color="#F4F6F8" size={22} flat /> : <Glyph id="chip" tone="auto" scale={1} />}
                </View>
              </Tap>
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Body medium size="lg" style={{ textDecorationLine: r.ticked ? "line-through" : "none" }} tone={r.ticked ? "muted" : "ink"}>
                  {item.text}
                </Body>
                {item.proof ? (
                  <Body size="sm" tone="muted">
                    {`Done means: ${item.proof.toLowerCase()}.`}
                  </Body>
                ) : null}
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <Spec tone="faint">{mine ? `${mine} ${mine === 1 ? "line" : "lines"} written` : "Nothing written yet"}</Spec>
              <Spec tone="faint">{r.ticked ? "DONE" : "Tick the circle when true"}</Spec>
            </View>
          </View>
        </View>

        <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 640, alignSelf: "center", gap: 14 }}>
          {/* how to do it, for someone who never has */}
          <Plate tone="panel" radius={radius.xl} padding={14}>
            <View style={{ gap: 8 }}>
              <Spec tone="muted">How to do it</Spec>
              <Body>{item.how}</Body>
              {item.door ? (
                <View style={{ flexDirection: "row", marginTop: 2 }}>
                  <Button size="sm" arrow onPress={() => router.push(item.door!.route as Href)}>
                    {item.door.label}
                  </Button>
                </View>
              ) : null}
            </View>
          </Plate>

          {/* the desk's question, and everything written so far */}
          <Message role="desk" text={r.opener} avatar={avatar} />
          {r.turns.map((m) => {
            const { text, door } = m.role === "desk" ? parseDoor(m.text) : { text: m.text, door: null };
            return (
              <View key={m.id} style={{ gap: 8 }}>
                <Message role={m.role} text={text} avatar={m.role === "desk" ? avatar : undefined} />
                {door ? (
                  <View style={{ paddingLeft: 44 }}>
                    <Button size="sm" arrow onPress={() => router.push(door.route as Href)}>
                      {door.label}
                    </Button>
                  </View>
                ) : null}
              </View>
            );
          })}
          {r.thinking ? <Thinking label="Reading it…" avatar={avatar} /> : null}
          {r.turns.length === 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              {["Here is what I did: ", "I am stuck because ", "How do I do this?"].map((s) => (
                <Chip key={s} grow={false} onPress={() => (s.endsWith("?") ? submit(s) : setDraft(s))}>
                  {s.endsWith("?") ? s : s.trim() + "…"}
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

        <View style={{ paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: L.insets.bottom + 10, paddingTop: 6, width: "100%", maxWidth: 640, alignSelf: "center" }}>
          <Composer value={draft} onChange={setDraft} onSend={() => submit()} busy={r.thinking} placeholder="Write what you did, found, or where you are stuck…" status={status} />
        </View>
      </KeyboardAvoidingView>
      <MemoryAsk open={ask} onClose={() => setAsk(false)} />
    </View>
  );
}
