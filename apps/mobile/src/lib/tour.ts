/**
 * THE TOUR — an interactive walk through the building. Each step names a
 * target on a real screen; the overlay dims everything but the target and
 * the keeper says what to tap; the step advances only when the person
 * taps it (or, for a tab step, when the route changes). Targets register
 * their position by id; the overlay draws the spotlight from that.
 */
import { create } from "zustand";

export interface TourStep {
  id: string;
  /** The registered target to spotlight, or null for a message only. */
  target: string | null;
  say: string;
  /** For tab steps: the route that counts as done. */
  route?: string;
  /** The tab to name in the callout, for the tab steps. */
  tab?: string;
}

export const TOUR: TourStep[] = [
  { id: "map", target: "map", say: "This is the map: the building, floor by floor, from idea to money. Tap the room you are in." },
  { id: "room", target: null, say: "Inside a room: this month's tasks, then the room's own list. Tick what is true, not what you intend. Close it when you are done." },
  { id: "to-today", target: "tabs", say: "The bar at the bottom is the whole building: Today, Map, Coach, You. Tap Today.", route: "/today", tab: "Today" },
  { id: "today", target: "home-next", say: "Today is one thing: the next task, with a Start button. This week's three tasks sit under it. Tap the card." },
  { id: "to-coach", target: "tabs", say: "Now tap Coach.", route: "/reception", tab: "Coach" },
  { id: "coach", target: null, say: "The coach: ask the desk anything about your company. The name at the top picks one of the four coaches." },
  { id: "to-you", target: "tabs", say: "Last one: tap You.", route: "/you", tab: "You" },
  { id: "you", target: null, say: "You: your company, the Friday log, your plan, the notebook, and the floor for when you have something to show. That is the building." },
];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TourState {
  active: boolean;
  step: number;
  then: string | null;
  targets: Record<string, Rect>;
  start(then?: string): void;
  stop(): void;
  register(id: string, r: Rect): void;
  /** A target was tapped: advance if it is the current step's target. */
  tapped(id: string): void;
  /** The route changed: advance a tab step whose route this is. */
  routed(path: string): void;
  /** A dialogue closed: advance a message-only step that waits for it. */
  closed(id: string): void;
  next(): void;
}

export const useTour = create<TourState>()((set, get) => ({
  active: false,
  step: 0,
  then: null,
  targets: {},
  start: (then) => set({ active: true, step: 0, then: then ?? null }),
  stop: () => set({ active: false, step: 0 }),
  register: (id, r) => {
    const cur = get().targets[id];
    if (cur && Math.abs(cur.x - r.x) < 1 && Math.abs(cur.y - r.y) < 1 && Math.abs(cur.w - r.w) < 1 && Math.abs(cur.h - r.h) < 1) return;
    set({ targets: { ...get().targets, [id]: r } });
  },
  tapped: (id) => {
    const s = get();
    if (!s.active) return;
    const cur = TOUR[s.step];
    if (cur?.target === id && !cur.route) s.next();
  },
  routed: (path) => {
    const s = get();
    if (!s.active) return;
    const cur = TOUR[s.step];
    if (cur?.route && path.startsWith(cur.route)) s.next();
  },
  closed: (id) => {
    const s = get();
    if (!s.active) return;
    if (TOUR[s.step]?.id === id) s.next();
  },
  next: () => {
    const s = get();
    if (s.step + 1 >= TOUR.length) set({ active: false, step: 0 });
    else set({ step: s.step + 1 });
  },
}));

export const tourStep = (): TourStep | null => (useTour.getState().active ? TOUR[useTour.getState().step] ?? null : null);
