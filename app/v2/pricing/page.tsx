import type { Metadata } from "next";
import Link from "next/link";
import { APP_PLANS, FREE_LIMITS, PLAN_COPY, TRIAL_DAYS, trialTimeline, type Plan } from "@founderfloor/shared";
import PageHead from "@/components/studio/PageHead";
import Reveal from "@/components/studio/Reveal";

export const metadata: Metadata = {
  title: "What it costs — FounderFloor",
  description:
    "The whole road is free forever. Pro is what it costs for the staff to answer for real and remember you.",
};

/**
 * WHAT IT COSTS.
 *
 * Every number and every line of what-you-get is imported from the app's
 * own plans module, because a price on a website that disagrees with the
 * price in the app is the fastest way to lose somebody at the till.
 */
const ORDER: Plan[] = ["free", "pro", "founder"];

export default function Page() {
  const timeline = trialTimeline();
  return (
    <>
      <PageHead
        eyebrow="What it costs"
        title="Free forever. You pay for the staff."
        line="Not a trial that takes your work hostage. Everything you write is yours on every plan, the whole seven stops are free forever, and the price buys one thing: four people who answer live and remember what you told them."
        glyph="coin"
      />

      <section className="band">
        <div className="wrap">
          <div className="plans">
            {ORDER.map((p, i) => {
              const copy = PLAN_COPY[p];
              const paid = p !== "free" ? APP_PLANS[p] : null;
              return (
                <Reveal key={p} className={`plan reveal d${(i % 3) + 1}${p === "pro" ? " plan-pick" : ""}`}>
                  {p === "pro" ? <span className="plan-flag">Most people want this one</span> : null}
                  <b>{copy.name}</b>
                  <p className="plan-line">{copy.line}</p>
                  <p className="plan-price">
                    {paid ? (
                      <>
                        <span className="num">€{paid.monthly}</span>
                        <span> a month, or €{paid.annual} a year</span>
                      </>
                    ) : (
                      <>
                        <span className="num">€0</span>
                        <span> forever, no card</span>
                      </>
                    )}
                  </p>
                  <ul className="ticks">
                    {copy.buys.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* the trial, told before anybody taps */}
      <section className="band tint">
        <div className="wrap cols-wide">
          <Reveal className="reveal">
            <p className="label">The week of the whole staff</p>
            <h2>You are told what happens on which day, before it starts</h2>
            <p className="lede">
              {TRIAL_DAYS} days with all four coaches open and nothing to enter. It begins the first time the
              app pays something back, not at the door.
            </p>
            <p>The trial itself never charges anything. If you do nothing, it ends and you are on Free.</p>
          </Reveal>
          <Reveal className="reveal d1">
            <ol className="timeline">
              {timeline.map((t) => (
                <li key={t.day}>
                  <span className="timeline-when">{t.when}</span>
                  <span>{t.label}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* what free actually is */}
      <section className="band">
        <div className="wrap narrow">
          <Reveal className="band-head reveal">
            <p className="label">What Free really means here</p>
            <h2>The limits are on the words, never on your work</h2>
            <p className="lede">
              On Free: {FREE_LIMITS.ideaRuns} runs of the idea finder, {FREE_LIMITS.ideaChecks} second
              opinions, {FREE_LIMITS.coachTurnsPerDay} turns a day with Ines and the desk, and{" "}
              {FREE_LIMITS.draftsPerMonth} drafts a month. Your stand, your plan, your notebook, the weekly
              log, the workshop and every task page have no limit at all, and never will.
            </p>
            <p>
              Nothing you have already written is ever put behind the price. The paywall stands where a
              coach would have spoken, never over work you have done.
            </p>
          </Reveal>
          <div className="close-in" style={{ justifyContent: "flex-start" }}>
            <Link className="btn primary" href="/v2">
              Start free
            </Link>
            <Link className="btn quiet" href="/v2/coaches">
              Meet the four
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
