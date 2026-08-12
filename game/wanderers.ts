/**
 * FounderFloor — hall robots.
 *
 * These are the maintenance bots that keep the hall lit while it is quiet:
 * they walk the avenues, stop at the fountain, look at the empty stands,
 * and talk to each other about very little. An expo hall with nothing
 * moving in it reads as closed, and "closed" is the single fastest way to
 * lose somebody who has just arrived.
 *
 * THE HONESTY RULE, because it is easy to lose in a refactor:
 *   - they are drawn as robots (visor, chassis, antenna — see sprites.ts)
 *   - every label says "hall robot" under the name
 *   - their names are hardware, not people
 *   - their dialogue never claims to be a founder, and several lines say
 *     out loud that they aren't
 *   - they own no stand, appear in no directory, and are counted by nothing
 *     that reports how many people are here
 * Their population also SHRINKS as real people arrive (see setCrowd), so
 * the busier the hall genuinely is, the less of this there is.
 */

import { TILE } from "../lib/types";
import type { Dir, EmoteKind } from "../lib/types";
import { SPRITE_H, SPRITE_W } from "./sprites";
import type { AvatarFrames, RobotLook, SpriteBank } from "./sprites";
import { findPath } from "./path";
import type { TilePoint } from "./path";
import { hashStr, mulberry32 } from "./tilemap";

/** Hardware, not people. */
const NAMES = [
  "Rivet", "Bolt", "Gasket", "Sprocket", "Filament", "Grommet",
  "Ratchet", "Ferrule", "Cotter", "Dowel", "Shim", "Flange",
];

/**
 * Two-and-three-line exchanges, spoken alternately starting with whoever
 * opened. Written to be worth overhearing once and harmless the tenth time.
 */
const EXCHANGES: string[][] = [
  ["I have swept this square four times today.", "It was clean after the first.", "It was cleaner after the fourth."],
  ["Stand eleven is still open.", "Stand eleven has been open since we booted.", "I keep the light on anyway."],
  ["Fountain pressure is nominal.", "You say that every hour.", "It is nominal every hour."],
  ["Someone real walked past me earlier.", "How did it go?", "I waved. I think it went well."],
  ["Do you ever wonder what is behind the north wall?", "More wall.", "Right. More wall."],
  ["I have rehearsed my greeting.", "Let's hear it.", "'Welcome to the hall.'", "Needs work."],
  ["The banners want straightening.", "The banners are straight.", "The banners want straightening."],
  ["I counted the tiles again.", "Same number?", "Same number. Very reassuring."],
  ["We are not founders, you know.", "I know. We are the furniture that walks.", "I find that dignified."],
  ["A guest is due at some point.", "How do you know?", "I don't. It is a nice thing to say."],
  ["Polish, then patrol, then polish.", "You forgot standing near the fountain looking useful.", "That is part of patrol."],
  ["What is a cap table?", "No idea. I sweep.", "It sounds like furniture."],
  ["The plaza looks well today.", "The plaza looks the same as yesterday.", "Yes. Well."],
  ["I moved a chair two centimetres.", "Which chair?", "You would not notice. That is the craft."],
];

/** Said alone, when nobody is close enough to talk to. */
const SOLO: string[] = [
  "Beep. All clear.",
  "Fountain on. Lights on. Me on.",
  "Mind the wet paving.",
  "Every stand here belongs to a real person. Not me.",
  "Directory board is that way. Probably.",
  "I like this hall. It has good corners.",
  "Just passing through. Professionally.",
  "Sweeping.",
  "Twenty-four stands. I know them all by number.",
  "If you claim one, I will keep it tidy.",
];

const SPEED_MIN = 26;
const SPEED_MAX = 42;
/** Close enough to notice you and turn round. */
const NOTICE = 2.6 * TILE;
/** Close enough to strike up a conversation with another robot. */
const TALK_RANGE = 4.2 * TILE;
const WAVE_RANGE = 3.2 * TILE;
const LINE_GAP = 2.6; // seconds between lines of an exchange
const ARRIVE_EPS = 2;

export interface CrowdHooks {
  say(bot: Wanderer, line: string): void;
  emote(bot: Wanderer, kind: EmoteKind): void;
}

export interface WorldQuery {
  width: number;
  height: number;
  solid(tx: number, ty: number): boolean;
}

export class Wanderer {
  readonly id: string;
  readonly name: string;
  /** Bubble entity id the engine renders speech against. */
  readonly bubbleId: string;

