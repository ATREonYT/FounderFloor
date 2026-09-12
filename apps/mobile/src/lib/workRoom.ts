/**
 * The room at one line of a list. The founder writes what they did there;
 * it is kept against the line, goes into the notebook, and the desk
 * answers over the line, how to do it, and everything written so far.
 * With a key in the door the model answers; without one the scripted
 * desk does, and the status line says so.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { founderLog, scriptedWork, standBlock, workBlock, workContext, workItem, workOpener, WORK_DESK_PROMPT, type WorkItem } from "@founderfloor/shared";
import { AiError, aiMode, askModel } from "./ai";
import { useStand } from "./stand";
import { useFounder, type TaskTurn } from "./store";
import { pastLists, pastLog, type Past } from "./consent";

let seq = 0;
const nid = () => `w${Date.now().toString(36)}${(seq++).toString(36)}`;

export function useWorkRoom(id: string, text?: string) {
  const item: WorkItem | null = workItem(id, text);
  const turns = useFounder((s) => s.work[id]) ?? [];
  const ticks = useFounder((s) => s.ticks);
  const toggleTick = useFounder((s) => s.toggleTick);
  const addTurn = useFounder((s) => s.addWorkTurn);
  const addMemory = useFounder((s) => s.addMemory);
  const memory = useFounder((s) => s.memory);
  const memoryOn = useFounder((s) => s.memoryOn);
  const lists = useFounder((s) => s.work);
  const stand = useStand();
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
  const ticked = ticks.includes(id);

  const send = useCallback(
    (raw: string) => {
      const t = raw.trim();
      if (!t || thinking || !item) return;
      addTurn(id, { id: nid(), role: "you", text: t });
      addMemory("work", `on "${item.text.replace(/\.$/, "").slice(0, 70)}": ${t}`, id);
      setThinking(true);
      setQuota(null);
      setLastError(null);
      if (aiMode() === "rehearsal") {
        setTimeout(() => {
          if (!alive.current) return;
          addTurn(id, { id: nid(), role: "desk", text: scriptedWork(item, t) });
          setSource("rehearsal");
          setThinking(false);
        }, 500);
        return;
      }
      const history = [...turns, { id: "x", role: "you" as const, text: t }].slice(-10).map((m) => ({ role: (m.role === "you" ? "user" : "assistant") as "user" | "assistant", content: m.text }));
      const others = Object.fromEntries(Object.entries(lists).filter(([k]) => k !== id));
      const past: Past = { memoryOn, memory, planId: useFounder.getState().planId };
      const ctx = workContext(item, turns, { ticked, stand: standBlock(stand.record, { sample: stand.source === "rehearsal" }), lists: pastLists(past, others), log: pastLog(past) });
      void askModel({
        fn: "coach-chat",
        body: { coach: "desk", message: t, turns: history.slice(0, -1), line: { id, text: item.text, how: item.how, ticked } },
        direct: { system: WORK_DESK_PROMPT, cached: ctx, turns: history, maxTokens: 320 },
      })
        .then((full) => {
          if (!alive.current) return;
          addTurn(id, { id: nid(), role: "desk", text: full.trim() });
          addMemory("desk", `on "${item.text.slice(0, 60)}": ${firstLines(full)}`, id);
          setSource("live");
        })
        .catch((e: unknown) => {
          if (!alive.current) return;
          if (e instanceof AiError && e.status === 402) {
            setQuota(e.message);
            return;
          }
          setLastError(e instanceof Error ? e.message : "The model did not answer.");
          addTurn(id, { id: nid(), role: "desk", text: scriptedWork(item, t) });
          setSource("rehearsal");
        })
        .finally(() => {
          if (alive.current) setThinking(false);
        });
    },
    [id, item, turns, thinking, ticked, lists, stand.record, stand.source, memory, memoryOn, addTurn, addMemory],
  );

  return {
    item,
    turns: turns as TaskTurn[],
    ticked,
    opener: item ? workOpener(item) : "",
    thinking,
    source,
    lastError,
    quota,
    memoryOn,
    send,
    tick: () => {
      toggleTick(id);
      if (!ticked && item) addMemory("did", `${item.text.replace(/\.$/, "")}${item.room ? ` (${item.room.name} room)` : ""}`, id);
    },
  };
}

function firstLines(s: string): string {
  const flat = s.replace(/\s+/g, " ").trim();
  const m = flat.match(/^(.{40,220}?[.!?])(\s|$)/);
  return (m ? m[1] : flat.slice(0, 220)).trim();
}
