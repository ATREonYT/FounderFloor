import type { MetadataRoute } from "next";

/** The public, indexable pages — everything else is per-visitor state. */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://founderfloor.net");

export default function sitemap(): MetadataRoute.Sitemap {
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
  return pages.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
