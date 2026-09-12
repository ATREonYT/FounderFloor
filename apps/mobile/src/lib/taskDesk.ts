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
import { asTaskGuide, founderLog, localTaskGuide, planWeekNow, stepOpener, taskContext, workBlock, STEP_DESK_PROMPT, TASK_DESK_PROMPT, TASK_PROMPT, type FounderPlan, type PlanWeek, type TaskGuide } from "@founderfloor/shared";
import { AiError, aiMode, askModel, parseJson } from "./ai";
import { EMPTY_TASK, useFounder, type TaskOutcome, type TaskTurn } from "./store";

let seq = 0;
const nid = () => `t${Date.now().toString(36)}${(seq++).toString(36)}`;

export function useTask(key: string, text: string, week: PlanWeek | null) {
  const profile = useFounder((s) => s.profile);
  const plan = useFounder((s) => s.roadmap);
  const work = useFounder((s) => s.tasks[key]) ?? EMPTY_TASK;
  const setGuide = useFounder((s) => s.setTaskGuide);
  const toggleStep = useFounder((s) => s.toggleTaskStep);
  const setNotes = useFounder((s) => s.setTaskNotes);
  const setOutcome = useFounder((s) => s.setTaskOutcome);
  const setChat = useFounder((s) => s.setTaskChat);
  const addMemory = useFounder((s) => s.addMemory);
  const memory = useFounder((s) => s.memory);
  const memoryOn = useFounder((s) => s.memoryOn);
  const lists = useFounder((s) => s.work);
  /** The notebook as the model reads it: nothing until the founder said yes. */
  const log = () => founderLog(memory, memoryOn === true);
  const listsBlock = () => workBlock(lists);
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
          direct: { system: TASK_PROMPT, turns: [{ role: "user", content: taskContext(text, { profile, week, plan, lists: listsBlock(), log: log() }) + (fresh ? "\nWrite it differently from the last time: other steps, other angle." : "") }], maxTokens: 900 },
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
        direct: { system: TASK_DESK_PROMPT, cached: taskContext(text, { profile, week, plan, guide, notes: work.notes, ticked: work.ticks, lists: listsBlock(), log: log() }), turns, maxTokens: 450 },
      })
        .then((full) => {
          if (!alive.current) return;
          setChat(key, [...history, { id: nid(), role: "desk", text: full.trim() }]);
          setSource("live");
          addMemory("desk", `on "${(guide?.title ?? text).slice(0, 60)}", asked "${t.slice(0, 80)}": ${firstLines(full)}`, key);
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
    tick: (i: number) => {
      const was = work.ticks.includes(i);
      toggleStep(key, i);
      const step = work.guide?.steps[i];
      if (!was && step) addMemory("did", `${step.do.replace(/\.$/, "")} (task: ${(work.guide?.title ?? text).slice(0, 60)})`, key);
    },
    outcome: (how: TaskOutcome["how"], said: string) => {
      const o: TaskOutcome = { how, text: said.trim(), at: new Date().toISOString() };
      setOutcome(key, o);
      const word = how === "did" ? "Did it" : how === "partly" ? "Partly done" : "Got stuck";
      addMemory("outcome", `${word} on "${(work.guide?.title ?? text).slice(0, 60)}"${o.text ? `: ${o.text}` : ""}`, key);
    },
    noteDown: () => {
      if (work.notes.trim()) addMemory("note", `on "${(work.guide?.title ?? text).slice(0, 60)}": ${work.notes.trim()}`, key);
    },
    memoryOn,
    setNotes: (n: string) => setNotes(key, n),
    send,
    clearChat: () => setChat(key, []),
  };
}

/** The first sentence or two of a reply, for the notebook. */
function firstLines(s: string): string {
  const flat = s.replace(/\s+/g, " ").trim();
  const m = flat.match(/^(.{40,220}?[.!?])(\s|$)/);
  return (m ? m[1] : flat.slice(0, 220)).trim();
}

/** The key PlanView and planDone use for a step. */
export const taskKey = (week: number, i: number) => `${week}-${i}`;

/**
 * Which week of the plan it is. Not the calendar week: the week the
 * founder is ON. Weeks advance by weeks worked, so a fortnight away is a
 * fortnight the plan waited, and a week the founder marked "life
 * happened" does not move it either.
 *
 * The old rule (calendar weeks since the profile was made) is kept for
 * one case only: a founder whose phone has no record of visits, from
 * before the building kept them. Even then it can only be as forgiving,
 * never harsher, because the smaller of the two is taken.
 */
export function weekNow(profile: { at: string } | null, plan: FounderPlan | null, visits: string[] = [], paused: string[] = []): number {
  const max = plan?.weeks.length ?? 4;
  if (!visits.length) {
    const n = profile ? Math.floor((Date.now() - new Date(profile.at).getTime()) / (7 * 86_400_000)) + 1 : 1;
    return Math.min(max, Math.max(1, n));
  }
  return planWeekNow(visits, paused, max);
}

/**
 * The week the founder is on, read from the building, and the moment it
 * is read the building remembers the day it began. That date is what the
 * week's own reading is measured over, so a week stretched across an
 * absence still counts everything written in it.
 */
