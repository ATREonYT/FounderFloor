/**
 * State, in two stores.
 *
 * `useSession` — who you are on the floor. The floor server is the identity
 * authority for every FounderFloor account, so the app signs in there with
 * the same email and password as the site and pulls the same synced state
 * (server/index.mjs GET /state). The bearer token is the one secret on the
 * device and lives in SecureStore; the rest of the session is cached in
 * AsyncStorage so the stand paints before the network answers.
 *
 * `useFounder` — the numbers the coaches reason over, the workshop ticks,
 * the pitch scores, the quota. Local until Gate 2's Supabase tables take
 * them; the shapes are @founderfloor/shared's so the move is a transport
 * change, not a rewrite.
 */
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { FloorApi, isErr, type Draft, type FloorAuth, type FloorStandEntry, type FloorStateReply, type Idea, type IdeaBrief, type IdeaRead, type KpiEntry, type Plan, type StandRecord, type Usage } from "@founderfloor/shared";

export const FLOOR_URL = process.env.EXPO_PUBLIC_FLOOR_URL ?? "https://floor.founderfloor.net";
export const api = new FloorApi(FLOOR_URL);

// ─── secret storage: the token goes to the keychain, everything else to disk ──
const secure = {
  async get(k: string): Promise<string | null> {
    if (Platform.OS === "web") {
      try {
        return globalThis.localStorage?.getItem(k) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(k);
  },
  async set(k: string, v: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.setItem(k, v);
      } catch {}
      return;
    }
    await SecureStore.setItemAsync(k, v);
  },
  async del(k: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.removeItem(k);
      } catch {}
      return;
    }
    await SecureStore.deleteItemAsync(k);
  },
};

type Persisted = { state: { auth?: FloorAuth | null; [k: string]: unknown }; version?: number };

const splitStorage: StateStorage = {
  async getItem(name) {
    const [rest, token] = await Promise.all([AsyncStorage.getItem(name), secure.get(`${name}.token`)]);
    if (!rest) return null;
    try {
      const o = JSON.parse(rest) as Persisted;
      if (o.state?.auth) o.state.auth = token ? { ...o.state.auth, token } : null;
      return JSON.stringify(o);
    } catch {
      return null;
    }
  },
  async setItem(name, value) {
    const o = JSON.parse(value) as Persisted;
    const token = o.state?.auth?.token ?? "";
    if (o.state?.auth) o.state.auth = { ...o.state.auth, token: "" };
    await Promise.all([AsyncStorage.setItem(name, JSON.stringify(o)), token ? secure.set(`${name}.token`, token) : secure.del(`${name}.token`)]);
  },
  async removeItem(name) {
    await Promise.all([AsyncStorage.removeItem(name), secure.del(`${name}.token`)]);
  },
};

// ─── the session ──────────────────────────────────────────────────────────
export type SessionStatus = "out" | "signing" | "in";

interface SessionState {
  auth: FloorAuth | null;
  floor: FloorStateReply | null;
  stand: FloorStandEntry | null;
  status: SessionStatus;
  error: string | null;
  fetchedAt: number;
  signIn(email: string, password: string): Promise<boolean>;
  register(email: string, name: string, password: string): Promise<boolean>;
  signOut(): Promise<void>;
  refresh(): Promise<void>;
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      auth: null,
      floor: null,
      stand: null,
      status: "out",
      error: null,
      fetchedAt: 0,
      async signIn(email, password) {
        set({ status: "signing", error: null });
        const r = await api.login(email.trim(), password);
        if (isErr(r)) {
          set({ status: "out", error: r.error });
          return false;
        }
        set({ auth: r, status: "in", error: null });
        await get().refresh();
        return true;
      },
      async register(email, name, password) {
        set({ status: "signing", error: null });
        const r = await api.register(email.trim(), name.trim(), password);
        if (isErr(r)) {
          set({ status: "out", error: r.error });
          return false;
        }
        set({ auth: r, status: "in", error: null });
        await get().refresh();
        return true;
      },
      async signOut() {
        const a = get().auth;
        if (a) void api.logout(a.token);
        set({ auth: null, floor: null, stand: null, status: "out", error: null, fetchedAt: 0 });
      },
      async refresh() {
        const a = get().auth;
        if (!a) return;
        const [st, en] = await Promise.all([api.state(a.id, a.token), api.startup(a.id)]);
        if (isErr(st)) {
          // "not found" means the token is dead: the server answers 404 rather than 401 on purpose
          if (st.error === "not found") set({ auth: null, floor: null, stand: null, status: "out", error: "Signed out — that session had expired." });
          else set({ error: st.error });
          return;
        }
        set({ floor: st, stand: isErr(en) ? null : en.entry, fetchedAt: Date.now(), error: null, status: "in" });
      },
    }),
    {
      name: "ff.session",
      storage: createJSONStorage(() => splitStorage),
      partialize: (s) => ({ auth: s.auth, floor: s.floor, stand: s.stand, fetchedAt: s.fetchedAt }) as unknown as SessionState,
      onRehydrateStorage: () => (s) => {
        if (s?.auth) {
          useSession.setState({ status: "in" });
          void s.refresh();
        }
      },
    },
  ),
);

