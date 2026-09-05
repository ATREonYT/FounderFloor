/** POST /guide { stand, ticks, question: "next" | "where" } → SSE. Haiku. */
import { anthropicClient, MODELS, respond } from "../_shared/anthropic.ts";
import { GUIDE_PROMPT, standBlock } from "../../../packages/shared/src/prompts/index.ts";
import { STAGES } from "../../../packages/shared/src/build-path.ts";
import type { StandRecord } from "../../../packages/shared/src/types.ts";

Deno.serve(async (req) => {
  if (!(req.headers.get("authorization") ?? "").startsWith("Bearer ")) return new Response("no badge", { status: 401 });
  const { stand, ticks, question } = (await req.json()) as { stand: StandRecord; ticks: string[]; question: "next" | "where" };
  const path = STAGES.map((s) => `${s.n}. ${s.name}: ${s.items.map((i) => `${ticks.includes(i.id) ? "[x]" : "[ ]"} ${i.text}`).join("; ")}`).join("\n");
  const q = question === "where" ? "Where am I really?" : "Ask the guide: the single most important next action, as three steps.";
  return respond(req, anthropicClient().stream({ model: MODELS.fast, system: GUIDE_PROMPT, cached: `${standBlock(stand)}\n\nBuild path:\n${path}`, turns: [{ role: "user", content: q }], maxTokens: 300 }));
});
