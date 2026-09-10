/**
 * The road: seven stops from a start-up dream to a start-up, in words a
 * child follows: say your idea, make your plan, ask five people, do this
 * week, see your app, build it, first paying customer. Every page of the app belongs to one stop, Today shows
 * the whole road with where you are, and the next stop is always the
 * thing to do now. The stops are in order but not a cage: a founder who
 * skips ahead sees the stop behind them still open.
 */
export type StopId = "idea" | "people" | "plan" | "week" | "app" | "build" | "customer";

export interface Stop {
  id: StopId;
  n: number;
  title: string;
  /** What to do, in one line a child follows. */
  child: string;
  /** Why it matters, in one line. */
  why: string;
  /** Where in the app it happens. */
  route: string;
  /** The button's words. */
  go: string;
}

export const ROAD: Stop[] = [
  { id: "idea", n: 1, title: "Say your idea", child: "Write one sentence: what you make, and who it is for.", why: "If you cannot say it, nobody can buy it.", route: "/stand", go: "Write the sign" },
  { id: "plan", n: 2, title: "Make your plan", child: "Answer eight questions. The desk writes your first four weeks.", why: "Three tasks a week beats a hundred ideas.", route: "/welcome", go: "Answer the questions" },
  { id: "people", n: 3, title: "Ask five people", child: "Find five people who might pay. Ask them. Write down what they say.", why: "Their words become your app, your price and your first sale.", route: "/office", go: "Write what they said" },
  { id: "week", n: 4, title: "Do this week", child: "Open a task, follow the steps, tick it. Three a week.", why: "Every task moves you one step closer to a customer.", route: "/today", go: "Open today's task" },
  { id: "app", n: 5, title: "See your app", child: "The studio draws your app from your words. Show it to the five people.", why: "A picture gets a yes or a no faster than a speech.", route: "/workshop", go: "Open the Workshop" },
  { id: "build", n: 6, title: "Build it", child: "Send the brief to Lovable or Claude Code. A first version in days, not months.", why: "The brief is the whole spec, in your words.", route: "/workshop", go: "Send the brief" },
  { id: "customer", n: 7, title: "First paying customer", child: "Someone pays real money. Log it on Friday. Now it is a start-up.", why: "One payment proves more than a thousand likes.", route: "/office", go: "Log the week" },
];

export interface RoadFacts {
  /** The sign is written. */
  sign: boolean;
  interviews: number;
  plan: boolean;
  tasksDone: number;
  /** The Workshop has drawn the founder's own product. */
  sawApp: boolean;
  /** The brief was sent to a builder. */
  handedOff: boolean;
  customers: number;
  /** Money in this month, from the stand. */
  mrr: number;
}

export type StopState = "done" | "now" | "next";

export interface RoadStop extends Stop {
  state: StopState;
  /** "3 of 5" and the like, where a stop is partly done. */
  progress?: string;
}

export interface Road {
  stops: RoadStop[];
  /** The stop to do now. */
  now: RoadStop;
  /** Stops done, of seven. */
  done: number;
}

/** Which stops are behind the founder, which is now, and how far along each is. */
export function roadState(f: RoadFacts): Road {
  const done: Record<StopId, boolean> = {
    idea: f.sign,
    people: f.interviews >= 5,
    plan: f.plan,
    week: f.tasksDone >= 3,
    app: f.sawApp,
    build: f.handedOff,
    customer: f.customers >= 1 || f.mrr > 0,
  };
  const progress: Partial<Record<StopId, string>> = {
    people: f.interviews > 0 && f.interviews < 5 ? `${f.interviews} of 5` : undefined,
    week: f.tasksDone > 0 && f.tasksDone < 3 ? `${f.tasksDone} of 3` : undefined,
  };
  const nowId = ROAD.find((s) => !done[s.id])?.id ?? "customer";
  const stops: RoadStop[] = ROAD.map((s) => ({ ...s, state: done[s.id] ? "done" : s.id === nowId ? "now" : "next", progress: progress[s.id] }));
  return { stops, now: stops.find((s) => s.id === nowId) ?? stops[stops.length - 1], done: stops.filter((s) => s.state === "done").length };
}

/** The stop a page belongs to, for the line under its title. */
export const stopOf = (id: StopId): Stop => ROAD.find((s) => s.id === id) ?? ROAD[0];
