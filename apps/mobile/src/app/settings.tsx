/**
 * SETTINGS — the few switches the app has, on one page: reminders (local,
 * two of them), the Friday review by email, the email confirmation, the
 * guide again, sign out, and the operator's door. Everything else is a
 * decision the app makes for the founder.
 */
import { useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Body, Button, ButtonRow, Choices, Dialogue, Display, Input, Plate, Rise, Spec, Toast, radius, shell, useLayout } from "@founderfloor/ui";
import { STORE_VERSION, useFounder, useSave, useSession } from "../lib/store";
import { applyReminders, type DailyTime } from "../lib/reminders";
import { aiMode, FAST_MODEL, MODE_LINE } from "../lib/ai";
import { staffUnlocked } from "../lib/billing";
import { keyTail, testKey, useKey, type KeyVerdict } from "../lib/key";
import { backupLine, makeBackup, readBackup, type Backup } from "@founderfloor/shared";
import { Platform, Share } from "react-native";

export default function Settings() {
  const L = useLayout();
  const router = useRouter();
  const { auth, account: me, verify, resendCode, setWeeklyMail, signOut, error } = useSession();
  const { reminders, setReminders, memory, memoryOn, setMemoryOn } = useFounder();
  const [code, setCode] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const own = useKey((k) => k.key);
  const keepKey = useKey((k) => k.keep);
  const forgetKey = useKey((k) => k.forget);
  const [keyOpen, setKeyOpen] = useState(false);
  const [draftKey, setDraftKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [verdict, setVerdict] = useState<KeyVerdict | null>(null);
  const savedAt = useSave((s) => s.at);
  const saveFailed = useSave((s) => s.failed);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [found, setFound] = useState<Backup | null>(null);
  const [why, setWhy] = useState<string | null>(null);
  /** A copy of everything, as a file the founder keeps. Nothing leaves the phone unless they send it. */
  const takeCopy = async () => {
    const text = makeBackup(useFounder.getState() as unknown as Record<string, unknown>, STORE_VERSION);
    try {
      if (Platform.OS === "web") {
        const nav = (globalThis as { navigator?: { clipboard?: { writeText: (s: string) => Promise<void> } } }).navigator;
        await nav?.clipboard?.writeText(text);
        say("Copy taken. It is on your clipboard: paste it somewhere safe.");
        return;
      }
      await Share.share({ message: text, title: "FounderFloor, a copy of everything" });
    } catch {
      say("Could not open the share sheet.");
    }
  };
  const look = (text: string) => {
    setPasted(text);
    setFound(null);
    setWhy(null);
    if (!text.trim()) return;
    const r = readBackup(text);
    if (r.ok) setFound(r.backup);
    else setWhy(r.why);
  };
  const putBack = () => {
    if (!found) return;
    useFounder.setState(found.state as never);
    setRestoreOpen(false);
    setPasted("");
    setFound(null);
    say("Put back. Everything in that copy is on this phone again.");
  };
  const mode = aiMode();
  const live = mode !== "rehearsal";
  const tryKey = async () => {
    setTesting(true);
    setVerdict(null);
    const v = await testKey(draftKey, FAST_MODEL);
    setVerdict(v);
    setTesting(false);
    if (v.ok) {
      await keepKey(draftKey.trim());
      setDraftKey("");
      setTimeout(() => { setKeyOpen(false); setVerdict(null); say("The staff answer on your key now."); }, 1400);
    }
  };
  const say = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2600);
  };
  const remind = async (next: typeof reminders) => {
    setReminders(next);
    const r = await applyReminders(next);
    say(r.ok ? (next.daily === "off" && !next.friday ? "Reminders off." : "Reminders set.") : r.reason ?? "Could not set that.");
  };
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 8, paddingBottom: L.insets.bottom + 32, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 640, alignSelf: "center", gap: 16 }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/today"))} accessibilityRole="button" style={{ alignSelf: "flex-start", backgroundColor: shell.well, borderRadius: radius.full, paddingHorizontal: 14, height: 36, justifyContent: "center" }}>
          <Spec tone="ink">← Back</Spec>
        </Pressable>
        <Rise k={0} style={{ gap: 4 }}>
          <Display size={L.compact ? "3xl" : "4xl"}>Settings</Display>
          <Body tone="muted">{auth ? auth.email || auth.name : "Not signed in on this phone."}</Body>
        </Rise>

        {/* who is answering, and what turns the staff on */}
        <Rise k={1}>
          <Plate tone="panel" radius={radius.xl} padding={20}>
            <Body medium>The desk's voice</Body>
            <View style={{ marginTop: 10, gap: 12 }}>
              <Body size="sm" tone="muted">
                {mode === "own"
                  ? "The desk and the coaches answer for real, on your own Claude account. You pay for the words."
                  : mode === "rehearsal"
                    ? "The building writes every page itself, from your own words. Nothing is missing and nothing is invented. Pro turns the staff on, and we pay for the words."
                    : "The desk and the coaches answer for real. Pro covers the words."}
              </Body>
              {!live && !staffUnlocked() ? (
                <Button block onPress={() => router.push("/plans" as Href)}>
                  Turn the staff on with Pro
                </Button>
              ) : null}
              {own ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: shell.well, borderRadius: radius.md, paddingLeft: 12, paddingRight: 4, paddingVertical: 8 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Body size="sm" medium>{keyTail(own)}</Body>
                    <Spec tone="faint">{staffUnlocked() ? "In this phone's keychain. Your account pays for the words." : "In this phone's keychain. It pays for the words once Pro turns the staff on."}</Spec>
                  </View>
                  <Button size="sm" variant="ghost" onPress={async () => { await forgetKey(); say("Key removed. The building answers again."); }}>
                    Remove
                  </Button>
                </View>
              ) : (
                <Pressable onPress={() => { setVerdict(null); setKeyOpen(true); }} accessibilityRole="button" accessibilityLabel="Use my own Claude key" style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", minHeight: 44, opacity: pressed ? 0.7 : 1 })}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Body size="sm">Use my own Claude key</Body>
                    <Spec tone="faint">{staffUnlocked() ? "Your account pays for the words instead of ours" : "For founders who already have one. It pays for the words once Pro is on."}</Spec>
                  </View>
                  <Body tone="accent">›</Body>
                </Pressable>
              )}
            </View>
          </Plate>
        </Rise>

        <Plate tone="panel" radius={radius.xl} padding={20}>
          <Body medium>Reminders</Body>
          <View style={{ gap: 12, marginTop: 10 }}>
            <Choices label="A nudge every day" value={reminders.daily} options={[{ v: "off", label: "Off" }, { v: "09:00", label: "9:00" }, { v: "13:00", label: "13:00" }, { v: "19:00", label: "19:00" }]} onChange={(v) => remind({ ...reminders, daily: v as DailyTime })} />
            <Choices label="Friday review, 16:00" value={reminders.friday ? "on" : "off"} options={[{ v: "on", label: "Remind me" }, { v: "off", label: "Off" }]} onChange={(v) => remind({ ...reminders, friday: v === "on" })} />
            <Spec tone="faint">On the phone only. Nothing is sent from a server.</Spec>
          </View>
        </Plate>

        <Plate tone="panel" radius={radius.xl} padding={20}>
          <Body medium>Email</Body>
          {!auth ? (
            <View style={{ marginTop: 10, gap: 10 }}>
              <Body size="sm" tone="muted">
                Sign in and your stand, your week with the staff, and the Friday email follow you.
              </Body>
              <ButtonRow>
                <Button size="sm" onPress={() => router.push("/sign-in" as Href)}>
                  Sign in
                </Button>
              </ButtonRow>
            </View>
          ) : (
            <View style={{ marginTop: 10, gap: 12 }}>
              {me && !me.verified ? (
                <Plate tone="paper" radius={radius.md} padding={12} lineColor={shell.accent}>
                  <Body size="sm">The welcome email has a six-digit code.</Body>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end", marginTop: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Input value={code} onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" mono placeholder="123456" />
                    </View>
                    <Button size="sm" disabled={code.length !== 6} onPress={async () => say((await verify(code)) ? "Email confirmed." : error ?? "That is not the code.")}>
                      Confirm
                    </Button>
                  </View>
                  <Pressable onPress={async () => say((await resendCode()) ? "Sent again." : "Could not send just now.")} accessibilityRole="button" style={{ marginTop: 6 }}>
                    <Spec tone="accent">Send the code again</Spec>
                  </Pressable>
                </Plate>
              ) : (
                <Spec tone="verify">Email confirmed.</Spec>
              )}
              {me ? <Choices label="Friday review by email" value={me.weeklyMail ? "on" : "off"} options={[{ v: "on", label: "Every Friday" }, { v: "off", label: "Off" }]} onChange={async (v) => say((await setWeeklyMail(v === "on")) ? (v === "on" ? "Fridays, then. One email, no others." : "Off.") : "Could not save that.")} /> : null}
            </View>
          )}
        </Plate>

        <Plate tone="panel" radius={radius.xl} padding={20}>
          <Body medium>The desk's notebook</Body>
          <View style={{ marginTop: 10, gap: 10 }}>
            <Body size="sm" tone="muted">
              {memoryOn === true ? `${memory.length} ${memory.length === 1 ? "line" : "lines"} about your work, on this phone. The desk reads them with your questions.` : memoryOn === false ? `The desk writes nothing new. ${memory.length ? `${memory.length} old lines are still on this phone.` : ""}` : "Not decided yet. Open the notebook to read the question."}
            </Body>
            {memoryOn !== null ? <Choices value={memoryOn ? "on" : "off"} options={[{ v: "on", label: "Keeps notes" }, { v: "off", label: "Off" }]} onChange={(v) => { setMemoryOn(v === "on"); say(v === "on" ? "The desk keeps notes." : "The desk writes nothing new."); }} /> : null}
            <Pressable onPress={() => router.push("/memory" as Href)} accessibilityRole="button" accessibilityLabel="Open the notebook" style={{ flexDirection: "row", alignItems: "center" }}>
              <Body style={{ flex: 1 }}>Read, copy or burn the notebook</Body>
              <Body tone="accent">›</Body>
            </Pressable>
          </View>
        </Plate>

        {/* a copy the founder can hold, and the truth about whether the writing reached the disk */}
        <Plate tone="panel" radius={radius.xl} padding={20}>
          <Body medium>Your copy</Body>
          <View style={{ marginTop: 10, gap: 12 }}>
            <Body size="sm" tone="muted">
              Everything you write lives on this phone. Take a copy and it lives somewhere else too, which is the difference between a lost phone and a lost year.
            </Body>
            {saveFailed ? (
              <Plate tone="paper" radius={radius.md} padding={12} lineColor={shell.accent}>
                <Body size="sm" tone="accent">This phone refused the last save.</Body>
                <Spec tone="muted" style={{ marginTop: 4 }}>{`What it said: ${saveFailed}. Your words are still on the screen. Take a copy now, before you close the app.`}</Spec>
              </Plate>
            ) : (
              <Spec tone="faint">{savedAt ? `Saved on this phone at ${savedAt.slice(11, 16)}.` : "Nothing new to save yet."}</Spec>
            )}
            <ButtonRow>
              <Button size="sm" onPress={() => void takeCopy()}>
                Take a copy
              </Button>
              <Button size="sm" variant="ghost" onPress={() => { setPasted(""); setFound(null); setWhy(null); setRestoreOpen(true); }}>
                Put a copy back
              </Button>
            </ButtonRow>
          </View>
        </Plate>

        <Plate tone="panel" radius={radius.xl} padding={20}>
          <Body medium>More</Body>
          <View style={{ marginTop: 10, gap: 10 }}>
            <Pressable onPress={() => router.push("/guide" as Href)} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center" }}>
              <Body style={{ flex: 1 }}>How it works, again</Body>
              <Body tone="accent">›</Body>
            </Pressable>
            <Pressable onPress={() => router.push("/plans" as Href)} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center" }}>
              <Body style={{ flex: 1 }}>The plans</Body>
              <Body tone="accent">›</Body>
            </Pressable>
            {me?.admin ? (
              <Pressable onPress={() => router.push("/dev/console" as Href)} accessibilityRole="button" accessibilityLabel="Dev console" style={{ flexDirection: "row", alignItems: "center" }}>
                <Body style={{ flex: 1 }}>Dev console</Body>
                <Body tone="accent">›</Body>
              </Pressable>
            ) : null}
            <Spec tone="faint">{MODE_LINE[mode]}</Spec>
          </View>
        </Plate>

        {auth ? (
          <ButtonRow>
            <Button
              variant="secondary"
              onPress={async () => {
                await signOut();
                say("Signed out.");
              }}
            >
              Sign out
            </Button>
          </ButtonRow>
        ) : null}
      </ScrollView>
      {/* putting a copy back: what is in it, said first, and a plain warning about what it replaces */}
      <Dialogue open={restoreOpen} onClose={() => setRestoreOpen(false)} sign="PUT A COPY BACK" keeper="The desk" blurb="Paste a copy you took before. The building tells you what is in it before anything changes." color="#5E7C93" footer="Putting a copy back replaces what is on this phone now. Take a copy of this first if you are not sure.">
        <View style={{ gap: 12 }}>
          <Input label="The copy" value={pasted} onChangeText={look} placeholder="Paste the whole thing here" autoCapitalize="none" autoCorrect={false} mono multiline style={{ minHeight: 96, textAlignVertical: "top" }} />
          {why ? <Body size="sm" tone="accent">{why}</Body> : null}
          {found ? (
            <Plate tone="paper" radius={radius.md} padding={12}>
              <Body size="sm" medium>This copy holds</Body>
              <Spec tone="muted" style={{ marginTop: 4 }}>{backupLine(found)}</Spec>
              {found.version !== STORE_VERSION ? <Spec tone="faint" style={{ marginTop: 6 }}>It came from an older version of the app. Anything it does not carry keeps what is on this phone.</Spec> : null}
            </Plate>
          ) : null}
          <ButtonRow>
            <Button onPress={putBack} disabled={!found}>
              Put it back
            </Button>
            <Button variant="ghost" onPress={() => setRestoreOpen(false)}>
              Not now
            </Button>
          </ButtonRow>
        </View>
      </Dialogue>

      {/* one field, tested the moment it is pasted, answered in plain words */}
      <Dialogue open={keyOpen} onClose={() => { setKeyOpen(false); setVerdict(null); }} sign="YOUR OWN KEY" keeper="The desk" blurb="Paste a Claude key and the words come off your account instead of ours. It does not turn the staff on; Pro does that." color="#5E7C93" footer="The key stays in this phone's keychain. It never reaches our server and never goes in the notebook.">
        <View style={{ gap: 12 }}>
          <Input label="The key" value={draftKey} onChangeText={(v) => { setDraftKey(v); setVerdict(null); }} placeholder="sk-ant-..." autoCapitalize="none" autoCorrect={false} mono multiline style={{ minHeight: 66, textAlignVertical: "top" }} />
          {verdict ? (
            <View style={{ gap: 6 }}>
              <Body size="sm" tone={verdict.ok ? "verify" : "accent"}>{verdict.say}</Body>
              {verdict.door ? (
                <Pressable onPress={() => void Linking.openURL(verdict.door!.url)} accessibilityRole="link" style={{ minHeight: 36, justifyContent: "center" }}>
                  <Spec tone="accent">{verdict.door.label}</Spec>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <Spec tone="faint">A key is a long line starting with sk-ant, made at console.anthropic.com. It is not your Claude or ChatGPT login, and the account it belongs to needs a few dollars on it.</Spec>
          )}
          <ButtonRow>
            <Button onPress={() => void tryKey()} disabled={testing || !draftKey.trim()}>
              {testing ? "Trying it..." : "Test it and keep it"}
            </Button>
            <Button variant="ghost" onPress={() => { setKeyOpen(false); setVerdict(null); }}>
              Not now
            </Button>
          </ButtonRow>
        </View>
      </Dialogue>
      <Toast text={toast ?? ""} visible={!!toast} />
    </View>
  );
}
