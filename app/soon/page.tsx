import type { Metadata } from "next";
import { EVENT_LABEL } from "@/lib/data/event-window.mjs";
import EmailCapture from "@/components/EmailCapture";
import Spec from "@/components/Spec";
import LaunchCountdown from "@/components/LaunchCountdown";
import HeroScene from "@/components/HeroScene";
import FoundersWall from "@/components/FoundersWall";
import WallJoin from "@/components/WallJoin";

/**
 * The launch gate: what everything rewrites to while LAUNCH_GATE is on.
 *
 * A holding page has one job — take an email — and it fails at that job by
 * being vague. So this one does not say "something exciting is coming". It
 * says what the thing is, shows the hall, gives the exact hour the doors
 * open, and counts down to it. A visitor who reads it can decide, which is
 * the only way an address is worth having.
 *
 * The artwork is the real hall renderer, not a placeholder. It is the one
 * proof available that there is something behind the door.
 */

export const metadata: Metadata = {
  title: "Opening Sunday · FounderFloor",
  description:
    "A trade-show floor that never tears down. Doors open " + EVENT_LABEL + ".",
  // Nothing here is worth indexing, and an indexed holding page outranks
  // the real one for weeks after the gate comes down.
  robots: { index: false, follow: false },
};

export default function SoonPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
      {/* dateline: the masthead line off the printed programme */}
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-1.5 border-y border-line py-2.5">
        <Spec className="text-muted">FounderFloor · Programme 2026</Spec>
        <Spec className="flex items-center gap-2 text-accent">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
          Doors not open yet
        </Spec>
        <Spec className="text-muted">Admission free · nothing to install</Spec>
      </div>

      <h1 className="mt-10 font-display text-[2.4rem] leading-[1.06] tracking-[-0.015em] sm:mt-12 sm:text-[3.6rem]">
        <span className="block">A trade-show floor</span>
        <span className="block">that never tears down.</span>
      </h1>

      <div className="mt-8 grid gap-x-12 gap-y-8 sm:mt-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
        <div>
          <p className="max-w-xl text-pretty text-[0.975rem] leading-[1.75] text-muted">
            A small 2D world where startups keep a stand and real founders
            stand at it. You walk around, you read the signs, you talk to
            people. Twenty-four stands, free, in the browser.
          </p>
          <p className="mt-4 max-w-xl text-pretty text-[0.975rem] leading-[1.75] text-muted">
            A room is only a room when people are in it, so it opens at one
            fixed hour rather than pretending to be busy all week. Leave an
            address and you will get one email when the doors open. Nothing
            else, ever.
          </p>

          <div className="mt-7 max-w-sm">
            {/* its own source tag, so the launch list is countable apart
                from the two capture boxes that already exist */}
            <EmailCapture variant="rsvp" source="launch-gate" />
          </div>
        </div>

        <aside className="border border-line bg-panel p-5">
          <Spec className="text-accent">Doors open</Spec>
          <p className="mt-2 font-display text-2xl leading-tight">{EVENT_LABEL}</p>
          <LaunchCountdown className="mt-4" />
          <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-muted">
            Then every Sunday at the same hour. Sunday evening in Europe,
            Sunday midday in the Americas.
          </p>
        </aside>
      </div>

      {/* The hall itself, drawn by the game's own renderer. A holding page
          that shows nothing is asking for an address on trust. */}
      <figure className="mt-12 sm:mt-14">
        <div className="relative overflow-hidden border border-line bg-panel">
          <HeroScene bare className="h-[260px] sm:h-[380px]" />
          <span className="absolute left-4 top-4 border border-ink/15 bg-paper px-2.5 py-1.5">
            <Spec className="text-muted">Main Hall, ambient view</Spec>
          </span>
        </div>
        <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
          <Spec className="text-muted">Plate 01. The hall, drawn at its own scale</Spec>
          <Spec className="text-muted">WASD · arrow keys · or tap</Spec>
        </figcaption>
      </figure>

      {/* The founders wall.
          A holding page whose only ask is an address gives a visitor
          nothing to do and nothing to show anyone. This gives them both:
          their startup goes up in public now, and the entry they make IS
          the stand they walk up to on Sunday — so filling the wall fills
          the room rather than competing with it. */}
      <section aria-labelledby="wall-heading" className="mt-14 sm:mt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1.5 border-t border-line pt-3">
          <Spec className="text-muted">Founders wall</Spec>
          <Spec className="text-muted">Free · stays up · yours to edit</Spec>
        </div>
        <h2
          id="wall-heading"
          className="mt-6 font-display text-[1.8rem] leading-tight sm:text-[2.2rem]"
        >
          Who is coming.
        </h2>
        <p className="mt-3 max-w-xl text-pretty text-[0.975rem] leading-[1.75] text-muted">
          Every startup that has taken a stand, doors open or not. Put yours
          up and it is on the wall the moment you press the button.
        </p>

        <WallJoin className="mt-7" />
        <FoundersWall className="mt-4" limit={24} />
      </section>

      {/* No legal links here: the site footer below carries them, and the
          middleware keeps those pages open precisely so it can. */}
    </main>
  );
}
