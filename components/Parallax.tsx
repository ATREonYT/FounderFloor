"use client";

/**
 * A slow counter-drift as an element passes the viewport, so the artwork
 * doesn't travel at exactly the same rate as the type around it. Every ad
 * and every well-made product page does some version of this; the trick is
 * how little of it there is. Twelve pixels over a full screen of scroll is
 * enough to read as depth and not enough to notice as an effect.
 *
 * Transform only, on rAF, off entirely under reduced motion.
 */

import { useEffect, useRef } from "react";

export default function Parallax({
  children,
  amount = 12,
  className = "",
}: {
  children: React.ReactNode;
  /** Peak travel in pixels, either side of centre. */
  amount?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const mid = window.innerHeight / 2;
      // -1 when the element's centre is a screen below the middle, +1 above
      const p = Math.max(-1, Math.min(1, (mid - (r.top + r.height / 2)) / window.innerHeight));
      el.style.transform = `translate3d(0, ${(p * amount).toFixed(2)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [amount]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
