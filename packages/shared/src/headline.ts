/**
 * THE SIGN, SET AS A HEADLINE.
 *
 * The sign on a founder's stand is written to explain — "Allows founders
 * to meet and help each other bring ideas to life", "An app that lets
 * you book a plumber". Dropped on a front door at display size, the
 * explaining half is what the eye lands on first, and the product's
 * actual promise starts halfway through the line. Every real app opens
 * with the promise.
 *
 * So the sign is cut, never rewritten. This file removes empty frames —
 * "an app that", "a platform for", "allows you to", "helps people" —
 * and leaves every remaining word exactly as the founder typed it,
 * spelling and all. Nothing is added, nothing is improved, nothing is
 * made to sound like marketing: the promise in PRODUCT.md is that their
 * words are used as written, and a word removed is still their word
 * removed, while a word invented would not be theirs at all.
 *
 * When there is nothing to cut, the sign is the headline, unchanged.
 */

/**
 * Frames that describe the product's category instead of what it does.
 * Each is anchored at the start and takes everything up to the real
 * verb with it.
 */
const FRAMES: RegExp[] = [
  // "Allows founders to meet", "Helps busy dads train", "Lets neighbours order"
  /^(?:it\s+)?(?:allows?|lets?|helps?|enables?|empowers?)\s+(?:[a-z'’-]+\s+){0,3}?to\s+/i,
  /^(?:it\s+)?(?:allows?|lets?|helps?|enables?|empowers?)\s+(?:[a-z'’-]+\s+){1,3}?(?=[a-z'’-]+\s)/i,
  // "An app that books", "A platform which lets", "The tool that tracks"
  /^(?:a|an|the)\s+(?:simple\s+|small\s+|new\s+|free\s+|little\s+)?(?:app|application|platform|tool|service|website|site|system|software|marketplace|product|solution|way|place|space)\s+(?:that|which|to|for|where)\s+/i,
  // "An app for booking" → "Booking"
  /^(?:a|an|the)\s+(?:simple\s+|small\s+|new\s+|free\s+|little\s+)?(?:app|application|platform|tool|service|website|site|system|software|marketplace|product|solution)\s+/i,
  // "We help you find", "I built a thing that"
  /^(?:we|i)\s+(?:help|let|allow|enable|make|built|build|created?)\s+(?:you\s+)?/i,
  // "This is an app that", "It is a service for"
  /^(?:this|it)\s+(?:is|was)\s+/i,
];

/** Words that cannot be left standing alone at the front of a headline. */
const DANGLING = /^(?:to|for|that|which|where|and|or|of|is|are|be)\b\s*/i;

/**
 * The sign as a headline: the founder's own words with the explaining
 * frame cut off the front.
 *
 * Never touches spelling, punctuation inside the line, or word order,
 * and never shortens a sign that is already a promise. If cutting would
 * leave less than two words or a fragment that starts on a joining
 * word, the sign is returned whole — a clumsy full sentence beats a
 * headline that reads as a mistake.
 */
export function asHeadline(sign: string): string {
  let line = (sign ?? "").trim().replace(/\s+/g, " ").replace(/[.]+$/, "");
  if (!line) return "";
  // Frames nest — "An app that lets you order bread tonight" is two of
  // them — so keep cutting until nothing matches. Three passes is more
  // than any real sign needs and stops a pathological loop.
  for (let pass = 0; pass < 3; pass++) {
    const before = line;
    for (const frame of FRAMES) {
      if (!frame.test(line)) continue;
      const cut = line.replace(frame, "").replace(DANGLING, "").trim();
      if (cut.split(" ").length < 2 || cut.length < 8) continue;
      line = cut;
      break;
    }
    if (line === before) break;
  }
  return line.charAt(0).toUpperCase() + line.slice(1);
}
