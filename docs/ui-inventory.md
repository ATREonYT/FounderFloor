# FounderFloor — UI inventory for the app

Everything the mobile app must reproduce, catalogued from the repo with the
file that owns each fact. Read this before touching `packages/ui`.

**The single most important finding:** the site has almost no image
assets. Fourteen PNG/SVG files exist and they are logos and promo material.
Every booth, avatar, tile, prop, glyph and badge is **drawn by code** —
`game/*.ts` against the canvas API, `components/PixelGlyph.tsx` and
`components/PixelLogo.tsx` as SVG rects. So "copy the raw assets" means
**run the site's own renderers and rasterize their output.** The site
already does this for its OG cards: `game/svgCanvas.ts` is a recording 2D
context that turns the real drawing functions into SVG, "the artwork by
construction: there is no second copy of the booth to drift." The app's
sprite atlases come from the same shim (see §3 and `scripts/ui-atlas.ts`).

Two other findings that change the brief:

- **The site is silent.** No audio files, no `Audio`/`AudioContext`
  anywhere. The brief's "reuse the same sounds" and "haptics only where the
  site plays a sound" therefore resolve to: no sound, no haptics, in v1.
  Adding sound is a *change*, not a copy — it is question 4 for Alex.
- **There is no pixel font.** In-canvas lettering is `fillText` in system
  fonts (`ui-monospace`, `system-ui`, Georgia) at 6–13px — so sign text
  already renders differently on every OS today. The OG renderer sidesteps
  this with a 3×5 bitmap alphabet (`svgCanvas.ts:PIXEL_FONT`). The app
  bundles IBM Plex Mono for canvas text so every platform matches; that is
  a deliberate deviation, recorded in §2.

---

## 1. Colour

Two palettes coexist and **must not be merged**: the marketing shell is
oklch on hue 250 (cool); the hall's art is warm hex. The app uses the
shell palette for chrome and the art palette for anything drawn.

### 1a. Shell — `app/globals.css` `:root` (oklch L C H), aliased in `tailwind.config.ts`

| material | oklch | sRGB | semantic alias | used for |
|---|---|---|---|---|
| foamcore | 99.2% 0.004 250 | `#FAFDFF` | `panel` | cards, header, footer |
| screed | 95.5% 0.006 250 | `#EDF0F4` | `paper` | page ground, inputs |
| laminate | 92.5% 0.007 250 | `#E3E7EB` | — | inset wells, glyph frames on paper signs |
| trestle | 87% 0.008 250 | `#D0D5D9` | `line` | hairlines, rules |
| gantry | 66% 0.012 250 | `#8D9399` | — | faint labels, code slot on dark signs |
| conduit | 44% 0.014 250 | `#4D535A` | `muted` | secondary text (2.63:1 on dark — never use there) |
| flightcase | 38% 0.014 250 | `#3D434A` | — | strong secondary |
| gaffer | 20% 0.012 250 | `#12171B` | `ink` | text, dark fills, dark section ground |
| blackout | 11% 0.012 250 | `#020508` | — | sign plates, closing band |
| tarp | 52% 0.19 29 | `#BE241B` | `accent`, `accent-strong` | CTAs, live dots, destination signs (5.27:1 on paper) |
| tarp-lift | 64% 0.17 29 | `#E05B4C` | `accent-lift` | the accent **on dark grounds only** (5.63:1 on blackout; fails on paper at 3.19) |
| tarp-wash | 93% 0.03 29 | `#FBE1DD` | `accent-soft` | selection, washes |
| brass | 66% 0.11 85 | `#B18C39` | `gold` | membership fills/dots/borders only |
| brass-deep | 48% 0.10 85 | `#775800` | `gold-deep` | membership as TEXT |
| fountain | 52% 0.08 210 | `#207582` | — | **wayfinding only** — input focus, you-are-here |
| exitsign | 55% 0.13 150 | `#298646` | `verify` | online, success, verified (4.48:1 on panel — hairline miss, documented) |

