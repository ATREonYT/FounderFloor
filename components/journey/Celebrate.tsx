"use client";

/**
 * A BRIEF MOMENT, ONCE PER MILESTONE.
 *
 * A card, a sentence, a button. It is shown the first time a milestone is
 * reached and never again, it can be dismissed with Escape, and under
 * prefers-reduced-motion it simply appears. Stopping an idea with
 * evidence gets exactly the same card as finishing a stage.
 */
import { useEffect, useRef } from "react";
import { journey } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";
import Guide from "@/components/journey/Guide";

export default function Celebrate() {
  const { state, dispatch, ready } = useJourney();
  const m = ready ? journey.toCelebrate(state) : null;
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!m) return;
    btn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch({ type: "celebrated", id: m.id });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [m, dispatch]);

  if (!m) return null;
  return (
    <div className="celebrate" role="dialog" aria-modal="true" aria-labelledby="cel-title">
      <div className="celebrate-card">
        <Guide />
        <span className="j-label">Milestone</span>
        <h2 id="cel-title">{m.title}</h2>
        <p>{m.line}</p>
        <button ref={btn} type="button" className="j-btn primary" onClick={() => dispatch({ type: "celebrated", id: m.id })}>
          Carry on
        </button>
      </div>
    </div>
  );
}
