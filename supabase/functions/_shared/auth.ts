/**
 * Who is calling. The floor server mints HS256 JWTs with the project's JWT
 * secret (server/index.mjs /auth/supabase); this verifies one and returns
 * its subject. The anon key is also a valid project JWT, so `role` is
 * checked: anon callers are not founders. No verified sub, no model call.
 */
export interface Caller {
  sub: string;
  email?: string;
  role: string;
}

function b64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad), (c) => c.charCodeAt(0));
}

export async function verifyJwt(token: string, secret = Deno.env.get("SUPABASE_JWT_SECRET") ?? ""): Promise<Caller | null> {
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  let header: { alg?: string };
  let claims: { sub?: string; role?: string; exp?: number; email?: string };
  try {
    header = JSON.parse(new TextDecoder().decode(b64url(h)));
    claims = JSON.parse(new TextDecoder().decode(b64url(p)));
  } catch {
    return null;
  }
  if (header.alg !== "HS256") return null;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("HMAC", key, b64url(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) return null;
  if (typeof claims.exp !== "number" || claims.exp * 1000 < Date.now()) return null;
  if (!claims.sub || claims.role !== "authenticated") return null;
  return { sub: claims.sub, email: claims.email, role: claims.role };
}

/** The founder behind a request, or null. Reads the Authorization header. */
export async function callerOf(req: Request): Promise<Caller | null> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return verifyJwt(auth.slice(7));
}

const ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://founderfloor.net,https://www.founderfloor.net").split(",").map((s) => s.trim());

/** CORS for the app's web build and the site; native apps send no Origin and need nothing. */
export function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allow = ORIGINS.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ? origin : ORIGINS[0];
  return { "access-control-allow-origin": allow, "access-control-allow-headers": "authorization, content-type, accept", "access-control-allow-methods": "POST, OPTIONS", vary: "origin" };
}

export function reply(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...cors(req) } });
}

/** A JSON body, capped, or null. */
export async function readBody<T>(req: Request, maxBytes = 64 * 1024): Promise<T | null> {
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
