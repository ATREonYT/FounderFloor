/**
 * THE NOTEBOOK — every line the desk has written about this founder, by
 * day, newest first, with the switch that decides whether the model gets
 * to read it, a way to take a copy, and a way to burn it. This page is the
 * founder's right of access, portability and erasure, drawn as a room.
 */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Share, View } from "react-native";
import { useRouter } from "expo-router";
import { MEMORY_KINDS, exportLog, type MemoryEntry, type MemoryKind } from "@founderfloor/shared";
import { Body, Button, ButtonRow, Choices, Display, GlyphTile, Plate, Scene, Spec, Toast, radius, shell, useLayout, wash, type GlyphId } from "@founderfloor/ui";
import { useFounder } from "../lib/store";
import { MemoryAsk, NOTEBOOK_COLOR } from "../components/MemoryAsk";

const KIND_GLYPH: Record<MemoryKind, GlyphId> = { did: "star", outcome: "bolt", note: "wave", desk: "heart", decision: "cube", logged: "coin", work: "chip" };

export default function Memory() {
  const L = useLayout();
  const router = useRouter();
  const { memory, memoryOn, setMemoryOn, forgetMemory, profile } = useFounder();
  const [toast, setToast] = useState<string | null>(null);
  const [arm, setArm] = useState(false);
  const [ask, setAsk] = useState(false);
  const say = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2600);
  };
  const days = useMemo(() => {
    const by = new Map<string, MemoryEntry[]>();
    for (const e of [...memory].reverse()) {
      const d = e.at.slice(0, 10);
      by.set(d, [...(by.get(d) ?? []), e]);
    }
    return [...by.entries()];
  }, [memory]);
  const share = async () => {
    try {
      await Share.share({ message: exportLog(memory, profile?.name), title: "FounderFloor notebook" });
    } catch {
      say("Could not open the share sheet.");
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 8, paddingBottom: L.insets.bottom + 32, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 640, alignSelf: "center", gap: 16 }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/settings"))} accessibilityRole="button" style={{ alignSelf: "flex-start", borderWidth: 1, borderColor: shell.line, borderRadius: radius.md, paddingHorizontal: 10, height: 36, justifyContent: "center" }}>
          <Spec tone="ink">← Back</Spec>
        </Pressable>
        <Scene set="archive" height={L.compact ? 140 : 170} radiusPx={radius.xl} color={NOTEBOOK_COLOR} accessibilityLabel="The notebook">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <GlyphTile id="flask" color={NOTEBOOK_COLOR} size={28} scale={1} />
            <Spec tone="ink">{`${memory.length} ${memory.length === 1 ? "LINE" : "LINES"}`}</Spec>
          </View>
        </Scene>
        <Display size={L.compact ? "3xl" : "4xl"}>The notebook</Display>
        <Body tone="muted">What the desk has written down about your work here. It stays on this phone. It goes to the AI with your questions only while the switch below says so.</Body>

        <Plate tone="panel" radius={radius.xl} padding={16}>
          <Choices label="THE DESK KEEPS NOTES" value={memoryOn === true ? "on" : memoryOn === false ? "off" : "ask"} options={[{ v: "on", label: "Yes" }, { v: "off", label: "No" }, ...(memoryOn === null ? [{ v: "ask", label: "Not decided" }] : [])]} onChange={(v) => (v === "ask" ? setAsk(true) : (setMemoryOn(v === "on"), say(v === "on" ? "The desk keeps notes." : "The desk writes nothing new.")))} />
          <Spec tone="faint" style={{ marginTop: 8 }}>
            {memoryOn === false ? "Nothing new is written. What is below stays until you burn it." : memoryOn === true ? "Ticks, outcomes, notes, what the desk said, and the weeks you log." : "Tap the question to read what would be kept."}
          </Spec>
          {memoryOn === null ? (
            <Pressable onPress={() => setAsk(true)} accessibilityRole="button" style={{ marginTop: 8 }}>
              <Spec tone="accent">Read the question →</Spec>
            </Pressable>
          ) : null}
        </Plate>

        {days.length === 0 ? (
          <Body size="sm" tone="muted">
            Nothing written yet. Open a task from your plan, tick a step, and the first line appears here.
          </Body>
        ) : (
          days.map(([d, list]) => (
            <View key={d} style={{ gap: 8 }}>
              <Spec tone="muted">{label(d)}</Spec>
              {list.map((e) => (
                <View key={e.id} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: shell.panel, borderRadius: 14, borderWidth: 1, borderColor: shell.line, padding: 10 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: wash(NOTEBOOK_COLOR, 0.14), alignItems: "center", justifyContent: "center" }}>
                    <GlyphTile id={KIND_GLYPH[e.kind]} color={NOTEBOOK_COLOR} size={28} scale={1} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Spec tone="faint">{`${MEMORY_KINDS[e.kind].label.toUpperCase()} · ${e.at.slice(11, 16)}`}</Spec>
                    <Body size="sm">{e.text}</Body>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}

        <ButtonRow>
          <Button variant="secondary" onPress={share} disabled={!memory.length}>
            Take a copy
          </Button>
          <Button
            variant={arm ? "primary" : "ghost"}
            disabled={!memory.length}
            onPress={() => {
              if (!arm) {
                setArm(true);
                setTimeout(() => setArm(false), 4000);
                return;
              }
              forgetMemory();
              setArm(false);
              say("The notebook is empty.");
            }}
          >
            {arm ? "Tap again to burn it" : "Burn the notebook"}
          </Button>
        </ButtonRow>
        <Spec tone="faint">Burning removes every line from this phone. Conversations already sent to the AI are kept by its provider for a short time under their terms and are not used to train it.</Spec>
      </ScrollView>
      <MemoryAsk open={ask} onClose={() => setAsk(false)} />
      <Toast text={toast ?? ""} visible={!!toast} />
    </View>
  );
}

function label(d: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (d === today) return "TODAY";
  if (d === yesterday) return "YESTERDAY";
  return new Date(d + "T12:00:00Z").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
}
