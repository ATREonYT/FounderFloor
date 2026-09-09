/**
 * The shell: four screens behind one menu, in the order every daily app
 * shares: what to do today, the journey, the coach, and you. The stand,
 * the office and the floor are pages behind You, not tabs. On a phone the menu floats over
 * the bottom of the screen as a glass pill (the iOS 26 / assistant-app
 * idiom, drawn in the site's glass); on anything wider it is a rail down
 * the left. The native tab bar is never shown — the kit draws all chrome.
 */
import { Tabs, usePathname, useRouter, type Href } from "expo-router";
import { View } from "react-native";
import { Menu, TabBar, shell, useLayout } from "@founderfloor/ui";
import { BAR } from "../../lib/chrome";
import { TourTarget } from "../../components/TourTarget";

export default function TabsLayout() {
  const L = useLayout();
  const router = useRouter();
  const path = usePathname();
  const active = path.split("/").filter(Boolean)[0] ?? "today";
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
        <Tabs tabBar={() => null} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: shell.paper }, animation: "none", lazy: true }}>
          <Tabs.Screen name="today" />
          <Tabs.Screen name="build" />
          <Tabs.Screen name="reception" />
          <Tabs.Screen name="you" />
        </Tabs>
        {!rail ? (
          <View pointerEvents="box-none" style={{ position: "absolute", left: BAR.inset + 4, right: BAR.inset + 4, bottom: L.insets.bottom + BAR.inset }}>
            <TourTarget id="tabs">
              <TabBar active={active} onSelect={go} />
            </TourTarget>
          </View>
        ) : null}
      </View>
    </View>
  );
}
