# FounderFloor — the app

Expo SDK 57 · React Native 0.86 · Expo Router. All UI comes from `packages/ui`
(the kit), which is the site's own tokens, type and sprite atlas; nothing native
or default shows on screen.

## Run it in Xcode (iOS Simulator)

You need a Mac with Xcode 16+ and its iOS Simulator installed
(Xcode → Settings → Components), plus Node 20+ and CocoaPods (`brew install cocoapods`).

```bash
git clone git@github.com:ATREonYT/FounderFloor.git
cd FounderFloor
git checkout reboot/ui-inventory
cd apps/mobile
npm install
npx expo run:ios
```

`expo run:ios` generates the native `ios/` project, installs pods, builds, and
opens the app in the Simulator. First build is a few minutes; later ones are
seconds. To open the project in Xcode itself afterwards:

```bash
open ios/FounderFloor.xcworkspace
```

then press ▶ with a simulator selected. To run on your own iPhone, plug it in,
pick it as the destination, and set your Apple ID under
Signing & Capabilities → Team (a free personal team is enough for testing).
Or from the terminal: `npx expo run:ios --device`.

The `ios/` folder is generated and ignored by git; `npx expo prebuild --clean`
regenerates it whenever `app.json` changes.

## Other ways to open it

- **In the browser:** `npx expo start --web` — the same app at http://localhost:8081.
- **On a phone without a build:** `npx expo start`, scan the QR with Expo Go.
  (The Floor tab uses a WebView, which Expo Go supports.)

## Turning the AI on

Everything that says **Rehearsal** in the app is scripted over your real
numbers. To make it live on your Mac today, create `apps/mobile/.env` (it is
git-ignored) with one line:

```
EXPO_PUBLIC_DEV_ANTHROPIC_KEY=sk-ant-…
```

and restart `npx expo run:ios`. The status lines switch to **Live · dev key
on this device only**. This path refuses to run in a release build; the
production path is the Supabase Edge Functions (`EXPO_PUBLIC_SUPABASE_URL`),
which hold the key server-side and gate the Free plan.

## Build with Claude Code, from the stand

`packages/mcp` is FounderFloor as an MCP server: Claude Code reads the
stand, the interviews and the drawer, and logs what shipped. See its
README. The stand's **Hand it to your builder** button produces the same
brief for anyone who never sets up MCP.

## Where things are

| Path | What |
| --- | --- |
| `src/app/start.tsx` | The three doors on first launch. |
| `src/app/idea/find.tsx`, `idea/check.tsx` | The idea finder and the second opinion. |
| `src/app/(tabs)/reception.tsx` | The desk — the chat-first home, with the four coaches. |
| `src/app/(tabs)/office.tsx` | The Office: weekly log, interview book, filing calendar, the update. |
| `src/app/drawer.tsx` | Documents drafted from the stand. |
| `src/app/plans.tsx` | The one paywall. |
| `src/app/(tabs)/stand.tsx` | Your stand, the week's numbers, the Sign Painter's repaint dialogue. |
| `src/app/coaches.tsx` | The four coaches, about. |
| `src/app/(tabs)/floor.tsx` | The real hall in a WebView. |
| `src/app/inbox.tsx` | Messages, hand-offs, coach nudges. |
| `src/app/dev/kit.tsx` | Gate 1: every kit component beside the site's original. |
| `src/lib/ai.ts` | The one door to a model: Edge Function, dev key, or rehearsal. |
| `src/lib/receptionist.ts`, `lib/guide.ts` | The scripted coaches, computing over real numbers. |
| `src/lib/mock.ts` | Stand-in data, shaped like the real records. Replaced at Gate 2. |
| `../../packages/ui` | The kit. |

The composer says **Rehearsal** in its status line while `receptionist.ts` is
answering. It must never say anything else while it is.

## Accounts, email, and the dev console

The app signs in at the floor server (`EXPO_PUBLIC_FLOOR_URL`). Taking a
badge sends a welcome email with a six-digit code; the sheet asks for it
next (or later, from Stand → your name → Confirm your email). Forgot the
password sends an eight-character code that the sheet accepts in place
of the site's link. Both need the server to have `RESEND_API_KEY` and a
verified `EMAIL_FROM`; without them the server still answers and simply
does not send.

An account whose email is on the server's `ADMIN_EMAILS` (default
`ak@founderfloor.net,ak@founder-floor.com`) sees **Operator · Dev
console** in the badge dialogue: server counts, mail status, the outbox,
a grant form, the Friday sweep, and this device's AI mode, sandbox plan
and counters.

To try it all against a local server:

```
FF_DATA_FILE=/tmp/floor.json PORT_WS=3569 EMAIL_ECHO=1 ADMIN_EMAILS=ak@founder-floor.com node server/index.mjs
EXPO_PUBLIC_FLOOR_URL=http://127.0.0.1:3569 npx expo start
```

`EMAIL_ECHO=1` keeps every email in memory (`GET /debug/emails`, and the
console's outbox) instead of sending it.

## The subscription

Free is the whole loop: the stand, the floor, the workshop, the weekly
log, Ines every day, three idea runs, two second opinions, three drafts a
month. The first value moment (a second opinion read, a week logged, a
coach's first reply) starts seven days of the whole staff on the server,
once per account. After that, Pro is the staff's memory: coaches carry the
log, the interview book and past conversations; Theo reads week against
week; the update drafts itself. The reasoning and sources are in
`docs/reboot-plan.md`, section 6.
