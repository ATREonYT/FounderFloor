/**
 * FounderFloor — quizzes, both the shipped ones and the ones people write.
 *
 * A quiz is plain data so a visitor's quiz and a built-in one are the same
 * thing to the player. Anything that comes from a person is bounded here in
 * `sanitizeQuiz` — lengths, counts, and an answer index that must point at
 * an option that exists — because a quiz written by somebody else is
 * untrusted input like any other.
 */

export type QuestionKind = "choice" | "truefalse";

export interface QuizQuestion {
  kind: QuestionKind;
  q: string;
  /** Two to four options. True/false questions always have exactly two. */
  options: string[];
  /** Index into options. */
  answer: number;
  /** Seconds on the clock, 5-30. */
  seconds: number;
  /** Shown after the answer; optional. */
  note?: string;
}

export interface Quiz {
  id: string;
  title: string;
  blurb: string;
  /** Display name of whoever wrote it; "FounderFloor" for the shipped set. */
  author: string;
  /** Built-in quizzes cannot be edited or deleted. */
  builtin?: boolean;
  questions: QuizQuestion[];
}

/** What it costs to publish a quiz of your own. */
export const QUIZ_COST = 120;
export const MAX_QUESTIONS = 12;
export const MIN_QUESTIONS = 3;
export const MAX_Q_LEN = 140;
export const MAX_OPT_LEN = 60;
export const MAX_TITLE = 48;
export const MAX_BLURB = 100;
/** How many of your own quizzes you can keep at once. */
export const MAX_OWN_QUIZZES = 12;

const clamp = (s: unknown, max: number): string =>
  typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, max) : "";

/**
 * Bring anything claiming to be a quiz back inside the rules, or return
 * null if it cannot be made valid. Used on load, on save, and on anything
 * that ever arrives from the network.
 */
export function sanitizeQuiz(raw: unknown): Quiz | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = clamp(r.title, MAX_TITLE);
  if (!title) return null;
  const qs = Array.isArray(r.questions) ? r.questions : [];
  const questions: QuizQuestion[] = [];
  for (const item of qs.slice(0, MAX_QUESTIONS)) {
    if (!item || typeof item !== "object") continue;
    const it = item as Record<string, unknown>;
    const kind: QuestionKind = it.kind === "truefalse" ? "truefalse" : "choice";
    const q = clamp(it.q, MAX_Q_LEN);
    if (!q) continue;
    let options =
      kind === "truefalse"
        ? ["True", "False"]
        : (Array.isArray(it.options) ? it.options : [])
            .map((o) => clamp(o, MAX_OPT_LEN))
            .filter(Boolean)
            .slice(0, 4);
    if (options.length < 2) continue;
    // de-duplicate: two identical options make the right answer ambiguous
    options = Array.from(new Set(options));
    if (options.length < 2) continue;
    const answer = Number(it.answer);
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) continue;
    const seconds = Math.max(5, Math.min(30, Math.round(Number(it.seconds) || 12)));
    const note = clamp(it.note, MAX_Q_LEN) || undefined;
    questions.push({ kind, q, options, answer, seconds, note });
  }
  if (questions.length < MIN_QUESTIONS) return null;
  return {
    id: clamp(r.id, 40) || `q_${Math.random().toString(36).slice(2, 10)}`,
    title,
    blurb: clamp(r.blurb, MAX_BLURB),
    author: clamp(r.author, 32) || "Anonymous",
    builtin: r.builtin === true,
    questions,
  };
}

/** An empty question, for the editor's "add" button. */
export function blankQuestion(kind: QuestionKind = "choice"): QuizQuestion {
  return {
    kind,
    q: "",
    options: kind === "truefalse" ? ["True", "False"] : ["", ""],
    answer: 0,
    seconds: 12,
  };
}

// ---------------------------------------------------------------- shipped

