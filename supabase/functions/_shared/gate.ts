/**
 * Gating, server-side, from packages/shared's pricing. Free: Strategy coach
 * on Monday and Friday only, ten coach turns a day, five receptionist
 * hand-offs a month. Pro and Founder+: unlimited. Over quota answers 402
 * with the copy the app shows in its upgrade panel.
 */
export type Tier = "free" | "pro" | "founder";
export const LIMITS = { free: { turnsPerDay: 10, handoffsPerMonth: 5, coaches: ["strategy"] as string[], strategyDays: [1, 5] } } as const;

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
  if (i.kind === "handoff") return i.handoffsThisMonth < LIMITS.free.handoffsPerMonth ? { ok: true } : { ok: false, status: 402, reason: "Five hand-offs this month on the Free stand. The receptionist keeps taking notes; Pro delivers them all." };
  if (i.coach && !LIMITS.free.coaches.includes(i.coach)) return { ok: false, status: 402, reason: `${i.coach[0].toUpperCase()}${i.coach.slice(1)} is on Pro. Ines is at the counter on Mondays and Fridays.` };
  if (i.coach === "strategy" && !LIMITS.free.strategyDays.includes(i.weekday)) return { ok: false, status: 402, reason: "On Free, Ines is at the counter on Mondays and Fridays. Pro keeps her there all week." };
  if (i.turnsToday >= LIMITS.free.turnsPerDay) return { ok: false, status: 402, reason: "Ten turns today on Free. The counter opens again at midnight, or with Pro." };
  return { ok: true };
}
