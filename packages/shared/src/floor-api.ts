/**
 * The floor server, typed. server/index.mjs is the identity authority for
 * every FounderFloor account (scrypt hashes, bearer tokens), so the app
 * signs in THERE and shows the stand the floor already knows about. This
 * file is the only place the app speaks HTTP to it. Errors come back as
 * strings in the server's own voice; nothing here throws for a 4xx.
 */
import type { FloorAuth, FloorStartup } from "./types.ts";

export interface FloorStateReply {
  state: {
    profile?: { id: string; name: string; look: { skin: number; outfit: number; hair: number }; status?: string; title?: string };
    sub?: "free" | "pro" | "founder";
    wallet?: { earned: number; redeemed: number; owned: string[] };
    myStartup?: FloorStartup;
    claims?: Record<string, number>;
    badges?: string[];
    visitStreak?: number;
    bestStreak?: number;
  } | null;
  savedAt: number;
  paid: { tier: "pro" | "founder"; until?: number | null } | null;
  coins: number | null;
  perks: unknown;
  awards: unknown[];
}

export interface FloorStandEntry {
  ownerId: string;
  floorId: string | null;
  spotIndex: number;
  online: boolean;
  lastSeen: number;
  ownerName?: string;
  startup: FloorStartup;
  slug: string | null;
  holdUntil?: number;
}

/** POST /auth/me — who the token belongs to, as the app needs it. */
export interface FloorMe {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  admin: boolean;
  weeklyMail: boolean;
  paid: { tier: "pro" | "founder"; until?: number | null } | null;
  trialUsed: boolean;
  trialDays: number;
}

type Fetch = typeof fetch;

export class FloorApi {
  readonly base: string;
  private readonly f: Fetch;
  constructor(base: string, f: Fetch = fetch) {
    this.base = base;
    // never store fetch itself: called as a method it runs with the wrong `this`, which browsers refuse ("Illegal invocation")
    this.f = (input, init) => f(input, init);
  }

  private async post<T>(path: string, body: unknown, token?: string): Promise<T | { error: string }> {
    try {
      const res = await this.f(`${this.base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      if (res.status === 404) return { error: "not found" };
      if (!res.ok) return { error: "the floor server said no" };
      return (await res.json()) as T;
    } catch {
      return { error: "the floor server is unreachable" };
    }
  }

  private async get<T>(path: string, token?: string): Promise<T | { error: string }> {
    try {
      const res = await this.f(`${this.base}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.status === 404) return { error: "not found" };
      if (!res.ok) return { error: "the floor server said no" };
      return (await res.json()) as T;
    } catch {
      return { error: "the floor server is unreachable" };
    }
  }

  /** Email + password, exactly what the site's sign-in form sends. */
  login(email: string, password: string): Promise<FloorAuth | { error: string }> {
    return this.post<FloorAuth>("/auth/login", { email, name: "", password });
  }
  register(email: string, name: string, password: string): Promise<FloorAuth | { error: string }> {
    return this.post<FloorAuth>("/auth/register", { email, name, password });
  }
  logout(token: string): Promise<unknown> {
    return this.post("/auth/logout", { token });
  }
  forgot(email: string): Promise<unknown> {
    return this.post("/auth/forgot", { email });
  }
  /** The app's reset: the eight-character code from the email, not the link. Signs in on success. */
  resetWithCode(email: string, code: string, password: string): Promise<FloorAuth | { error: string }> {
    return this.post<FloorAuth>("/auth/reset", { email, code, password });
  }
  me(token: string): Promise<FloorMe | { error: string }> {
    return this.post<FloorMe>("/auth/me", { token });
  }
  verify(token: string, code: string): Promise<(FloorMe & { ok: true }) | { error: string }> {
    return this.post<FloorMe & { ok: true }>("/auth/verify", { token, code });
  }
  verifyStart(token: string): Promise<{ ok: true; already?: boolean } | { error: string }> {
    return this.post<{ ok: true; already?: boolean }>("/auth/verify/start", { token });
  }
  prefs(token: string, prefs: { weeklyMail?: boolean }): Promise<(FloorMe & { ok: true }) | { error: string }> {
    return this.post<FloorMe & { ok: true }>("/auth/prefs", { token, ...prefs });
  }
  /** The week of the whole staff: server-side, once per account (server /trial/start). */
  trialStart(token: string): Promise<{ ok: true; until: number; days: number } | { error: string }> {
    return this.post<{ ok: true; until: number; days: number }>("/trial/start", { token });
  }
  /** The operator's routes. A non-admin token gets "not found", exactly like an unknown path. */
  admin<T>(path: "overview" | "outbox" | "grant" | "people" | "friday-review" | "stands", token: string, body: Record<string, unknown> = {}): Promise<T | { error: string }> {
    return this.post<T>(`/admin/${path}`, { token, ...body });
  }
  /** A Supabase-compatible JWT for a live floor session (server /auth/supabase). "not configured" when the VPS has no secret. */
  supabaseJwt(token: string): Promise<{ jwt: string; expiresIn: number; sub: string } | { error: string }> {
    return this.post<{ jwt: string; expiresIn: number; sub: string }>("/auth/supabase", { token });
  }
  /** The account's synced state — the stand record lives in `state.myStartup`. */
  state(me: string, token: string): Promise<FloorStateReply | { error: string }> {
    return this.get<FloorStateReply>(`/state?me=${encodeURIComponent(me)}`, token);
  }
  /** The public stand entry: which floor and spot, online, slug. */
  startup(owner: string): Promise<{ entry: FloorStandEntry } | { error: string }> {
    return this.get<{ entry: FloorStandEntry }>(`/startup?owner=${encodeURIComponent(owner)}`);
  }
  presence(): Promise<{ floors?: Record<string, number>; online?: number } | { error: string }> {
    return this.get("/presence");
  }
}

export const isErr = (x: unknown): x is { error: string } => typeof x === "object" && x !== null && typeof (x as { error?: unknown }).error === "string";
