"use client";

/**
 * Where a code is spent.
 *
 * NOTHING HERE GRANTS ANYTHING. The field collects a word and the server
 * decides — same rule as the trial and the referral in lib/perks. What it
 * gets back is either a refusal in plain words or a receipt saying exactly
 * what moved, and it says so rather than reloading and hoping the visitor
 * notices their tier changed.
 *
 * The success line names the real numbers because a promo that says
 * "Success!" and leaves you to go looking for what you got is the same
 * unkept promise as one that quietly fails.
 */

import { useState } from "react";
import { getAuth } from "@/lib/auth";
import { httpBase } from "@/lib/net";
import { syncNow } from "@/lib/store";
import { refreshPerks } from "@/lib/perks";

type Result = { ok: true; text: string } | { ok: false; text: string } | null;

export default function PromoRedeem({
  className = "",
  tone = "paper",
}: {
  className?: string;
  /** "ink" on a dark ground, where muted text dies. */
  tone?: "paper" | "ink";
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const dark = tone === "ink";
  const quiet = dark ? "text-paper/60" : "text-muted";

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const typed = code.trim();
    if (!typed || busy) return;
    const auth = getAuth();
    const base = httpBase();
    if (!auth) {
      setResult({ ok: false, text: "Sign in first — a code is kept on the account, not the browser." });
      return;
    }
    if (!base) {
      setResult({ ok: false, text: "Can't reach the floor server. Try again in a minute." });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`${base}/promo/redeem`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: auth.token, code: typed }),
      });
      const d = (await res.json()) as {
        ok?: boolean;
        error?: string;
        days?: number;
        tickets?: number;
        until?: number | null;
      };
      if (!d.ok) {
        setResult({ ok: false, text: d.error || "That code didn't work." });
        return;
      }
      // Name what actually moved. Both halves are optional and the server
      // reports what it really gave, so this never claims more than landed.
      const parts: string[] = [];
      if (d.days) parts.push(`${d.days} days of Founder+`);
      if (d.tickets) parts.push(`${d.tickets.toLocaleString("en-US")} tickets`);
      const until = d.until
        ? ` Yours until ${new Date(d.until).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}.`
        : "";
      setResult({ ok: true, text: `${parts.join(" and ")} — added to your account.${until}` });
      setCode("");
      // The tier lives on the server; pull the new answer rather than
      // guessing at it locally.
      void syncNow();
      refreshPerks();
    } catch {
      setResult({ ok: false, text: "Couldn't reach the floor server. Try again in a minute." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className={`flex flex-col gap-2 ${className}`}>
      <label className={`micro ${quiet}`} htmlFor="promo-code">
        Have a code?
      </label>
      <div className="flex gap-2">
        <input
          id="promo-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={32}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="PRODUCTHUNT"
          className={`min-h-[44px] w-full rounded-md border px-3 py-2 font-mono text-sm uppercase tracking-[0.08em] outline-none ${
            dark
              ? "border-paper/25 bg-paper/10 text-paper placeholder:text-paper/40"
              : "border-line bg-paper placeholder:text-muted/60"
          }`}
        />
        <button
          type="submit"
          disabled={busy || code.trim().length === 0}
          className="btn-press min-h-[44px] shrink-0 rounded-md bg-accent-strong px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "…" : "Redeem"}
        </button>
      </div>
      {result && (
        <p
          role="status"
          className={`text-sm leading-relaxed ${
            result.ok ? "text-verify" : dark ? "text-accent-lift" : "text-accent"
          }`}
        >
          {result.text}
        </p>
      )}
    </form>
  );
}