Rules that come with the palette (`globals.css`, `tailwind.config.ts`):
gold is reserved for membership and verified revenue; fountain for
wayfinding; `muted` never on a dark ground (use `paper/60` = 6.54:1);
`accent` never as text on dark (use `accent-lift`). Text over 30px gets
negative tracking. Digits are `tabular-nums` everywhere they line up.

### 1b. Art — the hall (`game/*.ts`, `lib/data/floors.ts`)

**Ink and paper as the art knows them** (pre-oklch warm values, still the
truth inside the canvas): INK `#23201A`, PAPER `#F2EFE7` / bubble paper
`#FFFDF5`, MUTED `#6F6A5E`, HAIRLINE `#E4DFD3`, ACCENT `#D9480F`,
ACCENT_RED `#C03A2B`, GOLD/BRASS `#B08D2E`, BRASS_BRIGHT `#DCC06B`,
BRASS_DEEP `#7A611F`. — `boothArt.ts:27-41`, `bubbles.ts:11-13`,
`decor.ts:45-52`.

**Floors** (`lib/data/floors.ts` `theme`), each `floorA`/`floorB` checker,
`wall`, `trim`:

| floor | floorA | floorB | wall | trim |
|---|---|---|---|---|
| main-hall (and HeroScene) | `#D8D2C4` | `#D1CABA` | `#8A8272` | `#6F6A5E` |
| indie-alley | `#CBB89A` | `#C2AE8E` | `#7A6248` | `#5C4A36` |
| ramen-district | `#4A4A52` | `#44444C` | `#2F2F36` | `#A63D2F` |
| cofounder-row | `#39493E` | `#344439` | `#24312A` | `#B08D2E` |
| tutorial-hall | `#D9D6CB` | `#D1CEC1` | `#7E8578` | `#5E665E` |

**Booth** (`boothArt.ts`): WOOD_TOP `#D9C79B`, WOOD_FRONT `#A28457`, POT
`#A6633C`, LEAF_A `#4C7A4F`, LEAF_B `#3A6440`, LEAF_HI `#6D9A63`, CARD
`#FAF7EF`, CARD_LINE `#C6BCA4`, LATTICE `#C9B586`, CABINET `#2A2733`, STAGE
`#211E29`; owner lamp online `#2B8A3E` / away `#9A937F`; counter shadow
`#33302A`, `#4A463E`; sign text on a light face is INK, on a dark face
`#FFFDF5` (threshold luma 0.62, `boothArt.ts:83`).

**Booth swatches a founder can pick** (`lib/data/shop.ts:BOOTH_SWATCHES`,
used for both carpet and banner): `#8C3B2E #C4562B #4E6E4E #7A8C50 #3B5B92
#57829B #6B4E71 #2F6F6A #A98C5B #8A6B4D #555049 #B08D2E #A64D79 #3F4A5A`.
Carpet patterns `solid | border | stripes`; banner trims
`plain | stripes | checker | dots` (`lib/types.ts:85-88`).

**Plaza and paving** (`decor.ts:28-63, 234-249`): STONE_LIGHT `#CFC8B8`,
STONE `#B9B1A0`, STONE_MID `#A29A88`, STONE_DARK `#847C6C`, STONE_DEEP
`#666052`; WATER_DEEP `#3C6670`, WATER `#57909A`, WATER_LIGHT `#7CB0B6`,
FOAM `#AFD0D0`, SPARK `#E4F0EC`; PAVE_A `#C6BFAE`, PAVE_B `#BEB6A4`,
PAVE_LINE `#A79F8D`, PAVE_INLAY `#9C9482`; RUNNER `#B4A98F`, RUNNER_EDGE
`#9A8F76`; CARPET `#8A6551`, WEFT `#82604D`, EDGE `#6B4F3F`, LINE `#AE8B72`;
ROPE `#8C2F2F`.

**Avatars** (`game/sprites.ts:19-47, 296-309`):
skin `#F3D3B3 #E9BC93 #D3A075 #B27E55 #8C5B3A #5F3D27` (6);
outfit `#D9480F #2F3B52 #33623A #B08D2E #A85560 #2E6E6A #3B382F #CFC2A4` (8);
hair `#241F1C #4A3120 #C9A24B #8A4B23 #1F2A38 #7A2E1C #8C8578 #3A2A20` (8,
each paired with a style: crop, long, bob, spiky, bun, side sweep, buzz,
curly); SHOE `#2B2620`, EYE `#2A241D`. Robots (NPC keepers): chassis
`#9AA3AA #B7A98F #8C99A6 #A79A9A #93A398 #AAA2B0`, visor `#4FC3D9 #E8A33D
#7ED08A #E2726E`.

