"use client";

/**
 * THE ROAD, DRAWN.
 *
 * Ten stops in three groups, one line running through them. Each stop
 * says what it is by shape and by word — a tick, a ring, a number, and a
 * line of text underneath — so the state is readable without colour.
 * Every stop is a link: a finished one opens for revisiting, a later one
 * opens for a look ahead. Nothing here is locked.
 */
import Link from "next/link";
import { journey } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";

type StopState = "done" | "current" | "pending" | "later";

export default function Path() {
  const { state } = useJourney();
  const next = journey.nextMission(state);
  const prog = journey.progress(state);

  const stateOf = (m: journey.Mission): StopState => {
    if (journey.missionDone(state, m)) return "done";
    if (journey.lessonDone(state, m.id) && m.outside) return "pending";
    if (next && next.id === m.id) return "current";
    return "later";
  };
  const lineFor = (m: journey.Mission, s: StopState): string => {
    if (s === "done") return "Done";
    if (s === "pending") return "Lesson done · real-world part still open";
    if (s === "current") return "Up next";
    return `${m.minutes} min${m.outside ? " · then something outside the app" : ""}`;
  };

  return (
    <div className="path" aria-label="Your journey">
      {journey.STAGES.map((st) => (
        <section key={st.id} className="path-stage" data-state={prog.stages[st.id]} aria-label={`Stage ${st.n}: ${st.name}`}>
          <div className="path-stage-head">
            <span className="j-label">Stage {st.n}</span>
            <h2>{st.name}</h2>
          </div>
          {journey.missionsIn(st.id).map((m) => {
            const s = stateOf(m);
            return (
              <Link key={m.id} href={`/journey/m/${m.id}`} className="path-stop" data-state={s}>
                <span className="stop-dot" aria-hidden>
                  {s === "done" ? "✓" : m.n}
                </span>
                <span className="stop-body">
                  <span className="stop-title">{m.title}</span>
                  <span className="stop-line">{lineFor(m, s)}</span>
                </span>
              </Link>
            );
          })}
        </section>
      ))}
    </div>
  );
}
