"use client";

/**
 * What each merchant stall shows, once you have walked up and opened it.
 *
 * They all render inside StallPanel, on the floor, without unmounting the
 * game — so none of them navigate. Where a thing genuinely lives off the
 * floor (a Stripe checkout, say) the control says so before it takes you.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FLOORS } from "@/lib/data/floors";
import { MAPS } from "@/game/parkour";
import { EARN, dailyTickets, walletBalance } from "@/lib/data/shop";
import { fetchLeaderboard, humanMs, untilWords } from "@/lib/leaderboard";
import type { Leaderboard } from "@/lib/leaderboard";
import { TIER_ORDER } from "@/lib/types";
import type { AppState, BoothInstance, SubTier } from "@/lib/types";
import TicketIcon from "@/components/TicketIcon";
import { controlCopy, useDevice } from "@/lib/device";

// ---------------------------------------------------------------- tickets

export function TicketStall({ state }: { state: AppState }) {
  const balance = walletBalance(state);
  const streak = Math.max(1, state.visitStreak);
  const rows: { label: string; amount: string; note: string }[] = [
    {
      label: "Turn up",
      amount: `+${dailyTickets(streak)}`,
      note: `once a day — ${EARN.dailyBase} plus ${EARN.dailyPerStreak} a day of streak, capped at ${EARN.dailyCap}`,
    },
    { label: "Make a connection", amount: `+${EARN.connection}`, note: "each new person, once each" },
    { label: "Sign a guestbook", amount: `+${EARN.guestbook}`, note: "each stand, once each" },
    { label: "Earn a badge", amount: `+${EARN.badge}`, note: "whatever earned it" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3">
        <span className="text-sm text-muted">In your pocket</span>
        <span className="flex items-center gap-2 font-display text-2xl">
          <TicketIcon size={20} />
          {balance}
        </span>
      </div>

      <div>
        <p className="micro mb-2 text-[10px] text-muted">WAYS TO EARN</p>
        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
          {rows.map((r) => (
            <li key={r.label} className="flex items-baseline gap-3 px-4 py-2.5">
              <span className="w-12 shrink-0 font-mono text-sm text-verify">{r.amount}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{r.label}</span>
                <span className="block text-xs leading-snug text-muted">{r.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm leading-relaxed text-muted">
        Everything on sale in this hall is bought with tickets you earned by
        turning up and talking to people. Nothing here is pay-to-win, because
        there is nothing to win.
      </p>

      <Link
        href="/profile#tickets"
        className="rounded-md border border-line px-4 py-2.5 text-center text-sm transition-colors hover:bg-paper"
      >
        Ticket packs and the full shop — leaves the floor
      </Link>
    </div>
  );
}

// --------------------------------------------------------------- register

export function RegisterStall({ booths }: { booths: BoothInstance[] }) {
  const [q, setQ] = useState("");
  const taken = useMemo(
    () => booths.filter((b) => b.startup).sort((a, b) => a.spotIndex - b.spotIndex),
    [booths],
  );
  const open = booths.length - taken.length;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return taken;
    return taken.filter((b) => {
      const s = b.startup;
      if (!s) return false;
      return (
        s.name.toLowerCase().includes(needle) ||
        s.category.toLowerCase().includes(needle) ||
        s.oneLiner.toLowerCase().includes(needle)
      );
    });
  }, [q, taken]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted">
        {taken.length} of {booths.length} stands are up. {open} still open — the
        numbers on the empty boards are the ones you can claim.
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search the hall"
        className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
        {shown.map((b) => (
          <li key={b.spotIndex} className="flex items-start gap-3 px-3 py-2.5">
            <span className="mt-0.5 w-8 shrink-0 font-mono text-xs text-muted">
              {String(b.spotIndex + 1).padStart(2, "0")}
            </span>
            <span
              aria-hidden="true"
              className="mt-1 h-3 w-3 shrink-0 rounded-sm"
              style={{ background: b.startup?.booth.banner }}
            />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm">{b.startup?.name}</span>
                {b.startup?.demo && (
                  <span className="micro text-[9px] text-muted">SAMPLE</span>
                )}
                {b.ownerId && <span className="micro text-[9px] text-verify">LIVE</span>}
              </span>
              <span className="block text-xs leading-snug text-muted">
                {b.startup?.oneLiner}
              </span>
            </span>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="px-3 py-4 text-sm text-muted">Nothing by that name in here.</li>
        )}
      </ul>
    </div>
  );
}

// ----------------------------------------------------------------- porter

export function PorterStall({
  floorId,
  presence,
  tier,
}: {
  floorId: string;
  presence: Record<string, number>;
  tier: SubTier;
}) {
  const open = FLOORS.filter((f) => !f.hidden);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted">
        Every floor in the building, and who is standing on it right now.
      </p>
      <ul className="flex flex-col gap-2">
        {open.map((f) => {
          const here = presence[f.id] ?? 0;
          const locked = TIER_ORDER[f.tier] > TIER_ORDER[tier];
          const current = f.id === floorId;
          return (
            <li
              key={f.id}
              className={`rounded-lg border px-4 py-3 ${
                current ? "border-accent bg-paper" : "border-line"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display text-lg leading-tight">{f.name}</span>
                <span className="micro shrink-0 text-[10px] text-muted">
                  {current ? "YOU ARE HERE" : locked ? f.tier.toUpperCase() : `${here} here`}
                </span>
              </div>
              <p className="mt-1 text-xs leading-snug text-muted">{f.tagline}</p>
              <p className="mt-2 text-xs text-muted">
                {f.boothSpots.length} stands
                {locked && " · needs a paid plan"}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="text-xs leading-relaxed text-muted">
        Only the Main Hall is open while the site is young — ten people spread
        over four rooms is four empty rooms. The others come back as this one
        fills up.
      </p>
    </div>
  );
}

// ------------------------------------------------------------- hall guide

interface GuideRow {
  where: string;
  what: string;
  how: string;
}

// The stands row names a control, so it is built per-device below —
// telling somebody on a phone to "press E" is the exact bug lib/device.ts
// exists to prevent, and this panel is now the phone's ONLY help surface.
const GUIDE: GuideRow[] = [
  {
    where: "The fountain",
    what: "The middle of the hall, ringed by stands, and the easiest place to find again.",
    how: "Straight up the avenue from where you came in.",
  },
  {
    where: "The stands",
    what: "", // filled in from controlCopy() at render
    how: "The nearest eight are on the fountain's own edge — you pass between two on the way in. The rest are in the banks behind them.",
  },
  {
    where: "Ticket Booth · Sign Painter",
    what: "Buy with tickets, or repaint your own stand.",
    how: "West avenue — turn left at the fountain and keep going.",
  },
  {
    where: "The Register · Porter's Lodge",
    what: "Every stand listed, and which floors are open.",
    how: "East avenue — turn right at the fountain.",
  },
  {
    where: "The Arcade",
    what: "Quick games, four parkour maps and the quiz room. Tickets for a good run.",
    how: "Just south-east of the fountain — you can see it from the water.",
  },
  {
    where: "The Records",
    what: "The hall's four weekly boards, and your own numbers against them.",
    how: "Opposite the arcade, south-west of the fountain.",
  },
];

export function GuideStall() {
  const device = useDevice();
  const controls = controlCopy(device);
  const standsWhat =
    device.pointer === "touch"
      ? "Walk up to one and tap it to talk. Empty ones show a number you can claim."
      : "Walk up to one and press E to talk to it. Empty ones show a number you can claim.";
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted">
        The hall is a cross: the fountain in the middle, four avenues out of
        it, stands along the top and bottom, traders down the sides.
      </p>
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
        {GUIDE.map((raw) => {
          const g = raw.where === "The stands" ? { ...raw, what: standsWhat } : raw;
          return (
          <li key={g.where} className="px-4 py-3">
            <p className="text-sm">{g.where}</p>
            <p className="mt-0.5 text-xs leading-snug text-muted">{g.what}</p>
            <p className="mt-1.5 text-xs leading-snug text-accent">{g.how}</p>
          </li>
          );
        })}
      </ul>
      {/* Named controls come from controlCopy(), never written here —
          this panel is the phone's only help surface, and "press E" on a
          screen with no keyboard is the exact bug lib/device.ts exists
          to prevent. */}
      <div className="rounded-lg border border-line bg-paper px-4 py-3">
        <p className="micro mb-1.5 text-[10px] text-muted">CONTROLS</p>
        {controls.lines.map((line) => (
          <p key={line} className="text-xs leading-relaxed text-muted">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}


// ---------------------------------------------------------------- records

/**
 * The Records — the hall's board of standings, next to the fountain.
 *
 * Four weekly tables from the floor server, your own card above them, and
 * last week's podium. The one thing this screen owes anybody is not
 * pretending: the server cannot verify a reported score, so the stall says
 * which board is measured and which is taken on trust rather than dressing
 * all four up as facts.
 */

const fmt = (s: number): string => {
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return m > 0 ? `${m}:${rest.toFixed(2).padStart(5, "0")}` : `${rest.toFixed(2)}s`;
};

/**
 * Podium colours for TEXT, not for fills. Plain gold (#B08D2E) is 2.7:1 on
 * paper — it fails AA at this size, and these are the smallest numbers on
 * the screen. See the note beside `gold-deep` in tailwind.config.ts.
 */
const MEDAL = ["#7A611F", "#5C5850", "#8A5324"];

function Table<T extends { id: string; name: string }>({
  title,
  note,
  rows,
  me,
  value,
  empty,
}: {
  title: string;
  note: string;
  rows: T[];
  me: string;
  value: (row: T) => string;
  empty: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="micro text-[10px] text-muted">{title}</p>
        <p className="text-[10px] leading-none text-muted">{note}</p>
      </div>
      <ol className="flex flex-col divide-y divide-line rounded-lg border border-line">
        {rows.map((r, i) => (
          <li
            key={r.id}
            className={`flex items-baseline gap-3 px-4 py-2 ${r.id === me ? "bg-paper" : ""}`}
          >
            <span
              className="w-5 shrink-0 font-mono text-xs"
              style={{ color: i < 3 ? MEDAL[i] : undefined }}
            >
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">
              {r.name}
              {r.id === me && <span className="micro ml-2 text-[9px] text-accent">YOU</span>}
            </span>
            <span className="shrink-0 font-mono text-sm">{value(r)}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="px-4 py-3 text-xs text-muted">{empty}</li>}
      </ol>
    </div>
  );
}

export function RecordsStall({ state }: { state: AppState }) {
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void fetchLeaderboard().then((b) => {
      if (!alive) return;
      setBoard(b);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const me = state.profile.id;
  const bests = state.parkourBests ?? {};
  const cleared = MAPS.filter((m) => typeof bests[m.id] === "number");
  const golds = cleared.filter((m) => bests[m.id] <= m.par);
  const people = state.connections.filter((c) => c.peerId).length;
  const awards = state.awards ?? [];

  const cards: { label: string; value: string; note: string }[] = [
    {
      label: "Connections",
      value: String(state.connections.length),
      // The hall ships with no sample stands, so a connection made from
      // here is a person by construction. Older saves still carry the
      // sample ones, which is why the middle case exists at all.
      note:
        people > 0
          ? `${people} with someone live`
          : state.connections.length > 0
            ? "none with a live person yet"
            : "none yet",
    },
    {
      label: "Days running",
      value: String(state.visitStreak),
      note: `best streak ${state.bestStreak}`,
    },
    {
      label: "Best arcade run",
      value: state.arcadeBest != null ? String(state.arcadeBest) : "—",
      note: state.arcadeBest != null ? "points over three games" : "not played yet",
    },
    {
      label: "Maps cleared",
      value: `${cleared.length}/${MAPS.length}`,
      note: golds.length > 0 ? `${golds.length} inside par` : "none inside par yet",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-line bg-paper px-3 py-2.5">
            <p className="micro text-[9px] text-muted">{c.label.toUpperCase()}</p>
            <p className="mt-0.5 font-display text-2xl leading-none">{c.value}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted">{c.note}</p>
          </div>
        ))}
      </div>

      {awards.length > 0 && (
        <div className="rounded-lg border border-gold bg-paper px-4 py-3">
          <p className="micro mb-2 text-[10px] text-muted">WHAT YOU HAVE WON</p>
          <ul className="flex flex-col gap-1.5">
            {awards.slice(0, 4).map((a) => (
              <li key={`${a.week}|${a.board}`} className="flex items-baseline gap-2 text-sm">
                <span className="font-mono text-xs" style={{ color: MEDAL[a.rank - 1] }}>
                  #{a.rank}
                </span>
                <span className="min-w-0 flex-1">
                  &ldquo;{a.title}&rdquo;
                  <span className="ml-2 text-xs text-muted">
                    {a.board}, {a.week}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Those titles are yours to wear — pick one on your profile. There is
            no other way to get one.
          </p>
        </div>
      )}

      {loading && <p className="text-sm text-muted">Reading the board…</p>}

      {!loading && !board && (
        <p className="text-sm leading-relaxed text-muted">
          The board is kept by the floor server, and it is not answering right
          now. Your own numbers above are stored on this device, so they are
          still right.
        </p>
      )}

      {board && (
        <>
          <p className="text-sm leading-relaxed text-muted">
            This week&rsquo;s standings — {board.week}, resetting{" "}
            {untilWords(board.endsAt)}. Top three of each table keep a rank and
            a title that is not for sale.
          </p>

          <Table
            title="TIME IN THE BUILDING"
            note="measured here"
            rows={board.boards.time}
            me={me}
            value={(r) => humanMs(r.ms)}
            empty="Nobody has clocked a minute yet this week."
          />
          <Table
            title="CONNECTIONS MADE"
            note="live people only"
            rows={board.boards.connections}
            me={me}
            value={(r) => String(r.count)}
            empty="No introductions yet this week."
          />
          <Table
            title="AFTER HOURS"
            note="maps cleared, then time"
            rows={board.boards.parkour}
            me={me}
            value={(r) => `${r.cleared}/${MAPS.length} · ${fmt(r.total)}`}
            empty="Nobody has finished a map yet this week."
          />
          <Table
            title="THE QUICK RUN"
            note="out of 300"
            rows={board.boards.arcade}
            me={me}
            value={(r) => String(r.score)}
            empty="No runs yet this week."
          />

          {board.lastWeek && (
            <div>
              <p className="micro mb-2 text-[10px] text-muted">
                LAST WEEK ({board.lastWeek.week})
              </p>
              <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
                {Object.entries(board.lastWeek.boards).map(([name, rows]) => (
                  <li key={name} className="px-4 py-2.5">
                    <p className="text-xs text-muted">{name}</p>
                    <p className="text-sm">
                      {(rows ?? []).map((r) => r.name).join(" · ") || "nobody"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-line bg-paper px-4 py-3">
            <p className="micro mb-1.5 text-[10px] text-muted">HOW MUCH TO TRUST THIS</p>
            <p className="text-xs leading-relaxed text-muted">
              Time in the building is measured by the server, from the moment
              you walk in to the moment you close the tab, so it is the one
              table nobody can talk their way onto. The other three are
              reported by your own browser: impossible parkour times are
              thrown out and arcade scores are capped, but a patient liar
              could still post a plausible number. Worth knowing before you
              take second place personally.
            </p>
          </div>

          <p className="text-xs text-muted">
            {board.players} {board.players === 1 ? "person" : "people"} tracked
            in the hall.
          </p>
        </>
      )}
    </div>
  );
}
