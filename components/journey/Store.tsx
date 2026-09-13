"use client";

/**
 * THE JOURNEY, HELD IN ONE PLACE FOR EVERY SCREEN.
 *
 * A context that loads the founder's state after mount (so server and
 * client markup agree), applies events through the shared reducer, and
 * writes every change straight back to storage. Screens never touch
 * storage and never mutate state; they dispatch.
 *
 * The save status is part of the value on purpose. "Saved" is only ever
 * shown when the write returned ok; a failed write puts a plain sentence
 * on screen and keeps it there until a write succeeds, because a founder
 * who has just written down a real conversation deserves to know whether
 * it is still there.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { course, journey } from "@founderfloor/shared";
import { getAuth } from "@/lib/auth";
import { clearState, courseKey, readCourse, readState, storageKey, subscribe, subscribeCourse, writeCourse, writeState } from "@/lib/journey/storage";

type JourneyState = journey.JourneyState;
type JourneyEvent = journey.JourneyEvent;
type CourseState = course.CourseState;
type CourseEvent = course.CourseEvent;

export type SaveStatus = "idle" | "saved" | "failed";

export interface StoreValue {
  state: JourneyState;
  /** False until storage has been read; screens show a quiet placeholder until then. */
  ready: boolean;
  save: SaveStatus;
  /** The plain reason when save is "failed". */
  saveError: string | null;
  /** A save that would not parse was found and set aside. */
  corrupt: boolean;
  /** The browser refused storage entirely; work is held in memory. */
  memoryOnly: boolean;
  dispatch: (e: JourneyEvent) => void;
  /** The course: lessons sat, exercise memory, checkpoints. Kept under its own key, same identity. */
  courseState: CourseState;
  dispatchCourse: (e: CourseEvent) => void;
  exportFile: () => void;
  importText: (text: string) => boolean;
  wipe: () => void;
  now: () => string;
}

const Ctx = createContext<StoreValue | null>(null);

export function useJourney(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useJourney outside <JourneyStore>");
  return v;
}

export default function JourneyStore({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JourneyState>(journey.EMPTY);
  const [ready, setReady] = useState(false);
  const [save, setSave] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [corrupt, setCorrupt] = useState(false);
  const [memoryOnly, setMemoryOnly] = useState(false);
  const key = useRef<string>(storageKey(null));
  const latest = useRef<JourneyState>(journey.EMPTY);
  latest.current = state;
  const [courseState, setCourseState] = useState<CourseState>(course.EMPTY_COURSE);
  const cKey = useRef<string>(courseKey(null));
  const latestCourse = useRef<CourseState>(course.EMPTY_COURSE);
  latestCourse.current = courseState;

  const now = useCallback(() => new Date().toISOString(), []);

  useEffect(() => {
    key.current = storageKey(getAuth()?.id ?? null);
    const { state: loaded, corrupt: bad, fromMemory } = readState(key.current);
    setCorrupt(bad);
    setMemoryOnly(fromMemory);
    // today's visit is part of the state, so it is written like any other change
    const withVisit = journey.apply(loaded, { type: "visit", at: new Date().toISOString() });
    setState(withVisit);
    if (withVisit !== loaded) {
      const r = writeState(key.current, withVisit);
      setSave(r.ok ? "saved" : "failed");
      setSaveError(r.ok ? null : r.reason);
    }
    cKey.current = courseKey(getAuth()?.id ?? null);
    setCourseState(readCourse(cKey.current));
    setReady(true);
    const offJourney = subscribe(key.current, (fromOtherTab) => setState(fromOtherTab));
    const offCourse = subscribeCourse(cKey.current, (fromOtherTab) => setCourseState(fromOtherTab));
    return () => {
      offJourney();
      offCourse();
    };
  }, []);

  const commit = useCallback((next: JourneyState) => {
    setState(next);
    const r = writeState(key.current, next);
    setSave(r.ok ? "saved" : "failed");
    setSaveError(r.ok ? null : r.reason);
  }, []);

  const dispatch = useCallback(
    (e: JourneyEvent) => {
      const next = journey.apply(latest.current, e);
      if (next === latest.current) return;
      commit(next);
    },
    [commit],
  );

  const dispatchCourse = useCallback((e: CourseEvent) => {
    const next = course.applyCourse(latestCourse.current, e);
    if (next === latestCourse.current) return;
    setCourseState(next);
    const r = writeCourse(cKey.current, next);
    setSave(r.ok ? "saved" : "failed");
    setSaveError(r.ok ? null : r.reason);
  }, []);

  const exportFile = useCallback(() => {
    const text = journey.exportJson(latest.current);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `founderfloor-journey-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  const importText = useCallback(
    (text: string) => {
      const parsed = journey.importJson(text);
      if (!parsed) return false;
      commit(parsed);
      return true;
    },
    [commit],
  );

  const wipe = useCallback(() => {
    const r = clearState(key.current);
    clearState(cKey.current);
    setState(journey.EMPTY);
    setCourseState(course.EMPTY_COURSE);
    setSave(r.ok ? "idle" : "failed");
    setSaveError(r.ok ? null : r.reason);
    setCorrupt(false);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({ state, ready, save, saveError, corrupt, memoryOnly, dispatch, courseState, dispatchCourse, exportFile, importText, wipe, now }),
    [state, ready, save, saveError, corrupt, memoryOnly, dispatch, courseState, dispatchCourse, exportFile, importText, wipe, now],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
