import test from "node:test";
import assert from "node:assert/strict";
import { MISSIONS, STAGES, IDEA_SECTIONS, fieldFor, missionById } from "../src/journey/content.ts";
import { EMPTY, apply, nextMission, progress, reached, toCelebrate, sanitize, exportJson, importJson, greeting, weekActivity, suggestStart, POINTS } from "../src/journey/state.ts";
import { parseCoachReply, coachUser, actionsFor } from "../src/journey/coach.ts";

const T = "2026-09-14T18:00:00.000Z";

// ─── the curriculum holds together ──────────────────────────────────

test("ten missions, three stages, ids unique and permanent-looking", () => {
  assert.equal(MISSIONS.length, 10);
  assert.equal(STAGES.length, 3);
  assert.deepEqual(MISSIONS.map((m) => m.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(new Set(MISSIONS.map((m) => m.id)).size, 10);
  for (const m of MISSIONS) assert.match(m.id, /^[a-z-]+$/, m.id);
  for (const st of STAGES) assert.ok(MISSIONS.some((m) => m.stage === st.id), `stage ${st.id} has missions`);
});

test("every mission has all seven parts, with content in each", () => {
  for (const m of MISSIONS) {
    assert.ok(m.objective.length > 20, `${m.id} objective`);
    assert.ok(m.explain.length >= 2 && m.explain.every((p) => p.length > 40), `${m.id} explanation`);
    assert.ok(m.example.length >= 1 && m.example.every((e) => e.label && e.text), `${m.id} example`);
    assert.ok(m.action.text.length > 20, `${m.id} action`);
    assert.ok(m.output.length >= 1, `${m.id} output`);
    assert.ok(m.reflect.length > 20, `${m.id} reflection`);
    assert.ok(m.next.length > 20, `${m.id} next`);
    assert.ok(m.minutes >= 2 && m.minutes <= 8, `${m.id} lesson time is in-app minutes`);
    // the interaction, where there is one, has a learnable answer
    if (m.interaction) {
      const i = m.interaction;
      if (i.kind === "choose") {
        assert.equal(i.options.filter((o) => o.good).length, 1, `${m.id} one good option`);
        assert.ok(i.options.every((o) => o.why), `${m.id} every option explains itself`);
      }
      if (i.kind === "sort") {
        assert.ok(i.items.some((x) => x.bucket === 0) && i.items.some((x) => x.bucket === 1), `${m.id} both buckets used`);
        assert.ok(i.items.every((x) => x.why), `${m.id} every item explains itself`);
      }
      if (i.kind === "edit") assert.ok(i.before && i.better.length >= 2, `${m.id} edit has a before and what better means`);
      if (i.kind === "plan") assert.ok(i.pieces.length >= 4, `${m.id} plan has its parts`);
    }
  }
});

test("outside work is separate from lesson time, and says so while pending", () => {
  const outside = MISSIONS.filter((m) => m.outside);
  assert.deepEqual(outside.map((m) => m.id), ["record-one", "review-test"]);
  for (const m of outside) assert.ok(m.action.pending && m.action.pending.length > 20, `${m.id} has pending copy`);
});

test("the voice: no exclamation marks, no promises", () => {
  const text = JSON.stringify(MISSIONS);
  assert.ok(!/!/.test(text.replace(/\\"/g, "")), "no exclamation marks");
  assert.ok(!/\b(guaranteed|will succeed|product-market fit)\b/i.test(text));
  // "validated" may only appear when explaining that one conversation is not it
  const uses = MISSIONS.flatMap((m) => [...m.explain, m.why, m.objective]).filter((s) => /validat/i.test(s));
  for (const u of uses) assert.match(u, /not|is a word for/i, `validation only appears to be corrected: ${u}`);
});

test("output keys are unique across missions and every idea-page section is fed", () => {
  const keys = MISSIONS.flatMap((m) => m.output.map((o) => o.key));
  assert.equal(new Set(keys).size, keys.length, "no key written by two missions");
  for (const sec of IDEA_SECTIONS) for (const k of sec.keys) assert.ok(fieldFor(k), `${sec.id} key ${k} exists`);
  const fed = new Set(IDEA_SECTIONS.flatMap((s) => s.keys));
  for (const k of keys) assert.ok(fed.has(k), `${k} appears on the idea page`);
  // only what a customer actually did may ever be "confirmed"
  const confirmed = MISSIONS.flatMap((m) => m.output.filter((o) => o.evidence === "confirmed").map((o) => o.key));
  assert.deepEqual(confirmed, ["outcomeDid"]);
});

// ─── the state ─────────────────────────────────────────────────────────

test("onboarding writes the idea as an assumption and suggests a start", () => {
  const s = apply(EMPTY, { type: "onboard", building: "Prepaid coffee passes for cafés", helps: "café owners", stage: "exploring", at: T });
  assert.equal(s.profile?.suggested, "say-it");
  assert.equal(s.outputs.idea?.value, "Prepaid coffee passes for cafés");
  assert.equal(s.outputs.idea?.label, "assumption");
  assert.equal(suggestStart("building"), "the-problem");
  assert.equal(suggestStart("testing"), "good-questions");
  assert.equal(suggestStart("unsure"), "say-it");
  // "I'm not sure yet" is allowed and writes nothing
  const u = apply(EMPTY, { type: "onboard", building: "", helps: "", stage: "unsure", at: T });
  assert.equal(u.outputs.idea, undefined);
  assert.equal(nextMission(u)?.id, "say-it");
});

test("a lesson and an action are separate, and points are for learning only", () => {
  let s = apply(EMPTY, { type: "lesson-done", mission: "record-one", at: T });
  assert.equal(s.points, POINTS.lesson);
  let p = progress(s);
  assert.equal(p.learning.done, 1);
  assert.equal(p.practical.done, 0);
  s = apply(s, { type: "action-done", mission: "record-one", at: T });
  p = progress(s);
  assert.equal(p.practical.done, 1);
  assert.equal(p.practical.total, 2);
  assert.equal(s.points, POINTS.lesson, "recording an action adds no points");
  // doing it twice changes nothing
  assert.equal(apply(s, { type: "lesson-done", mission: "record-one", at: T }).points, s.points);
});

test("the next mission is the first unread lesson, then the pending outside actions, then nothing", () => {
  let s = EMPTY;
  for (const m of MISSIONS) s = apply(s, { type: "lesson-done", mission: m.id, at: T });
  assert.equal(nextMission(s)?.id, "record-one", "all lessons read: first pending action");
  s = apply(s, { type: "action-done", mission: "record-one", at: T });
  assert.equal(nextMission(s)?.id, "review-test");
  s = apply(s, { type: "action-done", mission: "review-test", at: T });
  assert.equal(nextMission(s), null);
  assert.equal(progress(s).stages.test, "done");
});

test("saving keeps the field's label, logs the change, and never blanks over a value", () => {
  let s = apply(EMPTY, { type: "save", mission: "the-problem", key: "known", value: ["She keeps a paper list", "  ", ""], at: T });
  assert.deepEqual(s.outputs.known?.value, ["She keeps a paper list"]);
  assert.equal(s.outputs.known?.label, "reported");
  assert.equal(s.history.at(-1)?.what, "Wrote what you know");
  const blanked = apply(s, { type: "save", mission: "the-problem", key: "known", value: [], at: T });
  assert.deepEqual(blanked.outputs.known?.value, ["She keeps a paper list"], "an empty save is not a deletion");
  const changed = apply(s, { type: "save", mission: "the-problem", key: "known", value: ["Two keep paper lists"], at: T });
  assert.equal(changed.history.at(-1)?.from, "She keeps a paper list");
  // unknown mission or key is ignored, not thrown
  assert.equal(apply(s, { type: "save", mission: "nope", key: "known", value: "x", at: T }), s);
});

test("interaction points come once, on a right first answer", () => {
  let s = apply(EMPTY, { type: "interaction", mission: "good-questions", right: false, at: T });
  assert.equal(s.points, 0);
  s = apply(s, { type: "interaction", mission: "good-questions", right: true, at: T });
  assert.equal(s.points, 0, "second try earns nothing, and that is fine");
  const r = apply(EMPTY, { type: "interaction", mission: "good-questions", right: true, at: T });
  assert.equal(r.points, POINTS.interaction);
  assert.equal(apply(r, { type: "interaction", mission: "good-questions", right: true, at: T }).points, POINTS.interaction);
});

test("stopping with evidence is celebrated like everything else", () => {
  let s = EMPTY;
  for (const m of MISSIONS) s = apply(s, { type: "lesson-done", mission: m.id, at: T });
  s = apply(s, { type: "action-done", mission: "record-one", at: T });
  s = apply(s, { type: "save", mission: "review-test", key: "outcomeNext", value: "stop", at: T });
  s = apply(s, { type: "action-done", mission: "review-test", at: T });
  const got = reached(s);
  assert.ok(got.includes("honest-stop"));
  assert.ok(got.includes("stage-test"));
  // each celebrated once
  const first = toCelebrate(s);
  assert.ok(first);
  s = apply(s, { type: "celebrated", id: first.id });
  assert.notEqual(toCelebrate(s)?.id, first.id);
});

test("coming back is welcomed, never scolded", () => {
  const s = apply(EMPTY, { type: "visit", at: "2026-08-01T10:00:00Z" });
  assert.match(greeting(s, "2026-09-14T10:00:00Z"), /Nothing was lost/);
  assert.match(greeting(EMPTY, T), /Welcome/);
  assert.doesNotMatch(greeting(s, "2026-09-14T10:00:00Z"), /streak|lost your|missed/i);
  const w = apply(apply(s, { type: "weekly-goal", goal: 3 }), { type: "lesson-done", mission: "say-it", at: T });
  assert.deepEqual(weekActivity(w, T), { done: 1, goal: 3 });
  assert.equal(apply(s, { type: "weekly-goal", goal: 40 }).weeklyGoal, 7, "goals are modest");
});

test("what comes back from storage is sanitised, and a corrupt save is a fresh start", () => {
  assert.deepEqual(sanitize("garbage"), EMPTY);
  assert.deepEqual(sanitize(null), EMPTY);
  const dirty = {
    profile: { building: 42, stage: "wizard", suggested: "nope" },
    missions: { "say-it": { lessonDoneAt: "not a date", interactionRight: "yes" }, bogus: { lessonDoneAt: T } },
    outputs: { idea: { value: "x", label: "true-fact" }, nope: { value: "y" } },
    points: -5,
    weeklyGoal: 99,
    visits: ["2026-09-14", "yesterday"],
    celebrated: ["first-lesson", "made-up"],
    history: [{ at: T, what: "ok" }, "junk"],
  };
  const s = sanitize(dirty);
  assert.equal(s.profile?.stage, "unsure");
  assert.equal(s.profile?.suggested, "say-it");
  assert.equal(s.missions["say-it"].lessonDoneAt, undefined);
  assert.equal(s.missions.bogus, undefined);
  assert.equal(s.outputs.idea?.label, "assumption", "a bad label falls back to the field's own");
  assert.equal(s.outputs.nope, undefined);
  assert.equal(s.points, 0);
  assert.equal(s.weeklyGoal, null);
  assert.deepEqual(s.visits, ["2026-09-14"]);
  assert.deepEqual(s.celebrated, ["first-lesson"]);
  assert.equal(s.history.length, 1);
});

test("export and import round-trip, and a foreign file is refused", () => {
  let s = apply(EMPTY, { type: "onboard", building: "Bread tonight", helps: "neighbours", stage: "building", at: T });
  s = apply(s, { type: "lesson-done", mission: "the-problem", at: T });
  const back = importJson(exportJson(s));
  assert.deepEqual(back, s);
  assert.equal(importJson('{"hello":"world"}'), null);
  assert.equal(importJson("not json"), null);
});

// ─── the coach ─────────────────────────────────────────────────────────

test("the coach only offers actions that fit the field, and asks with only what was shared", () => {
  assert.deepEqual(actionsFor("questions"), ["leading", "example"]);
  assert.deepEqual(actionsFor("known"), ["separate", "example"]);
  assert.deepEqual(actionsFor("testReview"), ["example"]);
  const msg = coachUser({ missionId: "say-it", action: "specific", key: "idea", text: "help busy people", shared: { customerGroup: "" } });
  assert.match(msg, /shared no other lines/);
  assert.match(msg, /help busy people/);
});

test("a coach reply is accepted only in the shape asked for", () => {
  const ok = parseCoachReply('{"note":"Name the person.","suggestion":"Café owners with a counter and no app.","uncertain":"I do not know your town."}');
  assert.ok(ok);
  assert.equal(ok.suggestion, "Café owners with a counter and no app.");
  assert.ok(parseCoachReply('```json\n{"note":"fine"}\n```'), "a fenced block is tolerated");
  assert.equal(parseCoachReply("Sure! Here is my advice: ..."), null);
  assert.equal(parseCoachReply('{"suggestion":"no note"}'), null);
  assert.equal(parseCoachReply('{"note":"x","items":[{"text":"a","tag":"verdict"}]}'), null, "unknown tags are refused");
  assert.equal(parseCoachReply(`{"note":"${"x".repeat(800)}"}`), null, "too long is refused");
  assert.equal(parseCoachReply('{"note":"Your idea is validated."}'), null, "a verdict is refused");
  assert.equal(parseCoachReply('{"note":"This has product-market fit."}'), null);
  const sorted = parseCoachReply('{"note":"ok","items":[{"text":"She keeps a list","tag":"observation"},{"text":"Most would pay","tag":"assumption"}]}');
  assert.equal(sorted?.items?.length, 2);
});
