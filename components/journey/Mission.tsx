"use client";

/**
 * A MISSION, PART BY PART.
 *
 * Seven parts in a fixed order, one on screen at a time with a bar that
 * shows where you are: objective, explanation, example, the interaction,
 * the action, the saved output, the reflection. One button moves you on.
 *
 * Two kinds of mission behave differently at the action. For the eight
 * that happen in the app, the action leads straight to the output. For
 * the two that need the world — a conversation, a test — the founder is
 * asked whether it has happened. If it has, they record it and the
 * real-world part is marked done. If not, they finish the lesson and the
 * mission stays open on the path, with no nagging, until they come back
 * to record it. The lesson and the real-world part are never confused.
 *
 * A finished mission opens in review: every part on one page, the saved
 * lines still editable. Nothing is ever locked.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { journey } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";
import InteractionView from "@/components/journey/Interactions";
import Coach from "@/components/journey/Coach";
import Celebrate from "@/components/journey/Celebrate";
import Guide from "@/components/journey/Guide";

type Part = "objective" | "explain" | "example" | "interaction" | "action" | "output" | "reflect" | "done";
type Values = Partial<Record<journey.OutputKey, string>>;

const toText = (v: string | string[] | undefined): string => (Array.isArray(v) ? v.join("\n") : v ?? "");
const fromText = (f: journey.OutputField, s: string): string | string[] => (f.kind === "list" ? s.split("\n").map((x) => x.trim()).filter(Boolean) : s.trim());

export default function Mission({ id }: { id: string }) {
  const { state, ready, dispatch, now } = useJourney();
  const m = journey.missionById(id);
  const prog = state.missions[id] ?? {};
  const lessonRead = Boolean(prog.lessonDoneAt);
  const actionRecorded = Boolean(prog.actionDoneAt);

  const parts = useMemo<Part[]>(() => {
    if (!m) return [];
    const p: Part[] = ["objective", "explain", "example"];
    if (m.interaction) p.push("interaction");
    p.push("action", "output", "reflect");
    return p;
  }, [m]);

  const [step, setStep] = useState(0);
  const [recording, setRecording] = useState(false);
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Partial<Record<journey.OutputKey, string>>>({});
  const [reflection, setReflection] = useState("");
  const [finished, setFinished] = useState(false);
  const [interactionDone, setInteractionDone] = useState(false);
  const [interactionRight, setInteractionRight] = useState<boolean | null>(null);
  const [startedAt] = useState(() => Date.now());

  // Seed the form from what is saved, once storage has been read.
  useEffect(() => {
    if (!ready || !m) return;
    const v: Values = {};
    for (const f of m.output) v[f.key] = toText(state.outputs[f.key]?.value);
    setValues(v);
    setReflection(prog.reflection ?? "");
    setInteractionDone(Boolean(prog.interactionTries));
    // A read lesson with the real-world part still open goes straight to recording.
    if (lessonRead && m.outside && !actionRecorded) {
      setRecording(true);
      setStep(parts.indexOf("output"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, id]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  useEffect(() => {
    document.body.dataset.inLesson = "1";
    return () => {
      delete document.body.dataset.inLesson;
    };
  }, []);

  if (!m) {
    return (
      <div className="mission">
        <h1>No such mission</h1>
        <p className="j-muted">The road has ten stops and this is not one of them.</p>
        <Link className="j-btn quiet" href="/journey">Back to the journey</Link>
      </div>
    );
  }
  if (!ready) return <p className="j-loading">Opening the mission…</p>;

  const stage = journey.STAGES.find((s) => s.id === m.stage)!;
  const review = lessonRead && (!m.outside || actionRecorded) && !recording && !finished;
  const current: Part = finished ? "done" : parts[step] ?? "objective";
  const next = () => setStep((s) => Math.min(parts.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const go = (p: Part) => setStep(Math.max(0, parts.indexOf(p)));

  const setVal = (key: journey.OutputKey, v: string) => {
    setValues((vals) => ({ ...vals, [key]: v }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /** Save every field; returns false and shows what is missing when a required one is blank. */
  const saveOutputs = (): boolean => {
    const missing: Partial<Record<journey.OutputKey, string>> = {};
    for (const f of m.output) {
      const raw = values[f.key] ?? "";
      const val = fromText(f, raw);
      const blank = Array.isArray(val) ? val.length === 0 : !val;
      if (blank && !f.optional) missing[f.key] = "This one is needed. A rough line is fine.";
    }
    if (Object.keys(missing).length) {
      setErrors(missing);
      return false;
    }
    const at = now();
    for (const f of m.output) {
      const val = fromText(f, values[f.key] ?? "");
      const blank = Array.isArray(val) ? val.length === 0 : !val;
      if (!blank) dispatch({ type: "save", mission: m.id, key: f.key, value: val, at });
    }
    if (m.outside && recording) dispatch({ type: "action-done", mission: m.id, at });
    return true;
  };

  const finishLesson = () => {
    const at = now();
    if (reflection.trim()) dispatch({ type: "reflect", mission: m.id, text: reflection, at });
    dispatch({ type: "lesson-done", mission: m.id, at });
    setFinished(true);
    setRecording(false);
  };

  const after = journey.nextMission(journey.apply(state, { type: "lesson-done", mission: m.id, at: now() }));

  // ── the parts ──────────────────────────────────────────────────────

  const Objective = (
    <section className="m-part" aria-labelledby="p-obj">
      <div className="m-part-label"><span className="j-label">Objective</span></div>
      <h2 id="p-obj">{m.objective}</h2>
      <p className="j-muted">{m.why}</p>
    </section>
  );
  const Explain = (
    <section className="m-part" aria-labelledby="p-exp">
      <div className="m-part-label"><span className="j-label">The short version</span></div>
      <h2 id="p-exp" className="sr-only" style={{ position: "absolute", left: -9999 }}>Explanation</h2>
      <div className="m-explain">{m.explain.map((p, n) => <p key={n}>{p}</p>)}</div>
    </section>
  );
  const Example = (
    <section className="m-part" aria-labelledby="p-ex">
      <div className="m-part-label"><span className="j-label">An example</span></div>
      <h2 id="p-ex" style={{ position: "absolute", left: -9999 }}>Example</h2>
      <div className="m-example">
        {m.example.map((e, n) => (
          <div key={n} className="ex">
            <span className="ex-label">{e.label}</span>
            <p>{e.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
  const Interaction = m.interaction ? (
    <section className="m-part" aria-labelledby="p-int">
      <div className="m-part-label"><span className="j-label">Try it</span></div>
      <h2 id="p-int" style={{ position: "absolute", left: -9999 }}>Interaction</h2>
      <InteractionView
        interaction={m.interaction}
        onDone={(right) => {
          setInteractionDone(true);
          setInteractionRight(right);
          dispatch({ type: "interaction", mission: m.id, right, at: now() });
        }}
      />
    </section>
  ) : null;
  const Action = (
    <section className="m-part m-action" aria-labelledby="p-act">
      <div className="m-part-label"><span className="j-label">{m.outside ? "Outside the app" : "Now do this"}</span></div>
      <h2 id="p-act" style={{ position: "absolute", left: -9999 }}>Action</h2>
      <p>{m.action.text}</p>
      {m.outside && m.action.pending ? <p className="m-pending">{m.action.pending}</p> : null}
    </section>
  );
  const Output = (
    <section className="m-part m-output" aria-labelledby="p-out">
      <div className="m-part-label"><span className="j-label">{m.outside && recording ? "Record what happened" : "Write it down"}</span></div>
      <h2 id="p-out" style={{ position: "absolute", left: -9999 }}>Your output</h2>
      {m.outside && recording && lessonRead ? <p className="j-muted">You finished this lesson earlier. This is the real-world part.</p> : null}
      {m.output.map((f) => {
        const fid = `f-${f.key}`;
        const v = values[f.key] ?? "";
        return (
          <div key={f.key} className="j-field">
            <label htmlFor={fid}>{f.label}{f.optional ? <span className="j-small"> (optional)</span> : null}</label>
            <span className="ev" data-ev={f.evidence}>{f.evidence === "assumption" ? "Assumption" : f.evidence === "reported" ? "You reported this" : "What a customer did"}</span>
            <span className="j-hint">{f.hint}</span>
            {f.kind === "choice" ? (
              <div className="j-choices" role="radiogroup" aria-labelledby={fid}>
                {f.options!.map((o) => (
                  <label key={o.value} className="j-choice">
                    <input type="radio" name={fid} value={o.value} checked={v === o.value} onChange={() => setVal(f.key, o.value)} />
                    <i aria-hidden />
                    <span>{o.text}</span>
                  </label>
                ))}
              </div>
            ) : f.kind === "text" ? (
              <input id={fid} className="j-input" value={v} onChange={(e) => setVal(f.key, e.target.value)} aria-invalid={errors[f.key] ? "true" : undefined} aria-describedby={errors[f.key] ? `${fid}-err` : undefined} />
            ) : (
              <textarea id={fid} className="j-textarea" value={v} onChange={(e) => setVal(f.key, e.target.value)} rows={f.kind === "list" ? 4 : 3} aria-invalid={errors[f.key] ? "true" : undefined} aria-describedby={errors[f.key] ? `${fid}-err` : undefined} />
            )}
            {errors[f.key] ? <p id={`${fid}-err`} className="j-err" role="alert">{errors[f.key]}</p> : null}
            {f.kind !== "choice" ? <Coach missionId={m.id} fieldKey={f.key} text={v} onAccept={(s) => setVal(f.key, s)} /> : null}
          </div>
        );
      })}
    </section>
  );
  const Reflect = (
    <section className="m-part m-reflect" aria-labelledby="p-ref">
      <div className="m-part-label"><span className="j-label">Before you go</span></div>
      <h2 id="p-ref" style={{ position: "absolute", left: -9999 }}>Reflection</h2>
      <p className="q">{m.reflect}</p>
      <div className="j-field">
        <label htmlFor="reflect">A line or two, if you like</label>
        <textarea id="reflect" className="j-textarea" value={reflection} onChange={(e) => setReflection(e.target.value)} rows={2} />
      </div>
    </section>
  );
  const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60_000));
  const earned = journey.POINTS.lesson + (prog.interactionRight ? journey.POINTS.interaction : 0);
  const openOutside = m.outside && !journey.actionDone(state, m.id);
  const Done = (
    <section className="m-complete" aria-labelledby="p-done">
      <Confetti />
      <span className="guide-face" data-mood="hop"><Guide scale={3} /></span>
      <span className="j-label">{m.outside && recording ? "Recorded" : "Lesson complete"}</span>
      <h1 id="p-done">{openOutside ? "Lesson done. The rest is out there." : m.outside && recording ? "Written down. That is evidence now." : "Nicely done."}</h1>
      <div className="m-stats">
        {!lessonRead || !m.outside || !recording ? (
          <div className="m-stat"><span>Points</span><b>+{earned}</b></div>
        ) : null}
        <div className="m-stat" data-kind="time"><span>Time</span><b>{minutes} min</b></div>
        {openOutside ? <div className="m-stat" data-kind="open"><span>Still open</span><b>Real-world part</b></div> : null}
      </div>
      {openOutside ? (
        <p className="j-muted">It stays on your path with a blue ring, and you record it whenever it has happened. Nothing nags.</p>
      ) : null}
      <p className="m-next">{m.next}</p>
    </section>
  );

  // ── review: everything on one page ─────────────────────────────────
  if (review) {
    return (
      <div className="mission m-review">
        <div className="m-bar">
          <Link href="/journey" className="m-close" aria-label="Leave the lesson">✕</Link>
          <div className="prog-bar" role="progressbar" aria-label="Lesson complete" aria-valuenow={100} aria-valuemin={0} aria-valuemax={100}><i style={{ width: "100%" }} /></div>
          <span className="chip"><b>{state.points}</b> pts</span>
        </div>
        <Head m={m} stage={stage} lessonRead actionRecorded={actionRecorded} />
        {Objective}
        {Explain}
        {Example}
        {Action}
        {Output}
        <div className="m-dock">
          <div className="m-dock-in">
            <Link className="j-btn ghost" href="/journey">Back to the journey</Link>
            <div className="j-row"><button type="button" className="j-btn primary" onClick={() => { if (saveOutputs()) setFinished(true); }}>Save changes</button></div>
          </div>
        </div>
        {prog.reflection ? (
          <section className="m-part m-reflect"><div className="m-part-label"><span className="j-label">You wrote, at the end</span></div><p className="j-muted">{prog.reflection}</p></section>
        ) : null}
        {finished ? Done : null}
        <Celebrate />
      </div>
    );
  }

  // ── the stepper ────────────────────────────────────────────────────
  const canContinue = current !== "interaction" || interactionDone;
  const pct = current === "done" ? 100 : Math.round(((step + 1) / (parts.length + 1)) * 100);
  const tone = current === "interaction" && interactionDone ? (interactionRight ? "good" : "hmm") : undefined;
  const feedback = (() => {
    const k = m.interaction?.kind;
    if (k === "edit") return interactionRight ? { title: "Written. Now judge it.", line: "Tick the things your version does. Be honest; nobody is counting." } : { title: "Give it a fuller go.", line: "A few more words, and different ones from the original." };
    if (k === "sort") return interactionRight ? { title: "All of them.", line: "You can tell the two apart. That is most of stage one." } : { title: "Some of those are the hard ones.", line: "The marked cards say where the line is. That is the lesson." };
    if (k === "plan") return { title: "That is the whole plan.", line: "Five parts. You write each of them in a moment." };
    return interactionRight ? { title: "That is the one.", line: "You can tell the difference. That is the skill." } : { title: "Not that one, and that is fine.", line: "The reasons are on the cards. They are the lesson." };
  })();
  return (
    <div className="mission">
      <div className="m-bar">
        <Link href="/journey" className="m-close" aria-label="Leave the lesson">✕</Link>
        <div className="prog-bar" role="progressbar" aria-label={`Part ${Math.min(step + 1, parts.length)} of ${parts.length}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>
        <span className="chip"><b>{state.points}</b> pts</span>
      </div>
      {current !== "done" ? <Head m={m} stage={stage} lessonRead={lessonRead} actionRecorded={actionRecorded} /> : null}

      {current === "objective" ? Objective : null}
      {current === "explain" ? Explain : null}
      {current === "example" ? Example : null}
      {current === "interaction" ? Interaction : null}
      {current === "action" ? Action : null}
      {current === "output" ? Output : null}
      {current === "reflect" ? Reflect : null}
      {current === "done" ? Done : null}

      <div className="m-dock" data-tone={tone}>
        <div className="m-dock-in">
          {current === "done" ? (
            <>
              <div className="m-feedback"><Guide /><div><b>{openOutside ? "Come back when it has happened" : "Keep going"}</b><span>{after && after.id !== m.id ? `Next: ${after.title}` : "Your idea page has everything you found"}</span></div></div>
              <div className="j-row">
                <Link className="j-btn quiet" href="/journey/idea">My idea</Link>
                {after && after.id !== m.id ? <Link className="j-btn primary" href={`/journey/m/${after.id}`}>Continue</Link> : <Link className="j-btn primary" href="/journey">Continue</Link>}
              </div>
            </>
          ) : (
            <>
          {tone ? (
            <div className="m-feedback">
              <span className="guide-face" data-mood={tone === "good" ? "hop" : undefined}><Guide /></span>
              <div>
                <b>{feedback.title}</b>
                <span>{feedback.line}</span>
              </div>
            </div>
          ) : (
            <button type="button" className="j-btn ghost" onClick={back} disabled={step === 0}>Back</button>
          )}
          <div className="j-row">
            {current === "interaction" && !interactionDone ? (
              <button type="button" className="j-btn ghost" onClick={next}>Skip this one</button>
            ) : null}
            {current === "action" && m.outside ? (
              <>
                <button type="button" className="j-btn quiet" onClick={() => { setRecording(false); go("reflect"); }}>Not yet, finish the lesson</button>
                <button type="button" className="j-btn primary" onClick={() => { setRecording(true); next(); }}>It has happened, record it</button>
              </>
            ) : current === "output" ? (
              <button type="button" className="j-btn primary" onClick={() => { if (saveOutputs()) { if (lessonRead) setFinished(true); else next(); } }}>
                {m.outside && recording ? "Save and mark it done" : "Save and continue"}
              </button>
            ) : current === "reflect" ? (
              <button type="button" className="j-btn primary" onClick={finishLesson}>Finish lesson</button>
            ) : (
              <button type="button" className="j-btn primary" onClick={next} disabled={!canContinue}>Continue</button>
            )}
          </div>
            </>
          )}
        </div>
      </div>
      <Celebrate />
    </div>
  );
}

/** A short fall of the building's colours. Gone under prefers-reduced-motion (css). */
function Confetti() {
  const colours = ["#be241b", "#4d6a80", "#1a7a3f", "#a8500a", "#e0b23c"];
  const bits = Array.from({ length: 42 }, (_, n) => ({
    x: `${(n * 37) % 100}%`,
    c: colours[n % colours.length],
    t: `${1.8 + ((n * 13) % 10) / 10}s`,
    d: `${((n * 7) % 12) / 20}s`,
    r: `${((n * 53) % 360) + 360}deg`,
  }));
  return (
    <div className="confetti" aria-hidden>
      {bits.map((b, n) => (
        <i key={n} style={{ ["--x" as string]: b.x, ["--c" as string]: b.c, ["--t" as string]: b.t, ["--d" as string]: b.d, ["--r" as string]: b.r }} />
      ))}
    </div>
  );
}

function Head({ m, stage, lessonRead, actionRecorded }: { m: journey.Mission; stage: journey.Stage; lessonRead: boolean; actionRecorded: boolean }) {
  return (
    <header className="m-head">
      <Link href="/journey" className="j-small">← The journey</Link>
      <span className="j-label">Stage {stage.n} · Mission {m.n} of 10 · about {m.minutes} min</span>
      <h1>{m.title}</h1>
      <div className="next-meta">
        {lessonRead ? <span className="meta-pill">Lesson done</span> : null}
        {m.outside ? <span className="meta-pill" data-kind="outside">{actionRecorded ? "Real-world part recorded" : "Needs something outside the app"}</span> : null}
      </div>
    </header>
  );
}
