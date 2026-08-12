/**
 * FounderFloor — "After Hours", the parkour engine.
 *
 * A side-on platformer that runs inside the arcade panel, played with the
 * visitor's OWN avatar. The fiction: the hall is shut, the crew is still
 * building the stands, and you are getting across the scaffolding.
 *
 * ─── WHY THIS IS SEPARATE FROM game/engine.ts ─────────────────────────
 * The hall engine is top-down: no gravity, no jump, collision is a tile
 * lookup on a walkable grid. None of that survives being bent into a
 * platformer, and bending it would put a `mode` branch through the middle
 * of the file that the whole hall depends on. This is its own loop, its
 * own physics and its own tiles; the only thing it borrows is SpriteBank,
 * so the character on the scaffolding is the same one that walks the hall.
 *
 * ─── THE FOUR THINGS THAT MAKE A JUMP FEEL RIGHT ──────────────────────
 * These are not polish, they are the difference between a platformer and a
 * frustrating one, and every one of them is a lie about the simulation:
 *   COYOTE TIME     you can still jump for ~100ms after walking off a ledge
 *   JUMP BUFFER     a jump pressed ~130ms before landing fires on landing
 *   VARIABLE HEIGHT releasing the key early cuts the rise short
 *   FALL GRAVITY    falling is heavier than rising, so jumps feel snappy
 * Remove any one and the maps below stop being fair.
 */

import { TILE as HALL_TILE } from "../lib/types";
import type { AvatarLook } from "../lib/types";
import { SPRITE_H, SPRITE_W, SpriteBank } from "./sprites";
import type { AvatarFrames } from "./sprites";

void HALL_TILE; // the hall's 32px grid is deliberately not used here

/** Logical pixels per tile. The whole game is authored at this scale. */
export const PT = 16;

// ---------- tiles ----------
//
//   .  air              #  solid block        =  one-way platform
//   ^  hazard (spikes)  o  ticket             C  checkpoint flag
//   S  start            G  goal (the exit)    B  spring
//   -  moving platform, horizontal            |  moving platform, vertical
//   x  crumbling block (falls away a beat after you stand on it)

export type MapDef = {
  id: string;
  name: string;
  blurb: string;
  /** Rough difficulty, 1-3, shown as pips. */
  hard: number;
  /** Par time in seconds — beat it for the gold medal. */
  par: number;
  rows: string[];
};

export const MAPS: MapDef[] = [
  {
    id: "load-in",
    name: "Load-In",
    blurb: "Crates on the dock, before the doors open. Learn the jump.",
    hard: 1,
    par: 28,
    rows: [
      "..............................................",
      "..............................................",
      "...........................o..o..o............",
      ".........................#########............",
      "..............................................",
      "................o.o...........................",
      "..............######..............o.....G.....",
      "..........................=====.......#####...",
      "....o.........................................",
      "...###......^^^.....o.........................",
      "..............................................",
      ".S....#############...####...####.............",
      "##########################################...",
      "##########################################...",
    ],
  },
  {
    id: "the-scaffold",
    name: "The Scaffold",
    blurb: "Straight up the tower. Mind the platforms that move.",
    hard: 2,
    par: 42,
    rows: [
      "...........................................G..",
      ".........................................#####",
      "..............................................",
      ".......................o...........-----......",
      "....................########..................",
      "..............................................",
      "...........o......----........o...............",
      ".......#######............#######.............",
      "..............................................",
      "...o.....................o....................",
      "..####.......^^^^^....########................",
      "..............................................",
      ".S...#####..#########...........####...o......",
      "##########################################...",
      "##########################################...",
    ],
  },
  {
    id: "cable-run",
    name: "Cable Run",
    blurb: "Springs, long gaps and live cable. Do not touch the cable.",
    hard: 3,
    par: 52,
    rows: [
      "..............................................",
      "...................o......o...................",
      "..............................................",
      "..........####..........####..........o....G..",
      "..................................#########...",
      "......o.......................................",
      "....####.........B..........B.................",
      "................###........###................",
      "..........o...................................",
      "........####..............o...................",
      "..............................xxxx............",
      ".S...B.......^^^^^^^^^.................^^^^...",
      "#####################...##################...",
      "#####################...##################...",
    ],
  },
  {
    id: "after-hours",
    name: "After Hours",
    blurb: "Lights off, floor empty. Everything moves and nothing waits.",
    hard: 3,
    par: 64,
    rows: [
      "..............................................",
      "......................................o....G..",
      "...................................########...",
      "..........|.........|.........................",
      "..............................................",
      "......o.......o.......o.......................",
      "....####....####....####....xxxx..............",
      "..............................................",
      "..........................................o...",
      "...B..............^^^^^^..............#####...",
      "..###.........................B...............",
      ".S..........xxxx.............###..............",
      "#######...###################.................",
      "#######...###################.................",
    ],
  },
];

