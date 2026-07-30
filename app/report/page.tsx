"use client";

/**
 * Public notice-and-action form (DSA Art. 16): anyone — user, rights
 * holder, authority — can report illegal or infringing content without an
 * account. Submissions are stored on the floor server and forwarded to the
 * operator immediately; the page confirms receipt with a timestamp.
 */

import { useState } from "react";
import Link from "next/link";
import { httpBase } from "@/lib/net";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact";

export default function ReportPage() {
  const [text, setText] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [receivedAt, setReceivedAt] = useState<number | null>(null);

  const submit = async () => {
    if (state === "busy" || !text.trim()) return;
    setState("busy");
    try {
      const res = await fetch(`${httpBase()}/report-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), contact: contact.trim() }),
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
        <p className="micro text-muted">NOTICE &amp; ACTION</p>
        <h1 className="mt-1 font-display text-3xl">Report content</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Use this form to report content on FounderFloor that you believe is
          illegal or infringes your rights — a stand, a pitch, a logo, a
          guestbook entry, a name, anything. No account needed. Reports are
          reviewed and, where warranted, content is removed; if you leave a
          contact address you&rsquo;ll hear the outcome. In-app, you can also
          report a chat directly from its thread.
        </p>
      </header>

      {state === "done" ? (
        <section className="panel p-6">
          <h2 className="font-display text-xl">Report received</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Logged{" "}
            {receivedAt ? new Date(receivedAt).toLocaleString() : "just now"} and
            forwarded to the operator. Thank you — reports like this are what
            keep the floor worth walking.
          </p>
        </section>
      ) : (
        <section className="panel flex flex-col gap-4 p-6">
          <label className="flex flex-col gap-1.5">
            <span className="micro text-muted">
              What are you reporting, and where is it?
            </span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              maxLength={1500}
              placeholder="Describe the content, where it appears (floor, stand name, directory entry…), and why it's illegal or infringing. For IP claims, say what right of yours it infringes."
              className="w-full rounded-md border border-line px-3 py-2 text-sm placeholder:text-muted/60"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="micro text-muted">
              Your email (optional — for the outcome and any follow-up)
            </span>
            <input
              type="email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={254}
              placeholder="you@example.com"
              className="w-full max-w-sm rounded-md border border-line px-3 py-2 text-sm placeholder:text-muted/60"
            />
          </label>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={state === "busy" || !text.trim()}
            className="btn-press w-fit rounded-md bg-accent-strong px-4 py-2 text-sm font-medium text-white shadow-card hover:bg-accent-strong/90 disabled:opacity-50"
          >
            {state === "busy" ? "Sending…" : "Send report"}
          </button>
          {state === "error" && (
            <p className="text-sm text-accent">
              Couldn&rsquo;t send right now — try again in a minute, or email{" "}
              <a href={CONTACT_MAILTO} className="underline">
                {CONTACT_EMAIL}
              </a>
              .
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
