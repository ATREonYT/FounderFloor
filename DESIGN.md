# Design

<!-- impeccable:design-schema 1 -->

The night hall. FounderFloor's second visual world, replacing the expo-badge material (foamcore plates with a clipped corner, mono labels, pixel scenes as page headers). Product truth is in PRODUCT.md and does not change. This file owns the durable visual decisions; `packages/ui` is the implementation and wins on any detail this file does not name.

## The world in one line

A trade-show hall after hours: deep graphite grounds lit by a few warm lights, and every surface a pane of frosted glass that catches them. The people are still the pixel keepers, small and bright against the dark, the one thing no other app has. Everything else is quiet, rounded, and made of light.

## Mode

Dark is the hero. Light is a full, designed appearance (a daylit hall: soft grey grounds, white glass, the same lights), never an inversion. Both are tested at every change.

## Colour

The palette is a ground, one glass material at three strengths, three text steps, one accent, and three semantic colours. Nothing else. Hex values live in `packages/ui/src/theme.ts`; the roles here are the contract.

| Role | Dark (hero) | Light | Rule |
|---|---|---|---|
| ground (`paper`) | #0B0E12 | #F2F4F7 | The page. Always under the lights (see Lights). |
| glass (`panel`) | white at 7% over blur | white at 72% over blur | Cards, sheets, the bar. Never opaque. |
| glass raised | white at 12% | white at 88% | Pressed and lit surfaces, the active disc. |
| well | white at 5% | black at 4% | Inset fields and quiet chips. |
| line | white at 10% | black at 6% | Hairlines. One pixel. |
| ink | #F4F6F8 | #101418 | Primary text. |
| muted | ink at 64% | #5B626A | Secondary text. 7:1 dark, 5.6:1 light. |
| faint | ink at 50% | #646B73 | Labels and captions. 4.8:1 dark, 4.9:1 light. Never below. |
| accent, ember | #FF6B3D | #BE241B as text, #F2613F as fill | The one accent: primary action, current selection, the live dot. Never decoration. Text on an ember fill is ink, not white (6.5:1). |
| gold | #E4C77A | #B18C39 | Membership only. |
| verify | #4CD08A | #298646 | Done, online, verified. |
| fountain | #6FD3E0 | #207582 | Focus only. |

Room and stop colours (the six rooms on the map, the seven stops on the road) keep their hues from the first world, used as a glow behind glass and as a ring, never as a fill under text.

## Lights

Every screen ground carries the hall's lights: two or three large, soft radial glows (the ember and a cool blue, at low alpha) fixed near the top of the screen, drawn once in the root layout behind every page. They are what the glass refracts; without them glass is grey. They never move except in the opening animation, and they respect Reduce Motion.

## Glass

One material, `Plate`, with tones: `panel` (the card), `glass` (the bar and the composer, stronger blur), `paper` (the quiet inset), `plate` (the one opaque dark sign for the stand's name). Anatomy, in order: a real blur of what is behind (expo-blur, 20 to 40), the tint fill, a one-pixel hairline, and a top-edge light (a one-pixel highlight that fades across the first third of the height). Depth comes from the blur and the highlight, not from shadows; the only cast shadow is under the floating tab bar and a sheet.

Rings, not borders: a card that is lit or done gets a 1.5 px ring in its colour on the same rounded outline.

No clipped corner. No bevel. Nothing square: radii are 10 / 14 / 18 / 22 / 30 and the pill.

## Type

One family, Inter, at four weights (400, 500, 600, 700), with tabular figures wherever a number can change. Mono (IBM Plex Mono) survives only for code and pasted text, never for labels.

| Role | Size / line | Weight | Tracking |
|---|---|---|---|
| Display 4xl | 44 / 50 | 700 | -0.025em |
| Display 3xl | 34 / 40 | 700 | -0.02em |
| Display xl | 26 / 32 | 600 | -0.015em |
| Display lg | 20 / 26 | 600 | -0.01em |
| Body lg | 19 / 26 | 400 | 0 |
| Body base | 17 / 24 | 400 | 0 |
| Body sm | 15 / 20 | 400 | 0 |
| Body xs / Spec | 13 / 18 | 500 | +0.01em |

Labels (`Spec`) are Inter 13 medium in the muted or faint step, sentence case. The uppercase section labels of the first world are gone; a section is named by a small heading or not at all.

## Shape and space

The unit is 4. Cards pad 16 or 20; sections breathe 24; the page gutter is 20 on a phone. Concentric radii: a child's radius is the parent's minus the gap.

## The characters

The pixel keepers (20 by 28, at 2x or 3x), the desk, the coaches and the founder's own keeper stay exactly as drawn. They stand on glass, never on tiled floors: a keeper appears in a `Stage` (a glass card with a soft glow in the keeper's colour, the figure at 3x, a clean speech bubble) or as a `Keeper` chip beside a message. The pixel glyphs stay as the icon set (they are drawn in one stroke and read at 12 and 24); they sit in `GlyphTile` wells tinted with their colour.

The tiled room scenes and walking crowds of the first world are retired from page headers. They may return inside the map's floors and the stand's own card, where a room is the subject.

## Motion

Product motion: 150 to 250 ms, state only. Enter with a strong ease-out from an already-visible default; move across with ease-in-out; sheets on the iOS sheet curve. Springs only where a finger started it. Reduce Motion drops travel and keeps cross-fades. The one authored moment is the opening: the lights come up, the glass tile breathes once, the keeper arrives, under 1.4 s, skipped under Reduce Motion.

## Anti-references

The first world's badge material, mono labels and awning stripes. Purple-to-blue gradient heroes. Neon on black. Glass as decoration on every element (the composer, the bar and cards are glass; text and buttons are not). Emoji as icons.
