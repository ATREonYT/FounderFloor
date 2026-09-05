/**
 * The guide and the coaches, scripted over the founder's REAL numbers.
 * Until the Edge Functions are wired (Gate 3/5), every answer here is
 * computed from the stand record, the ticks and the shared rules, so the
 * arithmetic, the dates and the sources are already the true ones. Only
 * the prose is canned. The composer says "Rehearsal" while this answers.
 */
import { STAGES, currentStage, stageProgress, generateDeadlines, runwayLine, runwayMonths, runwayEnds, salaryScenario, fmtMoney, fmtMonths, rankFor, toNextRank, nextRank, type StandRecord, type StageId } from "@founderfloor/shared";
import type { PitchScore } from "./store";

export function askGuide(record: StandRecord, ticks: string[], stageId?: StageId): string {
  const stage = stageId ? STAGES.find((s) => s.id === stageId)! : currentStage(ticks);
  const next = stage.items.find((i) => !ticks.includes(i.id)) ?? stage.items[stage.items.length - 1];
  const rw = runwayMonths({ cash: record.cash, burn: record.burn, mrr: record.mrr });
  const pressure = Number.isFinite(rw) && rw < 6 ? ` Runway is ${fmtMonths(rw)}, so this is the week for it, not next month.` : "";
  return `The one thing this week: ${next.text.toLowerCase()}.${pressure}\n\n1. Block ninety minutes tomorrow morning before anything else and do only this.\n2. ${next.text}. Done means: ${next.proof.toLowerCase()}.\n3. Put the proof on the stand and tick it here, so the next question is a different one.\n\nWhat is the first of the ninety minutes going to be?`;
}

export function whereAmI(record: StandRecord, ticks: string[]): string {
  const boxes = currentStage(ticks);
  // evidence from the numbers, not the ticks
  let evidence: StageId = "idea";
  if (record.oneLiner) evidence = "validate";
  if (record.entity !== "none") evidence = "setup";
  if (record.mrr > 0) evidence = "customers";
  if (record.mrr >= 1000 && record.cash > 0) evidence = "money";
  if (record.mrr >= 10_000) evidence = "raise";
  const ev = STAGES.find((s) => s.id === evidence)!;
  const same = ev.id === boxes.id;
  const rw = runwayMonths({ cash: record.cash, burn: record.burn, mrr: record.mrr });
  const rwLine = record.burn ? ` ${runwayLine({ cash: record.cash, burn: record.burn, mrr: record.mrr }, record.currency)}.` : " Burn and cash are not on the stand, so I cannot tell you when the money runs out, and neither can you.";
  const verdict = same
    ? `The boxes say ${boxes.name}. The numbers agree.`
    : ev.n > boxes.n
      ? `The boxes say ${boxes.name}; the numbers say ${ev.name}. You are further along than you have admitted here, so tick what is already true and stop re-doing it.`
      : `The boxes say ${boxes.name}; the numbers say ${ev.name}. Ticks are not evidence. Revenue is ${fmtMoney(record.mrr, record.currency)} a month, which is what a stranger would judge you on.`;
  const pct = Math.round(stageProgress(boxes, ticks) * 100);
  return `${verdict} ${pct}% of ${boxes.name} is ticked.${rwLine}${Number.isFinite(rw) && rw < 4 ? " Under four months of runway, every other question is secondary." : ""}\n\nWhich of those two numbers is wrong?`;
}

