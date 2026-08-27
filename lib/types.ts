/**
 * FounderFloor — shared contracts.
 * Every module (game engine, net layer, UI, data) compiles against this file.
 * Keep it dependency-free.
 */

// ---------- movement / avatars ----------

export type Dir = "up" | "down" | "left" | "right";

export interface MoveState {
  x: number; // world px
  y: number;
  dir: Dir;
  moving: boolean;
}

/** Indexes into the sprite palette tables in game/sprites.ts. */
export interface AvatarLook {
  skin: number; // 0..5
  outfit: number; // 0..7
  hair: number; // 0..7
}

export interface PlayerProfile {
  id: string; // stable local uuid, persisted
  name: string;
  look: AvatarLook;
  /** Short status line shown under the name label, e.g. "raising seed". <= 40 chars. */
  status?: string;
  /** Earned quest title shown on the hover card, e.g. "Connector". <= 24 chars. */
  title?: string;
}

/** One-key reactions, rendered as a pop bubble above the avatar.
 * The first five are always available; the last three are quest rewards
 * (see lib/data/quests.ts). */
export type EmoteKind =
  | "wave"
  | "laugh"
  | "clap"
  | "heart"
  | "question"
  | "rocket"
  | "fire"
  | "handshake";
export const EMOTES: { kind: EmoteKind; char: string; label: string; key: string }[] = [
  { kind: "wave", char: "👋", label: "Wave", key: "1" },
  { kind: "laugh", char: "😂", label: "Laugh", key: "2" },
  { kind: "clap", char: "👏", label: "Clap", key: "3" },
  { kind: "heart", char: "❤️", label: "Heart", key: "4" },
  { kind: "question", char: "❓", label: "Question", key: "5" },
  { kind: "rocket", char: "🚀", label: "Rocket", key: "6" },
  { kind: "fire", char: "🔥", label: "Fire", key: "7" },
  { kind: "handshake", char: "🤝", label: "Handshake", key: "8" },
];

// ---------- ranks ----------

export type RankId = 0 | 1 | 2 | 3 | 4;

export interface RankDef {
  id: RankId;
  name: string;
  /** Minimum verified monthly revenue (USD) to hold this rank. */
  minRevenue: number;
  color: string; // hex used for the badge
  blurb: string; // one dry sentence shown in tooltips
}

// ---------- startups & booths ----------

export type GlyphId =
  | "bolt"
  | "leaf"
  | "coin"
  | "chip"
  | "flask"
  | "rocket"
  | "heart"
  | "cube"
  | "wave"
  | "star";

export type CarpetPattern = "solid" | "border" | "stripes";

/** Decorative band along the banner's bottom edge; absent = "plain". */
export type BannerTrim = "plain" | "stripes" | "checker" | "dots";

/**
 * Booth architecture — structurally different builds, not palette swaps.
 * "classic" is the free stall everyone starts with; the rest are bought
 * with tickets (see lib/data/shop.ts). Every style keeps the same 4x3
 * footprint and banner/lane/counter convention, so collision, claiming,
 * and interaction never change — only what the hall sees.
 */
export type BoothStyle = "classic" | "bigtop" | "garden" | "arcade" | "neon";

/** Equippable booth accessories (max 3 at once), bought with tickets. */
export type BoothProp = "plant" | "balloons" | "trophy" | "spotlight";

export interface BoothTheme {
  carpet: string; // hex
  banner: string; // hex
  sign: string; // short text on the banner, <= 12 chars
  glyph: GlyphId;
  /** Carpet treatment; absent = "solid" (all seed booths). */
  pattern?: CarpetPattern;
  /** Banner edge treatment; absent = "plain". */
  trim?: BannerTrim;
  /** Booth architecture; absent = "classic". */
  style?: BoothStyle;
  /** Equipped accessories, max 3; absent = none. */
  props?: BoothProp[];
  /**
   * Custom banner icon: a tiny data-URL PNG (uploads are downscaled to 16x16
   * client-side, capped at ~8KB). Replaces the glyph when present.
   */
  logo?: string;
}

export interface DialogueScript {
  greeting: string;
  /** Keyword-matched replies; first topic whose keyword appears in the message wins. */
  topics: { keywords: string[]; reply: string }[];
  fallback: string;
  connectReply: string;
}

