/**
 * THE FLOOR — not open yet, and the page says so.
 *
 * The real hall (the site's canvas and its socket, in a WebView) is built
 * and works; what is not ready is a floor with other founders actually
 * standing on it. An empty hall is worse than a closed one, so until there
 * are stands to walk past this page is a shut door with a date-less sign,
 * and the building says plainly what will be behind it. Flip FLOOR_OPEN to
 * true and the hall comes back exactly as it was.
 */
import { useState } from "react";
import { Platform, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Body, Button, Chip, Dialogue, Display, Pill, Plate, Rise, Spec, Sprite, radius, shell, useLayout } from "@founderfloor/ui";
import { Back, TopBar } from "../components/TopBar";
import { HALLS, type HallId } from "../lib/mock";
import { useStand } from "../lib/stand";

const SITE = "https://founderfloor.net";
/** The hall opens when there are founders standing in it. Until then, the sign. */
export const FLOOR_OPEN = false;

export default function Floor() {
  return FLOOR_OPEN ? <OpenFloor /> : <ClosedFloor />;
}

/** The shut door: what it will be, and the two things that are already true. */
function ClosedFloor() {
  const L = useLayout();
  const router = useRouter();
  const stand = useStand();
  return (
    <View style={{ flex: 1 }}>
      <TopBar left={<Back />} center={<Spec tone="muted">The floor</Spec>} />
      <View style={{ flex: 1, paddingHorizontal: L.shell.paddingHorizontal, paddingTop: 8, gap: 16, width: "100%", maxWidth: 560, alignSelf: "center" }}>
        <Rise k={0} style={{ gap: 8 }}>
          <Spec tone="accent">Coming soon</Spec>
          <Display size={L.compact ? "3xl" : "4xl"}>The floor is still being built</Display>
          <Body tone="muted">
            A hall you walk, with other founders' stands standing in it: what each one is making, how far along they are, and a door to leave a note. It opens when there are founders on it worth walking past, not before.
          </Body>
        </Rise>

        {/* the pixel hall behind its shutter */}
        <Rise k={1}>
          <Plate tone="panel" radius={radius.xl} padding={0}>
            <View style={{ height: 168, borderRadius: radius.xl, overflow: "hidden", backgroundColor: "#D8D2C4", alignItems: "center", justifyContent: "flex-end" }}>
              <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(11,14,18,0.55)" }} />
              <View style={{ position: "absolute", top: 18, alignItems: "center" }}>
                <Sprite id="prop-notice-board" scale={1} />
              </View>
              <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 34, backgroundColor: "#15191D", alignItems: "center", justifyContent: "center" }}>
                <Spec style={{ color: "rgba(237,240,244,0.72)" }}>Doors not open</Spec>
              </View>
            </View>
          </Plate>
        </Rise>

        <Rise k={2} style={{ gap: 10 }}>
          <Body size="sm" tone="muted">
            {stand.record.oneLiner ? `Your sign is already written: "${stand.record.oneLiner}" It goes up the day the doors open.` : "Write the sign on your stand and it goes up the day the doors open."}
          </Body>
          <Button block onPress={() => router.push("/stand" as Href)}>
            {stand.record.oneLiner ? "Open your stand" : "Write your sign"}
          </Button>
          <Button variant="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace("/you" as Href))}>
            Back
          </Button>
        </Rise>
      </View>
    </View>
  );
}

/**
 * THE OPEN HALL — the real thing, not a copy. The site's canvas and its
 * socket run inside a WebView (an iframe on web), so what you walk here is
 * what everyone else is walking. Nothing in game/ is touched.
 */
function OpenFloor() {
  const L = useLayout();
  const [hallId, setHallId] = useState<HallId>("main-hall");
  const [pick, setPick] = useState(false);
  const hall = HALLS.find((h) => h.id === hallId)!;
  const stand = useStand();
  const url = `${SITE}/floor/${hallId}`;
  return (
    <View style={{ flex: 1 }}>
      <TopBar left={<Back />} center={<Pill label={hall.name} meta={`${hall.here} here`} live onPress={() => setPick(true)} />} />
      {stand.source !== "floor" ? (
        <View style={{ paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: 8 }}>
          <Plate tone="paperSign" radius={radius.md} padding={10}>
            <Body size="sm" tone="muted">{stand.record.oneLiner ? `The sign reads "${stand.record.oneLiner}" Walk to any vacant plinth and put the stand up; the hall is the last room, and it is open.` : "The hall is open to walk any time. Your own stand goes up once the sign is written."}</Body>
          </Plate>
        </View>
      ) : null}
      <View style={{ flex: 1, marginHorizontal: L.compact ? 0 : 12, marginBottom: 12, borderRadius: L.compact ? 0 : 12, overflow: "hidden", borderWidth: L.compact ? 0 : 1, borderColor: shell.line, backgroundColor: "#D8D2C4" }}>
        <Hall url={url} />
        <View pointerEvents="none" style={{ position: "absolute", left: 12, bottom: 8 }}>
          <Spec tone="ink" style={{ backgroundColor: "rgba(255,255,255,0.86)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
            The real hall, walk with the pad, tap a stand to talk
          </Spec>
        </View>
      </View>
      <Dialogue open={pick} onClose={() => setPick(false)} sign="PORTER'S LODGE" keeper="Halloway" blurb="Which floors are open, and who is on them right now." color="#4F6E6B">
        <View style={{ gap: 8 }}>
          {HALLS.map((h) => (
            <Chip
              key={h.id}
              grow={false}
              hint={`${h.here} here, ${h.tagline}`}
              onPress={() => {
                setHallId(h.id);
                setPick(false);
              }}
            >
              {h.id === hallId ? `● ${h.name}` : h.name}
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
            <Button onPress={open}>Walk the floor</Button>
          </View>
        </Plate>
      </View>
    );
  }
  // required lazily so the web bundle never sees the native module
  const { WebView } = require("react-native-webview") as typeof import("react-native-webview");
  return <WebView source={{ uri: url }} style={{ flex: 1, backgroundColor: "#D8D2C4" }} allowsInlineMediaPlayback javaScriptEnabled domStorageEnabled />;
}
