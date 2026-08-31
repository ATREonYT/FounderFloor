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
  tone = "paper",
  className = "",
}: {
  variant?: "list" | "rsvp";
  source?: string;
  /**
   * THE GROUND THIS SITS ON. The form's quiet text is `muted`, which is
   * built for a light surface and measures 2.63:1 on blackout — invisible.
   * The landing CTA used to patch that from the outside with arbitrary
   * `[&_p]:` variants, which worked only for as long as every quiet line
   * happened to be a <p>: wrap one in a <span> and it silently goes
   * unreadable. The component now owns the answer instead.
   */
  tone?: "paper" | "ink";
  className?: string;
}) {
  const dark = tone === "ink";
  /* On a dark ground: paper at 60% (6.54:1) for quiet text, a translucent
     field instead of a white one, and the lifted accent for errors. */
  const quiet = dark ? "text-paper/60" : "text-muted";
  const field = dark
    ? "border-paper/25 bg-paper/10 text-paper placeholder:text-paper/60"
    : "border-line bg-paper placeholder:text-muted/60";
  const ghostBtn = dark
    ? "border-paper/40 text-paper hover:bg-paper/10"
    : "border-ink hover:bg-panel";
  const errorText = dark ? "text-accent-lift" : "text-accent";
  const linkHover = dark ? "hover:text-paper" : "hover:text-ink";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "already" | "error">("idle");
  /**
   * The plan question, asked only AFTER the address is in. Stating a plan
   * measurably raises show-up (a 287k-person field experiment: +4.1
   * points, +9.1 among people who live alone), and the reminder echoes it
   * back — but it never blocks the signup, and Skip is always there.
   */
  const [plan, setPlan] = useState("");
  const [planState, setPlanState] = useState<"ask" | "busy" | "sent" | "skipped">("ask");

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

  const sendPlan = async () => {
    const text = plan.trim().slice(0, 140);
    if (!text) return;
    setPlanState("busy");
    try {
      await fetch(`${httpBase()}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Same record, same endpoint — the server updates the plan and,
        // because the address is already on the list, mails nothing.
        body: JSON.stringify({ email: email.trim(), demoNight: rsvp, source, plan: text }),
      });
      setPlanState("sent");
    } catch {
      // The plan is a nice-to-have; a network hiccup must not undo the
      // signup story. Treat it as skipped.
      setPlanState("skipped");
    }
  };

  if (state === "done" || state === "already") {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <p className="text-sm leading-relaxed text-verify">
          {state === "already"
            ? "You're already on the list — nothing more to do."
            : rsvp
              ? "You're on the list. We'll send one short reminder before it starts."
              : "You're on the list. Check your inbox for a one-line hello."}
        </p>

        {rsvp && planState === "ask" && (
          <div className="flex flex-col gap-2">
            <label className={`text-xs ${quiet}`} htmlFor={`ec-plan-${source}`}>
              One more, entirely optional: what will you be working on that Sunday?
            </label>
            <div className="flex gap-2">
              <input
                id={`ec-plan-${source}`}
                type="text"
                value={plan}
                maxLength={140}
                onChange={(e) => setPlan(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void sendPlan();
                  }
                }}
                placeholder="Shipping the onboarding flow"
                className={`min-h-[40px] w-full rounded-md border px-3 py-2 text-sm ${field}`}
              />
              <button
                type="button"
                onClick={() => void sendPlan()}
                disabled={!plan.trim()}
                className={`btn-press min-h-[40px] shrink-0 rounded-md border px-3 text-sm disabled:opacity-50 ${ghostBtn}`}
              >
                Send
              </button>
              <button
                type="button"
                onClick={() => setPlanState("skipped")}
                className={`min-h-[40px] shrink-0 rounded-md px-2 text-sm ${quiet} ${linkHover}`}
              >
                Skip
              </button>
            </div>
          </div>
        )}
        {rsvp && planState === "busy" && <p className={`text-xs ${quiet}`}>Saving…</p>}
        {rsvp && planState === "sent" && (
          <p className={`text-xs ${quiet}`}>
            Noted — the reminder will ask how it went.
          </p>
        )}

        {rsvp && (
          <p className={`text-xs ${quiet}`}>
            <a href="/doors.ics" className={`underline underline-offset-2 ${linkHover}`}>
              Add Open Doors to your calendar
            </a>{" "}
            — repeats weekly, in your own time zone, with a 30-minute nudge.
          </p>
        )}
      </div>
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
          className={`min-h-[44px] w-full rounded-md border px-3 py-2.5 text-sm sm:max-w-xs ${field}`}
        />
        <button
          type="submit"
          disabled={state === "busy" || !valid}
          className="btn-press min-h-[44px] shrink-0 rounded-md bg-accent-strong px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-accent-strong/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "busy" ? "…" : rsvp ? "Remind me" : "Keep me posted"}
        </button>
      </div>
      <p className={`text-xs leading-relaxed ${quiet}`}>
        {state === "error" ? (
          <span className={errorText}>
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
