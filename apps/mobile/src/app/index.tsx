/**
 * The door. On a cold launch the opening plays while the store hydrates:
 * the lights, the mark on glass, the keeper walking in. Then the first
 * launch opens on the welcome and every launch after on Today; a
 * returning founder never sees the doors again. The opening is shown
 * once per process, so coming back to this route later is instant.
 */
import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View } from "react-native";
import { shell } from "@founderfloor/ui";
import { useFounder } from "../lib/store";
import { Opening } from "../components/Opening";
import { YOU } from "../lib/mock";

let opened = false;

export default function Index() {
  const door = useFounder((s) => s.door);
  const [ready, setReady] = useState(useFounder.persist.hasHydrated());
  const [shown, setShown] = useState(opened);
  useEffect(() => {
    if (ready) return;
    const off = useFounder.persist.onFinishHydration(() => setReady(true));
    if (useFounder.persist.hasHydrated()) setReady(true);
    return off;
  }, [ready]);
  if (!shown) {
    return (
      <Opening
        look={YOU.look}
        onDone={() => {
          opened = true;
          setShown(true);
        }}
      />
    );
  }
  if (!ready) return <View style={{ flex: 1, backgroundColor: shell.paper }} />;
  return <Redirect href={door ? "/today" : "/welcome"} />;
}
