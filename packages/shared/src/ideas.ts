/**
 * Ideas: finding one, and reading one back kindly.
 *
 * Research (Sept 2026) says the market is flooded with "idea validators"
 * that hand back a generic score, and founders reject them because a
 * number does not change what they do next. So the check here never
 * scores. It says what is already strong, which questions only a customer
 * can answer, who to talk to first and how to ask without leading them.
 * The readiness word is one of three and none of them is a verdict.
 *
 * The finder is the rehearsal generator the app uses until the Edge
 * Function answers; its shape is the one the live prompt returns.
 */
import type { Segment } from "./types.ts";

export interface IdeaBrief {
  /** What you know how to do. */
  skills: string[];
  /** People you already know well or can reach. */
  audiences: string[];
  hoursPerWeek: number;
  /** Money you could spend before revenue, in your currency. */
  budget: number;
  /** Things you would enjoy working on, in the founder's words. */
  likes?: string;
}

export interface Idea {
  id: string;
  oneLiner: string;
  who: string;
  pain: string;
  whatChangesHands: string;
  whyNow: string;
  firstTen: string;
  mustBeTrue: string;
  segment: Segment;
  effort: "evenings" | "part-time" | "full-time";
}

const AUDIENCES: { key: string; who: string; pains: { pain: string; product: string; hands: string; now: string; segment: Segment }[]; firstTen: string }[] = [
  {
    key: "cafe|café|shop|restaurant|bakery|retail|barber|salon",
    who: "small independent shops",
    firstTen: "the ten shops you already buy from; ask the owner, not the counter",
    pains: [
      { pain: "regulars pay late and cash flow swings week to week", product: "a prepaid pass their regulars top up", hands: "the shop gets cash ahead; the customer gets a small discount", now: "card fees rose and shops finally want prepayment", segment: "b2b-saas" },
      { pain: "no time to post, so the shop is invisible online", product: "a weekly post drafted from their own photos and menu", hands: "they pay a flat monthly fee; you send three posts to approve", now: "phones make good photos and the drafting is cheap", segment: "services" },
      { pain: "stock runs out on the busiest day", product: "a two-question end-of-day check that predicts tomorrow's order", hands: "a few euros a week for fewer empty shelves", now: "the maths is trivial now that suppliers take orders by text", segment: "b2b-saas" },
    ],
  },
  {
    key: "teacher|tutor|school|student|parent|kids|children",
    who: "tutors and small teaching practices",
    firstTen: "tutors on the local parents' group; message ten by name",
    pains: [
      { pain: "chasing parents for payment and rescheduling by text", product: "a booking-and-pay link that lives in their WhatsApp bio", hands: "parents pay per lesson; the tutor pays a small monthly fee", now: "payment links are free and parents already live in chat apps", segment: "b2b-saas" },
      { pain: "progress lives in the tutor's head, so parents drop out", product: "a monthly progress card generated from the tutor's notes", hands: "tutors keep families longer; they pay for the retention", now: "generating a readable card from rough notes costs almost nothing", segment: "b2b-saas" },
    ],
  },
  {
    key: "freelanc|designer|developer|consult|agency|contractor",
    who: "freelancers billing by the project",
    firstTen: "ten freelancers you have worked beside; ask what they did last invoice day",
    pains: [
      { pain: "scope creep with no paper trail", product: "a change-request log the client signs in one tap", hands: "the freelancer pays monthly; each signed change protects the invoice", now: "clients sign on their phones without a second thought", segment: "b2b-saas" },
      { pain: "months with three invoices and months with none", product: "a retainer offer generator that turns past projects into a monthly package", hands: "a one-off fee per retainer pitch that wins", now: "clients prefer predictable bills as budgets tighten", segment: "services" },
    ],
  },
  {
    key: "landlord|property|tenant|airbnb|host|real estate|flat",
    who: "small landlords and short-let hosts",
    firstTen: "hosts on the local Airbnb host group; ten who manage two or more places",
    pains: [
      { pain: "the same ten guest questions, at midnight", product: "a house guide that answers from the host's own notes", hands: "hosts pay per property per month", now: "answering from notes is cheap and guests expect an instant reply", segment: "b2b-saas" },
      { pain: "cleaners, keys and check-ins coordinated by hand", product: "a turnover checklist sent to the cleaner the moment a booking ends", hands: "a monthly fee per property", now: "booking calendars are open and cleaners work by text", segment: "b2b-saas" },
    ],
  },
  {
    key: "clinic|dentist|physio|doctor|therap|coach|trainer|gym|yoga",
    who: "solo practitioners with appointments",
    firstTen: "the practitioners you already see; ask about last week's no-shows",
    pains: [
      { pain: "no-shows that cost a whole hour", product: "a deposit-and-reminder flow that fills cancelled slots from a waitlist", hands: "practitioners pay per filled slot or a flat monthly fee", now: "deposits are normal now and waitlists fit in a text", segment: "b2b-saas" },
      { pain: "writing up notes after the last client of the day", product: "a two-minute voice note turned into a session summary in their template", hands: "a monthly fee; the time saved is the pitch", now: "transcription is nearly free and accurate", segment: "b2b-saas" },
    ],
  },
  {
    key: "founder|startup|indie|maker|saas|developer",
    who: "solo founders after their first launch",
    firstTen: "ten makers who launched in the last month on Product Hunt; ask what happened the week after",
    pains: [
      { pain: "built the product, nobody came, no idea what to do next", product: "a weekly first-customers plan that turns a launch into ten conversations", hands: "a monthly subscription; cancel the week you have customers", now: "AI builders ship prototypes in a day and leave the rest", segment: "b2b-saas" },
      { pain: "investor updates never get written", product: "a monthly update drafted from five numbers the founder types in", hands: "a monthly fee; the founder pays for the discipline", now: "drafting from numbers is cheap; the discipline is the product", segment: "b2b-saas" },
    ],
  },
  {
    key: "farmer|garden|plant|food|producer|market",
    who: "small food producers selling direct",
    firstTen: "ten stalls at the Saturday market; buy something and ask about their week",
    pains: [
      { pain: "orders arrive by text, DM and phone and get lost", product: "one order page they paste in every chat", hands: "a flat monthly fee under the price of one lost order", now: "customers order in chat and producers hate forms", segment: "marketplace" },
    ],
  },
  {
    key: "musician|artist|creator|writer|podcast|photograph|video",
    who: "creators with a small paying audience",
    firstTen: "ten creators with 500 to 5,000 followers; ask what they sold last month",
    pains: [
      { pain: "fans want to pay but the tools take a cut and a login", product: "a one-page tip-and-preorder shop in the creator's colours", hands: "the creator keeps the money; a small monthly fee", now: "payment links are free and audiences are already small and loyal", segment: "consumer" },
    ],
  },
];

