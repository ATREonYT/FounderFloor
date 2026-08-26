"use client";

/**
 * The landing page's live stat band: real numbers from the floor server
 * (founders online now, stands up, floors open, badges earnable), each
 * counting up from zero when scrolled into view — tabular figures on an
 * eased rAF ramp, so the paper-and-ink look gets a distinctly current pulse.
 * Degrades quietly: without the server the live tiles show "—" and the
 * static ones still animate. Reduced-motion users get final values instantly.
 */

import { useEffect, useState } from "react";
import CountUp from "@/components/CountUp";
import { FLOORS } from "@/lib/data/floors";
import { httpBase } from "@/lib/net";

const PUBLIC_FLOORS = FLOORS.filter((f) => !f.hidden);
const FLOORS_OPEN = PUBLIC_FLOORS.length;
const TOTAL_SPOTS = PUBLIC_FLOORS.reduce((a, f) => a + f.boothSpots.length, 0);
const BADGES_EARNABLE = 11;
const REACTIONS = 8;

export default function LiveStats({
  variant = "cards",
}: {
  /** "rail" = hairline scoreboard (current landing); "cards" = the original. */
  variant?: "cards" | "rail";
}) {
  const [online, setOnline] = useState<number | null>(null);
  const [stands, setStands] = useState<number | null>(null);

  useEffect(() => {
    const base = httpBase();
    if (!base) return;
    let dead = false;
    const load = async () => {
      try {
        const [p, s] = await Promise.all([
          fetch(`${base}/presence`).then((r) => r.json()),
          fetch(`${base}/startups`).then((r) => r.json()),
        ]);
        if (dead) return;
        const total = Object.values((p?.floors ?? {}) as Record<string, number>).reduce(
          (a, b) => a + b,
          0,
        );
        setOnline(total);
        setStands(Array.isArray(s?.startups) ? s.startups.length : 0);
      } catch {
        /* server offline — tiles keep their em-dash */
      }
    };
    void load();
    const timer = setInterval(load, 20_000);
    return () => {
      dead = true;
      clearInterval(timer);
    };
  }, []);

  // A young floor advertises its open spots, not its zeros: quiet moments
  // swap the live tiles for equally true numbers that invite instead.
  const tiles: { label: string; value: number | null; live?: boolean }[] = [
    online !== null && online > 0
      ? { label: online === 1 ? "founder here right now" : "founders here right now", value: online, live: true }
      : { label: "open spots waiting", value: stands === null ? TOTAL_SPOTS : Math.max(0, TOTAL_SPOTS - stands) },
    stands !== null && stands > 0
      ? { label: "stands set up", value: stands }
      : { label: "reactions to unlock", value: REACTIONS },
    { label: "floors open", value: FLOORS_OPEN },
    { label: "badges to earn", value: BADGES_EARNABLE },
  ];

  // "rail" is the landing page's hairline scoreboard — no boxes, just
  // figures divided by rules, the way a hall posts its numbers. "cards" is
  // the original four-panel treatment, kept for the archived design.
  if (variant === "rail") {
    return (
      <dl className="grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {tiles.map((t, i) => (
          // Rules are placed per cell rather than with divide-*: in a
          // two-column grid, divide-x also draws a rule down the left of
          // the cell that starts the second row.
          <div
            key={t.label}
            className={`flex flex-col gap-1.5 border-line px-5 py-6 sm:border-b-0 ${
              i % 2 === 1 ? "border-l" : ""
            } ${i < 2 ? "border-b" : ""} ${i > 0 ? "sm:border-l" : "sm:border-l-0"}`}
          >
            <dd className="order-1 flex items-baseline gap-2 font-display text-[2.15rem] leading-none tracking-tight text-ink">
              <CountUp value={t.value} />
              {t.live && (
                <span
                  aria-hidden="true"
                  className="pulse-dot inline-block h-1.5 w-1.5 shrink-0 self-center rounded-full bg-verify"
                />
              )}
            </dd>
            <dt className="micro order-2 font-mono text-xs leading-relaxed text-muted">
              {t.label}
            </dt>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="panel flex flex-col gap-1 px-4 py-4 sm:px-5">
          <dd className="order-1 flex items-baseline gap-2 font-display text-3xl text-ink">
            <CountUp value={t.value} />
            {t.live && (
              <span
                aria-hidden="true"
                className="pulse-dot mb-0.5 inline-block h-2 w-2 shrink-0 self-center rounded-full bg-verify"
              />
            )}
          </dd>
          <dt className="micro order-2 text-muted">{t.label}</dt>
        </div>
      ))}
    </dl>
  );
}
