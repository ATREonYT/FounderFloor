/**
 * Filing deadlines as DATA, each with the official source it came from.
 * A rule applies to an entity type, a residence, or both. Fixed rules
 * recur on a month/day; event rules count days from a date the founder
 * supplies. Nothing here is tax advice and every generated item says so —
 * the app shows the source link beside each date so the founder checks it.
 *
 * Verified against the sources on 5 Sep 2026. Rules change; when one does,
 * change the row and the date in `checked`, not the code.
 */
import type { EntityType, Residence } from "./types.ts";

export interface DeadlineRule {
  id: string;
  title: string;
  what: string;
  entity?: EntityType[];
  residence?: Residence[];
  /** Recurs every year on this month (1–12) and day. */
  fixed?: { month: number; day: number };
  /** Counts from an event date instead: `daysAfter` from `event`. */
  event?: { from: "formedOn" | "stockGrant" | "yearEnd"; daysAfter: number };
  source: string;
  checked: string;
  /** Something the founder must verify rather than a date to hit. */
  note?: string;
}

export const RULES: readonly DeadlineRule[] = [
  {
    id: "de-llc-franchise",
    title: "Delaware LLC annual tax",
    what: "$300 flat annual tax to the Delaware Division of Corporations. No annual report for LLCs.",
    entity: ["de-llc"],
    fixed: { month: 6, day: 1 },
    source: "https://corp.delaware.gov/paytaxes/",
    checked: "2026-09-05",
  },
  {
    id: "de-llc-5472",
    title: "Form 5472 with pro-forma 1120",
    what: "A foreign-owned single-member US LLC files Form 5472 attached to a pro-forma Form 1120 every year, even with no income. Penalty for missing it starts at $25,000.",
    entity: ["de-llc"],
    residence: ["CY", "GB", "EE", "DE", "other"],
    fixed: { month: 4, day: 15 },
    source: "https://www.irs.gov/forms-pubs/about-form-5472",
    checked: "2026-09-05",
    note: "Extension to 15 October by filing Form 7004 before 15 April.",
  },
  {
    id: "de-llc-ein",
    title: "EIN before any US filing",
    what: "The LLC needs an Employer Identification Number to file 5472; foreign owners apply by fax or phone with Form SS-4.",
    entity: ["de-llc", "de-ccorp"],
    event: { from: "formedOn", daysAfter: 30 },
    source: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online",
    checked: "2026-09-05",
  },
  {
    id: "us-boi",
    title: "FinCEN beneficial ownership report",
    what: "US-formed companies were exempted from BOI reporting by FinCEN's interim final rule of March 2025; only foreign companies registered to do business in the US still file. Confirm nothing has changed for your entity.",
    entity: ["de-llc", "de-ccorp"],
    event: { from: "formedOn", daysAfter: 30 },
    source: "https://www.fincen.gov/boi",
    checked: "2026-09-05",
    note: "Exempt as of the 2025 rule; verify, because the rule was litigated all year.",
  },
  {
    id: "de-ccorp-franchise",
    title: "Delaware corporation franchise tax and annual report",
    what: "Annual report plus franchise tax, minimum $400 with the assumed-par-value method for most startups.",
    entity: ["de-ccorp"],
    fixed: { month: 3, day: 1 },
    source: "https://corp.delaware.gov/frtax/",
    checked: "2026-09-05",
  },
  {
    id: "de-ccorp-1120",
    title: "Form 1120 corporate return",
    what: "Federal corporate income tax return for a calendar-year C corporation.",
    entity: ["de-ccorp"],
    fixed: { month: 4, day: 15 },
    source: "https://www.irs.gov/forms-pubs/about-form-1120",
    checked: "2026-09-05",
    note: "Six-month extension with Form 7004.",
  },
  {
    id: "us-83b",
    title: "83(b) election",
    what: "File within 30 days of receiving restricted stock subject to vesting. There is no extension and no fix afterwards.",
    entity: ["de-ccorp"],
    event: { from: "stockGrant", daysAfter: 30 },
    source: "https://www.irs.gov/forms-pubs/about-form-15620",
    checked: "2026-09-05",
  },
  {
    id: "cy-personal-return",
    title: "Cyprus personal income tax return (TD1)",
    what: "Individuals resident in Cyprus file the previous year's return on TaxisNet. The statutory date is 31 July; the Tax Department has extended it in recent years, so check the current notice.",
    residence: ["CY"],
    fixed: { month: 7, day: 31 },
    source: "https://www.mof.gov.cy/mof/tax/taxdep.nsf/index_en/index_en",
    checked: "2026-09-05",
    note: "Founders drawing salary from a foreign LLC declare it here; the LLC's US filing does not replace it.",
  },
  {
    id: "cy-provisional-1",
    title: "Cyprus provisional tax, first instalment",
    what: "Companies and self-employed estimate the year's taxable income and pay half by 31 July.",
    entity: ["cy-ltd"],
    fixed: { month: 7, day: 31 },
    source: "https://www.mof.gov.cy/mof/tax/taxdep.nsf/index_en/index_en",
    checked: "2026-09-05",
  },
  {
    id: "cy-provisional-2",
    title: "Cyprus provisional tax, second instalment",
    what: "Second half of the provisional tax; the estimate may be revised before paying.",
    entity: ["cy-ltd"],
    fixed: { month: 12, day: 31 },
    source: "https://www.mof.gov.cy/mof/tax/taxdep.nsf/index_en/index_en",
    checked: "2026-09-05",
  },
  {
    id: "cy-ltd-return",
    title: "Cyprus corporate tax return (TD4)",
    what: "Filed electronically by 31 March of the second year after the tax year, together with audited accounts.",
    entity: ["cy-ltd"],
    fixed: { month: 3, day: 31 },
    source: "https://www.mof.gov.cy/mof/tax/taxdep.nsf/index_en/index_en",
    checked: "2026-09-05",
  },
  {
    id: "cy-vat",
    title: "Cyprus VAT return",
    what: "Quarterly, due by the 10th of the second month after the quarter ends, once registered (threshold €15,600 of taxable supplies in twelve months).",
    entity: ["cy-ltd"],
    fixed: { month: 2, day: 10 },
    source: "https://www.mof.gov.cy/mof/tax/taxdep.nsf/index_en/index_en",
    checked: "2026-09-05",
    note: "Also 10 May, 10 August and 10 November. Only the next one is shown.",
  },
  {
    id: "cy-he32",
    title: "Cyprus annual return (HE32)",
    what: "Filed with the Registrar of Companies within 28 days of the annual return date, with the financial statements.",
    entity: ["cy-ltd"],
    event: { from: "yearEnd", daysAfter: 28 },
    source: "https://www.companies.gov.cy/en/",
    checked: "2026-09-05",
  },
  {
    id: "uk-confirmation",
    title: "UK confirmation statement",
    what: "Confirm the company's details with Companies House at least once a year, within 14 days of the review period ending.",
    entity: ["uk-ltd"],
    event: { from: "formedOn", daysAfter: 365 + 14 },
    source: "https://www.gov.uk/guidance/confirmation-statement-guidance",
    checked: "2026-09-05",
  },
  {
    id: "uk-accounts",
    title: "UK annual accounts",
    what: "File accounts with Companies House nine months after the accounting reference date (21 months after incorporation for the first set).",
    entity: ["uk-ltd"],
    event: { from: "yearEnd", daysAfter: 274 },
    source: "https://www.gov.uk/prepare-file-annual-accounts-for-limited-company",
    checked: "2026-09-05",
  },
  {
    id: "uk-ct",
    title: "UK corporation tax payment",
    what: "Pay corporation tax nine months and one day after the end of the accounting period; the CT600 return is due three months later.",
    entity: ["uk-ltd"],
    event: { from: "yearEnd", daysAfter: 275 },
    source: "https://www.gov.uk/corporation-tax",
    checked: "2026-09-05",
  },
  {
    id: "ee-annual-report",
    title: "Estonian annual report",
    what: "File the annual report with the Business Register within six months of the financial year end.",
    entity: ["ee-ou"],
    fixed: { month: 6, day: 30 },
    source: "https://www.rik.ee/en/e-business-register",
    checked: "2026-09-05",
  },
];

