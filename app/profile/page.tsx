"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isValidLogo, syncNow, useAppState } from "@/lib/store";
import { getAuth } from "@/lib/auth";
import { registerStartup, unregisterStartup } from "@/lib/social";
import { RANKS, rankFor } from "@/lib/ranks";
import { FLOORS } from "@/lib/data/floors";
import { earnedTitles, questStates } from "@/lib/data/quests";
import {
  TIER_ORDER,
  type BannerTrim,
  type BoothProp,
  type BoothStyle,
  type CarpetPattern,
  type GlyphId,
  type Startup,
  type SubTier,
} from "@/lib/types";
import {
  BOOTH_PROPS,
  BOOTH_STYLES,
  BOOTH_SWATCHES,
  EARN,
  MAX_EQUIPPED_PROPS,
  dailyTickets,
  ownsItem,
  walletBalance,
} from "@/lib/data/shop";
import AccountCard from "@/components/AccountCard";
import AvatarPicker from "@/components/AvatarPicker";
import BoothPreview from "@/components/BoothPreview";
import RankBadge from "@/components/RankBadge";
import PixelGlyph, { GLYPH_IDS } from "@/components/PixelGlyph";
import { TIER_LABEL, TIER_PRICE, TIER_PRICE_ANNUAL } from "@/components/TierTag";
import {
  FOUNDING_OFFER,
  TICKET_PACKS,
  TIER_PERKS,
  TIER_PRICING,
  annualFreeMonths,
  billingLive,
  checkoutLink,
  foundingCheckoutLink,
  ticketPackLink,
  ticketPacksLive,
  type BillingCycle,
} from "@/lib/pricing";
import Toast, { type ToastData } from "@/components/Toast";
import ConfettiBurst from "@/components/ConfettiBurst";
import MembershipCeremony from "@/components/MembershipCeremony";
import TicketIcon from "@/components/TicketIcon";

const SWATCHES = BOOTH_SWATCHES;

const TRIMS: { id: BannerTrim; label: string }[] = [
  { id: "plain", label: "Plain" },
  { id: "stripes", label: "Stripes" },
  { id: "checker", label: "Checker" },
  { id: "dots", label: "Dots" },
];

const PATTERNS: { id: CarpetPattern; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "border", label: "Border" },
  { id: "stripes", label: "Stripes" },
];

const TIER_BLURB: Record<SubTier, string> = {
  free: "The public floors. Plenty to see.",
  pro: "Everything in Free, plus the quieter floors.",
  founder: "Every floor, velvet rope included.",
};

/**
 * The full badge catalog — every badge that exists, with how to earn it.
 * The Badge book renders all of them (earned bright, locked gray), so this
 * doubles as the game's public promise of what's earnable.
 */
const BADGE_META: Record<string, { name: string; blurb: string; howTo: string; glyph: GlyphId }> = {
  "tutorial-grad": {
    name: "Tutorial Graduate",
    blurb: "Learned the ropes from Pixel, start to finish.",
    howTo: "Finish the tutorial round — Start tutorial in the lobby.",
    glyph: "star",
  },
  "first-steps": {
    name: "First Steps",
    blurb: "Took the tour — or knew the way already.",
    howTo: "Finish (or skip) the floor tour.",
    glyph: "star",
  },
  "demo-night": {
    name: "Demo Night",
    blurb: "In the hall while it was live.",
    howTo: "Be on a floor during a live Demo Night event.",
    glyph: "bolt",
  },
  rounds: {
    name: "Making Rounds",
    blurb: "Chatted with three different founders.",
    howTo: "Say something to three different founders. Also unlocks the Rocket reaction.",
    glyph: "rocket",
  },
  connector: {
    name: "Connector",
    blurb: "Three connections and counting.",
    howTo: "Make three connections. Comes with the Connector title.",
    glyph: "heart",
  },
  mark: {
    name: "Left a Mark",
    blurb: "Signed two guestbooks.",
    howTo: "Sign two stands' guestbooks. Also unlocks the Fire reaction.",
    glyph: "flask",
  },
  exhibitor: {
    name: "Exhibitor",
    blurb: "Put a stand on the floor.",
    howTo: "Claim a stand on any floor. Comes with the Exhibitor title.",
    glyph: "cube",
  },
  tourist: {
    name: "Tourist",
    blurb: "Two floors, one pair of shoes.",
    howTo: "Visit two different floors.",
    glyph: "wave",
  },
  "crowd-pleaser": {
    name: "Crowd Pleaser",
    blurb: "Ten reactions deep.",
    howTo: "Send ten reactions on the floors. Also unlocks the Handshake reaction.",
    glyph: "coin",
  },
  habit: {
    name: "Regular",
    blurb: "Three days running. The floor notices.",
    howTo: "Visit three days in a row.",
    glyph: "leaf",
  },
  founding: {
    name: "Founding Member",
    blurb: "Here before it was anything. The number stays.",
    howTo: "One of the first 100 Founding Members.",
    glyph: "chip",
  },
  orator: {
    name: "Talk of the Floor",
    blurb: "Ten founders, ten conversations.",
    howTo: "Chat with ten different founders. Comes with the Conversationalist title.",
    glyph: "wave",
  },
  keynote: {
    name: "Keynote Energy",
    blurb: "Twenty-five founders know your name.",
    howTo: "Chat with twenty-five different founders.",
    glyph: "bolt",
  },
  networker: {
    name: "Networker",
    blurb: "Ten connections and climbing.",
    howTo: "Make ten connections. Comes with the Networker title.",
    glyph: "heart",
  },
  rainmaker: {
    name: "Rainmaker",
    blurb: "Twenty-five connections. People point you out.",
    howTo: "Make twenty-five connections. Comes with the Rainmaker title.",
    glyph: "star",
  },
  penpal: {
    name: "Pen Pal",
    blurb: "Five guestbooks carry your handwriting.",
    howTo: "Sign five stands' guestbooks.",
    glyph: "flask",
  },
  calligrapher: {
    name: "Calligrapher",
    blurb: "Fifteen guestbooks. Your pen is tired.",
    howTo: "Sign fifteen stands' guestbooks.",
    glyph: "leaf",
  },
  hype: {
    name: "Hype Section",
    blurb: "Fifty reactions of pure enthusiasm.",
    howTo: "Send fifty reactions on the floors.",
    glyph: "rocket",
  },
  ovation: {
    name: "Standing Ovation",
    blurb: "Two hundred reactions. Hands still clapping.",
    howTo: "Send two hundred reactions on the floors.",
    glyph: "coin",
  },
  cartographer: {
    name: "The Grand Tour",
    blurb: "Every public floor, walked.",
    howTo: "Set foot on all four public floors. Comes with the Explorer title.",
    glyph: "cube",
  },
  "week-streak": {
    name: "Fixture",
    blurb: "Seven days in a row. Staff know your order.",
    howTo: "Visit seven days in a row. Comes with the Fixture title.",
    glyph: "leaf",
  },
  fortnight: {
    name: "Part of the Furniture",
    blurb: "Fourteen straight days on the floor.",
    howTo: "Visit fourteen days in a row.",
    glyph: "chip",
  },
  stylist: {
    name: "Stylist",
    blurb: "Bought a new look for the stand.",
    howTo: "Buy any booth style with tickets. Comes with the Stylist title.",
    glyph: "star",
  },
  decorated: {
    name: "Fully Decorated",
    blurb: "Three accessories, zero restraint.",
    howTo: "Have three accessories on your stand at once.",
    glyph: "cube",
  },
};

