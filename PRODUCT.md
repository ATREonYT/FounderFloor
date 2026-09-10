# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

(iPhone first; Android follows with the same look. A Next.js site at the repo root serves the public stand pages and the hall; the phone app in `apps/mobile` is the product.)

## Users

The primary user is a person with a start-up idea and no experience of building a company or an app. They have never written a spec, a line of code or a pitch; they do not know the words. They are alone, usually working evenings or part time beside a job, on a phone. Confirmed by the founder (Alex, solo, Cyprus) on 2026-09-10.

Other audiences appear only as the product grows: early founders already building without customers, and visitors who read a founder's public stand page. Neither is the design target.

## Product Purpose

FounderFloor takes a person from a start-up dream to a start-up: a written idea, a plan, five conversations, an app they can show, a first paying customer. It is a permanent trade-show hall for early-stage founders, drawn as a building with rooms, a desk and a staff of coaches, where the founder's own words become their plan, their tasks, their app's mock-up and the brief a builder tool makes the first version from.

Success is a founder who reaches the seventh stop on the road: one real person pays real money, and the week is logged. Behind that, the business succeeds when founders pay a subscription because the building keeps notes and moves them forward every week.

## Positioning

The building does the building. The founder never writes code, a spec or a wireframe: the Workshop's studio draws the app from the founder's sign, audience, price and what customers said, and writes the brief that Lovable, Base44, Bolt, v0 or Claude Code make the working version from. The desk writes the plan and every task's page; the coaches write the messages and do the sums. The founder's three jobs are to talk to real people, decide, and write down what happened. Everything written on any line is kept and read from then on, so the plan, the mock-up and the brief bend to what the founder actually did.

The road: seven stops (say your idea, make your plan, ask five people, do this week, see your app, build it, first paying customer) shown on Today with where you are and the one thing to do now. Every page says its stop.

## Operating Context

- A four-tab phone app: Today (the one thing, the road, this week), Map (six rooms from idea to money, drawn as floors), Coach (the desk and four coaches: Ines for the plan, Jonah for sales, Margot for the pitch, Theo for money), You (the company on one card, the Office, the plan, the notebook, the drawer, the floor, the plans, settings).
- Weekly rituals: Monday plan, three tasks a week, Friday log of five numbers in the Office, the week read back with a score out of 100.
- Each plan task opens a page with steps; each step, each line on a room's list and each thing the week's reading says to do opens a room where the founder writes what happened. The desk answers there.
- The Workshop shows the product mocked up as three to six tappable screens, a poster to show people, and a build brief plus a prompt to paste into a builder tool.
- Two running modes: with an AI key the model writes plans, pages, briefs and answers; without one (practice mode) every page is written by local rules and the desk answers from the page. Both must be complete and honest about which is running.
- The stand is public on the web at a slug URL with an open-graph image and an embeddable badge; the hall shows other founders' stands.
- Pricing tiers exist in code (Free, Pro, Founder+) with a reverse trial of a week with the whole staff; the paywall stands where the staff's memory would have spoken. These are product facts in `packages/shared/src/plans.ts`, not evidence of revenue.

## Capabilities and Constraints

- Stack: Expo SDK 57 / React Native with Expo Router, Zustand with persistence; a shared TypeScript package (`packages/shared`) holds the rules, prompts, the road, the studio and the tables; a UI kit (`packages/ui`) holds the tokens and every component. A Node floor server and Supabase edge functions serve the hall and the model calls.
- The app must work fully offline and without a key (practice mode). No screen may be empty or broken because the model did not answer.
- Everything the founder writes stays on the device; it reaches the model only after the founder has said yes to the desk keeping notes. The notebook can be read, exported and burned in Settings. This is a promise in the copy and must stay true of the code.
- The model never invents customers, revenue or numbers; legal and tax answers say "check the official source".
- Terminology is fixed and in the building's voice: the stand, the sign, the desk, the coaches, the rooms, the Workshop, the studio, the brief, the road and its stops, the notebook, the Office, the drawer, the floor, the hall. Never "dashboard", "onboarding", "AI assistant", "settings" as headings, or "users".
- The founder may never have built anything: every prompt carries the rule to explain each term the first time, never to ask for code, a spec, a wireframe, a schema or a deck, and to name the one smallest next thing and where in the building to do it.
- Undecided: Android timing; the hosted "build with Claude" path; billing wiring (RevenueCat) and EAS builds are planned, not done.

## Brand Commitments

- Name: FounderFloor. The world: a permanent trade-show hall for founders, with a retro expo-badge material and pixel-art keepers, scenes and glyphs.
- Voice: plain second-person English, short sentences, no headings in speech, no bullet symbols, no emojis, no exclamation marks; concrete, with the number the founder has to hit; warm but never flattering; blunt only when the founder asked for blunt.
- Visual identity lives in `packages/ui` (tokens, `Plate` with its clip corner, the sheen, the pixel atlas, the display/body/mono type roles) and in the studio's own design tables for the founders' mock-ups. Any visual work extends that system; a replacement is a decision for the founder, not a side effect.
- The mock-ups the studio draws for a founder's product are deliberately not in FounderFloor's own style: they follow the category leaders' patterns for that kind of app (Revolut, Airbnb, Duolingo, WhatsApp and the like), documented in `docs/design/studio-references.md`.

## Evidence on Hand

None yet. No paying customers, no testimonials, no press, no real founders on the floor as of 2026-09-10 (confirmed by the founder). The stands in the hall and the Lantern mock-up are samples and are labelled as samples wherever they appear; that labelling must stay. Future work must not fabricate customers, quotes, numbers, logos or press.

Real assets: the pixel atlas and scenes in `packages/ui`, the studio's rendered example sheets in `docs/design/studio/`, the design docs in `docs/design/` and `docs/*.md`.

## Product Principles

1. One thing to do next, always visible, in words a child follows.
2. The building does the building; the founder talks, decides and writes.
3. Nothing written is lost: every line is kept and shapes what comes next.
4. Honest state: practice mode says so, samples say so, numbers are the founder's own or absent.
5. Real people and real money beat likes, features and polish.

## Accessibility & Inclusion

The founder is a beginner, often on a phone one-handed in the evening. Every interactive element carries an accessibility label and role; touch targets are at least 44 pt; text must respect Dynamic Type; light and dark appearance are both first-class; state is never shown by colour alone (a word, a tick, a ring beside every colour). No formal standard has been adopted beyond these; WCAG AA contrast is the working floor.