  x: number;
  y: number;
  dir: Dir = "down";
  moving = false;

  /** Held still while talking, or while a person is standing next to them. */
  holdUntil = 0;
  /** Who they are mid-conversation with, if anyone. */
  partner: Wanderer | null = null;

  private frames: AvatarFrames;
  private rng: () => number;
  private speed: number;
  private path: TilePoint[] | null = null;
  private pathIdx = 0;
  private pause: number;
  private animT = 0;
  private bobSeed: number;

  constructor(id: string, name: string, look: RobotLook, bank: SpriteBank, start: TilePoint) {
    this.id = id;
    this.name = name;
    this.bubbleId = `bot:${id}`;
    this.frames = bank.makeRobot(look);
    this.rng = mulberry32(hashStr(id));
    this.speed = SPEED_MIN + this.rng() * (SPEED_MAX - SPEED_MIN);
    this.bobSeed = this.rng() * Math.PI * 2;
    this.x = start.x * TILE + TILE / 2;
    this.y = start.y * TILE + TILE - 8;
    this.pause = this.rng() * 4;
  }

  get tile(): TilePoint {
    return { x: Math.floor(this.x / TILE), y: Math.floor(this.y / TILE) };
  }

  /** Point at something and stop walking (used when a conversation opens). */
  faceToward(tx: number, ty: number): void {
    const dx = tx - this.x;
    const dy = ty - this.y;
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    this.moving = false;
    this.path = null;
  }

  /** Send them somewhere. Silently ignored if there is no route. */
  routeTo(world: WorldQuery, goal: TilePoint): void {
    const p = findPath(world.width, world.height, world.solid, this.tile, goal);
    if (p && p.length) {
      this.path = p;
      this.pathIdx = 0;
    }
  }

  update(dt: number, world: WorldQuery, playerX: number, playerY: number, pickGoal: () => TilePoint, clock: number): void {
    if (this.moving) this.animT += dt;

    // A person walking up gets attention: stop, turn, hold a beat. This is
    // the cheapest thing in the whole file and the one people notice.
    const pdx = playerX - this.x;
    const pdy = playerY - this.y;
    if (pdx * pdx + pdy * pdy < NOTICE * NOTICE) {
      this.faceToward(playerX, playerY);
      this.pause = Math.max(this.pause, 0.7);
      return;
    }

    if (clock < this.holdUntil) {
      this.moving = false;
      return;
    }

    if (this.pause > 0) {
      this.pause -= dt;
      this.moving = false;
      return;
    }

    if (!this.path) {
      this.routeTo(world, pickGoal());
      if (!this.path) {
        this.pause = 1 + this.rng() * 2;
        return;
      }
    }

    const step = this.path[this.pathIdx];
    if (!step) {
      this.path = null;
      this.moving = false;
      this.pause = 1.6 + this.rng() * 5;
      return;
    }
    const tx = step.x * TILE + TILE / 2;
    const ty = step.y * TILE + TILE - 8;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < ARRIVE_EPS) {
      this.x = tx;
      this.y = ty;
      this.pathIdx++;
      if (this.pathIdx >= this.path.length) {
        this.path = null;
        this.moving = false;
        this.pause = 1.6 + this.rng() * 5;
      }
      return;
    }
    this.moving = true;
    const move = Math.min(dist, this.speed * dt);
    this.x += (dx / dist) * move;
    this.y += (dy / dist) * move;
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
  }

  get sortY(): number {
    return this.y;
  }

  draw(ctx: CanvasRenderingContext2D, timeSec: number): void {
    const px = Math.round(this.x * 2) / 2;
    const py = Math.round(this.y * 2) / 2;
    ctx.fillStyle = "rgba(35,32,26,0.16)";
    ctx.beginPath();
    ctx.ellipse(px, py - 1, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // idle hover-bob, a touch slower than the founders' so a crowd of both
    // never falls into step
    const bob = this.moving ? 0 : Math.round(Math.sin(timeSec * 1.7 + this.bobSeed) * 0.9);
    const frame = this.moving ? 1 + (Math.floor(this.animT * 6) % 2) : 0;
    ctx.drawImage(this.frames[this.dir][frame], px - SPRITE_W / 2, py - SPRITE_H + bob);
  }
}

interface LiveExchange {
  a: Wanderer;
  b: Wanderer;
  lines: string[];
  next: number; // index into lines
  at: number; // clock seconds for the next line
}

/**
 * Owns the robot population: how many there are, where they wander, and
 * who is talking to whom.
 */
