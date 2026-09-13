import type { Metadata } from "next";
import Link from "next/link";
import { localMockup, prepareDesign, studioDesign } from "@founderfloor/shared";
import PageHead from "@/components/studio/PageHead";
import Reveal from "@/components/studio/Reveal";

export const metadata: Metadata = {
  title: "The workshop — FounderFloor",
  description:
    "Your idea, drawn as real tappable screens, with a design chosen for what you actually make.",
};

/**
 * THE WORKSHOP, SHOWING ITS WORK.
 *
 * Three real apps, drawn on this request by the same engine the phone
 * runs, and dropped into three phones. Not screenshots: the documents are
 * generated when the page is rendered, so if the studio gets better or
 * worse this page says so immediately, and if it breaks this page breaks.
 * That is the point — a marketing page for a generator should be made by
 * the generator.
 *
 * It runs on the server with no model call and no key behind it, which is
 * why three of them cost nothing.
 */
const SAMPLES: { idea: string; name: string; audience: string; seed: number }[] = [
  { idea: "Order tomorrow's bread tonight, for neighbours in my town", name: "Bread", audience: "neighbours", seed: 0 },
  { idea: "Book a trusted plumber in ten minutes, for homeowners", name: "Trusted", audience: "homeowners", seed: 3 },
  { idea: "Ten-minute maths games for kids aged 6 to 9", name: "Maths", audience: "parents", seed: 7 },
];

function drawOne(s: (typeof SAMPLES)[number]): { html: string; reading: string; screens: number } | null {
  try {
    const mockup = localMockup({ name: s.name, oneLiner: s.idea, audience: s.audience, price: "" });
    const drawn = studioDesign(mockup, { seed: s.seed });
    const checked = prepareDesign(drawn.html);
    if (!("html" in checked)) return null;
    return { html: checked.html, reading: drawn.plan.line, screens: checked.screens.length };
  } catch {
    return null;
  }
}

const POINTS = [
  { t: "It reads what you make first", l: "A bakery is not a booking tool and neither is a maths game. The studio decides what kind of product it is before it picks a single colour, and the whole design follows from that reading." },
  { t: "Three to six screens, wired to each other", l: "Not one pretty home screen. The screens exist, the buttons go somewhere, and you can press them. Anything that reaches outside the page is refused before you see it." },
  { t: "Your words, not filler", l: "The headline is your sentence, shortened until it fits — never replaced with something that sounds like an ad. Nothing in the screens is lorem ipsum." },
  { t: "A different look on request", l: "Same idea, same words, a different design. The engine has a shelf of treatments and archetypes built from what the category leaders actually do, so a second take is a second opinion rather than a shuffle." },
];

export default function Page() {
  const drawn = SAMPLES.map((s) => ({ s, out: drawOne(s) }));
  return (
    <>
      <PageHead
        eyebrow="Stop five"
        title="Your idea, on a phone, in about a second"
        line="You type one sentence. The workshop reads what kind of product it is, picks a design for that, and draws the screens with your own words in them. No account, no credits, no queue — because there is no model behind it charging us per picture."
        glyph="bolt"
      />

      {/* three of them, drawn on this request */}
      <section className="band">
        <div className="wrap">
          <Reveal className="band-head reveal">
            <p className="label">Drawn just now, by this page</p>
            <h2>Three ideas, three different products</h2>
            <p className="lede">
              These were not saved as pictures. They were drawn when you asked for this page, by the same
              engine that runs inside the app, and they are tappable.
            </p>
          </Reveal>
          <div className="phones">
            {drawn.map(({ s, out }, i) => (
              <Reveal key={s.name} className={`phone-card reveal d${(i % 3) + 1}`}>
                <div className="phone-well">
                  <div className="phone">
                    {out ? (
                      <iframe title={`${s.name}, drawn from a sentence`} srcDoc={out.html} sandbox="allow-scripts" loading="lazy" />
                    ) : (
                      <div className="phone-empty">
                        <span className="label">Not drawn</span>
                      </div>
                    )}
                  </div>
                </div>
                <b>{s.idea}</b>
                <span>{out ? `${out.reading} ${out.screens} screens.` : "The studio could not draw this one."}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="band tint">
        <div className="wrap">
          <div className="rules">
            {POINTS.map((p, i) => (
              <Reveal key={p.t} className={`rule reveal d${(i % 3) + 1}`}>
                <b>{p.t}</b>
                <p>{p.l}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="band close">
        <div className="wrap close-in">
          <h2>Do yours</h2>
          <Link className="btn primary" href="/v2">
            Draw my app
          </Link>
          <Link className="btn quiet" href="/v2/build">
            Then take it to a builder
          </Link>
        </div>
      </section>
    </>
  );
}
