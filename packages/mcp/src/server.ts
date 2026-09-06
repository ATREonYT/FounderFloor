/**
 * FounderFloor over MCP. An agent building the founder's product reads the
 * stand, the interview book, the drawer and the workshop, and writes back
 * what shipped — so nothing is copied between the app and the terminal.
 * Every tool is the same function the app calls; the coaches answer from
 * the shared rehearsal logic here (the live model is the app's business).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { STAGES, currentStage, stageProgress, pathProgress, DOC_KINDS, draftDocument, builderBrief, deltas, draftUpdate, generateDeadlines, runwayLine, rankFor, toNextRank, askGuide, whereAmI, coachReply, readIdea, type DocKind, type StandRecord } from "../../shared/src/index.ts";
import type { Store } from "./store.ts";

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const json = (o: unknown) => text(JSON.stringify(o, null, 2));

export function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${String(Math.ceil(((t.getTime() - y0.getTime()) / 86_400_000 + 1) / 7)).padStart(2, "0")}`;
}

export function createServer(store: Store): McpServer {
  const server = new McpServer({ name: "founderfloor", version: "0.1.0" }, { instructions: "FounderFloor is the founder's stand: the company in their words, their numbers, the interview book, the drawer of documents, and the six-room workshop. Read `stand` before building anything. When something ships, call `log_shipped`. Tick workshop items only when their proof is true. Never invent numbers; a missing one is missing." });

  server.registerResource("stand", "founderfloor://stand", { title: "The stand", description: "The company record the coaches reason over.", mimeType: "application/json" }, async (uri) => ({ contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(await store.getStand(), null, 2) }] }));
  server.registerResource("brief", "founderfloor://brief", { title: "Build brief", description: "The stand as a brief for an agent: build first, do not build yet, done means.", mimeType: "text/markdown" }, async (uri) => {
    const [r, ticks, interviews, docs] = await Promise.all([store.getStand(), store.listTicks(), store.listInterviews(), store.listDocs()]);
    return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: builderBrief(r, { ticks, interviews, docs: docs.filter((d) => d.kind !== "brief").slice(0, 2), mcp: true }) }] };
  });

  server.registerTool("stand", { title: "Read the stand", description: "The company: name, one-liner, pitch, segment, MRR, burn, cash, salary, entity, residence, goals; with rank and runway computed.", inputSchema: {} }, async () => {
    const r = await store.getStand();
    const ticks = await store.listTicks();
    const st = currentStage(ticks);
    return json({ ...r, rank: rankFor(r.mrr).name, toNextRank: toNextRank(r.mrr), runway: r.burn ? runwayLine({ cash: r.cash, burn: r.burn, mrr: r.mrr }, r.currency) : null, stage: `${st.n}. ${st.name}`, stageProgress: stageProgress(st, ticks), pathProgress: pathProgress(ticks) });
  });

  server.registerTool("brief", { title: "Build brief", description: "The stand as a Markdown brief for building: build first, do not build yet, done means, constraints, rules for the agent.", inputSchema: {} }, async () => {
    const [r, ticks, interviews, docs] = await Promise.all([store.getStand(), store.listTicks(), store.listInterviews(), store.listDocs()]);
    return text(builderBrief(r, { ticks, interviews, docs: docs.filter((d) => d.kind !== "brief").slice(0, 2), mcp: true }));
  });

  server.registerTool(
    "update_stand",
    {
      title: "Update the stand",
      description: "Change facts on the stand. Only the founder's facts: name, one-liner, pitch, segment, numbers, entity, residence, goals, FAQ, public pricing. Ask the founder before changing a price or a goal.",
      inputSchema: {
        name: z.string().max(80).optional(),
        oneLiner: z.string().max(200).optional(),
        pitch: z.string().max(1200).optional(),
        segment: z.enum(["b2b-saas", "consumer", "marketplace", "services", "hardware", "other"]).optional(),
        currency: z.enum(["EUR", "USD", "GBP"]).optional(),
        mrr: z.number().int().min(0).optional(),
        burn: z.number().int().min(0).optional(),
        cash: z.number().int().min(0).optional(),
        founderSalary: z.number().int().min(0).optional(),
        entity: z.enum(["none", "de-llc", "de-ccorp", "cy-ltd", "uk-ltd", "ee-ou"]).optional(),
        residence: z.enum(["CY", "US", "GB", "EE", "DE", "other"]).optional(),
        weeklyGoal: z.string().max(200).optional(),
        weeklyGoalProgress: z.number().min(0).max(1).optional(),
        target90: z.string().max(200).optional(),
        formedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        yearEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        stockGrant: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        publicPricing: z.string().max(400).optional(),
        faq: z.array(z.object({ q: z.string().max(200), a: z.string().max(600) })).max(12).optional(),
      },
    },
    async (patch) => json(await store.setStand(patch as Partial<StandRecord>)),
  );

  server.registerTool("workshop", { title: "The workshop", description: "The six rooms of the build path with each item, its proof, and whether it is ticked.", inputSchema: {} }, async () => {
    const ticks = await store.listTicks();
    return json(STAGES.map((s) => ({ id: s.id, n: s.n, name: s.name, progress: stageProgress(s, ticks), items: s.items.map((i) => ({ id: i.id, text: i.text, proof: i.proof, done: ticks.includes(i.id) })) })));
  });

  server.registerTool("tick", { title: "Tick a workshop item", description: "Mark an item done (or undone). Only when its proof is actually true; say which proof.", inputSchema: { itemId: z.string(), done: z.boolean().default(true), proof: z.string().max(300).optional() } }, async ({ itemId, done, proof }) => {
    const known = STAGES.some((s) => s.items.some((i) => i.id === itemId));
    if (!known) return text(`No item ${itemId}. Call workshop for the ids.`);
    const ticks = await store.tick(itemId, done);
    return text(`${done ? "Ticked" : "Unticked"} ${itemId}${proof ? ` — ${proof}` : ""}. ${Math.round(pathProgress(ticks) * 100)}% of the path.`);
  });

  server.registerTool("docs", { title: "The drawer", description: "List the documents drafted from the stand (id, kind, title, date).", inputSchema: {} }, async () => json((await store.listDocs()).map((d) => ({ id: d.id, kind: d.kind, title: d.title, at: d.at, source: d.source }))));
  server.registerTool("doc", { title: "Read a document", description: "The body of one document from the drawer.", inputSchema: { id: z.string() } }, async ({ id }) => {
    const d = await store.getDoc(id);
    return d ? text(`# ${d.title}\n\n${d.body}`) : text("No such document.");
  });
  server.registerTool("draft", { title: "Draft a document", description: `Draft one of the drawer's documents from the stand, in the founder's words, marking missing facts in square brackets. Kinds: ${DOC_KINDS.map((k) => k.kind).join(", ")}.`, inputSchema: { kind: z.enum(DOC_KINDS.map((k) => k.kind) as [DocKind, ...DocKind[]]) } }, async ({ kind }) => {
    const r = await store.getStand();
    const d = kind === "update" ? { kind, title: `Update · ${isoWeek()}`, body: draftUpdate(await store.getLog(), r) } : draftDocument(kind, r);
    const saved = await store.saveDoc(d, "agent");
    return text(`Saved ${saved.id}: ${saved.title}\n\n${saved.body}`);
  });
  server.registerTool("save_doc", { title: "Save a document", description: "Put a document the agent wrote into the drawer (a spec, a changelog, a decision).", inputSchema: { title: z.string().max(120), body: z.string().max(20_000), kind: z.enum(DOC_KINDS.map((k) => k.kind) as [DocKind, ...DocKind[]]).default("brief") } }, async ({ title, body, kind }) => json(await store.saveDoc({ kind, title, body }, "agent")));

  server.registerTool("log", { title: "The weekly log", description: "Every logged week (revenue, customers, cash, hours with customers, shipped) and the latest deltas.", inputSchema: {} }, async () => {
    const entries = await store.getLog();
    return json({ entries, deltas: deltas(entries) });
  });
  server.registerTool("log_week", { title: "Log a week", description: "Write this week's five numbers. Ask the founder for numbers you do not have; never estimate them.", inputSchema: { week: z.string().regex(/^\d{4}-W\d{2}$/).optional(), revenue: z.number().int().min(0), customers: z.number().int().min(0), cash: z.number().int().min(0), hoursOnCustomers: z.number().int().min(0).default(0), shipped: z.string().max(600).optional(), note: z.string().max(1000).optional() } }, async (e) => json(await store.logWeek({ ...e, week: e.week ?? isoWeek() })));
  server.registerTool("log_shipped", { title: "Log what shipped", description: "Append one line to this week's 'shipped' — what a customer can now do that they could not before. Call this when something ships.", inputSchema: { line: z.string().min(3).max(300) } }, async ({ line }) => {
    const wk = isoWeek();
    const log = await store.getLog();
    const cur = log.find((e) => e.week === wk) ?? { ...(log.at(-1) ?? { revenue: 0, customers: 0, cash: 0, hoursOnCustomers: 0 }), week: wk, shipped: "", note: "" };
    const shipped = [cur.shipped, line].filter(Boolean).join("; ");
    await store.logWeek({ ...cur, week: wk, shipped });
    return text(`Logged for ${wk}: ${shipped}`);
  });

  server.registerTool("interviews", { title: "The interview book", description: "What customers said, in their words.", inputSchema: {} }, async () => json(await store.listInterviews()));
  server.registerTool("add_interview", { title: "Write an interview down", description: "Record what a customer said, verbatim, and what they pay for today.", inputSchema: { who: z.string().max(120), said: z.string().max(2000), paysToday: z.string().max(200).optional() } }, async (i) => json(await store.addInterview(i)));

  server.registerTool("calendar", { title: "The filing calendar", description: "Upcoming filings for the stand's entity and residence, each with its official source. Not tax advice.", inputSchema: {} }, async () => {
    const r = await store.getStand();
    return json(generateDeadlines({ entity: r.entity, residence: r.residence, formedOn: r.formedOn, yearEnd: r.yearEnd, stockGrant: r.stockGrant }));
  });

  server.registerTool("ask", { title: "Ask a coach", description: "Ask Ines (strategy), Rook (sales), Marguerite (investor) or Teodor (finance) a question about this company; or the guide: 'next' for the most important next action, 'where' for the blunt assessment. Answers use the stand's real numbers.", inputSchema: { who: z.enum(["strategy", "sales", "investor", "finance", "guide"]), question: z.string().max(4000) } }, async ({ who, question }) => {
    const [r, ticks] = await Promise.all([store.getStand(), store.listTicks()]);
    if (who === "guide") return text(/where/i.test(question) ? whereAmI(r, ticks) : askGuide(r, ticks));
    const log = await store.getLog();
    const out = coachReply(who, question, { record: r, ticks, scores: [], quota: { target: 10, sent: 0 }, streak: log.length, weekday: new Date().getDay() });
    return text(out.text);
  });

  server.registerTool("read_idea", { title: "Second opinion", description: "Read an idea back: what is strong, questions only customers can answer, who to talk to, how to ask. Never a score.", inputSchema: { text: z.string().min(12).max(4000) } }, async ({ text: t }) => json(readIdea(t)));

  return server;
}
