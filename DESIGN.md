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
| accent, the tarp red | #E8665A as text, #C8281E as fill | #BE241B | The one accent, the brand's red: primary action, current selection, the live dot. Never decoration. Text on the red is white, bold (5.6:1 by night, 6.1:1 by day). |
| gold | #E4C77A | #B18C39 | Membership only. |
| verify | #4CD08A | #298646 | Done, online, verified. |
| fountain | #6FD3E0 | #207582 | Focus only. |

Room and stop colours (the six rooms on the map, the seven stops on the road) keep their hues from the first world, used as a glow behind glass and as a ring, never as a fill under text.

## Lights

Every screen ground carries the hall's lights: two or three large, soft radial glows (the tarp red, a cool blue and a little brass, at low alpha) fixed near the top of the screen, drawn once in the root layout behind every page. They are what the glass refracts; without them glass is grey. They never move except in the opening animation, and they respect Reduce Motion.

## Glass

One material, `Plate`, with tones: `panel` (the card: near-solid, a light blur under it, a hairline and a two-pixel foot, the thing a hand can rest on), `glass` (the bar, the composer and the sheet: real blur, because they float over content, with the top-edge light), `paper` (the quiet inset), `plate` (the one opaque dark sign for the stand's name). Glass is for what floats; cards are panels. Depth comes from the foot and the hairline, not from shadows or glow; the only cast shadow is under the floating tab bar and a sheet.

Rings, not borders: a card that is lit or done gets a 1.5 px ring in its colour on the same rounded outline.

No clipped corner. No bevel. Nothing square: radii are 10 / 14 / 18 / 22 / 30. Pills are for chips and the tab bar only.

## Buttons

A key, not a sticker. Primary: flat brand red, corners of 11, 48 high, white Archivo 600 text, a one-pixel light along the top edge and a hard three-pixel foot in a deeper red under it; pressing pushes the key down onto its foot. No gradient, no glow, no cast shadow. The one action a card is for stretches to the row. Secondary: a panel key, the card's fill with a hairline and a foot in the line colour, ink text. Ghost: red text and nothing else, the plain style for Cancel, Skip and Back. Never a pill, never dark text on the accent, never a gradient.

## Pictograms

The icon family is drawn by hand on a 16 by 16 grid in three tones of one colour (body, shade on the lower and right edges, light on the upper left) and rendered as crisp rectangles at 16, 24 or 32 (`packages/ui/src/PixelIcon.tsx`). They are the pixel keepers' world at icon size: hard edges, two-tone shading, nothing thin, nothing outlined. They sit in quiet neutral wells, coloured by their own body colour, never in tinted squares. No emoji, no thin-line icon set, no glyph scaled from the 8 by 8 atlas.

## Type

The faces the brand always had: Archivo (600, 700) for headlines and controls, IBM Plex Sans (400, 500) for the body and labels, IBM Plex Mono for code and pasted text only. Tabular figures wherever a number can change. Never a system default, never Inter.

| Role | Size / line | Weight | Tracking |
|---|---|---|---|
| Display 4xl | 42 / 46 | 700 | -0.02em |
| Display 3xl | 33 / 38 | 700 | -0.015em |
| Display xl | 26 / 31 | 600 | -0.01em |
| Display lg | 18 / 26 | 600 | -0.01em |
| Body lg | 18 / 26 | 400 | 0 |
| Body base | 16 / 24 | 400 | 0 |
| Body sm | 15 / 21 | 400 | 0 |
| Body xs / Spec | 13 / 18 | 500 | +0.01em |

Labels (`Spec`) are Plex Sans 13 medium in the muted or faint step, sentence case. The uppercase section labels of the first world are gone; a section is named by a small heading or not at all.

## Shape and space

The unit is 4. Cards pad 16 or 20; sections breathe 24; the page gutter is 20 on a phone. Concentric radii: a child's radius is the parent's minus the gap.

## The characters

The pixel keepers (20 by 28, at 2x or 3x), the desk, the coaches and the founder's own keeper stay exactly as drawn. They stand on glass, never on tiled floors: a keeper appears in a `Stage` (a glass card with a soft glow in the keeper's colour, the figure at 3x, a clean speech bubble) or as a `Keeper` chip beside a message. The pixel glyphs stay as the icon set (they are drawn in one stroke and read at 12 and 24); they sit in `GlyphTile` wells tinted with their colour.

The tiled room scenes and walking crowds of the first world are retired from page headers. They may return inside the map's floors and the stand's own card, where a room is the subject.

## The road

A stamp card. Seven stops down a dotted path in one ink; a stop that is done carries the red seal pictogram, stamped a little askew; the stop you are at has your own keeper standing on it; the stops ahead are empty dotted slots with their number in mono. No colour per stop, no coloured rings, no tinted washes: one ink, one red, and a person.

## Motion

Product motion: 150 to 250 ms, state only. Enter with a strong ease-out from an already-visible default; move across with ease-in-out; sheets on the iOS sheet curve. Springs settle without a bounce. Nothing moves on a page's own arrival: a tick that is already there is simply there. What does move, and why: a key presses down onto its foot (100 ms) and comes back (140 ms); a tick lands from slightly larger when the founder makes it (a spring, 220 ms); the red seal lands on the road the same way, from above and a little askew; the opened stop on the road unfolds in 220 ms and the rows below make room (a layout transition, never a jump); the keeper breathes 1.5 px every 1.8 s; the tab bar's disc slides in 220 ms; meters draw once. The one authored moment is the opening: the lights come up, the glass tile breathes once, the keeper walks in, under 1.4 s. All of it is a cross-fade or nothing under Reduce Motion.

## Anti-references

The tells of a generated interface, each of which this world has been caught by once and must not be again: Inter as the default face; purple-to-blue or orange-to-coral gradients; glossy pills with a specular sweep; glass on every card with a glow behind it; tinted icon tiles with a tiny glyph inside; the icon-plus-heading-plus-text card as page structure; uppercase mono labels over every section; emoji or thin-line icons; a bounce on every press. The retro is the answer to all of them: hard edges, a foot, a pixel pictogram, a hand-drawn keeper.
