/**
 * FounderFloor — quests and rewards.
 *
 * Quests read deed counters from AppState (quest progress, connections,
 * claims, badges, tutorialDone, the wallet) and never write anything — the
 * floor page watches for newly completed quests, grants the rewards
 * (tickets, badge, emote unlock, title) and records them in
 * state.claimedQuests so each fires once.
 *
 * Rewards deliberately never gate the social basics: the five core emotes,
 * chat, connecting and claiming stands stay free — quests unlock extras
 * (three bonus emotes, titles, badges) per the "gate depth, not presence"
 * rule from the genre research. Every quest also pays a ticket bounty
 * (reward.tickets — the UI renders it as a chip next to the quest).
 *
 * The board is tiered on purpose: early quests finish in one visit, the
 * later tiers of the same deed (10 talks, 25 connections, a 14-day streak)
 * give regulars a reason to keep showing up — the board should never be
 * empty for anyone.
 */

import type { AppState, EmoteKind } from "@/lib/types";
import { EMOTES } from "@/lib/types";

export interface QuestDef {
  id: string;
  title: string;
  blurb: string;
  goal: number;
  /** What the counter counts, shown as "2/3 founders". */
  unit: string;
  reward: {
    badge: string;
    /** Ticket bounty granted at claim time (see lib/data/shop.ts). */
    tickets: number;
    /** Bonus emote unlocked (keys 6-8). */
    emote?: EmoteKind;
    /** Earned title, selectable in Profile, shown on your hover card. */
    title?: string;
  };
  /** Human line for the non-ticket reward, shown in the quest list. */
  rewardLabel: string;
}

export const QUESTS: QuestDef[] = [
  // ---- the starter arc: each finishes in a single good visit ----
  {
    id: "first-steps",
    title: "First steps",
    blurb: "Finish (or skip) the floor tour.",
    goal: 1,
    unit: "tour",
    reward: { badge: "first-steps", tickets: 30 },
    rewardLabel: "badge: First steps",
  },
  {
    id: "make-the-rounds",
    title: "Make the rounds",
    blurb: "Chat with three different founders (say something — walking up is browsing).",
    goal: 3,
    unit: "founders",
    reward: { badge: "rounds", tickets: 60, emote: "rocket" },
    rewardLabel: "unlocks the Rocket reaction (key 6)",
  },
  {
    id: "connector",
    title: "Connector",
    blurb: "Make three connections.",
    goal: 3,
    unit: "connections",
    reward: { badge: "connector", tickets: 80, title: "Connector" },
    rewardLabel: "title: Connector",
  },
  {
    id: "leave-your-mark",
    title: "Leave your mark",
    blurb: "Sign two guestbooks.",
    goal: 2,
    unit: "guestbooks",
    reward: { badge: "mark", tickets: 60, emote: "fire" },
    rewardLabel: "unlocks the Fire reaction (key 7)",
  },
  {
    id: "open-for-business",
    title: "Open for business",
    blurb: "Claim a stand on any floor.",
    goal: 1,
    unit: "stand",
    reward: { badge: "exhibitor", tickets: 80, title: "Exhibitor" },
    rewardLabel: "title: Exhibitor",
  },
  {
    id: "tourist",
    title: "Tourist",
    blurb: "Set foot on two different floors.",
    goal: 2,
    unit: "floors",
    reward: { badge: "tourist", tickets: 50, emote: "handshake" },
    rewardLabel: "unlocks the Handshake reaction (key 8)",
  },
  {
    id: "crowd-pleaser",
    title: "Crowd pleaser",
    blurb: "Send ten reactions.",
    goal: 10,
    unit: "reactions",
    reward: { badge: "crowd-pleaser", tickets: 60, title: "Socialite" },
    rewardLabel: "title: Socialite",
  },
  {
    id: "habit",
    title: "Make it a habit",
    blurb: "Show up three days in a row.",
    goal: 3,
    unit: "days",
    reward: { badge: "habit", tickets: 100, title: "Regular" },
    rewardLabel: "title: Regular",
  },

  // ---- the grind tiers: same deeds, bigger numbers, bigger bounties ----
  {
    id: "talk-of-the-floor",
    title: "Talk of the floor",
    blurb: "Chat with ten different founders.",
    goal: 10,
    unit: "founders",
    reward: { badge: "orator", tickets: 100, title: "Conversationalist" },
    rewardLabel: "title: Conversationalist",
  },
  {
    id: "keynote-energy",
    title: "Keynote energy",
    blurb: "Chat with twenty-five different founders.",
    goal: 25,
    unit: "founders",
    reward: { badge: "keynote", tickets: 180 },
    rewardLabel: "badge: Keynote Energy",
  },
  {
    id: "networker",
    title: "Networker",
    blurb: "Make ten connections.",
    goal: 10,
    unit: "connections",
    reward: { badge: "networker", tickets: 120, title: "Networker" },
    rewardLabel: "title: Networker",
  },
  {
    id: "rainmaker",
    title: "Rainmaker",
    blurb: "Make twenty-five connections.",
    goal: 25,
    unit: "connections",
    reward: { badge: "rainmaker", tickets: 220, title: "Rainmaker" },
    rewardLabel: "title: Rainmaker",
  },
  {
    id: "pen-pal",
    title: "Pen pal",
    blurb: "Sign five guestbooks.",
    goal: 5,
    unit: "guestbooks",
    reward: { badge: "penpal", tickets: 80 },
    rewardLabel: "badge: Pen Pal",
  },
  {
    id: "calligrapher",
    title: "Calligrapher",
    blurb: "Sign fifteen guestbooks.",
    goal: 15,
    unit: "guestbooks",
    reward: { badge: "calligrapher", tickets: 160 },
    rewardLabel: "badge: Calligrapher",
  },
  {
    id: "hype-section",
    title: "Hype section",
    blurb: "Send fifty reactions.",
    goal: 50,
    unit: "reactions",
    reward: { badge: "hype", tickets: 90 },
    rewardLabel: "badge: Hype Section",
  },
  {
    id: "standing-ovation",
    title: "Standing ovation",
    blurb: "Send two hundred reactions.",
    goal: 200,
    unit: "reactions",
    reward: { badge: "ovation", tickets: 180 },
    rewardLabel: "badge: Standing Ovation",
  },
  {
    id: "grand-tour",
    title: "The grand tour",
    blurb: "Set foot on every public floor.",
    goal: 4,
    unit: "floors",
    reward: { badge: "cartographer", tickets: 120, title: "Explorer" },
    rewardLabel: "title: Explorer",
  },
  {
    id: "week-on-the-floor",
    title: "A week on the floor",
    blurb: "Show up seven days in a row.",
    goal: 7,
    unit: "days",
    reward: { badge: "week-streak", tickets: 200, title: "Fixture" },
    rewardLabel: "title: Fixture",
  },
  {
    id: "part-of-the-furniture",
    title: "Part of the furniture",
    blurb: "Show up fourteen days in a row.",
    goal: 14,
    unit: "days",
    reward: { badge: "fortnight", tickets: 350 },
    rewardLabel: "badge: Part of the Furniture",
  },

  // ---- the shop loop: earning feeds spending feeds earning ----
  {
    id: "new-look",
    title: "New look",
    blurb: "Buy any booth style from the shop.",
    goal: 1,
    unit: "style",
    reward: { badge: "stylist", tickets: 60, title: "Stylist" },
    rewardLabel: "title: Stylist",
  },
  {
    id: "fully-decorated",
    title: "Fully decorated",
    blurb: "Have three accessories on your stand at once.",
    goal: 3,
    unit: "accessories",
    reward: { badge: "decorated", tickets: 80 },
    rewardLabel: "badge: Fully Decorated",
  },
];

