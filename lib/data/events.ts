/**
 * FounderFloor — scheduled floor events.
 *
 * There is deliberately ONE recurring event: Open Doors, every Saturday
 * 15:00-18:00 UTC on the main hall. A single well-known weekly moment gives
 * quiet floors a reason to fill up at the same time; a calendar of many
 * events would spread the same visitors thin.
 *
 * Saturday afternoon, three hours, because an open-doors day that lasts an
 * hour is not an open-doors day. The window is chosen to be the least
 * unreasonable one on both sides of the Atlantic: 17:00-20:00 in Germany,
 * 11:00-14:00 US Eastern, 08:00-11:00 US Pacific.
 *
 * To add more events later: give each one its own anchor offset + period +
 * duration (the same shape as the constants below), compute the
 * current-or-next window for each with the same modulo arithmetic, and have
 * nextEvent() return whichever window starts (or is live) first.
 *
 * Everything here is pure: callers pass nowMs (e.g. Date.now()) so the HUD
 * can re-render a countdown on its own clock and tests can pin time. All
 * math is UTC; the UI renders every time in the visitor's own zone, because
 * a UTC time in a reminder is a time half of them will get wrong.
 *
 * KEEP IN SYNC: server/index.mjs has its own copy of FIRST_START and
 * DURATION for the RSVP confirmation email. Change one, change both.
 */

export interface EventInfo {
  name: string;
  blurb: string;
  floorId: string;
  startMs: number;
  endMs: number;
  live: boolean;
}

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
const WEEK = 7 * DAY;

/**
 * First window start: Saturday 1970-01-03 15:00:00 UTC. 1970-01-01 was a
 * Thursday, so Saturday is two days into the epoch week and every start is
 * FIRST_START + k * WEEK for integer k.
 */
const FIRST_START = 2 * DAY + 15 * HOUR;
const DURATION = 3 * HOUR;

/**
 * The current-or-next Open Doors window relative to nowMs.
 * If nowMs falls inside a window ([start, end)), that window returns with
 * live=true; otherwise the next upcoming window returns with live=false.
 */
export function nextEvent(nowMs: number): EventInfo {
  // ms elapsed since the most recent window start (double-mod handles
  // pre-epoch nowMs, where % in JS is negative).
  const sinceStart = (((nowMs - FIRST_START) % WEEK) + WEEK) % WEEK;
  const lastStart = nowMs - sinceStart;
  const live = sinceStart < DURATION;
  const startMs = live ? lastStart : lastStart + WEEK;
  return {
    name: "Open Doors",
    blurb:
      "Saturday afternoon, three hours, everyone on the Main Hall at once. Walk in, look around, talk to whoever is at a stand. Be in the room and there's a badge in it for you.",
    floorId: "main-hall",
    startMs,
    endMs: startMs + DURATION,
    live,
  };
}

/**
 * Compact countdown for the HUD: "2d 4h" at a day or more, "3h 12m" at an
 * hour or more, "14m" at a minute or more, "now" under a minute (or for
 * anything non-positive / non-finite).
 */
export function fmtCountdown(msLeft: number): string {
  if (!Number.isFinite(msLeft) || msLeft < MINUTE) return "now";
  if (msLeft >= DAY) {
    const d = Math.floor(msLeft / DAY);
    const h = Math.floor((msLeft % DAY) / HOUR);
    return `${d}d ${h}h`;
  }
  if (msLeft >= HOUR) {
    const h = Math.floor(msLeft / HOUR);
    const m = Math.floor((msLeft % HOUR) / MINUTE);
    return `${h}h ${m}m`;
  }
  return `${Math.floor(msLeft / MINUTE)}m`;
}
