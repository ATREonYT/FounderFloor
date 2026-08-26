import Link from "next/link";
import { FLOORS } from "@/lib/data/floors";
import { RANKS } from "@/lib/ranks";
import { TIER_ORDER, type GlyphId, type SubTier } from "@/lib/types";
import TierTag, { TIER_LABEL, TIER_PRICE } from "@/components/TierTag";
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

const TICKER_ITEMS = [
  "WALK IN",
  "TALK TO FOUNDERS",
  "CLAIM A STAND",
  "SIGN GUESTBOOKS",
  "EARN BADGES",
  "FIND A CO-FOUNDER",
  "NO CALENDAR INVITE",
];

/* ------------------------------------------------------------------ parts */

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-sm border border-line bg-panel px-1.5 py-0.5 font-mono text-[11px] text-ink">
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
  n,
  kicker,
  title,
  lede,
  children,
  id,
  tone = "paper",
  className = "",
}: {
  n: string;
  kicker: string;
  title: string;
  lede?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  tone?: "paper" | "ink" | "panel";
  className?: string;
}) {
  const dark = tone === "ink";
  const headingId = `${id ?? n}-heading`;
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
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`numeral text-[2.75rem] leading-none ${
                  dark ? "text-paper/20" : "text-ink/15"
                }`}
              >
                {n}
              </span>
              <span
                aria-hidden="true"
                className={`dash-x draw-x h-px flex-1 ${
                  dark ? "[--dash-c:rgba(242,239,231,0.3)]" : ""
                }`}
              />
            </div>
            <Spec className={`mt-4 block ${dark ? "text-gold" : "text-accent"}`}>{kicker}</Spec>
            <h2
              id={headingId}
              className={`mt-2 font-display text-3xl leading-tight sm:text-[2.1rem] ${
                dark ? "text-paper" : ""
              }`}
            >
              {title}
            </h2>
            {lede && (
              <p
                className={`mt-3 max-w-sm text-sm leading-relaxed ${
                  dark ? "text-paper/60" : "text-muted"
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
    a: "It comes off the floor: a floor only shows who is in the hall right now. Your spot stays reserved, so walking back in puts the stand back where it was. Meanwhile the stand keeps its own page in the directory, open at any hour, collecting guestbook notes and connection requests. Leave it 7 days and the spot frees up for someone else.",
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
const PROGRAMME: IndexEntry[] = [
  { id: "route", n: "01", label: "Three stops, one lap" },
  { id: "index", n: "02", label: "Find your way around" },
  { id: "wall", n: "03", label: "The founders wall" },
  { id: "halls", n: "04", label: "The floor" },
  { id: "ranks", n: "05", label: "The rank ladder" },
  { id: "admission", n: "06", label: "Admission" },
  { id: "roadmap", n: "07", label: "The floor keeps changing" },
  { id: "faq", n: "08", label: "Fair questions" },
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
      {/* HALL BOARD — the lit sign over the doors. A fixed status chip, then
          the programme running past it. */}
      <div className="flex items-stretch border-b border-line bg-ink text-paper">
        <span className="flex shrink-0 items-center gap-2 border-r border-paper/15 px-4 py-2">
          <span aria-hidden="true" className="pulse-dot h-1.5 w-1.5 rounded-full bg-verify" />
          <Spec className="text-paper">Open</Spec>
        </span>
        <div aria-hidden="true" className="marquee edge-fade-x min-w-0 flex-1 overflow-hidden py-2">
          <div className="marquee-track flex w-max">
            {["a", "b"].map((k) => (
              <span key={k} className="flex shrink-0 items-center">
                {TICKER_ITEMS.map((item) => (
                  <span key={item} className="flex items-center">
                    <Spec className="px-5 text-paper/55">{item}</Spec>
                    <span aria-hidden="true" className="h-1 w-1 rotate-45 bg-gold/70" />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================ HERO — the poster */}
      <section className="border-b border-line">
        <div className={`${SHELL} pt-8 sm:pt-12`}>
          {/* dateline: the masthead line off a printed programme */}
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-1.5 border-y border-line py-2.5">
            <Spec className="text-muted">FounderFloor · Programme 2026</Spec>
            <Spec className="flex items-center gap-2 text-muted">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-verify" />
              Main Hall, open now
            </Spec>
            <Spec className="text-muted">Admission free · nothing to install</Spec>
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
            <p className="max-w-xl text-pretty text-[0.975rem] leading-[1.75] text-muted">
              FounderFloor is a small 2D world where startups keep a stand and
              real founders stand at it. You walk around, you read the signs,
              you talk to people. Ranks reflect self-reported revenue in this
              beta (verification is on the roadmap), and the gold badge tells
              you who claims to have earned it the boring way.
            </p>
            <div className="lg:border-l lg:border-line lg:pl-10">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/lobby"
                  className="btn-press rounded-md bg-accent-strong px-6 py-3 text-sm font-medium text-white shadow-card hover:bg-accent-strong/90"
                >
                  Walk the floor →
                </Link>
                <Link
                  href="/profile#booth"
                  className="btn-press rounded-md border border-ink px-6 py-3 text-sm font-medium text-ink hover:bg-panel"
                >
                  Set up a stand
                </Link>
              </div>
              <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
                <span className="hidden items-center gap-1.5 sm:flex">
                  <Kbd>W A S D</Kbd> walk
                </span>
                <span className="hidden items-center gap-1.5 sm:flex">
                  <Kbd>E</Kbd> talk
                </span>
                <span className="sm:hidden">Tap where you want to go.</span>
              </p>
            </div>
          </div>
        </div>

        {/* PLATE — the artwork runs wider than the text and carries crop
            marks and a caption, the way a plate does in a printed programme */}
        <div className={`${WIDE} mt-12 sm:mt-16`}>
          {/* the plate drifts a little against the type as it passes, so the
              page has a foreground and a background rather than one plane */}
          <Parallax amount={14}>
            <figure className="anim-in relative">
              <CropMarks />
              <div className="relative overflow-hidden border border-line bg-panel">
                <HeroScene bare className="h-[300px] sm:h-[420px] lg:h-[520px]" />
                {/* labels are printed ON the plate: solid stock, no blur */}
                <span className="absolute left-4 top-4 border border-ink/15 bg-paper px-2.5 py-1.5">
                  <Spec className="text-muted">Main Hall, ambient view</Spec>
                </span>
                <span className="absolute right-4 top-4 flex items-center gap-2 border border-ink/15 bg-paper px-2.5 py-1.5">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-accent" />
                  <Spec className="text-muted">Drawn on load</Spec>
                </span>
              </div>
              <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
                <Spec className="text-muted">Plate 01. The hall, drawn at its own scale</Spec>
                <Spec className="text-muted">WASD · arrow keys · or tap</Spec>
              </figcaption>
            </figure>
          </Parallax>
        </div>

        {/* the numbers, posted on a rule instead of sat in four white boxes */}
        <div className={`${SHELL} mt-14 pb-14 sm:mt-16 sm:pb-16`}>
          <LiveStats variant="rail" />
        </div>
      </section>

      {/* ============================================ 01 — THE ROUTE */}
      <Section
        n="01"
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
            className="dash-x march edge-fade-x absolute left-0 top-6 hidden h-px w-full sm:block"
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
                  className="stop-pop relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-paper"
                  style={{ animationDelay: `${180 + i * 190}ms` }}
                >
                  <PixelGlyph glyph={stop.glyph} size={18} color="var(--accent)" />
                </span>
                <div className="min-w-0 sm:mt-7">
                  <Spec className="text-muted">Stop {String(i + 1).padStart(2, "0")}</Spec>
                  <h3 className="mt-1.5 font-display text-xl">{stop.title}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{stop.body}</p>
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
        n="02"
        id="index"
        kicker="The map"
        title="Find your way around"
        lede="Four places, each with one job. Everything you do in one shows up in the others."
        tone="panel"
      >
        <ul className="stagger-children border-t border-line">
          {INDEX_ROWS.map((row, i) => (
            <li key={row.href}>
              <Link
                href={row.href}
                className="index-row relative grid grid-cols-[2.25rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1.5 border-b border-line px-1 py-5 sm:grid-cols-[2.5rem_8.5rem_minmax(0,1fr)_auto] sm:gap-x-6 sm:py-6"
              >
                <span aria-hidden="true" className="numeral text-base text-ink/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex items-center gap-2.5 font-display text-xl leading-none">
                  <PixelGlyph glyph={row.glyph} size={14} color="var(--accent)" />
                  {row.name}
                </span>
                <span className="col-start-2 text-sm leading-relaxed text-muted sm:col-start-3">
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
        n="03"
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
      <Section
        n="04"
        id="halls"
        kicker="The venue"
        title={MANY_FLOORS ? "The floors" : "The floor"}
        lede={
          MANY_FLOORS ? (
            <>
              {PUBLIC_FLOORS.length} halls, {PUBLIC_FLOORS.length} temperaments.
              Each is a real map with real booths; the miniatures are to scale.
            </>
          ) : (
            <>
              One hall, open to everyone, and everyone is in it. A young floor
              fills up faster than four empty ones. The miniature is to scale.
            </>
          )
        }
      >
        <div className="border-t border-line">
          {PUBLIC_FLOORS.map((floor) => {
            const locked = TIER_ORDER[floor.tier] > TIER_ORDER.free;
            return (
              <article
                key={floor.id}
                className="flex flex-col gap-6 border-b border-line py-7 sm:flex-row sm:gap-8"
              >
                <div className="relative shrink-0 self-start">
                  <CropMarks />
                  <FloorThumb
                    floor={floor}
                    className={`border border-line ${locked ? "opacity-70" : ""}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className={`font-display text-2xl ${locked ? "text-muted" : ""}`}>
                      {floor.name}
                    </h3>
                    <TierTag tier={floor.tier} />
                  </div>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                    {floor.tagline}
                  </p>

                  {/* catalogue specification, with the leaders a programme
                      would print between the entry and its value */}
                  <dl className="mt-5 max-w-md text-sm">
                    {[
                      ["Booths", String(floor.boothSpots.length)],
                      ["Admission", locked ? `${TIER_LABEL[floor.tier]}, ${TIER_PRICE[floor.tier]}` : "Free"],
                      ["Stands held for newcomers", floor.reservedSpot !== undefined ? "One" : "None"],
                      ["Tears down", "Never"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-baseline gap-2 py-1.5">
                        <dt className="shrink-0 text-muted">{k}</dt>
                        <span aria-hidden="true" className="leader dash-x" />
                        <dd className="shrink-0 tabular-nums text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  <Link
                    href={`/floor/${floor.id}`}
                    className="mt-5 inline-block text-sm text-accent hover:underline"
                  >
                    Walk into {floor.name} →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      {/* ============================================ 04 — THE BOARD */}
      <Section
        n="05"
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
                  style={{ backgroundColor: rank.color, boxShadow: `0 0 10px ${rank.color}66` }}
                />
                <Spec className="text-paper">{rank.name}</Spec>
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
              <span className="col-span-2 text-sm leading-relaxed text-paper/60 sm:col-span-1">
                {rank.blurb}
              </span>
            </div>
          ))}
        </div>
        <Spec className="mt-5 block text-paper/40">
          Gold is self-reported in this beta. Verification is the roadmap
        </Spec>
      </Section>

      {/* ============================================ 05 — ADMISSION */}
      <Section
        n="06"
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
        n="07"
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
                <Spec className="text-muted">{String(col.rows.length).padStart(2, "0")}</Spec>
              </div>
              <ul className="mt-1">
                {col.rows.map(([head, tail]) => (
                  <li
                    key={head}
                    className="flex gap-3 border-b border-line/60 py-3.5 text-sm leading-relaxed text-muted last:border-b-0"
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
        n="08"
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
                <span className="flex-1 text-[0.95rem] font-medium text-ink">{item.q}</span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg leading-none text-muted transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-5 pl-12 pr-8 text-sm leading-relaxed text-muted">
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
              <Spec className="text-gold">Closing time: there isn&rsquo;t one</Spec>
              <h2
                id="cta-heading"
                className="mt-4 max-w-xl font-display text-[2.3rem] leading-[1.1] text-paper sm:text-[3.1rem]"
              >
                The doors are propped open. They stay that way.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-paper/60">
                No badge, no lanyard, no schedule. The founders are at their
                booths.
              </p>
              <Link
                href="/lobby"
                className="btn-press mt-8 inline-block rounded-md bg-accent-strong px-7 py-3.5 text-sm font-medium text-white shadow-card hover:bg-accent-strong/90"
              >
                Walk the floor →
              </Link>
            </div>

            {/* Not everyone is ready today. Without this the visit ends here
                and there is no second one — the list is the only way back. */}
            <div className="relative self-end border border-paper/20 p-6">
              <CropMarks tone="paper" />
              <Spec className="text-gold">Or come back when it&rsquo;s busy</Spec>
              <p className="mt-3 text-sm leading-relaxed text-paper/70">
                The floors fill up every Sunday at 18:00 CET. Leave an
                address and we&rsquo;ll tell you when it&rsquo;s worth walking
                in. No newsletter, no drip campaign.
              </p>
              <div className="mt-4 [&_input]:border-paper/25 [&_input]:bg-paper/10 [&_input]:text-paper [&_input]:placeholder:text-paper/40 [&_p]:text-paper/50">
                <EmailCapture variant="list" source="landing" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
