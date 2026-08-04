/**
 * Intent scoring: does this post read like someone who would want a floor?
 *
 * Deliberately not an LLM call. A keyword model you can read is a keyword
 * model you can correct, it costs nothing to run four times a day, and when
 * it is wrong you can see exactly which phrase did it — which matters,
 * because the output of this file decides who a human is about to talk to.
 *
 * Two stages. Positive clusters add weight; a post needs at least two
 * distinct clusters to count at all, because any single phrase on its own
 * is mostly noise ("co-founder" appears in every job ad ever written).
 * Negative clusters veto outright, no matter how well it scored.
 */

/**
 * @typedef {{cluster: string, weight: number, phrases: string[]}} Cluster
 */

/** Phrases are matched case-insensitively on word boundaries. */
export const POSITIVE = [
  {
    cluster: "cofounder-search",
    weight: 5,
    phrases: [
      "looking for a co-?founder",
      "need a co-?founder",
      "find a co-?founder",
      "co-?founder wanted",
      "seeking a technical co-?founder",
      "where do i find a co-?founder",
      "how do i meet co-?founders",
    ],
  },
  {
    cluster: "where-are-founders",
    weight: 5,
    phrases: [
      "where do founders (hang out|actually hang out|meet)",
      "where do indie hackers hang out",
      "community for (solo )?founders",
      "any good (founder|startup) communit(y|ies)",
      "looking for a (founder|startup) community",
      "is there a place where founders",
    ],
  },
  {
    cluster: "networking-fatigue",
    weight: 4,
    phrases: [
      "cold (dms?|emails?) (don'?t|do not) work",
      "tired of (zoom|video) calls",
      "networking (feels|is) (fake|exhausting|awful)",
      "hate networking",
      "linkedin (is|feels) (dead|useless|spam)",
      "another discord (that|which)? ?(is )?dead",
      "dead slack (group|community)",
      "no one (replies|responds) to my dms",
    ],
  },
  {
    // Weight 5, not 4: someone who has shipped and has nobody looking at it
    // is the single best fit for a floor, and paired with the usual
    // "would love feedback" it was landing one point under the bar.
    cluster: "first-users",
    weight: 5,
    phrases: [
      "how do i (get|find) (my )?first (users|customers)",
      "no one is using my (app|product|saas)",
      "launched .{0,30}(no|zero) (users|signups|traffic)",
      "how to get beta testers",
      "looking for beta testers",
      "need people to test",
      "where to find early adopters",
    ],
  },
  {
    cluster: "feedback-wanted",
    weight: 3,
    phrases: [
      "would love (some )?feedback",
      "roast my (startup|landing page|idea)",
      "does anyone want to (try|test) my",
      "looking for honest feedback",
    ],
  },
  {
    cluster: "virtual-space",
    weight: 5,
    phrases: [
      "gather\\.?town alternative",
      "virtual (office|coworking|coffee|hangout)",
      "online (demo day|pitch night|meetup)",
      "2d (virtual|online) (office|world|space)",
      "spatial (chat|video)",
      "remote coworking space",
    ],
  },
  {
    cluster: "isolation",
    weight: 3,
    phrases: [
      "building (alone|solo) (is|feels) (lonely|isolating)",
      "solo founder (loneliness|isolation)",
      "no one to talk to about my startup",
      "miss (the )?(office|conferences|meetups)",
    ],
  },
];

/**
 * Vetoes. These win over any score: the cost of a false positive here is a
 * real human being cold-messaged about something they did not ask for.
 */
export const NEGATIVE = [
  {
    reason: "hiring or job ad",
    phrases: [
      "we'?re hiring",
      "job (opening|posting|opportunity)",
      "apply (now|here|via)",
      "salary",
      "full-?time (role|position)",
      "send (me )?your (cv|resume)",
      "\\bhiring\\b.{0,20}\\b(developer|engineer|designer|marketer)",
    ],
  },
  {
    reason: "agency or service selling",
    phrases: [
      "we (build|design|develop) (apps|mvps|websites) for",
      "dm me for (a quote|pricing|rates)",
      "our agency",
      "\\bwhite ?label\\b",
      "book a (call|demo) with (me|us)",
      "limited (spots|slots) available",
    ],
  },
  {
    reason: "crypto, dropshipping and the usual",
    phrases: [
      "\\bnft\\b",
      "\\bweb3\\b",
      "\\bairdrop\\b",
      "\\bpresale\\b",
      "dropship",
      "\\bmlm\\b",
      "passive income",
      "make \\$?\\d+k? (a|per) (day|week|month)",
    ],
  },
  {
    reason: "the poster is selling, not asking",
    phrases: [
      "check out my (new )?(tool|saas|course|newsletter)",
      "use code",
      "\\d+% off",
      "lifetime deal",
      "affiliate",
    ],
  },
];

const compile = (groups) =>
  groups.map((g) => ({
    ...g,
    rx: g.phrases.map((p) => new RegExp(p, "i")),
  }));

const POS = compile(POSITIVE);
const NEG = compile(NEGATIVE);

/**
 * Score one item.
 *
 * @param {{title?: string, body?: string}} item
 * @returns {{score: number, clusters: string[], hits: string[], veto: string|null}}
 */
export function score(item) {
  const text = `${item.title || ""}\n${item.body || ""}`;
  // Long posts dilute: only the first 4000 characters are considered, which
  // is where someone states their problem before wandering off.
  const hay = text.slice(0, 4000);

  for (const g of NEG) {
    for (let i = 0; i < g.rx.length; i++) {
      if (g.rx[i].test(hay)) {
        return { score: 0, clusters: [], hits: [], veto: `${g.reason}: /${g.phrases[i]}/` };
      }
    }
  }

  let total = 0;
  const clusters = [];
  const hits = [];
  for (const g of POS) {
    let matched = false;
    for (let i = 0; i < g.rx.length; i++) {
      if (g.rx[i].test(hay)) {
        matched = true;
        hits.push(g.phrases[i]);
        break; // one hit per cluster: repeating a phrase isn't more intent
      }
    }
    if (matched) {
      total += g.weight;
      clusters.push(g.cluster);
    }
  }

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