export interface Startup {
  id: string;
  name: string;
  oneLiner: string;
  pitch: string; // 2-3 sentences, shown in the booth card
  founder: string; // rep standing at the booth
  founderLook: AvatarLook;
  category: string;
  goal: string; // human-readable goal, e.g. "Reach $5k MRR"
  goalProgress: number; // 0..1 verified progress toward the goal
  verifiedRevenue: number; // monthly USD, drives rank; 0 = unverified
  seekingCofounder: boolean;
  /**
   * Where to find the thing itself. Optional, http(s) only, and rebuilt by
   * sanitizeLink() on the server before it is ever stored.
   *
   * This is the one field on the site that puts a STRANGER'S URL in front
   * of a visitor, so anything rendering it owes them the full set:
   * rel="nofollow ugc noopener noreferrer", target="_blank", and the host
   * shown in the label so nobody clicks blind.
   */
  link?: string;
  /**
   * The owner's paid plan at save time — drives the visibility perks
   * (directory/board priority, tags, Founder+ gold stand trim). Absent for
   * free members and all seed startups.
   */
  tier?: "pro" | "founder";
  /**
   * A sample stand shipped with the hall, not a company anybody runs.
   *
   * These exist so a young floor reads as a trade show rather than a car
   * park. Everything that could mislead somebody is gated on this flag:
   * the booth wears a SAMPLE tag in its corner and the booth card says so
   * in as many words. They are also structurally absent from /directory,
   * which lists only stands the server has registered — a made-up company
   * must never appear on a public, indexed page beside real ones, and the
   * safest way to guarantee that is for it to have no route there at all.
   */
  demo?: boolean;
  /** Absent for user-created startups — replyFor() falls back to generic replies. */
  dialogue?: DialogueScript;
  booth: BoothTheme;
}

export interface BoothInstance {
  /** Top-left tile of the 4x3 booth zone, with which way it opens. */
  spot: { x: number; y: number; face?: "up" | "down" };
  /** Index into floor.boothSpots — the identity claims currently travel under. */
  // TODO(spot-id): carry the spot's permanent id here and resolve via spotById.
  spotIndex: number;
  /** null = vacant stand, open to claim. */
  startup: Startup | null;
  isYours: boolean;
  /** Profile id of the player whose claimed stand this is (unset for seed booths). */
  ownerId?: string;
  ownerName?: string;
  /** For owned stands: false = the owner has left the floor (stand is "away"). */
  ownerOnline?: boolean;
}

/** A player's claim on a floor spot, carried over the wire. */
export interface BoothClaim {
  // TODO(spot-id): wire format — still an index. Migrating stored claims to
  // BoothSpot.id is a separate job; do not change this shape piecemeal.
  spotIndex: number;
  startup: Startup;
}

// ---------- floors (the "servers" you join) ----------

export type SubTier = "free" | "pro" | "founder";

export const TIER_ORDER: Record<SubTier, number> = { free: 0, pro: 1, founder: 2 };

/** Pitch quality bands for booth spots — will drive price and display. */
export type SpotTier = "gold" | "silver" | "bronze";

/**
 * One pitch on a floor: the top-left tile of a 4x3 booth zone.
 *
 * `face` is which way the stand OPENS: "down" (the default) puts the
 * counter on the zone's bottom row and the carpet apron below it; "up"
 * mirrors the rows — counter on top, apron above, sign wall at the bottom.
 * Two rows of stands facing each other across an aisle runner is what
 * turns a carpet with backs on one side into a shopping street.
 */
export interface BoothSpot {
  /** Stable identity. Never reused, never renamed once shipped. */
  id: string;
  x: number;
  y: number;
  face?: "up" | "down";
  /** Pitch quality — drives price and display. Absent = "bronze". */
  tier?: SpotTier;
}

