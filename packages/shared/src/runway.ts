/**
 * Runway, the way the brief defines it: cash ÷ (burn − MRR), in months.
 * Infinity when the company is at or past break-even. The arithmetic is
 * returned as a sentence too, because the Finance coach must show it "in
 * one line" and the sentence has to be the same one the number came from.
 */
export interface RunwayInput {
  cash: number;
  burn: number;
  mrr: number;
}
export function netBurn(i: RunwayInput): number {
  return Math.max(0, i.burn) - Math.max(0, i.mrr);
}
export function runwayMonths(i: RunwayInput): number {
  const nb = netBurn(i);
  if (nb <= 0) return Infinity;
  return Math.max(0, i.cash) / nb;
}
export function fmtMoney(n: number, currency = "EUR"): string {
  const sym = currency === "USD" ? "$" : currency === "GBP" ? "£" : "€";
  return `${sym}${Math.round(n).toLocaleString("en-GB")}`;
}
export function fmtMonths(m: number): string {
  if (!Number.isFinite(m)) return "break-even";
  if (m < 1) return `${Math.round(m * 30)} days`;
  return `${(Math.round(m * 10) / 10).toLocaleString("en-GB")} months`;
}
/** "€40,000 ÷ (€6,000 − €1,200) = 8.3 months" */
export function runwayLine(i: RunwayInput, currency = "EUR"): string {
  const nb = netBurn(i);
  if (nb <= 0) return `${fmtMoney(i.mrr, currency)} MRR covers ${fmtMoney(i.burn, currency)} of burn — break-even, runway is not the constraint`;
  return `${fmtMoney(i.cash, currency)} ÷ (${fmtMoney(i.burn, currency)} − ${fmtMoney(i.mrr, currency)}) = ${fmtMonths(runwayMonths(i))}`;
}
/** ISO date runway ends, or null at break-even. */
export function runwayEnds(i: RunwayInput, from = new Date()): string | null {
  const m = runwayMonths(i);
  if (!Number.isFinite(m)) return null;
  const d = new Date(from);
  d.setDate(d.getDate() + Math.round(m * 30.44));
  return d.toISOString().slice(0, 10);
}
/** A salary scenario: what paying yourself X does to runway. */
export function salaryScenario(i: RunwayInput & { founderSalary: number }, newSalary: number, currency = "EUR"): { runway: number; line: string } {
  const burn = i.burn - i.founderSalary + newSalary;
  const next = { ...i, burn };
  const r = runwayMonths(next);
  const delta = r - runwayMonths(i);
  const dir = !Number.isFinite(delta) ? "" : delta >= 0 ? ` (+${fmtMonths(Math.abs(delta))})` : ` (−${fmtMonths(Math.abs(delta))})`;
  return { runway: r, line: `${fmtMoney(newSalary, currency)}/mo salary: ${runwayLine(next, currency)}${dir}` };
}