const SKILL_MECHANISMS: Record<string, string> = {
  code: "software",
  developer: "software",
  design: "a designed template pack",
  writing: "a writing service that becomes a product",
  sales: "a done-for-you service that becomes software later",
  marketing: "a content service with a monthly fee",
  finance: "a spreadsheet product that grows into software",
  ops: "an operations checklist that becomes an app",
};

function seed(s: string): () => number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/** Five ideas from what the founder knows and who they know. Deterministic for the same brief. */
export function findIdeas(brief: IdeaBrief): Idea[] {
  const text = `${brief.skills.join(" ")} ${brief.audiences.join(" ")} ${brief.likes ?? ""}`.toLowerCase();
  const rnd = seed(text + brief.hoursPerWeek + brief.budget);
  const matched = AUDIENCES.filter((a) => new RegExp(a.key).test(text));
  const pool = matched.length ? [...matched, ...AUDIENCES.filter((a) => !matched.includes(a))] : [...AUDIENCES].sort(() => rnd() - 0.5);
  const effort: Idea["effort"] = brief.hoursPerWeek < 10 ? "evenings" : brief.hoursPerWeek < 30 ? "part-time" : "full-time";
  const mech = Object.keys(SKILL_MECHANISMS).find((k) => text.includes(k));
  const out: Idea[] = [];
  let i = 0;
  for (const a of pool) {
    for (const p of a.pains) {
      if (out.length >= 5) break;
      const cheap = brief.budget < 500 && p.segment === "services" ? " Start as a service; software comes when three people pay." : "";
      out.push({
        id: `idea-${i++}`,
        oneLiner: `${p.product[0].toUpperCase()}${p.product.slice(1)} for ${a.who}.`,
        who: a.who,
        pain: p.pain,
        whatChangesHands: p.hands,
        whyNow: p.now,
        firstTen: a.firstTen,
        mustBeTrue: `${a.who[0].toUpperCase()}${a.who.slice(1)} must say this cost them time or money in the last month, unprompted.${cheap}${mech ? ` Your ${mech} skill means you can build ${SKILL_MECHANISMS[mech]} first.` : ""}`,
        segment: p.segment,
        effort,
      });
    }
    if (out.length >= 5) break;
  }
  return out;
}

