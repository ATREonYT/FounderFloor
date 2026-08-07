# The promo sheets

The picture to attach to a post. It is **not** a screenshot: it is a printed
exhibition handbill, with the hall redrawn as an annotated isometric plate.
A screenshot of a beta floor shows an empty hall and reads as an admission;
a drawn plate shows what the floor is *for* and can carry labels explaining
it. Both are honest, but only one of them survives being seen for two
seconds in a feed.

Three formats come off the same drawing and the same copy:

| file | size | use |
| --- | --- | --- |
| `founderfloor-tall.png` | 1080×1350 | **the one to post.** Reddit image posts, LinkedIn, Instagram |
| `founderfloor-wide.png` | 1200×630 | link previews, the Reddit link card, X, Open Graph |
| `founderfloor-square.png` | 1080×1080 | feeds that crop to a square |

They live in `public/promo/`, so they are also servable from the site
(`https://founderfloor.net/promo/founderfloor-wide.png`) for anything that
wants a URL rather than an upload. Rendered at `deviceScaleFactor: 2`, so
the files are 2160px wide and stay sharp on a phone.

## Rendering

```bash
cd docs/promo
node render.mjs              # all three
node render.mjs tall         # just one
node render.mjs --html       # dump the HTML to poke at in a browser instead
```

Needs Playwright (`npm i -D playwright && npx playwright install chromium`),
the same dev dependency the ad pipeline uses. `FF_CHROME` overrides the
browser binary.

Every run is deterministic. There is no randomness in the drawing, so
re-rendering after a copy change produces a byte-identical picture apart
from the change itself, and a bad edit shows up in a diff.

## The files

- **`hall.mjs`** — the plate. Builds the isometric hall as SVG source:
  floor, stands, founders, the E prompt, and the three lettered callouts
  with their leader lines.
- **`poster.mjs`** — the sheet. All the copy, the CSS, and one layout block
  per format. Change a headline here and all three formats change.
- **`render.mjs`** — drives Chromium and writes the PNGs.

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

`hall.mjs` is a painter's-algorithm renderer, and two things about it will
bite anyone who edits it:

1. **The floor is a base layer, not a participant in the depth sort.**
   Ground tiles go down first and stay out of the sort. When they were in
   it, a tile with a high `gx + gy` painted straight over the carpet of a
   stand in front of it and the stands lost their floor.
2. **Order inside a stand is authored, not sorted.** Everything in one
   stand shares a `z`, and the array order is the paint order: the founder
   is pushed *before* the desk so the desk crops them at the waist. Desk
   height and the founder's row are a tuned pair — raise the desk and the
   person vanishes behind the furniture, which defeats the picture.

Anything mounted flat on a wall face is skewed `26.57°`, which is
`atan(TH / TW)` for the 2:1 grid. Any other angle and it peels off the wall.

Colours are copied from `components/HeroScene.tsx` on purpose, so someone
who saw the poster recognises the floor when they walk onto it. If the
game's palette changes, change it here.

## Editing the copy

All of it is in `COPY` at the top of `poster.mjs`, including the Open Doors
line. That one is currently hand-written; it has to be kept in step with
`lib/data/event-window.mjs`, which is what the site and the floor server
actually run on.
