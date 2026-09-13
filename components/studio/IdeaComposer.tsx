"use client";

/**
 * TYPE ONE SENTENCE, SEE YOUR APP.
 *
 * This is the whole argument for the site. Every builder tool asks for an
 * account, a plan and some credits before a visitor sees a single pixel of
 * their own product; most people do not get that far. Here the first thing
 * that happens is their thing appearing on a phone, and it happens in
 * about a second, because the studio draws it on the server with no model
 * call behind it.
 *
 * What matters in the interaction:
 *
 *   Nothing is asked for first. No email, no name for the product, no
 *   sign-up. The name is taken from their own sentence and they can
 *   change it later, when they care.
 *
 *   The example ideas are there because a blank box is a wall. Pressing
 *   one draws immediately, so a visitor who does not want to type still
 *   sees the thing work.
 *
 *   The waiting state says what is being done, in order, because it is
 *   genuinely doing those things. A spinner would be a lie about a real
 *   sequence.
 *
 *   The screens are tappable inside the frame — the document arrives
 *   already wired — and the tabs underneath are for people who do not
 *   realise that.
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface Screen {
  id: string;
  title: string;
}

interface Drawn {
  html: string;
  screens: Screen[];
  name: string;
  reading: string;
  unit: string;
}

/** Ideas that read as somebody's real evening plan, not as a product demo. */
const SEEDS = [
  "Order tomorrow's bread tonight, for neighbours in my town",
  "Book a trusted plumber in ten minutes, for homeowners",
  "Rent a quiet room by the hour, for freelancers",
  "Ten-minute maths games for kids aged 6 to 9",
  "Weekly numbers for one-person shops",
];

/** What the studio is actually doing while the visitor waits. */
const STEPS = ["Reading what you wrote", "Choosing the look", "Drawing your screens"];

export default function IdeaComposer() {
  const [idea, setIdea] = useState("");
  const [drawn, setDrawn] = useState<Drawn | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState(0);
  const [seed, setSeed] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const alive = useRef(true);

  useEffect(() => () => { alive.current = false; }, []);

  // The steps advance on their own so the wait reads as progress. They are
  // the real stages; if the answer lands first the sequence simply stops.
  useEffect(() => {
    if (!busy) return;
    setStep(0);
    const t = [setTimeout(() => setStep(1), 260), setTimeout(() => setStep(2), 620)];
    return () => t.forEach(clearTimeout);
  }, [busy]);

  // The drawn document posts its screen index out when a tap moves it, so
  // the tabs below stay honest about what is showing.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { mock?: number } | null;
      if (d && typeof d.mock === "number") setScreen(d.mock);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const draw = useCallback(
    async (text: string, nextSeed = 0) => {
      const line = text.trim();
      if (line.length < 8) {
        setError("Say the idea in a sentence — what it does, and who for.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/mockup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idea: line, seed: nextSeed }),
        });
        const body = (await res.json()) as Drawn & { error?: string };
        if (!alive.current) return;
        if (!res.ok || body.error) {
          setError(body.error ?? "Something went wrong. Try again.");
          return;
        }
        setDrawn(body);
        setScreen(0);
      } catch {
        if (alive.current) setError("Could not reach the studio. Check your connection and try again.");
      } finally {
        if (alive.current) setBusy(false);
      }
    },
    [],
  );

  /** Move the drawn document to a screen without redrawing it. */
  const goTo = (i: number) => {
    setScreen(i);
    frame.current?.contentWindow?.postMessage({ go: i }, "*");
  };

  const again = () => {
    const next = seed + 1;
    setSeed(next);
    void draw(idea, next);
  };

  return (
    <>
      <section className="hero">
        <div className="glow" aria-hidden />
        <div className="grid-bg" aria-hidden />

        <p className="label rise">Say it in one line. No account.</p>

        <h1 className="rise rise-2">
          See your start-up
          <br />
          before you build it
        </h1>

        <p className="lede rise rise-3">
          Type the idea you have been thinking about. In a second you get the real screens of it, on a
          phone, made from your own words — then a four-week plan to get a person to pay for it.
        </p>

        <div className="rise rise-4" style={{ width: "min(720px, 100%)" }}>
          <div className="composer">
            <label className="sr-only" htmlFor="idea">
              Your idea, in one sentence
            </label>
            <textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Order tomorrow's bread tonight, for neighbours in my town"
              spellCheck={false}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void draw(idea, 0);
              }}
            />
            <div className="composer-foot">
              {busy ? (
                <span className="thinking" aria-live="polite">
                  <i aria-hidden />
                  {STEPS[step]}
                </span>
              ) : (
                <span className="label" style={{ letterSpacing: "0.02em", textTransform: "none" }}>
                  What it does, and who for.
                </span>
              )}
              <button
                type="button"
                className="btn primary"
                style={{ marginLeft: "auto" }}
                onClick={() => void draw(idea, 0)}
                disabled={busy || idea.trim().length < 8}
              >
                {drawn ? "Draw it again" : "Draw my app"}
              </button>
            </div>
          </div>
          {error ? <p className="err" style={{ marginTop: 12 }}>{error}</p> : null}
        </div>

        {!drawn ? (
          <div className="seeds rise rise-4">
            {SEEDS.map((s) => (
              <button
                key={s}
                type="button"
                className="seed"
                onClick={() => {
                  setIdea(s);
                  void draw(s, 0);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="wrap stage">
        <div className="phone-col">
          <div className="phone-well">
          <div className="phone">
            {drawn ? (
              <iframe
                ref={frame}
                title={`${drawn.name}, drawn from your idea`}
                srcDoc={drawn.html}
                sandbox="allow-scripts"
                className="pop"
                key={drawn.html.slice(0, 64)}
              />
            ) : (
              <div className="phone-empty">
                <span className="label">Your app</span>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>
                  Type an idea above, or press one of the examples, and it appears here.
                </p>
              </div>
            )}
          </div>
          </div>

          {drawn ? (
            <div className="screens">
              {drawn.screens.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className="screen-tab"
                  aria-current={i === screen}
                  onClick={() => goTo(i)}
                >
                  {s.title}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="stage-side">
          {drawn ? (
            <>
              <p className="label">Drawn for you</p>
              <h2>{drawn.name}</h2>
              <p className="lede" style={{ fontSize: 16 }}>
                {drawn.reading}
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" className="btn quiet sm" onClick={again} disabled={busy}>
                  Show me a different look
                </button>
              </div>
              <div className="card">
                <h3>It is tappable. Try it.</h3>
                <p>
                  Press the buttons inside the phone — the screens are wired to each other, the same as
                  they are in the app. Nothing here was a picture.
                </p>
              </div>
              <div className="card">
                <h3>Next: the four weeks</h3>
                <p>
                  Drawing it is the easy half. The app gives you three tasks a week, each one a page that
                  says exactly what to do, and reads your week back to you on Friday — so the thing you
                  just saw ends up in front of someone who pays for it.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="label">Why this is free and instant</p>
              <h2>No sign-up, no credits, no waiting</h2>
              <p className="lede" style={{ fontSize: 16 }}>
                Your screens are drawn here, in one request, by the same engine that runs inside the
                FounderFloor app. There is no model queue behind it and it costs us nothing to show you,
                so there is nothing to sign up for before you see whether you like it.
              </p>
              <div className="card">
                <h3>Then the part that is actually hard</h3>
                <p>
                  Anyone can make something over a weekend. What people run out of is not ability, it is
                  momentum — nothing tells them what to do on Monday. That is the part FounderFloor is
                  built for.
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
