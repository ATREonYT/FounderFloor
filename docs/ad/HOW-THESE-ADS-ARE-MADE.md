# How the ads you're comparing against are actually made

Short version: almost none of them are bespoke. The ones that look like a
studio made them are usually one person, about $40/month of software, and a
template — plus five specific things that do nearly all the work. In rough
order of how much they matter:

1. **Sound.** Music, a whoosh on every transition, a thump under every word
   that lands. This is the single largest share of "expensive" and it is the
   one thing you cannot fake with visuals.
2. **Pace.** One idea per shot, 1.5–3 seconds per shot, and the text arrives
   *on* the cut, never after it.
3. **Legibility.** The product is cropped and blown up so it reads at phone
   size. Ads routinely rebuild UI in Figma just to make it legible — showing
   a whole 1920px page shrunk into a frame is the most common amateur tell.
4. **Constant motion.** Nothing is ever fully still: a slow push-in, a drift,
   a parallax. Even a static screenshot gets a 4% zoom over 3 seconds.
5. **Colour discipline.** Two colours and one accent. That's it.

Everything else — 3D device mockups, particles, glows, lens flares — is
garnish. Plenty of great ads have none of it.

## The pipeline

| Step | What happens | Typical tool |
| --- | --- | --- |
| Script | Problem → product → proof → CTA, one idea per 3s, hook in the first 2s | a text file |
| Capture | Clean screen recording, scripted, no cursor jitter | **Screen Studio**, CleanShot X, or a Playwright script |
| Framing | Product dropped into a browser/device mockup, tilted in 3D | Screen Studio, **Rotato**, Figma |
| Motion | Transitions, kinetic type, parallax | **After Effects**, Jitter, Rive, Cavalry |
| Sound | Music bed + whooshes + impacts, cuts on the beat | **Epidemic Sound**, Artlist, Uppbeat (free tier) |
| Voice | Narration | **ElevenLabs**, or a human on Voice123 |
| Grade | LUT, bloom, grain, vignette, slight chromatic aberration | AE / Premiere |
| Delivery | 16:9, 1:1, 9:16, captions burned in | any editor |

**Screen Studio** ($89, one-off, Mac) is the biggest single jump in quality
available to a solo founder. Its automatic zoom-to-the-cursor and smoothed
cursor motion are why so many app demos suddenly looked professional in
2023–24. If you buy one thing for visuals, buy that.

**Epidemic Sound** (~$12/mo) is the biggest jump overall, because it fixes
the thing visuals can't.

A ready-made After Effects template from **Envato Elements** ($16/mo,
search "SaaS app promo") gets you the same motion language as the ads you're
watching, for the price of a coffee. Swapping your footage into a template
is not cheating; it is what most of the market does.

## The specific tricks

- **Hook in two seconds.** Show the product doing the interesting thing
  before you show a logo. Nobody has earned your logo yet.
- **Text lands on the cut.** If the word appears half a second after the
  shot changes, the whole thing feels loose.
- **Whoosh in, thump down.** Something on each transition and a low thump
  when type arrives. Free, and it doubles the perceived budget. Reach for a
  *pitched* sweep rather than filtered noise: noise-based whooshes read as
  electrical hiss on small speakers, which is the cheapest sound in the
  world. A stack of sines gliding up an octave reads as air moving.
- **Click what gets clicked.** A cursor that travels to a control, presses
  it, and is heard doing so — with the effect following on the next frame —
  is worth more than any amount of glow. It only works if the click is real:
  a click sound over footage where nothing was clicked reads as fake
  immediately.
- **Speed ramps.** Fast into a cut, slow on the payoff shot. Ramps read as
  intent; constant speed reads as a slideshow.
- **Crop hard.** If a viewer has to squint, the shot is wasted. Show the
  card, not the page.
- **Burn in captions.** Most feeds autoplay muted, so the ad has to work
  silent and be better with sound.
- **Hold the end card.** Logo, one line, URL, three full seconds. People
  need time to read a domain.

## What this repo's cut 2 does and doesn't do

Everything in `scene.html` is the visual half of that list, done from the
real product: 3D-tilted browser windows, cropped UI, per-word kinetic type,
push/zoom/wipe transitions with motion blur, drifting glows, film grain, a
paper wipe into the end card. It renders frame by frame, so heavy effects
cost render minutes rather than dropped frames.

`audio.mjs` synthesises a *sound design* bed — low drone, transition
whooshes, impacts under the type, one riser into the end card — synced to
the cut's own timing. It is deliberately not music: a tune written from raw
samples lands somewhere between ringtone and hold music, whereas a designed
bed is both easier to get right and what real ads run *underneath* their
licensed track.

What it cannot do:

- **Licensed music.** Buy it. Nothing else moves the needle as much.
- **A human voiceover.** ElevenLabs is the cheap middle; a real VO is better.
- **True 3D mockups** with real lighting and reflections (Rotato class).

## If you want to go further

- **Cheapest real upgrade (~$25):** put an Epidemic/Artlist track under the
  silent master, keep everything else. Twenty minutes of work.
- **Next (~$110 + an evening):** Screen Studio for the capture, an Envato AE
  template for the motion, licensed music on top.
- **Hire it out ($300–1,500):** Upwork/Fiverr, search "SaaS product video".
  Send them this cut as the reference — a reference is worth more than a
  brief, and it halves the price.
- **Studio ($3k–15k):** only once the floor is full and the ad is selling a
  thing that exists at scale. Not yet.

## A voiceover script, if you want one

Thirty-six seconds, matched to cut 2's beats. Feed it to ElevenLabs (a calm,
mid-range voice, slightly slower than default) or read it yourself.

> Everyone's building something. Almost nobody is in the same room.
>
> FounderFloor is a trade-show floor that never tears down.
>
> Walk in. Twelve stands, a real founder behind each one.
>
> Walk up to any of them and read the pitch — what they build, what they
> need, who they are.
>
> Say something. That's the whole introduction.
>
> Every startup on the floor is searchable. Your own stand is yours to
> design, pixel for pixel.
>
> Claim a spot, and it stays up while you sleep.
>
> Demo Night, every Thursday. One hour. The whole floor turns up.
>
> Free. Runs in your browser. Nothing to install. FounderFloor dot net.
