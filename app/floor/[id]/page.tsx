"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/store";
import { floorById, PRACTICE_FLOOR_ID } from "@/lib/data/floors";
import { STARTUPS, IDLE_LINES, replyFor } from "@/lib/data/startups";
import { createNetClient } from "@/lib/net";
import { createGame } from "@/game/engine";
import { isClaimableSpot } from "@/game/tilemap";
import { ONBOARDING_STEPS, TIER_ORDER } from "@/lib/types";
import type {
  MerchantDef,
  ActivityItem,
  BoothClaim,
  BoothInstance,
  ChatMsg,
  ConnectRequest,
  EmoteKind,
  GameHandle,
  HoverTarget,
  NetClient,
  Startup,
} from "@/lib/types";
import { questStates, unlockedEmotes } from "@/lib/data/quests";
import { buildCard, registerStartup, respondToRequest, sendConnectRequest, sendSocialDm, useInbox, type RequestState } from "@/lib/social";
import EditStandPanel from "@/components/EditStandPanel";
import StallPanel from "@/components/StallPanel";
import { GuideStall, PorterStall, RegisterStall, TicketStall } from "@/components/StallContents";
import Arcade from "@/components/Arcade";
import Parkour from "@/components/Parkour";
import QuizRoom from "@/components/QuizRoom";
import { BUILTIN_QUIZZES, sanitizeQuiz } from "@/lib/data/quiz";
import type { Quiz } from "@/lib/data/quiz";
import { usePresence } from "@/components/usePresence";
import { seedIdAt } from "@/game/tilemap";
import { acquireFloorLock } from "@/lib/tabLock";
import RequestCard from "@/components/RequestCard";
import MailToast, { type MailToastData } from "@/components/MailToast";
import BoothCard from "@/components/BoothCard";
import OpenStandCard from "@/components/OpenStandCard";
import ChatPanel, { type ChatThread } from "@/components/ChatPanel";
import EmoteBar from "@/components/EmoteBar";
import HoverCard from "@/components/HoverCard";
import TutorialCoach from "@/components/TutorialCoach";
import { controlCopy, useDevice } from "@/lib/device";
import GraduationCeremony from "@/components/GraduationCeremony";
import QuietFloorCard from "@/components/QuietFloorCard";
import QuestPanel from "@/components/QuestPanel";
import MemberBadge from "@/components/MemberBadge";
import TicketIcon from "@/components/TicketIcon";
import { walletBalance } from "@/lib/data/shop";
import EventPill from "@/components/EventPill";
import ConfettiBurst from "@/components/ConfettiBurst";
import Toast, { type ToastData } from "@/components/Toast";
import TierTag, { TIER_LABEL } from "@/components/TierTag";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function firstName(full: string): string {
  return full.split(" ")[0] || full;
}

/** Say what the server actually did with the request, not what we hoped. */
function requestToast(state: RequestState, who: string): string {
  if (state === "connected") return `You and ${who} are connected.`;
  if (state === "already") return `You've already asked ${who} — they haven't answered yet.`;
  if (state === "full") return `${who}'s inbox is full right now. Try again later.`;
  if (state === "failed") return "That didn't send — check your connection.";
  return `Request sent to ${who}. They'll see your card.`;
}

/** One chat thread in the panel: an NPC founder DM, a live-player DM, or a
 * connection DM ("social") that follows you between floors and pages. */
interface ThreadState {
  key: string; // "npc:<startupId>" | "player:<wireId>" | "social:<profileId>"
  kind: "npc" | "player" | "social";
  label: string;
  title: string;
  startupId?: string;
  peerId?: string;
  msgs: ChatMsg[];
  typing: boolean;
  unread: boolean;
  /** Closed threads keep their history but lose their tab. */
  open: boolean;
  /** Player threads only: the peer has left the floor. */
  left?: boolean;
}

/** Muted transcript line for liveness changes ("<name> left the floor"). */
function systemMsg(text: string): ChatMsg {
  return { id: uid(), fromId: "system", from: "", text, ts: Date.now(), scope: "dm" };
}

/** Flip a player thread's liveness: title, flag, and one transcript line. */
function withPeerPresence(th: ThreadState, present: boolean): ThreadState {
  return {
    ...th,
    left: !present,
    title: present ? `${th.label} · on this floor` : `${th.label} · left the floor`,
    msgs: [
      ...th.msgs,
      systemMsg(present ? `${th.label} is back on this floor` : `${th.label} left the floor`),
    ],
  };
}

const MAX_ACTIVITY = 8;

