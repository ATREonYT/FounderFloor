/**
 * The founder's profile and their plan. The welcome conversation asks
 * eight things in plain words; the answers become a profile; the profile
 * becomes a four-week plan, from the model when there is a key and from
 * these rules when there is not. The plan is a starting shape, not a
 * contract: it names the room to begin in, the goal to hold for the
 * week, and the 90-day target to write on the stand.
 */
export type Door = "find" | "have" | "running";

export type Standing = "itch" | "idea" | "building" | "running";
export type Goal = "first-customer" | "side-income" | "quit-job" | "raise" | "learn";
export type Horizon = "3m" | "6m" | "12m";
export type Pace = "evenings" | "part-time" | "all-in";
export type Tone = "gentle" | "direct" | "blunt";

export interface Profile {
  name: string;
  standing: Standing;
  likes: string[];
  audiences: string;
  goal: Goal;
  horizon: Horizon;
  pace: Pace;
  tone: Tone;
  budget: 0 | 500 | 5000;
  at: string;
}

export interface PlanWeek {
  n: number;
  focus: string;
  do: string[];
}
export interface FounderPlan {
  headline: string;
  why: string;
  weeks: PlanWeek[];
  /** Which room on the map to start in. */
  firstRoom: "idea" | "validate" | "setup" | "customers" | "money" | "raise";
  weeklyGoal: string;
  target90: string;
  source: "live" | "rehearsal";
}

export const LIKES: { id: string; label: string }[] = [
  { id: "talking", label: "Talking to people" },
  { id: "building", label: "Building things" },
  { id: "writing", label: "Writing" },
  { id: "selling", label: "Selling" },
  { id: "numbers", label: "Numbers and operations" },
  { id: "design", label: "Design" },
  { id: "teaching", label: "Teaching" },
  { id: "organising", label: "Organising people" },
];

export const GOALS: { id: Goal; label: string; line: string }[] = [
  { id: "first-customer", label: "A first paying customer", line: "Someone pays, once, for real." },
  { id: "side-income", label: "Income on the side", line: "A few hundred a month, kept." },
  { id: "quit-job", label: "Enough to quit my job", line: "Replace a salary, then some." },
  { id: "raise", label: "Raise a round", line: "Investors, a deck, a story with numbers." },
  { id: "learn", label: "Learn by building one", line: "Ship something and see what happens." },
];

/** The door the standing maps to. */
export const doorFor = (s: Standing): Door => (s === "itch" ? "find" : s === "idea" ? "have" : "running");

export const PLAN_PROMPT = `You make a four-week plan for one founder from a short profile. Assume they have never built a company or an app: every action must be something a person with no training can do this week, in plain words, with no code, no spec, no wireframe and no deck. Building happens in the Workshop, which draws the app and writes the brief a builder tool makes the working version from; say "Open the Workshop" or "Send the brief to Lovable" for anything to build. The founder's own actions are talking to real people, deciding, and writing down what happened. Return JSON only, with keys: headline (one sentence, warm, specific to them, under 16 words), why (two sentences on why this path fits their pace and goal), weeks (array of exactly 4 objects with n, focus (under 8 words) and do (3 concrete actions, each under 14 words, each doable in that week at their pace)), firstRoom (one of idea, validate, setup, customers, money, raise), weeklyGoal (one measurable goal for week 1, under 12 words, with a number), target90 (one measurable target for 90 days, under 12 words, with a number). Match the tone they asked for: gentle, direct or blunt. Never invent facts about them; use only the profile. No prose outside the JSON.`;

const paceHours: Record<Pace, string> = { evenings: "five hours a week", "part-time": "fifteen hours a week", "all-in": "full weeks" };