**Emotes** (`game/emotes.ts:13-25`): outline `#3B3226`, skin `#E8B88A`/
`#C98F5F`, motion line `#8A8272`, face yellow `#F2C14E`, heart `#C92A2A`/
`#E5636B`, question `#D9480F`, rocket window `#57829B`, flame `#C4562B`/
`#F2A93B`.

**Ranks** (`lib/ranks.ts`, badge dot + label): Garage `#6F6A5E` ($0) ·
First Dollar `#9C6B30` ($1) · Ramen Profitable `#2B8A3E` ($1k) · Default
Alive `#1971C2` ($10k) · Escape Velocity `#B08D2E` ($100k). Rendered as a
round dot (8px sm / 12px lg) beside the name in ink — `components/RankBadge.tsx`.

**Tier tags** (`components/TierTag.tsx`): Free `border-line text-muted`;
Pro `border-accent/40 text-accent`; Founder+ `border-gold/50 text-gold-deep`.
Pill: `micro rounded-sm border px-1.5 py-0.5`.

**Logo mark** (`components/PixelLogo.tsx`, 16×16 viewBox, default 22px):
awning INK `#23201A` + ACCENT `#D9480F` stripes with PAPER `#F2EFE7` gaps,
counter INK with PAPER window, BRASS `#B08D2E` goods. Rect list is in the
file; the atlas script emits it at 1×–4×.

**New colours the app needs (derive, do not invent):** none identified
yet. If a coach avatar or a chart needs one, derive from the art palette
above and add a row here with the reason.

---

## 2. Typography

| role | family | file(s) | how the site loads it |
|---|---|---|---|
| display (headlines, panel titles, floor names) | **Archivo** | Google, via `next/font/google` → `--font-display` | `app/layout.tsx`; fallback stack `Iowan Old Style, Palatino, Georgia, serif` (`tailwind.config.ts`) |
| body | **IBM Plex Sans** (variable, 100–700) | `public/fonts/IBMPlexSans-Variable.ttf` | `@font-face` in `globals.css` |
| data / labels / HUD | **IBM Plex Mono** 400, 500 | `public/fonts/IBMPlexMono-{Regular,Medium}.ttf` | `@font-face` |
| OG cards only | Spectral 400/500 | `assets/fonts/Spectral-*.ttf` | not on any screen — **do not bundle** |
| in-canvas lettering | system: `700 9px ui-monospace…` (SIGN_FONT), `700 7px ui-monospace`, `10px system-ui`, `700 13px Georgia` | none | `game/boothArt.ts:43`, `game/*.ts` `ctx.font` |

All three screen fonts are copied to `packages/ui/assets/fonts/`
(OFL, licence file included). **Archivo** is fetched by `expo-font`'s
Google loader at build so the same face ships; `font-synthesis: none` is a
site rule — never fake a bold or italic.

**Scale** (`tailwind.config.ts` `fontSize`, on a 4px unit): 12/16 · 16/24 ·
20/28 · 28/32 (xl and 2xl) · 36/40 (tracking −0.018em) · 48/52 (tracking
−0.022em). Hero headline: 40px → 65.6px → 81.6px with `tracking-[-0.02em]`,
`leading-[1.06]`. Body reads at 16. Emphasis is one weight step, never
italic.

**Label rules:** `.micro` = mono, 12px, `normal-case tracking-normal`,
tabular-nums. The **one** place uppercase + wide tracking survives is
signage lettering inside a sign plate: `font-display text-xs uppercase
tracking-[0.12em]` (`components/Sign.tsx`). Everywhere else uppercase
kickers were removed as an AI tell.