export interface FloorDef {
  id: string;
  name: string;
  tagline: string;
  tier: SubTier; // minimum subscription tier required to enter
  width: number; // tiles
  height: number; // tiles
  theme: {
    floorA: string; // checker tile A
    floorB: string; // checker tile B
    wall: string;
    trim: string;
  };
  /** Tile the player arrives on. Falls back to bottom-centre. */
  spawn?: { x: number; y: number };
  /**
   * The floor's pitches. Every spot carries a permanent `id` — that is the
   * identity a spot should be addressed by (spotById in lib/data/floors.ts).
   * Claims still travel and persist as an INDEX into this array, so until
   * they migrate, order remains identity too: append, never reorder.
   */
  boothSpots: BoothSpot[];
  /** Hidden floors (the tutorial hall) are reachable by URL but not listed in the lobby. */
  hidden?: boolean;
  /** Assigned to boothSpots in order; may be shorter than boothSpots. */
  startupIds: string[];
  /**
   * Which boothSpots indices the seeded startups occupy, in order.
   *
   * Without this, seeds fill from index 0 and take whichever spots happen
   * to be first in the array — which on a hall ordered best-spot-first
   * means the demo stands would sit in the prime places on the plaza and
   * real founders would get the back rows. Listing the indices explicitly
   * keeps the good spots for people.
   */
  seedSpots?: number[];
  /** Index into boothSpots reserved for the local user's own booth, if any. */
  reservedSpot?: number;
  /**
   * A set-dressed centrepiece: paved plaza, a fountain in the middle of it,
   * and avenues running out to the walls. Everything here is decoration
   * except the fountain, which is solid — you walk around it, like a
   * roundabout. Floors without a plaza render exactly as they did before.
   */
  plaza?: PlazaDef;
  /**
   * How many ambient hall staff wander this floor (game/wanderers.ts).
   *
   * Ships UNSET everywhere, which is the same as zero: nobody is in a hall
   * unless they walked in. The mechanism is kept because the code is
   * written and tested and a future floor may want an attendant — but
   * switching it on anywhere the public can reach puts figures in a room
   * that are not people. Read the note above the Main Hall's startupIds in
   * lib/data/floors.ts before doing that.
   */
  ambientBots?: number;
}

/** Inclusive tile bounds. */
export interface TileRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * A piece of hall furniture. Widths live in one table in game/decor.ts so a
 * layout only ever names a kind and a corner tile.
 */
export type DecorKind =
  | "planter"
  | "lamp"
  | "stanchion"
  | "table"
  | "kiosk"
  | "tree"
  | "sofa"
  | "bar"
  | "board"
  | "crates"
  | "sign"
  | "bench";

export interface DecorItem {
  kind: DecorKind;
  x: number;
  y: number;
  /** Wayfinding text; only "sign" reads it. */
  label?: string;
}

export interface PlazaDef {
  /** The paved area. Walkable; painted over the hall floor. */
  rect: TileRect;
  /**
   * The fountain's footprint. Solid, must sit inside `rect`, and the art
   * centres the basin inside it — so to centre the fountain in the plaza,
   * centre this rect in `rect`.
   */
  fountain: TileRect;
  /** Walkways out of the plaza. Paved, and kept clear of ambient props. */
  avenues: TileRect[];
  /** Overhead entrance sign, hung across the top edge of this rect. */
  arch?: TileRect;
  /**
   * Carpeted aisles laid over the hall floor between the banks of stands.
   * Decoration only — they never block anything.
   */
  runners?: TileRect[];
  /** Everything standing on the floor, by kind and top-left tile. */
  furniture?: DecorItem[];
  /**
   * Merchant stalls: solid, three tiles wide, and the one kind of decor you
   * can walk up to and use. They put the shop, the stand editor and the
   * records board in the hall itself instead of only in a menu.
   */
  merchants?: MerchantDef[];
}

/** What a merchant stall does when you press the interact key at it. */
export type MerchantAction =
  | "tickets"
  | "editor"
  | "register"
  | "porter"
  | "arcade"
  | "records";

