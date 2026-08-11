"use client";

/**
 * The header bell: the things that happened while you were on another page —
 * connection requests waiting on an answer, connections that landed, and
 * what's on the calendar next. It replaces NavConnections, which spent a
 * poller and a websocket on a single dot next to a link.
 *
 * Deliberately NOT the unread-DM count. The Messenger launcher already owns
 * that number, and two badges quoting different figures for the same inbox is
 * worse than one badge.
 *
 * It renders inside <header data-site-nav> as a SIBLING of the nav rather
 * than a child of it. The nav is overflow-x-auto, and per the overflow spec
 * `auto` on one axis makes the box a scroll container on both — a panel
 * opened from in there gets clipped, and on a phone the button itself scrolls
 * out of view with the rest of the row.
 *
 * Living in the header is also how it disappears on floors: app/globals.css
 * ends with `body[data-on-floor] header[data-site-nav] { display: none }`, and
 * display:none takes the whole subtree with it — the panel included, even
 * though the panel is position:fixed, because a box that is never generated
 * cannot be positioned. Nothing here has to know what a floor is.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAppState } from "@/lib/store";
import { respondToRequest, useInbox, useSocialPush } from "@/lib/social";
import { useUpcomingEvents } from "@/components/usePresence";
import { fmtCountdown } from "@/lib/data/events";

/** 12x11 pixel handbell, drawn with rects like the chat bubble and envelope. */
function PixelBell({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  const px = size / 12;
  const r = (x: number, y: number, w: number, h: number, key: string) => (
    <rect key={key} x={x * px} y={y * px} width={w * px} height={h * px} />
  );
  return (
    <svg
      width={size}
      height={(size * 11) / 12}
      viewBox={`0 0 ${size} ${(size * 11) / 12}`}
      aria-hidden="true"
      shapeRendering="crispEdges"
      // currentColor rather than a hex default: this one sits on the paper
      // header and has to follow the button's own muted -> ink hover, which a
      // baked-in fill would ignore.
      fill={color}
    >
      {r(5, 0, 2, 1, "handle")}
      {r(4, 1, 4, 1, "crown")}
      {/* the dome, drawn as two stepped edges — filled would read as a blob
          at 20px next to the outlined chat bubble */}
      {r(3, 2, 1, 2, "l1")}
      {r(8, 2, 1, 2, "r1")}
      {r(2, 4, 1, 2, "l2")}
      {r(9, 4, 1, 2, "r2")}
      {r(1, 6, 1, 2, "l3")}
      {r(10, 6, 1, 2, "r3")}
      {r(0, 8, 12, 1, "rim")}
      {r(5, 9, 2, 2, "clapper")}
    </svg>
  );
}

/**
 * localStorage "last seen" mark, the same shape as the DM seen-map in
 * lib/social.ts: a record of id -> the timestamp of the version you saw.
 *
 * Storing the ITEM's timestamp rather than the moment you looked is what
 * makes events work at all. An event carries no created-at, only startMs, and
 * startMs is by definition in the future — so a single "you last looked at
 * 14:02" mark would leave every event on the calendar permanently unread.
 *
 * One map, two namespaces, hence the key prefixes: a peer id and an event id
 * come from different servers and there is nothing stopping them colliding.
 */
const BELL_SEEN_KEY = "founderfloor:bell-seen";

function getBellSeen(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BELL_SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function markBellSeen(marks: Record<string, number>): void {
  if (typeof window === "undefined") return;
  const map = getBellSeen();
  for (const [key, ts] of Object.entries(marks)) {
    map[key] = Math.max(map[key] ?? 0, ts);
  }
  try {
    window.localStorage.setItem(BELL_SEEN_KEY, JSON.stringify(map));
  } catch {
    // storage full or blocked — the pip just stops clearing, which is a worse
    // bell but not a broken page
  }
}

function relativeTime(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** How many connections to list before deferring to the Connections page. */
const CONNECTION_ROWS = 6;

export default function NotificationBell() {
  const [state, actions] = useAppState();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [seenTick, setSeenTick] = useState(0);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);
  const [host, setHost] = useState<Element | null>(null);
  useEffect(() => setHost(document.body), []);

  // A guest who hasn't given a name has no identity on the floor server, so
  // there is nothing to fetch for them. The bell still renders and still
  // shows the calendar — it is just empty of people.
  // Nothing to poll for a nameless guest, and nothing to poll FOR on a
  // floor: the header is display:none there, which stops the boxes being
  // generated but does not unmount the hooks. Messenger draws the same
  // line for the same reason.
  const onFloor = pathname?.startsWith("/floor/") ?? false;
  const me = mounted && !onFloor && state.profile.name ? state.profile.id : "";
  const [inbox, refresh] = useInbox(me, 60_000);
  useSocialPush(me, () => refresh());
  const events = useUpcomingEvents(onFloor ? 0 : 60_000);

  const now = Date.now();
  const requests = [...inbox.requests].sort((a, b) => b.ts - a.ts);
  const connections = [...inbox.connections].sort((a, b) => b.ts - a.ts);
  // An event that has already finished is history, not news; one that has
  // started but not ended is still worth a line.
  const upcoming = events
    .filter((e) => (e.endMs ?? e.startMs) > now)
    .sort((a, b) => a.startMs - b.startMs);

  const seen = ((): Record<string, number> => {
    void seenTick;
    return getBellSeen();
  })();

  /* A first visit is not a backlog. With no mark stored, everything on the
     calendar reads as new, and a stranger on the landing page gets an
     orange pip a second after arrival for events they have not asked
     about — the only notification on the site that fires at someone who
     has done nothing. Treat "never looked" as "nothing new yet". */
  const firstRun = Object.keys(seen).length === 0;

  // Requests are not seen-marked: they are a queue of things to answer, and
  // they leave the count when they are answered, not when they are glanced at.
  const freshConnections = firstRun
    ? []
    : connections.filter((c) => c.ts > (seen[`conn:${c.peerId}`] ?? 0));
  const freshEvents = firstRun
    ? []
    : upcoming.filter((e) => e.startMs > (seen[`event:${e.id}`] ?? 0));
  // Capped where the panel is capped: a badge promising nine when the list
  // shows six, and silently marking the other three read, is a lie twice.
  const count =
    requests.length + Math.min(freshConnections.length, CONNECTION_ROWS) + freshEvents.length;

  // Refs so the mark-seen effect can write the current set without listing
  // every item in its dependency array.
  const marksRef = useRef<Record<string, number>>({});
  const marks: Record<string, number> = {};
  for (const c of connections) marks[`conn:${c.peerId}`] = c.ts;
  for (const e of upcoming) marks[`event:${e.id}`] = e.startMs;
  marksRef.current = marks;

  // What was unseen at the moment the panel opened, frozen. The rows read
  // their "new" marks off this rather than off the live map, because opening
  // stamps everything seen — against the live map the marks would appear for
  // one frame and then vanish under the reader.
  const seenAtOpenRef = useRef<Record<string, number>>({});

  // Opening stamps the mark; the signature keeps it stamping for anything
  // that lands while the panel is still open.
  const signature = Object.entries(marks)
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  useEffect(() => {
    if (!open) return;
    markBellSeen(marksRef.current);
    setSeenTick((t) => t + 1);
  }, [open, signature]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent): void => {
      const target = e.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      // The launcher toggles itself on click. Closing here as well would
      // close on pointerdown and reopen on the click that follows, so the
      // button would look dead.
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const toggle = (): void => {
    if (!open) seenAtOpenRef.current = getBellSeen();
    setOpen((o) => !o);
  };

  const [busy, setBusy] = useState<string | null>(null);

  const respond = async (peerId: string, accept: boolean): Promise<void> => {
    if (busy) return;
    setBusy(peerId);
    const req = inbox.requests.find((r) => r.from.id === peerId);
    /* Server FIRST, then local state.
       The other way round mints money: addConnection credits 15 tickets and
       raises connHigh, which is a high-water mark that never comes back
       down — so an Accept that the server never received (offline, or
       already answered on another device) left behind a connection nobody
       else can see and tickets nobody earned. */
    const ok = await respondToRequest(
      me,
      state.profile.name,
      peerId,
      accept,
      state.myStartup?.name,
    );
    setBusy(null);
    if (!ok) return;
    if (accept && req) {
      actions.addConnection({
        startupId: req.from.startupName ? `claim:${peerId}` : undefined,
        name: req.from.startupName ?? req.from.name,
        founder: req.from.name,
        floorId: "",
        peerId,
      });
    }
    refresh();
  };

  const shownConnections = connections.slice(0, CONNECTION_ROWS);
  const nothingAtAll =
    requests.length === 0 && connections.length === 0 && upcoming.length === 0;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          open ? "Close notifications" : `Notifications${count ? ` (${count} new)` : ""}`
        }
        className="btn-press relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-line/50 hover:text-ink"
      >
        <PixelBell />
        {count > 0 && (
          // Inside the button's box, not hung off its corner like the chat
          // launcher's: this one sits at the end of the header row, where the
          // page's own edge is a few pixels away at 360px.
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-strong px-1 text-[10px] font-medium text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open &&
        host &&
        /* Portalled out of the header on purpose.
           The header is `sticky top-0 z-40`, and position:sticky with a
           z-index makes it a stacking context — so a panel inside it is
           capped at the header's 40 no matter what z-index it asks for.
           The chat launcher is z-40 at body level and comes later in the
           DOM, so it won the overlap and stole taps from the panel's own
           footer link at 360px. Out here the number means what it says:
           above the chat chrome at 40, below MailToast at 50, whose six
           seconds of "new message" still has to land on top. */
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Notifications"
            className="glass anim-in fixed right-3 top-14 z-[45] flex max-h-[min(560px,calc(100svh-72px))] w-[340px] max-w-[calc(100vw-24px)] flex-col shadow-float"
          >
          <div className="flex items-center gap-2 border-b border-line px-3">
            <span className="font-display text-base">Notifications</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
              className="ml-auto flex h-11 w-11 items-center justify-center rounded-sm leading-none text-muted hover:text-ink"
            >
              ×
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {nothingAtAll && (
              // border-b so the footer link keeps its rule: every other state
              // gets one from the last section's own bottom border.
              <p className="border-b border-line p-4 text-sm text-muted">
                Nothing waiting. Requests, new connections and what&rsquo;s on
                the calendar turn up here.
              </p>
            )}

            {requests.length > 0 && (
              <section aria-label="Waiting on you" className="border-b border-line p-3">
                <h2 className="micro text-accent">Waiting on you</h2>
                <ul className="mt-2 flex flex-col gap-2">
                  {requests.map((req) => (
                    <li key={req.from.id} className="rounded-md border border-line p-2">
                      <p className="truncate text-sm text-ink">
                        {req.from.name}
                        {req.from.startupName && (
                          <span className="text-muted"> · {req.from.startupName}</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">asked {relativeTime(req.ts)}</p>
                      <div className="mt-2 flex gap-2">
                        {/* Both disabled while the round trip is in flight.
                            The row only disappears when the refetch lands,
                            which is two round trips on a phone — long enough
                            to tap Accept twice, or Accept and then Decline. */}
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => void respond(req.from.id, true)}
                          className="btn-press min-h-[44px] flex-1 rounded-md bg-accent-strong px-3 text-sm font-medium text-white hover:bg-accent-strong/90 disabled:opacity-50"
                        >
                          {busy === req.from.id ? "…" : "Accept"}
                        </button>
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => void respond(req.from.id, false)}
                          className="btn-press min-h-[44px] flex-1 rounded-md border border-line px-3 text-sm text-muted hover:border-ink hover:text-ink disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {connections.length > 0 && (
              <section aria-label="Connections" className="border-b border-line p-3">
                <h2 className="micro text-muted">Connections</h2>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {shownConnections.map((c) => {
                    const isNew = c.ts > (seenAtOpenRef.current[`conn:${c.peerId}`] ?? 0);
                    return (
                      <li key={c.peerId} className="flex items-baseline gap-2">
                        {isNew && (
                          <span
                            aria-label="New"
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                          />
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm text-ink">
                          {c.peerName}
                          {c.peerStartup && (
                            <span className="text-muted"> · {c.peerStartup}</span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs text-muted">
                          {relativeTime(c.ts)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {connections.length > shownConnections.length && (
                  <p className="mt-2 text-xs text-muted">
                    and {connections.length - shownConnections.length} more.
                  </p>
                )}
              </section>
            )}

            {upcoming.length > 0 && (
              <section aria-label="Coming up" className="border-b border-line p-3">
                <h2 className="micro text-muted">Coming up</h2>
                <ul className="mt-2 flex flex-col gap-2">
                  {upcoming.map((e) => {
                    const isNew = e.startMs > (seenAtOpenRef.current[`event:${e.id}`] ?? 0);
                    const msLeft = e.startMs - now;
                    // fmtCountdown says "now" under a minute, which reads as
                    // "in now" once this puts "in" in front of it.
                    const when =
                      msLeft <= 0
                        ? "on now"
                        : msLeft < 60_000
                          ? "starting"
                          : `in ${fmtCountdown(msLeft)}`;
                    const body = (
                      <>
                        <span className="flex items-baseline gap-2">
                          {isNew && (
                            <span
                              aria-label="New"
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                            />
                          )}
                          <span className="min-w-0 flex-1 truncate text-sm text-ink">
                            {e.title}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {when}
                          {e.where ? ` · ${e.where}` : ""}
                        </span>
                        {e.blurb && (
                          <span className="block truncate text-xs text-muted">{e.blurb}</span>
                        )}
                      </>
                    );
                    // A row with a href that isn't clickable is a dead end, so
                    // the ones that have somewhere to go become links.
                    return (
                      <li key={e.id}>
                        {e.href ? (
                          <Link
                            href={e.href}
                            onClick={() => setOpen(false)}
                            className="btn-press flex min-h-[44px] flex-col justify-center rounded-md border border-line px-2 py-1.5 hover:border-muted"
                          >
                            {body}
                          </Link>
                        ) : (
                          <div className="flex min-h-[44px] flex-col justify-center rounded-md border border-line px-2 py-1.5">
                            {body}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>

          <Link
            href="/connections"
            onClick={() => setOpen(false)}
            className="flex min-h-[44px] shrink-0 items-center justify-center px-3 text-sm text-muted hover:text-ink"
          >
            Connections →
          </Link>
          </div>,
          host,
        )}
    </>
  );
}
