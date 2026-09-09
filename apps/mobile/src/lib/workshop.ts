/**
 * The Workshop's hook: the mock-up, from the stand and the notebook. The
 * rules draw it at once so the page is never empty; with a key the model
 * rewrites it from the founder's own words and it is kept. Edits are
 * kept too, and survive a rewrite only if the founder asks for one.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { asMockup, buildBrief, builderPrompt, founderLog, localMockup, MOCKUP_PROMPT, type Builder, type MockScreen, type Mockup } from "@founderfloor/shared";
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
  const [lastError, setLastError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const r = stand.record;
  const mine = stand.source !== "rehearsal" && !!r.oneLiner;
  const input = mine ? { name: r.name, oneLiner: r.oneLiner, audience: profile?.audiences, price: r.publicPricing } : {};
  /** What customers said, for the brief: interviews first, then notebook lines of their words. */
  const said = [...interviews.slice(0, 6).map((i) => `${i.who}: ${i.said}`), ...memory.filter((e) => e.kind === "work" || e.kind === "note" || e.kind === "outcome").slice(-6).map((e) => e.text)];

  const write = useCallback(
    async (fresh = false) => {
      const local = localMockup(input, profile);
      if (!mine || aiMode() === "rehearsal") {
        setMockup(local);
        return;
      }
      setWriting(true);
      setLastError(null);
      try {
        const ctx = [`Stand: ${r.name}. Sign: ${r.oneLiner}. Pitch: ${r.pitch || "none"}. Segment: ${r.segment ?? "unknown"}. Public pricing: ${r.publicPricing || "not written"}.`, profile ? `Founder: ${profile.name}. Audience: ${profile.audiences}. Goal: ${profile.goal}.` : "", said.length ? `What customers said:\n${said.join("\n")}` : "", founderLog(memory, memoryOn === true), fresh ? "Write it differently from the last time." : ""].filter(Boolean).join("\n");
        const reply = await askModel({ fn: "guide", body: { question: "mockup", stand: r, fresh }, direct: { system: MOCKUP_PROMPT, turns: [{ role: "user", content: ctx }], maxTokens: 1100 } });
        const m = asMockup(parseJson(reply));
        if (!alive.current) return;
        if (m) setMockup({ ...m, source: "live", at: new Date().toISOString() });
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

  // nothing yet, or a sample while the sign has since been written: draw it
  useEffect(() => {
    if (!mockup || (mockup.source === "sample" && mine)) void write();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockup?.source, mine]);

  const m = mockup ?? localMockup(input, profile);
  const brief = buildBrief(m, { record: r, notes: said });
  return {
    mockup: m,
    mine,
    writing,
    lastError,
    brief,
    prompt: (kind: Builder) => builderPrompt(kind, m, brief),
    rewrite: () => void write(true),
    editScreen: (i: number, patch: Partial<MockScreen>) => setMockup({ ...m, screens: m.screens.map((sc, k) => (k === i ? { ...sc, ...patch } : sc)) }),
  };
}
