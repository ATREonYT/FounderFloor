"use client";

/**
 * The landing page's live stat band: real numbers from the floor server
 * (founders online now, stands up, floors open, badges earnable), each
 * counting up from zero when scrolled into view — tabular figures on an
 * eased rAF ramp, so the paper-and-ink look gets a distinctly current pulse.
 * Degrades quietly: without the server the live tiles show "—" and the
 * static ones still animate. Reduced-motion users get final values instantly.
 */

import { useEffect, useRef, useState } from "react";
import { FLOORS } from "@/lib/data/floors";
import { httpBase } from "@/lib/net";

const PUBLIC_FLOORS = FLOORS.filter((f) => !f.hidden);
const FLOORS_OPEN = PUBLIC_FLOORS.length;
const TOTAL_SPOTS = PUBLIC_FLOORS.reduce((a, f) => a + f.boothSpots.length, 0);
const BADGES_EARNABLE = 11;
const REACTIONS = 8;

function CountUp({ value, duration = 1100 }: { value: number | null; duration?: number }) {
  const [shown, setShown] = useState<number | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || value === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    const run = () => {
      if (started.current) return;
      started.current = true;
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setShown(Math.round(value * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        run();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    // fail open: never leave a stat sitting at 0 because a viewer/browser
    // didn't fire the observer
    const failOpen = window.setTimeout(run, 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(failOpen);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {value === null ? "—" : (shown ?? 0).toLocaleString("en-US")}
    </span>
  );
}

export default function LiveStats() {
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
