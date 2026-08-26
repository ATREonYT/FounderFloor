"use client";

/**
 * The Arcade: a run of three games, one score, tickets at the end.
 *
 * WHY THE GAMES ARE SCORED, NOT SYNCED. A real-time head-to-head needs a
 * server room, tick reconciliation and a story for what happens when
 * somebody's train goes into a tunnel — and it is unplayable alone, which
 * is what this hall mostly is right now. So all three games are played
 * solo against the clock, and the comparison happens on the score: your
 * run total is set against the hall's standing record. When two people are
 * in the hall they can start a run at the same time and compare totals,
 * which is the same game with better company.
 *
 * The run is always three games in a fixed order — reaction, then trivia,
 * then memory — because a mixed run rewards being good at more than one
 * thing, and a single game rewards owning a gaming mouse.
 *
 * Payout is capped per day (see ARCADE_DAILY_CAP) so the arcade is a
 * reason to come back rather than a ticket printer.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TicketIcon from "@/components/TicketIcon";

// ---------------------------------------------------------------- shared

export const ARCADE_DAILY_CAP = 60;

type Stage = "lobby" | "reaction" | "trivia" | "memory" | "results";

interface RoundScore {
  game: string;
  points: number;
  detail: string;
}

/** 0..1 -> 0..max, rounded, never negative. */
const scale = (k: number, max: number): number =>
  Math.max(0, Math.round(Math.min(1, Math.max(0, k)) * max));

const MAX_PER_GAME = 100;

function Meter({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
        style={{ width: `${scale(value / max, 100)}%` }}
      />
    </div>
  );
}

// -------------------------------------------------------------- game one
// REACTION — "Doors Open". Five rounds. The shutter goes up at a random
// moment; hit the key. Going early costs you the round, which is the whole
// tension: the punishment for guessing is what makes waiting hard.

const REACTION_ROUNDS = 5;

