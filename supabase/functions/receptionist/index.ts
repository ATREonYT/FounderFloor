/**
 * POST /receptionist { standOwnerId, sessionId?, message } → SSE
 * Answers as the stand from stand_cards (pitch, FAQ, public pricing only),
 * logs the transcript, and on an email or note hands off to the owner's
 * inbox with a push. Gate 6; the gating and storage calls are TODO.
 */
import { anthropicClient, MODELS, sse } from "../_shared/anthropic.ts";
import { RECEPTIONIST_PROMPT } from "../../../packages/shared/src/prompts/index.ts";

Deno.serve(async (req) => {
  const { card, message, turns = [] } = (await req.json()) as {
    card: { name: string; one_liner: string; pitch: string; segment?: string; faq: { q: string; a: string }[]; public_pricing?: string };
    message: string;
    turns?: { role: "user" | "assistant"; content: string }[];
  };
  // TODO(gate-6): load `card` from stand_cards by standOwnerId with the anon key; gate hand-offs; write receptionist_sessions + inbox_items; send push
  const cached = [`Stand: ${card.name}`, `One-liner: ${card.one_liner}`, `Pitch: ${card.pitch}`, card.segment ? `Segment: ${card.segment}` : "", `FAQ:\n${card.faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n") || "(none)"}`, `Public pricing: ${card.public_pricing ?? "not published — the founder will say"}`].filter(Boolean).join("\n");
  return sse(anthropicClient().stream({ model: MODELS.fast, system: RECEPTIONIST_PROMPT, cached, turns: [...turns.slice(-10), { role: "user", content: message }], maxTokens: 220 }));
});
