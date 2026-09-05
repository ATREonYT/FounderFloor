/**
 * INBOX — the mailbox at your booth. One feed: messages from people on the
 * floor, receptionist hand-offs, coach nudges. Rows the way every list of
 * conversations is built, with the hall's faces and mono times; a hand-off
 * wears the receptionist's accent stripe so it is visibly not a person.
 * Opening one uses the same Dialogue and Message turns as the desk.
 */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Composer, Dialogue, Display, Keeper, Message, Plate, Spec, radius, shell, useLayout } from "@founderfloor/ui";
import { THREADS } from "../lib/mock";
import { useInbox, type InboxItem } from "../lib/store";

const KIND: Record<InboxItem["kind"], { label: string; color: string }> = {
  message: { label: "message", color: "#4F6E6B" },
  handoff: { label: "hand-off", color: "#BE241B" },
  nudge: { label: "coach", color: "#5E7C93" },
};

export default function Inbox() {
  const L = useLayout();
  const router = useRouter();
  const { items, seed, read, reply } = useInbox();
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  useEffect(() => seed(THREADS), [seed]);
  const open = items.find((x) => x.id === openId) ?? null;
  const unread = items.filter((t) => t.unread).length;
  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <View style={{ paddingTop: L.insets.top + 8, paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: 8, flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, borderWidth: 1, borderColor: shell.line, borderRadius: radius.md, paddingHorizontal: 10, height: 36, justifyContent: "center" })}>
          <Spec tone="ink">← Back</Spec>
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Spec tone="muted">{unread ? `${unread} unread` : "all read"}</Spec>
        </View>
        <View style={{ width: 72 }} />
      </View>
      <ScrollView contentContainerStyle={{ width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: L.insets.bottom + 24, gap: 16 }}>
        <View style={{ gap: 8, paddingBottom: 4 }}>
          <Display size={L.compact ? "3xl" : "4xl"}>Inbox</Display>
          <Body tone="muted" size="lg">
            People who stopped at your stand, what the receptionist took down while you were away, and what the coaches want you to see.
          </Body>
        </View>
        <Plate tone="panel" radius={radius.xl}>
          {items.map((t, i) => (
            <Pressable
              key={t.id}
              onPress={() => {
                read(t.id);
                setOpenId(t.id);
              }}
              accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: "row", gap: 12, alignItems: "center", padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: shell.line, backgroundColor: pressed ? shell.well : "transparent" })}
            >
              <View style={{ width: 3, alignSelf: "stretch", borderRadius: 2, backgroundColor: t.kind === "message" ? "transparent" : KIND[t.kind].color }} />
              <Keeper look={t.look} scale={2} color={t.kind === "handoff" ? shell.accentSoft : undefined} />
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                  <Body medium>{t.who}</Body>
                  <Spec tone="faint" style={{ flexShrink: 1 }} numberOfLines={1}>
                    {t.stand}
                  </Spec>
                  <Spec tone="faint" style={{ marginLeft: "auto" }}>
                    {t.when}
                  </Spec>
                </View>
                <Body size="sm" tone={t.unread ? "ink" : "muted"} numberOfLines={1}>
                  {t.last}
                </Body>
              </View>
              {t.unread ? <View style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: shell.accent }} /> : null}
            </Pressable>
          ))}
        </Plate>
        <Spec tone="faint">Rehearsal · these arrive over Supabase Realtime and push once the desk is wired.</Spec>
      </ScrollView>

      <Dialogue open={!!open} onClose={() => setOpenId(null)} sign={open?.who ?? ""} keeper={open ? KIND[open.kind].label : ""} blurb={open?.stand} color={open ? KIND[open.kind].color : shell.accent} footer={null}>
        <View style={{ gap: 16 }}>
          {open?.lines.map((l, i) => (
            <Message key={i} role={l.role === "you" ? "you" : "desk"} text={l.text} avatar={l.role === "them" && open ? <Keeper look={open.look} scale={1} /> : undefined} />
          ))}
          {open?.kind !== "nudge" ? (
            <Composer
              value={draft}
              onChange={setDraft}
              onSend={() => {
                if (open && draft.trim()) reply(open.id, draft.trim());
                setDraft("");
              }}
              placeholder={open?.kind === "handoff" ? "Reply to the visitor…" : `Reply to ${open?.who ?? ""}…`}
            />
          ) : null}
          <Spec tone="faint">{open?.kind === "handoff" ? "Your reply goes to the email the visitor left." : "Replies go to their stand on the floor."}</Spec>
        </View>
      </Dialogue>
    </View>
  );
}
