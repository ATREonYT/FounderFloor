/**
 * THE WELCOME — eight questions, one at a time, asked by the desk. The
 * answers become a profile, the profile becomes a four-week plan (the
 * model when there is a key, the house rules when there is not), and the
 * plan is written onto the stand: the weekly goal and the 90-day target.
 * Then the guide, then the first idea. Nothing here is a form: chips
 * where chips will do, a text box only for a name and for the people you
 * know.
 */
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { LIKES, GOALS, PLAN_PROMPT, localPlan, asPlan, doorFor, type Profile, type FounderPlan, type Standing, type Goal, type Horizon, type Pace, type Tone } from "@founderfloor/shared";
import { Body, Button, ButtonRow, Display, Input, Keeper, Plate, Spec, Stage, Thinking, radius, shell, useLayout } from "@founderfloor/ui";
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

export default function Welcome() {
  const L = useLayout();
  const router = useRouter();
  const { setProfile, setRecord, setDoor } = useFounder();
  const [i, setI] = useState(0);
  const step = ORDER[i];
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

  const can = step === "name" ? name.trim().length >= 2 : step === "standing" ? !!standing : step === "likes" ? likes.length > 0 : step === "audiences" ? audiences.trim().length >= 3 : step === "goal" ? !!goal : step === "horizon" ? !!horizon : step === "pace" ? !!pace : step === "tone" ? !!tone : !!plan;

  const makePlan = async () => {
    const p: Profile = { name: name.trim(), standing: standing!, likes, audiences: audiences.trim(), goal: goal!, horizon: horizon!, pace: pace!, tone: tone!, budget: 500, at: new Date().toISOString() };
    setBusy(true);
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
      await new Promise((r) => setTimeout(r, 700));
      out = localPlan(p);
    }
    setProfile(p, out);
    setRecord({ weeklyGoal: out.weeklyGoal, target90: out.target90, weeklyGoalProgress: 0 });
    setDoor(doorFor(p.standing));
    setPlan(out);
    setBusy(false);
  };

  const next = () => {
    if (step === "tone") {
      setI(i + 1);
      void makePlan();
      return;
    }
    if (step === "plan") {
      // the guide, then the first idea: the finder for an itch, the second opinion for an idea, the map otherwise
      const then = standing === "itch" ? "/idea/find?auto=1" : standing === "idea" ? "/idea/check" : "/build";
      router.replace({ pathname: "/guide", params: { then } } as Href);
      return;
    }
    setI(i + 1);
  };

  const chip = <T extends string>(v: T, label: string, cur: T | null | T[], set: (v: T) => void) => {
    const on = Array.isArray(cur) ? cur.includes(v) : cur === v;
    return (
      <Pressable key={v} onPress={() => set(v)} accessibilityRole="button" accessibilityState={{ selected: on }} style={{ borderWidth: on ? 2 : 1, borderColor: on ? shell.ink : shell.line, backgroundColor: on ? shell.ink : shell.panel, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 10 }}>
        <Body size="sm" tone={on ? "paper" : "ink"} medium={on}>
          {label}
        </Body>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 16, paddingBottom: L.insets.bottom + 24, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 560, alignSelf: "center", gap: 18, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
            {ORDER.map((s, k) => (
              <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: k <= i ? shell.ink : shell.line }} />
            ))}
          </View>
          <Stage look={RECEPTIONIST.look} color={RECEPTIONIST.color} who="The desk" say={step === "plan" && plan ? plan.headline : ASK[step]} mood={step === "plan" ? (plan ? "cheer" : "talk") : "idle"} height={L.compact ? 190 : 220} scale={2} set="doors" />

          {step === "name" ? <Input label="Your first name" value={name} onChangeText={setName} placeholder="Alex" autoFocus onSubmitEditing={() => can && next()} /> : null}
          {step === "standing" ? (
            <View style={{ gap: 8 }}>
              {(
                [
                  ["itch", "I have an itch, not an idea yet"],
                  ["idea", "I have an idea"],
                  ["building", "I am building something"],
                  ["running", "I already run something"],
                ] as [Standing, string][]
              ).map(([v, l]) => chip(v, l, standing, setStanding))}
            </View>
          ) : null}
          {step === "likes" ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{LIKES.map((l) => chip(l.id, l.label, likes, (v) => setLikes((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]))))}</View> : null}
          {step === "audiences" ? (
            <View style={{ gap: 8 }}>
              <Input label="People you know" value={audiences} onChangeText={setAudiences} placeholder="café owners, teachers, my old team, landlords…" autoFocus onSubmitEditing={() => can && next()} />
              <Spec tone="faint">Good ideas come from people you can reach with a problem you can see.</Spec>
            </View>
          ) : null}
          {step === "goal" ? (
            <View style={{ gap: 8 }}>
              {GOALS.map((g) => (
                <Pressable key={g.id} onPress={() => setGoal(g.id)} accessibilityRole="button" accessibilityState={{ selected: goal === g.id }}>
                  <Plate tone={goal === g.id ? "plate" : "panel"} radius={radius.lg} padding={12}>
                    <Body medium tone={goal === g.id ? "paper" : "ink"}>
                      {g.label}
                    </Body>
                    <Spec tone={goal === g.id ? "paperQuiet" : "muted"}>{g.line}</Spec>
                  </Plate>
                </Pressable>
              ))}
            </View>
          ) : null}
          {step === "horizon" ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(
                [
                  ["3m", "Three months"],
                  ["6m", "Six months"],
                  ["12m", "A year"],
                ] as [Horizon, string][]
              ).map(([v, l]) => chip(v, l, horizon, setHorizon))}
            </View>
          ) : null}
          {step === "pace" ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(
                [
                  ["evenings", "Evenings, about 5 hours"],
                  ["part-time", "Part-time, about 15"],
                  ["all-in", "All in"],
                ] as [Pace, string][]
              ).map(([v, l]) => chip(v, l, pace, setPace))}
            </View>
          ) : null}
          {step === "tone" ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(
                [
                  ["gentle", "Gently"],
                  ["direct", "Directly"],
                  ["blunt", "Bluntly"],
                ] as [Tone, string][]
              ).map(([v, l]) => chip(v, l, tone, setTone))}
            </View>
          ) : null}
          {step === "plan" ? (
            busy || !plan ? (
              <Thinking label="Reading your answers…" avatar={<Keeper look={RECEPTIONIST.look} scale={1} color={RECEPTIONIST.color} speaking />} />
            ) : (
              <View style={{ gap: 12 }}>
                <Display size="xl">Your first four weeks</Display>
                <Body tone="muted">{plan.why}</Body>
                {plan.weeks.map((w) => (
                  <Plate key={w.n} tone={w.n === 1 ? "plate" : "panel"} radius={radius.lg} padding={14}>
                    <Spec tone={w.n === 1 ? "paperQuiet" : "muted"}>{`WEEK ${w.n}`}</Spec>
                    <Body medium tone={w.n === 1 ? "paper" : "ink"}>
                      {w.focus}
                    </Body>
                    {w.do.map((d, k) => (
                      <Body key={k} size="sm" tone={w.n === 1 ? "paper" : "muted"} style={{ marginTop: 4 }}>
                        {`· ${d}`}
                      </Body>
                    ))}
                  </Plate>
                ))}
                <Plate tone="paper" radius={radius.md} padding={12}>
                  <Spec tone="muted">ON YOUR STAND NOW</Spec>
                  <Body size="sm" style={{ marginTop: 4 }}>{`This week: ${plan.weeklyGoal}`}</Body>
                  <Body size="sm">{`In 90 days: ${plan.target90}`}</Body>
                </Plate>
                <Spec tone="faint">{plan.source === "live" ? "Made from your answers. You can remake it any time from Home." : "Made from your answers with the house rules. With the coaches live it gets more specific."}</Spec>
              </View>
            )
          ) : null}

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
