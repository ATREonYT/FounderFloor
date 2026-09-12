/**
 * THE WEEK WAITS FOR THE FOUNDER.
 *
 * A plan week is not a calendar week. If the founder is away for a
 * fortnight, the plan does not run on without them: they come back to the
 * week they left, with the same three tasks. Weeks advance by weeks
 * WORKED, counted as the distinct calendar weeks the founder was in the
 * building, minus any they said "life happened" in.
 *
 * Research (docs/research/what-people-want.md, the firmest evidence in
 * the set): the thing people name when they delete a habit app is being
 * punished for an absence. "The habits reset from the beginning if you
 * just miss one day, there's no opportunity to freeze or pause your
 * progress" (Fabulous). "If I start a lesson at 11:56 and end 12:01 it
 * uses a streak freeze... Hence why I don't use the app anymore"
 * (Duolingo). The founder this app is for works evenings beside a job and
 * will miss whole weeks; nothing here may cost them anything for it.
 *
 * Everything in this file is pure and tested in test/weeks.test.mjs.
 */

/**
 * The ISO week a date falls in, as a sortable key: "2026-W37". ISO weeks
 * start on Monday and week 1 is the one holding the first Thursday, which
 * is what most of the world's calendars show.
 */
export function isoWeekKey(date: string | number | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  // to the Thursday of this week, in UTC, so the year is the ISO year
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (t.getUTCDay() + 6) % 7; // Monday = 0
  t.setUTCDate(t.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const fday = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fday + 3);
  const week = 1 + Math.round((t.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** The distinct calendar weeks a founder showed up in, newest last. */
export function weeksVisited(visits: string[]): string[] {
  const out: string[] = [];
  for (const v of visits) {
    const k = isoWeekKey(v);
    if (k && !out.includes(k)) out.push(k);
  }
  return out.sort();
}

/**
 * Weeks worked: every week the founder was here, less the ones they
 * paused. Never falls: pausing a week stops it counting forward, it does
 * not take a week away.
 */
export function weeksWorked(visits: string[], paused: string[] = []): number {
  const p = new Set(paused);
  return weeksVisited(visits).filter((k) => !p.has(k)).length;
}

/**
 * Which week of the plan the founder is on. One-based, never past the
 * end of the plan, never before the start. With no record of visits (an
 * install from before this was kept) it is week one, which is forgiving
 * rather than punishing.
 */
export function planWeekNow(visits: string[], paused: string[], planWeeks: number): number {
  const worked = weeksWorked(visits, paused);
  return Math.min(Math.max(1, planWeeks || 1), Math.max(1, worked));
}

/** Is this calendar week one the founder paused? */
export function isPaused(paused: string[], when: string | number | Date = Date.now()): boolean {
  return paused.includes(isoWeekKey(when));
}

/**
 * Whole days between the founder's last visit and now. Used once, at the
 * moment they come back, to decide whether the desk says anything. It is
 * never shown as a count: the card says "you were away", not "you missed
 * eleven days".
 */
export function daysAway(visits: string[], now: string | number | Date = Date.now()): number {
  const today = new Date(now).toISOString().slice(0, 10);
  const past = visits.filter((v) => v && v < today).sort();
  const last = past[past.length - 1];
  if (!last) return 0;
  const ms = new Date(`${today}T00:00:00Z`).getTime() - new Date(`${last}T00:00:00Z`).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** A gap of this many days or more, and the desk says welcome back. A week. */
export const AWAY_DAYS = 7;
