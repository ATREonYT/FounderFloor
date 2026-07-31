# The FounderFloor ad

The promo clip is filmed, not animated. A real browser walks a real floor
against a real floor server, and the captions are injected into the page so
they render in the site's own type and palette and get captured in-camera.
That means the ad can never drift from the product: re-run it after a design
change and the new design is what you see.

Everything here is reproducible from a clean checkout.

```
docs/ad/
  seed-floor.mjs    populate a local Main Hall: stands, founders, chatter
  sign-books.mjs    guestbook lines (paced under the server's sign rate limit)
  shoot.mjs         film the beats -> raw/*.webm + beats.json
  build.mjs         cut and encode -> out/*.mp4, *.webm, *.png
  endcard.html      the closing card
  squareframe.html  wordmark + URL for the square cut's paper bands
  render-frame.mjs  renders squareframe.html to a transparent PNG
```

The finished 720p copy also lives at `public/ad/founderfloor-ad.mp4` with
`public/ad/poster.png` beside it, so it is servable at
`https://founderfloor.net/ad/founderfloor-ad.mp4` without another host.

## Shooting it

You need three things running, plus Playwright and ffmpeg.

```bash
npm i -D playwright ffmpeg-static
npx playwright install chromium

# 1. a throwaway floor server on 3105 (never point this at production)
cd /tmp && mkdir ff-shoot && cd ff-shoot
cp /path/to/founderfloor/server/index.mjs .
PORT_WS=3105 node index.mjs &

# 2. the web app, pointed at it
cd /path/to/founderfloor
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:3105/ws npx next dev -p 3200 &

# 3. the extras
cd docs/ad
node seed-floor.mjs &     # 11 stands, 6 people walking, ambient chat
node sign-books.mjs       # guestbook entries, once the seed is up

# then
node render-frame.mjs     # once — the square cut's branded overlay
node shoot.mjs            # ~5 min; writes raw/ and beats.json
node build.mjs            # writes out/
```

`shoot.mjs` takes beat names as arguments (`node shoot.mjs walk claim`) so a
single shot can be re-taken without re-filming the whole thing. Reset the
floor server's `floor-data.json` first if you are re-taking `claim` — that
beat claims spot 11, and it has to be empty when the camera rolls.

Environment overrides: `FF_BASE` (default `http://127.0.0.1:3200`),
`FF_WS` (`ws://127.0.0.1:3105/ws`), `FF_CHROME` (Playwright's bundled
Chromium), `FF_FFMPEG` (the `ffmpeg-static` binary).

## What comes out

| file | use |
| --- | --- |
| `founderfloor-ad-1080p.mp4` | the master — X, LinkedIn, Product Hunt, YouTube |
| `founderfloor-ad-720p.mp4` | smaller copy for DMs and email |
| `founderfloor-ad-square.mp4` | 1:1, letterboxed on paper, for feeds |
| `founderfloor-ad-short.mp4` | ~22s cut: hall, stand, claim, end card |
| `founderfloor-ad.webm` | for embedding on the site itself |
| `founderfloor-ad-poster.png` | poster frame / thumbnail |

All silent. Captions carry the message because most feeds autoplay muted;
add a music bed in any editor if a platform rewards it.

## The floor you are filming

`seed-floor.mjs` plants **demo** stands — Saltbox, Bramble, Cobbler and the
rest are invented, and the founders walking the aisles are scripted clients.
That is honest for a product demo, and it is the only way to shoot a full
hall before the hall is full.

Re-shoot with the real Main Hall as soon as it has a dozen real stands on
it: point `FF_BASE` at production, skip `seed-floor.mjs`, and the same
script films the real thing. A busy real floor sells this far harder than a
staged one, and nothing in the ad has to be re-written for it.

## Editing the script

The caption copy lives inline in `shoot.mjs`, one `captionIn(page, eyebrow,
headline)` call per beat. Keep headlines to one line — the caption card is
`white-space: nowrap` at 40px, so a long line runs off the frame. Beat
lengths are the `sleep()` calls around them; `build.mjs` trims each beat to
whatever `shoot.mjs` measured, so changing a sleep changes the cut.
