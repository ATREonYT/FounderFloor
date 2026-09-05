/**
 * The drawer: documents drafted from the stand record. Each draft is what
 * an experienced friend would type for the founder in ten minutes, filled
 * with the founder's own words and numbers. These are the rehearsal
 * bodies; the live path sends the same brief to the guide prompt and
 * stores the reply under the same kind.
 */
import type { StandRecord } from "./types.ts";
import { runwayLine, fmtMoney } from "./runway.ts";
import { generateDeadlines } from "./deadlines.ts";
import { MOM_TEST_QUESTIONS } from "./documents-shared.ts";

export type DocKind = "one-pager" | "landing" | "interview-script" | "entity" | "pricing" | "outreach" | "plan-12" | "launch" | "update" | "faq";

export const DOC_KINDS: { kind: DocKind; title: string; room: string; blurb: string }[] = [
  { kind: "one-pager", title: "One-pager", room: "idea", blurb: "The company on one page: problem, who, what changes hands, why now, what you need." },
  { kind: "interview-script", title: "Interview script", room: "validate", blurb: "Five questions that cannot be answered politely, and how to write down what you hear." },
  { kind: "landing", title: "Landing page copy", room: "validate", blurb: "Headline, one paragraph, three proofs, one button. No adjectives that need defending." },
  { kind: "entity", title: "Entity comparison", room: "setup", blurb: "The entities people like you choose, what each costs and files, with sources." },
  { kind: "pricing", title: "Pricing sheet", room: "customers", blurb: "Three prices, what each buys, and the one to say out loud first." },
  { kind: "outreach", title: "First outreach message", room: "customers", blurb: "Under sixty words, no link, one question, in your voice." },
  { kind: "plan-12", title: "Twelve-month plan", room: "money", blurb: "Three numbers at month twelve and the quarter that gets you to each." },
  { kind: "launch", title: "Launch checklist", room: "customers", blurb: "The week before and the week after: where to post, what to say, who to thank." },
  { kind: "update", title: "Investor update", room: "raise", blurb: "Numbers first, ask last, drafted from your weekly log." },
  { kind: "faq", title: "Receptionist FAQ", room: "customers", blurb: "The eight questions visitors ask at a stand, answered in your words so the receptionist can repeat them." },
];

export interface Draft {
  kind: DocKind;
  title: string;
  body: string;
}

const need = (s: string | undefined, what: string) => (s && s.trim() ? s.trim() : `[${what} — not on the stand yet]`);

