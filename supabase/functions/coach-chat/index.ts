/**
 * POST /coach-chat  { coach, message, stand, turns? }  → SSE or JSON
 * The caller is a founder (verified JWT from the floor server's bridge).
 * Tier, turns and notes are read server-side, never from the body; until
 * the service-role reads land (Gate 3) the function assumes Free, which is
 * the safe direction. The stand block is the cached system block.
 */
import { anthropicClient, MODELS, respond } from "../_shared/anthropic.ts";
import { gate } from "../_shared/gate.ts";
import { callerOf, cors, readBody, reply } from "../_shared/auth.ts";
import { COACH_PROMPTS, standBlock } from "../../../packages/shared/src/prompts/index.ts";
import type { StandRecord } from "../../../packages/shared/src/types.ts";

const MAX_MESSAGE = 4000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  if (req.method !== "POST") return reply(req, 405, { error: "POST" });
  const caller = await callerOf(req);
  if (!caller) return reply(req, 401, { error: "no badge" });
  const body = await readBody<{ coach: string; message: string; stand: StandRecord; turns?: { role: "user" | "assistant"; content: string }[] }>(req);
  if (!body || typeof body.message !== "string" || !body.message.trim() || body.message.length > MAX_MESSAGE) return reply(req, 400, { error: "say something, under 4,000 characters" });
  if (!Object.hasOwn(COACH_PROMPTS, body.coach)) return reply(req, 404, { error: "no such counter" });
  const coach = body.coach as keyof typeof COACH_PROMPTS;
  // TODO(gate-3): tier from profiles, turns from usage_counters (atomic), notes from coach_notes, history from coach_messages — all by caller.sub with the service role
  const tier: "free" | "pro" | "founder" = "free";
  const turnsToday = 0;
  const notes = "";
  const g = gate({ tier, coach, turnsToday, handoffsThisMonth: 0, weekday: new Date().getUTCDay(), kind: "coach" });
  if (!g.ok) return reply(req, g.status, { error: g.reason });
  const turns = Array.isArray(body.turns) ? body.turns.filter((t) => (t.role === "user" || t.role === "assistant") && typeof t.content === "string").slice(-10).map((t) => ({ role: t.role, content: t.content.slice(0, MAX_MESSAGE) })) : [];
  const p = COACH_PROMPTS[coach];
  return respond(
    req,
    anthropicClient().stream({
      model: MODELS.fast,
      system: `${p.system}\n\nYour notes on this founder so far:\n${notes || "(none yet)"}`,
      cached: standBlock(body.stand),
      turns: [...turns, { role: "user", content: body.message }],
    }),
  );
});
