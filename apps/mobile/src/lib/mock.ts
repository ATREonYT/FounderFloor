/**
 * Stand-in data until Gate 2 wires the floor server and Supabase. Every
 * figure here is shaped like the real thing (lib/types.ts, server/index.mjs)
 * so the screens do not change when the wire goes in — only this file does.
 * Copy is in the venue's voice: complete sentences, no exclamation marks.
 */
import type { Look, SubTier, CarpetPattern } from "@founderfloor/ui";

export const YOU = {
  name: "Alex",
  look: { skin: 2, outfit: 0, hair: 0 } as Look,
  tier: "founder" as SubTier,
  founding: true,
  tickets: 70,
};

export const STAND = {
  slug: "soup-ticket",
  name: "Soup Ticket",
  oneLiner: "Prepaid meal passes for small shops.",
  hall: "main-hall" as HallId,
  spot: "A-04",
  swatch: 0,
  carpetSwatch: 8,
  pattern: "solid" as CarpetPattern,
  mrr: 1200,
  week: { visitors: 38, signatures: 6, connections: 2 },
  updated: "Tue 2 Sep",
};

export type HallId = "main-hall" | "indie-alley" | "ramen-district" | "cofounder-row" | "tutorial-hall";
export const HALLS: { id: HallId; name: string; here: number; tagline: string; open: boolean }[] = [
  { id: "main-hall", name: "Main Hall", here: 14, tagline: "The free floor. Twenty-four stands, first come first served. Everyone starts here.", open: true },
  { id: "indie-alley", name: "Indie Alley", here: 6, tagline: "Folding tables, real users, no adult supervision.", open: true },
  { id: "ramen-district", name: "Ramen District", here: 3, tagline: "Revenue-ranked stands past this door. The lanterns are decorative; the MRR is self-reported.", open: true },
  { id: "cofounder-row", name: "Co-founder Row", here: 5, tagline: "Everyone on this floor is looking for the other half of their cap table. Yes, everyone.", open: true },
  { id: "tutorial-hall", name: "Tutorial Hall", here: 1, tagline: "Where you learn to walk. Nobody will judge you.", open: true },
];

/** The keepers of the Main Hall (lib/data/floors.ts) — each one is a coach. */
export type Coach = { id: string; name: string; sign: string; title: string; blurb: string; color: string; look: Look; topics: string[]; greeting: string };
export const COACHES: Coach[] = [
  {
    id: "signwright",
    name: "Alder",
    sign: "SIGN PAINTER",
    title: "Copy, names, the one-liner",
    blurb: "Repaint your stand — colours, banner, sign, props. Alder will also tell you when a sentence is doing too much.",
    color: "#5E7C93",
    look: { skin: 4, outfit: 6, hair: 1 },
    topics: ["one-liners", "sign copy", "colours"],
    greeting: "Alder here. Read me the sentence on your sign and I will tell you which word is lying.",
  },
  {
    id: "porter",
    name: "Halloway",
    sign: "PORTER'S LODGE",
    title: "Who is where, and when",
    blurb: "Which floors are open, and who is on them right now. Ask for a person and Halloway will find their stand.",
    color: "#4F6E6B",
    look: { skin: 1, outfit: 3, hair: 4 },
    topics: ["floors", "people", "hours"],
    greeting: "Halloway. Fourteen in the Main Hall, five on the Row. Who are you looking for?",
  },
  {
    id: "records",
    name: "Bea",
    sign: "THE RECORDS",
    title: "Your numbers, in context",
    blurb: "Who is top of the hall this week, and what you are holding. Bea reads the ranks and will not round up.",
    color: "#B08D2E",
    look: { skin: 0, outfit: 1, hair: 3 },
    topics: ["ranks", "revenue", "streaks"],
    greeting: "Bea, at the Records. You are Ramen Profitable at €1,200 a month. Default Alive is €10,000. Ask me what moves it.",
  },
  {
    id: "register",
    name: "Odile",
    sign: "THE REGISTER",
    title: "Every stand, searchable",
    blurb: "Every stand in the hall, listed and searchable. Odile knows who is building what, and who might want to meet you.",
    color: "#7A6070",
    look: { skin: 5, outfit: 5, hair: 2 },
    topics: ["directory", "introductions", "categories"],
    greeting: "Odile. Two hundred and eleven stands on the register. Tell me what you make and I will tell you who else does.",
  },
  {
    id: "tickets",
    name: "Wren",
    sign: "TICKET BOOTH",
    title: "Tickets, codes, membership",
    blurb: "Buy tickets, or see the ways to earn them. Wren also takes codes and explains what Founder+ actually gets you.",
    color: "#B4762E",
    look: { skin: 2, outfit: 2, hair: 5 },
    topics: ["tickets", "codes", "Founder+"],
    greeting: "Wren, at the booth. You are holding 70 tickets. Spending, earning, or redeeming a code?",
  },
  {
    id: "arcade",
    name: "Bram",
    sign: "THE ARCADE",
    title: "A quick run, for tickets",
    blurb: "Parkour, quizzes and a quick run. Tickets for a good one. Bram keeps the times and is not impressed easily.",
    color: "#C4562B",
    look: { skin: 3, outfit: 7, hair: 6 },
    topics: ["parkour", "quizzes", "this week's best"],
    greeting: "Bram. Best run this week is 41.2 seconds. Yours is not on the board yet.",
  },
];
export const RECEPTIONIST: Coach = {
  id: "desk",
  name: "The desk",
  sign: "RECEPTION",
  title: "Reception",
  blurb: "Ask about your stand, the floor, or a person.",
  color: "#BE241B",
  look: { skin: 3, outfit: 4, hair: 2 },
  topics: [],
  greeting: "",
};

