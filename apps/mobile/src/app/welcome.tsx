/**
 * THE WELCOME — eight questions, one at a time, asked by the desk. Each
 * question slides in; the answers are cards with the hall's pixel glyphs
 * that pop when picked; the keeper nods at each answer and cheers when
 * the plan lands. The answers become a profile, the profile becomes a
 * four-week plan (the model when there is a key, the house rules when
 * there is not), and the plan is written onto the stand. Then the guide,
 * then the first idea.
 */
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import Animated, { FadeInDown, FadeInRight, FadeOutLeft, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useRouter, type Href } from "expo-router";
import { LIKES, GOALS, PLAN_PROMPT, localPlan, asPlan, doorFor, type Profile, type FounderPlan, type Standing, type Goal, type Horizon, type Pace, type Tone } from "@founderfloor/shared";
import { Body, Button, ButtonRow, Display, Glyph, Input, Keeper, Plate, Spec, Stage, Tap, Thinking, radius, shell, useLayout, wash, type GlyphId, type Mood } from "@founderfloor/ui";
import { RECEPTIONIST } from "../lib/mock";
import { useFounder } from "../lib/store";
import { askModel, parseJson, aiMode } from "../lib/ai";

type Step = "name" | "standing" | "likes" | "audiences" | "goal" | "horizon" | "pace" | "tone" | "plan";
const ORDER: Step[] = ["name", "standing", "likes", "audiences", "goal", "horizon", "pace", "tone", "plan"];

const ASK: Record<Step, string> = {
  name: "Welcome in. What should I call you?",
  standing: "Where are you right now?",
  likes: "What do you actually like doing? Pick a few.",
  audiences: "Who do you know well, or could reach this month?",
  goal: "What would count as a win?",
  horizon: "By when?",
  pace: "How much time can you give it each week?",
  tone: "How should the coaches speak to you?",
  plan: "Give me a moment. I am putting your plan together.",
};
/** One colour per step, so the screen changes as the conversation moves. */
const COLOR: Record<Step, string> = { name: "#BE241B", standing: "#3B5B92", likes: "#4E6E4E", audiences: "#B4762E", goal: "#6B4E71", horizon: "#2F6F6A", pace: "#8C3B2E", tone: "#5E7C93", plan: "#4F6E6B" };

type Opt<T extends string> = { v: T; label: string; line?: string; glyph: GlyphId };
const STANDING: Opt<Standing>[] = [
  { v: "itch", label: "An itch, no idea yet", line: "You want to build something; you do not know what.", glyph: "bolt" },
  { v: "idea", label: "I have an idea", line: "Written down or in your head.", glyph: "star" },
  { v: "building", label: "I am building", line: "Something exists; nobody pays yet.", glyph: "cube" },
  { v: "running", label: "I already run something", line: "Customers, numbers, a company.", glyph: "coin" },
];
const LIKE_GLYPH: Record<string, GlyphId> = { talking: "wave", building: "cube", writing: "leaf", selling: "coin", numbers: "chip", design: "star", teaching: "heart", organising: "flask" };
const GOAL_GLYPH: Record<Goal, GlyphId> = { "first-customer": "heart", "side-income": "coin", "quit-job": "rocket", raise: "flask", learn: "leaf" };
const HORIZON: Opt<Horizon>[] = [
  { v: "3m", label: "Three months", line: "A sprint.", glyph: "bolt" },
  { v: "6m", label: "Six months", line: "A season.", glyph: "leaf" },
  { v: "12m", label: "A year", line: "A proper go.", glyph: "flask" },
];
const PACE: Opt<Pace>[] = [
  { v: "evenings", label: "Evenings", line: "About five hours a week.", glyph: "leaf" },
  { v: "part-time", label: "Part-time", line: "About fifteen.", glyph: "bolt" },
  { v: "all-in", label: "All in", line: "This is the job now.", glyph: "rocket" },
];
const TONE: Opt<Tone>[] = [
  { v: "gentle", label: "Gently", line: "Encouraging, patient.", glyph: "heart" },
  { v: "direct", label: "Directly", line: "Plain and honest.", glyph: "bolt" },
  { v: "blunt", label: "Bluntly", line: "The hard thing first.", glyph: "cube" },
];

