"use client";

/**
 * Every community startup on the site — one entry per claimed stand plus
 * one per founder who registered a startup without claiming a spot, polled
 * from GET httpBase()/startups. This IS the directory's list; there is no
 * seed-startup merge. Categories join the filter chips automatically.
 * Fails silently (empty list) when the floor server is offline or during SSR.
 */

import { useEffect, useState } from "react";
import { httpBase } from "@/lib/net";
import type { Startup } from "@/lib/types";

export interface CommunityStartup {
  /**
   * Optional on purpose: a browser that loads before the server is updated
   * won't have it, and requiring it in the type guard would blank the whole
   * directory over a field it can derive. Read it through ownerIdOf().
   */
  ownerId?: string;
  /** null = registered from the profile editor, no floor stand claimed yet. */
  floorId: string | null;
  spotIndex: number;
  /** Founder currently walking that floor. */
  online: boolean;
  lastSeen: number;
  ownerName?: string;
  startup: Startup;
}

function isEntry(v: unknown): v is CommunityStartup {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  const s = e.startup as Record<string, unknown> | undefined;
  return (
    (typeof e.floorId === "string" || e.floorId === null) &&
    typeof e.spotIndex === "number" &&
    typeof e.online === "boolean" &&
    typeof e.lastSeen === "number" &&
    !!s &&
    typeof s === "object" &&
    typeof s.id === "string" &&
    typeof s.name === "string"
  );
}

export function useCommunityStartups(pollMs = 20_000): CommunityStartup[] {
  const [startups, setStartups] = useState<CommunityStartup[]>([]);

  useEffect(() => {
    let ctrl: AbortController | null = null;
    let disposed = false;

    const load = async (): Promise<void> => {
      const base = httpBase();
      if (!base) return;
      ctrl?.abort();
      ctrl = new AbortController();
      try {
        const res = await fetch(`${base}/startups`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (disposed || !data || typeof data !== "object") return;
        const list = (data as { startups?: unknown }).startups;
        if (!Array.isArray(list)) return;
        setStartups(list.filter(isEntry));
      } catch {
        // Offline or aborted — the directory shows its empty state.
      }
    };

    void load();
    const timer = setInterval(() => void load(), pollMs);
    return () => {
      disposed = true;
      clearInterval(timer);
      ctrl?.abort();
    };
  }, [pollMs]);

  return startups;
}
