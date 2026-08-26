"use client";

/**
 * The margin index: a column of section numbers pinned in the left margin,
 * with the one you are reading marked. It is the programme's running head —
 * you always know which part of the page you are in, and you can jump.
 *
 * Only appears above 1380px, where there is genuine margin to put it in.
 * Below that the page has no spare column and the rail would crowd the text,
 * so it is display:none and out of the accessibility tree with it.
 *
 * The active section is found by scanning rather than by IntersectionObserver:
 * sections here vary from 400px to 900px tall, and "which one covers the
 * reading line" is the question being asked, which a threshold cannot answer.
 */

import { useEffect, useState } from "react";

export type IndexEntry = { id: string; n: string; label: string };

export default function ProgrammeIndex({ entries }: { entries: IndexEntry[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      // the reading line: a third of the way down the viewport
      const line = window.innerHeight * 0.33;
      let current: string | null = null;
      for (const e of entries) {
        const el = document.getElementById(e.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = e.id;
      }
      setActive(current);
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
  }, [entries]);

  return (
    <nav
      aria-label="Programme sections"
      className="fixed left-7 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 min-[1380px]:flex"
    >
      {entries.map((e) => {
        const on = active === e.id;
        return (
          <a
            key={e.id}
            href={`#${e.id}`}
            aria-current={on ? "true" : undefined}
            className="group flex items-center gap-2.5 py-0.5"
            title={e.label}
          >
            <span
              className={`micro font-mono text-xs transition-colors duration-200 ${
                on ? "text-accent" : "text-muted/50 group-hover:text-muted"
              }`}
            >
              {e.n}
            </span>
            <span
              aria-hidden="true"
              className={`h-px w-7 origin-left transition-[transform,background-color] duration-300 ${
                on
                  ? "scale-x-100 bg-accent"
                  : "scale-x-50 bg-line group-hover:scale-x-75 group-hover:bg-muted/50"
              }`}
            />
          </a>
        );
      })}
    </nav>
  );
}
