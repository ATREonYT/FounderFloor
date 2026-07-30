import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Legal Notice — FounderFloor",
  description:
    "Provider identification for FounderFloor: who operates the service and how to reach them.",
};

/**
 * Provider identification (EU e-commerce directive; "Impressum" in
 * Germany/Austria). The identity fields come from env vars so the
 * operator's personal details never live in the public repository:
 *
 *   NEXT_PUBLIC_LEGAL_NAME     e.g. "Jane Doe"
 *   NEXT_PUBLIC_LEGAL_ADDRESS  e.g. "Musterstraße 1, 12345 Berlin, Germany"
 *                              (use "\n" or ", " between lines)
 *   NEXT_PUBLIC_LEGAL_EMAIL    defaults to CONTACT_EMAIL (lib/contact.ts)
 *   NEXT_PUBLIC_LEGAL_VATID    optional, e.g. "DE123456789"
 *
 * Set them in Vercel and redeploy. Until they are set, the page says the
 * details are available on request — NOT compliant as a resting state, so
 * set them before public launch.
 */

const NAME = process.env.NEXT_PUBLIC_LEGAL_NAME || "";
const ADDRESS = process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "";
const EMAIL = process.env.NEXT_PUBLIC_LEGAL_EMAIL || CONTACT_EMAIL;
const VATID = process.env.NEXT_PUBLIC_LEGAL_VATID || "";

export default function ImprintPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="micro text-muted">PROVIDER IDENTIFICATION</p>
        <h1 className="mt-1 font-display text-3xl">Legal Notice</h1>
      </header>

      <section aria-label="Operator" className="panel p-6">
        <h2 className="font-display text-xl">Service provider</h2>
        <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted">
          {NAME ? (
            <p>
              FounderFloor (founderfloor.net) is operated by:
              <br />
              <span className="text-ink">{NAME}</span>
              {ADDRESS &&
                ADDRESS.split("\\n").map((line) => (
                  <span key={line}>
                    <br />
                    {line}
                  </span>
                ))}
            </p>
          ) : (
            <p>
              FounderFloor (founderfloor.net) is operated by its founder.
              Full provider identification is available on request via the
              email below and is being added to this page.
            </p>
          )}
          <p>
            Email:{" "}
            <a href={`mailto:${EMAIL}`} className="text-accent hover:underline">
              {EMAIL}
            </a>
            <br />
            Responses usually within a few days.
          </p>
          {VATID && <p>VAT ID: {VATID}</p>}
        </div>
      </section>

      <section aria-label="Content and disputes" className="panel p-6">
        <h2 className="font-display text-xl">Content, reports & disputes</h2>
        <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted">
          <p>
            Stands, pitches, guestbook entries, chat and other user content
            are published by the visitors who write them. To report illegal
            content or an infringement of your rights, use the in-app report
            function or email{" "}
            <a href={`mailto:${EMAIL}`} className="text-accent hover:underline">
              {EMAIL}
            </a>{" "}
            — this address also serves as the single point of contact for
            authorities and users under the EU Digital Services Act. Reports
            are reviewed and, where warranted, content is removed; see the{" "}
            <Link href="/terms" className="text-accent hover:underline">
              Terms of Service
            </Link>{" "}
            for the rules applied.
          </p>
          <p>
            The operator is neither obliged nor willing to participate in
            dispute-settlement proceedings before a consumer arbitration
            board. (The European Commission&rsquo;s online dispute resolution
            platform was discontinued in July 2025.)
          </p>
        </div>
      </section>

      <p className="text-xs text-muted">
        <Link href="/terms" className="text-accent hover:underline">
          Terms of Service
        </Link>{" "}
        &middot;{" "}
        <Link href="/privacy" className="text-accent hover:underline">
          Privacy Policy
        </Link>{" "}
        &middot;{" "}
        <Link href="/" className="text-accent hover:underline">
          Back to the floor
        </Link>
      </p>
    </main>
  );
}
