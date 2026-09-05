/**
 * THE DRAWER — documents drafted from the stand. Each kind belongs to a
 * room of the workshop and is drafted in the founder's own words and
 * numbers; a missing number is marked, never invented. Open one to read,
 * send or throw away. Drafting counts against Free's three a month.
 */
import { useState } from "react";
import { Pressable, ScrollView, Share, View } from "react-native";
import { useRouter } from "expo-router";
import { DOC_KINDS, draftDocument, GUIDE_PROMPT, standBlock } from "@founderfloor/shared";
import { Body, Button, ButtonRow, Dialogue, Display, Mono, Plate, Spec, Toast, radius, shell, useLayout } from "@founderfloor/ui";
import { useFounder, type SavedDoc } from "../lib/store";
import { useStand } from "../lib/stand";
import { useGate } from "../lib/gate";
import { askModel, aiMode, MODE_LINE } from "../lib/ai";

export default function Drawer() {
  const L = useLayout();
  const router = useRouter();
  const gate = useGate();
  const stand = useStand();
  const { docs, saveDoc, removeDoc } = useFounder();
  const [open, setOpen] = useState<SavedDoc | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const say = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2600);
  };
  const draft = async (kind: (typeof DOC_KINDS)[number]) => {
    if (!gate("draft")) return;
    setBusy(kind.kind);
    const local = draftDocument(kind.kind, stand.record);
    let doc: SavedDoc;
    if (aiMode() !== "rehearsal") {
      try {
        const text = await askModel({ fn: "guide", body: { stand: stand.record, ticks: [], question: `draft:${kind.kind}` }, direct: { system: GUIDE_PROMPT, cached: standBlock(stand.record), turns: [{ role: "user", content: `Draft: ${kind.title}. ${kind.blurb} Use the founder's own words and numbers from the stand; mark anything missing in square brackets; plain text; no headings in markdown.` }], maxTokens: 700 } });
        doc = saveDoc({ ...local, body: text }, "live");
      } catch {
        doc = saveDoc(local, "rehearsal");
      }
    } else doc = saveDoc(local, "rehearsal");
    setBusy(null);
    setOpen(doc);
  };
  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 8, paddingBottom: L.insets.bottom + 32, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 760, alignSelf: "center", gap: 16 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ alignSelf: "flex-start", borderWidth: 1, borderColor: shell.line, borderRadius: radius.md, paddingHorizontal: 10, height: 36, justifyContent: "center" }}>
          <Spec tone="ink">← Back</Spec>
        </Pressable>
        <Display size={L.compact ? "3xl" : "4xl"}>The drawer</Display>
        <Body tone="muted">{`Drafted from ${stand.name}'s stand, in your words and numbers. ${MODE_LINE[aiMode()]}.`}</Body>
        {docs.length ? (
          <Plate tone="panel" radius={radius.xl}>
            {docs.map((d, i) => (
              <Pressable key={d.id} onPress={() => setOpen(d)} accessibilityRole="button" style={({ pressed }) => ({ padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: shell.line, backgroundColor: pressed ? shell.well : "transparent", flexDirection: "row", alignItems: "center", gap: 12 })}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Body medium>{d.title}</Body>
                  <Spec tone="faint">{`${d.at.slice(0, 10)} · ${d.source}`}</Spec>
                </View>
                <Body tone="accent">→</Body>
              </Pressable>
            ))}
          </Plate>
        ) : null}
        <Spec tone="muted">DRAFT SOMETHING</Spec>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {DOC_KINDS.filter((k) => k.kind !== "update").map((k) => (
            <Pressable key={k.kind} onPress={() => draft(k)} disabled={!!busy} accessibilityRole="button" style={({ pressed }) => ({ flexBasis: L.compact ? "100%" : "48%", flexGrow: 1, opacity: pressed || busy === k.kind ? 0.7 : 1 })}>
              <Plate tone="paperSign" radius={radius.lg} padding={12}>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                  <Body medium>{k.title}</Body>
                  <Spec tone="faint" style={{ marginLeft: "auto" }}>
                    {k.room}
                  </Spec>
                </View>
                <Spec tone="muted" style={{ marginTop: 4 }}>
                  {busy === k.kind ? "Drafting…" : k.blurb}
                </Spec>
              </Plate>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <Dialogue open={!!open} onClose={() => setOpen(null)} sign={open?.title ?? ""} keeper={open?.source === "live" ? "live" : "rehearsal"} blurb={open ? `Drafted ${open.at.slice(0, 10)}` : undefined} color="#5E7C93" wide footer="Square brackets mark what is not on the stand yet.">
        {open ? (
          <View style={{ gap: 12 }}>
            <Plate tone="paper" radius={radius.md} padding={14}>
              <Mono size="xs">{open.body}</Mono>
            </Plate>
            <ButtonRow>
              <Button onPress={() => Share.share({ message: open.body, title: open.title }).catch(() => {})}>Send it</Button>
              <Button
                variant="ghost"
                onPress={() => {
                  removeDoc(open.id);
                  setOpen(null);
                  say("Thrown away.");
                }}
              >
                Throw away
              </Button>
            </ButtonRow>
          </View>
        ) : null}
      </Dialogue>
      <Toast text={toast ?? ""} visible={!!toast} />
    </View>
  );
}
