/**
 * When Open Doors is, computed once, for everybody.
 *
 * The single source of truth for the weekly window. Both the web app
 * (lib/data/events.ts) and the floor server (server/index.mjs) import this,
 * because they used to carry separate copies of the arithmetic with a
 * "KEEP IN SYNC" comment between them, and that is a promise nobody keeps.
 *
 * ANCHORED TO BERLIN, NOT UTC. The obvious implementation is a fixed offset
 * into the epoch week, and it is wrong for a recurring human event: a window
 * pinned to 16:00 UTC is 18:00 in Berlin in summer and 17:00 in winter, so
 * it silently moves an hour every October. People do not think that way. An
 * event is "Sunday at six" all year, and the UTC instant is what moves.
 *
 * So the window is Sunday 18:00-21:00 Europe/Berlin, and the DST shift is
 * absorbed here. Visitors elsewhere still see their own local time: every
 * caller renders these instants with toLocaleString, so nobody is asked to
 * do arithmetic about Berlin.
 *
 * WHY THIS SLOT. It is the best three hours the Atlantic allows. Sunday
 * evening in Europe, Sunday midday in the Americas:
 *
 *   Berlin 18:00-21:00   London 17:00-20:00   New York 12:00-15:00
 *   Chicago 11:00-14:00  Denver 10:00-13:00   Los Angeles 09:00-12:00
 *   Sao Paulo 14:00-17:00
 *
 * Anchoring to Berlin also keeps the US times steady, because Europe and
 * North America shift their clocks within a fortnight of each other; a
 * UTC-anchored window would have swung an hour for both.
 */

/** IANA zone the event is anchored to. */
export const EVENT_TZ = "Europe/Berlin";

/**
 * How the event is ADVERTISED, in one fixed string, used everywhere.
 *
 * The site used to show each visitor only their own local time. That is
 * correct, and useless for telling anyone about it: two people comparing
 * notes saw two different times and neither could quote the event. A
 * poster, a Reddit comment and a DM all need one phrase, and this is it.
 *
 * On "CET". Berlin is CET (UTC+1) in winter and CEST (UTC+2) from late
 * March to late October, so for half the year this label is an hour off if
 * you convert it literally. It says CET anyway, because that is what people
 * write and search for, and because the label never travels alone: every
 * surface that shows it also shows the visitor's own local time, computed
 * from the real instant. Nobody reading the site can end up at the wrong
 * hour. Somebody converting the bare string in their head in July could, so
 * if that ever matters more than the familiarity, this is the line to change.
 */
export const EVENT_LABEL = "Sunday 18:00 CET";
/** The same, without the day, for sentences that already say Sunday. */
export const EVENT_TIME_LABEL = "18:00 CET";

/** 0=Sunday … 6=Saturday, matching Date.getUTCDay(). */
const EVENT_DAY = 0;
const START_HOUR = 18;
const DURATION_MS = 3 * 3_600_000;
const DAY_MS = 86_400_000;

/**
 * Offset of EVENT_TZ from UTC at a given instant, in ms (positive east).
 * Derived by formatting the instant in that zone and reading the wall clock
 * back, which is the only way to get this right without a tz database.
 */
function zoneOffsetMs(utcMs) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(new Date(utcMs))
    .filter((p) => p.type !== "literal");

  const f = {};
  for (const p of parts) f[p.type] = Number(p.value);
  // hour can format as 24 at midnight in some engines
  const asIfUtc = Date.UTC(f.year, f.month - 1, f.day, f.hour % 24, f.minute, f.second);
  return asIfUtc - utcMs;
}

/** The UTC instant at which the Berlin wall clock reads y-m-d hh:00. */
function wallToUtc(y, m, d, hour) {
  const naive = Date.UTC(y, m - 1, d, hour);
  // Two passes converge: the first uses the offset at roughly the right
  // instant, the second corrects for a DST edge landing between them.
  let utc = naive - zoneOffsetMs(naive);
  utc = naive - zoneOffsetMs(utc);
  return utc;
}

/** The Berlin calendar date and weekday for an instant. */
function zoneDate(utcMs) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TZ,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date(utcMs))
    .filter((p) => p.type !== "literal");
  const f = {};
  for (const p of parts) f[p.type] = p.value;
  const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: Number(f.year),
    month: Number(f.month),
    day: Number(f.day),
    weekday: days[f.weekday],
  };
}

/**
 * The current-or-next window relative to nowMs.
 *
 * Walks Berlin calendar days from yesterday forward and returns the first
 * window that has not finished. Yesterday is included because a window that
 * started before midnight UTC can still be running.
 *
 * @param {number} nowMs
 * @returns {{startMs: number, endMs: number, live: boolean}}
 */
export function nextWindow(nowMs) {
  for (let delta = -1; delta <= 8; delta++) {
    const probe = nowMs + delta * DAY_MS;
    const { year, month, day, weekday } = zoneDate(probe);
    if (weekday !== EVENT_DAY) continue;
    const startMs = wallToUtc(year, month, day, START_HOUR);
    const endMs = startMs + DURATION_MS;
    if (endMs > nowMs) return { startMs, endMs, live: nowMs >= startMs };
  }
  // Unreachable: any 10-day span contains a Sunday. Kept so the function
  // is total rather than returning undefined if that ever stops being true.
  const startMs = nowMs + 7 * DAY_MS;
  return { startMs, endMs: startMs + DURATION_MS, live: false };
}

/** "Sun, 09 Aug 2026 18:00 CEST" — for emails, which have no local clock. */
export function windowInWords(nowMs = Date.now()) {
  const { startMs } = nextWindow(nowMs);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: EVENT_TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).format(new Date(startMs));
}
