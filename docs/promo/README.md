# The promo sheets

The picture to attach to a post. It is **not** a screenshot: it is a printed
exhibition handbill, with the hall redrawn as an annotated isometric plate.
A screenshot of a beta floor shows an empty hall and reads as an admission;
a drawn plate shows what the floor is *for* and can carry labels explaining
it. Both are honest, but only one of them survives being seen for two
seconds in a feed.

The people in it are not an illustrator's idea of people. They are the app's
own 20×28 pixel avatars, in the app's own palettes, walking with the app's
own three-frame cycle and talking through the app's own chat bubble. Whoever
clicks through meets the same people they saw on the poster.

| file | size | use |
| --- | --- | --- |
| `founderfloor-square.mp4` | 1080×1080, 16s | **subreddits that take video.** Silent, loops seamlessly |
| `founderfloor-tall.png` | 1080×1350 | the still to post: Reddit image posts, LinkedIn, Instagram |
| `founderfloor-wide.png` | 1200×630 | link previews, the Reddit link card, X, Open Graph |
| `founderfloor-square.png` | 1080×1080 | feeds that crop to a square |

They live in `public/promo/`, so they are also servable from the site
(`https://founderfloor.net/promo/founderfloor-wide.png`) for anything that
wants a URL rather than an upload. Stills render at `deviceScaleFactor: 2`,
so the files are 2160px wide and stay sharp on a phone.

## Rendering

```bash
cd docs/promo
node render.mjs              # all three stills
node render.mjs tall         # just one
node render.mjs --video      # the animated square
node render.mjs --html       # dump the HTML to poke at in a browser instead
```

```bash
npm i -D playwright ffmpeg-static && npx playwright install chromium
```

The same two dev dependencies the ad pipeline uses. `FF_CHROME` and
`FF_FFMPEG` override either binary. Do not point `FF_FFMPEG` at the ffmpeg
Playwright bundles: that build carries VP8 only, and `--video` fails with a
bare exit code 8 rather than anything that explains itself.

Every run is deterministic. `drawScene` is a pure function of a frame
number: no clock, no randomness. So the stills and the video cannot drift
apart, a re-render after a copy change differs only by the change, and the
video is captured frame by frame *by index* rather than screen-recorded,
which means it cannot drop or duplicate a frame no matter how slow the
machine is.

## The files

- **`sprites.mjs`** — the app's people. A port of the avatar half of
  `game/sprites.ts`.
- **`scene.mjs`** — the plate: the isometric hall, the cast, the
  choreography, the script, and the callouts. Runs in the page.
- **`poster.mjs`** — the sheet. All the copy, the CSS, and one layout block
  per format. Change a headline here and every format changes.
- **`render.mjs`** — drives Chromium and ffmpeg, writes the files.

## Rules the sheet keeps

The brief was a picture that does not look machine-made, so the sheet
deliberately avoids the house style of a generated landing page: no
gradient mesh, no drop-shadowed glass, no row of outline icons, no stock
photograph, no em dashes in the copy. Two colours and one accent, which is
the same discipline as `docs/ad/HOW-THESE-ADS-ARE-MADE.md`.

It also does not claim anything the product cannot back. Callout A says
ranks are **self-reported in this beta**, because they are, and the landing
page says the same thing. If revenue verification ships, that line changes
here too.

## Editing the drawing

`scene.mjs` is a painter's-algorithm renderer, and three things about it
will bite anyone who edits it:

1. **The ground is a base layer, not a participant in the depth sort.**
   Floor tiles and carpets go down first and stay out of it. When they were
   in it, a tile with a high `gx + gy` painted over the carpet of a stand in
   front of it and the stands lost their floor.
2. **Everything standing up sorts on the `gx + gy` of its far corner,
   people included.** This is why the founders are placed at `gy + 0.9` and
   their desks at `gy + 2`: it puts the founder's key *below* the desk's, so
   the desk paints last and crops them at the waist. Move the founder past
   `gy + 1.1` and they pop in front of their own table.
3. **The people are pixel art and the plate is not.** Sprites are drawn
   with `imageSmoothingEnabled = false` onto an integer-rounded destination
   rect. The scale factor itself is fractional on purpose: rounding it would
   jump the people a whole 28px in height between formats, because the
   viewBox-to-device scale runs from 0.78 on the link card to 2.75 on a 2×
   still.

Anything mounted flat on a wall face is skewed by 0.5, which is `TH / TW`
for the 2:1 grid. Any other value and it peels off the wall.

Colours are copied from `components/HeroScene.tsx` and the avatar palettes
from `game/sprites.ts`, on purpose. **If the game's art changes, change it
here.** Nothing breaks if you forget, which is exactly why it is worth
writing down: the poster would just quietly start advertising a different
product than the one at the other end of the link.

## Editing the animation

The whole performance is four arrays at the top of `scene.mjs`.

- A **path** is `[frame, gx, gy]` waypoints. It must start and end in the
  same place or the loop visibly jumps; repeat a position to stand still.
- **`SCRIPT`** is who says what, between which frames. Keep bubbles from
  overlapping in time unless they are far apart on the floor: two cards up
  at once in a 700-unit-wide hall reads as noise, not as a busy room.
- Founders are not animated. They turn to face whoever comes near them and
  otherwise stand still, because the game has no idle animation and
  inventing one for the poster would be inventing the product.

`LOOP` is 480 frames at 30fps, so 16 seconds. Frame 480 is frame 0.

## Editing the copy

All of it is in `COPY` at the top of `poster.mjs`, and the dialogue is in
`SCRIPT` in `scene.mjs`. The Open Doors line is the one string in the whole
set that is not derived from code; it has to be kept in step with
`lib/data/event-window.mjs`, which is what the site and the floor server
actually run on.
