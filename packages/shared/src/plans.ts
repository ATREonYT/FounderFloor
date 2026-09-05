/**
 * What the app sells, and what Free may do. Numbers from the brief and the
 * September 2026 field: Foundra $39/mo, AI Co-Founder $25/mo, PainMap
 * $29–49/mo, Preuve $19/mo — the app sits inside the band. The site's live
 * membership ($9/$19) is a different product (floor perks) and is NOT
 * changed here; whether the two merge is a decision for Alex, recorded in
 * docs/reboot-plan.md. Free limits are enforced in the Edge Functions and
 * mirrored in the app so the paywall appears before the request fails.
 */
export type Plan = "free" | "pro" | "founder";

export const APP_PLANS: Record<Exclude<Plan, "free">, { monthly: number; annual: number; trialDays: number }> = {
  pro: { monthly: 19, annual: 159, trialDays: 3 },
  founder: { monthly: 39, annual: 329, trialDays: 3 },
};

export const FREE_LIMITS = {
  ideaRuns: 3, // idea finder runs, lifetime
  ideaChecks: 2, // second opinions, lifetime
  coachTurnsPerDay: 10,
  draftsPerMonth: 3,
  coaches: ["strategy"] as readonly string[],
  strategyDays: [1, 5] as readonly number[],
  handoffsPerMonth: 5,
  kpiWeeks: Infinity,
} as const;

export type UsageKind = "ideaRun" | "ideaCheck" | "coachTurn" | "draft" | "handoff";

export interface Usage {
  ideaRuns: number;
  ideaChecks: number;
  coachTurnsToday: number;
  draftsThisMonth: number;
  handoffsThisMonth: number;
}

export interface GateResult {
  ok: boolean;
  /** Copy for the upgrade panel, in the venue's voice. */
  reason?: string;
  /** How many of this remain on Free, when it applies. */
  left?: number;
}

export function canUse(kind: UsageKind, usage: Usage, plan: Plan, extra?: { coach?: string; weekday?: number }): GateResult {
  if (plan !== "free") return { ok: true };
  switch (kind) {
    case "ideaRun":
      return usage.ideaRuns < FREE_LIMITS.ideaRuns ? { ok: true, left: FREE_LIMITS.ideaRuns - usage.ideaRuns } : { ok: false, reason: "Three idea runs on Free, and you have used them well. Pro keeps the finder open." };
    case "ideaCheck":
      return usage.ideaChecks < FREE_LIMITS.ideaChecks ? { ok: true, left: FREE_LIMITS.ideaChecks - usage.ideaChecks } : { ok: false, reason: "Two second opinions on Free. Pro reads every version you write." };
    case "draft":
      return usage.draftsThisMonth < FREE_LIMITS.draftsPerMonth ? { ok: true, left: FREE_LIMITS.draftsPerMonth - usage.draftsThisMonth } : { ok: false, reason: "Three drafts a month on Free. Pro drafts everything in the drawer." };
    case "handoff":
      return usage.handoffsThisMonth < FREE_LIMITS.handoffsPerMonth ? { ok: true, left: FREE_LIMITS.handoffsPerMonth - usage.handoffsThisMonth } : { ok: false, reason: "Five hand-offs this month on Free. The receptionist keeps taking notes; Pro delivers them all." };
    case "coachTurn": {
      const coach = extra?.coach ?? "strategy";
      const weekday = extra?.weekday ?? new Date().getDay();
      if (!FREE_LIMITS.coaches.includes(coach)) return { ok: false, reason: `${coach[0].toUpperCase()}${coach.slice(1)} is on Pro. Ines is at the counter on Mondays and Fridays.` };
      if (!FREE_LIMITS.strategyDays.includes(weekday)) return { ok: false, reason: "On Free, Ines is at the counter on Mondays and Fridays. Pro keeps her there all week." };
      if (usage.coachTurnsToday >= FREE_LIMITS.coachTurnsPerDay) return { ok: false, reason: "Ten turns today on Free. The counter opens again at midnight, or with Pro." };
      return { ok: true, left: FREE_LIMITS.coachTurnsPerDay - usage.coachTurnsToday };
    }
  }
}

export const PLAN_COPY: Record<Plan, { name: string; line: string; buys: string[] }> = {
  free: { name: "Free", line: "Enough to find out whether this is for you.", buys: ["Your stand and the floor", "The idea finder, three runs", "Two second opinions", "Ines on Mondays and Fridays, ten turns a day", "Three drafts a month", "The weekly log, always"] },
  pro: { name: "Pro", line: "The whole staff, every day.", buys: ["All four coaches, unlimited turns", "Every draft in the drawer", "The idea finder and second opinions, open", "Investor updates from your log", "Filing reminders with sources, pushed", "Every receptionist hand-off delivered"] },
  founder: { name: "Founder+", line: "Pro, with the careful model and a better address.", buys: ["Everything in Pro", "Pitch reviews by the careful model", "Verified revenue badge when Stripe is connected", "Priority placement on the floor", "A seat in a stage-matched circle", "Founding member price, kept"] },
};
