# The launch post

Copy for the r/indiehackers launch, plus the reasons it is shaped the way
it is. Kept in the repo so the next version starts from this one instead of
from a blank box at midnight.

The rule behind all of it: **do not try to get past the filter, write a post
that does not need to.** Obfuscating a link (`founderfloor [dot] net`, a
unicode lookalike, a shortener) is treated as ban evasion by mods and by
Reddit's own classifier, and the punishment is worse than a removed post.
Everything below is compliance, not evasion.

---

## Title

Pick one. All three lead with the observation rather than the ask, which is
what stops a mod reading it as an advert.

1. Every founder Discord I joined was dead within a month, so I built a room you can walk into
2. The problem with founder communities isn't the tool, it's that nobody is there at the same time as you
3. I built a 2D trade-show floor because async founder chat kept going quiet

**Only use title 1 if it is true of you.** It is the strongest one and it is
a claim about your own experience; if it is not yours, use 2.

---

## Body

> The problem was never the tool. Every founder space I joined had the same
> shape: busy for two weeks, then a graveyard. You post into a channel and
> either three people are awake or nobody is.
>
> So I built the opposite. It is a small 2D floor where your startup keeps a
> stand and you walk up to people. You can see who is actually on the floor
> right now. Walk over, press E, ask what they are building. Twenty-four
> stands, free, runs in the browser, nothing to install.
>
> The honest part: a walkable room is *worse* than a Discord when it is
> empty. Ten people spread over a week is ten empty rooms. So instead of
> pretending it is always busy there is one fixed hour a week, Sunday 18:00
> CET / 12:00 ET, and the first one is this Sunday, 9 August.
>
> Two things I would like torn apart:
>
> - does it read as a place or as a gimmick in the first ten seconds?
> - is a fixed weekly hour actually enough to beat the dead-community
>   problem, or does it just move it?
>
> Happy to answer anything about how it is built.

**No link in the body.** Put it in your own first comment instead:

> Link is in my profile / here if anyone wants a look: founderfloor.net

If the sub allows links in posts you have lost nothing. If it does not, your
post survives instead of vanishing.

---

## Before you hit post

- [ ] **Flair it.** Unflaired posts are auto-removed in a lot of subs. If
      there is a "Self promotion" or "Sharing my project" flair, use it —
      choosing the honest flair is what stops a mod removing it.
- [ ] **Check your account can post at all.** Most subs have a karma or age
      floor enforced by AutoModerator. No wording gets around this; it is
      the one cause copy cannot fix. If you are under it, comment normally
      in the sub for a week first.
- [ ] **Read the sidebar rules and the AutoMod sticky.** Some subs route all
      launches to a weekly thread, and posting outside it is an instant
      removal regardless of quality.
- [ ] **One sub at a time.** The same body and the same link across several
      subs in one session is the textbook spam signature and trips Reddit
      sitewide, not just the sub. Space them out by days and rewrite the
      body each time.
- [ ] **Check it actually went live.** Open the post URL in a logged-out or
      incognito window. If it 404s or shows `[removed]`, it was filtered and
      you would otherwise never know.
- [ ] **Be there for two hours after posting.** Replying fast is most of
      what makes a launch post work, and a thread with no author replies
      gets read as a drive-by advert.

---

## What is deliberately NOT in the post

**The link, in the body.** See above.

**"I tried my hardest to not make AI slop."** Two problems. Some subs now
keyword-filter on AI mentions outright, and pre-emptively denying it plants
the question in a reader who was not asking. Let the thing answer for
itself.

**The founding-20 offer.** It is real and it is a good hook, but "the first
20 people get the paid tier free for life" is marketing grammar and it is
what a promo filter is tuned for. Save it for a reply when somebody asks
what it costs. It lands better as an answer than as a pitch.

**Anything asking for help.** The original draft said *I need you guys*,
*help me out*, *I would much appreciate it*. Every one of those sentences is
about what you need. Readers scroll past and mods remove. The rewrite asks
for two specific critiques instead, which is a question rather than a
favour.

---

## Two notes on the timing

