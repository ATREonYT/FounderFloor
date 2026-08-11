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
import { usePathname } from "next/navigation";

export default function ScrollProgress() {
  const ref = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    /* Not on the floors. The header is display:none there, so this was
       animating a 2px bar nobody could see — and paying for it with a
       forced layout of the entire fixed overlay, blurred glass panels and
       all, on every scroll frame.

       Keyed on the pathname rather than on body[data-on-floor]: this
       component is mounted by the root layout, and a parent's effect runs
       AFTER its children's, so on a client-side navigation the flag isn't
       set yet the one time it would matter. */
    if (pathname?.startsWith("/floor/")) return;

    let raf = 0;
    /* scrollHeight is a forced full-document layout. Read once here and on
       resize, not once per scroll frame — which is what made a flick down
       a long page cost more than the scroll itself. */
    let max = 0;
    const remeasure = () => {
      max = document.documentElement.scrollHeight - window.innerHeight;
    };
    const measure = () => {
      raf = 0;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const onResize = () => {
      remeasure();
      onScroll();
    };

    remeasure();
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    // The page can grow without a resize — a list resolving, an image
    // landing — and a progress bar keyed to a stale height reads wrong.
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-accent"
      ref={ref}
    />
  );
}
