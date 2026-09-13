"use client";

/**
 * THE ONE THING TO DO NEXT.
 *
 * What it is, why it matters, how long the lesson takes, whether the
 * world is involved, and one button. If everything is done it says so
 * and offers the idea page, because the point of finishing is what you
 * know now, not a badge.
 */
import Link from "next/link";
import { journey } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";

export default function NextCard() {
  const { state } = useJourney();
  const m = journey.nextMission(state);
  if (!m) {
    return (
      <section className="next-card all-done" aria-labelledby="next-title">
        <span className="j-label">The whole road, once</span>
        <h1 id="next-title">You have walked every stop</h1>
        <p className="next-why">
          Everything you found is on your idea page. Most founders walk the road again with what they learned; the missions stay open, and so does every line you wrote.
        </p>
        <div className="j-row">
          <Link className="j-btn primary" href="/journey/idea">Open my idea</Link>
          <Link className="j-btn quiet" href="/journey/m/say-it">Start again from the top</Link>
        </div>
      </section>
    );
  }
  const lessonRead = journey.lessonDone(state, m.id);
  const stage = journey.STAGES.find((s) => s.id === m.stage);
  return (
    <section className="next-card" aria-labelledby="next-title">
      <span className="j-label">
        {lessonRead ? "Still open" : "Next mission"} · Stage {stage?.n}, mission {m.n} of 10
      </span>
      <h1 id="next-title">{lessonRead ? `Record what happened: ${m.title.toLowerCase()}` : m.title}</h1>
      <p className="next-why">{m.why}</p>
      <div className="next-meta">
        <span className="meta-pill" data-kind="inside">About {m.minutes} min in the app</span>
        {m.outside ? (
          <span className="meta-pill" data-kind="outside">Then something happens outside the app</span>
        ) : (
          <span className="meta-pill" data-kind="inside">Nothing needed outside the app</span>
        )}
      </div>
      <Link className="j-btn primary lg" href={`/journey/m/${m.id}`}>
        {lessonRead ? "Record it" : "Continue"}
      </Link>
    </section>
  );
}
