/**
 * THE DESK — the home screen, in the shape every assistant app shares: a
 * greeting, four things to try, a composer at the bottom, a picker pill at
 * the top. What makes it this building: the picker shows the hall you are
 * in and who is there; the assistant is a keeper standing at a pixel
 * counter; the suggestion chips are paper signs; the reply reads like a
 * page beside the keeper. `?coach=` puts a stall keeper behind the desk.
 */
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Body, Button, Chip, Composer, Desk, Dialogue, Display, Keeper, Message, Pill, Sign, Spec, Thinking, shell, useLayout } from "@founderfloor/ui";
import { TopBar } from "../../components/TopBar";
import { COLUMN, useBottomChrome } from "../../lib/chrome";
import { HALLS, STARTERS, YOU, greeting, type HallId } from "../../lib/mock";
import { useReceptionist } from "../../lib/receptionist";

export default function Reception() {
  const L = useLayout();
  const router = useRouter();
  const bottom = useBottomChrome();
  const { coach: coachParam } = useLocalSearchParams<{ coach?: string }>();
  const { coach, messages, busy, thinking, send, reset } = useReceptionist(coachParam);
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
    send(text);
    setDraft("");
  };
  const column = { width: "100%" as const, maxWidth: COLUMN, alignSelf: "center" as const, paddingHorizontal: L.shell.paddingHorizontal };

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <TopBar
        left={<Keeper look={YOU.look} scale={1} />}
        center={<Pill label={hall.name} meta={`${hall.here} here`} live onPress={() => setHalls(true)} />}
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
                <Display size={L.compact ? "3xl" : "4xl"}>{greeting()}</Display>
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

        <View style={[column, { paddingBottom: bottom }]}>
          <Composer
            value={draft}
            onChange={setDraft}
            onSend={() => submit()}
            onAttach={() => router.navigate("/stand")}
            placeholder={atDesk ? "Ask the desk…" : `Ask ${coach.name}…`}
            busy={busy}
            status={`Rehearsal · scripted replies until the desk is wired · ${hall.name}`}
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
