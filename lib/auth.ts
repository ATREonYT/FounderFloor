"use client";

/**
 * Client for the floor server's account API. Accounts are optional — guests
 * keep full access — but an account makes your identity server-verified:
 * nobody can impersonate your id on the floor, in the social graph, or on
 * your stand, and your connections/chats follow you across devices.
 * The bearer token lives in localStorage next to the rest of the app state.
 */

import { httpBase } from "@/lib/net";

const AUTH_KEY = "founderfloor:auth";

export interface AuthState {
  id: string; // "acct_<uuid>"
  name: string;
  token: string;
  /** Absent on accounts created before email sign-in existed. */
  email?: string;
}

export function getAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as AuthState).id === "string" &&
      typeof (parsed as AuthState).token === "string"
    ) {
      return parsed as AuthState;
    }
  } catch {
    // corrupt — treat as signed out
  }
  return null;
}

function setAuth(a: AuthState | null): void {
  if (typeof window === "undefined") return;
  try {
    if (a) window.localStorage.setItem(AUTH_KEY, JSON.stringify(a));
    else window.localStorage.removeItem(AUTH_KEY);
  } catch {
    // storage blocked — session-only auth
  }
}

/** Token for a given profile id, or undefined when it isn't the signed-in account. */
export function tokenFor(profileId: string): string | undefined {
  const a = getAuth();
  return a && a.id === profileId ? a.token : undefined;
}

const GS_KEY = "founderfloor:gs";

/**
 * Browser-held guest secret: generated once, sent with every join and social
 * call. The server binds it to your guest id on first use, so nobody who
 * merely SAW your id (it travels to peers on stands, cards, and DMs) can read
 * your inbox or repossess your stand. Accounts use bearer tokens instead,
 * but sending this alongside is harmless.
 */
export function guestSecret(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(GS_KEY);
    if (existing && existing.length >= 16) return existing;
    const s = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    window.localStorage.setItem(GS_KEY, s);
    return s;
  } catch {
    return ""; // storage blocked — degrade to an unbound guest
  }
}

type AuthReply = { id: string; name: string; email?: string; token: string } | { error: string };

async function authPost(path: string, body: unknown): Promise<AuthReply> {
  const base = httpBase();
  if (!base) return { error: "floor server unreachable" };
  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { error: "floor server said no" };
    return (await res.json()) as AuthReply;
  } catch {
    return { error: "floor server unreachable" };
  }
}

export async function register(email: string, name: string, password: string): Promise<AuthState | string> {
  const r = await authPost("/auth/register", { email, name, password, gs: guestSecret() });
  if ("error" in r) return r.error;
  setAuth(r);
  return r;
}

/** Sign in with an email — or, for accounts made before email existed, the account name. */
export async function login(identifier: string, password: string): Promise<AuthState | string> {
  const id = identifier.trim();
  // Send the identifier as BOTH email and name: the server tries email first,
  // then falls back to a name match. That keeps legacy accounts whose name
  // contains "@" reachable (they'd otherwise be misrouted to an email lookup
  // that can never hit).
  const r = await authPost("/auth/login", { email: id, name: id, password, gs: guestSecret() });
  if ("error" in r) return r.error;
  setAuth(r);
  return r;
}

export async function logout(): Promise<void> {
  const a = getAuth();
  setAuth(null);
  if (a) await authPost("/auth/logout", { token: a.token });
}

/**
 * Ask for a reset link. Returns null when the request was accepted (which does
 * NOT reveal whether the email exists — the server always says ok), or an error
 * string when it was refused (rate-limited, server down) so the UI doesn't
 * falsely promise a link that was never generated.
 */
export async function forgotPassword(email: string): Promise<string | null> {
  const base = httpBase();
  if (!base) return "floor server unreachable — try again in a minute";
  try {
    const res = await fetch(`${base}/auth/forgot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return "could not reach the floor server — try again in a minute";
    // Auth errors (e.g. the rate limit) come back as HTTP 200 with an {error}.
    const r = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (r.error) return r.error;
    return null;
  } catch {
    return "could not reach the floor server — try again in a minute";
  }
}

/** Whether the floor server can actually send email (has a key / echo seam). Cached per load. */
let emailLiveCache: boolean | null = null;
export async function emailLive(): Promise<boolean> {
  if (emailLiveCache !== null) return emailLiveCache;
  const base = httpBase();
  if (!base) return true; // can't tell — don't cry wolf
  try {
    const res = await fetch(`${base}/health`);
    const r = (await res.json()) as { emailLive?: boolean };
    emailLiveCache = r.emailLive !== false;
  } catch {
    emailLiveCache = true;
  }
  return emailLiveCache;
}

/** Redeem an emailed reset token; on success the browser is signed in. */
export async function resetPassword(token: string, password: string): Promise<AuthState | string> {
  const r = await authPost("/auth/reset", { token, password, gs: guestSecret() });
  if ("error" in r) return r.error;
  setAuth(r);
  return r;
}

/** Attach (or correct) the email on the signed-in account. */
export async function setAccountEmail(email: string): Promise<string | null> {
  const a = getAuth();
  if (!a) return "not signed in";
  const base = httpBase();
  if (!base) return "floor server unreachable";
  try {
    const res = await fetch(`${base}/auth/set-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, token: a.token, email }),
    });
    if (!res.ok) return "floor server said no";
    const r = (await res.json()) as { ok?: boolean; email?: string; error?: string };
    if (r.error || !r.ok) return r.error ?? "floor server said no";
    setAuth({ ...a, email: r.email });
    return null;
  } catch {
    return "floor server unreachable";
  }
}
