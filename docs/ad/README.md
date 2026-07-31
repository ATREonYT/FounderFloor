# The FounderFloor ad

The promo clip is filmed, not animated. A real browser walks a real floor
against a real floor server, and the captions are injected into the page so
they render in the site's own type and palette and get captured in-camera.
That means the ad can never drift from the product: re-run it after a design
change and the new design is what you see.

There are three cuts, from the same footage:

- **Cut 1** (`shoot.mjs` + `build.mjs`) — 47s, calm, captions burned in
  while filming. Straight product film, paper-and-ink.
- **Cut 2** (`v2/`) — 36s, the modern app-ad treatment: the product in
  3D-tilted browser windows on a dark stage, cropped so the UI is legible at
  phone size, per-word kinetic type, push/zoom/wipe transitions with motion
  blur, and a synthesised sound-design bed. Built from *clean plates* —
  the same shoot run with `FF_NOCAPS=1` so cut 2 can lay down its own
  typography.
- **Cut 3** (`v3/`) — 39s, and the one to use. Everything cut 2 does, plus
  the two things it got wrong.

**What cut 3 fixes.** Cut 2 juddered, and the cause was arithmetic: the
plates are 25fps and it rendered at 30, so the resampler had to repeat
source frames in an irregular 1‑2‑1‑2‑1‑1 pattern. On top of that it drove
`<video>` elements by setting `currentTime`, and a VP8 seek lands on
whichever frame the decoder picks — occasionally the wrong one, occasionally
the same one twice. Cut 3 renders at **50fps**, exactly twice the source, so
every plate frame occupies exactly two output frames; and it reads **PNG
frame sequences off disk** (`extract.mjs`), so a frame index can never be
approximate. Everything the compositor itself draws — type, transitions,
drift, glows — is genuinely 50fps.

**What cut 3 adds.** Colour, mostly. The backgrounds alternate between a
bright cream mood and a saturated ember one, so the ad breathes instead of
sitting in one register. Behind every window is an *ambilight* — a blurred,
saturated copy of the frame itself, throwing the product's own colour across
the background. Full-bleed colour cards punctuate the acts. Annotations
(an accent box plus a labelled chip) point at the thing each line is talking
about. The footage carries a light grade, and the type mixes the brand serif
for brand moments with a heavy sans for the feature beats.

`HOW-THESE-ADS-ARE-MADE.md` is the field guide: what the ads you're
comparing against actually cost, which tools produce them, and which of it
this repo can and cannot do.

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
  v2/
    scene.html      the compositor: a deterministic motion-graphics engine
    render.mjs      frame-steps scene.html straight into ffmpeg
    stills.mjs      shoot chosen moments as stills, to check a change fast
    timing.mjs      dumps the cut's hit points to timing.json
    audio.mjs       synthesises the sound bed against those hit points
    frames.html     branded bands for the 1:1 and 9:16 cuts
    build2.mjs      wraps the master into every delivery format
  v3/               same shape, plus:
    extract.mjs     explodes the plates into PNG frame sequences
    plates-lib.mjs  plate metadata + how many frames each sequence has
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

# then — cut 1
node render-frame.mjs     # once — the square cut's branded overlay
node shoot.mjs            # ~5 min; writes raw/ and beats.json
node build.mjs            # writes out/

# and cut 2 — clean plates, then composite
FF_RAW=plates FF_BEATS=plates.json FF_NOCAPS=1 node shoot.mjs
cd v2
node timing.mjs           # timing.json, the cut's hit points
node audio.mjs            # out/bed.wav, synced to them
node stills.mjs 4 12 21   # eyeball a few moments before paying for a render
node render.mjs --preview # 540p draft, ~10 min
node render.mjs           # 1080p master, ~35 min
node build2.mjs           # 16:9, 1:1, 9:16, webm, poster
```

```bash
# cut 3 — the one to use
cd v3
node extract.mjs          # plates -> PNG sequences (~1.1 GB, once)
node timing.mjs && node audio.mjs
node stills.mjs 0.7 4.6 11.4 22.7   # check a change in seconds, not an hour
node render.mjs           # 1080p50 master, ~60 min
node build3.mjs           # 16:9, 1:1, 9:16, webm, poster
```

`render.mjs` is slow *on purpose*: it steps the compositor frame by frame
rather than capturing in real time, so a heavy blur costs render minutes
instead of dropped frames. Iterate with `stills.mjs`, not with renders — a
still takes about a second and answers most questions.

Two rules the compositor depends on, if you edit `scene.html`:

- **No CSS animations or transitions.** Every property must be a pure
  function of the virtual clock `t`. Anything time-driven drifts against a
  frame-stepped capture.
- **Never share a transform between an animation and a layout offset.** An
  element centred with `translate(-50%,-50%)` cannot also be animated on
  another transform channel — the matrices interpolate and it drifts. Wrap
  it and animate the child.

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
