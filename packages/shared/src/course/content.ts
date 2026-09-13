/**
 * THE COURSE: WHAT A START-UP IS, AND HOW TO MAKE A GOOD ONE.
 *
 * Six sections, eighteen units, one concept per lesson, and every lesson
 * ends in the learner doing something with it rather than reading more
 * of it. This file is the shape; the lessons live in ./sections.
 *
 * The shape follows what is known about learning a skill, not what is
 * common in courses. Dunlosky et al. (2013) rated ten techniques on the
 * evidence: practice testing and spaced practice are the two that work
 * everywhere; rereading, highlighting and summarising barely work at
 * all. So a lesson here is short to read and long to do — four to six
 * exercises with a right answer the learner can be wrong about — and the
 * engine brings old exercises back on a widening schedule and puts the
 * ones you missed at the front (see state.ts). Interleaving, the third
 * technique with evidence behind it, is why later lessons reuse earlier
 * concepts and why practice mixes units.
 *
 * Two passes, the way a language course has levels. Every unit has
 * three basics lessons and one depth lesson. Basics teach the concept
 * and the one rule of thumb; depth teaches where the rule bends, what
 * the number actually is, and what people get wrong. A unit's checkpoint
 * can be taken at any time; pass it and the unit is yours, which is how
 * somebody who already knows this part jumps ahead.
 *
 * What is NOT in here: lives, streaks that break, a leaderboard, and any
 * exercise whose only purpose is points. Every exercise carries a "why"
 * for its answer, because the why is the lesson and the answer is only
 * the excuse to read it.
 *
 * Content rules, checked by test: no exclamation marks; no promises;
 * "validated" appears only to be corrected; every term is explained the
 * first time it appears in a unit; a lesson's apply step writes to a
 * real line on the learner's idea page.
 */
import type { OutputKey } from "../journey/content.ts";

export type SectionId = "foundations" | "customer" | "product" | "money" | "growth" | "company";

export interface Section {
  id: SectionId;
  n: number;
  name: string;
  /** One line a beginner follows. */
  line: string;
  /** What you will be able to do at the end, in one sentence. */
  outcome: string;
}

export const SECTIONS: readonly Section[] = [
  { id: "foundations", n: 1, name: "What a start-up is", line: "The word means something specific. Most people who use it do not know what.", outcome: "Say what a start-up is, why most fail, and whether your idea and your team have the shape of one." },
  { id: "customer", n: 2, name: "The customer", line: "Everything good starts with a real person and a real problem. This is how you find both.", outcome: "Talk to people in a way they cannot lie to you, and tell what you know from what you assume." },
  { id: "product", n: 3, name: "The product", line: "The smallest thing you can put in front of someone, and what it tells you when you do.", outcome: "Build the smallest useful thing, test an offer, and recognise product-market fit — or its absence — honestly." },
  { id: "money", n: 4, name: "The money", line: "Price, the arithmetic of one customer, and the date the money runs out.", outcome: "Set a price, check whether a customer ever pays for themselves, and know if you are default alive." },
  { id: "growth", n: 5, name: "Growth", line: "Getting the first customers by hand, then finding the one channel that works.", outcome: "Find your first ten customers yourself, test channels cheaply, and measure the one number that matters weekly." },
  { id: "company", n: 6, name: "The company", line: "The boring hour that saves the terrible month, and how a founder actually spends a week.", outcome: "Set the company up properly, run a founder's week, and decide with your eyes open whether to raise or bootstrap." },
];

/** The learner's own line this lesson helps them write, on the idea page. */
export interface Apply {
  key: OutputKey;
  prompt: string;
  hint: string;
}

/**
 * An exercise is a thing you can be wrong about, and every one explains
 * itself. Ids are derived from position (exerciseId), so the memory
 * schedule survives edits to the wording but not to the order.
 */
export type Exercise =
  | { kind: "choose"; prompt: string; options: { text: string; good: boolean; why: string }[] }
  | { kind: "sort"; prompt: string; buckets: [string, string]; items: { text: string; bucket: 0 | 1; why: string }[] }
  | { kind: "order"; prompt: string; steps: string[]; why: string }
  | { kind: "match"; prompt: string; pairs: { term: string; meaning: string }[] }
  | { kind: "fill"; prompt: string; options: string[]; answer: number; why: string }
  | { kind: "edit"; prompt: string; before: string; better: string[] };

export interface Lesson {
  id: string;
  n: number;
  title: string;
  /** The second pass: where the rule bends and what the number is. */
  depth?: boolean;
  /** In-app minutes, reading and doing. */
  minutes: number;
  objective: string;
  /** Two to four short paragraphs. The reading is short on purpose. */
  teach: string[];
  example?: { label: string; text: string }[];
  exercises: Exercise[];
  /** The one line to keep. */
  remember: string;
  apply?: Apply;
}

export interface Unit {
  id: string;
  section: SectionId;
  n: number;
  name: string;
  line: string;
  /** The guidebook: the unit's ideas on one page, for reference, not for study. */
  guide: string[];
  /** The journey missions that are this unit's real-world work, in order, if any. */
  missions?: string[];
  lessons: Lesson[];
}

export const exerciseId = (lessonId: string, i: number): string => `${lessonId}.${i}`;
