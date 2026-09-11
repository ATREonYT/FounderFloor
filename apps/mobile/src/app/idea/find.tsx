/**
 * THE IDEA FINDER. Four plain questions — what you know, who you know, the
 * hours, the money — and five ideas come back as cards, each with the pain,
 * what changes hands, why now, the first ten people, and the one thing that
 * must be true. Taking an idea writes it on the stand's sign and opens the
 * second opinion. Live through the Edge Function; scripted otherwise.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { LIKES, findIdeas, IDEA_FIND_PROMPT, type Idea, type IdeaBrief } from "@founderfloor/shared";
import { Body, Button, ButtonRow, Choices, Display, Input, Plate, Spec, Thinking, Keeper, radius, shell, useLayout, GlyphTile } from "@founderfloor/ui";
import { SEGMENT_GLYPH } from "../../lib/glyphs";
import { useFounder } from "../../lib/store";
import { useGate } from "../../lib/gate";
import { askModel, parseJson, aiMode, MODE_LINE } from "../../lib/ai";
import { COACHES } from "../../lib/mock";

export default function Find() {
  const L = useLayout();
  const router = useRouter();
  const gate = useGate();
  const { ideas: saved, setIdeas, setRecord, setDoor, profile } = useFounder();
  const { auto } = useLocalSearchParams<{ auto?: string }>();
  const fromLikes = profile ? profile.likes.map((l) => LIKES.find((x) => x.id === l)?.label.toLowerCase() ?? l).join(", ") : "";
  const [skills, setSkills] = useState(saved?.brief.skills.join(", ") ?? fromLikes);
  const [audiences, setAudiences] = useState(saved?.brief.audiences.join(", ") ?? profile?.audiences ?? "");
  const [hours, setHours] = useState<"5" | "15" | "40">(saved ? (saved.brief.hoursPerWeek < 10 ? "5" : saved.brief.hoursPerWeek < 30 ? "15" : "40") : profile?.pace === "evenings" ? "5" : profile?.pace === "all-in" ? "40" : "15");
  const [budget, setBudget] = useState<"0" | "500" | "5000">("500");
  const [likes, setLikes] = useState(saved?.brief.likes ?? "");
  const [busy, setBusy] = useState(false);
  const [ideas, setList] = useState<Idea[]>(saved?.ideas ?? []);
  const [source, setSource] = useState<"live" | "rehearsal">("rehearsal");
  const ines = COACHES[0];
  const ran = useRef(false);
  useEffect(() => {
    // straight from the welcome: the answers are in, so the five ideas come without another tap
    if (auto === "1" && !ran.current && !saved && (skills || audiences)) {
      ran.current = true;
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  const run = async () => {
    if (!gate("ideaRun")) return;
    const brief: IdeaBrief = { skills: skills.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean), audiences: audiences.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean), hoursPerWeek: Number(hours), budget: Number(budget), likes };
    setBusy(true);
    let out: Idea[] | null = null;
    if (aiMode() !== "rehearsal") {
      try {
        const text = await askModel({ fn: "idea", body: { mode: "find", brief }, direct: { system: IDEA_FIND_PROMPT, turns: [{ role: "user", content: `Brief: ${JSON.stringify(brief)}` }], maxTokens: 900 } });
        const parsed = parseJson<unknown>(text);
        const clean = Array.isArray(parsed) ? parsed.map(asIdea).filter((i): i is Omit<Idea, "id"> => i !== null) : [];
        if (clean.length) {
          out = clean.slice(0, 5).map((i, n) => ({ ...i, id: `idea-${n}` }));
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
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: L.insets.top + 16, paddingBottom: L.insets.bottom + 32, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 760, alignSelf: "center", gap: 16 }} keyboardShouldPersistTaps="handled">
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
            <Button onPress={run} disabled={busy || (!skills.trim() && !audiences.trim())}>
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
              <Spec tone="muted">{`${n + 1} of ${ideas.length}, ${i.effort}, ${i.segment}`}</Spec>
              <Spec tone="faint" style={{ marginLeft: "auto" }}>
                {source === "live" ? "live" : "rehearsal"}
              </Spec>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <GlyphTile id={SEGMENT_GLYPH[i.segment] ?? "star"} color={ines.color} size={40} />
              <Display size="lg" style={{ flex: 1, minWidth: 0 }}>{i.oneLiner}</Display>
            </View>
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

const SEGMENTS = ["b2b-saas", "consumer", "marketplace", "services", "hardware", "other"] as const;
const EFFORTS = ["evenings", "part-time", "full-time"] as const;
const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
/** One idea from the model, or null if any required field is not a string. */
function asIdea(v: unknown): Omit<Idea, "id"> | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const oneLiner = str(o.oneLiner, 200), who = str(o.who, 120), pain = str(o.pain, 300), whatChangesHands = str(o.whatChangesHands, 300), whyNow = str(o.whyNow, 300), firstTen = str(o.firstTen, 300), mustBeTrue = str(o.mustBeTrue, 400);
  if (!oneLiner || !who || !pain || !whatChangesHands || !whyNow || !firstTen || !mustBeTrue) return null;
  const segment = (SEGMENTS as readonly string[]).includes(String(o.segment)) ? (o.segment as Idea["segment"]) : "other";
  const effort = (EFFORTS as readonly string[]).includes(String(o.effort)) ? (o.effort as Idea["effort"]) : "part-time";
  return { oneLiner, who, pain, whatChangesHands, whyNow, firstTen, mustBeTrue, segment, effort };
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Spec tone="muted">{k}</Spec>
      <Body size="sm">{v}</Body>
    </View>
  );
}