export function useWeekNow(): number {
  const profile = useFounder((s) => s.profile);
  const plan = useFounder((s) => s.roadmap);
  const visits = useFounder((s) => s.visits);
  const paused = useFounder((s) => s.paused);
  const openWeek = useFounder((s) => s.openWeek);
  const n = weekNow(profile, plan, visits, paused);
  useEffect(() => {
    if (plan) openWeek(n);
  }, [n, plan, openWeek]);
  return n;
}

/**
 * The room at one step: the founder writes what they did there, it goes
 * in the notebook, and the desk answers over the whole task. The first
 * line in the room is the desk's question for this kind of work.
 */
export function useStepRoom(key: string, text: string, week: PlanWeek | null, step: number) {
  const profile = useFounder((s) => s.profile);
  const plan = useFounder((s) => s.roadmap);
  const work = useFounder((s) => s.tasks[key]) ?? EMPTY_TASK;
  const addTurn = useFounder((s) => s.addStepTurn);
  const toggleStep = useFounder((s) => s.toggleTaskStep);
  const addMemory = useFounder((s) => s.addMemory);
  const memory = useFounder((s) => s.memory);
  const memoryOn = useFounder((s) => s.memoryOn);
  const lists = useFounder((s) => s.work);
  const [thinking, setThinking] = useState(false);
  const [source, setSource] = useState<"live" | "rehearsal">("rehearsal");
  const [lastError, setLastError] = useState<string | null>(null);
  const [quota, setQuota] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const guide = work.guide;
  const st = guide?.steps[step] ?? null;
  const turns = work.work?.[step] ?? [];
  const ticked = work.ticks.includes(step);
  const opener = guide && st ? stepOpener(guide.kind, st) : "";

  const send = useCallback(
    (raw: string) => {
      const t = raw.trim();
      if (!t || thinking || !st) return;
      addTurn(key, step, { id: nid(), role: "you", text: t });
      addMemory("work", `at "${st.do.replace(/\.$/, "").slice(0, 70)}": ${t}`, key);
      setThinking(true);
      setQuota(null);
      setLastError(null);
      const scripted = (): string => {
        if (/stuck|can't|cannot|don't know|no idea/i.test(t)) return `Written down. Stuck is a place, not a verdict. The smallest move here: ${st.tip || st.do} Do that for twenty minutes and write what happened.`;
        if (/done|finished|did it|sent|posted|shipped|talked|called/i.test(t)) return `Written down. That reads like the step is done; tick it above. Next on the page: ${guide?.steps[step + 1]?.do ?? "the task is finished, say how it went."}`;
        return `Written down, word for word. ${st.tip ? st.tip + " " : ""}When this step is done, tick it and the desk moves on.`;
      };
      if (aiMode() === "rehearsal") {
        setTimeout(() => {
          if (!alive.current) return;
          addTurn(key, step, { id: nid(), role: "desk", text: scripted() });
          setSource("rehearsal");
          setThinking(false);
        }, 500);
        return;
      }
      const history = [...turns, { id: "x", role: "you" as const, text: t }].slice(-10).map((m) => ({ role: (m.role === "you" ? "user" : "assistant") as "user" | "assistant", content: m.text }));
      const ctx = taskContext(text, { profile, week, plan, guide, notes: work.notes, ticked: work.ticks, lists: workBlock(lists), log: founderLog(memory, memoryOn === true) }) + `\nThe step open now: ${step + 1}. ${st.do} Tip on the page: ${st.tip}`;
      void askModel({
        fn: "coach-chat",
        body: { coach: "desk", message: t, turns: history.slice(0, -1), task: { text, guide, step, notes: work.notes, ticks: work.ticks } },
        direct: { system: STEP_DESK_PROMPT, cached: ctx, turns: history, maxTokens: 320 },
      })
        .then((full) => {
          if (!alive.current) return;
          addTurn(key, step, { id: nid(), role: "desk", text: full.trim() });
          addMemory("desk", `at "${st.do.slice(0, 60)}": ${firstLines(full)}`, key);
          setSource("live");
        })
        .catch((e: unknown) => {
          if (!alive.current) return;
          if (e instanceof AiError && e.status === 402) {
            setQuota(e.message);
            return;
          }
          setLastError(e instanceof Error ? e.message : "The model did not answer.");
          addTurn(key, step, { id: nid(), role: "desk", text: scripted() });
          setSource("rehearsal");
        })
        .finally(() => {
          if (alive.current) setThinking(false);
        });
    },
    [key, step, st, guide, turns, thinking, text, profile, week, plan, work, memory, memoryOn, lists, addTurn, addMemory],
  );

  return {
    guide,
    step: st,
    turns,
    ticked,
    opener,
    thinking,
    source,
    lastError,
    quota,
    send,
    tick: () => {
      toggleStep(key, step);
      if (!ticked && st) addMemory("did", `${st.do.replace(/\.$/, "")} (task: ${(guide?.title ?? text).slice(0, 60)})`, key);
    },
  };
}

/** The six rooms, in order; the plan names the first, and each week moves one room on, stopping at the last. */
export const ROOM_ORDER = ["idea", "validate", "setup", "customers", "money", "raise"] as const;
export function roomOfWeek(plan: FounderPlan | null, week: number): number {
  const first = plan ? Math.max(0, ROOM_ORDER.indexOf(plan.firstRoom)) : 0;
  return Math.min(ROOM_ORDER.length - 1, first + Math.max(0, week - 1));
}
