/**
 * Gating, server-side, from packages/shared's pricing. Free: the desk and
 * Ines, ten turns a day between them. Pro and Founder+: unlimited. Over
 * quota answers 402 with the copy the app shows in its upgrade panel.
 */
export type Tier = "free" | "pro" | "founder";
export const LIMITS = { free: { turnsPerDay: 10, handoffsPerMonth: 5, coaches: ["strategy", "desk"] as string[] } } as const;

export interface GateInput {
  tier: Tier;
  coach?: string;
  turnsToday: number;
  handoffsThisMonth: number;
  weekday: number; // 0–6
  kind: "coach" | "handoff" | "pitch-sonnet";
}

export function gate(i: GateInput): { ok: true } | { ok: false; status: 402 | 403; reason: string } {
  if (i.kind === "pitch-sonnet") return i.tier === "founder" ? { ok: true } : { ok: false, status: 402, reason: "Sonnet pitch reviews are Founder+. Haiku scored this one." };
  if (i.tier !== "free") return { ok: true };
  // every hand-off is delivered on every plan: a message left for you is yours
  if (i.kind === "handoff") return { ok: true };
  if (i.coach && !LIMITS.free.coaches.includes(i.coach)) return { ok: false, status: 402, reason: `${i.coach[0].toUpperCase()}${i.coach.slice(1)} is on Pro. Ines is at the counter every day.` };
  if (i.turnsToday >= LIMITS.free.turnsPerDay) return { ok: false, status: 402, reason: "Ten turns today on Free. The counter opens again at midnight, or with Pro." };
  return { ok: true };
}
