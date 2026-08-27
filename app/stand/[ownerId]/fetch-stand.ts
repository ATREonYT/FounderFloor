/**
 * Server-side stand lookup, shared by the page's metadata and its share
 * card. lib/net.ts httpBase() is deliberately client-only — it returns ""
 * during SSR because it derives the origin from window — so this mirrors
 * its env resolution (NEXT_PUBLIC_WS_URL, ws->http scheme swap) with a
 * localhost fallback for the colocated floor server.
 *
 * Kept deliberately simpler than lib/social.ts fetchStand(): no listing
 * fallback for old floor servers. A null here only means the page renders
 * without SEO enrichment — the client half still runs its own robust
 * fetch, so nothing user-facing is lost when this misses.
 */

import type { StandEntry } from "@/lib/social";

function serverHttpBase(): string {
  const env = process.env.NEXT_PUBLIC_WS_URL;
  if (env) {
    try {
      return new URL(env.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:")).origin;
    } catch {
      // Unparsable env var: fall through to the local default rather than
      // guessing at a broken origin.
    }
  }
  return "http://127.0.0.1:3001";
}

export async function fetchStandServer(ownerId: string): Promise<StandEntry | null> {
  if (!ownerId) return null;
  try {
    const res = await fetch(
      `${serverHttpBase()}/startup?owner=${encodeURIComponent(ownerId)}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { entry?: StandEntry } | null;
    const entry = data?.entry;
    if (entry && typeof entry === "object" && entry.startup && typeof entry.startup === "object") {
      return entry;
    }
    return null;
  } catch {
    // Floor server down or unreachable — the client will retry live.
    return null;
  }
}
