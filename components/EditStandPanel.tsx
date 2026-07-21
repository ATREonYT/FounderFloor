"use client";

/**
 * On-floor stand editor: walk up to your own booth, hit Edit, and change
 * the stand right where it lives — sign, pitch, colors, style, accessories
 * — with the result broadcast to everyone on the floor the moment you
 * save. The full editor (glyph, logo upload, trim, category…) stays on
 * the profile page; this covers the things you notice while standing at
 * your own booth.
 */

import { useState } from "react";
import type { AppState, BoothProp, BoothStyle, Startup } from "@/lib/types";
import {
  BOOTH_PROPS,
  BOOTH_STYLES,
  BOOTH_SWATCHES,
  MAX_EQUIPPED_PROPS,
  ownsItem,
  walletBalance,
} from "@/lib/data/shop";
import TicketIcon from "@/components/TicketIcon";

interface EditStandPanelProps {
  startup: Startup;
  state: AppState;
  /** actions.buyItem — returns true when the purchase went through. */
  onBuy: (itemId: string) => boolean;
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

  const focus = { onFocus: () => onFocusChange?.(true), onBlur: () => onFocusChange?.(false) };
  const balance = walletBalance(state);

  // owned OR already on the saved stand (grandfathered)
  const mayWear = (s: BoothStyle): boolean =>
    s === "classic" || ownsItem(state, `style:${s}`) || startup.booth.style === s;
  const mayEquip = (p: BoothProp): boolean =>
    ownsItem(state, `prop:${p}`) || (startup.booth.props ?? []).includes(p);

  const save = (): void => {
    if (!name.trim()) {
      setNote("The stand needs a startup name.");
      return;
    }
    onSave({
      ...startup,
      name: name.trim(),
      oneLiner: oneLiner.trim(),
      pitch: pitch.trim(),
      booth: {
        ...startup.booth,
        sign: sign.trim().slice(0, 12) || name.trim().slice(0, 12),
        banner,
        carpet,
        style: style !== "classic" && mayWear(style) ? style : undefined,
        props: (() => {
          const equipped = props.filter(mayEquip).slice(0, MAX_EQUIPPED_PROPS);
          return equipped.length ? equipped : undefined;
        })(),
      },
    });
  };

  return (
    <aside
      aria-label="Edit your stand"
      className="panel anim-in pointer-events-auto flex w-[340px] max-w-[calc(100vw-24px)] flex-col shadow-card"
    >
      <div className="flex items-center justify-between rounded-t-md border-b border-line px-4 py-2">
        <span className="micro text-muted">Editing your stand — live</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close stand editor"
          className="rounded-sm px-1 leading-none text-muted hover:text-ink"
        >
          ×
        </button>
      </div>

      <div className="flex max-h-[62vh] flex-col gap-3 overflow-y-auto p-4">
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

        <SwatchRow label="Banner" value={banner} onPick={setBanner} />
        <SwatchRow label="Carpet" value={carpet} onPick={setCarpet} />

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
                    aria-label={`Buy ${s.name} for ${s.price} tickets`}
                    onClick={() => {
                      if (onBuy(s.id)) {
                        setStyle(s.style);
                        setNote(`${s.name} is yours — save to show it off.`);
                      } else {
                        setNote(`Not enough tickets — ${s.name} costs ${s.price}.`);
                      }
                    }}
                    className="rounded-sm border border-gold/60 px-2 py-1 text-xs text-gold-deep hover:border-gold"
                  >
                    {s.name} <TicketIcon /> {s.price}
                  </button>
                );
              }
              return (
                <button
                  key={s.id}
                  type="button"
                  title={s.blurb}
                  aria-pressed={selected}
                  onClick={() => setStyle(s.style)}
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
                    aria-label={`Buy ${p.name} for ${p.price} tickets`}
                    onClick={() => {
                      if (onBuy(p.id)) {
                        setProps((cur) =>
                          cur.length < MAX_EQUIPPED_PROPS ? [...cur, p.prop] : cur,
                        );
                        setNote(`${p.name} bought — save to place it.`);
                      } else {
                        setNote(`Not enough tickets — ${p.name} costs ${p.price}.`);
                      }
                    }}
                    className="rounded-sm border border-gold/60 px-2 py-1 text-xs text-gold-deep hover:border-gold"
                  >
                    {p.name} <TicketIcon /> {p.price}
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
                      setProps((cur) => cur.filter((x) => x !== p.prop));
                    } else if (props.length < MAX_EQUIPPED_PROPS) {
                      setProps((cur) => [...cur, p.prop]);
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

        {note && <p className="text-xs leading-snug text-muted">{note}</p>}

        <div className="flex items-center gap-2 border-t border-line pt-3">
          <button
            type="button"
            onClick={save}
            className="flex-1 rounded-md bg-accent-strong px-3 py-2 text-sm font-medium text-white hover:bg-accent-strong/90"
          >
            Save — updates live
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line px-3 py-2 text-sm text-muted hover:border-ink hover:text-ink"
          >
            Cancel
          </button>
        </div>
        <p className="micro text-muted">
          Glyph, logo, trim &amp; more live in the{" "}
          <a href="/profile#booth" className="text-accent hover:underline">
            full editor
          </a>
          .
        </p>
      </div>
    </aside>
  );
}
