/**
 * The weekly log — five numbers the founder types in, and what the app
 * does with them. Research: metrics dashboards for Stripe are free below
 * $10k MRR, so this is not analytics. It is the discipline: one entry a
 * week, the deltas, and an update drafted from them that a founder would
 * otherwise never write. Works for a bakery as well as a SaaS.
 */
import { fmtMoney, runwayLine, runwayMonths, fmtMonths } from "./runway.ts";
import { rankFor, toNextRank, nextRank } from "./ranks.ts";
import type { StandRecord } from "./types.ts";

export interface KpiEntry {
  week: string; // ISO week 2026-W36
  revenue: number; // this month's MRR or the week's revenue, founder's choice, kept consistent
  customers: number;
  cash: number;
  hoursOnCustomers: number; // hours spent talking to or selling to customers
  shipped?: string;
  note?: string;
}

export function pct(a: number, b: number): string {
  if (!b) return a ? "new" : "—";
  const p = Math.round(((a - b) / b) * 100);
  return `${p > 0 ? "+" : ""}${p}%`;
}

export function deltas(entries: KpiEntry[]): { latest: KpiEntry; prev?: KpiEntry; revenue: string; customers: string; cash: string } | null {
  if (!entries.length) return null;
  const sorted = [...entries].sort((a, b) => (a.week < b.week ? -1 : 1));
  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  return {
    latest,
    prev,
    revenue: prev ? pct(latest.revenue, prev.revenue) : "first entry",
    customers: prev ? `${latest.customers - prev.customers >= 0 ? "+" : ""}${latest.customers - prev.customers}` : "first entry",
    cash: prev ? pct(latest.cash, prev.cash) : "first entry",
  };
}

/**
 * An update a founder can send to investors, a partner, or themselves.
 * Plain text, numbers first, the ask last. Never invents: every figure is
 * from the log or the record, and a missing one is named as missing.
 */
export function draftUpdate(entries: KpiEntry[], record: StandRecord, audience: "investors" | "myself" | "partner" = "investors"): string {
  const d = deltas(entries);
  const cur = record.currency;
  if (!d) return "No weekly entries yet. Log one week — revenue, customers, cash, hours with customers — and the update writes itself from there.";
  const l = d.latest;
  const rw = { cash: l.cash || record.cash, burn: record.burn, mrr: l.revenue || record.mrr };
  const months = runwayMonths(rw);
  const rank = rankFor(l.revenue);
  const nxt = nextRank(l.revenue);
  const opener = audience === "investors" ? `${record.name || "The company"} — update for ${l.week}.` : audience === "partner" ? `${l.week}, where we are.` : `${l.week}. Written for me.`;
  const lines = [
    opener,
    "",
    `Revenue: ${fmtMoney(l.revenue, cur)} (${d.revenue}${d.prev ? ` on ${d.prev.week}` : ""}). Rank ${rank.name}${nxt ? `, ${fmtMoney(toNextRank(l.revenue), cur)} to ${nxt.name}` : ""}.`,
    `Customers: ${l.customers} (${d.customers}).`,
    `Cash: ${fmtMoney(l.cash, cur)} (${d.cash}). ${record.burn ? runwayLine(rw, cur) + "." : "Burn is not on the stand, so runway is not computed."}`,
    `Time with customers: ${l.hoursOnCustomers} h this week.`,
    "",
    `Shipped: ${l.shipped?.trim() || "(nothing written down this week — say so, it is honest)"}.`,
    l.note?.trim() ? `Notes: ${l.note.trim()}` : null,
    "",
    audience === "investors"
      ? `Ask: ${record.target90 ? `we are aiming at "${record.target90}"; introductions to people who have done that stage in ${record.residence === "other" ? "our market" : record.residence} help most.` : "one introduction to a customer of the type above."}`
      : `Next week: ${record.weeklyGoal ? record.weeklyGoal : "write the goal, with a number in it."}`,
    Number.isFinite(months) && months < 6 ? `\nRunway is ${fmtMonths(months)}. That is the headline, whatever else is in here.` : null,
  ];
  return lines.filter((x) => x !== null).join("\n");
}