export const BUILTIN_QUIZZES: Quiz[] = [
  {
    id: "builtin-basics",
    title: "Business, the boring half",
    blurb: "The vocabulary nobody explains and everybody uses.",
    author: "FounderFloor",
    builtin: true,
    questions: [
      {
        kind: "choice",
        q: "A company is 'ramen profitable' when…",
        options: [
          "It has raised a seed round",
          "It covers the founders' living costs",
          "It has broken even on paper",
          "It has a thousand users",
        ],
        answer: 1,
        seconds: 12,
        note: "Enough revenue to keep the founders alive, so nobody can switch you off.",
      },
      {
        kind: "choice",
        q: "'Runway' is…",
        options: [
          "Months of cash left at current burn",
          "The launch checklist",
          "Total money raised",
          "Time until the next release",
        ],
        answer: 0,
        seconds: 12,
        note: "Cash in the bank divided by monthly burn.",
      },
      {
        kind: "truefalse",
        q: "Churn measures how many customers leave.",
        options: ["True", "False"],
        answer: 0,
        seconds: 8,
        note: "The number that decides whether growth compounds or just replaces.",
      },
      {
        kind: "choice",
        q: "Gross margin is revenue minus…",
        options: ["All costs", "The direct cost of delivering it", "Salaries", "Tax"],
        answer: 1,
        seconds: 12,
        note: "Hosting and support, not the office plants.",
      },
      {
        kind: "truefalse",
        q: "Bootstrapping means growing on revenue rather than investment.",
        options: ["True", "False"],
        answer: 0,
        seconds: 8,
        note: "Slower, and nobody can tell you to sell.",
      },
      {
        kind: "choice",
        q: "A cap table records…",
        options: ["Spending limits", "Who owns what", "Pricing tiers", "Server capacity"],
        answer: 1,
        seconds: 10,
        note: "Who owns which slice, and on what terms.",
      },
      {
        kind: "choice",
        q: "'Product-market fit' most nearly means…",
        options: [
          "The design matches the brand",
          "People would be upset if it vanished",
          "You have shipped every feature",
          "You are profitable",
        ],
        answer: 1,
        seconds: 12,
        note: "Sean Ellis's test: 40% would be very disappointed to lose it.",
      },
      {
        kind: "truefalse",
        q: "A SAFE gives an investor shares immediately.",
        options: ["True", "False"],
        answer: 1,
        seconds: 10,
        note: "Money now, shares later, argument deferred.",
      },
    ],
  },
  {
    id: "builtin-pricing",
    title: "Pricing, and how it goes wrong",
    blurb: "Six questions about the number at the top of the page.",
    author: "FounderFloor",
    builtin: true,
    questions: [
      {
        kind: "choice",
        q: "In SaaS, a 'seat' is…",
        options: ["A server instance", "One user licence", "A board position", "A support tier"],
        answer: 1,
        seconds: 10,
        note: "Per-seat pricing is why software companies care about org charts.",
      },
      {
        kind: "truefalse",
        q: "Raising prices always reduces total revenue.",
        options: ["True", "False"],
        answer: 1,
        seconds: 10,
        note: "Most early products are underpriced; the usual finding is that revenue goes up.",
      },
      {
        kind: "choice",
        q: "A 'freemium' plan's job is to…",
        options: [
          "Cover its own costs",
          "Get people using it before they decide",
          "Beat competitors on price",
          "Fill the support queue",
        ],
        answer: 1,
        seconds: 12,
        note: "It is a marketing budget wearing a plan's clothes.",
      },
      {
        kind: "choice",
        q: "'Annual contract value' is…",
        options: [
          "What a customer pays over a year",
          "The total of all contracts",
          "The cost of serving them",
          "The value of the company",
        ],
        answer: 0,
        seconds: 10,
      },
      {
        kind: "truefalse",
        q: "Grandfathering means letting existing customers keep their old price.",
        options: ["True", "False"],
        answer: 0,
        seconds: 8,
        note: "Cheap goodwill, expensive spreadsheet.",
      },
      {
        kind: "choice",
        q: "Usage-based pricing is hardest for a customer to…",
        options: ["Start", "Budget for", "Understand", "Cancel"],
        answer: 1,
        seconds: 12,
        note: "Finance departments dislike a bill they cannot predict.",
      },
    ],
  },
];
