/**
 * Intent scoring: does this post read like someone who would want a floor?
 *
 * Deliberately not an LLM call. A keyword model you can read is a keyword
 * model you can correct, it costs nothing to run twice a day, and when it is
 * wrong you can see exactly which phrase did it — which matters, because the
 * output of this file decides who a human is about to talk to.
 *
 * Two stages. Positive clusters add weight; a post needs at least two
 * distinct clusters to count at all, because any single phrase on its own is
 * mostly noise ("co-founder" appears in every job ad ever written). Negative
 * clusters veto outright, no matter how well it scored.
 *
 * Matching notes, each of which was a bug once:
 *   - Patterns are compiled with `is`. The `s` matters: the haystack is
 *     `title + "\n" + body`, and without it every `.{0,n}` silently fails the
 *     moment the phrase straddles that newline, which is the normal case.
 *   - Curly apostrophes are folded to ASCII first. "We're hiring" typed on
 *     any phone is U+2019, and the veto that stops recruiter spam was blind
 *     to it.
 *   - Quoted lines are stripped. A comment that quotes the question in order
 *     to ANSWER it is not someone asking.
 *   - These are substring matches, not word-boundary matches. Where a
 *     boundary is needed the phrase says so with \b.
 */

/** @typedef {{cluster: string, weight: number, phrases: string[]}} Cluster */

/** Reused noun: covers "cofounder", "co-founder", "co founder", plural. */
const CF = "co[- ]?founders?";

export const POSITIVE = [
  {
    cluster: "cofounder-search",
    weight: 5,
    phrases: [
      // an optional adjective slot catches "technical", "non-technical",
      // "marketing", "design" — the way people actually write it
      `(looking for|need|seeking|want|searching for) an? (\\w+[- ]?){0,2}${CF}`,
      `${CF} wanted`,
      `where (do|can) i (find|meet) an? ?(\\w+ )?${CF}`,
      `how (do|can) i (find|meet) ${CF}`,
      `trying to find an? (\\w+ )?${CF}`,
    ],
  },
  {
    cluster: "where-are-founders",
    weight: 5,
    phrases: [
      "where do (founders|indie hackers|solo founders) (hang out|actually hang out|meet|talk)",
      "communit(y|ies) for (solo |indie )?founders",
      "any good (founder|startup|indie) communit(y|ies)",
      "looking for a (founder|startup|indie) community",
      "is there a place where founders",
      "best (place|community|forum) for founders",
    ],
  },
  {
    cluster: "networking-fatigue",
    weight: 4,
    phrases: [
      "cold (dms?|emails?) (don't|do not|never) work",
      "tired of (zoom|video|discovery) calls",
      "networking (feels|is) (fake|exhausting|awful|draining)",
      "hate networking",
      "linkedin (is|feels) (dead|useless|spam)",
      "another dead (discord|slack)",
      "(discord|slack) (group|community|channel|workspace) (is|was|feels) dead",
      "no one (replies|responds) to my (dms|messages)",
    ],
  },
  {
    cluster: "first-users",
    // Weight 5: someone who has shipped and has nobody looking at it is the
    // single best fit for a floor.
    weight: 5,
    phrases: [
      "how (do|can) i (get|find) (my )?first (users|customers|\\d+ users)",
      "no one is using my (app|product|saas|tool)",
      "launched.{0,40}(no|zero) (users|signups|traffic|customers)",
      "how to (get|find) beta testers",
      "looking for beta testers",
      "need people to (test|try) (it|my)",
      "where to find early adopters",
    ],
  },
  {
    cluster: "feedback-wanted",
    weight: 3,
    phrases: [
      "would love (some |any )?feedback",
      "roast my (startup|landing page|idea|site)",
      "does anyone want to (try|test) my",
      "looking for (honest|brutal) feedback",
    ],
  },
  {
    cluster: "virtual-space",
    weight: 5,
    phrases: [
      "gather\\.?town alternative",
      "virtual (office|coworking|coffee|hangout|conference)",
      "online (demo day|pitch night|meetup|conference) ",
      "2d (virtual|online) (office|world|space)",
      "spatial (chat|video|audio)",
      "remote coworking",
    ],
  },
  {
    cluster: "isolation",
    weight: 3,
    phrases: [
      "building (alone|solo).{0,20}(lonely|isolating|isolated)",
      "solo founder.{0,15}(loneliness|isolation|lonely)",
      "no one to talk to about my (startup|company|product)",
      "miss (the )?(office|conferences|meetups|coworking)",
    ],
  },
];

/**
 * Vetoes. These win over any score: the cost of a false positive here is a
 * real person being answered about something they did not ask about.
 */
