/**
 * POST /receptionist { standOwnerId, message, turns? } → SSE or JSON
 * Answers as the stand from stand_cards (pitch, FAQ, public pricing only),
 * loaded SERVER-SIDE by owner id — the body may not supply a card, so
 * nobody can impersonate a stand or run free completions. Visitors are
 * guests, so there is no founder JWT; the anon key must still be present
 * (the gateway checks it) and calls are rate-limited per IP. Logging the
 * transcript and the hand-off push land at Gate 6.
 */
import { anthropicClient, MODELS, respond } from "../_shared/anthropic.ts";
import { cors, readBody, reply } from "../_shared/auth.ts";
import { RECEPTIONIST_PROMPT } from "../../../packages/shared/src/prompts/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const MAX_MESSAGE = 1000;
// per-IP budget: 30 calls per 10 minutes in this isolate; a shared store lands with usage_counters
const hits = new Map<string, { n: number; at: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.at > 600_000) {
    hits.set(ip, { n: 1, at: now });
    return false;
  }
  h.n++;
  return h.n > 30;
}

interface Card { owner_id: string; name: string; one_liner: string; pitch: string; segment?: string; faq: { q: string; a: string }[]; public_pricing?: string }

async function loadCard(ownerId: string): Promise<Card | null> {
  if (!SUPABASE_URL || !ANON) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/stand_cards?owner_id=eq.${encodeURIComponent(ownerId)}&limit=1`, { headers: { apikey: ANON, authorization: `Bearer ${ANON}` } });
  if (!res.ok) return null;
  const rows = (await res.json()) as Card[];
  return rows[0] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  if (req.method !== "POST") return reply(req, 405, { error: "POST" });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (limited(ip)) return reply(req, 429, { error: "the receptionist is with someone — try again in a few minutes" });
  const body = await readBody<{ standOwnerId?: string; message?: string; turns?: { role: "user" | "assistant"; content: string }[] }>(req, 16 * 1024);
  if (!body || typeof body.standOwnerId !== "string" || typeof body.message !== "string" || !body.message.trim()) return reply(req, 400, { error: "which stand, and what did you want to ask?" });
  if (body.message.length > MAX_MESSAGE) return reply(req, 400, { error: "under a thousand characters, please" });
  const card = await loadCard(body.standOwnerId.slice(0, 80));
  if (!card) return reply(req, 404, { error: "no stand by that name, or it is not published" });
  const turns = Array.isArray(body.turns) ? body.turns.filter((t) => (t.role === "user" || t.role === "assistant") && typeof t.content === "string").slice(-8).map((t) => ({ role: t.role, content: t.content.slice(0, MAX_MESSAGE) })) : [];
  const cached = [`Stand: ${card.name}`, `One-liner: ${card.one_liner}`, `Pitch: ${card.pitch}`, card.segment ? `Segment: ${card.segment}` : "", `FAQ:\n${(card.faq ?? []).map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n") || "(none)"}`, `Public pricing: ${card.public_pricing ?? "not published — the founder will say"}`].filter(Boolean).join("\n");
  // TODO(gate-6): write receptionist_sessions + inbox_items with the service role; count handoffs; push
  return respond(req, anthropicClient().stream({ model: MODELS.fast, system: RECEPTIONIST_PROMPT, cached, turns: [...turns, { role: "user", content: body.message }], maxTokens: 220 }));
});
