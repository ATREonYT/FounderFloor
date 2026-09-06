/** POST /idea { mode: "find", brief } | { mode: "read", text } → JSON. Haiku. Founder-only. */
import { anthropicClient, MODELS, respond } from "../_shared/anthropic.ts";
import { callerOf, cors, readBody, reply } from "../_shared/auth.ts";
import { IDEA_FIND_PROMPT, IDEA_READ_PROMPT } from "../../../packages/shared/src/prompts/index.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  const caller = await callerOf(req);
  if (!caller) return reply(req, 401, { error: "no badge" });
  const body = await readBody<{ mode: "find" | "read"; brief?: unknown; text?: string }>(req);
  if (!body || (body.mode !== "find" && body.mode !== "read")) return reply(req, 400, { error: "find or read" });
  // TODO(gate-3): count ideaRun / ideaCheck in usage_counters by caller.sub and gate Free
  const system = body.mode === "find" ? IDEA_FIND_PROMPT : IDEA_READ_PROMPT;
  const content = body.mode === "find" ? `Brief: ${JSON.stringify(body.brief ?? {}).slice(0, 4000)}` : `Idea: ${String(body.text ?? "").slice(0, 4000)}`;
  return respond(req, anthropicClient().stream({ model: MODELS.fast, system, cached: "", turns: [{ role: "user", content }], maxTokens: 900 }));
});
