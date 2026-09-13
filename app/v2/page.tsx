import Link from "next/link";
import HeroScene from "@/components/HeroScene";
import IdeaComposer from "@/components/studio/IdeaComposer";
import Reveal from "@/components/studio/Reveal";
import PixelGlyph from "@/components/PixelGlyph";
import type { GlyphId } from "@/lib/types";

/**
 * THE FRONT DOOR.
 *
 * Two jobs and no more. Show a stranger their own product in a second,
 * and then show them the building it lives in. Everything else has its
 * own page now: a front door that explains all seven stops, the whole
 * week and the hand-off is a brochure, and nobody reads a brochure.
 *
 * The hall is here because it is the thing that makes the site and the
 * app obviously the same company — the same pixel founders standing at
 * the same counters, running live rather than drawn as a picture.
 */

const DOORS: { href: string; glyph: GlyphId; title: string; line: string }[] = [
  { href: "/v2/road", glyph: "rocket", title: "The road", line: "Seven stops from an idea to somebody paying you." },
  { href: "/v2/week", glyph: "bolt", title: "Your week", line: "Three tasks, and Friday reads the week back to you." },
  { href: "/v2/build", glyph: "cube", title: "Take it to a builder", line: "One prompt that carries the whole design with it." },
];

export default function Page() {
  return (
    <>
      <main id="top">
        <IdeaComposer />

        {/* the building it lives in, running */}
        <section className="band hall">
          <div className="wrap">
            <Reveal className="hall-head reveal">
              <p className="label">The building</p>
              <h2>And a floor to put it on</h2>
              <p className="lede">
                FounderFloor is drawn as a trade show that never tears down. The same pixel founders you
                see here stand in the app, at the same counters. This is the hall itself, running.
              </p>
            </Reveal>
            <Reveal className="hall-frame reveal d1">
              <HeroScene />
            </Reveal>
            <div className="hall-foot">
              <span className="tag soon"><i />Opens when there are enough of us</span>
              <Link className="btn quiet sm" href="/v2/floor">Walk in anyway</Link>
            </div>
          </div>
        </section>

        {/* three doors, not three more screenfuls */}
        <section className="band tint">
          <div className="wrap">
            <Reveal className="band-head reveal">
              <p className="label">Then the part that is actually hard</p>
              <h2>Anyone can build it. Almost nobody keeps going.</h2>
              <p className="lede">
                What people run out of is not ability, it is momentum — nothing tells them what to do on
                Monday. That is what the rest of this is for.
              </p>
            </Reveal>
            <div className="doors">
              {DOORS.map((d, i) => (
                <Reveal key={d.href} className={`reveal d${i + 1}`}>
                  <Link href={d.href} className="door">
                    <span className="door-art" aria-hidden>
                      <PixelGlyph glyph={d.glyph} size={26} color="var(--accent)" />
                    </span>
                    <span className="door-text">
                      <b>{d.title}</b>
                      <span>{d.line}</span>
                    </span>
                    <span className="door-go" aria-hidden>→</span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>

    </>
  );
}