export interface MerchantDef {
  id: string;
  /** Top-left tile. Three tiles wide, one deep; faces down like a booth. */
  x: number;
  y: number;
  action: MerchantAction;
  /** Name on the stall's sign board, <= 16 chars. */
  sign: string;
  /** The keeper's name on their label. Ignored by a board. */
  keeper: string;
  /** One line, shown on the prompt when you are standing at the stall. */
  blurb: string;
  /** Awning and sign colour. */
  color: string;
  /**
   * The keeper's look, so each stall has a different person behind it.
   * Absent for a board — nobody stands behind a notice board.
   */
  look?: AvatarLook;
  /**
   * How it is built. "stall" (the default) is an awning, a counter and a
   * keeper. "board" is a framed notice board on two legs with live rows
   * painted on it: you read it from across the plaza and press E for the
   * whole table.
   */
  style?: "stall" | "board";
  /**
   * Which leaderboard a board shows. Set by the floor page each time the
   * standings are fetched — see GameHandle.setBoard.
   */
  board?: "time" | "connections" | "parkour" | "arcade";
}

/** One line painted on a notice board: a rank, a name and a figure. */
export interface BoardRow {
  rank: number;
  name: string;
  value: string;
}

// ---------- chat ----------

export interface ChatMsg {
  id: string;
  fromId: string; // player id, or "npc:<startupId>"
  from: string; // display name
  text: string;
  ts: number;
  scope: "floor" | "dm";
  /** For dm: the other party (peer) id from the local player's perspective. */
  peerId?: string;
}

// ---------- net ----------

export interface RemotePlayer {
  id: string;
  name: string;
  look: AvatarLook;
  s: MoveState;
  status?: string;
  title?: string;
}

/** A guestbook entry left at a booth. */
export interface GuestbookEntry {
  from: string; // display name
  text: string;
  ts: number;
}

/** One line in the floor's ambient activity ticker. */
export interface ActivityItem {
  id: string;
  text: string; // pre-rendered, e.g. `Ada claimed a stand` / `Grace signed Soup Ticket's guestbook`
  ts: number;
}

// ---------- social graph (server-side: requests, mutual connections, DMs) ----------

/**
 * The requester's calling card, shown to the recipient before accept/decline.
 * Client-attested (this demo has no auth) — the server caps lengths only.
 */
export interface ProfileCard {
  id: string; // profile id
  name: string;
  title?: string;
  status?: string;
  badges: string[]; // badge ids, capped
  connections: number;
  startupName?: string;
  /** Verified monthly revenue of their startup (drives the rank badge). */
  startupRevenue?: number;
  floorsVisited: number;
}

export interface ConnectRequest {
  from: ProfileCard;
  ts: number;
}

/** An accepted, mutual connection stored on the server. */
export interface SocialConnection {
  peerId: string;
  peerName: string;
  /** Their startup's name at connect time, when they had one — shown in chat lists. */
  peerStartup?: string;
  ts: number;
}

export interface DmMessage {
  fromId: string;
  text: string;
  ts: number;
}

/**
 * GET /social?me=<profileId> on the floor server returns this. Threads exist
 * only between connected profiles, trimmed to the last 100 messages.
 */
export interface InboxData {
  requests: ConnectRequest[];
  /** Profile ids this user has requested (pending on their side). */
  outgoing: string[];
  connections: SocialConnection[];
  threads: Record<string, DmMessage[]>;
}

