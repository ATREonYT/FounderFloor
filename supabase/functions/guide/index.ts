/**
 * POST /guide { stand, ticks, question: "next" | "where" | "draft:<kind>" } → SSE or JSON. Haiku. Founder-only.
 * POST /guide { question: "plan" | "review", content } → the two the app parses as JSON: the founder's first four weeks, and one week read back. The app builds `content` (and decides what of the notebook may be in it), so both the live path and the phone's own path see exactly the same input.
 * POST /guide { question: "brief" | "design", content } → the Workshop's two stages on the careful model: the brief from everything the founder wrote, then the app designed to it.
 *
 * Every branch tolerates a request with no stand in it. Before September
 * 2026 the last line called standBlock unconditionally, so "review" (which
 * carries no stand) threw instead of answering.
 */
import { anthropicClient, MODELS, respond } from "../_shared/anthropic.ts";
import { callerOf, cors, readBody, reply } from "../_shared/auth.ts";
import { GUIDE_PROMPT, standBlock } from "../../../packages/shared/src/prompts/index.ts";
import { PLAN_PROMPT } from "../../../packages/shared/src/profile.ts";
import { REVIEW_PROMPT } from "../../../packages/shared/src/review.ts";
import { BRIEF_PROMPT } from "../../../packages/shared/src/workshop-brief.ts";
import { DESIGN_PROMPT } from "../../../packages/shared/src/design.ts";
import { STAGES } from "../../../packages/shared/src/build-path.ts";
import type { StandRecord } from "../../../packages/shared/src/types.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  const caller = await callerOf(req);
  if (!caller) return reply(req, 401, { error: "no badge" });
  const body = await readBody<{ stand?: StandRecord; ticks?: string[]; question: string; content?: string }>(req, 160 * 1024);
  if (!body || typeof body.question !== "string") return reply(req, 400, { error: "which question?" });
  if (body.question === "brief" || body.question === "design") {
    // the careful model is the most expensive thing the building can spend; it is Pro's, and the plan comes from the signed token
    if ((caller.tier ?? "free") === "free") return reply(req, 402, { error: "The studio draws your app on Pro. On Free the building draws it here on the phone, from your own words." });
    if (typeof body.content !== "string" || !body.content.trim()) return reply(req, 400, { error: "nothing to work from" });
    const brief = body.question === "brief";
    return respond(req, anthropicClient().stream({ model: MODELS.careful, system: brief ? BRIEF_PROMPT : DESIGN_PROMPT, cached: "", turns: [{ role: "user", content: body.content.slice(0, 120000) }], maxTokens: brief ? 7000 : 16000 }));
  }
  if (body.question === "plan" || body.question === "review") {
    if (typeof body.content !== "string" || !body.content.trim()) return reply(req, 400, { error: "nothing to work from" });
    const isPlan = body.question === "plan";
    return respond(req, anthropicClient().stream({ model: MODELS.fast, system: isPlan ? PLAN_PROMPT : REVIEW_PROMPT, cached: "", turns: [{ role: "user", content: body.content.slice(0, 20000) }], maxTokens: isPlan ? 900 : 700 }));
  }
  const ticks = Array.isArray(body.ticks) ? body.ticks.filter((t) => typeof t === "string") : [];
  const path = STAGES.map((s) => `${s.n}. ${s.name}: ${s.items.map((i) => `${ticks.includes(i.id) ? "[x]" : "[ ]"} ${i.text}`).join("; ")}`).join("\n");
  const q = body.question === "where" ? "Where am I really?" : body.question.startsWith("draft:") ? `Draft the document "${body.question.slice(6).slice(0, 40)}" from the stand, in the founder's words, marking anything missing in square brackets. Plain text.` : "Ask the guide: the single most important next action, as three steps.";
  return respond(req, anthropicClient().stream({ model: MODELS.fast, system: GUIDE_PROMPT, cached: `${body.stand ? standBlock(body.stand) : ""}\n\nBuild path:\n${path}`, turns: [{ role: "user", content: q }], maxTokens: 700 }));
});
