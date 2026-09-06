/**
 * YOUR STAND — "your booth, from the inside". The booth is drawn from the
 * atlas on the hall's own carpet colour; under it, in the site's panels:
 * this week's goal with a stepped meter, runway as one line of arithmetic,
 * MRR with the rank and the distance to the next, the next filing with its
 * source, where you are in the workshop, and the streak. "Repaint" is the
 * Sign Painter; "The numbers" is the stand editor the brief extends —
 * segment, MRR, burn, cash, salary, entity, residence, goal and target.
 */
import { useState } from "react";
import { Linking, Platform, Pressable, ScrollView, Share, View } from "react-native";
import { useRouter } from "expo-router";
import { STAGES, currentStage, stageProgress, generateDeadlines, runwayLine, runwayEnds, runwayMonths, fmtMoney, fmtMonths, toNextRank, nextRank, builderBrief, type EntityType, type Residence, type Segment } from "@founderfloor/shared";
import { Body, Booth, Button, ButtonRow, Choices, CountUp, Dialogue, Display, Input, MemberBadge, Mono, Plate, Progress, RankBadge, Ring, Spec, Sprite, Streak, Tap, TierTag, Toast, art, haptic, radius, shell, swatches, useLayout, type CarpetPattern, type SpriteId, Backdrop, Furniture, wash, scheme, type Hall } from "@founderfloor/ui";
import { TopBar } from "../../components/TopBar";
import { COLUMN, useBottomChrome } from "../../lib/chrome";
import { useFounder, useSession } from "../../lib/store";
import { useStand, hallName } from "../../lib/stand";

const ENTITIES: { v: EntityType; label: string }[] = [
  { v: "none", label: "None yet" },
  { v: "de-llc", label: "Delaware LLC" },
  { v: "de-ccorp", label: "Delaware C-corp" },
  { v: "cy-ltd", label: "Cyprus Ltd" },
  { v: "uk-ltd", label: "UK Ltd" },
  { v: "ee-ou", label: "Estonian OÜ" },
];
const RESIDENCES: { v: Residence; label: string }[] = [
  { v: "CY", label: "Cyprus" },
  { v: "US", label: "United States" },
  { v: "GB", label: "United Kingdom" },
  { v: "EE", label: "Estonia" },
  { v: "DE", label: "Germany" },
  { v: "other", label: "Elsewhere" },
];
const SEGMENTS: { v: Segment; label: string }[] = [
  { v: "b2b-saas", label: "B2B software" },
  { v: "consumer", label: "Consumer" },
  { v: "marketplace", label: "Marketplace" },
  { v: "services", label: "Services" },
  { v: "hardware", label: "Hardware" },
  { v: "other", label: "Other" },
];