export type NetEvent =
  | {
      t: "welcome";
      selfId: string;
      players: RemotePlayer[];
      booths: RemoteBooth[];
      /** Recent ticker items for this floor, oldest first. */
      activity: ActivityItem[];
    }
  | { t: "player_join"; player: RemotePlayer }
  | { t: "player_move"; id: string; s: MoveState }
  | { t: "player_leave"; id: string }
  | { t: "booth_set"; ownerId: string; ownerName: string; online: boolean; claim: BoothClaim }
  | { t: "booth_clear"; ownerId: string }
  /**
   * Sent only to a claimant: the spot was already taken, or (reason
   * "elsewhere") a join re-raised a stale claim while the founder's one
   * stand lives on another floor — correct the local claim to the stand's
   * true location (standFloorId/standSpotIndex), don't relocate.
   */
  | {
      t: "booth_denied";
      spotIndex: number;
      /**
       * "elsewhere"  your one stand already lives on another floor
       * "prohibited" the stand's own text was refused, not the spot
       * "reserved"   held by a founder who isn't on the floor right now
       * "taken"      someone is standing there
       */
      reason?: "elsewhere" | "prohibited" | "reserved" | "taken";
      standFloorId?: string;
      standSpotIndex?: number;
    }
  /** A player fired a reaction; also echoed to the sender. */
  | { t: "emote"; id: string; kind: EmoteKind }
  /** A new guestbook entry landed at a booth (broadcast to the floor). */
  | { t: "guestbook"; key: string; entry: GuestbookEntry }
  /** One new ticker line (broadcast to the floor). */
  | { t: "activity"; item: ActivityItem }
  /** Someone wants to connect with YOU (pushed if you're online anywhere). */
  | { t: "connect_request"; req: ConnectRequest }
  /** Your outgoing request was accepted. */
  | { t: "connect_accept"; peerId: string; peerName: string }
  /**
   * A connection DM (the off-floor kind), pushed live to BOTH parties'
   * sockets on every floor — so a message sent from the Connections screen
   * pops up wherever the other person is.
   */
  | { t: "social_dm"; from: string; fromName: string; to: string; toName: string; text: string; ts: number }
  | { t: "chat"; msg: ChatMsg }
  | { t: "status"; online: boolean; count: number }
  /**
   * Client-synthesized (never sent by the server as a frame): the server
   * closed this connection with code 4001 because the same identity joined
   * the floor again — from another tab, window, or device. The transport
   * goes terminal (no reconnect; reconnecting would just kick the newer
   * session back and ping-pong forever) and the page shows a takeover UI.
   */
  | { t: "replaced" }
  /**
   * The floor is at its occupancy cap. Sent once to a refused joiner
   * before the server closes with code 4008; the transport goes terminal
   * (like "replaced") and the page shows the full-hall card, which owns
   * the retry via GET /full. People already in the room never see this.
   */
  | { t: "floor_full"; count: number; cap: number };

export interface RemoteBooth {
  /** The owner's stable profile id (not the per-connection wire id). */
  ownerId: string;
  ownerName: string;
  /** False = the stand is up but its owner has left the floor ("away"). */
  online: boolean;
  claim: BoothClaim;
}

/**
 * Transport to the floor server. lib/net.ts exports
 * `createNetClient(wsUrl?: string): NetClient` (default ws://localhost:3001).
 * If the socket can't connect it stays silently offline: `online` is false,
 * sends are no-ops, and a {t:"status", online:false, count:1} event fires —
 * the game then runs single-player with NPC founders only.
 */
export interface NetClient {
  readonly online: boolean;
  readonly selfId: string;
  connect(floorId: string, me: PlayerProfile, spawn: MoveState, claim?: BoothClaim): void;
  disconnect(): void;
  sendMove(s: MoveState): void;
  sendChat(text: string, scope: "floor" | "dm", peerId?: string): void;
  /** Claim (or move) this player's stand; the server relays booth_set to the room. */
  sendBoothSet(claim: BoothClaim): void;
  /** Pack up this player's stand; the server relays booth_clear to the room. */
  sendBoothClear(): void;
  /** Fire a reaction; the server broadcasts it (echo included). */
  sendEmote(kind: EmoteKind): void;
  /**
   * Sign a booth's guestbook. key = `spot:${spotIndex}` for claimed stands, or
   * the startup id for seed booths. boothName (<= 40 chars) is the booth's
   * display name — the server embeds it in the activity ticker line.
   */
  sendSign(key: string, text: string, boothName?: string): void;
  /** Report a player (stored server-side for the operator; rate-limited). */
  sendReport(targetId: string, reason: string): void;
  /** Subscribe to events; returns an unsubscribe function. */
  on(cb: (ev: NetEvent) => void): () => void;
}

/**
 * The floor server also speaks HTTP on the same port (CORS: *):
 *   GET /presence            -> { floors: Record<floorId, number> }
 *   GET /guestbook?floor=ID&key=KEY -> { entries: GuestbookEntry[] } (newest first, <= 50)
 * lib/net.ts exports `httpBase(): string` returning e.g. "http://host:3001"
 * (derived the same way as the ws URL; usable only in the browser).
 */

// ---------- game engine ----------

/** What the pointer is over, for the hover card. Screen coords are CSS px in the canvas. */
export type HoverTarget =
  | { kind: "player"; id: string; name: string; status?: string; title?: string; x: number; y: number }
  | { kind: "npc"; startupId: string; name: string; x: number; y: number }
  | { kind: "booth"; booth: BoothInstance; x: number; y: number };

