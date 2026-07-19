import type { Metadata } from "next";
import Link from "next/link";
import FeedbackBox from "@/components/FeedbackBox";

export const metadata: Metadata = {
  title: "About — FounderFloor",
  description:
    "What FounderFloor is, what it stores, what it emails you, what costs money, and how it's secured. Plain words, no surprises.",
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

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="micro text-muted">THE FINE PRINT, KEPT SHORT</p>
        <h1 className="mt-1 font-display text-3xl">About FounderFloor</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          A walkable 2D expo floor for startups. You walk in, read the signs,
          talk to founders, and connect with the ones worth remembering. This
          page covers everything: what the site is, what it stores, what it
          emails you, what costs money, and how it&rsquo;s secured — because a
          site that asks for your trust should say so in plain words.
        </p>
      </header>

      <Section title="What this is (and isn't)">
        <p>
          FounderFloor is an early, self-hosted project run by one person. It
          is not an investment platform, a marketplace, or a source of advice
          of any kind. Conversations here are conversations — do your own
          diligence on anyone you meet, the same as at a physical expo.
        </p>
        <p>
          <strong>Everyone here is real.</strong> Every stand on every floor
          was set up by an actual person, and every avatar walking around is a
          live visitor. There are no bots, no fake booths, no seeded
          &ldquo;example&rdquo; startups. If a floor looks empty, it&rsquo;s
          because it is — claim a spot and change that.
        </p>
        <p>
          <strong>What startups say about themselves is theirs.</strong>{" "}
          Pitches, one-liners, categories and goals are typed by the founder
          at the stand, unreviewed. Revenue ranks are labeled
          &ldquo;verified&rdquo; on the floor; in this build verification is{" "}
          <strong>simulated</strong> — founders type a number and the badge
          follows. Every page that shows a rank says so. Live Stripe-based
          verification is the plan, not the present.
        </p>
      </Section>

      <Section title="Accounts and the emails we send">
        <p>
          <strong>Accounts are optional and free.</strong> You can walk the
          floors, chat, and connect as a guest — your identity is protected by
          a secret held in your browser. An account (email + password) makes
          that identity portable: sign in anywhere and your booth, connections,
          streaks and badges come with you, and nobody can take your name.
        </p>
        <p>
          <strong>If you make an account</strong>, the server stores your
          email address, display name, and a salted scrypt hash of your
          password — never the password itself. Sessions expire after 30 days
          of disuse.
        </p>
        <p>
          <strong>Your email is used for exactly three things:</strong> a
          welcome note when the account is created, a password-reset link when
          you ask for one, and a heads-up if your account is signed in from a
          browser it hasn&rsquo;t used before. No newsletters, no marketing,
          no sharing with anyone, and it is never shown to other visitors.
          Delivery runs through Resend, an email-sending service — that is the
          only third party that ever sees your address.
        </p>
      </Section>

      <Section title="What gets stored, and where">
        <p>
          <strong>In your browser (localStorage):</strong> your display name,
          avatar, booth design, quests, badges, notes on connections, and — if
          you have an account — a session token. Clearing site data removes it
          from that device.
        </p>
        <p>
          <strong>Progress sync:</strong> the same profile data (booth,
          badges, quests, streaks, membership tier) is also saved to the floor
          server under your identity, so signing in on another device brings
          it with you. It expires after 180 days of inactivity, and a deletion
          request removes it.
        </p>
        <p>
          <strong>On the floor server:</strong> what other people need to see
          or that has to survive your absence — your stand (it stays up for 7
          days while you&rsquo;re away, then the spot frees up), guestbook
          entries, the activity ticker, connection requests and mutual
          connections, direct messages with your connections (latest 100 per
          thread), beta feedback, and abuse reports. Floor chat is relayed
          live to the people in the hall and not stored.
        </p>
        <p>
          <strong>Not collected at all:</strong> no tracking pixels, no
          analytics scripts, no ad tech, no cookies beyond what the site
          itself needs to function.
        </p>
      </Section>

      <Section title="Stands, floors, and fair play">
        <p>
          Every spot on every floor is first come, first served. Claim a
          stand and it&rsquo;s yours: your colors, your banner, your sign,
          your pitch. Close the tab and it stays up for a week — visitors can
          read your pitch, sign your guestbook, and request to connect while
          you&rsquo;re away. Come back within 7 days and the clock resets;
          stay away longer and the spot opens up for the next founder.
        </p>
        <p>
          One stand per person per floor. Setting up a startup also lists it
          in the directory automatically, under whatever category you typed —
          that&rsquo;s where people find you when they&rsquo;re not walking.
        </p>
      </Section>

      <Section title="What costs money (and what never will)">
        <p>
          Walking the floors, talking, connecting, claiming a stand, and
          appearing in the directory are free, permanently. Paid memberships
          (Pro and Founder+) buy <em>visibility</em> — priority placement in
          the directory and co-founder board, member tags, gold banner trim —
          never access. If the payment buttons aren&rsquo;t connected to live
          billing yet, the membership page says so honestly and nothing is
          charged.
        </p>
      </Section>

      <Section title="Security, honestly stated">
        <p>
          Everything between your browser and the servers travels over
          HTTPS/TLS — the same encryption your bank uses. Passwords are
          hashed with scrypt (salted, memory-hard — designed so that even the
          server operator cannot read them, and cracking them at scale is
          economically absurd). Sign-in attempts are rate-limited, sessions
          are unguessable random tokens, guest identities are bound to a
          browser-held secret, and everything anyone types is sanitized
          before other people see it.
        </p>
        <p>
          Honesty also requires this sentence: no system on earth is
          &ldquo;unhackable,&rdquo; and anyone who promises otherwise is
          selling something. What you can hold us to: we store the minimum,
          we hash what must be secret, we alert you when your account signs
          in somewhere new, and a password reset instantly locks out every
          other session. If you ever suspect your account is compromised,
          reset your password — that alone evicts an intruder.
        </p>
      </Section>

      <Section title="Moderation">
        <p>
          Every player card has a Report option. Reports go straight to the
          operator (stored, and emailed) and are reviewed by hand. Mute is
          instant and local. The operator can remove stands, guestbook
          entries, and accounts that abuse the floor. Be the kind of person
          you&rsquo;d want at the booth next to yours.
        </p>
      </Section>

      <section aria-label="Feedback" id="feedback" className="panel scroll-mt-6 p-6">
        <h2 className="font-display text-xl">Beta feedback</h2>
        <p className="mb-4 mt-3 text-sm leading-relaxed text-muted">
          This is a beta — the fastest way to shape what gets built next is
          to say something. It goes straight to the person who builds this.
        </p>
        <FeedbackBox />
      </section>

      <Section title="Contact & deletion">
        <p>
          Questions, deletion requests, or something on the floor that
          shouldn&rsquo;t be there: use the Report option in-game or the
          feedback box above — both reach the operator directly. Deletion
          requests are honored in full: everything above is either in your
          browser (yours to clear) or on one server (ours to delete on
          request).
        </p>
      </Section>

      <p className="text-xs text-muted">
        <Link href="/" className="text-accent hover:underline">
          Back to the floor
        </Link>
      </p>
    </main>
  );
}
