import type { Metadata } from "next";
import Link from "next/link";
import { STAGES } from "@founderfloor/shared";
import PageHead from "@/components/studio/PageHead";
import PixelGlyph from "@/components/PixelGlyph";
import Reveal from "@/components/studio/Reveal";
import type { GlyphId } from "@/lib/types";

export const metadata: Metadata = {
  title: "The six rooms — FounderFloor",
  description:
    "Idea, Validate, Set up, Customers, Money, Raise. Four or five things in each, every one with a number in it.",
};

/**
 * THE WORKSHOP, ROOM BY ROOM.
 *
 * STAGES is the app's own list — the same ids the app stores ticks
 * against — so this page cannot describe a workshop that is not there.
 * The glyphs are chosen here because signage is the website's job, not
 * the data's.
 */
const SIGN: Record<string, GlyphId> = {
  idea: "star",
  validate: "flask",
  setup: "cube",
  customers: "heart",
  money: "coin",
  raise: "rocket",
};

/** The room opened up, so the promise is checked rather than believed. */
const OPEN = STAGES[0];

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="The workshop"
        title="Six rooms, and you always know which one you are in"
        line="Not a course and not a checklist app. Six rooms with four or five things to do in each, every one written so a person who has never done it can do it this evening, and every one with a line that says what done means."
        glyph="cube"
      />

      <section className="band">
        <div className="wrap">
          <div className="rooms">
            {STAGES.map((s, i) => (
              <Reveal key={s.id} className={`room reveal d${(i % 3) + 1}`}>
                <span className="room-n">{s.n}</span>
                <span className="room-art" aria-hidden>
                  <PixelGlyph glyph={SIGN[s.id] ?? "star"} size={22} color="var(--accent)" />
                </span>
                <b>{s.name}</b>
                <p>{s.blurb}</p>
                <span className="room-count">{s.items.length} things to do</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* one room, opened */}
      <section className="band tint">
        <div className="wrap">
          <Reveal className="band-head reveal">
            <p className="label">Room one, opened up</p>
            <h2>{OPEN.name}</h2>
            <p className="lede">{OPEN.blurb}</p>
          </Reveal>
          <div className="steps">
            {OPEN.items.map((it, i) => (
              <Reveal key={it.id} className={`step reveal d${(i % 3) + 1}`}>
                <span className="step-n">{i + 1}</span>
                <div className="step-body">
                  <b>{it.text}</b>
                  <p className="step-how">{it.how}</p>
                  <p className="step-proof">
                    <span className="label">Done means</span> {it.proof}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="note">
            Every one of those is a page in the app with one box on it, and the question underneath is the
            desk asking what you actually did. That answer goes in your notebook and shapes next week.
          </p>
        </div>
      </section>

      <section className="band close">
        <div className="wrap close-in">
          <h2>Your first week is written from your own sentence</h2>
          <Link className="btn primary" href="/v2">
            Draw my app
          </Link>
          <Link className="btn quiet" href="/v2/week">
            What a week looks like
          </Link>
        </div>
      </section>
    </>
  );
}
