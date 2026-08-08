"use client";

/**
 * Time until the doors open, for the launch gate.
 *
 * Counts to the same window everything else uses (lib/data/event-window.mjs),
 * so it cannot disagree with the label printed next to it.
 *
 * Rendered client-side only: the server and the visitor's browser are in
 * different places at different moments, and a countdown baked into the HTML
 * is wrong the instant it is cached. Showing nothing for one frame is better
 * than showing a stale number.
 */

import { useEffect, useState } from "react";
import { nextEvent } from "@/lib/data/events";
import { EVENT_TZ } from "@/lib/data/event-window.mjs";

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  live: boolean;
  local: string;
}

export default function LaunchCountdown({ className = "" }: { className?: string }) {
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const ev = nextEvent(now);
      const left = Math.max(0, ev.startMs - now);
      const here = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setParts({
        days: Math.floor(left / 86_400_000),
        hours: Math.floor((left % 86_400_000) / 3_600_000),
        minutes: Math.floor((left % 3_600_000) / 60_000),
        live: ev.live,
        // the same instant where the visitor actually is, so nobody has to
        // work out what CET means for them
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

  if (!parts) return <div className={className} aria-hidden="true" style={{ minHeight: 58 }} />;

  if (parts.live) {
    return (
      <p className={`font-display text-3xl text-accent ${className}`}>
        The doors are open right now.
      </p>
    );
  }

  const cell = (n: number, label: string) => (
    <span className="flex flex-col items-start">
      <span className="font-display text-3xl leading-none tabular-nums">{n}</span>
      <span className="micro mt-1 text-muted">{label}</span>
    </span>
  );

  return (
    <div className={className}>
      <div className="flex items-start gap-6">
        {cell(parts.days, parts.days === 1 ? "day" : "days")}
        {cell(parts.hours, parts.hours === 1 ? "hour" : "hours")}
        {cell(parts.minutes, parts.minutes === 1 ? "min" : "mins")}
      </div>
      {parts.local && (
        <p className="mt-3 text-sm text-muted">That&rsquo;s {parts.local} where you are.</p>
      )}
    </div>
  );
}