export const NEGATIVE = [
  {
    reason: "hiring or job ad",
    phrases: [
      "we're hiring",
      "\\bwe are hiring\\b",
      "job (opening|posting|opportunity|board)",
      "apply (now|here|via|at)",
      "\\bsalary\\b",
      "full-?time (role|position)",
      "send (me )?your (cv|resume)",
      "\\bhiring\\b.{0,25}\\b(developer|engineer|designer|marketer|dev)\\b",
    ],
  },
  {
    reason: "agency or service selling",
    phrases: [
      "we (build|design|develop|make) (your |their )?(apps|mvps|websites|saas)",
      "dm me for (a quote|pricing|rates|details)",
      "\\bour agency\\b",
      "\\bwhite[- ]?label\\b",
      "book a (call|demo) with (me|us)",
      "limited (spots|slots|seats) available",
    ],
  },
  {
    reason: "crypto, dropshipping and the usual",
    phrases: [
      "\\bnfts?\\b",
      "\\bweb3\\b",
      "\\bairdrops?\\b",
      "\\bpresale\\b",
      "dropship",
      "\\bmlm\\b",
      "passive income",
      "\\$?\\d+k? (a|per) (day|week|month) (online|from home)",
    ],
  },
  {
    reason: "the poster is selling, not asking",
    phrases: [
      "check out my (new )?(tool|saas|course|newsletter|agency)",
      "\\buse code\\b",
      "\\d+% off",
      "lifetime deal",
      "\\baffiliate (link|program|commission)\\b",
    ],
  },
  {
    // The README recommends Google Alerts for the long tail, and Alerts
    // return articles ABOUT the topic far more often than people asking.
    reason: "an article about the subject, not a person asking",
    phrases: [
      "\\b(the )?\\d+ best\\b",
      "\\btop \\d+\\b",
      "\\bultimate guide\\b",
      "\\ba guide to\\b",
      "\\b(reviewed|comparison|vs\\.?)\\b.{0,30}\\b(2025|2026)\\b",
      "here's (why|how) (you|we|i) (should|can)",
    ],
  },
];

const compile = (groups) =>
  groups.map((g) => ({
    ...g,
    // `s` so `.` crosses the title/body newline; `i` for case.
    rx: g.phrases.map((p) => new RegExp(p, "is")),
  }));

const POS = compile(POSITIVE);
const NEG = compile(NEGATIVE);

/** Fold the punctuation people actually type into what the patterns expect. */
function normalise(s) {
  return String(s || "")
    .replace(/[‘’ʼ′]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-");
}

/** Drop markdown quote lines: quoting a question in order to answer it is not asking. */
function stripQuotes(s) {
  return s
    .split("\n")
    .filter((l) => !/^\s*>/.test(l))
    .join("\n");
}

/**
 * @param {{title?: string, body?: string}} item
 * @returns {{score: number, clusters: string[], hits: string[], veto: string|null}}
 *   clusters are ordered strongest-first, so a caller can pick the dominant one.
 */
export function score(item) {
  const raw = `${item.title || ""}\n${item.body || ""}`;
  // Only the first 4000 characters: that is where someone states their
  // problem, before wandering off.
  const hay = stripQuotes(normalise(raw)).slice(0, 4000);

  for (const g of NEG) {
    for (let i = 0; i < g.rx.length; i++) {
      if (g.rx[i].test(hay)) {
        return { score: 0, clusters: [], hits: [], veto: `${g.reason}: /${g.phrases[i]}/` };
      }
    }
  }

  let total = 0;
  const found = [];
  const hits = [];
  for (const g of POS) {
    for (let i = 0; i < g.rx.length; i++) {
      if (g.rx[i].test(hay)) {
        hits.push(g.phrases[i]);
        total += g.weight;
        found.push({ cluster: g.cluster, weight: g.weight });
        break; // one hit per cluster: repeating a phrase isn't more intent
      }
    }
  }

  // Strongest first, so draft.mjs can key off clusters[0] and mean it.
  found.sort((a, b) => b.weight - a.weight);
  const clusters = found.map((f) => f.cluster);

  // A single cluster is almost always a coincidence. Requiring two is the
  // cheapest precision win available, and precision is what matters when a
  // person is on the other end.
  if (clusters.length < 2) return { score: 0, clusters, hits, veto: null };
  return { score: total, clusters, hits, veto: null };
}

/** A short human-readable explanation, for the digest. */
export function explain(result) {
  if (result.veto) return `vetoed (${result.veto})`;
  if (!result.clusters.length) return "no signal";
  if (result.clusters.length < 2) return `only one signal (${result.clusters[0]})`;
  return `${result.clusters.join(" + ")} — score ${result.score}`;
}