export type Thread = { id: string; who: string; look: Look; stand: string; last: string; when: string; unread: boolean; lines: { role: "you" | "them"; text: string }[] };
export const THREADS: Thread[] = [
  {
    id: "t1",
    who: "Mira",
    look: { skin: 1, outfit: 5, hair: 4 },
    stand: "Ledgerline · A-11",
    last: "Yes to Thursday. I'll bring the churn numbers.",
    when: "18:42",
    unread: true,
    lines: [
      { role: "them", text: "Saw your stand from the Row. Prepaid passes for cafés — are you doing the float or is the shop?" },
      { role: "you", text: "The shop holds it. We just make the pass and the ledger. Want to compare notes Thursday?" },
      { role: "them", text: "Yes to Thursday. I'll bring the churn numbers." },
    ],
  },
  {
    id: "t2",
    who: "Tomasz",
    look: { skin: 4, outfit: 2, hair: 0 },
    stand: "Kilnhouse · Indie Alley 3",
    last: "Signed your guestbook. The one-liner is good.",
    when: "Tue",
    unread: true,
    lines: [{ role: "them", text: "Signed your guestbook. The one-liner is good." }],
  },
  {
    id: "t3",
    who: "Halloway",
    look: { skin: 1, outfit: 3, hair: 4 },
    stand: "Porter's Lodge",
    last: "Co-founder Row opens at 19:00 tonight. Doors are yours.",
    when: "Mon",
    unread: false,
    lines: [{ role: "them", text: "Co-founder Row opens at 19:00 tonight. Doors are yours." }],
  },
  {
    id: "t4",
    who: "Priya",
    look: { skin: 5, outfit: 7, hair: 6 },
    stand: "Northlight · Ramen 2",
    last: "You: Sent the deck. Tell me which slide loses you.",
    when: "Sun",
    unread: false,
    lines: [
      { role: "them", text: "Your rank ticked up this week. What changed?" },
      { role: "you", text: "Sent the deck. Tell me which slide loses you." },
    ],
  },
];

export function greeting(now = new Date()): string {
  const h = now.getHours();
  const part = h < 5 ? "Late night" : h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
  return `${part}, ${YOU.name}.`;
}

export const STARTERS: { text: string; hint: string }[] = [
  { text: "What changed on my stand this week", hint: "visitors, signatures, connections" },
  { text: "Who is on Co-founder Row right now", hint: "the Porter's list" },
  { text: "Redraft my one-liner, three ways", hint: "the Sign Painter" },
  { text: "How far am I from Default Alive", hint: "the Records" },
];
