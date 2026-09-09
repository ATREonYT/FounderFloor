/**
 * SETTINGS — the few switches the app has, on one page: reminders (local,
 * two of them), the Friday review by email, the email confirmation, the
 * guide again, sign out, and the operator's door. Everything else is a
 * decision the app makes for the founder.
 */
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Body, Button, ButtonRow, Choices, Display, Input, Plate, Scene, Spec, Toast, radius, shell, useLayout } from "@founderfloor/ui";
import { useFounder, useSession } from "../lib/store";
import { applyReminders, type DailyTime } from "../lib/reminders";
import { aiMode, MODE_LINE } from "../lib/ai";

export default function Settings() {
  const L = useLayout();
  const router = useRouter();
  const { auth, account: me, verify, resendCode, setWeeklyMail, signOut, error } = useSession();
  const { reminders, setReminders, memory, memoryOn, setMemoryOn } = useFounder();
  const [code, setCode] = useState("");
  const [toast, setToast] = useState<string | null>(null);
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
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 8, paddingBottom: L.insets.bottom + 32, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 640, alignSelf: "center", gap: 16 }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/today"))} accessibilityRole="button" style={{ alignSelf: "flex-start", backgroundColor: shell.well, borderRadius: radius.full, paddingHorizontal: 14, height: 36, justifyContent: "center" }}>
          <Spec tone="ink">← Back</Spec>
        </Pressable>
        <Scene set="office" height={L.compact ? 132 : 160} radiusPx={radius.xl} ambient={false} accessibilityLabel="Settings">
          <Spec tone="muted">{auth ? auth.email || auth.name : "NOT SIGNED IN"}</Spec>
        </Scene>
        <Display size={L.compact ? "3xl" : "4xl"}>Settings</Display>

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
              <Body tone="accent">→</Body>
            </Pressable>
          </View>
        </Plate>

        <Plate tone="panel" radius={radius.xl} padding={20}>
          <Body medium>More</Body>
          <View style={{ marginTop: 10, gap: 10 }}>
            <Pressable onPress={() => router.push("/guide" as Href)} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center" }}>
              <Body style={{ flex: 1 }}>How it works, again</Body>
              <Body tone="accent">→</Body>
            </Pressable>
            <Pressable onPress={() => router.push("/plans" as Href)} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center" }}>
              <Body style={{ flex: 1 }}>The plans</Body>
              <Body tone="accent">→</Body>
            </Pressable>
            {me?.admin ? (
              <Pressable onPress={() => router.push("/dev/console" as Href)} accessibilityRole="button" accessibilityLabel="Dev console" style={{ flexDirection: "row", alignItems: "center" }}>
                <Body style={{ flex: 1 }}>Dev console</Body>
                <Body tone="accent">→</Body>
              </Pressable>
            ) : null}
            <Spec tone="faint">{`AI: ${MODE_LINE[aiMode()]}`}</Spec>
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
      <Toast text={toast ?? ""} visible={!!toast} />
    </View>
  );
}
