import type { MetadataRoute } from "next";

/**
 * Crawl rules. The floors and the profile are per-visitor and worthless in
 * an index; the operator console must never be crawled at all.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://founderfloor.net");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/reset",
        "/profile",
        "/connections",
        "/floor/",
        // the archived landing design, kept live only for comparison
        "/design-v1",
        // workshop tools; a 404 in the shipped build, but say so anyway
        "/dev/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
