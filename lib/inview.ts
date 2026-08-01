/**
 * Fire a callback the first time an element is genuinely on screen.
 *
 * The obvious version of this is three lines of IntersectionObserver. The
 * reason it is a shared file is the backstop, which is easy to get wrong in
 * a way that is invisible until someone tells you the animations "don't
 * move": the old code guarded against a dead observer with a plain
 * `setTimeout(show, 2500)`. That fires whether or not the element is
 * anywhere near the viewport, so every section on the page revealed itself
 * two and a half seconds after load — including the ones three thousand
 * pixels down. Scroll to them later and the entrance had long finished.
 *
 * So the backstop asks the same question the observer does, by geometry,
 * on a slow interval. Nothing can reveal while it is off screen, and a
 * browser whose observer never fires still gets its entrances.
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

export function whenInView(
  el: Element,
  onEnter: () => void,
  { threshold = 0, rootMargin = "10000px 0px 15% 0px" } = {},
): Stop {
  let done = false;
  const fire = () => {
    if (done) return;
    done = true;
    stop();
    onEnter();
  };

  // No observer at all: show it rather than hide it forever.
  if (typeof IntersectionObserver === "undefined") {
    onEnter();
    return () => {};
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) fire();
  }, { threshold, rootMargin });
  io.observe(el);

  // Backstop for observers that never fire. Geometry, not a bare timer.
  const poll = window.setInterval(() => {
    if (near(el)) fire();
  }, 500);

  function stop() {
    io.disconnect();
    window.clearInterval(poll);
  }
  return stop;
}
