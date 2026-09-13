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
  slug: "lantern",
  name: "Lantern",
  oneLiner: "Prepaid passes for the cafés people come back to.",
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

/**
 * The keepers, the four coaches and the desk now live in
 * @founderfloor/shared, because the website introduces the same people by
 * name and two copies of a cast drift. Re-exported here so every screen
 * that already asks lib/mock for them keeps working.
 */
export type { Coach } from "@founderfloor/shared";
export { KEEPERS, COACHES, RECEPTIONIST } from "@founderfloor/shared";

export type Thread = { id: string; kind: "message" | "handoff" | "nudge"; who: string; look: Look; stand: string; last: string; when: string; unread: boolean; lines: { role: "you" | "them"; text: string }[] };
export const THREADS: Thread[] = [
  {
    id: "t0",
    kind: "handoff",
    who: "The receptionist",
    look: { skin: 3, outfit: 4, hair: 2 },
    stand: "Hand-off · 19:10",
    last: "A visitor asked about pricing for three shops and left an email.",
    when: "19:10",
    unread: true,
    lines: [
      { role: "them", text: "A visitor stopped at the stand while you were away. They run three cafés in Limassol and asked whether the pass works across locations. I said the founder will answer, and took an email: dora@example.com. Nothing else was promised." },
    ],
  },
  {
    id: "t1",
    kind: "message",
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
    kind: "message",
    who: "Tomasz",
    look: { skin: 4, outfit: 2, hair: 0 },
    stand: "Kiln & Co · Indie Alley 3",
    last: "Signed your guestbook. The one-liner is good.",
    when: "Tue",
    unread: true,
    lines: [{ role: "them", text: "Signed your guestbook. The one-liner is good." }],
  },
  {
    id: "t3",
    kind: "nudge",
    who: "Theo",
    look: { skin: 4, outfit: 1, hair: 0 },
    stand: "Finance · reminder",
    last: "Form 5472 is due in 21 days. Source attached.",
    when: "Mon",
    unread: false,
    lines: [{ role: "them", text: "Form 5472 with the pro-forma 1120 is due 15 April, 21 days from now. Source: irs.gov/forms-pubs/about-form-5472. Check the official source; this is a calendar, not tax advice." }],
  },
  {
    id: "t3b",
    kind: "message",
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
    kind: "message",
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

export function greeting(name = YOU.name, now = new Date()): string {
  const h = now.getHours();
  const part = h < 5 ? "Late night" : h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
  return name ? `${part}, ${name}.` : `${part}.`;
}

export const STARTERS: { text: string; hint: string }[] = [
  { text: "What changed on my stand this week", hint: "visitors, signatures, connections" },
  { text: "Who is on Co-founder Row right now", hint: "the Porter's list" },
  { text: "Redraft my one-liner, three ways", hint: "the Sign Painter" },
  { text: "How far am I from Default Alive", hint: "the Records" },
];
