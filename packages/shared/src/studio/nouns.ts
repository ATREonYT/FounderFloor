/**
 * What the product deals in, one noun: the pass, the room, the visit,
 * the lesson. It names the rows, the button that makes a new one, and
 * the detail screen. From the sign: a short phrase before "for" is taken
 * whole ("prepaid passes", "quiet room"); a longer one is searched for
 * the nouns products deal in, people-nouns turned into the service
 * they give ("plumber" to "visit"); and when the sign has none, the
 * archetype's own noun stands in.
 */
import type { Archetype } from "./plan.ts";

/** "prepaid passes" to "prepaid pass", "weekly numbers" to "weekly number", "entries" to "entry". */
export function singular(phrase: string): string {
  const w = phrase.trim().split(/\s+/);
  const last = w.pop() ?? "";
  const one = /(ss|us|is)$/.test(last) ? last : /sses$|shes$|ches$|xes$/.test(last) ? last.slice(0, -2) : /ies$/.test(last) ? `${last.slice(0, -3)}y` : /s$/.test(last) ? last.slice(0, -1) : last;
  return [...w, one].join(" ");
}

const NOUNS = new Set(
  "pass room desk invoice receipt expense budget lesson course class game quiz workout plan session booking appointment order meal recipe coffee ticket event trip ride delivery parcel listing property flat apartment house job gig shift project task note post photo video song playlist podcast episode book chapter card deck habit goal streak plant pet dog cat walk run hike subscription membership member client customer patient student tutor coach trainer cleaner plumber electrician repair visit call message chat email contract document form survey poll review rating quote estimate payment loan insurance policy claim report sensor device charger vehicle car bike scooter seat table reservation stay night tour guide route parking spot slot batch product item bundle box kit sample design logo template website page key integration workflow automation alert incident badge certificate credit point reward gift wish wishlist idea meetup group community circle number figure total sale summary stat menu dish drink bottle cake bread flower bouquet haircut massage treatment consultation checkup prescription dose pill medicine exercise stretch meditation nap sleep step calorie portion snack water record file scan signature deal lead pitch demo campaign ad newsletter issue story article comment thread question answer match date profile crew team player round score level puzzle word timer reminder task list checklist chore errand rental listing viewing offer bid auction lot donation grant application interview candidate resume cv hire freelancer worker shift rota timesheet payslip payout tip fare jewellery jewelry necklace ring bracelet candle soap print poster artwork painting craft piece dress shirt shoe sock hat scarf toy puzzle board bookcase chair lamp rug mug cup bag backpack wallet watch phone laptop plan menu".split(" "),
);

/** People-nouns to the thing they give. */
const SERVICE_OF: Record<string, string> = { plumber: "visit", electrician: "visit", cleaner: "clean", trainer: "workout", coach: "session", tutor: "lesson", teacher: "lesson", doctor: "appointment", dentist: "appointment", vet: "appointment", nurse: "visit", therapist: "session", lawyer: "consultation", accountant: "return", photographer: "shoot", designer: "design", developer: "build", freelancer: "gig", worker: "shift", driver: "ride", courier: "delivery", chef: "meal", barista: "coffee", founder: "meetup", member: "post", student: "lesson", patient: "appointment", client: "invoice", customer: "order" };

/** Nouns too generic to name anything. */
const GENERIC = new Set(["api", "app", "tool", "platform", "service", "way", "thing", "solution", "system", "software", "website", "page", "product", "business", "company", "startup"]);

const ARCHETYPE_UNIT: Record<Archetype, string> = { ledger: "invoice", feed: "post", listings: "listing", bookings: "booking", tracker: "session", learn: "lesson", inbox: "chat", map: "trip", dashboard: "report", store: "item" };

const word = (w: string): string => singular(w.toLowerCase().replace(/[^a-z]/g, ""));

function nounsIn(text: string): string[] {
  return text
    .split(/\s+/)
    .map(word)
    .filter((w) => w && !GENERIC.has(w) && (NOUNS.has(w) || SERVICE_OF[w]));
}

/** The one noun, for this sign and archetype. */
export function unitOf(sign: string, archetype: Archetype): string {
  const clean = (s: string) =>
    s
      .replace(/[.!]$/, "")
      .replace(/\s+(by|per|a|an|every)\s+(the\s+)?(hour|day|week|month|year|night|visit|seat|minute)s?\s*$/i, "")
      .replace(/\s+in\s+(ten|five|two|\d+)\s+(minutes?|seconds?|clicks?|taps?)\s*$/i, "")
      .replace(/^(rent|book|buy|get|find|order|hire|sell|share|allows?|lets?|helps?|track|manage|send|make|build|create|plan|run)\s+(you\s+|your\s+)?(a|an|the|your)?\s*/i, "")
      .replace(/\b(tomorrow's|today's|tonight's|tonight|today|tomorrow|now|daily|weekly|monthly|instantly|fast|quickly|easily|online|anywhere|anytime)\b/gi, " ")
      .replace(/(^|\s)'s\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const pre = clean(sign.split(/\s+for\s+/i)[0]);
  const short = (phrase: string): string | null => {
    const words = phrase.split(/\s+/).filter(Boolean);
    if (!words.length || words.length > 3) return null;
    const last = word(words[words.length - 1]);
    if (GENERIC.has(last)) return null;
    if (SERVICE_OF[last]) return SERVICE_OF[last];
    return singular(words.slice(-2).join(" ").toLowerCase().replace(/^(a|an|the)\s+/, ""));
  };
  const whole = short(pre);
  if (whole) return whole;
  // the chunk before the first preposition: "handmade jewellery" from "handmade jewellery without a shop"
  const chunk = short(pre.split(/\s+(without|with|in|on|at|from|to|by|into|over|under|near|around|before|after|and)\s+/i)[0]);
  const inPre = nounsIn(pre);
  if (chunk && (!inPre.length || nounsIn(pre.split(/\s+(without|with|in|on|at|from|to|by|into|over|under|near|around|before|after|and)\s+/i)[0]).length)) return chunk;
  if (inPre.length) {
    const n = inPre[inPre.length - 1];
    return SERVICE_OF[n] ?? n;
  }
  const all = nounsIn(clean(sign));
  if (all.length) {
    const n = all[0];
    return SERVICE_OF[n] ?? n;
  }
  return ARCHETYPE_UNIT[archetype];
}

/** The detail screen's name for an archetype and its unit. */
export function detailTitle(archetype: Archetype, unit: string): string {
  const an = (w: string) => `${/^[aeiou]/i.test(w) ? "An" : "A"} ${w}`;
  switch (archetype) {
    case "feed":
      return "A post";
    case "bookings":
      return "A booking";
    case "learn":
      return "A lesson";
    case "inbox":
      return "A chat";
    case "map":
      return "A trip";
    case "dashboard":
      return "The numbers";
    case "tracker":
      return unit.charAt(0).toUpperCase() + unit.slice(1);
    default:
      return an(unit);
  }
}

/**
 * The unit in one word, for a place that has room for one word.
 *
 * A quick-action tile, a chip, a small button: "New prepaid pass" does
 * not fit and wrapping it breaks the row. The head noun is the last
 * word, and it is still the founder's own word — "prepaid pass" becomes
 * "pass", "weekly number" becomes "number".
 */
export function shortUnit(unit: string): string {
  const words = unit.trim().split(/\s+/).filter(Boolean);
  const last = words[words.length - 1] ?? unit;
  return last.length > 12 ? last.slice(0, 12) : last;
}
