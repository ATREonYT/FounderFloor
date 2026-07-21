import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — FounderFloor",
  description:
    "What FounderFloor collects, why, how long it's kept, who processes it, and your rights — including access and deletion.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="panel p-6">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="micro text-muted">EFFECTIVE 21 JULY 2026</p>
        <h1 className="mt-1 font-display text-3xl">Privacy Policy</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          This is the formal version of what the{" "}
          <Link href="/about" className="text-accent hover:underline">
            About page
          </Link>{" "}
          says in plain words. It describes what FounderFloor collects, why,
          how long it is kept, who processes it on our behalf, and the rights
          you have over it.
        </p>
      </header>

      <Section title="1. Who is responsible">
        <p>
          FounderFloor is operated by its founder (the &ldquo;operator&rdquo;),
          who acts as the data controller for the personal data described
          below. Contact for anything in this policy, including deletion
          requests:{" "}
          <a href="mailto:ak@founder-floor.com" className="text-accent hover:underline">
            ak@founder-floor.com
          </a>
          .
        </p>
      </Section>

      <Section title="2. What we collect, and why">
        <p>
          <strong>Account data</strong> (only if you create an account): your
          email address, display name, and a salted scrypt hash of your
          password — never the password itself. Used to operate your account,
          send the transactional emails listed in section 4, and let you
          recover access. Legal basis: performance of a contract (providing
          the account you asked for).
        </p>
        <p>
          <strong>Profile and progress data:</strong> your booth design,
          badges, quests, streaks, connection list, and membership tier,
          stored on the floor server so your progress follows you across
          devices. Legal basis: performance of a contract.
        </p>
        <p>
          <strong>Content you publish:</strong> your stand (name, pitch,
          category, design), guestbook entries, and direct messages with your
          mutual connections (latest 100 per thread). Legal basis: performance
          of a contract. Live floor chat is relayed to people in the hall and
          not stored.
        </p>
        <p>
          <strong>Feedback and abuse reports:</strong> stored on the server
          and forwarded to the operator&rsquo;s inbox so they can be acted
          on. Legal basis: legitimate interest in running and moderating the
          service.
        </p>
        <p>
          <strong>Technical data:</strong> IP addresses are used transiently
          for rate limiting and abuse prevention (for example, limiting
          sign-in attempts). They are not written into your profile and are
          not used for tracking or profiling. Legal basis: legitimate
          interest in keeping the service secure.
        </p>
        <p>
          <strong>What we do not collect:</strong> no analytics scripts, no
          tracking pixels, no advertising identifiers, no selling or renting
          of data — to anyone, ever.
        </p>
      </Section>

      <Section title="3. Storage in your browser">
        <p>
          The site keeps your display name, avatar, booth design, quests,
          badges, notes, and (if signed in) a session token in your
          browser&rsquo;s localStorage. This storage is strictly necessary
          for the site to function — it is not used for tracking, which is
          why there is no cookie banner. Clearing site data in your browser
          removes it from that device.
        </p>
      </Section>

      <Section title="4. Emails">
        <p>
          If you create an account, your email is used for exactly three
          things: a welcome note, password-reset links you request, and a
          security alert when your account signs in from a browser it
          hasn&rsquo;t used before. No newsletters, no marketing. Your email
          address is never shown to other visitors.
        </p>
      </Section>

      <Section title="5. Processors and hosting">
        <p>
          A small number of infrastructure providers process data on our
          behalf, only as needed to run the service:
        </p>
        <p>
          <strong>Hetzner Online GmbH</strong> (Germany) hosts the floor
          server, where account data, stands, messages, and synced progress
          live. <strong>Vercel Inc.</strong> (USA) hosts and serves the web
          pages. <strong>Resend</strong> (USA) delivers the transactional
          emails above and is the only third party that ever sees your email
          address. <strong>Cloudflare Inc.</strong> (USA) provides DNS for
          the domain. If paid memberships go live, payments will be handled
          by <strong>Stripe</strong>, which processes card details itself —
          card numbers never touch our servers.
        </p>
        <p>
          Where a provider is outside the EU/EEA, transfers rely on that
          provider&rsquo;s standard safeguards (EU Standard Contractual
          Clauses and/or the EU–US Data Privacy Framework, as applicable).
        </p>
      </Section>

      <Section title="6. How long data is kept">
        <p>
          Sessions expire after 30 days of disuse. Synced progress is deleted
          after 180 days of inactivity. A stand stays up for 7 days after you
          were last seen, then the spot frees up. Direct-message threads keep
          only the latest 100 messages. The server keeps 3 daily rotating
          backups of its data file, so deleted data leaves the backups within
          3 days. Account data is kept for as long as the account exists and
          deleted with it.
        </p>
      </Section>

      <Section title="7. Your rights">
        <p>
          You can ask for access to the data we hold about you, correction of
          anything wrong, deletion of everything, a portable copy, or
          restriction of processing — by emailing{" "}
          <a href="mailto:ak@founder-floor.com" className="text-accent hover:underline">
            ak@founder-floor.com
          </a>{" "}
          or using the in-app feedback box. Deletion requests are honored in
          full. If you are in the EU/EEA or UK, you also have the right to
          lodge a complaint with your local data-protection authority.
        </p>
      </Section>

      <Section title="8. Age">
        <p>
          FounderFloor is not directed at children. You must be at least 16
          years old (or the age of digital consent in your country, if
          higher) to create an account.
        </p>
      </Section>

      <Section title="9. Changes">
        <p>
          If this policy changes in a way that matters, the effective date at
          the top changes with it, and significant changes will be flagged on
          the site. Continued use after a change means the new version
          applies.
        </p>
      </Section>

      <p className="text-xs text-muted">
        <Link href="/terms" className="text-accent hover:underline">
          Terms of Service
        </Link>{" "}
        &middot;{" "}
        <Link href="/about" className="text-accent hover:underline">
          About (plain-words version)
        </Link>{" "}
        &middot;{" "}
        <Link href="/" className="text-accent hover:underline">
          Back to the floor
        </Link>
      </p>
    </main>
  );
}
