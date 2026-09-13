"use client";

/**
 * ONE EXERCISE, ANY KIND.
 *
 * Six kinds, one contract: the learner commits an answer, every "why"
 * is revealed at once, and `onDone(right)` fires exactly once. A wrong
 * answer teaches as much as a right one because the whys are the lesson
 * and the answer is only the excuse to read them; the engine (course
 * state) puts what was missed at the front of the next practice.
 *
 * Nothing here is timed, nothing costs a life, and the learner can read
 * the reveal for as long as they like before moving on.
 */
import { useMemo, useState } from "react";
import type { course } from "@founderfloor/shared";

type Exercise = course.Exercise;
type Done = (right: boolean) => void;

export default function ExerciseView({ exercise, onDone }: { exercise: Exercise; onDone: Done }) {
  switch (exercise.kind) {
    case "choose":
      return <Choose x={exercise} onDone={onDone} />;
    case "sort":
      return <Sort x={exercise} onDone={onDone} />;
    case "order":
      return <Order x={exercise} onDone={onDone} />;
    case "match":
      return <Match x={exercise} onDone={onDone} />;
    case "fill":
      return <Fill x={exercise} onDone={onDone} />;
    case "edit":
      return <Edit x={exercise} onDone={onDone} />;
  }
}

/** A fixed shuffle for a given text, so a re-render does not reorder the cards under a finger. */
function stableShuffle<T>(xs: T[], salt: string): T[] {
  let h = 2166136261;
  for (const c of salt) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const a = xs.map((x, i) => ({ x, k: (Math.imul(h + i * 2654435761, 2246822519) >>> 0) }));
  a.sort((p, q) => p.k - q.k);
  return a.map((p) => p.x);
}

