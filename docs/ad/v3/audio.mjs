/**
 * Sound design for the cut — synthesised from scratch, synced to timing.json.
 *
 * Deliberately NOT music. Writing a tune from raw samples tends to land
 * somewhere between ringtone and hold music; a designed bed (low drone,
 * transition whooshes, impacts under the type, one riser into the end card)
 * is both easier to get right and what most product ads actually run under
 * their licensed track. Drop a real track over this and it still works.
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

const idx = (t) => Math.max(0, Math.round(t * SR));
/** deterministic noise — Math.random would make every render different */
let seed = 20260731;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return (seed / 0x3fffffff) - 1;
};
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function add(t, dur, fn, pan = 0) {
  const i0 = idx(t);
  const n = Math.round(dur * SR);
  const gl = Math.sqrt((1 - pan) / 2) * Math.SQRT2;
  const gr = Math.sqrt((1 + pan) / 2) * Math.SQRT2;
  for (let i = 0; i < n; i++) {
    const j = i0 + i;
    if (j >= N) break;
    const v = fn(i / SR, i / n);
    L[j] += v * gl;
    R[j] += v * gr;
  }
}

// ---------------------------------------------------------------- the bed
// Three detuned low sines with slow tremolo. Sits under everything at a
// level you feel more than hear.
{
  const partials = [
    [55.0, 0.55], [82.4, 0.30], [110.0, 0.22], [164.8, 0.09], [220.0, 0.05],
  ];
  let lp = 0;
  for (let j = 0; j < N; j++) {
    const t = j / SR;
    const env = clamp01(t / 1.6) * clamp01((DUR - t) / 1.4);
    // the bed lifts a little through the middle and settles for the end card
    const arc = 0.72 + 0.28 * Math.sin(Math.min(t / T.PAPER_AT, 1) * Math.PI);
    let v = 0;
    for (const [f, a] of partials) {
      v += Math.sin(2 * Math.PI * f * t + Math.sin(t * 0.13) * 0.6) * a;
    }
    v *= 0.055 * env * arc * (0.88 + 0.12 * Math.sin(t * 0.9));
    lp += (v - lp) * 0.28; // one-pole smooth, keeps it from buzzing
    L[j] += lp;
    R[j] += lp * 0.96;
  }
}

// ------------------------------------------------------- transition whoosh
// Band-limited noise swept upward, one per shot change.
function whoosh(t, dur, level, pan) {
  let bp = 0, lp = 0;
  add(t, dur, (s, p) => {
    const env = Math.sin(Math.pow(p, 0.7) * Math.PI); // soft in, soft out
    const cut = 0.02 + 0.32 * p * p;                  // sweeps up
    const n = rnd();
    lp += (n - lp) * cut;
    bp += (lp - bp) * 0.02;
    return (lp - bp) * env * level;
  }, pan);
}

// ------------------------------------------------------------- type impact
// A short low thump plus a tick, so words land rather than appear.
function impact(t, level = 1) {
  add(t, 0.5, (s) => {
    const e = Math.exp(-s * 13);
    const f = 78 * Math.exp(-s * 9) + 42;
    return Math.sin(2 * Math.PI * f * s) * e * 0.17 * level;
  });
  add(t, 0.09, (s, p) => {
    const e = Math.exp(-s * 60);
    return rnd() * e * 0.045 * level;
  });
}

// --------------------------------------------------------------- the score
for (const [i, sh] of T.shots.entries()) {
  if (sh.layout === "defocus") continue;
  const pan = sh.layout === "left" ? -0.35 : sh.layout === "right" ? 0.35 : 0;
  const strong = sh.layout === "hero";
  whoosh(sh.at - 0.20, strong ? 0.85 : 0.62, strong ? 0.16 : 0.115, pan);
  if (strong) impact(sh.at + 0.06, 1.15);
}

for (const b of T.text) {
  impact(b.at + 0.15, 0.8);
  // a lighter tick per extra word, so a multi-word line feels typed in
  for (let w = 1; w < Math.min(b.words, 4); w++) {
    add(b.at + 0.15 + w * 0.055, 0.06, (s) => rnd() * Math.exp(-s * 90) * 0.016);
  }
}

// punch cards: a hard hit on the cut in, a softer one on the cut out
for (const p of T.punch || []) {
  add(p.at, 0.7, (s) => {
    const e = Math.exp(-s * 9);
    const f = 96 * Math.exp(-s * 7) + 46;
    return Math.sin(2 * Math.PI * f * s) * e * 0.30;
  });
  add(p.at, 0.16, (s) => rnd() * Math.exp(-s * 34) * 0.10);
  whoosh(p.at - 0.14, 0.5, 0.17, 0);
  add(p.at + p.len - 0.06, 0.3, (s) => {
    const e = Math.exp(-s * 20);
    return Math.sin(2 * Math.PI * 70 * s) * e * 0.12;
  });
}

// riser into the paper sweep, then the sweep itself
{
  const t0 = T.PAPER_AT - 1.7;
  let lp = 0;
  add(t0, 1.7, (s, p) => {
    const n = rnd();
    lp += (n - lp) * (0.03 + 0.45 * p * p);
    const tone = Math.sin(2 * Math.PI * (180 + 620 * p * p) * s) * 0.05 * p * p;
    return (lp * 0.5 * p * p + tone) * 0.55;
  });
  whoosh(T.PAPER_AT - 0.16, 0.9, 0.22, 0);
  impact(T.PAPER_AT + 0.04, 1.5);
}

// the end card settles on a soft, wide chord
{
  const t0 = T.PAPER_AT + 0.10;
  const chord = [130.81, 164.81, 196.0, 261.63]; // C E G C
  add(t0, DUR - t0, (s, p) => {
    const env = clamp01(s / 0.5) * clamp01((DUR - t0 - s) / 1.2);
    let v = 0;
    for (const [k, f] of chord.entries()) {
      v += Math.sin(2 * Math.PI * f * s + k) * (0.5 / (k + 1.4));
    }
    return v * 0.045 * env;
  });
}

// --------------------------------------------------------------- mixdown
let peak = 0;
for (let j = 0; j < N; j++) peak = Math.max(peak, Math.abs(L[j]), Math.abs(R[j]));
// leave headroom: this is a bed, it should never fight a voiceover
const gain = peak > 0 ? 0.62 / peak : 1;
const soft = (v) => Math.tanh(v * 1.25) * 0.8;

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
let outPeak = 0;
for (let j = 0; j < N; j++) {
  const l = soft(L[j] * gain);
  const r = soft(R[j] * gain);
  outPeak = Math.max(outPeak, Math.abs(l), Math.abs(r));
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(l * 32767))), 44 + j * 4);
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(r * 32767))), 46 + j * 4);
}
mkdirSync("out", { recursive: true });
writeFileSync("out/bed.wav", buf);

let rms = 0;
for (let j = 0; j < N; j++) rms += (L[j] * gain) ** 2;
rms = Math.sqrt(rms / N);
console.log(
  `out/bed.wav  ${DUR.toFixed(2)}s  peak ${(20 * Math.log10(outPeak)).toFixed(1)} dBFS  ` +
  `rms ${(20 * Math.log10(rms)).toFixed(1)} dBFS`,
);
