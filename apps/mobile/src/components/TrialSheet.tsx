/**
 * The one sheet for the week of the whole staff. Three states: the week
 * just started (timeline, what changed, the price after); sign in first
 * (the same, with the badge as the first step); or nothing to start.
 * Apple's rules and Blinkist's lesson in one place: the renewal price is
 * the biggest number, the trial's length and end are dated, and the
 * reminder is promised before anyone taps.
 */
import { View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { APP_PLANS, PLAN_COPY, trialTimeline } from "@founderfloor/shared";
import { Body, Button, ButtonRow, Dialogue, Display, Glyph, Plate, Spec, radius, shell } from "@founderfloor/ui";
import { useOffer } from "../lib/trial";

const LINE: Record<string, string> = {
  read: "That was one coach. There are three more, and they know your numbers.",
  log: "First week logged. From here, Theo reads it back to you.",
  coach: "Ines answered. Jonah, Margot and Theo are around too.",
  map: "You have done the first three rooms on your own. The last three come with the coaches.",
};

export function TrialSheet() {
  const router = useRouter();
  const open = useOffer((s) => s.open);
  const dismiss = useOffer((s) => s.dismiss);
  if (!open) return null;
  const rows = trialTimeline(APP_PLANS.pro.trialDays, open.started ? open.until! - APP_PLANS.pro.trialDays * 86_400_000 : undefined);
  const title = open.needsSignIn ? "Your free week is ready. Sign in to start it." : open.started ? "Your free week starts now." : "The rest of the staff is on Pro.";
  return (
    <Dialogue open onClose={dismiss} sign="THE STAFF ROOM" keeper="Free for seven days" blurb={LINE[open.moment]} color="#2F6F6A" footer={null}>
      <View style={{ gap: 14 }}>
        <Display size="xl">{title}</Display>
        <View style={{ gap: 8 }}>
          {PLAN_COPY.pro.buys.slice(0, 4).map((b) => (
            <View key={b} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Glyph id="star" tone="accent" scale={1} />
              <Body size="sm" style={{ flex: 1 }}>
                {b}
              </Body>
            </View>
          ))}
        </View>
        <Plate tone="paper" radius={radius.md} padding={12}>
          {rows.map((r) => (
            <View key={r.day} style={{ flexDirection: "row", gap: 10, paddingVertical: 4 }}>
              <Spec tone="muted" style={{ width: 84 }}>
                {r.when}
              </Spec>
              <Body size="sm" style={{ flex: 1 }}>
                {r.label}
              </Body>
            </View>
          ))}
        </Plate>
        <View style={{ gap: 2 }}>
          <Display size="lg">{`$${APP_PLANS.pro.monthly}/month`}</Display>
          <Body size="sm" tone="muted">
            After the week, only if you keep it. Cancel any time.
          </Body>
        </View>
        <ButtonRow>
          {open.needsSignIn ? (
            <Button
              arrow
              onPress={() => {
                dismiss();
                router.push({ pathname: "/sign-in", params: { then: "trial" } } as Href);
              }}
            >
              Sign in
            </Button>
          ) : (
            <Button onPress={dismiss}>
              {open.started ? "Back to work" : "Understood"}
            </Button>
          )}
          <Button
            variant="ghost"
            onPress={() => {
              dismiss();
              router.push("/plans" as Href);
            }}
          >
            See the plans
          </Button>
        </ButtonRow>
        <Spec tone="faint">The week costs nothing. Your stand, the map and the log stay free afterwards, whatever you decide.</Spec>
      </View>
    </Dialogue>
  );
}