export interface QuestState {
  def: QuestDef;
  count: number;
  done: boolean;
  claimed: boolean;
}

/** Current progress of every quest, derived purely from app state. */
export function questStates(state: AppState): QuestState[] {
  const countFor = (q: QuestDef): number => {
    switch (q.id) {
      case "first-steps":
        return state.tutorialDone ? 1 : 0;
      case "make-the-rounds":
      case "talk-of-the-floor":
      case "keynote-energy":
        return state.quest.talkedTo.length;
      case "connector":
      case "networker":
      case "rainmaker":
        return state.connections.length;
      case "leave-your-mark":
      case "pen-pal":
      case "calligrapher":
        return state.quest.signed.length;
      case "open-for-business":
        return Object.keys(state.claims).length > 0 ? 1 : 0;
      case "tourist":
        return state.quest.floors.length;
      case "grand-tour":
        // the tutorial hall is practice, not touring
        return state.quest.floors.filter((f) => f !== "tutorial-hall").length;
      case "crowd-pleaser":
      case "hype-section":
      case "standing-ovation":
        return state.quest.emotes;
      case "habit":
      case "week-on-the-floor":
      case "part-of-the-furniture":
        return state.bestStreak;
      case "new-look":
        return state.wallet.owned.some((id) => id.startsWith("style:")) ? 1 : 0;
      case "fully-decorated":
        return state.myStartup?.booth.props?.length ?? 0;
      default:
        return 0;
    }
  };
  return QUESTS.map((def) => {
    const count = Math.min(countFor(def), def.goal);
    return {
      def,
      count,
      done: count >= def.goal,
      claimed: state.claimedQuests.includes(def.id),
    };
  });
}

/** The next quest worth pointing the player at (first unfinished). */
export function nextQuest(states: QuestState[]): QuestState | null {
  return states.find((q) => !q.done) ?? null;
}

/** Which emotes this player can fire. The first five are always free. */
export function unlockedEmotes(state: AppState): EmoteKind[] {
  const base: EmoteKind[] = ["wave", "laugh", "clap", "heart", "question"];
  for (const q of questStates(state)) {
    if (q.done && q.def.reward.emote) base.push(q.def.reward.emote);
  }
  return base;
}

/** Which quest unlocks a locked emote (for the emote bar tooltip). */
export function questForEmote(kind: EmoteKind): QuestDef | undefined {
  return QUESTS.find((q) => q.reward.emote === kind);
}

/** Titles this player has earned (for the Profile title picker). */
export function earnedTitles(state: AppState): string[] {
  const titles: string[] = [];
  // Membership titles: carried by the plan, shown wherever titles show
  // (hover cards, calling cards) — visible status is part of what the
  // subscription buys.
  if (state.badges.includes("founding")) titles.push("Founding member");
  if (state.sub === "founder") titles.push("Founder+ member");
  else if (state.sub === "pro") titles.push("Pro member");
  for (const q of questStates(state)) {
    if (q.done && q.def.reward.title) titles.push(q.def.reward.title);
  }
  return titles;
}

/** Sanity: every reward emote must exist in EMOTES. */
for (const q of QUESTS) {
  if (q.reward.emote && !EMOTES.some((e) => e.kind === q.reward.emote)) {
    throw new Error(`quest ${q.id} rewards unknown emote ${q.reward.emote}`);
  }
}
