/**
 * THE OFFICE — running the thing. Not analytics (Stripe dashboards are free
 * under $10k MRR); the discipline. One weekly entry of five numbers, the
 * deltas, the runway, an update drafted from the log, the interview book,
 * the filing calendar with sources, the two rituals with Ines, and the
 * drawer. Everything a founder otherwise keeps in their head.
 */
import { useState } from "react";
import { Linking, Pressable, ScrollView, Share, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { deltas, draftUpdate, generateDeadlines, fmtMoney, runwayLine, runwayMonths, fmtMonths, type KpiEntry } from "@founderfloor/shared";
import { Bars, Body, Button, ButtonRow, Choices, Dialogue, Display, Input, Keeper, Mono, Plate, Spec, Toast, radius, shell, useLayout } from "@founderfloor/ui";
import { TopBar } from "../../components/TopBar";
import { COLUMN, useBottomChrome } from "../../lib/chrome";
import { isoWeek, useFounder } from "../../lib/store";
import { useStand } from "../../lib/stand";
import { useGate } from "../../lib/gate";
import { COACHES } from "../../lib/mock";

export default function Office() {
  const L = useLayout();
  const router = useRouter();
  const bottom = useBottomChrome();
  const stand = useStand();
  const gate = useGate();
  const { kpi, logWeek, interviews, addInterview, removeInterview, docs, saveDoc, setRecord } = useFounder();
  const r = stand.record;
  const cur = r.currency;
  const [log, setLog] = useState(false);
  const [update, setUpdate] = useState<{ audience: "investors" | "myself" | "partner"; text: string } | null>(null);
  const [iv, setIv] = useState(false);
  const [ivDraft, setIvDraft] = useState({ who: "", said: "", paysToday: "" });
  const [toast, setToast] = useState<string | null>(null);
  const wk = isoWeek();
  const last = kpi.at(-1);
  const [entry, setEntry] = useState<KpiEntry>({ week: wk, revenue: last?.revenue ?? r.mrr, customers: last?.customers ?? 0, cash: last?.cash ?? r.cash, hoursOnCustomers: 0, shipped: "", note: "" });
  const d = deltas(kpi);
  const deadlines = generateDeadlines({ entity: r.entity, residence: r.residence, formedOn: r.formedOn });
  const ines = COACHES[0];
  const say = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2600);
  };
  const num = (v: string) => Math.max(0, Math.round(Number(v.replace(/[^\d.]/g, "")) || 0));
  const column = { width: "100%" as const, maxWidth: COLUMN, alignSelf: "center" as const, paddingHorizontal: L.shell.paddingHorizontal };
  const weekday = new Date().getDay();

  const saveLog = () => {
    logWeek({ ...entry, week: wk });
    // the log is the truth for MRR and cash; the stand follows it
    setRecord({ mrr: entry.revenue, cash: entry.cash });
    setLog(false);
    say("Week logged — the coaches read it now.");
  };
  const makeUpdate = (audience: "investors" | "myself" | "partner") => {
    if (!gate("draft")) return;
    const text = draftUpdate(kpi, r, audience);
    setUpdate({ audience, text });
  };
  const keepUpdate = () => {
    if (!update) return;
    saveDoc({ kind: "update", title: `Update · ${update.audience} · ${wk}`, body: update.text }, "rehearsal");
    setUpdate(null);
    say("Update saved to the drawer.");
  };
  const shareText = async (t: string) => {
    try {
      await Share.share({ message: t });
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <TopBar center={<Spec tone="muted">{`The Office · ${wk}`}</Spec>} />
      <ScrollView contentContainerStyle={[column, { paddingBottom: bottom, gap: 16 }]}>
        <View style={{ gap: 8, paddingBottom: 4 }}>
          <Display size={L.compact ? "3xl" : "4xl"}>The Office</Display>
          <Body tone="muted" size="lg" style={{ maxWidth: 560 }}>
            Five numbers a week, and everything that follows from them. This is the room founders keep in their head; keep it here instead.
          </Body>
        </View>

        {/* rituals */}
        <View style={{ flexDirection: L.compact ? "column" : "row", gap: 12 }}>
          <Ritual title="Monday plan" on={weekday === 1} line="Three goals with a number each." onPress={() => router.navigate({ pathname: "/reception", params: { coach: "strategy", say: "Monday plan" } } as Href)} />
          <Ritual title="Friday review" on={weekday === 5} line="Promised against shipped." onPress={() => router.navigate({ pathname: "/reception", params: { coach: "strategy", say: "Friday review" } } as Href)} />
        </View>

        {/* the log */}
        <Plate tone="panel" radius={radius.xl} padding={20}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Spec tone="muted">THE WEEKLY LOG</Spec>
            <Spec tone="faint">{kpi.length ? `${kpi.length} week${kpi.length === 1 ? "" : "s"}` : "nothing yet"}</Spec>
          </View>
          {d ? (
            <View style={{ marginTop: 12, gap: 12 }}>
              <View style={{ flexDirection: "row" }}>
                {[
                  ["Revenue", fmtMoney(d.latest.revenue, cur), d.revenue],
                  ["Customers", String(d.latest.customers), d.customers],
                  ["Cash", fmtMoney(d.latest.cash, cur), d.cash],
                ].map(([k, v, delta], i) => (
                  <View key={k} style={{ flex: 1, borderLeftWidth: i ? 1 : 0, borderLeftColor: shell.line, paddingLeft: i ? 12 : 0 }}>
                    <Display size="lg">{v}</Display>
                    <Spec tone="muted">{k}</Spec>
                    <Spec tone={delta.startsWith("+") ? "verify" : delta.startsWith("-") ? "accent" : "faint"}>{delta}</Spec>
                  </View>
                ))}
              </View>
              <Bars values={kpi.slice(-16).map((e) => e.revenue)} max={Math.max(1, ...kpi.map((e) => e.revenue))} labels={[kpi[Math.max(0, kpi.length - 16)].week, d.latest.week]} color={stand.rank.color} />
              {r.burn ? <Mono size="xs" tone="muted">{runwayLine({ cash: d.latest.cash, burn: r.burn, mrr: d.latest.revenue }, cur)}</Mono> : <Spec tone="faint">Put burn on the stand and runway appears here.</Spec>}
            </View>
          ) : (
            <Body size="sm" tone="muted" style={{ marginTop: 10 }}>
              Revenue, customers, cash, hours with customers, what shipped. Two minutes on a Friday. The update, the runway and the coaches all read from it.
            </Body>
          )}
          <ButtonRow>
            <View style={{ marginTop: 12 }}>
              <Button onPress={() => setLog(true)}>{last?.week === wk ? "Edit this week" : "Log this week"}</Button>
            </View>
            {kpi.length ? (
              <View style={{ marginTop: 12 }}>
                <Button variant="secondary" onPress={() => makeUpdate("investors")}>
                  Draft the update
                </Button>
              </View>
            ) : null}
          </ButtonRow>
        </Plate>

        {/* interviews */}
        <Plate tone="panel" radius={radius.xl} padding={20}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Spec tone="muted">THE INTERVIEW BOOK</Spec>
            <Spec tone="faint">{interviews.length ? `${interviews.length} of 10 conversations` : "0 of 10"}</Spec>
          </View>
          <Body size="sm" tone="muted" style={{ marginTop: 8 }}>
            What they said, in their words, not what you heard. Underline anything they already pay for.
          </Body>
          {interviews.slice(0, 5).map((x) => (
            <View key={x.id} style={{ borderTopWidth: 1, borderTopColor: shell.line, paddingVertical: 10, gap: 2 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Body size="sm" medium>
                  {x.who}
                </Body>
                <Spec tone="faint">{x.at.slice(0, 10)}</Spec>
                <Pressable onPress={() => removeInterview(x.id)} accessibilityRole="button" accessibilityLabel="Remove" style={{ marginLeft: "auto" }}>
                  <Spec tone="faint">remove</Spec>
                </Pressable>
              </View>
              <Body size="sm">“{x.said}”</Body>
              {x.paysToday ? <Spec tone="verify">{`pays today: ${x.paysToday}`}</Spec> : null}
            </View>
          ))}
          <View style={{ marginTop: 12 }}>
            <Button size="sm" variant="secondary" onPress={() => setIv(true)}>
              Write one down
            </Button>
          </View>
        </Plate>

        {/* calendar */}
        <Plate tone="panel" radius={radius.xl} padding={20}>
          <Spec tone="muted">THE FILING CALENDAR</Spec>
          {deadlines.length ? (
            deadlines.slice(0, 5).map((x) => (
              <View key={x.ruleId} style={{ flexDirection: "row", gap: 12, borderTopWidth: 1, borderTopColor: shell.line, paddingVertical: 10, alignItems: "flex-start" }}>
                <Mono medium style={{ width: 64 }}>{`${x.daysLeft}d`}</Mono>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Body size="sm" medium>
                    {x.title}
                  </Body>
                  <Spec tone="faint">{x.due}</Spec>
                  <Pressable onPress={() => Linking.openURL(x.source)} accessibilityRole="link">
                    <Spec tone="accent">{new URL(x.source).hostname}</Spec>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Body size="sm" tone="muted" style={{ marginTop: 8 }}>
              {r.entity === "none" ? "No entity on the stand yet, so nothing to file. Teodor can compare the options." : "Nothing dated for this entity and residence."}
            </Body>
          )}
          <Spec tone="faint" style={{ marginTop: 8 }}>
            Check the official source. This is a calendar, not tax advice.
          </Spec>
        </Plate>

        {/* the drawer */}
        <Pressable onPress={() => router.push("/drawer" as Href)} accessibilityRole="button">
          <Plate tone="panel" radius={radius.xl} padding={20}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Spec tone="muted">THE DRAWER</Spec>
                <Body style={{ marginTop: 4 }}>{docs.length ? `${docs.length} document${docs.length === 1 ? "" : "s"}: ${docs.slice(0, 3).map((x) => x.title).join(", ")}${docs.length > 3 ? "…" : ""}` : "One-pager, interview script, landing copy, pricing sheet, entity comparison, launch checklist — drafted from your stand."}</Body>
              </View>
              <Body tone="accent">→</Body>
            </View>
          </Plate>
        </Pressable>
      </ScrollView>

      <Dialogue open={log} onClose={() => setLog(false)} sign="THE WEEKLY LOG" keeper="Teodor" blurb={`Week ${wk}. Five numbers; the rest follows.`} color="#5E7C93" footer="Same numbers each week, however you define them, so the deltas mean something.">
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: L.compact ? "column" : "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input label={`Revenue this month (${cur})`} value={String(entry.revenue || "")} onChangeText={(v) => setEntry((e) => ({ ...e, revenue: num(v) }))} keyboardType="numeric" mono placeholder="0" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Paying customers" value={String(entry.customers || "")} onChangeText={(v) => setEntry((e) => ({ ...e, customers: num(v) }))} keyboardType="numeric" mono placeholder="0" />
            </View>
          </View>
          <View style={{ flexDirection: L.compact ? "column" : "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input label={`Cash in the bank (${cur})`} value={String(entry.cash || "")} onChangeText={(v) => setEntry((e) => ({ ...e, cash: num(v) }))} keyboardType="numeric" mono placeholder="0" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Hours with customers" value={String(entry.hoursOnCustomers || "")} onChangeText={(v) => setEntry((e) => ({ ...e, hoursOnCustomers: num(v) }))} keyboardType="numeric" mono placeholder="0" />
            </View>
          </View>
          <Input label="What shipped" value={entry.shipped ?? ""} onChangeText={(shipped) => setEntry((e) => ({ ...e, shipped }))} placeholder="the pass QR; two new shops" />
          <Input label="Note (optional)" value={entry.note ?? ""} onChangeText={(note) => setEntry((e) => ({ ...e, note }))} multiline placeholder="What you would tell a friend about the week." />
          {r.burn ? <Mono size="xs" tone="muted">{`${runwayLine({ cash: entry.cash, burn: r.burn, mrr: entry.revenue }, cur)} · ${fmtMonths(runwayMonths({ cash: entry.cash, burn: r.burn, mrr: entry.revenue }))}`}</Mono> : null}
          <ButtonRow>
            <Button onPress={saveLog}>Log the week</Button>
            <Button variant="ghost" onPress={() => setLog(false)}>
              Leave it
            </Button>
          </ButtonRow>
        </View>
      </Dialogue>

      <Dialogue open={!!update} onClose={() => setUpdate(null)} sign="THE UPDATE" keeper="Bea" blurb="Numbers first, ask last. Nothing invented." color="#B08D2E" wide footer={null}>
        {update ? (
          <View style={{ gap: 12 }}>
            <Choices value={update.audience} options={[{ v: "investors", label: "To investors" }, { v: "partner", label: "To a partner" }, { v: "myself", label: "To myself" }]} onChange={(audience) => setUpdate({ audience, text: draftUpdate(kpi, r, audience) })} />
            <Plate tone="paper" radius={radius.md} padding={14}>
              <Mono size="xs">{update.text}</Mono>
            </Plate>
            <ButtonRow>
              <Button onPress={keepUpdate}>Keep it</Button>
              <Button variant="secondary" onPress={() => shareText(update.text)}>
                Send it
              </Button>
            </ButtonRow>
          </View>
        ) : null}
      </Dialogue>

      <Dialogue open={iv} onClose={() => setIv(false)} sign="THE INTERVIEW BOOK" keeper="Rook" blurb="Their words. Not yours." color="#B4762E" footer="Ten of these, then read the idea back again.">
        <View style={{ gap: 12 }}>
          <Input label="Who (name or role)" value={ivDraft.who} onChangeText={(who) => setIvDraft((x) => ({ ...x, who }))} placeholder="Dora, three cafés in Limassol" />
          <Input label="What they said" value={ivDraft.said} onChangeText={(said) => setIvDraft((x) => ({ ...x, said }))} multiline placeholder="“We tried stamps once. Nobody used them. I lose an hour a week chasing tabs.”" style={{ minHeight: 100 }} />
          <Input label="What they pay for today (optional)" value={ivDraft.paysToday} onChangeText={(paysToday) => setIvDraft((x) => ({ ...x, paysToday }))} placeholder="a POS at €49/mo" />
          <ButtonRow>
            <Button
              onPress={() => {
                if (!ivDraft.who.trim() || !ivDraft.said.trim()) return;
                addInterview({ who: ivDraft.who.trim(), said: ivDraft.said.trim(), paysToday: ivDraft.paysToday.trim() || undefined });
                setIvDraft({ who: "", said: "", paysToday: "" });
                setIv(false);
                say("Written down.");
              }}
            >
              Write it down
            </Button>
            <Button variant="ghost" onPress={() => setIv(false)}>
              Leave it
            </Button>
          </ButtonRow>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Keeper look={ines.look} scale={1} color={ines.color} />
            <Spec tone="faint">Ask about the last time, not the future. “Would you use…” is not a question.</Spec>
          </View>
        </View>
      </Dialogue>
      <Toast text={toast ?? ""} visible={!!toast} />
    </View>
  );
}

function Ritual({ title, on, line, onPress }: { title: string; on: boolean; line: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.8 : 1 })}>
      <Plate tone={on ? "plate" : "panel"} radius={radius.xl} padding={16}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: on ? shell.accentLift : shell.faint }} />
          <View style={{ flex: 1 }}>
            <Body medium tone={on ? "paper" : "ink"}>
              {title}
            </Body>
            <Spec tone={on ? "paperQuiet" : "muted"}>{on ? `Today. ${line}` : line}</Spec>
          </View>
          <Body tone={on ? "accentLift" : "accent"}>→</Body>
        </View>
      </Plate>
    </Pressable>
  );
}
