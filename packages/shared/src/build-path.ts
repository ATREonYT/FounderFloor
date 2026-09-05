/**
 * The workshop: six rooms, four or five things to do in each. Item ids are
 * permanent — ticks are stored against them. Copy is in the site's voice:
 * imperative, concrete, with the number the founder has to hit.
 */
import type { StageId } from "./types.ts";

export interface BuildItem {
  id: string;
  text: string;
  /** What counts as done, so the guide and the founder mean the same thing. */
  proof: string;
}
export interface BuildStage {
  id: StageId;
  n: number;
  name: string;
  sign: string;
  blurb: string;
  items: BuildItem[];
}

export const STAGES: readonly BuildStage[] = [
  {
    id: "idea",
    n: 1,
    name: "Idea",
    sign: "IDEA",
    blurb: "One problem, one kind of person, said in a sentence a stranger repeats back correctly.",
    items: [
      { id: "idea.problem", text: "Write the problem in one sentence with no product in it", proof: "A sentence a stranger can repeat back" },
      { id: "idea.who", text: "Name ten real people who have it this month", proof: "Ten names, not a persona" },
      { id: "idea.now", text: "Say why this is possible now and was not two years ago", proof: "One change in the world, dated" },
      { id: "idea.today", text: "List what those ten do about it today, and what it costs them", proof: "The current workaround, with a number" },
      { id: "idea.edge", text: "Write the one reason it is you and not somebody with more money", proof: "An edge you can defend for a minute" },
    ],
  },
  {
    id: "validate",
    n: 2,
    name: "Validate",
    sign: "VALIDATE",
    blurb: "Conversations before code. A price said out loud before a landing page.",
    items: [
      { id: "validate.talks", text: "Have ten conversations about the problem, none about your idea", proof: "Ten dated notes" },
      { id: "validate.price", text: "Say a price out loud to three of them and write down the face they made", proof: "Three reactions, one number" },
      { id: "validate.page", text: "Put up a one-page site with the sentence and an email box", proof: "A live URL" },
      { id: "validate.list", text: "Get twenty-five emails from people you do not know", proof: "Twenty-five, not counting friends" },
      { id: "validate.kill", text: "Write the result that would make you stop, before you get results", proof: "A kill criterion with a date" },
    ],
  },
  {
    id: "setup",
    n: 3,
    name: "Set up",
    sign: "SET UP",
    blurb: "The boring hour that saves the terrible month. Entity, bank, books, vesting.",
    items: [
      { id: "setup.entity", text: "Choose the entity and where it lives, and write why in two lines", proof: "Entity type and country on the stand" },
      { id: "setup.bank", text: "Open the business account and move the first money into it", proof: "One transaction" },
      { id: "setup.books", text: "Pick how the books get done, monthly, by a named person or tool", proof: "A recurring calendar entry" },
      { id: "setup.vesting", text: "Sign founder agreements with vesting, even alone", proof: "Signed, dated, filed" },
      { id: "setup.domain", text: "Own the domain and a real email on it", proof: "Mail arrives" },
    ],
  },
  {
    id: "customers",
    n: 4,
    name: "First customers",
    sign: "CUSTOMERS",
    blurb: "One person pays. Then five. Then you find out why they stay.",
    items: [
      { id: "customers.first", text: "Get one person to pay real money", proof: "A receipt with a name on it" },
      { id: "customers.five", text: "Get five paying customers you did not know before", proof: "Five, none of them friends" },
      { id: "customers.onboard", text: "Watch three of them onboard and cut it under ten minutes", proof: "A timer, three runs" },
      { id: "customers.quota", text: "Hit the weekly outreach quota four weeks running", proof: "Four green weeks with the Sales coach" },
      { id: "customers.churn", text: "Measure who left and ask two of them why", proof: "Two answers written down" },
    ],
  },
  {
    id: "money",
    n: 5,
    name: "Money & runway",
    sign: "MONEY",
    blurb: "Know the date the money runs out. Move it by choice, not surprise.",
    items: [
      { id: "money.runway", text: "Put cash, burn and MRR on the stand so runway is a real number", proof: "The Finance coach can say the date" },
      { id: "money.close", text: "Close the books once, on time, and read them", proof: "One monthly close" },
      { id: "money.price", text: "Raise or restructure the price once and keep the customers", proof: "A change and a retention number" },
      { id: "money.salary", text: "Decide the founder salary in one line of arithmetic", proof: "A number and its effect on runway" },
      { id: "money.plan", text: "Write the twelve-month plan with three numbers in it", proof: "Revenue, customers, cash at month twelve" },
    ],
  },
  {
    id: "raise",
    n: 6,
    name: "Raise or bootstrap",
    sign: "RAISE",
    blurb: "Decide, in writing. Then either score a pitch or name the month you turn profitable.",
    items: [
      { id: "raise.decide", text: "Write the decision and the reason it could be wrong", proof: "One page, dated" },
      { id: "raise.pitch", text: "Score seven or above with the Investor coach, twice", proof: "Two scores in the history" },
      { id: "raise.list", text: "List twenty investors who did this stage in your country, or name the profitable month", proof: "Twenty names, or a month" },
      { id: "raise.room", text: "Build the data room from what is already on the stand", proof: "A folder somebody else can read" },
      { id: "raise.cheque", text: "First cheque in, or first profitable month closed", proof: "Money that stays" },
    ],
  },
];

export function stageById(id: StageId): BuildStage {
  const s = STAGES.find((x) => x.id === id);
  if (!s) throw new Error(`unknown stage ${id}`);
  return s;
}
/** 0..1 for one stage given the set of ticked item ids. */
export function stageProgress(stage: BuildStage, ticks: ReadonlySet<string> | readonly string[]): number {
  const t = ticks instanceof Set ? ticks : new Set(ticks);
  const done = stage.items.filter((i) => t.has(i.id)).length;
  return stage.items.length ? done / stage.items.length : 0;
}
/** The first stage that is not complete — where the company is on the path. */
export function currentStage(ticks: ReadonlySet<string> | readonly string[]): BuildStage {
  for (const s of STAGES) if (stageProgress(s, ticks) < 1) return s;
  return STAGES[STAGES.length - 1];
}
export function pathProgress(ticks: ReadonlySet<string> | readonly string[]): number {
  const all = STAGES.reduce((n, s) => n + s.items.length, 0);
  const t = ticks instanceof Set ? ticks : new Set(ticks);
  return [...t].filter((id) => STAGES.some((s) => s.items.some((i) => i.id === id))).length / all;
}
