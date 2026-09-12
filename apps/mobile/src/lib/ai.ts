/**
 * The one door to a model, with four keys, in the order they are tried.
 *
 *   own        The founder put their own Anthropic key in Settings
 *              (lib/key.ts) AND the plan already lets the staff speak.
 *              Their account pays for the words instead of ours. It
 *              changes who pays and nothing else: a key does not buy Pro,
 *              which is both the honest reading of the sentence on the
 *              settings page and what Apple's rule 3.1.1 requires of a
 *              key that would otherwise unlock a feature.
 *   edge       Pro, Founder+ or the free week is running AND
 *              EXPO_PUBLIC_SUPABASE_URL is set: POST to the Edge Function
 *              with the floor token; the function holds the Anthropic key,
 *              caches the stand block, logs usage, and FounderFloor pays.
 *              This is what Pro buys.
 *   dev        EXPO_PUBLIC_DEV_ANTHROPIC_KEY is set and the build is not a
 *              release: call Anthropic directly so Alex can try the live
 *              coaches in the Simulator today. EXPO_PUBLIC_* values are
 *              inlined at bundle time, so the key must live ONLY in
 *              apps/mobile/.env.development or .env.local (git-ignored) and
 *              must never be in the environment of a release build; the
 *              __DEV__ check stops use, not inclusion. Rotate it before the
 *              first store build.
 *   rehearsal  none of the above, which includes every founder on Free:
 *              the caller falls back to the generator in
 *              @founderfloor/shared, every page is still whole, and the
 *              status line says the building wrote it.
 *
 * Every call returns whole text; the screens "stream" it locally, word by
 * word, so the feel is the same whichever key is in the door.
 */
import { Platform } from "react-native";
import { useSession } from "./store";
import { staffUnlocked } from "./billing";
import { ownKey } from "./key";

export type AiMode = "own" | "edge" | "dev" | "rehearsal";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
const DEV_KEY = process.env.EXPO_PUBLIC_DEV_ANTHROPIC_KEY ?? "";
const MODEL_FAST = process.env.EXPO_PUBLIC_ANTHROPIC_MODEL_FAST ?? "claude-haiku-4-5-20251001";
/** The careful model writes the brief and designs the app; everything else is fast. */
const MODEL_CAREFUL = process.env.EXPO_PUBLIC_ANTHROPIC_MODEL_CAREFUL ?? "claude-sonnet-5";
const isRelease = !__DEV__;

export function aiMode(): AiMode {
  if (ownKey() && staffUnlocked()) return "own";
  if (SUPABASE_URL && staffUnlocked()) return "edge";
  if (DEV_KEY && !isRelease) return "dev";
  return "rehearsal";
}

/** The model the desk asks for on the direct paths; the key page tests against it. */
export const FAST_MODEL = MODEL_FAST;

export interface Ask {
  /** Edge Function name: coach-chat, guide, idea, receptionist. */
  fn: string;
  /** Body for the Edge Function. */
  body: Record<string, unknown>;
  /** For the dev path: the same call, spelled out. */
  direct: { system: string; cached?: string; turns: { role: "user" | "assistant"; content: string }[]; maxTokens?: number; model?: "fast" | "careful" };
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
    // the functions trust only a JWT minted by the floor server for this session
    const jwt = await useSession.getState().supabaseJwt();
    if (!jwt) throw new AiError("Sign in to talk to the desk.", 401);
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${a.fn}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", apikey: SUPABASE_ANON, authorization: `Bearer ${jwt}` },
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
  if (mode === "dev" || mode === "own") {
    const key = mode === "own" ? (ownKey() ?? "") : DEV_KEY;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", ...(Platform.OS === "web" ? { "anthropic-dangerous-direct-browser-access": "true" } : {}) },
      body: JSON.stringify({
        model: a.direct.model === "careful" ? MODEL_CAREFUL : MODEL_FAST,
        max_tokens: a.direct.maxTokens ?? 500,
        system: a.direct.cached ? [{ type: "text", text: a.direct.system }, { type: "text", text: a.direct.cached, cache_control: { type: "ephemeral" } }] : a.direct.system,
        messages: a.direct.turns,
      }),
    });
    if (!res.ok) {
      let detail = "";
      try {
        detail = ((await res.json()) as { error?: { message?: string } }).error?.message ?? "";
      } catch {}
      const why = res.status === 401 ? "the key was refused; make a new one in Settings" : res.status === 400 && /credit|billing|balance/i.test(detail) ? "the account behind your key has no credit left" : res.status === 404 ? "your key cannot use that model yet" : res.status === 429 ? "rate limited, try again in a moment" : detail || `error ${res.status}`;
      throw new AiError(`The model did not answer: ${why}.`, res.status);
    }
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
  own: "Live, on your own key. You pay for the words.",
  edge: "Live. The staff answer for real.",
  dev: "Live, dev key on this device only.",
  rehearsal: "Practice mode. The building writes this from your own words.",
};
