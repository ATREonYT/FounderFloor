/**
 * The workshop: six rooms, four or five things to do in each. Item ids are
 * permanent — ticks are stored against them. Copy is in the site's voice:
 * imperative, concrete, with the number the founder has to hit. Every item
 * carries a "how" for someone who has never done it, and the question the
 * desk asks in the item's room (/did) to get them writing what they did.
 */
import type { StageId } from "./types.ts";

export interface BuildItem {
  id: string;
  text: string;
  /** What counts as done, so the guide and the founder mean the same thing. */
  proof: string;
  /** How to do it, for someone who has never done it: two or three short sentences, and where in the building it happens when the building does the work. */
  how: string;
  /** The desk's question that gets the founder writing what they did. */
  ask: string;
  /** The door in the building where this is done, when there is one. */
  door?: { route: string; label: string };
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
      { id: "idea.problem", text: "Write the problem in one sentence with no product in it", proof: "A sentence a stranger can repeat back", how: "Finish this sentence: \"People like ___ have trouble with ___.\" No app, no product, no company in it. Say it to somebody and ask them to say it back. If they get it wrong, make it shorter.", ask: "Write your sentence here, word for word. Who did you say it to, and did they say it back right?" },
      { id: "idea.who", text: "Name ten real people who have it this month", proof: "Ten names, not a persona", how: "Real people with real names, who have this problem this month. Friends, people at work, people you buy from. If you can only think of three, that is a finding too.", ask: "List the names. Next to each one, how you know them and why they have the problem." },
      { id: "idea.now", text: "Say why this is possible now and was not two years ago", proof: "One change in the world, dated", how: "Something changed recently that makes this possible: a new tool, a new law, a new habit, a price that fell. Name it, and say roughly when it happened.", ask: "What changed, and when? One line." },
      { id: "idea.today", text: "List what those ten do about it today, and what it costs them", proof: "The current workaround, with a number", how: "Ask two of your ten people what they do about the problem right now. A spreadsheet, a cousin, doing nothing. Then ask what it costs them: money, hours, or headaches.", ask: "What do they do today, and what does it cost them? Their words and a number if you got one." },
      { id: "idea.edge", text: "Write the one reason it is you and not somebody with more money", proof: "An edge you can defend for a minute", how: "Why you: you know these people, you have done this job, you have the time, you speak their language. One reason, honest, that a stranger with more money does not have.", ask: "Your one reason, in one line. If you are not sure, write the two you are choosing between." },
    ],
  },
  {
    id: "validate",
    n: 2,
    name: "Validate",
    sign: "VALIDATE",
    blurb: "Conversations before code. A price said out loud before a landing page.",
    items: [
      { id: "validate.talks", text: "Have ten conversations about the problem, none about your idea", proof: "Ten dated notes", how: "Ask ten people about their week, never about your idea. Ask what wastes their time and what they have tried. Write each one down in the Office, the same day.", ask: "Who did you talk to, and what did they say? Names, dates, their exact words.", door: { route: "/office", label: "Open the interview book" } },
      { id: "validate.price", text: "Say a price out loud to three of them and write down the face they made", proof: "Three reactions, one number", how: "Pick a price. Say it out loud to three people who have the problem: \"It would cost about X a month.\" Then stop talking and watch their face. Write down what it did.", ask: "Which price did you say, to whom, and what did their face do?" },
      { id: "validate.page", text: "Put up a one-page website with your sentence and a box for emails", proof: "A live URL", how: "The Workshop draws your app and writes the brief. Send the brief to Lovable and it makes a one-page website with your sentence and a box for emails. You do not write any code.", ask: "Paste the link to your page, or say where you got stuck in the Workshop.", door: { route: "/workshop", label: "Open the Workshop" } },
      { id: "validate.list", text: "Get twenty-five emails from people you do not know", proof: "Twenty-five, not counting friends", how: "Put the link where your ten people and their friends are: a group chat, a forum, a post. Ask people to leave their email if they want it. Count only strangers.", ask: "How many emails so far, and where did they come from?" },
      { id: "validate.kill", text: "Write the result that would make you stop, before you get results", proof: "A kill criterion with a date", how: "Before the results come, write the result that would make you stop. For example: \"If fewer than five strangers leave an email by the 30th, I stop.\" A date and a number.", ask: "Your stopping rule, with the number and the date." },
    ],
  },
  {
    id: "setup",
    n: 3,
    name: "Set up",
    sign: "SET UP",
    blurb: "The boring hour that saves the terrible month. Entity, bank, books, vesting.",
    items: [
      { id: "setup.entity", text: "Choose the entity and where it lives, and write why in two lines", proof: "Entity type and country on the stand", how: "A company is a legal box the money goes into. Ask Theo which kind fits your country and what it costs. Write the choice and why in two lines. Check the official source before signing anything.", ask: "Which kind, in which country, and why? Two lines.", door: { route: "/reception", label: "Ask Theo" } },
      { id: "setup.bank", text: "Open the business account and move the first money into it", proof: "One transaction", how: "A separate bank account for the company, so its money and yours never mix. Open it, and move the first money in, even a small amount.", ask: "Which bank, and what was the first money in?" },
      { id: "setup.books", text: "Pick how the books get done, monthly, by a named person or tool", proof: "A recurring calendar entry", how: "The books are the record of money in and money out. Pick who does them every month: you with a tool, or a person you name. Put it in your calendar as a repeat.", ask: "Who does the books, with what, and on which day of the month?" },
      { id: "setup.vesting", text: "Sign founder agreements with vesting, even alone", proof: "Signed, dated, filed", how: "If there is more than one founder, sign a paper that says who owns what, and that shares are earned over time (vesting). Even alone, write down what you own and date it.", ask: "Signed and dated? Who owns what?" },
      { id: "setup.domain", text: "Own the domain and a real email on it", proof: "Mail arrives", how: "Buy your name as a web address (a domain) and set up an email on it, so mail from you looks like a company. Ten minutes and a small yearly fee.", ask: "Which domain, and does mail arrive?" },
    ],
  },
  {
    id: "customers",
    n: 4,
    name: "First customers",
    sign: "CUSTOMERS",
    blurb: "One person pays. Then five. Then you find out why they stay.",
    items: [
      { id: "customers.first", text: "Get one person to pay real money", proof: "A receipt with a name on it", how: "Ask one person who has the problem to pay real money, even a little, even before it is perfect. Say the price, then wait. Take the money any way that works: a bank transfer, a payment link.", ask: "Who paid, how much, and how did they pay?" },
      { id: "customers.five", text: "Get five paying customers you did not know before", proof: "Five, none of them friends", how: "Five people paying who were not your friends. Jonah drafts the message in your voice; you send it, ten at a time, and count what comes back.", ask: "Who are the five, and how did each one find you?", door: { route: "/reception", label: "Ask Jonah" } },
      { id: "customers.onboard", text: "Watch three of them onboard and cut it under ten minutes", proof: "A timer, three runs", how: "Sit with three new customers, one at a time, and watch them start using it without helping. Time it. Where they get stuck is what to fix.", ask: "How long did each take, and where did they get stuck?" },
      { id: "customers.quota", text: "Hit the weekly outreach quota four weeks running", proof: "Four green weeks with the Sales coach", how: "Decide how many people you will ask each week, tell Jonah the number, and hit it four weeks in a row. The number matters less than hitting it.", ask: "What is the number, and how many weeks in a row so far?", door: { route: "/reception", label: "Ask Jonah" } },
      { id: "customers.churn", text: "Measure who left and ask two of them why", proof: "Two answers written down", how: "Churn means people who stopped. Count them. Ask two of them, kindly, why they left, and write down the reason in their words.", ask: "How many left, and what did the two say?" },
    ],
  },
  {
    id: "money",
    n: 5,
    name: "Money & runway",
    sign: "MONEY",
    blurb: "Know the date the money runs out. Move it by choice, not surprise.",
    items: [
      { id: "money.runway", text: "Put cash, spending and income on the stand so runway is a real number", proof: "The Finance coach can say the date", how: "Runway is how many months until the money runs out. Put three numbers on your stand: cash in the bank, what you spend a month (burn), and what comes in a month (MRR). Theo does the sum.", ask: "The three numbers, and the date Theo gave you.", door: { route: "/stand", label: "Put the numbers on the stand" } },
      { id: "money.close", text: "Close the books once, on time, and read them", proof: "One monthly close", how: "Closing the books means checking that every euro in and out for the month is written down and adds up. Do it once, on the first day of the next month, and read the total.", ask: "Which month, and what did the total say?" },
      { id: "money.price", text: "Raise or restructure the price once and keep the customers", proof: "A change and a retention number", how: "Change the price once, up or into a different shape, and see who stays. Tell people plainly, before it changes.", ask: "What was the price, what is it now, and how many customers stayed?" },
      { id: "money.salary", text: "Decide the founder salary in one line of arithmetic", proof: "A number and its effect on runway", how: "Decide what you pay yourself, in one line of arithmetic: cash minus burn, then what that does to the runway date. Theo runs it.", ask: "The salary, and the new runway date.", door: { route: "/reception", label: "Ask Theo" } },
      { id: "money.plan", text: "Write the twelve-month plan with three numbers in it", proof: "Revenue, customers, cash at month twelve", how: "Three numbers for twelve months from now: money in a month, customers, cash in the bank. Write them down with today's date. You will be wrong; that is fine.", ask: "The three numbers for month twelve." },
    ],
  },
  {
    id: "raise",
    n: 6,
    name: "Raise or bootstrap",
    sign: "RAISE",
    blurb: "Decide, in writing. Then either score a pitch or name the month you turn profitable.",
    items: [
      { id: "raise.decide", text: "Write the decision and the reason it could be wrong", proof: "One page, dated", how: "Raising means taking investors' money for a share of the company. Bootstrapping means growing on customers' money. Pick one, write why, and write the way it could be wrong.", ask: "Which one, why, and how could it be wrong?" },
      { id: "raise.pitch", text: "Score seven or above with the Investor coach, twice", proof: "Two scores in the history", how: "A pitch is the company in two minutes. Say it to Margot, twice, and read her score. Under seven means change something and try again.", ask: "What did Margot score, and what did she say to change?", door: { route: "/reception", label: "Pitch to Margot" } },
      { id: "raise.list", text: "List twenty investors who did this stage in your country, or name the profitable month", proof: "Twenty names, or a month", how: "Twenty investors who put money into companies like yours, in your country, at your stage. Or, if you bootstrap, the month you expect to make more than you spend.", ask: "The twenty names, or the month." },
      { id: "raise.room", text: "Build the data room from what is already on the stand", proof: "A folder somebody else can read", how: "A data room is a folder of what is already on your stand: the numbers, the customers, the plan. Put it somewhere a stranger can read it.", ask: "Where is the folder, and what is in it?" },
      { id: "raise.cheque", text: "First cheque in, or first profitable month closed", proof: "Money that stays", how: "The money arrives, or the month closes with more in than out. Write the date.", ask: "Which one happened, and on which date?" },
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
