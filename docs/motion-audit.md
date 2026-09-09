# Motion audit: the Apple design pass

Run on 2026-09-09 with the `apple-design`, `improve-animations`,
`review-animations` and `animate-expo` skills (in `.claude/skills/`),
against commit `6a1791f`. **That commit is the design before this pass.**
It is on the branch's history and tagged `design/before-motion-pass`
locally; to look at it again: `git checkout 6a1791f`.

## Recon

Expo SDK 57, Reanimated 4.5 with worklets 0.10, Gesture Handler 2.32,
expo-haptics. Motion lives in `packages/ui` (Tap, Button, TabBar,
Dialogue, Toast, Composer, Stage, Scene, Building, Ring, Progress,
Sparks) and in a few screens (entrances on the plan, task and review
pages; the welcome's step change). Tokens: `ease`/`ms` in
`packages/ui/src/tokens.ts`. Personality: a warm, physical, pixel-art
building; motion should feel like things with weight, not like a
dashboard and not like a game.

Frequency map: taps on cards and buttons and tab switches happen
hundreds of times a day; sheets open tens of times; the plan and task
pages open tens of times; the welcome, the tour, a task finishing and a
week's reading are rare.

## Findings, and what was done

| # | Severity | Where | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| 1 | HIGH | `Dialogue.tsx` sheet | A 10px rise and a fade, 200ms; no drag; closing unmounted the modal instantly so the exit was never seen; scrim on its own timer | Rises from the bottom edge on the iOS sheet curve (320ms), leaves the way it came (240ms); awning, handle and header drag 1:1; rubber-bands past the top; release projects the flick's velocity and hands it to the spring; scrim opacity derived from the sheet's position; grabbing mid-flight starts from where it is; reduced motion cross-fades | Direct manipulation, velocity handoff, momentum projection, spatial consistency, interruptibility |
| 2 | HIGH | `Tap.tsx` | Release sprang back with overshoot (`damping 12`) and a haptic fired on every card tap | Press-in 100ms and release 140ms on the strong ease-out, no bounce; no haptic unless the screen asks for one | Bounce belongs to things that were thrown; a haptic on every tap trains the hand to ignore the ones that matter |
| 3 | HIGH | `Button.tsx` | Release on an overshooting curve (220ms) with a 3px lean on every press | Key down 100ms, up 140ms, strong ease-out, no lean on press | A button is pressed all day; response snaps, nothing wobbles |
| 4 | HIGH | `Scene.tsx` walkers, `Building.tsx` keeper, `Stage.tsx` mouth | Frames stepped with `setInterval` + `setState`, a React render 5 to 7 times a second per figure, on the JS thread | `SpriteCycle`: every frame drawn once, a shared value counts through them on the UI thread, React never re-renders | The single biggest cause of jank in RN is a render per frame |
| 5 | MEDIUM | `TabBar.tsx` | Spring `damping 26 stiffness 420` | 220ms strong ease-in-out (moving across the bar, not entering it) | Tab switches are the most frequent action; under 300ms, no spring where no finger threw anything |
| 6 | MEDIUM | `Toast.tsx`, `Composer.tsx` | Overshoot curves (`ease.spring`, `ease.release`), 300ms toast | Strong ease-out, 220ms in / 160ms out; arrow 150ms; scale from 0.95 | No bounce on system responses; nothing appears from nothing |
| 7 | MEDIUM | `_layout.tsx` tabs (done in the previous commit) | Tab scenes slid | `animation: "none"`, frozen off screen, lazy | Tabs are peers; sliding implies a depth that is not there |
| 8 | LOW | Plan, task, review entrances | 60 to 80ms stagger, 240ms | 40ms stagger, 200ms | Pages opened tens of times a day; the stagger is decorative and must not be waited for |
| 9 | LOW | `Journey.tsx` | Dead since the building replaced it | Deleted | Less to keep in step |
| 10 | LOW | `app.json` | No ProMotion flag | `CADisableMinimumFrameDurationOnPhone: true` | 120fps on phones that have it (needs `npx expo prebuild`) |
| 11 | Missed opportunity | Task step circles, plan tick boxes | Colour jumped on tick | 150ms colour transition (Reanimated CSS transition) | State indication without a jump |

Kept as they were, on purpose: the keeper's breathing (0.6 Hz, gentle);
the Ring's 900ms reveal and the CountUp (data reveals, occasional); the
Sparks burst on a task finishing (rare, the delight budget); the
welcome's step change (asymmetric already: in 260ms, out 160ms); the
tour's fades; screen pushes on the native stack (platform default).

New tokens in `tokens.ts`: `curve.out`, `curve.inOut`, `curve.sheet`
and `spring.settle` / `spring.snap` / `spring.sheet`. New components
should draw from these, never type a curve.

## What to feel-check on a phone

None of this can be judged from code or from the browser. On the
simulator, and better on a real phone in a release build:

1. Open any room on the map. Drag the sheet down by its awning or
   header slowly: it should follow the finger exactly. Push it up: it
   should resist. Flick it down a short way: it should go. Drag it far
   down slowly and let go: it should come back with a light tick.
2. Grab the sheet while it is still rising. It should follow from where
   it is, not jump.
3. Tap cards and buttons. They should dip the instant the finger lands
   and settle without wobble.
4. Watch the walkers in the lobby while typing at the desk. They should
   not stutter while the JS thread is busy.
5. Switch tabs quickly back and forth. The disc should move without
   overshoot and never lag the tap.
