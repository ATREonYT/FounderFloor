/**
 * THE PAGE.
 *
 * Built in the order a stranger needs it: see your own product first,
 * then what happens after, then the honest state of the part that is not
 * open yet.
 *
 * The seven stops are read from `ROAD` in packages/shared — the same
 * array the phone app's Today tab walks down. Nobody has to remember to
 * update the website when a stop changes its words, and the site cannot
 * quietly start describing a product the app does not have.
 */
import { ROAD } from "@founderfloor/shared";
import IdeaComposer from "@/components/studio/IdeaComposer";
import Nav from "@/components/studio/Nav";
import Reveal from "@/components/studio/Reveal";

/** What a week in the app actually contains. Each of these is built and working. */
const WEEK = [
  { title: "Three tasks", line: "Not a backlog. Three, for this week, each one a page that says exactly what to do and where." },
  { title: "A room to write in", line: "After you talk to someone, you write down what they said. One question, one box, one button." },
  { title: "Friday, read back", line: "The week is judged on what happened in the world — money in, a yes, a price put to people — not on how busy you were." },
  { title: "Nothing is ever lost", line: "Every line you write is kept and shapes the next week. Remake your plan and the old one is put away whole, not deleted." },
  { title: "A week away costs nothing", line: "No streak to break, no number that falls because you were busy. The plan waits where you left it." },
  { title: "Your copy, to keep", line: "Take the whole thing out as a file and put it back on any phone. No account needed to own your own work." },
];

export default function Page() {
  return (
    <>
      <Nav />
      <main id="top">
        <IdeaComposer />

        {/* ── the road ─────────────────────────────────────────────── */}
        <section className="band tint" id="road">
          <div className="wrap">
            <Reveal className="band-head reveal">
              <p className="label">The road</p>
              <h2>Seven stops, and you always know which one you are on</h2>
              <p className="lede">
                Drawing your app is stop five. The app is the whole walk — and at every point there is one
                thing to do next, in words a child could follow.
              </p>
            </Reveal>

            <Reveal className="road">
              {ROAD.map((stop) => (
                <div className="stop" key={stop.id}>
                  <div className="stop-n">{stop.n}</div>
                  <div>
                    <h3>{stop.title}</h3>
                    <p>{stop.child}</p>
                    <p className="why">{stop.why}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── the week ─────────────────────────────────────────────── */}
        <section className="band" id="week">
          <div className="wrap">
            <Reveal className="band-head reveal">
              <p className="label">Your week</p>
              <h2>The hard part is not building it. It is Monday.</h2>
              <p className="lede">
                Anyone can make something over a weekend. What people run out of is not ability, it is
                momentum — nothing tells them what to do next. Everything below exists for that.
              </p>
            </Reveal>

            <div className="cols">
              {WEEK.map((w, i) => (
                <Reveal key={w.title} className={`card lift reveal d${(i % 3) + 1}`}>
                  <h3>{w.title}</h3>
                  <p>{w.line}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── the hand-off ─────────────────────────────────────────── */}
        <section className="band tint" id="handoff">
          <div className="wrap">
            <Reveal className="band-head reveal">
              <p className="label">Stop six</p>
              <h2>When you want it real, it goes to a builder whole</h2>
              <p className="lede">
                The screens you just drew are not a picture to be thrown away. The app writes one prompt for
                Lovable, Bolt, Base44 or Claude Code that carries the design itself — the exact colours as
                theme tokens, the type, the corners, the screens in order with your words — so what comes
                back is the app you were looking at, not a different one with the same copy.
              </p>
            </Reveal>
            <div className="cols">
              {[
                { t: "The design goes first", l: "The prompt opens with your palette already converted to the tokens those tools write, before a single screen." },
                { t: "Your words, unchanged", l: "It says plainly: use these words as written, do not improve them, do not make them sound like marketing." },
                { t: "Or build it yourself", l: "The same brief comes out as a CLAUDE.md with a stack and a first prompt, if you write code." },
              ].map((c, i) => (
                <Reveal key={c.t} className={`card lift reveal d${(i % 3) + 1}`}>
                  <h3>{c.t}</h3>
                  <p>{c.l}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── the floor, said honestly ─────────────────────────────── */}
        <section className="band" id="floor">
          <div className="wrap">
            <Reveal className="band-head reveal">
              <span className="tag soon">
                <i />
                Not open yet
              </span>
              <h2>Then a floor to put it on</h2>
              <p className="lede">
                A permanent trade-show floor: your product gets a stand, and you walk around everybody
                else&apos;s. It is built, and it stays shut until there are enough founders on it to be worth
                walking around — an empty hall helps nobody.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── the close ────────────────────────────────────────────── */}
        <section className="band tint">
          <div className="wrap" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <Reveal className="reveal">
              <h2>Start at the top of this page</h2>
            </Reveal>
            <Reveal className="reveal d1">
              <p className="lede" style={{ margin: "0 auto" }}>
                Type your idea, see it drawn, and decide from there. It costs nothing and asks for nothing.
              </p>
            </Reveal>
            <Reveal className="reveal d2">
              <a className="btn primary" href="#top">
                Draw my app
              </a>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-in">
          <div style={{ maxWidth: 340, display: "flex", flexDirection: "column", gap: 10 }}>
            <span className="brand">
              <span className="mark">FF</span>
              FounderFloor
            </span>
            <p className="small">
              From an idea to a start-up with a paying customer. Built by one person, shipped weekly.
            </p>
          </div>
          <div>
            <p className="label" style={{ marginBottom: 8 }}>The app</p>
            <a href="#road">The road</a>
            <a href="#week">Your week</a>
            <a href="#handoff">Take it to a builder</a>
          </div>
          <div>
            <p className="label" style={{ marginBottom: 8 }}>The fine print</p>
            <a href="/about">About</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
        </div>
      </footer>
    </>
  );
}
