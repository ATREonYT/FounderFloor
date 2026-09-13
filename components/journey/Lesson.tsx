"use client";

/**
 * A LESSON, SHORT TO READ AND LONG TO DO.
 *
 * Objective, then the reading (two to four paragraphs), then the
 * exercises one at a time, then the apply step where the learner writes
 * one line of their own idea page, then the line to keep. That order is
 * the design from docs/research/course-design.md: practice testing and
 * elaboration are the two techniques with evidence behind them, so the
 * reading is kept small and the doing is most of the screen time.
 *
 * A finished lesson opens in review with everything on one page and can
 * be sat again; a retake keeps the better score and earns nothing twice.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { course, journey } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";
import Drill, { type DrillResult } from "@/components/journey/Drill";
import Guide from "@/components/journey/Guide";
import Coach from "@/components/journey/Coach";

type Part = "objective" | "teach" | "example" | "drill" | "apply" | "done";

const toText = (v: string | string[] | undefined): string => (Array.isArray(v) ? v.join("\n") : v ?? "");

export default function Lesson({ id }: { id: string }) {
  const { state, courseState, ready, dispatch, dispatchCourse, now } = useJourney();
  const placed = course.lessonById(id);
  const parts = useMemo<Part[]>(() => {
    if (!placed) return [];
    const p: Part[] = ["objective", "teach"];
    if (placed.lesson.example?.length) p.push("example");
    p.push("drill");
    if (placed.lesson.apply) p.push("apply");
    return p;
  }, [placed]);

  const [step, setStep] = useState(0);
  const [retake, setRetake] = useState(false);
  const [result, setResult] = useState<DrillResult | null>(null);
  const [applyText, setApplyText] = useState("");
  const [finished, setFinished] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [pointsBefore] = useState(() => courseState.points);

  useEffect(() => {
    if (!ready || !placed?.lesson.apply) return;
    setApplyText(toText(state.outputs[placed.lesson.apply.key]?.value));
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

  if (!placed) {
    return (
      <div className="mission">
        <h1>No such lesson</h1>
        <p className="j-muted">The course has seventy-two lessons and this is not one of them.</p>
        <Link className="j-btn quiet" href="/journey">Back to the journey</Link>
      </div>
    );
  }
  if (!ready) return <p className="j-loading">Opening the lesson…</p>;

  const { lesson: l, unit: u } = placed;
  const section = course.sectionOf(u);
  const prior = courseState.lessons[l.id];
  const review = Boolean(prior) && !retake && !finished;
  const current: Part = finished ? "done" : parts[step] ?? "objective";
  const next = () => setStep((s) => Math.min(parts.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const exercises = course.exercisesOf(l);
  const field = l.apply ? journey.fieldFor(l.apply.key) : undefined;

  const finish = () => {
    const at = now();
    if (l.apply && applyText.trim() && applyText.trim() !== toText(state.outputs[l.apply.key]?.value)) {
      dispatch({ type: "edit-line", key: l.apply.key, value: field?.kind === "list" ? applyText.split("\n") : applyText, at });
    }
    if (result) dispatchCourse({ type: "lesson-done", lesson: l.id, right: result.right, total: result.total, at });
    setFinished(true);
    setRetake(false);
  };

  const afterState = result ? course.applyCourse(courseState, { type: "lesson-done", lesson: l.id, right: result.right, total: result.total, at: now() }) : courseState;
  const after = course.nextLesson(afterState);
  const unitDoneAfter = course.unitDone(afterState, u);
  const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60_000));
  const earned = Math.max(0, afterState.points - pointsBefore);

  const Head = (
    <header className="m-head">
      <Link href={`/journey/u/${u.id}`} className="j-small">← {u.name}</Link>
      <span className="j-label">Section {section.n} · Unit {u.n} · Lesson {l.n} of {u.lessons.length}{l.depth ? " · Depth" : ""} · about {l.minutes} min</span>
      <h1>{l.title}</h1>
    </header>
  );
  const Objective = (
    <section className="m-part" aria-labelledby="p-obj">
      <div className="m-part-label"><span className="j-label">What you will be able to do</span></div>
      <h2 id="p-obj">{l.objective}</h2>
      {l.depth ? <p className="j-muted">A depth lesson: where the rule bends, what the number actually is, and what people get wrong.</p> : null}
    </section>
  );
  const Teach = (
    <section className="m-part" aria-labelledby="p-teach">
      <div className="m-part-label"><span className="j-label">The short version</span></div>
      <h2 id="p-teach" style={{ position: "absolute", left: -9999 }}>Reading</h2>
      <div className="m-explain">{l.teach.map((p, n) => <p key={n}>{p}</p>)}</div>
    </section>
  );
  const Example = l.example?.length ? (
    <section className="m-part" aria-labelledby="p-ex">
      <div className="m-part-label"><span className="j-label">An example</span></div>
      <h2 id="p-ex" style={{ position: "absolute", left: -9999 }}>Example</h2>
      <div className="m-example">
        {l.example.map((e, n) => (
          <div key={n} className="ex"><span className="ex-label">{e.label}</span><p>{e.text}</p></div>
        ))}
      </div>
    </section>
  ) : null;
  const Apply = l.apply && field ? (
    <section className="m-part m-output" aria-labelledby="p-apply">
      <div className="m-part-label"><span className="j-label">Now, yours</span></div>
      <h2 id="p-apply" style={{ position: "absolute", left: -9999 }}>Apply it</h2>
      <p>{l.apply.prompt}</p>
      <div className="j-field">
        <label htmlFor="apply">{field.label}</label>
        <span className="ev" data-ev={field.evidence}>{field.evidence === "assumption" ? "Assumption" : field.evidence === "reported" ? "You reported this" : "What a customer did"}</span>
        <span className="j-hint">{l.apply.hint}</span>
        <textarea id="apply" className="j-textarea" value={applyText} onChange={(e) => setApplyText(e.target.value)} rows={4} />
        <Coach missionId={u.missions?.[0] ?? "say-it"} fieldKey={l.apply.key} text={applyText} onAccept={(s) => setApplyText(s)} />
        <p className="j-small">This goes on your idea page, where you can change it any time.</p>
      </div>
    </section>
  ) : null;
  const Remember = (
    <section className="m-part m-remember" aria-labelledby="p-rem">
      <div className="m-part-label"><span className="j-label">The line to keep</span></div>
      <h2 id="p-rem" style={{ position: "absolute", left: -9999 }}>Remember</h2>
      <p className="q">{l.remember}</p>
    </section>
  );
  const Done = (
    <section className="m-complete" aria-labelledby="p-done">
      <span className="guide-face" data-mood="hop"><Guide scale={3} /></span>
      <span className="j-label">Lesson complete</span>
      <h1 id="p-done">{result && result.right === result.total ? "Every one." : unitDoneAfter ? `That is unit ${u.n}.` : "Nicely done."}</h1>
      <div className="m-stats">
        <div className="m-stat"><span>Points</span><b>+{earned}</b></div>
        <div className="m-stat" data-kind="time"><span>Time</span><b>{minutes} min</b></div>
        {result ? <div className="m-stat" data-kind={result.right === result.total ? undefined : "open"}><span>Exercises</span><b>{result.right}/{result.total}</b></div> : null}
      </div>
      {result && result.right < result.total ? <p className="j-muted">The ones you missed come back tomorrow, at the front of practice. That is how they stick.</p> : null}
      {Remember}
    </section>
  );

  if (review) {
    return (
      <div className="mission m-review">
        <div className="m-bar">
          <Link href="/journey" className="m-close" aria-label="Leave the lesson">✕</Link>
          <div className="prog-bar" role="progressbar" aria-label="Lesson complete" aria-valuenow={100} aria-valuemin={0} aria-valuemax={100}><i style={{ width: "100%" }} /></div>
          <span className="chip"><b>{courseState.points}</b> pts</span>
        </div>
        {Head}
        <p className="meta-pill">Done · {prior!.right} of {prior!.total} first time</p>
        {Objective}
        {Teach}
        {Example}
        {Remember}
        {Apply}
        <div className="m-dock">
          <div className="m-dock-in">
            <Link className="j-btn ghost" href={`/journey/u/${u.id}`}>Back to the unit</Link>
            <div className="j-row">
              {l.apply ? <button type="button" className="j-btn quiet" onClick={() => { const at = now(); if (applyText.trim()) dispatch({ type: "edit-line", key: l.apply!.key, value: applyText, at }); }}>Save my line</button> : null}
              <button type="button" className="j-btn primary" onClick={() => { setRetake(true); setStep(parts.indexOf("drill")); setResult(null); }}>Practise it again</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pct = current === "done" ? 100 : Math.round((step / parts.length) * 100);
  return (
    <div className="mission">
      <div className="m-bar">
        <Link href={`/journey/u/${u.id}`} className="m-close" aria-label="Leave the lesson">✕</Link>
        <div className="prog-bar" role="progressbar" aria-label={`Part ${Math.min(step + 1, parts.length)} of ${parts.length}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>
        <span className="chip"><b>{courseState.points}</b> pts</span>
      </div>
      {current !== "done" && current !== "drill" ? Head : null}

      {current === "objective" ? Objective : null}
      {current === "teach" ? Teach : null}
      {current === "example" ? Example : null}
      {current === "drill" ? (
        <Drill
          key={retake ? "retake" : "first"}
          items={exercises}
          onAnswer={(xid, right) => dispatchCourse({ type: "answer", exercise: xid, right, at: now() })}
          onFinish={(r) => {
            setResult(r);
            if (parts.includes("apply")) next();
            else finishWith(r);
          }}
        />
      ) : null}
      {current === "apply" ? Apply : null}
      {current === "done" ? Done : null}

      {current !== "drill" ? (
        <div className="m-dock">
          <div className="m-dock-in">
            {current === "done" ? (
              <>
                <div className="m-feedback"><Guide /><div><b>{unitDoneAfter ? "Unit done" : "Keep going"}</b><span>{after ? `Next: ${after.lesson.title}` : "That was the last lesson"}</span></div></div>
                <div className="j-row">
                  <Link className="j-btn quiet" href="/journey/idea">My idea</Link>
                  {after ? <Link className="j-btn primary" href={`/journey/l/${after.lesson.id}`}>Continue</Link> : <Link className="j-btn primary" href="/journey">Continue</Link>}
                </div>
              </>
            ) : (
              <>
                <button type="button" className="j-btn ghost" onClick={back} disabled={step === 0}>Back</button>
                <div className="j-row">
                  {current === "apply" ? (
                    <button type="button" className="j-btn primary" onClick={finish}>{applyText.trim() ? "Save and finish" : "Finish without it"}</button>
                  ) : (
                    <button type="button" className="j-btn primary" onClick={next}>{current === "objective" ? "Start" : "Continue"}</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );

  function finishWith(r: DrillResult) {
    dispatchCourse({ type: "lesson-done", lesson: l.id, right: r.right, total: r.total, at: now() });
    setFinished(true);
    setRetake(false);
  }
}
