/**
 * THE COACH, ON THE SERVER.
 *
 * The key lives here and nowhere else. The browser sends the mission, the
 * action, the field, what the founder typed and the lines they chose to
 * share; this builds the prompt from the shared contract, asks the model
 * for one JSON object, runs the reply through `parseCoachReply`, and only
 * then hands it back. A reply that fails the parser is thrown away and the
 * founder is told the coach could not help this time.
 *
 * Without a key this answers 503 "away", quickly, and the lesson carries
 * on without it: nothing in the journey needs the coach to work.
 */
import { NextResponse } from "next/server";
import { journey } from "@founderfloor/shared";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL_FAST ?? "claude-haiku-4-5-20251001";
const TIMEOUT_MS = 20_000;
const ACTIONS = new Set<string>(Object.keys(journey.COACH_ACTIONS));
const SHARE_KEYS = ["idea", "customerGroup", "problem"] as const;

interface Ask {
  missionId?: unknown;
  action?: unknown;
  key?: unknown;
  text?: unknown;
  shared?: unknown;
}

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.slice(0, max) : "");

export async function POST(req: Request) {
  let body: Ask;
  try {
    body = (await req.json()) as Ask;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-request" }, { status: 400 });
  }

  const missionId = str(body.missionId, 40);
  const action = str(body.action, 20);
  const key = str(body.key, 40) as journey.OutputKey;
  if (!journey.missionById(missionId) || !ACTIONS.has(action) || !journey.fieldFor(key)) {
    return NextResponse.json({ ok: false, reason: "bad-request" }, { status: 400 });
  }
  const shared: journey.CoachContext["shared"] = {};
  if (body.shared && typeof body.shared === "object") {
    for (const k of SHARE_KEYS) {
      const v = str((body.shared as Record<string, unknown>)[k], 1200);
      if (v.trim()) shared[k] = v;
    }
  }
  const ctx: journey.CoachContext = { missionId, action: action as journey.CoachAction, key, text: str(body.text, 4000), shared };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, reason: "away" }, { status: 503 });
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ac.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        system: journey.COACH_SYSTEM,
        messages: [{ role: "user", content: journey.coachUser(ctx) }],
      }),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, reason: "away" }, { status: 503 });
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
    const reply = journey.parseCoachReply(text);
    if (!reply) {
      return NextResponse.json({ ok: false, reason: "unusable" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, reply });
  } catch {
    return NextResponse.json({ ok: false, reason: "away" }, { status: 503 });
  } finally {
    clearTimeout(timer);
  }
}
