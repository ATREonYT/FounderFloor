import type { Metadata } from "next";
import Link from "next/link";
import { LOG_LIMIT, MEMORY_KINDS, type MemoryKind } from "@founderfloor/shared";
import PageHead from "@/components/studio/PageHead";
import Reveal from "@/components/studio/Reveal";

export const metadata: Metadata = {
  title: "The notebook — FounderFloor",
  description:
    "Everything you do in the building is written down as you do it, kept whole, and only read by the staff when you say so.",
};

/**
 * THE NOTEBOOK.
 *
 * The kinds are imported from the app so this page cannot describe a
 * notebook the app does not keep. The sample page underneath is written
 * here, because a real founder's entries are theirs — what is shown is
 * the SHAPE of an evening, in the same seven kinds.
 */
const SAMPLE: { kind: MemoryKind; at: string; text: string }[] = [
  { kind: "did", at: "Mon 18:40", text: "Wrote the problem in one sentence with no product in it." },
  { kind: "note", at: "Mon 18:52", text: "Said it to Dana. She repeated it back as “you help bakers stop guessing”, which is closer than what I wrote." },
  { kind: "desk", at: "Mon 18:53", text: "Then use her sentence. She is the one who has to repeat it, not you." },
  { kind: "work", at: "Tue 20:10", text: "Ten names: Dana, Kostas, the two at the Saturday market, Mum's neighbour…" },
  { kind: "outcome", at: "Wed 21:02", text: "Three of the five said they already keep a list on paper. Nobody asked what the app looked like." },
  { kind: "decision", at: "Thu 19:30", text: "Charging per month, not per order. Per order punishes the good weeks." },
  { kind: "logged", at: "Fri 17:58", text: "Week 3 — €0 in, 5 conversations, 11 hours. First price said out loud." },
];

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="The notebook"
        title="It writes down what you did, so you do not have to remember"
        line="A step ticked, how a task went, a note you typed, a line the desk gave you, a week logged. It happens as you work, which is the only time anybody actually records anything."
        glyph="chip"
      />

      {/* the seven things it writes */}
      <section className="band">
        <div className="wrap">
          <Reveal className="band-head reveal">
            <p className="label">Seven kinds of line</p>
            <h2>Nothing here was typed twice</h2>
            <p className="lede">
              Every line is a by-product of doing the work. There is no journal to keep up with and no
              weekly form to fill in — the notebook is what is left behind after an evening in the
              building.
            </p>
          </Reveal>
          <div className="kinds">
            {(Object.keys(MEMORY_KINDS) as MemoryKind[]).map((k, i) => (
              <Reveal key={k} className={`kind reveal d${(i % 3) + 1}`}>
                <b>{MEMORY_KINDS[k].label}</b>
                <span>{MEMORY_KINDS[k].line}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* a page of it */}
      <section className="band tint">
        <div className="wrap cols-wide">
          <Reveal className="reveal">
            <p className="label">A week in it</p>
            <h2>This is what the staff read before they answer</h2>
            <p className="lede">
              Which is why the desk can say “you talked to three café owners on Tuesday — what did the
              third one say about price?” instead of starting from nothing every time.
            </p>
            <p>
              A prompt carries the last {LOG_LIMIT.entries} entries at most. That is a reading limit, not a
              storage one: the notebook keeps every entry and every word of it, forever.
            </p>
          </Reveal>
          <Reveal className="reveal d1">
            <div className="book">
              <div className="book-head">
                <span className="label">Your notebook</span>
                <span className="label">week 3</span>
              </div>
              {SAMPLE.map((e) => (
                <div key={e.at} className="book-line" data-kind={e.kind}>
                  <span className="book-when">{e.at}</span>
                  <span className="book-kind">{MEMORY_KINDS[e.kind].label}</span>
                  <span className="book-text">{e.text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* the rules, which are the point */}
      <section className="band">
        <div className="wrap">
          <Reveal className="band-head reveal">
            <p className="label">Four rules, and they do not bend</p>
            <h2>It is your notebook, not our data</h2>
          </Reveal>
          <div className="rules">
            {[
              { t: "Nothing written is lost", l: "There is no cap that quietly drops the oldest entry and no truncation that cuts a long note in half. Both existed once; both were found and removed." },
              { t: "It lives on your device", l: "Not in an account you have to keep. You can read every line, take the whole thing out as a file, and put it back on another phone." },
              { t: "It only reaches the model when you say yes", l: "The staff read it to answer you. That is the only time it leaves the notebook, and you are the one who opened the door." },
              { t: "You can burn it", l: "One button, everything gone, no support ticket and no “are you sure you want to lose your progress”." },
            ].map((r, i) => (
              <Reveal key={r.t} className={`rule reveal d${(i % 3) + 1}`}>
                <b>{r.t}</b>
                <p>{r.l}</p>
              </Reveal>
            ))}
          </div>
          <div className="close-in" style={{ justifyContent: "flex-start", marginTop: 28 }}>
            <Link className="btn primary" href="/v2">
              Draw my app
            </Link>
            <Link className="btn quiet" href="/v2/coaches">
              Who reads it
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
