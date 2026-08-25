/**
 * The floor server, reached FROM the Next server — for pages that must
 * render without a browser: the public stand page, its OG image, the badge.
 *
 * lib/net.ts deliberately answers "" during SSR because everything it
 * serves is a live browser feature. This is the other half: no window, no
 * socket, one env var, plain fetch with a short timeout, and a payload
 * checked field-by-field because a page cached by a crawler must never
 * render junk from a half-answered request.
 */

import type { Startup } from "@/lib/types";

export interface PublicLogEntry {
  text: string;
  ts: number;
}

export interface PublicStand {
  ownerId: string;
  slug: string | null;
  floorId: string | null;
  spotIndex: number;
  online: boolean;
  lastSeen: number;
  ownerName: string;
  startup: Startup;
  log: PublicLogEntry[];
}

export function floorHttpBase(): string {
  const env = process.env.NEXT_PUBLIC_WS_URL;
  if (!env) return "";
  try {
    return new URL(env.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:")).origin;
  } catch {
    return "";
  }
}

/** The site's own public origin, for absolute URLs in OG tags and embeds. */
export function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://founderfloor.net";
}

export async function fetchPublicStand(ref: string): Promise<PublicStand | null> {
  const base = floorHttpBase();
  if (!base || !ref) return null;
  try {
    const res = await fetch(`${base}/public/stand/${encodeURIComponent(ref)}`, {
      // A stand page should be fresh-ish without hammering the box on
      // every crawler hit; the floor server sets its own max-age too.
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { entry?: unknown };
    const e = data?.entry as Record<string, unknown> | undefined;
    if (!e || typeof e !== "object") return null;
    const startup = e.startup as Startup | undefined;
    if (!startup || typeof startup !== "object" || typeof startup.name !== "string") return null;
    const log: PublicLogEntry[] = Array.isArray(e.log)
      ? (e.log as unknown[])
          .filter(
            (v): v is PublicLogEntry =>
              !!v &&
              typeof v === "object" &&
              typeof (v as PublicLogEntry).text === "string" &&
              typeof (v as PublicLogEntry).ts === "number",
          )
          .slice(0, 5)
      : [];
    return {
      ownerId: typeof e.ownerId === "string" ? e.ownerId : "",
      slug: typeof e.slug === "string" ? e.slug : null,
      floorId: typeof e.floorId === "string" ? e.floorId : null,
      spotIndex: typeof e.spotIndex === "number" ? e.spotIndex : -1,
      online: e.online === true,
      lastSeen: typeof e.lastSeen === "number" ? e.lastSeen : 0,
      ownerName: typeof e.ownerName === "string" ? e.ownerName : startup.founder || "",
      startup,
      log,
    };
  } catch {
    return null;
  }
}
