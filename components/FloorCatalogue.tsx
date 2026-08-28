"use client";

/**
 * The landing page's halls section, as a client island.
 *
 * It used to be server-rendered from compile-time data, which was right
 * until the annex switch existed: an operator can now un-hide a finished
 * floor at runtime (POST /admin/launch-controls), and "Main Hall is full"
 * on a launch day needs the landing to notice without a deploy. The
 * markup is the same catalogue the page always rendered; only the floor
 * list is live. Offline and during SSR it renders exactly the
 * compile-time list, so nothing regresses when the floor server is down.
 */

import Link from "next/link";
import { listedFloors } from "@/lib/data/floors";
import { useAnnex } from "@/components/usePresence";
import { TIER_ORDER } from "@/lib/types";
import TierTag, { TIER_LABEL, TIER_PRICE } from "@/components/TierTag";
import FloorThumb from "@/components/FloorThumb";

/** "The floors" / "The floor" — live, so the annex opening a second hall
 * doesn't leave a singular headline over a plural list. */
export function FloorsTitle() {
  return <>{listedFloors(useAnnex()).length > 1 ? "The floors" : "The floor"}</>;
}

export function FloorsLede() {
  const floors = listedFloors(useAnnex());
  return floors.length > 1 ? (
    <>
      {floors.length} halls, {floors.length} temperaments. Each is a real map
      with real booths; the miniatures are to scale.
    </>
  ) : (
    <>
      One hall, open to everyone, and everyone is in it. A young floor fills
      up faster than four empty ones. The miniature is to scale.
    </>
  );
}

export default function FloorCatalogue() {
  const floors = listedFloors(useAnnex());
  return (
    <div className="border-t border-line">
      {floors.map((floor) => {
        const locked = TIER_ORDER[floor.tier] > TIER_ORDER.free;
        return (
          <article
            key={floor.id}
            className="flex flex-col gap-6 border-b border-line py-7 sm:flex-row sm:gap-8"
          >
            <div className="shrink-0 self-start">
              <FloorThumb
                floor={floor}
                className={`border border-line ${locked ? "opacity-70" : ""}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className={`font-display text-2xl ${locked ? "text-muted" : ""}`}>
                  {floor.name}
                </h3>
                <TierTag tier={floor.tier} />
              </div>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                {floor.tagline}
              </p>

              {/* catalogue specification, with the leaders a programme
                  would print between the entry and its value */}
              <dl className="mt-5 max-w-md text-sm">
                {[
                  ["Booths", String(floor.boothSpots.length)],
                  [
                    "Admission",
                    locked ? `${TIER_LABEL[floor.tier]}, ${TIER_PRICE[floor.tier]}` : "Free",
                  ],
                  ["Stands held for newcomers", floor.reservedSpot !== undefined ? "One" : "None"],
                  ["Tears down", "Never"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline gap-2 py-1.5">
                    <dt className="shrink-0 text-muted">{k}</dt>
                    <span aria-hidden="true" className="leader dash-x" />
                    <dd className="shrink-0 tabular-nums text-ink">{v}</dd>
                  </div>
                ))}
              </dl>

              <Link
                href={`/floor/${floor.id}`}
                className="mt-5 inline-block text-sm text-accent hover:underline"
              >
                Walk into {floor.name} →
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