export default function FloorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [state, actions] = useAppState();
  const floor = floorById(params.id);

  // hydration gate — the store fills from localStorage after mount
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  // ---- HUD state ----
  const [presence, setPresence] = useState({ count: 1, online: false });
  const [nearBooth, setNearBooth] = useState<BoothInstance | null>(null);
  const [activeBooth, setActiveBooth] = useState<BoothInstance | null>(null);
  const [editingStand, setEditingStand] = useState(false);
  /** The merchant stall you are standing at, for the HUD prompt. */
  const [nearMerchant, setNearMerchant] = useState<MerchantDef | null>(null);
  /** The stall whose panel is open over the hall, or null. */
  const [openStall, setOpenStall] = useState<MerchantDef | null>(null);
  /** The hall guide, opened from the HUD rather than from a stall. */
  const [guideOpen, setGuideOpen] = useState(false);
  /**
   * What a stall does. The stalls are shortcuts to pages that already
   * exist, put in the hall so the two side avenues have a reason to be
   * walked down. Shared by the interact key and by tapping the prompt, so
   * a phone and a keyboard cannot drift apart.
   */
  const useMerchantRef = useRef<(m: MerchantDef) => void>(() => {});
  const useMerchant = useCallback((m: MerchantDef) => {
    // Open the stall ON the floor. Pressing E at the porter used to
    // router.push() you to /lobby, which threw you off the floor and cost
    // you your spot — the opposite of what walking up to somebody should do.
    setOpenStall(m);
  }, []);
  useMerchantRef.current = useMerchant;
  /**
   * One game at a time. "mine" = this tab runs it; "blocked" = another TAB
   * of this browser holds the lock; "elsewhere" = the SERVER replaced this
   * connection because the same identity joined from another window/device.
   */
  const [session, setSession] = useState<"pending" | "mine" | "blocked" | "elsewhere">("pending");
  const lockReleaseRef = useRef<(() => void) | null>(null);

  const takeLock = useCallback((steal: boolean) => {
    lockReleaseRef.current?.();
    setSession("pending");
    lockReleaseRef.current = acquireFloorLock(
      {
        onAcquired: () => setSession("mine"),
        onBlocked: () => setSession("blocked"),
        onLost: () => setSession("blocked"),
      },
      { steal },
    );
  }, []);

  useEffect(() => {
    takeLock(false);
    return () => {
      lockReleaseRef.current?.();
      lockReleaseRef.current = null;
    };
  }, [takeLock]);

  // The floor is fullscreen with its own chrome — hide the site nav while
  // here (see the matching rule in globals.css).
  useEffect(() => {
    document.body.dataset.onFloor = "1";
    /* Lock the document while the hall is up. The game is a fixed overlay,
       so it contributes no height — which left the site footer as the only
       thing in the flow, and made the floor a ~750px scrollable page hiding
       behind an opaque canvas. A thumb on the bottom HUD scrolled a page
       nobody could see, and on a phone that is what collapses the address
       bar. In JS rather than CSS because the CSS form needs :has(), and
       this has to work on exactly the older browsers that lack it.
       Restores the PREVIOUS inline value, not "", so a modal that locks
       scroll on top of this one doesn't clobber it. */
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevOverscroll = html.style.overscrollBehavior;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    return () => {
      delete document.body.dataset.onFloor;
      html.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      html.style.overscrollBehavior = prevOverscroll;
    };
  }, []);

  /* Leave a breadcrumb, so a trip to the membership page or the ticket
     booth is a round trip. Your spot is never at risk — it stays reserved
     while you are away, even though the stand itself comes down off the
     floor — but "will I lose my place?" is the reason people don't click,
     so the way back has to be visible from the other page.
     sessionStorage, not local: it belongs to this tab's visit. */
  useEffect(() => {
    if (!floor) return;
    try {
      window.sessionStorage.setItem(
        "founderfloor:last-floor",
        JSON.stringify({ id: floor.id, name: floor.name }),
      );
    } catch {
      /* private mode, or storage full — the pill just doesn't appear */
    }
  }, [floor]);
  const [floorMsgs, setFloorMsgs] = useState<ChatMsg[]>([]);
  const [threads, setThreads] = useState<Record<string, ThreadState>>({});
  const [tab, setTab] = useState<string>("floor");
  const [hover, setHover] = useState<HoverTarget | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  /* One source for "what am I on". `coarse` used to be worked out here with
     its own media query while the engine did the same thing separately;
     they could disagree, and the hints a visitor reads have to match the
     controls they actually have. */
  const device = useDevice();
  const coarse = device.pointer === "touch";
  const controls = controlCopy(device);
  const [toast, setToast] = useState<ToastData | null>(null);
  // Touch users have no M key; this mirrors the engine's on-when-map-overflows
  // default (true on any phone-sized viewport) and drives the "map" button.
  const [minimapOn, setMinimapOn] = useState(true);
  /** Session mute list (wire ids) — their chat, DMs, bubbles and emotes hide. */
  const [mutedIds, setMutedIds] = useState<ReadonlySet<string>>(new Set());
  /** Chat starts folded on every screen; opening a DM unfolds it. */
  const [chatCollapsed, setChatCollapsed] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  /** Incoming connection request shown as a popup card (newest wins). */
  const [incomingReq, setIncomingReq] = useState<ConnectRequest | null>(null);
  /** Incoming connection DM — pixel-mail notification, click opens the thread. */
  const [mailToast, setMailToast] = useState<MailToastData | null>(null);
  /** Incremented on each quest completion — triggers the confetti burst. */
  const [burst, setBurst] = useState(0);
  const [gradPanel, setGradPanel] = useState(false);
  /**
   * "Nobody else is here" nudge. Held back for a few seconds so it never
   * flashes during the walk-in (presence starts at 1 before the server
   * answers), and dismissible for the session.
   */
  const [quietShown, setQuietShown] = useState(false);
  const [quietDismissed, setQuietDismissed] = useState(false);

  // ---- refs (stable across the game's lifetime) ----
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<GameHandle | null>(null);
  const netRef = useRef<NetClient | null>(null);
  const replyTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** What was held before the last optimistic booth_set (for denial rollback). */
  // One-shot rollback token for the claim in flight: consumed by the first
  // booth_denied and time-limited, so a denial arriving from a reconnect
  // re-announce (not a fresh claim) can't resurrect a spot abandoned long ago.
  // `claim` is the previous spot on THIS floor (same-floor move); `otherFloor`
  // is the stand's previous home when this was a cross-floor move.
  const prevClaimRef = useRef<{
    claim: BoothClaim | null;
    otherFloor: { floorId: string; spotIndex: number } | null;
    ts: number;
  } | null>(null);
  // Last NPC booth the player talked at — its thread closes on walk-away
  // regardless of whether the booth card is still open.
  const lastNpcBoothRef = useRef<{ spotIndex: number; startupId: string } | null>(null);

  const myStartup = state.myStartup;
  const startups: Record<string, Startup> = useMemo(
    () => (myStartup ? { ...STARTUPS, [myStartup.id]: myStartup } : { ...STARTUPS }),
    [myStartup],
  );

  const profileRef = useRef(state.profile);
  profileRef.current = state.profile;
  const startupsRef = useRef(startups);
  startupsRef.current = startups;
  const myStartupRef = useRef(myStartup);
  myStartupRef.current = myStartup;
  const claimsRef = useRef(state.claims);
  claimsRef.current = state.claims;
  const activeBoothRef = useRef(activeBooth);
  activeBoothRef.current = activeBooth;
  const threadsRef = useRef(threads);
  threadsRef.current = threads;
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const connectionsRef = useRef(state.connections);
  connectionsRef.current = state.connections;
  const mutedRef = useRef(mutedIds);
  mutedRef.current = mutedIds;
  const badgesRef = useRef(state.badges);
  badgesRef.current = state.badges;
  const stateRef = useRef(state);
  stateRef.current = state;

  // social inbox: request/connection state for booth cards and DM threads
  const [inbox, refreshInbox] = useInbox(ready ? state.profile.id : "", 15_000);
  /** Wire ids carry a "-2" suffix for second tabs; match them to profile ids. */
  const matchesPeer = useCallback(
    (profileId: string, wireOrProfileId: string | undefined): boolean =>
      wireOrProfileId !== undefined &&
      (wireOrProfileId === profileId || wireOrProfileId.startsWith(`${profileId}-`)),
    [],
  );

  const nameSet = state.profile.name !== "";
  const tierOk = floor ? TIER_ORDER[state.sub] >= TIER_ORDER[floor.tier] : false;
  const allowed = Boolean(ready && floor && nameSet && tierOk);

  // no name yet — go pick one in the lobby
  useEffect(() => {
    if (ready && floor && !nameSet) router.replace("/lobby");
  }, [ready, floor, nameSet, router]);


  // Mail toast click: open that connection's chat thread in the panel.
  const openSocialFromToast = useCallback((peerId: string) => {
    const key = `social:${peerId}`;
    setThreads((prev) =>
      prev[key] ? { ...prev, [key]: { ...prev[key], open: true, unread: false } } : prev,
    );
    setTab(key);
    setChatCollapsed(false);
  }, []);

  // Escape closes the topmost overlay (request card first, then booth card) —
  // keyboard users shouldn't need to hunt a small × with the mouse.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== "Escape") return;
      if (incomingReq) setIncomingReq(null);
      else if (activeBooth) setActiveBooth(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [incomingReq, activeBooth]);

  // Phones: the top-right minimap sits under the booth/request cards (DOM
  // paints above canvas) — hide it while a card is open, restore after.
  useEffect(() => {
    if (!coarse) return;
    const cardOpen = Boolean(activeBooth || incomingReq);
    handleRef.current?.setMinimap(cardOpen ? false : minimapOn);
  }, [coarse, activeBooth, incomingReq, minimapOn]);

  const showToast = useCallback((text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // ---- threads ----

  const openNpcThread = useCallback((s: Startup) => {
    const key = `npc:${s.id}`;
    const greeting: ChatMsg = {
      id: uid(),
      fromId: key,
      from: s.founder,
      text: replyFor(s, ""),
      ts: Date.now(),
      scope: "dm",
      peerId: key,
    };
    setThreads((prev) => {
      const existing = prev[key];
      if (existing) {
        return { ...prev, [key]: { ...existing, open: true, unread: false } };
      }
      return {
        ...prev,
        [key]: {
          key,
          kind: "npc",
          label: firstName(s.founder),
          title: `${s.founder} · ${s.name}`,
          startupId: s.id,
          msgs: [greeting],
          typing: false,
          unread: false,
          open: true,
        },
      };
    });
    setTab(key);
    setChatCollapsed(false);
  }, []);

  const openPlayerThread = useCallback((wireId: string, name: string) => {
    const key = `player:${wireId}`;
    setThreads((prev) => {
      const existing = prev[key];
      if (existing) {
        return { ...prev, [key]: { ...existing, open: true, unread: false } };
      }
      return {
        ...prev,
        [key]: {
          key,
          kind: "player",
          label: name,
          title: `${name} · on this floor`,
          peerId: wireId,
          msgs: [],
          typing: false,
          unread: false,
          open: true,
        },
      };
    });
    setTab(key);
    setChatCollapsed(false);
  }, []);

  const handleTab = useCallback((key: string) => {
    setTab(key);
    setChatCollapsed(false);
    if (key !== "floor") {
      setThreads((prev) =>
        prev[key] ? { ...prev, [key]: { ...prev[key], unread: false } } : prev,
      );
    }
  }, []);

  const closeThread = useCallback((key: string) => {
    setThreads((prev) =>
      prev[key] ? { ...prev, [key]: { ...prev[key], open: false } } : prev,
    );
    setTab((t) => (t === key ? "floor" : t));
  }, []);

  const connectedIds = useMemo(
    () => new Set(state.connections.map((c) => c.startupId)),
    [state.connections],
  );
  const connectedIdsRef = useRef(connectedIds);
  connectedIdsRef.current = connectedIds;

  // ---- moderation: session mute + report (player threads) ----

  const toggleMute = useCallback((threadKey: string) => {
    const th = threadsRef.current[threadKey];
    const peerId = th?.peerId;
    if (!peerId) return;
    setMutedIds((prev) => {
      const next = new Set(prev);
      if (next.has(peerId)) next.delete(peerId);
      else next.add(peerId);
      handleRef.current?.setMuted([...next]);
      return next;
    });
  }, []);

  const reportPeer = useCallback(
    (threadKey: string) => {
      const th = threadsRef.current[threadKey];
      if (!th?.peerId) return;
      netRef.current?.sendReport(th.peerId, `reported from DM with "${th.label}"`);
      showToast("Reported. The operator will take a look.");
    },
    [showToast],
  );

  const handleConnect = useCallback(
    (s: Startup, ownerId?: string) => {
      if (!floor) return;
      if (ownerId) {
        // A real person's stand: connecting is a REQUEST — they see your
        // card (name, title, badges, track record) and accept or decline.
        // ownerId is their stable profile id; the server routes it.
        void sendConnectRequest(buildCard(stateRef.current), ownerId).then((st) => {
          if (st !== "failed") refreshInbox();
          showToast(requestToast(st, s.founder));
        });
        actions.completeOnboarding("connect");
        return;
      }
      if (connectedIdsRef.current.has(s.id)) return;
      actions.addConnection({
        startupId: s.id,
        name: s.name,
        founder: s.founder,
        floorId: floor.id,
      });
      actions.completeOnboarding("connect");
      showToast(`Connected with ${s.founder} of ${s.name}.`);
      // The founder acknowledges the connection in their own voice, in the DM thread.
      if (!s.id.startsWith("mine")) {
        const key = `npc:${s.id}`;
        const ack: ChatMsg = {
          id: uid(),
          fromId: key,
          from: s.founder,
          text: s.dialogue?.connectReply ?? "Connected — good to meet you.",
          ts: Date.now(),
          scope: "dm",
          peerId: key,
        };
        setThreads((prev) => {
          const existing = prev[key];
          if (existing) {
            return {
              ...prev,
              [key]: {
                ...existing,
                msgs: [...existing.msgs, ack],
                unread: existing.open && tabRef.current !== key ? true : existing.unread,
              },
            };
          }
          // No thread yet (connected from the booth card without chatting) —
          // keep the ack in a hidden thread so it's there when they open it.
          return {
            ...prev,
            [key]: {
              key,
              kind: "npc",
              label: firstName(s.founder),
              title: `${s.founder} · ${s.name}`,
              startupId: s.id,
              msgs: [ack],
              typing: false,
              unread: false,
              open: false,
            },
          };
        });
      }
    },
    [floor, actions, showToast],
  );

  const connectThreadKey = useCallback(
    (key: string) => {
      const th = threadsRef.current[key];
      if (!th || !floor) return;
      if (th.kind === "npc" && th.startupId) {
        const s = startupsRef.current[th.startupId];
        if (s) handleConnect(s);
        return;
      }
      // A real player: send a connection request. Their wire id is fine —
      // the server resolves live wire ids to profile ids.
      if (!th.peerId) return;
      void sendConnectRequest(buildCard(stateRef.current), th.peerId).then((st) => {
        if (st !== "failed") refreshInbox();
        showToast(requestToast(st, th.label));
      });
      actions.completeOnboarding("connect");
    },
    [floor, actions, handleConnect, showToast],
  );

  const handleClaim = useCallback(
    (b: BoothInstance) => {
      const s = myStartupRef.current;
      if (!floor || !s) return;
      // Remember what we held: if the server denies this spot, the stand
      // rolls back instead of silently ghosting for everyone else. For a
      // cross-floor move that's the OTHER floor's claim — claimSpot is
      // about to drop it optimistically, and losing the spot race here
      // must not cost the stand over there.
      const prevIdx = claimsRef.current[floor.id];
      const otherEntry = Object.entries(claimsRef.current).find(
        ([fid]) => fid !== floor.id && fid !== PRACTICE_FLOOR_ID,
      );
      prevClaimRef.current = {
        claim: prevIdx !== undefined ? { spotIndex: prevIdx, startup: s } : null,
        otherFloor: otherEntry ? { floorId: otherEntry[0], spotIndex: otherEntry[1] } : null,
        ts: Date.now(),
      };
      actions.claimSpot(floor.id, b.spotIndex);
      const claim = { spotIndex: b.spotIndex, startup: s };
      handleRef.current?.setMyBooth(claim);
      netRef.current?.sendBoothSet(claim);
      setActiveBooth(null);
      showToast(`Stand claimed. ${s.name} is now on this floor.`);
    },
    [floor, actions, showToast],
  );

  const handleUnclaim = useCallback(() => {
    if (!floor) return;
    actions.unclaimSpot(floor.id);
    handleRef.current?.setMyBooth(null);
    netRef.current?.sendBoothClear();
    setActiveBooth(null);
    showToast("Stand packed up.");
  }, [floor, actions, showToast]);

  // On-floor stand editing: save to the store, re-register site-wide, and
  // rebroadcast the claim so everyone on the floor sees the change at once.
  /**
   * Push a stand change out NOW: local state, the canvas, and the floor.
   *
   * All three are cheap. The registry write is not — it is an HTTP post
   * that shares the per-IP auth budget — so it is debounced behind them.
   * Without that split, clicking through eight colour swatches would be
   * eight posts and the ninth would start being refused.
   */
  const registryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyStandLive = useCallback(
    (updated: Startup) => {
      actions.saveMyStartup(updated);
      if (floor && claimsRef.current[floor.id] !== undefined) {
        const claim = { spotIndex: claimsRef.current[floor.id]!, startup: updated };
        handleRef.current?.setMyBooth(claim);
        netRef.current?.sendBoothSet(claim);
      }
      if (registryTimer.current) clearTimeout(registryTimer.current);
      registryTimer.current = setTimeout(() => {
        registryTimer.current = null;
        void registerStartup(profileRef.current.id, updated);
      }, 1500);
    },
    [floor, actions],
  );

  // A pending registry write must not be lost by walking away mid-edit.
  useEffect(
    () => () => {
      if (registryTimer.current) clearTimeout(registryTimer.current);
    },
    [],
  );

  const handleEditSave = useCallback(
    (updated: Startup) => {
      applyStandLive(updated);
      // Done means done: flush the debounce rather than leaving the
      // directory a second and a half behind the floor.
      if (registryTimer.current) {
        clearTimeout(registryTimer.current);
        registryTimer.current = null;
      }
      void registerStartup(profileRef.current.id, updated);
      setEditingStand(false);
      setActiveBooth(null);
      showToast("Stand updated — the whole floor sees it.");
    },
    [applyStandLive, showToast],
  );

  // Walking away (or closing the card) always closes the editor with it.
  useEffect(() => {
    if (!activeBooth) setEditingStand(false);
  }, [activeBooth]);

  const handleSend = useCallback(
    (text: string, tabKey: string) => {
      const me = profileRef.current;
      if (tabKey === "floor") {
        const msg: ChatMsg = {
          id: uid(),
          fromId: me.id,
          from: me.name,
          text,
          ts: Date.now(),
          scope: "floor",
        };
        // Always append locally — offline the input should never feel dead,
        // online we filter our own echo out of incoming events.
        setFloorMsgs((m) => [...m.slice(-199), msg]);
        netRef.current?.sendChat(text, "floor");
        handleRef.current?.showBubble("me", text);
        return;
      }

      const th = threadsRef.current[tabKey];
      if (!th || !th.open) return;
      // Social threads skip the local append — the push echo lands instantly.
      if (th.kind !== "social") {
        const mine: ChatMsg = {
          id: uid(),
          fromId: me.id,
          from: me.name,
          text,
          ts: Date.now(),
          scope: "dm",
          peerId: th.kind === "player" ? th.peerId : `npc:${th.startupId}`,
        };
        setThreads((prev) => {
          const cur = prev[tabKey];
          if (!cur) return prev;
          return {
            ...prev,
            [tabKey]: {
              ...cur,
              msgs: [...cur.msgs, mine],
              typing: cur.kind === "npc" ? true : cur.typing,
            },
          };
        });
      }
      actions.completeOnboarding("talk");
      // Quest deed: distinct founders/players talked to.
      actions.recordTalkedTo(th.kind === "player" ? (th.peerId ?? tabKey) : (th.startupId ?? tabKey));

      if (th.kind === "social") {
        // Connection DM: no local append — the server pushes the echo back
        // instantly to every tab, which keeps ordering consistent everywhere.
        if (th.peerId) {
          void sendSocialDm(me.id, me.name, th.peerId, text);
        }
        return;
      }

      if (th.kind === "player") {
        // Local-append + filter the server echo (same policy as the floor tab).
        if (th.peerId) netRef.current?.sendChat(text, "dm", th.peerId);
        return;
      }

      // NPC thread: schedule the founder's reply.
      const sid = th.startupId;
      if (!sid) return;
      if (replyTimers.current[sid]) clearTimeout(replyTimers.current[sid]);
      replyTimers.current[sid] = setTimeout(() => {
        delete replyTimers.current[sid];
        const startup = startupsRef.current[sid];
        if (!startup) return;
        const key = `npc:${sid}`;
        const reply: ChatMsg = {
          id: uid(),
          fromId: key,
          from: startup.founder,
          text: replyFor(startup, text),
          ts: Date.now(),
          scope: "dm",
          peerId: key,
        };
        setThreads((prev) => {
          const cur = prev[key];
          if (!cur) return prev;
          return {
            ...prev,
            [key]: {
              ...cur,
              typing: false,
              msgs: [...cur.msgs, reply],
              unread: cur.open && tabRef.current !== key ? true : cur.unread,
            },
          };
        });
        handleRef.current?.showBubble(key, reply.text);
      }, 600 + Math.random() * 300);
    },
    [actions],
  );

  /** Live head-count per floor, for the porter's lodge. */
  const floorCounts = usePresence();
  /**
   * The register's list. Built from the floor def rather than from the
   * engine's own booths: the engine keeps that private, and this only needs
   * what is on the map plus your own stand.
   */
  const hallBooths = useMemo<BoothInstance[]>(() => {
    const f = floor;
    if (!f) return [];
    return f.boothSpots.map((spot, i) => {
      const seedId = seedIdAt(f, i);
      const seeded = seedId ? STARTUPS[seedId] : undefined;
      const mineHere =
        state.myStartup && state.claims[f.id] === i ? state.myStartup : undefined;
      return {
        spot,
        spotIndex: i,
        startup: mineHere ?? seeded ?? null,
        isYours: Boolean(mineHere),
        ownerId: mineHere ? state.profile.id : undefined,
      };
    });
  }, [floor, state.myStartup, state.claims, state.profile.id]);
  /**
   * ?stall=arcade opens a stall on arrival. It exists so the arcade can be
   * linked to and so an end-to-end test can reach it without twenty tiles
   * of dead reckoning; it also means "meet me at the arcade" is a URL.
   */
  useEffect(() => {
    if (!floor?.plaza?.merchants) return;
    const want = new URLSearchParams(window.location.search).get("stall");
    if (!want) return;
    const m = floor.plaza.merchants.find((x) => x.id === want);
    if (m) setOpenStall(m);
  }, [floor]);

  /** Which room of the arcade is open: the hub, the parkour or the quizzes. */
  const [arcadeRoom, setArcadeRoom] = useState<"hub" | "parkour" | "quiz">("hub");
  /** Everything playable in the quiz room: shipped plus anything written here. */
  const quizzes = useMemo<Quiz[]>(
    () => [
      ...BUILTIN_QUIZZES,
      ...((state.quizzes ?? []).map(sanitizeQuiz).filter(Boolean) as Quiz[]),
    ],
    [state.quizzes],
  );
  /** Arcade tickets already taken today, so the panel can say what is left. */
  const arcadeWonToday = useMemo(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return state.arcadeDay === today ? (state.arcadeWon ?? 0) : 0;
  }, [state.arcadeDay, state.arcadeWon]);

  const handleFocusChange = useCallback((focused: boolean) => {
    handleRef.current?.setInputEnabled(!focused);
  }, []);

  const handleEmote = useCallback(
    (kind: EmoteKind) => {
      handleRef.current?.emote(kind);
      actions.completeOnboarding("emote");
      actions.recordEmote();
    },
    [actions],
  );

  // Open Doors badge — granted once, while the event is live on this floor.
  // The badge ID stays "demo-night": people already hold it.
  const handleEventLive = useCallback(() => {
    if (badgesRef.current.includes("demo-night")) return;
    actions.grantBadge("demo-night");
    showToast("Open Doors, live, and you're in the room. Badge earned.");
  }, [actions, showToast]);

  // Tour finishes itself when the last step lands. Completing it earns the
  // graduate badge; in the Tutorial Hall that gets the full ceremony.
  useEffect(() => {
    if (!ready || state.tutorialDone) return;
    if (state.onboarding.length >= ONBOARDING_STEPS.length) {
      actions.setTutorialDone(true);
      actions.grantBadge("tutorial-grad");
      setBurst((b) => b + 1);
      if (floor?.id === "tutorial-hall") {
        setGradPanel(true);
      } else {
        showToast("Tour done — Tutorial graduate badge earned.");
      }
    }
  }, [ready, state.onboarding, state.tutorialDone, actions, showToast, floor?.id]);

  // The empty-room moment: once the tour is done and the server has had a
  // few seconds to report the room, a visitor standing alone gets told so —
  // with the three things still worth doing — instead of being left to
  // conclude the whole place is dead. Someone walking in resets the timer.
  useEffect(() => {
    if (!ready || quietDismissed || !state.tutorialDone) return;
    if (floor?.id === PRACTICE_FLOOR_ID) return; // the tutorial is meant to be quiet
    if (!presence.online || presence.count > 1) {
      setQuietShown(false);
      return;
    }
    const t = window.setTimeout(() => setQuietShown(true), 6000);
    return () => window.clearTimeout(t);
  }, [ready, quietDismissed, state.tutorialDone, floor?.id, presence.online, presence.count]);

  // Quest deed: floors visited.
  useEffect(() => {
    if (ready && allowed && floor) actions.recordFloorVisit(floor.id);
  }, [ready, allowed, floor, actions]);

  // Deep links land people straight on floors — count the visit here too so
  // streaks and the away-mark don't depend on passing through the lobby.
  useEffect(() => {
    if (ready && allowed) actions.recordVisit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, allowed]);

  // Quest rewards — grant each completed quest's badge/title/emote exactly once.
  const quests = useMemo(() => questStates(state), [state]);
  const emotes = useMemo(() => unlockedEmotes(state), [state]);
  useEffect(() => {
    if (!ready) return;
    for (const q of quests) {
      if (!q.done || q.claimed) continue;
      actions.markQuestClaimed(q.def.id);
      actions.grantBadge(q.def.reward.badge);
      showToast(`Quest complete: ${q.def.title} — +${q.def.reward.tickets} tickets, ${q.def.rewardLabel}`);
      setBurst((b) => b + 1);
      break; // one toast per render pass; the next completes on the following pass
    }
  }, [ready, quests, actions, showToast]);

  // ---- mount the game + net client ----
  useEffect(() => {
    if (!allowed || session !== "mine") return;
    const f = floorById(params.id);
    const canvas = canvasRef.current;
    if (!f || !canvas) return;

    // Canvas buffer sizing is owned by the engine's dpr-aware ResizeObserver.
    const net = createNetClient();
    netRef.current = net;
    const offNet = net.on((ev) => {
      if (ev.t === "replaced") {
        // The same identity joined this floor from another window or device
        // — the server handed the session over. Show the takeover panel;
        // rejoining from here kicks it right back.
        setSession("elsewhere");
        return;
      }
      if (ev.t === "welcome") {
        setActivity(ev.activity.slice(-MAX_ACTIVITY));
        // Reconcile DM thread liveness against the fresh player list.
        const present = new Set(ev.players.map((p) => p.id));
        setThreads((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const th of Object.values(prev)) {
            if (th.kind !== "player" || !th.peerId) continue;
            const here = present.has(th.peerId) || th.peerId === net.selfId;
            if (here === !th.left) continue;
            next[th.key] = withPeerPresence(th, here);
            changed = true;
          }
          return changed ? next : prev;
        });
      }
      if (ev.t === "player_leave") {
        const key = `player:${ev.id}`;
        setThreads((prev) =>
          prev[key] && !prev[key].left
            ? { ...prev, [key]: withPeerPresence(prev[key], false) }
            : prev,
        );
      }
      if (ev.t === "player_join") {
        const key = `player:${ev.player.id}`;
        setThreads((prev) =>
          prev[key]?.left ? { ...prev, [key]: withPeerPresence(prev[key], true) } : prev,
        );
      }
      if (ev.t === "activity") {
        setActivity((prev) => [...prev, ev.item].slice(-MAX_ACTIVITY));
      }
      if (ev.t === "chat" && ev.msg.scope === "floor") {
        // Filter our own echo by the server-assigned wire identity only —
        // a second tab shares the same profile id but gets its own selfId.
        // Muted players' messages are dropped entirely.
        if (ev.msg.fromId !== net.selfId && !mutedRef.current.has(ev.msg.fromId)) {
          setFloorMsgs((m) => [...m.slice(-199), ev.msg]);
        }
      }
      if (ev.t === "chat" && ev.msg.scope === "dm") {
        // Our own echo — we already appended locally when sending.
        if (ev.msg.fromId === net.selfId) return;
        if (mutedRef.current.has(ev.msg.fromId)) return; // muted peer
        const peer = ev.msg.peerId ?? ev.msg.fromId;
        if (!peer) return;
        const key = `player:${peer}`;
        setThreads((prev) => {
          const existing = prev[key];
          const unread = tabRef.current !== key;
          if (existing) {
            return {
              ...prev,
              [key]: {
                ...existing,
                open: true,
                msgs: [...existing.msgs, ev.msg],
                unread,
              },
            };
          }
          return {
            ...prev,
            [key]: {
              key,
              kind: "player",
              label: ev.msg.from,
              title: `${ev.msg.from} · on this floor`,
              peerId: peer,
              msgs: [ev.msg],
              typing: false,
              unread,
              open: true,
            },
          };
        });
      }
      if (ev.t === "social_dm") {
        // A connection DM (maybe sent from the Connections screen) — surface
        // it as a chat thread right here on the floor. Own echoes keep the
        // thread consistent when you sent it from another tab or this panel.
        const myId = profileRef.current.id;
        const mineSent = ev.from === myId;
        const peer = mineSent ? ev.to : ev.from;
        const peerName = mineSent ? ev.toName : ev.fromName;
        const key = `social:${peer}`;
        const msg: ChatMsg = {
          id: uid(),
          fromId: mineSent ? myId : peer,
          from: mineSent ? profileRef.current.name : ev.fromName,
          text: ev.text,
          ts: ev.ts,
          scope: "dm",
          peerId: peer,
        };
        setThreads((prev) => {
          const existing = prev[key];
          const unread = !mineSent && tabRef.current !== key;
          if (existing) {
            return {
              ...prev,
              [key]: { ...existing, open: true, msgs: [...existing.msgs, msg], unread },
            };
          }
          return {
            ...prev,
            [key]: {
              key,
              kind: "social",
              label: peerName,
              title: `${peerName} · connection`,
              peerId: peer,
              msgs: [msg],
              typing: false,
              unread,
              open: true,
            },
          };
        });
        if (!mineSent && tabRef.current !== key) {
          setMailToast({
            id: Date.now(),
            fromName: ev.fromName,
            text: ev.text,
            peerId: peer,
          });
        }
      }
      if (ev.t === "connect_request") {
        // Someone wants to connect — show their card right here on the floor.
        setIncomingReq(ev.req);
        refreshInbox();
      }
      if (ev.t === "connect_accept") {
        // Mirror into the local store: quests and calling-card counts must
        // include real people, not just NPC handshakes.
        actions.addConnection({
          name: ev.peerName,
          founder: ev.peerName,
          floorId: f.id,
          peerId: ev.peerId,
        });
        showToast(`${ev.peerName} accepted — you're connected. Chat lives in Connections.`);
        refreshInbox();
      }
      if (ev.t === "booth_denied") {
        if (ev.reason === "elsewhere") {
          // Our one stand lives on another floor; the claim this browser
          // re-raised on walking in was stale. Correct the local claim to
          // the stand's true location — merely forgetting it would make the
          // next visit THERE join claim-less and pack the real stand up.
          prevClaimRef.current = null;
          handleRef.current?.setMyBooth(null);
          netRef.current?.sendBoothClear();
          const home = ev.standFloorId ? floorById(ev.standFloorId) : undefined;
          if (home && ev.standSpotIndex !== undefined && myStartupRef.current) {
            // claimSpot's one-stand filter also drops this floor's stale key
            actions.claimSpot(home.id, ev.standSpotIndex);
            showToast(`Your stand is over on ${home.name} — claim a spot here to move it.`);
          } else {
            actions.unclaimSpot(f.id);
            showToast("Your stand is on another floor — claim a spot here to move it over.");
          }
          return;
        }
        if (ev.reason === "prohibited") {
          // Refused on content, not on the spot. Do NOT restore a previous
          // claim or re-announce: nothing about the spot was wrong, and
          // retrying the same text would only be denied again.
          prevClaimRef.current = null;
          handleRef.current?.setMyBooth(null);
          actions.unclaimSpot(f.id);
          showToast(
            "That stand can't go up as written. Edit it in your profile, or email the address on the About page.",
          );
          return;
        }
        // Someone else claimed that spot first. If this was a MOVE, the
        // server still holds our previous spot — restore it locally and
        // re-announce so every state (server, net client, room) reconverges
        // instead of leaving a ghost stand behind.
        const prev = prevClaimRef.current;
        prevClaimRef.current = null; // one-shot — a second denial won't loop
        const fresh = prev && Date.now() - prev.ts < 15_000;
        if (fresh && prev.claim && prev.claim.spotIndex !== ev.spotIndex) {
          actions.claimSpot(f.id, prev.claim.spotIndex);
          handleRef.current?.setMyBooth(prev.claim);
          netRef.current?.sendBoothSet(prev.claim);
          showToast("Someone claimed that spot first. Your stand stays put.");
        } else if (fresh && !prev.claim && prev.otherFloor) {
          // Cross-floor move that lost the race: the server never touched
          // the old floor's stand (denial precedes the release), but our
          // optimistic claimSpot dropped its local claim — put it back or
          // the next visit there would demolish the real stand.
          handleRef.current?.setMyBooth(null);
          netRef.current?.sendBoothClear();
          actions.claimSpot(prev.otherFloor.floorId, prev.otherFloor.spotIndex);
          const homeName = floorById(prev.otherFloor.floorId)?.name ?? "its old floor";
          showToast(`Someone claimed that spot first — your stand stays on ${homeName}.`);
        } else {
          actions.unclaimSpot(f.id);
          handleRef.current?.setMyBooth(null);
          netRef.current?.sendBoothClear();
          showToast(
            ev.reason === "reserved"
              ? "That spot is spoken for — a founder's stand is parked there while they're away."
              : "Someone claimed that stand first. Pick another spot.",
          );
        }
      }
      if (ev.t === "booth_clear" && ev.ownerId === profileRef.current.id) {
        // Our stand on THIS floor was released remotely — the one-stand rule
        // firing from another device's claim, an admin clear, or expiry. The
        // engine only tracks REMOTE booths, so without this the session keeps
        // rendering a stand nobody else sees and a later edit-save would
        // re-raise it, dragging the stand back across floors.
        if (claimsRef.current[f.id] !== undefined) {
          actions.unclaimSpot(f.id);
          handleRef.current?.setMyBooth(null);
          netRef.current?.sendBoothClear();
          showToast("Your stand just moved to another floor.");
        }
      }
    });

    // A stored claim whose spot no longer exists (floor defs change between
    // versions) would announce an invisible stand that still blocks that
    // index in arbitration — drop it instead.
    let claimIdx: number | undefined = claimsRef.current[f.id];
    if (claimIdx !== undefined && !isClaimableSpot(f, claimIdx)) {
      actions.unclaimSpot(f.id);
      claimIdx = undefined;
    }
    const mine = myStartupRef.current;
    const myClaim =
      mine && claimIdx !== undefined ? { spotIndex: claimIdx, startup: mine } : undefined;

    const handle = createGame({
      canvas,
      floor: f,
      me: profileRef.current, // includes the optional status line
      myStartup: mine,
      myClaim,
      startups: startupsRef.current,
      idleLines: IDLE_LINES,
      net,
      cb: {
        onNearBooth: (b) => {
          setNearBooth(b);
          const active = activeBoothRef.current;
          if (active) {
            if (!b || b.spotIndex !== active.spotIndex) {
              setActiveBooth(null); // walked away — the card closes behind you
            } else {
              // Same stand, fresh instance (the floor was rebuilt) — keep the
              // card but point it at current data.
              setActiveBooth(b);
            }
          }
          // The NPC conversation closes on walk-away even if the card was
          // dismissed by hand earlier — tracked separately from the card so
          // "tap ×, then wander off" doesn't leave the thread open. Closing
          // hides the thread; its history survives. The chat panel folds
          // back down so the floor stays the main thing.
          const lastNpc = lastNpcBoothRef.current;
          if (lastNpc && (!b || b.spotIndex !== lastNpc.spotIndex)) {
            lastNpcBoothRef.current = null;
            const key = `npc:${lastNpc.startupId}`;
            setThreads((prev) =>
              prev[key]?.open ? { ...prev, [key]: { ...prev[key], open: false } } : prev,
            );
            setTab((t) => {
              if (t === key) {
                setChatCollapsed(true);
                return "floor";
              }
              return t;
            });
          }
        },
        onInteract: (b) => {
          setActiveBooth(b);
          actions.completeOnboarding("interact");
          // DM opens only for seed-startup booths: their founder is an NPC.
          // Live-claimed stands have a real owner walking the floor, and your
          // own booth has you.
          if (b.startup && !b.isYours && !b.ownerId) {
            openNpcThread(b.startup);
            lastNpcBoothRef.current = { spotIndex: b.spotIndex, startupId: b.startup.id };
          }
        },
        onNearMerchant: (m) => setNearMerchant(m),
        onMerchant: (m) => useMerchantRef.current(m),
        onPresence: (count, online) => setPresence({ count, online }),
        onHover: (t) => setHover(t),
        onPlayerClick: (p) => openPlayerThread(p.id, p.name),
        onFirstAction: (kind) => actions.completeOnboarding(kind),
      },
    });
    handleRef.current = handle;
    // The engine owns the connection: createGame() already called net.connect()
    // with its collision-aware spawn point — connecting again here would double-join.

    // Directory deep link: /floor/<id>?spot=<n> auto-walks you from the
    // spawn point up to the stand you searched for.
    const search = new URLSearchParams(window.location.search);
    const spotParam = search.get("spot");
    if (spotParam) {
      const spotIndex = Number(spotParam);
      if (Number.isInteger(spotIndex) && spotIndex >= 0) handle.walkToBooth(spotIndex);
    }

    // strict-mode double-mount is handled by this cleanup running between passes
    return () => {
      offNet();
      handle.destroy();
      net.disconnect();
      handleRef.current = null;
      netRef.current = null;
      for (const t of Object.values(replyTimers.current)) clearTimeout(t);
      replyTimers.current = {};
    };
  }, [allowed, session, params.id, actions, showToast, openNpcThread, openPlayerThread, refreshInbox]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // ---- non-game branches ----
  if (!floor) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-16">
        <div className="glass p-6">
          <h1 className="font-display text-2xl">No such floor</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            There is no floor called &ldquo;{params.id}&rdquo;. Halls get
            renamed, links go stale. The lobby has the current map.
          </p>
          <Link
            href="/lobby"
            className="mt-5 inline-block rounded-md bg-ink px-4 py-2 text-sm text-paper hover:bg-ink/85"
          >
            Back to the lobby
          </Link>
        </div>
      </main>
    );
  }

  if (!ready || !nameSet) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-16">
        <p className="text-sm text-muted">Checking your badge…</p>
      </main>
    );
  }

  if (!tierOk) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-16">
        <div className="glass p-6">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl">{floor.name}</h1>
            <TierTag tier={floor.tier} />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            This floor requires a {TIER_LABEL[floor.tier]} membership. You are
            on {TIER_LABEL[state.sub]}. The door is polite but firm.
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              href="/profile"
              className="rounded-md bg-accent-strong px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong/90"
            >
              Upgrade in Profile
            </Link>
            <Link
              href="/lobby"
              className="rounded-md border border-ink px-4 py-2 text-sm hover:bg-glass"
            >
              Back to the lobby
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (session === "blocked") {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-16">
        <div className="glass p-6">
          <h1 className="font-display text-2xl">The floor is open in another tab</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            One of you is plenty — running the game twice would put two of
            you in the same hall. Keep playing over there, or take over here.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => takeLock(true)}
              className="rounded-md bg-accent-strong px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong/90"
            >
              Play here instead
            </button>
            <Link
              href="/lobby"
              className="rounded-md border border-ink px-4 py-2 text-sm hover:bg-glass"
            >
              Back to the lobby
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (session === "elsewhere") {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-16">
        <div className="glass p-6">
          <h1 className="font-display text-2xl">You joined from somewhere else</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            This session was handed over to a newer one — another window or
            another device walked onto the floor as you. If that wasn&rsquo;t
            you, change your password; if it was, carry on there or take the
            floor back here.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setSession("mine")}
              className="rounded-md bg-accent-strong px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong/90"
            >
              Rejoin here
            </button>
            <Link
              href="/lobby"
              className="rounded-md border border-ink px-4 py-2 text-sm hover:bg-glass"
            >
              Back to the lobby
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ---- the game ----
  const openThreads: ChatThread[] = Object.values(threads)
    .filter((t) => t.open)
    .map((t) => ({
      key: t.key,
      kind: t.kind,
      label: t.label,
      title: t.title,
      msgs: t.msgs,
      typing: t.typing,
      unread: t.unread,
      left: t.left ?? false,
      muted: t.peerId !== undefined && mutedIds.has(t.peerId),
      connected:
        t.kind === "npc"
          ? t.startupId !== undefined && connectedIds.has(t.startupId)
          : t.kind === "social"
            ? true // a social thread only exists between connected people
            : // Mutual (server-side) connections; wire ids may carry a tab suffix.
              inbox.connections.some((c) => matchesPeer(c.peerId, t.peerId)) ||
              inbox.outgoing.some((p) => matchesPeer(p, t.peerId)),
    }));

  const myIds = [
    state.profile.id,
    ...(netRef.current ? [netRef.current.selfId] : []),
  ];

  // Guestbook key: startup id for seed booths, "spot:<i>" for claimed stands.
  const guestbookKey =
    activeBooth && activeBooth.startup
      ? activeBooth.isYours || activeBooth.ownerId
        ? `spot:${activeBooth.spotIndex}`
        : activeBooth.startup.id
      : null;

  return (
    // floor-viewport pins the height to 100svh (see globals.css). `inset-0`
    // alone sizes to the layout viewport, which iOS grows and shrinks with
    // the address bar — and every one of those steps reallocated the
    // canvas's backing store mid-animation.
    <div
      className="floor-viewport fixed inset-x-0 top-0 z-50 overflow-hidden bg-paper"
      // Everything else on this page is painted into a canvas, so an
      // end-to-end test has no way to ask "what is the player standing at".
      // This is that handle, and it costs one attribute.
      data-near-merchant={nearMerchant?.id ?? ""}
      data-near-booth={nearBooth ? String(nearBooth.spotIndex) : ""}
    >
      <canvas
        ref={canvasRef}
        className="pixelated absolute inset-0 h-full w-full"
        aria-label={`${floor.name} — walkable expo floor`}
      />

      {/* Top bar. ONE ROW, always.
          It used to wrap, and a wrapped right-hand cluster does not stay on
          the right — it drops to the next line and left-aligns, so on a
          phone the floor name sat alone above a loose pile of buttons that
          read as debris. Nothing wraps now: the name truncates instead,
          and the controls keep their corner at every width.
          On touch the head-count folds INTO the name pill, because a phone
          has room for one status chip, not two. */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2">
          {/* Where to go. A cross-shaped hall with traders down the sides is
              not self-explanatory on the first visit, and "walk about until
              you find it" is not wayfinding. */}
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            aria-label="Where to go"
            title="Where to go"
            className="glass flex h-9 w-9 shrink-0 items-center justify-center font-display text-lg leading-none shadow-float transition-colors hover:text-accent"
          >
            ?
          </button>
          <span className="glass flex min-w-0 items-center gap-2 px-3 py-2 shadow-float">
            {coarse && (
              <span
                aria-hidden="true"
                className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                  presence.online ? "bg-verify" : "bg-line"
                }`}
              />
            )}
            <span className="truncate font-display text-base leading-none">{floor.name}</span>
            {coarse && presence.online && (
              <span className="shrink-0 text-xs text-muted">{presence.count}</span>
            )}
            {/* The tier badge stands down on the narrowest phones. The
                floor NAME is the one thing this pill exists to say, and
                truncating it to "Ma…" to make room for a badge that repeats
                what the lobby already said is the wrong trade. */}
            <span className={`shrink-0 ${device.size === "xs" ? "hidden" : ""}`}>
              <TierTag tier={floor.tier} />
            </span>
          </span>
          {/* CSS-hidden (not unmounted) on phones so the live-badge effect
              still runs; the chip itself is lobby content, not phone HUD.
              A phone held sideways is WIDE — it passes the sm width test —
              but it is 300px tall, so it is hidden by pointer and shape
              rather than by width alone. */}
          <span className={`hidden sm:block ${device.landscapePhone ? "sm:hidden" : ""}`}>
            <EventPill floorId={floor.id} onLiveHere={handleEventLive} />
          </span>
        </div>
        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          {/* your membership, worn on the floor chrome too */}
          <MemberBadge glass />
          {/* The head-count, for pointers with room for a second chip. On
              touch it is already inside the name pill — a phone in
              landscape is wide enough to pass `sm` and would otherwise
              show the same number twice. */}
          <span
            className={`glass items-center gap-2 px-3 py-2 text-xs text-muted shadow-float ${
              coarse ? "hidden" : "hidden sm:flex"
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-block h-2 w-2 rounded-full ${
                presence.online ? "bg-verify" : "bg-line"
              }`}
            />
            {presence.online
              ? `${presence.count} here`
              : "solo preview — floor server offline"}
          </span>
          {coarse && (
            <button
              type="button"
              aria-pressed={minimapOn}
              aria-label="Toggle the map"
              onClick={() => {
                const next = !minimapOn;
                setMinimapOn(next);
                handleRef.current?.setMinimap(next);
              }}
              className={`glass min-h-[44px] min-w-[44px] px-3 text-xs shadow-float ${
                minimapOn ? "text-ink" : "text-muted"
              }`}
            >
              map
            </button>
          )}
          {coarse && (
            <button
              type="button"
              onClick={() => setHelpOpen((v) => !v)}
              aria-expanded={helpOpen}
              aria-label="Help"
              className="glass min-h-[44px] min-w-[44px] text-sm text-muted shadow-float"
            >
              ?
            </button>
          )}
          <Link
            href="/lobby"
            className={`glass px-3 text-xs text-ink shadow-float hover:bg-paper ${
              coarse ? "flex min-h-[44px] items-center" : "py-2"
            }`}
          >
            Leave
          </Link>
        </div>
      </div>

      {/* Touch help panel. The fine-pointer one hangs off the "?" in the
          bottom row; on a phone that button lives up top, so the panel does
          too — anchored under it rather than floating over the reactions. */}
      {coarse && helpOpen && (
        <div className="pointer-events-auto absolute right-3 top-16 z-30 w-64 max-w-[calc(100vw-24px)]">
          <div className="glass p-3 text-xs leading-relaxed text-muted shadow-float">
            <div className="flex items-baseline justify-between gap-2">
              <p className="micro text-ink">Controls</p>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="micro -my-2 min-h-[44px] px-2 text-muted"
              >
                close
              </button>
            </div>
            {controls.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="mt-1.5 border-t border-line pt-1.5">
              Quests live top-left. Finish them for reactions and titles.
            </p>
          </div>
        </div>
      )}

      {/* Quest tracker — the single "what should I do?" surface (the ticker
          lives in the chat panel's header, and the tour is its own card).

          HIDDEN WHILE THE TOUR IS RUNNING. Both of them answer the same
          question, and on a phone they answered it on top of each other:
          the centred tour card landed across a quest chip wide enough to
          reach it. One instruction at a time is the whole idea of a tour.

          The ticket balance also stands down on a phone in landscape,
          where the visible page is barely 300px tall and a wallet readout
          is the least of what somebody needs to see. */}
      {state.tutorialDone && (
        <div className="pointer-events-none absolute left-3 top-24 flex flex-col items-start gap-2 sm:top-16">
          <QuestPanel quests={quests} />
          <Link
            href="/profile#tickets"
            className={`glass pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 text-xs text-gold-deep shadow-float hover:bg-paper ${
              device.landscapePhone ? "hidden" : ""
            }`}
            title="Your ticket balance — spend it on booth styles and props"
          >
            <TicketIcon /> {walletBalance(state).toLocaleString("en-US")} tickets
          </Link>
        </div>
      )}

      {/* incoming connection DM — pixel mail, top right, click to open */}
      <MailToast
        toast={
          mailToast && {
            ...mailToast,
            company: inbox.connections.find((c) => c.peerId === mailToast.peerId)
              ?.peerStartup,
          }
        }
        onOpen={openSocialFromToast}
        onDismiss={() => setMailToast(null)}
      />

      {/* incoming connection request — their card, front and center */}
      {incomingReq && (
        <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 sm:top-16">
          <RequestCard
            compact
            req={incomingReq}
            onRespond={(accept) => {
              const from = incomingReq.from;
              setIncomingReq(null);
              void respondToRequest(
                state.profile.id,
                state.profile.name,
                from.id,
                accept,
                state.myStartup?.name,
              ).then(() => refreshInbox());
              if (accept) {
                // Mirror the mutual connection into the local store so quests
                // and calling-card counts include real people, not just NPCs.
                actions.addConnection({
                  startupId: from.startupName ? `claim:${from.id}` : undefined,
                  name: from.startupName ?? from.name,
                  founder: from.name,
                  floorId: floor.id,
                  peerId: from.id,
                });
              }
              showToast(
                accept
                  ? `Connected with ${from.name}. Chat lives in Connections.`
                  : "Declined, quietly.",
              );
            }}
          />
        </div>
      )}

      {/* A stall, open over the hall. The game keeps running behind it and
          the player keeps standing where they were — closing puts you back
          in the room rather than reloading the floor. */}
      {openStall && (
        <StallPanel
          sign={openStall.sign}
          keeper={openStall.keeper}
          blurb={openStall.blurb}
          color={openStall.color}
          onClose={() => {
            setOpenStall(null);
            setArcadeRoom("hub");
          }}
          onFocusChange={handleFocusChange}
          wide={openStall.action === "arcade"}
        >
          {openStall.action === "tickets" && <TicketStall state={state} />}
          {openStall.action === "register" && <RegisterStall booths={hallBooths} />}
          {openStall.action === "porter" && (
            <PorterStall floorId={floor?.id ?? ""} presence={floorCounts} tier={state.sub} />
          )}
          {openStall.action === "arcade" && arcadeRoom === "parkour" && (
            <Parkour
              look={state.profile.look}
              bests={state.parkourBests ?? {}}
              capLeft={Math.max(0, 60 - arcadeWonToday)}
              onFinish={(mapId, st, tickets) =>
                actions.finishParkour(mapId, st.time, tickets)
              }
              onExit={() => setArcadeRoom("hub")}
            />
          )}
          {openStall.action === "arcade" && arcadeRoom === "quiz" && (
            <QuizRoom
              quizzes={quizzes}
              balance={walletBalance(state)}
              capLeft={Math.max(0, 60 - arcadeWonToday)}
              authorName={state.profile.name}
              onPublish={(q) => {
                if (!actions.publishQuiz(q)) {
                  showToast("Not enough tickets to publish that.");
                }
              }}
              onDelete={(id) => actions.deleteQuiz(id)}
              onPayout={(tickets) => actions.earnArcade(tickets, 0)}
              onExit={() => setArcadeRoom("hub")}
            />
          )}
          {openStall.action === "arcade" && arcadeRoom === "hub" && (
            <Arcade
              wonToday={arcadeWonToday}
              hallRecord={state.arcadeBest ?? null}
              onPayout={(tickets, total) => actions.earnArcade(tickets, total)}
              extra={
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setArcadeRoom("parkour")}
                    className="rounded-lg border border-line px-4 py-3 text-left transition-colors hover:border-accent hover:bg-paper"
                  >
                    <span className="font-display text-lg leading-tight">After Hours</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">
                      Four parkour maps across the scaffolding, played as your own
                      character. Collect tickets on the way.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setArcadeRoom("quiz")}
                    className="rounded-lg border border-line px-4 py-3 text-left transition-colors hover:border-accent hover:bg-paper"
                  >
                    <span className="font-display text-lg leading-tight">The Quiz Room</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">
                      Buzzer quizzes on business. Play the shipped ones, or write
                      your own and put it in the room.
                    </span>
                  </button>
                </div>
              }
            />
          )}
          {openStall.action === "editor" &&
            (myStartup ? (
              <EditStandPanel
                startup={myStartup}
                state={state}
                onBuy={actions.buyItem}
                onApply={applyStandLive}
                onSave={handleEditSave}
                onClose={() => setOpenStall(null)}
                onFocusChange={handleFocusChange}
              />
            ) : (
              <p className="text-sm leading-relaxed text-muted">
                Nothing to repaint yet — put a stand up first and Alder will
                gladly do the sign for it.
              </p>
            ))}
        </StallPanel>
      )}

      {/* the hall guide, from the HUD */}
      {guideOpen && (
        <StallPanel
          sign="WHERE TO GO"
          keeper="The hall"
          blurb="What is in this room and how to find it."
          color="#B08D2E"
          onClose={() => setGuideOpen(false)}
          onFocusChange={handleFocusChange}
        >
          <GuideStall />
        </StallPanel>
      )}

      {/* merchant hint — same pill as a booth's, one rung lower priority:
          a stand you are standing at always wins the prompt */}
      {!nearBooth && nearMerchant && !activeBooth && (
        <div className="pointer-events-none absolute bottom-44 left-1/2 -translate-x-1/2 sm:bottom-24">
          <button
            type="button"
            onClick={() => useMerchant(nearMerchant)}
            className="glass pointer-events-auto px-3 py-1.5 text-sm shadow-float"
          >
            {controls.interactKey && (
              <kbd className="micro mr-2 rounded-sm border border-line px-1 py-0.5 text-muted">
                {controls.interactKey}
              </kbd>
            )}
            <span className="font-medium">{nearMerchant.sign}</span>
            <span className="ml-2 text-muted">{nearMerchant.blurb}</span>
          </button>
        </div>
      )}

      {/* interact hint */}
      {nearBooth && !activeBooth && (
        <div className="pointer-events-none absolute bottom-44 left-1/2 -translate-x-1/2 sm:bottom-24">
          <span className="glass px-3 py-1.5 text-sm shadow-float">
            {controls.interactKey && (
              <kbd className="micro mr-2 rounded-sm border border-line px-1 py-0.5 text-muted">
                {controls.interactKey}
              </kbd>
            )}
            {nearBooth.startup
              ? nearBooth.isYours
                ? "your stand"
                : coarse
                  ? `tap to talk to ${nearBooth.startup.name}`
                  : `talk to ${nearBooth.startup.name}`
              : "open stand"}
          </span>
        </div>
      )}

      {/* booth card — bounded at the bottom so a tall panel (the stand
          editor on a phone) ends above the emote bar and the chat strip
          instead of running its last controls off the screen */}
      {activeBooth && (
        <div className="pointer-events-none absolute bottom-28 right-3 top-16 flex flex-col items-end justify-start sm:bottom-3">
          {activeBooth.startup && activeBooth.isYours && editingStand && myStartup ? (
            <EditStandPanel
              startup={myStartup}
              state={state}
              onBuy={actions.buyItem}
              onApply={applyStandLive}
              onSave={handleEditSave}
              onClose={() => setEditingStand(false)}
              onFocusChange={handleFocusChange}
            />
          ) : activeBooth.startup ? (
            <BoothCard
              // A live player's stand carries its own startup data — never
              // resolve it through the local startups map, where every
              // client's own startup shares the same id.
              startup={
                activeBooth.ownerId && !activeBooth.isYours
                  ? activeBooth.startup
                  : startups[activeBooth.startup.id] ?? activeBooth.startup
              }
              isYours={activeBooth.isYours}
              live={
                Boolean(activeBooth.ownerId) &&
                !activeBooth.isYours &&
                activeBooth.ownerOnline !== false
              }
              ownerAway={
                Boolean(activeBooth.ownerId) &&
                !activeBooth.isYours &&
                activeBooth.ownerOnline === false
              }
              connected={
                activeBooth.ownerId && !activeBooth.isYours
                  ? inbox.connections.some((c) => c.peerId === activeBooth.ownerId)
                  : connectedIds.has(activeBooth.startup.id)
              }
              pending={
                Boolean(activeBooth.ownerId) &&
                !activeBooth.isYours &&
                inbox.outgoing.includes(activeBooth.ownerId ?? "")
              }
              onConnect={() =>
                activeBooth.startup &&
                handleConnect(
                  activeBooth.startup,
                  activeBooth.isYours ? undefined : activeBooth.ownerId,
                )
              }
              onChat={() => activeBooth.startup && openNpcThread(activeBooth.startup)}
              onUnclaim={activeBooth.isYours ? handleUnclaim : undefined}
              onEdit={
                activeBooth.isYours && myStartup ? () => setEditingStand(true) : undefined
              }
              onClose={() => setActiveBooth(null)}
              guestbook={
                guestbookKey
                  ? {
                      net: netRef.current,
                      floorId: floor.id,
                      boothKey: guestbookKey,
                      onFocusChange: handleFocusChange,
                      onSigned: actions.recordSigned,
                    }
                  : undefined
              }
            />
          ) : (
            <OpenStandCard
              floorName={floor.name}
              hasStartup={Boolean(myStartup)}
              claimedElsewhere={state.claims[floor.id] !== undefined}
              claimedOtherFloor={
                // relocation only applies between real floors — practice
                // claims in the tutorial hall don't move anything
                floor.id !== PRACTICE_FLOOR_ID &&
                Object.keys(state.claims).some(
                  (fid) => fid !== floor.id && fid !== PRACTICE_FLOOR_ID,
                )
              }
              onClaim={() => handleClaim(activeBooth)}
              onClose={() => setActiveBooth(null)}
            />
          )}
        </div>
      )}

      {/* alone in the hall — the one screen that decides whether a first
          visit becomes a second one */}
      {quietShown && !quietDismissed && floor && (
        <div className="pointer-events-none absolute bottom-44 left-1/2 flex -translate-x-1/2 justify-center sm:bottom-20 sm:left-3 sm:translate-x-0 sm:justify-start">
          <QuietFloorCard
            floorName={floor.name}
            hasStand={Object.keys(state.claims).length > 0}
            onClose={() => setQuietDismissed(true)}
          />
        </div>
      )}

      {/* tutorial coach — one instruction at a time, above the bottom HUD */}
      {!state.tutorialDone && (
        /* Sits on the bottom rail, above the reaction row, and never in the
           middle of the room. In landscape the page is ~300px tall, so a
           card floating at the vertical centre covers the floor it is
           telling you to walk on. */
        <div className="pointer-events-none absolute inset-x-3 bottom-40 flex justify-center sm:inset-x-auto sm:bottom-20 sm:left-1/2 sm:-translate-x-1/2">
          <TutorialCoach
            done={state.onboarding}
            device={device}
            onSkip={() => actions.setTutorialDone(true)}
          />
        </div>
      )}

      {/* bottom HUD: chat (left), emotes (center), help (right).
          w-full + items-stretch on phones: the reaction row plus the map
          toggle is wider than a 390px screen, and a centred row that wide
          hangs off BOTH edges — stretching it to the container instead lets
          the bar scroll inside its own width. */}
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col items-stretch gap-2 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div className="order-3 flex w-full justify-start sm:order-none sm:w-auto">
          <ChatPanel
            tab={tab}
            onTab={handleTab}
            floorMsgs={floorMsgs}
            threads={openThreads}
            myIds={myIds}
            onSend={handleSend}
            onFocusChange={handleFocusChange}
            onConnect={connectThreadKey}
            onClose={closeThread}
            onToggleMute={toggleMute}
            onReport={reportPeer}
            collapsed={chatCollapsed}
            onCollapsedChange={setChatCollapsed}
            ticker={activity.length ? activity[activity.length - 1].text : undefined}
          />
        </div>
        {/* min-w-0 + the bar's own horizontal scroll: eight 44px reaction
            buttons plus the map toggle are wider than a 390px phone, and
            without this the row was silently clipped at the left edge */}
        {/* On a phone the reaction row owns this line ALONE. Eight buttons
            plus a map toggle plus a help button do not fit across 360px,
            and the row silently scrolled — three reactions existed that
            nobody could see. Map and help move up to the top-right cluster
            instead, where phone chrome belongs. */}
        <div className="order-2 flex min-w-0 items-stretch justify-center gap-2 sm:order-none">
          <EmoteBar onEmote={handleEmote} unlocked={emotes} />
          {/* Fine pointers keep help down here with the other controls; on
              touch it lives in the top-right cluster, see above. */}
          <div className={`relative ${coarse ? "hidden" : ""}`}>
            {helpOpen && (
              <div className="glass pointer-events-auto absolute bottom-10 right-0 w-56 p-3 text-xs leading-relaxed text-muted shadow-float">
                <p className="micro mb-1.5 text-ink">Controls</p>
                {controls.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p className="mt-1.5 border-t border-line pt-1.5">
                  Quests live top-left. Finish them for reactions and titles.
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setHelpOpen((v) => !v)}
              aria-expanded={helpOpen}
              aria-label="Help"
              className={`glass pointer-events-auto shrink-0 text-sm text-muted shadow-float hover:text-ink ${
                coarse ? "h-11 w-11" : "h-9 w-9"
              }`}
            >
              ?
            </button>
          </div>
        </div>
      </div>

      {/* hover card — desktop pointer only by nature */}
      <HoverCard target={hover} startups={startups} />

      {/* tutorial graduation: the full ceremony at the end of the practice
          round — portaled to <body>, so the page's stacking context can't
          trap it under the game chrome */}
      {gradPanel && (
        <GraduationCeremony
          onClose={() => setGradPanel(false)}
          onBurst={() => setBurst((b) => b + 1)}
        />
      )}

      <ConfettiBurst burstId={burst} />
      <Toast toast={toast} />
    </div>
  );
}
