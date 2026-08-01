"use client";

/**
 * A hairline that fills across the bottom edge of the site header as the
 * page scrolls. Sits inside the header, so it inherits the header's own
 * disappearance on floor pages and never floats over the game.
 *
 * Scaled rather than resized (transform only, no layout), read on rAF so a
 * fast flick can't queue more work than a frame can do, and hidden outright
 * for reduced-motion visitors — a bar racing across the top is exactly the
 * kind of thing that setting is for.
 */

import { useEffect, useRef } from "react";

export default function ScrollProgress() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${p})`;
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
  }, []);

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-accent"
      ref={ref}
    />
  );
}
