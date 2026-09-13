"use client";

/**
 * THREE QUESTIONS AT THE DOOR.
 *
 * What are you thinking of building, who would it help, where are you.
 * "I'm not sure yet" is a real answer to the first two and the fourth
 * answer to the third. The answers pick a starting mission and write the
 * founder's own sentence as the first line of their idea, labelled as the
 * guess it is. Then the suggestion is shown with the rest of the road
 * beside it, so they can start somewhere else if they know better.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { journey } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";
import Guide from "@/components/journey/Guide";

const STAGES: { value: journey.FounderStage; text: string; line: string }[] = [
  { value: "exploring", text: "Exploring", line: "I have an idea, or a few, and nothing built." },
  { value: "building", text: "Building", line: "I have started making something." },
  { value: "testing", text: "Already testing", line: "I have shown it to real people, or tried to." },
  { value: "unsure", text: "I'm not sure yet", line: "Which is a fine place to start." },
];

export default function Onboarding() {
  const { state, ready, dispatch, now } = useJourney();
  const router = useRouter();
  const [building, setBuilding] = useState("");
  const [helps, setHelps] = useState("");
  const [notSureB, setNotSureB] = useState(false);
  const [notSureH, setNotSureH] = useState(false);
  const [stage, setStage] = useState<journey.FounderStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState<string | null>(null);

  if (!ready) return <p className="j-loading">One moment…</p>;

  // Already through the door: show the suggestion again rather than the questions.
  const suggested = state.profile ? journey.missionById(state.profile.suggested) : null;
  const chosen = journey.missionById(pick ?? state.profile?.suggested ?? "say-it") ?? journey.MISSIONS[0];

  if (state.profile && suggested) {
    return (
      <div className="onb">
        <div className="onb-head">
          <div className="j-greet">
            <Guide />
            <p>Here is a good place to start. You can pick another.</p>
          </div>
          <h1>Your first mission</h1>
        </div>
        <div className="onb-suggest">
          <section className="next-card" aria-labelledby="sug-title">
            <span className="j-label">Suggested for you · mission {chosen.n} of 10</span>
            <h2 id="sug-title">{chosen.title}</h2>
            <p className="next-why">{chosen.why}</p>
            <div className="next-meta">
              <span className="meta-pill" data-kind="inside">About {chosen.minutes} min</span>
              {chosen.outside ? <span className="meta-pill" data-kind="outside">Then something outside the app</span> : null}
            </div>
            <button type="button" className="j-btn primary lg" onClick={() => router.push(`/journey/m/${chosen.id}`)}>
              Start here
            </button>
          </section>
          <div>
            <p className="j-label" style={{ marginBottom: 8 }}>Or start somewhere else</p>
            <div className="onb-others" role="list">
              {journey.MISSIONS.filter((m) => m.id !== chosen.id).map((m) => (
                <button key={m.id} type="button" className="onb-other" role="listitem" onClick={() => setPick(m.id)}>
                  <b>{m.n}</b>
                  {m.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const submit = () => {
    if (!stage) {
      setError("Pick the one that is closest. \"I'm not sure yet\" is allowed.");
      return;
    }
    dispatch({ type: "onboard", building: notSureB ? "" : building, helps: notSureH ? "" : helps, stage, at: now() });
    setError(null);
  };

  return (
    <form
      className="onb"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="onb-head">
        <div className="j-greet">
          <Guide />
          <p>Three questions, then your first mission. About a minute.</p>
        </div>
        <h1>Small steps toward a business worth building</h1>
        <p className="j-muted">Learn the essentials, talk to potential customers, and test your idea, one clear mission at a time.</p>
      </div>

      <div className="onb-q">
        <label htmlFor="onb-building">What are you thinking of building?</label>
        <textarea
          id="onb-building"
          className="j-textarea"
          value={building}
          disabled={notSureB}
          onChange={(e) => setBuilding(e.target.value)}
          placeholder="A rough sentence is fine. It will change."
          rows={2}
        />
        <label className="onb-sure">
          <input type="checkbox" checked={notSureB} onChange={(e) => setNotSureB(e.target.checked)} />
          I'm not sure yet
        </label>
      </div>

      <div className="onb-q">
        <label htmlFor="onb-helps">Who do you think it would help?</label>
        <input
          id="onb-helps"
          className="j-input"
          value={helps}
          disabled={notSureH}
          onChange={(e) => setHelps(e.target.value)}
          placeholder="A kind of person, as specific as you can"
        />
        <label className="onb-sure">
          <input type="checkbox" checked={notSureH} onChange={(e) => setNotSureH(e.target.checked)} />
          I'm not sure yet
        </label>
      </div>

      <fieldset className="onb-q" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="j-legend">Where are you now?</legend>
        <div className="j-choices">
          {STAGES.map((s) => (
            <label key={s.value} className="j-choice">
              <input type="radio" name="stage" value={s.value} checked={stage === s.value} onChange={() => setStage(s.value)} />
              <i aria-hidden />
              <span>
                <strong>{s.text}</strong>
                <br />
                <span className="j-small">{s.line}</span>
              </span>
            </label>
          ))}
        </div>
        {error ? (
          <p className="j-err" role="alert">
            {error}
          </p>
        ) : null}
      </fieldset>

      <div className="j-row">
        <button type="submit" className="j-btn primary lg">
          Show me where to start
        </button>
      </div>
      <p className="j-small">Nothing here is sent anywhere. It is kept on this device, and you can export or delete it at any time from Settings.</p>
    </form>
  );
}
