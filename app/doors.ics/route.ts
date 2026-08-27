/**
 * The Open Doors calendar file — the reminder that survives people
 * ignoring email.
 *
 * Everything time-shaped is DERIVED from lib/data/event-window.mjs rather
 * than typed here: DTSTART is the next window's Berlin wall clock, the
 * duration is endMs - startMs, and BYDAY is the Berlin weekday of that
 * start. The event is written as local time WITH a TZID plus a weekly
 * RRULE, which is the iCalendar way of saying "Sunday at six, Berlin
 * time, whatever the clocks do" — the same DST decision event-window.mjs
 * documents, inherited rather than re-solved. The VTIMEZONE block below
 * is the standard EU definition a strict client needs to interpret that
 * TZID; it describes the timezone, not the event.
 */

import { EVENT_TZ, nextWindow } from "@/lib/data/event-window.mjs";
import { siteOrigin } from "@/lib/serverFloor";

export const dynamic = "force-dynamic";

/** The Berlin wall-clock of an instant as YYYYMMDDTHHMMSS, plus weekday. */
function wallClock(utcMs: number): { stamp: string; byday: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TZ,
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(new Date(utcMs))
    .filter((p) => p.type !== "literal");
  const f: Record<string, string> = {};
  for (const p of parts) f[p.type] = p.value;
  const BYDAY: Record<string, string> = {
    Sun: "SU", Mon: "MO", Tue: "TU", Wed: "WE", Thu: "TH", Fri: "FR", Sat: "SA",
  };
  return {
    stamp: `${f.year}${f.month}${f.day}T${(Number(f.hour) % 24)
      .toString()
      .padStart(2, "0")}${f.minute}${f.second}`,
    byday: BYDAY[f.weekday] ?? "SU",
  };
}

export function GET(): Response {
  const now = Date.now();
  const win = nextWindow(now);
  const start = wallClock(win.startMs);
  const end = wallClock(win.endMs);
  const hours = Math.round((win.endMs - win.startMs) / 3_600_000);
  const lobby = `${siteOrigin()}/lobby`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FounderFloor//Open Doors//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    // Standard EU rules for the TZID — CET in winter, CEST from the last
    // Sunday of March to the last Sunday of October.
    "BEGIN:VTIMEZONE",
    `TZID:${EVENT_TZ}`,
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    // Stable UID: calendar apps key the series on it, so re-downloading
    // the file updates the one event instead of stacking duplicates.
    "UID:open-doors@founderfloor.net",
    `DTSTAMP:${new Date(now).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART;TZID=${EVENT_TZ}:${start.stamp}`,
    `DTEND;TZID=${EVENT_TZ}:${end.stamp}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${start.byday}`,
    "SUMMARY:Open Doors — FounderFloor",
    `DESCRIPTION:The ${hours} hours a week the floors are busy on purpose. ` +
      `Walk in: ${lobby}`,
    `URL:${lobby}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Open Doors starts in 30 minutes",
    "TRIGGER:-PT30M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="open-doors.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
