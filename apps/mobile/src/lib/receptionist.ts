/**
 * The desk, scripted. Until the Anthropic Edge Function is wired (Gate 3)
 * the receptionist answers from `guide.ts`: the coaches compute over the
 * founder's real numbers and the desk recognises a counter. Replies stream
 * word by word after the pause a person takes to look something up. The
 * hook's shape — send, messages, busy, reset — is the real one's, so the
 * screen does not change when the wire goes in. The composer's status line
 * says "Rehearsal" while this file is answering; it must never say
 * anything else while it is.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COACHES, RECEPTIONIST, type Coach } from "./mock";
import { useFounder } from "./store";
import { useStand } from "./stand";
import { coachReply, whereAmI, fmtMoney, runwayLine, COACH_PROMPTS, DESK_PROMPT, standBlock, memoryBlock, founderLog, workBlock, remembers, toneLine, type CoachId } from "@founderfloor/shared";
import { effectivePlan } from "./billing";
import { valueMoment } from "./trial";
import { pastLists, pastLog } from "./consent";
import { askModel, aiMode, AiError } from "./ai";

export type Turn = { id: string; role: "you" | "desk"; text: string; streaming?: boolean };

let seq = 0;
const nid = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

export function useReceptionist(coachId?: string) {
  const coach: Coach = useMemo(() => COACHES.find((c) => c.id === coachId) ?? RECEPTIONIST, [coachId]);
  const stand = useStand();
  const founder = useFounder();
  const seed = useCallback((): Turn[] => (coach.greeting ? [{ id: nid(), role: "desk", text: coach.greeting }] : []), [coach]);
  const [messages, setMessages] = useState<Turn[]>(seed);
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  /** What answered the last turn. The status line shows this, never a wish. */
  const [source, setSource] = useState<"rehearsal" | "live">("rehearsal");
  const [quota, setQuota] = useState<string | null>(null);
  /** Why the last live attempt fell back to the script, so nobody has to guess. */
  const [lastError, setLastError] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ctx = useRef({ stand, founder });
  ctx.current = { stand, founder };

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);
  useEffect(() => {
    clear();
    setMessages(seed());
    setBusy(false);
    setThinking(false);
  }, [seed]);

  const deskReply = (prompt: string): string => {
    const { stand: s, founder: f } = ctx.current;
    const r = s.record;
    const p = prompt.toLowerCase();
    if (/mock.?up|prototype|wireframe|design (my|the|an) app|build (it|my app|the app)|screens|landing page/.test(p)) return `The Workshop does that: three screens of your product, tappable, designed from your sign and what customers told you, with a picture to show people and a brief to build it from. It is behind You.\n\n[[go:/workshop|Open the Workshop]]`;
    if (/one.?liner|draft|redraft|copy|pitch|sign|tagline|write/.test(p)) return `Three tries at the sign, plain words, no adjective that needs defending. 1. ${r.oneLiner || "Say what changes hands."} 2. ${r.name || "Your company"}: who pays, and what they get. 3. The same, for someone who has never heard of you.\n\nJonah is at the counter for the message that goes with it.`;
    if (/stand|booth|visitors|week|changed/.test(p)) return `${s.name}${s.hall ? `, ${s.spot} in the ${s.hall.replace(/-/g, " ")}` : ", no spot on a floor yet"}. Rank ${s.rank.name}${r.mrr ? ` at ${fmtMoney(r.mrr, r.currency)} a month` : ""}. ${f.ticks.length ? `${f.ticks.length} things ticked on the rooms' lists.` : "Nothing ticked on the rooms' lists yet."} Nobody has visited the stand, because the floor is not open yet.`;
    if (/who|row|floor|here|tonight|people|online|hall/.test(p)) {
      return "Nobody, yet. The floor of other founders' stands is built but it is not open, and it will not be until there are founders standing on it worth walking past. Your sign goes up the day it opens. Until then the people to talk to are outside the building: the five you are meant to ask.";
    }
    if (/code|redeem|promo|product ?hunt/.test(p)) return "Codes are redeemed on the floor, and the floor is not open yet. When it is, the booth takes them.";
    if (/runway|money|cash|burn/.test(p)) return r.burn ? `${runwayLine({ cash: r.cash, burn: r.burn, mrr: r.mrr }, r.currency)}. Theo has the salary scenarios and the filing calendar.` : "Burn and cash are not on the stand yet, so nobody here can tell you the runway. They go in on your stand, under the numbers.";
    if (/where am i|honest|really/.test(p)) return whereAmI(r, f.ticks);
    if (/^(hi|hello|hey|evening|morning|yo)\b/.test(p)) return "The desk is open. Ask about your company, or say which coach you want.";
    if (/thank/.test(p)) return "Any time. The desk is open whenever the hall is.";
    return "From the desk I can tell you where your company stands, or hand you to a coach: Ines for the plan, Jonah for sales, Margot for the pitch, Theo for the money.";
  };

  /** What the coach is told beyond the stand: the log, the book, the notes — on a plan that remembers. */
  const memory = () => {
    const { founder: f } = ctx.current;
    const who = f.profile ? `\nFounder: ${f.profile.name}. ${toneLine(f.profile.tone)}${f.roadmap ? ` Their plan this month: ${f.roadmap.weeks.map((w) => `week ${w.n} ${w.focus}`).join("; ")}.` : ""}` : "";
    // the notebook is the founder's and goes with every question they said yes to; the staff's own notes between visits stay Pro
    const past = { memoryOn: f.memoryOn, memory: f.memory, planId: f.planId };
    return who + pastLists(past, f.work) + pastLog(past) + memoryBlock({ kpi: f.kpi, interviews: f.interviews, notes: f.notes.filter((n) => n.coach === coach.name) }, remembers(effectivePlan()));
  };
  /** A note for next time, and the value moment on a coach's first real reply. */
  const remember = (asked: string, said: string) => {
    const flat = said.replace(/\s+/g, " ").trim();
    const first = (flat.match(/^(.{40,220}?[.!?])(\s|$)/)?.[1] ?? flat.slice(0, 220)).trim();
    ctx.current.founder.addMemory("desk", `${coach.id === "desk" ? "the desk" : coach.name}, asked "${asked.slice(0, 80)}": ${first}`);
    if (coach.id === "desk") return; // the desk keeps no coach notes; it points
    ctx.current.founder.addNote({ coach: coach.name, asked, said });
    void valueMoment("coach");
  };

  /** Stream `full` word by word into a new desk turn. */
  const reveal = (full: string, pause: number) => {
    const words = full.split(/(\s+)/);
    const id = nid();
    timers.current.push(
      setTimeout(() => {
        setThinking(false);
        setMessages((m) => [...m, { id, role: "desk", text: "", streaming: true }]);
        let i = 0;
        const step = () => {
          i = Math.min(words.length, i + 2);
          const slice = words.slice(0, i).join("");
          const done = i >= words.length;
          setMessages((m) => m.map((x) => (x.id === id ? { ...x, text: slice, streaming: !done } : x)));
          if (done) setBusy(false);
          else timers.current.push(setTimeout(step, 22 + Math.random() * 30));
        };
        step();
      }, pause),
    );
  };

  const scripted = (t: string): string => {
    const { stand: s, founder: f } = ctx.current;
    if (coach.id === "desk") return deskReply(t);
    const out = coachReply(coach.id, t, { record: s.record, ticks: f.ticks, scores: f.scores, quota: f.quota, streak: s.streak, weekday: new Date().getDay() });
    if (out.score) f.addScore(out.score);
    if (out.sent) f.countSent(out.sent);
    if (typeof out.sent === "number" && out.sent === 0) {
      const m = t.match(/(\d+)/);
      if (m) f.setQuota(Number(m[1]));
    }
    return out.text;
  };

  const send = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      setMessages((m) => [...m, { id: nid(), role: "you", text: t }]);
      setBusy(true);
      setThinking(true);
      setQuota(null);
      setLastError(null);
      const live = aiMode() !== "rehearsal";
      if (!live) {
        const full = scripted(t);
        setSource("rehearsal");
        reveal(full, 550 + Math.min(700, full.length * 2));
        remember(t, full);
        return;
      }
      // a coach, with a key in the door: the model answers over the stand block; the script is the fallback
      const { stand: s } = ctx.current;
      const system = coach.id === "desk" ? DESK_PROMPT : COACH_PROMPTS[coach.id as CoachId].system;
      const history = messages.slice(-10).map((m) => ({ role: (m.role === "you" ? "user" : "assistant") as "user" | "assistant", content: m.text }));
      void askModel({
        fn: "coach-chat",
        body: { coach: coach.id, message: t, stand: s.record, turns: history },
        direct: { system, cached: standBlock(s.record, { sample: s.source === "rehearsal" }) + memory(), turns: [...history, { role: "user", content: t }], maxTokens: 400 },
      })
        .then((full) => {
          setSource("live");
          reveal(full, 0);
          remember(t, full);
        })
        .catch((e: unknown) => {
          if (e instanceof AiError && e.status === 402) {
            setQuota(e.message);
            setThinking(false);
            setBusy(false);
            return;
          }
          const full = scripted(t);
          setSource("rehearsal");
          setLastError(e instanceof Error ? e.message : "The model did not answer.");
          reveal(full, 0);
        });
    },
    [coach, messages],
  );

  const reset = useCallback(() => {
    clear();
    setMessages(seed());
    setBusy(false);
    setThinking(false);
  }, [seed]);

  return { coach, messages, busy, thinking, send, reset, starters: coach.topics, source, quota, lastError };
}
