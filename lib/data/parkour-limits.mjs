/**
 * What a parkour result is allowed to be.
 *
 * The leaderboard is fed by clients reporting their own times, and a client
 * is a thing anybody can edit. This module is the floor server's answer to
 * "0.01s on every map": a time under MIN_TIME is not a good run, it is a
 * lie, because the map is physically longer than that at full running
 * speed. Both the server and the web app import it, so there is one table
 * rather than two that drift.
 *
 * MIN_TIME is the straight-line time across each map — start flag to exit,
 * at RUN (138px/s over 16px tiles), ignoring every jump and hazard, minus a
 * little slack. Nobody can beat it, so anything under it is rejected
 * outright rather than quietly clamped: a clamped cheat still lands top of
 * the board. scripts/parkour-check.mjs asserts these stay below what the
 * shipped maps actually allow.
 *
 * This is not real anti-cheat and does not pretend to be. It stops the
 * casual "edit the number in localStorage" case; a determined person can
 * still post a plausible time. The honest fix is running the simulation
 * server-side, which is a much bigger job than a hall this size needs.
 */

/** Seconds on the clock per level. Also the ceiling on any reported time. */
export const TIME_LIMIT = 25;

/** Fastest possible run per map id, in seconds. Below this is fabricated. */
export const MIN_TIME = {
  "load-in": 3.6,
  "the-scaffold": 2.7,
  "cable-run": 3.5,
  "after-hours": 3.6,
};

/** Three arcade games at 100 apiece. */
export const MAX_ARCADE = 300;

/** Nobody has been in the building for more hours than there are in a week. */
export const MAX_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The ISO-ish week a moment belongs to, as "2026-W33".
 *
 * Weeks start Monday 00:00 UTC. Not Berlin, unlike Open Doors: this is a
 * bookkeeping boundary nobody attends, and a fixed UTC edge means the
 * rollover cannot land twice or never during a DST shift.
 */
export function weekKey(ms) {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  // Thursday of this week decides the year, the usual ISO trick
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const fDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fDay + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** When the week containing `ms` ends (Monday 00:00 UTC), in ms. */
export function weekEndsAt(ms) {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day + 7);
  return d.getTime();
}
