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

## Where things are

| Path | What |
| --- | --- |
| `src/app/(tabs)/reception.tsx` | The desk — the chat-first home. |
| `src/app/(tabs)/stand.tsx` | Your stand, the week's numbers, the Sign Painter's repaint dialogue. |
| `src/app/(tabs)/coaches.tsx` | The hall's keepers as coaches. |
| `src/app/(tabs)/floor.tsx` | The real hall in a WebView. |
| `src/app/(tabs)/inbox.tsx` | Conversations from the floor. |
| `src/app/dev/kit.tsx` | Gate 1: every kit component beside the site's original. |
| `src/lib/receptionist.ts` | The scripted desk. Replaced by the Anthropic Edge Function at Gate 5. |
| `src/lib/mock.ts` | Stand-in data, shaped like the real records. Replaced at Gate 2. |
| `../../packages/ui` | The kit. |

The composer says **Rehearsal** in its status line while `receptionist.ts` is
answering. It must never say anything else while it is.
