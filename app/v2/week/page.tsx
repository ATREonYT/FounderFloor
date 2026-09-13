import type { Metadata } from "next";
import Link from "next/link";
import PageHead from "@/components/studio/PageHead";
import Reveal from "@/components/studio/Reveal";

export const metadata: Metadata = {
  title: "Your week — FounderFloor",
  description: "Three tasks a week, a room to write in, and Friday reads the week back to you.",
};

/** Each of these is built and working in the app today. */
const WEEK = [
  { t: "Three tasks", l: "Not a backlog. Three, for this week, each one a page that says exactly what to do and where." },
  { t: "A room to write in", l: "After you talk to someone, you write down what they said. One question, one box, one button." },
  { t: "Friday, read back", l: "The week is judged on what happened in the world — money in, a yes, a price put to people — not on how busy you were." },
  { t: "Nothing is ever lost", l: "Every line you write is kept and shapes the next week. Remake your plan and the old one is put away whole, not deleted." },
  { t: "A week away costs nothing", l: "No streak to break, no number that falls because you were busy. The plan waits where you left it." },
  { t: "Your copy, to keep", l: "Take the whole thing out as a file and put it back on any phone. No account needed to own your own work." },
];

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="Your week"
        title="The hard part is not building it. It is Monday."
        line="Anyone can make something over a weekend. What people run out of is not ability, it is momentum — nothing tells them what to do next. Everything here exists for that."
        glyph="bolt"
      />
      <section className="band">
        <div className="wrap cols">
          {WEEK.map((w, i) => (
            <Reveal key={w.t} className={`card lift reveal d${(i % 3) + 1}`}>
              <h3>{w.t}</h3>
              <p>{w.l}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="band tint close">
        <div className="wrap close-in">
          <h2>See what you would be working on</h2>
          <Link className="btn primary" href="/v2">Draw my app</Link>
        </div>
      </section>
    </>
  );
}
