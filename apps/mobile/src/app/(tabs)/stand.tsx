/**
 * YOUR STAND — the thing the app exists to look after. The booth is drawn
 * from the atlas on the hall's own carpet colour, the way it sits on the
 * floor; the numbers under it are the week's, in tabular mono. Repainting
 * opens the Sign Painter's dialogue: name, one-liner, the fourteen swatches
 * (as pixel carpets, not colour circles), and the three carpet patterns.
 */
import { useState } from "react";
import { Platform, Pressable, ScrollView, Share, View } from "react-native";
import { Body, Booth, Button, ButtonRow, Dialogue, Display, Input, MemberBadge, Mono, Plate, Progress, RankBadge, Spec, Sprite, TierTag, Toast, art, radius, rankFor, ranks, shell, swatches, useLayout, type CarpetPattern, type SpriteId } from "@founderfloor/ui";
import { TopBar } from "../../components/TopBar";
import { COLUMN, useBottomChrome } from "../../lib/chrome";
import { STAND, YOU } from "../../lib/mock";

export default function Stand() {
  const L = useLayout();
  const bottom = useBottomChrome();
  const [stand, setStand] = useState(STAND);
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState({ name: stand.name, oneLiner: stand.oneLiner, swatch: stand.swatch, carpetSwatch: stand.carpetSwatch, pattern: stand.pattern as CarpetPattern });
  const [toast, setToast] = useState<string | null>(null);
  const floor = art.floors[stand.hall];
  const rank = rankFor(stand.mrr);
  const next = ranks.find((r) => r.min > stand.mrr);
  const say = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2400);
  };
  const share = async () => {
    const url = `https://founderfloor.net/stand/${stand.slug}`;
    if (Platform.OS === "web") {
      const nav = (globalThis as { navigator?: { share?: (d: { url: string; title: string }) => Promise<void>; clipboard?: { writeText: (s: string) => Promise<void> } } }).navigator;
      if (nav?.share) await nav.share({ url, title: stand.name }).catch(() => {});
      else await nav?.clipboard?.writeText(url).then(() => say("Stand link copied — paste it anywhere."));
      return;
    }
    await Share.share({ url, message: `${stand.name} — ${stand.oneLiner} ${url}` });
  };
  const save = () => {
    setStand((s) => ({ ...s, ...draft }));
    setEdit(false);
    say("Stand updated — the whole floor sees it.");
  };
  const column = { width: "100%" as const, maxWidth: COLUMN, alignSelf: "center" as const, paddingHorizontal: L.shell.paddingHorizontal };

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <TopBar center={<Spec tone="muted">{`Main Hall · ${stand.spot}`}</Spec>} right={<TierTag tier={YOU.tier} />} />
      <ScrollView contentContainerStyle={[column, { paddingBottom: bottom, gap: 16 }]}>
        <Plate tone="panel" radius={radius.xl}>
          <View style={{ backgroundColor: floor.a, alignItems: "center", paddingVertical: 20, borderBottomWidth: 4, borderBottomColor: floor.wall }}>
            <Booth swatch={stand.swatch} carpetSwatch={stand.carpetSwatch} pattern={stand.pattern} look={YOU.look} scale={L.compact ? 2 : 3} />
          </View>
          <View style={{ padding: 20, gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <RankBadge monthlyRevenue={stand.mrr} />
              <MemberBadge tier={YOU.tier} founding={YOU.founding} />
              <Spec tone="faint" style={{ marginLeft: "auto" }}>
                updated {stand.updated}
              </Spec>
            </View>
            <Display size={L.compact ? "3xl" : "4xl"}>{stand.name}</Display>
            <Body size="lg" tone="muted">
              {stand.oneLiner}
            </Body>
            <ButtonRow>
              <Button onPress={() => setEdit(true)}>Repaint the stand</Button>
              <Button variant="ghost" onPress={share}>
                Share the stand card
              </Button>
            </ButtonRow>
          </View>
        </Plate>

        <Plate tone="panel" radius={radius.xl} padding={20}>
          <Spec tone="muted">THIS WEEK</Spec>
          <View style={{ flexDirection: "row", marginTop: 12 }}>
            {[
              ["Visitors", stand.week.visitors, "+12 on last week"],
              ["Signatures", stand.week.signatures, "guestbook"],
              ["Connections", stand.week.connections, "new people"],
            ].map(([k, v, s], i) => (
              <View key={String(k)} style={{ flex: 1, borderLeftWidth: i ? 1 : 0, borderLeftColor: shell.line, paddingLeft: i ? 16 : 0 }}>
                <Display size="xl">{String(v)}</Display>
                <Body size="sm" medium>
                  {k}
                </Body>
                <Spec tone="faint">{s}</Spec>
              </View>
            ))}
          </View>
        </Plate>

        <Plate tone="panel" radius={radius.xl} padding={20}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Spec tone="muted">THE RANK</Spec>
            <Mono tone="muted">{`€${stand.mrr.toLocaleString("en-GB")} / mo · self-reported`}</Mono>
          </View>
          <View style={{ marginTop: 12 }}>
            <Progress value={next ? stand.mrr / next.min : 1} label={next ? `${rank.name} → ${next.name}` : rank.name} right={next ? `€${(next.min - stand.mrr).toLocaleString("en-GB")} to go` : "top of the hall"} color={rank.color} />
          </View>
          <Body size="sm" tone="muted" style={{ marginTop: 12 }}>
            Ranks move on revenue you report; Bea at the Records can verify it for a gold mark. Nothing here is a leaderboard you can buy.
          </Body>
        </Plate>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }}>
          <Sprite id="logo-mark" scale={1} />
          <Mono tone="muted" size="xs">{`founderfloor.net/stand/${stand.slug}`}</Mono>
        </View>
      </ScrollView>

      <Dialogue open={edit} onClose={() => setEdit(false)} sign="SIGN PAINTER" keeper="Alder" blurb="Repaint your stand — colours, banner, sign." color="#5E7C93" footer="Nothing changes on the floor until you save.">
        <View style={{ gap: 16 }}>
          <View style={{ alignItems: "center", backgroundColor: floor.a, paddingVertical: 12, borderRadius: radius.md }}>
            <Booth swatch={draft.swatch} carpetSwatch={draft.carpetSwatch} pattern={draft.pattern} look={YOU.look} scale={2} />
          </View>
          <Input label="Startup" value={draft.name} onChangeText={(name) => setDraft((d) => ({ ...d, name }))} />
          <Input label="One-liner — what changes hands" value={draft.oneLiner} onChangeText={(oneLiner) => setDraft((d) => ({ ...d, oneLiner }))} multiline />
          <View style={{ gap: 6 }}>
            <Spec tone="muted">Banner</Spec>
            <SwatchRow value={draft.swatch} onChange={(swatch) => setDraft((d) => ({ ...d, swatch }))} />
          </View>
          <View style={{ gap: 6 }}>
            <Spec tone="muted">Carpet</Spec>
            <SwatchRow value={draft.carpetSwatch} onChange={(carpetSwatch) => setDraft((d) => ({ ...d, carpetSwatch }))} />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              {(["solid", "border", "stripes"] as CarpetPattern[]).map((p) => {
                const on = p === draft.pattern;
                return (
                  <Pressable key={p} onPress={() => setDraft((d) => ({ ...d, pattern: p }))} accessibilityRole="radio" accessibilityState={{ selected: on }} style={{ borderWidth: on ? 2 : 1, borderColor: on ? shell.ink : shell.line, borderRadius: radius.md, padding: on ? 3 : 4, alignItems: "center", gap: 4 }}>
                    <Sprite id={`carpet-${draft.carpetSwatch}-${p}` as SpriteId} scale={1} style={{ width: 48, height: 48 }} />
                    <Spec tone={on ? "ink" : "muted"}>{p}</Spec>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <ButtonRow>
            <Button onPress={save}>Save the stand</Button>
            <Button variant="ghost" onPress={() => setEdit(false)}>
              Leave it
            </Button>
          </ButtonRow>
        </View>
      </Dialogue>
      <Toast text={toast ?? ""} visible={!!toast} />
    </View>
  );
}

function SwatchRow({ value, onChange }: { value: number; onChange: (i: number) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {swatches.map((hex, i) => {
        const on = i === value;
        return (
          <Pressable key={hex} onPress={() => onChange(i)} accessibilityRole="radio" accessibilityLabel={`Colour ${i + 1}`} accessibilityState={{ selected: on }} style={{ width: 32, height: 32, borderRadius: radius.sm, backgroundColor: hex, borderWidth: on ? 3 : 0, borderColor: shell.ink, padding: on ? 0 : 3 }}>
            {on ? <View style={{ flex: 1, borderWidth: 2, borderColor: shell.paper, borderRadius: 1 }} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
