import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer, isoWeek } from "../src/server.ts";
import { FileStore, SupabaseStore } from "../src/store.ts";

async function connect(store) {
  const [a, b] = InMemoryTransport.createLinkedPair();
  const server = createServer(store);
  await server.connect(a);
  const client = new Client({ name: "test", version: "0" });
  await client.connect(b);
  return client;
}
const call = async (c, name, args = {}) => {
  const r = await c.callTool({ name, arguments: args });
  return r.content[0].text;
};

test("an agent reads the stand, ticks a room, logs what shipped and drafts the brief — through one file", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ff-"));
  const store = new FileStore(join(dir, "stand.json"));
  const c = await connect(store);
  const tools = (await c.listTools()).tools.map((t) => t.name).sort();
  assert.deepEqual(tools, ["add_interview", "ask", "brief", "calendar", "doc", "docs", "draft", "interviews", "log", "log_shipped", "log_week", "read_idea", "save_doc", "stand", "tick", "update_stand", "workshop"]);

  const empty = JSON.parse(await call(c, "stand"));
  assert.equal(empty.rank, "Garage");
  assert.equal(empty.runway, null);

  const upd = JSON.parse(await call(c, "update_stand", { name: "Lantern", oneLiner: "Prepaid passes for the cafés people come back to.", segment: "b2b-saas", mrr: 1200, burn: 6000, cash: 40000, entity: "de-llc", residence: "CY" }));
  assert.equal(upd.name, "Lantern");
  const st = JSON.parse(await call(c, "stand"));
  assert.equal(st.rank, "Ramen Profitable");
  assert.equal(st.runway, "€40,000 ÷ (€6,000 − €1,200) = 8.3 months");

  // the same file, read by a second server (the app and the agent share it)
  const again = new FileStore(join(dir, "stand.json"));
  assert.equal((await again.getStand()).name, "Lantern");

  assert.match(await call(c, "tick", { itemId: "idea.problem", proof: "sentence on the sign" }), /Ticked idea\.problem — sentence on the sign\. 3% of the path/);
  assert.match(await call(c, "tick", { itemId: "nope" }), /No item nope/);
  const ws = JSON.parse(await call(c, "workshop"));
  assert.equal(ws[0].items[0].done, true);

  assert.match(await call(c, "log_shipped", { line: "the pass QR works on a phone" }), new RegExp(`Logged for ${isoWeek()}: the pass QR works on a phone`));
  assert.match(await call(c, "log_shipped", { line: "two shops onboarded" }), /the pass QR works on a phone; two shops onboarded/);
  const log = JSON.parse(await call(c, "log"));
  assert.equal(log.entries.length, 1);
  assert.equal(log.entries[0].revenue, 0);

  await call(c, "add_interview", { who: "Dora", said: "I lose an hour a week chasing tabs", paysToday: "a POS at €49/mo" });
  const brief = await call(c, "brief");
  assert.match(brief, /^# Lantern — build brief/);
  assert.match(brief, /Dora: "I lose an hour a week chasing tabs"/);
  assert.match(brief, /founderfloor\.log_shipped/);

  const drafted = await call(c, "draft", { kind: "pricing" });
  assert.match(drafted, /Saved doc/);
  assert.match(drafted, /Start high/);
  const docs = JSON.parse(await call(c, "docs"));
  assert.equal(docs.length, 1);
  assert.equal(docs[0].source, "agent");
  assert.match(await call(c, "doc", { id: docs[0].id }), /^# Pricing sheet/);

  const cal = JSON.parse(await call(c, "calendar"));
  assert.ok(cal.some((d) => d.ruleId === "de-llc-5472"));

  assert.match(await call(c, "ask", { who: "finance", question: "what is my runway" }), /€40,000 ÷ \(€6,000 − €1,200\) = 8.3 months/);
  assert.match(await call(c, "ask", { who: "guide", question: "where am I really?" }), /The boxes say Idea/);
  const idea = JSON.parse(await call(c, "read_idea", { text: "An app for everyone that uses AI" }));
  assert.equal(idea.readiness, "sketch");

  const res = await c.readResource({ uri: "founderfloor://stand" });
  assert.equal(JSON.parse(res.contents[0].text).name, "Lantern");
});

test("the Supabase store speaks PostgREST with the founder's JWT and maps columns both ways", async () => {
  const calls = [];
  const jwt = `x.${Buffer.from(JSON.stringify({ sub: "acct_1", role: "authenticated" })).toString("base64url")}.y`;
  const f = async (url, init) => {
    calls.push({ url, init });
    if (url.includes("/stands?owner_id=eq.acct_1")) return { ok: true, text: async () => JSON.stringify([{ name: "Lantern", one_liner: "x", mrr: 1200, founder_salary: 2000, weekly_goal_progress: 0.5 }]) };
    if (url.includes("/stands?on_conflict=owner_id")) return { ok: true, text: async () => JSON.stringify([JSON.parse(init.body)]) };
    if (url.includes("/kpi_log?on_conflict")) return { ok: true, text: async () => "" };
    if (url.includes("/kpi_log?owner_id")) return { ok: true, text: async () => JSON.stringify([{ week: "2026-W36", revenue: 1, customers: 2, cash: 3, hours_on_customers: 4 }]) };
    return { ok: false, status: 500, text: async () => "boom" };
  };
  const s = new SupabaseStore("https://p.supabase.co/", "anon", jwt, f);
  const r = await s.getStand();
  assert.equal(r.name, "Lantern");
  assert.equal(r.founderSalary, 2000);
  assert.equal(r.weeklyGoalProgress, 0.5);
  assert.equal(calls[0].init.headers.authorization, `Bearer ${jwt}`);
  await s.setStand({ oneLiner: "y", mrr: 5 });
  const body = JSON.parse(calls[1].init.body);
  assert.equal(body.one_liner, "y");
  assert.equal(body.owner_id, "acct_1");
  const log = await s.logWeek({ week: "2026-W36", revenue: 1, customers: 2, cash: 3, hoursOnCustomers: 4 });
  assert.equal(log[0].hoursOnCustomers, 4);
  await assert.rejects(() => s.listDocs(), /supabase 500/);
});
