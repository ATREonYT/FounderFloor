"use client";

/**
 * On-floor stand editor: walk up to your own booth, hit Edit, and change
 * the stand right where it lives.
 *
 * EVERY VISUAL CHOICE APPLIES THE MOMENT YOU MAKE IT. The header has said
 * "live" since this panel was written and it was not true: picking a
 * colour or buying a style only moved a React value, and the stand behind
 * you did not change until you pressed Save. So you chose blind, and a
 * purchase looked like it had done nothing at all — the worst possible
 * feedback for the one screen where people spend tickets.
 *
 * Text is the exception, committed on blur rather than per keystroke: a
 * half-typed startup name has no business being broadcast to the room.
 *
 * The full editor (glyph, logo upload, trim, category…) stays on the
 * profile page; this covers what you notice while standing at your booth.
 */

import { useState } from "react";
import BoothPreview from "@/components/BoothPreview";
import BuyConfirm from "@/components/BuyConfirm";
import type { AppState, BoothProp, BoothStyle, Startup } from "@/lib/types";
import {
  BOOTH_PROPS,
  BOOTH_STYLES,
  BOOTH_SWATCHES,
  MAX_EQUIPPED_PROPS,
  ownsItem,
  priceFor,
  walletBalance,
  type ShopItem,
} from "@/lib/data/shop";
import TicketIcon from "@/components/TicketIcon";

interface EditStandPanelProps {
  startup: Startup;
  state: AppState;
  /** actions.buyItem — returns true when the purchase went through. */
  onBuy: (itemId: string) => boolean;
  /**
   * Push a change to the stand NOW, without closing. Cheap by design —
   * the caller sends it to the floor over the socket and debounces the
   * slower registry write, so clicking through eight swatches does not
   * become eight HTTP posts.
   */
  onApply: (updated: Startup) => void;
  onSave: (updated: Startup) => void;
  onClose: () => void;
  /** Disables WASD while typing (same plumbing as the guestbook). */
  onFocusChange?: (focused: boolean) => void;
}