// ---------- physics constants, in logical px and seconds ----------

const GRAVITY = 1180;
const FALL_GRAVITY = 1680; // heavier coming down: the jump reads snappier
const MAX_FALL = 620;
const RUN = 138;
const ACCEL = 1200;
const AIR_ACCEL = 780;
const FRICTION = 1500;
const JUMP_V = 375;
const SPRING_V = 610;
const COYOTE = 0.1;
const BUFFER = 0.13;
/** Releasing the jump key cuts the remaining rise to this fraction. */
const CUT = 0.42;

const BODY_W = 11;
const BODY_H = 22;

const CRUMBLE_DELAY = 0.35;
const CRUMBLE_BACK = 2.6;
const MOVER_SPAN = 3.2 * PT;
const MOVER_SPEED = 44;

export interface ParkourInput {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export interface ParkourStatus {
  time: number;
  deaths: number;
  tickets: number;
  ticketsTotal: number;
  finished: boolean;
  medal: "gold" | "silver" | "none";
}

interface Mover {
  x0: number;
  y0: number;
  vertical: boolean;
  phase: number;
  x: number;
  y: number;
}

interface Crumb {
  tx: number;
  ty: number;
  /** >0 = counting down to falling away; <0 = counting back to solid. */
  t: number;
  gone: boolean;
}

interface Coin {
  tx: number;
  ty: number;
  taken: boolean;
}

// ---------- palette ----------

const SKY_TOP = "#2B2A33";
const SKY_BOT = "#3E3B42";
const GIRDER = "#6E6A60";
const GIRDER_HI = "#8E8A7C";
const GIRDER_DARK = "#4A4740";
const PLANK = "#A28457";
const PLANK_HI = "#D9C79B";
const HAZARD = "#C4562B";
const HAZARD_DARK = "#8C3B2B";
const BRASS = "#B08D2E";
const BRASS_HI = "#DCC06B";
const FLAG = "#2B8A3E";
const SPRING = "#4F8FA0";
const PAPER = "#FFFDF5";

/**
 * One playable run of one map. Construct, call `frame` from rAF, read
 * `status` for the HUD, `destroy` when the panel closes.
 */
export class ParkourRun {
  readonly map: MapDef;
  readonly widthPx: number;
  readonly heightPx: number;

  private frames: AvatarFrames;
  private grid: string[][];
  private x = 0;
  private y = 0;
  private vx = 0;
  private vy = 0;
  private onGround = false;
  private facing: "left" | "right" = "right";
  private animT = 0;
  private coyote = 0;
  private buffered = 0;
  private jumpHeld = false;
  private spawnX = 0;
  private spawnY = 0;
  private movers: Mover[] = [];
  private crumbs: Crumb[] = [];
  private coins: Coin[] = [];
  private time = 0;
  private deaths = 0;
  private got = 0;
  private finished = false;
  private shake = 0;
  private camX = 0;
  private camY = 0;

