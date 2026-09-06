/** Which pixel glyph stands for what, so the same thing wears the same icon everywhere. */
import type { GlyphId } from "@founderfloor/ui";

export const ROOM_GLYPH: Record<string, GlyphId> = { idea: "bolt", validate: "wave", setup: "cube", customers: "heart", money: "coin", raise: "rocket" };
export const DOC_GLYPH: Record<string, GlyphId> = { "one-pager": "star", "interview-script": "wave", landing: "rocket", entity: "cube", pricing: "coin", outreach: "heart", "plan-12": "flask", launch: "bolt", update: "chip", faq: "wave", brief: "chip" };
export const SEGMENT_GLYPH: Record<string, GlyphId> = { "b2b-saas": "chip", consumer: "heart", marketplace: "coin", services: "wave", hardware: "cube", other: "star" };
export const COACH_SET = { strategy: "lobby", sales: "market", investor: "cafe", finance: "office" } as const;
