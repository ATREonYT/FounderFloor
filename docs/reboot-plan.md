# FounderFloor — the all-in-one plan (September 2026)

The app is no longer "the floor, on a phone". It is a building a founder
walks through alone: find or check an idea, build it with staff who know
the numbers, run it every week, and — last — join the hall where the other
founders are. Every room earns a reason to come back; the paid plan is the
staff, every day.

## 1. What the research says (5 Sep 2026)

**Idea validators are a flooded, distrusted category.** Founders reject
"low-resolution answers": a generic score does not change what they do
next. What they judge tools by is actionable evidence — who to talk to,
how to ask without leading, how to tell a polite answer from a real one.
([preuve.ai roundup](https://preuve.ai/blog/best-startup-validation-tools-2026),
[PainMap](https://painmap.io/blog/startup-idea-validation-tools-2026/),
[BigIdeasDB on "rate my idea" complaints](https://bigideasdb.com/guides/rate-my-idea))
→ **Our second opinion never scores.** It returns what is strong, three
questions only customers can answer, who to ask first, five non-leading
questions, one thing to sharpen. Readiness is a word, not a number.

**The gap after the AI-built MVP is the real gap.** Lovable, Bolt and v0
ship a prototype in a day; the founder is then alone with launch, first
users, payments, an entity and taxes.
([wz-it comparison](https://wz-it.com/en/blog/lovable-vs-bolt-vs-v0-comparison-2026/),
[altar.io](https://altar.io/lovable-vs-bolt-vs-v0-vs-replit-vs-base44/))
→ **The workshop and the drawer live there:** launch checklist, first
outreach, pricing sheet, entity comparison with sources, the interview book.

**First-year mistakes are known and expensive.** 83(b) within 30 days,
contractor misclassification, pricing too low out of fear, spending on
things that look like a business.
([Kruze](https://kruzeconsulting.com/blog/seed-stage-tax-returns/),
[Startup Editor](https://www.startupeditor.com/how-to-incorporate-a-startup/),
[Vecosys](https://www.vecosys.com/first-time-business-owner-finance-mistakes-2026/))
→ Deadline rules as data with official sources; "start high" in the
pricing sheet; the Finance coach shows the arithmetic in one line.

**Metrics dashboards are free where we would compete.** ChartMogul and
Paddle/ProfitWell are free under $10k MRR.
([Fungies comparison](https://fungies.io/best-saas-metrics-dashboard-tools-2026/))
→ **The Office is not analytics.** It is the weekly discipline: five numbers,
the deltas, the runway, an update drafted from them. Works for a bakery.

**The founder segment is cheap and churns fast; rituals and social cost
retain.** Founders are a "notoriously cheap, churn-heavy segment for
productivity tools"; auto-posted streaks read as spam; weekly check-ins and
peer accountability reduce 90-day attrition 10–25%.
([mean.ceo community stats](https://blog.mean.ceo/community-led-growth-engagement-retention-statistics/),
[Cohorty](https://blog.cohorty.app/best-accountability-apps-for-entrepreneurs-in-2025-tested-by-500-founders/))
→ Monday plan and Friday review are the two rituals; no auto-posting; the
floor is the social cost of leaving; hand-offs from real visitors are the
value nobody else can copy.

**Paywall shape.** RevenueCat's 2026 report: hard paywalls convert ~5×
freemium to paid by day 35 (10.7% vs 2.1%) with the same year-one
retention; 55% of trial cancels happen on day zero; monthly plans dominate
Productivity at 77%; AI apps earn 41% more per customer and churn 30%
faster. ([RevenueCat](https://www.revenuecat.com/state-of-subscription-apps-2026-productivity/),
[SaaStr summary](https://saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps-how-115000-mobile-apps-deliver-16b-in-revenue-whats-working-whats-quietly-killing-growth))
→ The trial starts from a screen where something useful just happened
(a read-back, a draft, a coach), never from first launch. Monthly first,
yearly beside it.

**Price band.** Foundra $39/mo, AI Co-Founder $25/mo, PainMap $29–49/mo,
Preuve $19/mo Radar. ([Foundra pricing](https://www.foundra.ai/pricing/aicofounder-pricing),
[Preuve](https://preuve.ai/), [PainMap](https://painmap.io/))
→ Pro $19/mo · $159/yr, Founder+ $39/mo · $329/yr, 3-day trial.

Reddit-direct research (Adlicio) was out of credits; the founder-voice
half above is from secondary sources and should be re-run when credits
are back.

## 2. The building

| Room | What it does | Why they come back |
| --- | --- | --- |
| **The doors** (first launch) | Find an idea / I have one / I already run something | — |
| **Idea finder** | Five ideas from what you know and who you know, each with the first ten people | 3 runs free |
| **Second opinion** | Reads the idea back: strong, questions, who, how to ask, sharpen | Re-read after every five conversations |
| **Desk** | Chat-first home; four coaches who know the numbers | Monday / Friday rituals; coaches remember |
| **Stand** | The booth, runway, rank, next filing, the numbers editor | It is the company's face |
| **Workshop** | Six rooms, ticks, the guide, "draft it for me" | Progress is visible; badges land on the stand |
| **Office** | Weekly log, interview book, filing calendar, update generator, drawer | The Friday two minutes; the update that gets sent |
| **Drawer** | One-pager, script, landing copy, entity, pricing, outreach, plan, launch, FAQ | 3 drafts/month free |
| **Floor** | The real hall, last | Other founders; hand-offs while away |
| **Inbox** | Messages, receptionist hand-offs, coach nudges | Strangers asking about your company |

## 3. Money

- Free: stand + floor, 3 idea runs, 2 second opinions, Ines Mon/Fri 10
  turns/day, 3 drafts/month, the weekly log always.
- Pro $19/mo or $159/yr: all coaches unlimited, every draft, finder and
  opinions open, investor updates, filing reminders pushed, every hand-off.
- Founder+ $39/mo or $329/yr: Pro + Sonnet pitch reviews, verified revenue
  badge (Stripe read), priority placement, stage-matched circle.
- AI cost ≈ $0.31 per active user per month on Haiku (docs/costs.md; verify
  prices before launch). Pro margin on AI alone > $18.

**Open decision for Alex:** the site sells membership at $9/$19 for floor
perks. Either (a) the app plan *includes* site membership and the site's
prices rise to match for new customers (existing members grandfathered), or
(b) two products. (a) is simpler to explain and is what `effectivePlan()`
already assumes: a paying site member never sees the app's paywall.

## 4. Where the money comes from, honestly

The app earns when three things are true: the finder/second opinion gives
a first-value moment inside two minutes; the weekly log becomes a habit
(Friday); and the coaches are live (they need the Anthropic key). Until the
key is in, everything says "Rehearsal" and nothing should be charged.

## 5. Next

0. Done since this plan: the MCP server (`packages/mcp`) and the build
   brief on the stand. Founders build in Claude Code on their own account
   with the stand as context; nothing is pasted between tools.
1. Alex: Supabase project (URL, anon key, JWT secret) + Anthropic key →
   coaches, finder and opinion go live through the Edge Functions.
2. Push: `expo-notifications` + a small sender on the floor server for
   hand-offs and the 21/3-day filing reminders.
3. RevenueCat: replace `lib/billing.ts`'s stub with the SDK; the store
   listing at the prices above.
4. Receptionist end to end (Gate 6) — the one feature no competitor has.
5. Store readiness (Gate 8).

## 6. The mine (7 Sep 2026)

Where the subscription stands, and why there. The research pass could read
only Apple's pages in full (the sandbox proxy blocked the rest), so every
number below came from search snippets of the named pages and should be
spot-checked before it is quoted anywhere public.

**What the data says.**

- RevenueCat, State of Subscription Apps 2025/2026: hard paywalls convert
  roughly five times better than freemium by day 35 (10–12% vs ~2%) with
  near-identical year-one retention; a third to a half of all conversions
  happen on day zero; trial-to-paid sits near a third on both stores.
  https://www.revenuecat.com/state-of-subscription-apps
- Reverse trials (full access first, then Free): Canva, Notion, Linear,
  Airtable; reported freemium-to-paid lifts of 10–40% (Elena Verna,
  Amplitude); Kyle Poyar's 2026 report puts a good free trial at 8–12%
  and a great one at 15–25% against freemium's 3–5%.
  https://amplitude.com/blog/reverse-trial ·
  https://www.growthunhinged.com/p/free-to-paid-conversion-report
- Usage meters in AI apps: ChatGPT's free message cap, Notion AI's twenty
  complimentary responses, Grammarly's blurred suggestions (widely read as
  shaming), Duolingo's hearts (revenue-positive, loop-breaking, reverted
  when retention dips). The one pattern with consistent backlash is
  Strava's: taking away something that used to be free.
  https://www.bikeradar.com/news/strava-leaderboards-routes-subscription
- Placement: Headspace paywalls the aha moment with a "high double-digit"
  lift; Blinkist's honest trial timeline ("today / day 5 reminder / day 7
  charged") lifted trial conversion 23% and cut complaints 55%.
  https://growth.design/case-studies/trial-paywall-challenge
- Apple 3.1.2: state what the price buys before subscribing; the full
  renewal price is the most prominent number; trial length and post-trial
  charge are stated; nothing core may need a login it does not require.
  https://developer.apple.com/app-store/review/guidelines/

**The six rules this app follows.**

1. One closable paywall on day zero, after value, never as the first screen.
2. The core loop is free forever and is never taken back: the stand, the
   floor, the workshop, the weekly log, Ines every day.
3. The whole staff for seven days, started by the first value moment (a
   second opinion read, a week logged, a coach's first reply), server-side
   and once per account — so the downgrade, not a blur, creates the intent.
4. The thing Pro adds compounds with use: **the staff remember.** Coaches
   carry the log, the interview book and the last conversations; Theo reads
   week against week; the update drafts itself from the log. On Free every
   visit starts from the stand alone.
5. The mine fires where the memory would have spoken — the second weekly
   log, the second visit to a coach — with an honest preview (the first line
   of the reading, the count of unread notes), never a blur over work done.
6. Every sheet shows the renewal price largest, the trial's dates, the
   reminder promise (two days before, at the desk), and a way past it.

**What was built.** `packages/shared/src/plans.ts` (limits, `remembers`,
`MINES`, `readingPreview`, `trialTimeline`); `memoryBlock` in the prompts;
`apps/mobile/src/lib/trial.ts` (value moments → `/trial/start`, the offer
sheet); the Office reading gate and the update gate; Ines's unread-notes
line; the plans page timeline. Hand-offs are delivered on every plan and
the Monday/Friday restriction on Ines is gone: both read as pettiness.

## 7. Accounts and email (7 Sep 2026)

The floor server was already the identity authority with Resend outbound
mail. Added: a six-digit confirmation code in the welcome mail
(`/auth/verify`, `/auth/verify/start`, `acct.verifiedAt`), an
eight-character reset code beside the reset link so the app can reset
without leaving (`/auth/reset` with `email` + `code`), `/auth/me` (who the
token is, operator or not, Friday mail on or off, trial used), `/auth/prefs`
(the Friday review switch), the Friday review sweep (Fridays from 07:00
UTC, once per ISO week, confirmed opt-ins only), and `/admin/outbox` +
`/admin/friday-review` for the console. The app's sign-in sheet now has
walk in / take a badge / confirm / forgot / reset; the badge dialogue has
the confirmation, the Friday switch and, for `ADMIN_EMAILS`, the door to
`/dev/console`. Test: `node server/test/auth-email.mjs`.

To make mail leave the VPS: `RESEND_API_KEY`, `EMAIL_FROM` (a verified
domain in Resend), optionally `EMAIL_REPLY_TO`, then `systemctl restart
founderfloor`. `EMAIL_ECHO=1` is a test seam only.
