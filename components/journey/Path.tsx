"use client";

/**
 * THE COURSE, AS A ROAD OF ROUND STOPS.
 *
 * Six sections, each a coloured band. Under a band, its three units in
 * turn: a small header with the unit's name and a link to its guide,
 * then the stops — four lessons, the unit's real-world mission where it
 * has one, and the checkpoint at the end. A stop is a lipped button you
 * can push; done stops fill with the section's colour, the next one has
 * a bubble that says start, and a mission whose lesson is read but whose
 * outside part is still open is white with a blue ring.
 *
 * Only the current section is open by default. The others show as a
 * band with a count and a button, because a hundred stops on one screen
 * is a wall, and the road should read as where you are, not how far.
 *
 * Nothing is locked. A later stop opens for a look ahead; the checkpoint
 * on any unit opens for whoever already knows the part.
 */
import { useState } from "react";
import Link from "next/link";
import { course, journey } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";
import PixelGlyph from "@/components/PixelGlyph";
import type { GlyphId } from "@/lib/types";

type StopState = "done" | "current" | "pending" | "later";

const GLYPH: Record<course.SectionId, GlyphId> = {
  foundations: "star",
  customer: "heart",
  product: "cube",
  money: "coin",
  growth: "leaf",
  company: "bolt",
};
const MISSION_GLYPH: Record<string, GlyphId> = {
  "say-it": "star", "one-group": "heart", "the-problem": "flask", "good-questions": "wave", "find-them": "leaf",
  "record-one": "chip", "what-changes": "bolt", "smallest-offer": "cube", "define-test": "coin", "review-test": "rocket",
};

/** The wind: how far each stop sits off the centre line, in px, cycling. */
const WIND = [0, 78, 118, 78, 0, -78, -118, -78];

export default function Path() {
  const { state, courseState } = useJourney();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const nextL = course.nextLesson(courseState);
  const nextM = journey.nextMission(state);
  const currentSection = nextL ? nextL.unit.section : course.SECTIONS[course.SECTIONS.length - 1].id;

  let wind = 0;
  const dx = () => WIND[wind++ % WIND.length];

  return (
    <div className="path" aria-label="The course">
      {course.SECTIONS.map((sec) => {
        const units = course.unitsIn(sec.id);
        const lessons = units.flatMap((u) => u.lessons);
        const done = lessons.filter((l) => course.lessonDone(courseState, l.id)).length;
        const allDone = units.every((u) => course.unitDone(courseState, u));
        const status = allDone ? "done" : sec.id === currentSection ? "current" : "later";
        // A real-world part left open must stay visible, so its section opens itself.
        const hasPending = units.some((u) => (u.missions ?? []).some((id) => journey.lessonDone(state, id) && !journey.actionDone(state, id) && journey.missionById(id)?.outside));
        const isOpen = open[sec.id] ?? (status === "current" || hasPending);
        return (
          <section key={sec.id} className="path-stage" data-section={sec.id} data-state={status} aria-label={`Section ${sec.n}: ${sec.name}`}>
            <div className="stage-band">
              <div>
                <span className="j-label">Section {sec.n}</span>
                <b>{sec.name}</b>
              </div>
              <button type="button" className="band-state" aria-expanded={isOpen} onClick={() => setOpen((o) => ({ ...o, [sec.id]: !isOpen }))}>
                {status === "done" ? "Done" : `${done}/${lessons.length}`} {isOpen ? "▾" : "▸"}
              </button>
            </div>
            {!isOpen ? (
              <p className="band-line">{sec.line}</p>
            ) : (
              units.map((u) => {
                const uDone = course.unitDone(courseState, u);
                const missions = (u.missions ?? []).map((id) => journey.missionById(id)).filter((m): m is journey.Mission => Boolean(m));
                return (
                  <div key={u.id} className="unit-block" data-done={uDone ? "" : undefined}>
                    <div className="unit-head">
                      <div>
                        <span className="j-label">Unit {u.n}</span>
                        <b>{u.name}</b>
                      </div>
                      <Link href={`/journey/u/${u.id}`} className="j-btn quiet sm">Guide</Link>
                    </div>
                    <div className="nodes">
                      {u.lessons.map((l) => {
                        const isDone = course.lessonDone(courseState, l.id) || course.unitPassed(courseState, u.id);
                        const s: StopState = isDone ? "done" : nextL?.lesson.id === l.id ? "current" : "later";
                        const sub = s === "done" ? "Done" : `${l.minutes} min${l.depth ? " · depth" : ""}`;
                        return (
                          <Link key={l.id} href={`/journey/l/${l.id}`} className="stop" data-state={s} style={{ ["--dx" as string]: `${dx()}px` }} aria-label={`Lesson ${l.n}, ${l.title}: ${sub}`}>
                            <span className="node" aria-hidden>
                              {s === "current" ? <span className="node-start">Start</span> : null}
                              <PixelGlyph glyph={GLYPH[sec.id]} size={30} color={s === "done" ? "#ffffff" : s === "current" ? "var(--primary)" : "var(--muted)"} />
                              {s === "done" ? <span className="node-tick">✓</span> : <span className="node-n">{l.n}</span>}
                            </span>
                            <span className="stop-label">{l.title}</span>
                            <span className="stop-sub">{sub}</span>
                          </Link>
                        );
                      })}
                      {missions.map((mission) => {
                        const mDone = journey.missionDone(state, mission);
                        const s: StopState = mDone ? "done" : journey.lessonDone(state, mission.id) && mission.outside ? "pending" : nextM?.id === mission.id && uDone ? "current" : "later";
                        const sub = s === "done" ? "Done" : s === "pending" ? "Real-world part open" : `Mission · ${mission.minutes} min${mission.outside ? " + outside" : ""}`;
                        return (
                          <Link key={mission.id} href={`/journey/m/${mission.id}`} className="stop mission-stop" data-state={s} style={{ ["--dx" as string]: `${dx()}px` }} aria-label={`Mission: ${mission.title}: ${sub}`}>
                            <span className="node" aria-hidden>
                              <PixelGlyph glyph={MISSION_GLYPH[mission.id] ?? "rocket"} size={30} color={s === "done" ? "#ffffff" : "var(--report)"} />
                              {s === "done" ? <span className="node-tick">✓</span> : <span className="node-n">M</span>}
                            </span>
                            <span className="stop-label">{mission.title}</span>
                            <span className="stop-sub">{sub}</span>
                          </Link>
                        );
                      })}
                      {(() => {
                        const cp = courseState.checkpoints[u.id];
                        const s: StopState = cp?.passed ? "done" : "later";
                        return (
                          <Link href={`/journey/c/${u.id}`} className="stop checkpoint-stop" data-state={s} style={{ ["--dx" as string]: `${dx()}px` }} aria-label={`Checkpoint for ${u.name}${cp ? `: ${cp.right} of ${cp.total}` : ""}`}>
                            <span className="node" aria-hidden>
                              <span className="node-cp">{cp?.passed ? "✓" : "?"}</span>
                            </span>
                            <span className="stop-label">Checkpoint</span>
                            <span className="stop-sub">{cp?.passed ? "Passed" : cp ? `${cp.right}/${cp.total} last time` : "Jump ahead"}</span>
                          </Link>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        );
      })}
    </div>
  );
}
