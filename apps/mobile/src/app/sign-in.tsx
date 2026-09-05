/**
 * Sign in — the same account as the site, the same email and password.
 * The floor server is the identity authority; the app never keeps a
 * password, only the bearer token the server hands back, in the keychain.
 * Presented as a sheet over whatever you were doing.
 */
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, ButtonRow, Display, Input, Plate, Spec, Sprite, radius, shell, useLayout } from "@founderfloor/ui";
import { useSession, FLOOR_URL } from "../lib/store";

export default function SignIn() {
  const L = useLayout();
  const router = useRouter();
  const { signIn, register, status, error } = useSession();
  const [mode, setMode] = useState<"in" | "new">("in");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const busy = status === "signing";
  const go = async () => {
    const ok = mode === "in" ? await signIn(email, password) : await register(email, name, password);
    if (ok) router.back();
  };
  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 24, paddingBottom: L.insets.bottom + 24, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 520, alignSelf: "center", gap: 20 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Sprite id="logo-mark" scale={2} />
            <Spec tone="muted">FounderFloor · the same door as the site</Spec>
          </View>
          <Display size="3xl">{mode === "in" ? "Walk in." : "Take a badge."}</Display>
          <Body tone="muted">
            {mode === "in" ? "Your founderfloor.net email and password. Your stand, tickets and connections come with you." : "One account for the site and the app. Your name is what the hall sees over your head."}
          </Body>
          <Plate tone="panel" radius={radius.xl} padding={20}>
            <View style={{ gap: 14 }}>
              <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.com" />
              {mode === "new" ? <Input label="Name on the badge" value={name} onChangeText={setName} placeholder="What the hall calls you" /> : null}
              <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === "in" ? "current-password" : "new-password"} placeholder="••••••••" onSubmitEditing={go} />
              {error ? (
                <Body size="sm" tone="accent">
                  {error}
                </Body>
              ) : null}
              <ButtonRow>
                <Button onPress={go} disabled={busy || !email || !password || (mode === "new" && !name)} arrow>
                  {busy ? "One moment" : mode === "in" ? "Walk in" : "Take the badge"}
                </Button>
                <Button variant="ghost" onPress={() => router.back()}>
                  Not now
                </Button>
              </ButtonRow>
            </View>
          </Plate>
          <Body size="sm" tone="muted">
            {mode === "in" ? "No account yet? " : "Already have one? "}
            <Body size="sm" tone="accent" onPress={() => setMode(mode === "in" ? "new" : "in")}>
              {mode === "in" ? "Take a badge instead." : "Walk in instead."}
            </Body>
          </Body>
          <Spec tone="faint">{`Signing in at ${FLOOR_URL}. Forgot the password? Reset it on the site; the same one works here.`}</Spec>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
