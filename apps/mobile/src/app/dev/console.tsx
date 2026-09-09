/**
 * THE DEV CONSOLE — the operator's room. Opens only for an account whose
 * email is on the server's ADMIN_EMAILS list (the server answers 404 to
 * anyone else, so there is nothing here to hide). What it shows: the
 * floor's counts, whether mail is live and signed by which address, the
 * outbox, a grant form, the Friday sweep, and this device's own switches
 * (AI mode, sandbox plan, usage counters).
 */
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { FloorApi, isErr, type Plan } from "@founderfloor/shared";
import { Body, Button, ButtonRow, Choices, Display, Input, Mono, Plate, Scene, Spec, Toast, radius, shell, useLayout } from "@founderfloor/ui";
import { FLOOR_URL, useFounder, useSession } from "../../lib/store";
import { aiMode, MODE_LINE } from "../../lib/ai";
import { effectivePlan } from "../../lib/billing";

interface Overview {
  floors: { floorId: string; online: number; stands: number }[];
  accounts: number;
  verified: number;
  weeklyMail: number;
  trialsStarted: number;
  paid: number;
  emailLive: boolean;
  emailEcho: boolean;
  emailFrom: string;
  emailReplyTo: string | null;
  uptimeSec: number;
  subscribers: number;
  banned: { key: string; reason?: string }[];
}
interface Outbox {
  echo: boolean;
  live: boolean;
  emails: { to: string; subject: string; text: string; ts: number }[];
}

const api = new FloorApi(FLOOR_URL);

