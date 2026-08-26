"use client";

/**
 * Operator console — /admin. Works only for accounts whose email is on the
 * server's ADMIN_EMAILS list. Everyone else — signed out, signed in as a
 * normal account — gets the site's ordinary 404, so the console does not
 * exist for them. Everything here is a thin form over the /admin/*
 * endpoints: grants (tier / founding / tickets), bans, kicks, stand
 * clearing, announcements, the events calendar. Membership grants replay
 * the full ceremony.
 */

import { useCallback, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { httpBase } from "@/lib/net";
import { syncNow } from "@/lib/store";
import PickMenu from "@/components/PickMenu";

interface Overview {
  floors: { floorId: string; online: number; stands: number }[];
  accounts: number;
  banned: { key: string; reason: string; ts: number; by: string }[];
  emailLive: boolean;
  emailFrom?: string;
  emailReplyTo?: string | null;
  uptimeSec: number;
  /** Stands that tripped the watch list. Saved, but waiting on a human. */
  flagged?: {
    ownerId: string;
    name: string;
    oneLiner: string;
    link: string;
    terms: string[];
    where: string;
    ts: number;
  }[];
}

/**
 * One person, as /admin/people hands them back: every id the hall knows for
 * them, joined into a single row.
 *
 * Both halves of "who is this" are here on purpose. `email` is the handle
 * you grant against and the only way to reach somebody; `id` is the handle
 * you ban, kick and clear stands against, and it is the ONLY handle a guest
 * has. Showing one without the other is what made this page need a data
 * file open in another window.
 */
interface Person {
  id: string;
  kind: "account" | "guest";
  email: string;
  name: string;
  /** The name they walk under, when it differs from the account's. */
  alias: string;
  company: string;
  standFloor: string;
  spotIndex: number | null;
  link: string;
  tier: string;
  badge: string | null;
  until: number | null;
  customer: string;
  tickets: number;
  created: number;
  lastSeen: number;
  online: boolean;
  where: string;
  banned: { reason: string; ts: number; by: string } | null;
  mailingList: boolean;
  devices: number;
  ref: string;
}

/** The owner attached to a business row by /admin/stands. */
interface StandOwner {
  id: string;
  kind: "account" | "guest";
  name: string;
  alias: string;
  email: string;
  tier: string;
  badge: string | null;
  banned: { reason: string; ts: number; by: string } | null;
  online: boolean;
  where: string;
}

/** One business anywhere in the building, with the person running it. */
interface StandRow {
  /**
   * Where it exists at all:
   *   stand  on a floor
   *   wall   on the public founders wall, no stand claimed
   *   draft  written and synced, never made public
   */
  source: "stand" | "wall" | "draft";
  /** "" for anything without a stand. */
  floorId: string;
  spotIndex: number | null;
  /** A practice-hall stand: real, but never listed in the directory. */
  practice: boolean;
  startup: {
    id: string;
    name: string;
    oneLiner: string;
    pitch: string;
    category: string;
    goal: string;
    link: string;
    seekingCofounder: boolean;
    verifiedRevenue: number;
    tier: string | null;
    sign: string;
  };
  owner: StandOwner;
  lastSeen: number;
}

/**
 * One row of the calendar, exactly as /admin/events hands it back — declared
 * here beside Overview because this page is typed off the wire, not off the
 * app's own models.
 */
interface AdminEvent {
  id: string;
  title: string;
  startMs: number;
  endMs?: number;
  where?: string;
  blurb?: string;
  href?: string;
}

async function adminPost(path: string, body: Record<string, unknown>) {
  const auth = getAuth();
  const res = await fetch(`${httpBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, token: auth?.token ?? "" }),
  });
  if (res.status === 404) throw new Error("not authorized (or server not updated)");
  return res.json();
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-end gap-2">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  width = "w-64",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  width?: string;
  /** "datetime-local" for the calendar; everything else here is text. */
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="micro text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`min-h-[44px] rounded-md border border-line px-3 text-sm placeholder:text-muted/60 ${width}`}
      />
    </label>
  );
}

/* 44px, not 40. Every button here is a finger target on a console its
   operator will end up using from a phone at least once, usually the once
   that matters. */
const BTN =
  "btn-press min-h-[44px] rounded-md bg-ink px-4 text-sm text-paper hover:bg-ink/85 disabled:opacity-50";

/**
 * The operator's own zone, named ("Europe/London"), never a UTC offset.
 * Read lazily: this module is evaluated on the server too, where the answer
 * is whatever the box is set to and has nothing to do with whoever is
 * looking at the screen.
 */
function localZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "your local time";
  } catch {
    return "your local time";
  }
}

/** "4m ago", "3h ago", "6d ago" — how long since the hall last saw them. */
function ago(ms: number): string {
  if (!ms) return "never";
  const s = Math.max(0, Date.now() - ms) / 1000;
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

/** A small square-cornered chip — the console's own tag, not the site's pills. */
function Tag({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "gold" | "verify" | "accent" }) {
  const tones = {
    muted: "border-line text-muted",
    gold: "border-gold/60 text-gold-deep",
    verify: "border-verify/50 text-verify",
    accent: "border-accent/50 text-accent",
  };
  return (
    <span className={`micro rounded-sm border px-1.5 py-0.5 ${tones[tone]}`}>{children}</span>
  );
}

/**
 * An event's time, drawn on the operator's clock — the same clock the
 * datetime-local field writes in, so a date typed a month or twelve hours
 * out reads back visibly wrong instead of quietly right.
 */
function fmtWhen(startMs: number, endMs?: number): string {
  const full: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  };
  const start = new Date(startMs);
  const head = start.toLocaleString(undefined, full);
  if (!endMs) return head;
  const end = new Date(endMs);
  const sameDay = start.toDateString() === end.toDateString();
  const tail = end.toLocaleString(undefined, sameDay ? { hour: "2-digit", minute: "2-digit" } : full);
  return `${head} – ${tail}`;
}

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [gate, setGate] = useState<"checking" | "admin" | "denied">("checking");
  const [log, setLog] = useState<string[]>([]);
  const say = (s: string) => setLog((l) => [`${new Date().toLocaleTimeString()} — ${s}`, ...l].slice(0, 30));

  const refresh = useCallback(async () => {
    try {
      const o = await adminPost("/admin/overview", {});
      if (o.error) throw new Error(o.error);
      setOverview(o);
      setGate("admin");
    } catch {
      setGate("denied");
    }
  }, []);

  const [events, setEvents] = useState<AdminEvent[]>([]);

  // ---- the roster ----
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleCount, setPeopleCount] = useState<{ total: number; accounts: number; guests: number; matched: number } | null>(null);
  const [pq, setPq] = useState("");
  const [pLoading, setPLoading] = useState(false);
  /** Whose email was just copied — the button says so for a couple of seconds. */
  const [copied, setCopied] = useState("");

  // ---- every business in the building ----
  const [standRows, setStandRows] = useState<StandRow[]>([]);
  const [standFloors, setStandFloors] = useState<{ floorId: string; count: number }[]>([]);
  const [noStandCount, setNoStandCount] = useState(0);
  /** "" = all floors, a floor id, or "__registry" for the ones with no stand. */
  const [standPick, setStandPick] = useState("");
  /** "" = all categories; filtering is client-side over the loaded rows. */
  const [catPick, setCatPick] = useState("");
  /**
   * Why the businesses list came back empty, when it did. An empty hall
   * and a floor server that has never heard of /admin/stands both used to
   * render as "Nothing here yet" — and the second one is a deploy problem
   * wearing an empty room's clothes. The operator has to be able to tell
   * them apart from the console itself.
   */
  const [standsErr, setStandsErr] = useState("");

  const loadStands = useCallback(async (floorId: string) => {
    try {
      const r = await adminPost("/admin/stands", { floorId });
      if (Array.isArray(r?.stands)) {
        setStandRows(r.stands as StandRow[]);
        setStandFloors(Array.isArray(r.floors) ? (r.floors as { floorId: string; count: number }[]) : []);
        setNoStandCount(Number(r.noStand) || 0);
        setStandsErr("");
      } else {
        setStandsErr(typeof r?.error === "string" ? r.error : "the server answered with something unexpected");
      }
    } catch (err) {
      setStandsErr(err instanceof Error ? err.message : "unreachable");
    }
  }, []);

  const loadPeople = useCallback(async (q: string) => {
    setPLoading(true);
    try {
      const r = await adminPost("/admin/people", { q, limit: 200 });
      if (Array.isArray(r?.people)) {
        setPeople(r.people as Person[]);
        setPeopleCount({
          total: Number(r.total) || 0,
          accounts: Number(r.accounts) || 0,
          guests: Number(r.guests) || 0,
          matched: Number(r.matched) || 0,
        });
      }
    } catch {
      /* the gate above already reports an unreachable server */
    } finally {
      setPLoading(false);
    }
  }, []);

  // A bare POST (token only) is the read. Failures stay quiet: the gate
  // above already reports an unreachable server, and a second complaint
  // about the same outage is noise.
  const loadEvents = useCallback(async () => {
    try {
      const r = await adminPost("/admin/events", {});
      if (Array.isArray(r?.events)) setEvents(r.events as AdminEvent[]);
    } catch {
      /* offline — the calendar just stays empty */
    }
  }, []);

  useEffect(() => {
    setReady(true);
    if (!getAuth()) {
      setGate("denied"); // no session — nothing to probe
      return;
    }
    void refresh();
    void loadEvents();
    void loadPeople("");
    void loadStands("");
  }, [refresh, loadEvents, loadPeople, loadStands]);

  // grant form
  const [gEmail, setGEmail] = useState("");
  const [gTier, setGTier] = useState<"keep" | "pro" | "founder" | "founding" | "none">("keep");
  const [gTickets, setGTickets] = useState("");
  // moderation forms
  const [banTarget, setBanTarget] = useState("");
  const [banReason, setBanReason] = useState("");
  const [unbanTarget, setUnbanTarget] = useState("");
  const [kickId, setKickId] = useState("");
  const [standFloor, setStandFloor] = useState("");
  const [standOwner, setStandOwner] = useState("");
  const [wallOwner, setWallOwner] = useState("");
  const [announceText, setAnnounceText] = useState("");
  // events form
  const [evTitle, setEvTitle] = useState("");
  const [evStart, setEvStart] = useState("");
  const [evEnd, setEvEnd] = useState("");
  const [evWhere, setEvWhere] = useState("");
  const [evBlurb, setEvBlurb] = useState("");
  const [evHref, setEvHref] = useState("");

  const auth = ready ? getAuth() : null;

  // Returns the parsed reply (null on error or a dead server) so callers
  // that get state back in the response — /admin/events answers with the
  // whole calendar — can use it instead of asking again and racing.
  const run = async (
    label: string,
    path: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> => {
    try {
      const r = await adminPost(path, body);
      if (r.error) {
        say(`${label}: ${r.error}`);
        return null;
      }
      say(`${label}: ok ${JSON.stringify(r).slice(0, 140)}`);
      if (path === "/admin/grant") {
        const self = typeof body.email === "string" && body.email === auth?.email;
        // a grant to the signed-in account applies immediately — pull the
        // entitlement now (the global MembershipWatcher plays the ceremony
        // on the RECIPIENT's screen, yours included when you grant yourself)
        if (self) syncNow();
        else say("granted — they'll get the ceremony on their screen when it lands");
      }
      void refresh();
      // A grant or a ban changes a row on the roster, so re-read it with the
      // search still applied — the operator is usually looking at the person
      // they just acted on and needs to see it land.
      void loadPeople(pq);
      void loadStands(standPick);
      return r;
    } catch (err) {
      say(`${label}: ${err instanceof Error ? err.message : "failed"}`);
      return null;
    }
  };

  /**
   * Carry a person from the roster down into a form.
   *
   * Deliberately NOT a one-click ban. A roster is a list you scroll and
   * scan, and the two things you do from it are irreversible for the person
   * on the other end — so a row hands its ids to the form and scrolls you
   * there, and the actual button is still one you had to aim at.
   *
   * Guests have no address, so the grant route is closed for them and the
   * button says why rather than sending an empty email the server refuses.
   */
  const sendTo = (
    who: { id: string; email: string },
    where: "grant" | "moderate",
    floorId?: string,
  ) => {
    if (where === "grant") {
      setGEmail(who.email);
      say(`grant form loaded with ${who.email}`);
    } else {
      // Ban by email when there is one — it catches the account whichever
      // browser it signs in from — and always keep the id for kick and
      // stand-clear, which only ever work on an id.
      setBanTarget(who.email || who.id);
      setUnbanTarget(who.email || who.id);
      setKickId(who.id);
      setStandOwner(who.id);
      if (floorId) setStandFloor(floorId);
      setWallOwner(who.id);
      say(`moderation forms loaded with ${who.email || who.id}`);
    }
    document.getElementById(where === "grant" ? "grant-section" : "moderation-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const copyEmail = async (who: { id: string; email: string }) => {
    try {
      await navigator.clipboard.writeText(who.email);
      setCopied(who.id);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      say("could not reach the clipboard — select the address by hand");
    }
  };

  const grant = () =>
    run("grant", "/admin/grant", {
      email: gEmail.trim(),
      ...(gTier === "founding"
        ? { tier: "founder", badge: "founding" }
        : gTier !== "keep"
          ? { tier: gTier }
          : {}),
      ...(gTickets.trim() ? { tickets: Number(gTickets) } : {}),
    });

  const addEvent = async () => {
    const title = evTitle.trim();
    // A datetime-local value has no zone in it ("2026-09-03T19:00"), and
    // Date reads that shape as LOCAL time. That is the whole point: the
    // operator types the wall clock of the room, and we send the epoch ms
    // that means. Never append a Z here, and never build the number by
    // hand — the browser already knows the offset, including the DST one
    // in force on that date rather than today's.
    const startMs = new Date(evStart).getTime();
    const endMs = evEnd ? new Date(evEnd).getTime() : NaN;
    if (!title || !Number.isFinite(startMs)) {
      say("event: needs a title and a start date");
      return;
    }
    const r = await run("event add", "/admin/events", {
      title,
      startMs,
      ...(Number.isFinite(endMs) ? { endMs } : {}),
      ...(evWhere.trim() ? { where: evWhere.trim() } : {}),
      ...(evBlurb.trim() ? { blurb: evBlurb.trim() } : {}),
      ...(evHref.trim() ? { href: evHref.trim() } : {}),
    });
    if (!Array.isArray(r?.events)) return; // rejected — run() already said why
    setEvents(r.events as AdminEvent[]);
    setEvTitle("");
    setEvStart("");
    setEvEnd("");
    setEvWhere("");
    setEvBlurb("");
    setEvHref("");
  };

  const removeEvent = async (id: string) => {
    const r = await run("event remove", "/admin/events", { remove: id });
    if (Array.isArray(r?.events)) setEvents(r.events as AdminEvent[]);
  };

  if (!ready) return null;
  // anyone who isn't the verified operator gets the site's ordinary 404 —
  // signed out, wrong account, server not answering: the page doesn't exist
  if (gate === "denied" || !auth) notFound();
  if (gate === "checking") return null;

  // Local-time formatting is safe from here down: the page renders null
  // until `ready`, so the server never emits a date string for the client
  // to disagree with on hydration.
  const zone = localZone();
  const now = Date.now();
  const calendar = [...events].sort((a, b) => a.startMs - b.startMs);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="font-display text-3xl">Operator console</h1>
        <p className="mt-2 text-sm text-muted">
          Signed in as {auth.email || auth.name}.
        </p>
      </header>

      <section className="panel p-5" aria-label="Overview">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-xl">Floors right now</h2>
          <button type="button" onClick={() => void refresh()} className="micro text-muted hover:text-ink">
            refresh ↻
          </button>
        </div>
        {overview ? (
          <>
            <p className="micro mt-2 text-muted">
              {overview.accounts} accounts · email {overview.emailLive ? "live" : "OFF"} · up{" "}
              {Math.round(overview.uptimeSec / 60)}m
            </p>
            {overview.emailFrom && (
              // The From line, in full. Whatever EMAIL_FROM is set to on the
              // server is what recipients see when they tap the sender — and
              // if that is somebody's personal address, this is where it
              // shows up rather than in a stranger's inbox.
              <p className="micro mt-1 break-all text-muted">
                letters signed <span className="text-ink">{overview.emailFrom}</span>
                {overview.emailReplyTo ? (
                  <> · replies to <span className="text-ink">{overview.emailReplyTo}</span></>
                ) : (
                  <> · no reply-to set</>
                )}
              </p>
            )}
            <ul className="mt-3 space-y-1 text-sm">
              {overview.floors.length === 0 && <li className="text-muted">No one on any floor.</li>}
              {overview.floors.map((f) => (
                <li key={f.floorId} className="flex gap-4">
                  <span className="w-40 truncate">{f.floorId}</span>
                  <span className="text-muted">{f.online} online</span>
                  <span className="text-muted">{f.stands} stands</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">Loading…</p>
        )}
      </section>

      {/* The roster sits directly under the floor counts and above every
          form, because the order of the page is the order of the job: see
          who is here, find the one you mean, then act on them. */}
      <section className="panel p-5" aria-label="People">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-xl">People</h2>
          {peopleCount && (
            <p className="micro text-muted">
              {peopleCount.total} known · {peopleCount.accounts} with accounts ·{" "}
              {peopleCount.guests} guests
            </p>
          )}
        </div>
        <p className="micro mt-1 text-muted">
          Everyone the hall knows, newest first. Only you can see this page.
        </p>

        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void loadPeople(pq.trim());
          }}
        >
          <Field
            label="Find someone"
            value={pq}
            onChange={setPq}
            placeholder="name, email, company or id"
            width="w-72"
          />
          <button type="submit" className={BTN} disabled={pLoading}>
            {pLoading ? "Looking…" : "Search"}
          </button>
          {pq && (
            <button
              type="button"
              className="micro min-h-[44px] px-2 text-muted hover:text-ink"
              onClick={() => {
                setPq("");
                void loadPeople("");
              }}
            >
              clear
            </button>
          )}
        </form>

        <ul className="mt-4 flex flex-col divide-y divide-line">
          {people.length === 0 && (
            <li className="py-3 text-sm text-muted">
              {pLoading ? "Loading…" : pq ? "Nobody matches that." : "Nobody yet."}
            </li>
          )}
          {people.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink">{p.name || "(no name)"}</span>
                {p.alias && (
                  <span className="micro text-muted">walks as &ldquo;{p.alias}&rdquo;</span>
                )}
                {p.online ? (
                  <Tag tone="verify">on {p.where || "a floor"}</Tag>
                ) : (
                  <Tag>{ago(p.lastSeen)}</Tag>
                )}
                {p.kind === "guest" && <Tag tone="accent">guest — no account</Tag>}
                {p.tier !== "free" && (
                  <Tag tone="gold">
                    {p.tier}
                    {p.badge === "founding" ? " ✦ founding" : ""}
                    {p.until ? ` · until ${new Date(p.until).toLocaleDateString()}` : ""}
                  </Tag>
                )}
                {p.banned && <Tag tone="accent">banned: {p.banned.reason || "no reason"}</Tag>}
              </div>

              {/* Both handles, always. The address is what you grant to; the
                  id is what you ban, kick and clear a stand with. */}
              <div className="flex flex-col gap-0.5 text-xs text-muted">
                <span className="break-all">
                  {p.email ? (
                    <span className="text-ink">{p.email}</span>
                  ) : (
                    <span className="italic">no email on file</span>
                  )}
                  {p.mailingList && " · on the mailing list"}
                </span>
                <span className="break-all font-mono text-xs">{p.id}</span>
                <span>
                  {p.company ? <span className="text-ink">{p.company}</span> : "no company"}
                  {p.standFloor
                    ? ` · stand on ${p.standFloor}${p.spotIndex !== null ? ` #${p.spotIndex}` : ""}`
                    : " · no stand"}
                  {p.tickets > 0 && ` · ${p.tickets} tickets bought`}
                  {p.customer && ` · via ${p.customer}`}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="micro rounded-sm border border-line px-2 py-1 hover:border-ink disabled:opacity-40"
                  disabled={!p.email}
                  onClick={() => void copyEmail(p)}
                >
                  {copied === p.id ? "copied ✓" : "copy email"}
                </button>
                <button
                  type="button"
                  className="micro rounded-sm border border-line px-2 py-1 hover:border-ink disabled:opacity-40"
                  disabled={!p.email}
                  title={p.email ? "" : "a guest has no account to grant to"}
                  onClick={() => sendTo(p, "grant")}
                >
                  give membership →
                </button>
                <button
                  type="button"
                  className="micro rounded-sm border border-line px-2 py-1 hover:border-accent hover:text-accent"
                  onClick={() => sendTo(p, "moderate", p.standFloor)}
                >
                  ban or kick →
                </button>
                {p.standFloor && (
                  <a
                    href={`/stand/${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="micro rounded-sm border border-line px-2 py-1 hover:border-ink"
                  >
                    see their stand ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Businesses, floor by floor. /admin/people answers "who is here";
          this answers "what is here", which is where moderation actually
          starts — you see a stand, then you need the person behind it. */}
      {(() => {
        // The category filter runs over the rows already loaded, so the two
        // menus compose: pick a floor, then narrow to a lane on it. Counts
        // are computed per category from the same rows the list shows.
        const catCounts = new Map<string, number>();
        for (const r of standRows) {
          const c = r.startup.category || "Uncategorized";
          catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
        }
        const catOptions = [
          { value: "", label: "All categories", hint: String(standRows.length) },
          ...[...catCounts.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([c, n]) => ({ value: c, label: c, hint: String(n) })),
        ];
        const shown = catPick
          ? standRows.filter((r) => (r.startup.category || "Uncategorized") === catPick)
          : standRows;
        return (
      <section className="panel p-5" aria-label="Businesses">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-xl">Businesses</h2>
          <span className="micro text-muted">{shown.length} shown</span>
        </div>
        <p className="micro mt-1 text-muted">
          Every stand in the building and who runs it. Only you can see this page.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <PickMenu
            label="Floor"
            value={standPick}
            onChange={(v) => {
              setStandPick(v);
              setCatPick("");
              void loadStands(v);
            }}
            options={[
              {
                value: "",
                label: "All floors",
                hint: String(standFloors.reduce((n, f) => n + f.count, 0) + noStandCount),
              },
              ...standFloors.map((f) => ({
                value: f.floorId,
                label: f.floorId,
                hint: String(f.count),
              })),
              { value: "__registry", label: "Registered, no stand", hint: String(noStandCount) },
            ]}
          />
          <PickMenu label="Category" value={catPick} onChange={setCatPick} options={catOptions} />
        </div>

        {/* An empty list and a server that has never heard of this list are
            different problems, and only one of them is fixed by waiting. */}
        {standsErr && (
          <p className="mt-3 rounded-md border border-accent/40 bg-accent-soft/30 px-3 py-2 text-sm text-accent-strong">
            The floor server didn&rsquo;t answer this ({standsErr}). If /health shows no{" "}
            <span className="font-mono text-xs">&quot;stands&quot;:true</span> flag, the VPS is
            still on an older build — run <span className="font-mono text-xs">scripts/deploy-floor.sh</span>{" "}
            and refresh.
          </p>
        )}

        <ul className="mt-4 flex flex-col divide-y divide-line">
          {shown.length === 0 && !standsErr && (
            <li className="py-3 text-sm text-muted">
              {catPick ? "Nothing in that category here." : "Nothing here yet."}
            </li>
          )}
          {shown.map((r) => (
            <li key={`${r.floorId}:${r.owner.id}`} className="flex flex-col gap-2 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink">{r.startup.name}</span>
                {r.startup.category && <Tag>{r.startup.category}</Tag>}
                {r.source === "stand" ? (
                  <Tag>
                    {r.floorId}
                    {r.spotIndex !== null ? ` · spot ${r.spotIndex}` : ""}
                  </Tag>
                ) : r.source === "wall" ? (
                  <Tag tone="accent">no stand — on the founders wall</Tag>
                ) : (
                  <Tag>draft — not public anywhere</Tag>
                )}
                {r.practice && <Tag tone="accent">practice hall</Tag>}
                {r.startup.seekingCofounder && <Tag tone="verify">seeking co-founder</Tag>}
                {r.startup.tier && <Tag tone="gold">{r.startup.tier}</Tag>}
              </div>

              {r.startup.oneLiner && (
                <p className="text-xs text-muted">{r.startup.oneLiner}</p>
              )}
              {r.startup.link && (
                <a
                  href={r.startup.link}
                  target="_blank"
                  rel="noreferrer nofollow"
                  className="break-all text-xs text-accent hover:underline"
                >
                  {r.startup.link}
                </a>
              )}

              {/* Who to talk to about it — the whole reason this list exists. */}
              <div className="flex flex-col gap-0.5 border-l-2 border-line pl-3 text-xs text-muted">
                <span>
                  run by <span className="text-ink">{r.owner.name || "(no name)"}</span>
                  {r.owner.alias && ` — walks as “${r.owner.alias}”`}
                  {r.owner.online ? " · here now" : ` · ${ago(r.lastSeen)}`}
                </span>
                <span className="break-all">
                  {r.owner.email ? (
                    <span className="text-ink">{r.owner.email}</span>
                  ) : (
                    <span className="italic">guest — no email on file</span>
                  )}
                </span>
                <span className="break-all font-mono text-xs">{r.owner.id}</span>
                {r.owner.banned && (
                  <span className="text-accent">
                    already banned: {r.owner.banned.reason || "no reason given"}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="micro rounded-sm border border-line px-2 py-1 hover:border-ink disabled:opacity-40"
                  disabled={!r.owner.email}
                  onClick={() => void copyEmail(r.owner)}
                >
                  {copied === r.owner.id ? "copied ✓" : "copy email"}
                </button>
                <button
                  type="button"
                  className="micro rounded-sm border border-line px-2 py-1 hover:border-ink disabled:opacity-40"
                  disabled={!r.owner.email}
                  title={r.owner.email ? "" : "a guest has no account to grant to"}
                  onClick={() => sendTo(r.owner, "grant")}
                >
                  give membership →
                </button>
                <button
                  type="button"
                  className="micro rounded-sm border border-line px-2 py-1 hover:border-accent hover:text-accent"
                  onClick={() => sendTo(r.owner, "moderate", r.floorId)}
                >
                  ban, kick or take the stand down →
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
        );
      })()}

      <section className="panel p-5" id="grant-section" aria-label="Grants">
        <h2 className="font-display text-xl">Grant</h2>
        <p className="micro mt-1 text-muted">
          Set a membership, the founding badge, or add tickets to any account.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          <Row>
            <Field label="Account email" value={gEmail} onChange={setGEmail} placeholder="someone@example.com" />
            <label className="flex flex-col gap-1">
              <span className="micro text-muted">Membership</span>
              <select
                value={gTier}
                onChange={(e) => setGTier(e.target.value as typeof gTier)}
                className="h-10 rounded-md border border-line bg-panel px-2 text-sm"
              >
                <option value="keep">keep as is</option>
                <option value="founding">Founding member (Founder+ + badge)</option>
                <option value="founder">Founder+</option>
                <option value="pro">Pro</option>
                <option value="none">none (revoke)</option>
              </select>
            </label>
            <Field label="Tickets (+/-)" value={gTickets} onChange={setGTickets} placeholder="500" width="w-28" />
            <button type="button" className={BTN} onClick={() => void grant()} disabled={!gEmail.trim()}>
              Grant
            </button>
          </Row>
          {auth.email && (
            <button
              type="button"
              className="micro w-fit rounded-full border border-gold/60 px-3 py-1.5 text-gold-deep hover:border-gold"
              onClick={() =>
                run("grant (self)", "/admin/grant", {
                  email: auth.email,
                  tier: "founder",
                  badge: "founding",
                })
              }
            >
              ✦ Make me a Founding member
            </button>
          )}
        </div>
      </section>

      <section className="panel p-5" id="moderation-section" aria-label="Moderation">
        <h2 className="font-display text-xl">Moderation</h2>
        <div className="mt-3 flex flex-col gap-4">
          <Row>
            <Field label="Ban (email or profile id)" value={banTarget} onChange={setBanTarget} />
            <Field label="Reason" value={banReason} onChange={setBanReason} placeholder="spam" width="w-40" />
            <button
              type="button"
              className={BTN}
              disabled={!banTarget.trim()}
              onClick={() =>
                run("ban", "/admin/ban", {
                  ...(banTarget.includes("@") ? { email: banTarget.trim() } : { id: banTarget.trim() }),
                  reason: banReason,
                })
              }
            >
              Ban
            </button>
          </Row>
          <Row>
            <Field label="Unban (email or profile id)" value={unbanTarget} onChange={setUnbanTarget} />
            <button
              type="button"
              className={BTN}
              disabled={!unbanTarget.trim()}
              onClick={() =>
                run("unban", "/admin/unban", {
                  ...(unbanTarget.includes("@") ? { email: unbanTarget.trim() } : { id: unbanTarget.trim() }),
                })
              }
            >
              Unban
            </button>
          </Row>
          <Row>
            <Field label="Kick from floors (profile id)" value={kickId} onChange={setKickId} />
            <button
              type="button"
              className={BTN}
              disabled={!kickId.trim()}
              onClick={() => run("kick", "/admin/kick", { id: kickId.trim() })}
            >
              Kick
            </button>
          </Row>
          <Row>
            <Field label="Clear stand — floor id" value={standFloor} onChange={setStandFloor} placeholder="main-hall" width="w-40" />
            <Field label="Owner profile id" value={standOwner} onChange={setStandOwner} />
            <button
              type="button"
              className={BTN}
              disabled={!standFloor.trim() || !standOwner.trim()}
              onClick={() =>
                run("stand-clear", "/admin/stand-clear", {
                  floorId: standFloor.trim(),
                  ownerId: standOwner.trim(),
                })
              }
            >
              Clear stand
            </button>
          </Row>
          <Row>
            {/* Clearing a stand only reaches one floor, and a spam listing
                usually has no stand at all — registering a startup is the
                cheap way onto the founders wall. This takes the listing off
                every public surface at once, without banning: a wrong
                listing and a bad actor are different problems. */}
            <Field label="Wall takedown — owner profile id" value={wallOwner} onChange={setWallOwner} />
            <button
              type="button"
              className={BTN}
              disabled={!wallOwner.trim()}
              onClick={() => run("wall-remove", "/admin/wall-remove", { ownerId: wallOwner.trim() })}
            >
              Remove listing
            </button>
          </Row>
          {overview && overview.banned.length > 0 && (
            <div>
              <span className="micro text-muted">Currently banned</span>
              <ul className="mt-1 space-y-0.5 text-xs text-muted">
                {overview.banned.map((b) => (
                  <li key={b.key}>
                    <span className="text-ink">{b.key}</span>
                    {b.reason && ` — ${b.reason}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* The half of moderation a word list cannot do. The block list stops
          what is indefensible; everything ambiguous lands here for a person
          to read, because "is this legal" is not a question a regex gets to
          answer. Empty is the normal state. */}
      <section className="panel p-5" aria-label="Flagged listings">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-xl">Needs a look</h2>
          <span className="micro text-muted">{overview?.flagged?.length ?? 0} waiting</span>
        </div>
        <p className="micro mt-1 text-muted">
          Stands that tripped the watch list. They are LIVE — this is a
          queue, not a hold. Use the takedown above to remove one.
        </p>
        {overview?.flagged?.length ? (
          <ul className="mt-3 space-y-3">
            {overview.flagged.map((f) => (
              <li key={`${f.ownerId}-${f.ts}`} className="border-t border-line pt-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-base">{f.name || "(no name)"}</span>
                  <span className="micro text-accent">{f.terms.join(", ")}</span>
                  <span className="micro text-muted">
                    {f.where} · {new Date(f.ts).toLocaleString()}
                  </span>
                </div>
                {f.oneLiner && <p className="mt-0.5 text-sm text-muted">{f.oneLiner}</p>}
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <code className="text-xs text-muted">{f.ownerId}</code>
                  <button
                    type="button"
                    onClick={() => setWallOwner(f.ownerId)}
                    className="micro text-accent hover:underline"
                  >
                    load into takedown
                  </button>
                  {f.link && (
                    <a
                      href={f.link}
                      target="_blank"
                      rel="nofollow ugc noopener noreferrer"
                      className="micro text-accent hover:underline"
                    >
                      {f.link.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">Nothing waiting.</p>
        )}
      </section>

      <section className="panel p-5" aria-label="Announce">
        <h2 className="font-display text-xl">Announce</h2>
        <p className="micro mt-1 text-muted">Posts a 📣 line into every live floor&rsquo;s activity feed.</p>
        <Row>
          <Field label="Message" value={announceText} onChange={setAnnounceText} width="w-full max-w-md" />
          <button
            type="button"
            className={BTN}
            disabled={!announceText.trim()}
            onClick={() => {
              void run("announce", "/admin/announce", { text: announceText.trim() });
              setAnnounceText("");
            }}
          >
            Announce
          </button>
        </Row>
      </section>

      {/* The calendar. These ride out on the /presence poll every client
          already makes, so an event added here shows up on the floors
          within a minute and drops off by itself once it is over. Open
          Doors is not in this list — that one is the hardcoded weekly
          window and has to survive this server being down. */}
      <section className="panel p-5" aria-label="Events">
        <h2 className="font-display text-xl">Events</h2>
        <p className="micro mt-1 text-muted">
          Shown and entered in your own clock ({zone}). Check the zone before you post one.
        </p>
        {calendar.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {calendar.map((e) => {
              const over = (e.endMs ?? e.startMs) <= now;
              return (
                <li
                  key={e.id}
                  className="flex flex-wrap items-start justify-between gap-2 border-t border-line pt-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-display text-base">{e.title}</span>
                      {over && <span className="micro text-muted">over · no longer sent out</span>}
                    </div>
                    <p className="micro mt-0.5 text-muted">
                      {fmtWhen(e.startMs, e.endMs)} · {zone}
                      {e.where ? ` · ${e.where}` : ""}
                    </p>
                    {e.blurb && <p className="mt-0.5 text-sm text-muted">{e.blurb}</p>}
                    {e.href && (
                      <a
                        href={e.href}
                        target="_blank"
                        rel="nofollow ugc noopener noreferrer"
                        className="micro text-accent hover:underline"
                      >
                        {e.href.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeEvent(e.id)}
                    className="btn-press min-h-[44px] rounded-md border border-line px-3 text-sm text-muted hover:border-ink hover:text-ink"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">Nothing on the calendar.</p>
        )}
        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
          <Row>
            <Field
              label="Title"
              value={evTitle}
              onChange={setEvTitle}
              placeholder="Demo night"
              width="w-full max-w-xs"
            />
            <Field label="Starts" type="datetime-local" value={evStart} onChange={setEvStart} width="w-52" />
            <Field
              label="Ends (optional)"
              type="datetime-local"
              value={evEnd}
              onChange={setEvEnd}
              width="w-52"
            />
          </Row>
          <Row>
            <Field
              label="Where (optional)"
              value={evWhere}
              onChange={setEvWhere}
              placeholder="Main hall"
              width="w-40"
            />
            <Field
              label="Blurb (optional)"
              value={evBlurb}
              onChange={setEvBlurb}
              placeholder="Ten founders, five minutes each."
              width="w-full max-w-sm"
            />
          </Row>
          <Row>
            <Field label="Link (optional)" value={evHref} onChange={setEvHref} placeholder="https://" />
            <button
              type="button"
              className={BTN}
              disabled={!evTitle.trim() || !evStart}
              onClick={() => void addEvent()}
            >
              Add event
            </button>
          </Row>
        </div>
      </section>

      {log.length > 0 && (
        <section className="panel p-5" aria-label="Action log">
          <h2 className="font-display text-xl">Log</h2>
          <ul className="mt-2 space-y-1 font-mono text-xs text-muted">
            {log.map((l, i) => (
              // break-all: the log prints raw JSON replies, and a run of
              // {"key":"value", has no legal break point — one event add
              // used to widen the whole page at 360px.
              <li key={i} className="min-w-0 break-all">
                {l}
              </li>
            ))}
          </ul>
        </section>
      )}

    </main>
  );
}
