/**
 * The Workshop's hook: the mock-up, from the stand and the notebook. The
 * studio draws it at once, without a model: it reads what the product
 * is, takes the palette, type and treatment its kind has earned, and
 * assembles the screens from the founder's own words, so the page is
 * never empty and never a template. With a key, the careful model first
 * writes the brief (the big prompt: everything the founder put into the
 * building, the screens with their exact words, and the studio's plan
 * as the design system to build on), then designs and writes the whole
 * app to that brief. The brief is what the founder pastes into Lovable;
 * the design is what they tap through. Edits are kept, and survive a
 * rewrite only if the founder asks for one.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { briefComplete, briefContext, BRIEF_PROMPT, builderPrompt, designContext, designDirection, designScreens, DESIGN_PROMPT, directionLine, extractHtml, founderLog, localBrief, localMockup, prepareDesign, SAMPLE_DESIGN_HTML, splitBrief, studioDesign, workLines, type Builder, type MockScreen, type Mockup, type StudioResult } from "@founderfloor/shared";
import { aiMode, askModel } from "./ai";
import { useStand } from "./stand";
import { useFounder } from "./store";
import { mayShare, pastLog, pastNotes, pastWorkLines, sourceLine, type Past } from "./consent";

export function useWorkshop() {
  const stand = useStand();
  const profile = useFounder((s) => s.profile);
  const memory = useFounder((s) => s.memory);
  const memoryOn = useFounder((s) => s.memoryOn);
  const interviews = useFounder((s) => s.interviews);
  const lists = useFounder((s) => s.work);
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
  const planId = useFounder((s) => s.planId);
  const past: Past = { memoryOn, memory, planId };
  /**
   * What customers said, and what the founder wrote, for the mock-up and
   * the brief. Both are things they wrote earlier, so both travel only
   * with the notebook's leave; without it the studio draws from the sign,
   * the audience and the price alone, and the page says so.
   */
  const said = mayShare(memoryOn) ? [...interviews.slice(0, 8).map((i) => `${i.who}: ${i.said}`), ...pastNotes(past, ["note", "outcome"], 6)] : [];
  const work = mayShare(memoryOn) ? [...pastWorkLines(past, lists), ...pastNotes(past, ["work", "decision"], 10)].slice(-24) : [];
  const input = mine ? { name: r.name, oneLiner: r.oneLiner, audience: profile?.audiences, price: r.publicPricing, said, segment: r.segment } : {};
  const seedNow = localMockup(input, profile).seed;

  const m = mockup ?? localMockup(input, profile);
  const sample = m.source === "sample";
  /** The studio's own drawing of this product, at this seed and reading; the page when the model has not designed one. */
  const studio: StudioResult | null = useMemo(() => {
    if (sample) return null;
    try {
      return studioDesign(m, { said, segment: r.segment, pitch: r.pitch, seed: m.studioSeed ?? 0, chosen: m.studioType });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.name, m.oneLiner, m.audience, m.kind, m.studioSeed, m.studioType, m.screens, m.quotes, r.segment, r.pitch, said.join("|")]);
  const studioHtml = useMemo(() => {
    if (!studio) return null;
    const out = prepareDesign(studio.html);
    return "html" in out ? out.html : null;
  }, [studio]);

  const write = useCallback(
    async (fresh = false) => {
      const local = localMockup(input, profile);
      const keep = { theme: mockup?.theme ?? local.theme, studioSeed: mockup?.studioSeed, studioType: mockup?.studioType };
      if (!mine || aiMode() === "rehearsal") {
        setMockup({ ...local, ...keep });
        return;
      }
      setWriting(true);
      setStage("Reading everything you wrote…");
      setLastError(null);
      try {
        const plan = studio?.system ?? studioDesign(local, { said, segment: r.segment, pitch: r.pitch, seed: keep.studioSeed ?? 0, chosen: keep.studioType }).system;
        const ctx = briefContext({ record: r, profile, said, work, log: pastLog(past), fresh, plan });
        setStage("Writing the brief…");
        const reply = await askModel({ fn: "guide", body: { question: "brief", content: ctx }, direct: { system: BRIEF_PROMPT, turns: [{ role: "user", content: ctx }], maxTokens: 7000, model: "careful" } });
        if (!alive.current) return;
        const { brief, spec } = splitBrief(reply);
        if (spec && briefComplete(brief)) setMockup({ ...spec, source: "live", at: new Date().toISOString(), seed: seedNow, ...keep, brief });
        else if (spec) {
          setMockup({ ...spec, source: "live", at: new Date().toISOString(), seed: seedNow, ...keep });
          setLastError("The brief came back short; the studio's own stands in for it.");
        } else {
          setMockup({ ...local, ...keep });
          setLastError("The model's brief did not parse; the studio drew this one.");
        }
      } catch (e) {
        if (!alive.current) return;
        setMockup({ ...local, ...keep });
        setLastError(e instanceof Error ? e.message : "The model did not answer.");
      } finally {
        if (alive.current) {
          setWriting(false);
          setStage(null);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mine, r.name, r.oneLiner, r.publicPricing, profile, memory, memoryOn, planId, setMockup, studio?.system],
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
        const brief = cur.brief ?? localBrief(cur, { record: r, notes: said, system: studio?.system });
        const ctx = designContext(cur, brief, d, again ? "direction" : "brief");
        const reply = await askModel({
          fn: "guide",
          body: { question: "design", content: ctx },
          direct: { system: DESIGN_PROMPT, turns: [{ role: "user", content: ctx }], maxTokens: 16000, model: "design" },
        });
        if (!alive.current) return;
        const html = extractHtml(reply);
        const out = html ? prepareDesign(html) : { error: "no page in the reply" };
        if ("html" in out) setMockup({ ...(useFounder.getState().mockup ?? cur), design: { html: out.html, direction: again ? directionLine(d) : "Designed to the brief's own design system.", seed: d.seed, at: new Date().toISOString(), screens: out.screens } });
        else setDesignError(`The design did not pass the check (${out.error}); showing the studio's own.`);
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
    [mine, r, said, setMockup, studio?.system],
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

  const brief = m.brief ?? localBrief(m, { record: r, notes: said, system: studio?.system });
  const html = m.design?.html ?? (sample ? sampleDesign() : (studioHtml ?? sampleDesign()));
  const designed = !!m.design;
  /** The screens the phone has, by name: the design's own when there is one, the studio's otherwise. */
  const screens: { title: string; kind: MockScreen["kind"] }[] = (m.design?.screens ?? (sample || !studio ? designScreens(html) : studio.screens)).map((s, i, all) => ({ title: s.title, kind: (i === 0 ? "landing" : i === all.length - 1 ? "pricing" : /sign/i.test(s.title) ? "signup" : "app") as MockScreen["kind"] }));
  return {
    mockup: m,
    mine,
    writing,
    designing,
    /** What the desk is doing right now, in a line, while it works. */
    stage,
    designError,
    /** The page that runs: the model's design when there is one, the sample's when there is no sign yet, the studio's otherwise. */
    html,
    /** The designed page alone (the model's, the studio's, or the sample's), for the picture. */
    designHtml: m.design?.html ?? html,
    designed,
    screens: screens.length ? screens : m.screens.map((s) => ({ title: s.title, kind: s.kind })),
    /** The studio's plan: what it read the product as and what it chose, and the other readings the founder can pick instead. */
    studio: studio ? { line: studio.plan.line, product: studio.plan.product.t, readings: studio.plan.readings.map((x) => x.product.t), system: studio.system, treatment: studio.plan.treatment.name, fonts: studio.plan.fonts.name, seed: m.studioSeed ?? 0 } : null,
    /** Another take: the palette, treatment and type turn together, and still fit. */
    anotherTake: () => setMockup({ ...m, studioSeed: (m.studioSeed ?? 0) + 1 }),
    /** The founder says what it is, over the reading. */
    setType: (studioType: string | undefined) => setMockup({ ...m, studioType, studioSeed: 0 }),
    canDesign: mine && aiMode() !== "rehearsal",
    /** One line for the page: what the studio was allowed to read. */
    from: sourceLine(past),
    redesign: () => void design(Math.floor(Math.random() * 100000)),
    lastError,
    /** The big prompt: the model's brief, or the studio's own with its plan as the design system. */
    brief,
    prompt: (kind: Builder) => builderPrompt(kind, m, brief, { plan: studio?.plan ?? null, unit: studio?.unit }),
    rewrite: () => void write(true),
    editScreen: (i: number, patch: Partial<MockScreen>) => setMockup({ ...m, edited: true, screens: m.screens.map((sc, k) => (k === i ? { ...sc, ...patch } : sc)) }),
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
