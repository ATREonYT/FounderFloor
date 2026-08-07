/**
 * Reply drafts.
 *
 * These are PUBLIC replies to public posts, and they are drafts: every one
 * carries a slot you have to fill in before it is worth sending, because a
 * reply that could have been sent to anybody reads exactly like what it is.
 * The slot is not decoration — it is the difference between answering a
 * person and spraying a link.
 *
 * Three rules baked into every template, because breaking them is what
 * turns "helpful founder" into "that guy":
 *
 *   1. Answer the question first. If the post asks where founders hang out,
 *      name two places that are not yours before you name yours.
 *   2. Disclose. "I built this" every time, no exceptions.
 *   3. Invite to a time, not a URL. An empty room converts nobody, so the
 *      ask is always the next Open Doors.
 *
 * There is no DM template here and that is deliberate. See README.md.
 *
 * Length matters per source: a Bluesky post caps at 300 graphemes, and a
 * 500-character draft pasted there is simply a draft you cannot send. Short
 * variants exist for those.
 */

const SLOT = "[[ one line about THEIR post — delete this bracket ]]";

/** Templates keyed by the strongest cluster the scorer found. */
const TEMPLATES = {
  "cofounder-search": ({ slot, url, night }) => `${slot}

For actually meeting people rather than posting into the void: Y Combinator's
co-founder matching is the obvious one, and the Indie Worldwide Discord is
good if you want something lower-key.

I built one too, so take it with the appropriate pinch of salt — it's mine:
${url}, a 2D floor where founders keep a stand and you walk up and talk to
whoever's there. Free, runs in the browser, nothing to install. ${night}`,

  "where-are-founders": ({ slot, url, night }) => `${slot}

Honest answer: Indie Hackers for async, the Indie Worldwide and WIP Discords
for chat, and local meetups if you have any near you — those still beat
everything online.

The thing I'm building is a fourth option: ${url}, a 2D trade-show floor
where startups keep a stand and founders walk around and talk in real time.
Disclosure, obviously, it's mine. ${night}`,

  "networking-fatigue": ({ slot, url, night }) => `${slot}

The reason cold DMs feel bad is that there's no shared context — you're
interrupting someone who wasn't expecting you. Anything where you're both
already in the same place beats it.

That's the whole reason I built ${url}: a 2D floor where you walk up to a
stand and the conversation starts because you're both standing there. Mine,
so discount accordingly. ${night}`,

  "first-users": ({ slot, url, night }) => `${slot}

What worked for me: about thirty individual messages to people who had just
posted their own project, each one actually about their thing. Slow, and far
better than any launch post.

If it helps, I run a floor where founders show what they're building to each
other: ${url}. It's mine and it's free. ${night}`,

  "feedback-wanted": ({ slot, url, night }) => `${slot}

If you want feedback from people who'll actually try it rather than skim the
landing page, I run an Open Doors day on a 2D floor where founders show each other
what they've built: ${url}. Mine, free, no install. ${night}`,

  "virtual-space": ({ slot, url, night }) => `${slot}

If you're looking at Gather-type spaces: I built one narrowed to exactly one
use, which is startups showing each other what they're building. ${url} —
each startup gets a stand, you walk the floor and talk to whoever's at
theirs. It's mine. Free, browser, nothing to install. ${night}`,

  "isolation": ({ slot, url, night }) => `${slot}

The thing that helped me was having somewhere to go that wasn't a scheduled
call. I ended up building it: ${url}, a 2D floor where founders keep a stand
and you can just walk around and talk to whoever's on. Mine, and free. ${night}`,
};

const FALLBACK = ({ slot, url, night }) => `${slot}

I'm building ${url} — a 2D trade-show floor where startups keep a stand and
founders walk around and talk to each other. Free, browser-based, nothing to
install. It's mine, so weigh that. ${night}`;

/** Sources whose posts are too short for the long form. */
const SHORT_SOURCES = new Set(["bluesky"]);
const SHORT_LIMIT = 300;

/** One compact variant, used where 300 characters is the ceiling. */
function shortForm({ slot, url, night }) {
  const tail = night ? ` ${night}` : "";
  return `${slot}\n\nI built ${url} — a 2D floor where founders keep a stand and talk to whoever walks up. Free, browser, mine.${tail}`;
}

/**
 * @param {{clusters: string[]}} scored  clusters arrive strongest-first
 * @param {{siteUrl: string, openDoors?: string}} cfg
 * @param {string} [source]  used only to pick a length that fits
 */
export function draftReply(scored, cfg, source) {
  const night = cfg.openDoors
    ? `Next Open Doors is ${cfg.openDoors} if you'd rather turn up when there are people on it.`
    : "";

  if (SHORT_SOURCES.has(source)) {
    const short = shortForm({ slot: SLOT, url: cfg.siteUrl, night }).trim();
    // Drop the Open Doors line rather than hand over something unpostable.
    return short.length <= SHORT_LIMIT
      ? short
      : shortForm({ slot: SLOT, url: cfg.siteUrl, night: "" }).trim();
  }

  // score() returns clusters sorted by weight, so clusters[0] really is the
  // dominant signal — this used to take whichever cluster happened to be
  // declared first in POSITIVE and call it "strongest" in a comment.
  const pick = scored.clusters.find((c) => TEMPLATES[c]);
  const make = pick ? TEMPLATES[pick] : FALLBACK;
  return make({ slot: SLOT, url: cfg.siteUrl, night }).trim();
}

export const EDIT_SLOT = SLOT;

/**
 * A draft is not ready until the slot is gone. The digest shows this so a
 * half-finished paste is visibly half-finished.
 */
export function needsEdit(text) {
  return text.includes(SLOT);
}