  constructor(map: MapDef, look: AvatarLook, bank: SpriteBank) {
    this.map = map;
    this.frames = bank.makeAvatar(look);
    // Rows are hand-typed and end up ragged. at() treats out-of-range x as
    // solid, so a short row would silently become a wall — pad them all.
    const wide = Math.max(...map.rows.map((r) => r.length));
    this.grid = map.rows.map((r) => r.padEnd(wide, ".").split(""));
    this.widthPx = wide * PT;
    this.heightPx = map.rows.length * PT;

    this.grid.forEach((row, ty) =>
      row.forEach((ch, tx) => {
        if (ch === "S") {
          this.spawnX = tx * PT + PT / 2;
          this.spawnY = ty * PT + PT;
        } else if (ch === "o") {
          this.coins.push({ tx, ty, taken: false });
        } else if (ch === "x") {
          this.crumbs.push({ tx, ty, t: 0, gone: false });
        } else if (ch === "-" || ch === "|") {
          this.movers.push({
            x0: tx * PT,
            y0: ty * PT,
            vertical: ch === "|",
            // stagger by column so a bank of them never moves as one
            phase: (tx * 0.37 + ty * 0.11) % 1,
            x: tx * PT,
            y: ty * PT,
          });
        }
      }),
    );
    this.respawn();
  }

  get status(): ParkourStatus {
    return {
      time: this.time,
      deaths: this.deaths,
      tickets: this.got,
      ticketsTotal: this.coins.length,
      finished: this.finished,
      medal: this.medal(),
    };
  }

  private medal(): "gold" | "silver" | "none" {
    if (!this.finished) return "none";
    if (this.time <= this.map.par && this.got === this.coins.length) return "gold";
    if (this.time <= this.map.par * 1.6) return "silver";
    return "none";
  }

  private at(tx: number, ty: number): string {
    if (ty < 0 || ty >= this.grid.length) return ty < 0 ? "." : "#";
    const row = this.grid[ty];
    if (tx < 0 || tx >= row.length) return "#";
    return row[tx];
  }

  /** Solid to a body moving downward (blocks, and platforms from above). */
  private solidAt(px: number, py: number, fallingOnly: boolean): boolean {
    const tx = Math.floor(px / PT);
    const ty = Math.floor(py / PT);
    const ch = this.at(tx, ty);
    if (ch === "#") return true;
    if (ch === "=") return fallingOnly && py - ty * PT < 8;
    if (ch === "x") {
      const c = this.crumbs.find((k) => k.tx === tx && k.ty === ty);
      return !!c && !c.gone;
    }
    return false;
  }

  private hits(px: number, py: number, fallingOnly = false): boolean {
    const l = px - BODY_W / 2;
    const r = px + BODY_W / 2 - 1;
    const t = py - BODY_H;
    const b = py - 1;
    for (const cx of [l, r]) {
      for (const cy of [t, t + BODY_H / 2, b]) {
        if (this.solidAt(cx, cy, fallingOnly)) return true;
      }
    }
    return false;
  }

  private respawn(): void {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    for (const c of this.crumbs) {
      c.gone = false;
      c.t = 0;
    }
  }

  private die(): void {
    this.deaths++;
    this.shake = 0.3;
    this.respawn();
  }

  // ---------- update ----------

  step(dt: number, input: ParkourInput): void {
    if (this.finished) return;
    this.time += dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);

    // horizontal
    const want = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const a = this.onGround ? ACCEL : AIR_ACCEL;
    if (want !== 0) {
      this.vx += want * a * dt;
      this.vx = Math.max(-RUN, Math.min(RUN, this.vx));
      this.facing = want > 0 ? "right" : "left";
    } else if (this.onGround) {
      const drop = FRICTION * dt;
      this.vx = Math.abs(this.vx) <= drop ? 0 : this.vx - Math.sign(this.vx) * drop;
    }

    // jump: coyote time + buffered press + variable height
    this.buffered = input.jump && !this.jumpHeld ? BUFFER : Math.max(0, this.buffered - dt);
    this.jumpHeld = input.jump;
    if (this.buffered > 0 && this.coyote > 0) {
      this.vy = -JUMP_V;
      this.buffered = 0;
      this.coyote = 0;
      this.onGround = false;
    }
    if (!input.jump && this.vy < 0) this.vy *= 1 - (1 - CUT) * Math.min(1, dt * 24);

