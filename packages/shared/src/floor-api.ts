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

type Fetch = typeof fetch;

export class FloorApi {
  readonly base: string;
  private readonly f: Fetch;
  constructor(base: string, f: Fetch = fetch) {
    this.base = base;
    this.f = f;
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
