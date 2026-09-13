"use client";

/**
 * THE ROAD, AS BIG ROUND STOPS.
 *
 * Ten stops on a line that winds, grouped under three coloured bands.
 * Each stop is a button-shaped thing you can push — it has a lip and it
 * presses down — with the mission's glyph on it and its title under it.
 * The next one has a bubble over it that says start. Done stops fill
 * with the stage's colour and get a tick; a stop whose lesson is read
 * but whose real-world part is still open is white with a blue ring, so
 * the two kinds of done never look alike.
 *
 * Every stop is a link, whatever its state. Nothing on the road is
 * locked: a finished stop opens for revisiting, a later one for a look
 * ahead. The state is said in words under each stop as well as in
 * shape and colour.
 */
import Link from "next/link";
import { journey } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";
import PixelGlyph from "@/components/PixelGlyph";
import type { GlyphId } from "@/lib/types";

type StopState = "done" | "current" | "pending" | "later";

/** One glyph per mission, from the building's own set. */
const GLYPH: Record<string, GlyphId> = {
  "say-it": "star",
  "one-group": "heart",
  "the-problem": "flask",
  "good-questions": "wave",
  "find-them": "leaf",
  "record-one": "chip",
  "what-changes": "bolt",
  "smallest-offer": "cube",
  "define-test": "coin",
  "review-test": "rocket",
};

/** The wind: how far each stop sits off the centre line, in px, cycling. */
const WIND = [0, 78, 118, 78, 0, -78, -118, -78];

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
  const subFor = (m: journey.Mission, s: StopState): string => {
    if (s === "done") return "Done";
    if (s === "pending") return "Real-world part open";
    if (s === "current") return `${m.minutes} min`;
    return `${m.minutes} min${m.outside ? " + outside" : ""}`;
  };

  let i = 0;
  return (
    <div className="path" aria-label="Your journey">
      {journey.STAGES.map((st) => {
        const stStatus = prog.stages[st.id];
        return (
          <section key={st.id} className="path-stage" data-stage={st.id} data-state={stStatus} aria-label={`Stage ${st.n}: ${st.name}`}>
            <div className="stage-band">
              <div>
                <span className="j-label">Stage {st.n}</span>
                <b>{st.name}</b>
              </div>
              <span className="band-state">{stStatus === "done" ? "Done" : stStatus === "current" ? "In progress" : "Later"}</span>
            </div>
            <div className="nodes">
              {journey.missionsIn(st.id).map((m) => {
                const s = stateOf(m);
                const dx = WIND[i++ % WIND.length];
                const white = s === "done";
                return (
                  <Link
                    key={m.id}
                    href={`/journey/m/${m.id}`}
                    className="stop"
                    data-state={s}
                    style={{ ["--dx" as string]: `${dx}px` }}
                    aria-label={`Mission ${m.n}, ${m.title}: ${subFor(m, s)}`}
                  >
                    <span className="node" aria-hidden>
                      {s === "current" ? <span className="node-start">Start</span> : null}
                      <PixelGlyph glyph={GLYPH[m.id] ?? "star"} size={30} color={white ? "#ffffff" : s === "current" ? "var(--primary)" : "var(--muted)"} />
                      {s === "done" ? <span className="node-tick">✓</span> : <span className="node-n">{m.n}</span>}
                    </span>
                    <span className="stop-label">{m.title}</span>
                    <span className="stop-sub">{subFor(m, s)}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
