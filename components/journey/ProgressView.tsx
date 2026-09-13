"use client";

/**
 * PROGRESS: TWO NUMBERS, KEPT APART.
 *
 * Lessons finished, and real-world work recorded. They sit side by side
 * and are never added together, because a founder who has read ten
 * lessons and talked to nobody is not eight tenths of the way anywhere.
 * Under them: the stages, the milestones reached, and an optional weekly
 * aim that costs nothing when it is missed.
 */
import { journey } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";

export default function ProgressView() {
  const { state, ready, dispatch, now } = useJourney();
  if (!ready) return <p className="j-loading">Adding it up…</p>;
  const p = journey.progress(state);
  const got = journey.reached(state);
  const week = journey.weekActivity(state, now());
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  return (
    <div className="prog">
      <header className="idea-head">
        <span className="j-label">Progress</span>
        <h1>What you have done</h1>
        <p className="j-muted">Two counts, on purpose. Neither one is a score for the business.</p>
      </header>

      <div className="prog-two">
        <section className="prog-card" data-kind="learning" aria-labelledby="pl">
          <h2 id="pl">Lessons finished</h2>
          <div className="prog-num">{p.learning.done}<small>of {p.learning.total}</small></div>
          <div className="prog-bar" role="progressbar" aria-valuenow={p.learning.done} aria-valuemin={0} aria-valuemax={p.learning.total} aria-label="Lessons finished"><i style={{ width: `${pct(p.learning.done, p.learning.total)}%` }} /></div>
          <p>In-app reading and answering. {p.points} learning points so far.</p>
        </section>
        <section className="prog-card" data-kind="practical" aria-labelledby="pp">
          <h2 id="pp">Real-world work recorded</h2>
          <div className="prog-num">{p.practical.done}<small>of {p.practical.total}</small></div>
          <div className="prog-bar" role="progressbar" aria-valuenow={p.practical.done} aria-valuemin={0} aria-valuemax={p.practical.total} aria-label="Real-world work recorded"><i style={{ width: `${pct(p.practical.done, p.practical.total)}%` }} /></div>
          <p>A conversation and a test, written down after they happened. These are the ones that count outside this app.</p>
        </section>
      </div>

      <section className="prog-card" aria-labelledby="ps">
        <h2 id="ps">The three stages</h2>
        <ul className="milestones">
          {journey.STAGES.map((st) => (
            <li key={st.id} className="milestone" data-done={p.stages[st.id] === "done" ? "" : undefined}>
              <i aria-hidden>{p.stages[st.id] === "done" ? "✓" : ""}</i>
              <div>
                <b>Stage {st.n}: {st.name}</b>
                <span>{p.stages[st.id] === "done" ? "Done" : p.stages[st.id] === "current" ? "In progress" : "Later"} · {st.line}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="prog-card" aria-labelledby="pm">
        <h2 id="pm">Milestones</h2>
        <ul className="milestones">
          {journey.MILESTONES.map((m) => (
            <li key={m.id} className="milestone" data-done={got.includes(m.id) ? "" : undefined}>
              <i aria-hidden>{got.includes(m.id) ? "✓" : ""}</i>
              <div>
                <b>{m.title}</b>
                <span>{m.line}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="prog-card weekly" aria-labelledby="pw">
        <h2 id="pw">A weekly aim, if you want one</h2>
        <p>Missions to touch in a week, lessons or real-world parts. Nothing happens if you miss it; the number is for you.</p>
        <div className="weekly-opts" role="group" aria-label="Weekly aim">
          <button type="button" className="weekly-opt" aria-pressed={state.weeklyGoal === null} onClick={() => dispatch({ type: "weekly-goal", goal: null })}>No aim</button>
          {[1, 2, 3, 5].map((n) => (
            <button key={n} type="button" className="weekly-opt" aria-pressed={state.weeklyGoal === n} onClick={() => dispatch({ type: "weekly-goal", goal: n })}>{n} a week</button>
          ))}
        </div>
        <p>{week.goal ? `This week: ${week.done} of ${week.goal}.` : `This week: ${week.done}.`}</p>
      </section>
    </div>
  );
}
