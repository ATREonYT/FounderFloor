/**
 * What the category leaders taught each archetype: the layout people
 * already know how to use, copied, then bettered where the leaders are
 * cluttered or sell too hard. The studio draws to these; the brief and
 * the model are told to work to them; docs/design/studio-references.md
 * keeps the sources.
 */
import type { Archetype } from "./plan.ts";

export interface Reference {
  apps: string[];
  /** The pattern, in one sentence a builder can follow. */
  pattern: string;
  /** What the studio does better than the leaders. */
  better: string;
}

export const REFERENCES: Record<Archetype, Reference> = {
  ledger: { apps: ["Revolut", "Stripe"], pattern: "A balance card with the big number on the brand colour, a row of four round quick actions under it, then transactions grouped by day with an avatar, a name, a line and a tabular amount; a detail with the amount as a hero, a status, and two actions.", better: "No promotions, no second currency, no upsell tiles: the balance, the actions, the rows. Due and paid are words on pills, never colour alone." },
  feed: { apps: ["Instagram", "Threads", "Reddit"], pattern: "A row of people with rings at the top, a composer that asks a question, then posts as cards with avatar, name, time, text, a drawn picture where there is one, and an action row with counts; a thread detail with replies and a reply field pinned at the bottom.", better: "Counts stay small and honest, no suggested accounts, no ads between posts, and the composer asks the product's own question." },
  listings: { apps: ["Airbnb", "Booking"], pattern: "A search pill that says what, where and when, a row of category icons with labels, then picture-led cards with a heart, a title, a place, a rating and the price with its unit; a floating Map pill at the bottom; a detail with a big picture, the rating beside the title, the host, and a price bar with one button.", better: "Six cards not sixty, the unit always beside the price, and the host answers within an hour is said plainly." },
  bookings: { apps: ["Fresha", "Calendly", "Square Appointments"], pattern: "A day strip with the day's number under its name, two numbers for the day, then the day as an agenda: a time gutter and blocks with the person, the service and the place; a New booking button; a detail that picks the service, the day and the slot, with the total in a bar.", better: "Free slots are visible in the agenda, and the booking confirms in one tap with the total in sight." },
  tracker: { apps: ["Strava", "Apple Fitness", "Headspace"], pattern: "Three rings for today, a streak chip with a flame, then today's items as check rows and the week as bars; a detail with a stat trio (how far, how long, how fast), a chart and a Log button.", better: "One goal, three numbers, no badges shop; the streak is shown but never guilt-trips." },
  learn: { apps: ["Duolingo"], pattern: "A unit banner with a streak and points, then the lessons as nodes down a winding path (done, current, next, locked), a Continue card; a detail with the lesson's three steps and a Start button.", better: "No hearts, no gems, no lives: the path, the streak and the lesson. Locked means not yet, not pay." },
  inbox: { apps: ["WhatsApp", "Telegram"], pattern: "A search field, a pinned row, then chats with an avatar, a name, the last line, the time on the right and an unread count; a compose button; a chat detail with a date pill, bubbles with tails, read ticks and an input bar with attach and send.", better: "No stories, no channels tab, no status ring: the chats. Read ticks and unread counts say the state in shape as well as colour." },
  map: { apps: ["Uber", "Bolt"], pattern: "A map filling the top, a sheet with a handle over it holding a Where to field, saved places (home, work) and recent destinations; a detail with ride options (mark, name, ETA, price) and a confirm bar.", better: "Three options, the price on each, and the fare said once in the confirm bar." },
  dashboard: { apps: ["Linear", "Vercel", "Stripe"], pattern: "Two stat tiles with a sparkline each, a segmented time range, one chart with the last value labelled directly, then activity rows with a status dot and a word; a detail with the number as a hero, bars for the week, and a breakdown.", better: "One chart, one axis, one series; the trend is emphasised over decoration, and every status has a word next to its dot." },
  store: { apps: ["Amazon", "Shop", "Glovo"], pattern: "A search field, a promo banner with a picture and one button, category chips, product tiles with a picture, a round add button, a rating and the price, a cart bar with the count and total pinned at the bottom; a detail with a gallery, options chips, a quantity stepper and Add to cart with the price.", better: "No countdowns, no sponsored rows, no fake stock counts: the products, the prices, the cart." },
};

/** One line for the brief and the model: the leaders' pattern for this archetype. */
export function referenceLine(a: Archetype): string {
  const r = REFERENCES[a];
  return `Main screen, the way ${r.apps.join(", ")} do it: ${r.pattern} Better than them: ${r.better}`;
}