export default function Console() {
  const L = useLayout();
  const router = useRouter();
  const { auth, account } = useSession();
  const { usage, plan, setPlan, notes } = useFounder();
  const [over, setOver] = useState<Overview | null>(null);
  const [outbox, setOutbox] = useState<Outbox | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantTier, setGrantTier] = useState<"pro" | "founder" | "none">("pro");
  const [toast, setToast] = useState<string | null>(null);
  const say = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2600);
  };
  const load = useCallback(async () => {
    if (!auth) return;
    const [o, m] = await Promise.all([api.admin<Overview>("overview", auth.token), api.admin<Outbox>("outbox", auth.token)]);
    if (isErr(o)) {
      setErr(o.error === "not found" ? "This account is not on the operator list." : o.error);
      return;
    }
    setErr(null);
    setOver(o);
    if (!isErr(m)) setOutbox(m);
  }, [auth]);
  useEffect(() => {
    void load();
  }, [load]);

  const grant = async () => {
    if (!auth) return;
    const r = await api.admin<{ ok: true; account: { email: string; paid: { tier: string } | null } }>("grant", auth.token, { email: grantEmail.trim(), tier: grantTier });
    say(isErr(r) ? r.error : `${r.account.email}: ${r.account.paid?.tier ?? "free"}`);
    void load();
  };
  const friday = async () => {
    if (!auth) return;
    const r = await api.admin<{ sent: number; reason: string }>("friday-review", auth.token, { force: true });
    say(isErr(r) ? r.error : `Friday review: ${r.sent} sent${r.reason ? ` · ${r.reason}` : ""}`);
    void load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 8, paddingBottom: L.insets.bottom + 32, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 760, alignSelf: "center", gap: 16 }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/stand"))} accessibilityRole="button" style={{ alignSelf: "flex-start", backgroundColor: shell.well, borderRadius: radius.full, paddingHorizontal: 14, height: 36, justifyContent: "center" }}>
          <Spec tone="ink">← Back</Spec>
        </Pressable>
        <Scene set="archive" height={L.compact ? 150 : 176} radiusPx={radius.xl} ambient={false} accessibilityLabel="The operator's room">
          <Spec tone="muted">{account?.admin ? `OPERATOR · ${account.email}` : "NOT AN OPERATOR"}</Spec>
        </Scene>
        <Display size={L.compact ? "3xl" : "4xl"}>Dev console</Display>
        {!auth ? (
          <Plate tone="panel" radius={radius.xl} padding={16}>
            <Body>Sign in with the operator's account first.</Body>
            <View style={{ marginTop: 10 }}>
              <Button size="sm" onPress={() => router.push("/sign-in" as Href)}>
                Sign in
              </Button>
            </View>
          </Plate>
        ) : err ? (
          <Plate tone="paper" radius={radius.md} padding={12} lineColor={shell.accent}>
            <Body size="sm" tone="accent">
              {err}
            </Body>
          </Plate>
        ) : null}

        {over ? (
          <Plate tone="panel" radius={radius.xl} padding={20}>
            <Spec tone="muted">THE FLOOR SERVER</Spec>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
              {[
                ["Accounts", over.accounts],
                ["Confirmed", over.verified],
                ["Paid", over.paid],
                ["Trials", over.trialsStarted],
                ["Friday mail", over.weeklyMail],
                ["Mailing list", over.subscribers],
              ].map(([k, v]) => (
                <View key={String(k)} style={{ width: "33%", paddingVertical: 6 }}>
                  <Mono size="base" medium>
                    {String(v)}
                  </Mono>
                  <Spec tone="muted">{String(k)}</Spec>
                </View>
              ))}
            </View>
            <View style={{ marginTop: 8, gap: 4 }}>
              {over.floors.map((f) => (
                <Mono key={f.floorId} size="xs" tone="muted">{`${f.floorId}: ${f.online} online · ${f.stands} stands`}</Mono>
              ))}
              <Mono size="xs" tone="muted">{`mail: ${over.emailLive ? "live" : over.emailEcho ? "echo (test seam)" : "off — no RESEND_API_KEY"} · from ${over.emailFrom}${over.emailReplyTo ? ` · reply-to ${over.emailReplyTo}` : ""}`}</Mono>
              <Mono size="xs" tone="muted">{`up ${Math.round(over.uptimeSec / 3600)}h · banned ${over.banned.length}`}</Mono>
            </View>
            <ButtonRow>
              <View style={{ marginTop: 12 }}>
                <Button size="sm" variant="secondary" onPress={load}>
                  Refresh
                </Button>
              </View>
              <View style={{ marginTop: 12 }}>
                <Button size="sm" variant="ghost" onPress={friday}>
                  Send Friday review now
                </Button>
              </View>
            </ButtonRow>
          </Plate>
        ) : null}

        {over ? (
          <Plate tone="panel" radius={radius.xl} padding={20}>
            <Spec tone="muted">GRANT A PLAN</Spec>
            <View style={{ gap: 12, marginTop: 10 }}>
              <Input label="Account email" value={grantEmail} onChangeText={setGrantEmail} autoCapitalize="none" keyboardType="email-address" placeholder="someone@example.com" />
              <Choices value={grantTier} options={[{ v: "pro", label: "Pro" }, { v: "founder", label: "Founder+" }, { v: "none", label: "Back to Free" }]} onChange={setGrantTier} />
              <ButtonRow>
                <Button size="sm" onPress={grant} disabled={!grantEmail.includes("@")}>
                  Grant
                </Button>
              </ButtonRow>
            </View>
          </Plate>
        ) : null}

        {outbox ? (
          <Plate tone="panel" radius={radius.xl} padding={20}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Spec tone="muted">THE OUTBOX</Spec>
              <Spec tone="faint">{outbox.echo ? "echoed, not sent" : outbox.live ? "live" : "mail off"}</Spec>
            </View>
            {outbox.emails.length ? (
              outbox.emails.slice(0, 12).map((e, i) => (
                <View key={`${e.ts}-${i}`} style={{ borderTopWidth: 1, borderTopColor: shell.line, paddingVertical: 8, gap: 2, marginTop: i ? 0 : 8 }}>
                  <Body size="sm" medium>
                    {e.subject}
                  </Body>
                  <Spec tone="faint">{`${e.to} · ${new Date(e.ts).toLocaleString()}`}</Spec>
                  <Mono size="xs" tone="muted" numberOfLines={2}>
                    {e.text}
                  </Mono>
                </View>
              ))
            ) : (
              <Body size="sm" tone="muted" style={{ marginTop: 8 }}>
                Nothing echoed. With EMAIL_ECHO unset, sent mail goes out through Resend and is not kept here.
              </Body>
            )}
          </Plate>
        ) : null}

        <Plate tone="panel" radius={radius.xl} padding={20}>
          <Spec tone="muted">THIS DEVICE</Spec>
          <View style={{ gap: 8, marginTop: 10 }}>
            <Mono size="xs" tone="muted">{`AI: ${aiMode()} · ${MODE_LINE[aiMode()]}`}</Mono>
            <Mono size="xs" tone="muted">{`Plan in effect: ${effectivePlan()}${plan.sandbox ? " (sandbox)" : ""} · notes kept: ${notes.length}`}</Mono>
            <Mono size="xs" tone="muted">{`Usage: ${usage.ideaRuns} idea runs · ${usage.ideaChecks} reads · ${usage.coachTurnsToday} turns today · ${usage.draftsThisMonth} drafts this month`}</Mono>
            <Choices label="Sandbox plan (dev builds only)" value={plan.plan} options={(["free", "pro", "founder"] as Plan[]).map((p) => ({ v: p, label: p }))} onChange={(p) => setPlan({ plan: p, sandbox: true })} />
            <ButtonRow>
              <Button size="sm" variant="ghost" onPress={() => router.push("/dev/kit" as Href)}>
                The kit
              </Button>
              <Button size="sm" variant="ghost" onPress={() => useFounder.setState({ usage: { ideaRuns: 0, ideaChecks: 0, coachTurnsToday: 0, draftsThisMonth: 0, handoffsThisMonth: 0, day: "", month: "" }, offered: null })}>
                Reset counters
              </Button>
            </ButtonRow>
          </View>
        </Plate>
      </ScrollView>
      <Toast text={toast ?? ""} visible={!!toast} />
    </View>
  );
}
