/**
 * FounderFloor — scheduled floor events.
 *
 * There is deliberately ONE recurring event: Open Doors, every Sunday
 * 18:00-21:00 Berlin time, on the main hall. A single well-known weekly
 * moment gives quiet floors a reason to fill up at the same time; a calendar
 * of many events would spread the same visitors thin.
 *
 * The window itself lives in ./event-window.mjs, which the floor server
 * imports too, so there is exactly one definition of when the doors open.
 * That file also explains why the anchor is Berlin rather than UTC, and why
 * this particular three hours.
 *
 * Everything here is pure: callers pass nowMs (e.g. Date.now()) so the HUD
 * can re-render a countdown on its own clock and tests can pin time. Times
 * are rendered in each visitor's own zone by the components, because a
 * foreign time in a reminder is a time half of them will get wrong.
 */

import { EVENT_LABEL, nextWindow } from "./event-window.mjs";

export interface EventInfo {
  name: string;
  blurb: string;
  floorId: string;
  startMs: number;
  endMs: number;
  live: boolean;
  /** True when this is a dated SPECIAL_WINDOWS entry (its label is the
   * name) rather than the ordinary weekly Sunday window. */
  special?: boolean;
}

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/**
 * The current-or-next Open Doors window relative to nowMs. If nowMs falls
 * inside a window it returns with live=true; otherwise the next one.
 */
export function nextEvent(nowMs: number): EventInfo {
  const { startMs, endMs, live, label } = nextWindow(nowMs);
  // A special window (a dated SPECIAL_WINDOWS entry — launch day, say)
  // announces itself by its own label everywhere the event is named.
  return {
    name: label ?? "Open Doors",
    special: Boolean(label),
    blurb: label
      ? `${label}. Everyone is on the Main Hall — walk in, look around, ` +
        "talk to whoever is at a stand. Be in the room and there's a badge in it for you."
      : `${EVENT_LABEL}: three hours where everyone is on the Main Hall at once. ` +
        "Sunday evening in Europe, Sunday midday in the Americas. Walk in, look around, " +
        "talk to whoever is at a stand. Be in the room and there's a badge in it for you.",
    floorId: "main-hall",
    startMs,
    endMs,
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
