"use client";

/**
 * The Quiz Room: pick a quiz, play it, or write one of your own.
 *
 * The player runs any quiz — shipped or written by a visitor — through the
 * same code, so there is no second-class path for the ones people make.
 * Writing one costs tickets, which is the only brake on the room filling
 * with three-question junk; the editor refuses to publish anything that
 * would not be playable.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MAX_OPT_LEN,
  MAX_Q_LEN,
  MAX_QUESTIONS,
  MAX_TITLE,
  MIN_QUESTIONS,
  QUIZ_COST,
  blankQuestion,
  sanitizeQuiz,
} from "@/lib/data/quiz";
import type { Quiz, QuizQuestion, QuestionKind } from "@/lib/data/quiz";
import TicketIcon from "@/components/TicketIcon";

// ------------------------------------------------------------------ play

function Play({
  quiz,
  capLeft,
  onDone,
  onQuit,
}: {
  quiz: Quiz;
  capLeft: number;
  onDone(score: number, right: number, tickets: number): void;
  onQuit(): void;
}) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(quiz.questions[0].seconds);

  const q = quiz.questions[i];
  const last = i + 1 >= quiz.questions.length;

  const answer = useCallback(
    (choice: number | null) => {
      if (picked !== null) return;
      setPicked(choice ?? -1);
      const correct = choice === q.answer;
      // 1000 for right, up to 1000 more for the time left — Kahoot's shape,
      // because it rewards knowing over working out and everybody has met it
      const gained = correct ? 1000 + Math.round(1000 * (left / q.seconds)) : 0;
      const nextScore = score + gained;
      const nextRight = right + (correct ? 1 : 0);
      setScore(nextScore);
      setRight(nextRight);
      setTimeout(() => {
        if (last) {
          const best = quiz.questions.length * 2000;
          const tickets = Math.max(0, Math.min(capLeft, Math.round((nextScore / best) * 25)));
          onDone(nextScore, nextRight, tickets);
        } else {
          setI(i + 1);
          setPicked(null);
          setLeft(quiz.questions[i + 1].seconds);
        }
      }, 1700);
    },
    [picked, q, left, score, right, last, i, quiz, capLeft, onDone],
  );

  useEffect(() => {
    if (picked !== null) return;
    if (left <= 0) {
      answer(null);
      return;
    }
    const t = setTimeout(() => setLeft((s) => Math.max(0, s - 0.1)), 100);
    return () => clearTimeout(t);
  }, [left, picked, answer]);

  // Kahoot's four shapes. Colour is the fast read; the shape is there for
  // anybody who cannot rely on the colour.
  const SHAPES = ["◆", "▲", "●", "■"];
  const COLORS = ["#C4562B", "#3B5B92", "#B08D2E", "#2F6F6A"];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="micro text-xs text-muted">
          {i + 1} / {quiz.questions.length}
        </span>
        <span className="font-mono text-sm">{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-100 ease-linear"
          style={{ width: `${(left / q.seconds) * 100}%` }}
        />
      </div>
      <p className="font-display text-xl leading-snug">{q.q}</p>
      <div className={`grid gap-2 ${q.options.length > 2 ? "sm:grid-cols-2" : ""}`}>
        {q.options.map((opt, n) => {
          const done = picked !== null;
          const isAnswer = n === q.answer;
          const chosen = picked === n;
          return (
            <button
              key={`${opt}-${n}`}
              type="button"
              disabled={done}
              onClick={() => answer(n)}
              className={`flex items-center gap-3 rounded-md px-4 py-3 text-left text-sm text-paper transition-all ${
                done && !isAnswer ? "opacity-35" : ""
              } ${chosen && !isAnswer ? "ring-2 ring-ink" : ""} ${
                done && isAnswer ? "ring-2 ring-ink" : ""
              }`}
              style={{ background: COLORS[n % COLORS.length] }}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {SHAPES[n % SHAPES.length]}
              </span>
              <span className="min-w-0 flex-1">{opt}</span>
              {done && isAnswer && <span className="micro text-xs">CORRECT</span>}
            </button>
          );
        })}
      </div>
      {picked !== null && q.note && (
        <p className="rounded-md border border-line bg-paper px-3 py-2 text-xs leading-relaxed text-muted">
          {q.note}
        </p>
      )}
      <button
        type="button"
        onClick={onQuit}
        className="self-start rounded-md border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:bg-paper hover:text-ink"
      >
        Give up
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- editor

function Editor({
  balance,
  authorName,
  onPublish,
  onCancel,
}: {
  balance: number;
  authorName: string;
  onPublish(q: Quiz): void;
  onCancel(): void;
}) {
  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");
  const [qs, setQs] = useState<QuizQuestion[]>([blankQuestion()]);
  const [err, setErr] = useState("");

  const patch = (i: number, next: Partial<QuizQuestion>): void =>
    setQs((list) => list.map((q, n) => (n === i ? { ...q, ...next } : q)));

  const setKind = (i: number, kind: QuestionKind): void =>
    patch(i, {
      kind,
      options: kind === "truefalse" ? ["True", "False"] : ["", ""],
      answer: 0,
    });

  const setOption = (i: number, n: number, v: string): void =>
    setQs((list) =>
      list.map((q, k) =>
        k === i ? { ...q, options: q.options.map((o, m) => (m === n ? v : o)) } : q,
      ),
    );

  const publish = (): void => {
    const draft = sanitizeQuiz({ title, blurb, author: authorName, questions: qs });
    if (!draft) {
      setErr(
        `Needs a title and at least ${MIN_QUESTIONS} finished questions — each with a question, two filled options, and a right answer chosen.`,
      );
      return;
    }
    if (balance < QUIZ_COST) {
      setErr(`Publishing costs ${QUIZ_COST} tickets and you have ${balance}.`);
      return;
    }
    onPublish(draft);
  };

  const ready = qs.filter((q) => q.q.trim() && q.options.filter((o) => o.trim()).length >= 2).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line bg-paper px-4 py-3">
        <p className="text-sm leading-relaxed text-muted">
          Write a quiz and it goes in the room for everyone. {MIN_QUESTIONS}–
          {MAX_QUESTIONS} questions, multiple choice or true/false.
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm">
          <TicketIcon size={14} />
          <span>
            {QUIZ_COST} to publish · you have {balance}
          </span>
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="micro text-xs text-muted">TITLE</span>
        <input
          value={title}
          maxLength={MAX_TITLE}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What is this quiz about?"
          className="rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="micro text-xs text-muted">ONE LINE ABOUT IT</span>
        <input
          value={blurb}
          maxLength={100}
          onChange={(e) => setBlurb(e.target.value)}
          placeholder="Optional"
          className="rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </label>

      {qs.map((q, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg border border-line p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="micro text-xs text-muted">QUESTION {i + 1}</span>
            <div className="flex items-center gap-2">
              <select
                value={q.kind}
                onChange={(e) => setKind(i, e.target.value as QuestionKind)}
                className="rounded border border-line bg-paper px-2 py-1 text-xs"
              >
                <option value="choice">Multiple choice</option>
                <option value="truefalse">True / false</option>
              </select>
              <select
                value={q.seconds}
                onChange={(e) => patch(i, { seconds: Number(e.target.value) })}
                className="rounded border border-line bg-paper px-2 py-1 text-xs"
              >
                {[5, 8, 10, 12, 15, 20, 30].map((s) => (
                  <option key={s} value={s}>
                    {s}s
                  </option>
                ))}
              </select>
              {qs.length > 1 && (
                <button
                  type="button"
                  onClick={() => setQs((l) => l.filter((_, n) => n !== i))}
                  aria-label={`Remove question ${i + 1}`}
                  className="rounded border border-line px-2 py-1 text-xs text-muted hover:text-accent"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <textarea
            value={q.q}
            maxLength={MAX_Q_LEN}
            rows={2}
            onChange={(e) => patch(i, { q: e.target.value })}
            placeholder="Ask something"
            className="w-full resize-none rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <p className="micro text-xs text-muted">
            TAP THE CIRCLE TO MARK THE RIGHT ANSWER
          </p>
          {q.options.map((opt, n) => (
            <div key={n} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => patch(i, { answer: n })}
                aria-label={`Mark option ${n + 1} correct`}
                className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors ${
                  q.answer === n ? "border-verify bg-verify" : "border-line"
                }`}
              />
              <input
                value={opt}
                maxLength={MAX_OPT_LEN}
                readOnly={q.kind === "truefalse"}
                onChange={(e) => setOption(i, n, e.target.value)}
                placeholder={`Option ${n + 1}`}
                className="min-w-0 flex-1 rounded-md border border-line bg-paper px-3 py-1.5 text-sm outline-none focus:border-accent read-only:text-muted"
              />
              {q.kind === "choice" && q.options.length > 2 && (
                <button
                  type="button"
                  onClick={() =>
                    setQs((l) =>
                      l.map((x, k) =>
                        k === i
                          ? {
                              ...x,
                              options: x.options.filter((_, m) => m !== n),
                              answer: x.answer >= n && x.answer > 0 ? x.answer - 1 : x.answer,
                            }
                          : x,
                      ),
                    )
                  }
                  aria-label={`Remove option ${n + 1}`}
                  className="shrink-0 px-1 text-xs text-muted hover:text-accent"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {q.kind === "choice" && q.options.length < 4 && (
            <button
              type="button"
              onClick={() => patch(i, { options: [...q.options, ""] })}
              className="self-start text-xs text-accent hover:underline"
            >
              + another option
            </button>
          )}
          <input
            value={q.note ?? ""}
            maxLength={MAX_Q_LEN}
            onChange={(e) => patch(i, { note: e.target.value })}
            placeholder="Explain the answer (optional)"
            className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs outline-none focus:border-accent"
          />
        </div>
      ))}

      {qs.length < MAX_QUESTIONS && (
        <button
          type="button"
          onClick={() => setQs((l) => [...l, blankQuestion()])}
          className="rounded-md border border-dashed border-line px-4 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-ink"
        >
          + Add a question ({qs.length} of {MAX_QUESTIONS})
        </button>
      )}

      {err && (
        <p className="rounded-md border border-accent bg-paper px-3 py-2 text-xs leading-relaxed text-accent">
          {err}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={publish}
          disabled={ready < MIN_QUESTIONS || !title.trim()}
          className="flex-1 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent-strong disabled:opacity-40"
        >
          Publish for {QUIZ_COST}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-line px-4 py-2.5 text-sm transition-colors hover:bg-paper"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ room

export interface QuizRoomProps {
  quizzes: Quiz[];
  balance: number;
  capLeft: number;
  authorName: string;
  onPublish(q: Quiz): void;
  onDelete(id: string): void;
  onPayout(tickets: number): void;
  onExit(): void;
}

export default function QuizRoom({
  quizzes,
  balance,
  capLeft,
  authorName,
  onPublish,
  onDelete,
  onPayout,
  onExit,
}: QuizRoomProps) {
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [playing, setPlaying] = useState<Quiz | null>(null);
  const [result, setResult] = useState<{ score: number; right: number; tickets: number } | null>(
    null,
  );

  const sorted = useMemo(
    () => [...quizzes].sort((a, b) => Number(b.builtin ?? false) - Number(a.builtin ?? false)),
    [quizzes],
  );

  if (playing) {
    return (
      <Play
        quiz={playing}
        capLeft={capLeft}
        onQuit={() => setPlaying(null)}
        onDone={(score, right, tickets) => {
          setResult({ score, right, tickets });
          setPlaying(null);
          onPayout(tickets);
        }}
      />
    );
  }

  if (result) {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center">
          <p className="micro text-xs text-muted">FINAL SCORE</p>
          <p className="font-display text-5xl leading-none">{result.score}</p>
          <p className="mt-1 text-sm text-muted">{result.right} right</p>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3">
          <span className="text-sm text-muted">Won</span>
          <span className="flex items-center gap-2 font-display text-2xl">
            <TicketIcon size={18} />
            {result.tickets}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="rounded-md border border-line px-4 py-2.5 text-sm transition-colors hover:bg-paper"
        >
          Back to the quizzes
        </button>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <Editor
        balance={balance}
        authorName={authorName}
        onCancel={() => setMode("list")}
        onPublish={(q) => {
          onPublish(q);
          setMode("list");
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted">
        Answer fast for more points, the way you would expect. Anyone can add
        one — writing a quiz costs {QUIZ_COST} tickets, which is the only thing
        keeping this room from filling up with three-question rubbish.
      </p>
      <ul className="flex flex-col gap-2">
        {sorted.map((q) => (
          <li key={q.id} className="rounded-lg border border-line">
            <button
              type="button"
              onClick={() => setPlaying(q)}
              className="w-full px-4 py-3 text-left transition-colors hover:bg-paper"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-display text-lg leading-tight">{q.title}</span>
                <span className="micro shrink-0 text-xs text-muted">
                  {q.questions.length} Qs
                </span>
              </span>
              {q.blurb && (
                <span className="mt-0.5 block text-xs leading-snug text-muted">{q.blurb}</span>
              )}
              <span className="mt-1 block text-xs text-muted">
                by {q.author}
                {q.builtin ? "" : " · written here"}
              </span>
            </button>
            {!q.builtin && (
              <div className="border-t border-line px-4 py-1.5">
                <button
                  type="button"
                  onClick={() => onDelete(q.id)}
                  className="text-xs text-muted transition-colors hover:text-accent"
                >
                  Delete this quiz
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setMode("edit")}
        className="rounded-md bg-accent px-4 py-3 font-medium text-paper transition-colors hover:bg-accent-strong"
      >
        Write a quiz
      </button>
      <button
        type="button"
        onClick={onExit}
        className="rounded-md border border-line px-4 py-2.5 text-sm transition-colors hover:bg-paper"
      >
        Back to the arcade
      </button>
    </div>
  );
}
