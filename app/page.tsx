import Link from "next/link";
import { FLOORS } from "@/lib/data/floors";
import { RANKS } from "@/lib/ranks";
import { TIER_ORDER, type GlyphId, type SubTier } from "@/lib/types";
import TierTag, { TIER_LABEL, TIER_PRICE } from "@/components/TierTag";
import FloorCatalogue, { FloorsLede, FloorsTitle } from "@/components/FloorCatalogue";
import PixelGlyph from "@/components/PixelGlyph";
import HeroScene from "@/components/HeroScene";
import LiveStats from "@/components/LiveStats";
import Reveal from "@/components/Reveal";
import FloorThumb from "@/components/FloorThumb";
import EmailCapture from "@/components/EmailCapture";
import RankMeter from "@/components/RankMeter";
import Parallax from "@/components/Parallax";
import ProgrammeIndex, { type IndexEntry } from "@/components/ProgrammeIndex";
import AdmissionStubs from "@/components/AdmissionStubs";
import LaunchBanner from "@/components/LaunchBanner";
import FoundingSeatsCard from "@/components/FoundingSeatsCard";
import FoundersWall from "@/components/FoundersWall";
import WallJoin from "@/components/WallJoin";
import Spec from "@/components/Spec";
import Sign from "@/components/Sign";

/**
 * The landing page, set as a printed trade-show programme.
 *
 * The layout grammar matters as much as the content here. Sections hang off
 * a margin rail (number, title and standfirst in a narrow left column
 * against a hairline) instead of stacking centred blocks; the walkthrough is
 * a route with stops on a dotted path instead of three icon cards; the site
 * map is an index with rules and leaders instead of a four-card grid; and
 * the plans are perforated admission stubs instead of pricing boxes. The
 * previous design is archived — see docs/design/README.md.
 *
 * Colours, fonts and components are unchanged from that design; only the
 * arrangement is new.
 */

/** The advertised floors — FOCUS MODE in lib/data/floors.ts hides the rest. */
const PUBLIC_FLOORS = FLOORS.filter((f) => !f.hidden);
const MANY_FLOORS = PUBLIC_FLOORS.length > 1;

/** Content column. Deliberately wider than the old max-w-5xl. */
const SHELL = "mx-auto w-full max-w-6xl px-5 sm:px-8";
/** Full-bleed column for artwork, so the picture outruns the text. */
const WIDE = "mx-auto w-full px-5 sm:px-8";

/**
 * THE TYPE SCALE. Four display sizes and two body sizes on the whole page,
 * and the count is the rule:
 *
 *   display  hero 40/66/82 · TITLE 36/48 · text-xl 28 · text-lg 20
 *   body     READ 17 (any real sentence, near-ink) · text-xs 12 (labels)
 *
 * Anything a visitor is meant to actually read is READ and near-ink;
 * text-muted is reserved for genuinely secondary text. Archivo is a
 * grotesque, so everything over ~30px carries negative tracking — the
 * serif this page used to be set in did not need it.
 */
const TITLE = "font-display text-3xl leading-tight tracking-tight sm:text-4xl";
const READ = "text-[1.0625rem] leading-[1.7]";

/* ------------------------------------------------------------------ parts */

/** A key cap. Tone-aware because it appears on both grounds: the dark
 *  hero and the light route section. */
function Kbd({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "paper" }) {
  return (
    <kbd
      className={`rounded-sm border px-1.5 py-0.5 font-mono text-xs ${
        tone === "paper"
          ? "border-paper/25 bg-paper/10 text-paper"
          : "border-line bg-panel text-ink"
      }`}
    >
      {children}
    </kbd>
  );
}

/** Printer's crop marks around the artwork. Purely a mark of the trade. */
function CropMarks({ tone = "ink" }: { tone?: "ink" | "paper" }) {
  const c = tone === "ink" ? "border-ink/30" : "border-paper/30";
  const b = `pointer-events-none absolute h-3.5 w-3.5 ${c}`;
  return (
    <span aria-hidden="true">
      <span className={`${b} -left-2 -top-2 border-l border-t`} />
      <span className={`${b} -right-2 -top-2 border-r border-t`} />
      <span className={`${b} -bottom-2 -left-2 border-b border-l`} />
      <span className={`${b} -bottom-2 -right-2 border-b border-r`} />
    </span>
  );
}

