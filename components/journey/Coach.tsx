"use client";

/**
 * THE COACH, UNDER A FIELD.
 *
 * A row of small actions that fit the field the founder is writing, and
 * a panel with what came back: a note, sometimes a suggested rewrite the
 * founder can take, edit or leave, sometimes sorted lines, and a plain
 * line for what the coach was not sure about. The founder chooses what
 * the coach may see with the checkboxes; nothing else about them is
 * sent.
 *
 * When the coach is away — no key on the server, a slow reply, a reply
 * that failed the parser — it says so in one sentence and gets out of the
 * way. The field works exactly the same without it.
 */
import { useState } from "react";
import { journey } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";

type Reply = journey.CoachReply;
type Phase = { kind: "idle" } | { kind: "busy"; action: journey.CoachAction } | { kind: "reply"; action: journey.CoachAction; reply: Reply } | { kind: "away"; why: string };

const SHARE: { key: "idea" | "customerGroup" | "problem"; label: string }[] = [
  { key: "idea", label: "my idea" },
  { key: "customerGroup", label: "my customer group" },
  { key: "problem", label: "the problem" },
];

export default function Coach({ missionId, fieldKey, text, onAccept }: { missionId: string; fieldKey: journey.OutputKey; text: string; onAccept: (suggestion: string) => void }) {
  const { state } = useJourney();
  const actions = journey.actionsFor(fieldKey);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [share, setShare] = useState<Record<string, boolean>>({ idea: true, customerGroup: false, problem: false });

  const available = SHARE.filter((s) => {
    const v = state.outputs[s.key]?.value;
    return typeof v === "string" && v.trim() && s.key !== fieldKey;
  });

  const ask = async (action: journey.CoachAction) => {
    setPhase({ kind: "busy", action });
    const shared: Record<string, string> = {};
    for (const s of available) if (share[s.key]) shared[s.key] = String(state.outputs[s.key]?.value ?? "");
    try {
      const res = await fetch("/api/journey/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ missionId, action, key: fieldKey, text, shared }),
      });
      const body = (await res.json()) as { ok: boolean; reply?: Reply; reason?: string };
      if (!res.ok || !body.ok || !body.reply) {
        setPhase({ kind: "away", why: body.reason === "unusable" ? "The coach answered in a way that could not be used, so it was thrown away. Try once more, or carry on without it." : "The coach is away right now. Everything here works without it." });
        return;
      }
      setPhase({ kind: "reply", action, reply: body.reply });
    } catch {
      setPhase({ kind: "away", why: "Could not reach the coach. Everything here works without it." });
    }
  };

  const busy = phase.kind === "busy";
  return (
    <div className="coach">
      <div className="coach-row" role="group" aria-label="Ask the coach">
        {actions.map((a) => (
          <button key={a} type="button" className="coach-btn" disabled={busy} onClick={() => void ask(a)} aria-busy={busy && phase.action === a}>
            {busy && phase.action === a ? "Thinking…" : journey.COACH_ACTIONS[a].label}
          </button>
        ))}
      </div>
      {available.length ? (
        <div className="coach-share">
          <span>Let the coach see:</span>
          {available.map((s) => (
            <label key={s.key}>
              <input type="checkbox" checked={Boolean(share[s.key])} onChange={(e) => setShare({ ...share, [s.key]: e.target.checked })} />
              {s.label}
            </label>
          ))}
        </div>
      ) : null}

      {phase.kind === "away" ? (
        <p className="coach-away" role="status">
          {phase.why}
        </p>
      ) : null}

      {phase.kind === "reply" ? (
        <div className="coach-panel" role="region" aria-label="What the coach said">
          <span className="j-label">The coach</span>
          <p className="coach-note">{phase.reply.note}</p>
          {phase.reply.suggestion ? (
            <>
              <p className="coach-suggest">{phase.reply.suggestion}</p>
              <div className="j-row">
                <button type="button" className="j-btn quiet" onClick={() => { onAccept(phase.reply.suggestion!); setPhase({ kind: "idle" }); }}>
                  Use this
                </button>
                <button type="button" className="j-btn ghost" onClick={() => { onAccept(text.trim() ? `${text.trim()}\n\n${phase.reply.suggestion}` : phase.reply.suggestion!); setPhase({ kind: "idle" }); }}>
                  Add it below mine to edit
                </button>
                <button type="button" className="j-btn ghost" onClick={() => setPhase({ kind: "idle" })}>
                  Leave it
                </button>
              </div>
            </>
          ) : null}
          {phase.reply.items?.length ? (
            <ul className="coach-items">
              {phase.reply.items.map((it, n) => (
                <li key={n}>
                  {it.tag ? <span className="tag" data-tag={it.tag}>{it.tag}</span> : null}
                  <span>{it.text}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {phase.reply.uncertain ? <p className="coach-uncertain">Not sure about: {phase.reply.uncertain}</p> : null}
          {phase.reply.ask ? <p className="coach-ask">{phase.reply.ask}</p> : null}
          {!phase.reply.suggestion ? (
            <div className="j-row">
              <button type="button" className="j-btn ghost" onClick={() => setPhase({ kind: "idle" })}>
                Close
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