// ─── the second opinion ───────────────────────────────────────────────────
export type Readiness = "sketch" | "forming" | "ready";
export interface IdeaRead {
  readiness: Readiness;
  readinessLine: string;
  strong: string[];
  questions: string[];
  talkTo: string;
  ask: string[];
  sharpen: string;
}

const MOM_TEST = [
  "Tell me about the last time this happened to you.",
  "What did you do about it? What did that cost you, in time or money?",
  "What else have you tried? Why did you stop?",
  "Who else has this problem that you know?",
  "If this went away tomorrow, what would you do with the time?",
];

/** Read an idea back: what is strong, what only customers can answer, who to ask, how. Never a score. */
export function readIdea(text: string): IdeaRead {
  const t = text.toLowerCase();
  const has = (re: RegExp) => re.test(t);
  const who = has(/\b(for|helps?|serving)\s+(small|solo|indie|local|busy|new|first-time|young)?\s*\w+(s|ers|ors|ists|ants)\b/) || has(/founders|shops|freelancers|teachers|landlords|parents|students|clinics|creators|teams|owners|agencies|nurses|drivers|hosts/);
  const hands = has(/pay|price|€|\$|£|per month|subscription|fee|charge|invoice|sell|cost/);
  const now = has(/\bnow\b|since|this year|202\d|changed|\bnew\b|finally|because|recently|regulation|\bai\b/);
  const evidence = has(/\d+\s*(people|customers|users|shops|founders|signed|paying|interviews|waitlist|replies|emails)/) || has(/talked to|spoke to|interviewed|asked \d+/);
  const pain = has(/lose|waste|hours|late|miss|forget|chase|manual|spreadsheet|by hand|no time|expensive|frustrat|pain|problem|struggle/);
  const parts = [who, hands, now, evidence, pain].filter(Boolean).length;
  const readiness: Readiness = parts <= 1 ? "sketch" : parts <= 3 ? "forming" : "ready";
  const strong: string[] = [];
  const questions: string[] = [];
  if (who) strong.push("You name a specific kind of person. That is rarer than it sounds, and it makes the first ten conversations possible.");
  else questions.push("Who, exactly, feels this on a Tuesday? A job title or a situation, not a market.");
  if (pain) strong.push("There is a real cost in the sentence: time or money going somewhere it should not.");
  else questions.push("What does the problem cost them today, in hours or money? If they cannot say, they will not pay.");
  if (hands) strong.push("You already know what changes hands. Most ideas skip that part for a year.");
  else questions.push("What do they pay, and for what moment? A price said out loud teaches more than a landing page.");
  if (now) strong.push("You have a reason this is possible now and was not before.");
  else questions.push("Why now? What changed in the world in the last two years that makes this easier or more wanted?");
  if (evidence) strong.push("You have talked to people or counted something. That is evidence, and it puts you ahead of most.");
  else questions.push("Who have you asked so far, and what did they say they already do about it?");
  if (strong.length === 0) strong.push("You wrote it down and you are asking. That is the first step most people skip.");
  const talkTo = who ? "The ten people closest to the sentence you wrote: the ones you could message today by name. Not friends who will be kind, people who live the problem." : "First decide who: write down ten real people who might have this problem, by name. Then talk to the ten, not to a survey.";
  const sharpen = !hands
    ? "Add one clause: who pays, and for what. It will feel too early. It is not."
    : !who
      ? "Replace the market word with a person: not small businesses, the owner of a two-chair barbershop."
      : !evidence
        ? "Before anything else, five conversations this week. Use the questions below and write down what they said, not what you heard."
        : "Say the price to three of them this week and write down the face they made.";
  const line: Record<Readiness, string> = {
    sketch: "A sketch. Good: sketches are cheap to change. The questions below are the next hour, not a judgement.",
    forming: "Forming. Some of the hard parts are already there; the rest are questions only customers can answer.",
    ready: "Ready to test. You have the parts; now it is conversations and a price, not more thinking.",
  };
  return { readiness, readinessLine: line[readiness], strong: strong.slice(0, 3), questions: questions.slice(0, 3), talkTo, ask: MOM_TEST, sharpen };
}