// ─── the founder's numbers, the workshop, the scores ──────────────────────
export interface PitchScore {
  at: string; // ISO
  parts: { problem: number; now: number; traction: number; market: number; ask: number };
  total: number; // 1–10, one decimal
}

export const EMPTY_RECORD: StandRecord = {
  name: "",
  oneLiner: "",
  pitch: "",
  currency: "EUR",
  mrr: 0,
  burn: 0,
  cash: 0,
  founderSalary: 0,
  entity: "none",
  residence: "other",
};

export type Door = "find" | "have" | "running";
export interface SavedDoc extends Draft {
  id: string;
  at: string;
  source: "rehearsal" | "live";
}
export interface Interview {
  id: string;
  who: string;
  at: string;
  said: string;
  paysToday?: string;
}
export interface PlanState {
  plan: Plan;
  cycle?: "monthly" | "annual";
  trialEnds?: string;
  sandbox?: boolean;
}

interface FounderState {
  record: StandRecord;
  ticks: string[];
  scores: PitchScore[];
  quota: { week: string; target: number; sent: number };
  streak: { days: number; last: string | null };
  /** First-run: which door was taken, or null before the start screen. */
  door: Door | null;
  ideas: { brief: IdeaBrief; ideas: Idea[]; at: string } | null;
  reads: { text: string; read: IdeaRead; at: string }[];
  docs: SavedDoc[];
  kpi: KpiEntry[];
  interviews: Interview[];
  usage: Usage & { day: string; month: string };
  plan: PlanState;
  setRecord(patch: Partial<StandRecord>): void;
  toggleTick(id: string): void;
  addScore(s: PitchScore): void;
  setQuota(target: number): void;
  countSent(n?: number): void;
  touchStreak(): void;
  setDoor(d: Door): void;
  setIdeas(brief: IdeaBrief, ideas: Idea[]): void;
  addRead(text: string, read: IdeaRead): void;
  saveDoc(d: Draft, source: SavedDoc["source"]): SavedDoc;
  removeDoc(id: string): void;
  logWeek(e: KpiEntry): void;
  addInterview(i: Omit<Interview, "id" | "at">): void;
  removeInterview(id: string): void;
  count(kind: "ideaRuns" | "ideaChecks" | "coachTurnsToday" | "draftsThisMonth" | "handoffsThisMonth"): void;
  setPlan(p: PlanState): void;
}

const today = () => new Date().toISOString().slice(0, 10);
const month = () => new Date().toISOString().slice(0, 7);
const EMPTY_USAGE = { ideaRuns: 0, ideaChecks: 0, coachTurnsToday: 0, draftsThisMonth: 0, handoffsThisMonth: 0, day: "", month: "" };

