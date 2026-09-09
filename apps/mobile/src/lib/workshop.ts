/**
 * The Workshop's hook: the mock-up, from the stand and the notebook. The
 * rules draw it at once so the page is never empty; with a key the model
 * rewrites it from the founder's own words and it is kept. Edits are
 * kept too, and survive a rewrite only if the founder asks for one.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { asMockup, buildBrief, builderPrompt, designContext, designDirection, DESIGN_PROMPT, directionLine, extractHtml, founderLog, localMockup, mockupHtml, prepareDesign, MOCKUP_PROMPT, type Builder, type MockScreen, type Mockup } from "@founderfloor/shared";
import { aiMode, askModel, parseJson } from "./ai";
import { useStand } from "./stand";
import { useFounder } from "./store";

export function useWorkshop() {
  const stand = useStand();
  const profile = useFounder((s) => s.profile);
  const memory = useFounder((s) => s.memory);
  const memoryOn = useFounder((s) => s.memoryOn);
  const interviews = useFounder((s) => s.interviews);
  const mockup = useFounder((s) => s.mockup);
  const setMockup = useFounder((s) => s.setMockup);
  const [writing, setWriting] = useState(false);
  const [designing, setDesigning] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [designError, setDesignError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const r = stand.record;
  const mine = stand.source !== "rehearsal" && !!r.oneLiner;
  /** What customers said, for the mock-up and the brief: interviews first, then notebook lines in their words. */
  const said = [...interviews.slice(0, 6).map((i) => `${i.who}: ${i.said}`), ...memory.filter((e) => e.kind === "work" || e.kind === "note" || e.kind === "outcome").slice(-6).map((e) => e.text)];
  const input = mine ? { name: r.name, oneLiner: r.oneLiner, audience: profile?.audiences, price: r.publicPricing, said, segment: r.segment } : {};
  const seedNow = localMockup(input, profile).seed;

  const write = useCallback(
    async (fresh = false) => {
      const local = localMockup(input, profile);
      if (!mine || aiMode() === "rehearsal") {
        setMockup({ ...local, theme: mockup?.theme ?? local.theme });
        return;
      }
      setWriting(true);
      setLastError(null);
      try {
        const ctx = [`Stand: ${r.name}. Sign: ${r.oneLiner}. Pitch: ${r.pitch || "none"}. Segment: ${r.segment ?? "unknown"}. Public pricing: ${r.publicPricing || "not written"}.`, profile ? `Founder: ${profile.name}. Audience: ${profile.audiences}. Goal: ${profile.goal}.` : "", said.length ? `What customers said:\n${said.join("\n")}` : "", founderLog(memory, memoryOn === true), fresh ? "Write it differently from the last time." : ""].filter(Boolean).join("\n");
        const reply = await askModel({ fn: "guide", body: { question: "mockup", stand: r, fresh }, direct: { system: MOCKUP_PROMPT, turns: [{ role: "user", content: ctx }], maxTokens: 1100 } });
        const m = asMockup(parseJson(reply));
        if (!alive.current) return;
        if (m) setMockup({ ...m, source: "live", at: new Date().toISOString(), seed: seedNow, theme: mockup?.theme ?? m.theme });
        else {
          setMockup(local);
          setLastError("The model's mock-up did not parse; this one is the desk's own.");
        }
      } catch (e) {
        if (!alive.current) return;
        setMockup(local);
        setLastError(e instanceof Error ? e.message : "The model did not answer.");
      } finally {
        if (alive.current) setWriting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mine, r.name, r.oneLiner, r.publicPricing, profile, memory, memoryOn, setMockup],
  );

  /** The model designs and writes the whole page from the words and a direction; a new seed is a new direction. Live only. */
  const design = useCallback(
    async (seed?: number) => {
      const cur = useFounder.getState().mockup;
      if (!cur || !mine || aiMode() === "rehearsal") return;
      const d = designDirection(cur.name, seed ?? cur.design?.seed ?? Math.floor(Math.random() * 100000));
      setDesigning(true);
      setDesignError(null);
      try {
        const brief = buildBrief(cur, { record: r, notes: said });
        const reply = await askModel({
          fn: "guide",
          body: { question: "design", mockup: cur, direction: directionLine(d), seed: d.seed },
          direct: { system: DESIGN_PROMPT, turns: [{ role: "user", content: designContext(cur, brief, d) }], maxTokens: 9000 },
        });
        if (!alive.current) return;
        const html = extractHtml(reply);
        const out = html ? prepareDesign(html) : { error: "no page in the reply" };
        if ("html" in out) setMockup({ ...(useFounder.getState().mockup ?? cur), design: { html: out.html, direction: directionLine(d), seed: d.seed, at: new Date().toISOString() } });
        else setDesignError(`The design did not pass the check (${out.error}); showing the desk's own.`);
      } catch (e) {
        if (!alive.current) return;
        setDesignError(e instanceof Error ? e.message : "The model did not answer.");
      } finally {
        if (alive.current) setDesigning(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mine, r, said, setMockup],
  );

  // the words are in and there is a key: design it, once
  useEffect(() => {
    if (mockup && mine && !mockup.design && mockup.source !== "sample" && aiMode() !== "rehearsal" && !writing && !designing) void design();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockup?.source, mockup?.seed, mine, writing]);

  // nothing yet, a sample while the sign has since been written, or a sign that changed under an unedited mock-up: draw it
  useEffect(() => {
    if (!mockup || (mockup.source === "sample" && mine) || (mine && !mockup.edited && mockup.seed && mockup.seed !== seedNow)) void write();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockup?.source, mine, seedNow]);

  const m = mockup ?? localMockup(input, profile);
  const brief = buildBrief(m, { record: r, notes: said });
  return {
    mockup: m,
    mine,
    writing,
    designing,
    designError,
    /** The page that runs: the model's design when there is one, the desk's own otherwise. */
    html: m.design?.html ?? mockupHtml(m),
    designed: !!m.design,
    canDesign: mine && aiMode() !== "rehearsal",
    redesign: () => void design(Math.floor(Math.random() * 100000)),
    lastError,
    brief,
    prompt: (kind: Builder) => builderPrompt(kind, m, brief),
    rewrite: () => void write(true),
    editScreen: (i: number, patch: Partial<MockScreen>) => setMockup({ ...m, edited: true, screens: m.screens.map((sc, k) => (k === i ? { ...sc, ...patch } : sc)) }),
    /** The look is the founder's choice and survives a redraw of the words. */
    setTheme: (theme: Mockup["theme"]) => setMockup({ ...m, theme }),
    setKind: (kind: Mockup["kind"]) => setMockup({ ...m, kind }),
    said,
  };
}
