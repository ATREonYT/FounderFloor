"use client";

/**
 * One game per browser. Every floor page holds this Web Lock while its
 * game is mounted, so a second FounderFloor tab can't put a second copy
 * of you on a floor — it shows a takeover prompt instead. Web Locks are
 * scoped to the browser profile and released automatically when a tab
 * dies, which makes them exactly the right primitive: no heartbeats, no
 * stale locks after a crash.
 *
 * The holder lives at module level with a short release grace period, so
 * React strict-mode's mount/unmount/mount cycle (and floor-to-floor
 * navigation) reuses the held lock instead of racing its own ghost —
 * a naive per-mount request makes a tab block ITSELF in dev.
 *
 * (Same-identity joins from OTHER devices are handled server-side — the
 * floor server replaces the older connection on join.)
 */

const LOCK_NAME = "founderfloor:game";
const RELEASE_GRACE_MS = 250;

export interface FloorLockCallbacks {
  /** This tab holds the game now. */
  onAcquired: () => void;
  /** Another tab holds it (only fires for non-steal attempts). */
  onBlocked: () => void;
  /** We held it and another tab stole it ("Play here instead" there). */
  onLost: () => void;
}

// -- module-level holder state (one game lock per tab, ever) --
let activeCb: FloorLockCallbacks | null = null;
let heldRelease: (() => void) | null = null; // resolves the held-lock promise
let releaseTimer: ReturnType<typeof setTimeout> | null = null;
let requesting = false; // a grant decision is in flight — don't stack requests

/**
 * Take (or reuse) the game lock. With `steal`, take it even if another
 * tab holds it (that tab gets onLost). Returns a release function — call
 * it on unmount; the actual release happens after a short grace period
 * so an immediate re-acquire keeps the same lock.
 */
export function acquireFloorLock(
  cb: FloorLockCallbacks,
  opts: { steal?: boolean } = {},
): () => void {
  const locks =
    typeof navigator !== "undefined" && "locks" in navigator ? navigator.locks : undefined;
  if (!locks) {
    // Old browser without Web Locks: no cross-tab guard (the server-side
    // same-identity replacement still prevents visible duplicates).
    cb.onAcquired();
    return () => {};
  }

  activeCb = cb;
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }

  if (heldRelease) {
    // This tab already holds the lock (strict-mode remount, floor switch,
    // or a rejoin after a server-side handover) — just hand it over.
    cb.onAcquired();
  } else if (requesting && !opts.steal) {
    // A grant decision is already in flight from a remount ghost — issuing
    // another ifAvailable request now would queue behind our OWN pending
    // request and block this tab against itself. The in-flight request
    // notifies activeCb (which is now this consumer) either way.
  } else {
    requesting = true;
    void locks
      .request(
        LOCK_NAME,
        opts.steal ? { steal: true } : { ifAvailable: true },
        (lock) => {
          requesting = false;
          if (!lock) {
            // ifAvailable miss — another tab is playing
            activeCb?.onBlocked();
            return;
          }
          if (!activeCb) return; // every consumer left before the grant — free it
          activeCb.onAcquired();
          // Hold until released — the promise resolving frees the lock.
          return new Promise<void>((resolve) => {
            heldRelease = () => {
              heldRelease = null;
              resolve();
            };
          });
        },
      )
      .catch(() => {
        // AbortError: our held lock was stolen by another tab's takeover.
        requesting = false;
        heldRelease = null;
        activeCb?.onLost();
      });
  }

  return () => {
    if (activeCb === cb) activeCb = null;
    if (releaseTimer) clearTimeout(releaseTimer);
    // Grace period: a remount re-acquires within a tick and keeps the
    // lock; only a real departure lets it go.
    releaseTimer = setTimeout(() => {
      releaseTimer = null;
      if (!activeCb) heldRelease?.();
    }, RELEASE_GRACE_MS);
  };
}
