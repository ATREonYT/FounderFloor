/**
 * INBOX — conversations from the floor. Rows the way every messaging list
 * is built (face, name, last line, time, unread dot), with the hall's
 * faces and mono times. Opening one uses the same Dialogue as everything
 * else and the same Message turns as the desk.
 */
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Body, Composer, Dialogue, Display, Keeper, Message, Plate, Spec, radius, shell, useLayout } from "@founderfloor/ui";
import { TopBar } from "../../components/TopBar";
import { COLUMN, useBottomChrome } from "../../lib/chrome";
import { THREADS, YOU, type Thread } from "../../lib/mock";

export default function Inbox() {
  const L = useLayout();
  const bottom = useBottomChrome();
  const [threads, setThreads] = useState(THREADS);
  const [open, setOpen] = useState<Thread | null>(null);
  const [draft, setDraft] = useState("");
  const unread = threads.filter((t) => t.unread).length;
  const openThread = (t: Thread) => {
    setThreads((ts) => ts.map((x) => (x.id === t.id ? { ...x, unread: false } : x)));
    setOpen(t);
  };
  const reply = () => {
    if (!open || !draft.trim()) return;
    const line = { role: "you" as const, text: draft.trim() };
    setThreads((ts) => ts.map((x) => (x.id === open.id ? { ...x, lines: [...x.lines, line], last: `You: ${line.text}`, when: "now" } : x)));
    setOpen((o) => (o ? { ...o, lines: [...o.lines, line] } : o));
    setDraft("");
  };
  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <TopBar center={<Spec tone="muted">{unread ? `${unread} unread` : "all read"}</Spec>} />
      <ScrollView contentContainerStyle={{ width: "100%", maxWidth: COLUMN, alignSelf: "center", paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: bottom, gap: 16 }}>
        <View style={{ gap: 8, paddingBottom: 4 }}>
          <Display size={L.compact ? "3xl" : "4xl"}>Inbox</Display>
          <Body tone="muted" size="lg">
            People who stopped at your stand, and kept talking.
          </Body>
        </View>
        <Plate tone="panel" radius={radius.xl}>
          {threads.map((t, i) => (
            <Pressable key={t.id} onPress={() => openThread(t)} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: "row", gap: 12, alignItems: "center", padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: shell.line, backgroundColor: pressed ? shell.well : "transparent" })}>
              <Keeper look={t.look} scale={2} />
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
      </ScrollView>

      <Dialogue open={!!open} onClose={() => setOpen(null)} sign={open?.who ?? ""} keeper={open?.stand ?? ""} color="#4F6E6B" footer={null}>
        <View style={{ gap: 16 }}>
          {open?.lines.map((l, i) => (
            <Message key={i} role={l.role === "you" ? "you" : "desk"} text={l.text} avatar={l.role === "them" && open ? <Keeper look={open.look} scale={1} /> : undefined} />
          ))}
          <Composer value={draft} onChange={setDraft} onSend={reply} placeholder={`Reply to ${open?.who ?? ""}…`} />
          <Spec tone="faint">{`Replies go to their stand on the floor. You are ${YOU.name}.`}</Spec>
        </View>
      </Dialogue>
    </View>
  );
}
