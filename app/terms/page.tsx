import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — FounderFloor",
  description:
    "The rules of the floor: your account, your content, our IP, what's not allowed, and the legal fine print.",
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

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="micro text-muted">EFFECTIVE 22 JULY 2026</p>
        <h1 className="mt-1 font-display text-3xl">Terms of Service</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          These terms are the agreement between you and FounderFloor&rsquo;s
          operator when you use the site. They&rsquo;re written to be read,
          not to hide things. Using FounderFloor means you accept them.
        </p>
      </header>

      <Section title="1. The service">
        <p>
          FounderFloor is a walkable 2D expo floor for startups: you can walk
          the halls, talk to people, claim a stand, and connect with other
          founders. It is provided as an early-stage beta by a single
          operator, free at its core, with optional paid visibility perks.
        </p>
        <p>
          It is <strong>not</strong> an investment platform, a marketplace,
          a broker, or a source of financial, legal, or professional advice.
          Revenue ranks are labeled &ldquo;verified&rdquo; on the floor but
          are <strong>simulated in this build</strong> — founders self-report
          them. Do your own diligence on anyone you meet here, exactly as you
          would at a physical expo.
        </p>
      </Section>

      <Section title="2. Your account">
        <p>
          Accounts are optional. If you create one, keep your password to
          yourself, give a real email you control, and don&rsquo;t
          impersonate anyone. You are responsible for what happens under your
          account; if you think it&rsquo;s been compromised, reset your
          password — that signs out every other session. One account per
          person. You must be at least 16 to create an account.
        </p>
      </Section>

      <Section title="3. Your content">
        <p>
          What you publish — your stand, pitch, guestbook entries, messages —
          stays <strong>yours</strong>. By publishing it on FounderFloor you
          grant the operator a non-exclusive, worldwide, royalty-free license
          to host, store, display, and transmit it, solely as needed to run
          the service (for example, showing your stand to visitors walking
          the floor). The license ends when you delete the content or your
          account, except for the short backup window described in the{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <p>
          You promise your content is yours to publish and doesn&rsquo;t
          infringe anyone else&rsquo;s rights. If someone&rsquo;s content on
          the floor infringes yours, report it in-app or email{" "}
          <a href="mailto:ak@founder-floor.com" className="text-accent hover:underline">
            ak@founder-floor.com
          </a>{" "}
          and it will be reviewed and, where warranted, removed.
        </p>
      </Section>

      <Section title="4. Our property">
        <p>
          Everything that makes up FounderFloor itself — the software, the
          pixel art, the design, the name, the logo, the text, and the
          service as a whole — is the property of the operator and protected
          by copyright and other intellectual-property laws. All rights are
          reserved. You may not copy, scrape, reproduce, resell, or build a
          derivative service from any part of it without prior written
          permission. Using the site grants you a personal, revocable,
          non-transferable right to use it as intended, and nothing more.
        </p>
      </Section>

      <Section title="5. Rules of the floor">
        <p>You agree not to:</p>
        <p>
          &bull; harass, threaten, or defraud other visitors;
          <br />
          &bull; post content that is illegal, hateful, or infringes
          others&rsquo; rights;
          <br />
          &bull; misrepresent your identity, your startup, or your numbers in
          a way designed to deceive;
          <br />
          &bull; probe, overload, disrupt, or attempt to gain unauthorized
          access to the service or other people&rsquo;s accounts;
          <br />
          &bull; scrape the site or collect other visitors&rsquo; data by
          automated means;
          <br />
          &bull; use the service to send spam or unsolicited promotion
          outside your own stand.
        </p>
        <p>
          The operator may remove content, free up stands, and suspend or
          terminate accounts that break these rules — with notice where
          practical, immediately where necessary.
        </p>
      </Section>

      <Section title="6. Payments">
        <p>
          The free tier is free permanently. Paid memberships buy visibility,
          never access. When live billing is enabled, payments are processed
          by Stripe under its own terms; prices and what they include are
          shown before you pay. Where required by law (including EU consumer
          law), you have a 14-day right of withdrawal for digital
          subscriptions, except to the extent you consent to immediate
          performance. If billing is not yet live, the membership page says
          so and nothing is charged.
        </p>
        <p>
          <strong>Tickets.</strong> Tickets are a virtual in-game currency
          for cosmetic items. They have no monetary value, are not
          transferable, and cannot be exchanged back into money. Everything
          tickets buy can also be earned free by playing. Ticket packs are
          digital content <strong>delivered in full immediately</strong> upon
          payment — by purchasing, you expressly consent to immediate
          delivery and acknowledge that your statutory right of withdrawal
          ends once delivery has begun.{" "}
          <strong>
            All ticket purchases are therefore final and non-refundable
          </strong>
          , to the extent permitted by law. This doesn&rsquo;t limit
          statutory rights that cannot be waived — if a purchase fails to
          deliver, contact the operator and it will be made right. If the
          service is discontinued, remaining tickets expire without
          compensation; the operator will give reasonable notice where
          practical.
        </p>
      </Section>

      <Section title="7. The service is provided as-is">
        <p>
          FounderFloor is a beta run by one person. It is provided{" "}
          <strong>&ldquo;as is&rdquo; and &ldquo;as available&rdquo;</strong>,
          without warranties of any kind, express or implied — including
          uptime, fitness for a particular purpose, or that other
          visitors&rsquo; claims about themselves are accurate. Features may
          change or be withdrawn.
        </p>
        <p>
          To the maximum extent permitted by law, the operator&rsquo;s total
          liability for any claim arising out of the service is limited to
          the amount you paid for it in the 12 months before the claim (which
          is zero on the free tier). Nothing in these terms limits liability
          that cannot lawfully be limited — including liability for intent,
          gross negligence, or injury to life, body, or health.
        </p>
      </Section>

      <Section title="8. Ending things">
        <p>
          You can stop using FounderFloor at any time and request full
          deletion of your data (see the{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          ). The operator can suspend or terminate accounts that violate
          these terms, and may discontinue the service with reasonable
          notice.
        </p>
      </Section>

      <Section title="9. Governing law & changes">
        <p>
          These terms are governed by the law of the operator&rsquo;s country
          of residence, without prejudice to mandatory consumer protections
          of the country you live in. If a court finds part of these terms
          unenforceable, the rest still stands. When these terms change in a
          way that matters, the effective date above changes and significant
          changes will be flagged on the site; continued use after a change
          means the new version applies.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          Questions about these terms:{" "}
          <a href="mailto:ak@founder-floor.com" className="text-accent hover:underline">
            ak@founder-floor.com
          </a>{" "}
          or the in-app feedback box.
        </p>
      </Section>

      <p className="text-xs text-muted">
        <Link href="/privacy" className="text-accent hover:underline">
          Privacy Policy
        </Link>{" "}
        &middot;{" "}
        <Link href="/about" className="text-accent hover:underline">
          About
        </Link>{" "}
        &middot;{" "}
        <Link href="/" className="text-accent hover:underline">
          Back to the floor
        </Link>
      </p>
    </main>
  );
}
