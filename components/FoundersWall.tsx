"use client";

/**
 * The founders wall: everyone who has put a startup on this site, on a page
 * anybody can read without an account.
 *
 * It is NOT a second database. Every card here is the same listing the
 * directory shows and the same text painted on that founder's stand — one
 * source, GET /startups, already sanitized on the way in. Editing your
 * stand edits your wall entry, because they are the same thing. A separate
 * "wall submission" table would have been half a day's work and a permanent
 * source of two startups with the same name saying different things.
 *
 * ON LINKS. Every outbound href is a URL a stranger typed, so they all get
 * rel="nofollow ugc noopener noreferrer" and the host is shown in the
 * label. nofollow/ugc is not politeness: without it a public page that
 * anyone can post links to is a link farm, and search engines treat it as
 * one — the penalty lands on the host site, which is this one.
 *
 * ORDER. Newest first, because the point of the wall is that adding
 * yourself does something visible. Sorting by tier here would sell a paid
 * perk on the one surface whose job is to make a stranger want to join,
 * and it would put the newcomer's card below the fold the moment they
 * arrive — the exact opposite of the reason they came.
 */

import { useEffect, useState } from "react";
import { httpBase } from "@/lib/net";
import type { Startup } from "@/lib/types";
import Spec from "@/components/Spec";

interface Row {
  floorId: string | null;
  online: boolean;
  lastSeen: number;
  startup: Startup;
}

/** The bit of a URL worth reading before you click it. */
function hostOf(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
}

export default function FoundersWall({
  limit = 36,
  className = "",
}: {
  limit?: number;
  className?: string;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let dead = false;
    const base = httpBase();
    if (!base) {
      setFailed(true);
      return;
    }
    fetch(`${base}/startups`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { startups?: Row[] }) => {
        if (dead) return;
        const list = Array.isArray(data.startups) ? data.startups : [];
        setRows([...list].sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0)).slice(0, limit));
      })
      .catch(() => {
        if (!dead) setFailed(true);
      });
    return () => {
      dead = true;
    };
  }, [limit]);

  /* An empty wall is a fact about a new site, not an error, and saying so
     beats an indefinite skeleton that reads as broken. The same line
     covers "the floor server is down": either way there is nothing to
     show, and inventing placeholder founders to fill the grid would be
     the one thing this project has refused to do from the start. */
  if (failed || (rows && rows.length === 0)) {
    return (
      <div className={`border border-dashed border-line p-6 text-center ${className}`}>
        <p className="text-sm leading-relaxed text-muted">
          {failed
            ? "The wall can’t be reached right now. It comes back on its own."
            : "Nobody on the wall yet. The first name here is the one everybody scrolls past on their way in."}
        </p>
      </div>
    );
  }

  if (!rows) {
    return (
      <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${className}`} aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-[132px] animate-pulse border border-line bg-panel/60" />
        ))}
      </div>
    );
  }

  return (
    <ul className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {rows.map((r) => {
        const s = r.startup;
        return (
          <li
            key={s.id}
            className="flex flex-col border border-line bg-panel p-4 transition-transform duration-200 ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate font-display text-lg">{s.name}</p>
              {r.online && (
                <Spec className="flex shrink-0 items-center gap-1.5 text-verify">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-verify" />
                  In
                </Spec>
              )}
            </div>
            {s.oneLiner && (
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                {s.oneLiner}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3">
              <Spec className="text-muted">{s.founder}</Spec>
              {/* "Uncategorized" is the server's placeholder for a founder
                  who never picked one — printing it puts a word on their
                  card that says nothing except that a form had a default. */}
              {s.category && s.category !== "Uncategorized" && (
                <Spec className="text-muted">· {s.category}</Spec>
              )}
              {s.seekingCofounder && <Spec className="text-accent">· Seeking co-founder</Spec>}
            </div>
            {s.link && (
              <a
                href={s.link}
                target="_blank"
                // A stranger's URL: no ranking credit passed on, no
                // window.opener handed over, no referrer leaked.
                rel="nofollow ugc noopener noreferrer"
                className="mt-2 truncate text-sm text-accent underline underline-offset-2 hover:text-accent-strong"
              >
                {hostOf(s.link)}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
