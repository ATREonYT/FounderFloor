"use client";

/**
 * Quest tracker: one glass panel that stays put — collapsed it's a slim
 * summary row (count + next quest), expanded the full list unfolds
 * underneath it with an animated reveal (no pill-to-panel jump cut).
 */

import { useState } from "react";
import type { QuestState } from "@/lib/data/quests";
import TicketIcon from "@/components/TicketIcon";

export default function QuestPanel({ quests }: { quests: QuestState[] }) {
  const [open, setOpen] = useState(false);
  const doneCount = quests.filter((q) => q.done).length;
  const next = quests.find((q) => !q.done);

  return (
    <section
      aria-label="Quests"
      className="glass pointer-events-auto w-[300px] max-w-[calc(100vw-24px)] shadow-float"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <span aria-hidden="true" className="text-accent">
          ⭑
        </span>
        <span className="micro text-muted">
          Quests {doneCount}/{quests.length}
        </span>
        {!open && next && (
          <span className="min-w-0 flex-1 truncate text-xs text-ink">
            {next.def.title} · {next.count}/{next.def.goal}
          </span>
        )}
        <span
          aria-hidden="true"
          className={`ml-auto text-xs text-muted transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>
      <div className={`reveal-rows ${open ? "open" : ""}`}>
        <div>
          <ul className="max-h-[46vh] overflow-y-auto border-t border-line/70">
            {quests.map((q) => (
              <li key={q.def.id} className="border-b border-line/60 px-3 py-2 last:border-b-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-sm ${q.done ? "text-muted line-through" : "text-ink"}`}>
                    {q.def.title}
                  </span>
                  <span className="micro shrink-0 text-muted">
                    {q.count}/{q.def.goal}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-snug text-muted">{q.def.blurb}</p>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className={`h-full ${q.done ? "bg-verify" : "bg-accent"}`}
                    style={{ width: `${Math.round((q.count / q.def.goal) * 100)}%` }}
                  />
                </div>
                <p className={`mt-1 flex flex-wrap items-baseline gap-x-1.5 text-xs ${q.done ? "text-verify" : "text-muted"}`}>
                  <span className="whitespace-nowrap text-gold-deep">
                    <TicketIcon /> {q.def.reward.tickets}
                  </span>
                  <span>
                    {q.done ? "✓ " : "+ "}
                    {q.def.rewardLabel}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
