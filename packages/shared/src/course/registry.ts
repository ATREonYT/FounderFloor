/**
 * THE COURSE, AS ONE LIST.
 *
 * Six sections in order, eighteen units, every lesson reachable by id.
 * Both index.ts and state.ts read from here, which keeps the import
 * graph a tree.
 */

import { SECTIONS, type Lesson, type SectionId, type Unit } from "./content.ts";
import { FOUNDATIONS } from "./sections/foundations.ts";
import { CUSTOMER } from "./sections/customer.ts";
import { PRODUCT } from "./sections/product.ts";
import { MONEY } from "./sections/money.ts";
import { GROWTH } from "./sections/growth.ts";
import { COMPANY } from "./sections/company.ts";

/** Every unit, in the order they are taught. */
export const UNITS: readonly Unit[] = [...FOUNDATIONS, ...CUSTOMER, ...PRODUCT, ...MONEY, ...GROWTH, ...COMPANY];

/** A lesson with the unit it belongs to, since a lesson id alone says nothing about where it sits. */
export interface Placed {
  unit: Unit;
  lesson: Lesson;
  /** Position in the whole course, from 0. */
  index: number;
}

/** Every lesson, flat, in teaching order. */
export const LESSONS: readonly Placed[] = UNITS.flatMap((unit) => unit.lessons.map((lesson) => ({ unit, lesson, index: 0 }))).map((p, index) => ({ ...p, index }));

const unitIndex = new Map(UNITS.map((u) => [u.id, u]));
const lessonIndex = new Map(LESSONS.map((p) => [p.lesson.id, p]));

export const unitById = (id: string): Unit | undefined => unitIndex.get(id);
export const lessonById = (id: string): Placed | undefined => lessonIndex.get(id);
export const unitsIn = (section: SectionId): Unit[] => UNITS.filter((u) => u.section === section);
export const sectionOf = (unit: Unit) => SECTIONS.find((s) => s.id === unit.section)!;

/** The unit after this one, or null at the end of the course. */
export function unitAfter(id: string): Unit | null {
  const i = UNITS.findIndex((u) => u.id === id);
  return i >= 0 && i + 1 < UNITS.length ? UNITS[i + 1] : null;
}
