/**
 * The root: fonts, safe areas, the paper ground. No native header — every
 * screen draws its own chrome from the kit, and the floor pages of the site
 * hide the site header for the same reason. The tabs are one screen; the
 * sign-in sheet and the inbox stack over them.
 */
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { TrialSheet } from "../components/TrialSheet";
import { TourOverlay } from "../components/TourOverlay";
import { useEffect } from "react";
import { Platform, View, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FONT_MAP, PIXELATED_CSS, shell, applyScheme } from "@founderfloor/ui";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts(FONT_MAP);
  // the building at night: the system decides, the shell swaps, the tree remounts
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  applyScheme(scheme);
  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const s = document.createElement("style");
    s.textContent = PIXELATED_CSS + `html,body,#root{background:${shell.paper};height:100%;color-scheme:${scheme}}`;
    document.head.appendChild(s);
    return () => s.remove();
  }, [scheme]);
  if (!loaded) return <View style={{ flex: 1, backgroundColor: shell.paper }} />;
  return (
    <GestureHandlerRootView key={scheme} style={{ flex: 1, backgroundColor: shell.paper }}>
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
          <Stack.Screen name="dev/console" options={{ presentation: "card" }} />
          <Stack.Screen name="guide" options={{ presentation: "modal" }} />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="plan" options={{ presentation: "card" }} />
          <Stack.Screen name="settings" options={{ presentation: "card" }} />
        </Stack>
        <TrialSheet />
        <TourOverlay />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
