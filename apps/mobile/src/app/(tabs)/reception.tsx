/**
 * THE DESK — the home screen, in the shape every assistant app shares: a
 * greeting, four things to try, a composer at the bottom, a picker pill at
 * the top. What makes it this building: the picker shows the hall you are
 * in and who is there; the assistant is a keeper standing at a pixel
 * counter; the suggestion chips are paper signs; the reply reads like a
 * page beside the keeper. `?coach=` puts a stall keeper behind the desk.
 */
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Body, Button, Chip, Composer, Dialogue, Display, Keeper, Message, Pill, Spec, Stage, Streak, Thinking, radius, shell, useLayout, type Mood } from "@founderfloor/ui";
import { TopBar } from "../../components/TopBar";
import { COLUMN, useBottomChrome, takePendingSay } from "../../lib/chrome";
import { COACHES, HALLS, STARTERS, greeting, type HallId } from "../../lib/mock";
import { useStand } from "../../lib/stand";
import { useGate } from "../../lib/gate";
import { aiMode, MODE_LINE } from "../../lib/ai";
import { useReceptionist } from "../../lib/receptionist";

export default function Reception() {
  const L = useLayout();
  const router = useRouter();
  const bottom = useBottomChrome();
  const { coach: coachParam } = useLocalSearchParams<{ coach?: string }>();
  const gate = useGate();
  const { coach, messages, busy, thinking, send, reset, starters, source, quota } = useReceptionist(coachParam);
  const stand = useStand();
  const [draft, setDraft] = useState("");
  const [hallId, setHallId] = useState<HallId>("main-hall");
  const [halls, setHalls] = useState(false);
  const hall = HALLS.find((h) => h.id === hallId)!;
  const scroll = useRef<ScrollView>(null);
  const empty = messages.length === 0;
  const atDesk = coach.id === "desk";
  const streaming = messages.some((m) => m.streaming);
  const mood: Mood = thinking || streaming ? "talk" : "idle";
  const lastDesk = [...messages].reverse().find((m) => m.role === "desk");
  const streak = stand.streak;

  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 40);
    return () => clearTimeout(t);
  }, [messages, thinking]);

  const submit = (text = draft) => {
    if (!text.trim() || busy) return;
    // Free's turns are counted only when a model will answer; a script is free
    if (!atDesk && aiMode() !== "rehearsal" && !gate("coachTurn", { coach: coach.id })) return;
    send(text);
    setDraft("");
  };
  useEffect(() => {
    const say = takePendingSay(coach.id);
    if (say && !busy) {
      const t = setTimeout(() => submit(say), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coach.id]);
  const column = { width: "100%" as const, maxWidth: COLUMN, alignSelf: "center" as const, paddingHorizontal: L.shell.paddingHorizontal };

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <TopBar
        center={<Pill label={hall.name} meta={L.compact && !empty ? undefined : `${hall.here} here`} live onPress={() => setHalls(true)} />}
        right={
          !empty ? (
            <Button
              size="sm"
              variant="ghost"
              onPress={() => {
                reset();
                if (!atDesk) router.setParams({ coach: undefined });
              }}
            >
              New
            </Button>
          ) : null
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          contentContainerStyle={[column, { flexGrow: 1, justifyContent: empty ? "flex-end" : "flex-start", paddingTop: 8, paddingBottom: 16, gap: 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          {empty ? (
            <View style={{ gap: 20, paddingBottom: 8 }}>
              <Stage look={coach.look} color={coach.color} who={atDesk ? "The desk" : coach.name} say={atDesk ? `${greeting(stand.founder || undefined)} ${stand.record.weeklyGoal ? `This week: ${stand.record.weeklyGoal}.` : "The desk is open."}` : coach.greeting} mood="idle" scale={2} height={L.compact ? 200 : 240}>
                <Streak days={Array.from({ length: 7 }, (_, i) => i >= 7 - Math.min(7, streak))} label={streak === 1 ? "day one" : streak ? `${streak}-day streak` : "day one"} />
              </Stage>
              <View style={{ gap: 8 }}>
                <Display size={L.compact ? "3xl" : "4xl"}>{atDesk ? "What do you need?" : coach.title}</Display>
                <Body tone="muted" size={L.compact ? "base" : "lg"} style={{ maxWidth: 560 }}>
                  {atDesk ? "Your stand, the floor, or a person. The keeper who knows will answer." : coach.blurb}
                </Body>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {STARTERS.map((s) => (
                  <Chip key={s.text} hint={s.hint} onPress={() => submit(s.text)}>
                    {s.text}
                  </Chip>
                ))}
              </View>
              <View style={{ gap: 8 }}>
                <Spec tone="muted">THE STAFF</Spec>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {COACHES.map((c) => (
                    <Pressable key={c.id} onPress={() => router.setParams({ coach: c.id })} accessibilityRole="button" accessibilityLabel={`Talk to ${c.name}`} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: shell.line, borderRadius: radius.full, paddingRight: 12, paddingLeft: 4, paddingVertical: 4 })}>
                      <Keeper look={c.look} scale={1} color={c.color} />
                      <View>
                        <Body size="sm" medium>
                          {c.name}
                        </Body>
                        <Spec tone="faint">{c.title}</Spec>
                      </View>
                    </Pressable>
                  ))}
                  <Pressable onPress={() => router.push("/coaches")} accessibilityRole="button" style={{ justifyContent: "center", paddingHorizontal: 8 }}>
                    <Spec tone="accent">About the four →</Spec>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <>
              <Stage look={coach.look} color={coach.color} mood={mood} scale={2} height={112} radiusPx={20} who={atDesk ? "The desk" : coach.name} say={lastDesk && !lastDesk.streaming ? undefined : undefined} />
              {messages.map((m) => (
                <Message key={m.id} role={m.role} text={m.text} streaming={m.streaming} avatar={m.role === "desk" ? <Keeper look={coach.look} scale={1} speaking={!!m.streaming} color={coach.color} /> : undefined} />
              ))}
              {quota ? (
                <Pressable onPress={() => router.push({ pathname: "/plans", params: { why: quota } })} accessibilityRole="button">
                  <Chip grow={false} hint="See the plans →">{quota}</Chip>
                </Pressable>
              ) : null}
              {thinking ? <Thinking label={atDesk ? "At the desk…" : `${coach.name} is looking…`} avatar={<Keeper look={coach.look} scale={1} speaking color={coach.color} />} /> : null}
            </>
          )}
        </ScrollView>

        <View style={[column, { paddingBottom: bottom, gap: 8 }]}>
          {!atDesk && messages.length <= 1 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {starters.map((t) => (
                <Chip key={t} grow={false} onPress={() => submit(t)}>
                  {t}
                </Chip>
              ))}
            </View>
          ) : null}
          <Composer
            value={draft}
            onChange={setDraft}
            onSend={() => submit()}
            onAttach={() => router.push("/drawer")}
            placeholder={atDesk ? "Ask the desk…" : `Ask ${coach.name}…`}
            busy={busy}
            status={`${atDesk || aiMode() === "rehearsal" ? MODE_LINE.rehearsal : source === "live" ? MODE_LINE[aiMode()] : `${MODE_LINE[aiMode()]} · last reply was scripted`} · ${hall.name}`}
          />
        </View>
      </KeyboardAvoidingView>

      <Dialogue open={halls} onClose={() => setHalls(false)} sign="PORTER'S LODGE" keeper="Halloway" blurb="Which floors are open, and who is on them right now." color="#4F6E6B">
        <View style={{ gap: 8 }}>
          {HALLS.map((h) => (
            <View key={h.id} style={{ opacity: h.open ? 1 : 0.5 }}>
              <Chip
                grow={false}
                hint={`${h.here} here · ${h.tagline}`}
                onPress={() => {
                  setHallId(h.id);
                  setHalls(false);
                }}
              >
                {h.id === hallId ? `→ ${h.name}` : h.name}
              </Chip>
            </View>
          ))}
          <Spec tone="faint" style={{ marginTop: 8 }}>
            Counts are live on the floor; the desk answers for the hall you pick.
          </Spec>
        </View>
      </Dialogue>
    </View>
  );
}
