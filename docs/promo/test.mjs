/**
 * Checks on the choreography: `node test/../test.mjs`, or just
 * `node test.mjs` from docs/promo.
 *
 * The scene is a pure function of a frame number, so the whole performance
 * can be replayed in Node without a browser and every frame inspected.
 * These are the three mistakes that actually got made, turned into tests:
 * a lane routed through a desk, a loop that did not close, and two chat
 * bubbles up at once on top of each other.
 */
import { LOOP, OBSTACLES, castAt, SCRIPT, VISITORS } from "./scene.mjs";

let bad = 0;
const check = (ok, msg, extra = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}${extra ? "  — " + extra : ""}`);
  if (!ok) bad++;
};
const group = (t) => console.log(`\n${t}`);

/* ------------------------------------------------- the loop must close */
{
  group("the loop closes");
  const first = castAt(0);
  const last = castAt(LOOP);
  for (const a of first) {
    const b = last.find((x) => x.id === a.id);
    const d = Math.hypot(a.gx - b.gx, a.gy - b.gy);
    check(d < 1e-6, `${a.id} ends where it starts`, `off by ${d.toFixed(4)} tiles`);
  }
  // and the join must not be a stride mid-air: everyone is standing still
  const near = castAt(LOOP - 1);
  for (const a of near)
    check(!a.moving, `${a.id} is standing still across the join`);
}

/* -------------------------------------- nobody walks through furniture */
{
  group("nobody walks through the furniture");
  // a person is a body, not a point: keep their centre this far out of a
  // solid, or the sprite visibly clips its corner
  const MARGIN = 0.25;
  const hits = new Map();
  for (let f = 0; f < LOOP; f++)
    for (const p of castAt(f))
      for (const o of OBSTACLES)
        if (
          p.gx > o.x0 - MARGIN && p.gx < o.x1 + MARGIN &&
          p.gy > o.y0 - MARGIN && p.gy < o.y1 + MARGIN
        ) {
          const key = `${p.id} into ${o.what}`;
          if (!hits.has(key)) hits.set(key, f);
        }
  check(hits.size === 0, "every lane clears every wall and desk",
    [...hits].map(([k, f]) => `${k} @${f}`).join("; "));
}

/* ------------------------------- people stay on the floor that exists */
{
  group("people stay inside the hall");
  let out = null;
  for (let f = 0; f < LOOP && !out; f++)
    for (const p of castAt(f))
      if (p.gx < 0.2 || p.gx > 12.8 || p.gy < 0.2 || p.gy > 9.8)
        out = `${p.id} at (${p.gx.toFixed(1)}, ${p.gy.toFixed(1)}) on frame ${f}`;
  check(!out, "nobody walks off the edge of the map", out || "");
}

/* -------------------------------------------- the script is coherent */
{
  group("the script holds together");
  const ids = new Set([...VISITORS.map((v) => v.id), "host"]);
  const unknown = SCRIPT.filter((l) => !ids.has(l.from)).map((l) => l.from);
  check(unknown.length === 0, "every line has a speaker who exists", unknown.join(", "));

  const outside = SCRIPT.filter((l) => l.at[0] < 0 || l.at[1] > LOOP || l.at[0] >= l.at[1]);
  check(outside.length === 0, "every window is inside the loop and runs forwards",
    outside.map((l) => l.text || l.glyph).join(", "));

  // A bubble's width is roughly the text at 11.5px plus padding. This only
  // has to be close: it is here to catch two cards landing on top of each
  // other, which is what happened when the pair talked over the stand.
  const halfWidth = (l) => (l.kind === "emote" ? 18 : (l.text.length * 6.1 + 20) / 2);
  const speakerX = (frame, from) => {
    if (from === "host") return (6.0 - 1.9) * 29; // the founder of stand 02
    const p = castAt(frame).find((x) => x.id === from);
    return (p.gx - p.gy) * 29;
  };

  const clashes = [];
  for (let i = 0; i < SCRIPT.length; i++)
    for (let j = i + 1; j < SCRIPT.length; j++) {
      const a = SCRIPT[i];
      const b = SCRIPT[j];
      const t0 = Math.max(a.at[0], b.at[0]);
      const t1 = Math.min(a.at[1], b.at[1]);
      if (t0 >= t1) continue;
      for (let f = t0; f < t1; f++) {
        const gap = Math.abs(speakerX(f, a.from) - speakerX(f, b.from));
        if (gap < halfWidth(a) + halfWidth(b) + 8) {
          clashes.push(`"${a.text || a.glyph}" vs "${b.text || b.glyph}" @${f}`);
          break;
        }
      }
    }
  check(clashes.length === 0, "no two bubbles overlap on screen", clashes.join("; "));
}

/* --------------------------------------- the walking is worth watching */
{
  group("the walking reads as walking");
  // A run that is much faster or slower than the others reads as a glitch
  // rather than as a person, so the paces are kept within a band.
  const speeds = [];
  for (const v of VISITORS) {
    let peak = 0;
    for (let f = 1; f < LOOP; f++) {
      const a = castAt(f - 1).find((x) => x.id === v.id);
      const b = castAt(f).find((x) => x.id === v.id);
      peak = Math.max(peak, Math.hypot(b.gx - a.gx, b.gy - a.gy));
    }
    speeds.push({ id: v.id, peak });
  }
  for (const s of speeds)
    check(s.peak > 0.015 && s.peak < 0.075, `${s.id} moves at a human pace`,
      `${(s.peak * 30).toFixed(2)} tiles/s at full stride`);

  // the trapezoid must actually ease: the first frame of a run cannot be
  // at full speed, or nothing was gained over linear interpolation
  const v = VISITORS[0];
  const step = (f) => {
    const a = castAt(f - 1).find((x) => x.id === v.id);
    const b = castAt(f).find((x) => x.id === v.id);
    return Math.hypot(b.gx - a.gx, b.gy - a.gy);
  };
  const startStep = step(32);
  const cruiseStep = step(90);
  check(startStep < cruiseStep * 0.5, "people accelerate away from a stop",
    `${startStep.toFixed(4)} vs ${cruiseStep.toFixed(4)} tiles/frame`);
}

console.log(bad === 0 ? "\nALL CHECKS PASSED" : `\n${bad} CHECK(S) FAILED`);
process.exit(bad ? 1 : 0);
