/**
 * The Workshop's hook: the mock-up, from the stand and the notebook, in
 * two stages. The rules draw a plain one at once so the page is never
 * empty. With a key, the careful model first writes the brief (the big
 * prompt: everything the founder put into the building, the screens
 * with their exact words, and a design system decided from the
 * audience), then designs and writes the whole app to that brief. The
 * brief is what the founder pastes into Lovable; the design is what
 * they tap through. Edits are kept, and survive a rewrite only if the
 * founder asks for one.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { briefComplete, briefContext, BRIEF_PROMPT, builderPrompt, designContext, designDirection, designScreens, DESIGN_PROMPT, directionLine, extractHtml, founderLog, localBrief, localMockup, mockupHtml, prepareDesign, SAMPLE_DESIGN_HTML, splitBrief, type Builder, type MockScreen, type Mockup } from "@founderfloor/shared";
import { aiMode, askModel } from "./ai";
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
  const [stage, setStage] = useState<string | null>(null);
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
  const said = [...interviews.slice(0, 8).map((i) => `${i.who}: ${i.said}`), ...memory.filter((e) => e.kind === "note" || e.kind === "outcome").slice(-6).map((e) => e.text)];
  /** The work written into tasks, for the brief: what the founder actually did. */
  const work = memory.filter((e) => e.kind === "work" || e.kind === "decision").slice(-10).map((e) => e.text);
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
      setStage("Reading everything you wrote…");
      setLastError(null);
      try {
        const ctx = briefContext({ record: r, profile, said, work, log: founderLog(memory, memoryOn === true), fresh });
        setStage("Writing the brief…");
        const reply = await askModel({ fn: "guide", body: { question: "brief", content: ctx }, direct: { system: BRIEF_PROMPT, turns: [{ role: "user", content: ctx }], maxTokens: 7000, model: "careful" } });
        if (!alive.current) return;
        const { brief, spec } = splitBrief(reply);
        if (spec && briefComplete(brief)) setMockup({ ...spec, source: "live", at: new Date().toISOString(), seed: seedNow, theme: mockup?.theme ?? spec.theme, brief });
        else if (spec) {
          setMockup({ ...spec, source: "live", at: new Date().toISOString(), seed: seedNow, theme: mockup?.theme ?? spec.theme });
          setLastError("The brief came back short; the desk's own stands in for it.");
        } else {
          setMockup(local);
          setLastError("The model's brief did not parse; this one is the desk's own.");
        }
      } catch (e) {
        if (!alive.current) return;
        setMockup(local);
        setLastError(e instanceof Error ? e.message : "The model did not answer.");
      } finally {
        if (alive.current) {
          setWriting(false);
          setStage(null);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mine, r.name, r.oneLiner, r.publicPricing, profile, memory, memoryOn, setMockup],
  );

  /** The model designs and writes the whole app to the brief; asked again, to a direction drawn at random instead. Live only. */
  const design = useCallback(
    async (seed?: number) => {
      const cur = useFounder.getState().mockup;
      if (!cur || !mine || aiMode() === "rehearsal") return;
      const again = seed !== undefined;
      const d = designDirection(cur.name, seed ?? Math.floor(Math.random() * 100000));
      setDesigning(true);
      setStage("Designing every screen…");
      setDesignError(null);
      try {
        const brief = cur.brief ?? localBrief(cur, { record: r, notes: said });
        const ctx = designContext(cur, brief, d, again ? "direction" : "brief");
        const reply = await askModel({
          fn: "guide",
          body: { question: "design", content: ctx },
          direct: { system: DESIGN_PROMPT, turns: [{ role: "user", content: ctx }], maxTokens: 16000, model: "careful" },
        });
        if (!alive.current) return;
        const html = extractHtml(reply);
        const out = html ? prepareDesign(html) : { error: "no page in the reply" };
        if ("html" in out) setMockup({ ...(useFounder.getState().mockup ?? cur), design: { html: out.html, direction: again ? directionLine(d) : "Designed to the brief's own design system.", seed: d.seed, at: new Date().toISOString(), screens: out.screens } });
        else setDesignError(`The design did not pass the check (${out.error}); showing the desk's own.`);
      } catch (e) {
        if (!alive.current) return;
        setDesignError(e instanceof Error ? e.message : "The model did not answer.");
      } finally {
        if (alive.current) {
          setDesigning(false);
          setStage(null);
        }
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
  const brief = m.brief ?? localBrief(m, { record: r, notes: said });
  const sample = m.source === "sample";
  const html = m.design?.html ?? (sample ? sampleDesign() : mockupHtml(m));
  const designed = !!m.design;
  /** The screens the phone has, by name: the design's own when there is one, the words' otherwise. */
  const screens: { title: string; kind: MockScreen["kind"] }[] = (designed || sample ? (m.design?.screens ?? designScreens(html)) : []).map((s, i, all) => ({ title: s.title, kind: (m.screens[i]?.kind ?? (i === 0 ? "landing" : i === all.length - 1 ? "pricing" : "app")) as MockScreen["kind"] }));
  return {
    mockup: m,
    mine,
    writing,
    designing,
    /** What the desk is doing right now, in a line, while it works. */
    stage,
    designError,
    /** The page that runs: the model's design when there is one, the sample's when there is no sign yet, the desk's own otherwise. */
    html,
    /** The designed page alone (the model's, or the sample's), for the picture; undefined when the desk's own template is showing. */
    designHtml: m.design?.html ?? (sample ? sampleDesign() : undefined),
    designed,
    screens: screens.length ? screens : m.screens.map((s) => ({ title: s.title, kind: s.kind })),
    canDesign: mine && aiMode() !== "rehearsal",
    redesign: () => void design(Math.floor(Math.random() * 100000)),
    lastError,
    /** The big prompt: the model's brief, or the desk's own with a design system from the chosen look. */
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

let sampleHtml: string | null = null;
/** The sample, prepared once. */
function sampleDesign(): string {
  if (!sampleHtml) {
    const out = prepareDesign(SAMPLE_DESIGN_HTML);
    sampleHtml = "html" in out ? out.html : SAMPLE_DESIGN_HTML;
  }
  return sampleHtml;
}