interface BoothForm {
  name: string;
  oneLiner: string;
  pitch: string;
  category: string;
  goal: string;
  seekingCofounder: boolean;
  carpet: string;
  banner: string;
  sign: string;
  glyph: GlyphId;
  pattern: CarpetPattern;
  trim: BannerTrim;
  style: BoothStyle;
  props: BoothProp[];
  logo?: string;
}

const EMPTY_FORM: BoothForm = {
  name: "",
  oneLiner: "",
  pitch: "",
  category: "",
  goal: "",
  seekingCofounder: false,
  carpet: SWATCHES[2],
  banner: SWATCHES[0],
  sign: "",
  glyph: "bolt",
  pattern: "solid",
  trim: "plain",
  style: "classic",
  props: [],
};

function formFrom(s: Startup): BoothForm {
  return {
    name: s.name,
    oneLiner: s.oneLiner,
    pitch: s.pitch,
    category: s.category,
    goal: s.goal,
    seekingCofounder: s.seekingCofounder,
    carpet: s.booth.carpet,
    banner: s.booth.banner,
    sign: s.booth.sign,
    glyph: s.booth.glyph,
    pattern: s.booth.pattern ?? "solid",
    trim: s.booth.trim ?? "plain",
    style: s.booth.style ?? "classic",
    props: s.booth.props ?? [],
    logo: s.booth.logo,
  };
}


/** Display name for a floor id; "" means the connection happened off-floor. */
function floorName(floorId: string): string {
  if (!floorId) return "met online";
  return FLOORS.find((f) => f.id === floorId)?.name ?? floorId;
}

