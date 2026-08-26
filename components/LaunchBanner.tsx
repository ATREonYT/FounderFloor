"use client";

/**
 * The grand-opening notice — pasted across the top of the printed
 * programme the way a venue slips a "TONIGHT" band over a poster.
 *
 * One event, one instant: the official launch, Sunday 23 August 2026,
 * 18:00 in Berlin (the same clock every event on the site keeps — see
 * lib/data/event-window.mjs for why the label says CET while August is
 * CEST). The banner has three lives and cleans up after itself:
 *
 *   before   the full band: date, the visitor's own local time, and a
 *            live countdown — the thing that makes a date feel near.
 *   during   it turns into the doors-are-open version and points at the
 *            lobby, because once it starts the only useful words are
 *            "come in".
 *   after    it renders nothing, forever. A launch banner still up on
 *            Tuesday is how a site tells every visitor nobody is home.
 *
 * Client component because it ticks; it renders nothing until mounted so
 * the server and the first client paint never disagree about how long is
 * left (the classic hydration mismatch for countdowns).
 */

import { useEffect, useState } from "react";
import Link from "next/link";

/** Sun 23 Aug 2026, 18:00 Europe/Berlin — CEST in August, so 16:00 UTC. */
const LAUNCH_AT = Date.UTC(2026, 7, 23, 16, 0, 0);
/** How long the "doors are open" version stays up: the Open Doors window. */
const LAUNCH_ENDS = LAUNCH_AT + 3 * 3_600_000;

/** "4d 21h", "21h 05m", "12m" — big units only, it is a poster not a clock. */
function untilWords(ms: number): string {
  const mins = Math.max(1, Math.floor(ms / 60_000));
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${String(mins % 60).padStart(2, "0")}m`;
  return `${mins}m`;
}

export default function LaunchBanner() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (now === null || now >= LAUNCH_ENDS) return null;
  const live = now >= LAUNCH_AT;

  // The visitor's own wall clock for the instant — the label "18:00 CET"
  // never travels without it, per the site's one rule about event times.
  const local = new Date(LAUNCH_AT).toLocaleString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (live) {
    return (
      <div className="border-b border-gold/40 bg-ink text-paper">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
            <span className="font-display text-xl sm:text-2xl">
              The doors are open. <span className="text-gold">Launch night, live now.</span>
            </span>
          </div>
          <Link
            href="/lobby"
            className="btn-press inline-flex min-h-[44px] items-center justify-center rounded-md bg-accent-strong px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-strong/90"
          >
            Walk in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gold/40 bg-ink text-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 sm:py-8">
        {/* the slip's own masthead: rule, label, rule */}
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="h-px flex-1 bg-gold/50" />
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            One night · Grand opening
          </span>
          <span aria-hidden="true" className="h-px flex-1 bg-gold/50" />
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div>
            <p className="font-display text-3xl leading-tight sm:text-4xl">
              The hall officially opens{" "}
              <span className="text-gold">Sunday 18:00 CET</span>
            </p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-paper/70">
              That&rsquo;s {local}, your time. The building is already
              walkable; Sunday is the night everyone shows up at once. Come
              claim a stand before the crowd does.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-paper/55">Doors in</p>
              <p
                className="font-display text-3xl text-gold sm:text-4xl"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {untilWords(LAUNCH_AT - now)}
              </p>
            </div>
            <Link
              href="/lobby"
              className="btn-press inline-flex min-h-[44px] items-center justify-center rounded-md bg-accent-strong px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-strong/90"
            >
              Have a look first →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
