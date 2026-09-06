import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View } from "react-native";
import { shell } from "@founderfloor/ui";
import { useFounder } from "../lib/store";
/** First launch opens on the three doors; after that, the desk. Waits for the stored state so a returning founder never sees the doors again. */
export default function Index() {
  const door = useFounder((s) => s.door);
  const [ready, setReady] = useState(useFounder.persist.hasHydrated());
  useEffect(() => {
    if (ready) return;
    const off = useFounder.persist.onFinishHydration(() => setReady(true));
    if (useFounder.persist.hasHydrated()) setReady(true);
    return off;
  }, [ready]);
  if (!ready) return <View style={{ flex: 1, backgroundColor: shell.paper }} />;
  return <Redirect href={door ? "/reception" : "/start"} />;
}
