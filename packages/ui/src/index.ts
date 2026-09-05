/**
 * @founderfloor/ui — the kit. Every app screen is composed only from here.
 *
 * Rule from the brief, kept: no native default widget may show anywhere.
 * If a screen needs something the site does not have, draw it in the same
 * pixel style at the same tile size, add it here, and mark it "new".
 */
export * from "./tokens";
export { FONT_MAP } from "./fonts";
export { Sprite, spriteMeta, PIXELATED_CSS, type SpriteId } from "./Sprite";
export { Plate, type PlateTone } from "./Plate";
export { Display, Body, Mono, Spec, Signage, Kbd } from "./Text";
export { Button, ButtonRow } from "./Button";
export { Sign, type GlyphId } from "./Sign";
export { Input } from "./Input";
export { Dialogue, useDialogue } from "./Dialogue";
export { TierTag, RankBadge, MemberBadge, TicketChip, TIER_LABEL, TIER_PRICING, type SubTier } from "./Badges";
export { Booth, type CarpetPattern } from "./Booth";
export { Menu, MENU, type MenuEntry } from "./Menu";
export { Progress } from "./Progress";
export { Toast } from "./Toast";
export { useLayout, type LayoutClass } from "./Responsive";
export { UNSUPPORTED } from "./atlas.gen";
