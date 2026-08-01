"use client";

/**
 * Scroll reveal: children fade-rise in when they approach the viewport
 * (once). The class it adds, `reveal-in`, is also the cue for every drawing
 * animation inside the section (see the EXHIBITION LAYER block in
 * globals.css), so it has to land when the section is genuinely arriving
 * and not a moment before.
 *
 * The safety net lives in lib/inview.ts and checks geometry rather than
 * just waiting out a timer. The bare timer this used to carry revealed
 * every section 2.5s after load, including ones still three thousand
 * pixels below the fold, which quietly played all their entrances to an
 * empty room. A `<noscript>` rule in the layout covers the case where none
 * of this runs at all.
 */

import { useEffect, useRef } from "react";
import { whenInView } from "@/lib/inview";

export default function Reveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.classList.add("reveal-in");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      show();
      return;
    }

    let timer = 0;
    const stop = whenInView(el, () => {
      if (delayMs > 0) timer = window.setTimeout(show, delayMs);
      else show();
    });
    return () => {
      stop();
      window.clearTimeout(timer);
    };
  }, [delayMs]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
