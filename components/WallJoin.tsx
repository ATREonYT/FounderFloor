"use client";

/**
 * "Put your startup on the wall" — the one form, wherever it is mounted.
 *
 * It is deliberately self-contained: it talks to the floor server directly
 * and never links anywhere. That is not tidiness, it is the only thing
 * that works while the launch gate is on, since every in-app route rewrites
 * to /soon and a "go and edit your stand" button would send people in a
 * circle. Signed in or not, they finish here.
 *
 * WHY AN ACCOUNT IS REQUIRED. An open link box on a public page is a spam
 * magnet with no downside for the spammer. Requiring an account is worth
 * more than any filter: it costs a working email address, it puts every
 * entry behind the existing per-IP rate limit, it gives a name to ban, and
 * it means the same wall entry is also a stand the person can walk up to
 * on Sunday. The wall is the front of the funnel, not a guestbook.
 *
 * The startup lands through the SAME path the profile editor uses, so a
 * wall entry is a real listing from the moment it is made: it shows in the
 * directory, and when its founder claims a spot it is already their stand.
 */

import { useState } from "react";
import { getAuth, register } from "@/lib/auth";
import { registerStartupChecked } from "@/lib/social";
import { useAppState } from "@/lib/store";
import type { Startup } from "@/lib/types";
import Spec from "@/components/Spec";

const SWATCH = { carpet: "#C2B8A3", banner: "#5C5548" };

export default function WallJoin({ className = "" }: { className?: string }) {
  const [state, actions] = useAppState();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [link, setLink] = useState("");
  const [you, setYou] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const signedIn = getAuth() !== null;
  const emailOk = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email.trim());
  const ready =
    name.trim().length > 0 &&
    oneLiner.trim().length > 0 &&
    (signedIn || (you.trim().length > 1 && emailOk && password.length >= 8));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !ready) return;
    setBusy(true);
    setErr("");

    let me = state.profile.id;
    let founder = state.profile.name;

    if (!signedIn) {
      const r = await register(email.trim(), you.trim(), password);
      if (typeof r === "string") {
        setBusy(false);
        setErr(r);
        return;
      }
      me = r.id;
      founder = r.name;
    }

    const startup: Startup = {
      id: "mine",
      name: name.trim(),
      oneLiner: oneLiner.trim(),
      pitch: "",
      founder: founder || you.trim() || "founder",
      founderLook: state.profile.look,
      category: "Uncategorized",
      goal: "Survive",
      goalProgress: 0,
      verifiedRevenue: 0,
      seekingCofounder: false,
      // Cleaned by sanitizeLink() server-side; a link it refuses is simply
      // dropped, which costs the link and not the listing.
      link: link.trim() || undefined,
      booth: {
        carpet: SWATCH.carpet,
        banner: SWATCH.banner,
        sign: name.trim().slice(0, 12).toUpperCase(),
        glyph: "star",
        pattern: "solid",
      },
    };

    // Local first, then the identity swap, then the server. The stand has
    // to be in local state BEFORE the identity change, because that is what
    // schedules the first push for the new account — the other order
    // uploads an empty account and leaves the stand behind on this device.
    actions.saveMyStartup(startup);
    if (!signedIn) actions.setIdentity(me, founder);
    // The server can refuse a listing on its content, and this form is the
    // most likely place for that to happen — it is the one a stranger
    // fills in first. Say what it said.
    const refused = await registerStartupChecked(me, startup);
    setBusy(false);
    if (refused) {
      setErr(refused);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className={`border border-verify/50 bg-panel p-5 ${className}`}>
        <Spec className="text-verify">You are on the wall</Spec>
        <p className="mt-1.5 font-display text-lg">{name.trim()} is up.</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Reload to see it. When the doors open, that entry is already your
          stand — walk in and stand at it.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className={`border border-line bg-panel p-5 ${className}`}>
        <Spec className="text-accent">Add yours</Spec>
        <p className="mt-1.5 font-display text-lg">
          Put your startup on the wall.
        </p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          Free, and it stays up. The same entry becomes your stand on the
          floor, so you are not filling in a form twice.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-press mt-4 min-h-[44px] rounded-md bg-accent-strong px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-accent-strong/90"
        >
          Add my startup
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`border border-line bg-panel p-5 ${className}`}>
      <Spec className="text-accent">Add yours</Spec>
      <p className="mt-1.5 font-display text-lg">Put your startup on the wall.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="micro mb-1.5 block text-muted">Startup</span>
          <input
            required
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            placeholder="What it's called"
            className="w-full rounded-md border border-line px-3 py-2.5 text-sm placeholder:text-muted/70"
          />
        </label>
        <label className="block">
          <span className="micro mb-1.5 block text-muted">Link (optional)</span>
          <input
            // NOT type="url": the browser's own validation refuses
            // "kettle.example.com" with "Please enter a URL", which is the
            // exact form most people type and the exact form the server
            // goes out of its way to accept. The field would silently
            // block the submit and blame the founder for it.
            type="text"
            inputMode="url"
            value={link}
            maxLength={200}
            onChange={(e) => setLink(e.target.value)}
            placeholder="yourstartup.com"
            className="w-full rounded-md border border-line px-3 py-2.5 text-sm placeholder:text-muted/70"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="micro mb-1.5 block text-muted">One-liner</span>
          <input
            required
            value={oneLiner}
            maxLength={90}
            onChange={(e) => setOneLiner(e.target.value)}
            placeholder="What it does, in one breath"
            className="w-full rounded-md border border-line px-3 py-2.5 text-sm placeholder:text-muted/70"
          />
        </label>

        {!signedIn && (
          <>
            <label className="block">
              <span className="micro mb-1.5 block text-muted">Your name</span>
              <input
                required
                value={you}
                maxLength={24}
                onChange={(e) => setYou(e.target.value)}
                placeholder="Shown next to the startup"
                className="w-full rounded-md border border-line px-3 py-2.5 text-sm placeholder:text-muted/70"
              />
            </label>
            <label className="block">
              <span className="micro mb-1.5 block text-muted">Email</span>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-line px-3 py-2.5 text-sm placeholder:text-muted/70"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="micro mb-1.5 block text-muted">
                Password — at least 8 characters
              </span>
              <input
                required
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-line px-3 py-2.5 text-sm"
              />
            </label>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || !ready}
          className="btn-press min-h-[44px] rounded-md bg-accent-strong px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-accent-strong/90 disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add to the wall"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-[44px] rounded-md px-3 py-2.5 text-sm text-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>

      {err && <p className="mt-3 text-sm text-accent">{err}</p>}
      {!signedIn && (
        <p className="micro mt-3 text-muted">
          {/* An account is the anti-spam mechanism, so it is worth saying
              why rather than making it look like a growth tactic. */}
          Adding your startup makes your account — that is what keeps the
          wall from filling with link spam, and it is the same account you
          walk in with on Sunday.
        </p>
      )}
    </form>
  );
}
