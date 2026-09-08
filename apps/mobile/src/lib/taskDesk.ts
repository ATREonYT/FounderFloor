/**
 * One task from the plan, worked on. Two things live here: the guide the
 * desk writes for the task (steps, tips, when it is done), and the
 * conversation about it. Both persist in the founder store under the
 * task's key, so leaving the page and coming back finds everything where
 * it was. With a key in the door the model writes the guide and answers;
 * without one, `localTaskGuide` writes it and the desk answers from the
 * page, and the status line says so.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { asTaskGuide, localTaskGuide, taskContext, TASK_DESK_PROMPT, TASK_PROMPT, type FounderPlan, type PlanWeek, type TaskGuide } from "@founderfloor/shared";
import { AiError, aiMode, askModel, parseJson } from "./ai";
import { EMPTY_TASK, useFounder, type TaskTurn } from "./store";

let seq = 0;
const nid = () => `t${Date.now().toString(36)}${(seq++).toString(36)}`;

export function useTask(key: string, text: string, week: PlanWeek | null) {
  const profile = useFounder((s) => s.profile);
  const plan = useFounder((s) => s.roadmap);
  const work = useFounder((s) => s.tasks[key]) ?? EMPTY_TASK;
  const setGuide = useFounder((s) => s.setTaskGuide);
  const toggleStep = useFounder((s) => s.toggleTaskStep);
  const setNotes = useFounder((s) => s.setTaskNotes);
  const setChat = useFounder((s) => s.setTaskChat);
  const [writing, setWriting] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [source, setSource] = useState<"live" | "rehearsal">(work.guide?.source ?? "rehearsal");
  const [lastError, setLastError] = useState<string | null>(null);
  const [quota, setQuota] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  /** Write (or rewrite) the page for this task. The local guide is the floor; the model is the ceiling. */
  const write = useCallback(
    async (fresh = false) => {
      if (!text) return;
      const local = localTaskGuide(text, { profile, week, plan });
      if (aiMode() === "rehearsal") {
        setGuide(key, local);
        setSource("rehearsal");
        return;
      }
      setWriting(true);
      setLastError(null);
      try {
        const reply = await askModel({
          fn: "guide",
          body: { question: "task", task: text, profile, week, plan: plan ? { headline: plan.headline, weeklyGoal: plan.weeklyGoal, target90: plan.target90 } : null, fresh },
          direct: { system: TASK_PROMPT, turns: [{ role: "user", content: taskContext(text, { profile, week, plan }) + (fresh ? "\nWrite it differently from the last time: other steps, other angle." : "") }], maxTokens: 900 },
        });
        const g = asTaskGuide(parseJson(reply));
        if (!alive.current) return;
        if (g) {
          setGuide(key, { ...g, source: "live" });
          setSource("live");
        } else {
          setGuide(key, local);
          setSource("rehearsal");
          setLastError("The model's page did not parse; this one is the desk's own.");
        }
      } catch (e) {
        if (!alive.current) return;
        setGuide(key, local);
        setSource("rehearsal");
        setLastError(e instanceof Error ? e.message : "The model did not answer.");
      } finally {
        if (alive.current) setWriting(false);
      }
    },
    [key, text, profile, week, plan, setGuide],
  );

  // first visit: write the page
  useEffect(() => {
    if (!work.guide && text) void write();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, text]);

  /** The desk, on this task only. Answers stream in whole; the scripted fallback points at the next unticked step. */
  const send = useCallback(
    (raw: string) => {
      const t = raw.trim();
      if (!t || thinking) return;
      const guide = work.guide;
      const history: TaskTurn[] = [...work.chat, { id: nid(), role: "you", text: t }];
      setChat(key, history);
      setThinking(true);
      setQuota(null);
      setLastError(null);
      const scripted = (): string => {
        const next = guide?.steps.findIndex((_, i) => !work.ticks.includes(i)) ?? -1;
        if (/draft|write|message|email|post/i.test(t) && guide) return `In practice mode I cannot write it for you, but here is the shape: one line on who you are, one on what you are building for them, one clear ask. Keep it under eighty words and in your own voice. The step on the page that fits: ${guide.steps[Math.max(0, next)]?.do ?? guide.steps[0].do}`;
        if (next >= 0 && guide) return `The next thing on the page is: ${guide.steps[next].do} ${guide.steps[next].tip} When that is done, tick it and the page moves on.`;
        if (guide) return `Everything on the page is ticked. It is finished when: ${guide.done} If that is true, mark the task done and open the next one.`;
        return "The page is still being written. Give it a moment.";
      };
      if (aiMode() === "rehearsal") {
        setTimeout(() => {
          if (!alive.current) return;
          setChat(key, [...history, { id: nid(), role: "desk", text: scripted() }]);
          setSource("rehearsal");
          setThinking(false);
        }, 500);
        return;
      }
      const turns = history.slice(-10).map((m) => ({ role: (m.role === "you" ? "user" : "assistant") as "user" | "assistant", content: m.text }));
      void askModel({
        fn: "coach-chat",
        body: { coach: "desk", message: t, turns: turns.slice(0, -1), task: { text, guide, notes: work.notes, ticks: work.ticks } },
        direct: { system: TASK_DESK_PROMPT, cached: taskContext(text, { profile, week, plan, guide, notes: work.notes, ticked: work.ticks }), turns, maxTokens: 450 },
      })
        .then((full) => {
          if (!alive.current) return;
          setChat(key, [...history, { id: nid(), role: "desk", text: full.trim() }]);
          setSource("live");
        })
        .catch((e: unknown) => {
          if (!alive.current) return;
          if (e instanceof AiError && e.status === 402) {
            setQuota(e.message);
            return;
          }
          setLastError(e instanceof Error ? e.message : "The model did not answer.");
          setChat(key, [...history, { id: nid(), role: "desk", text: scripted() }]);
          setSource("rehearsal");
        })
        .finally(() => {
          if (alive.current) setThinking(false);
        });
    },
    [key, text, thinking, work, profile, week, plan, setChat],
  );

  return {
    guide: work.guide,
    ticks: work.ticks,
    notes: work.notes,
    chat: work.chat,
    writing,
    thinking,
    source,
    lastError,
    quota,
    rewrite: () => void write(true),
    tick: (i: number) => toggleStep(key, i),
    setNotes: (n: string) => setNotes(key, n),
    send,
    clearChat: () => setChat(key, []),
  };
}

/** The key PlanView and planDone use for a step. */
export const taskKey = (week: number, i: number) => `${week}-${i}`;

/** Which week of the plan it is, from when the profile was made. */
export function weekNow(profile: { at: string } | null, plan: FounderPlan | null): number {
  const n = profile ? Math.floor((Date.now() - new Date(profile.at).getTime()) / (7 * 86_400_000)) + 1 : 1;
  return Math.min(plan?.weeks.length ?? 4, Math.max(1, n));
}
