"use client";

/**
 * After Hours — the parkour game, and the shell around it.
 *
 * Map select, the canvas the run is drawn into, keyboard and thumb
 * controls, and the results card. The physics live in game/parkour.ts; this
 * file is everything you can see and press.
 *
 * Touch controls are not an afterthought here: a platformer with no
 * on-screen buttons is a platformer nobody can play on a phone, and most
 * people will meet this on a phone.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { MAPS, PT, ParkourRun, TIME_LIMIT } from "@/game/parkour";
import type { MapDef, ParkourStatus } from "@/game/parkour";
import { SpriteBank } from "@/game/sprites";
import type { AvatarLook } from "@/lib/types";
import TicketIcon from "@/components/TicketIcon";

/** Logical view, in game pixels. Scaled up to whatever the panel gives us. */
const VIEW_W = 30 * PT;
const VIEW_H = 15 * PT;

export interface ParkourProps {
  look: AvatarLook;
  /** Best time per map id, in seconds, or absent if never finished. */
  bests: Record<string, number>;
  /** Tickets left in today's arcade allowance. */
  capLeft: number;
  onFinish(mapId: string, status: ParkourStatus, tickets: number): void;
  onExit(): void;
}

function Pips({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`Difficulty ${n} of 3`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: i < n ? "#D9480F" : "#E4DFD3" }}
        />
      ))}
    </span>
  );
}

const secs = (s: number): string => {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return m > 0 ? `${m}:${r.toFixed(1).padStart(4, "0")}` : `${r.toFixed(1)}s`;
};

