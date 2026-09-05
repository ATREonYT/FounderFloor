/**
 * THE SECOND OPINION. Write the idea; the desk reads it back: what is
 * already strong, the questions only customers can answer, who to talk to
 * first and the five questions to ask them without leading. No score, no
 * verdict — the research is unanimous that a number does not change what
 * a founder does next, and it insults the ones who most need to hear the
 * questions. "Put it on the sign" writes the sentence onto the stand.
 */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { readIdea, IDEA_READ_PROMPT, draftDocument, type IdeaRead } from "@founderfloor/shared";
import { Body, Button, ButtonRow, Display, Input, Keeper, Plate, Spec, Thinking, Toast, radius, shell, useLayout } from "@founderfloor/ui";
import { useFounder } from "../../lib/store";
import { useGate } from "../../lib/gate";
import { askModel, parseJson, aiMode, MODE_LINE } from "../../lib/ai";
import { COACHES } from "../../lib/mock";

const READY_COLOR = { sketch: shell.faint, forming: shell.gold, ready: shell.verify } as const;

export default function Check() {
  const L = useLayout();
  const router = useRouter();
  const gate = useGate();
  const { text: seedText } = useLocalSearchParams<{ text?: string }>();
  const { record, setRecord, addRead, saveDoc, reads } = useFounder();
  const [text, setText] = useState(seedText ?? record.oneLiner ?? "");
  const [busy, setBusy] = useState(false);
  const [read, setRead] = useState<IdeaRead | null>(reads.at(-1)?.text === (seedText ?? record.oneLiner) ? reads.at(-1)!.read : null);
  const [toast, setToast] = useState<string | null>(null);
  const ines = COACHES[0];
  useEffect(() => {
    if (seedText) setText(seedText);
  }, [seedText]);
  const say = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2600);
  };

  const run = async () => {
    if (!text.trim() || !gate("ideaCheck")) return;
    setBusy(true);
    let out: IdeaRead | null = null;
    if (aiMode() !== "rehearsal") {
      try {
        const t = await askModel({ fn: "idea", body: { mode: "read", text }, direct: { system: IDEA_READ_PROMPT, turns: [{ role: "user", content: `Idea: ${text}` }], maxTokens: 700 } });
        const p = parseJson<IdeaRead>(t);
        if (p && p.readiness && Array.isArray(p.questions)) out = p;
      } catch {
        out = null;
      }
    }
    if (!out) {
      await new Promise((r) => setTimeout(r, 800));
      out = readIdea(text);
    }
    addRead(text, out);
    setRead(out);
    setBusy(false);
  };

  const onSign = () => {
    const first = text.split(/(?<=[.!?])\s/)[0].trim();
    setRecord({ oneLiner: first.length > 140 ? first.slice(0, 137) + "…" : first, pitch: text.length > first.length ? text : record.pitch });
    say("On the sign. The coaches read it now.");
  };
  const keepScript = () => {
    if (!gate("draft")) return;
    saveDoc(draftDocument("interview-script", { ...record, oneLiner: text }), "rehearsal");
    say("Interview script is in the drawer.");
  };

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 16, paddingBottom: L.insets.bottom + 32, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 760, alignSelf: "center", gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Pressable onPress={() => router.replace("/start")} accessibilityRole="button">
            <Spec tone="muted">← The doors</Spec>
          </Pressable>
          <Pressable onPress={() => router.replace("/stand")} accessibilityRole="button">
            <Spec tone="muted">Skip to the stand →</Spec>
          </Pressable>
        </View>
        <Display size={L.compact ? "3xl" : "4xl"}>Say the idea. We read it back.</Display>
        <Body tone="muted">A sentence is enough; a paragraph is better. You will not get a score. You will get what is strong, what only customers can answer, and who to ask first.</Body>
        <Plate tone="panel" radius={radius.xl} padding={16}>
          <View style={{ gap: 12 }}>
            <Input label="The idea, in your words" value={text} onChangeText={setText} multiline placeholder="Small cafés lose hours chasing regulars who pay late. A prepaid pass they top up…" style={{ minHeight: 120 }} />
            <ButtonRow>
              <Button onPress={run} disabled={busy || text.trim().length < 12} arrow>
                {busy ? "Reading" : read ? "Read it again" : "Read it back"}
              </Button>
            </ButtonRow>
            <Spec tone="faint">{MODE_LINE[aiMode()]}</Spec>
          </View>
        </Plate>
        {busy ? <Thinking label="Reading it the way a customer would…" avatar={<Keeper look={ines.look} scale={1} color={ines.color} speaking />} /> : null}
        {read ? (
          <>
            <Plate tone="panel" radius={radius.xl}>
              <View style={{ padding: 16, gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: READY_COLOR[read.readiness] }} />
                  <Spec tone="ink">{read.readiness === "ready" ? "Ready to test" : read.readiness === "forming" ? "Forming" : "A sketch"}</Spec>
                </View>
                <Body>{read.readinessLine}</Body>
                <Section title="Already strong" items={read.strong} tone="verify" />
                <Section title="Only customers can answer" items={read.questions} tone="accent" />
                <View style={{ gap: 4 }}>
                  <Spec tone="muted">Talk to first</Spec>
                  <Body size="sm">{read.talkTo}</Body>
                </View>
                <Section title="Ask them, in this order" items={read.ask} numbered />
                <Plate tone="paper" radius={radius.md} padding={12}>
                  <Spec tone="muted">One thing to sharpen</Spec>
                  <Body size="sm" style={{ marginTop: 4 }}>
                    {read.sharpen}
                  </Body>
                </Plate>
                <ButtonRow>
                  <Button onPress={onSign}>Put it on the sign</Button>
                  <Button variant="secondary" onPress={keepScript}>
                    Keep the interview script
                  </Button>
                  <Button variant="ghost" onPress={() => router.replace("/build" as Href)}>
                    Open the workshop
                  </Button>
                </ButtonRow>
              </View>
            </Plate>
            <Spec tone="faint">Come back after five conversations and read it again. The words will have changed, and so will the reading.</Spec>
          </>
        ) : null}
      </ScrollView>
      <Toast text={toast ?? ""} visible={!!toast} />
    </View>
  );
}

function Section({ title, items, tone, numbered }: { title: string; items: string[]; tone?: "verify" | "accent"; numbered?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <Spec tone="muted">{title}</Spec>
      {items.map((s, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ width: 16, alignItems: "center", paddingTop: 8 }}>{numbered ? <Spec tone="faint">{i + 1}</Spec> : <View style={{ width: 6, height: 6, backgroundColor: tone === "verify" ? shell.verify : tone === "accent" ? shell.accent : shell.ink }} />}</View>
          <Body size="sm" style={{ flex: 1 }}>
            {s}
          </Body>
        </View>
      ))}
    </View>
  );
}
