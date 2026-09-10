# Audit: Today (`apps/mobile/src/app/(tabs)/today.tsx`)

Run with the Impeccable native audit playbook against the iOS reference, 2026-09-10, from source and the web export's screenshots (no Simulator in this session; the fixes were verified in the web export in both appearances). Scores are before the polish pass that followed; the "after" column says what the pass changed.

## Audit health score

| # | Dimension | Before | Key finding | After |
|---|---|---|---|---|
| 1 | Accessibility | 2 | Faint labels at 12 px measured 2.7:1 on the paper in light; white on the dark accent 3.6:1 on the primary button; top-bar controls and the small button at 36 pt | 3 |
| 2 | Performance | 3 | Today subscribes to the whole task map, so any step written anywhere re-renders it; content is short, so it is not felt | 3 |
| 3 | Appearance & theming | 3 | Room colours repeated as a local hex array beside the shared table; two tile colours hard-coded | 3 |
| 4 | Platform conformance | 2 | Floating pill tab bar, custom top bar, pixel glyphs and hand-drawn checkboxes instead of UIKit controls and SF Symbols | 2 |
| 5 | Adaptivity | 3 | One column capped at a max width on iPad; landscape phone handled; no keyboard on this screen | 3 |
| | Total | 13/20 acceptable | | 14/20 good |

## Platform conformance verdict

Pass, with deliberate departures. This does not read as a ported website: the edge-swipe back stays alive (expo-router's native stack), content sits inside the safe-area insets top and bottom, the tab bar has four sections and no actions, sheets are used for self-contained tasks (the rooms, the notebook question), and Reduce Motion is honoured in the tap, the streak, the tab bar and the scenes. The departures are the committed world recorded in PRODUCT.md, not accidents: a floating foamcore pill for the tab bar rather than UITabBar, a custom top bar with the date instead of a large title, pixel-art sprites instead of SF Symbols, drawn tick circles instead of system controls, and Archivo/IBM Plex instead of San Francisco. A fluent iPhone user will read it as a game-like companion, not as a system app. The score of 2 records the distance from the HIG, not a defect list.

## Findings

**[P1] Faint labels fail contrast in light.** `shell.faint` was `#8D9399`, which measures 2.72:1 on the paper and 3.04:1 on a panel, at 12 px mono. On Today it carried "STOP 2 OF 7 · 1 DONE", "2 of 5", the task's time, "Five numbers, Fridays" and "A score, and what to fix". Category: accessibility. Fixed at the token: light faint is now `#656C73` (4.66:1 on paper, 5.21:1 on a panel); dark faint moved from `#7A828A` to `#8A929A` (5.7:1). Every faint label in the app inherits it.

**[P1] White on the dark accent fails on the primary button.** In dark, `shell.accent` is lifted to `#E05B4C` so it reads as text on dark grounds (4.5:1), but the primary button used it as a fill under white text: 3.64:1 for "Answer the questions". Category: theming / accessibility. Fixed with a new token `accentFill` (`#BE241B` by day, `#C93F31` by night, 4.95:1 under white) used by the primary button and the composer's send disc. Accent as text is unchanged.

**[P2] Controls under 44 pt.** The top bar's avatar, inbox and back controls are 36 pt; the small button (the road's "go", the hint's "Got it") is 36 pt; the task row's tick circle is 26 pt with 8 pt of slop (42); the "All four weeks" link was 24 pt tall. Category: accessibility. Fixed: 4 pt of hit slop on the small button and the top-bar controls (44 effective), 10 pt on the tick (46), 11 pt on the list Tick (44), and the link is a 44 pt row.

**[P2] Decorative chevrons in the reading order.** The `›` after each task row, each road stop and each list line was a text node VoiceOver reads as "greater than". Category: accessibility. Fixed: hidden from assistive tech on Today, the road and the Tick row.

**[P2] Room colours duplicated.** Today kept its own `DOOR` hex array beside `ROOM_COLOR` in `lib/glyphs.ts`; the map already read the shared table. Category: theming. Fixed: Today reads the table.

**[P3] Whole-map subscription.** `useFounder((s) => s.tasks)` re-renders Today when any step room is written to. Category: performance. Not fixed: the screen is short and the render is cheap; select the three keys of the week if it ever shows.

**[P3] Two tile colours hard-coded.** The Office and review tiles use `#5E7C93` and `#6B4E71` inline; they are the road's colours for those stops. Category: theming. Not fixed here; belongs with a pass that names the stop colours as tokens (`/impeccable extract`).

**[P3] Nested buttons.** The one-thing card is a button that contains a button with the same action; VoiceOver announces both. Category: accessibility. Not fixed: both work; a pass could make the inner button the only one.

## Patterns

- Contrast was set by eye at the token level and never measured; two tokens failed and every screen inherited it. Measure tokens, not screens.
- Every 36 pt control was 36 pt because the design height is 36; hit slop fixes the target without changing the look.

## Positive findings

Every interactive element already carried a role and a label, including the checkboxes' checked state. Reduce Motion is honoured everywhere motion exists. Both appearances are designed, not inverted. Safe areas are respected top and bottom, and the bottom chrome clears the floating bar. State is never colour alone: the done tick, the ring, the "DONE" word and the "2 of 5" count all travel with the colour.

## Recommended next

1. `/impeccable extract`: name the stop and room colours as tokens so no screen carries a hex.
2. `/impeccable adapt`: an iPad layout that uses the width (two columns for the road and the week) rather than one capped column.
3. `/impeccable audit` again on the Workshop and the room page, which carry more controls than Today.
