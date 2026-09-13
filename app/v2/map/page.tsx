import type { Metadata } from "next";
import Link from "next/link";
import HeroScene from "@/components/HeroScene";
import PageHead from "@/components/studio/PageHead";
import PixelGlyph from "@/components/PixelGlyph";
import Reveal from "@/components/studio/Reveal";
import { FLOORS } from "@/lib/data/floors";
import type { GlyphId } from "@/lib/types";

export const metadata: Metadata = {
  title: "The building — FounderFloor",
  description: "A trade show that never tears down: floors, stands, and a hall you can walk.",
};

/**
 * THE MAP.
 *
 * The floors are the real ones — the same definitions the walkable hall
 * is built from, including which are open — so this page cannot advertise
 * a room that is not there. Only the Main Hall is open on purpose: ten
 * people spread over five floors reads as five empty rooms.
 */
const FLOOR_GLYPH: Record<string, GlyphId> = {
  "main-hall": "star",
  "indie-alley": "bolt",
  "ramen-district": "coin",
  "cofounder-row": "heart",
  "tutorial-hall": "leaf",
};

export default function Page() {
  const floors = FLOORS.map((f) => ({
    id: f.id,
    name: f.name,
    tagline: f.tagline,
    open: !f.hidden,
    stands: f.boothSpots.length,
  }));
  return (
    <>
      <PageHead
        eyebrow="The building"
        title="A trade show that never tears down"
        line="FounderFloor is drawn as a hall because that is what it is for: your product gets a stand with your sign above it, and you walk around everybody else's. The same pixel people you see here stand in the app, at the same counters."
        glyph="cube"
      />

      {/* the hall, at full density */}
      <section className="band">
        <div className="wrap">
          <Reveal className="hall-frame tall reveal">
            <HeroScene bare playable density={1.6} />
          </Reveal>
          <div className="hall-foot">
            <span className="tag soon">
              <i />
              The doors open when there are enough of us
            </span>
          </div>
        </div>
      </section>

      {/* the floors */}
      <section className="band tint">
        <div className="wrap">
          <Reveal className="band-head reveal">
            <p className="label">Five floors, one of them open</p>
            <h2>The rest are built and un-advertised on purpose</h2>
            <p className="lede">
              Ten founders spread over five floors reads as five empty rooms. The same ten in one room reads
              as a busy one, and an empty room is the single biggest reason a first visitor never comes
              back. So the others stay dark until the Main Hall is full.
            </p>
          </Reveal>
          <div className="floors">
            {floors.map((f, i) => (
              <Reveal key={f.id} className={`floor reveal d${(i % 3) + 1}`} data-open={f.open}>
                <span className="floor-art" aria-hidden>
                  <PixelGlyph glyph={FLOOR_GLYPH[f.id] ?? "star"} size={22} color="var(--accent)" />
                </span>
                <div className="floor-body">
                  <b>{f.name}</b>
                  <p>{f.tagline}</p>
                </div>
                <span className="floor-state">{f.open ? `${f.stands} stands` : "Not open yet"}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* what a stand is */}
      <section className="band">
        <div className="wrap">
          <div className="rules">
            {[
              { t: "A stand, not a profile", l: "A banner with your sign on it, a counter, your colours and your props. It is a place, and people walk past it whether or not they were looking for you." },
              { t: "Your sign is already written", l: "The sentence you typed to draw your app is the sentence above your stand. It goes up the day the doors open." },
              { t: "You walk, you do not scroll", l: "Arrow keys. You see who is next to you, you can leave a note at a counter, and nobody is ranked by an algorithm you cannot read." },
              { t: "An empty hall helps nobody", l: "Which is why it is shut. When it opens it opens with people in it." },
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
            <Link className="btn quiet" href="/v2/floor">
              More about the floor
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