export interface GameCallbacks {
  /** Fired when the player enters/leaves a booth's interaction zone (null = left). */
  onNearBooth(b: BoothInstance | null): void;
  /** Fired when the player presses E/Enter or clicks/taps the nearby booth. */
  onInteract(b: BoothInstance): void;
  /** Presence updates for the HUD. count includes yourself; online = ws connected. */
  onPresence(count: number, online: boolean): void;
  /** Pointer hover target changed (throttled; null = nothing hovered). */
  onHover?(target: HoverTarget | null): void;
  /** A remote player's avatar was clicked/tapped (open a DM with them). */
  onPlayerClick?(player: { id: string; name: string }): void;
  /** First-session progress: fired once per action kind ("move" | "emote"). */
  onFirstAction?(kind: "move" | "emote"): void;
  /** Entered/left a merchant stall's interaction ring (null = left). */
  onNearMerchant?(m: MerchantDef | null): void;
  /** Pressed the interact key, or tapped, at a merchant stall. */
  onMerchant?(m: MerchantDef): void;
}

export interface GameOptions {
  canvas: HTMLCanvasElement;
  floor: FloorDef;
  me: PlayerProfile;
  /** The user's own startup (also present in `startups`). */
  myStartup?: Startup;
  /** This player's claimed spot on this floor, if any; rendered as their stand. */
  myClaim?: BoothClaim;
  /** All startups by id (seed data + the user's own). */
  startups: Record<string, Startup>;
  /**
   * Ambient chatter per startup id: short in-voice lines their NPC founder
   * occasionally says in a bubble, so quiet floors still read as inhabited.
   */
  idleLines?: Record<string, string[]>;
  net: NetClient;
  cb: GameCallbacks;
}

/**
 * game/engine.ts exports `createGame(opts: GameOptions): GameHandle`.
 * The engine owns the canvas render loop, keyboard input, collision, camera,
 * NPC founders (wandering near their booths), remote player rendering, and
 * live claimed-booth updates (booth_set / booth_clear / player_leave).
 */
export interface GameHandle {
  destroy(): void;
  /** Disable movement keys while a text input is focused. */
  setInputEnabled(v: boolean): void;
  /** Update the local player's stand (claim, move, or null = pack up) and rebuild the floor. */
  setMyBooth(claim: BoothClaim | null): void;
  /** Fire a reaction: renders the bubble locally AND sends it over the wire. */
  emote(kind: EmoteKind): void;
  /**
   * Show a chat bubble above an entity. entityId: "me", a remote player's wire
   * id, or "npc:<startupId>". The UI calls this for its own sends and NPC
   * replies; the engine shows remote players' floor chat automatically.
   */
  showBubble(entityId: string, text: string): void;
  /** Toggle the minimap overlay (also bound to the M key in-game). */
  setMinimap(v: boolean): void;
  /**
   * Hand a notice board its rows. Called by the floor page after fetching
   * the standings, and again whenever they change — the engine has no
   * network of its own and boards start empty.
   */
  setBoard(id: string, rows: BoardRow[]): void;
  /** Hide chat bubbles from these wire ids (session-scoped mute list). */
  setMuted(ids: string[]): void;
  /**
   * Auto-walk the player up to a booth spot (index into floor.boothSpots),
   * e.g. deep-linked from the directory's "Walk there". Unknown indexes no-op.
   */
  // TODO(spot-id): accept a spot id once ?spot= deep links carry ids.
  walkToBooth(spotIndex: number): void;
}

// ---------- client persistence (lib/store.ts) ----------

export interface Connection {
  startupId?: string;
  name: string; // startup or person name at time of connecting
  founder?: string;
  ts: number;
  floorId: string;
  /**
   * Wire id of the live person behind this connection (live-claimed stands
   * and player DMs). Names collide; this is the dedupe key when present.
   */
  peerId?: string;
  /** Personal note ("met at demo night, follow up re: pricing"). */
  note?: string;
}

/** Tutorial steps, in teaching order (the guided tour advances through them). */
export type OnboardingStep = "move" | "interact" | "talk" | "emote" | "connect";
export const ONBOARDING_STEPS: OnboardingStep[] = ["move", "interact", "talk", "emote", "connect"];

