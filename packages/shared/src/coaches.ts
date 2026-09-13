/**
 * THE PEOPLE IN THE BUILDING.
 *
 * Two sets, and they are not the same thing. KEEPERS are the hall's own
 * staff — they belong to the floor and answer about it. COACHES are the
 * four who stand at YOUR counter: each owns one thing, will not talk
 * about the others, and remembers what you said last week (on Pro; on
 * Free the building answers from its own rules and says so).
 *
 * This lives in shared rather than in the app because the website
 * introduces these four by name. A visitor who meets Ines on the website
 * and then opens the app has to meet the same Ines — same name, same
 * colour, same face, same first line — or the two are obviously
 * different products. Copying the list would have drifted within a
 * month; reading one list cannot.
 *
 * `look` is the avatar's three indices into the sprite palettes (skin,
 * outfit, hair). It is deliberately the plain shape rather than the UI
 * package's `Look`, because this file has to stay free of any platform
 * so the web can draw these faces too.
 */

export interface CoachLook {
  skin: number;
  outfit: number;
  hair: number;
}

export interface Coach {
  id: string;
  name: string;
  /** What is written above them, in the hall's sign case. */
  sign: string;
  title: string;
  blurb: string;
  /** Their awning colour, and the accent of anything they say. */
  color: string;
  look: CoachLook;
  topics: string[];
  /** The first thing they say, before you have said anything. */
  greeting: string;
}

/** The keepers of the Main Hall (the website's lib/data/floors.ts). */
export const KEEPERS: Coach[] = [
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
/**
 * The four coaches from the brief — the staff at YOUR stand, not the hall's.
 * Names and looks are new; colours are the hall's own awning colours.
 */
export const COACHES: Coach[] = [
  {
    id: "strategy",
    name: "Ines",
    sign: "STRATEGY",
    title: "Strategy & accountability",
    blurb: "Owns the weekly goal, the 90-day target and the streak. Monday plan, Friday review, and the question nobody else asks: did it slip from fear, or because it did not matter?",
    color: "#4F6E6B",
    look: { skin: 1, outfit: 4, hair: 2 },
    topics: ["Monday plan", "Friday review", "90-day target"],
    greeting: "Ines. Three goals for the week, each with a number in it. Start with the one you least want to say.",
  },
  {
    id: "sales",
    name: "Jonah",
    sign: "SALES",
    title: "Sales",
    blurb: "Keeps the weekly outreach quota and counts what actually went out. Drafts in your voice, under sixty words, one question. Plays the prospect until you say stop.",
    color: "#B4762E",
    look: { skin: 3, outfit: 2, hair: 5 },
    topics: ["quota", "drafts", "objections"],
    greeting: "Jonah. Quota this week is ten. Zero have gone out. Who is the first one, and what do they lose by not replying?",
  },
  {
    id: "investor",
    name: "Margot",
    sign: "INVESTOR",
    title: "Investor",
    blurb: "A sceptical European pre-seed investor. Scores a three-minute pitch on problem, why now, traction, market with a number, and the ask. Keeps the history. Does not round up.",
    color: "#7A6070",
    look: { skin: 0, outfit: 6, hair: 3 },
    topics: ["pitch score", "the ask", "what kills it"],
    greeting: "Margot. Give me the pitch as you would say it in three minutes. I will score it in five parts and tell you which one I stopped listening at.",
  },
  {
    id: "finance",
    name: "Theo",
    sign: "FINANCE",
    title: "Finance & compliance",
    blurb: "Runway as one line of arithmetic. Salary scenarios the same way. The filing calendar for your entity and residence, each date with its official source.",
    color: "#5E7C93",
    look: { skin: 4, outfit: 1, hair: 0 },
    topics: ["runway", "salary", "filings"],
    greeting: "Theo. I will always show the arithmetic. What do you want to know: the runway, the salary, or what has to be filed next?",
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