**Canvas text — deliberate deviation.** The app draws sign/label text with
**IBM Plex Mono 700** at the same px sizes the site requests
(`SIGN_FONT` 9px, labels 7–8px, plate titles 13px). Rationale: the site's
`ui-monospace` resolves to Menlo/SF Mono/Consolas/DejaVu depending on OS,
so the "same" sign is already three different fonts in the wild; a
bundled mono makes the app consistent with *itself* and with the site's
own UI mono. The OG renderer's 3×5 bitmap alphabet (`svgCanvas.ts`) is
available for anything that must be strictly pixel-locked (e.g. shareable
cards).

---

## 3. Sprites and tiles

**Grid:** `TILE = 32` logical px (`lib/types.ts:814`). Avatar sprite
`SPRITE_W = 20`, `SPRITE_H = 28` (`game/sprites.ts:11-12`), anchored at
feet-centre (`engine.ts:1015` draws at `px - SPRITE_W/2, py - SPRITE_H`).
Walk cycle **3 frames** per direction (`[0,1,2]`, `sprites.ts:406`) × 4
directions (`down/up/left/right`, left = right flipped), animated at
**WALK_FPS = 7** (`engine.ts:64`). Player speed **140 px/s** (`SPEED`).

**Render scale:** the engine picks from `ZOOM_LADDER = [2, 1.5, 1]`
(`engine.ts:51`) — note the 1.5× rung is *not* an integer, and on slow
devices the engine lowers render scale to keep frames smooth
(`engine.ts:1537`). The app must render at **integer factors only**
(2×, 3×) with nearest-neighbour; the atlas ships 1×/2×/3×/4× so no runtime
scaling is ever fractional. Minimap `160×120` max, inset 12.

**Everything drawn, by owner:**