export function draftDocument(kind: DocKind, r: StandRecord): Draft {
  const name = need(r.name, "company name");
  const one = need(r.oneLiner, "one-liner");
  const cur = r.currency;
  const title = DOC_KINDS.find((d) => d.kind === kind)!.title;
  switch (kind) {
    case "one-pager":
      return {
        kind,
        title,
        body: [
          `${name}`,
          one,
          "",
          "The problem",
          r.pitch ? r.pitch : "[Two sentences: who has the problem, what it costs them this month.]",
          "",
          "What changes hands",
          `Customers pay ${r.mrr ? `— today ${fmtMoney(r.mrr, cur)} a month across all of them —` : "[price] for [the moment it saves them]"}.`,
          "",
          "Why now",
          "[One change in the world, dated. Not a trend word.]",
          "",
          "Where we are",
          `${r.mrr ? `${fmtMoney(r.mrr, cur)} MRR.` : "Before revenue."} ${r.burn ? runwayLine({ cash: r.cash, burn: r.burn, mrr: r.mrr }, cur) + "." : ""}`,
          "",
          "What we need",
          r.target90 ? `To reach: ${r.target90}.` : "[The 90-day target, with a number.]",
        ].join("\n"),
      };
    case "interview-script":
      return {
        kind,
        title,
        body: [
          `Interviews for ${name} — ten conversations, none about the idea.`,
          "",
          "Open with: I am trying to understand how people like you handle [the problem]. Nothing to sell. Ten minutes.",
          "",
          ...MOM_TEST_QUESTIONS.map((q, i) => `${i + 1}. ${q}`),
          "",
          "Do not ask: would you use this, would you pay for this, do you think this is a good idea.",
          "Write down what they said, in their words. Underline any number and any thing they already pay for.",
          "After ten: what did three or more say unprompted? That is the sentence for the sign.",
        ].join("\n"),
      };
    case "landing":
      return {
        kind,
        title,
        body: [
          `Headline: ${one}`,
          "",
          `Paragraph: ${r.pitch || `[Who it is for, in one clause]. [What they do today, and what it costs them]. ${name} [what changes].`}`,
          "",
          "Three proofs (replace with real ones, delete what you do not have):",
          `– ${r.mrr ? `Used by paying customers since [month].` : "[A named customer, with permission]"}`,
          "– [A number: hours saved, euros kept, days faster]",
          "– [A sentence a customer actually said]",
          "",
          "Button: Talk to us this week → (a calendar link, not a form)",
          "",
          "Rule: no adjective you could not defend to the customer's face.",
        ].join("\n"),
      };
    case "entity": {
      const opts = [
        ["Delaware LLC", "cheap to form, $300/yr flat tax, one owner is fine; a foreign owner files Form 5472 every year", "corp.delaware.gov/paytaxes"],
        ["Delaware C-corp", "what US investors expect; franchise tax from $400, Form 1120, 83(b) within 30 days of any vesting stock", "corp.delaware.gov/frtax"],
        ["Cyprus Ltd", "12.5% corporate tax, provisional tax in July and December, audited accounts, HE32 annual return", "companies.gov.cy"],
        ["UK Ltd", "quick to form, confirmation statement yearly, accounts 9 months after year end, CT 9 months and a day", "gov.uk/corporation-tax"],
        ["Estonian OÜ", "e-residency, annual report by 30 June, tax only on distributed profit", "rik.ee"],
      ];
      return {
        kind,
        title,
        body: [
          `Entities for ${name}, owned from ${r.residence === "other" ? "[your country]" : r.residence}.`,
          "",
          ...opts.map(([n, w, s]) => `${n} — ${w}. Source: ${s}`),
          "",
          "Rule of thumb: raising from US investors → C-corp. Staying small and selling to Europe → the entity where you live. Do not incorporate before you have said a price to a customer.",
          "",
          "Check the official source. This is a comparison, not advice.",
        ].join("\n"),
      };
    }
    case "pricing": {
      const base = r.mrr && r.segment === "b2b-saas" ? Math.max(9, Math.round(r.mrr / 10 / 5) * 5) : 29;
      return {
        kind,
        title,
        body: [
          `Pricing for ${name} — three prices, said out loud in this order.`,
          "",
          `${fmtMoney(base * 3, cur)}/mo — the one to say first. It should make one in three flinch. What it buys: everything, plus [the thing only you can do].`,
          `${fmtMoney(base, cur)}/mo — the one most will take. What it buys: the core, for one person or one location.`,
          `${fmtMoney(Math.round(base * 10 * 0.8), cur)}/yr — the one that funds you. Two months free for paying ahead.`,
          "",
          "Do not add a free plan until ten people have paid. A free plan before that is a way to avoid the conversation.",
          "Start high; it is easier to discount than to raise.",
        ].join("\n"),
      };
    }
    case "outreach":
      return {
        kind,
        title,
        body: [
          `Hi [name] — I run ${name}. ${one} I am talking to [ten people like you] this week about how you handle [the problem] today. Would twenty minutes on Thursday be a waste of your time?`,
          "",
          `${Math.min(60, 38 + one.split(/\s+/).length)} words. No link. One question. Send ten of these, not one.`,
        ].join("\n"),
      };
    case "plan-12": {
      const mrr = r.mrr || 0;
      const goal = mrr ? Math.round(mrr * 4) : 3000;
      return {
        kind,
        title,
        body: [
          `${name} — twelve months, three numbers.`,
          "",
          `Month 12: ${fmtMoney(goal, cur)} MRR · ${Math.max(10, Math.round(goal / Math.max(20, mrr ? mrr / 10 : 30)))} paying customers · cash never below ${fmtMoney(Math.max(r.burn * 3, 5000), cur)}.`,
          "",
          `Q1: ten conversations a week; first ${mrr ? "price rise" : "paying customer"}; the numbers on the stand every Friday.`,
          `Q2: ${fmtMoney(Math.round(goal * 0.35), cur)} MRR; one channel that brings two customers a month without you.`,
          `Q3: ${fmtMoney(Math.round(goal * 0.65), cur)} MRR; the first thing you stop doing yourself.`,
          `Q4: ${fmtMoney(goal, cur)} MRR; the raise-or-bootstrap decision, in writing.`,
          "",
          r.burn ? `Today: ${runwayLine({ cash: r.cash, burn: r.burn, mrr: r.mrr }, cur)}.` : "Put burn and cash on the stand so this plan has a floor.",
        ].join("\n"),
      };
    }
    case "launch":
      return {
        kind,
        title,
        body: [
          `Launch week for ${name}.`,
          "",
          "The week before",
          "– Ten people who said they would try it, messaged by name with the date",
          "– The one-liner on the page, a screenshot that shows the moment it helps, a price",
          "– A way to pay that works on a phone, tested by someone who is not you",
          "– Your own stand on FounderFloor with the sign written",
          "",
          "Launch day",
          "– Product Hunt at 00:01 PT, first comment is your story in five lines",
          "– One post where your customers actually are (not where founders are)",
          "– Reply to every comment within the hour; thank by name",
          "",
          "The week after",
          "– Message everyone who signed up and did nothing: one question, no link",
          "– Write down the three things people misunderstood; fix the sign, not the product",
          "– Log the week: revenue, customers, cash, hours with customers",
        ].join("\n"),
      };
    case "update":
      return { kind, title, body: "Drafted from the weekly log — open the Office and log a week first." };
    case "faq":
      return {
        kind,
        title,
        body: [
          `What visitors ask at ${name}'s stand. Answer in your words; the receptionist repeats only these.`,
          "",
          `Q: What is it, in a sentence?\nA: ${one}`,
          "Q: Who is it for?\nA: [the kind of person, and the one it is not for]",
          "Q: What does it cost?\nA: [public price, or 'the founder will say']",
          "Q: How do I start?\nA: [the first step, in one line]",
          "Q: Is there a trial?\nA: [yes/no and how long]",
          "Q: Where are you based?\nA: [city, country]",
          "Q: Who else uses it?\nA: [only names you have permission to say]",
          "Q: Can I talk to the founder?\nA: Leave an email here and they will reply within a day.",
        ].join("\n"),
      };
  }
}

export { generateDeadlines };
