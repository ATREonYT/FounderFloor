"use client";

/**
 * SETTINGS: WHERE IT LIVES, AND THE TWO DOORS OUT.
 *
 * Export writes everything as one file. Import reads one back, refusing
 * anything that is not one of ours. Delete asks twice — a click and then
 * the word — and then really deletes, with no "are you sure you want to
 * lose your progress" beyond that. The hall and the rest of the site are
 * linked from here and nowhere else in the journey.
 */
import { useRef, useState } from "react";
import Link from "next/link";
import { useJourney } from "@/components/journey/Store";

export default function Settings() {
  const { state, ready, exportFile, importText, wipe, memoryOnly } = useJourney();
  const file = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);
  const [arm, setArm] = useState(false);
  const [word, setWord] = useState("");

  if (!ready) return <p className="j-loading">One moment…</p>;

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    setNote(importText(text) ? "Imported. Your journey is what was in that file now." : "That file is not a FounderFloor journey, so nothing was changed.");
  };

  return (
    <div className="settings">
      <header className="idea-head">
        <span className="j-label">Settings</span>
        <h1>Your journey, and where it is kept</h1>
      </header>

      <section className="set-card" aria-labelledby="s-where">
        <h2 id="s-where">Where your work lives</h2>
        <p>
          {memoryOnly
            ? "This browser is not letting the page keep anything between visits, so your work is only in memory right now. Export it before you close the tab."
            : "On this device, in this browser. Nothing you write here is sent anywhere unless you press a coach button, and then only the lines you tick are sent, to get one answer. There is no account to keep."}
        </p>
        <p>
          {state.profile ? `Started ${new Date(state.profile.startedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}.` : "Not started yet."}
        </p>
      </section>

      <section className="set-card" aria-labelledby="s-export">
        <h2 id="s-export">Take a copy</h2>
        <p>One file with everything: your idea page, every mission, every change. Keep it anywhere. Put it back on any device with the button beside it.</p>
        <div className="j-row">
          <button type="button" className="j-btn quiet" onClick={exportFile}>Export as a file</button>
          <button type="button" className="j-btn ghost" onClick={() => file.current?.click()}>Import a file</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => void onFile(e.target.files?.[0])} aria-label="Import a journey file" />
        </div>
        {note ? <p role="status">{note}</p> : null}
      </section>

      <section className="set-card set-danger" aria-labelledby="s-delete">
        <h2 id="s-delete">Delete everything</h2>
        <p>Removes the journey from this device. It cannot be undone, so export first if you might want it back.</p>
        {!arm ? (
          <div className="j-row">
            <button type="button" className="j-btn quiet" onClick={() => setArm(true)}>Delete my journey…</button>
          </div>
        ) : (
          <div className="j-field">
            <label htmlFor="del-word">Type <b>delete</b> to confirm</label>
            <input id="del-word" className="j-input" value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" />
            <div className="j-row">
              <button type="button" className="j-btn primary" disabled={word.trim().toLowerCase() !== "delete"} onClick={() => { wipe(); setArm(false); setWord(""); setNote("Deleted. You can start again from the journey tab."); }}>Delete it</button>
              <button type="button" className="j-btn ghost" onClick={() => { setArm(false); setWord(""); }}>Keep it</button>
            </div>
          </div>
        )}
      </section>

      <section className="set-card" aria-labelledby="s-rest">
        <h2 id="s-rest">The rest of FounderFloor</h2>
        <p>The hall, the stands and the marketing pages are still there; they are just not in this journey's way.</p>
        <div className="j-row">
          <Link className="j-btn ghost" href="/v2">The front door</Link>
          <Link className="j-btn ghost" href="/floor/main-hall">The hall</Link>
        </div>
      </section>
    </div>
  );
}
