/**
 * The root: fonts, safe areas, the paper ground. No native header — every
 * screen draws its own chrome from the kit, and the floor pages of the site
 * hide the site header for the same reason.
 */
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FONT_MAP, PIXELATED_CSS, shell } from "@founderfloor/ui";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts(FONT_MAP);
  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);
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
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: shell.paper } }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
