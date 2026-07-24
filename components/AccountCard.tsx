"use client";

/**
 * Account section for the Profile page: create / sign in / sign out, plus
 * the forgot-password flow and (for accounts made before email sign-in
 * existed) an add-your-email nudge. Guests lose nothing by staying guests —
 * an account makes the identity server-verified and portable across devices.
 */

import { useEffect, useState } from "react";
import {
  emailLive,
  forgotPassword,
  getAuth,
  login,
  logout,
  register,
  setAccountEmail,
} from "@/lib/auth";
import { flushSyncPush, makeGuestId } from "@/lib/store";
import { migrateStands } from "@/lib/social";

function Field({
  id,
  label,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "flex w-full max-w-md flex-col"}>
      <label htmlFor={id} className="micro mb-1.5 block text-muted">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative w-full">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        minLength={6}
        maxLength={72}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
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
  );
}

export default function AccountCard({
  onIdentity,
  currentName,
  currentId = "",
}: {
  /** Called with the new identity after sign-in/out (wires store.setIdentity). */
  onIdentity: (id: string, name: string) => void;
  currentName: string;
  /** The identity being LEFT on sign-in — its floor stands migrate to the account. */
  currentId?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"register" | "login" | "forgot">("register");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addEmailState, setAddEmailState] = useState<"idle" | "busy" | "done">("idle");
  const [mailWorks, setMailWorks] = useState(true); // assume yes until told otherwise
  const [tick, setTick] = useState(0); // re-render after auth changes

  useEffect(() => {
    setMounted(true);
    setName(currentName);
    void emailLive().then(setMailWorks);
  }, [currentName]);

  const auth = mounted ? getAuth() : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    if (mode === "forgot") {
      const err = await forgotPassword(email.trim());
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      setForgotSent(true);
      return;
    }

    const result =
      mode === "register"
        ? await register(email.trim(), name.trim(), password)
        : await login(email.trim(), password);
    setBusy(false);
    if (typeof result === "string") {
      setError(result);
      return;
    }
    setPassword("");
    // Bring the guest identity's floor stands and directory listing along —
    // otherwise the hall keeps a ghost "away" copy of the booth under the
    // abandoned guest id, and the person appears twice.
    if (currentId && !currentId.startsWith("acct_")) {
      void migrateStands(currentId, result.id);
    }
    onIdentity(result.id, result.name);
    setTick((t) => t + 1);
  };

  const signOut = async () => {
    // push any unsynced edits while the session token still works — the
    // sign-out reset blanks this device, so the account must hold them first
    await flushSyncPush().catch(() => undefined);
    await logout();
    // fresh guest id — the account's social graph stays on the server
    onIdentity(makeGuestId(), currentName);
    setError(null); // don't carry a signed-in error into the signed-out form
    setAddEmailState("idle");
    setTick((t) => t + 1);
  };

  const saveAddedEmail = async () => {
    if (addEmailState === "busy") return;
    setAddEmailState("busy");
    setError(null);
    const err = await setAccountEmail(addEmail.trim());
    if (err) {
      setError(err);
      setAddEmailState("idle");
      return;
    }
    setAddEmailState("done");
    setTick((t) => t + 1);
  };

  void tick;

  if (!mounted) return null;

  if (auth) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">
          Signed in as <span className="font-medium">{auth.name}</span>
          {auth.email && <span className="ml-2 text-muted">({auth.email})</span>}
          <span className="micro ml-2 rounded-sm border border-verify/40 px-1.5 py-0.5 text-verify">
            verified identity
          </span>
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Your booth, connections, streaks and badges follow this account on
          any device — sign in there and everything comes with you.
          {auth.email &&
            mailWorks &&
            ` If your account is ever signed in from a new browser, we'll email ${auth.email} so you know.`}
        </p>
        {addEmailState === "done" && (
          <p className="text-sm text-verify" role="status">
            Email saved{mailWorks ? " — a confirmation is on its way to your inbox." : "."}
          </p>
        )}
        {!auth.email && addEmailState !== "done" && (
          <div className="rounded-md border border-gold/50 bg-gold/5 p-3">
            <p className="text-sm text-gold-deep">
              This account has no email yet. Add one so you can reset a
              forgotten password and get an alert if someone else signs in.
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email for this account"
                autoComplete="email"
                className="w-56 rounded-md border border-line px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void saveAddedEmail()}
                disabled={addEmailState === "busy" || !addEmail.includes("@")}
                className="btn-press rounded-md bg-ink px-3 py-2 text-sm text-paper hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addEmailState === "busy" ? "…" : "Add email"}
              </button>
            </div>
          </div>
        )}
        {error && (
          <p className="text-sm text-accent" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void signOut()}
          className="btn-press w-fit rounded-md border border-line px-3 py-2 text-sm text-muted hover:border-ink hover:text-ink"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <div className="flex flex-col gap-3">
        {mailWorks ? (
          <p className="text-sm leading-relaxed text-muted">
            Type the email on your account and we&rsquo;ll send a link that
            lets you choose a new password. The link works once and expires in
            30 minutes.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-gold-deep">
            Heads up: this server hasn&rsquo;t got email switched on yet, so a
            reset link can&rsquo;t be sent automatically. Reach the operator
            through the About page to get your password reset by hand.
          </p>
        )}
        {forgotSent ? (
          <p className="text-sm text-verify" role="status">
            Done — if that email has an account, a reset link is on its way.
            Check your inbox (and spam, once).
          </p>
        ) : (
<form onSubmit={submit} className="flex w-full max-w-md flex-col items-start gap-3">
            <Field id="forgot-email" label="Email">
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-md border border-line px-3 py-2 text-sm"
              />
            </Field>
            <button
              type="submit"
              disabled={busy || !email.includes("@")}
              className="btn-press rounded-md bg-accent-strong px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong/90 disabled:cursor-not-allowed disabled:border disabled:border-line disabled:bg-paper disabled:text-muted"
            >
              {busy ? "…" : "Email me a reset link"}
            </button>
          </form>
        )}
        {error && (
          <p className="text-sm text-accent" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setForgotSent(false);
            setError(null);
          }}
          className="micro w-fit text-muted underline hover:text-ink"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  // What still blocks the submit button, in the user's words.
  const missing: string[] = [];
  if (mode === "register") {
    if (!email.includes("@")) missing.push("your email");
    if (name.trim().length < 2) missing.push("a display name (2+ characters)");
  } else if (!email.trim()) {
    missing.push("your email");
  }
  if (password.length < 6) missing.push("a password of 6+ characters");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-muted">
        A free account saves your progress — booth, connections, streaks —
        and lets you sign in from any device to pick it up. It also locks
        your name so nobody can pretend to be you on the floor.
      </p>
      {/* Plain toggle buttons, not an ARIA tablist — a real tablist owes screen
          readers arrow-key navigation and an associated tabpanel we don't
          provide, so aria-pressed is the honest contract here. */}
      <div className="inline-flex w-full max-w-md rounded-full border border-line/70 bg-paper p-1">
        {(["register", "login"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`flex-1 whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
              mode === m
                ? "bg-panel font-medium text-ink shadow-card"
                : "text-muted hover:text-ink"
            }`}
          >
            {m === "register" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>
      <form
        onSubmit={submit}
        className={
          mode === "register"
            ? "grid w-full items-start gap-3 sm:grid-cols-2"
            : "flex w-full max-w-md flex-col items-start gap-3"
        }
      >
        <Field
          id="acct-email"
          label={mode === "register" ? "Email" : "Email (or account name, for older accounts)"}
          hint={
            mode === "register"
              ? "Only for password resets and sign-in alerts. Never shown to anyone, never a newsletter."
              : undefined
          }
        >
          <input
            id="acct-email"
            type={mode === "register" ? "email" : "text"}
            value={email}
            maxLength={254}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete={mode === "register" ? "email" : "username"}
            placeholder="you@example.com"
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </Field>
        {mode === "register" && (
          <Field
            id="acct-name"
            label="Display name"
            hint="What other founders see on the floor. 2–24 characters."
          >
            <input
              id="acct-name"
              type="text"
              value={name}
              minLength={2}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              autoComplete="nickname"
              className="w-full rounded-md border border-line px-3 py-2 text-sm"
            />
          </Field>
        )}
        <Field
          id="acct-pass"
          label="Password"
          hint={mode === "register" ? "At least 6 characters." : undefined}
          className={mode === "register" ? "w-full sm:max-w-[calc(50%-0.375rem)] sm:col-span-2" : undefined}
        >
          <PasswordInput
            id="acct-pass"
            value={password}
            onChange={setPassword}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={busy || missing.length > 0}
            className="btn-press rounded-md bg-accent-strong px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong/90 disabled:cursor-not-allowed disabled:border disabled:border-line disabled:bg-paper disabled:text-muted"
          >
            {busy ? "…" : mode === "register" ? "Create free account" : "Sign in"}
          </button>
          {mode === "login" && (
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError(null);
              }}
              className="btn-press rounded-md border border-line px-3 py-2 text-sm text-muted hover:border-ink hover:text-ink"
            >
              Reset password
            </button>
          )}
        </div>
        {/* A grey button with no reason is a dead end — say what's missing. */}
        {missing.length > 0 && !busy && (
          <p className="text-xs text-muted sm:col-span-2">Still needed: {missing.join(", ")}.</p>
        )}
      </form>
      {error && (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-muted">
        Passwords are salted and hashed on the floor server — nobody can read
        them, including us.
      </p>
    </div>
  );
}
