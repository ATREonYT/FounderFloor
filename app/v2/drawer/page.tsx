import type { Metadata } from "next";
import Link from "next/link";
import { DOC_KINDS, draftDocument, type StandRecord } from "@founderfloor/shared";
import PageHead from "@/components/studio/PageHead";
import Reveal from "@/components/studio/Reveal";

export const metadata: Metadata = {
  title: "The drawer — FounderFloor",
  description:
    "Eleven documents drafted from your own numbers, in your own words, with anything missing marked rather than invented.",
};

/**
 * THE DRAWER.
 *
 * The list of documents is the app's. The sample underneath is drafted by
 * the app's own `draftDocument` from a made-up stand, so the page shows
 * the real output rather than a description of it — including the square
 * brackets, which are the honest part: the drawer never invents a number
 * it was not given.
 */
const SAMPLE_STAND: StandRecord = {
  name: "Lantern",
  oneLiner: "Prepaid passes for the cafés people come back to.",
  pitch: "Independent cafés lose their best customers to whoever is nearest on a wet Tuesday. A prepaid pass makes coming back the cheap option.",
  segment: "consumer",
  currency: "EUR",
  mrr: 1200,
  burn: 900,
  cash: 8400,
  founderSalary: 0,
  entity: "cy-ltd",
  residence: "CY",
  weeklyGoal: "Ten café owners hear the price out loud",
};

/** Which room of the workshop each document belongs to, in the app's order. */
const ROOM_ORDER = ["idea", "validate", "setup", "customers", "money", "raise"];
const ROOM_NAME: Record<string, string> = {
  idea: "Idea",
  validate: "Validate",
  setup: "Set up",
  customers: "Customers",
  money: "Money",
  raise: "Raise",
};

const SAMPLE = (() => {
  try {
    return draftDocument("one-pager", SAMPLE_STAND);
  } catch {
    return null;
  }
})();

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="The drawer"
        title="The eleven documents you will be asked for"
        line="A one-pager, an interview script, landing copy, an entity comparison, a pricing sheet, a first outreach message, a twelve-month plan, a launch checklist, an investor update, a receptionist FAQ and a build brief. Each one drafted from what is already on your stand."
        glyph="leaf"
      />

      <section className="band">
        <div className="wrap">
          {ROOM_ORDER.map((room) => {
            const kinds = DOC_KINDS.filter((k) => k.room === room);
            if (!kinds.length) return null;
            return (
              <div key={room} className="drawer-room">
                <p className="label">{ROOM_NAME[room] ?? room}</p>
                <div className="papers">
                  {kinds.map((k, i) => (
                    <Reveal key={k.kind} className={`paper reveal d${(i % 3) + 1}`}>
                      <b>{k.title}</b>
                      <p>{k.blurb}</p>
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* one of them, actually drafted */}
      {SAMPLE ? (
        <section className="band tint">
          <div className="wrap cols-wide">
            <Reveal className="reveal">
              <p className="label">Drafted just now</p>
              <h2>What a draft looks like before you touch it</h2>
              <p className="lede">
                This is the one-pager the drawer writes for a made-up café company, produced by this page
                on request.
              </p>
              <p>
                Look at the square brackets. Those are the places the stand has nothing in it yet, and the
                drawer says so rather than writing a plausible number. A document that invents your traction
                is worse than no document.
              </p>
            </Reveal>
            <Reveal className="reveal d1">
              <div className="sheet">
                <div className="sheet-head">
                  <span className="label">{SAMPLE.title}</span>
                  <span className="label">Lantern</span>
                </div>
                <pre>{SAMPLE.body}</pre>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      <section className="band close">
        <div className="wrap close-in">
          <h2>It starts with one sentence on your stand</h2>
          <Link className="btn primary" href="/v2">
            Draw my app
          </Link>
        </div>
      </section>
    </>
  );
}