| what | drawn by | notes |
|---|---|---|
| booth carpet / banner / counter | `boothArt.ts` `drawCarpet`, `drawBoothBanner`, `drawBoothCounter` | banner width 4 tiles; sign text on banner; owner lamp; founder avatar frame 0 standing at counter |
| vacant stand board "OPEN STAND · NO. 11 · GOLD 400" | `tilemap.ts` `drawVacantCarpet`, `drawCounterBase`; label at `:887` | the "OPEN SPOT" art in the hero uses the same code |
| floor tiles, walls, trim | `tilemap.ts` `buildFloor` | checker of `floorA`/`floorB`; wall band with trim |
| plaza: fountain, arch, lamps, planters, stanchions, tables, kiosk, benches, trees, sofa, bar, board, crates, signs, runner, notice board, wall banners, merchant stall fronts/backs, stand plinths, avenue | `decor.ts` (23 drawables, listed by name in the file's exports) | every one is a candidate atlas sprite |
| avatars (human) | `sprites.ts` `makeAvatar(look)` | 6×8×8 looks; 3 frames × 4 dirs = 12 cels each |
| robots (NPC keepers) | `sprites.ts` `makeRobot` | chassis + visor palettes |
| chat bubble, emote bubble | `bubbles.ts` | see §5 for geometry/timings |
| emote pictograms (8) | `emotes.ts` | wave laugh clap heart question rocket fire handshake |
| booth glyphs (10) | `components/PixelGlyph.tsx` `BITMAPS` | 8×8: bolt leaf coin chip flask rocket heart cube wave star; also the section-sign pictograms and route-stop icons |
| logo mark | `components/PixelLogo.tsx` | 16×16 |
| the whole stand as one picture | `game/standScene.ts` `renderStandSvg` → SVG 152×206 | what the OG card and stand page use; **the app's Stand screen hero** |
| cursor / "press E" prompt | HTML, not canvas: `Kbd` component + `.glass` pill | see §4 |

**Extraction pipeline** — `scripts/ui-atlas.ts` (to run: `npx tsx
scripts/ui-atlas.ts`): drives `SvgCtx` with the real drawing functions,
writes one SVG per sprite/cel to `packages/ui/assets/sprites/svg/`, then
rasterizes each with the repo's Playwright Chromium at 1×–4× with
`shape-rendering: crispEdges` and `image-rendering: pixelated` to
`packages/ui/assets/sprites/{1x,2x,3x,4x}/*.png`, plus a `manifest.json`
of native sizes and anchors. Nothing is hand-drawn twice.

---

## 4. Components

Every dimension is on the 4px unit (`--unit`). Radii 4 / 8 / 12 / 16
(`tailwind.config.ts`). **The signature corner:** `.clip-badge` bevels the
top-right corner by 8px (`clip-path: polygon(0 0, calc(100% - 8px) 0, 100%
8px, 100% 100%, 0 100%)`) — on every panel, sign, button plate and chip,
and nowhere else in the world. `rounded-full` survives only on avatars and
status dots. In RN this is a small custom `PixelPlate` view (clip via
`react-native-svg` mask or a 9-slice with the bevel baked in).

| component | site source | anatomy to reproduce |
|---|---|---|
| **Panel** (`.panel`) | `globals.css:272` | `clip-badge rounded-lg border border-line/70 bg-panel` + shadow `0 1px 2px ink/5%, 0 6px 16px -4px ink/7%` |
| **Glass** (`.glass`) — in-hall HUD chips | `globals.css:305` | `clip-badge rounded-lg border border-line/60`, `rgba(255,255,255,0.86)`, `backdrop-filter: blur(12px) saturate(1.1)`; shadow `float` |
| **Stall / dialogue panel** | `components/StallPanel.tsx` | awning stripe 8px tall, 14 alternating cells (colour / paper); header: `font-display text-xl tracking-tight` sign, `text-sm text-muted` blurb, keeper chip `micro rounded-full px-2 py-1 text-paper` on the awning colour, Close button `border border-line px-2.5 py-1 text-xs`; body scrolls; footer `micro text-xs text-muted` "Esc or tap outside to go back to the hall — you keep your spot". Width `max-w-lg` (512) / `max-w-3xl` wide; **height cap 70svh desktop, 85svh phone, bottom-anchored on phone**; scrim `bg-ink/45`; open: opacity 0→1 + `translateY(10px) scale(0.97)`→rest, 200ms ease-out; close 190ms reverse; Escape, scrim, Close all dismiss; Tab trapped; focus returns to opener; `?stall=` / `?panel=` in URL, Back closes |
| **Primary button** | `app/page.tsx`, `EmailCapture.tsx` | `btn-press rounded-md bg-accent-strong px-6 py-3 text-sm font-medium text-paper shadow-card hover:bg-accent-strong/90` (44px min-height on touch) |
| **Secondary button** | same | `btn-press rounded-md border border-ink px-6 py-3 text-sm font-medium text-ink hover:bg-panel`; on dark: `border-paper/40 text-paper hover:bg-paper/10` |
| **Ghost / quiet** | `StallPanel` Close, `QuietFloorCard` | `border border-line text-muted hover:border-ink hover:text-ink` |
| **Disabled** | everywhere | `disabled:opacity-50 disabled:cursor-not-allowed` — no colour change |
| **Press feel** (`.btn-press`) | `globals.css:318` | hover `translateY(-1px)` + deeper shadow (220ms `--ease-release`); active `translateY(2px)`, 60ms ease-out. **The one spring on the site.** |
| **Arrow** (`.arrow-slide`) | `globals.css` | inline `→` moves 3px right on hover, 220ms |
| **Sign** (section marker / plaque) | `components/Sign.tsx` | `clip-badge` plate `border-blackout bg-blackout` (or `border-trestle bg-foamcore` paper variant); 36×36 glyph frame `rounded bg-foamcore/15` (paper: `bg-laminate`) with a 20px `PixelGlyph`; label `font-display text-xs uppercase tracking-[0.12em]`; destination signs get `→` + `accent-lift` (plate) / `accent` (paper); right-aligned mono code slot in `gantry`/`conduit` |
| **Spec** (metadata label) | `components/Spec.tsx` | `micro font-mono text-xs` |
| **Kbd** | `app/page.tsx:67` | `rounded-sm border px-1.5 py-0.5 font-mono text-xs`; ink or paper tone |
| **Input** | `EmailCapture`, `WallJoin`, `StallContents` | `min-h-[44px] rounded-md border border-line bg-paper px-3 py-2 text-sm placeholder:text-muted/60`; focus = **fountain** 2px outline (wayfinding), no halo; on dark `border-paper/25 bg-paper/10 text-paper` |
| **Focus ring** | `globals.css` | `2px solid accent`, offset 2, radius 6; on `.on-night` → `accent-lift`, 3px |
| **Toast** | `components/Toast.tsx` | `glass anim-pop px-4 py-2 text-sm shadow-float`, fixed top-centre (`top-36` / `sm:top-28`), pop-in 300ms `--ease-spring` |
| **Tier tag** | `TierTag.tsx` | see §1 |
| **Rank badge** | `RankBadge.tsx` | dot + name; lg variant for the ranks table |
| **Member badge** | `MemberBadge.tsx` | `micro rounded-full border px-2.5` `✦ Founder+`; gold tone `border-gold/70 bg-gold/10 text-gold-deep`; pro `border-accent/50 bg-accent-soft/60 text-accent`; glass variant adds `bg-panel/85 py-2 shadow-float backdrop-blur-md` |
| **Ticket chip (HUD)** | floor page ~1717 | `glass … px-3 py-1.5 text-xs text-gold-deep` with `TicketIcon` + tabular count |
| **Directory / register row** | `StallContents.tsx` `RegisterStall` | `divide-y divide-line rounded-lg border border-line`; row `px-3 py-2.5`: 48px mono stand ref, 12px banner swatch `rounded-sm`, name `text-sm`, `SAMPLE`/`LIVE` micro tags (LIVE in verify), one-liner `text-xs text-muted` |
| **Site-map / index row** | `app/page.tsx` `.index-row` | grid `[auto_9rem_1fr_auto]`, mono href, glyph + display name, description, accent link with arrow; underline draws in from the left on hover |
| **Quest list** | `components/QuestPanel.tsx` | `.reveal-rows` expand (grid 0fr→1fr, 320ms ease-out); ★ prefix; "1/21 Make the rounds · 0/3" |
| **Progress meter** | `RankMeter.tsx` `.meter-fill` | fills on scroll-in via `whenInView`; reduced-motion = static |
| **Stand editor** | `EditStandPanel.tsx` | sections "Booth style" (Carpet, Banner swatch grids), "Booth accessories" (props, ticket-priced), live preview via `BoothPreview`; validation copy "The stand needs a startup name." |
| **Walk-in (name + avatar)** | `app/lobby/page.tsx`, `AvatarPicker.tsx` | name input placeholder **"Ada Byron"**; picker rows labelled `Skin` / `Outfit` / `Hair` as `micro text-muted`, swatch buttons `aria-label="Skin option 3"`, live `Avatar preview`; CTAs "Enter the lobby →", "Just show me around →" |
| **Booth card (on the floor)** | `BoothCard.tsx`, `OpenStandCard.tsx`, `HoverCard.tsx` | `.glass` panel: name, one-liner, founder, rank, Connect / Edit stand / Pack up; open spot: "OPEN STAND · NO. 11 · GOLD 400", claim button, tickets due |
| **Chat strip** | `ChatPanel.tsx` | bottom-left `.glass` "Chat · Bo walked in · open" |
| **Emote bar** | `EmoteBar.tsx` | bottom-centre `.glass`, 8 pictograms with key numbers 1–8 (locked ones ×) |
| **Full-hall / quiet-floor / graduation cards** | `FullHallCard`, `QuietFloorCard`, `GraduationCeremony` | `.panel` over `bg-paper` scrim; copy in §6 |
| **Nav** (hidden on floors) | `app/layout.tsx` | sticky header `bg-panel border-b border-line/70`, logo + `FounderFloor`, `Main Hall open` live dot, links Floors / Directory / Profile, MemberBadge, bell. **On the floor the header is hidden** (`body[data-on-floor]`); the app's bottom menu replaces it |

**Menus the app must draw itself** (no native): the five-entry bottom
menu = a `.glass` bar of `Sign`-style entries with `PixelGlyph`
pictograms; pickers = swatch grids as in `AvatarPicker`; toggles = the
two-segment `rounded-md border border-line p-0.5` group from the billing
cycle switch (`profile/page.tsx`); alerts = `StallPanel`.

---

## 5. Motion (and sound)

**Sound: none.** The site ships no audio. v1 of the app is silent and
uses no haptics (rule: haptics only where the site plays a sound).

**Easings** (`globals.css:150-155`): `--ease-out: cubic-bezier(0.22, 1,
0.36, 1)` (entrances, hovers); `--ease-spring: cubic-bezier(0.34, 1.4,
0.64, 1)` (pop-ins); `--ease-release: cubic-bezier(0.32, 1.72, 0.42, 0.9)`
(button release — the one overshoot).

| motion | timing | source |
|---|---|---|
| walk cycle | 3 frames at 7 fps; 140 px/s | `engine.ts:61-64` |
| remote player interpolation | `LERP_RATE = 12` /s; moves sent at 10 Hz | `engine.ts:62-63` |
| tap-to-walk | `findPath` on pointer; repath cooldown 400ms | `engine.ts:270-290`, `path.ts` |
| chat bubble | rise 6px over 220ms ease-out, lives 5000ms, fades 300ms | `bubbles.ts:26-29` |
| emote bubble | pop 250ms easeOutBack, r=14, lives 2500ms, fades 150ms | `bubbles.ts:31-34` |
| bubble geometry | 11px system font, wrap 150px, max 3 lines, line 14, pad 8×6, tail 5 | `bubbles.ts:18-24` |
| panel open | 200ms ease-out, opacity + `translateY(10px) scale(0.97)` | `StallPanel.tsx` |
| panel close | 190ms reverse, then unmount | `StallPanel.tsx` OUT_MS |
| scrim | opacity 200ms | `StallPanel.tsx` |
| button hover / press | 220ms release / 60ms ease-out; −1px / +2px | `.btn-press` |
| arrow lean | 3px, 220ms | `.arrow-slide` |
| scroll reveal (the one scroll behaviour) | 14px up + fade, 420ms ease-out, once; siblings stagger 60ms, cap 6 | `.reveal` |
| glyph draw-in | 8 rows × 34ms, per-row 110ms steps(1) | `.glyph-draw` |
| quest list expand | 320ms ease-out grid rows | `.reveal-rows` |
| toast | pop-in 300ms spring | `.anim-pop` |
| page enter | fade 240ms | `.page-enter` |
| booth highlight | interaction ring at 32px hover hit-tests ~15/s | `engine.ts:65` |

**Reduced motion** (`globals.css`, four blocks): every animation above
resolves to its resting state — reveals visible, glyphs drawn, bubbles
static, no press transform. The app mirrors this from
`AccessibilityInfo.isReduceMotionEnabled`.

---

## 6. Copy voice

Second person, short, present tense, venue metaphor held throughout, **no
exclamation marks in system messages**, no "Welcome back". Real strings:

**Headlines / kickers** (`app/page.tsx`): "A trade-show floor that never
tears down." · kickers: The whole idea · The map · The founders wall · The
venue · The board · What costs money · Shipping weekly · Before you ask ·
Who is here · dateline "FounderFloor · Programme 2026 · Main Hall, open now
· Admission free · nothing to install" · closing "Closing time: there
isn't one" / "The doors are propped open. They stay that way." / "Or come
back when it's busy".

**Buttons**: "Walk the floor →" · "Set up a stand" · "Enter the lobby →" ·
"Just show me around →" · "Put my stand up" · "Redeem" · "Keep me posted" ·
"Remind me" · "Connect" · "Edit stand" · "Pack up" · "Leave" · "Close" ·
"Spend them on your stand" · "Change your membership — leaves the floor".

**HUD / prompts**: "W A S D walk · E talk" · "Tap where you want to go." ·
"Click, then walk with W A S D" · "You are walking the hall" · "1 here" ·
"70 tickets" · "Quests 1/21 Make the rounds · 0/3" · "Open Doors · 4d 6h".

**Tutorial** (`TutorialCoach.tsx`): First steps → Walk around → Find a
stand → Say something ("Ask the founder a question — type in the chat that
just opened.") → Make it count ("Like them? Hit Connect on the stand card —
they go in your contact list.").

**System / status**: "Stand updated — the whole floor sees it." · "Stand
packed up." · "Connected — good to meet you." · "Declined, quietly." ·
"Someone claimed that spot first. Your stand stays put." · "That spot is
spoken for — a founder's stand is parked there while they're away." ·
"Not enough tickets to publish that." · "That didn't send — check your
connection." · "Reported. The operator will take a look." · "Esc or tap
outside to go back to the hall — you keep your spot".

**Empty states**: "Nobody else is here" · "No introductions yet this week."
· "No runs yet this week." · "Nobody has clocked a minute yet this week." ·
"Holding your place in line…" · "One person ahead of you. One out, one in
— no refreshing needed."

**Wayfinding** (guide): "Straight up the avenue from where you came in." ·
"East avenue — turn right at the fountain." · "Just south-east of the
fountain — you can see it from the water." · "Opposite the arcade,
south-west of the fountain."

**Metadata**: title "FounderFloor: a walkable expo for startups";
description "A 2D trade-show floor that never tears down. Walk in, talk to
founders, claim a stand, connect. Free, no install."

**Footer**: Explore → Floors / Directory / Tutorial · The fine print →
About / Terms of Service / Legal Notice / Privacy Policy / Cancel
membership / Report content / Send feedback.

**New copy in this voice** — coaches speak like the keepers already do
("Alder will gladly do the sign for it"): named, in the building, brief.

---

## 7. Layout rules

**Unit grid**: 4px. Radii concentric (child = parent − gap). Two content
widths on the landing: `SHELL` and `WIDE` (the hero plate runs wider than
the text and carries crop marks).

**The floor HUD** (`app/floor/[id]/page.tsx`, all `absolute`, canvas
`inset-0`):

| region | phone | ≥ sm | contents |
|---|---|---|---|
| top bar | `inset-x-3 top-3`, space-between | same | left: `?` help, floor name + tier tag, Open Doors pill; right: `N here` presence, **Leave** |
| left column | `left-3 top-24` | `top-16` | Quests panel, ticket balance chip |
| top-centre | `left-1/2 top-24` | `top-16` | toasts / status |
| right column | `right-3 top-16 → bottom-28` | `bottom-3` | request cards, minimap (`160×120`, inset 12; on coarse pointers pushed below the top bar) |
| centre prompt | `bottom-44 left-1/2` | `bottom-24` | "press E" / merchant hint pill |
| bottom strip | `inset-x-3 bottom-3`, stacked | grid `[1fr_auto_1fr]` | chat strip · emote bar · `?` |

**Mobile behaviour today** (`lib/device.ts`): pointer kind is decided by
`(pointer: coarse)`, not screen size; `landscapePhone` = touch ∧ landscape
∧ height < 500 (hides the ticket chip, tightens the HUD). Tap-to-move
exists (pathfinding on pointer); **there is no on-screen d-pad** — the
brief's d-pad is new and goes in the kit with a "new" note. Panels on a
phone are **bottom sheets at ≤ 85svh with a strip of hall visible above**;
on desktop centred at ≤ 70svh, ≤ 512px wide. Overlays render *inside* the
floor viewport (not a portal) so they inherit its stacking.

**Safe areas**: the site pins the hall to `100svh` (not `dvh`) so the iOS
address-bar animation never re-lays out the canvas. The app should treat
the bottom menu + safe-area inset as the HUD's floor.

**What is NOT on the floor**: the site header/footer (hidden via
`body[data-on-floor]`), so nav is the app's bottom menu alone.

---

## 8. Open decisions recorded here

1. **Canvas font** → bundled IBM Plex Mono (deviation, see §2).
2. **Sound / haptics** → none in v1; adding is Alex's call (question 4).
3. **1.5× zoom rung** → not reproduced; integer scales only.
4. **On-screen d-pad** → new component, drawn as `.glass` + `Kbd` keys.
5. **Pricing in the app brief** ($19/$159 Pro, $39/$329 Founder+) **differs
   from the live site** ($9/$79, $19/$159, `lib/pricing.ts`) and from the
   live PRODUCTHUNT offer. Not changed here; flagged for Alex.
