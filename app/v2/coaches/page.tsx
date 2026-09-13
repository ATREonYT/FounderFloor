import type { Metadata } from "next";
import Link from "next/link";
import { COACHES, FREE_LIMITS, RECEPTIONIST } from "@founderfloor/shared";
import PageHead from "@/components/studio/PageHead";
import PixelPerson from "@/components/studio/PixelPerson";
import Reveal from "@/components/studio/Reveal";

export const metadata: Metadata = {
  title: "The coaches — FounderFloor",
  description:
    "Four people at your counter. Each one owns a single thing, and will not talk about the others.",
};

/**
 * THE FOUR AT THE COUNTER.
 *
 * The list is imported, not retyped. These four exist in the app with
 * these names, these colours, these faces and these first lines; a
 * visitor who meets Ines here and opens the app has to meet the same
 * Ines. A second copy of the cast would have drifted within a month, so
 * there is only one, in packages/shared.
 *
 * The faces are the app's real sprites, drawn as SVG at build time — not
 * illustrations of them.
 */
export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="The staff"
        title="Four people who know the company"
        line="Not one assistant that answers anything badly. Four, each with one job, who remember what you said last week and will ask you about it. They stand at your counter, so going to one of them is walking somewhere, not opening a chat box."
        glyph="star"
      />

      {/* the four of them, standing */}
      <section className="band">
        <div className="wrap">
          <Reveal className="counter reveal">
            <div className="counter-people">
              {COACHES.map((c, i) => (
                <span key={c.id} className={`counter-person p${i + 1}`}>
                  <PixelPerson look={c.look} scale={4} title={`${c.name}, ${c.title}`} />
                  <b style={{ color: c.color }}>{c.name}</b>
                  <span>{c.sign}</span>
                </span>
              ))}
            </div>
            <div className="counter-top" aria-hidden />
            <div className="counter-front" aria-hidden />
          </Reveal>
          <p className="counter-line">
            {COACHES.map((c) => c.name).join(", ")} — and {RECEPTIONIST.name.toLowerCase()}, who knows where
            everything is.
          </p>
        </div>
      </section>

      {/* one row each, with the first thing they say */}
      <section className="band tint">
        <div className="wrap">
          <div className="people">
            {COACHES.map((c, i) => (
              <Reveal key={c.id} className={`person reveal d${(i % 3) + 1}`}>
                <div className="person-face" style={{ background: `${c.color}1A` }}>
                  <PixelPerson look={c.look} scale={3} />
                </div>
                <div className="person-body">
                  <p className="label" style={{ color: c.color }}>
                    {c.sign}
                  </p>
                  <h3>
                    {c.name} <span>· {c.title}</span>
                  </h3>
                  <p>{c.blurb}</p>
                  <blockquote style={{ borderColor: c.color }}>“{c.greeting}”</blockquote>
                  <ul className="chips">
                    {c.topics.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* what it costs to talk to them */}
      <section className="band">
        <div className="wrap narrow">
          <Reveal className="band-head reveal">
            <p className="label">What Free gets</p>
            <h2>Ines is at the counter every day</h2>
            <p className="lede">
              On Free you get the desk and Ines, {FREE_LIMITS.coachTurnsPerDay} turns a day, and the building
              writes the answer from your own words and says so. Pro opens all four, they answer live, and
              they keep notes between visits. Nothing you have already written is ever hidden behind the
              price.
            </p>
          </Reveal>
          <div className="close-in" style={{ justifyContent: "flex-start" }}>
            <Link className="btn primary" href="/v2/pricing">
              What Pro costs
            </Link>
            <Link className="btn quiet" href="/v2/notebook">
              What they remember
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
