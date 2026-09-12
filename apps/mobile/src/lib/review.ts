/**
 * One week, read back. The numbers come from the store (ticks, the
 * notebook, outcomes); the words come from the model when there is a key
 * and from the rules when there is not. A reading is kept per week and
 * rewritten when the notebook has grown since, or on request.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { asReview, founderLog, localReview, reviewContext, weekFacts, REVIEW_PROMPT, type PlanWeek, type WeekFacts, type WeekReview } from "@founderfloor/shared";
import { AiError, aiMode, askModel, parseJson } from "./ai";
import { useFounder } from "./store";

export function useWeekReview(week: PlanWeek | null) {
  const profile = useFounder((s) => s.profile);
  const plan = useFounder((s) => s.roadmap);
  const planDone = useFounder((s) => s.planDone);
  const tasks = useFounder((s) => s.tasks);
  const memory = useFounder((s) => s.memory);
  const memoryOn = useFounder((s) => s.memoryOn);
  const weekStarts = useFounder((s) => s.weekStarts);
  const stored = useFounder((s) => (week ? s.reviews[week.n] : undefined));
  const setReview = useFounder((s) => s.setReview);
  const [reading, setReading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  // the week's real window, so a week stretched over an absence still counts everything written in it
  const facts: WeekFacts | null = week ? weekFacts(week, { profile, planDone, tasks, memory, weekStarts }) : null;

  const read = useCallback(
    async (force = false) => {
      if (!week || !facts) return;
      const local = { ...localReview(facts, profile), seen: memory.length };
      if (aiMode() === "rehearsal") {
        setReview(local);
        return;
      }
      setReading(true);
      setLastError(null);
      try {
        const reply = await askModel({
          fn: "guide",
          body: { question: "review", week: week.n, facts, force },
          direct: { system: REVIEW_PROMPT, turns: [{ role: "user", content: reviewContext(facts, { profile, plan, week, log: founderLog(memory, memoryOn === true) }) }], maxTokens: 700 },
        });
        const r = asReview(parseJson(reply), facts);
        if (!alive.current) return;
        if (r) setReview({ ...r, source: "live", at: new Date().toISOString(), seen: memory.length });
        else {
          setReview(local);
          setLastError("The model's reading did not parse; this one is the desk's own.");
        }
      } catch (e) {
        if (!alive.current) return;
        if (e instanceof AiError && e.status === 402) setLastError(e.message);
        else setLastError(e instanceof Error ? e.message : "The model did not answer.");
        setReview(local);
      } finally {
        if (alive.current) setReading(false);
      }
    },
    [week, facts, profile, plan, memory, memoryOn, setReview],
  );

  // no reading yet, or the notebook has grown by a few lines since: read again
  const stale = !!week && (!stored || memory.length - stored.seen >= 3);
  useEffect(() => {
    if (stale && !reading) void read();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week?.n, stale]);

  return { review: stored ?? null, facts, reading, lastError, reread: () => void read(true) };
}