export function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${String(Math.ceil(((t.getTime() - y0.getTime()) / 86_400_000 + 1) / 7)).padStart(2, "0")}`;
}

export const useFounder = create<FounderState>()(
  persist(
    (set, get) => ({
      record: EMPTY_RECORD,
      ticks: [],
      scores: [],
      quota: { week: isoWeek(), target: 10, sent: 0 },
      streak: { days: 0, last: null },
      door: null,
      ideas: null,
      reads: [],
      docs: [],
      kpi: [],
      interviews: [],
      usage: EMPTY_USAGE,
      plan: { plan: "free" },
      setRecord: (patch) => set({ record: { ...get().record, ...patch } }),
      setDoor: (door) => set({ door }),
      setIdeas: (brief, ideas) => set({ ideas: { brief, ideas, at: new Date().toISOString() } }),
      addRead: (text, read) => set({ reads: [...get().reads, { text, read, at: new Date().toISOString() }].slice(-20) }),
      saveDoc: (d, source) => {
        const doc: SavedDoc = { ...d, id: `doc${Date.now().toString(36)}`, at: new Date().toISOString(), source };
        set({ docs: [doc, ...get().docs].slice(0, 60) });
        return doc;
      },
      removeDoc: (id) => set({ docs: get().docs.filter((d) => d.id !== id) }),
      logWeek: (e) => set({ kpi: [...get().kpi.filter((x) => x.week !== e.week), e].sort((a, b) => (a.week < b.week ? -1 : 1)).slice(-104) }),
      addInterview: (i) => set({ interviews: [{ ...i, id: `iv${Date.now().toString(36)}`, at: new Date().toISOString() }, ...get().interviews].slice(0, 200) }),
      removeInterview: (id) => set({ interviews: get().interviews.filter((x) => x.id !== id) }),
      count: (kind) => {
        const u = get().usage;
        const d = today(), m = month();
        const fresh = { ...u, coachTurnsToday: u.day === d ? u.coachTurnsToday : 0, draftsThisMonth: u.month === m ? u.draftsThisMonth : 0, handoffsThisMonth: u.month === m ? u.handoffsThisMonth : 0, day: d, month: m };
        set({ usage: { ...fresh, [kind]: fresh[kind] + 1 } });
      },
      setPlan: (plan) => set({ plan }),
      toggleTick: (id) => set({ ticks: get().ticks.includes(id) ? get().ticks.filter((t) => t !== id) : [...get().ticks, id] }),
      addScore: (s) => set({ scores: [...get().scores, s].slice(-24) }),
      setQuota: (target) => set({ quota: { ...get().quota, week: isoWeek(), target } }),
      countSent: (n = 1) => {
        const q = get().quota;
        const wk = isoWeek();
        set({ quota: q.week === wk ? { ...q, sent: q.sent + n } : { week: wk, target: q.target, sent: n } });
      },
      touchStreak: () => {
        const today = new Date().toISOString().slice(0, 10);
        const s = get().streak;
        if (s.last === today) return;
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
        set({ streak: { days: s.last === yesterday ? s.days + 1 : 1, last: today } });
      },
    }),
    { name: "ff.founder", storage: createJSONStorage(() => AsyncStorage), version: 2, migrate: (persisted) => ({ ...(persisted as object) }) as unknown as FounderState },
  ),
);

// ─── the inbox, in memory until Supabase Realtime ─────────────────────────
export interface InboxItem {
  id: string;
  kind: "message" | "handoff" | "nudge";
  who: string;
  look: { skin: number; outfit: number; hair: number };
  stand: string;
  last: string;
  when: string;
  unread: boolean;
  lines: { role: "you" | "them"; text: string }[];
}
interface InboxState {
  items: InboxItem[];
  seed(items: InboxItem[]): void;
  read(id: string): void;
  reply(id: string, text: string): void;
}
export const useInbox = create<InboxState>()((set, get) => ({
  items: [],
  seed: (items) => (get().items.length ? undefined : set({ items })),
  read: (id) => set({ items: get().items.map((x) => (x.id === id ? { ...x, unread: false } : x)) }),
  reply: (id, text) =>
    set({
      items: get().items.map((x) => (x.id === id ? { ...x, lines: [...x.lines, { role: "you", text }], last: `You: ${text}`, when: "now" } : x)),
    }),
}));
