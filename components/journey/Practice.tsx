"use client";

/**
 * PRACTICE: WHAT YOU MISSED, THEN WHAT IS DUE.
 *
 * Eight exercises from lessons already sat, mistakes first, mixed
 * across units. Nothing new is taught here; the point is spacing, and
 * the set is drawn by the engine from the memory schedule.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { course } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";
import Drill, { type DrillResult } from "@/components/journey/Drill";
import Guide from "@/components/journey/Guide";

export default function Practice() {
  const { courseState, ready, dispatchCourse, now } = useJourney();
  const [seed] = useState(() => now());
  const [result, setResult] = useState<DrillResult | null>(null);
  // Drawn once per visit: the state changes with every answer and the set must not.
  const items = useMemo(() => (ready ? course.practiceSet(courseState, seed) : []), [ready, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return <p className="j-loading">Drawing today's practice…</p>;
  if (!items.length) {
    return (
      <div className="mission">
        <header className="m-head"><span className="j-label">Practice</span><h1>Nothing to practise yet</h1></header>
        <p className="j-muted">Practice draws from lessons you have already sat. Finish one and come back.</p>
        <Link className="j-btn primary" href="/journey">Back to the journey</Link>
      </div>
    );
  }
  if (result) {
    return (
      <div className="mission">
        <section className="m-complete">
          <span className="guide-face" data-mood="hop"><Guide scale={3} /></span>
          <span className="j-label">Practice done</span>
          <h1>{result.right === result.total ? "All of them." : `${result.right} of ${result.total}.`}</h1>
          <div className="m-stats">
            <div className="m-stat"><span>Points</span><b>+{course.COURSE_POINTS.practice}</b></div>
            <div className="m-stat" data-kind={result.right === result.total ? undefined : "open"}><span>Right</span><b>{result.right}/{result.total}</b></div>
          </div>
          <p className="j-muted">{result.right === result.total ? "Each one moved a box further out. They come back later, further apart." : "The ones you missed are due tomorrow. Nothing else happens."}</p>
        </section>
        <div className="m-dock"><div className="m-dock-in"><span /><div className="j-row"><Link className="j-btn primary" href="/journey">Back to the journey</Link></div></div></div>
      </div>
    );
  }
  return (
    <div className="mission">
      <div className="m-bar">
        <Link href="/journey" className="m-close" aria-label="Leave practice">✕</Link>
        <span className="j-label">Practice · {items.length} exercises</span>
        <span className="chip"><b>{courseState.points}</b> pts</span>
      </div>
      <Drill
        items={items}
        onAnswer={(id, right) => dispatchCourse({ type: "answer", exercise: id, right, at: now() })}
        onFinish={(r) => {
          dispatchCourse({ type: "practice-done", at: now() });
          setResult(r);
        }}
      />
    </div>
  );
}
