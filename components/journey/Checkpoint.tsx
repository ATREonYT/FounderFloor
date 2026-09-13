"use client";

/**
 * A UNIT'S CHECKPOINT.
 *
 * Ten exercises drawn across every lesson in the unit. Four in five
 * right and the unit is yours, lessons sat or not: this is how somebody
 * who already knows a part jumps past it, and it is the only place a
 * score changes what the path shows. Failing costs nothing and can be
 * tried again straight away.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { course } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";
import Drill, { type DrillResult } from "@/components/journey/Drill";
import Guide from "@/components/journey/Guide";

export default function Checkpoint({ unitId }: { unitId: string }) {
  const { courseState, ready, dispatchCourse, now } = useJourney();
  const u = course.unitById(unitId);
  const [attempt, setAttempt] = useState(0);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<DrillResult | null>(null);
  const items = useMemo(() => (u ? course.checkpointFor(u) : []), [u, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!u) {
    return (
      <div className="mission"><h1>No such unit</h1><Link className="j-btn quiet" href="/journey">Back to the journey</Link></div>
    );
  }
  if (!ready) return <p className="j-loading">Opening the checkpoint…</p>;
  const prior = courseState.checkpoints[u.id];
  const needed = Math.ceil(items.length * course.CHECKPOINT_PASS);

  if (result) {
    const passed = result.right >= needed;
    return (
      <div className="mission">
        <section className="m-complete">
          <span className="guide-face" data-mood={passed ? "hop" : undefined}><Guide scale={3} /></span>
          <span className="j-label">Checkpoint · {u.name}</span>
          <h1>{passed ? "Passed. The unit is yours." : "Not this time."}</h1>
          <div className="m-stats">
            <div className="m-stat" data-kind={passed ? undefined : "open"}><span>Right</span><b>{result.right}/{result.total}</b></div>
            {passed && !prior?.passed ? <div className="m-stat"><span>Points</span><b>+{course.COURSE_POINTS.checkpoint}</b></div> : null}
          </div>
          <p className="j-muted">{passed ? "Every lesson in it stays open if you want to sit any of them." : `${needed} of ${result.total} passes it. The ones you missed are in practice now, and you can try again whenever you like.`}</p>
        </section>
        <div className="m-dock"><div className="m-dock-in">
          <Link className="j-btn ghost" href={`/journey/u/${u.id}`}>The unit</Link>
          <div className="j-row">
            {!passed ? <button type="button" className="j-btn quiet" onClick={() => { setAttempt((n) => n + 1); setResult(null); }}>Try again</button> : null}
            <Link className="j-btn primary" href="/journey">Back to the journey</Link>
          </div>
        </div></div>
      </div>
    );
  }
  if (!started) {
    return (
      <div className="mission">
        <header className="m-head">
          <Link href={`/journey/u/${u.id}`} className="j-small">← {u.name}</Link>
          <span className="j-label">Checkpoint · Unit {u.n}</span>
          <h1>Do you already know this?</h1>
        </header>
        <section className="m-part">
          <p>{items.length} exercises, drawn from every lesson in <b>{u.name}</b>. Get {needed} right and the unit is marked done whether or not you sat its lessons.</p>
          <p className="j-muted">Nothing is lost if you do not. What you miss goes into practice, and you can try again straight away.</p>
          {prior ? <p className="meta-pill" data-kind={prior.passed ? undefined : "outside"}>{prior.passed ? "Already passed" : `Last time: ${prior.right} of ${prior.total}`}</p> : null}
        </section>
        <div className="m-dock"><div className="m-dock-in">
          <Link className="j-btn ghost" href={`/journey/u/${u.id}`}>Not now</Link>
          <div className="j-row"><button type="button" className="j-btn primary" onClick={() => setStarted(true)}>Start the checkpoint</button></div>
        </div></div>
      </div>
    );
  }
  return (
    <div className="mission">
      <div className="m-bar">
        <Link href={`/journey/u/${u.id}`} className="m-close" aria-label="Leave the checkpoint">✕</Link>
        <span className="j-label">Checkpoint · {u.name}</span>
        <span className="chip"><b>{courseState.points}</b> pts</span>
      </div>
      <Drill
        key={attempt}
        items={items}
        onAnswer={(id, right) => dispatchCourse({ type: "answer", exercise: id, right, at: now() })}
        onFinish={(r) => {
          dispatchCourse({ type: "checkpoint", unit: u.id, right: r.right, total: r.total, at: now() });
          setResult(r);
        }}
      />
    </div>
  );
}
