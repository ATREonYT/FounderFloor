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
  { id: "map", target: "map", say: "This is the map: six rooms from idea to money. Tap the room you are in." },
  { id: "room", target: null, say: "Inside a room: tick what is true, not what you intend. Close it when you are done." },
  { id: "to-home", target: "tabs", say: "The bar at the bottom is the whole building. Tap Home.", route: "/reception", tab: "Home" },
  { id: "home", target: "home-next", say: "Home says what to do next. Tap the card and it takes you there." },
  { id: "to-stand", target: "tabs", say: "Now tap Stand.", route: "/stand", tab: "Stand" },
  { id: "stand", target: "stand-numbers", say: "Your company on one card. Tap The numbers to fill it in; the coaches read from here." },
  { id: "to-office", target: "tabs", say: "Tap Office.", route: "/office", tab: "Office" },
  { id: "office", target: "office-log", say: "Every Friday, five numbers here, two minutes. Tap Log this week to see them." },
  { id: "to-floor", target: "tabs", say: "Last one: tap Floor.", route: "/floor", tab: "Floor" },
  { id: "floor", target: null, say: "The floor is other founders' stands, for when you have something to show. That is the building." },
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
