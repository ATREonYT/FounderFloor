import Link from "next/link";
import { FLOORS } from "@/lib/data/floors";
import { RANKS } from "@/lib/ranks";
import { TIER_ORDER, type GlyphId, type SubTier } from "@/lib/types";
import TierTag, { TIER_LABEL, TIER_PRICE, TIER_PRICE_ANNUAL } from "@/components/TierTag";
import { FOUNDING_OFFER, TIER_PERKS, annualFreeMonths } from "@/lib/pricing";
import PixelGlyph from "@/components/PixelGlyph";
import HeroScene from "@/components/HeroScene";
import LiveStats from "@/components/LiveStats";
import Reveal from "@/components/Reveal";
import FloorThumb from "@/components/FloorThumb";

const TICKER_ITEMS = [
  "WALK IN",
  "TALK TO FOUNDERS",
  "CLAIM A STAND",
  "SIGN GUESTBOOKS",
  "EARN BADGES",
  "FIND A CO-FOUNDER",
  "NO CALENDAR INVITE",
];

/** Expo-signage ticker: the item list rendered twice for a seamless loop. */
function Ticker() {
  const row = (key: string, hidden: boolean) => (
    <span key={key} aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {TICKER_ITEMS.map((item) => (
        <span key={item} className="micro flex items-center text-muted">
          <span className="px-5">{item}</span>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-accent/60" />
        </span>
      ))}
    </span>
  );
  return (
    <div className="marquee overflow-hidden border-b border-line bg-panel py-2" role="marquee">
      <div className="marquee-track flex w-max">
        {row("a", false)}
        {row("b", true)}
      </div>
    </div>
  );
}

function money(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

const STEPS: { title: string; body: string; glyph: GlyphId }[] = [
  {
    title: "Walk in",
    glyph: "bolt",
    body: "Pick a name, pick a face, pick a floor. Arrow keys — or just tap where you want to go. No calendar invite, no badge scanner.",
  },
  {
    title: "Talk to founders",
    glyph: "wave",
    body: "Every booth has a person behind it. Walk up, press E, ask what they actually do. They will tell you, briefly.",
  },
  {
    title: "Connect",
    glyph: "heart",
    body: "If it's worth remembering, hit Connect. The list lives in your profile, not in a CRM you'll never open.",
  },
];

const PRICING: { tier: SubTier; blurb: string }[] = [
  { tier: "free", blurb: "The public floors. Plenty to see." },
  {
    tier: "pro",
    blurb: "Everything in Free, plus the floors where deals get quieter.",
  },
  {
    tier: "founder",
    blurb: "Every floor, including the ones with a velvet rope.",
  },
];

function Eyebrow({ n, children, dark = false }: { n: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`micro flex items-center gap-2 ${dark ? "text-gold" : "text-accent"}`}>
      <span className={`inline-block h-px w-6 ${dark ? "bg-gold/60" : "bg-accent/50"}`} />
      {n} · {children}
    </p>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-sm border border-line bg-panel px-1.5 py-0.5 font-mono text-xs text-ink">
      {children}
    </kbd>
  );
}

