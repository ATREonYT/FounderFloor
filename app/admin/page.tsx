"use client";

/**
 * Operator console — /admin. Works only for accounts whose email is on the
 * server's ADMIN_EMAILS list; everyone else gets the same 404 the server
 * returns for unknown paths, and this page just says "not authorized".
 * Everything here is a thin form over the /admin/* endpoints: grants
 * (tier / founding / tickets), bans, kicks, stand clearing, announcements.
 */

import { useCallback, useEffect, useState } from "react";
import { getAuth } from "@/lib/auth";
import { httpBase } from "@/lib/net";

interface Overview {
  floors: { floorId: string; online: number; stands: number }[];
  accounts: number;
  banned: { key: string; reason: string; ts: number; by: string }[];
  emailLive: boolean;
  uptimeSec: number;
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  width?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="micro text-muted">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-10 rounded-md border border-line px-3 text-sm placeholder:text-muted/60 ${width}`}
      />
    </label>
  );
}

const BTN = "btn-press h-10 rounded-md bg-ink px-4 text-sm text-paper hover:bg-ink/85 disabled:opacity-50";

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [denied, setDenied] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const say = (s: string) => setLog((l) => [`${new Date().toLocaleTimeString()} — ${s}`, ...l].slice(0, 30));

  const refresh = useCallback(async () => {
    try {
      const o = await adminPost("/admin/overview", {});
      if (o.error) throw new Error(o.error);
      setOverview(o);
      setDenied(false);
    } catch {
      setDenied(true);
    }
  }, []);

  useEffect(() => {
    setReady(true);
    void refresh();
  }, [refresh]);

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
  const [announceText, setAnnounceText] = useState("");

  const auth = ready ? getAuth() : null;

  const run = async (label: string, path: string, body: Record<string, unknown>) => {
    try {
      const r = await adminPost(path, body);
      if (r.error) say(`${label}: ${r.error}`);
      else say(`${label}: ok ${JSON.stringify(r).slice(0, 140)}`);
      void refresh();
    } catch (err) {
      say(`${label}: ${err instanceof Error ? err.message : "failed"}`);
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

  if (!ready) return null;

  if (!auth) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl">Operator console</h1>
        <p className="mt-3 text-sm text-muted">
          Sign in with the operator account on your profile page first.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="font-display text-3xl">Operator console</h1>
        <p className="mt-2 text-sm text-muted">
          Signed in as {auth.email || auth.name}.{" "}
          {denied &&
            "This account is not on the server's admin list (or the floor server hasn't been updated) — every action below will be refused."}
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
          <p className="mt-2 text-sm text-muted">{denied ? "Not authorized." : "Loading…"}</p>
        )}
      </section>

      <section className="panel p-5" aria-label="Grants">
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

      <section className="panel p-5" aria-label="Moderation">
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

      {log.length > 0 && (
        <section className="panel p-5" aria-label="Action log">
          <h2 className="font-display text-xl">Log</h2>
          <ul className="mt-2 space-y-1 font-mono text-xs text-muted">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
