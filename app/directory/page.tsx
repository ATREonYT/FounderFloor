"use client";

/**
 * Directory — every real startup on the floors, all founder-made. Text
 * search, filter chips (category, seeking co-founder, minimum rank), and a
 * "Walk there" link straight to the stand. Presence dots come from
 * /presence. Categories grow from whatever founders type when they set up.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FLOORS } from "@/lib/data/floors";
import { RANKS, rankFor } from "@/lib/ranks";
import { useAppState } from "@/lib/store";
import { TIER_ORDER, type FloorDef, type RankId, type Startup } from "@/lib/types";
import { TIER_LABEL } from "@/components/TierTag";
import RankBadge from "@/components/RankBadge";
import TierTag from "@/components/TierTag";
import { usePresence } from "@/components/usePresence";
import { useCommunityStartups } from "@/components/useCommunityStartups";

const FLOOR_BY_ID: Record<string, FloorDef> = Object.fromEntries(
  FLOORS.map((f) => [f.id, f]),
);

const PUBLIC_FLOOR_COUNT = FLOORS.filter((f) => !f.hidden).length;

const MIN_RANKS = RANKS.filter((r) => r.id > 0);

/** One directory row — a real founder's stand. */
interface DirRow {
  key: string;
  startup: Startup;
  floor: FloorDef | undefined;
  community: boolean;
  href: string;
  online: boolean;
}

/** Membership visibility boost: Founder+ over Pro over free. */
function tierWeight(tier: "pro" | "founder" | undefined): number {
  return tier === "founder" ? 2 : tier === "pro" ? 1 : 0;
}

function chipClass(active: boolean): string {
  return `min-h-[44px] rounded-md border px-3 py-2.5 text-xs ${
    active
      ? "border-accent bg-accent-soft text-accent"
      : "border-line text-muted hover:border-muted hover:text-ink"
  }`;
}

