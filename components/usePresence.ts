"use client";

/**
 * Live floor presence — polls GET httpBase()/presence on an interval.
 * Fails silently (empty map) when the floor server is offline or during SSR.
 */

import { useEffect, useState } from "react";
import { httpBase } from "@/lib/net";

/** A dated thing the operator put on the calendar. */
export interface UpcomingEvent {
  id: string;
  title: string;
  startMs: number;
  endMs?: number;
  where?: string;
  blurb?: string;
  href?: string;
}

/** How many founding seats are left, or null while unknown/offline. */
export interface FoundingSeats {
  total: number;
  left: number;
}

function readFloors(data: unknown): Record<string, number> | null {
  if (!data || typeof data !== "object") return null;
  const f = (data as { floors?: unknown }).floors;
  if (!f || typeof f !== "object" || Array.isArray(f)) return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(f as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) out[k] = v;
  }
  return out;
}

function readFounding(data: unknown): FoundingSeats | null {
  if (!data || typeof data !== "object") return null;
  const f = (data as { founding?: unknown }).founding;
  if (!f || typeof f !== "object") return null;
  const { total, left } = f as { total?: unknown; left?: unknown };
  if (typeof total !== "number" || typeof left !== "number") return null;
  if (!Number.isFinite(total) || !Number.isFinite(left) || left < 0 || left > total) return null;
  return { total, left };
}

function readEvents(data: unknown): UpcomingEvent[] | null {
  if (!data || typeof data !== "object") return null;
  const list = (data as { events?: unknown }).events;
  if (!Array.isArray(list)) return null;
  const out: UpcomingEvent[] = [];
  for (const v of list.slice(0, 20)) {
    if (!v || typeof v !== "object") continue;
    const e = v as Record<string, unknown>;
    if (typeof e.title !== "string" || typeof e.startMs !== "number") continue;
    if (!Number.isFinite(e.startMs)) continue;
    out.push({
      id: typeof e.id === "string" ? e.id : `${e.startMs}`,
      title: e.title,
      startMs: e.startMs,
      endMs: typeof e.endMs === "number" ? e.endMs : undefined,
      where: typeof e.where === "string" ? e.where : undefined,
      blurb: typeof e.blurb === "string" ? e.blurb : undefined,
      href: typeof e.href === "string" ? e.href : undefined,
    });
  }
  return out;
}

/**
 * What's coming up, as set from the admin console.
 *
 * Rides the /presence poll every client already makes, for the same reason
 * the founding counter does — a ten-item list is not worth a second
 * endpoint that can be separately down. Open Doors is NOT in here: that
 * one is a recurring window computed in lib/data/event-window.mjs and has
 * to keep working with this server unreachable.
 */
export function useUpcomingEvents(pollMs = 60_000): UpcomingEvent[] {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    let ctrl: AbortController | null = null;
    let disposed = false;

    const load = async (): Promise<void> => {
      const base = httpBase();
      if (!base) return;
      ctrl?.abort();
      ctrl = new AbortController();
      try {
        const res = await fetch(`${base}/presence`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (disposed) return;
        const list = readEvents(data);
        if (list) setEvents(list);
      } catch {
        // Offline — show nothing rather than a calendar that may be wrong.
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

  return events;
}

export function usePresence(pollMs = 15_000): Record<string, number> {
  const [floors, setFloors] = useState<Record<string, number>>({});

  useEffect(() => {
    let ctrl: AbortController | null = null;
    let disposed = false;

    const load = async (): Promise<void> => {
      const base = httpBase();
      if (!base) return;
      ctrl?.abort();
      ctrl = new AbortController();
      try {
        const res = await fetch(`${base}/presence`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (disposed) return;
        const f = readFloors(data);
        if (f) setFloors(f);
      } catch {
        // Offline or aborted — the UI just shows no presence. Quietly.
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

  return floors;
}

/**
 * How many founding seats are still free, off the same endpoint.
 *
 * Its own hook rather than a second return value from usePresence, because
 * the two answers move at completely different speeds: presence changes as
 * people walk in and out, the seat count changes twenty times ever. A slow
 * poll here is cheaper than dragging every presence caller onto a new
 * return shape, and the endpoint is a cached integer either way.
 *
 * Returns null until the first answer arrives, and stays null when the
 * floor server is unreachable — so the caller can hide the offer entirely
 * rather than advertise a number it cannot stand behind.
 */
export function useFoundingSeats(pollMs = 60_000): FoundingSeats | null {
  const [seats, setSeats] = useState<FoundingSeats | null>(null);

  useEffect(() => {
    let ctrl: AbortController | null = null;
    let disposed = false;

    const load = async (): Promise<void> => {
      const base = httpBase();
      if (!base) return;
      ctrl?.abort();
      ctrl = new AbortController();
      try {
        const res = await fetch(`${base}/presence`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (disposed) return;
        const f = readFounding(data);
        if (f) setSeats(f);
      } catch {
        // Offline — the offer stays hidden rather than showing a stale count.
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

  return seats;
}
