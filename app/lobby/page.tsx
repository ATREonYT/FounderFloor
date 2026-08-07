"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { syncNow, useAppState } from "@/lib/store";
import { FLOORS } from "@/lib/data/floors";
import { TIER_ORDER, type AvatarLook } from "@/lib/types";
import AvatarPicker from "@/components/AvatarPicker";
import TierTag, { TIER_LABEL } from "@/components/TierTag";
import EventPill from "@/components/EventPill";
import LobbyPulse from "@/components/LobbyPulse";
import OpenDoorsCard from "@/components/OpenDoorsCard";
import FoundingSeatsCard from "@/components/FoundingSeatsCard";
import { usePresence } from "@/components/usePresence";

/**
 * First visit: a name is offered, never demanded. Making a stranger fill in
 * a form before they have seen anything is where most of them leave — so
 * the button works empty ("Just show me around"), walks them in as a
 * Visitor, and the name gets asked for later, when it actually matters.
 */
function FirstVisitPanel({
  onDone,
}: {
  onDone: (name: string, look: AvatarLook) => void;
}) {
  const [name, setName] = useState("");
  const [look, setLook] = useState<AvatarLook>({ skin: 1, outfit: 0, hair: 1 });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim().slice(0, 24);
    onDone(trimmed || `Visitor ${1 + Math.floor(Math.random() * 8999)}`, look);
  };

  return (
    <div className="mx-auto max-w-xl py-14">
      <h1 className="font-display text-3xl">Come on in.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Nothing to sign up for. Put a name on your badge if you want one — or
        walk in as a visitor and sort it out later. Either way it&rsquo;s
        stored on this device, not on a server.
      </p>
      <form onSubmit={submit} className="panel mt-8 flex flex-col gap-6 p-6">
        <div>
          <label htmlFor="lobby-name" className="micro mb-1.5 block text-muted">
            Your name <span className="normal-case text-muted/60">(optional)</span>
          </label>
          <input
            id="lobby-name"
            type="text"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Byron"
            autoComplete="name"
            className="min-h-[44px] w-full rounded-md border border-line px-3 py-2 text-sm placeholder:text-muted/70"
          />
        </div>
        <div>
          <span className="micro mb-2 block text-muted">Your look</span>
          <AvatarPicker look={look} onChange={setLook} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            type="submit"
            className="btn-press min-h-[44px] rounded-md bg-accent-strong px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-accent-strong/90"
          >
            {name.trim() ? "Enter the lobby →" : "Just show me around →"}
          </button>
          {!name.trim() && (
            <span className="text-xs text-muted">
              You&rsquo;ll walk in as a visitor — change it any time.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

/** The advertised floors — FOCUS MODE (lib/data/floors.ts) hides the rest. */
const openFloors = FLOORS.filter((f) => !f.hidden);

export default function LobbyPage() {
  const [state, actions] = useAppState();
  const [ready, setReady] = useState(false);
  const presence = usePresence();

  useEffect(() => {
    setReady(true);
  }, []);

  // Count the visit once the store is hydrated and the player exists —
  // rolls the "since you were away" mark and extends the day streak.
  useEffect(() => {
    if (ready && state.profile.name !== "") actions.recordVisit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, state.profile.name !== ""]);

  // Re-check the account's subscription every time the floor list is
  // opened: an entitlement granted moments ago (checkout webhook, admin
  // grant) must unlock the doors on this visit, not after a hard reload.
  useEffect(() => {
    if (ready) syncNow();
  }, [ready]);

  if (!ready) {
    return (
      <main className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
        <p className="text-sm text-muted">Opening the lobby…</p>
      </main>
    );
  }

  if (state.profile.name === "") {
    return (
      <main className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <FirstVisitPanel
          onDone={(name, look) => {
            actions.setName(name);
            actions.setLook(look);
          }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 pb-24 sm:px-8 sm:pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl">
            {openFloors.length > 1 ? "Pick a floor" : "The floor"}
          </h1>
          <EventPill />
          {state.visitStreak >= 2 && (
            <span className="micro rounded-sm border border-verify/40 px-1.5 py-0.5 text-verify">
              Day {state.visitStreak} streak
            </span>
          )}
        </div>
        <p className="text-sm text-muted">
          Walking as <span className="text-ink">{state.profile.name}</span> ·{" "}
          <Link href="/profile#identity" className="text-accent hover:underline">
            change
          </Link>{" "}
          ·{" "}
          <Link href="/directory" className="text-accent hover:underline">
            Directory
          </Link>
        </p>
      </div>

      <LobbyPulse
        me={state.profile.id}
        sub={state.sub}
        prevSeenAt={state.prevSeenAt}
        visitStreak={state.visitStreak}
        claims={state.claims}
      />

      {/* Tutorial entry: loud for newcomers, a quiet replay link for grads */}
      {!state.badges.includes("tutorial-grad") ? (
        <section
          aria-label="Tutorial"
          className="panel mt-6 flex flex-wrap items-center justify-between gap-4 border-accent/30 bg-accent-soft/30 p-5"
        >
          <div>
            <h2 className="font-display text-lg">New here? Take the tutorial round.</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Three minutes in a quiet practice hall with Pixel, our guide
              robot — walk, talk, react, connect. You leave knowing
              everything, with a badge to prove it.
            </p>
          </div>
          <Link
            href="/floor/tutorial-hall"
            onClick={() => actions.resetTutorial()}
            className="btn-press rounded-md bg-accent-strong px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-strong/90"
          >
            Start tutorial
          </Link>
        </section>
      ) : (
        <p className="micro mt-6 text-muted">
          Badge earned.{" "}
          <Link
            href="/floor/tutorial-hall"
            onClick={() => actions.resetTutorial()}
            className="underline hover:text-ink"
          >
            Replay the tutorial
          </Link>{" "}
          any time.
        </p>
      )}

      {/* The opening offer, above the weekly one: it expires by being taken
          rather than by a date, and it is the strongest reason a first-time
          visitor has to make an account instead of staying a guest. */}
      <FoundingSeatsCard />

      {/* The weekly moment that makes a quiet building worth returning to —
          a door while it's live, an email box the rest of the week. */}
      <OpenDoorsCard />

      {/* 2x2 from sm up when there are several floors — but a lone floor in
          a two-column grid sits in half the width with a hole beside it, so
          it goes full-width instead and reads as THE room. */}
      <div
        className={`stagger-children mt-8 grid gap-4 ${
          openFloors.length > 1 ? "sm:grid-cols-2" : ""
        }`}
      >
        {openFloors.map((floor) => {
          const locked = TIER_ORDER[state.sub] < TIER_ORDER[floor.tier];
          return (
            <article
              key={floor.id}
              className={`panel card-lift flex flex-col p-5 ${locked ? "opacity-70 saturate-[0.85]" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2
                  className={`font-display text-lg leading-snug ${
                    locked ? "text-muted" : ""
                  }`}
                >
                  {floor.name}
                </h2>
                <TierTag tier={floor.tier} />
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {floor.tagline}
              </p>
              {/* Say how busy it is either way. Hiding a zero doesn't make a
                  floor feel full — it just makes the walk in a surprise, and
                  "quiet right now" sets an honest expectation instead. */}
              <p className="micro mt-4 flex items-center gap-3 text-muted">
                <span>{floor.boothSpots.length} booths</span>
                {(presence[floor.id] ?? 0) > 0 ? (
                  <span className="flex items-center gap-1.5 text-verify">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 w-2 rounded-full bg-verify"
                    />
                    {presence[floor.id]} here now
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted/70">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 w-2 rounded-full bg-muted/40"
                    />
                    quiet right now
                  </span>
                )}
              </p>
              {locked ? (
                <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 8 8"
                    shapeRendering="crispEdges"
                    aria-hidden="true"
                    className="pixelated text-muted"
                  >
                    <rect x="2" y="0" width="4" height="1" fill="currentColor" />
                    <rect x="1" y="1" width="1" height="3" fill="currentColor" />
                    <rect x="6" y="1" width="1" height="3" fill="currentColor" />
                    <rect x="0" y="4" width="8" height="4" fill="currentColor" />
                  </svg>
                  <span className="text-sm text-muted">
                    {TIER_LABEL[floor.tier]} floor ·{" "}
                    <Link href="/profile#membership" className="text-accent hover:underline">
                      Upgrade in Profile
                    </Link>
                  </span>
                </div>
              ) : (
                <Link
                  href={`/floor/${floor.id}`}
                  className="mt-4 rounded-md bg-ink px-4 py-2 text-center text-sm text-paper hover:bg-ink/85"
                >
                  Enter
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
