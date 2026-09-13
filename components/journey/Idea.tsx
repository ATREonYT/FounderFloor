"use client";

/**
 * MY IDEA: WHAT THE FOUNDER BELIEVES, AND WHAT THEY HAVE FOUND.
 *
 * One editable summary, section by section, built from the lines the
 * missions saved. Every line carries its label — assumption, reported by
 * you, what a customer did — as a word next to a colour, and the label
 * comes from the mission that wrote the line, never from how convincing
 * the text sounds.
 *
 * Missing lines are shown as missing, with the mission that would write
 * them. That is the point of the page: a founder should be able to see
 * at a glance that they have a problem statement and no conversation
 * notes, rather than a summary that quietly reads as complete.
 */
import { useState } from "react";
import Link from "next/link";
import { journey } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";

const LABEL: Record<journey.EvidenceLabel, string> = { assumption: "Assumption", reported: "You reported this", confirmed: "What a customer did" };

function whenOf(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function missionFor(key: journey.OutputKey): journey.Mission | undefined {
  return journey.MISSIONS.find((m) => m.output.some((o) => o.key === key));
}

function Line({ k }: { k: journey.OutputKey }) {
  const { state, dispatch, now } = useJourney();
  const f = journey.fieldFor(k)!;
  const saved = state.outputs[k];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const m = missionFor(k);

  const startEdit = () => {
    setDraft(Array.isArray(saved?.value) ? saved!.value.join("\n") : String(saved?.value ?? ""));
    setEditing(true);
  };
  const commit = () => {
    const value = f.kind === "list" ? draft.split("\n").map((x) => x.trim()).filter(Boolean) : draft.trim();
    dispatch({ type: "edit-line", key: k, value, at: now() });
    setEditing(false);
  };

  const shown = (() => {
    if (!saved) return null;
    if (f.kind === "choice") return f.options?.find((o) => o.value === saved.value)?.text ?? String(saved.value);
    if (Array.isArray(saved.value)) return saved.value.length ? <ul>{saved.value.map((v, n) => <li key={n}>{v}</li>)}</ul> : null;
    return saved.value || null;
  })();

  return (
    <div className="idea-line">
      <div className="idea-line-head">
        <b>{f.label}</b>
        <span className="ev" data-ev={saved?.label ?? f.evidence}>{LABEL[saved?.label ?? f.evidence]}</span>
        {saved ? <span className="idea-when">{whenOf(saved.at)}</span> : null}
        {saved && f.kind !== "choice" && !editing ? (
          <button type="button" className="j-btn ghost" onClick={startEdit} aria-label={`Edit ${f.label}`}>Edit</button>
        ) : null}
      </div>
      {editing ? (
        <div className="j-field">
          <textarea className="j-textarea" value={draft} onChange={(e) => setDraft(e.target.value)} rows={f.kind === "list" ? 4 : 3} aria-label={f.label} />
          <div className="j-row">
            <button type="button" className="j-btn quiet" onClick={commit}>Save</button>
            <button type="button" className="j-btn ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : shown ? (
        <div className="idea-val">{shown}</div>
      ) : (
        <p className="idea-empty">
          Not written yet.{" "}
          {m ? <Link href={`/journey/m/${m.id}`}>Mission {m.n} writes this.</Link> : null}
        </p>
      )}
    </div>
  );
}

export default function Idea() {
  const { state, ready } = useJourney();
  if (!ready) return <p className="j-loading">Opening your idea…</p>;

  const written = Object.keys(state.outputs).length;
  const recent = [...state.history].reverse().slice(0, 20);

  return (
    <div className="idea">
      <header className="idea-head">
        <span className="j-label">My idea</span>
        <h1>{typeof state.outputs.idea?.value === "string" && state.outputs.idea.value ? state.outputs.idea.value : "Your idea, as it stands"}</h1>
        <p className="j-muted">
          {written === 0
            ? "Nothing written yet. Each mission adds a line here; the first one takes about four minutes."
            : "Everything below was written by you, in the missions. Each line says what kind of thing it is."}
        </p>
        <div className="idea-key" aria-label="What the labels mean">
          <span className="ev" data-ev="assumption">Assumption</span>
          <span className="ev" data-ev="reported">You reported this</span>
          <span className="ev" data-ev="confirmed">What a customer did</span>
        </div>
        <p className="j-small">Reported lines are what you wrote down; nobody has checked them. Only what a customer actually did is ever marked as confirmed.</p>
      </header>

      {journey.IDEA_SECTIONS.map((sec) => (
        <section key={sec.id} className="idea-sec" aria-labelledby={`sec-${sec.id}`}>
          <h2 id={`sec-${sec.id}`}>{sec.title}</h2>
          {sec.keys.map((k) => <Line key={k} k={k} />)}
        </section>
      ))}

      <section className="idea-sec" aria-labelledby="sec-hist">
        <h2 id="sec-hist">What changed</h2>
        {recent.length ? (
          <ul className="idea-hist">
            {recent.map((c, n) => (
              <li key={n}>
                <span className="when">{whenOf(c.at)}</span>
                <span>
                  {c.what}
                  {c.from ? <span className="from"> · was “{c.from}”</span> : null}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="idea-empty">Nothing yet.</p>
        )}
      </section>

      <p className="j-small">
        This page is kept on this device. <Link href="/journey/settings">Export or delete it in Settings.</Link> Keep the people you talk to anonymous: a first name or a description is enough.
      </p>
    </div>
  );
}