    this.vy += (this.vy < 0 ? GRAVITY : FALL_GRAVITY) * dt;
    this.vy = Math.min(MAX_FALL, this.vy);

    // movers, before the body is resolved against them
    for (const m of this.movers) {
      m.phase = (m.phase + dt * (MOVER_SPEED / (MOVER_SPAN * 2))) % 1;
      const swing = Math.sin(m.phase * Math.PI * 2) * MOVER_SPAN;
      m.x = m.x0 + (m.vertical ? 0 : swing);
      m.y = m.y0 + (m.vertical ? swing : 0);
    }

    // ---- move X, then Y, resolving each against the world separately ----
    const stepX = this.vx * dt;
    if (stepX !== 0) {
      const nx = this.x + stepX;
      if (this.hits(nx, this.y)) {
        this.vx = 0;
        // ease up to the wall so you can stand flush against it
        const dir = Math.sign(stepX);
        let probe = this.x;
        while (!this.hits(probe + dir, this.y)) probe += dir;
        this.x = probe;
      } else {
        this.x = nx;
      }
    }

    const wasFalling = this.vy > 0;
    const stepY = this.vy * dt;
    let landed = false;
    if (stepY !== 0) {
      const ny = this.y + stepY;
      if (this.hitsAt(this.x, ny, wasFalling)) {
        if (wasFalling) {
          let probe = this.y;
          while (!this.hitsAt(this.x, probe + 1, true)) probe += 1;
          this.y = probe;
          landed = true;
        } else {
          let probe = this.y;
          while (!this.hitsAt(this.x, probe - 1, false)) probe -= 1;
          this.y = probe;
        }
        this.vy = 0;
      } else {
        this.y = ny;
      }
    }

    // moving platforms: land on the top face and get carried
    if (this.vy >= 0) {
      for (const m of this.movers) {
        const overX = this.x + BODY_W / 2 > m.x && this.x - BODY_W / 2 < m.x + PT * 2;
        const closeY = this.y >= m.y - 2 && this.y <= m.y + 10;
        if (overX && closeY) {
          this.y = m.y;
          this.vy = 0;
          landed = true;
          const swingV =
            Math.cos(m.phase * Math.PI * 2) * MOVER_SPAN * ((Math.PI * 2 * MOVER_SPEED) / (MOVER_SPAN * 2));
          if (!m.vertical) this.x += swingV * dt;
        }
      }
    }

    this.onGround = landed;
    this.coyote = landed ? COYOTE : Math.max(0, this.coyote - dt);

    // ---- what am I standing in ----
    const ctx = Math.floor(this.x / PT);
    const cty = Math.floor((this.y - BODY_H / 2) / PT);
    const here = this.at(ctx, cty);
    if (here === "^") {
      this.die();
      return;
    }
    if (here === "B" || this.at(ctx, Math.floor((this.y - 1) / PT)) === "B") {
      this.vy = -SPRING_V;
      this.coyote = 0;
      this.onGround = false;
    }
    if (here === "C") {
      this.spawnX = ctx * PT + PT / 2;
      this.spawnY = (cty + 1) * PT;
    }
    if (here === "G") {
      this.finished = true;
      return;
    }
    if (this.y - BODY_H > this.heightPx + PT) {
      this.die();
      return;
    }

    // crumbling blocks under the feet
    if (landed) {
      const bty = Math.floor(this.y / PT);
      const c = this.crumbs.find((k) => k.ty === bty && k.tx === Math.floor(this.x / PT));
      if (c && !c.gone && c.t === 0) c.t = CRUMBLE_DELAY;
    }
    for (const c of this.crumbs) {
      if (c.t > 0) {
        c.t -= dt;
        if (c.t <= 0) {
          c.gone = true;
          c.t = -CRUMBLE_BACK;
        }
      } else if (c.t < 0) {
        c.t += dt;
        if (c.t >= 0) {
          c.gone = false;
          c.t = 0;
        }
      }
    }

