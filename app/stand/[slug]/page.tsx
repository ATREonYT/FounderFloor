/**
 * One founder's stand, at its public address — /stand/soup-ticket.
 *
 * SERVER-RENDERED ON PURPOSE. This page is the link founders put in bios
 * and readmes, which means most of its readers arrive with no account,
 * some with no JavaScript (crawlers, previews, reader modes), and none
 * with patience. Everything that matters — the name, the one-liner, the
 * stand itself, the build log, the link out — is in the HTML the server
 * sends. The interactive extras (guestbook, connect, writing the log)
 * hydrate below in StandExtras and are strictly additive.
 *
 * The address is a slug minted from the startup's name; a rename changes
 * the display name and never the slug. Old /stand/<ownerId> links resolve
 * through the same route — the floor server accepts either form.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { fetchPublicStand, siteOrigin } from "@/lib/serverFloor";
import { floorById } from "@/lib/data/floors";
import RankBadge from "@/components/RankBadge";
import TierTag from "@/components/TierTag";
import StandExtras from "@/components/StandExtras";

export const revalidate = 60;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ref = decodeURIComponent(params.slug);
  const stand = await fetchPublicStand(ref);
  if (!stand) {
    return { title: "Stand not found — FounderFloor", robots: { index: false } };
  }
  const url = `${siteOrigin()}/stand/${stand.slug ?? ref}`;
  const title = `${stand.startup.name} — a stand on FounderFloor`;
  const description =
    stand.startup.oneLiner || `${stand.ownerName || stand.startup.founder} keeps a stand here.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "FounderFloor", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** "3 days ago", in the site's plain words, computed at render time. */
function ago(ts: number): string {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60_000));
  if (mins < 60) return mins < 1 ? "just now" : `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export default async function StandPage({ params }: Props) {
  const ref = decodeURIComponent(params.slug);
  const stand = await fetchPublicStand(ref);

  if (!stand) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <h1 className="font-display text-3xl">No stand at this address</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Either it was never here, its founder packed it away, or the floor
          server isn&rsquo;t answering right now. The directory has everyone
          who is currently up.
        </p>
        <Link
          href="/directory"
          className="mt-6 inline-flex rounded-md border border-ink px-3 py-2 text-sm hover:bg-panel"
        >
          Browse the directory
        </Link>
      </main>
    );
  }

  const s = stand.startup;
  const floor = stand.floorId ? floorById(stand.floorId) : undefined;
  const boothSrc = `/stand/${encodeURIComponent(stand.slug ?? ref)}/booth.svg`;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <p className="micro text-muted">
        <Link href="/directory" className="hover:text-ink">
          Directory
        </Link>{" "}
        · {s.category || "Startup"}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-3xl leading-tight">{s.name}</h1>
        <RankBadge revenue={s.verifiedRevenue} />
        {s.tier && <TierTag tier={s.tier} />}
        {s.seekingCofounder && (
          <span className="micro rounded-sm border border-verify/40 px-1.5 py-0.5 text-verify">
            Seeking co-founder
          </span>
        )}
      </div>
      <p className="mt-1.5 text-base leading-snug text-muted">{s.oneLiner}</p>

      {/* The stand, drawn server-side by the same code the hall draws it
          with — founder standing in the lane. A plain <img>, so it renders
          for every reader the metadata brings in, scripts or none. */}
      <div className="mx-auto mt-5 w-full max-w-[420px] rounded-md border border-line bg-panel px-6 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={boothSrc}
          alt={`${s.name}'s stand, with ${s.founder} at the counter`}
          width={456}
          height={618}
          className="pixelated h-auto w-full"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>
          {s.founder}
          {s.goal ? ` · working toward ${s.goal}` : ""}
        </span>
        {stand.online ? (
          <span className="flex items-center gap-1 text-verify">
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-verify" />
            on {floor?.name ?? "a floor"} right now
          </span>
        ) : stand.lastSeen ? (
          <span>last here {ago(stand.lastSeen)}</span>
        ) : null}
      </div>

      {s.pitch && (
        <p className="mt-5 max-w-prose whitespace-pre-line text-sm leading-relaxed">{s.pitch}</p>
      )}

      {s.link && (
        <p className="mt-3 text-sm">
          {/* A founder's own URL, same rules as the directory and the wall:
              no ranking credit passed on, no window.opener handed over. */}
          <a
            href={s.link}
            target="_blank"
            rel="nofollow ugc noopener noreferrer"
            className="text-accent underline underline-offset-2 hover:text-accent-strong"
          >
            {s.link.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "")}
          </a>
        </p>
      )}

      {/* The build log: the founder's own record of what they shipped,
          newest first, server-rendered so it reads without an account or a
          script. The composer that writes it lives in StandExtras and only
          shows for the owner. */}
      {stand.log.length > 0 && (
        <section className="mt-8 border-t border-line pt-5" aria-label="Build log">
          <h2 className="font-display text-xl">Build log</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {stand.log.map((e) => (
              <li key={e.ts} className="flex flex-col gap-0.5">
                <span className="micro text-[10px] text-muted">{ago(e.ts)}</span>
                <p className="max-w-prose text-sm leading-relaxed">{e.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <StandExtras
        refSlug={stand.slug ?? ref}
        ownerId={stand.ownerId}
        founder={s.founder}
        startupName={s.name}
        floorId={stand.floorId}
        floorTier={floor?.tier ?? null}
        floorName={floor?.name ?? null}
        spotIndex={stand.spotIndex}
        online={stand.online}
        log={stand.log}
      />
    </main>
  );
}