/**
 * A programme section: the number, title and standfirst live in a sticky
 * margin rail; the content runs in the wide column beside it, separated by
 * a hairline. This asymmetry is the single biggest departure from the
 * previous design, where every section was a centred stack of equal width.
 */
function Section({
  glyph,
  kicker,
  title,
  lede,
  children,
  id,
  to,
  tone = "paper",
  className = "",
}: {
  glyph: GlyphId;
  kicker: string;
  /** True when this section names somewhere in the building you can walk
   *  to, rather than something the page is explaining. Drives the arrow. */
  to?: boolean;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  tone?: "paper" | "ink" | "panel";
  className?: string;
}) {
  const dark = tone === "ink";
  const headingId = `${id ?? kicker}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`scroll-mt-16 border-b border-line ${
        dark ? "bg-ink" : tone === "panel" ? "bg-panel" : ""
      } ${className}`}
    >
      <Reveal className={`${SHELL} py-14 sm:py-20`}>
        <div className="grid gap-y-8 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:gap-x-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            {/* The sign. One repeating unit — pictogram, label, the
                section's real anchor in the code slot — in place of the
                old numeral rail and kicker. Same anatomy as every other
                sign in the building; nothing here is improvised. */}
            <Sign glyph={glyph} label={kicker} code={id ? `#${id}` : undefined} to={to} />
            <h2
              id={headingId}
              className={`mt-4 ${TITLE} ${dark ? "text-paper" : ""}`}
            >
              {title}
            </h2>
            {lede && (
              <p
                className={`mt-3 max-w-sm ${READ} ${
                  dark ? "text-paper/85" : "text-ink/85"
                }`}
              >
                {lede}
              </p>
            )}
          </div>
          <div className={`min-w-0 lg:border-l lg:pl-14 ${dark ? "lg:border-paper/15" : "lg:border-line"}`}>
            {children}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ data */

const STOPS: { title: string; body: string; glyph: GlyphId }[] = [
  {
    title: "Walk in",
    glyph: "bolt",
    body: "Pick a name, pick a face, pick a floor. Arrow keys, or just tap where you want to go. No calendar invite, no badge scanner.",
  },
  {
    title: "Talk to founders",
    glyph: "wave",
    body: "Every stand has a person behind it. Walk up, press E, ask what they actually do. They will tell you, briefly.",
  },
  {
    title: "Connect",
    glyph: "heart",
    body: "If it's worth remembering, hit Connect. The list lives in your profile, not in a CRM you'll never open.",
  },
];

const INDEX_ROWS: {
  href: string;
  glyph: GlyphId;
  name: string;
  blurb: string;
  action: string;
}[] = [
  {
    href: "/lobby",
    glyph: "cube",
    name: "Floors",
    blurb: "The halls themselves. Walk in, browse stands, talk to whoever's there.",
    action: "Walk a floor",
  },
  {
    href: "/directory",
    glyph: "star",
    name: "Directory",
    blurb: "Every startup on every floor, searchable. One click walks you to their booth.",
    action: "Search startups",
  },
  {
    href: "/connections",
    glyph: "heart",
    name: "Connections",
    blurb: "The people you've met. Requests, accepts, and chats that work from anywhere.",
    action: "Open your rolodex",
  },
  {
    href: "/profile",
    glyph: "bolt",
    name: "Profile",
    blurb: "Your name, your stand, your quests and badges. And an account, if you want one.",
    action: "Set yourself up",
  },
];

// While only the Main Hall is open, the paid tiers sell what they actually
// deliver today — placement, tags and a gold stand — not floor access.
const PRICING: { tier: SubTier; blurb: string }[] = [
  { tier: "free", blurb: "The whole floor, every social feature. Plenty to see." },
  { tier: "pro", blurb: "Everything in Free, and your stand gets found first." },
  { tier: "founder", blurb: "Top of every list, and a gold-trimmed stand people notice." },
];

const SHIPPED = [
  ["A directory that grows itself", "Every startup someone creates shows up the moment they save it, and its category becomes a new filter."],
  ["Chats that follow you", "Message a connection from anywhere. They get a pixel-mail ping whether they're on a floor or in a menu."],
  ["Your own banner logo", "Upload any image and it is shrunk to a 16×16 mark on your stand."],
  ["Your progress, everywhere", "Stand, quests, badges and streaks now follow your account across devices."],
  ["Smooth on any machine", "The floor measures your hardware and picks its render resolution to match."],
  ["Real email accounts", "Sign in with an address, reset a forgotten password, and get an alert if the account signs in somewhere new."],
];

const IN_THE_SHOP = [
  ["Real revenue verification", "A read-only Stripe connection, so the gold badges stop being simulated and start being earned."],
  ["A real events calendar", "Open Doors gets siblings: pitch hours, category meetups, co-founder speed-walking."],
  ["Bigger halls", "New floors open as the existing ones fill with real stands."],
];

const FAQ = [
  {
    q: "Is it actually free?",
    a: "Walking the floors, talking, connecting, and keeping a stand: free, permanently. Paid memberships buy visibility (priority in the directory, gold trim on your stand), never access.",
  },
  {
    q: "Are the people real?",
    a: "Yes. Every stand is set up by a real founder and every avatar is a live visitor. The one exception is Pixel, the clearly-labeled tutorial robot, who never leaves the practice hall.",
  },
  {
    q: "What happens to my stand when I close the tab?",
    a: "It comes off the floor: a floor only shows who is in the hall right now. Your spot stays reserved, so walking back in puts the stand back where it was. Meanwhile the stand keeps its own page in the directory, open at any hour, collecting guestbook notes and connection requests. Leave it 7 days and the spot frees up for someone else — though stands are kept longer around show weeks.",
  },
  {
    q: "Do I need an account?",
    a: "No. You can walk in as a guest with just a name. An account (free) makes your progress follow you across devices and lets you reset a forgotten password by email.",
  },
  {
    q: "What are the ranks on the stands?",
    a: "Monthly revenue tiers. They're labeled honestly: in this beta, verification is simulated: founders type a number. Read-only Stripe verification is the first post-beta feature.",
  },
];

/**
 * The running head, pinned in the left margin above 1380px. Kept next to the
 * sections it points at so the two cannot drift apart.
 */
// The side rail shows each section's REAL address — the anchor you would
// share — not an invented numbering. Micrographics, not decoration.
const PROGRAMME: IndexEntry[] = [
  { id: "route", n: "#route", label: "Three stops, one lap" },
  { id: "index", n: "#index", label: "Find your way around" },
  { id: "wall", n: "#wall", label: "The founders wall" },
  { id: "halls", n: "#halls", label: "The floor" },
  { id: "ranks", n: "#ranks", label: "The rank ladder" },
  { id: "admission", n: "#admission", label: "Admission" },
  { id: "roadmap", n: "#roadmap", label: "The floor keeps changing" },
  { id: "faq", n: "#faq", label: "Fair questions" },
];

/* ------------------------------------------------------------------ page */

export default function LandingPage() {
  const maxRevenue = Math.max(...RANKS.map((r) => r.minRevenue), 1);

  return (
    <main>
      <ProgrammeIndex entries={PROGRAMME} />
      {/* The grand-opening slip, pasted over everything until launch night
          has come and gone — then it removes itself (LaunchBanner). */}
      <LaunchBanner />
      {/* ================================================ HERO — the poster
          Dark on purpose: the hall is the only artwork on the site, and on a
          cream page its cream floor had nothing to push against. Against
          near-black the pixel light reads as a lit room seen from outside —
          which is also what the hall is, an hour before doors. Everything
          below section 01 stays on paper. */}
      <section className="bg-ink text-paper">
        <div className={`${SHELL} pt-8 sm:pt-12`}>
          {/* dateline: the masthead line off a printed programme */}
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-1.5 border-y border-paper/15 py-2.5">
            <Spec className="text-paper/50">FounderFloor · Programme 2026</Spec>
            <Spec className="flex items-center gap-2 text-paper/50">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-verify" />
              Main Hall, open now
            </Spec>
            <Spec className="text-paper/50">Admission free · nothing to install</Spec>
          </div>

          {/* the headline runs the full measure, poster-scale, and breaks
              where we say it breaks rather than wherever the box ends */}
          <h1 className="stagger-children mt-10 font-display text-[2.5rem] leading-[1.06] tracking-[-0.015em] sm:mt-12 sm:text-[4.1rem] lg:text-[5.1rem]">
            <span className="block">A trade-show floor</span>
            <span className="block">
              that <span className="sweep-underline">never{" "}tears{" "}down</span>.
            </span>
          </h1>

          {/* asymmetric split under the headline: the argument on the left,
              the doors on the right */}
          <div className="mt-10 grid gap-x-12 gap-y-8 sm:mt-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-end">
            <p className="max-w-xl text-pretty text-[1.0625rem] leading-[1.7] text-paper/75">
              FounderFloor is a small 2D world where startups keep a stand and
              real founders are there to talk to. You walk around, you read the
              signs, you meet people.
            </p>
            <div className="lg:border-l lg:border-paper/15 lg:pl-10">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/lobby"
                  className="btn-press rounded-md bg-accent-strong px-6 py-3 text-sm font-medium text-paper shadow-card hover:bg-accent-strong/90"
                >
                  Walk the floor →
                </Link>
                <Link
                  href="/profile#booth"
                  className="btn-press rounded-md border border-paper/40 px-6 py-3 text-sm font-medium text-paper hover:bg-paper/10"
                >
                  Set up a stand
                </Link>
              </div>
              <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-paper/60">
                <span className="hidden items-center gap-1.5 sm:flex">
                  <Kbd tone="paper">W A S D</Kbd> walk
                </span>
                <span className="hidden items-center gap-1.5 sm:flex">
                  <Kbd tone="paper">E</Kbd> talk
                </span>
                <span className="sm:hidden">Tap where you want to go.</span>
              </p>
            </div>
          </div>
        </div>

        {/* PLATE — the artwork runs wider than the text and carries crop
            marks and a caption, the way a plate does in a printed programme */}
        <div className={`${WIDE} mt-12 pb-14 sm:mt-16 sm:pb-20`}>
          {/* the plate drifts a little against the type as it passes, so the
              page has a foreground and a background rather than one plane */}
          <Parallax amount={14}>
            <figure className="anim-in relative">
              <CropMarks tone="paper" />
              <div className="relative overflow-hidden border border-paper/15 bg-ink">
                <HeroScene bare className="h-[300px] sm:h-[420px] lg:h-[520px]" />
              </div>
            </figure>
          </Parallax>
        </div>

        {/* the numbers, posted on a rule instead of sat in four white boxes */}
        <div className={`${SHELL} mt-14 pb-14 sm:mt-16 sm:pb-16`}>
          <LiveStats variant="rail" tone="paper" />
        </div>
      </section>

      {/* ============================================ 01 — THE ROUTE */}
      <Section
        glyph="bolt"
        id="route"
        kicker="The whole idea"
        title={"Three stops, one lap"}
        lede="Nothing to learn. The route from the door to a conversation you'd have had at a real hall is about ninety seconds long."
      >
        <div className="relative">
          {/* the walking route: a dotted path the stops sit on. It runs off
              both edges — the hall continues past what's on this page. */}
          {/* the path draws itself in, then the dashes keep crawling: a
              route that is being walked shouldn't sit still */}
          <span
            aria-hidden="true"
            className="dash-x edge-fade-x absolute left-0 top-6 hidden h-px w-full sm:block"
          />
          <ol className="grid gap-11 sm:grid-cols-3 sm:gap-8">
            {STOPS.map((stop, i) => (
              <li key={stop.title} className="relative flex gap-5 sm:block">
                {/* on phones the path turns vertical and runs down the gutter */}
                {i < STOPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="dash-y absolute left-6 top-12 h-[calc(100%+2.75rem-3rem)] w-px sm:hidden"
                  />
                )}
                {/* each stop lands as the path reaches it */}
                <span
                  className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-paper"
                  style={{ animationDelay: `${180 + i * 190}ms` }}
                >
                  <PixelGlyph glyph={stop.glyph} size={18} color="var(--accent)" />
                </span>
                <div className="min-w-0 sm:mt-7">
                  <h3 className="mt-1.5 font-display text-xl">{stop.title}</h3>
                  <p className={`mt-2 max-w-sm ${READ} text-ink/85`}>{stop.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <Kbd>W A S D</Kbd> or <Kbd>↑ ↓ ← →</Kbd> to walk
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>E</Kbd> to talk to whoever you're standing in front of
          </span>
        </p>
      </Section>

      {/* ============================================ 02 — THE INDEX */}
      <Section
        glyph="chip"
        id="index"
        to
        kicker="The map"
        title="Find your way around"
        lede="Four places, each with one job. Everything you do in one shows up in the others."
        tone="panel"
      >
        <ul className="border-t border-line">
          {INDEX_ROWS.map((row, i) => (
            <li key={row.href}>
              <Link
                href={row.href}
                // The first track is `auto`, not a fixed rem: it holds the
                // row's real address ("/connections" is the widest), and the
                // old 2.5rem — sized for the numerals this column once
                // carried — let the href run underneath the glyph and name.
                className="index-row relative grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1.5 border-b border-line px-1 py-5 sm:grid-cols-[auto_9rem_minmax(0,1fr)_auto] sm:gap-x-6 sm:py-6"
              >
                {/* the row's REAL address, not an invented numbering */}
                <span aria-hidden="true" className="font-mono text-xs text-muted/70">
                  {row.href}
                </span>
                <span className="flex items-center gap-2.5 font-display text-lg leading-tight">
                  <PixelGlyph glyph={row.glyph} size={14} color="var(--accent)" />
                  {row.name}
                </span>
                <span className={`col-start-2 ${READ} text-ink/85 sm:col-start-3`}>
                  {row.blurb}
                </span>
                <span className="col-start-2 whitespace-nowrap text-sm text-accent sm:col-start-4">
                  {row.action} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* ============================================ 03 — THE WALL */}
      {/* High on the page on purpose. Everything above it is the site
          describing itself; this is other people, which is the only part a
          stranger has no reason to doubt. It is also the shortest path from
          "what is this" to "I am in it" — no download, no floor, no
          waiting for Sunday. */}
      <Section
        glyph="heart"
        id="wall"
        kicker="Who is here"
        title="The founders wall"
        lede="Every startup that has taken a stand, live from the floor server. Adding yours is free and takes one form."
        tone="panel"
      >
        <WallJoin />
        <FoundersWall className="mt-4" limit={24} />
      </Section>

      {/* ============================================ 04 — THE HALL */}
      {/* Client island: the annex switch can un-hide a floor at runtime,
          so the list, its count and even the singular/plural title are
          live. See components/FloorCatalogue.tsx. */}
      <Section
        glyph="cube"
        id="halls"
        to
        kicker="The venue"
        title={<FloorsTitle />}
        lede={<FloorsLede />}
      >
        <FloorCatalogue />
      </Section>

      {/* ============================================ 04 — THE BOARD */}
      <Section
        glyph="flask"
        id="ranks"
        kicker="The board"
        title="The rank ladder"
        lede={
          <>
            The plan: ranks set by verified monthly revenue through a read-only
            Stripe connection. This beta simulates it: founders self-report
            their number and the badge follows. Treat every rank as a claim.
          </>
        }
        tone="ink"
      >
        <div className="blueprint border-y border-paper/15">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-b border-paper/15 px-1 py-2.5 sm:grid-cols-[9.5rem_minmax(0,1fr)_minmax(0,1.1fr)] sm:gap-6">
            <Spec className="text-paper/40">Rank</Spec>
            <Spec className="text-right text-paper/40 sm:text-left">Monthly revenue</Spec>
            <Spec className="hidden text-paper/40 sm:block">What it means</Spec>
          </div>
          {RANKS.map((rank, i) => (
            <div
              key={rank.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-paper/10 px-1 py-4 last:border-b-0 sm:grid-cols-[9.5rem_minmax(0,1fr)_minmax(0,1.1fr)] sm:gap-x-6"
            >
              <span className="inline-flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rotate-45"
                  style={{ backgroundColor: rank.color }}
                />
                <span className="font-display text-lg leading-none text-paper">{rank.name}</span>
              </span>
              {/* The board totals count up when the section arrives, the way
                  a hall's tote board does when it refreshes, and each bar
                  lengthens on the very same ramp as the figure above it. */}
              <RankMeter
                value={rank.minRevenue}
                max={maxRevenue}
                color={rank.color}
                delay={i * 90}
              />
              <span className={`col-span-2 ${READ} text-paper/85 sm:col-span-1`}>
                {rank.blurb}
              </span>
            </div>
          ))}
        </div>
        <p className={`mt-5 ${READ} text-paper/75`}>
          Gold is self-reported in this beta. Verification is the roadmap
        </p>
      </Section>

      {/* ============================================ 05 — ADMISSION */}
      <Section
        glyph="coin"
        id="admission"
        kicker="What costs money"
        title="Admission"
        lede="Walking in is free and stays free. What you can buy is a better position on the floor, never a key to it."
      >
        {/* The one thing on this page that can run out. It hides itself
            when the seats are gone or the reader already has one, so the
            section reads correctly forever without anyone editing it. */}
        <FoundingSeatsCard />
        <AdmissionStubs pricing={PRICING} />
        <Spec className="mt-5 block text-muted">
          Beta. Billing goes live at launch
        </Spec>
      </Section>

      {/* ============================================ 06 — THE BUILD LOG */}
      <Section
        glyph="rocket"
        id="roadmap"
        kicker="Shipping weekly"
        title="The floor keeps changing"
        lede="Walk in after a few days away and the lobby will tell you what you missed."
        tone="panel"
      >
        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          {[
            { label: "Landed recently", color: "text-verify", mark: "bg-verify", rows: SHIPPED },
            { label: "In the shop", color: "text-accent", mark: "bg-accent", rows: IN_THE_SHOP },
          ].map((col) => (
            <div key={col.label}>
              <div className="flex items-center gap-3 border-b border-line pb-2.5">
                <Spec className={col.color}>{col.label}</Spec>
                <span aria-hidden="true" className="dash-x draw-x h-px flex-1" />
              </div>
              <ul className="mt-1">
                {col.rows.map(([head, tail]) => (
                  <li
                    key={head}
                    className={`flex gap-3 border-b border-line/60 py-3.5 ${READ} text-ink/85 last:border-b-0`}
                  >
                    <span aria-hidden="true" className={`mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 ${col.mark}`} />
                    <span>
                      <span className="text-ink">{head}.</span> {tail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================================ 07 — ENQUIRIES */}
      <Section
        glyph="leaf"
        id="faq"
        kicker="Before you ask"
        title="Fair questions"
        lede="The five that come up most, answered without marketing."
      >
        <div className="border-t border-line">
          {FAQ.map((item, i) => (
            <details key={item.q} className="group border-b border-line">
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-4 py-4 text-left [&::-webkit-details-marker]:hidden">
                <span aria-hidden="true" className="numeral w-8 shrink-0 text-sm text-ink/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={`flex-1 ${READ} font-medium text-ink`}>{item.q}</span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg leading-none text-muted transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className={`max-w-2xl pb-5 pl-12 pr-8 ${READ} text-ink/85`}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </Section>

      {/* ============================================ CLOSING PLACARD */}
      <section aria-labelledby="cta-heading" className="blueprint bg-ink">
        <div className={`${SHELL} py-16 sm:py-24`}>
          <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <div>
              <Spec className="text-paper/50">Closing time: there isn&rsquo;t one</Spec>
              <h2
                id="cta-heading"
                className={`mt-4 max-w-xl ${TITLE} text-paper`}
              >
                The doors are propped open. They stay that way.
              </h2>
              <p className={`mt-5 max-w-md ${READ} text-paper/75`}>
                No badge, no lanyard, no schedule. The founders are at their
                booths.
              </p>
              <Link
                href="/lobby"
                className="btn-press mt-8 inline-block rounded-md bg-accent-strong px-7 py-3.5 text-sm font-medium text-paper shadow-card hover:bg-accent-strong/90"
              >
                Walk the floor →
              </Link>
            </div>

            {/* Not everyone is ready today. Without this the visit ends here
                and there is no second one — the list is the only way back. */}
            <div className="self-end border border-paper/15 p-6">
              <p className="font-display text-lg text-paper">Or come back when it&rsquo;s busy</p>
              <p className={`mt-3 ${READ} text-paper/75`}>
                The floors fill up every Sunday at 18:00 CET. Leave an
                address and we&rsquo;ll tell you when it&rsquo;s worth walking
                in. No newsletter, no drip campaign.
              </p>
              <div className="mt-4 [&_input]:border-paper/25 [&_input]:bg-paper/10 [&_input]:text-paper [&_input]:placeholder:text-paper/60 [&_p]:text-paper/85">
                <EmailCapture variant="list" source="landing" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