export default function Parkour({ look, bests, capLeft, onFinish, onExit }: ParkourProps) {
  const [map, setMap] = useState<MapDef | null>(null);
  const [status, setStatus] = useState<ParkourStatus | null>(null);
  const [done, setDone] = useState<{
    status: ParkourStatus;
    tickets: number;
    next: MapDef | null;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<ParkourRun | null>(null);
  const input = useRef({ left: false, right: false, jump: false });
  const paidRef = useRef(false);

  /**
   * The run's effect must depend on the MAP and nothing else.
   *
   * These two used to be in its dependency list, and `onFinish` is an inline
   * arrow on the floor page — a new function on every render of a page that
   * re-renders for presence, chat and the clock. Each one tore down the loop
   * and built a fresh ParkourRun, which is to say: the level silently
   * restarted underneath you, mid-jump, several times a minute. Reading them
   * out of a ref keeps the latest value without restarting the level.
   */
  const finishRef = useRef(onFinish);
  const capRef = useRef(capLeft);
  const lookRef = useRef(look);
  useEffect(() => {
    finishRef.current = onFinish;
    capRef.current = capLeft;
    lookRef.current = look;
  }, [onFinish, capLeft, look]);

  // ---- keyboard ----
  useEffect(() => {
    if (!map) return;
    const set = (e: KeyboardEvent, down: boolean): void => {
      const k = e.key.toLowerCase();
      if (k === "a" || e.key === "ArrowLeft") input.current.left = down;
      else if (k === "d" || e.key === "ArrowRight") input.current.right = down;
      else if (k === "w" || k === " " || e.key === "ArrowUp") input.current.jump = down;
      else return;
      // stop the hall behind us seeing WASD, and stop space scrolling
      e.preventDefault();
      e.stopPropagation();
    };
    const dn = (e: KeyboardEvent): void => set(e, true);
    const up = (e: KeyboardEvent): void => set(e, false);
    window.addEventListener("keydown", dn, true);
    window.addEventListener("keyup", up, true);
    return () => {
      window.removeEventListener("keydown", dn, true);
      window.removeEventListener("keyup", up, true);
    };
  }, [map]);

  // ---- the loop ----
  useEffect(() => {
    if (!map) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const run = new ParkourRun(map, lookRef.current, new SpriteBank());
    runRef.current = run;
    paidRef.current = false;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = VIEW_W * dpr;
    canvas.height = VIEW_H * dpr;

    let raf = 0;
    let last = performance.now();
    let alive = true;
    let hudStamp = "";
    const tick = (now: number): void => {
      if (!alive) return;
      // Clamp: a backgrounded tab returns with a huge delta and the player
      // teleports through the floor.
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      run.step(dt, input.current);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      run.draw(ctx, VIEW_W, VIEW_H, now / 1000);

      // The HUD shows one decimal, so pushing state 60 times a second
      // re-renders the panel five times for every change anyone can see.
      const s = run.status;
      const stamp = `${Math.round(s.left * 10)}|${s.tickets}|${s.deaths}`;
      if (stamp !== hudStamp || s.finished) {
        hudStamp = stamp;
        setStatus(s);
      }
      if (s.finished && !paidRef.current) {
        paidRef.current = true;
        const bonus = s.medal === "gold" ? 10 : s.medal === "silver" ? 5 : 0;
        const tickets = s.timedOut
          ? 0
          : Math.max(0, Math.min(capRef.current, s.tickets * 2 + bonus));
        if (!s.timedOut) finishRef.current(map.id, s, tickets);
        // Reaching the exit sends you straight to the next map rather than
        // back to a menu — a level that ends in a list is a run that ends.
        const nextIdx = MAPS.findIndex((x) => x.id === map.id) + 1;
        setDone({
          status: s,
          tickets,
          next: !s.timedOut && nextIdx < MAPS.length ? MAPS[nextIdx] : null,
        });
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      runRef.current = null;
    };
  }, [map]);

  const hold = useCallback((key: "left" | "right" | "jump", down: boolean) => {
    input.current[key] = down;
  }, []);

  // ---------------------------------------------------------------- select
  if (!map) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-muted">
          The hall is shut and the crew is still building. Get across the
          scaffolding to the exit. Collect what you can on the way — every
          ticket you pick up is a ticket you keep.
        </p>
        <ul className="flex flex-col gap-2">
          {MAPS.map((m) => {
            const best = bests[m.id];
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    setDone(null);
                    setMap(m);
                  }}
                  className="w-full rounded-lg border border-line px-4 py-3 text-left transition-colors hover:border-accent hover:bg-paper"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-lg leading-tight">{m.name}</span>
                    <Pips n={m.hard} />
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-muted">{m.blurb}</span>
                  <span className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-muted">
                    <span>Par {m.par}s</span>
                    <span>
                      Best {best === undefined ? "—" : secs(best)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={onExit}
          className="rounded-md border border-line px-4 py-2.5 text-sm transition-colors hover:bg-paper"
        >
          Back to the arcade
        </button>
      </div>
    );
  }

  // --------------------------------------------------------------- results
  if (done) {
    const { status: s, tickets } = done;
    const beat = bests[map.id] !== undefined && s.time < bests[map.id];
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <p className="micro text-[10px] text-muted">
            {map.name.toUpperCase()} — {done.status.timedOut ? "OUT OF TIME" : "CLEARED"}
          </p>
          <p className="font-display text-5xl leading-none">{secs(s.time)}</p>
          {s.medal !== "none" && (
            <p
              className="micro mt-2 inline-block rounded-full px-3 py-1 text-[10px] text-paper"
              style={{ background: s.medal === "gold" ? "#B08D2E" : "#8E8A7C" }}
            >
              {s.medal === "gold" ? "GOLD — under par, everything collected" : "SILVER"}
            </p>
          )}
          {beat && <p className="mt-2 text-sm text-verify">A new personal best.</p>}
        </div>
        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line text-sm">
          <li className="flex justify-between px-4 py-2">
            <span className="text-muted">Tickets found</span>
            <span>
              {s.tickets} of {s.ticketsTotal}
            </span>
          </li>
          <li className="flex justify-between px-4 py-2">
            <span className="text-muted">Falls</span>
            <span>{s.deaths}</span>
          </li>
          <li className="flex justify-between px-4 py-2">
            <span className="text-muted">Par</span>
            <span>{map.par}s</span>
          </li>
        </ul>
        <div className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3">
          <span className="text-sm text-muted">Won</span>
          <span className="flex items-center gap-2 font-display text-2xl">
            <TicketIcon size={18} />
            {tickets}
          </span>
        </div>
        <div className="flex gap-2">
          {done.next ? (
            <button
              type="button"
              onClick={() => {
                const nx = done.next;
                setDone(null);
                setStatus(null);
                setMap(nx);
              }}
              className="flex-1 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent-strong"
            >
              Next: {done.next.name}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDone(null);
                setStatus(null);
                setMap({ ...map });
              }}
              className="flex-1 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent-strong"
            >
              Run it again
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setDone(null);
              setMap(null);
            }}
            className="flex-1 rounded-md border border-line px-4 py-2.5 text-sm transition-colors hover:bg-paper"
          >
            Pick another map
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ play
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-display text-base leading-none">{map.name}</span>
        <span className="flex items-center gap-4 font-mono text-xs text-muted">
          <span
            className={`font-display text-lg leading-none ${
              (status?.left ?? TIME_LIMIT) <= 5 ? "text-accent" : "text-ink"
            }`}
          >
            {(status?.left ?? TIME_LIMIT).toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <TicketIcon size={11} />
            {status?.tickets ?? 0}/{status?.ticketsTotal ?? 0}
          </span>
          <span>{status?.deaths ?? 0} falls</span>
        </span>
      </div>

      <canvas
        ref={canvasRef}
        className="pixelated w-full rounded-lg border border-line"
        style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}`, touchAction: "none" }}
      />

      {/* Thumb controls. Held, not tapped — a platformer needs to know when
          you LET GO, so these are pointer-down/up rather than click. */}
      <div className="flex items-stretch justify-between gap-3 [@media(pointer:fine)]:hidden">
        <div className="flex gap-2">
          {(["left", "right"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-label={k === "left" ? "Move left" : "Move right"}
              onPointerDown={(e) => {
                e.preventDefault();
                hold(k, true);
              }}
              onPointerUp={() => hold(k, false)}
              onPointerLeave={() => hold(k, false)}
              onPointerCancel={() => hold(k, false)}
              className="glass h-14 w-16 select-none text-xl shadow-float active:bg-paper"
            >
              {k === "left" ? "◀" : "▶"}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Jump"
          onPointerDown={(e) => {
            e.preventDefault();
            hold("jump", true);
          }}
          onPointerUp={() => hold("jump", false)}
          onPointerLeave={() => hold("jump", false)}
          onPointerCancel={() => hold("jump", false)}
          className="glass h-14 flex-1 select-none font-display text-lg shadow-float active:bg-paper"
        >
          JUMP
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="micro text-[10px] text-muted [@media(pointer:coarse)]:hidden">
          A / D OR ARROWS TO MOVE · W, SPACE OR UP TO JUMP
        </p>
        <button
          type="button"
          onClick={() => {
            setMap(null);
            setStatus(null);
          }}
          className="rounded-md border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:bg-paper hover:text-ink"
        >
          Give up
        </button>
      </div>
    </div>
  );
}
