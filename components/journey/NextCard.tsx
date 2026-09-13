"use client";

/**
 * THE ONE THING TO DO NEXT.
 *
 * The next lesson in the course, or the real-world mission that is
 * still open once its unit is learned, or — when there is nothing —
 * the idea page, because the point of finishing is what you know now.
 * A small second button offers practice when something is due.
 */
import Link from "next/link";
import { course, journey } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";

export default function NextCard() {
  const { state, courseState, now } = useJourney();
  const nl = course.nextLesson(courseState);
  const prog = course.courseProgress(courseState, now());
  const pendingMission = journey.MISSIONS.find((m) => journey.lessonDone(state, m.id) && m.outside && !journey.actionDone(state, m.id));
  const practice = prog.due + prog.weak > 0 ? (
    <Link className="j-btn quiet" href="/journey/practice">Practise · {prog.due + prog.weak} due</Link>
  ) : null;

  if (!nl && !pendingMission) {
    return (
      <section className="next-card all-done" aria-labelledby="next-title">
        <span className="j-label">The whole course, once</span>
        <h1 id="next-title">You have sat every lesson</h1>
        <p className="next-why">Everything you wrote is on your idea page. Practice keeps going for as long as you want it to; the memory schedule never stops.</p>
        <div className="j-row">
          <Link className="j-btn primary" href="/journey/idea">Open my idea</Link>
          <Link className="j-btn quiet" href="/journey/practice">Practise</Link>
        </div>
      </section>
    );
  }
  if (pendingMission && (!nl || !(nl.unit.missions ?? []).includes(pendingMission.id))) {
    // A real-world part left open takes the card until it is recorded; nothing nags after that.
    const u = course.UNITS.find((x) => (x.missions ?? []).includes(pendingMission.id));
    return (
      <section className="next-card" aria-labelledby="next-title">
        <span className="j-label">Still open{u ? ` · Unit ${u.n}` : ""}</span>
        <h1 id="next-title">Record what happened: {pendingMission.title.toLowerCase()}</h1>
        <p className="next-why">{pendingMission.action.pending ?? pendingMission.why}</p>
        <div className="next-meta"><span className="meta-pill" data-kind="outside">Something happened outside the app</span></div>
        <div className="j-row">
          <Link className="j-btn primary lg" href={`/journey/m/${pendingMission.id}`}>Record it</Link>
          {nl ? <Link className="j-btn quiet" href={`/journey/l/${nl.lesson.id}`}>Or keep learning</Link> : practice}
        </div>
      </section>
    );
  }
  const { lesson: l, unit: u } = nl!;
  const sec = course.sectionOf(u);
  return (
    <section className="next-card" aria-labelledby="next-title">
      <span className="j-label">Next lesson · Section {sec.n}, unit {u.n}, lesson {l.n} of {u.lessons.length}</span>
      <h1 id="next-title">{l.title}</h1>
      <p className="next-why">{l.objective}</p>
      <div className="next-meta">
        <span className="meta-pill" data-kind="inside">About {l.minutes} min · {l.exercises.length} exercises</span>
        {l.depth ? <span className="meta-pill">Depth</span> : null}
        {l.apply ? <span className="meta-pill" data-kind="inside">Writes one line of your idea</span> : null}
      </div>
      <div className="j-row">
        <Link className="j-btn primary lg" href={`/journey/l/${l.id}`}>{l.n === 1 && !courseState.lessons[l.id] ? "Start" : "Continue"}</Link>
        {practice}
      </div>
    </section>
  );
}