export class HallCrowd {
  private all: Wanderer[] = [];
  private liveList: Wanderer[] = [];
  private live = 0;
  private clock = 0;
  private rng: () => number;
  private exchanges: LiveExchange[] = [];
  private nextChatAt = 6;
  private waveReady = new Map<string, number>();

  constructor(
    floorId: string,
    private world: WorldQuery,
    bank: SpriteBank,
    count: number,
    /** Places worth loitering: the fountain rim, stand fronts, avenue ends. */
    private haunts: TilePoint[],
    spawn: TilePoint
  ) {
    this.rng = mulberry32(hashStr(`${floorId}:crowd`));
    const n = Math.max(0, Math.min(24, Math.floor(count)));
    for (let i = 0; i < n; i++) {
      const id = `${floorId}-${i}`;
      const seat = haunts.length ? haunts[Math.floor(this.rng() * haunts.length)] : spawn;
      this.all.push(
        new Wanderer(
          id,
          NAMES[i % NAMES.length],
          { chassis: (hashStr(id) >>> 3) % 6, visor: (hashStr(id) >>> 7) % 4 },
          bank,
          seat
        )
      );
    }
    this.live = n;
    this.liveList = this.all.slice(0, n);
  }

  /**
   * Thin the robots out as real people turn up: two robots stand down for
   * every other person in the hall. The room should feel busy when it is
   * empty and be honest when it isn't — with nine robots that means the
   * last one leaves once there are five other people here, and from then
   * on everything moving on this floor is a person.
   */
  setCrowd(realPlayers: number): void {
    const want = Math.max(0, this.all.length - Math.max(0, realPlayers) * 2);
    if (want === this.live) return;
    this.live = want;
    this.liveList = this.all.slice(0, want);
    // drop conversations involving anyone who just went off duty
    const on = new Set(this.liveList);
    this.exchanges = this.exchanges.filter((e) => on.has(e.a) && on.has(e.b));
  }

  /**
   * Read three times a frame (update, draw, minimap), so it hands back the
   * same array rather than slicing a fresh one each time — this is the
   * hottest thing in the file and it should allocate nothing.
   */
  get active(): Wanderer[] {
    return this.liveList;
  }

