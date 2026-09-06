/**
 * "Hand it to your builder" — the stand as a brief for Claude Code, Cursor,
 * Lovable or a human. Plain Markdown: the company in the founder's words,
 * who it is for, what to build first and what NOT to build, the acceptance
 * test, the constraints a first version must respect, and the rules an
 * agent should follow (ask before adding a dependency, keep the copy in the
 * founder's voice, report back what shipped). Missing facts are marked in
 * square brackets, never invented.
 */
import { STAGES, currentStage } from "./build-path.ts";
import { runwayLine } from "./runway.ts";
import { fmtMoney } from "./runway.ts";
import type { StandRecord } from "./types.ts";

export interface BriefContext {
  ticks?: string[];
  interviews?: { who: string; said: string; paysToday?: string }[];
  docs?: { title: string; body: string }[];
  /** e.g. "FounderFloor MCP" instructions to include. */
  mcp?: boolean;
}

const need = (s: string | undefined, what: string) => (s && s.trim() ? s.trim() : `[${what}]`);

function firstVersion(r: StandRecord): { build: string[]; skip: string[]; accept: string } {
  const seg = r.segment ?? "other";
  const base = {
    build: ["One page that says the one-liner and lets a person leave an email or book a call", "The single moment the product helps, working end to end for ONE customer, by hand where possible", "A way to take money for it, even if it is a payment link"],
    skip: ["Accounts, roles, settings, dashboards", "A second customer type", "Anything the first ten customers did not ask for"],
    accept: "One person who is not a friend pays real money and comes back a second time.",
  };
  if (seg === "b2b-saas") base.build[1] = "The one workflow the customer does today by hand, done for them; ugly is fine, correct is not";
  if (seg === "marketplace") base.build[1] = "Supply first: five sellers listed by hand before any buyer sees a page";
  if (seg === "consumer") base.build[1] = "The core loop on one screen, no onboarding, no sign-up before the first use";
  if (seg === "services") base.build[1] = "A booking or intake form and the checklist you follow to deliver; software later";
  if (seg === "hardware") base.build[1] = "The order page and the pre-order; the product itself is not in this brief";
  return base;
}

export function builderBrief(r: StandRecord, ctx: BriefContext = {}): string {
  const name = need(r.name, "company name");
  const stage = currentStage(ctx.ticks ?? []);
  const fv = firstVersion(r);
  const said = (ctx.interviews ?? []).slice(0, 5).map((i) => `- ${i.who}: "${i.said}"${i.paysToday ? ` (pays today: ${i.paysToday})` : ""}`);
  const lines = [
    `# ${name} — build brief`,
    "",
    `> ${need(r.oneLiner, "one-liner: what it is, for whom, in a sentence")}`,
    "",
    "## The company, in the founder's words",
    need(r.pitch, "two or three sentences: who has the problem, what it costs them, what changes"),
    "",
    "## Facts on the stand",
    `- Segment: ${r.segment ?? "[segment]"}`,
    `- Stage on the build path: ${stage.n}. ${stage.name} — ${stage.blurb}`,
    `- Revenue: ${r.mrr ? `${fmtMoney(r.mrr, r.currency)} a month` : "before revenue"}`,
    r.burn ? `- Runway: ${runwayLine({ cash: r.cash, burn: r.burn, mrr: r.mrr }, r.currency)}` : "- Runway: [burn and cash not on the stand]",
    `- Entity: ${r.entity === "none" ? "none yet" : r.entity} · Founder lives in: ${r.residence === "other" ? "[country]" : r.residence}`,
    r.weeklyGoal ? `- This week's goal: ${r.weeklyGoal}` : "- This week's goal: [not set]",
    r.target90 ? `- 90-day target: ${r.target90}` : "- 90-day target: [not set]",
    "",
    "## What customers said",
    ...(said.length ? said : ["[No interviews written down yet. Do not invent any. Build the smallest thing and let the founder go and ask.]"]),
    "",
    "## Build first",
    ...fv.build.map((b, i) => `${i + 1}. ${b}`),
    "",
    "## Do not build yet",
    ...fv.skip.map((b) => `- ${b}`),
    "",
    "## Done means",
    fv.accept,
    "",
    "## Constraints",
    "- Plain, in the founder's voice. No exclamation marks in the product's copy. Second person.",
    "- No new paid service or dependency without asking; the company has " + (r.burn ? `${fmtMoney(r.cash, r.currency)} in the bank` : "an unknown amount of cash") + ".",
    "- Take payment from day one; a payment link is enough.",
    "- Mobile first: the first customers will open it on a phone.",
    "- Keep a CHANGELOG.md; write one line per thing shipped, dated.",
    "",
    "## Rules for the agent",
    "- Read this brief before every session. If a fact here contradicts the code, the brief wins; say so.",
    "- When something ships, report it in one line: what a customer can now do that they could not before.",
    "- If a decision needs the founder (price, name, scope), stop and ask; do not guess.",
    ...(ctx.mcp ? ["- FounderFloor is connected over MCP: read the stand with `founderfloor.stand`, log what shipped with `founderfloor.log_shipped`, tick a workshop item with `founderfloor.tick`, and save documents with `founderfloor.save_doc`."] : ["- To keep FounderFloor in sync, paste what shipped into the weekly log in the Office."]),
    "",
    ...(ctx.docs?.length ? ["## From the drawer", ...ctx.docs.slice(0, 3).flatMap((d) => [`### ${d.title}`, d.body, ""])] : []),
    `_Generated by FounderFloor from ${name}'s stand. ${STAGES.length} rooms on the path; the founder is in room ${stage.n}._`,
  ];
  return lines.join("\n");
}