export default function DirectoryPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [seeking, setSeeking] = useState(false);
  // ?seeking=1 deep link (the lobby's co-founder board) pre-arms the filter.
  // Applied post-mount: reading location during render breaks hydration.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("seeking") === "1") {
      setSeeking(true);
    }
  }, []);
  const [minRank, setMinRank] = useState<RankId | null>(null);
  const presence = usePresence();
  const community = useCommunityStartups();
  const [state] = useAppState();

  // Every row is a real founder's stand (claimed on a floor, or registered
  // and not yet standing anywhere).
  const allRows: DirRow[] = useMemo(() => {
    const rows: DirRow[] = [];
    for (const c of community) {
      const floor = c.floorId !== null ? FLOOR_BY_ID[c.floorId] : undefined;
      rows.push({
        key: c.startup.id,
        startup: c.startup,
        floor,
        community: true,
        href: floor ? `/floor/${c.floorId}?spot=${c.spotIndex}` : "#",
        online: c.online,
      });
    }
    return rows;
  }, [community]);

  // Category chips grow purely from what founders typed when they set up.
  const categories: string[] = useMemo(() => {
    const seen = new Set<string>();
    for (const r of allRows) {
      const cat = r.startup.category;
      if (cat) seen.add(cat);
    }
    return [...seen].sort();
  }, [allRows]);

  const results: DirRow[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allRows
      .filter((r) => {
        const s = r.startup;
        if (category !== null && s.category !== category) return false;
        if (seeking && !s.seekingCofounder) return false;
        if (minRank !== null && rankFor(s.verifiedRevenue).id < minRank) return false;
        if (term) {
          const hay = `${s.name} ${s.oneLiner} ${s.category} ${s.founder}`.toLowerCase();
          if (!hay.includes(term)) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          // live community stands float up, then paid members (a membership
          // perk: Founder+ above Pro above free), then revenue, then name
          Number(b.online) - Number(a.online) ||
          tierWeight(b.startup.tier) - tierWeight(a.startup.tier) ||
          b.startup.verifiedRevenue - a.startup.verifiedRevenue ||
          a.startup.name.localeCompare(b.startup.name),
      );
  }, [allRows, q, category, seeking, minRank]);

  const total = allRows.length;
  const communityCount = community.length;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl">Directory</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Every startup on the floors, all founder-made —{" "}
        {communityCount > 0
          ? `${communityCount} ${communityCount === 1 ? "stand" : "stands"} across ${PUBLIC_FLOOR_COUNT} floors so far`
          : `the floors just opened across ${PUBLIC_FLOOR_COUNT} halls`}
        . Set up a stand and yours appears here on its own, under whatever
        category you give it.
      </p>

      {/* Search and filters only exist once there's something to filter — a
          zero-stand directory leads with the invitation, not empty tools. */}
      {total > 0 && (
      <div className="mt-6 flex flex-col gap-3">
        <div>
          <label htmlFor="directory-search" className="sr-only">
            Search startups
          </label>
          <input
            id="directory-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, one-liner, category, founder"
            autoComplete="off"
            className="h-11 w-full rounded-md border border-line px-3 text-sm placeholder:text-muted/70"
          />
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Category filter">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory((cur) => (cur === c ? null : c))}
              className={chipClass(category === c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="More filters">
          <button
            type="button"
            aria-pressed={seeking}
            onClick={() => setSeeking((v) => !v)}
            className={chipClass(seeking)}
          >
            Seeking co-founder
          </button>
          {MIN_RANKS.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={minRank === r.id}
              title={r.blurb}
              onClick={() => setMinRank((cur) => (cur === r.id ? null : r.id))}
              className={chipClass(minRank === r.id)}
            >
              {r.name}+
            </button>
          ))}
        </div>
      </div>
      )}

      {total > 0 && (
        <p className="micro mt-6 text-muted">
          {results.length === total
            ? `${total} startups`
            : `${results.length} of ${total} startups`}
          {category !== null && ` · ${category}`}
        </p>
      )}

      {results.length === 0 ? (
        total === 0 ? (
          <div className="mt-4 flex flex-col items-start gap-3">
            <p className="text-sm leading-relaxed text-muted">
              No stands yet — the floor is wide open, which means the best
              spots are too. Set up your startup and be the first name in
              this directory.
            </p>
            <Link
              href="/profile#booth"
              className="btn-press rounded-md bg-accent-strong px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong/90"
            >
              Set up your stand
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Nothing matches. Either loosen a filter or accept that it
            hasn&rsquo;t been built yet.
          </p>
        )
      ) : (
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {results.map((r) => {
            const s = r.startup;
            const floor = r.floor;
            const here = floor ? presence[floor.id] ?? 0 : 0;
            return (
              <li
                key={r.key}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg leading-snug">{s.name}</h2>
                    <RankBadge revenue={s.verifiedRevenue} />
                    {r.community && (
                      <span className="micro rounded-sm border border-accent/40 px-1.5 py-0.5 text-accent">
                        {r.online ? "Here now" : r.floor ? "New booth" : "New"}
                      </span>
                    )}
                    {s.tier && <TierTag tier={s.tier} />}
                    {s.seekingCofounder && (
                      <span className="micro rounded-sm border border-verify/40 px-1.5 py-0.5 text-verify">
                        Seeking co-founder
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-snug text-muted">{s.oneLiner}</p>
                  <p className="micro mt-1.5 text-muted">
                    {s.founder} · {s.category}
                  </p>
                </div>
                {floor && (
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    <span className="flex items-center gap-2 text-xs text-muted">
                      {here > 0 && (
                        <span className="flex items-center gap-1 text-verify">
                          <span
                            aria-hidden="true"
                            className="inline-block h-2 w-2 rounded-full bg-verify"
                          />
                          {here} here
                        </span>
                      )}
                      <span>{floor.name}</span>
                      <TierTag tier={floor.tier} />
                    </span>
                    {TIER_ORDER[state.sub] >= TIER_ORDER[floor.tier] ? (
                      <Link
                        // deep link: the floor page auto-walks you from the
                        // door to this stand (?booth for seed, ?spot for live)
                        href={r.href}
                        className="rounded-md border border-ink px-3 py-2 text-sm hover:bg-panel"
                      >
                        Walk there
                      </Link>
                    ) : (
                      <Link
                        // honest label: this floor is behind the paywall for
                        // the current tier — no surprise gate after the click
                        href="/profile#membership"
                        className="rounded-md border border-line px-3 py-2 text-sm text-muted hover:border-ink hover:text-ink"
                      >
                        Needs {TIER_LABEL[floor.tier]}
                      </Link>
                    )}
                  </div>
                )}
                {!floor && r.community && (
                  <span className="shrink-0 text-xs text-muted sm:text-right">
                    No stand yet — their founder
                    <br className="hidden sm:block" /> hasn&rsquo;t claimed a spot
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
