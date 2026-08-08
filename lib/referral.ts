/**
 * The invite code a visitor arrived with, carried from the link to the
 * sign-up form.
 *
 * Its own module, with no imports, on purpose. lib/auth.ts needs it at
 * registration and lib/perks.ts needs it for display, and perks reaches
 * store which reaches auth — putting these three functions anywhere else
 * closes that ring into an import cycle. A leaf cannot form a cycle.
 */

const REF_KEY = "founderfloor:ref";
/** The shape the server mints: see mintReferralCode in server/index.mjs. */
const CODE_RE = /^[a-z0-9]{4,32}$/;

/**
 * Stash a `?ref=` code so it survives the walk from a link to the sign-up
 * form, which is several pages and often a day later. localStorage rather
 * than a cookie: same origin, no banner needed, and it is sent nowhere
 * until registration.
 */
export function rememberRefFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (!code) return;
    const clean = code.trim().toLowerCase().slice(0, 32);
    // A junk value would be ignored server-side anyway, but storing it
    // would stop the NEXT real code being stored, since the first wins.
    if (CODE_RE.test(clean)) window.localStorage.setItem(REF_KEY, clean);
  } catch {
    /* storage blocked or a malformed URL — the invite is simply not carried */
  }
}

/** The stored invite code, or "". */
export function pendingRef(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(REF_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Forget it once spent, so a second account on this browser cannot reuse it. */
export function clearPendingRef(): void {
  try {
    window.localStorage.removeItem(REF_KEY);
  } catch {
    /* fine */
  }
}

/** The link to hand out. Absolute, because it gets pasted into a DM. */
export function referralLink(code: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://founderfloor.net";
  return `${origin}/?ref=${code}`;
}
