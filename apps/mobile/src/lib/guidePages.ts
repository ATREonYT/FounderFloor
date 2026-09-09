/** The six cards of the guide: one per place in the building. Used by the guide screen and by the tour on the map. */
import type { GlyphId, SceneSet } from "@founderfloor/ui";

export const PAGES: { set: SceneSet; glyph: GlyphId; color: string; title: string; line: string; tab: string }[] = [
  { set: "lobby", glyph: "star", color: "#4F6E6B", title: "Today is one thing.", line: "The next task, with a Start button, and this week's three tasks under it. Open the app, do the one thing, close it.", tab: "Today" },
  { set: "workshop", glyph: "cube", color: "#A28457", title: "The map is the building.", line: "Six rooms from idea to money, floor by floor. Your plan's weeks are spent in them. Tap a room to see what is there.", tab: "Map" },
  { set: "cafe", glyph: "heart", color: "#2F6F6A", title: "The coach answers.", line: "Ask the desk anything about your company. Pick a coach at the top for the plan, sales, the pitch or the money. It remembers what you did, if you let it.", tab: "Coach" },
  { set: "stand", glyph: "wave", color: "#8C3B2E", title: "You is everything else.", line: "Your company on one card, the Friday log, your plan, the notebook, drafts, the coaches, settings. Doors, not work.", tab: "You" },
  { set: "office", glyph: "coin", color: "#5E7C93", title: "Free does a lot. Pro remembers.", line: "Everything you need to start is free, and your first week with all four coaches is free too. Pro keeps their notes between visits.", tab: "Plans" },
  { set: "market", glyph: "flask", color: "#3B5B92", title: "The floor comes last.", line: "When you have something to show, take a spot in the hall with other founders. It is behind You, for when you are ready.", tab: "Floor" },
];
