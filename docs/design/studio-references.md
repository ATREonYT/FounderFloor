# The studio's references

What each archetype copies from the apps people already pay for, and where the studio does better. The studio draws to these (`packages/shared/src/studio/references.ts`), the brief carries the same line as part of its design system, and the model is told to work to it.

| Archetype | Copied from | The pattern | Better than them |
|---|---|---|---|
| ledger | Revolut, Stripe | Balance card with the big number on the brand colour; four round quick actions; transactions grouped by day with avatar, name, line and a tabular amount; detail with the amount as hero, a status timeline, two actions | No promotions, no second currency, no upsell tiles. "Due" and "Paid" are words on pills, never colour alone |
| feed | Instagram, Threads, Reddit | People with rings at the top; a composer that asks a question; posts with avatar, name, time, text, a drawn picture, an action row with counts; a thread with a reply field pinned at the bottom | Honest counts, no suggested accounts, no ads between posts; the composer asks the product's own question |
| listings | Airbnb, Booking | A search pill saying what, where, when; category icons with labels; picture-led cards with a heart, title, place, rating and price with its unit; a floating Map pill; a detail with the rating beside the title, the host, and a price bar with one button | Six cards, not sixty; the unit always beside the price; "responds within an hour" said plainly |
| bookings | Fresha, Calendly, Square Appointments | A day strip; two numbers for the day; the day as an agenda with a time gutter and coloured blocks; free slots visible; a detail that picks service, day and slot with the total in a bar | Free slots are visible and tappable; confirming takes one tap with the total in sight |
| tracker | Strava, Apple Fitness, Headspace | Three rings for today; a streak with a flame; today's items as check rows; the week as bars; a detail with a route, a stat trio, a chart and a Log button | One goal, three numbers, no badges shop; the streak never guilt-trips |
| learn | Duolingo | A unit banner with streak and points; lessons as nodes down a winding path (done, current, next, locked); a Continue card; a lesson with three steps and Start | No hearts, gems or lives. Locked means "not yet", not "pay" |
| inbox | WhatsApp, Telegram | Search; a pinned row; chats with avatar, name, last line, time and unread count; compose; a chat with a date pill, bubbles with tails, read ticks and an input bar | No stories, no channels tab, no status ring. Unread counts and read ticks say the state in shape as well as colour |
| map | Uber, Bolt | A map filling the top; a sheet with a handle holding "Where to?", saved places and recents; a detail with ride options (mark, name, ETA, price), a pick-up/drop-off timeline and a confirm bar | Three options, the price on each, the fare said once |
| dashboard | Linear, Vercel, Stripe | Two stat tiles with a sparkline each; a segmented time range; one chart with the last value labelled; activity rows with a status dot and a word; a detail with the number as hero, week bars and a breakdown | One chart, one axis, one series; trend over decoration; every status has a word beside its dot |
| store | Amazon, Shop, Glovo | Search; a promo banner with a picture and one button; category chips; product tiles with a picture, round add button, rating and price; a cart bar pinned at the bottom; a detail with gallery dots, options, a stepper and Add to cart with the price | No countdowns, sponsored rows or fake stock counts |

## The rules the parts follow

From the UI/UX Pro Max guidelines (MIT) and the data visualisation method: touch targets at least 44 pt, 8 pt between them; body text 15 to 16 px, labels never under 12 px; one primary action per screen; bottom navigation at most five items with icon and label; tabular figures for prices, times and counts; state never conveyed by colour alone (a word, a tick, a dot with a label); charts with thin marks (2 px lines, 4 px rounded bar ends, ≥ 8 px end markers), one series and no legend, the last value labelled directly, recessive gridlines, values in the ink colour rather than the series colour; every button checked against its ground for contrast.

## Sources

- Airbnb 2025 release and its redesigned app: https://news.airbnb.com/airbnb-2025-summer-release
- Duolingo's path home screen: https://blog.duolingo.com/new-duolingo-home-screen-design
- Uber home screen pattern (map, "Where to?", sheet): https://www.androidpolice.com/uber-ui-overhaul-personalization/
- Strava activity stats in the feed: https://support.strava.com/en-us/articles/15401664-activity-stats-in-the-feed
- Revolut send-money flow and home layout: https://medium.com/@leahszielinski/revolut-breaking-down-the-send-money-user-flow-51d2dd697e90
- UI/UX Pro Max guidelines and tables: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT)
- Anthropic frontend-design skill: https://github.com/anthropics/skills (Apache 2.0)

Rendered examples for eleven founders live in `docs/design/studio/`.
