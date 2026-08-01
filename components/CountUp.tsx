"use client";

/**
 * A figure that counts up to its value the first time it is scrolled into
 * view, on an eased rAF ramp with tabular figures so the width never jitters.
 *
 * Built to fail open, like Reveal: if IntersectionObserver is missing, or the
 * observer never fires (headless capture, an odd embedded browser), a backup
 * timer shows the final value. A stat frozen at zero is a far worse bug than
 * one that never animated.
 *
 * Reduced-motion visitors get the final value immediately.
 */

import { useEffect, useRef, useState } from "react";

export default function CountUp({
  value,
  duration = 1100,
  prefix = "",
  suffix = "",
  delay = 0,
  className = "",
}: {
  /** null renders an em dash: "we don't know yet", not "zero". */
  value: number | null;
  duration?: number;
  prefix?: string;
  suffix?: string;
  /** Stagger, for a column of figures that should arrive in order. */
  delay?: number;
  className?: string;
}) {
  const [shown, setShown] = useState<number | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || value === null) return;

    const finish = () => setShown(value);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    let raf = 0;
    let timer = 0;
    const run = () => {
      if (started.current) return;
      started.current = true;
      timer = window.setTimeout(() => {
        const t0 = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          // easeOutCubic: quick off the mark, settles rather than stops
          const eased = 1 - Math.pow(1 - p, 3);
          setShown(Math.round(value * eased));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      }, delay);
    };

    if (typeof IntersectionObserver === "undefined") {
      finish();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            run();
            io.disconnect();
          }
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    const failOpen = window.setTimeout(run, 2500);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.clearTimeout(failOpen);
    };
  }, [value, duration, delay]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {value === null
        ? "—"
        : `${prefix}${(shown ?? 0).toLocaleString("en-US")}${suffix}`}
    </span>
  );
}