  private pickGoal = (): TilePoint => {
    // A third of the time, go and stand near another robot. Without this
    // they diffuse evenly across a 58x42 hall, and two robots are then
    // almost never close enough to talk — the conversations existed but
    // nobody ever saw one. Gathering is what makes the hall feel attended.
    const bots = this.active;
    if (bots.length > 1 && this.rng() < 0.34) {
      const other = bots[Math.floor(this.rng() * bots.length)];
      const t = other.tile;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [2, 0], [0, 2]]) {
        const nx = t.x + dx;
        const ny = t.y + dy;
        if (nx < 1 || ny < 1 || nx >= this.world.width - 1 || ny >= this.world.height - 1) continue;
        if (!this.world.solid(nx, ny)) return { x: nx, y: ny };
      }
    }
    // otherwise head for somewhere with a reason to stand, or anywhere at
    // all, so the patrol never settles into a fixed circuit
    if (this.haunts.length && this.rng() < 0.7) {
      return this.haunts[Math.floor(this.rng() * this.haunts.length)];
    }
    for (let i = 0; i < 30; i++) {
      const tx = 1 + Math.floor(this.rng() * (this.world.width - 2));
      const ty = 1 + Math.floor(this.rng() * (this.world.height - 2));
      if (!this.world.solid(tx, ty)) return { x: tx, y: ty };
    }
    return this.haunts[0] ?? { x: 1, y: 1 };
  };

  update(dt: number, playerX: number, playerY: number, hooks: CrowdHooks): void {
    this.clock += dt;
    const bots = this.active;
    for (const b of bots) b.update(dt, this.world, playerX, playerY, this.pickGoal, this.clock);

    // advance any conversation in flight
    for (let i = this.exchanges.length - 1; i >= 0; i--) {
      const ex = this.exchanges[i];
      if (this.clock < ex.at) continue;
      if (ex.next >= ex.lines.length) {
        ex.a.partner = null;
        ex.b.partner = null;
        this.exchanges.splice(i, 1);
        continue;
      }
      const speaker = ex.next % 2 === 0 ? ex.a : ex.b;
      const listener = speaker === ex.a ? ex.b : ex.a;
      speaker.faceToward(listener.x, listener.y);
      listener.faceToward(speaker.x, speaker.y);
      hooks.say(speaker, ex.lines[ex.next]);
      speaker.holdUntil = this.clock + LINE_GAP + 0.4;
      listener.holdUntil = this.clock + LINE_GAP + 0.4;
      ex.next++;
      ex.at = this.clock + LINE_GAP;
    }

    if (this.clock < this.nextChatAt || bots.length === 0) return;
    this.nextChatAt = this.clock + 7 + this.rng() * 9;

    const free = bots.filter((b) => !b.partner && this.clock >= b.holdUntil);

    // Of every pair standing close enough to talk, pick the one NEAREST THE
    // PLAYER. A bubble forty tiles away is a bubble nobody reads, and the
    // whole point of the chatter is that it is overheard.
    let best: { a: Wanderer; b: Wanderer } | null = null;
    let bestD = Infinity;
    for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        const dx = free[i].x - free[j].x;
        const dy = free[i].y - free[j].y;
        if (dx * dx + dy * dy > TALK_RANGE * TALK_RANGE) continue;
        const mx = (free[i].x + free[j].x) / 2 - playerX;
        const my = (free[i].y + free[j].y) / 2 - playerY;
        const d = mx * mx + my * my;
        if (d < bestD) {
          bestD = d;
          best = { a: free[i], b: free[j] };
        }
      }
    }
    if (best) {
      const lines = EXCHANGES[Math.floor(this.rng() * EXCHANGES.length)];
      best.a.partner = best.b;
      best.b.partner = best.a;
      this.exchanges.push({ a: best.a, b: best.b, lines, next: 0, at: this.clock });
      return;
    }
    // nobody paired up: the closest one says something to nobody in particular
    if (free.length) {
      let who = free[0];
      let d0 = Infinity;
      for (const b of free) {
        const d = (b.x - playerX) ** 2 + (b.y - playerY) ** 2;
        if (d < d0) {
          d0 = d;
          who = b;
        }
      }
      hooks.say(who, SOLO[Math.floor(this.rng() * SOLO.length)]);
      who.holdUntil = this.clock + 2.4;
    }
  }

  /** The player waved; robots close by wave back, on a cooldown each. */
  onPlayerEmote(kind: EmoteKind, playerX: number, playerY: number, hooks: CrowdHooks): void {
    if (kind !== "wave") return;
    for (const b of this.active) {
      const dx = b.x - playerX;
      const dy = b.y - playerY;
      if (dx * dx + dy * dy > WAVE_RANGE * WAVE_RANGE) continue;
      const ready = this.waveReady.get(b.id) ?? 0;
      if (this.clock < ready) continue;
      this.waveReady.set(b.id, this.clock + 7);
      b.faceToward(playerX, playerY);
      b.holdUntil = this.clock + 1.6;
      hooks.emote(b, "wave");
    }
  }
}

/**
 * Somewhere worth standing: the ring of paving around the fountain, the far
 * end of every avenue, and the tile in front of each stand. Robots looking
 * at stands is the detail that makes the hall feel attended rather than
 * merely occupied.
 */
export function hauntsFor(
  world: WorldQuery,
  boothSpots: { x: number; y: number }[],
  plaza?: {
    rect: { x0: number; y0: number; x1: number; y1: number };
    fountain: { x0: number; y0: number; x1: number; y1: number };
    avenues: { x0: number; y0: number; x1: number; y1: number }[];
  }
): TilePoint[] {
  const out: TilePoint[] = [];
  const add = (x: number, y: number): void => {
    if (x < 1 || y < 1 || x >= world.width - 1 || y >= world.height - 1) return;
    if (world.solid(x, y)) return;
    out.push({ x, y });
  };

  // in front of every stand (the carpet apron row)
  for (const s of boothSpots) {
    add(s.x + 1, s.y + 4);
    add(s.x + 2, s.y + 4);
  }

  if (plaza) {
    const f = plaza.fountain;
    for (let x = f.x0 - 1; x <= f.x1 + 1; x++) {
      add(x, f.y0 - 1);
      add(x, f.y1 + 1);
    }
    for (let y = f.y0 - 1; y <= f.y1 + 1; y++) {
      add(f.x0 - 1, y);
      add(f.x1 + 1, y);
    }
    for (const a of plaza.avenues) {
      add(Math.round((a.x0 + a.x1) / 2), a.y0);
      add(Math.round((a.x0 + a.x1) / 2), a.y1);
      add(a.x0, Math.round((a.y0 + a.y1) / 2));
      add(a.x1, Math.round((a.y0 + a.y1) / 2));
    }
  }
  return out;
}
