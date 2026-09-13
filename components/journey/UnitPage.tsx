"use client";

/**
 * A UNIT'S GUIDE.
 *
 * The unit's ideas on one page, for reference rather than study, the
 * way a language course has a guidebook per unit. Under it, the four
 * lessons with their state, the real-world mission if there is one,
 * and the checkpoint for anyone who already knows this part.
 */
import Link from "next/link";
import { course, journey } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";

export default function UnitPage({ id }: { id: string }) {
  const { state, courseState, ready } = useJourney();
  const u = course.unitById(id);
  if (!u) {
    return <div className="mission"><h1>No such unit</h1><Link className="j-btn quiet" href="/journey">Back to the journey</Link></div>;
  }
  if (!ready) return <p className="j-loading">Opening the guide…</p>;
  const sec = course.sectionOf(u);
  const missions = (u.missions ?? []).map((id) => journey.missionById(id)).filter((m): m is journey.Mission => Boolean(m));
  const cp = courseState.checkpoints[u.id];
  const after = course.unitAfter(u.id);
  return (
    <div className="unit-page">
      <header className="m-head">
        <Link href="/journey" className="j-small">← The journey</Link>
        <span className="j-label">Section {sec.n} · Unit {u.n} of {course.UNITS.length}</span>
        <h1>{u.name}</h1>
        <p className="j-muted">{u.line}</p>
      </header>

      <section className="m-part" aria-labelledby="g-guide">
        <div className="m-part-label"><span className="j-label">The guide</span></div>
        <h2 id="g-guide" style={{ position: "absolute", left: -9999 }}>Guide</h2>
        <div className="m-explain">{u.guide.map((p, n) => <p key={n}>{p}</p>)}</div>
        <p className="j-small">For reference. Reading this is not the lesson; the exercises are.</p>
      </section>

      <section className="m-part" aria-labelledby="g-lessons">
        <div className="m-part-label"><span className="j-label">Lessons</span></div>
        <h2 id="g-lessons" style={{ position: "absolute", left: -9999 }}>Lessons</h2>
        <ul className="milestones">
          {u.lessons.map((l) => {
            const r = courseState.lessons[l.id];
            return (
              <li key={l.id} className="milestone" data-done={r ? "" : undefined}>
                <i aria-hidden>{r ? "✓" : ""}</i>
                <div>
                  <Link href={`/journey/l/${l.id}`}><b>{l.n}. {l.title}{l.depth ? " · depth" : ""}</b></Link>
                  <span>{r ? `Done · ${r.right} of ${r.total} first time` : `${l.minutes} min · ${l.exercises.length} exercises`} · {l.objective}</span>
                </div>
              </li>
            );
          })}
          {missions.map((mission) => (
            <li key={mission.id} className="milestone" data-done={journey.missionDone(state, mission) ? "" : undefined}>
              <i aria-hidden>{journey.missionDone(state, mission) ? "✓" : ""}</i>
              <div>
                <Link href={`/journey/m/${mission.id}`}><b>Mission: {mission.title}</b></Link>
                <span>{mission.outside ? "Needs something outside the app. " : ""}{mission.why}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="m-part" aria-labelledby="g-cp">
        <div className="m-part-label"><span className="j-label">Checkpoint</span></div>
        <h2 id="g-cp">Already know this part?</h2>
        <p className="j-muted">Ten exercises from every lesson here. Pass it and the unit is marked done. {cp ? (cp.passed ? "You have passed it." : `Last time: ${cp.right} of ${cp.total}.`) : ""}</p>
        <div className="j-row">
          <Link className="j-btn quiet" href={`/journey/c/${u.id}`}>{cp?.passed ? "Sit it again" : "Take the checkpoint"}</Link>
          {after ? <Link className="j-btn ghost" href={`/journey/u/${after.id}`}>Next unit: {after.name} →</Link> : null}
        </div>
      </section>
    </div>
  );
}
