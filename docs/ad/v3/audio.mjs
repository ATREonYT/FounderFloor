/**
 * Sound design for cut 3 — synthesised, synced to timing.json.
 *
 * Rewritten to remove every noise source. The previous bed built its
 * transitions out of filtered white noise, and filtered white noise is
 * exactly what "electric static" sounds like: a one-pole filter leaves
 * plenty of hiss above 4 kHz and no amount of enveloping hides it. Nothing
 * here uses a random generator. Whooshes are pitch-gliding sine stacks,
 * impacts are pure sines with a frequency envelope, and the clicks are
 * short additive transients — which is what a real UI click is anyway: a
 * couple of high partials with a very fast decay over a small low body.
 *
 *   node audio.mjs   ->  out/bed.wav
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const SR = 48000;
const T = JSON.parse(readFileSync("timing.json", "utf8"));
const DUR = T.TOTAL + 0.4;
const N = Math.ceil(DUR * SR);
const L = new Float64Array(N);
const R = new Float64Array(N);

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const TAU = Math.PI * 2;

/** Writes `fn(t, p)` into the mix at `at`, equal-power panned. */
function add(at, dur, fn, pan = 0) {
  const i0 = Math.max(0, Math.round(at * SR));
  const n = Math.round(dur * SR);
  const gl = Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  const gr = Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  for (let i = 0; i < n; i++) {
    const j = i0 + i;
    if (j >= N) break;
    const v = fn(i / SR, i / n);
    L[j] += v * gl;
    R[j] += v * gr;
  }
}

/** A short fade at both ends of any burst, so nothing starts on a step. */
const guard = (s, dur, ms = 0.0015) => clamp01(s / ms) * clamp01((dur - s) / ms);

// ---------------------------------------------------------------- the bed
// Detuned low sines with a slow tremolo and a gentle arc through the cut.
{
  const partials = [
    [55.0, 0.55, 0.0], [82.4, 0.3, 1.1], [110.0, 0.22, 2.3],
    [164.8, 0.1, 0.7], [220.0, 0.05, 1.9],
  ];
  let lp = 0;
  for (let j = 0; j < N; j++) {
    const t = j / SR;
    const env = clamp01(t / 1.8) * clamp01((DUR - t) / 1.6);
    const arc = 0.7 + 0.3 * Math.sin(Math.min(t / T.PAPER_AT, 1) * Math.PI);
    let v = 0;
    for (const [f, a, ph] of partials) {
      v += Math.sin(TAU * f * t + ph + Math.sin(t * 0.11) * 0.7) * a;
    }
    v *= 0.058 * env * arc * (0.88 + 0.12 * Math.sin(t * 0.8));
    lp += (v - lp) * 0.3;
    L[j] += lp;
    R[j] += lp * 0.95;
  }
}

// ------------------------------------------------------------- movement
/**
 * A transition sound with no hiss in it: a stack of sines gliding up
 * through an octave and a half, low-passed, under a bell envelope. Reads
 * as air moving rather than as a burst of static.
 */
function swell(at, dur, level, pan = 0, down = false) {
  const ratios = [1, 1.5, 2.02, 2.98, 4.03, 5.1];
  const ph = new Float64Array(ratios.length);
  let lp = 0;
  add(at, dur, (s, p) => {
    const env = Math.sin(Math.pow(p, 0.65) * Math.PI) * guard(s, dur, 0.006);
    const glide = down ? 1 - p : p;
    const f0 = 150 * Math.pow(2, 0.6 + glide * 1.5);
    let v = 0;
    for (let k = 0; k < ratios.length; k++) {
      ph[k] += (TAU * f0 * ratios[k]) / SR;
      v += Math.sin(ph[k]) / (k + 1.7);
    }
    lp += (v - lp) * (0.1 + 0.3 * p); // opens as it rises
    return lp * env * level;
  }, pan);
}

/** Low thump with a falling pitch — the weight under a cut or a word. */
function thump(at, level = 1, decay = 12, f1 = 84, f0 = 44) {
  const dur = 0.6;
  let ph = 0;
  add(at, dur, (s) => {
    const e = Math.exp(-s * decay) * guard(s, dur, 0.002);
    const f = f0 + (f1 - f0) * Math.exp(-s * 9);
    ph += (TAU * f) / SR;
    return (Math.sin(ph) + 0.22 * Math.sin(ph * 2)) * e * 0.19 * level;
  });
}

/**
 * A mouse/UI click. Two high partials with a very fast decay give the
 * transient; a short low body gives it a surface to land on. Additive, so
 * it is a click and not a chip of noise.
 */
function click(at, level = 1, bright = 1) {
  const dur = 0.09;
  add(at, dur, (s) => {
    const g = guard(s, dur, 0.0008);
    const hi =
      (Math.sin(TAU * 2750 * bright * s) * 0.6 +
        Math.sin(TAU * 4180 * bright * s) * 0.32) * Math.exp(-s * 340);
    const mid = Math.sin(TAU * 1120 * s) * 0.3 * Math.exp(-s * 190);
    const body = Math.sin(TAU * 430 * s) * 0.36 * Math.exp(-s * 85);
    return (hi + mid + body) * g * 0.14 * level;
  });
}