    // tickets
    for (const c of this.coins) {
      if (c.taken) continue;
      const cx = c.tx * PT + PT / 2;
      const cy = c.ty * PT + PT / 2;
      if (Math.abs(cx - this.x) < 13 && Math.abs(cy - (this.y - BODY_H / 2)) < 15) {
        c.taken = true;
        this.got++;
      }
    }
  }

  /** hits() for a body centred at (px, py); kept separate so X and Y resolve independently. */
  private hitsAt(px: number, py: number, fallingOnly: boolean): boolean {
    return this.hits(px, py, fallingOnly);
  }

  // ---------- draw ----------

  draw(ctx: CanvasRenderingContext2D, viewW: number, viewH: number, t: number): void {
    // camera: centred, clamped, with a shove when you die
    const tx = Math.max(0, Math.min(this.widthPx - viewW, this.x - viewW / 2));
    const ty = Math.max(0, Math.min(this.heightPx - viewH, this.y - viewH * 0.62));
    this.camX += (tx - this.camX) * 0.16;
    this.camY += (ty - this.camY) * 0.16;
    const jitter = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 10 : 0;
    const ox = Math.round(-this.camX + jitter);
    const oy = Math.round(-this.camY);

    // sky
    const g = ctx.createLinearGradient(0, 0, 0, viewH);
    g.addColorStop(0, SKY_TOP);
    g.addColorStop(1, SKY_BOT);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, viewH);

    // parallax: the hall's roof trusses, far behind
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = 2;
    for (let i = -2; i < 14; i++) {
      const bx = i * 96 - (this.camX * 0.25) % 96;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + 48, viewH);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(ox, oy);

    const x0 = Math.max(0, Math.floor(this.camX / PT) - 1);
    const x1 = Math.min(this.grid[0].length, Math.ceil((this.camX + viewW) / PT) + 1);
    const y0 = Math.max(0, Math.floor(this.camY / PT) - 1);
    const y1 = Math.min(this.grid.length, Math.ceil((this.camY + viewH) / PT) + 1);