**Two days is thin.** Realistically the first Sunday is you and a handful of
people. That is fine and the site is built for it, but if you want an actual
room, post this weekend for the Sunday *after* and spend the gap commenting
properly in the sub, so you are not a stranger arriving with a link.

**Say "every Sunday", not "opening night".** The site runs the window
weekly (`lib/data/event-window.mjs`). A one-off means anyone reading on
Monday is already too late and bounces. "Every Sunday, first one is the 9th"
gives a late reader a reason to click anyway.


---

# The empty-room video

The one piece of launch content with real reach, and the one that cannot be
written in advance. Its whole power is that it is true, so the script below
is a skeleton with the ending left open: shoot it, then pick the close that
matches what actually happened.

Target length 35-45 seconds. Vertical. Most people watch muted, so every
line needs to exist as on-screen text as well as voiceover.

## Shoot this BEFORE Sunday

So that a quiet night still produces a video instead of nothing:

- 30 seconds of screen recording walking your own character around the
  empty hall. Wide, unhurried.
- A slow pan across the empty stands, close enough to read TO LET.
- One clip of you claiming a stand and dressing it.
- Your face, if you are willing to be on camera. It roughly doubles reach
  on this kind of video and there is no way around that.

Then on the night: **start recording at 17:55 and do not stop.** The
useable moment is unpredictable and unrepeatable. Screen record with system
audio on.

## The script

**0:00-0:03 — the hook.** Your character alone in the middle of the floor.
Do not explain anything yet.

> On screen: `6:00pm. I invited the internet.`
> Voice: "It's six o'clock. This is the room."

**0:03-0:09 — what it is, fast.** Cut to the pan across the stands.

> Voice: "I built a floor where founders keep a stand and you walk up and
> talk to them. One hour a week, everybody at the same time. That hour is
> right now."

**0:09-0:15 — the honest number.** Stand still in the empty aisle.

> On screen: `24 stands.`
> Voice: "Twenty-four stands. Right now [N] of them have somebody standing
> at them."

**0:15-0:24 — the wait.** Do not cut this short and do not fill it with
talking. Dead air is the joke, and the tension is what makes people stay to
the end. Let the little guy stand there.

> On screen: a running clock, or nothing at all.

**0:24-0:36 — the ending.** Pick one:

*If nobody came, or one or two people did:*

> Voice: "So that went great. Two people. One of them was me."
> On screen: `2 people. one was me.`
> Voice: "Doing it again next Sunday. Same time. It only takes one week
> where enough people show up at once, and I have got a lot of Sundays."

*If a handful came (the likely one):*

> Voice: "Seven people. Which is not a crowd. But seven people talked to
> each other for an hour, and that is seven more than a dead Discord
> managed all year."
> Then show one real chat exchange from the night.
> Voice: "Next Sunday, same time."

*If it actually worked:*

> Voice: "I did not think that would work."
> Show the floor with people on it. No narration over it — just let it run.
> Voice: "Every Sunday, six o'clock. Come and see."

**0:36-0:42 — the ask.** One line, one URL.

> On screen: `founderfloor.net — Sundays, 18:00 CET`
> Voice: "It is free, it runs in the browser, and I would rather you came
> and told me it is bad than not came at all."

## Caption

> Nobody tells you the worst part of building a community product: you have
> to be in the empty room first. Sundays, 18:00 CET.

Ask a question in a pinned first comment — comment velocity in the first
hour drives distribution harder than likes do:

> Genuine question, what would actually make you show up to something like
> this?

## Rules for this one

**Be amused, not wounded.** The video works if you find it funny. It dies
if it reads as bitter, or as fishing for sympathy. Same words, completely
different result — it is entirely in the delivery.

**Do not fake the room.** Not one staged extra, not a busier take from
another night. You are inviting people to a specific hour on a specific
Sunday; anyone who takes you up on it finds out immediately, and they are
exactly the people you needed.

**Do not apologise in it.** No "sorry for the self-promo", no "I know this
is cringe". It is a launch, launches are allowed.

**The follow-up is the real asset.** Whatever the first one does, the
second video is "that video got X views, here is what last night looked
like." A series with a number beats a one-off every time, and the second
one is much easier to make than the first.
