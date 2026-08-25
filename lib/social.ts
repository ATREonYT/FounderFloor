"use client";

/**
 * Client for the floor server's social API (mutual connections + off-floor
 * DMs). See server/index.mjs: GET /social, POST /social/request|respond|dm.
 * Everything degrades to no-ops when the server is unreachable.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppState, InboxData, ProfileCard, Startup } from "@/lib/types";
import { httpBase } from "@/lib/net";
import { guestSecret, tokenFor } from "@/lib/auth";

export const EMPTY_INBOX: InboxData = {
  requests: [],
  outgoing: [],
  connections: [],
  threads: {},
};

/** The requester's calling card, built from local state at request time. */
export function buildCard(state: AppState): ProfileCard {
  return {
    id: state.profile.id,
    name: state.profile.name || "founder",
    title: state.profile.title,
    status: state.profile.status,
    badges: state.badges.slice(0, 20),
    connections: state.connections.length,
    startupName: state.myStartup?.name,
    startupRevenue: state.myStartup?.verifiedRevenue,
    floorsVisited: state.quest.floors.length,
  };
}

/**
 * Sign-in continuity: hand the old guest identity's floor stands and
 * directory listing to the account that was just signed into, so the hall
 * doesn't keep a ghost "away" copy of the person's booth under the
 * abandoned guest id. Server-verified on both ends (guest secret + bearer
 * token); a no-op offline or when nothing needs moving.
 */
export async function migrateStands(fromGuestId: string, toAccountId: string): Promise<void> {
  const base = httpBase();
  if (!base || !fromGuestId || !toAccountId || fromGuestId === toAccountId) return;
  if (fromGuestId.startsWith("acct_") || !toAccountId.startsWith("acct_")) return;
  try {
    await fetch(`${base}/stands/migrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromId: fromGuestId,
        toId: toAccountId,
        gs: guestSecret(),
        token: tokenFor(toAccountId),
      }),
    });
  } catch {
    // offline — the guest stand simply ages out (7-day expiry)
  }
}

async function post(path: string, body: unknown): Promise<boolean> {
  const base = httpBase();
  if (!base) return false;
  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * What actually happened to a connection request.
 *
 *   sent       it's in their inbox
 *   already    you'd asked before, or they'd asked you
 *   connected  it landed on a request they had already sent you
 *   full       somebody's mailbox is full and it was dropped
 *   failed     the server never answered
 *
 * The server used to reply `ok: true` to all five, and the floor toasted
 * "they'll see your card" over a request that had been thrown away.
 */
export type RequestState = "sent" | "already" | "connected" | "full" | "failed";

export async function sendConnectRequest(card: ProfileCard, to: string): Promise<RequestState> {
  const base = httpBase();
  if (!base) return "failed";
  try {
    const res = await fetch(`${base}/social/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card, to, token: tokenFor(card.id), gs: guestSecret() }),
    });
    if (!res.ok) return "failed";
    const data: unknown = await res.json();
    const st = (data as { state?: unknown } | null)?.state;
    return st === "already" || st === "connected" || st === "full" || st === "sent"
      ? st
      : // an older server answers { ok: true } with no state
        "sent";
  } catch {
    return "failed";
  }
}

/**
 * One founder's stand, by owner id — what /stand/<ownerId> renders.
 *
 * Deliberately not "fetch the directory and find the row": that listing is
 * capped and drops registry entries a stand shadows, so a permalink to
 * either of those founders would come back empty from a page that renders
 * them perfectly well.
 */
export type StandResult =
  | { state: "found"; entry: StandEntry }
  | { state: "missing" }
  | { state: "offline" };

export async function fetchStand(ownerId: string): Promise<StandResult> {
  const base = httpBase();
  if (!base || !ownerId) return { state: "offline" };
  try {
    const res = await fetch(`${base}/startup?owner=${encodeURIComponent(ownerId)}`);
    if (res.ok) {
      const data: unknown = await res.json();
      const entry = (data as { entry?: unknown } | null)?.entry as StandEntry | undefined;
      if (entry && typeof entry === "object" && entry.startup && typeof entry.startup === "object") {
        return { state: "found", entry };
      }
      return { state: "missing" };
    }
    /* A 404 here means one of two very different things, and the endpoint
       cannot tell them apart: there is no such stand, or this floor server
       predates the endpoint and 404s the ROUTE. The web app deploys itself
       on every push; the floor server is a box somebody has to update by
       hand, so those two are guaranteed to be out of step for a while.
       Ask the listing — which every version of the server has — before
       telling a founder their stand is gone. */
    const row = await standFromListing(base, ownerId);
    if (row) return { state: "found", entry: row };
    return { state: "missing" };
  } catch {
    // Nothing answered at all: the server is down or unreachable. That is
    // not the same as "this stand isn't up any more" and must not be
    // reported as if it were.
    return { state: "offline" };
  }
}

