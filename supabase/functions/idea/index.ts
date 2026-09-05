/** POST /idea { mode: "find", brief } | { mode: "read", text } → JSON. Haiku. */
import { anthropicClient, MODELS, respond } from "../_shared/anthropic.ts";
import { IDEA_FIND_PROMPT, IDEA_READ_PROMPT } from "../../../packages/shared/src/prompts/index.ts";

Deno.serve(async (req) => {
  if (!(req.headers.get("authorization") ?? "").startsWith("Bearer ")) return new Response("no badge", { status: 401 });
  const body = (await req.json()) as { mode: "find" | "read"; brief?: unknown; text?: string };
  // TODO(gate-3): count ideaRun / ideaCheck in usage_counters and gate Free
  const system = body.mode === "find" ? IDEA_FIND_PROMPT : IDEA_READ_PROMPT;
  const content = body.mode === "find" ? `Brief: ${JSON.stringify(body.brief)}` : `Idea: ${body.text ?? ""}`;
  return respond(req, anthropicClient().stream({ model: MODELS.fast, system, cached: "", turns: [{ role: "user", content }], maxTokens: 900 }));
});
