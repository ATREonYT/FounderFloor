/**
 * The one Anthropic client for every Edge Function. Prompt caching on the
 * stand block, streaming as SSE to the app, and a mock that returns a
 * scripted reply when ANTHROPIC_API_KEY is unset so the functions can be
 * tested without spending a token.
 *
 * Models: Haiku for coaches, receptionist and guide; Sonnet for pitch
 * scoring on Founder+. Ids are read from env so a model bump is a config
 * change, not a deploy.
 */
export const MODELS = {
  fast: Deno.env.get("ANTHROPIC_MODEL_FAST") ?? "claude-haiku-4-5-20251001",
  careful: Deno.env.get("ANTHROPIC_MODEL_CAREFUL") ?? "claude-sonnet-5",
} as const;

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

export interface CallInput {
  model: string;
  system: string;
  /** Cached: the stand record. Sent as a system block with cache_control. */
  cached: string;
  turns: Turn[];
  maxTokens?: number;
}

export interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export type Stream = AsyncIterable<{ text?: string; usage?: Usage }>;

export function anthropicClient(fetchImpl: typeof fetch = fetch) {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  return {
    live: Boolean(key),
    async *stream(i: CallInput): Stream {
      if (!key) {
        // rehearsal: stream a scripted line so the client path is exercised end to end
        const text = `Rehearsal reply from ${i.model}. The desk is not wired: ANTHROPIC_API_KEY is unset. Your last message was ${i.turns.at(-1)?.content.length ?? 0} characters.`;
        for (const w of text.split(/(\s+)/)) {
          yield { text: w };
          await new Promise((r) => setTimeout(r, 15));
        }
        yield { usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } };
        return;
      }
      const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: i.model,
          max_tokens: i.maxTokens ?? 400,
          stream: true,
          system: [
            { type: "text", text: i.system },
            { type: "text", text: i.cached, cache_control: { type: "ephemeral" } },
          ],
          messages: i.turns,
        }),
      });
      if (!res.ok || !res.body) throw new Error(`anthropic ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      const usage: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const l of lines) {
          if (!l.startsWith("data: ")) continue;
          const ev = JSON.parse(l.slice(6));
          if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") yield { text: ev.delta.text };
          if (ev.type === "message_start" && ev.message?.usage) {
            usage.input = ev.message.usage.input_tokens ?? 0;
            usage.cacheRead = ev.message.usage.cache_read_input_tokens ?? 0;
            usage.cacheWrite = ev.message.usage.cache_creation_input_tokens ?? 0;
          }
          if (ev.type === "message_delta" && ev.usage) usage.output = ev.usage.output_tokens ?? 0;
        }
      }
      yield { usage };
    },
  };
}

/** Collect a Stream into one string — for clients that cannot read SSE (React Native's fetch). */
export async function collect(stream: Stream): Promise<{ text: string; usage?: Usage }> {
  let text = "";
  let usage: Usage | undefined;
  for await (const c of stream) {
    if (c.text) text += c.text;
    if (c.usage) usage = c.usage;
  }
  return { text, usage };
}

/** SSE by default; a whole JSON body when the client sends Accept: application/json. */
export async function respond(req: Request, stream: Stream): Promise<Response> {
  if ((req.headers.get("accept") ?? "").includes("application/json")) {
    const r = await collect(stream);
    return new Response(JSON.stringify(r), { headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });
  }
  return sse(stream);
}

/** Wrap a Stream as an SSE Response the app can read line by line. */
export function sse(stream: Stream): Response {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(ctrl) {
      try {
        for await (const chunk of stream) {
          if (chunk.text) ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ t: chunk.text })}\n\n`));
          if (chunk.usage) ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ usage: chunk.usage })}\n\n`));
        }
        ctrl.enqueue(enc.encode("data: [DONE]\n\n"));
      } catch (e) {
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`));
      } finally {
        ctrl.close();
      }
    },
  });
  return new Response(body, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache", "access-control-allow-origin": "*" } });
}