export interface Deadline {
  ruleId: string;
  title: string;
  what: string;
  due: string; // ISO date
  daysLeft: number;
  source: string;
  note?: string;
  disclaimer: string;
}

export const DISCLAIMER = "Check the official source. This is a calendar, not tax advice.";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
function nextFixed(month: number, day: number, from: Date): Date {
  const y = from.getUTCFullYear();
  let d = new Date(Date.UTC(y, month - 1, day));
  if (d < from) d = new Date(Date.UTC(y + 1, month - 1, day));
  return d;
}
/** Next occurrence of a quarterly-style rule given its listed month/day and 3-month spacing. */
function nextQuarterly(month: number, day: number, from: Date): Date {
  let best: Date | null = null;
  for (let k = 0; k < 4; k++) {
    const m = ((month - 1 + 3 * k) % 12) + 1;
    const d = nextFixed(m, day, from);
    if (!best || d < best) best = d;
  }
  return best!;
}

export interface DeadlineInput {
  entity: EntityType;
  residence: Residence;
  formedOn?: string;
  stockGrant?: string;
  /** Financial year end, ISO date of the most recent one. */
  yearEnd?: string;
}

export function generateDeadlines(input: DeadlineInput, now = new Date()): Deadline[] {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const out: Deadline[] = [];
  for (const r of RULES) {
    const entityOk = !r.entity || r.entity.includes(input.entity);
    const resOk = !r.residence || r.residence.includes(input.residence);
    // a rule with both lists needs both; a rule with one list needs that one
    if (!(entityOk && resOk)) continue;
    let due: Date | null = null;
    if (r.fixed) due = r.id === "cy-vat" ? nextQuarterly(r.fixed.month, r.fixed.day, today) : nextFixed(r.fixed.month, r.fixed.day, today);
    else if (r.event) {
      const base = input[r.event.from];
      if (!base) continue;
      const b = new Date(base);
      if (Number.isNaN(b.getTime())) continue;
      due = new Date(b.getTime() + r.event.daysAfter * 86_400_000);
      if (due < today && r.event.from === "yearEnd") {
        // roll to next year's equivalent
        due = new Date(Date.UTC(due.getUTCFullYear() + 1, due.getUTCMonth(), due.getUTCDate()));
      }
      if (due < today) continue; // a one-off already passed
    }
    if (!due) continue;
    out.push({ ruleId: r.id, title: r.title, what: r.what, due: iso(due), daysLeft: daysBetween(today, due), source: r.source, note: r.note, disclaimer: DISCLAIMER });
  }
  return out.sort((a, b) => a.daysLeft - b.daysLeft);
}

/** The reminder offsets the Inbox uses, in days before the date. */
export const REMIND_AT_DAYS = [21, 3] as const;
