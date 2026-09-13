"use client";

/**
 * A RUN OF EXERCISES, ONE AT A TIME.
 *
 * The same runner for a lesson's exercises, a practice set and a
 * checkpoint: a bar that fills, one exercise on screen, a dock that
 * turns green or amber when the answer is in, and a Continue button.
 * Every answer is reported up as it happens so the memory schedule is
 * written even if the tab is closed halfway.
 */
import { useEffect, useState } from "react";
import type { course } from "@founderfloor/shared";
import ExerciseView from "@/components/journey/Exercises";
import Guide from "@/components/journey/Guide";

export interface DrillResult {
  right: number;
  total: number;
}

export default function Drill({
  items,
  onAnswer,
  onFinish,
  progressOffset = 0,
  progressTotal,
}: {
  items: course.PlacedExercise[];
  onAnswer: (id: string, right: boolean) => void;
  onFinish: (r: DrillResult) => void;
  /** Where in a longer bar this drill starts, and how long the whole bar is. */
  progressOffset?: number;
  progressTotal?: number;
}) {
  const [i, setI] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [right, setRight] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [i]);

  const item = items[i];
  if (!item) return null;
  const total = progressTotal ?? items.length;
  const pct = Math.round(((progressOffset + i + (answered !== null ? 1 : 0)) / total) * 100);
  const tone = answered === null ? undefined : answered ? "good" : "hmm";
  const feedback = answered ? pickGood(i) : pickHmm(i);

  const next = () => {
    const r = right;
    if (i + 1 >= items.length) {
      onFinish({ right: r, total: items.length });
      return;
    }
    setI(i + 1);
    setAnswered(null);
  };

  return (
    <>
      <div className="drill-bar" aria-hidden>
        <div className="prog-bar"><i style={{ width: `${pct}%` }} /></div>
        <span className="j-small">{i + 1} of {items.length}</span>
      </div>
      <section className="m-part" aria-label={`Exercise ${i + 1} of ${items.length}`}>
        <div className="m-part-label"><span className="j-label">{item.unit.name} · {item.lesson.title}</span></div>
        <ExerciseView
          key={item.id}
          exercise={item.exercise}
          onDone={(ok) => {
            if (answered !== null) return;
            setAnswered(ok);
            if (ok) setRight((n) => n + 1);
            onAnswer(item.id, ok);
          }}
        />
      </section>
      <div className="m-dock" data-tone={tone}>
        <div className="m-dock-in">
          {answered !== null ? (
            <div className="m-feedback">
              <span className="guide-face" data-mood={answered ? "hop" : undefined}><Guide /></span>
              <div><b>{feedback.title}</b><span>{feedback.line}</span></div>
            </div>
          ) : (
            <span className="j-small">{hintFor(item.exercise.kind)}</span>
          )}
          <div className="j-row">
            <button type="button" className="j-btn primary" onClick={next} disabled={answered === null}>
              {i + 1 >= items.length ? "Finish" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const GOOD = [
  { title: "That is the one.", line: "You can tell the difference. That is the skill." },
  { title: "Right.", line: "Read the why anyway; it is the part that sticks." },
  { title: "Yes.", line: "It comes back in a few days to make sure it stays." },
  { title: "Exactly.", line: "The reasons on the cards are the lesson." },
];
const HMM = [
  { title: "Not that one, and that is fine.", line: "The reasons are on the cards. It comes back tomorrow." },
  { title: "Close, but no.", line: "Read the why. This one goes to the front of your next practice." },
  { title: "That is the common answer.", line: "Which is why the lesson exists. It comes back tomorrow." },
];
const pickGood = (i: number) => GOOD[i % GOOD.length];
const pickHmm = (i: number) => HMM[i % HMM.length];

function hintFor(kind: course.Exercise["kind"]): string {
  switch (kind) {
    case "choose":
      return "Pick one.";
    case "sort":
      return "Sort every card.";
    case "order":
      return "Tap the steps in order.";
    case "match":
      return "Pair each term with its meaning.";
    case "fill":
      return "Fill the blank.";
    case "edit":
      return "Rewrite it, then check.";
  }
}