export default function Welcome() {
  const L = useLayout();
  const router = useRouter();
  const { setProfile, setRecord, setDoor } = useFounder();
  const [i, setI] = useState(0);
  const step = ORDER[i];
  const color = COLOR[step];
  const [name, setName] = useState("");
  const [standing, setStanding] = useState<Standing | null>(null);
  const [likes, setLikes] = useState<string[]>([]);
  const [audiences, setAudiences] = useState("");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [horizon, setHorizon] = useState<Horizon | null>(null);
  const [pace, setPace] = useState<Pace | null>(null);
  const [tone, setTone] = useState<Tone | null>(null);
  const [plan, setPlan] = useState<FounderPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [mood, setMood] = useState<Mood>("idle");
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withSpring((i + 1) / ORDER.length, { damping: 18, stiffness: 160 });
  }, [i, progress]);
  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const nod = () => {
    setMood("nod");
    setTimeout(() => setMood("idle"), 700);
  };

  const can = step === "name" ? name.trim().length >= 2 : step === "standing" ? !!standing : step === "likes" ? likes.length > 0 : step === "audiences" ? audiences.trim().length >= 3 : step === "goal" ? !!goal : step === "horizon" ? !!horizon : step === "pace" ? !!pace : step === "tone" ? !!tone : !!plan;

  const makePlan = async () => {
    const p: Profile = { name: name.trim(), standing: standing!, likes, audiences: audiences.trim(), goal: goal!, horizon: horizon!, pace: pace!, tone: tone!, budget: 500, at: new Date().toISOString() };
    setBusy(true);
    setMood("talk");
    let out: FounderPlan | null = null;
    if (aiMode() !== "rehearsal") {
      try {
        const text = await askModel({ fn: "guide", body: { question: "plan", profile: p, stand: useFounder.getState().record, ticks: [] }, direct: { system: PLAN_PROMPT, turns: [{ role: "user", content: `Profile: ${JSON.stringify({ ...p, likes: p.likes.map((l) => LIKES.find((x) => x.id === l)?.label ?? l) })}` }], maxTokens: 900 } });
        const parsed = asPlan(parseJson<unknown>(text));
        if (parsed) out = { ...parsed, source: "live" };
      } catch {
        out = null;
      }
    }
    if (!out) {
      await new Promise((r) => setTimeout(r, 900));
      out = localPlan(p);
    }
    setProfile(p, out);
    setRecord({ weeklyGoal: out.weeklyGoal, target90: out.target90, weeklyGoalProgress: 0 });
    setDoor(doorFor(p.standing));
    setPlan(out);
    setBusy(false);
    setMood("cheer");
  };

  const next = () => {
    if (step === "tone") {
      setI(i + 1);
      void makePlan();
      return;
    }
    if (step === "plan") {
      const then = standing === "itch" ? "/idea/find?auto=1" : standing === "idea" ? "/idea/check" : "/build";
      router.replace({ pathname: "/guide", params: { then } } as Href);
      return;
    }
    setI(i + 1);
  };

  /** An answer as a card: a glyph tile, a label, a line; the picked one wears the step's colour. */
  const Card = <T extends string>({ o, on, onPress, k }: { o: Opt<T>; on: boolean; onPress: () => void; k: number }) => (
    <Animated.View entering={FadeInDown.delay(80 + k * 60).springify().damping(16)} style={{ flex: 1, minWidth: L.compact ? "46%" : 180 }}>
      <Tap onPress={onPress} accessibilityLabel={o.label} accessibilityRole="radio" scale={0.96}>
        <View style={{ backgroundColor: on ? color : shell.panel, borderRadius: 18, padding: 14, borderWidth: 1.5, borderColor: on ? color : shell.line, gap: 10, minHeight: 112 }}>
          <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: on ? "rgba(255,255,255,0.18)" : wash(color, 0.14), alignItems: "center", justifyContent: "center" }}>
            <Glyph id={o.glyph} tone={on ? "paper" : "auto"} scale={2} />
          </View>
          <View style={{ gap: 2 }}>
            <Body medium tone={on ? "paper" : "ink"}>
              {o.label}
            </Body>
            {o.line ? <Spec tone={on ? "paperQuiet" : "muted"}>{o.line}</Spec> : null}
          </View>
        </View>
      </Tap>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      {/* a wash in the step's colour behind the top of the screen */}
      <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 320, backgroundColor: wash(color, 0.1) }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 14, paddingBottom: L.insets.bottom + 24, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 560, alignSelf: "center", gap: 16, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: wash(color, 0.18), overflow: "hidden" }}>
              <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: color }, bar]} />
            </View>
            <Spec tone="muted">{`${Math.min(i + 1, ORDER.length)} of ${ORDER.length}`}</Spec>
          </View>
          <Stage look={RECEPTIONIST.look} color={color} who="The desk" say={step === "plan" && plan ? plan.headline : ASK[step]} mood={step === "plan" ? (plan ? "cheer" : "talk") : mood} height={L.compact ? 186 : 220} scale={2} set="doors" />

          <Animated.View key={step} entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)} style={{ gap: 12 }}>
            {step === "name" ? (
              <View style={{ gap: 10 }}>
                <Input label="Your first name" value={name} onChangeText={setName} placeholder="Alex" autoFocus onSubmitEditing={() => can && next()} />
                <Spec tone="faint">Eight quick questions. About two minutes. You can change any answer later.</Spec>
              </View>
            ) : null}
            {step === "standing" ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {STANDING.map((o, k) => (
                  <Card key={o.v} o={o} k={k} on={standing === o.v} onPress={() => { setStanding(o.v); nod(); }} />
                ))}
              </View>
            ) : null}
            {step === "likes" ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {LIKES.map((l, k) => {
                  const on = likes.includes(l.id);
                  return (
                    <Animated.View key={l.id} entering={FadeInDown.delay(60 + k * 45).springify().damping(16)}>
                      <Tap onPress={() => { setLikes((cur) => (on ? cur.filter((x) => x !== l.id) : [...cur, l.id])); nod(); }} accessibilityLabel={l.label} accessibilityRole="checkbox" scale={0.95}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: on ? color : shell.panel, borderRadius: radius.full, paddingLeft: 8, paddingRight: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: on ? color : shell.line }}>
                          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: on ? "rgba(255,255,255,0.18)" : wash(color, 0.14), alignItems: "center", justifyContent: "center" }}>
                            <Glyph id={LIKE_GLYPH[l.id] ?? "star"} tone={on ? "paper" : "auto"} scale={1} />
                          </View>
                          <Body size="sm" medium tone={on ? "paper" : "ink"}>
                            {l.label}
                          </Body>
                        </View>
                      </Tap>
                    </Animated.View>
                  );
                })}
              </View>
            ) : null}
            {step === "audiences" ? (
              <View style={{ gap: 10 }}>
                <Input label="People you know" value={audiences} onChangeText={setAudiences} placeholder="café owners, teachers, my old team, landlords…" autoFocus onSubmitEditing={() => can && next()} />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {["café owners", "small shops", "teachers", "developers", "parents", "my old colleagues", "landlords", "gym owners"].map((s) => (
                    <Tap key={s} onPress={() => { setAudiences((a) => (a.includes(s) ? a : a ? `${a}, ${s}` : s)); nod(); }} accessibilityLabel={`Add ${s}`} scale={0.95}>
                      <View style={{ borderWidth: 1, borderColor: shell.line, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: shell.panel }}>
                        <Spec tone="ink">{`+ ${s}`}</Spec>
                      </View>
                    </Tap>
                  ))}
                </View>
                <Spec tone="faint">Good ideas come from people you can reach with a problem you can see.</Spec>
              </View>
            ) : null}
            {step === "goal" ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {GOALS.map((g, k) => (
                  <Card key={g.id} o={{ v: g.id, label: g.label, line: g.line, glyph: GOAL_GLYPH[g.id] }} k={k} on={goal === g.id} onPress={() => { setGoal(g.id); nod(); }} />
                ))}
              </View>
            ) : null}
            {step === "horizon" ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {HORIZON.map((o, k) => (
                  <Card key={o.v} o={o} k={k} on={horizon === o.v} onPress={() => { setHorizon(o.v); nod(); }} />
                ))}
              </View>
            ) : null}
            {step === "pace" ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {PACE.map((o, k) => (
                  <Card key={o.v} o={o} k={k} on={pace === o.v} onPress={() => { setPace(o.v); nod(); }} />
                ))}
              </View>
            ) : null}
            {step === "tone" ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {TONE.map((o, k) => (
                  <Card key={o.v} o={o} k={k} on={tone === o.v} onPress={() => { setTone(o.v); nod(); }} />
                ))}
              </View>
            ) : null}
            {step === "plan" ? (
              busy || !plan ? (
                <Thinking label="Reading your answers…" avatar={<Keeper look={RECEPTIONIST.look} scale={1} color={RECEPTIONIST.color} speaking />} />
              ) : (
                <View style={{ gap: 12 }}>
                  <Animated.View entering={FadeInDown.duration(300)}>
                    <Display size="xl">Your first four weeks</Display>
                    <Body tone="muted" style={{ marginTop: 4 }}>
                      {plan.why}
                    </Body>
                  </Animated.View>
                  {plan.weeks.map((w, k) => (
                    <Animated.View key={w.n} entering={FadeInDown.delay(120 + k * 90).springify().damping(16)}>
                      <View style={{ backgroundColor: w.n === 1 ? color : shell.panel, borderRadius: 18, padding: 14, borderWidth: 1.5, borderColor: w.n === 1 ? color : shell.line }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: w.n === 1 ? "rgba(255,255,255,0.18)" : wash(color, 0.14), alignItems: "center", justifyContent: "center" }}>
                            <Spec tone={w.n === 1 ? "paper" : "ink"}>{String(w.n)}</Spec>
                          </View>
                          <Body medium tone={w.n === 1 ? "paper" : "ink"} style={{ flex: 1 }}>
                            {w.focus}
                          </Body>
                          {w.n === 1 ? <Spec tone="paperQuiet">this week</Spec> : null}
                        </View>
                        {w.do.map((d, m) => (
                          <Body key={m} size="sm" tone={w.n === 1 ? "paper" : "muted"} style={{ marginTop: 6, marginLeft: 40 }}>
                            {`· ${d}`}
                          </Body>
                        ))}
                      </View>
                    </Animated.View>
                  ))}
                  <Animated.View entering={FadeInDown.delay(520).duration(300)}>
                    <Plate tone="paper" radius={radius.md} padding={12}>
                      <Spec tone="muted">ON YOUR STAND NOW</Spec>
                      <Body size="sm" style={{ marginTop: 4 }}>{`This week: ${plan.weeklyGoal}`}</Body>
                      <Body size="sm">{`In 90 days: ${plan.target90}`}</Body>
                    </Plate>
                  </Animated.View>
                  <Spec tone="faint">{plan.source === "live" ? "Made from your answers. Remake it any time from Home." : "Made from your answers with the house rules. With the coaches live it gets more specific."}</Spec>
                </View>
              )
            ) : null}
          </Animated.View>

          <View style={{ flex: 1 }} />
          <ButtonRow>
            <Button arrow onPress={next} disabled={!can || busy}>
              {step === "plan" ? "Show me around" : step === "tone" ? "Make my plan" : "Next"}
            </Button>
            {i > 0 && step !== "plan" ? (
              <Button variant="ghost" onPress={() => setI(i - 1)}>
                Back
              </Button>
            ) : step === "name" ? (
              <Button variant="ghost" onPress={() => router.replace("/start" as Href)}>
                Skip
              </Button>
            ) : null}
          </ButtonRow>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
