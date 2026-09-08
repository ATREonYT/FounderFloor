/** The six cards of the guide: one per place in the building. Used by the guide screen and by the tour on the map. */
import type { GlyphId, SceneSet } from "@founderfloor/ui";

export const PAGES: { set: SceneSet; glyph: GlyphId; color: string; title: string; line: string; tab: string }[] = [
  { set: "lobby", glyph: "wave", color: "#4F6E6B", title: "Start at home.", line: "Your streak, what to do next, and a desk that answers questions about your company.", tab: "Home" },
  { set: "workshop", glyph: "cube", color: "#A28457", title: "Follow the map.", line: "Six rooms from idea to money, one step at a time. Tap the next button, do the thing, mark it done. The first three rooms are free.", tab: "Map" },
  { set: "stand", glyph: "star", color: "#8C3B2E", title: "Your stand is your company.", line: "Your numbers, your runway, your rank, in one place you can share. The coaches read from it.", tab: "Stand" },
  { set: "office", glyph: "coin", color: "#5E7C93", title: "Fridays are for the Office.", line: "Log five numbers, two minutes. Theo reads them back. Drafts the coaches wrote for you live here too.", tab: "Office" },
  { set: "cafe", glyph: "heart", color: "#2F6F6A", title: "Free does a lot. Pro remembers.", line: "Everything you need to start is free, and your first week with all four coaches is free too. Pro keeps their notes between visits.", tab: "Plans" },
  { set: "market", glyph: "flask", color: "#3B5B92", title: "The floor comes last.", line: "When you have something to show, take a spot in the hall with other founders. Visitors leave notes and the receptionist keeps them for you.", tab: "Floor" },
];
