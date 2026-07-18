"use client";

/**
 * Password-reset landing page — the emailed link points here with a
 * single-use token in the query string. On success the server signs this
 * browser in with a fresh session, so the user lands back on their feet
 * without a second sign-in step.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/auth";
import { useAppState } from "@/lib/store";

export default function ResetPage() {
  const [, actions] = useAppState();
  // Read the token in an effect, not during render — the first server/client
  // render must match or Next flags a hydration mismatch.
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneName, setDoneName] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t && /^[0-9a-f]{64}$/.test(t) ? t : "");
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !token) return;
    if (password !== confirm) {
      setError("the two passwords don't match");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await resetPassword(token, password);
    setBusy(false);
    if (typeof result === "string") {
      setError(result);
      return;
    }
    actions.setIdentity(result.id, result.name);
    setDoneName(result.name);
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-14">
      <header>
        <p className="micro text-muted">ACCOUNT</p>
        <h1 className="mt-1 font-display text-3xl">Choose a new password</h1>
      </header>

      {token === null ? null : doneName ? (
        <div className="panel flex flex-col gap-3 p-6">
          <p className="text-sm leading-relaxed">
            Done — your password is changed and you&rsquo;re signed in as{" "}
            <span className="font-medium">{doneName}</span>. Every other
            browser was signed out, and a confirmation email is on its way.
          </p>
          <div className="flex gap-3">
            <Link
              href="/lobby"
              className="btn-press rounded-md bg-ink px-4 py-2 text-sm text-paper hover:bg-ink/85"
            >
              Walk the floor
            </Link>
            <Link
              href="/profile"
              className="btn-press rounded-md border border-line px-4 py-2 text-sm text-muted hover:border-ink hover:text-ink"
            >
              Go to profile
            </Link>
          </div>
        </div>
      ) : token === "" ? (
        <div className="panel flex flex-col gap-3 p-6">
          <p className="text-sm leading-relaxed text-muted">
            This page only works from a password-reset email, and this link is
            missing its token. Request a fresh link from the profile page —
            it takes ten seconds.
          </p>
          <Link href="/profile" className="text-sm text-accent underline hover:no-underline">
            Go to the profile page
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="panel flex flex-col gap-4 p-6">
          <div>
            <label htmlFor="new-pass" className="micro mb-1.5 block text-muted">
              New password
            </label>
            <div className="relative">
              <input
                id="new-pass"
                type={show ? "text" : "password"}
                value={password}
                minLength={6}
                maxLength={72}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-md border border-line px-3 py-2 pr-14 text-sm"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="micro absolute inset-y-0 right-2 my-auto h-fit text-muted hover:text-ink"
              >
                {show ? "HIDE" : "SHOW"}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">At least 6 characters.</p>
          </div>
          <div>
            <label htmlFor="confirm-pass" className="micro mb-1.5 block text-muted">
              Type it again
            </label>
            <input
              id="confirm-pass"
              type={show ? "text" : "password"}
              value={confirm}
              minLength={6}
              maxLength={72}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-md border border-line px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={busy || password.length < 6 || confirm.length < 6}
            className="btn-press w-fit rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "…" : "Set new password"}
          </button>
          {error && (
            <div role="alert" className="flex flex-col gap-1">
              <p className="text-sm text-accent">{error}</p>
              {/* A dead link is a dead end without this — point at where
                  "Forgot password" actually lives. */}
              <Link
                href="/profile"
                className="text-sm text-accent underline hover:no-underline"
              >
                Request a fresh reset link
              </Link>
            </div>
          )}
          <p className="text-xs text-muted">
            Changing the password signs your account out of every browser —
            including whoever prompted you to reset it.
          </p>
        </form>
      )}
    </main>
  );
}
