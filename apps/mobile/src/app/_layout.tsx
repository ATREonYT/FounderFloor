/**
 * The root: fonts, safe areas, the paper ground. No native header — every
 * screen draws its own chrome from the kit, and the floor pages of the site
 * hide the site header for the same reason. The tabs are one screen; the
 * sign-in sheet and the inbox stack over them.
 */
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FONT_MAP, PIXELATED_CSS, shell } from "@founderfloor/ui";
import { useFounder } from "../lib/store";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts(FONT_MAP);
  const touchStreak = useFounder((s) => s.touchStreak);
  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);
  useEffect(() => {
    touchStreak();
  }, [touchStreak]);
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const s = document.createElement("style");
    s.textContent = PIXELATED_CSS + `html,body,#root{background:${shell.paper};height:100%}`;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);
  if (!loaded) return <View style={{ flex: 1, backgroundColor: shell.paper }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: shell.paper }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: shell.paper } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="sign-in" options={{ presentation: "modal" }} />
          <Stack.Screen name="inbox" options={{ presentation: "card" }} />
          <Stack.Screen name="plans" options={{ presentation: "modal" }} />
          <Stack.Screen name="drawer" options={{ presentation: "card" }} />
          <Stack.Screen name="coaches" options={{ presentation: "card" }} />
          <Stack.Screen name="start" />
          <Stack.Screen name="idea/find" />
          <Stack.Screen name="idea/check" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