export default function LandingPage() {
  const maxRevenue = Math.max(...RANKS.map((r) => r.minRevenue), 1);

  return (
    <main>
      {/* expo signage: a slow ticker sets the tone before a word is read */}
      <Ticker />

      {/* hero — two columns on desktop so the pixel scene fills the space
          beside the copy; the copy column staggers in, the headline's key
          phrase gets a sweeping accent underline, and the scene floats
          gently inside a framed panel */}
      <section className="border-b border-line">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-12 pt-14 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
          <div className="stagger-children">
            <p className="micro flex items-center gap-2 text-muted">
              <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-accent" />
              A walkable expo for startups
            </p>
            <h1 className="mt-4 font-display text-4xl leading-tight sm:text-[3.4rem] sm:leading-[1.08]">
              A trade-show floor that{" "}
              <span className="sweep-underline">never tears down</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
              FounderFloor is a small 2D world where startups keep a booth and
              real founders stand at it. You walk around, you read the signs,
              you talk to people. Ranks come from verified revenue, so the
              booth with the gold badge earned it the boring way.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/lobby"
                className="btn-press rounded-md bg-accent px-6 py-3 text-sm font-medium text-white shadow-[0_2px_0_rgba(35,32,26,0.25)] hover:bg-accent/90"
              >
                Walk the floor →
              </Link>
              <Link
                href="/profile#booth"
                className="btn-press rounded-md border border-ink px-6 py-3 text-sm font-medium text-ink hover:bg-panel"
              >
                Set up a booth
              </Link>
            </div>
            <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Kbd>W A S D</Kbd> walk
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>E</Kbd> talk
              </span>
              <span>Nothing to install. Free to walk in.</span>
            </p>
          </div>
          <div className="anim-in">
            <div className="float-slow">
              <div className="relative overflow-hidden rounded-lg border border-ink/20 shadow-[0_2px_6px_rgba(35,32,26,0.08),0_18px_40px_rgba(35,32,26,0.12)]">
                <HeroScene className="lg:h-[400px]" />
                <span className="micro absolute left-3 top-3 rounded-sm border border-ink/15 bg-paper/85 px-2 py-1 text-muted backdrop-blur-[2px]">
                  MAIN HALL · AMBIENT VIEW
                </span>
              </div>
            </div>
            <p className="micro mt-3 text-muted">
              The real one takes WASD, arrow keys, or taps.
            </p>
          </div>
        </div>

        {/* live pulse: real numbers from the floor server, counting up */}
        <div className="mx-auto w-full max-w-6xl px-4 pb-12">
          <LiveStats />
        </div>
      </section>

      {/* how it works */}
      <section aria-labelledby="how-heading" className="border-b border-line bg-panel">
        <Reveal className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
          <Eyebrow n="01">The whole idea</Eyebrow>
          <h2 id="how-heading" className="mt-2 font-display text-3xl sm:text-4xl">
            How it works
          </h2>
          <ol className="stagger-children mt-10 grid gap-4 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="card-lift relative overflow-hidden rounded-md border border-line bg-paper p-6"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-2 -top-6 select-none font-display text-[88px] leading-none text-ink/[0.05]"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-accent/25 bg-accent-soft">
                  <PixelGlyph glyph={step.glyph} size={18} color="#D9480F" />
                </span>
                <h3 className="mt-5 font-display text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      {/* the map of the site — four surfaces, one sentence each */}
      <section aria-labelledby="around-heading" className="border-b border-line">
        <Reveal className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
          <Eyebrow n="02">The map</Eyebrow>
          <h2 id="around-heading" className="mt-2 font-display text-3xl sm:text-4xl">
            Find your way around
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Four places, each with one job. Everything you do in one shows up
            in the others.
          </p>
          <div className="stagger-children mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "/lobby",
                glyph: "cube" as const,
                name: "Floors",
                blurb: "The halls themselves. Walk in, browse booths, talk to whoever's there.",
                action: "Walk a floor",
              },
              {
                href: "/directory",
                glyph: "star" as const,
                name: "Directory",
                blurb: "Every startup on every floor, searchable. One click walks you to their booth.",
                action: "Search startups",
              },
              {
                href: "/connections",
                glyph: "heart" as const,
                name: "Connections",
                blurb: "The people you've met. Requests, accepts, and chats that work from anywhere.",
                action: "Open your rolodex",
              },
              {
                href: "/profile",
                glyph: "bolt" as const,
                name: "Profile",
                blurb: "Your name, your booth, your quests and badges — and an account if you want one.",
                action: "Set yourself up",
              },
            ].map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="panel card-lift group flex flex-col p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-paper">
                    <PixelGlyph glyph={s.glyph} size={16} color="#D9480F" />
                  </span>
                  <span className="micro text-muted">{s.name}</span>
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">
                  {s.blurb}
                </p>
                <span className="mt-4 text-sm text-accent group-hover:underline">
                  {s.action} →
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      {/* floors */}
      <section aria-labelledby="floors-heading" className="border-b border-line">
        <Reveal className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
          <Eyebrow n="03">The halls</Eyebrow>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <h2 id="floors-heading" className="font-display text-3xl sm:text-4xl">
              The floors
            </h2>
            <Link href="/lobby" className="text-sm text-accent hover:underline">
              Enter the lobby
            </Link>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Four halls, four temperaments. Each one is a real map with real
            booths; the miniatures below are to scale.
          </p>
          <div className="stagger-children mt-8 grid gap-4 sm:grid-cols-2">
            {FLOORS.filter((f) => !f.hidden).map((floor) => {
              const locked = TIER_ORDER[floor.tier] > TIER_ORDER.free;
              return (
                <article
                  key={floor.id}
                  className={`panel card-lift flex flex-col gap-4 p-5 sm:flex-row sm:gap-5 ${
                    locked ? "bg-paper/50" : ""
                  }`}
                >
                  <FloorThumb
                    floor={floor}
                    className={`self-start rounded-sm border border-line ${
                      locked ? "opacity-70" : ""
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        className={`font-display text-lg leading-snug ${
                          locked ? "text-muted" : ""
                        }`}
                      >
                        {floor.name}
                      </h3>
                      <TierTag tier={floor.tier} />
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      {floor.tagline}
                    </p>
                    <p className="micro mt-3 text-muted">
                      {floor.boothSpots.length} booths
                      {floor.reservedSpot !== undefined ? " · one left open for newcomers" : ""}
                      {locked
                        ? ` · requires ${TIER_LABEL[floor.tier]}, ${TIER_PRICE[floor.tier]}`
                        : ""}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* rank ladder — the soul of the product, staged as a dark revenue
          board: gold on ink, like the tote board at the back of a real hall */}
      <section aria-labelledby="ranks-heading" className="border-b border-line bg-ink">
        <Reveal className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
          <Eyebrow n="04" dark>The board</Eyebrow>
          <h2 id="ranks-heading" className="mt-2 font-display text-3xl text-paper sm:text-4xl">
            The rank ladder
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper/60">
            Ranks are set by verified monthly revenue, read through a read-only
            Stripe connection &mdash; nobody types their own number. This build
            simulates the connection; the skepticism is real.
          </p>
          <div className="stagger-children mt-10 flex flex-col divide-y divide-paper/10 border-y border-paper/15">
            {RANKS.map((rank) => (
              <div
                key={rank.id}
                className="grid items-center gap-x-6 gap-y-2 py-4 sm:grid-cols-[150px_minmax(0,1fr)_minmax(0,1.2fr)]"
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: rank.color, boxShadow: `0 0 10px ${rank.color}66` }}
                  />
                  <span className="micro text-paper">{rank.name}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="w-24 shrink-0 font-display text-lg tabular-nums text-gold">
                    {money(rank.minRevenue)}+
                  </span>
                  <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-paper/10">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.max(4, (rank.minRevenue / maxRevenue) * 100)}%`,
                        background: `linear-gradient(90deg, ${rank.color}88, ${rank.color})`,
                      }}
                    />
                  </span>
                </span>
                <span className="text-sm leading-relaxed text-paper/60">{rank.blurb}</span>
              </div>
            ))}
          </div>
          <p className="micro mt-6 text-paper/40">
            GOLD IS EARNED THE BORING WAY &mdash; ONE VERIFIED DOLLAR AT A TIME
          </p>
        </Reveal>
      </section>

      {/* pricing */}
      <section aria-labelledby="pricing-heading" className="border-b border-line">
        <Reveal className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
          <Eyebrow n="05">What costs money</Eyebrow>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <h2 id="pricing-heading" className="font-display text-3xl sm:text-4xl">
              Membership
            </h2>
            <span className="micro rounded-sm border border-line px-1.5 py-0.5 text-muted">
              beta &mdash; billing goes live at launch
            </span>
          </div>

          {/* founding member strip — the launch offer, capped on purpose */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-gold/60 bg-panel px-4 py-3">
            <p className="text-sm">
              <span className="font-display">Founding Member</span>
              <span className="text-muted">
                {" "}
                — ${FOUNDING_OFFER.price} once: a year of Founder+, your price
                locked for life, a numbered badge. First {FOUNDING_OFFER.cap}{" "}
                people only.
              </span>
            </p>
            <Link
              href="/profile#membership"
              className="rounded-md border border-ink px-3 py-1.5 text-sm hover:bg-paper"
            >
              Claim a number
            </Link>
          </div>

          <div className="stagger-children mt-6 grid gap-4 sm:grid-cols-3">
            {PRICING.map(({ tier, blurb }) => {
              const unlocked = FLOORS.filter(
                (f) => !f.hidden && TIER_ORDER[f.tier] <= TIER_ORDER[tier],
              );
              const [amount, per] = TIER_PRICE[tier].split("/");
              return (
                <article
                  key={tier}
                  className={`panel card-lift relative flex flex-col p-5 ${
                    tier === "pro"
                      ? "border-accent/60 shadow-card sm:-translate-y-2"
                      : ""
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-lg">{TIER_LABEL[tier]}</h3>
                    {tier === "pro" ? (
                      <span className="micro text-accent">the sensible one</span>
                    ) : null}
                  </div>
                  <p className="mt-2 font-display text-3xl">
                    {amount}
                    {per ? (
                      <span className="ml-1 font-body text-sm text-muted">/ {per}</span>
                    ) : null}
                  </p>
                  {tier !== "free" && (
                    <p className="micro mt-1 text-muted">
                      or {TIER_PRICE_ANNUAL[tier]} — {annualFreeMonths(tier)} months free
                    </p>
                  )}
                  <p className="mt-3 text-sm leading-relaxed text-muted">{blurb}</p>
                  <ul className="mt-4 flex-1 space-y-1.5">
                    {unlocked.map((f) => (
                      <li key={f.id} className="flex items-center gap-2 text-sm">
                        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-verify" />
                        {f.name}
                      </li>
                    ))}
                    {TIER_PERKS[tier].map((perk) => (
                      <li key={perk} className="flex items-center gap-2 text-sm text-muted">
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 shrink-0 ${
                            tier === "founder" ? "bg-gold" : "bg-accent/60"
                          }`}
                        />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/profile#membership"
                    className="mt-5 rounded-md border border-ink px-4 py-2 text-center text-sm hover:bg-paper"
                  >
                    Choose {TIER_LABEL[tier]}
                  </Link>
                </article>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* what's next — the build is alive; give people a reason to check back */}
      <section id="roadmap" aria-labelledby="next-heading" className="scroll-mt-6 border-t border-line">
        <Reveal className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
          <Eyebrow n="06">Shipping weekly</Eyebrow>
          <h2 id="next-heading" className="mt-2 font-display text-3xl sm:text-4xl">
            The floor keeps changing
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            This place ships weekly. Walk in after a few days away and the
            lobby will tell you what you missed.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="panel p-6">
              <p className="micro text-verify">Landed recently</p>
              <ul className="mt-3 flex flex-col gap-2.5 text-sm leading-relaxed text-muted">
                <li>
                  <span className="text-ink">A directory that grows itself</span>{" "}
                  — every startup someone creates shows up, with its category
                  as a new filter, the moment they save it.
                </li>
                <li>
                  <span className="text-ink">Chats that follow you</span> —
                  message a connection from anywhere; they get a pixel-mail
                  ping whether they&rsquo;re on a floor or in a menu.
                </li>
                <li>
                  <span className="text-ink">Your own banner logo</span> — any
                  image, shrunk to a 16&times;16 mark on your stand.
                </li>
                <li>
                  <span className="text-ink">Your progress, everywhere</span>{" "}
                  — booth, quests, badges, and streaks now follow your
                  account across devices.
                </li>
                <li>
                  <span className="text-ink">Smooth on any machine</span> —
                  the floor now tunes its render resolution to your hardware.
                </li>
                <li>
                  <span className="text-ink">Real email accounts</span> —
                  sign in with your email, reset a forgotten password, and
                  get an alert if your account signs in somewhere new.
                </li>
              </ul>
            </div>
            <div className="panel p-6">
              <p className="micro text-accent">Being built</p>
              <ul className="mt-3 flex flex-col gap-2.5 text-sm leading-relaxed text-muted">
                <li>
                  <span className="text-ink">Real revenue verification</span>{" "}
                  — a read-only Stripe connection, so the gold badges stop
                  being simulated and start being earned.
                </li>
                <li>
                  <span className="text-ink">A real events calendar</span> —
                  Demo Night gets siblings: pitch hours, category meetups,
                  co-founder speed-walking.
                </li>
                <li>
                  <span className="text-ink">Bigger halls</span> — new floors
                  open as the existing ones fill with real stands.
                </li>
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* questions people actually have, answered before they have to ask */}
      <section aria-labelledby="faq-heading" className="border-b border-line bg-panel">
        <Reveal className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-20">
          <Eyebrow n="07">Before you ask</Eyebrow>
          <h2 id="faq-heading" className="mt-2 font-display text-3xl sm:text-4xl">
            Fair questions
          </h2>
          <div className="mt-6 flex flex-col divide-y divide-line border-y border-line">
            {[
              {
                q: "Is it actually free?",
                a: "Walking the floors, talking, connecting, and keeping a stand — free, permanently. Paid memberships buy visibility (priority in the directory, gold trim on your stand), never access.",
              },
              {
                q: "Are the people real?",
                a: "Yes — every stand is set up by a real founder and every avatar is a live visitor. The one exception is Pixel, the clearly-labeled tutorial robot, who never leaves the practice hall.",
              },
              {
                q: "What happens to my stand when I close the tab?",
                a: "It stays up for 7 days while you're away — collecting guestbook notes and connection requests. Come back within the week and the clock resets.",
              },
              {
                q: "Do I need an account?",
                a: "No — you can walk in as a guest with just a name. An account (free) makes your progress follow you across devices and lets you reset a forgotten password by email.",
              },
              {
                q: "What are the ranks on the booths?",
                a: "Monthly revenue tiers. They're labeled honestly: in this beta, verification is simulated — founders type a number. Read-only Stripe verification is the first post-beta feature.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group py-1">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    aria-hidden="true"
                    className="text-lg leading-none text-muted transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-4 pr-8 text-sm leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </section>

      {/* final CTA */}
      <section aria-labelledby="cta-heading" className="bg-ink">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 text-center sm:py-20">
          <h2
            id="cta-heading"
            className="mx-auto max-w-2xl font-display text-3xl leading-tight text-paper [text-wrap:balance] sm:text-4xl"
          >
            The doors are propped open. They stay that way.
          </h2>
          <p className="mt-4 text-sm text-paper/70">
            No badge, no lanyard, no schedule. The founders are at their booths.
          </p>
          <Link
            href="/lobby"
            className="btn-press mt-8 inline-block rounded-md bg-accent px-7 py-3.5 text-sm font-medium text-white shadow-[0_2px_0_rgba(0,0,0,0.35)] hover:bg-accent/90"
          >
            Walk the floor →
          </Link>
        </div>
      </section>
    </main>
  );
}