/** The same stand, dug out of the directory listing. Fallback only. */
async function standFromListing(base: string, ownerId: string): Promise<StandEntry | null> {
  try {
    const res = await fetch(`${base}/startups`);
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const list = (data as { startups?: unknown } | null)?.startups;
    if (!Array.isArray(list)) return null;
    for (const raw of list) {
      const row = raw as Partial<StandEntry> & { startup?: Startup };
      if (!row?.startup?.id) continue;
      const owner = row.ownerId ?? row.startup.id.replace(/^(claim|reg):/, "");
      if (owner !== ownerId) continue;
      return {
        ownerId,
        floorId: row.floorId ?? null,
        spotIndex: typeof row.spotIndex === "number" ? row.spotIndex : -1,
        online: Boolean(row.online),
        lastSeen: typeof row.lastSeen === "number" ? row.lastSeen : 0,
        ownerName: row.ownerName,
        startup: row.startup,
        slug: typeof row.slug === "string" ? row.slug : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export interface StandEntry {
  ownerId: string;
  floorId: string | null;
  spotIndex: number;
  online: boolean;
  lastSeen: number;
  ownerName?: string;
  startup: Startup;
  /** The public address (/stand/<slug>), once the server has minted one. */
  slug?: string | null;
}

/** The notes left at one stand. Guestbooks are keyed floor + "spot:<n>". */
export async function fetchGuestbook(
  floorId: string,
  spotIndex: number,
): Promise<{ from: string; text: string; ts: number }[]> {
  const base = httpBase();
  if (!base || !floorId || spotIndex < 0) return [];
  try {
    const res = await fetch(`${base}/guestbook?floor=${encodeURIComponent(floorId)}&key=spot:${spotIndex}`);
    if (!res.ok) return [];
    const data: unknown = await res.json();
    const list = (data as { entries?: unknown } | null)?.entries;
    return Array.isArray(list) ? (list as { from: string; text: string; ts: number }[]) : [];
  } catch {
    return [];
  }
}

/**
 * Sign a guestbook from off the floor.
 *
 * The floor signs over the websocket. This exists because a stand is no
 * longer always standing in a hall you can walk into — an absent founder's
 * stand lives at its permalink, and leaving them a note has to work from
 * there too.
 */
export async function signGuestbook(
  me: string,
  name: string,
  floorId: string,
  spotIndex: number,
  text: string,
): Promise<boolean> {
  const ok = await post("/guestbook/sign", {
    me,
    name,
    floor: floorId,
    key: `spot:${spotIndex}`,
    text,
    token: tokenFor(me),
    gs: guestSecret(),
  });
  return ok;
}

export function respondToRequest(
  me: string,
  meName: string,
  peer: string,
  accept: boolean,
  meStartup?: string,
): Promise<boolean> {
  return post("/social/respond", {
    me,
    meName,
    peer,
    accept,
    meStartup,
    token: tokenFor(me),
    gs: guestSecret(),
  });
}

export function sendSocialDm(
  from: string,
  fromName: string,
  to: string,
  text: string,
): Promise<boolean> {
  return post("/social/dm", { from, fromName, to, text, token: tokenFor(from), gs: guestSecret() });
}

/**
 * Put a startup in the site-wide registry the moment it's created — the
 * directory lists it (category chip included) before its founder ever
 * claims a floor stand. Fire-and-forget; offline saves stay local-only
 * until the next save while the server is up.
 */
export function registerStartup(me: string, startup: Startup): Promise<boolean> {
  return post("/startups/register", { me, startup, token: tokenFor(me), gs: guestSecret() });
}

/**
 * The same call, but reporting WHY it failed.
 *
 * The server can now refuse a listing on its content rather than on a
 * network problem, and a founder who is refused deserves a sentence rather
 * than a save that quietly did nothing. Returns "" on success, or the
 * server's own words. Offline stays silent on purpose: the local save
 * happened, the next one will push it, and that is not theirs to fix.
 */
export async function registerStartupChecked(me: string, startup: Startup): Promise<string> {
  const base = httpBase();
  if (!base || !me) return "";
  try {
    const res = await fetch(`${base}/startups/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ me, startup, token: tokenFor(me), gs: guestSecret() }),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { ok?: boolean; error?: string };
    return data.ok ? "" : data.error || "";
  } catch {
    return "";
  }
}

export function unregisterStartup(me: string): Promise<boolean> {
  return post("/startups/unregister", { me, token: tokenFor(me), gs: guestSecret() });
}

export async function fetchInbox(me: string, signal?: AbortSignal): Promise<InboxData | null> {
  const base = httpBase();
  if (!base || !me) return null;
  try {
    // Credentials travel in headers, not the query string — URLs end up in
    // proxy logs and browser history.
    const tok = tokenFor(me);
    const gs = guestSecret();
    const headers: Record<string, string> = {};
    if (tok) headers.Authorization = `Bearer ${tok}`;
    if (gs) headers["X-FF-GS"] = gs;
    const res = await fetch(`${base}/social?me=${encodeURIComponent(me)}`, { signal, headers });
    if (!res.ok) return null;
    return (await res.json()) as InboxData;
  } catch {
    return null;
  }
}

/**
 * Poll the inbox while mounted. Returns [inbox, refresh, reachable].
 * A null profile id (pre-hydration) polls nothing.
 */
export function useInbox(
  profileId: string,
  intervalMs = 10_000,
): [InboxData, () => void, boolean] {
  const [inbox, setInbox] = useState<InboxData>(EMPTY_INBOX);
  const [reachable, setReachable] = useState(true);
  const idRef = useRef(profileId);
  idRef.current = profileId;

  const refresh = useCallback(() => {
    const id = idRef.current;
    if (!id) return;
    void fetchInbox(id).then((data) => {
      setReachable(data !== null);
      if (data) setInbox(data);
    });
  }, []);

  useEffect(() => {
    if (!profileId) return;
    refresh();
    const t = setInterval(refresh, intervalMs);
    return () => clearInterval(t);
  }, [profileId, intervalMs, refresh]);

  return [inbox, refresh, reachable];
}

/**
 * Live social pushes for pages that aren't on a floor: opens a lightweight
 * ws connection to the invisible "__inbox" room, where the server delivers
 * connect_request / connect_accept / social_dm events instantly. Reconnects
 * every 5s while mounted; silently offline when the server is down.
 */
export function useSocialPush(
  profileId: string,
  onEvent: (ev: { t: string } & Record<string, unknown>) => void,
): void {
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;

  useEffect(() => {
    if (!profileId || typeof window === "undefined") return;
    let ws: WebSocket | null = null;
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | null = null;

    const open = () => {
      if (closed) return;
      const base = httpBase().replace(/^http/, "ws");
      if (!base) return;
      try {
        ws = new WebSocket(`${base}/ws?floor=__inbox`);
      } catch {
        retry = setTimeout(open, 5000);
        return;
      }
      ws.onopen = () => {
        ws?.send(
          JSON.stringify({
            t: "join",
            player: { id: profileId, name: "inbox", look: { skin: 0, outfit: 0, hair: 0 } },
            s: { x: 0, y: 0, dir: "down", moving: false },
            token: tokenFor(profileId),
            gs: guestSecret(),
          }),
        );
      };
      ws.onmessage = (e) => {
        try {
          const ev = JSON.parse(String(e.data)) as { t: string } & Record<string, unknown>;
          if (ev.t === "social_dm" || ev.t === "connect_request" || ev.t === "connect_accept") {
            cbRef.current(ev);
          }
        } catch {
          // malformed frame — ignore
        }
      };
      ws.onclose = () => {
        ws = null;
        if (!closed) retry = setTimeout(open, 5000);
      };
      ws.onerror = () => {
        // close follows; the close handler schedules the retry
      };
    };

    open();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      try {
        ws?.close(1000);
      } catch {
        // already closed
      }
    };
  }, [profileId]);
}

/** localStorage-backed "last seen" per DM thread, for unread dots. */
const SEEN_KEY = "founderfloor:dm-seen";

export function getSeenMap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function markThreadSeen(peerId: string, ts: number): void {
  if (typeof window === "undefined") return;
  const map = getSeenMap();
  map[peerId] = Math.max(map[peerId] ?? 0, ts);
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(map));
  } catch {
    // storage full/blocked — unread dots degrade gracefully
  }
}

/** Count threads with messages newer than their seen mark (not from me). */
export function unreadCount(inbox: InboxData, me: string): number {
  const seen = getSeenMap();
  let n = 0;
  for (const [peerId, msgs] of Object.entries(inbox.threads)) {
    const last = msgs.length ? msgs[msgs.length - 1] : null;
    if (last && last.fromId !== me && last.ts > (seen[peerId] ?? 0)) n++;
  }
  return n + inbox.requests.length;
}

// ------------------------------------------------------------- build log

export interface LogEntry {
  text: string;
  ts: number;
}

/**
 * Write (or, with `remove`, delete) an entry in your own build log — the
 * founder-written record the public stand page shows. The server answers
 * with the newest five, which is exactly what the page renders, so the
 * caller can swap its list for the reply and be showing the truth.
 */
export async function postBuildLog(
  me: string,
  body: { text?: string; remove?: number },
): Promise<LogEntry[] | null> {
  const base = httpBase();
  if (!base || !me) return null;
  try {
    const res = await fetch(`${base}/stand/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ me, ...body, token: tokenFor(me), gs: guestSecret() }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; log?: LogEntry[]; error?: string };
    if (!data.ok || !Array.isArray(data.log)) return null;
    return data.log.filter((e) => e && typeof e.text === "string" && typeof e.ts === "number");
  } catch {
    return null;
  }
}