function relativeTime(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function SectionCard({
  title,
  children,
  id,
  aside,
}: {
  title: string;
  children: React.ReactNode;
  /** Anchor target, e.g. the landing pricing cards link to #membership. */
  id?: string;
  /** Rendered right of the title — e.g. the wallet chip on My stand. */
  aside?: React.ReactNode;
}) {
  return (
    <section id={id} aria-label={title} className="panel scroll-mt-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl">{title}</h2>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ColorRow({
  label,
  value,
  onPick,
}: {
  label: string;
  value: string;
  onPick: (c: string) => void;
}) {
  return (
    <div>
      <span className="micro mb-1.5 block text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            aria-label={`${label} color ${c}`}
            aria-pressed={value === c}
            className={`h-8 w-8 rounded-sm border ${
              value === c
                ? "border-accent ring-2 ring-accent ring-offset-1 ring-offset-panel"
                : "border-line hover:border-muted"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [state, actions] = useAppState();
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState<BoothForm>(EMPTY_FORM);
  const [monthly, setMonthly] = useState("");
  const [progress, setProgress] = useState(0);
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const [toast, setToast] = useState<ToastData | null>(null);
  const [questsOpen, setQuestsOpen] = useState(false);
  // Post-checkout: what we're waiting on, and what to celebrate once it lands
  const [pendingPay, setPendingPay] = useState<{
    kind: "tickets" | "plan";
    baseRedeemed: number;
    baseSub: SubTier;
  } | null>(null);
  const [burst, setBurst] = useState(0);
  const [celebrateTier, setCelebrateTier] = useState<SubTier | null>(null);

  useEffect(() => {
    setReady(true);
  }, []);

  // Deep links (/profile#booth, #membership, …) arrive before the sections
  // exist — the page renders behind a ready gate, so the browser's native
  // anchor scroll finds nothing. Once the real content is up, honor the hash.
  useEffect(() => {
    if (!ready) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    // Scroll once the section exists, then re-check after the editors above
    // finish seeding: only correct if the layout actually shifted the target
    // away from the top — otherwise a second scrollIntoView is a visible
    // double-jump for no reason.
    requestAnimationFrame(() => el.scrollIntoView());
    const settle = window.setTimeout(() => {
      const top = el.getBoundingClientRect().top;
      if (Math.abs(top) > 8) el.scrollIntoView();
    }, 450);
    return () => window.clearTimeout(settle);
  }, [ready]);

  // seed local editors from the hydrated store, once
  useEffect(() => {
    if (!ready) return;
    if (state.myStartup) {
      setForm(formFrom(state.myStartup));
      setMonthly(String(state.myStartup.verifiedRevenue || ""));
      setProgress(Math.round((state.myStartup.goalProgress ?? 0) * 100));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // Back from Stripe checkout (the payment link's confirmation page
  // redirects to /profile?paid=1#membership for plans, ?paid=tickets#tickets
  // for ticket packs). The webhook that grants the purchase can land a few
  // seconds after the redirect, so poll the sync until the credit arrives
  // (up to 90s), then celebrate — confetti for tickets, a full ceremony
  // card for a new membership.
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    if (paid !== "1" && paid !== "tickets") return;
    const anchor = paid === "tickets" ? "#tickets" : "#membership";
    window.history.replaceState(null, "", `/profile${anchor}`);
    setToast({
      id: Date.now(),
      text:
        paid === "tickets"
          ? "Payment received — your tickets are on the way…"
          : "Payment received — activating your plan…",
    });
    setPendingPay({
      kind: paid === "tickets" ? "tickets" : "plan",
      baseRedeemed: state.wallet.redeemed,
      baseSub: state.sub,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // While a payment is pending, pull the sync every 3s (webhooks usually
  // land within seconds; 90s covers a slow retry) …
  useEffect(() => {
    if (!pendingPay) return;
    syncNow();
    const iv = window.setInterval(syncNow, 3000);
    const stop = window.setTimeout(() => setPendingPay(null), 90_000);
    return () => {
      window.clearInterval(iv);
      window.clearTimeout(stop);
    };
  }, [pendingPay]);

  // … and the moment the credit lands in state, celebrate.
  useEffect(() => {
    if (!pendingPay) return;
    if (pendingPay.kind === "tickets") {
      const delta = state.wallet.redeemed - pendingPay.baseRedeemed;
      if (delta > 0) {
        setPendingPay(null);
        setBurst(Date.now());
        setToast({
          id: Date.now(),
          text: `+${delta.toLocaleString("en-US")} tickets in your wallet — go get seen.`,
        });
      }
    } else if (state.sub !== "free" && state.sub !== pendingPay.baseSub) {
      setPendingPay(null);
      setBurst(Date.now());
      setCelebrateTier(state.sub);
    }
  }, [pendingPay, state.wallet.redeemed, state.sub]);

  // The ceremony gets an encore: a second confetti volley while the card
  // is up, so the moment doesn't die after the first 1.4s burst.
  useEffect(() => {
    if (!celebrateTier) return;
    const t = window.setTimeout(() => setBurst(Date.now()), 1100);
    return () => window.clearTimeout(t);
  }, [celebrateTier]);

  // Signed-in account email (post-hydration only — getAuth reads localStorage)
  const acctEmail = ready ? getAuth()?.email : undefined;

  /**
   * Open a Stripe Payment Link, prefilling the account email so the payment
   * lands on the right account. The server matches payments by the email
   * typed at checkout — prefilling makes "wrong email" hard to do.
   */
  const openCheckout = (link: string) => {
    const url = acctEmail
      ? `${link}${link.includes("?") ? "&" : "?"}prefilled_email=${encodeURIComponent(acctEmail)}`
      : link;
    window.open(url, "_blank", "noopener");
  };

  const set = <K extends keyof BoothForm>(key: K, value: BoothForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const boothValid =
    form.name.trim() !== "" && state.profile.name.trim() !== "";

  const saveBooth = () => {
    if (!boothValid) return;
    const startup: Startup = {
      id: "mine",
      name: form.name.trim(),
      oneLiner: form.oneLiner.trim(),
      pitch: form.pitch.trim(),
      founder: state.profile.name,
      founderLook: state.profile.look,
      category: form.category.trim() || "Uncategorized",
      goal: form.goal.trim() || "Survive",
      goalProgress: state.myStartup?.goalProgress ?? 0,
      verifiedRevenue: state.myStartup?.verifiedRevenue ?? 0,
      seekingCofounder: form.seekingCofounder,
      // membership perk: your plan travels with the booth (priority listing,
      // tags, Founder+ gold trim) — free members simply carry none
      tier: state.sub === "free" ? undefined : state.sub,
      booth: {
        carpet: form.carpet,
        banner: form.banner,
        sign: form.sign.trim().slice(0, 12) || form.name.trim().slice(0, 12),
        glyph: form.glyph,
        pattern: form.pattern,
        trim: form.trim,
        // belt and suspenders: only owned looks ever leave the editor —
        // but anything already on the SAVED stand stays grandfathered, so
        // a wallet clobbered by a stale pre-deploy tab can't strip a
        // legitimately bought style off the booth at the next save
        style:
          form.style !== "classic" &&
          (ownsItem(state, `style:${form.style}`) ||
            state.myStartup?.booth.style === form.style)
            ? form.style
            : undefined,
        props: (() => {
          const prior = state.myStartup?.booth.props ?? [];
          const equipped = form.props
            .filter((p) => ownsItem(state, `prop:${p}`) || prior.includes(p))
            .slice(0, MAX_EQUIPPED_PROPS);
          return equipped.length ? equipped : undefined;
        })(),
        logo: form.logo,
      },
    };
    actions.saveMyStartup(startup);
    // Register site-wide immediately: the directory (and its category chips)
    // pick this up without waiting for a floor stand to be claimed.
    void registerStartup(state.profile.id, startup);
    setToast({ id: Date.now(), text: "Booth saved. See you on the floor." });
  };

  const randomizeTheme = () => {
    const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
    let banner = pick(SWATCHES);
    let carpet = pick(SWATCHES);
    while (carpet === banner) carpet = pick(SWATCHES);
    setForm((f) => ({
      ...f,
      banner,
      carpet,
      glyph: pick(GLYPH_IDS),
      pattern: pick(PATTERNS).id,
      trim: pick(TRIMS).id,
    }));
  };

  const onLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const c = document.createElement("canvas");
      c.width = 16;
      c.height = 16;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      // cover-crop the largest centered square, then shrink to banner size
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, side, side, 0, 0, 16, 16);
      const data = c.toDataURL("image/png");
      if (!isValidLogo(data)) {
        setToast({
          id: Date.now(),
          text: "That image would not compress down. Try a simpler one.",
        });
        return;
      }
      set("logo", data);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setToast({ id: Date.now(), text: "Could not read that image file." });
    };
    img.src = url;
  };

  // Quest rewards normally land on the floor; grant here too, so a quest
  // finished elsewhere never shows checked-but-badgeless in the list below.
  useEffect(() => {
    if (!ready) return;
    for (const q of questStates(state)) {
      if (!q.done || q.claimed) continue;
      actions.markQuestClaimed(q.def.id);
      actions.grantBadge(q.def.reward.badge);
      setToast({
        id: Date.now(),
        text: `Quest complete: ${q.def.title} — +${q.def.reward.tickets} tickets, ${q.def.rewardLabel}`,
      });
      break; // one per pass; the rest follow on subsequent renders
    }
  }, [ready, state, actions]);

  const verify = () => {
    const n = Math.max(0, Number(monthly) || 0);
    actions.verifyMyRevenue(n, Math.max(0, Math.min(100, progress)) / 100);
    setToast({
      id: Date.now(),
      text: `Verified. ${rankFor(n).name} it is.`,
    });
  };

  if (!ready) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-14">
        <p className="text-sm text-muted">Opening your profile…</p>
      </main>
    );
  }

  const verifiedRevenue = state.myStartup?.verifiedRevenue ?? 0;
  const questList = questStates(state);
  const earnedTitleList = earnedTitles(state);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12">
      <h1 className="font-display text-3xl">Profile</h1>

      {/* jump nav — the page runs eight sections deep, and most visits are
          for exactly one of them (usually the booth editor) */}
      <nav aria-label="Profile sections" className="no-scrollbar -mt-2 flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0">
        {[
          ["identity", "Identity"],
          ["booth", "My stand"],
          ["tickets", "Tickets"],
          ["verification", "Verification"],
          ["membership", "Membership"],
          ["quests", "Quests"],
          ["badges", "Badge book"],
          ["connections", "Connections"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="min-h-[36px] shrink-0 whitespace-nowrap rounded-full border border-line bg-panel px-3.5 py-1.5 text-xs text-muted hover:border-ink hover:text-ink"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* ---- Account ---- */}
      <SectionCard title="Account">
        <AccountCard
          onIdentity={actions.setIdentity}
          currentName={state.profile.name}
          currentId={state.profile.id}
        />
      </SectionCard>

      {/* ---- Identity ---- */}
      <SectionCard title="Identity" id="identity">
        <div className="flex flex-col gap-5">
          <div>
            <label htmlFor="profile-name" className="micro mb-1.5 block text-muted">
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={state.profile.name}
              maxLength={24}
              onChange={(e) => actions.setName(e.target.value.slice(0, 24))}
              placeholder="Ada Byron"
              autoComplete="name"
              className="w-full max-w-sm rounded-md border border-line px-3 py-2 text-sm placeholder:text-muted/70"
            />
          </div>
          <div>
            <label htmlFor="profile-status" className="micro mb-1.5 block text-muted">
              Status — shows over your head on the floor
            </label>
            <input
              id="profile-status"
              type="text"
              defaultValue={state.profile.status ?? ""}
              maxLength={40}
              onBlur={(e) => actions.setStatus(e.target.value.slice(0, 40))}
              placeholder="raising seed"
              autoComplete="off"
              className="w-full max-w-sm rounded-md border border-line px-3 py-2 text-sm placeholder:text-muted/70"
            />
          </div>
          <div>
            <span className="micro mb-1.5 block text-muted">
              Title — earned through quests, worn over your head on the floor
            </span>
            {earnedTitleList.length === 0 ? (
              <p className="text-sm text-muted">
                None earned yet. The quest list on any floor knows the way.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => actions.setTitle("")}
                    aria-pressed={!state.profile.title}
                    className={`micro rounded-full border px-3 py-1.5 ${
                      !state.profile.title
                        ? "border-ink bg-panel text-ink"
                        : "border-line text-muted hover:border-muted hover:text-ink"
                    }`}
                  >
                    none
                  </button>
                  {earnedTitleList.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => actions.setTitle(t)}
                      aria-pressed={state.profile.title === t}
                      className={`micro rounded-full border px-3 py-1.5 ${
                        state.profile.title === t
                          ? "border-gold bg-gold/10 text-gold-deep shadow-card"
                          : "border-line text-muted hover:border-gold/60 hover:text-gold-deep"
                      }`}
                    >
                      {state.profile.title === t && (
                        <span aria-hidden="true" className="mr-1">
                          ✦
                        </span>
                      )}
                      {t}
                    </button>
                  ))}
                </div>
                {state.profile.title && (
                  // live preview — exactly the label stack everyone sees
                  // over your avatar on the floor
                  <div className="mt-3 inline-flex flex-col items-center gap-1 rounded-lg border border-line/70 bg-paper px-8 pb-3 pt-4">
                    <span className="rounded-full border border-gold/80 bg-ink/90 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#E8C766]">
                      {state.profile.title}
                    </span>
                    <span className="rounded-full bg-ink/90 px-3 py-1 text-[11px] leading-none text-white">
                      {state.profile.name || "You"}
                    </span>
                    <span className="micro mt-1.5 text-muted">
                      how it looks on the floor
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            <span className="micro mb-2 block text-muted">Look</span>
            <AvatarPicker look={state.profile.look} onChange={actions.setLook} />
          </div>
        </div>
      </SectionCard>

      {/* ---- Quests: collapsed to the next few by default — 21 rows is a
          wall of text; the full board is one click away ---- */}
      <SectionCard title="Quests" id="quests">
        {(() => {
          const claimedCount = questList.filter((q) => q.claimed).length;
          const boardTickets = questList
            .filter((q) => !q.claimed)
            .reduce((sum, q) => sum + q.def.reward.tickets, 0);
          const preview = questList.filter((q) => !q.done).slice(0, 3);
          const previewIds = new Set(preview.map((q) => q.def.id));
          const rest = questList.filter((q) => !previewIds.has(q.def.id));
          const row = (q: (typeof questList)[number]) => (
            <li key={q.def.id} className="flex items-center gap-3 py-2.5">
              <span
                aria-hidden="true"
                className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                  q.done ? "bg-verify" : "bg-line"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${q.done ? "text-muted line-through" : "text-ink"}`}>
                  {q.def.title}
                  <span className="ml-2 text-xs text-muted no-underline">
                    {q.def.blurb}
                  </span>
                </p>
                <p className={`flex flex-wrap items-baseline gap-x-1.5 text-xs ${q.done ? "text-verify" : "text-muted"}`}>
                  <span className="whitespace-nowrap text-gold-deep">
                    <TicketIcon /> {q.def.reward.tickets}
                  </span>
                  <span>
                    {q.done ? "✓ " : "+ "}
                    {q.def.rewardLabel}
                  </span>
                </p>
              </div>
              <span className="micro shrink-0 text-muted">
                {q.count}/{q.def.goal}
              </span>
            </li>
          );
          return (
            <>
              {/* The toggle lives UP HERE so expanding/collapsing only ever
                  grows/shrinks content below it — the viewport never jumps. */}
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span>
                  {claimedCount}/{questList.length} complete
                  <span className="ml-2 text-gold-deep">
                    <TicketIcon /> {boardTickets.toLocaleString("en-US")} still on the board
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setQuestsOpen((v) => !v)}
                  aria-expanded={questsOpen}
                  className="rounded-full border border-line bg-panel px-3 py-1 text-xs text-muted hover:border-ink hover:text-ink"
                >
                  {questsOpen ? "Show fewer ▴" : `Show all ${questList.length} ▾`}
                </button>
              </div>
              <ul className="divide-y divide-line">{preview.map(row)}</ul>
              <div className={`reveal-rows ${questsOpen ? "open" : ""}`}>
                <div>
                  <ul className="divide-y divide-line border-t border-line">
                    {rest.map(row)}
                  </ul>
                </div>
              </div>
            </>
          );
        })()}
      </SectionCard>

      {/* ---- My booth ---- */}
      <SectionCard
        title="My stand"
        id="booth"
        aside={
          <a
            href="#tickets"
            className="flex items-center gap-1.5 rounded-full border border-gold/50 bg-panel px-3 py-1 text-xs text-gold-deep hover:border-gold"
            title="Your ticket balance — earn more at the Ticket booth"
          >
            <TicketIcon /> {walletBalance(state).toLocaleString("en-US")} tickets
          </a>
        }
      >
        <div className="grid gap-6 md:grid-cols-[1fr,220px]">
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="booth-name" className="micro mb-1.5 block text-muted">
                Startup name
              </label>
              <input
                id="booth-name"
                type="text"
                value={form.name}
                maxLength={40}
                onChange={(e) => set("name", e.target.value)}
                className="w-full rounded-md border border-line px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="booth-oneliner" className="micro mb-1.5 block text-muted">
                One-liner
              </label>
              <input
                id="booth-oneliner"
                type="text"
                value={form.oneLiner}
                maxLength={90}
                onChange={(e) => set("oneLiner", e.target.value)}
                placeholder="What it does, in one breath"
                className="w-full rounded-md border border-line px-3 py-2 text-sm placeholder:text-muted/70"
              />
            </div>
            <div>
              <label htmlFor="booth-pitch" className="micro mb-1.5 block text-muted">
                Pitch
              </label>
              <textarea
                id="booth-pitch"
                value={form.pitch}
                maxLength={400}
                rows={3}
                onChange={(e) => set("pitch", e.target.value)}
                placeholder="Two or three plain sentences. Adjectives are not traction."
                className="w-full rounded-md border border-line px-3 py-2 text-sm placeholder:text-muted/70"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="booth-category" className="micro mb-1.5 block text-muted">
                  Category
                </label>
                <input
                  id="booth-category"
                  type="text"
                  value={form.category}
                  maxLength={30}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="Dev tools"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm placeholder:text-muted/70"
                />
              </div>
              <div>
                <label htmlFor="booth-goal" className="micro mb-1.5 block text-muted">
                  Goal
                </label>
                <input
                  id="booth-goal"
                  type="text"
                  value={form.goal}
                  maxLength={60}
                  onChange={(e) => set("goal", e.target.value)}
                  placeholder="Reach $5k MRR"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm placeholder:text-muted/70"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.seekingCofounder}
                onChange={(e) => set("seekingCofounder", e.target.checked)}
                className="h-4 w-4 accent-[#2B8A3E]"
              />
              Seeking a co-founder
            </label>

            <div className="mt-2 flex flex-col gap-4 border-t border-line pt-4">
              <span className="micro text-muted">Booth theme</span>
              <ColorRow
                label="Carpet"
                value={form.carpet}
                onPick={(c) => set("carpet", c)}
              />
              <ColorRow
                label="Banner"
                value={form.banner}
                onPick={(c) => set("banner", c)}
              />
              <div>
                <label htmlFor="booth-sign" className="micro mb-1.5 block text-muted">
                  Sign text (12 chars max)
                </label>
                <input
                  id="booth-sign"
                  type="text"
                  value={form.sign}
                  maxLength={12}
                  onChange={(e) => set("sign", e.target.value)}
                  placeholder="ACME CO"
                  className="w-40 rounded-md border border-line px-3 py-2 text-sm placeholder:text-muted/70"
                />
              </div>
              <div>
                <span className="micro mb-1.5 block text-muted">Banner icon</span>
                <div className="flex flex-wrap items-center gap-2">
                  {form.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.logo}
                      alt="Your uploaded banner icon"
                      width={32}
                      height={32}
                      className="pixelated rounded-sm border border-accent"
                    />
                  )}
                  <label className="cursor-pointer rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-ink hover:text-ink">
                    {form.logo ? "Replace logo" : "Upload your own logo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onLogoFile}
                      className="sr-only"
                    />
                  </label>
                  {form.logo && (
                    <button
                      type="button"
                      onClick={() => set("logo", undefined)}
                      className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-ink hover:text-ink"
                    >
                      Remove — use a glyph
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  Any image works — it gets shrunk to a 16×16 pixel mark, like
                  everything else on the floor.
                </p>
              </div>
              <div className={form.logo ? "opacity-50" : undefined}>
                <span className="micro mb-1.5 block text-muted">
                  Glyph{form.logo ? " (unused while a logo is set)" : ""}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {GLYPH_IDS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => set("glyph", g)}
                      aria-label={`Glyph: ${g}`}
                      aria-pressed={form.glyph === g}
                      className={`flex h-8 w-8 items-center justify-center rounded-sm border ${
                        form.glyph === g
                          ? "border-accent ring-2 ring-accent ring-offset-1 ring-offset-panel"
                          : "border-line hover:border-muted"
                      }`}
                    >
                      <PixelGlyph glyph={g} color="#23201A" size={16} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="micro mb-1.5 block text-muted">Carpet pattern</span>
                <div className="flex gap-1.5" role="group" aria-label="Carpet pattern">
                  {PATTERNS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => set("pattern", p.id)}
                      aria-pressed={form.pattern === p.id}
                      className={`rounded-sm border px-3 py-1.5 text-xs ${
                        form.pattern === p.id
                          ? "border-accent text-accent ring-2 ring-accent ring-offset-1 ring-offset-panel"
                          : "border-line text-muted hover:border-muted hover:text-ink"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="micro mb-1.5 block text-muted">
                  Banner trim
                  {form.style !== "classic" && (
                    <span className="ml-1.5 normal-case">(Classic Stall only)</span>
                  )}
                </span>
                <div className="flex gap-1.5" role="group" aria-label="Banner trim">
                  {TRIMS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => set("trim", t.id)}
                      aria-pressed={form.trim === t.id}
                      disabled={form.style !== "classic"}
                      className={`rounded-sm border px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40 ${
                        form.trim === t.id
                          ? "border-accent text-accent ring-2 ring-accent ring-offset-1 ring-offset-panel"
                          : "border-line text-muted hover:border-muted hover:text-ink"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="micro text-muted">Booth style</span>
                  <span className="micro text-muted">
                    <TicketIcon /> {walletBalance(state).toLocaleString("en-US")} tickets
                  </span>
                </div>
                <div className="flex flex-col gap-1.5" role="group" aria-label="Booth style">
                  {BOOTH_STYLES.map((s) => {
                    const owned = ownsItem(state, s.id);
                    const selected = form.style === s.style;
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between gap-2 rounded-sm border px-3 py-2 ${
                          selected
                            ? "border-accent ring-1 ring-accent"
                            : "border-line"
                        }`}
                      >
                        <div className="min-w-0">
                          <span className={`block text-xs ${selected ? "text-accent" : "text-ink"}`}>
                            {s.name}
                          </span>
                          <span className="block text-[11px] leading-snug text-muted">{s.blurb}</span>
                        </div>
                        {owned ? (
                          <button
                            type="button"
                            onClick={() => set("style", s.style)}
                            aria-pressed={selected}
                            className={`shrink-0 rounded-sm border px-2.5 py-1 text-xs ${
                              selected
                                ? "border-accent text-accent"
                                : "border-line text-muted hover:border-ink hover:text-ink"
                            }`}
                          >
                            {selected ? "In use" : "Use"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label={`Buy ${s.name} for ${s.price} tickets`}
                            onClick={() => {
                              if (actions.buyItem(s.id)) {
                                set("style", s.style);
                                setToast({
                                  id: Date.now(),
                                  text: `${s.name} is yours — it's on in the preview. Save stand takes it to the floor.`,
                                });
                              } else {
                                setToast({
                                  id: Date.now(),
                                  text: `Not enough tickets — ${s.name} costs ${s.price}. Earn them at the Ticket booth below.`,
                                });
                              }
                            }}
                            className="shrink-0 rounded-sm border border-gold/60 px-2.5 py-1 text-xs text-gold-deep hover:border-gold"
                          >
                            <TicketIcon /> {s.price}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <span className="micro mb-1.5 block text-muted">
                  Accessories (up to {MAX_EQUIPPED_PROPS})
                </span>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Booth accessories">
                  {BOOTH_PROPS.map((p) => {
                    const owned = ownsItem(state, p.id);
                    const equipped = form.props.includes(p.prop);
                    if (!owned) {
                      return (
                        <button
                          key={p.id}
                          type="button"
                          title={p.blurb}
                          aria-label={`Buy ${p.name} for ${p.price} tickets`}
                          onClick={() => {
                            if (actions.buyItem(p.id)) {
                              const placed = form.props.length < MAX_EQUIPPED_PROPS;
                              if (placed) set("props", [...form.props, p.prop]);
                              setToast({
                                id: Date.now(),
                                text: placed
                                  ? `${p.name} bought and placed — Save stand takes it to the floor.`
                                  : `${p.name} bought. All ${MAX_EQUIPPED_PROPS} slots are full — take one down to place it.`,
                              });
                            } else {
                              setToast({
                                id: Date.now(),
                                text: `Not enough tickets — ${p.name} costs ${p.price}.`,
                              });
                            }
                          }}
                          className="rounded-sm border border-gold/60 px-3 py-1.5 text-xs text-gold-deep hover:border-gold"
                        >
                          {p.name} · <TicketIcon /> {p.price}
                        </button>
                      );
                    }
                    return (
                      <button
                        key={p.id}
                        type="button"
                        title={p.blurb}
                        aria-pressed={equipped}
                        onClick={() => {
                          if (equipped) {
                            set("props", form.props.filter((x) => x !== p.prop));
                          } else if (form.props.length < MAX_EQUIPPED_PROPS) {
                            set("props", [...form.props, p.prop]);
                          } else {
                            setToast({
                              id: Date.now(),
                              text: `Max ${MAX_EQUIPPED_PROPS} accessories — take one down first.`,
                            });
                          }
                        }}
                        className={`rounded-sm border px-3 py-1.5 text-xs ${
                          equipped
                            ? "border-accent text-accent ring-2 ring-accent ring-offset-1 ring-offset-panel"
                            : "border-line text-muted hover:border-muted hover:text-ink"
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={randomizeTheme}
                  className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-ink hover:text-ink"
                >
                  Dealer&rsquo;s choice — randomize the look
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <button
                type="button"
                onClick={saveBooth}
                disabled={!boothValid}
                className="rounded-md bg-accent-strong px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state.myStartup ? "Save stand" : "Set up stand"}
              </button>
              {state.myStartup && (
                <button
                  type="button"
                  onClick={() => {
                    actions.clearMyStartup();
                    void unregisterStartup(state.profile.id);
                    setForm(EMPTY_FORM);
                    setMonthly("");
                    setProgress(0);
                    setToast({ id: Date.now(), text: "Booth taken down." });
                  }}
                  className="rounded-md border border-line px-4 py-2 text-sm text-muted hover:border-muted hover:text-ink"
                >
                  Take down stand
                </button>
              )}
              {!boothValid && (
                <span className="text-xs text-muted">
                  {state.profile.name.trim() === ""
                    ? "Set your name above first — stands need a founder."
                    : "A stand needs at least a startup name."}
                </span>
              )}
            </div>
          </div>

          {/* live booth preview — the exact in-game rendering */}
          <div className="md:sticky md:top-6 md:self-start">
            <span className="micro mb-2 block text-muted">Preview</span>
            <BoothPreview
              carpet={form.carpet}
              banner={form.banner}
              sign={form.sign.trim() || form.name.trim().slice(0, 12)}
              glyph={form.glyph}
              pattern={form.pattern}
              trim={form.trim}
              style={form.style}
              boothProps={form.props}
              logo={form.logo}
              founderLook={state.profile.look}
            />
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Pixel for pixel, this is your stand on the floor — with you
              behind the counter. Walk up to any OPEN SPOT stand in a hall and
              claim it.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ---- Ticket booth: the earn-or-buy currency ---- */}
      <SectionCard title="Ticket booth" id="tickets">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-2xl font-medium">
            <TicketIcon size={20} /> {walletBalance(state).toLocaleString("en-US")}
            <span className="ml-1.5 text-sm font-normal text-muted">tickets</span>
          </p>
          <span className="micro text-muted">spent on booth styles &amp; accessories, up in My stand</span>
        </div>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          Tickets buy the looks that make your stand impossible to miss —
          never access, never reach. Everything is earnable by showing up;
          packs just speed it up.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-line p-4">
            <span className="micro text-muted">How to earn</span>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed">
              <li className="flex justify-between gap-2">
                <span>Daily check-in (grows with your streak)</span>
                <span className="shrink-0 text-gold-deep">
                  <TicketIcon /> {dailyTickets(1)}&ndash;{EARN.dailyCap}
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Every new connection</span>
                <span className="shrink-0 text-gold-deep"><TicketIcon /> {EARN.connection}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Every guestbook you sign</span>
                <span className="shrink-0 text-gold-deep"><TicketIcon /> {EARN.guestbook}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Every new badge</span>
                <span className="shrink-0 text-gold-deep"><TicketIcon /> {EARN.badge}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>
                  Quest rewards (<a href="#quests" className="text-accent hover:underline">see quests</a>)
                </span>
                <span className="shrink-0 text-gold-deep"><TicketIcon /> 30&ndash;100</span>
              </li>
            </ul>
            {(() => {
              // an honest streak: only alive if today or yesterday was counted
              const dayOf = (ms: number): string => {
                const d = new Date(ms);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              };
              const now = Date.now();
              const alive =
                state.lastVisitDay === dayOf(now) || state.lastVisitDay === dayOf(now - 86_400_000);
              const streak = alive ? state.visitStreak : 0;
              return (
                <p className="mt-3 text-[11px] leading-snug text-muted">
                  Current streak: {streak} {streak === 1 ? "day" : "days"} — your
                  next check-in pays <TicketIcon /> {dailyTickets(streak + 1)}.
                </p>
              );
            })()}
          </div>

          <div className="rounded-md border border-line p-4">
            <span className="micro text-muted">In a hurry</span>
            <ul className="mt-2 space-y-1.5">
              {/* every pack shows its price; only configured ones are buyable —
                  a button that silently does nothing is worse than none */}
              {TICKET_PACKS.map((pack) => {
                const link = ticketPackLink(pack.id);
                return (
                  <li key={pack.id}>
                    <button
                      type="button"
                      disabled={!link}
                      aria-label={
                        link
                          ? `Buy ${pack.name}: ${pack.tickets} tickets for $${pack.usd}`
                          : `${pack.name}: ${pack.tickets} tickets for $${pack.usd} — not on sale yet`
                      }
                      onClick={() => {
                        if (link) openCheckout(link);
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-sm border border-line px-3 py-2 text-left text-xs hover:border-ink disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-line"
                    >
                      <span>
                        <span className="text-ink">
                          {pack.name}
                          {!link && (
                            <span className="micro ml-1.5 rounded-sm border border-line px-1 py-0.5 text-muted">
                              soon
                            </span>
                          )}
                        </span>
                        <span className="block text-[11px] text-muted">{pack.blurb}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-gold-deep">
                          <TicketIcon /> {pack.tickets.toLocaleString("en-US")}
                        </span>
                        <span className="block text-muted">${pack.usd}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {!ticketPacksLive() ? (
                <li className="pt-1 text-[11px] leading-snug text-muted">
                  Packs aren&rsquo;t on sale quite yet. Good news: every single
                  item is earnable free, forever — packs will only ever buy
                  patience.
                </li>
              ) : (
                <>
                  {!acctEmail && (
                    <li className="pt-1 text-[11px] leading-snug text-muted">
                      Packs attach to your account email — pay with the email
                      you sign in with (it still counts if you create the
                      account after).
                    </li>
                  )}
                  {/* pre-purchase notice, required for the EU withdrawal
                      waiver to hold up: instant delivery => sales are final */}
                  <li className="pt-1 text-[11px] leading-snug text-muted">
                    Tickets are delivered instantly, so all pack sales are
                    final — see the{" "}
                    <Link href="/terms" className="underline hover:text-ink">
                      terms
                    </Link>
                    . Everything they buy is also earnable free.
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </SectionCard>

      {/* ---- Verification ---- */}
      <SectionCard title="Verification" id="verification">
        <p className="text-sm leading-relaxed text-muted">
          In live mode your rank comes from a read-only Stripe connection —
          this build simulates it, so type whatever you can live with.
        </p>
        <div className="mt-5 flex flex-wrap items-end gap-5">
          <div>
            <label htmlFor="verify-revenue" className="micro mb-1.5 block text-muted">
              Monthly revenue (USD)
            </label>
            <input
              id="verify-revenue"
              type="number"
              min={0}
              step={50}
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              placeholder="0"
              className="w-40 rounded-md border border-line px-3 py-2 text-sm placeholder:text-muted/70"
            />
          </div>
          <div className="min-w-[200px]">
            <label htmlFor="verify-progress" className="micro mb-1.5 block text-muted">
              Goal progress: {progress}%
            </label>
            <input
              id="verify-progress"
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-[#2B8A3E]"
            />
          </div>
          <button
            type="button"
            onClick={verify}
            disabled={!state.myStartup}
            className="rounded-md bg-ink px-4 py-2 text-sm text-paper hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Verify (demo)
          </button>
          {!state.myStartup && (
            <span className="text-xs text-muted">
              Set up a stand first — the rank has to hang on something.
            </span>
          )}
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <span className="micro mb-2 block text-muted">Current rank</span>
          <RankBadge revenue={verifiedRevenue} size="lg" />
          <ul className="mt-4 space-y-1">
            {RANKS.map((r) => {
              const held = rankFor(verifiedRevenue).id === r.id;
              return (
                <li
                  key={r.id}
                  className={`flex items-baseline gap-2 text-xs ${
                    held ? "text-ink" : "text-muted"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="inline-block h-1.5 w-1.5 shrink-0 self-center rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="micro w-28">{r.name}</span>
                  <span>${r.minRevenue.toLocaleString("en-US")}+</span>
                  {held && <span className="micro text-verify">you are here</span>}
                </li>
              );
            })}
          </ul>
        </div>
      </SectionCard>

      {/* ---- Membership ---- */}
      <SectionCard title="Membership" id="membership">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {!billingLive() ? (
            <span className="micro rounded-sm border border-line px-1.5 py-0.5 text-muted">
              billing not live yet — buttons simulate the switch
            </span>
          ) : (
            <span className="micro rounded-sm border border-line px-1.5 py-0.5 text-muted">
              {acctEmail
                ? `your plan attaches to ${acctEmail} — use that email at checkout`
                : "plans attach to your account email — pay with the email you sign in with (it still counts if you create the account after)"}
            </span>
          )}
          <div
            role="group"
            aria-label="Billing cycle"
            className="flex rounded-md border border-line p-0.5"
          >
            {(["monthly", "annual"] as BillingCycle[]).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={cycle === c}
                onClick={() => setCycle(c)}
                className={`rounded-sm px-3 py-1 text-xs ${
                  cycle === c ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                {c === "monthly" ? "Monthly" : "Annual"}
              </button>
            ))}
          </div>
        </div>

        {/* founding member — the beta offer, capped and numbered */}
        <article className="mb-4 rounded-md border border-gold/60 bg-paper/60 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-base">Founding Member</h3>
            <span className="text-sm text-ink">
              ${FOUNDING_OFFER.price}{" "}
              <span className="text-xs text-muted">once · first {FOUNDING_OFFER.cap} only</span>
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            A year of Founder+, your renewal price locked for life, and a
            numbered founding badge on your card that never goes away. When
            they&rsquo;re gone, they&rsquo;re gone.
          </p>
          {state.badges.includes(FOUNDING_OFFER.badgeId) ? (
            <span className="micro mt-3 inline-block rounded-md border border-gold/60 px-3 py-1.5 text-gold-deep">
              You&rsquo;re a founding member
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                const link = foundingCheckoutLink();
                if (link) {
                  openCheckout(link);
                  return;
                }
                actions.setSub("founder");
                actions.grantBadge(FOUNDING_OFFER.badgeId);
                setToast({
                  id: Date.now(),
                  text: "Founding member (simulated). Welcome to the wall.",
                });
              }}
              className="mt-3 rounded-md bg-ink px-3 py-1.5 text-sm text-paper hover:bg-ink/85"
            >
              {foundingCheckoutLink() ? "Become a founding member" : "Simulate founding membership"}
            </button>
          )}
        </article>

        <div className="grid gap-4 sm:grid-cols-3">
          {(["free", "pro", "founder"] as SubTier[]).map((tier) => {
            const current = state.sub === tier;
            const unlocked = FLOORS.filter(
              (f) => !f.hidden && TIER_ORDER[f.tier] <= TIER_ORDER[tier],
            );
            const price =
              tier === "free"
                ? "$0"
                : cycle === "monthly"
                  ? TIER_PRICE[tier]
                  : TIER_PRICE_ANNUAL[tier];
            return (
              <article
                key={tier}
                className={`flex flex-col rounded-md border p-4 ${
                  current ? "border-accent" : "border-line"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-base">{TIER_LABEL[tier]}</h3>
                  <span className="text-xs text-muted">{price}</span>
                </div>
                {tier !== "free" && cycle === "annual" && (
                  <p className="micro mt-0.5 text-verify">
                    {annualFreeMonths(tier)} months free vs monthly
                  </p>
                )}
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {TIER_BLURB[tier]}
                </p>
                <ul className="mt-3 flex-1 space-y-1">
                  {unlocked.map((f) => (
                    <li key={f.id} className="flex items-baseline gap-1.5 text-xs">
                      <span aria-hidden="true" className="text-verify">
                        ·
                      </span>
                      {f.name}
                    </li>
                  ))}
                  {TIER_PERKS[tier].map((perk) => (
                    <li key={perk} className="flex items-baseline gap-1.5 text-xs text-muted">
                      <span aria-hidden="true" className={tier === "founder" ? "text-gold-deep" : "text-accent"}>
                        ·
                      </span>
                      {perk}
                    </li>
                  ))}
                </ul>
                {current ? (
                  <span className="micro mt-4 rounded-md border border-accent/40 px-3 py-1.5 text-center text-accent">
                    Current plan
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (tier !== "free") {
                        const link = checkoutLink(tier, cycle);
                        if (link) {
                          openCheckout(link);
                          return;
                        }
                      }
                      actions.setSub(tier);
                      setToast({
                        id: Date.now(),
                        text: `Switched to ${TIER_LABEL[tier]}.`,
                      });
                    }}
                    className="mt-4 rounded-md border border-ink px-3 py-1.5 text-sm hover:bg-paper"
                  >
                    Switch to {TIER_LABEL[tier]}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </SectionCard>

      {/* ---- Badge book: the full catalog, earned bright and locked gray ---- */}
      <SectionCard title="Badge book" id="badges">
        <p className="text-sm leading-relaxed text-muted">
          Every badge that exists, and how to earn it —{" "}
          {state.badges.filter((id) => BADGE_META[id]).length} of{" "}
          {Object.keys(BADGE_META).length} collected. Earned on the floor, not
          requested.
        </p>
        <ul className="stagger-children mt-4 flex flex-wrap gap-3">
          {Object.entries(BADGE_META).map(([id, meta]) => {
            const earned = state.badges.includes(id);
            return (
              <li
                key={id}
                className={`flex w-36 flex-col items-center gap-2 rounded-md border p-3 text-center ${
                  earned ? "border-line" : "border-dashed border-line/80 opacity-70"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 items-center justify-center rounded-sm border-2 bg-paper ${
                    earned ? "border-gold/60" : "border-line"
                  }`}
                >
                  <PixelGlyph
                    glyph={meta.glyph}
                    color={earned ? "#B08D2E" : "#B4AE9F"}
                    size={18}
                  />
                </span>
                <span className={`micro ${earned ? "text-ink" : "text-muted"}`}>
                  {meta.name}
                </span>
                <span className="text-xs leading-snug text-muted">
                  {earned ? meta.blurb : meta.howTo}
                </span>
                <span
                  className={`micro rounded-sm px-1.5 py-0.5 ${
                    earned ? "text-verify" : "text-muted"
                  }`}
                >
                  {earned ? "EARNED" : "LOCKED"}
                </span>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      {/* ---- Connections ---- */}
      <SectionCard title="Connections" id="connections">
        {state.connections.length === 0 ? (
          <p className="text-sm text-muted">
            No connections yet. Go talk to somebody.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {[...state.connections]
              .sort((a, b) => b.ts - a.ts)
              .map((c) => (
                <li key={c.ts} className="flex flex-col gap-2 py-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        {c.name}
                        {c.founder && (
                          <span className="text-muted"> · {c.founder}</span>
                        )}
                      </p>
                      <p className="micro mt-0.5 text-muted">
                        {floorName(c.floorId)} · {relativeTime(c.ts)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => actions.removeConnection(c.ts)}
                      className="shrink-0 rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:border-accent hover:text-accent"
                    >
                      Remove
                    </button>
                  </div>
                  <div>
                    <label htmlFor={`connection-note-${c.ts}`} className="sr-only">
                      Note about {c.name}
                    </label>
                    <input
                      id={`connection-note-${c.ts}`}
                      type="text"
                      defaultValue={c.note ?? ""}
                      maxLength={200}
                      placeholder="add a note…"
                      autoComplete="off"
                      onBlur={(e) =>
                        actions.setConnectionNote(c.ts, e.target.value.trim().slice(0, 200))
                      }
                      className="w-full rounded-md border border-line px-2.5 py-1.5 text-xs placeholder:text-muted/70"
                    />
                  </div>
                </li>
              ))}
          </ul>
        )}
      </SectionCard>

      <Toast toast={toast} />
      <ConfettiBurst burstId={burst} />

      {/* membership ceremony — a paid plan just activated. One big moment,
          then back to the floor. */}
      {celebrateTier && celebrateTier !== "free" && (
        <MembershipCeremony
          tier={celebrateTier}
          blurb={TIER_BLURB[celebrateTier]}
          onClose={() => setCelebrateTier(null)}
        />
      )}
    </main>
  );
}
