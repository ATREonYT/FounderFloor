"use client";

/**
 * Contract-cancellation page (§312k BGB "Kündigungsschaltfläche"): German
 * law requires that a consumer who could sign up online can also cancel
 * online, via a clearly labeled button, without logging in, and gets a
 * confirmation of when the cancellation arrived. This page is reachable
 * from the site footer ("Cancel your membership") on every page.
 */

import { useState } from "react";
import Link from "next/link";
import { httpBase } from "@/lib/net";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact";

export default function CancelPage() {
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [receivedAt, setReceivedAt] = useState<number | null>(null);

  const canSend = email.trim().includes("@");

  const submit = async () => {
    if (state === "busy" || !canSend) return;
    setState("busy");
    try {
      const res = await fetch(`${httpBase()}/cancel-contract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: email.trim(),
          text:
            `Cancellation of paid membership requested.` +
            (details.trim() ? ` Details: ${details.trim()}` : ""),
        }),
      });
      const r = await res.json();
      if (r.ok) {
        setReceivedAt(r.receivedAt ?? Date.now());
        setState("done");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="micro text-muted">CANCELLATION</p>
        <h1 className="mt-1 font-display text-3xl">Cancel your membership</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Use this page to cancel a paid FounderFloor membership. No login
          needed — just the email address you used at checkout. Cancelling
          stops future renewals; access you already paid for runs until the
          end of the current period. You can also cancel any time through
          Stripe&rsquo;s billing portal linked from your receipt emails, or by
          emailing{" "}
          <a href={CONTACT_MAILTO} className="underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </header>

      {state === "done" ? (
        <section className="panel p-6">
          <h2 className="font-display text-xl">Cancellation received</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Your cancellation arrived{" "}
            {receivedAt ? new Date(receivedAt).toLocaleString() : "just now"}.
            That timestamp is your record of when it took effect — keep this
            page open or screenshot it. You&rsquo;ll get a confirmation with
            the details at the address you gave, and the renewal will be
            stopped in Stripe.
          </p>
        </section>
      ) : (
        <section className="panel flex flex-col gap-4 p-6">
          <label className="flex flex-col gap-1.5">
            <span className="micro text-muted">
              Email you used at checkout (required)
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              placeholder="you@example.com"
              className="w-full max-w-sm rounded-md border border-line px-3 py-2 text-sm placeholder:text-muted/60"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="micro text-muted">
              Anything that helps us find it (optional — plan, date, reason)
            </span>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="e.g. Pro monthly, started in March"
              className="w-full rounded-md border border-line px-3 py-2 text-sm placeholder:text-muted/60"
            />
          </label>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={state === "busy" || !canSend}
            className="btn-press w-fit rounded-md bg-accent-strong px-4 py-2 text-sm font-medium text-white shadow-card hover:bg-accent-strong/90 disabled:opacity-50"
          >
            {state === "busy" ? "Sending…" : "Cancel now"}
          </button>
          {state === "error" && (
            <p className="text-sm text-accent">
              Couldn&rsquo;t send right now — try again in a minute, or email{" "}
              <a href={CONTACT_MAILTO} className="underline">
                {CONTACT_EMAIL}
              </a>{" "}
              with &ldquo;Cancellation&rdquo; in the subject; that counts just
              the same.
            </p>
          )}
        </section>
      )}

      <p className="text-xs text-muted">
        <Link href="/terms" className="text-accent hover:underline">
          Terms of Service
        </Link>{" "}
        &middot;{" "}
        <Link href="/imprint" className="text-accent hover:underline">
          Legal Notice
        </Link>{" "}
        &middot;{" "}
        <Link href="/" className="text-accent hover:underline">
          Back to the floor
        </Link>
      </p>
    </main>
  );
}
