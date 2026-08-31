/**
 * Fire a callback the first time an element is genuinely on screen.
 *
 * ONE OBSERVER, NOT ONE PER ELEMENT. Every caller with the same options
 * shares a single IntersectionObserver kept in a module-level pool, and
 * an element is unobserved the moment it has fired. The page has dozens
 * of revealing elements; dozens of observers each doing their own
 * intersection bookkeeping is work the browser can do once.
 *
 * The backstop is the part that is easy to get wrong in a way that stays
 * invisible until someone says the animations "don't move": the original
 * guarded a dead observer with a plain `setTimeout(show, 2500)`, which
 * fires whether or not the element is anywhere near the viewport — so
 * every section revealed two and a half seconds after load, including
 * ones three thousand pixels down, and scrolling to them later found the
 * entrance long finished. So the backstop asks the same question the
 * observer does, by geometry, on one shared slow interval. Nothing can
 * reveal while it is off screen, and a browser whose observer never
 * fires still gets its entrances.
 */

type Stop = () => void;

/** True when the element is within about a screen of being readable. */
function near(el: Element): boolean {
  const r = el.getBoundingClientRect();
  // top: anything at or above the fold counts (a restored scroll position
  // must not leave the sections above it blank). bottom: a little early, so
  // the entrance is already moving when the eye arrives.
  return r.top < window.innerHeight * 1.15;
}

/** The shared observers, one per distinct option set. */
const pool = new Map<string, IntersectionObserver>();
/** What to run when a given element intersects. */
const waiting = new WeakMap<Element, () => void>();

/** The single geometry backstop, shared by every pending element. */
const pending = new Set<Element>();
let poll = 0;

function sweep() {
  for (const el of pending) if (near(el)) waiting.get(el)?.();
  if (pending.size === 0) {
    window.clearInterval(poll);
    poll = 0;
  }
}

function observerFor(threshold: number, rootMargin: string): IntersectionObserver {
  const key = `${threshold}|${rootMargin}`;
  let io = pool.get(key);
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) waiting.get(e.target)?.();
      },
      { threshold, rootMargin },
    );
    pool.set(key, io);
  }
  return io;
}

export function whenInView(
  el: Element,
  onEnter: () => void,
  { threshold = 0, rootMargin = "10000px 0px 15% 0px" } = {},
): Stop {
  // No observer at all: show it rather than hide it forever.
  if (typeof IntersectionObserver === "undefined") {
    onEnter();
    return () => {};
  }

  const io = observerFor(threshold, rootMargin);
  let done = false;

  const stop = () => {
    if (done) return;
    done = true;
    io.unobserve(el);
    waiting.delete(el);
    pending.delete(el);
    if (pending.size === 0 && poll) {
      window.clearInterval(poll);
      poll = 0;
    }
  };

  waiting.set(el, () => {
    if (done) return;
    stop();
    onEnter();
  });
  io.observe(el);
  pending.add(el);
  if (!poll) poll = window.setInterval(sweep, 500);

  return stop;
}