function ReactionGame({ onDone }: { onDone: (r: RoundScore) => void }) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"ready" | "waiting" | "go" | "early" | "hit">("ready");
  const [times, setTimes] = useState<number[]>([]);
  const [last, setLast] = useState<number | null>(null);
  const goAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = (): void => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);

  const arm = useCallback(() => {
    setPhase("waiting");
    clear();
    // 1.2s to 4.0s. Anything shorter and a mash wins; longer and it is dull.
    timer.current = setTimeout(
      () => {
        goAt.current = performance.now();
        setPhase("go");
      },
      1200 + Math.random() * 2800,
    );
  }, []);

  const finishRound = useCallback(
    (ms: number | null) => {
      // A false start scores as the worst possible round rather than
      // nothing, so one twitchy finger does not end the run.
      const recorded = ms ?? 900;
      const next = [...times, recorded];
      setTimes(next);
      setLast(ms);
      setPhase(ms === null ? "early" : "hit");
      clear();
      if (next.length >= REACTION_ROUNDS) {
        const avg = next.reduce((a, b) => a + b, 0) / next.length;
        // 180ms is an excellent human average; 900ms is a nap.
        const points = scale((900 - avg) / (900 - 180), MAX_PER_GAME);
        setTimeout(
          () => onDone({ game: "Doors Open", points, detail: `${Math.round(avg)}ms average` }),
          900,
        );
      } else {
        setTimeout(() => {
          setRound((r) => r + 1);
          arm();
        }, 900);
      }
    },
    [times, onDone, arm],
  );

  const hit = useCallback(() => {
    if (phase === "ready") {
      arm();
      return;
    }
    if (phase === "waiting") {
      finishRound(null);
      return;
    }
    if (phase === "go") {
      finishRound(Math.round(performance.now() - goAt.current));
    }
  }, [phase, arm, finishRound]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        hit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hit]);

  const face = {
    ready: { bg: "var(--muted)", line: "Hit the shutter when it opens." },
    waiting: { bg: "#8C3B2B", line: "Wait for it…" },
    go: { bg: "var(--verify)", line: "NOW" },
    early: { bg: "#8C3B2B", line: "Too early — that one's a write-off." },
    hit: { bg: "var(--verify)", line: last !== null ? `${last}ms` : "" },
  }[phase];

  return (
    <div className="flex flex-col gap-4">
      <Header
        name="Doors Open"
        rule="Five rounds. Hit the shutter the moment it lifts — not a beat before."
        step={`Round ${Math.min(round + 1, REACTION_ROUNDS)} of ${REACTION_ROUNDS}`}
      />
      <button
        type="button"
        onClick={hit}
        className="flex h-44 w-full select-none flex-col items-center justify-center rounded-lg border-2 border-ink/10 text-center transition-colors duration-100"
        style={{ background: face.bg }}
      >
        <span className="font-display text-3xl text-paper">{face.line}</span>
        <span className="micro mt-2 text-[10px] text-paper/70">
          {phase === "ready" ? "TAP OR PRESS SPACE TO START" : "TAP OR PRESS SPACE"}
        </span>
      </button>
      <div className="flex gap-1.5">
        {Array.from({ length: REACTION_ROUNDS }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{ background: i < times.length ? "var(--verify)" : "var(--line)" }}
          />
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------- game two
// TRIVIA — "The Quiz". Eight questions about the unglamorous half of
// running something. Timed, and the clock is worth points, so knowing it
// beats working it out.

interface Question {
  q: string;
  options: string[];
  answer: number;
  note: string;
}

const QUESTIONS: Question[] = [
  {
    q: "A company is 'ramen profitable' when…",
    options: [
      "It has raised a seed round",
      "It covers the founders' living costs",
      "It has broken even on paper",
      "It has a thousand users",
    ],
    answer: 1,
    note: "Paul Graham's term: enough revenue to keep the founders alive, so nobody can switch you off.",
  },
  {
    q: "Churn measures…",
    options: [
      "How fast you spend money",
      "How many customers leave",
      "How often you ship",
      "How many people see your site",
    ],
    answer: 1,
    note: "The one number that quietly decides whether growth compounds or just replaces.",
  },
  {
    q: "'Runway' is…",
    options: [
      "Months of cash left at current burn",
      "The launch checklist",
      "Total money raised",
      "Time until the next release",
    ],
    answer: 0,
    note: "Cash in the bank divided by monthly burn. The only number a board asks twice.",
  },
  {
    q: "A cap table records…",
    options: ["Spending limits", "Who owns what", "Pricing tiers", "Server capacity"],
    answer: 1,
    note: "Who owns which slice, and on what terms. It is furniture nobody enjoys moving.",
  },
  {
    q: "MRR stands for…",
    options: [
      "Minimum revenue requirement",
      "Monthly recurring revenue",
      "Median revenue rate",
      "Marginal return on revenue",
    ],
    answer: 1,
    note: "The bit of revenue that shows up again next month without being sold again.",
  },
  {
    q: "A 'design partner' is…",
    options: [
      "An agency you hire",
      "An early customer who shapes the product",
      "A co-founder who does the UI",
      "A component library",
    ],
    answer: 1,
    note: "They get the thing early and cheap; you get to find out what is actually wrong with it.",
  },
  {
    q: "In SaaS, a 'seat' is…",
    options: ["A server instance", "One user licence", "A board position", "A support tier"],
    answer: 1,
    note: "Per-seat pricing is why software companies care so much about org charts.",
  },
  {
    q: "Bootstrapping means…",
    options: [
      "Growing on revenue, not investment",
      "Building the first version yourself",
      "Copying a competitor",
      "Launching before you are ready",
    ],
    answer: 0,
    note: "Slower, and nobody can tell you to sell.",
  },
  {
    q: "'Product-market fit' most nearly means…",
    options: [
      "The design matches the brand",
      "People would be upset if it vanished",
      "You have shipped every feature",
      "You are profitable",
    ],
    answer: 1,
    note: "Sean Ellis's test: 40% of users saying they would be very disappointed to lose it.",
  },
  {
    q: "A 'SAFE' is…",
    options: [
      "An insurance product",
      "An agreement for future equity",
      "A security audit",
      "A savings account for payroll",
    ],
    answer: 1,
    note: "Money now, shares later, argument deferred.",
  },
  {
    q: "Gross margin is revenue minus…",
    options: [
      "All costs",
      "The direct cost of delivering it",
      "Salaries",
      "Tax",
    ],
    answer: 1,
    note: "Hosting and support, not the office plants. It is why software and restaurants are different businesses.",
  },
  {
    q: "A 'pivot' properly means…",
    options: [
      "Quitting",
      "Changing direction while keeping what you learned",
      "Raising a bigger round",
      "Rebranding",
    ],
    answer: 1,
    note: "One foot stays planted. If both feet move it is just a new company.",
  },
];

const TRIVIA_COUNT = 8;
const TRIVIA_SECONDS = 12;

function TriviaGame({ onDone }: { onDone: (r: RoundScore) => void }) {
  const set = useMemo(() => {
    const pool = [...QUESTIONS];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, TRIVIA_COUNT);
  }, []);

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const [earned, setEarned] = useState(0);
  const [left, setLeft] = useState(TRIVIA_SECONDS);

  const q = set[i];

  const advance = useCallback(
    (choice: number | null) => {
      if (picked !== null) return;
      setPicked(choice ?? -1);
      const correct = choice === q.answer;
      if (correct) {
        setRight((r) => r + 1);
        // half the points for being right, half for being quick
        setEarned((e) => e + 0.5 + 0.5 * (left / TRIVIA_SECONDS));
      }
      setTimeout(() => {
        if (i + 1 >= set.length) {
          const points = scale(
            (correct ? earned + 0.5 + 0.5 * (left / TRIVIA_SECONDS) : earned) / set.length,
            MAX_PER_GAME,
          );
          onDone({
            game: "The Quiz",
            points,
            detail: `${correct ? right + 1 : right} of ${set.length} right`,
          });
        } else {
          setI((n) => n + 1);
          setPicked(null);
          setLeft(TRIVIA_SECONDS);
        }
      }, 1600);
    },
    [picked, q, left, i, set.length, earned, right, onDone],
  );

  useEffect(() => {
    if (picked !== null) return;
    if (left <= 0) {
      advance(null);
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 0.1), 100);
    return () => clearTimeout(t);
  }, [left, picked, advance]);

  return (
    <div className="flex flex-col gap-4">
      <Header
        name="The Quiz"
        rule="Eight questions. Right answers score; quick right answers score more."
        step={`Question ${i + 1} of ${set.length}`}
      />
      <Meter value={left} max={TRIVIA_SECONDS} />
      <p className="font-display text-xl leading-snug">{q.q}</p>
      <div className="flex flex-col gap-2">
        {q.options.map((opt, n) => {
          const isAnswer = n === q.answer;
          const chosen = picked === n;
          const done = picked !== null;
          return (
            <button
              key={opt}
              type="button"
              disabled={done}
              onClick={() => advance(n)}
              className={`rounded-md border px-4 py-2.5 text-left text-sm transition-colors ${
                done && isAnswer
                  ? "border-verify bg-verify/10"
                  : chosen
                    ? "border-accent bg-accent/10"
                    : "border-line hover:bg-paper"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p className="rounded-md border border-line bg-paper px-3 py-2 text-xs leading-relaxed text-muted">
          {q.note}
        </p>
      )}
    </div>
  );
}

// ------------------------------------------------------------ game three
// MEMORY — "The Floor Plan". Eight pairs of stand signs. Fewer turns is
// better; the clock is a tiebreak, not the point.

const PAIR_FACES = ["◆", "▲", "●", "■", "★", "✚", "◗", "⬟"];
const PAIR_COLORS = [
  "#C4562B", "#4E6E4E", "#3B5B92", "#A98C5B",
  "#6B4E71", "#2F6F6A", "#8C3B2B", "#7A611F",
];
const PAIRS = 8;
const PERFECT_TURNS = PAIRS; // you cannot beat one turn per pair

function MemoryGame({ onDone }: { onDone: (r: RoundScore) => void }) {
  const deck = useMemo(() => {
    const cards = [...Array(PAIRS).keys()].flatMap((k) => [k, k]);
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }, []);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [turns, setTurns] = useState(0);
  const lock = useRef(false);

  const flip = (idx: number): void => {
    if (lock.current) return;
    if (flipped.includes(idx) || matched.includes(deck[idx])) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length < 2) return;

    setTurns((t) => t + 1);
    lock.current = true;
    const [a, b] = next;
    const hit = deck[a] === deck[b];
    setTimeout(
      () => {
        if (hit) {
          const done = [...matched, deck[a]];
          setMatched(done);
          if (done.length >= PAIRS) {
            const used = turns + 1;
            // 8 turns is flawless; 26 is guessing.
            const points = scale((26 - used) / (26 - PERFECT_TURNS), MAX_PER_GAME);
            setTimeout(
              () => onDone({ game: "The Floor Plan", points, detail: `${used} turns` }),
              600,
            );
          }
        }
        setFlipped([]);
        lock.current = false;
      },
      hit ? 380 : 780,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Header
        name="The Floor Plan"
        rule="Eight pairs of signs, face down. Fewer turns is a better score."
        step={`${matched.length} of ${PAIRS} pairs · ${turns} turns`}
      />
      <div className="grid grid-cols-4 gap-2">
        {deck.map((face, idx) => {
          const open = flipped.includes(idx) || matched.includes(face);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => flip(idx)}
              aria-label={open ? `Sign ${face + 1}` : "Face down"}
              className="relative aspect-[3/4] rounded-md border border-line transition-transform duration-150 ease-out active:scale-95"
              style={{
                background: open ? PAIR_COLORS[face] : "#3A3830",
                opacity: matched.includes(face) ? 0.45 : 1,
              }}
            >
              <span className="flex h-full w-full items-center justify-center text-2xl text-paper">
                {open ? PAIR_FACES[face] : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ shell

function Header({ name, rule, step }: { name: string; rule: string; step: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg leading-tight">{name}</h3>
        <span className="micro shrink-0 text-[10px] text-muted">{step}</span>
      </div>
      <p className="mt-1 text-xs leading-snug text-muted">{rule}</p>
    </div>
  );
}

export interface ArcadeProps {
  /** Tickets already won here today, so the cap can be honest about it. */
  wonToday: number;
  /** The best run total this hall has seen, or null if nobody has played. */
  hallRecord: number | null;
  /** Called with the tickets earned; the caller does the granting. */
  onPayout(tickets: number, total: number): void;
  /** Back to the arcade's room list. */
  onExit(): void;
}

export default function Arcade({ wonToday, hallRecord, onPayout, onExit }: ArcadeProps) {
  const [stage, setStage] = useState<Stage>("lobby");
  const [rounds, setRounds] = useState<RoundScore[]>([]);
  const paid = useRef(false);

  const total = rounds.reduce((a, r) => a + r.points, 0);
  const capLeft = Math.max(0, ARCADE_DAILY_CAP - wonToday);

  const finish = useCallback(
    (r: RoundScore) => {
      const next = [...rounds, r];
      setRounds(next);
      setStage(next.length === 1 ? "trivia" : next.length === 2 ? "memory" : "results");
    },
    [rounds],
  );

  // Pay out once, when the results screen first appears.
  useEffect(() => {
    if (stage !== "results" || paid.current) return;
    paid.current = true;
    // A perfect run is 300. One ticket per 6 points, capped by what is
    // left of today's allowance.
    const earned = Math.min(capLeft, Math.round(total / 6));
    onPayout(earned, total);
  }, [stage, total, capLeft, onPayout]);

  if (stage === "lobby") {
    return (
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={onExit}
          className="self-start text-xs text-muted transition-colors hover:text-ink"
        >
          ← Back to the arcade
        </button>
        <p className="micro text-[10px] text-muted">THE QUICK RUN</p>
        <p className="text-sm leading-relaxed text-muted">
          Three short games back to back, one score at the end. Reactions, then
          questions, then memory — so a run rewards being decent at all three
          rather than excellent at one.
        </p>
        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
          {[
            ["Doors Open", "Five shutters. Hit each one the moment it lifts."],
            ["The Quiz", "Eight questions on the unglamorous half of the job."],
            ["The Floor Plan", "Eight pairs of signs, face down."],
          ].map(([n, d]) => (
            <li key={n} className="px-4 py-2.5">
              <p className="text-sm">{n}</p>
              <p className="text-xs leading-snug text-muted">{d}</p>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border border-line bg-paper px-4 py-3 text-xs text-muted">
          <span>
            Hall record:{" "}
            <span className="text-ink">{hallRecord === null ? "unset" : `${hallRecord}/300`}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <TicketIcon size={12} />
            {capLeft} left to win today
          </span>
        </div>
        <button
          type="button"
          onClick={() => setStage("reaction")}
          className="rounded-md bg-accent px-4 py-3 font-medium text-paper transition-colors hover:bg-accent-strong"
        >
          Start a run
        </button>
        <p className="text-xs leading-relaxed text-muted">
          Playing at the same time as somebody else? Start together and compare
          totals at the end — same three games, same order.
        </p>
      </div>
    );
  }

  if (stage === "reaction") return <ReactionGame onDone={finish} />;
  if (stage === "trivia") return <TriviaGame onDone={finish} />;
  if (stage === "memory") return <MemoryGame onDone={finish} />;

  const earned = Math.min(capLeft, Math.round(total / 6));
  const beat = hallRecord !== null && total > hallRecord;
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="micro text-[10px] text-muted">RUN TOTAL</p>
        <p className="font-display text-5xl leading-none">{total}</p>
        <p className="mt-1 text-xs text-muted">out of 300</p>
      </div>
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
        {rounds.map((r) => (
          <li key={r.game} className="flex items-center gap-3 px-4 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-sm">{r.game}</span>
              <span className="block text-xs text-muted">{r.detail}</span>
            </span>
            <span className="w-24 shrink-0">
              <Meter value={r.points} max={MAX_PER_GAME} />
            </span>
            <span className="w-10 shrink-0 text-right font-mono text-sm">{r.points}</span>
          </li>
        ))}
      </ul>
      {beat && (
        <p className="rounded-lg border border-gold bg-paper px-4 py-3 text-sm">
          That is a new hall record.
        </p>
      )}
      <div className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3">
        <span className="text-sm text-muted">Won</span>
        <span className="flex items-center gap-2 font-display text-2xl">
          <TicketIcon size={18} />
          {earned}
        </span>
      </div>
      {earned === 0 && capLeft === 0 && (
        <p className="text-xs leading-relaxed text-muted">
          You have taken today's {ARCADE_DAILY_CAP} out of the arcade. Play for
          the score; the tickets come back tomorrow.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            paid.current = false;
            setRounds([]);
            setStage("lobby");
          }}
          className="flex-1 rounded-md border border-line px-4 py-2.5 text-sm transition-colors hover:bg-paper"
        >
          Play again
        </button>
        <button
          type="button"
          onClick={onExit}
          className="flex-1 rounded-md border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:bg-paper hover:text-ink"
        >
          Back to the arcade
        </button>
      </div>
    </div>
  );
}
