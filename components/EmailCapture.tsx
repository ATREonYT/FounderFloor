"use client";

/**
 * The one way to reach a visitor who liked the place but wasn't ready to
 * build a stand today. Two shapes:
 *
 *   variant="list"  — "tell me when it's busy" (landing page)
 *   variant="rsvp"  — "remind me before Open Doors" (lobby)
 *
 * Deliberately one field and one button: an email box that asks for a name
 * too is a form, and forms get abandoned. Failure never blocks — if the
 * floor server can't be reached the copy says so and offers the mailto.
 */

import { useState } from "react";
import { httpBase } from "@/lib/net";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact";

export default function EmailCapture({
  variant = "list",
  source = "landing",
  className = "",
}: {
  variant?: "list" | "rsvp";
  source?: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "already" | "error">("idle");

  const rsvp = variant === "rsvp";
  const valid = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "busy" || !valid) return;
    setState("busy");
    try {
      const res = await fetch(`${httpBase()}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `demoNight` is the wire name for "RSVP'd to the weekly event".
        // The event is Open Doors now; the field keeps its old name so
        // existing RSVPs on the server are not orphaned by a rename.
        body: JSON.stringify({ email: email.trim(), demoNight: rsvp, source }),
      });
      const r = await res.json();
      if (r.ok) setState(r.already ? "already" : "done");
      else setState("error");
    } catch {
      setState("error");
    }
  };

  if (state === "done" || state === "already") {
    return (
      <p className={`text-sm leading-relaxed text-verify ${className}`}>
        {state === "already"
          ? "You're already on the list — nothing more to do."
          : rsvp
            ? "You're on the list. We'll send one short reminder before it starts."
            : "You're on the list. Check your inbox for a one-line hello."}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={`ec-${variant}-${source}`}>
          Your email address
        </label>
        <input
          id={`ec-${variant}-${source}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
          placeholder="you@example.com"
          autoComplete="email"
          className="min-h-[44px] w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm placeholder:text-muted/60 sm:max-w-xs"
        />
        <button
          type="submit"
          disabled={state === "busy" || !valid}
          className="btn-press min-h-[44px] shrink-0 rounded-md bg-accent-strong px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-accent-strong/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "busy" ? "…" : rsvp ? "Remind me" : "Keep me posted"}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-muted">
        {state === "error" ? (
          <span className="text-accent">
            Couldn&rsquo;t reach the floor server — try again in a minute, or
            email{" "}
            <a href={CONTACT_MAILTO} className="underline">
              {CONTACT_EMAIL}
            </a>
            .
          </span>
        ) : rsvp ? (
          "One reminder before the next Open Doors. Nothing else, ever. Reply “unsubscribe” to stop."
        ) : (
          "No newsletter. We write when the floor is worth walking. Reply “unsubscribe” to stop."
        )}
      </p>
    </form>
  );
}
