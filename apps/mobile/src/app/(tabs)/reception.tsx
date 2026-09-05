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
import { Body, Button, Chip, Composer, Desk, Dialogue, Display, Keeper, Message, Pill, Sign, Spec, Thinking, radius, shell, useLayout } from "@founderfloor/ui";
import { TopBar } from "../../components/TopBar";
import { COLUMN, useBottomChrome } from "../../lib/chrome";
import { COACHES, HALLS, STARTERS, greeting, type HallId } from "../../lib/mock";
import { useStand } from "../../lib/stand";
import { useGate } from "../../lib/gate";
import { aiMode, MODE_LINE } from "../../lib/ai";
import { useReceptionist } from "../../lib/receptionist";

export default function Reception() {
  const L = useLayout();
  const router = useRouter();
  const bottom = useBottomChrome();
  const { coach: coachParam, say } = useLocalSearchParams<{ coach?: string; say?: string }>();
  const gate = useGate();
  const { coach, messages, busy, thinking, send, reset, starters } = useReceptionist(coachParam);
  const stand = useStand();
  const [draft, setDraft] = useState("");
  const [hallId, setHallId] = useState<HallId>("main-hall");
  const [halls, setHalls] = useState(false);
  const hall = HALLS.find((h) => h.id === hallId)!;
  const scroll = useRef<ScrollView>(null);
  const empty = messages.length === 0;
  const atDesk = coach.id === "desk";

  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 40);
    return () => clearTimeout(t);
  }, [messages, thinking]);

  const submit = (text = draft) => {
    if (!text.trim() || busy) return;
    if (!atDesk && !gate("coachTurn", { coach: coach.id })) return;
    send(text);
    setDraft("");
  };
  const said = useRef<string | null>(null);
  useEffect(() => {
    if (say && said.current !== say && !busy) {
      said.current = say;
      const t = setTimeout(() => submit(say), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [say, coach.id]);
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
              <Desk look={coach.look} scale={L.compact ? 2 : 3} />
              <View style={{ gap: 8 }}>
                <Display size={L.compact ? "3xl" : "4xl"}>{greeting(stand.founder || undefined)}</Display>
                <Body tone="muted" size={L.compact ? "base" : "lg"} style={{ maxWidth: 560 }}>
                  The desk is open. Ask about your stand, the floor, or a person, and the keeper who knows will answer.
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
              {!atDesk ? (
                <View style={{ alignSelf: "flex-start" }}>
                  <Sign glyph="heart" label={coach.sign} code={coach.name} tone="paper" />
                </View>
              ) : null}
              {messages.map((m) => (
                <Message key={m.id} role={m.role} text={m.text} streaming={m.streaming} avatar={m.role === "desk" ? <Keeper look={coach.look} scale={1} speaking={!!m.streaming} color={coach.color} /> : undefined} />
              ))}
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
            status={`${MODE_LINE[aiMode()]} · ${hall.name}`}
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
