/**
 * One founder's stand — the server half.
 *
 * The interactive page (guestbook, connect, the drawn room) lives in
 * components/StandPageClient.tsx, unchanged in behaviour. This wrapper
 * exists for the two things a client component cannot do:
 *
 *   1. Real HTML for crawlers and previews. generateMetadata() gives every
 *      stand its own title, description and canonical, and the sibling
 *      opengraph-image.tsx is picked up by the app router automatically —
 *      each stand link unfurls as its own card instead of the site default.
 *   2. A first paint that already carries the stand. The entry fetched here
 *      is handed to the client as initialEntry, so a visitor (or a crawler
 *      that runs no JavaScript) sees the pitch immediately instead of
 *      "Finding the stand…". The client still re-fetches on an interval,
 *      so liveness (online, guestbook) is exactly as before.
 *
 * If the floor server is unreachable at render time, entry is null and the
 * page behaves precisely as it did when it was client-only.
 */

import type { Metadata } from "next";
import StandPageClient from "@/components/StandPageClient";
import { fetchStandServer } from "./fetch-stand";

export const revalidate = 60;

interface Params {
  params: { ownerId: string };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const ownerId = decodeURIComponent(params.ownerId);
  const entry = await fetchStandServer(ownerId);

  if (!entry) {
    // Missing or unreachable: keep the page reachable but out of the index
    // — a packed-away stand should not linger in search results.
    return {
      title: "Stand",
      robots: { index: false, follow: true },
    };
  }

  const s = entry.startup;
  const title = s.name || "A stand";
  const description = (s.oneLiner || s.pitch || "A stand on FounderFloor — the walkable startup floor.").slice(0, 200);

  return {
    title, // layout template appends " · FounderFloor"
    description,
    alternates: { canonical: `/stand/${encodeURIComponent(ownerId)}` },
    openGraph: { type: "website", title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function StandPage({ params }: Params) {
  const ownerId = decodeURIComponent(params.ownerId);
  const entry = await fetchStandServer(ownerId);
  return <StandPageClient ownerId={ownerId} initialEntry={entry} />;
}
