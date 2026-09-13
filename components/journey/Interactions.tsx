"use client";

/**
 * THE ONE SMALL INTERACTION IN A MISSION.
 *
 * Four kinds, each with an answer the founder can learn from: choose the
 * better line, sort observations from assumptions, rewrite a bad sentence
 * and judge your own against what "better" means, or see what each part
 * of a test plan protects you from. One attempt reveals every "why", so
 * a wrong first answer teaches as much as a right one; the points that
 * come with a right first answer are small, and nothing here is a quiz
 * for its own sake.
 */
import { useState } from "react";
import { journey } from "@founderfloor/shared";

type Interaction = journey.Interaction;

export default function InteractionView({ interaction, onDone }: { interaction: Interaction; onDone: (right: boolean) => void }) {
  switch (interaction.kind) {
    case "choose":
      return <Choose i={interaction} onDone={onDone} />;
    case "sort":
      return <Sort i={interaction} onDone={onDone} />;
    case "edit":
      return <Edit i={interaction} onDone={onDone} />;
    case "plan":
      return <Plan i={interaction} onDone={onDone} />;
  }
}

function Choose({ i, onDone }: { i: Extract<Interaction, { kind: "choose" }>; onDone: (right: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const pick = (n: number) => {
    if (picked !== null) return;
    setPicked(n);
    onDone(i.options[n].good);
  };
  return (
    <div className="interaction">
      <p className="prompt">{i.prompt}</p>
      <div className="opts">
        {i.options.map((o, n) => {
          const revealed = picked !== null;
          const st = revealed ? (o.good ? "good" : n === picked ? "bad" : undefined) : undefined;
          return (
            <button key={n} type="button" className="opt" data-state={st} disabled={revealed} onClick={() => pick(n)} aria-pressed={picked === n}>
              <span>{o.text}</span>
              {revealed ? (
                <>
                  {st ? <span className="verdict">{o.good ? "The better one" : "Not this one"}</span> : null}
                  <span className="why">{o.why}</span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        <p className="i-result" data-tone={i.options[picked].good ? "good" : undefined}>
          {i.options[picked].good ? "Yes. That is the one that can surprise you." : "Not that one. The reasons are above, and they are the lesson."}
        </p>
      ) : null}
    </div>
  );
}

function Sort({ i, onDone }: { i: Extract<Interaction, { kind: "sort" }>; onDone: (right: boolean) => void }) {
  const [answers, setAnswers] = useState<(0 | 1 | null)[]>(() => i.items.map(() => null));
  const revealed = answers.every((a) => a !== null);
  const set = (n: number, b: 0 | 1) => {
    if (revealed) return;
    const next = [...answers];
    next[n] = b;
    setAnswers(next);
    if (next.every((a) => a !== null)) onDone(next.every((a, k) => a === i.items[k].bucket));
  };
  const right = revealed ? answers.filter((a, k) => a === i.items[k].bucket).length : 0;
  return (
    <div className="interaction">
      <p className="prompt">{i.prompt}</p>
      <div className="sort-items">
        {i.items.map((it, n) => {
          const st = revealed ? (answers[n] === it.bucket ? "good" : "bad") : undefined;
          return (
            <div key={n} className="sort-item" data-state={st}>
              <p>{it.text}</p>
              <div className="sort-btns" role="group" aria-label={`Sort: ${it.text}`}>
                {i.buckets.map((label, b) => (
                  <button key={b} type="button" className="sort-btn" aria-pressed={answers[n] === b} disabled={revealed} onClick={() => set(n, b as 0 | 1)}>
                    {label}
                  </button>
                ))}
              </div>
              {revealed ? (
                <span className="why">
                  {st === "good" ? "Right. " : `It is ${i.buckets[it.bucket].toLowerCase()}. `}
                  {it.why}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      {revealed ? (
        <p className="i-result" data-tone={right === i.items.length ? "good" : undefined}>
          {right === i.items.length ? "All of them. You can tell the two apart, which is most of stage one." : `${right} of ${i.items.length}. The ones marked above are where the line is easy to miss.`}
        </p>
      ) : null}
    </div>
  );
}

function Edit({ i, onDone }: { i: Extract<Interaction, { kind: "edit" }>; onDone: (right: boolean) => void }) {
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(false);
  const [ticks, setTicks] = useState<boolean[]>(() => i.better.map(() => false));
  const check = () => {
    if (checked) return;
    setChecked(true);
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    onDone(words >= 6 && text.trim().toLowerCase() !== i.before.toLowerCase());
  };
  return (
    <div className="interaction">
      <p className="prompt">{i.prompt}</p>
      <p className="edit-before">{i.before}</p>
      <div className="j-field">
        <label htmlFor="edit-rewrite">Your version</label>
        <textarea id="edit-rewrite" className="j-textarea" value={text} onChange={(e) => setText(e.target.value)} disabled={checked} rows={2} />
      </div>
      {!checked ? (
        <div className="j-row">
          <button type="button" className="j-btn quiet" onClick={check} disabled={!text.trim()}>
            Check my version
          </button>
        </div>
      ) : (
        <>
          <p className="i-result">Judge it yourself. A good version does all of these; tick the ones yours does.</p>
          <ul className="edit-better">
            {i.better.map((b, n) => (
              <li key={n}>
                <input
                  id={`better-${n}`}
                  type="checkbox"
                  checked={ticks[n]}
                  onChange={(e) => {
                    const next = [...ticks];
                    next[n] = e.target.checked;
                    setTicks(next);
                  }}
                />
                <label htmlFor={`better-${n}`}>{b}</label>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Plan({ i, onDone }: { i: Extract<Interaction, { kind: "plan" }>; onDone: (right: boolean) => void }) {
  const [shown, setShown] = useState(1);
  const all = shown >= i.pieces.length;
  const more = () => {
    const next = shown + 1;
    setShown(next);
    if (next >= i.pieces.length) onDone(true);
  };
  return (
    <div className="interaction">
      <p className="prompt">{i.prompt}</p>
      <ul className="plan-pieces">
        {i.pieces.map((p, n) => (
          <li key={n} className="plan-piece" hidden={n >= shown}>
            <b>{p.label}</b>
            <span>Without it, {p.without}.</span>
          </li>
        ))}
      </ul>
      {!all ? (
        <div className="j-row">
          <button type="button" className="j-btn quiet" onClick={more}>
            Next part
          </button>
        </div>
      ) : (
        <p className="i-result" data-tone="good">Five parts. You will write each of them in a moment.</p>
      )}
    </div>
  );
}
