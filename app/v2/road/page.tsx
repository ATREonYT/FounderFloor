import type { Metadata } from "next";
import Link from "next/link";
import { ROAD } from "@founderfloor/shared";
import PageHead from "@/components/studio/PageHead";
import Reveal from "@/components/studio/Reveal";

export const metadata: Metadata = {
  title: "The road — FounderFloor",
  description: "Seven stops from an idea to a start-up with a paying customer.",
};

/**
 * The stops are read from ROAD in packages/shared — the same array the
 * app's Today tab walks down — so this page cannot describe a product
 * the app does not have.
 */
export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="The road"
        title="Seven stops, and you always know which one you are on"
        line="Drawing your app is stop five. The app is the whole walk, and at every point there is one thing to do next, in words a child could follow."
        glyph="rocket"
      />
      <section className="band">
        <div className="wrap">
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
      <section className="band tint close">
        <div className="wrap close-in">
          <h2>Stop one takes a sentence</h2>
          <Link className="btn primary" href="/v2">Draw my app</Link>
        </div>
      </section>
    </>
  );
}