// ─── the coaches ──────────────────────────────────────────────────────────
export type CoachContext = { record: StandRecord; ticks: string[]; scores: PitchScore[]; quota: { target: number; sent: number }; streak: number; weekday: number };

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export function scorePitch(text: string): PitchScore {
  const t = text.toLowerCase();
  const n = words(text);
  const has = (re: RegExp) => re.test(t);
  const clamp = (x: number) => Math.max(1, Math.min(10, Math.round(x)));
  const problem = clamp(3 + (has(/problem|pain|waste|lose|spend|hours|cost/) ? 3 : 0) + (has(/every|each|per (week|month|day)/) ? 2 : 0) + (n > 60 ? 1 : 0));
  const now = clamp(2 + (has(/now|since|this year|2026|2025|regulat|changed|new|finally/) ? 4 : 0) + (has(/because/) ? 2 : 0));
  const traction = clamp(2 + (has(/\d+\s*(customers|users|shops|paying|signed|waitlist|mrr|€|\$|£)/) ? 5 : has(/\d/) ? 2 : 0) + (has(/retention|churn|repeat|renew/) ? 2 : 0));
  const market = clamp(2 + (has(/(\d[\d,.]*\s*(k|m|b|thousand|million|billion))/) ? 5 : 0) + (has(/market|europe|eu|country|cities|segment/) ? 2 : 0));
  const ask = clamp(2 + (has(/raising|raise|ask|seeking|looking for/) ? 3 : 0) + (has(/€\s*\d|\$\s*\d|£\s*\d|\d+\s*k\b/) ? 3 : 0) + (has(/months|runway|hire|milestone/) ? 2 : 0));
  const total = Math.round(((problem + now + traction + market + ask) / 5) * 10) / 10;
  return { at: new Date().toISOString(), parts: { problem, now, traction, market, ask }, total };
}

