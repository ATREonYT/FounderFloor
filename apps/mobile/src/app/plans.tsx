/**
 * PLANS — the one paywall. Three plates, monthly or yearly, a three-day
 * trial on the two paid ones, and the reason you arrived at the top in the
 * venue's voice. Research: a clear paywall after the first value moment
 * converts several times better than a soft one, and 55% of trial cancels
 * happen on day zero — so the trial starts from a screen where something
 * useful just happened, never from the app's first launch.
 */
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { APP_PLANS, PLAN_COPY, type Plan } from "@founderfloor/shared";
import { Body, Button, Choices, Display, Plate, Spec, Toast, radius, shell, useLayout } from "@founderfloor/ui";
import { offerings, purchase, restore, effectivePlan, type Cycle } from "../lib/billing";
import { useFounder } from "../lib/store";

export default function Plans() {
  const L = useLayout();
  const router = useRouter();
  const { why } = useLocalSearchParams<{ why?: string }>();
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [toast, setToast] = useState<string | null>(null);
  const planState = useFounder((s) => s.plan);
  const current = effectivePlan();
  const say = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2600);
  };
  const buy = async (plan: Exclude<Plan, "free">) => {
    const o = offerings().find((x) => x.plan === plan && x.cycle === cycle)!;
    const r = await purchase(o);
    if (r.ok) {
      say(`${PLAN_COPY[plan].name} for ${o.trialDays} days, then $${o.price}/${cycle === "monthly" ? "mo" : "yr"}.`);
      setTimeout(() => router.back(), 1200);
    } else say(r.error);
  };
  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 8, paddingBottom: L.insets.bottom + 32, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 960, alignSelf: "center", gap: 16 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ alignSelf: "flex-start", borderWidth: 1, borderColor: shell.line, borderRadius: radius.md, paddingHorizontal: 10, height: 36, justifyContent: "center" }}>
          <Spec tone="ink">← Not now</Spec>
        </Pressable>
        {why ? (
          <Plate tone="paper" radius={radius.md} padding={12} lineColor={shell.accent}>
            <Body size="sm">{why}</Body>
          </Plate>
        ) : null}
        <Display size={L.compact ? "3xl" : "4xl"}>The whole staff, every day.</Display>
        <Body tone="muted" size="lg">
          Free finds out whether this is for you. Pro is the four coaches, every draft, every hand-off. Founder+ adds the careful model and a better address on the floor.
        </Body>
        <Choices value={cycle} options={[{ v: "monthly", label: "Monthly" }, { v: "annual", label: "Yearly · two months free" }]} onChange={setCycle} />
        <View style={{ flexDirection: L.compact ? "column" : "row", gap: 12 }}>
          {(["free", "pro", "founder"] as Plan[]).map((p) => {
            const paid = p !== "free" ? APP_PLANS[p] : null;
            const mine = current === p;
            const price = paid ? (cycle === "monthly" ? `$${paid.monthly}/mo` : `$${paid.annual}/yr`) : "$0";
            return (
              <Plate key={p} tone={p === "founder" ? "plate" : "panel"} radius={radius.xl} style={{ flex: 1 }}>
                <View style={{ padding: 18, gap: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                    <Display size="lg" tone={p === "founder" ? "paper" : "ink"}>
                      {PLAN_COPY[p].name}
                    </Display>
                    {mine ? <Spec tone={p === "founder" ? "accentLift" : "accent"}>yours</Spec> : null}
                  </View>
                  <Display size="xl" tone={p === "founder" ? "paper" : "ink"}>
                    {price}
                  </Display>
                  <Body size="sm" tone={p === "founder" ? "paperQuiet" : "muted"}>
                    {PLAN_COPY[p].line}
                  </Body>
                  <View style={{ gap: 6, marginTop: 4 }}>
                    {PLAN_COPY[p].buys.map((b) => (
                      <View key={b} style={{ flexDirection: "row", gap: 8 }}>
                        <View style={{ width: 6, height: 6, marginTop: 8, backgroundColor: p === "founder" ? shell.accentLift : shell.accent }} />
                        <Body size="sm" tone={p === "founder" ? "paper" : "ink"} style={{ flex: 1 }}>
                          {b}
                        </Body>
                      </View>
                    ))}
                  </View>
                  {paid && !mine ? (
                    <View style={{ marginTop: 8 }}>
                      <Button onPress={() => buy(p as "pro" | "founder")} variant={p === "founder" ? "secondary" : "primary"} onDark={p === "founder"} arrow>
                        {`Try ${paid.trialDays} days free`}
                      </Button>
                    </View>
                  ) : null}
                </View>
              </Plate>
            );
          })}
        </View>
        <Spec tone="faint">
          {planState.sandbox ? `Sandbox plan on this device${planState.trialEnds ? `, trial to ${planState.trialEnds.slice(0, 10)}` : ""}. Real purchases arrive with the store build.` : "Cancel any time in the store. Your stand and the floor stay free forever."}
        </Spec>
        <Pressable onPress={() => restore().then(() => say("Nothing to restore yet."))} accessibilityRole="button">
          <Spec tone="muted">Restore a purchase</Spec>
        </Pressable>
      </ScrollView>
      <Toast text={toast ?? ""} visible={!!toast} />
    </View>
  );
}
