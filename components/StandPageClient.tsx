"use client";

/**
 * One founder's stand, on its own page — the permanent address of a booth.
 *
 * A hall shows who is there right now, so a stand comes down off the floor
 * when its founder closes the tab. This is where it keeps standing: read
 * the pitch, leave a note in the guestbook, ask to connect, whatever time
 * it happens to be where they live.
 *
 * The server half — app/stand/[ownerId]/page.tsx — fetches the same entry
 * for SEO and share-card metadata and hands it in as initialEntry, so the
 * first paint already carries the stand instead of a spinner.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/store";
import { floorById } from "@/lib/data/floors";
import { TIER_ORDER } from "@/lib/types";
import type { Startup } from "@/lib/types";
import {
  buildCard,
  fetchGuestbook,
  fetchStand,
  sendConnectRequest,
  signGuestbook,
  useInbox,
  type RequestState,
  type StandEntry,
} from "@/lib/social";
import StandRoom from "@/components/StandRoom";
import RankBadge from "@/components/RankBadge";
import TierTag, { TIER_LABEL } from "@/components/TierTag";
import Toast, { type ToastData } from "@/components/Toast";

interface Note {
  from: string;
  text: string;
  ts: number;
}

/** "3 minutes ago" / "yesterday" — plain words, no library. */
function ago(ts: number): string {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default function StandPageClient({
  ownerId,
  initialEntry = null,
}: {
  ownerId: string;
  initialEntry?: StandEntry | null;
}) {
  const [state] = useAppState();
  const [entry, setEntry] = useState<StandEntry | null>(initialEntry);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "offline">(
    initialEntry ? "ready" : "loading",
  );
  const [notes, setNotes] = useState<Note[]>([]);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const me = state.profile.id;
  const [inbox, refreshInbox] = useInbox(me, 20_000);

  useEffect(() => {
    let dead = false;
    const load = async (): Promise<void> => {
      const res = await fetchStand(ownerId);
      if (dead) return;
      if (res.state === "found") {
        setEntry(res.entry);
        setStatus("ready");
        if (res.entry.floorId && res.entry.spotIndex >= 0) {
          const book = await fetchGuestbook(res.entry.floorId, res.entry.spotIndex);
          if (!dead) setNotes(book);
        }
        return;
      }
      // Keep whatever is already on screen if a later poll fails — a page
      // that has been rendering a stand for a minute should not blank
      // itself because one refresh could not reach the server.
      setEntry((prev) => prev);
      setStatus((prev) => (prev === "ready" ? "ready" : res.state));
    };
    void load();
    // Stands expire and get packed up; a page left open shouldn't insist
    // that one is still there.
    const t = setInterval(() => void load(), 60_000);
    return () => {
      dead = true;
      clearInterval(t);
    };
  }, [ownerId]);

  const connect = useCallback((): void => {
    if (!entry) return;
    void sendConnectRequest(buildCard(stateRef.current), ownerId).then((st: RequestState) => {
      if (st !== "failed") refreshInbox();
      const who = entry.startup.founder || "them";
      setToast({
        id: Date.now(),
        text:
          st === "connected"
            ? `You and ${who} are connected.`
            : st === "already"
              ? `You've already asked ${who} — they haven't answered yet.`
              : st === "full"
                ? `${who}'s inbox is full right now. Try again later.`
                : st === "failed"
                  ? "That didn't send — check your connection."
                  : `Request sent to ${who}. They'll see your card.`,
      });
    });
  }, [entry, ownerId, refreshInbox]);

  const sign = useCallback(async (): Promise<void> => {
    if (!entry?.floorId || entry.spotIndex < 0) return;
    const text = note.trim();
    if (!text) return;
    setSending(true);
    const ok = await signGuestbook(
      me,
      stateRef.current.profile.name,
      entry.floorId,
      entry.spotIndex,
      text,
    );
    setSending(false);
    if (ok) {
      setNote("");
      setNotes((prev) => [
        { from: stateRef.current.profile.name || "a founder", text, ts: Date.now() },
        ...prev,
      ]);
      setToast({ id: Date.now(), text: "Signed. They'll see it next time they're in." });
    } else {
      setToast({ id: Date.now(), text: "That didn't go through — try again in a moment." });
    }
  }, [entry, me, note]);

  if (status === "loading") {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <p className="text-sm text-muted">Finding the stand…</p>
      </main>
    );
  }

  if (status === "offline" && !entry) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <h1 className="font-display text-3xl">Can&rsquo;t reach the floor right now</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          The stand is probably fine — the server that holds it isn&rsquo;t answering. Try
          again in a moment.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md border border-ink px-3 py-2 text-sm hover:bg-panel"
          >
            Try again
          </button>
          <Link
            href="/directory"
            className="rounded-md border border-line px-3 py-2 text-sm text-muted hover:border-ink hover:text-ink"
          >
            Back to the directory
          </Link>
        </div>
      </main>
    );
  }

  if (status === "missing" || !entry) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <h1 className="font-display text-3xl">This stand isn&rsquo;t up any more</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Either its founder packed it away, or it aged out — a stand nobody comes back to is
          taken down after a week so the spot goes to someone who will use it.
        </p>
        <Link
          href="/directory"
          className="mt-6 inline-flex rounded-md border border-ink px-3 py-2 text-sm hover:bg-panel"
        >
          Browse the directory
        </Link>
      </main>
    );
  }

  const s: Startup = entry.startup;
  const floor = entry.floorId ? floorById(entry.floorId) : undefined;
  const isMine = ownerId === me;
  const connected = inbox.connections.some((c) => c.peerId === ownerId);
  const requested = inbox.outgoing.includes(ownerId);
  const canConnect = !isMine && !connected && !requested && Boolean(state.profile.name);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <p className="micro text-muted">
        <Link href="/directory" className="hover:text-ink">
          Directory
        </Link>{" "}
        · {s.category || "Startup"}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-3xl leading-tight">{s.name}</h1>
        <RankBadge revenue={s.verifiedRevenue} />
        {s.tier && <TierTag tier={s.tier} />}
        {s.seekingCofounder && (
          <span className="micro rounded-sm border border-verify/40 px-1.5 py-0.5 text-verify">
            Seeking co-founder
          </span>
        )}
      </div>
      <p className="mt-1.5 text-base leading-snug text-muted">{s.oneLiner}</p>

      {/* The stand, drawn by the same code the hall draws it with.
          Capped at 480px: the room is 10x8 tiles, so its width sets its
          height, and at full column width it was 560px of mostly floor
          before the reader reached the pitch. */}
      <div className="mx-auto mt-5 w-full max-w-[480px] overflow-hidden rounded-md border border-line bg-panel">
        <StandRoom startup={s} ownerName={entry.ownerName} floorId={entry.floorId} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>
          {s.founder}
          {s.goal ? ` · working toward ${s.goal}` : ""}
        </span>
        {entry.online ? (
          <span className="flex items-center gap-1 text-verify">
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-verify" />
            on {floor?.name ?? "a floor"} right now
          </span>
        ) : entry.lastSeen ? (
          <span>last here {ago(entry.lastSeen)}</span>
        ) : null}
      </div>

      {s.pitch && (
        <p className="mt-5 max-w-prose whitespace-pre-line text-sm leading-relaxed">{s.pitch}</p>
      )}

      {s.link && (
        <p className="mt-3 text-sm">
          {/* A founder's own URL, same rules as the directory and the wall:
              no ranking credit passed on, no window.opener handed over. */}
          <a
            href={s.link}
            target="_blank"
            rel="nofollow ugc noopener noreferrer"
            className="text-accent underline underline-offset-2 hover:text-accent-strong"
          >
            {s.link.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "")}
          </a>
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {isMine ? (
          <Link
            href="/profile#booth"
            className="rounded-md border border-ink px-3 py-2 text-sm hover:bg-panel"
          >
            Edit your stand
          </Link>
        ) : connected ? (
          <span className="rounded-md border border-verify/50 px-3 py-2 text-sm text-verify">
            Connected
          </span>
        ) : requested ? (
          <span className="rounded-md border border-line px-3 py-2 text-sm text-muted">
            Request sent
          </span>
        ) : state.profile.name ? (
          <button
            type="button"
            onClick={connect}
            disabled={!canConnect}
            className="btn-press rounded-md bg-accent-strong px-3 py-2 text-sm font-medium text-white hover:bg-accent-strong/90"
          >
            Ask to connect
          </button>
        ) : (
          <Link
            href="/profile"
            className="rounded-md border border-ink px-3 py-2 text-sm hover:bg-panel"
          >
            Add your name to connect
          </Link>
        )}

        {floor &&
          (TIER_ORDER[state.sub] >= TIER_ORDER[floor.tier] ? (
            <Link
              href={`/floor/${floor.id}?spot=${entry.spotIndex}`}
              className="rounded-md border border-ink px-3 py-2 text-sm hover:bg-panel"
            >
              {entry.online ? `Walk over — they're on ${floor.name}` : `Find it on ${floor.name}`}
            </Link>
          ) : (
            <Link
              href="/profile#membership"
              className="rounded-md border border-line px-3 py-2 text-sm text-muted hover:border-ink hover:text-ink"
            >
              Needs {TIER_LABEL[floor.tier]}
            </Link>
          ))}
      </div>

      {/* The guestbook lives here now. On the floor you can only sign a
          stand you can walk up to, and an absent founder's stand is not on
          the floor to walk up to — this is the address that always works. */}
      {floor && entry.spotIndex >= 0 && (
        <section className="mt-10 border-t border-line pt-6" aria-label="Guestbook">
          <h2 className="font-display text-xl">Guestbook</h2>
          <p className="mt-1 text-sm text-muted">
            Founders read these when they come back. Say something worth coming back for.
          </p>
          {!isMine && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                placeholder={state.profile.name ? "Leave a note" : "Add a name on your profile first"}
                disabled={!state.profile.name || sending}
                aria-label="Your note"
                className="min-h-[44px] flex-1 rounded-md border border-line px-3 text-sm disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void sign()}
                disabled={!note.trim() || !state.profile.name || sending}
                className="btn-press min-h-[44px] rounded-md border border-ink px-3 text-sm hover:bg-panel disabled:opacity-50"
              >
                Sign
              </button>
            </div>
          )}
          <ul className="mt-4 flex flex-col gap-3">
            {notes.length === 0 && (
              <li className="text-sm text-muted">Nobody has signed yet.</li>
            )}
            {notes.map((n, i) => (
              <li key={`${n.ts}-${i}`} className="border-l-2 border-line pl-3">
                <p className="text-sm leading-snug">{n.text}</p>
                <p className="micro mt-1 text-muted">
                  {n.from} · {ago(n.ts)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Toast toast={toast} />
    </main>
  );
}
