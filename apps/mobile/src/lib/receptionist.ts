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
import { COACHES, RECEPTIONIST, HALLS, type Coach } from "./mock";
import { useFounder } from "./store";
import { useStand } from "./stand";
import { coachReply, whereAmI } from "./guide";
import { fmtMoney, runwayLine } from "@founderfloor/shared";

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
    if (/one.?liner|draft|redraft|copy|pitch|sign|tagline|write/.test(p)) return `That is the Sign Painter's counter on the floor, and Rook's here. For the sign: three tries, plain words, no adjective that needs defending. 1. ${r.oneLiner || "Say what changes hands."} 2. ${r.name || "Your company"}: who pays, and what they get. 3. The same, for the person who has never heard of you.\n\nWant Rook to draft the message that goes with it?`;
    if (/stand|booth|visitors|week|changed/.test(p)) return `${s.name}${s.hall ? `, ${s.spot} in the ${s.hall.replace(/-/g, " ")}` : ", no spot on a floor yet"}. Rank ${s.rank.name}${r.mrr ? ` at ${fmtMoney(r.mrr, r.currency)} a month` : ""}. ${s.online ? "Your stand is showing you online." : "Your stand shows you away; the receptionist is answering."} ${f.ticks.length ? `${f.ticks.length} workshop items ticked.` : "Nothing ticked in the workshop yet."}\n\nWant the honest version from Ines: where are you really?`;
    if (/who|row|floor|here|tonight|people|online|hall/.test(p)) {
      const row = HALLS.find((h) => h.id === "cofounder-row")!;
      const main = HALLS.find((h) => h.id === "main-hall")!;
      return `${main.here} people are on the floor. Co-founder Row has ${row.here}. Ramen District is quiet until the evening. The Floor tab drops you in; the counts up top are live.\n\nWant me to open the Row?`;
    }
    if (/code|redeem|promo|product ?hunt/.test(p)) return "Codes are redeemed at the Ticket Booth on the floor, under Membership. PRODUCTHUNT is live: three months of Founder+, one per account, until 3 December.\n\nWant the Floor tab open at the booth?";
    if (/runway|money|cash|burn/.test(p)) return r.burn ? `${runwayLine({ cash: r.cash, burn: r.burn, mrr: r.mrr }, r.currency)}. Teodor has the salary scenarios and the filing calendar.\n\nOpen Finance?` : "Burn and cash are not on the stand yet, so nobody here can tell you the runway. Open the stand and put the three numbers in.\n\nShall I open it?";
    if (/where am i|honest|really/.test(p)) return whereAmI(r, f.ticks);
    if (/^(hi|hello|hey|evening|morning|yo)\b/.test(p)) return "Evening. What do you need: your stand, the floor, or one of the coaches?";
    if (/thank/.test(p)) return "Any time. The desk is open whenever the hall is.";
    return "I can do three things from the desk: tell you about your stand, tell you who is in the building, or hand you to a coach: Ines for the plan, Rook for sales, Marguerite for the pitch, Teodor for the money.\n\nWhich?";
  };

  const send = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      setMessages((m) => [...m, { id: nid(), role: "you", text: t }]);
      setBusy(true);
      setThinking(true);
      const { stand: s, founder: f } = ctx.current;
      let full: string;
      if (coach.id === "desk") full = deskReply(t);
      else {
        const out = coachReply(coach.id, t, { record: s.record, ticks: f.ticks, scores: f.scores, quota: f.quota, streak: s.streak, weekday: new Date().getDay() });
        full = out.text;
        if (out.score) f.addScore(out.score);
        if (out.sent) f.countSent(out.sent);
        if (typeof out.sent === "number" && out.sent === 0) {
          const m = t.match(/(\d+)/);
          if (m) f.setQuota(Number(m[1]));
        }
      }
      const words = full.split(/(\s+)/);
      const id = nid();
      const pause = 550 + Math.min(700, full.length * 2);
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
    },
    [coach],
  );

  const reset = useCallback(() => {
    clear();
    setMessages(seed());
    setBusy(false);
    setThinking(false);
  }, [seed]);

  return { coach, messages, busy, thinking, send, reset, starters: coach.topics };
}