function Choose({ x, onDone }: { x: Extract<Exercise, { kind: "choose" }>; onDone: Done }) {
  const [picked, setPicked] = useState<number | null>(null);
  const pick = (n: number) => {
    if (picked !== null) return;
    setPicked(n);
    onDone(x.options[n].good);
  };
  return (
    <div className="interaction">
      <p className="prompt">{x.prompt}</p>
      <div className="opts">
        {x.options.map((o, n) => {
          const revealed = picked !== null;
          const st = revealed ? (o.good ? "good" : n === picked ? "bad" : undefined) : undefined;
          return (
            <button key={n} type="button" className="opt" data-state={st} disabled={revealed} onClick={() => pick(n)} aria-pressed={picked === n}>
              <span>{o.text}</span>
              {revealed ? (
                <>
                  {st ? <span className="verdict">{o.good ? "This one" : "Not this one"}</span> : null}
                  <span className="why">{o.why}</span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Sort({ x, onDone }: { x: Extract<Exercise, { kind: "sort" }>; onDone: Done }) {
  const [answers, setAnswers] = useState<(0 | 1 | null)[]>(() => x.items.map(() => null));
  const revealed = answers.every((a) => a !== null);
  const set = (n: number, b: 0 | 1) => {
    if (revealed) return;
    const next = [...answers];
    next[n] = b;
    setAnswers(next);
    if (next.every((a) => a !== null)) onDone(next.every((a, k) => a === x.items[k].bucket));
  };
  const right = revealed ? answers.filter((a, k) => a === x.items[k].bucket).length : 0;
  return (
    <div className="interaction">
      <p className="prompt">{x.prompt}</p>
      <div className="sort-items">
        {x.items.map((it, n) => {
          const st = revealed ? (answers[n] === it.bucket ? "good" : "bad") : undefined;
          return (
            <div key={n} className="sort-item" data-state={st}>
              <p>{it.text}</p>
              <div className="sort-btns" role="group" aria-label={`Sort: ${it.text}`}>
                {x.buckets.map((label, b) => (
                  <button key={b} type="button" className="sort-btn" aria-pressed={answers[n] === b} disabled={revealed} onClick={() => set(n, b as 0 | 1)}>
                    {label}
                  </button>
                ))}
              </div>
              {revealed ? (
                <span className="why">
                  {st === "good" ? "Right. " : `It is ${x.buckets[it.bucket].toLowerCase()}. `}
                  {it.why}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      {revealed ? (
        <p className="i-result" data-tone={right === x.items.length ? "good" : undefined}>
          {right === x.items.length ? "All of them." : `${right} of ${x.items.length}. The marked ones are where the line is easy to miss.`}
        </p>
      ) : null}
    </div>
  );
}

/** Tap the steps in the order you think they go. The slots fill as you tap. */
function Order({ x, onDone }: { x: Extract<Exercise, { kind: "order" }>; onDone: Done }) {
  const pool = useMemo(() => stableShuffle(x.steps.map((s, i) => ({ s, i })), x.prompt), [x]);
  const [picked, setPicked] = useState<number[]>([]);
  const revealed = picked.length === x.steps.length;
  const tap = (i: number) => {
    if (revealed || picked.includes(i)) return;
    const next = [...picked, i];
    setPicked(next);
    if (next.length === x.steps.length) onDone(next.every((v, k) => v === k));
  };
  const undo = () => {
    if (revealed) return;
    setPicked((p) => p.slice(0, -1));
  };
  const rightCount = picked.filter((v, k) => v === k).length;
  return (
    <div className="interaction">
      <p className="prompt">{x.prompt}</p>
      <ol className="order-slots" aria-label="Your order">
        {x.steps.map((_, k) => {
          const v = picked[k];
          const st = revealed ? (v === k ? "good" : "bad") : undefined;
          return (
            <li key={k} className="order-slot" data-state={st} data-filled={v !== undefined ? "" : undefined}>
              <span className="order-n">{k + 1}</span>
              <span>{v !== undefined ? x.steps[v] : "…"}</span>
            </li>
          );
        })}
      </ol>
      {!revealed ? (
        <>
          <div className="order-pool" role="group" aria-label="Steps to place">
            {pool.map(({ s, i }) => (
              <button key={i} type="button" className="sort-btn order-card" disabled={picked.includes(i)} onClick={() => tap(i)}>
                {s}
              </button>
            ))}
          </div>
          {picked.length ? (
            <div className="j-row">
              <button type="button" className="j-btn ghost" onClick={undo}>Undo last</button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          {rightCount !== x.steps.length ? (
            <ol className="order-slots" aria-label="The order this lesson gives">
              {x.steps.map((s, k) => (
                <li key={k} className="order-slot" data-state="good"><span className="order-n">{k + 1}</span><span>{s}</span></li>
              ))}
            </ol>
          ) : null}
          <p className="i-result" data-tone={rightCount === x.steps.length ? "good" : undefined}>
            {rightCount === x.steps.length ? "That is the order. " : ""}
            {x.why}
          </p>
        </>
      )}
    </div>
  );
}

/** Tap a term, then its meaning. A wrong pairing is marked and counts as a miss; every pair still gets made. */
function Match({ x, onDone }: { x: Extract<Exercise, { kind: "match" }>; onDone: Done }) {
  const meanings = useMemo(() => stableShuffle(x.pairs.map((p, i) => ({ m: p.meaning, i })), x.prompt), [x]);
  const [term, setTerm] = useState<number | null>(null);
  const [made, setMade] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [shake, setShake] = useState<number | null>(null);
  const revealed = made.length === x.pairs.length;
  const pickMeaning = (i: number) => {
    if (term === null || revealed || made.includes(i)) return;
    if (i === term) {
      const next = [...made, i];
      setMade(next);
      setTerm(null);
      if (next.length === x.pairs.length) onDone(misses === 0);
    } else {
      setMisses((n) => n + 1);
      setShake(i);
      setTimeout(() => setShake(null), 400);
    }
  };
  return (
    <div className="interaction">
      <p className="prompt">{x.prompt}</p>
      <div className="match-grid">
        <div className="match-col" role="group" aria-label="Terms">
          {x.pairs.map((p, i) => (
            <button key={i} type="button" className="sort-btn match-card" aria-pressed={term === i} disabled={made.includes(i)} data-state={made.includes(i) ? "good" : undefined} onClick={() => setTerm(term === i ? null : i)}>
              {p.term}
            </button>
          ))}
        </div>
        <div className="match-col" role="group" aria-label="Meanings">
          {meanings.map(({ m, i }) => (
            <button key={i} type="button" className="sort-btn match-card" disabled={made.includes(i) || term === null} data-state={made.includes(i) ? "good" : shake === i ? "bad" : undefined} onClick={() => pickMeaning(i)}>
              {m}
            </button>
          ))}
        </div>
      </div>
      {!revealed ? <p className="j-small">{term === null ? "Tap a term on the left." : "Now tap what it means."}</p> : null}
      {revealed ? (
        <p className="i-result" data-tone={misses === 0 ? "good" : undefined}>
          {misses === 0 ? "Every pair, first time." : `All paired, with ${misses} ${misses === 1 ? "miss" : "misses"} on the way. Those come back in practice.`}
        </p>
      ) : null}
    </div>
  );
}

function Fill({ x, onDone }: { x: Extract<Exercise, { kind: "fill" }>; onDone: Done }) {
  const [picked, setPicked] = useState<number | null>(null);
  const revealed = picked !== null;
  const parts = x.prompt.split("___");
  const pick = (n: number) => {
    if (revealed) return;
    setPicked(n);
    onDone(n === x.answer);
  };
  return (
    <div className="interaction">
      <p className="prompt fill-prompt">
        {parts.map((p, i) => (
          <span key={i}>
            {p}
            {i < parts.length - 1 ? (
              <span className="fill-blank" data-state={revealed ? (picked === x.answer ? "good" : "bad") : undefined}>
                {revealed ? x.options[picked!] : "______"}
              </span>
            ) : null}
          </span>
        ))}
      </p>
      <div className="sort-btns" role="group" aria-label="Choices">
        {x.options.map((o, n) => (
          <button key={n} type="button" className="sort-btn" aria-pressed={picked === n} disabled={revealed} data-state={revealed ? (n === x.answer ? "good" : n === picked ? "bad" : undefined) : undefined} onClick={() => pick(n)}>
            {o}
          </button>
        ))}
      </div>
      {revealed ? (
        <p className="i-result" data-tone={picked === x.answer ? "good" : undefined}>
          {picked === x.answer ? "" : `It is "${x.options[x.answer]}". `}
          {x.why}
        </p>
      ) : null}
    </div>
  );
}

function Edit({ x, onDone }: { x: Extract<Exercise, { kind: "edit" }>; onDone: Done }) {
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(false);
  const check = () => {
    if (checked) return;
    setChecked(true);
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    onDone(words >= 6 && text.trim().toLowerCase() !== x.before.toLowerCase());
  };
  return (
    <div className="interaction">
      <p className="prompt">{x.prompt}</p>
      <p className="edit-before">{x.before}</p>
      <div className="j-field">
        <label htmlFor="edit-rewrite">Your version</label>
        <textarea id="edit-rewrite" className="j-textarea" value={text} onChange={(e) => setText(e.target.value)} disabled={checked} rows={2} />
      </div>
      {!checked ? (
        <div className="j-row">
          <button type="button" className="j-btn quiet" onClick={check} disabled={!text.trim()}>Check my version</button>
        </div>
      ) : (
        <>
          <p className="i-result">Compare yours with these. A good version is as specific as they are.</p>
          <ul className="edit-better">
            {x.better.map((b, n) => <li key={n}><span aria-hidden>→</span><span>{b}</span></li>)}
          </ul>
        </>
      )}
    </div>
  );
}
