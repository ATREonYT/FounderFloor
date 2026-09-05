/**
 * POST /coach-chat  { coach, message }  → SSE
 * Verifies the JWT, gates, loads the stand block + that coach's notes +
 * the last ten turns, streams the reply, logs usage. The stand block is
 * the cached system block. Skeleton for Gate 3; the data access is
 * written against the 0001 migration.
 */
import { anthropicClient, MODELS, respond } from "../_shared/anthropic.ts";
import { gate } from "../_shared/gate.ts";

// prompts come from packages/shared at deploy time (esbuild bundles them);
// until the bundle step exists they are inlined by `supabase functions deploy --import-map`.
import { COACH_PROMPTS, standBlock } from "../../../packages/shared/src/prompts/index.ts";
import type { StandRecord } from "../../../packages/shared/src/types.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, content-type" } });
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return new Response("no badge", { status: 401 });
  const { coach, message, stand, tier = "free", turnsToday = 0, notes = "", turns = [] } = (await req.json()) as {
    coach: keyof typeof COACH_PROMPTS;
    message: string;
    stand: StandRecord;
    tier?: "free" | "pro" | "founder";
    turnsToday?: number;
    notes?: string;
    turns?: { role: "user" | "assistant"; content: string }[];
  };
  // TODO(gate-3): read tier/turns/notes/turns from Postgres with the service role instead of trusting the body
  const g = gate({ tier, coach, turnsToday, handoffsThisMonth: 0, weekday: new Date().getUTCDay(), kind: "coach" });
  if (!g.ok) return new Response(JSON.stringify({ error: g.reason }), { status: g.status, headers: { "content-type": "application/json" } });
  const p = COACH_PROMPTS[coach];
  if (!p) return new Response("no such counter", { status: 404 });
  const client = anthropicClient();
  return respond(
    req,
    client.stream({
      model: MODELS.fast,
      system: `${p.system}\n\nYour notes on this founder so far:\n${notes || "(none yet)"}`,
      cached: standBlock(stand),
      turns: [...turns.slice(-10), { role: "user", content: message }],
    }),
  );
});
