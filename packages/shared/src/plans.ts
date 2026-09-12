/**
 * What the app sells, and what Free may do.
 *
 * The shape follows what the subscription data actually shows (docs/
 * reboot-plan.md, "The mine"): a free core loop that is never taken away,
 * one week of the whole staff started at the first moment the app pays
 * something back (a reverse trial, server-side, once per account), and
 * what Pro adds: the staff ANSWER FOR REAL, and remember. On Free the
 * building writes every page and every reply itself from the founder's
 * own words, whole and labelled; on Pro the desk and the four coaches
 * answer live with FounderFloor paying for the words, they carry the log,
 * the interview book and the last conversations, and Theo reads week
 * against week. The paywall fires where that voice would have spoken:
 * the second weekly log, the second visit to a coach — after value,
 * never before it. A founder who already has a Claude key can put it in
 * Settings; that changes who pays for the words, not what the plan
 * allows (apps/mobile/src/lib/key.ts).
 *
 * Prices from the September 2026 field: Foundra $39/mo, AI Co-Founder
 * $25/mo, PainMap $29–49/mo, Preuve $19/mo. The site's live membership
 * ($9/$19) is a different product (floor perks) and is NOT changed here.
 * Free limits are enforced in the Edge Functions and mirrored in the app
 * so the sheet appears before the request fails.
 */
export type Plan = "free" | "pro" | "founder";

/** The week of the whole staff. The server's TRIAL_DAYS is the truth; this is the copy's. */
export const TRIAL_DAYS = 7;

export const APP_PLANS: Record<Exclude<Plan, "free">, { monthly: number; annual: number; trialDays: number }> = {
  pro: { monthly: 19, annual: 159, trialDays: TRIAL_DAYS },
  founder: { monthly: 39, annual: 329, trialDays: TRIAL_DAYS },
};

export const FREE_LIMITS = {
  ideaRuns: 3, // idea finder runs, lifetime
  ideaChecks: 2, // second opinions, lifetime
  coachTurnsPerDay: 10,
  draftsPerMonth: 3,
  coaches: ["strategy", "desk"] as readonly string[],
  /** The one thing Free never has: the staff's memory between visits. */
  remembers: false,
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

/** Do the staff keep notes between visits on this plan? */
export const remembers = (plan: Plan): boolean => plan !== "free";

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
      // every hand-off is delivered on every plan: a message left for you is yours
      return { ok: true };
    case "coachTurn": {
      const coach = extra?.coach ?? "strategy";
      if (!FREE_LIMITS.coaches.includes(coach)) return { ok: false, reason: `${coach[0].toUpperCase()}${coach.slice(1)} is on Pro. Ines is at the counter every day.` };
      if (usage.coachTurnsToday >= FREE_LIMITS.coachTurnsPerDay) return { ok: false, reason: "Ten turns today on Free. The counter opens again at midnight, or with Pro." };
      return { ok: true, left: FREE_LIMITS.coachTurnsPerDay - usage.coachTurnsToday };
    }
  }
}

/**
 * THE MINE. Where the paywall stands, and what it says there. Each one is
 * a moment the app would have paid something back that Free cannot: it is
 * shown with an honest preview of what Pro would say, never a blur over
 * work already done, and always with a way past it.
 */
export type MineId = "office-reading" | "coach-memory" | "update-from-log";

export const MINES: Record<MineId, { title: string; line: string; why: string }> = {
  "office-reading": {
    title: "Theo has read both weeks.",
    line: "Cash, customers, hours and runway, week against week, and what he would change. That reading is Pro.",
    why: "Two weeks in the log. Theo reads them against each other on Pro: the movement, the runway trend, the update drafted from your own numbers.",
  },
  "coach-memory": {
    title: "On Free I answer from the building's rules.",
    line: "Pro, and I answer for real and keep the notes: what you said last time, what you promised, what the log says since.",
    why: "On Pro the coaches answer live and keep notes between visits: the log, the interview book, and your last conversations. On Free the building writes the answer from your own words, and says so.",
  },
  "update-from-log": {
    title: "The update writes itself from the log.",
    line: "Numbers first, ask last, in your words. That draft is Pro.",
    why: "Investor and partner updates are drafted from your weekly log on Pro, so the numbers are yours and the ask is last.",
  },
};

/** The honest first line of Theo's reading, computed locally, shown to Free above the mine. */
export function readingPreview(latest: { revenue: number; customers: number; cash: number }, prev: { revenue: number; customers: number; cash: number } | undefined, currency: string): string {
  if (!prev) return "One week in the log. Next week there is something to read.";
  const sym = currency === "USD" ? "$" : currency === "GBP" ? "£" : "€";
  const d = latest.revenue - prev.revenue;
  const pct = prev.revenue ? Math.round((d / prev.revenue) * 100) : 0;
  if (d === 0) return `Revenue held at ${sym}${latest.revenue.toLocaleString()}. Customers ${latest.customers >= prev.customers ? "up" : "down"}, cash ${latest.cash >= prev.cash ? "up" : "down"}.`;
  return `Revenue ${sym}${prev.revenue.toLocaleString()} → ${sym}${latest.revenue.toLocaleString()}, ${d > 0 ? "+" : ""}${pct}%.`;
}

/** The trial's timeline, the way Blinkist tells it: what happens and when, before anyone taps. */
export function trialTimeline(days = TRIAL_DAYS, startedAt?: number): { day: number; label: string; when: string }[] {
  const at = (n: number) => (startedAt ? new Date(startedAt + n * 86_400_000).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) : `day ${n}`);
  return [
    { day: 0, label: "Today: the whole staff, every room, nothing to enter", when: startedAt ? "today" : "day 0" },
    { day: days - 2, label: "A reminder at the desk, two days before it ends", when: at(days - 2) },
    { day: days, label: "Back to Free unless you keep it. Nothing is charged by the trial itself", when: at(days) },
  ];
}

export const PLAN_COPY: Record<Plan, { name: string; line: string; buys: string[] }> = {
  free: { name: "Free", line: "The whole road, written by the building.", buys: ["Your stand, your plan and your notebook, forever", "All six rooms and every task page", "The weekly log and the week read back", "The Workshop draws your app and writes the brief", "The desk and the coaches answer from the building's own rules", "Everything you write stays yours, and copies out"] },
  pro: { name: "Pro", line: "The staff answer for real.", buys: ["The desk and all four coaches answer live, and we pay for the words", "They keep notes between visits", "Theo reads the log week against week", "Every draft in the drawer", "The update drafted from your own numbers", "The idea finder and second opinions, open"] },
  founder: { name: "Founder+", line: "Pro, with the careful model.", buys: ["Everything in Pro", "The careful model writes the brief and designs your app", "Pitch reviews by the careful model", "Verified revenue badge when Stripe is connected", "A better address on the floor when it opens", "Founding member price, kept"] },
};
