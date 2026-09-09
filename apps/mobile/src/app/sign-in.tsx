/**
 * Sign in — the same account as the site, the same email and password.
 * The floor server is the identity authority; the app never keeps a
 * password, only the bearer token the server hands back, in the keychain.
 * Five steps in one sheet: walk in, take a badge (then confirm the email
 * with the six-digit code from the welcome mail), forgot the password
 * (an eight-character code by email, typed here), and set a new one.
 */
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Body, Button, ButtonRow, Display, Input, Plate, Spec, Sprite, radius, shell, useLayout } from "@founderfloor/ui";
import { useSession, FLOOR_URL } from "../lib/store";
import { claimAfterSignIn } from "../lib/trial";

type Mode = "in" | "new" | "verify" | "forgot" | "reset";

export default function SignIn() {
  const L = useLayout();
  const router = useRouter();
  const { then } = useLocalSearchParams<{ then?: string }>();
  const { signIn, register, forgot, resetWithCode, verify, resendCode, status, error, account } = useSession();
  const [mode, setMode] = useState<Mode>("in");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const busy = status === "signing";

  const done = async () => {
    if (then === "trial") await claimAfterSignIn();
    if (router.canGoBack()) router.back();
    else router.replace("/today");
  };
  const go = async () => {
    setNote(null);
    if (mode === "in") {
      if (await signIn(email, password)) await done();
    } else if (mode === "new") {
      if (await register(email, name, password)) {
        setMode("verify");
        setNote(`A six-digit code is on its way to ${email.trim()}.`);
      }
    } else if (mode === "verify") {
      if (await verify(code)) await done();
    } else if (mode === "forgot") {
      await forgot(email);
      setMode("reset");
      setNote(`If ${email.trim()} has an account, a code is on its way. It works for 30 minutes.`);
    } else if (mode === "reset") {
      if (await resetWithCode(email, code, password)) await done();
    }
  };
  const can = mode === "in" ? !!email && !!password : mode === "new" ? !!email && !!name && password.length >= 6 : mode === "verify" ? code.replace(/\D/g, "").length === 6 : mode === "forgot" ? !!email : code.length >= 8 && password.length >= 6;
  const title = { in: "Walk in.", new: "Take a badge.", verify: "Confirm your email.", forgot: "Forgot the password.", reset: "Set a new password." }[mode];
  const blurb = {
    in: "Your founderfloor.net email and password. Your stand, tickets and connections come with you.",
    new: "One account for the site and the app. Your name is what the hall sees over your head.",
    verify: "The welcome email has a six-digit code. It proves the address is yours, which is what the Friday review and the hand-offs need.",
    forgot: "Enter the email on the account. The reset mail has a link for the site and a short code for here.",
    reset: "The eight-character code from the email, and the password you want from now on.",
  }[mode];
  const cta = { in: "Walk in", new: "Take the badge", verify: "Confirm", forgot: "Send the code", reset: "Set it and walk in" }[mode];

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 24, paddingBottom: L.insets.bottom + 24, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 520, alignSelf: "center", gap: 20 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Sprite id="logo-mark" scale={2} />
            <Spec tone="muted">FounderFloor · the same door as the site</Spec>
          </View>
          <Display size="3xl">{title}</Display>
          <Body tone="muted">{blurb}</Body>
          <Plate tone="panel" radius={radius.xl} padding={20}>
            <View style={{ gap: 14 }}>
              {mode !== "verify" ? <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.com" editable={mode !== "reset"} /> : null}
              {mode === "new" ? <Input label="Name on the badge" value={name} onChangeText={setName} placeholder="What the hall calls you" /> : null}
              {mode === "verify" || mode === "reset" ? <Input label={mode === "verify" ? "The six-digit code" : "The code from the email"} value={code} onChangeText={(v) => setCode(mode === "verify" ? v.replace(/\D/g, "").slice(0, 6) : v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} autoCapitalize="characters" keyboardType={mode === "verify" ? "number-pad" : "default"} mono placeholder={mode === "verify" ? "123456" : "ABCD2345"} /> : null}
              {mode === "in" || mode === "new" || mode === "reset" ? <Input label={mode === "in" ? "Password" : "New password"} value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === "in" ? "current-password" : "new-password"} placeholder="••••••••" onSubmitEditing={go} /> : null}
              {note ? (
                <Body size="sm" tone="muted">
                  {note}
                </Body>
              ) : null}
              {error ? (
                <Body size="sm" tone="accent">
                  {error}
                </Body>
              ) : null}
              <ButtonRow>
                <Button onPress={go} disabled={busy || !can} arrow>
                  {busy ? "One moment" : cta}
                </Button>
                {mode === "verify" ? (
                  <Button variant="ghost" onPress={done}>
                    Later
                  </Button>
                ) : (
                  <Button variant="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace("/today"))}>
                    Not now
                  </Button>
                )}
              </ButtonRow>
              {mode === "verify" ? (
                <Body size="sm" tone="muted">
                  Nothing arrived?{" "}
                  <Body size="sm" tone="accent" onPress={async () => setNote((await resendCode()) ? "Sent again. Check spam too." : "Could not send just now.")}>
                    Send it again.
                  </Body>
                </Body>
              ) : null}
            </View>
          </Plate>
          {mode === "in" ? (
            <View style={{ gap: 6 }}>
              <Body size="sm" tone="muted">
                No account yet?{" "}
                <Body size="sm" tone="accent" onPress={() => setMode("new")}>
                  Take a badge instead.
                </Body>
              </Body>
              <Body size="sm" tone="muted">
                <Body size="sm" tone="accent" onPress={() => setMode("forgot")}>
                  Forgot the password?
                </Body>
              </Body>
            </View>
          ) : mode === "new" || mode === "forgot" ? (
            <Body size="sm" tone="muted">
              Already have one?{" "}
              <Body size="sm" tone="accent" onPress={() => setMode("in")}>
                Walk in instead.
              </Body>
            </Body>
          ) : mode === "reset" ? (
            <Body size="sm" tone="muted">
              <Body size="sm" tone="accent" onPress={() => setMode("forgot")}>
                Send a new code.
              </Body>
            </Body>
          ) : null}
          <Spec tone="faint">{`Signing in at ${FLOOR_URL}. ${account?.verified === false ? "Your email is not confirmed yet." : "One account for the site and the app."}`}</Spec>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