export default function Stand() {
  const L = useLayout();
  const router = useRouter();
  const bottom = useBottomChrome();
  const stand = useStand();
  const auth = useSession((s) => s.auth);
  const sessionError = useSession((s) => s.error);
  const signOut = useSession((s) => s.signOut);
  const { record, setRecord, ticks, interviews, docs, saveDoc } = useFounder();
  const [brief, setBrief] = useState<string | null>(null);
  const [paint, setPaint] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [account, setAccount] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [look, setLook] = useState({ swatch: stand.swatch, carpetSwatch: stand.carpetSwatch, pattern: stand.pattern as CarpetPattern });
  const [draft, setDraft] = useState(() => ({ ...stand.record }));
  const [heroW, setHeroW] = useState(360);
  const r = stand.record;
  const cur = r.currency;
  const floor = art.floors[(stand.hall as keyof typeof art.floors) ?? "main-hall"] ?? art.floors["main-hall"];
  const say = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2600);
  };
  const share = async () => {
    const url = stand.slug ? `https://founderfloor.net/stand/${stand.slug}` : "https://founderfloor.net";
    if (Platform.OS === "web") {
      const nav = (globalThis as { navigator?: { share?: (d: { url: string; title: string }) => Promise<void>; clipboard?: { writeText: (s: string) => Promise<void> } } }).navigator;
      if (nav?.share) await nav.share({ url, title: stand.name }).catch(() => {});
      else await nav?.clipboard?.writeText(url).then(() => say("Stand link copied — paste it anywhere."));
      return;
    }
    await Share.share({ url, message: `${stand.name} — ${stand.oneLiner} ${url}` });
  };
  const rw = { cash: r.cash, burn: r.burn, mrr: r.mrr };
  const months = runwayMonths(rw);
  const ends = runwayEnds(rw);
  const next = nextRank(r.mrr);
  const deadlines = generateDeadlines({ entity: r.entity, residence: r.residence, formedOn: r.formedOn, yearEnd: r.yearEnd, stockGrant: r.stockGrant });
  const nextFiling = deadlines[0];
  const stage = currentStage(ticks);
  const column = { width: "100%" as const, maxWidth: COLUMN, alignSelf: "center" as const, paddingHorizontal: L.shell.paddingHorizontal };
  const num = (v: string) => Math.max(0, Math.round(Number(v.replace(/[^\d.]/g, "")) || 0));

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <TopBar
        left={
          auth ? (
            <Pressable onPress={() => setAccount(true)} accessibilityRole="button" accessibilityLabel="Your account" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Spec tone="ink">{auth.name}</Spec>
              <Spec tone="faint">{stand.source === "floor" ? "on the floor" : "no stand on a floor"}</Spec>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push("/sign-in")} accessibilityRole="button" accessibilityLabel="Sign in" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, borderWidth: 1, borderColor: shell.line, borderRadius: radius.md, paddingHorizontal: 10, height: 36, justifyContent: "center" })}>
              <Spec tone="ink">Sign in</Spec>
            </Pressable>
          )
        }
        center={<Spec tone="muted">{`${hallName(stand.hall)} · ${stand.spot}`}</Spec>}
        right={<TierTag tier={stand.tier} />}
      />
      <ScrollView contentContainerStyle={[column, { paddingBottom: bottom, gap: 16 }]}>
        {sessionError ? (
          <Plate tone="paper" radius={radius.md} padding={12}>
            <Body size="sm" tone="accent">
              {sessionError}
            </Body>
          </Plate>
        ) : null}
        {!stand.record.oneLiner && stand.source !== "rehearsal" ? (
          <Plate tone="panel" radius={radius.xl} padding={16}>
            <Spec tone="muted">THE SIGN IS BLANK</Spec>
            <Body style={{ marginTop: 6 }}>Start with the idea. Find one from who you know, or write yours and have it read back.</Body>
            <ButtonRow>
              <View style={{ marginTop: 10 }}>
                <Button size="sm" onPress={() => router.push("/idea/find")}>Find me an idea</Button>
              </View>
              <View style={{ marginTop: 10 }}>
                <Button size="sm" variant="secondary" onPress={() => router.push("/idea/check")}>
                  I have one
                </Button>
              </View>
            </ButtonRow>
          </Plate>
        ) : null}
        {stand.source === "rehearsal" ? (
          <Plate tone="paper" radius={radius.md} padding={12} lineColor={shell.line}>
            <Body size="sm" tone="muted">
              Rehearsal stand. Sign in with your founderfloor.net account and this becomes your real one, with your numbers.
            </Body>
          </Plate>
        ) : null}

        <Plate tone="panel" radius={radius.xl}>
          <View onLayout={(e) => setHeroW(Math.round(e.nativeEvent.layout.width))} style={{ backgroundColor: wash(swatches[stand.swatch % swatches.length], scheme() === "dark" ? 0.24 : 0.14), alignItems: "center", paddingTop: 24, paddingBottom: 30, overflow: "hidden", position: "relative" }}>
            <Backdrop hall={(stand.hall as Hall) in art.floors ? (stand.hall as Hall) : "main-hall"} floorH={L.compact ? 96 : 130} scale={2} />
            <Furniture set="stand" width={heroW} floorH={L.compact ? 96 : 130} scale={2} only="props" />
            <Booth swatch={stand.swatch} carpetSwatch={stand.carpetSwatch} pattern={stand.pattern} look={stand.look} scale={L.compact ? 2 : 3} />
            <Furniture set="stand" width={heroW} floorH={L.compact ? 96 : 130} scale={2} only="walkers" />
          </View>
          <View style={{ padding: 20, gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <RankBadge monthlyRevenue={r.mrr} />
              <MemberBadge tier={stand.tier} founding={stand.founding} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                <View style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: stand.online ? shell.verify : shell.faint }} />
                <Spec tone="faint">{stand.online ? "at the stand" : "away · receptionist on"}</Spec>
              </View>
            </View>
            <Display size={L.compact ? "3xl" : "4xl"}>{stand.name}</Display>
            <Body size="lg" tone="muted">
              {stand.oneLiner}
            </Body>
            <ButtonRow>
              <Button onPress={() => { setDraft({ ...stand.record }); setNumbers(true); }}>The numbers</Button>
              <Button variant="secondary" onPress={() => setPaint(true)}>
                Repaint
              </Button>
              <Button variant="ghost" onPress={share}>
                Share the card
              </Button>
            </ButtonRow>
          </View>
        </Plate>

        {/* this week */}
        <Plate tone="panel" radius={radius.xl} padding={20}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Spec tone="muted">THIS WEEK</Spec>
            <Streak days={Array.from({ length: 7 }, (_, i) => i >= 7 - Math.min(7, stand.streak))} label={stand.streak === 1 ? "1 day" : stand.streak ? `${stand.streak} days` : "day one"} />
          </View>
          {r.weeklyGoal ? (
            <View style={{ marginTop: 12, flexDirection: "row", gap: 16, alignItems: "center" }}>
              <Ring value={r.weeklyGoalProgress ?? 0} size={84} label={`${Math.round((r.weeklyGoalProgress ?? 0) * 100)}%`} sub="done" />
              <View style={{ flex: 1, gap: 8 }}>
                <Body size="sm" medium>
                  {r.weeklyGoal}
                </Body>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {[0.25, 0.5, 0.75, 1].map((v) => (
                    <Tap key={v} haptic={v === 1 ? "success" : "light"} onPress={() => setRecord({ weeklyGoalProgress: v })} accessibilityLabel={`${v * 100} percent done`} style={{ borderWidth: 1, borderColor: (r.weeklyGoalProgress ?? 0) >= v ? shell.ink : shell.line, backgroundColor: (r.weeklyGoalProgress ?? 0) >= v ? shell.ink : "transparent", borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Spec tone={(r.weeklyGoalProgress ?? 0) >= v ? "paper" : "ink"}>{`${v * 100}%`}</Spec>
                    </Tap>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 10, gap: 8 }}>
              <Body size="sm" tone="muted">
                No goal for this week. Ines writes it with you on a Monday, or put one in the numbers.
              </Body>
              <Button size="sm" variant="ghost" onPress={() => router.navigate({ pathname: "/reception", params: { coach: "strategy" } })}>
                Monday plan with Ines
              </Button>
            </View>
          )}
        </Plate>

        {/* money */}
        <View style={{ flexDirection: L.compact ? "column" : "row", gap: 16 }}>
          <Plate tone="panel" radius={radius.xl} padding={20} style={{ flex: 1 }}>
            <Spec tone="muted">RUNWAY</Spec>
            {r.burn ? (
              <>
                <View style={{ marginTop: 8 }}>
                  {Number.isFinite(months) ? <CountUp to={Math.round(months * 10) / 10} suffix=" months" format={(n) => (Math.round(n * 10) / 10).toLocaleString("en-GB")} /> : <Display size="xl">{fmtMonths(months)}</Display>}
                </View>
                <Mono size="xs" tone="muted" style={{ marginTop: 4 }}>
                  {runwayLine(rw, cur)}
                </Mono>
                {ends ? <Spec tone="faint" style={{ marginTop: 6 }}>{`runs out around ${ends}`}</Spec> : <Spec tone="verify" style={{ marginTop: 6 }}>break-even</Spec>}
              </>
            ) : (
              <>
                <Display size="xl" style={{ marginTop: 8 }} tone="faint">
                  —
                </Display>
                <Body size="sm" tone="muted" style={{ marginTop: 4 }}>
                  Cash ÷ (burn − MRR). Put burn and cash in the numbers.
                </Body>
              </>
            )}
          </Plate>
          <Plate tone="panel" radius={radius.xl} padding={20} style={{ flex: 1 }}>
            <Spec tone="muted">MRR</Spec>
            <View style={{ marginTop: 8 }}>
              <CountUp to={r.mrr} prefix={cur === "USD" ? "$" : cur === "GBP" ? "£" : "€"} delay={150} />
            </View>
            <View style={{ marginTop: 6 }}>
              <RankBadge monthlyRevenue={r.mrr} />
            </View>
            <Spec tone="faint" style={{ marginTop: 6 }}>{next ? `${fmtMoney(toNextRank(r.mrr), cur)} to ${next.name}` : "top of the hall"}</Spec>
            {next ? (
              <View style={{ marginTop: 8 }}>
                <Progress value={r.mrr / next.minRevenue} color={stand.rank.color} />
              </View>
            ) : null}
          </Plate>
        </View>

        {/* filings + workshop */}
        <View style={{ flexDirection: L.compact ? "column" : "row", gap: 16 }}>
          <Plate tone="panel" radius={radius.xl} padding={20} style={{ flex: 1 }}>
            <Spec tone="muted">NEXT FILING</Spec>
            {nextFiling ? (
              <>
                <Display size="lg" style={{ marginTop: 8 }}>{`${nextFiling.daysLeft} days`}</Display>
                <Body size="sm" medium style={{ marginTop: 2 }}>
                  {nextFiling.title}
                </Body>
                <Spec tone="faint">{nextFiling.due}</Spec>
                <Pressable onPress={() => Linking.openURL(nextFiling.source)} accessibilityRole="link" style={{ marginTop: 8 }}>
                  <Spec tone="accent">{`Official source → ${new URL(nextFiling.source).hostname}`}</Spec>
                </Pressable>
                <Spec tone="faint" style={{ marginTop: 4 }}>
                  Not tax advice. {deadlines.length > 1 ? `${deadlines.length - 1} more with Theo.` : ""}
                </Spec>
              </>
            ) : (
              <Body size="sm" tone="muted" style={{ marginTop: 8 }}>
                {r.entity === "none" ? "No entity on the stand, so nothing to file. Choose one in the numbers." : "Nothing dated for this entity and residence. Theo will say what he knows."}
              </Body>
            )}
          </Plate>
          <Plate tone="panel" radius={radius.xl} padding={20} style={{ flex: 1 }}>
            <Spec tone="muted">THE WORKSHOP</Spec>
            <Display size="lg" style={{ marginTop: 8 }}>{`${stage.n}. ${stage.name}`}</Display>
            <View style={{ marginTop: 8 }}>
              <Progress value={stageProgress(stage, ticks)} right={`${stage.items.filter((i) => ticks.includes(i.id)).length}/${stage.items.length}`} />
            </View>
            <Spec tone="faint" style={{ marginTop: 6 }}>{`${STAGES.filter((s) => stageProgress(s, ticks) >= 1).length} of 6 rooms done`}</Spec>
            <View style={{ marginTop: 10 }}>
              <Button size="sm" variant="ghost" onPress={() => router.navigate("/build")}>
                Open the workshop
              </Button>
            </View>
          </Plate>
        </View>

        <View style={{ flexDirection: L.compact ? "column" : "row", gap: 12 }}>
          <Pressable onPress={() => router.navigate("/office")} accessibilityRole="button" style={{ flex: 1 }}>
            <Plate tone="paperSign" radius={radius.lg} padding={14}>
              <Spec tone="muted">THE OFFICE</Spec>
              <Body size="sm" style={{ marginTop: 4 }}>Weekly log, interviews, the calendar, the update.</Body>
            </Plate>
          </Pressable>
          <Pressable onPress={() => router.push("/drawer")} accessibilityRole="button" style={{ flex: 1 }}>
            <Plate tone="paperSign" radius={radius.lg} padding={14}>
              <Spec tone="muted">THE DRAWER</Spec>
              <Body size="sm" style={{ marginTop: 4 }}>One-pager, landing copy, pricing, launch checklist.</Body>
            </Plate>
          </Pressable>
          <Pressable onPress={() => router.push("/idea/check")} accessibilityRole="button" style={{ flex: 1 }}>
            <Plate tone="paperSign" radius={radius.lg} padding={14}>
              <Spec tone="muted">SECOND OPINION</Spec>
              <Body size="sm" style={{ marginTop: 4 }}>Read the idea back after this week's conversations.</Body>
            </Plate>
          </Pressable>
        </View>
        <Pressable onPress={() => setBrief(builderBrief(r, { ticks, interviews, docs: docs.filter((d) => d.kind !== "brief").slice(0, 2), mcp: true }))} accessibilityRole="button">
          <Plate tone="plate" radius={radius.lg} padding={14}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Spec tone="paperQuiet">HAND IT TO YOUR BUILDER</Spec>
                <Body size="sm" tone="paper" style={{ marginTop: 4 }}>
                  The stand as a brief for Claude Code, Cursor or Lovable: build first, do not build yet, done means. No copying between apps.
                </Body>
              </View>
              <Body tone="accentLift">→</Body>
            </View>
          </Plate>
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }}>
          <Sprite id="logo-mark" scale={1} />
          <Mono tone="muted" size="xs">{stand.slug ? `founderfloor.net/stand/${stand.slug}` : "No public address until the stand is on a floor."}</Mono>
        </View>
      </ScrollView>

      {/* the numbers — the brief's extended stand editor */}
      <Dialogue open={numbers} onClose={() => setNumbers(false)} sign="THE NUMBERS" keeper="Theo" blurb="What the coaches reason over. Nothing here is shown to visitors." color="#5E7C93" wide footer="Saved on this device until the desk is wired.">
        <View style={{ gap: 14 }}>
          {stand.source !== "floor" ? (
            <>
              <Input label="Company" value={draft.name} onChangeText={(name) => setDraft((d) => ({ ...d, name }))} placeholder="What it's called" />
              <Input label="One-liner — what changes hands" value={draft.oneLiner} onChangeText={(oneLiner) => setDraft((d) => ({ ...d, oneLiner }))} placeholder="Prepaid passes for the cafés people come back to." />
            </>
          ) : (
            <Spec tone="faint">Name and sign come from your stand on the floor; repaint them there.</Spec>
          )}
          <Choices label="Segment" value={draft.segment ?? "other"} options={SEGMENTS} onChange={(segment) => setDraft((d) => ({ ...d, segment }))} />
          <Choices label="Currency" value={draft.currency} options={[{ v: "EUR", label: "€ EUR" }, { v: "USD", label: "$ USD" }, { v: "GBP", label: "£ GBP" }]} onChange={(currency) => setDraft((d) => ({ ...d, currency }))} />
          <View style={{ flexDirection: L.compact ? "column" : "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input label="MRR / month" value={String(draft.mrr || "")} onChangeText={(v) => setDraft((d) => ({ ...d, mrr: num(v) }))} keyboardType="numeric" mono placeholder="0" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Burn / month, all in" value={String(draft.burn || "")} onChangeText={(v) => setDraft((d) => ({ ...d, burn: num(v) }))} keyboardType="numeric" mono placeholder="0" />
            </View>
          </View>
          <View style={{ flexDirection: L.compact ? "column" : "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input label="Cash in the bank" value={String(draft.cash || "")} onChangeText={(v) => setDraft((d) => ({ ...d, cash: num(v) }))} keyboardType="numeric" mono placeholder="0" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Founder salary / month" value={String(draft.founderSalary || "")} onChangeText={(v) => setDraft((d) => ({ ...d, founderSalary: num(v) }))} keyboardType="numeric" mono placeholder="0" />
            </View>
          </View>
          {draft.burn ? <Mono size="xs" tone="muted">{runwayLine({ cash: draft.cash, burn: draft.burn, mrr: draft.mrr }, draft.currency)}</Mono> : null}
          <Choices label="Entity" value={draft.entity} options={ENTITIES} onChange={(entity) => setDraft((d) => ({ ...d, entity }))} />
          {draft.entity !== "none" ? (
            <View style={{ flexDirection: L.compact ? "column" : "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Input label="Formed on (YYYY-MM-DD)" value={draft.formedOn ?? ""} onChangeText={(formedOn) => setDraft((d) => ({ ...d, formedOn }))} mono placeholder="2026-08-20" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Last financial year end" value={draft.yearEnd ?? ""} onChangeText={(yearEnd) => setDraft((d) => ({ ...d, yearEnd }))} mono placeholder="2025-12-31" />
              </View>
            </View>
          ) : null}
          {draft.entity === "de-ccorp" ? <Input label="Date you received vesting stock (for the 83(b))" value={draft.stockGrant ?? ""} onChangeText={(stockGrant) => setDraft((d) => ({ ...d, stockGrant }))} mono placeholder="2026-09-01" /> : null}
          <Choices label="Where you live" value={draft.residence} options={RESIDENCES} onChange={(residence) => setDraft((d) => ({ ...d, residence }))} />
          <Input label="This week's goal, with a number" value={draft.weeklyGoal ?? ""} onChangeText={(weeklyGoal) => setDraft((d) => ({ ...d, weeklyGoal, weeklyGoalProgress: weeklyGoal === d.weeklyGoal ? d.weeklyGoalProgress : 0 }))} placeholder="Ten cold messages out by Friday" />
          <Input label="90-day target" value={draft.target90 ?? ""} onChangeText={(target90) => setDraft((d) => ({ ...d, target90 }))} placeholder="€2,000 MRR by 5 December" />
          <ButtonRow>
            <Button
              onPress={() => {
                setRecord(draft);
                setNumbers(false);
                void haptic("success");
                say("Numbers saved — the coaches use them now.");
              }}
            >
              Save the numbers
            </Button>
            <Button variant="ghost" onPress={() => setNumbers(false)}>
              Leave it
            </Button>
          </ButtonRow>
        </View>
      </Dialogue>

      {/* repaint — the Sign Painter */}
      <Dialogue open={paint} onClose={() => setPaint(false)} sign="SIGN PAINTER" keeper="Alder" blurb="Colours and carpet. The sign itself is painted on the floor." color="#5E7C93" footer={stand.source === "floor" ? "Repainting the live stand lands at Gate 6; this is a preview." : "Nothing changes on the floor until you save."}>
        <View style={{ gap: 16 }}>
          <View style={{ alignItems: "center", backgroundColor: floor.a, paddingVertical: 12, borderRadius: radius.md }}>
            <Booth swatch={look.swatch} carpetSwatch={look.carpetSwatch} pattern={look.pattern} look={stand.look} scale={2} />
          </View>
          <View style={{ gap: 6 }}>
            <Spec tone="muted">Banner</Spec>
            <SwatchRow value={look.swatch} onChange={(swatch) => setLook((l) => ({ ...l, swatch }))} />
          </View>
          <View style={{ gap: 6 }}>
            <Spec tone="muted">Carpet</Spec>
            <SwatchRow value={look.carpetSwatch} onChange={(carpetSwatch) => setLook((l) => ({ ...l, carpetSwatch }))} />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              {(["solid", "border", "stripes"] as CarpetPattern[]).map((p) => {
                const on = p === look.pattern;
                return (
                  <Pressable key={p} onPress={() => setLook((l) => ({ ...l, pattern: p }))} accessibilityRole="radio" accessibilityState={{ selected: on }} style={{ borderWidth: on ? 2 : 1, borderColor: on ? shell.ink : shell.line, borderRadius: radius.md, padding: on ? 3 : 4, alignItems: "center", gap: 4 }}>
                    <Sprite id={`carpet-${look.carpetSwatch}-${p}` as SpriteId} scale={1} style={{ width: 48, height: 48 }} />
                    <Spec tone={on ? "ink" : "muted"}>{p}</Spec>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <ButtonRow>
            <Button
              onPress={() => {
                setPaint(false);
                say(stand.source === "floor" ? "Preview only — the live repaint lands at Gate 6." : "Stand repainted.");
              }}
            >
              {stand.source === "floor" ? "Keep the preview" : "Save the stand"}
            </Button>
            <Button variant="ghost" onPress={() => setPaint(false)}>
              Leave it
            </Button>
          </ButtonRow>
        </View>
      </Dialogue>

      <Dialogue open={account} onClose={() => setAccount(false)} sign="YOUR BADGE" keeper={auth?.name ?? ""} blurb={auth?.email || "No email on this account."} footer={null}>
        <View style={{ gap: 12 }}>
          <Spec tone="muted">{`Account ${auth?.id ?? ""}`}</Spec>
          <Body size="sm" tone="muted">
            {stand.source === "floor" ? "Your stand, tickets and connections are the site's; this app reads them from the same floor server." : "This account has no stand on a floor yet. Set one up on the Floor tab, at any vacant plinth."}
          </Body>
          <ButtonRow>
            <Button
              variant="secondary"
              onPress={async () => {
                await signOut();
                setAccount(false);
              }}
            >
              Sign out
            </Button>
            <Button variant="ghost" onPress={() => setAccount(false)}>
              Close
            </Button>
          </ButtonRow>
        </View>
      </Dialogue>

      <Dialogue open={!!brief} onClose={() => setBrief(null)} sign="THE BRIEF" keeper="for your builder" blurb="Paste it into Claude Code, Cursor or Lovable as the first message. It tells the agent what to build first, what not to, and when it is done." color="#3F4A5A" wide footer="Square brackets are facts not on the stand yet; the agent is told not to invent them.">
        {brief ? (
          <View style={{ gap: 12 }}>
            <Plate tone="paper" radius={radius.md} padding={14}>
              <Mono size="xs">{brief}</Mono>
            </Plate>
            <ButtonRow>
              <Button onPress={() => Share.share({ message: brief, title: `${stand.name} — build brief` }).catch(() => {})}>Send it</Button>
              <Button
                variant="secondary"
                onPress={() => {
                  saveDoc({ kind: "brief", title: "Build brief", body: brief }, "rehearsal");
                  setBrief(null);
                  say("Brief saved to the drawer.");
                }}
              >
                Keep in the drawer
              </Button>
            </ButtonRow>
          </View>
        ) : null}
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