    for (let gy = y0; gy < y1; gy++) {
      for (let gx = x0; gx < x1; gx++) {
        const ch = this.at(gx, gy);
        const px = gx * PT;
        const py = gy * PT;
        if (ch === "#") {
          // scaffold girder: a lit top edge and a bolt, so a wall of them
          // is not one flat rectangle
          ctx.fillStyle = GIRDER_DARK;
          ctx.fillRect(px, py, PT, PT);
          ctx.fillStyle = GIRDER;
          ctx.fillRect(px, py, PT, PT - 3);
          ctx.fillStyle = GIRDER_HI;
          ctx.fillRect(px, py, PT, 2);
          if ((gx + gy) % 3 === 0) {
            ctx.fillStyle = GIRDER_DARK;
            ctx.fillRect(px + 6, py + 7, 3, 3);
          }
        } else if (ch === "=") {
          ctx.fillStyle = PLANK;
          ctx.fillRect(px, py, PT, 6);
          ctx.fillStyle = PLANK_HI;
          ctx.fillRect(px, py, PT, 2);
          ctx.fillStyle = GIRDER_DARK;
          ctx.fillRect(px + 2, py + 6, 2, 3);
        } else if (ch === "^") {
          ctx.fillStyle = HAZARD_DARK;
          ctx.fillRect(px, py + PT - 4, PT, 4);
          ctx.fillStyle = HAZARD;
          for (let s = 0; s < 2; s++) {
            const sx = px + s * 8;
            ctx.beginPath();
            ctx.moveTo(sx, py + PT);
            ctx.lineTo(sx + 4, py + 3);
            ctx.lineTo(sx + 8, py + PT);
            ctx.closePath();
            ctx.fill();
          }
        } else if (ch === "B") {
          const squash = Math.abs(Math.sin(t * 3 + gx)) * 2;
          ctx.fillStyle = GIRDER_DARK;
          ctx.fillRect(px + 1, py + PT - 4, PT - 2, 4);
          ctx.fillStyle = SPRING;
          ctx.fillRect(px + 2, py + PT - 10 + squash, PT - 4, 6 - squash);
          ctx.fillStyle = PAPER;
          ctx.fillRect(px + 2, py + PT - 10 + squash, PT - 4, 2);
        } else if (ch === "x") {
          const c = this.crumbs.find((k) => k.tx === gx && k.ty === gy);
          if (c && !c.gone) {
            const wob = c.t > 0 ? (Math.random() - 0.5) * 2 : 0;
            ctx.fillStyle = "#7A5F3E";
            ctx.fillRect(px + wob, py, PT, PT);
            ctx.fillStyle = "#9C7B50";
            ctx.fillRect(px + wob, py, PT, 3);
            ctx.fillStyle = "#5A452E";
            ctx.fillRect(px + wob + 3, py + 6, PT - 6, 2);
          }
        } else if (ch === "C") {
          ctx.fillStyle = GIRDER;
          ctx.fillRect(px + 6, py + 2, 2, PT - 2);
          ctx.fillStyle = FLAG;
          const flap = Math.sin(t * 4 + gx) * 1.5;
          ctx.fillRect(px + 8, py + 3 + flap, 7, 5);
        } else if (ch === "G") {
          // the way out: a lit doorway
          ctx.fillStyle = "#1F1D19";
          ctx.fillRect(px - PT, py - PT * 1.5, PT * 2, PT * 2.5);
          ctx.fillStyle = BRASS;
          ctx.fillRect(px - PT, py - PT * 1.5, PT * 2, 3);
          const glow = 0.45 + Math.sin(t * 2.2) * 0.12;
          ctx.save();
          ctx.globalAlpha = glow;
          ctx.fillStyle = "#F6E2B0";
          ctx.fillRect(px - PT + 4, py - PT * 1.5 + 5, PT * 2 - 8, PT * 2.5 - 6);
          ctx.restore();
          ctx.fillStyle = PAPER;
          ctx.font = "700 7px ui-monospace, Menlo, monospace";
          ctx.textAlign = "center";
          ctx.fillText("EXIT", px, py - PT * 1.5 - 4);
        }
      }
    }

    // movers
    for (const m of this.movers) {
      if (m.x + PT * 2 < this.camX || m.x > this.camX + viewW) continue;
      ctx.fillStyle = GIRDER_DARK;
      ctx.fillRect(m.x, m.y, PT * 2, 7);
      ctx.fillStyle = BRASS;
      ctx.fillRect(m.x, m.y, PT * 2, 3);
      ctx.fillStyle = BRASS_HI;
      ctx.fillRect(m.x, m.y, PT * 2, 1);
    }

    // tickets
    for (const c of this.coins) {
      if (c.taken) continue;
      const cx = c.tx * PT + PT / 2;
      const cy = c.ty * PT + PT / 2 + Math.sin(t * 3 + c.tx) * 2;
      const w = 4 + Math.abs(Math.cos(t * 2.4 + c.tx)) * 5;
      ctx.fillStyle = BRASS;
      ctx.fillRect(cx - w / 2, cy - 5, w, 10);
      ctx.fillStyle = BRASS_HI;
      ctx.fillRect(cx - w / 2, cy - 5, w, 2);
      ctx.fillStyle = SKY_TOP;
      ctx.fillRect(cx - 1, cy - 2, 2, 4);
    }

    // the player, in their own skin
    const frame = this.onGround
      ? Math.abs(this.vx) > 12
        ? 1 + (Math.floor(this.animT * 9) % 2)
        : 0
      : 1;
    if (Math.abs(this.vx) > 12) this.animT += 1 / 60;
    const px = Math.round(this.x - SPRITE_W / 2);
    const py = Math.round(this.y - SPRITE_H);
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(this.x, this.y - 1, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.drawImage(this.frames[this.facing][frame], px, py);

    ctx.restore();
  }
}
