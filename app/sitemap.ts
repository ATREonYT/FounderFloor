import type { MetadataRoute } from "next";
import { floorHttpBase } from "@/lib/serverFloor";

/** The public, indexable pages — everything else is per-visitor state. */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://founderfloor.net");

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: { path: string; priority: number; freq: "daily" | "weekly" | "monthly" }[] = [
    { path: "", priority: 1, freq: "daily" },
    { path: "/directory", priority: 0.9, freq: "daily" },
    { path: "/lobby", priority: 0.8, freq: "daily" },
    { path: "/about", priority: 0.6, freq: "monthly" },
    { path: "/terms", priority: 0.3, freq: "monthly" },
    { path: "/privacy", priority: 0.3, freq: "monthly" },
    { path: "/imprint", priority: 0.3, freq: "monthly" },
    { path: "/report", priority: 0.2, freq: "monthly" },
    { path: "/cancel", priority: 0.2, freq: "monthly" },
  ];
  const out: MetadataRoute.Sitemap = pages.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));

  // Every stand with a minted address. The listing is already public and
  // ban-filtered on the server; an unreachable floor server just means the
  // static pages ship alone — a sitemap must never 500 over a data feed.
  const base = floorHttpBase();
  if (base) {
    try {
      const res = await fetch(`${base}/startups`, { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = (await res.json()) as { startups?: unknown };
        const list = Array.isArray(data.startups) ? data.startups : [];
        for (const raw of list.slice(0, 500)) {
          const row = raw as { slug?: unknown; lastSeen?: unknown };
          if (typeof row.slug !== "string" || !row.slug) continue;
          out.push({
            url: `${SITE_URL}/stand/${encodeURIComponent(row.slug)}`,
            lastModified: typeof row.lastSeen === "number" ? new Date(row.lastSeen) : now,
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    } catch {
      /* floor server unreachable — the static pages stand alone */
    }
  }
  return out;
}
