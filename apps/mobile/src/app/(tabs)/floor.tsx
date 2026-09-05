/**
 * THE FLOOR — the real hall, not a copy. The site's canvas and its socket
 * run inside a WebView (an iframe on web), so what you walk here is what
 * everyone else is walking. The hall picker up top is the same Pill as the
 * desk's, and the kit's Spec below explains the controls in the site's
 * own words. Nothing in game/ is touched or reimplemented.
 */
import { useState } from "react";
import { Platform, View } from "react-native";
import { Body, Button, Chip, Dialogue, Display, Pill, Plate, Spec, Sprite, radius, shell, useLayout } from "@founderfloor/ui";
import { TopBar } from "../../components/TopBar";
import { BAR } from "../../lib/chrome";
import { HALLS, type HallId } from "../../lib/mock";
import { useStand } from "../../lib/stand";

const SITE = "https://founderfloor.net";

export default function Floor() {
  const L = useLayout();
  const [hallId, setHallId] = useState<HallId>("main-hall");
  const [pick, setPick] = useState(false);
  const hall = HALLS.find((h) => h.id === hallId)!;
  const stand = useStand();
  const url = `${SITE}/floor/${hallId}`;
  const clear = L.compact ? L.insets.bottom + BAR.inset + BAR.height : 0;
  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <TopBar center={<Pill label={hall.name} meta={`${hall.here} here`} live onPress={() => setPick(true)} />} />
      {stand.source !== "floor" ? (
        <View style={{ paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: 8 }}>
          <Plate tone="paperSign" radius={radius.md} padding={10}>
            <Body size="sm" tone="muted">{stand.record.oneLiner ? `The sign reads "${stand.record.oneLiner}" Walk to any vacant plinth and put the stand up; the hall is the last room, and it is open.` : "The hall is open to walk any time. Your own stand goes up once the sign is written — the desk or the idea finder will write it with you."}</Body>
          </Plate>
        </View>
      ) : null}
      <View style={{ flex: 1, marginHorizontal: L.compact ? 0 : 12, marginBottom: clear ? 0 : 12, borderRadius: L.compact ? 0 : 12, overflow: "hidden", borderWidth: L.compact ? 0 : 1, borderColor: shell.line, backgroundColor: "#D8D2C4" }}>
        <Hall url={url} />
        <View pointerEvents="none" style={{ position: "absolute", left: 12, bottom: clear + 8 }}>
          <Spec tone="ink" style={{ backgroundColor: "rgba(255,255,255,0.86)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
            The real hall · walk with the pad, tap a stand to talk
          </Spec>
        </View>
      </View>
      <Dialogue open={pick} onClose={() => setPick(false)} sign="PORTER'S LODGE" keeper="Halloway" blurb="Which floors are open, and who is on them right now." color="#4F6E6B">
        <View style={{ gap: 8 }}>
          {HALLS.map((h) => (
            <Chip
              key={h.id}
              grow={false}
              hint={`${h.here} here · ${h.tagline}`}
              onPress={() => {
                setHallId(h.id);
                setPick(false);
              }}
            >
              {h.id === hallId ? `→ ${h.name}` : h.name}
            </Chip>
          ))}
        </View>
      </Dialogue>
    </View>
  );
}

function Hall({ url }: { url: string }) {
  if (Platform.OS === "web") {
    // the site sends X-Frame-Options: DENY, so on the web the hall opens in its own tab
    const open = () => (globalThis as { open?: (u: string, t: string) => unknown }).open?.(url, "_blank");
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#D8D2C4" }}>
        <Plate tone="panel" radius={radius.xl} padding={20} style={{ maxWidth: 420, width: "100%" }}>
          <View style={{ gap: 12, alignItems: "flex-start" }}>
            <Sprite id="prop-sign" scale={2} />
            <Display size="lg">The hall is next door</Display>
            <Body size="sm" tone="muted">
              In the browser the floor runs as its own page, with the whole canvas and the pad. In the app it is right here in this tab.
            </Body>
            <Button arrow onPress={open}>
              Walk the floor
            </Button>
          </View>
        </Plate>
      </View>
    );
  }
  // required lazily so the web bundle never sees the native module
  const { WebView } = require("react-native-webview") as typeof import("react-native-webview");
  return <WebView source={{ uri: url }} style={{ flex: 1, backgroundColor: "#D8D2C4" }} allowsInlineMediaPlayback javaScriptEnabled domStorageEnabled />;
}
