/** The guide: one card per thing worth knowing, in the order a founder meets them. Used by the guide screen; the tour on the map is the short version. */
import type { GlyphId, SceneSet } from "@founderfloor/ui";

export interface GuidePage {
  set: SceneSet;
  glyph: GlyphId;
  color: string;
  title: string;
  line: string;
  tab: string;
  /** Two or three short tips: how to get the most out of it. */
  tips?: string[];
}

export const PAGES: GuidePage[] = [
  { set: "lobby", glyph: "star", color: "#4F6E6B", title: "Today is one thing.", line: "Open the app, see the next task with a Start button, do it, close the app. This week's three tasks sit under it as a checklist.", tab: "Today", tips: ["Aim for one task a day, not three.", "Tick the box only when it is true.", "Fridays: the log tile turns red. Two minutes."] },
  { set: "workshop", glyph: "cube", color: "#A28457", title: "The map is the building.", line: "Six rooms from idea to money, floor by floor. Your plan's four weeks are spent in them, and your keeper walks down as the weeks pass. Tap a room to see what is in it.", tab: "Map", tips: ["The windows on a sign are that week's tasks; gold means done.", "The first three rooms are free. The rest open with your free week with the coaches."] },
  { set: "office", glyph: "bolt", color: "#3B5B92", title: "A task is a page. A step is a room.", line: "Every task opens a page the desk wrote for you: steps with a tip each, how long it takes, when it is done. Tap any step and write what you did, right there. The desk answers and says when the step is done.", tab: "Tasks", tips: ["Write names and numbers. 'Maria, €40, Thursday' beats 'went well'.", "Stuck? Say so in the step. The desk gives the smallest next move.", "When the last step is ticked, say how it went. That line is what the desk builds on."] },
  { set: "archive", glyph: "flask", color: "#6B4E71", title: "The desk keeps a notebook.", line: "If you say yes, what you tick, write and decide is written down, dated, on your phone. Every coach reads it, so nobody starts from zero. Read it, copy it or burn it in Settings.", tab: "Notebook", tips: ["Say yes to the notebook. The app is twice as useful with it.", "Nothing leaves your phone except with your own questions to the AI."] },
  { set: "office", glyph: "coin", color: "#5E7C93", title: "Every week gets read back.", line: "A score out of a hundred from what you ticked, wrote and showed up for; what went well; what to fix; three things to do about it. On the plan, on Today, in every room.", tab: "The week", tips: ["The score cannot be flattered: it is counted, not felt.", "Read it on Sunday evening and pick the first of the three things for Monday."] },
  { set: "cafe", glyph: "heart", color: "#2F6F6A", title: "The coach answers.", line: "Ask the desk anything about your company. The name at the top picks a coach: Ines for the plan, Jonah for sales, Margot for the pitch, Theo for the money.", tab: "Coach", tips: ["Ask for a draft, not advice: 'write the message I send Maria'.", "Free has the desk and Ines every day, ten turns. Your first week with all four is free."] },
  { set: "market", glyph: "cube", color: "#A28457", title: "The Workshop mocks it up.", line: "From everything you wrote, the desk writes the brief (the product, the person, every screen with its words, a design system) and then designs the first screens of your product in a phone. The brief is the prompt you hand to whatever builds it: Lovable, Base44, Bolt or v0 if you do not code, Claude Code if you do.", tab: "Workshop", tips: ["Write the sign on your stand and talk to five people first; the brief is only as good as what you wrote down.", "Edit any word. The brief and the prompts follow.", "Show the picture to the five people you talked to before building anything."] },
  { set: "stand", glyph: "wave", color: "#8C3B2E", title: "You is everything else.", line: "Your company on one card, the Office, your plan, the notebook, drafts, inbox, the coaches, the floor, the plans, settings. Doors, not work.", tab: "You", tips: ["Sign in once and everything follows you to the site and back.", "The floor, other founders' stands, is behind You for when you have something to show."] },
  { set: "doors", glyph: "leaf", color: "#4E6E4E", title: "How to get the most out of it.", line: "Answer the eight questions honestly. Do one task a day. Write in the steps, in customers' words. Say yes to the notebook. Log Fridays. Read the week back on Sunday. Show the mock-up before you build.", tab: "Tips", tips: ["Blunt tone gets blunt coaching. Pick what you can hear.", "Remake the plan any time from You; the notebook carries over.", "Free does a lot. Pro remembers between visits."] },
];
