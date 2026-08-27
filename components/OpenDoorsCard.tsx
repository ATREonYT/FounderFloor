"use client";

/**
 * The lobby's answer to an empty building.
 *
 * A floor that is quiet most of the week only fills up if everybody agrees
 * on WHEN — so Open Doors is given real estate, not just a countdown pill.
 * While it's live the card is a door. While it isn't, it collects an email
 * so the visitor can be pulled back for the hours that will be busy.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { nextEvent, fmtCountdown, type EventInfo } from "@/lib/data/events";
import { EVENT_LABEL, EVENT_TZ } from "@/lib/data/event-window.mjs";
import { floorById } from "@/lib/data/floors";
import EmailCapture from "@/components/EmailCapture";

export default function OpenDoorsCard() {
  const [view, setView] = useState<{
    ev: EventInfo;
    label: string;
    /** The visitor's own local time. Empty if they are already on Berlin time. */
    local: string;
  } | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const ev = nextEvent(now);
      // Someone already on Berlin time would read "18:00 CET, which is
      // 18:00 CEST where you are", and that looks like a bug. Drop the echo.
      const here = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setView({
        ev,
        label: ev.live ? "live now" : fmtCountdown(ev.startMs - now),
        // The advertised label is fixed so the event can be quoted; this is
        // the same instant in the visitor's own zone, with the zone named,
        // so nobody has to work out an offset and nobody is shown a time
        // that is not theirs.
        local:
          here === EVENT_TZ
            ? ""
            : new Date(ev.startMs).toLocaleString(undefined, {
                weekday: "long",
                hour: "numeric",
                minute: "2-digit",
                timeZoneName: "short",
              }),
      });
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  if (!view) return null;
  const floorName = floorById(view.ev.floorId)?.name ?? "the Main Hall";

  if (view.ev.live) {
    return (
      <section
        aria-label="Open Doors is live"
        className="panel mt-6 flex flex-wrap items-center justify-between gap-4 border-accent bg-accent-soft/40 p-5"
      >
        <div>
          <p className="micro flex items-center gap-2 text-accent">
            <span aria-hidden="true" className="pulse-dot inline-block h-2 w-2 rounded-full bg-accent" />
            {(view.ev.special ? view.ev.name : "Open Doors").toUpperCase()} · LIVE NOW
          </p>
          <h2 className="mt-1 font-display text-lg">
            Everyone&rsquo;s at {floorName} right now.
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            These are the hours the floor is busy on purpose. Walk in, and
            being in the room earns you a badge.
          </p>
        </div>
        <Link
          href={`/floor/${view.ev.floorId}`}
          className="btn-press inline-flex min-h-[44px] items-center justify-center rounded-md bg-accent-strong px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-accent-strong/90"
        >
          Go to {floorName} →
        </Link>
      </section>
    );
  }

  return (
    <section
      aria-label="Open Doors"
      className="panel mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="sm:max-w-sm">
        <p className="micro text-muted">NEXT OPEN DOORS · {view.label}</p>
        <h2 className="mt-1 font-display text-lg">
          Next: {view.ev.special ? view.ev.name : EVENT_LABEL}.
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Three hours a week, everyone shows up at {floorName} at the same
          time. It&rsquo;s the difference between a quiet hall and a room full
          of founders.
          {view.local ? <> That&rsquo;s {view.local} where you are.</> : null}
        </p>
      </div>
      <div className="sm:w-[19rem] sm:shrink-0">
        {/* "demo-night" is the stored analytics source for this box.
            Kept through the rename so the subscriber stats stay one series. */}
        <EmailCapture variant="rsvp" source="demo-night" />
        {/* The reminder that survives people ignoring email: a weekly
            repeating event, DST handled by the calendar itself. */}
        <p className="mt-2 text-xs text-muted">
          No email needed:{" "}
          <a href="/doors.ics" className="underline underline-offset-2 hover:text-ink">
            add Open Doors to your calendar
          </a>
          .
        </p>
      </div>
    </section>
  );
}
