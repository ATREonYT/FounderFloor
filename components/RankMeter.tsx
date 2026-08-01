"use client";

/**
 * One line of the rank board: the revenue figure and the bar under it,
 * driven by a single ramp.
 *
 * They used to be two animations that merely looked related — the bar was an
 * 820ms CSS animation cued by the section reveal, the figure a 1000ms rAF
 * ramp cued by its own observer, on two different easing curves. Two clocks
 * means two start times and two finish times, and the eye reads that as
 * sloppiness even when it can't say why.
 *
 * Now there is one eased progress value per row. The figure is that value
 * times the target, and the bar is scaled by the same value, written
 * straight to the node so the bar stays on the compositor and doesn't
 * re-render React sixty times a second. The number and the length of the bar
 * are therefore the same quantity, drawn twice.
 */

import { useEffect, useRef, useState } from "react";
import { whenInView } from "@/lib/inview";

export default function RankMeter({
  value,
  max,
  color,
  delay = 0,
  duration = 1000,
}: {
  value: number;
  /** Largest value on the board, so every bar shares one scale. */
  max: number;
  color: string;
  delay?: number;
  duration?: number;
}) {
  const [shown, setShown] = useState(0);
  const rowRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  // The floor keeps the bottom rank from being an invisible bar; it is
  // applied to the target, so the ramp still runs 0 -> target.
  const targetPct = Math.max(4, (value / max) * 100);

  useEffect(() => {
    const row = rowRef.current;
    const fill = fillRef.current;
    if (!row || !fill) return;

    const land = () => {
      setShown(value);
      fill.style.transform = "scaleX(1)";
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      land();
      return;
    }

    let raf = 0;
    let timer = 0;
    const start = () => {
      timer = window.setTimeout(() => {
        const t0 = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
          setShown(Math.round(value * eased));
          fill.style.transform = `scaleX(${eased})`;
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      }, delay);
    };

    const stop = whenInView(row, start, { threshold: 0.1, rootMargin: "0px 0px 10% 0px" });
    return () => {
      stop();
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [value, max, delay, duration]);

  return (
    <span ref={rowRef} className="flex items-center gap-3 justify-self-end sm:justify-self-auto">
      {/* wide enough for "$100,000+": any narrower and the top rank shoves
          its bar out of line with the others */}
      <span className="w-[6.75rem] shrink-0 text-right font-display text-lg tabular-nums text-gold sm:text-left">
        ${shown.toLocaleString("en-US")}+
      </span>
      <span className="hidden h-[3px] flex-1 overflow-hidden bg-paper/10 sm:block">
        <span
          ref={fillRef}
          className="meter-fill block h-full"
          style={{
            width: `${targetPct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
          }}
        />
      </span>
    </span>
  );
}
