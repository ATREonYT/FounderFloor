"use client";

/**
 * Everything on a public stand page that needs a signed-in browser:
 * connecting, signing the guestbook, walking over, the owner's build-log
 * composer, and the copy-embed block. Strictly additive — the page above
 * this island reads complete without it, which is the whole contract of
 * the public address.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/store";
import { TIER_ORDER, type SubTier } from "@/lib/types";
import {
  buildCard,
  fetchGuestbook,
  postBuildLog,
  sendConnectRequest,
  signGuestbook,
  useInbox,
  type LogEntry,
  type RequestState,
} from "@/lib/social";
import CopyEmbed from "@/components/CopyEmbed";
import Toast, { type ToastData } from "@/components/Toast";

interface Note {
  from: string;
  text: string;
  ts: number;
}

function ago(ts: number): string {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60_000));
  if (mins < 60) return mins < 1 ? "just now" : `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export default function StandExtras({
  refSlug,
  ownerId,
  founder,
  startupName,
  floorId,
  floorTier,
  floorName,
  spotIndex,
  online,
  log,
}: {
  refSlug: string;
  ownerId: string;
  founder: string;
  startupName: string;
  floorId: string | null;
  floorTier: SubTier | null;
  floorName: string | null;
  spotIndex: number;
  online: boolean;
  log: LogEntry[];
}) {
  const [state] = useAppState();
  const stateRef = useRef(state);
  stateRef.current = state;
  const me = state.profile.id;
  const isMine = me === ownerId;
  const [inbox, refreshInbox] = useInbox(me, 20_000);
  const [toast, setToast] = useState<ToastData | null>(null);

  // ---- guestbook
  const [notes, setNotes] = useState<Note[]>([]);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  useEffect(() => {
    if (!floorId || spotIndex < 0) return;
    let dead = false;
    void fetchGuestbook(floorId, spotIndex).then((book) => {
      if (!dead) setNotes(book);
    });
    return () => {
      dead = true;
    };
  }, [floorId, spotIndex]);

  const sign = useCallback(async (): Promise<void> => {
    if (!floorId || spotIndex < 0) return;
    const text = note.trim();
    if (!text) return;
    setSending(true);
    const ok = await signGuestbook(me, stateRef.current.profile.name, floorId, spotIndex, text);
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
  }, [floorId, spotIndex, me, note]);

  // ---- connect
  const connected = inbox.connections.some((c) => c.peerId === ownerId);
  const requested = inbox.outgoing.includes(ownerId);
  const canConnect = !isMine && !connected && !requested && Boolean(state.profile.name);
  const connect = useCallback((): void => {
    void sendConnectRequest(buildCard(stateRef.current), ownerId).then((st: RequestState) => {
      if (st !== "failed") refreshInbox();
      const who = founder || "them";
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
  }, [ownerId, founder, refreshInbox]);

  // ---- the owner's log composer
  const [entries, setEntries] = useState<LogEntry[]>(log);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const post = useCallback(async (): Promise<void> => {
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    const next = await postBuildLog(me, { text });
    setPosting(false);
    if (next) {
      setEntries(next);
      setDraft("");
      setToast({ id: Date.now(), text: "Logged. It's on your public page now." });
    } else {
      setToast({ id: Date.now(), text: "That didn't save — try again in a moment." });
    }
  }, [draft, me]);
  const remove = useCallback(
    async (ts: number): Promise<void> => {
      const next = await postBuildLog(me, { remove: ts });
      if (next) setEntries(next);
    },
    [me],
  );

  return (
    <>
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

        {floorId &&
          floorTier &&
          (TIER_ORDER[state.sub] >= TIER_ORDER[floorTier] ? (
            <Link
              href={`/floor/${floorId}?spot=${spotIndex}`}
              className="rounded-md border border-ink px-3 py-2 text-sm hover:bg-panel"
            >
              {online ? `Walk over — they're on ${floorName}` : `Find it on ${floorName}`}
            </Link>
          ) : (
            <Link
              href="/profile#membership"
              className="rounded-md border border-line px-3 py-2 text-sm text-muted hover:border-ink hover:text-ink"
            >
              Needs a paid floor plan
            </Link>
          ))}
      </div>

      {/* The composer, owners only. The page above already renders the log
          for everyone; this writes it, shows what just landed, and lets a
          typo come back out. */}
      {isMine && (
        <section className="mt-8 border-t border-line pt-5" aria-label="Write your build log">
          <h2 className="font-display text-xl">
            {entries.length > 0 ? "Write the next entry" : "Start your build log"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            What did you ship? One or two sentences. It goes on this page,
            newest first — the last five show.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={draft}
              maxLength={280}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void post();
              }}
              placeholder="Shipped the thing that was broken all week."
              className="min-h-[44px] flex-1 rounded-md border border-line px-3 text-sm placeholder:text-muted/60"
            />
            <button
              type="button"
              onClick={() => void post()}
              disabled={posting || !draft.trim()}
              className="btn-press min-h-[44px] rounded-md bg-ink px-4 text-sm text-paper hover:bg-ink/85 disabled:opacity-50"
            >
              {posting ? "Saving…" : "Log it"}
            </button>
          </div>
          {entries.length > 0 && (
            <ul className="mt-4 flex flex-col divide-y divide-line rounded-md border border-line">
              {entries.map((e) => (
                <li key={e.ts} className="flex items-start justify-between gap-3 px-3 py-2">
                  <span className="min-w-0">
                    <span className="micro block text-xs text-muted">{ago(e.ts)}</span>
                    <span className="block text-sm leading-snug">{e.text}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void remove(e.ts)}
                    className="micro shrink-0 text-muted hover:text-ink"
                  >
                    remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Take the stand with you: the embed, owners only. */}
      {isMine && <CopyEmbed slug={refSlug} startupName={startupName} />}

      {/* The guestbook — other people's notes, kept clearly apart from the
          founder's own log. On the floor you can only sign a stand you can
          walk up to; this is the address that always works. */}
      {floorId && spotIndex >= 0 && (
        <section className="mt-8 border-t border-line pt-5" aria-label="Guestbook">
          <h2 className="font-display text-xl">Guestbook</h2>
          <p className="mt-1 text-sm text-muted">
            Founders read these when they come back. Say something worth coming back for.
          </p>
          {!isMine && state.profile.name && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={note}
                maxLength={200}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void sign();
                }}
                placeholder={`A note for ${founder || "the founder"}`}
                className="min-h-[44px] flex-1 rounded-md border border-line px-3 text-sm placeholder:text-muted/60"
              />
              <button
                type="button"
                onClick={() => void sign()}
                disabled={sending || !note.trim()}
                className="btn-press min-h-[44px] rounded-md border border-ink px-4 text-sm hover:bg-panel disabled:opacity-50"
              >
                Sign
              </button>
            </div>
          )}
          {notes.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-3">
              {notes.map((n, i) => (
                <li key={`${n.ts}-${i}`} className="flex flex-col gap-0.5">
                  <span className="micro text-xs text-muted">
                    {n.from || "someone"} · {ago(n.ts)}
                  </span>
                  <p className="max-w-prose text-sm leading-relaxed">{n.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Nobody has signed yet.</p>
          )}
        </section>
      )}

      {toast && <Toast toast={toast} />}
    </>
  );
}
