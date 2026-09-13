/**
 * WHERE THE JOURNEY IS KEPT.
 *
 * On this device, under one key, the same way the rest of the site keeps
 * its state (lib/store.ts): a versioned localStorage entry, read through
 * `sanitize` on the way in so nothing corrupt or foreign becomes state,
 * and a `storage` listener so a second tab sees what the first one wrote.
 *
 * The key carries the identity. A signed-in account and a guest on the
 * same browser get different journeys, and two accounts never see each
 * other's lines. That is the whole of the isolation for now: the
 * cross-device sync the hall uses (lib/sync.ts) can carry this blob
 * later, and it is shaped to be carried, but it is not wired here.
 *
 * Two honest rules. A write that fails says so — a private window, a full
 * quota, a browser that has blocked storage — and the caller shows it;
 * nothing here pretends. And a save that will not parse is not thrown
 * away: it is moved aside under a dated key, and the founder starts fresh
 * with a notice, because the one thing worse than a corrupt file is a
 * corrupt file that was silently deleted.
 */
import { journey } from "@founderfloor/shared";

type JourneyState = journey.JourneyState;

export const STORAGE_PREFIX = "founderfloor:journey:v1";

export const storageKey = (identity: string | null): string => `${STORAGE_PREFIX}:${identity ?? "guest"}`;

export type SaveResult = { ok: true } | { ok: false; reason: string };

/** In-memory stand-in when the browser will not give us storage at all. */
const memory = new Map<string, string>();

function area(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const s = window.localStorage;
    // Some browsers expose the object and throw on first touch.
    const probe = "__ff_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function readState(key: string): { state: JourneyState; corrupt: boolean; fromMemory: boolean } {
  const s = area();
  const raw = s ? s.getItem(key) : memory.get(key) ?? null;
  if (raw === null) return { state: journey.EMPTY, corrupt: false, fromMemory: !s };
  try {
    return { state: journey.sanitize(JSON.parse(raw)), corrupt: false, fromMemory: !s };
  } catch {
    // keep the bytes, out of the way, dated
    try {
      s?.setItem(`${key}:corrupt:${Date.now()}`, raw);
      s?.removeItem(key);
    } catch {
      // if even that fails there is nothing more to do than start fresh
    }
    return { state: journey.EMPTY, corrupt: true, fromMemory: !s };
  }
}

export function writeState(key: string, state: JourneyState): SaveResult {
  const text = JSON.stringify(state);
  const s = area();
  if (!s) {
    memory.set(key, text);
    return { ok: false, reason: "Your browser is not letting this page keep anything. Your work is held in memory for now and will be gone when you close the tab. Export it to keep it." };
  }
  try {
    s.setItem(key, text);
    return { ok: true };
  } catch (e) {
    memory.set(key, text);
    const quota = e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22);
    return {
      ok: false,
      reason: quota
        ? "This browser's storage is full, so the last change was not saved. Export your journey to keep it, then free some space."
        : "The last change could not be saved. Export your journey to keep it.",
    };
  }
}

export function clearState(key: string): SaveResult {
  memory.delete(key);
  const s = area();
  if (!s) return { ok: true };
  try {
    s.removeItem(key);
    return { ok: true };
  } catch {
    return { ok: false, reason: "Could not remove the saved journey." };
  }
}

/** Fires when another tab writes this key. */
export function subscribe(key: string, onChange: (state: JourneyState) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: StorageEvent) => {
    if (e.key !== key) return;
    if (e.newValue === null) {
      onChange(journey.EMPTY);
      return;
    }
    try {
      onChange(journey.sanitize(JSON.parse(e.newValue)));
    } catch {
      // another tab wrote something unreadable; leave this tab's state alone
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
