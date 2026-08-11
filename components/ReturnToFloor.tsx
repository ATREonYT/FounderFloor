"use client";

/**
 * The way back in.
 *
 * Every chip on the floor's top bar is a one-way door: tap your membership
 * badge and you are on the profile page with the hall behind you and no
 * obvious route back. Nothing is actually lost — your SPOT stays reserved
 * while you are away, so walking back in puts the stand back where it was —
 * but a door with no handle on the other side stops people using it at all,
 * so the fear costs more than the trip.
 *
 * Shown on every page EXCEPT the floors themselves, and only once this
 * tab has actually been on a floor.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface LastFloor {
  id: string;
  name: string;
}

export default function ReturnToFloor() {
  const pathname = usePathname();
  const [floor, setFloor] = useState<LastFloor | null>(null);

  useEffect(() => {
    // Re-read per navigation: the floor writes the breadcrumb on mount, so
    // the very first hop off it needs a fresh look rather than a cached one.
    try {
      const raw = window.sessionStorage.getItem("founderfloor:last-floor");
      const parsed = raw ? (JSON.parse(raw) as Partial<LastFloor>) : null;
      setFloor(
        parsed && typeof parsed.id === "string" && typeof parsed.name === "string"
          ? { id: parsed.id, name: parsed.name }
          : null,
      );
    } catch {
      setFloor(null);
    }
  }, [pathname]);

  // Not on the floor itself, and not on the pages that are their own front
  // door (the launch gate and the operator console).
  const hidden =
    !pathname ||
    pathname.startsWith("/floor/") ||
    pathname.startsWith("/soon") ||
    pathname.startsWith("/admin");
  if (hidden || !floor) return null;

  return (
    <Link
      href={`/floor/${floor.id}`}
      aria-label={`Back to ${floor.name}`}
      className="glass btn-press anim-in group fixed bottom-4 left-4 z-40 flex min-h-[44px] items-center gap-2.5 px-3 py-2 shadow-float hover:bg-paper"
    >
      {/* The arrow is the whole message at a glance; it walks left on hover
          the way the door it points at is behind you. */}
      <span
        aria-hidden="true"
        className="text-muted transition-transform duration-200 group-hover:-translate-x-0.5"
      >
        ←
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        {/* Same pill, same display face as the floor's own name badge, so
            it reads as that hall's tab rather than a generic Back button. */}
        <span className="truncate font-display text-base leading-none">{floor.name}</span>
        <span className="micro mt-1 hidden text-muted sm:block">back to the floor</span>
      </span>
      <span aria-hidden="true" className="h-1 w-1 shrink-0 rotate-45 bg-gold/70" />
    </Link>
  );
}