/** Softer relative of the click, for keystrokes. */
function key(at, level = 1) {
  const dur = 0.05;
  add(at, dur, (s) => {
    const g = guard(s, dur, 0.0008);
    const hi = Math.sin(TAU * 1900 * s) * Math.exp(-s * 300);
    const body = Math.sin(TAU * 520 * s) * 0.5 * Math.exp(-s * 150);
    return (hi + body) * g * 0.05 * level;
  });
}

// ----------------------------------------------------------------- score
for (const sh of T.shots) {
  if (sh.layout === "defocus") continue;
  const pan = sh.layout === "left" ? -0.32 : sh.layout === "right" ? 0.32 : 0;
  const hero = sh.layout === "hero";
  swell(sh.at - 0.22, hero ? 0.9 : 0.66, hero ? 0.15 : 0.105, pan);
  if (hero) thump(sh.at + 0.05, 1.15);
}

// punch cards are the loudest thing on screen, so they get the loudest hit
for (const p of T.punch || []) {
  swell(p.at - 0.16, 0.5, 0.16, 0);
  thump(p.at, 1.5, 9, 104, 48);
  click(p.at, 0.7, 0.85);
  thump(p.at + p.len - 0.05, 0.5, 22, 74, 46);
}

// type lands with weight; extra words get a lighter tap each
for (const b of T.text) {
  thump(b.at + 0.15, 0.75);
  for (let w = 1; w < Math.min(b.words, 4); w++) key(b.at + 0.15 + w * 0.055, 0.7);
}

/**
 * Real interactions in the footage, so the clicks land on things actually
 * being clicked rather than being sprinkled for texture. The cursor in
 * scene.html reaches each of these at the same moment.
 */
for (const c of T.clicks || []) {
  click(c.at, 1.25);
  thump(c.at + 0.02, 0.45, 26, 92, 52);
}
// the chat line is still being typed as that shot opens
for (const k of T.keys || []) key(k, 0.55);

// annotation chips popping in get a soft tick
for (const sh of T.shots) {
  if (sh.annAt == null) continue;
  click(sh.at + sh.annAt, 0.45, 1.15);
}

// riser into the paper sweep — a glide, not a hiss
{
  const t0 = T.PAPER_AT - 1.6;
  const dur = 1.6;
  let ph = 0, ph2 = 0, lp = 0;
  add(t0, dur, (s, p) => {
    const f = 120 * Math.pow(2, p * p * 3.2);
    ph += (TAU * f) / SR;
    ph2 += (TAU * f * 1.5) / SR;
    const v = Math.sin(ph) + 0.45 * Math.sin(ph2);
    lp += (v - lp) * (0.12 + 0.5 * p);
    return lp * 0.085 * p * p * guard(s, dur, 0.05);
  });
  swell(T.PAPER_AT - 0.18, 0.85, 0.2, 0);
  thump(T.PAPER_AT + 0.03, 1.6, 8, 110, 46);
}

// the end card settles on a soft, wide chord
{
  const t0 = T.PAPER_AT + 0.1;
  const dur = DUR - t0;
  const chord = [130.81, 164.81, 196.0, 261.63, 329.63]; // C E G C E
  add(t0, dur, (s) => {
    const env = clamp01(s / 0.6) * clamp01((dur - s) / 1.4);
    let v = 0;
    for (let k = 0; k < chord.length; k++) {
      v += Math.sin(TAU * chord[k] * s + k * 0.7) * (0.5 / (k + 1.5));
    }
    return v * 0.048 * env;
  });
}

// --------------------------------------------------------------- mixdown
let peak = 0;
for (let j = 0; j < N; j++) peak = Math.max(peak, Math.abs(L[j]), Math.abs(R[j]));
const gain = peak > 0 ? 0.62 / peak : 1;
const soft = (v) => Math.tanh(v * 1.2) * 0.82;

const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write("WAVEfmt ", 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(N * 4, 40);

let outPeak = 0, rms = 0, hf = 0, prev = 0;
for (let j = 0; j < N; j++) {
  const l = soft(L[j] * gain);
  const r = soft(R[j] * gain);
  outPeak = Math.max(outPeak, Math.abs(l), Math.abs(r));
  rms += l * l;
  hf += (l - prev) * (l - prev); // crude high-frequency energy — the hiss meter
  prev = l;
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(l * 32767))), 44 + j * 4);
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(r * 32767))), 46 + j * 4);
}
mkdirSync("out", { recursive: true });
writeFileSync("out/bed.wav", buf);

const db = (v) => (20 * Math.log10(Math.max(v, 1e-9))).toFixed(1);
console.log(
  `out/bed.wav  ${DUR.toFixed(2)}s  peak ${db(outPeak)} dBFS  ` +
    `rms ${db(Math.sqrt(rms / N))} dBFS  hf ${db(Math.sqrt(hf / N))} dBFS`,
);
