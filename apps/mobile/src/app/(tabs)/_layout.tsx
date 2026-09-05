/**
 * The shell: five screens behind one menu. On a phone the menu floats over
 * the bottom of the screen as a glass pill (the iOS 26 / assistant-app
 * idiom, drawn in the site's glass); on anything wider it is a rail down
 * the left. The native tab bar is never shown — the kit draws all chrome.
 */
import { Tabs, usePathname, useRouter, type Href } from "expo-router";
import { View } from "react-native";
import { Menu, shell, useLayout } from "@founderfloor/ui";
import { BAR } from "../../lib/chrome";

export default function TabsLayout() {
  const L = useLayout();
  const router = useRouter();
  const path = usePathname();
  const active = path.split("/").filter(Boolean)[0] ?? "reception";
  const rail = !L.compact;
  const go = (k: string) => router.navigate(`/${k}` as Href);
  return (
    <View style={{ flex: 1, flexDirection: rail ? "row" : "column", backgroundColor: shell.paper }}>
      {rail ? (
        <View style={{ paddingLeft: 12, paddingTop: L.insets.top + 12, paddingBottom: L.insets.bottom + 12, justifyContent: "center" }}>
          <Menu active={active} onSelect={go} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Tabs tabBar={() => null} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: shell.paper }, animation: "shift" }}>
          <Tabs.Screen name="reception" />
          <Tabs.Screen name="stand" />
          <Tabs.Screen name="build" />
          <Tabs.Screen name="coaches" />
          <Tabs.Screen name="floor" />
        </Tabs>
        {!rail ? (
          <View pointerEvents="box-none" style={{ position: "absolute", left: BAR.inset, right: BAR.inset, bottom: L.insets.bottom + BAR.inset }}>
            <Menu active={active} onSelect={go} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
