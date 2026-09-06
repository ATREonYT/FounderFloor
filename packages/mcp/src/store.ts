/**
 * Where the stand lives, behind one interface. FileStore keeps a JSON file
 * (default ~/.founderfloor/stand.json) so the server works with no account
 * at all — Claude Code and the founder share one file on the laptop.
 * SupabaseStore speaks PostgREST with the founder's JWT, against the tables
 * in supabase/migrations, so the app and the agent see the same stand.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import type { Draft, KpiEntry, StandRecord } from "../../shared/src/index.ts";

export interface Doc extends Draft {
  id: string;
  at: string;
  source: "rehearsal" | "live" | "agent" | "founder";
}
export interface Interview {
  id: string;
  who: string;
  said: string;
  paysToday?: string;
  at: string;
}

export interface Store {
  getStand(): Promise<StandRecord>;
  setStand(patch: Partial<StandRecord>): Promise<StandRecord>;
  listDocs(): Promise<Doc[]>;
  getDoc(id: string): Promise<Doc | null>;
  saveDoc(d: Draft, source: Doc["source"]): Promise<Doc>;
  listTicks(): Promise<string[]>;
  tick(id: string, on: boolean): Promise<string[]>;
  getLog(): Promise<KpiEntry[]>;
  logWeek(e: KpiEntry): Promise<KpiEntry[]>;
  listInterviews(): Promise<Interview[]>;
  addInterview(i: Omit<Interview, "id" | "at">): Promise<Interview>;
}

export const EMPTY: StandRecord = { name: "", oneLiner: "", pitch: "", currency: "EUR", mrr: 0, burn: 0, cash: 0, founderSalary: 0, entity: "none", residence: "other" };

const nid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

interface FileShape {
  record: StandRecord;
  docs: Doc[];
  ticks: string[];
  kpi: KpiEntry[];
  interviews: Interview[];
}

export class FileStore implements Store {
  private path: string;
  private data: FileShape;
  constructor(path: string) {
    this.path = path;
    this.data = existsSync(path) ? { record: EMPTY, docs: [], ticks: [], kpi: [], interviews: [], ...(JSON.parse(readFileSync(path, "utf8")) as Partial<FileShape>) } : { record: EMPTY, docs: [], ticks: [], kpi: [], interviews: [] };
  }
  private save() {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(this.data, null, 2));
  }
  async getStand() {
    return this.data.record;
  }
  async setStand(patch: Partial<StandRecord>) {
    this.data.record = { ...this.data.record, ...patch };
    this.save();
    return this.data.record;
  }
  async listDocs() {
    return this.data.docs;
  }
  async getDoc(id: string) {
    return this.data.docs.find((d) => d.id === id) ?? null;
  }
  async saveDoc(d: Draft, source: Doc["source"]) {
    const doc: Doc = { ...d, id: nid("doc"), at: new Date().toISOString(), source };
    this.data.docs.unshift(doc);
    this.save();
    return doc;
  }
  async listTicks() {
    return this.data.ticks;
  }
  async tick(id: string, on: boolean) {
    const set = new Set(this.data.ticks);
    if (on) set.add(id);
    else set.delete(id);
    this.data.ticks = [...set];
    this.save();
    return this.data.ticks;
  }
  async getLog() {
    return this.data.kpi;
  }
  async logWeek(e: KpiEntry) {
    this.data.kpi = [...this.data.kpi.filter((x) => x.week !== e.week), e].sort((a, b) => (a.week < b.week ? -1 : 1));
    this.save();
    return this.data.kpi;
  }
  async listInterviews() {
    return this.data.interviews;
  }
  async addInterview(i: Omit<Interview, "id" | "at">) {
    const iv: Interview = { ...i, id: nid("iv"), at: new Date().toISOString() };
    this.data.interviews.unshift(iv);
    this.save();
    return iv;
  }
}

/** PostgREST against supabase/migrations 0001 + 0002, with the founder's JWT (sub = owner_id). */
export class SupabaseStore implements Store {
  private url: string;
  private anon: string;
  private jwt: string;
  private owner: string;
  private f: typeof fetch;
  constructor(url: string, anonKey: string, jwt: string, f: typeof fetch = fetch) {
    this.url = url.replace(/\/$/, "");
    this.anon = anonKey;
    this.jwt = jwt;
    this.owner = JSON.parse(Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString() || "{}").sub ?? "";
    this.f = f;
  }
  private async rest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await this.f(`${this.url}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: this.anon, authorization: `Bearer ${this.jwt}`, "content-type": "application/json", prefer: "return=representation,resolution=merge-duplicates", ...(init.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`supabase ${res.status}: ${await res.text()}`);
    const t = await res.text();
    return (t ? JSON.parse(t) : null) as T;
  }
  private rowToRecord(r: Record<string, unknown> | null): StandRecord {
    if (!r) return EMPTY;
    return {
      name: String(r.name ?? ""),
      oneLiner: String(r.one_liner ?? ""),
      pitch: String(r.pitch ?? ""),
      segment: (r.segment as StandRecord["segment"]) ?? undefined,
      currency: (r.currency as StandRecord["currency"]) ?? "EUR",
      mrr: Number(r.mrr ?? 0),
      burn: Number(r.burn ?? 0),
      cash: Number(r.cash ?? 0),
      founderSalary: Number(r.founder_salary ?? 0),
      entity: (r.entity as StandRecord["entity"]) ?? "none",
      residence: (r.residence as StandRecord["residence"]) ?? "other",
      weeklyGoal: (r.weekly_goal as string) ?? undefined,
      weeklyGoalProgress: Number(r.weekly_goal_progress ?? 0),
      target90: (r.target_90 as string) ?? undefined,
      formedOn: (r.formed_on as string) ?? undefined,
      faq: (r.faq as StandRecord["faq"]) ?? [],
      publicPricing: (r.public_pricing as string) ?? undefined,
    };
  }
  private recordToRow(p: Partial<StandRecord>): Record<string, unknown> {
    const m: Record<string, string> = { name: "name", oneLiner: "one_liner", pitch: "pitch", segment: "segment", currency: "currency", mrr: "mrr", burn: "burn", cash: "cash", founderSalary: "founder_salary", entity: "entity", residence: "residence", weeklyGoal: "weekly_goal", weeklyGoalProgress: "weekly_goal_progress", target90: "target_90", formedOn: "formed_on", faq: "faq", publicPricing: "public_pricing" };
    const out: Record<string, unknown> = { owner_id: this.owner, updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(p)) if (m[k] && v !== undefined) out[m[k]] = v;
    return out;
  }
  async getStand() {
    const rows = await this.rest<Record<string, unknown>[]>(`stands?owner_id=eq.${encodeURIComponent(this.owner)}&limit=1`);
    return this.rowToRecord(rows[0] ?? null);
  }
  async setStand(patch: Partial<StandRecord>) {
    const rows = await this.rest<Record<string, unknown>[]>(`stands?on_conflict=owner_id`, { method: "POST", body: JSON.stringify(this.recordToRow(patch)) });
    return this.rowToRecord(rows[0] ?? null);
  }
  async listDocs() {
    const rows = await this.rest<Record<string, unknown>[]>(`documents?owner_id=eq.${encodeURIComponent(this.owner)}&order=created_at.desc&limit=60`);
    return rows.map((r) => ({ id: String(r.id), kind: r.kind as Doc["kind"], title: String(r.title), body: String(r.body), at: String(r.created_at), source: r.source as Doc["source"] }));
  }
  async getDoc(id: string) {
    const rows = await this.rest<Record<string, unknown>[]>(`documents?id=eq.${encodeURIComponent(id)}&limit=1`);
    const r = rows[0];
    return r ? { id: String(r.id), kind: r.kind as Doc["kind"], title: String(r.title), body: String(r.body), at: String(r.created_at), source: r.source as Doc["source"] } : null;
  }
  async saveDoc(d: Draft, source: Doc["source"]) {
    const id = nid("doc");
    await this.rest(`documents`, { method: "POST", body: JSON.stringify({ id, owner_id: this.owner, kind: d.kind, title: d.title, body: d.body, source }) });
    return { ...d, id, at: new Date().toISOString(), source };
  }
  async listTicks() {
    const rows = await this.rest<{ item_id: string }[]>(`build_ticks?owner_id=eq.${encodeURIComponent(this.owner)}&select=item_id`);
    return rows.map((r) => r.item_id);
  }
  async tick(id: string, on: boolean) {
    if (on) await this.rest(`build_ticks?on_conflict=owner_id,item_id`, { method: "POST", body: JSON.stringify({ owner_id: this.owner, item_id: id }) });
    else await this.rest(`build_ticks?owner_id=eq.${encodeURIComponent(this.owner)}&item_id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return this.listTicks();
  }
  async getLog() {
    const rows = await this.rest<Record<string, unknown>[]>(`kpi_log?owner_id=eq.${encodeURIComponent(this.owner)}&order=week.asc`);
    return rows.map((r) => ({ week: String(r.week), revenue: Number(r.revenue), customers: Number(r.customers), cash: Number(r.cash), hoursOnCustomers: Number(r.hours_on_customers), shipped: (r.shipped as string) ?? undefined, note: (r.note as string) ?? undefined }));
  }
  async logWeek(e: KpiEntry) {
    await this.rest(`kpi_log?on_conflict=owner_id,week`, { method: "POST", body: JSON.stringify({ owner_id: this.owner, week: e.week, revenue: e.revenue, customers: e.customers, cash: e.cash, hours_on_customers: e.hoursOnCustomers, shipped: e.shipped ?? null, note: e.note ?? null, updated_at: new Date().toISOString() }) });
    return this.getLog();
  }
  async listInterviews() {
    const rows = await this.rest<Record<string, unknown>[]>(`interviews?owner_id=eq.${encodeURIComponent(this.owner)}&order=created_at.desc&limit=200`);
    return rows.map((r) => ({ id: String(r.id), who: String(r.who), said: String(r.said), paysToday: (r.pays_today as string) ?? undefined, at: String(r.created_at) }));
  }
  async addInterview(i: Omit<Interview, "id" | "at">) {
    const id = nid("iv");
    await this.rest(`interviews`, { method: "POST", body: JSON.stringify({ id, owner_id: this.owner, who: i.who, said: i.said, pays_today: i.paysToday ?? null }) });
    return { ...i, id, at: new Date().toISOString() };
  }
}