export function coachReply(coach: string, prompt: string, ctx: CoachContext): { text: string; score?: PitchScore; sent?: number } {
  const { record: r } = ctx;
  const cur = r.currency;
  const p = prompt.toLowerCase();
  const rw = { cash: r.cash, burn: r.burn, mrr: r.mrr };

  if (coach === "finance") {
    if (/salary|pay myself|pay me|raise my/.test(p)) {
      const m = p.match(/(\d[\d,.]*)\s*(k)?/);
      const amt = m ? Math.round(parseFloat(m[1].replace(/,/g, "")) * (m[2] ? 1000 : 1)) : Math.round((r.founderSalary || 2000) * 1.5);
      if (!r.burn) return { text: "I need burn, cash and MRR on the stand before I can run a salary scenario. Open the stand and put the three numbers in; I will do the arithmetic the moment they are there.\n\nWhat is the monthly burn today?" };
      const s = salaryScenario({ ...rw, founderSalary: r.founderSalary }, amt, cur);
      return { text: `Today: ${runwayLine(rw, cur)}.\nAt ${s.line}.\n\n${Number.isFinite(s.runway) && s.runway < 6 ? "Under six months is where fundraising stops being a choice. I would not take the raise before the next two customers." : "You can afford it on paper. Whether you should depends on what the money would buy instead."}\n\nWhat would the extra ${fmtMoney(Math.max(0, amt - r.founderSalary), cur)} a month change about how you work?` };
    }
    if (/file|filing|deadline|due|5472|tax|vat|franchise|calendar/.test(p)) {
      const ds = generateDeadlines({ entity: r.entity, residence: r.residence, formedOn: r.formedOn }, new Date()).slice(0, 3);
      if (r.entity === "none") return { text: "There is no entity on the stand, so there is nothing to file yet, and nothing protecting you either. When you choose one, put it on the stand and I will generate the calendar with a source for each date.\n\nWhich are you leaning towards, and where do you live?" };
      if (ds.length === 0) return { text: `Nothing on the rule sheet for a ${r.entity} owned from ${r.residence} that I can date without more information. Check the official source for your registrar.\n\nWhen was the company formed?` };
      const lines = ds.map((d) => `${d.title} — ${d.due}, ${d.daysLeft} days. ${d.what.split(". ")[0]}. Source: ${d.source}`);
      return { text: `Next on the calendar:\n\n${lines.join("\n\n")}\n\nCheck the official source; this is a calendar, not tax advice.\n\nDo you want the 21-day and 3-day reminders in your Inbox for these?` };
    }
    if (!r.burn && !r.cash) return { text: "Runway is cash divided by burn minus MRR, and two of those three are not on the stand. Put burn and cash in and I will give you the date, not a feeling.\n\nWhat did you spend last month, all in?" };
    const ends = runwayEnds(rw);
    return { text: `${runwayLine(rw, cur)}.${ends ? ` The money runs out around ${ends} if nothing changes.` : ""}\n\nRank: ${rankFor(r.mrr).name}, ${fmtMoney(toNextRank(r.mrr), cur)} of MRR to ${nextRank(r.mrr)?.name ?? "the top"}.\n\nWhich lever do you want to pull first: burn, price, or customers?` };
  }

  if (coach === "sales") {
    if (/quota|target|this week|went out|count|sent/.test(p)) {
      const m = p.match(/(\d+)/);
      if (m && /quota|target|set/.test(p)) return { text: `Quota is ${m[1]} a week. That is ${Math.ceil(Number(m[1]) / 5)} a day, Monday to Friday, before you open anything else.\n\nWho is today's first?`, sent: 0 };
      return { text: `${ctx.quota.sent} of ${ctx.quota.target} out this week. ${ctx.quota.sent === 0 ? "Zero is a number; it is just not one I can work with." : ctx.quota.sent >= ctx.quota.target ? "Quota met. Now the ones you were avoiding." : `${ctx.quota.target - ctx.quota.sent} to go.`}\n\nTell me when the next one goes out and I will count it.` };
    }
    if (/went|sent it|done|out\b/.test(p) && /1|one|just|sent/.test(p)) return { text: `Counted. ${ctx.quota.sent + 1} of ${ctx.quota.target}.\n\nWho is next?`, sent: 1 };
    if (/objection|role.?play|pretend|prospect|too expensive|no time|not now/.test(p)) return { text: `Fine, I am the shop owner. "We tried a loyalty thing once, the stamps, nobody used it. Why would this be different, and what does it cost me if it isn't?"\n\nAnswer as you would across the counter.` };
    if (/draft|write|message|cold|email|dm/.test(p)) {
      const who = p.match(/to ([a-z][a-z ]{2,30})/)?.[1]?.trim() ?? "the owner";
      return { text: `Draft, in your voice, ${words(r.oneLiner) > 0 ? "using the sign" : "without a sign to lean on"}:\n\n"Hi — I run ${r.name || "a small company"}. ${r.oneLiner || "We do one thing for small shops."} I am talking to ${who}s in your area this week about how regulars pay ahead. Would twenty minutes on Thursday be a waste of your time?"\n\n${Math.min(60, words(r.oneLiner) + 38)} words, no link, one question. Send it or tell me what is wrong with it.` };
    }
    return { text: `${ctx.quota.sent} of ${ctx.quota.target} out this week. I can draft the next one, set the quota, or play the prospect.\n\nWhich?` };
  }

  if (coach === "investor") {
    if (words(prompt) >= 40) {
      const s = scorePitch(prompt);
      const weakest = (Object.entries(s.parts) as [keyof PitchScore["parts"], number][]).sort((a, b) => a[1] - b[1])[0];
      const names: Record<string, string> = { problem: "the problem", now: "why now", traction: "traction", market: "the market", ask: "the ask" };
      const last = ctx.scores.at(-1);
      const trend = last ? (s.total > last.total ? ` Up from ${last.total}.` : s.total < last.total ? ` Down from ${last.total}.` : ` Same as last time, ${last.total}.`) : "";
      return {
        text: `Problem ${s.parts.problem}. Why now ${s.parts.now}. Traction ${s.parts.traction}. Market ${s.parts.market}. Ask ${s.parts.ask}.\n\n${s.total} out of ten.${trend} I stopped listening at ${names[weakest[0]]}: ${weakest[0] === "market" ? "there is no number in it, and a market without a number is a wish" : weakest[0] === "traction" ? "tell me who has paid, how many, and whether they came back" : weakest[0] === "ask" ? "say the amount, the months it buys, and the one milestone it reaches" : weakest[0] === "now" ? "what changed in the world that makes this possible this year and not in 2022" : "describe the pain in a number: hours, euros, per week"}.\n\nGive it to me again with that part fixed.`,
        score: s,
      };
    }
    if (/kill|risk|die|fail/.test(p)) return { text: `Three things kill a company like this. Distribution: ${r.segment === "b2b-saas" ? "small businesses are expensive to reach one at a time" : "the channel is unclear from the stand"}. Retention: you have not told me anyone has come back for a second month. Founder cash: ${r.burn ? runwayLine(rw, cur) : "no runway on the stand"}.\n\nWhich of the three do you have evidence against?` };
    if (/ask|raise|round|how much/.test(p)) return { text: `An ask has three parts: the amount, the months it buys at the burn you will actually have, and the single milestone that makes the next round obvious. ${r.burn ? `At ${fmtMoney(r.burn, cur)} a month, eighteen months is ${fmtMoney(r.burn * 18, cur)} before hires.` : "Put burn on the stand and I will size it."}\n\nWhat is the milestone?` };
    return { text: "Give me the pitch as you would say it in three minutes, in one message. Forty words at least; I score five parts and I do not round up.\n\nGo." };
  }

  // strategy
  const isMon = ctx.weekday === 1, isFri = ctx.weekday === 5;
  if (/monday|plan|goals? for the week/.test(p) || (isMon && /^(hi|hello|hey)/.test(p))) {
    return { text: `Three goals for the week. Each one needs a number and a day.\n\nFrom the stand: ${r.weeklyGoal ? `you already wrote "${r.weeklyGoal}"` : "there is no weekly goal written yet"}. ${r.mrr ? `MRR is ${fmtMoney(r.mrr, cur)}; one goal should move it.` : "One goal should be the first paying customer."} ${ctx.quota.target ? `One should be the outreach quota, ${ctx.quota.target}.` : ""}\n\nGive me the first, with its number.` };
  }
  if (/friday|review|shipped|promised/.test(p) || (isFri && /^(hi|hello|hey)/.test(p))) {
    return { text: `Friday. Promised against shipped, in your words, one line each. Then the one that slipped: is this the first time or the second?\n\n${ctx.streak > 1 ? `Streak is ${ctx.streak} days; the review keeps it.` : "The review starts the streak."}\n\nWhat did you promise on Monday?` };
  }
  if (/slip|didn't|did not|missed|again/.test(p)) return { text: "Slipped twice. So either it frightens you or it does not matter. Those need different Mondays: a frightening goal gets cut into a fifteen-minute first step; an unimportant one gets deleted without apology.\n\nWhich is it?" };
  if (/90|ninety|target|quarter/.test(p)) return { text: `${r.target90 ? `The 90-day target on the stand is "${r.target90}".` : "There is no 90-day target on the stand."} A good one has a number a stranger can check and a date. ${r.mrr ? `From ${fmtMoney(r.mrr, cur)} MRR, ${fmtMoney(Math.round(r.mrr * 1.6), cur)} in ninety days is ambitious and possible.` : "For a company before revenue it is a customer count, not a revenue number."}\n\nSay it in one sentence with the number in it.` };
  if (/where am i|honest|really/.test(p)) return { text: whereAmI(r, ctx.ticks) };
  if (!r.name || !r.oneLiner) return { text: "Before the plan, the stand. What is the company called, and what does it do, in a sentence a stranger repeats back correctly?\n\nStart with the name." };
  return { text: `${r.name}. ${r.oneLiner} ${r.weeklyGoal ? `This week: ${r.weeklyGoal}.` : "No goal for this week yet."}\n\nMonday plan, Friday review, or the honest one: where are you really?` };
}
