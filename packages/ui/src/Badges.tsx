/**
 * The small status marks: tier tag, rank badge, member badge, ticket chip.
 * Each is one site component, reproduced (TierTag.tsx, RankBadge.tsx,
 * MemberBadge.tsx, the HUD ticket chip in app/floor/[id]/page.tsx).
 * Gold is membership and verified revenue, nothing else.
 */
import { View } from "react-native";
import { Plate } from "./Plate";
import { Sprite } from "./Sprite";
import { Body, Spec } from "./Text";
import { radius, ranks, rankFor, shell } from "./tokens";

export type SubTier = "free" | "pro" | "founder";
export const TIER_LABEL: Record<SubTier, string> = { free: "Free", pro: "Pro", founder: "Founder+" };
/** lib/pricing.ts — the LIVE prices. The app brief's higher numbers were not adopted. */
export const TIER_PRICING = { pro: { monthly: 9, annual: 79 }, founder: { monthly: 19, annual: 159 } } as const;

/** `micro rounded-sm border px-1.5 py-0.5` in the tier's tone. */
export function TierTag({ tier }: { tier: SubTier }) {
  const s = tier === "free" ? { b: shell.line, t: "muted" as const } : tier === "pro" ? { b: "rgba(190,36,27,0.4)", t: "accent" as const } : { b: "rgba(177,140,57,0.5)", t: "goldDeep" as const };
  return (
    <View style={{ borderWidth: 1, borderColor: s.b, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start" }}>
      <Spec tone={s.t}>{TIER_LABEL[tier]}</Spec>
    </View>
  );
}

/** A round dot in the rank's colour beside its name, in ink. */
export function RankBadge({ monthlyRevenue, size = "sm" }: { monthlyRevenue: number; size?: "sm" | "lg" }) {
  const r = rankFor(monthlyRevenue);
  const dot = size === "lg" ? 12 : 8;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }} accessibilityLabel={`Rank: ${r.name}`}>
      <View style={{ width: dot, height: dot, borderRadius: radius.full, backgroundColor: r.color }} />
      {size === "lg" ? <Body medium>{r.name}</Body> : <Spec tone="ink">{r.name}</Spec>}
    </View>
  );
}
export { ranks };

/** `✦ Founder+` — gold tone for Founder+/founding, accent tone for Pro. Free renders nothing: the absence IS the upsell. */
export function MemberBadge({ tier, founding = false, glass = false }: { tier: SubTier; founding?: boolean; glass?: boolean }) {
  if (tier === "free") return null;
  const isFounding = founding;
  const gold = isFounding || tier === "founder";
  const label = isFounding ? "Founding member" : TIER_LABEL[tier];
  const inner = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: glass ? 8 : 4 }}>
      <Spec tone={gold ? "goldDeep" : "accent"}>✦</Spec>
      <Spec tone={gold ? "goldDeep" : "accent"}>{label}</Spec>
    </View>
  );
  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: gold ? "rgba(177,140,57,0.7)" : "rgba(190,36,27,0.5)",
        backgroundColor: gold ? "rgba(177,140,57,0.10)" : "rgba(251,225,221,0.6)",
      }}
    >
      {inner}
    </View>
  );
}

/** The HUD ticket balance: glass chip, gold-deep text, tabular count. */
export function TicketChip({ balance, onPress }: { balance: number; onPress?: () => void }) {
  return (
    <Plate tone="glass" radius={radius.md}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6 }} accessibilityRole={onPress ? "button" : undefined} accessibilityLabel={`${balance} tickets`}>
        <Sprite id="glyph-coin-ink" scale={1} />
        <Spec tone="goldDeep">{balance.toLocaleString("en-US")} tickets</Spec>
      </View>
    </Plate>
  );
}
