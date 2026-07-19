"use client";

/**
 * Scroll reveal: children fade-rise in when they approach the viewport
 * (once). Built to fail OPEN — a section that never reveals is a much worse
 * bug than one that never animates, so on top of the IntersectionObserver
 * there's a hard fallback timer that shows everything a beat after mount,
 * and IO-less browsers reveal instantly.
 */

import { useEffect, useRef } from "react";

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
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      show();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // huge top rootMargin: anything at or above the viewport counts as
          // seen; positive bottom margin starts the entrance just BEFORE the
          // section scrolls in, so it's already moving when the eye lands
          if (entry.isIntersecting) {
            window.setTimeout(show, delayMs);
            io.disconnect();
          }
        }
      },
      { threshold: 0, rootMargin: "10000px 0px 15% 0px" },
    );
    io.observe(el);
    // Fail-open: whatever happens (headless capture, quirky embedded
    // browser, an IO edge case), nothing stays invisible for long.
    const failOpen = window.setTimeout(show, 2500 + delayMs);
    return () => {
      io.disconnect();
      window.clearTimeout(failOpen);
    };
  }, [delayMs]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
