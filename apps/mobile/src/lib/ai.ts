/**
 * The one door to a model, with three keys.
 *
 *   edge       EXPO_PUBLIC_SUPABASE_URL is set: POST to the Edge Function
 *              with the floor token; the function holds the Anthropic key,
 *              caches the stand block, gates Free, logs usage. Production.
 *   dev        EXPO_PUBLIC_DEV_ANTHROPIC_KEY is set and the build is not a
 *              release: call Anthropic directly so Alex can try the live
 *              coaches in the Simulator today. The key ships in the dev
 *              bundle, so this path refuses to run in production.
 *   rehearsal  neither: the caller falls back to the scripted generator in
 *              @founderfloor/shared and the status line says so.
 *
 * Every call returns whole text; the screens "stream" it locally, word by
 * word, so the feel is the same whichever key is in the door.
 */
import { Platform } from "react-native";
import { useSession } from "./store";

export type AiMode = "edge" | "dev" | "rehearsal";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const DEV_KEY = process.env.EXPO_PUBLIC_DEV_ANTHROPIC_KEY ?? "";
const MODEL_FAST = process.env.EXPO_PUBLIC_ANTHROPIC_MODEL_FAST ?? "claude-haiku-4-5-20251001";
const isRelease = !__DEV__;

export function aiMode(): AiMode {
  if (SUPABASE_URL) return "edge";
  if (DEV_KEY && !isRelease) return "dev";
  return "rehearsal";
}

export interface Ask {
  /** Edge Function name: coach-chat, guide, idea, receptionist. */
  fn: string;
  /** Body for the Edge Function. */
  body: Record<string, unknown>;
  /** For the dev path: the same call, spelled out. */
  direct: { system: string; cached?: string; turns: { role: "user" | "assistant"; content: string }[]; maxTokens?: number };
}

export class AiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Whole text from the model, or an AiError with the status (402 = over quota). Throws only on the live paths. */
export async function askModel(a: Ask): Promise<string> {
  const mode = aiMode();
  if (mode === "edge") {
    const token = useSession.getState().auth?.token ?? "";
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${a.fn}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(a.body),
    });
    if (!res.ok) {
      let msg = "the desk did not answer";
      try {
        msg = ((await res.json()) as { error?: string }).error ?? msg;
      } catch {}
      throw new AiError(msg, res.status);
    }
    return ((await res.json()) as { text: string }).text;
  }
  if (mode === "dev") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": DEV_KEY, "anthropic-version": "2023-06-01", ...(Platform.OS === "web" ? { "anthropic-dangerous-direct-browser-access": "true" } : {}) },
      body: JSON.stringify({
        model: MODEL_FAST,
        max_tokens: a.direct.maxTokens ?? 500,
        system: a.direct.cached ? [{ type: "text", text: a.direct.system }, { type: "text", text: a.direct.cached, cache_control: { type: "ephemeral" } }] : a.direct.system,
        messages: a.direct.turns,
      }),
    });
    if (!res.ok) throw new AiError(`anthropic ${res.status}`, res.status);
    const j = (await res.json()) as { content: { type: string; text?: string }[] };
    return j.content.map((c) => c.text ?? "").join("");
  }
  throw new AiError("rehearsal", 0);
}

/** Pull the first JSON value out of a model reply that may have prose around it. */
export function parseJson<T>(text: string): T | null {
  const m = text.match(/[\[{][\s\S]*[\]}]/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}

export const MODE_LINE: Record<AiMode, string> = {
  edge: "Live · the desk answers through your project",
  dev: "Live · dev key on this device only",
  rehearsal: "Rehearsal · scripted over your real numbers",
};