function SwatchRow({
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
      <span className="micro mb-1 block text-muted">{label}</span>
      <div className="flex flex-wrap gap-1">
        {BOOTH_SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            aria-label={`${label} color ${c}`}
            aria-pressed={value === c}
            className={`h-6 w-6 rounded-sm border ${
              value === c ? "border-accent ring-1 ring-accent" : "border-line hover:border-muted"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

export default function EditStandPanel({
  startup,
  state,
  onBuy,
  onApply,
  onSave,
  onClose,
  onFocusChange,
}: EditStandPanelProps) {
  const [name, setName] = useState(startup.name);
  const [sign, setSign] = useState(startup.booth.sign);
  const [oneLiner, setOneLiner] = useState(startup.oneLiner);
  const [pitch, setPitch] = useState(startup.pitch);
  const [banner, setBanner] = useState(startup.booth.banner);
  const [carpet, setCarpet] = useState(startup.booth.carpet);
  const [style, setStyle] = useState<BoothStyle>(startup.booth.style ?? "classic");
  const [props, setProps] = useState<BoothProp[]>(startup.booth.props ?? []);
  const [note, setNote] = useState<string | null>(null);
  /** The item awaiting a yes/no. Nothing is spent until `buy` runs. */
  const [pending, setPending] = useState<{ item: ShopItem; buy: () => void } | null>(null);

  /* Typing does NOT broadcast. Leaving a field does: nobody needs to
     watch "Ket", "Kettl", "Kettle" cross the floor, and per-keystroke
     network writes would spend the per-IP budget in one sentence. */
  const focus = {
    onFocus: () => onFocusChange?.(true),
    onBlur: () => {
      onFocusChange?.(false);
      if (name.trim()) apply({});
    },
  };
  const balance = walletBalance(state);

  /**
   * Owned, just bought, or already on the saved stand (grandfathered).
   *
   * `granted` is the item bought by the very click doing the asking. The
   * wallet in `state` is last render's snapshot, so a purchase is invisible
   * to this function until React comes round again — and without the
   * override the stand strips out the thing it was just paid for.
   */
  const owns = (id: string, granted?: string): boolean =>
    granted === id || ownsItem(state, id);
  const mayWear = (s: BoothStyle, granted?: string): boolean =>
    s === "classic" || owns(`style:${s}`, granted) || startup.booth.style === s;
  const mayEquip = (p: BoothProp, granted?: string): boolean =>
    owns(`prop:${p}`, granted) || (startup.booth.props ?? []).includes(p);

  /** The stand as the current form describes it, with an override applied. */
  const build = (
    over: Partial<{
      name: string;
      oneLiner: string;
      pitch: string;
      sign: string;
      banner: string;
      carpet: string;
      style: BoothStyle;
      props: BoothProp[];
    }> = {},
    granted?: string,
  ): Startup => {
    const n = (over.name ?? name).trim();
    const st = over.style ?? style;
    const pr = over.props ?? props;
    return {
      ...startup,
      name: n || startup.name,
      oneLiner: (over.oneLiner ?? oneLiner).trim(),
      pitch: (over.pitch ?? pitch).trim(),
      booth: {
        ...startup.booth,
        sign: (over.sign ?? sign).trim().slice(0, 12) || n.slice(0, 12) || startup.booth.sign,
        banner: over.banner ?? banner,
        carpet: over.carpet ?? carpet,
        style: st !== "classic" && mayWear(st, granted) ? st : undefined,
        props: (() => {
          const equipped = pr
            .filter((p) => mayEquip(p, granted))
            .slice(0, MAX_EQUIPPED_PROPS);
          return equipped.length ? equipped : undefined;
        })(),
      },
    };
  };

  /** Set it and show it, in that order. */
  const apply = (over: Parameters<typeof build>[0], granted?: string): void => {
    onApply(build(over, granted));
  };

  const save = (): void => {
    if (!name.trim()) {
      setNote("The stand needs a startup name.");
      return;
    }
    onSave(build());
  };

  return (
    <aside
      aria-label="Edit your stand"
      className="glass anim-in pointer-events-auto flex max-h-full w-[340px] max-w-[calc(100vw-24px)] flex-col shadow-float"
    >
      <div className="flex shrink-0 items-center justify-between rounded-t-md border-b border-line py-1 pl-4 pr-1">
        <span className="micro text-muted">Editing your stand — live</span>
        {/* A thumb-sized target, not a 16px glyph: this is the control every
            phone owner reaches for first. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close stand editor"
          className="-my-1 flex h-10 w-10 items-center justify-center rounded-sm leading-none text-muted hover:text-ink"
        >
          ×
        </button>
      </div>

      {/* The stand itself, as it stands right now. The panel covers the
          booth on a phone, so "it changed" needs somewhere to be visible
          that is not behind the panel. */}
      {/* Narrower on a short screen: the preview is square-ish, so its
          width IS its height, and at full panel width it ate the room the
          controls needed. */}
      <div className="mx-auto w-full shrink-0 border-b border-line px-4 pt-3 [@media(max-height:820px)]:max-w-[230px]">
        <BoothPreview
          carpet={carpet}
          banner={banner}
          sign={sign || name}
          glyph={startup.booth.glyph}
          pattern={startup.booth.pattern ?? "solid"}
          trim={startup.booth.trim ?? "plain"}
          style={style}
          boothProps={props}
          logo={startup.booth.logo}
          founderLook={startup.founderLook}
          tier={startup.tier}
          yours
        />
      </div>

      {/* min-h-0 is what lets this shrink inside the panel's max-h instead
          of pushing the footer off the bottom of the screen. */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="edit-name" className="micro mb-1 block text-muted">
              Startup
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              {...focus}
              className="w-full rounded-md border border-line px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="edit-sign" className="micro mb-1 block text-muted">
              Banner sign
            </label>
            <input
              id="edit-sign"
              type="text"
              value={sign}
              maxLength={12}
              onChange={(e) => setSign(e.target.value)}
              {...focus}
              className="w-full rounded-md border border-line px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="edit-oneliner" className="micro mb-1 block text-muted">
            One-liner
          </label>
          <input
            id="edit-oneliner"
            type="text"
            value={oneLiner}
            maxLength={80}
            onChange={(e) => setOneLiner(e.target.value)}
            {...focus}
            className="w-full rounded-md border border-line px-2 py-1.5 text-sm"
          />
        </div>

        <div>
          <label htmlFor="edit-pitch" className="micro mb-1 block text-muted">
            Pitch
          </label>
          <textarea
            id="edit-pitch"
            value={pitch}
            maxLength={600}
            rows={3}
            onChange={(e) => setPitch(e.target.value)}
            {...focus}
            className="w-full resize-none rounded-md border border-line px-2 py-1.5 text-sm leading-snug"
          />
        </div>

        <SwatchRow
          label="Banner"
          value={banner}
          onPick={(c) => {
            setBanner(c);
            apply({ banner: c });
          }}
        />
        <SwatchRow
          label="Carpet"
          value={carpet}
          onPick={(c) => {
            setCarpet(c);
            apply({ carpet: c });
          }}
        />

        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="micro text-muted">Style</span>
            <span className="micro text-muted">
              <TicketIcon /> {balance.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Booth style">
            {BOOTH_STYLES.map((s) => {
              const wearable = mayWear(s.style);
              const selected = style === s.style;
              if (!wearable) {
                return (
                  <button
                    key={s.id}
                    type="button"
                    title={s.blurb}
                    aria-label={`Buy ${s.name} for ${priceFor(state, s)} tickets`}
                    onClick={() =>
                      setPending({
                        item: s,
                        buy: () => {
                          setStyle(s.style);
                          apply({ style: s.style }, s.id);
                          setNote(`${s.name} is yours — it's on your stand now.`);
                        },
                      })
                    }
                    className="rounded-sm border border-gold/60 px-2 py-1 text-xs text-gold-deep hover:border-gold"
                  >
                    {s.name}{" "}
                    {priceFor(state, s) < s.price && <s className="opacity-60">{s.price}</s>}{" "}
                    <TicketIcon /> {priceFor(state, s)}
                  </button>
                );
              }
              return (
                <button
                  key={s.id}
                  type="button"
                  title={s.blurb}
                  aria-pressed={selected}
                  onClick={() => {
                    setStyle(s.style);
                    apply({ style: s.style });
                  }}
                  className={`rounded-sm border px-2 py-1 text-xs ${
                    selected
                      ? "border-accent text-accent ring-1 ring-accent"
                      : "border-line text-muted hover:border-ink hover:text-ink"
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="micro mb-1 block text-muted">
            Accessories (up to {MAX_EQUIPPED_PROPS})
          </span>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Booth accessories">
            {BOOTH_PROPS.map((p) => {
              const usable = mayEquip(p.prop);
              const equipped = props.includes(p.prop);
              if (!usable) {
                return (
                  <button
                    key={p.id}
                    type="button"
                    title={p.blurb}
                    aria-label={`Buy ${p.name} for ${priceFor(state, p)} tickets`}
                    onClick={() =>
                      setPending({
                        item: p,
                        buy: () => {
                          const next =
                            props.length < MAX_EQUIPPED_PROPS ? [...props, p.prop] : props;
                          setProps(next);
                          apply({ props: next }, p.id);
                          setNote(
                            props.length < MAX_EQUIPPED_PROPS
                              ? `${p.name} bought — it's on your stand now.`
                              : `${p.name} bought. Take one off to place it.`,
                          );
                        },
                      })
                    }
                    className="rounded-sm border border-gold/60 px-2 py-1 text-xs text-gold-deep hover:border-gold"
                  >
                    {p.name}{" "}
                    {priceFor(state, p) < p.price && <s className="opacity-60">{p.price}</s>}{" "}
                    <TicketIcon /> {priceFor(state, p)}
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
                      const next = props.filter((x) => x !== p.prop);
                      setProps(next);
                      apply({ props: next });
                    } else if (props.length < MAX_EQUIPPED_PROPS) {
                      const next = [...props, p.prop];
                      setProps(next);
                      apply({ props: next });
                    } else {
                      setNote(`Max ${MAX_EQUIPPED_PROPS} accessories — take one down first.`);
                    }
                  }}
                  className={`rounded-sm border px-2 py-1 text-xs ${
                    equipped
                      ? "border-accent text-accent ring-1 ring-accent"
                      : "border-line text-muted hover:border-ink hover:text-ink"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        <p className="micro text-muted">
          Glyph, logo, trim &amp; more live in the{" "}
          <a href="/profile#booth" className="text-accent hover:underline">
            full editor
          </a>
          .
        </p>
      </div>

      {/* Pinned under the scroll area, not inside it: on a phone the list of
          colours and styles is longer than the screen, and a Done button you
          have to scroll to find is a Done button people don't find. */}
      <div className="shrink-0 border-t border-line px-4 py-3">
        {note && <p className="mb-2 text-xs leading-snug text-muted">{note}</p>}
        {/* One button. There is nothing to cancel any more — every choice is
            already on the stand the moment it is made — so a "Cancel" next
            to it would promise an undo that does not exist. */}
        <button
          type="button"
          onClick={save}
          className="min-h-[44px] w-full rounded-md bg-accent-strong px-3 py-2 text-sm font-medium text-white hover:bg-accent-strong/90"
        >
          Done
        </button>
      </div>

      {pending && (
        <BuyConfirm
          name={pending.item.name}
          blurb={pending.item.blurb}
          price={priceFor(state, pending.item)}
          basePrice={pending.item.price}
          balance={balance}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            // onBuy is still the one authority on affordability — the
            // dialog's arithmetic is for the reader, not for the ledger.
            if (onBuy(pending.item.id)) pending.buy();
            else setNote(`That didn't go through — ${pending.item.name} is still unbought.`);
            setPending(null);
          }}
        />
      )}
    </aside>
  );
}