/** Deed counters/sets that quests read (see lib/data/quests.ts). */
export interface QuestProgress {
  /** Distinct founders/players DM'd (startup ids and peer ids). */
  talkedTo: string[];
  /** Distinct guestbook keys signed. */
  signed: string[];
  /** Distinct floors entered. */
  floors: string[];
  /** Total reactions sent. */
  emotes: number;
}

/**
 * The ticket wallet — deliberately built from MONOTONIC parts so that
 * cross-device merges can always take max/union and no sequence of syncs
 * can mint, refund, or double-count tickets:
 *
 *   earned    cumulative tickets earned by playing (only ever grows)
 *   redeemed  cumulative PURCHASED tickets, as last reported by the
 *             server for this account (only ever grows; reset on
 *             identity switch — packs belong to the account)
 *   owned     bought shop item ids ("style:bigtop") — spend is DERIVED
 *             as the summed price of owned items, so two devices buying
 *             concurrently union their purchases and both deduct
 *   connHigh  connection-count high-water already paid for, so removing
 *             and re-adding a connection can't farm the bounty
 *
 * The spendable balance is computed: earned + redeemed - cost(owned).
 * See walletBalance() in lib/data/shop.ts.
 */
export interface Wallet {
  earned: number;
  redeemed: number;
  owned: string[];
  connHigh: number;
  /**
   * DEVICE-LOCAL sync bookkeeping (stripped from the synced blob): the
   * `earned` value the server last acknowledged from this device. A merge
   * folds `earned - earnedBase` (this device's unsynced earnings) on top
   * of the remote value — max() alone would silently discard the smaller
   * side's earnings (guest sign-in, concurrent devices).
   */
  earnedBase: number;
}

/** One weekly podium finish. See AppState.awards. */
export interface PodiumAward {
  /** e.g. "2026-W33" */
  week: string;
  /** "parkour" | "arcade" | "connections" | "time" */
  board: string;
  /** 1, 2 or 3. */
  rank: number;
  /** An unbuyable title, rolled when the week closed. */
  title: string;
  tickets: number;
}

export interface AppState {
  profile: PlayerProfile;
  sub: SubTier;
  wallet: Wallet;
  connections: Connection[];
  myStartup?: Startup;
  /** Claimed stand per floor: floorId -> boothSpots index. */
  // TODO(spot-id): persist the spot id instead of the index.
  claims: Record<string, number>;
  /** Completed tutorial steps. */
  onboarding: OnboardingStep[];
  /** True once the guided tour was finished or skipped. */
  tutorialDone: boolean;
  /** Earned badge ids (e.g. "first-steps", "demo-night"). */
  badges: string[];
  /** Quest deed tracking. */
  quest: QuestProgress;
  /** Quest ids whose rewards were already granted (so toasts fire once). */
  claimedQuests: string[];
  /** Local date (YYYY-MM-DD) of the last counted visit day. */
  lastVisitDay?: string;
  /** Quizzes this visitor wrote. Sanitised on every load and save. */
  quizzes?: unknown[];
  /** Best parkour time per map id, in seconds. */
  parkourBests?: Record<string, number>;
  /**
   * The arcade: which day `arcadeWon` refers to, how many tickets it has
   * paid you that day, and your best run total. The cap is enforced in the
   * store, not in the panel — a payout ceiling that only exists in the UI
   * is not a ceiling.
   */
  arcadeDay?: string;
  arcadeWon?: number;
  arcadeBest?: number;
  /**
   * Weekly podium finishes, granted by the floor server when a week closes
   * and re-sent on every pull. Folded in by week+board so applying the same
   * list twice is a no-op. The titles are not in the shop and there is no
   * other way to earn one.
   */
  awards?: PodiumAward[];
  /** Consecutive visit days, current and best-ever (drives the habit quest). */
  visitStreak: number;
  bestStreak: number;
  /** When THIS session first opened the app (ms). */
  lastSeenAt: number;
  /** When the PREVIOUS session ended (ms) — the "since you were away" mark. */
  prevSeenAt: number;
}

export const TILE = 32; // px per tile — single source of truth
