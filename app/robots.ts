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
      disallow: ["/admin", "/reset", "/profile", "/connections", "/floor/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