/** The plan without a model: the same shape, from the standing, the goal and the pace. */
export function localPlan(p: Profile): FounderPlan {
  const first = p.standing === "itch" ? "idea" : p.standing === "idea" ? "validate" : p.standing === "building" ? "customers" : "money";
  const first90: Record<Goal, string> = {
    "first-customer": "3 paying customers by day 90",
    "side-income": "€500 a month by day 90",
    "quit-job": "€2,000 a month by day 90",
    raise: "20 investor conversations by day 90",
    learn: "1 thing shipped and 10 users by day 90",
  };
  const weekOne: Record<Standing, string> = {
    itch: "Talk to 5 people about a problem, none about an idea",
    idea: "Have 5 conversations about the problem this week",
    building: "Get 3 people to use it this week",
    running: "Log this week's five numbers by Friday",
  };
  const weeks: PlanWeek[] =
    p.standing === "itch"
      ? [
          { n: 1, focus: "Find the problem", do: ["Pick the people you know best", "Ask five of them what wastes their week", "Write down the exact words they use"] },
          { n: 2, focus: "Pick one idea", do: ["Run the idea finder from your answers", "Read the best one back with the second opinion", "Put it on the sign"] },
          { n: 3, focus: "Test the price", do: ["Say a price out loud to three people", "Write down the face they made", "Open the Workshop and send the brief to Lovable for a one-page website"] },
          { n: 4, focus: "First yes", do: ["Ask one person to pay, even a little", "Log the week in the Office", "Decide: keep going or change the idea"] },
        ]
      : p.standing === "idea"
        ? [
            { n: 1, focus: "Read it back", do: ["Write the idea in one sentence", "Get the second opinion on it", "List ten real people who have the problem"] },
            { n: 2, focus: "Talk, do not build", do: ["Five conversations about the problem", "Write their words in the interview book", "Change the sentence if they changed it"] },
            { n: 3, focus: "A price and a page", do: ["Say a price to three of them", "Open the Workshop and send the brief to Lovable for the first version", "Twenty-five emails from strangers"] },
            { n: 4, focus: "The first yes", do: ["Ask one person to pay", "Log the week", "Set the 90-day target with Ines"] },
          ]
        : p.standing === "building"
          ? [
              { n: 1, focus: "People, not features", do: ["Three people use it this week", "Watch one of them without helping", "Write down where they got stuck"] },
              { n: 2, focus: "The first payment", do: ["Ask one user to pay", "Pick how people pay you, a payment link is enough", "Draft the pricing sheet"] },
              { n: 3, focus: "Five paying", do: ["Ten outreach messages, your voice, no link", "Log the week in the Office", "Interview book: five entries"] },
              { n: 4, focus: "Why they stay", do: ["Ask the payers why they stayed", "Cut one thing nobody uses", "Set the 90-day target"] },
            ]
          : [
              { n: 1, focus: "The numbers, weekly", do: ["Log revenue, customers, cash, hours, shipped", "Put burn and cash on the stand", "Read the runway with Theo"] },
              { n: 2, focus: "Filing and entity", do: ["Check the filing calendar", "Fix the one date nearest", "Draft the entity comparison if needed"] },
              { n: 3, focus: "Growth or margin", do: ["Pick one number to move this month", "Ten conversations with customers", "Update drafted from the log"] },
              { n: 4, focus: "The next ninety", do: ["Set the 90-day target", "Friday review with Ines", "Decide what stops"] },
            ];
  const headline: Record<Standing, string> = {
    itch: `${p.name || "You"}, four weeks from an itch to a first yes.`,
    idea: `${p.name || "You"}, four weeks from an idea to a first yes.`,
    building: `${p.name || "You"}, four weeks from building to paying users.`,
    running: `${p.name || "You"}, four weeks to numbers you can steer by.`,
  };
  return {
    headline: headline[p.standing],
    why: `At ${paceHours[p.pace]} this path fits without burning out. ${GOALS.find((g) => g.id === p.goal)?.line ?? ""}`,
    weeks,
    firstRoom: first,
    weeklyGoal: weekOne[p.standing],
    target90: first90[p.goal],
    source: "rehearsal",
  };
}

/** One plan from the model's reply, or null if the shape is wrong. */
export function asPlan(v: unknown): Omit<FounderPlan, "source"> | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const s = (x: unknown, max: number) => (typeof x === "string" && x.trim() ? x.trim().slice(0, max) : null);
  const headline = s(o.headline, 160), why = s(o.why, 400), weeklyGoal = s(o.weeklyGoal, 120), target90 = s(o.target90, 120);
  const rooms = ["idea", "validate", "setup", "customers", "money", "raise"];
  const firstRoom = rooms.includes(String(o.firstRoom)) ? (o.firstRoom as FounderPlan["firstRoom"]) : "idea";
  if (!headline || !why || !weeklyGoal || !target90 || !Array.isArray(o.weeks)) return null;
  const weeks: PlanWeek[] = o.weeks
    .slice(0, 4)
    .map((w, i) => {
      const x = (w ?? {}) as Record<string, unknown>;
      const focus = s(x.focus, 80) ?? `Week ${i + 1}`;
      const doList = Array.isArray(x.do) ? x.do.map((d) => s(d, 140)).filter((d): d is string => !!d).slice(0, 3) : [];
      return { n: i + 1, focus, do: doList };
    })
    .filter((w) => w.do.length);
  if (weeks.length < 3) return null;
  return { headline, why, weeks, firstRoom, weeklyGoal, target90 };
}

/** The line the coaches get about how this founder wants to be spoken to. */
export function toneLine(t: Tone | undefined): string {
  return t === "blunt" ? "The founder asked to be spoken to bluntly: no softening, say the hard thing first." : t === "gentle" ? "The founder asked for a gentle tone: encouraging, patient, the hard thing said kindly." : "The founder asked for a direct tone: plain, honest, no padding.";
}
