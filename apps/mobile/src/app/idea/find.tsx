/**
 * THE IDEA FINDER. Four plain questions — what you know, who you know, the
 * hours, the money — and five ideas come back as cards, each with the pain,
 * what changes hands, why now, the first ten people, and the one thing that
 * must be true. Taking an idea writes it on the stand's sign and opens the
 * second opinion. Live through the Edge Function; scripted otherwise.
 */
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { findIdeas, IDEA_FIND_PROMPT, type Idea, type IdeaBrief } from "@founderfloor/shared";
import { Body, Button, ButtonRow, Choices, Display, Input, Plate, Spec, Thinking, Keeper, radius, shell, useLayout } from "@founderfloor/ui";
import { useFounder } from "../../lib/store";
import { useGate } from "../../lib/gate";
import { askModel, parseJson, aiMode, MODE_LINE } from "../../lib/ai";
import { COACHES } from "../../lib/mock";

export default function Find() {
  const L = useLayout();
  const router = useRouter();
  const gate = useGate();
  const { ideas: saved, setIdeas, setRecord, setDoor } = useFounder();
  const [skills, setSkills] = useState(saved?.brief.skills.join(", ") ?? "");
  const [audiences, setAudiences] = useState(saved?.brief.audiences.join(", ") ?? "");
  const [hours, setHours] = useState<"5" | "15" | "40">(saved ? (saved.brief.hoursPerWeek < 10 ? "5" : saved.brief.hoursPerWeek < 30 ? "15" : "40") : "15");
  const [budget, setBudget] = useState<"0" | "500" | "5000">("500");
  const [likes, setLikes] = useState(saved?.brief.likes ?? "");
  const [busy, setBusy] = useState(false);
  const [ideas, setList] = useState<Idea[]>(saved?.ideas ?? []);
  const [source, setSource] = useState<"live" | "rehearsal">("rehearsal");
  const ines = COACHES[0];

  const run = async () => {
    if (!gate("ideaRun")) return;
    const brief: IdeaBrief = { skills: skills.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean), audiences: audiences.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean), hoursPerWeek: Number(hours), budget: Number(budget), likes };
    setBusy(true);
    let out: Idea[] | null = null;
    if (aiMode() !== "rehearsal") {
      try {
        const text = await askModel({ fn: "idea", body: { mode: "find", brief }, direct: { system: IDEA_FIND_PROMPT, turns: [{ role: "user", content: `Brief: ${JSON.stringify(brief)}` }], maxTokens: 900 } });
        const parsed = parseJson<Omit<Idea, "id">[]>(text);
        if (parsed && Array.isArray(parsed) && parsed.length) {
          out = parsed.slice(0, 5).map((i, n) => ({ ...i, id: `idea-${n}` }));
          setSource("live");
        }
      } catch {
        out = null;
      }
    }
    if (!out) {
      await new Promise((r) => setTimeout(r, 900));
      out = findIdeas(brief);
      setSource("rehearsal");
    }
    setIdeas(brief, out);
    setList(out);
    setBusy(false);
  };

  const take = (i: Idea) => {
    setRecord({ oneLiner: i.oneLiner, segment: i.segment, pitch: `${i.who[0].toUpperCase()}${i.who.slice(1)} ${i.pain}. ${i.whatChangesHands[0].toUpperCase()}${i.whatChangesHands.slice(1)}.` });
    setDoor("have");
    router.replace({ pathname: "/idea/check", params: { text: `${i.oneLiner} ${i.who[0].toUpperCase()}${i.who.slice(1)} ${i.pain}; ${i.whatChangesHands}. ${i.whyNow[0].toUpperCase()}${i.whyNow.slice(1)}.` } } as Href);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shell.paper }} contentContainerStyle={{ paddingTop: L.insets.top + 16, paddingBottom: L.insets.bottom + 32, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 760, alignSelf: "center", gap: 16 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.replace("/start")} accessibilityRole="button" style={{ alignSelf: "flex-start" }}>
        <Spec tone="muted">← The doors</Spec>
      </Pressable>
      <Display size={L.compact ? "3xl" : "4xl"}>What do you know, and who do you know?</Display>
      <Body tone="muted">Good ideas come from a person you can reach with a problem you can see. Not from a list of trends.</Body>
      <Plate tone="panel" radius={radius.xl} padding={16}>
        <View style={{ gap: 14 }}>
          <Input label="What you know how to do" value={skills} onChangeText={setSkills} placeholder="code, design, selling, bookkeeping, cooking…" />
          <Input label="People you know well or can reach" value={audiences} onChangeText={setAudiences} placeholder="café owners, teachers, my old team, landlords…" />
          <Choices label="Hours a week" value={hours} options={[{ v: "5", label: "Evenings" }, { v: "15", label: "Part-time" }, { v: "40", label: "All in" }]} onChange={setHours} />
          <Choices label="Money before revenue" value={budget} options={[{ v: "0", label: "None" }, { v: "500", label: "A few hundred" }, { v: "5000", label: "A few thousand" }]} onChange={setBudget} />
          <Input label="What you would enjoy (optional)" value={likes} onChangeText={setLikes} placeholder="talking to people, building tools, writing…" />
          <ButtonRow>
            <Button onPress={run} disabled={busy || (!skills.trim() && !audiences.trim())} arrow>
              {busy ? "Looking" : ideas.length ? "Five more" : "Find me five"}
            </Button>
          </ButtonRow>
          <Spec tone="faint">{MODE_LINE[aiMode()]}</Spec>
        </View>
      </Plate>
      {busy ? <Thinking label="Matching who you know with what they lose…" avatar={<Keeper look={ines.look} scale={1} color={ines.color} speaking />} /> : null}
      {ideas.map((i, n) => (
        <Plate key={i.id} tone="panel" radius={radius.xl}>
          <View style={{ padding: 16, gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <Spec tone="muted">{`${n + 1} of ${ideas.length} · ${i.effort} · ${i.segment}`}</Spec>
              <Spec tone="faint" style={{ marginLeft: "auto" }}>
                {source === "live" ? "live" : "rehearsal"}
              </Spec>
            </View>
            <Display size="lg">{i.oneLiner}</Display>
            <Row k="The pain" v={i.pain} />
            <Row k="What changes hands" v={i.whatChangesHands} />
            <Row k="Why now" v={i.whyNow} />
            <Row k="The first ten" v={i.firstTen} />
            <Row k="Must be true" v={i.mustBeTrue} />
            <ButtonRow>
              <Button size="sm" onPress={() => take(i)} arrow>
                Take this one
              </Button>
            </ButtonRow>
          </View>
        </Plate>
      ))}
      {ideas.length ? <Spec tone="faint">None of these? Change who you know above, or take the closest and let the second opinion sharpen it.</Spec> : null}
    </ScrollView>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Spec tone="muted">{k}</Spec>
      <Body size="sm">{v}</Body>
    </View>
  );
}
