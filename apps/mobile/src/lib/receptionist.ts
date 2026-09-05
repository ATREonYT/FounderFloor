/**
 * The desk, scripted. Until the Anthropic Edge Function is wired (Gate 5)
 * the receptionist answers from this file: it reads the prompt for a
 * counter it recognises and streams the matching reply word by word, after
 * the pause a person takes to look something up. The hook's shape — send,
 * messages, busy, reset — is the shape the real one will have, so the
 * screen does not change when the wire goes in. The composer's status line
 * says "rehearsal" while this file is answering; it must never say
 * anything else while it is.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COACHES, RECEPTIONIST, STAND, HALLS, YOU, type Coach } from "./mock";

export type Turn = { id: string; role: "you" | "desk"; text: string; streaming?: boolean };

const rules: { test: RegExp; reply: () => string }[] = [
  {
    test: /one.?liner|draft|redraft|copy|pitch|sign|tagline|write/i,
    reply: () =>
      `Three tries, plain words, no adjective that needs defending:\n\n1. Prepaid meal passes for small shops.\n2. ${STAND.name}: your regulars pay ahead, the shop keeps the float.\n3. Loyalty for the places too small for an app.\n\nThe second says what changes hands. I would put that one on the sign.`,
  },
  {
    test: /stand|booth|visitors|guestbook|week|changed/i,
    reply: () =>
      `Your stand is ${STAND.spot} in the Main Hall. This week: ${STAND.week.visitors} visitors, ${STAND.week.signatures} guestbook signatures, ${STAND.week.connections} new connections. Most people arrived from the Row, not the door. The sign has not changed since ${STAND.updated}; the Sign Painter will redraft it if you want a second opinion.`,
  },
  {
    test: /who|row|floor|here|tonight|people|online|hall/i,
    reply: () => {
      const row = HALLS.find((h) => h.id === "cofounder-row")!;
      const main = HALLS.find((h) => h.id === "main-hall")!;
      return `${main.here} people are on the floor. Co-founder Row has ${row.here}, three of them technical and looking. Ramen District is quiet until the evening. Mira from Ledgerline is at her stand now and has been asking about prepaid models. Want me to put a pin on her?`;
    },
  },
  {
    test: /code|redeem|promo|product ?hunt/i,
    reply: () => "Codes are redeemed at the Ticket Booth, under Membership. PRODUCTHUNT is still live: three months of Founder+, one per account, until 3 December. Wren will take it; say the word and I will open the booth.",
  },
  {
    test: /ticket/i,
    reply: () => `You are holding ${YOU.tickets} tickets. Turning up earns 15 a day with a streak, a new connection 15, a guestbook signature 5. A gold spot on the Row is 400. Nothing in the hall is pay-to-win, because there is nothing to win.`,
  },
  {
    test: /default alive|rank|ramen|revenue|mrr|far am i/i,
    reply: () => `You are Ramen Profitable at €${STAND.mrr.toLocaleString("en-GB")} a month. Default Alive starts at €10,000, so €8,800 to go. At this week's pace that is about fourteen months; two more shops at the current pass price cuts it to nine. Bea at the Records has the full ledger.`,
  },
  {
    test: /^(hi|hello|hey|evening|morning|yo)\b/i,
    reply: () => "Evening. What do you need: your stand, the floor, or a person?",
  },
  {
    test: /thank/i,
    reply: () => "Any time. The desk is open whenever the hall is.",
  },
];

function replyFor(prompt: string): string {
  for (const r of rules) if (r.test.test(prompt)) return r.reply();
  return "I can do three things from the desk: tell you about your stand, tell you who is in the building, or walk you to a coach. Which is it?";
}

let seq = 0;
const nid = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

export function useReceptionist(coachId?: string) {
  const coach: Coach = useMemo(() => COACHES.find((c) => c.id === coachId) ?? RECEPTIONIST, [coachId]);
  const seed = useCallback((): Turn[] => (coach.greeting ? [{ id: nid(), role: "desk", text: coach.greeting }] : []), [coach]);
  const [messages, setMessages] = useState<Turn[]>(seed);
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  const send = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { id: nid(), role: "you", text: t }]);
    setBusy(true);
    setThinking(true);
    const full = replyFor(t);
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
  }, []);

  const reset = useCallback(() => {
    clear();
    setMessages(seed());
    setBusy(false);
    setThinking(false);
  }, [seed]);

  return { coach, messages, busy, thinking, send, reset };
}
