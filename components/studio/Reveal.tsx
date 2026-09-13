"use client";

/**
 * ARRIVE WHEN YOU ARE LOOKED AT.
 *
 * One observer per element, disconnected the moment it has fired: a
 * section that has arrived should never be watched again, and a page
 * that keeps dozens of observers alive scrolls badly on the phones most
 * of these visitors are on.
 *
 * The class is added rather than the style set, so what actually moves
 * is decided in the stylesheet next to everything else it moves with.
 * Anything that cannot observe — an old browser, a crawler — simply gets
 * the section already visible, because `reveal` only hides once the
 * script is running to take it back.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

export default function Reveal({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" }) {
  const el = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = el.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSeen(true);
        io.disconnect();
      },
      // a little before the edge, so it has finished moving by the time
      // it is properly in view rather than arriving under the reader
      { rootMargin: "0px 0px -12% 0px", threshold: 0.06 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={el as never} className={`${className}${seen ? " seen" : ""}`}>
      {children}
    </Tag>
  );
}
