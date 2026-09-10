/**
 * THE WEEK, READ BACK — a score out of a hundred from what was ticked,
 * written and shown up for; a verdict; what went well; what to fix; and
 * three things to do about it. One page per week of the plan, with the
 * other weeks a tap away along the top. The numbers are the app's and
 * cannot be flattered; the words are the desk's, from the notebook.
 */
import { ScrollView, Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Body, Button, ButtonRow, Display, Glyph, GlyphTile, Plate, Progress, Ring, Scene, Spec, Thinking, radius, shell, useLayout, wash, type GlyphId } from "@founderfloor/ui";
import { useFounder } from "../lib/store";
import { aiMode } from "../lib/ai";
import { useWeekReview } from "../lib/review";
import { weekNow } from "../lib/taskDesk";
import { StopLine } from "../components/Road";

const WEEK_GLYPH: GlyphId[] = ["bolt", "wave", "coin", "star"];
const COLOR = "#4F6E6B";

export default function Review() {
  const L = useLayout();
  const router = useRouter();
  const { week: weekParam } = useLocalSearchParams<{ week?: string }>();
  const { roadmap: plan, profile } = useFounder();
  const now = weekNow(profile, plan);
  const wN = Number(weekParam) || now;
  const week = plan?.weeks.find((w) => w.n === wN) ?? null;
  const { review, facts, reading, lastError, reread } = useWeekReview(week);
  const back = () => (router.canGoBack() ? router.back() : router.replace("/plan" as Href));
  const enter = (k: number) => FadeInDown.delay(30 + k * 40).duration(200);

  if (!plan || !week || !facts) {
    return (
      <View style={{ flex: 1, backgroundColor: shell.paper, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
        <Body tone="muted">Make a plan first; the weeks come from it.</Body>
        <Button variant="secondary" onPress={() => router.replace("/welcome" as Href)}>
          Answer the questions
        </Button>
      </View>
    );
  }
  const score = review?.score ?? 0;
  const tone = score >= 65 ? "#2F6F6A" : score >= 40 ? "#B4762E" : "#8C3B2E";
  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 8, paddingBottom: L.insets.bottom + 32, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 640, alignSelf: "center", gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back" style={{ backgroundColor: shell.well, borderRadius: radius.full, paddingHorizontal: 14, height: 36, justifyContent: "center" }}>
            <Spec tone="ink">← Back</Spec>
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <StopLine id="week" />
            <Spec tone="muted">{facts.over ? "THE WEEK IS OVER" : wN === now ? "STILL RUNNING" : "NOT YET"}</Spec>
          </View>
        </View>

        {/* the weeks, along the top */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {plan.weeks.map((w, k) => {
            const on = w.n === wN;
            const future = w.n > now;
            return (
              <Pressable key={w.n} onPress={() => router.replace({ pathname: "/review", params: { week: String(w.n) } } as Href)} accessibilityRole="button" accessibilityLabel={`Week ${w.n}`} style={{ flex: 1, alignItems: "center", gap: 6, paddingVertical: 10, borderRadius: 14, backgroundColor: on ? COLOR : shell.panel, borderWidth: 1.5, borderColor: on ? COLOR : shell.line, opacity: future ? 0.55 : 1 }}>
                <Glyph id={WEEK_GLYPH[k % WEEK_GLYPH.length]} tone={on ? "paper" : "auto"} scale={1} />
                <Spec tone={on ? "paper" : "ink"}>{`Week ${w.n}`}</Spec>
              </Pressable>
            );
          })}
        </View>

        <Scene set="office" height={L.compact ? 130 : 160} radiusPx={radius.xl} color={COLOR} ambient={false} accessibilityLabel={`Week ${wN}`}>
          <Spec tone="ink">{week.focus.replace(/\.$/, "").toUpperCase()}</Spec>
        </Scene>

        {review ? (
          <>
            {/* the score */}
            <Animated.View entering={enter(0)}>
              <Plate tone="panel" radius={radius.xl} padding={16}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                  <Ring value={score / 100} size={88} stroke={10} label={String(score)} sub="of 100" color={tone} />
                  <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                    <Display size="xl">{review.verdict}</Display>
                    <Body size="sm" tone="muted">
                      {review.line}
                    </Body>
                  </View>
                </View>
                <View style={{ gap: 10, marginTop: 16 }}>
                  <Progress value={facts.steps ? facts.stepsTicked / facts.steps : 0} label="Done" right={`${facts.stepsTicked} of ${facts.steps} steps`} color={tone} />
                  <Progress value={facts.tasks ? facts.tasksWritten / facts.tasks : 0} label="Written down" right={`${facts.tasksWritten} of ${facts.tasks} tasks`} color={tone} />
                  <Progress value={Math.min(1, facts.daysActive / 4)} label="Showed up" right={`${facts.daysActive} of 7 days`} color={tone} />
                </View>
                <Spec tone="faint" style={{ marginTop: 10 }}>Done counts for most, then what you wrote, then days in the building. The score is the app's, not the AI's.</Spec>
              </Plate>
            </Animated.View>

            <Section k={1} enter={enter} glyph="star" color="#2F6F6A" title="WHAT WENT WELL" items={review.well} />
            <Section k={2} enter={enter} glyph="flask" color="#8C3B2E" title="WHAT TO FIX" items={review.fix} />
            <Section k={3} enter={enter} glyph="bolt" color="#3B5B92" title="HOW, THIS WEEK · TAP ONE TO DO IT" items={review.how} numbered onOpen={(i) => router.push({ pathname: "/did", params: { id: `review-${review.week}-${i}`, text: review.how[i] } } as Href)} />

            <ButtonRow>
              <Button arrow onPress={() => router.replace("/plan" as Href)}>
                Open the plan
              </Button>
              <Button variant="ghost" onPress={reread} disabled={reading}>
                {reading ? "Reading…" : "Read it again"}
              </Button>
            </ButtonRow>
            <Spec tone="faint">{`${review.source === "live" ? "The desk read your notebook" : aiMode() === "rehearsal" ? "Practice mode: the reading is from the numbers only" : lastError ? `Practice mode: ${lastError}` : "From the numbers"} · ${review.at.slice(0, 10)}`}</Spec>
          </>
        ) : (
          <View style={{ gap: 12 }}>
            <Thinking label="The desk is reading your week…" />
            {[0, 1, 2].map((k) => (
              <View key={k} style={{ height: 84, borderRadius: 16, backgroundColor: shell.well }} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ k, enter, glyph, color, title, items, numbered = false, onOpen }: { k: number; enter: (k: number) => ReturnType<typeof FadeInDown.delay>; glyph: GlyphId; color: string; title: string; items: string[]; numbered?: boolean; /** Each item opens its own room to write what happened. */ onOpen?: (i: number) => void }) {
  return (
    <Animated.View entering={enter(k)} style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <GlyphTile id={glyph} color={color} size={26} scale={1} />
        <Spec tone="muted">{title}</Spec>
      </View>
      {items.map((t, i) => (
        <Pressable key={i} onPress={onOpen ? () => onOpen(i) : undefined} disabled={!onOpen} accessibilityRole={onOpen ? "button" : undefined} accessibilityLabel={onOpen ? `${t}. Open it to write what you did` : undefined} style={({ pressed }) => ({ flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: shell.panel, borderRadius: 14, borderWidth: 1, borderColor: shell.line, borderLeftWidth: 4, borderLeftColor: color, padding: 12, opacity: pressed ? 0.8 : 1 })}>
          {numbered ? (
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: wash(color, 0.14), alignItems: "center", justifyContent: "center" }}>
              <Spec tone="ink">{String(i + 1)}</Spec>
            </View>
          ) : null}
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Body size="sm">{t}</Body>
            {onOpen ? <Spec tone="accent">How, and write what you did →</Spec> : null}
          </View>
          {onOpen ? <Body tone="accent">›</Body> : null}
        </Pressable>
      ))}
    </Animated.View>
  );
}
