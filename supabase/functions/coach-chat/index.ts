/**
 * POST /coach-chat  { coach, message, stand, turns? }  → SSE or JSON
 * The caller is a founder (verified JWT from the floor server's bridge).
 * The tier comes from that signed token, never from the body, so a paying
 * founder is not gated as Free (which is what happened before September
 * 2026: this file hard-coded "free" and denied three of the four coaches
 * to people who had paid). Turns and notes still await the service-role
 * reads of Gate 3; a turn counter that never rises is the safe direction
 * for the founder, not for us, and is marked below.
 *
 * The stand block is the cached system block. The app also asks from a
 * task page and from a room's list, where there is no stand in the body;
 * those requests are answered, not refused.
 */
import { anthropicClient, MODELS, respond } from "../_shared/anthropic.ts";
import { gate } from "../_shared/gate.ts";
import { callerOf, cors, readBody, reply } from "../_shared/auth.ts";
import { COACH_PROMPTS, standBlock, DESK_PROMPT } from "../../../packages/shared/src/prompts/index.ts";
import type { StandRecord } from "../../../packages/shared/src/types.ts";

const MAX_MESSAGE = 4000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  if (req.method !== "POST") return reply(req, 405, { error: "POST" });
  const caller = await callerOf(req);
  if (!caller) return reply(req, 401, { error: "no badge" });
  const body = await readBody<{ coach: string; message: string; stand?: StandRecord; turns?: { role: "user" | "assistant"; content: string }[]; task?: unknown; line?: unknown }>(req);
  if (!body || typeof body.message !== "string" || !body.message.trim() || body.message.length > MAX_MESSAGE) return reply(req, 400, { error: "say something, under 4,000 characters" });
  const isDesk = body.coach === "desk";
  if (!isDesk && !Object.hasOwn(COACH_PROMPTS, body.coach)) return reply(req, 404, { error: "no such counter" });
  const coach = body.coach as keyof typeof COACH_PROMPTS | "desk";
  // the plan comes from the signed token; TODO(gate-3): turns from usage_counters (atomic), notes from coach_notes, history from coach_messages — by caller.sub with the service role
  const tier: "free" | "pro" | "founder" = caller.tier ?? "free";
  const turnsToday = 0;
  const notes = "";
  const g = gate({ tier, coach, turnsToday, handoffsThisMonth: 0, weekday: new Date().getUTCDay(), kind: "coach" });
  if (!g.ok) return reply(req, g.status, { error: g.reason });
  const turns = Array.isArray(body.turns) ? body.turns.filter((t) => (t.role === "user" || t.role === "assistant") && typeof t.content === "string").slice(-10).map((t) => ({ role: t.role, content: t.content.slice(0, MAX_MESSAGE) })) : [];
  const system = isDesk ? DESK_PROMPT : COACH_PROMPTS[coach as keyof typeof COACH_PROMPTS].system;
  return respond(
    req,
    anthropicClient().stream({
      model: MODELS.fast,
      system: `${system}\n\nYour notes on this founder so far:\n${notes || "(none yet)"}`,
      cached: body.stand ? standBlock(body.stand) : "",
      turns: [...turns, { role: "user", content: body.message }],
    }),
  );
});
