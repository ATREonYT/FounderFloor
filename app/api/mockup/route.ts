/**
 * DRAWING A VISITOR'S APP, ON THE SERVER, IN ONE REQUEST.
 *
 * The strongest thing this site can do is show someone their own product
 * before it asks them for anything. Every builder tool makes you sign up,
 * pick a plan and spend credits before you see a pixel; a visitor who has
 * to do that before they know whether they like the thing mostly does not
 * come back. So: type one sentence, see your app.
 *
 * It costs nothing to do. The studio in `packages/shared` is plain
 * TypeScript with no platform in it — the phone app and this route call
 * the same function and get the same document — so there is no model
 * call, no key, no queue and no per-visitor cost. That is why this can be
 * open to anyone with no account at all.
 *
 * It runs on the server rather than in the page because the studio's
 * tables (palettes, type pairings, product readings) are about a hundred
 * kilobytes that no visitor should have to download to read a headline.
 * What comes back is one self-contained document the page drops into an
 * iframe, already wired for tapping between screens.
 */
import { NextResponse } from "next/server";
import { localMockup, prepareDesign, studioDesign, type Mockup } from "@founderfloor/shared";

export const runtime = "nodejs";

/** What the visitor typed. Only the idea is required; the rest sharpens it. */
interface Ask {
  idea?: unknown;
  audience?: unknown;
  price?: unknown;
  /** Which take: 0 is the platform's own chassis, every other seed turns to the market's styles. */
  seed?: unknown;
}

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: Ask;
  try {
    body = (await req.json()) as Ask;
  } catch {
    return NextResponse.json({ error: "Send the idea as JSON." }, { status: 400 });
  }

  const idea = str(body.idea, 160);
  if (idea.length < 8) {
    return NextResponse.json({ error: "Say the idea in a sentence — what it does, and who for." }, { status: 400 });
  }

  const audience = str(body.audience, 60) || audienceIn(idea);
  const price = str(body.price, 40);
  const seed = Number.isFinite(Number(body.seed)) ? Math.abs(Math.trunc(Number(body.seed))) % 1000 : 0;

  try {
    const mockup: Mockup = localMockup({ name: nameFrom(idea), oneLiner: idea, audience, price });
    const drawn = studioDesign(mockup, { seed });
    // The same check the phone app runs: three to six screens, wired, and
    // nothing in the document that reaches out of the page.
    const checked = prepareDesign(drawn.html);
    if (!("html" in checked)) {
      return NextResponse.json({ error: "The drawing did not come out right. Try saying the idea a different way." }, { status: 500 });
    }
    return NextResponse.json({
      html: checked.html,
      screens: checked.screens,
      name: mockup.name,
      headline: mockup.screens[0]?.headline ?? idea,
      reading: drawn.plan.line,
      unit: drawn.unit,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong drawing that. Try again." }, { status: 500 });
  }
}

/**
 * A name for the product, from the idea.
 *
 * Nobody has one yet at this point and asking for it before showing
 * anything is exactly the friction this page exists to remove. So the
 * first strong noun stands in, capitalised, and the visitor renames it
 * when they care.
 */
function nameFrom(idea: string): string {
  // Verbs first, because a sign usually opens on one — "Order tomorrow's
  // bread" named the product "Order", which is a command, not a name.
  // What is wanted is the thing it deals in.
  const skip = new Set(
    ("a an the and or for to of in on with by at from is are was that this it its your my our you we us they them" +
      " app apps tool tools site sites platform service services way ways thing things people person someone" +
      " help helps helping make makes making get gets getting let lets letting allow allows enable enables" +
      " book books booking find finds finding sell sells selling buy buys buying share shares sharing" +
      " track tracks tracking order orders ordering rent rents renting send sends sending build builds building" +
      " manage manages run runs create creates plan plans join joins meet meets show shows keep keeps" +
      " every each more most best good great easy simple quick fast just only also very really" +
      " tomorrow tonight today daily weekly monthly minutes minute hours hour days day weeks week years year" +
      " aged before after when while where what which who how why then than").split(/\s+/),
  );
  // The possessive comes off before the list is consulted, or
  // "tomorrow's" sails past a list that only knows "tomorrow".
  const words = idea
    .toLowerCase()
    .split(/[^a-z']+/)
    .map((w) => w.replace(/'s$/, "").replace(/'/g, ""))
    .filter(Boolean);
  const pick = words.find((w) => w.length > 3 && !skip.has(w)) ?? words.find((w) => w.length > 2 && !skip.has(w));
  if (!pick) return "Your app";
  return pick.charAt(0).toUpperCase() + pick.slice(1);
}

/** Who it is for, if they wrote it into the sentence ("... for busy dads"). */
function audienceIn(idea: string): string {
  const after = /\bfor\s+([a-z][a-z' -]{2,40})/i.exec(idea);
  return after ? after[1].replace(/[.,!?]$/, "").trim() : "people like you";
}
