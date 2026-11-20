// Comparing our findings with the official verdicts on one invoice of the multi-error corpus, rule by rule.
// Shared by scripts/compare-multi-error-invoices.ts (the exploration and recording run) and the tests that hold
// the checker to the recorded verdicts, so both count a difference the same way. Pure: no engine imports (the
// caller says which rule IDs its rule set checks); the website's build script copies it into the GitHub Action's
// tests unchanged.

export type Flag = "error" | "warning" | "info";
export type Verdicts = Record<string, Flag>;
export interface FindingLike {
  ruleId: string;
  severity: string;
  message: string;
}
export interface CompareRules {
  /** Catalog rule IDs the rule set checks; official asserts outside it are left out (and listed as not checked) */
  known: (id: string) => boolean;
  /** Our own checks (InvoiceVerify's IV- rules), never compared */
  own: (id: string) => boolean;
  /** Rules of the documented deliberate differences (official-parity.ts) whose every difference is deliberate */
  deliberate: ReadonlySet<string>;
}
export interface RuleDifference {
  rule: string;
  kind: "extra" | "missing" | "level";
  official: "error" | "warning" | "pass";
  ours: "error" | "warning" | "pass";
}

/**
 * The documented per-rate IGIC / IPSI check (official-parity.ts "br-s-01": a rate used without a VAT breakdown row
 * of its own, BR-VAT-01): its findings say "Category L 7% is used but has no VAT breakdown." The official CII
 * BR-IG-01 / BR-IP-01 count uses and rows together (`>= 2`), so they can pass where this check fails. A test pins
 * that the engine's message still matches.
 */
export const PER_RATE_IGIC_IPSI = /^Category [LM]( \S+%)? is used but has no VAT breakdown\.$/;

/**
 * The rules of the documented deliberate differences whose every difference is deliberate (official-parity.ts:
 * BR-CO-25 reported as a warning, BR-S-01 per rate, BR-CO-09's EL prefix). Not the merged IDs (same verdict, other
 * ID) or BR-VAT-01, which is deliberate only where the per-rate IGIC / IPSI check alone fires (ruleDifferences). A
 * site test keeps this list in step with official-parity.ts.
 */
export const DELIBERATE_RULES: ReadonlySet<string> = new Set(["BR-CO-25", "BR-S-01", "BR-CO-09"]);
/** The same for Peppol BIS 3.0.22, whose CEN 1.3.16 copy still lists EL: no BR-CO-09 difference is deliberate there */
export const DELIBERATE_RULES_1316: ReadonlySet<string> = new Set([...DELIBERATE_RULES].filter((id) => id !== "BR-CO-09"));

/** The CI fixture (src/test/fixtures/schematron-parity/multi-error-verdicts.json), written by the recording run. */
export interface RecordedCorpus {
  seed: number;
  count: number;
  min: number;
  max: number;
  /** Base name → content hash; the bases are stored as multi-error/<name>.xml beside the file */
  bases: Record<string, string>;
  /** Case ID → its content hash and the official verdicts in compact form (encodeVerdicts); 3.1.0 left out when equal */
  cases: Record<string, { hash: string; "3.0.22": string; "3.1.0"?: string }>;
}
/** Verdicts as one sorted string: rule IDs separated by spaces, warnings as "w:ID"; info-level asserts don't count. */
export const encodeVerdicts = (v: Verdicts): string =>
  Object.entries(v)
    .filter(([, f]) => f !== "info")
    .map(([id, f]) => (f === "warning" ? `w:${id}` : id))
    .sort()
    .join(" ");
export const decodeVerdicts = (s: string): Verdicts =>
  Object.fromEntries(s.split(" ").filter(Boolean).map((t): [string, Flag] => (t.startsWith("w:") ? [t.slice(2), "warning"] : [t, "error"])));

/**
 * Every real difference on one invoice, ready for a test's toEqual([]) (the invoice's faults included, so a failing
 * run says what to reproduce); undefined when there is none.
 */
export function describeDifferences(id: string, faults: readonly string[], official: Verdicts, ours: readonly FindingLike[], rules: CompareRules) {
  const { real } = ruleDifferences(official, ours, rules);
  const verdict = verdictDiffers(official, ours, rules);
  if (!real.length && !verdict) return undefined;
  return {
    id,
    faults: [...faults],
    rules: real.map((d) => `${d.rule}: official ${d.official}, ours ${d.ours}`),
    verdict: verdict ? `official ${verdict.official ? "fails" : "passes"}, ours ${verdict.ours ? "fails" : "passes"}` : "same",
  };
}

const RANK: Record<Flag, number> = { info: 0, warning: 1, error: 2 };
/** The worst finding per rule. */
export function flagsOf(findings: readonly FindingLike[]): Verdicts {
  const out: Verdicts = {};
  for (const f of findings) {
    const flag = (f.severity === "error" || f.severity === "warning" ? f.severity : "info") as Flag;
    if (!out[f.ruleId] || RANK[flag] > RANK[out[f.ruleId]!]) out[f.ruleId] = flag;
  }
  return out;
}
const level = (f: Flag | undefined) => (f === undefined || f === "info" ? "pass" : f);

/**
 * Rule-level differences between the official verdicts (catalog IDs, as recorded) and our findings: `real` ones,
 * `deliberate` ones (a documented difference) and official rules the rule set doesn't check. Our own checks never
 * count. A BR-VAT-01 we report only through the per-rate IGIC / IPSI check is deliberate when the official files
 * pass it; missing it never is.
 */
export function ruleDifferences(official: Verdicts, ours: readonly FindingLike[], rules: CompareRules) {
  const mine = flagsOf(ours);
  const real: RuleDifference[] = [];
  const deliberate: RuleDifference[] = [];
  const notChecked: string[] = [];
  const perRateOnly = (id: string) => id === "BR-VAT-01" && ours.filter((f) => f.ruleId === id && f.severity !== "info").every((f) => PER_RATE_IGIC_IPSI.test(f.message));
  for (const id of [...new Set([...Object.keys(official), ...Object.keys(mine)])].sort()) {
    if (rules.own(id)) continue;
    if (!rules.known(id)) {
      if (level(official[id]) !== "pass") notChecked.push(id);
      continue;
    }
    const a = level(official[id]);
    const b = level(mine[id]);
    if (a === b) continue;
    const d: RuleDifference = { rule: id, kind: a === "pass" ? "extra" : b === "pass" ? "missing" : "level", official: a, ours: b };
    (rules.deliberate.has(id) || (d.kind === "extra" && perRateOnly(id)) ? deliberate : real).push(d);
  }
  return { real, deliberate, notChecked };
}

/**
 * The overall verdict exactly as each side reports it: any official fatal against any error of ours, nothing set
 * aside (our own checks, the deliberate differences and official rules we don't check all count). `causes` are the
 * rules that fail on one side only, which is what a reader of both reports would see differ.
 */
export function rawVerdictDiffers(official: Verdicts, ours: readonly FindingLike[]): { official: boolean; ours: boolean; causes: string[] } | undefined {
  const mine = flagsOf(ours);
  const offFails = Object.values(official).some((f) => f === "error");
  const ourFails = Object.values(mine).some((f) => f === "error");
  if (offFails === ourFails) return undefined;
  const causes = offFails
    ? Object.keys(official).filter((id) => official[id] === "error" && mine[id] !== "error")
    : Object.keys(mine).filter((id) => mine[id] === "error" && official[id] !== "error");
  return { official: offFails, ours: ourFails, causes: causes.sort() };
}

/**
 * The overall verdict on what the rule set checks: any official fatal of a known rule against any error of ours,
 * our own checks and the deliberate differences aside.
 */
export function verdictDiffers(official: Verdicts, ours: readonly FindingLike[], rules: CompareRules): { official: boolean; ours: boolean } | undefined {
  const { deliberate } = ruleDifferences(official, ours, rules);
  const skip = new Set(deliberate.map((d) => d.rule));
  const offFails = Object.entries(official).some(([id, f]) => f === "error" && rules.known(id) && !rules.own(id) && !rules.deliberate.has(id));
  const ourFails = Object.entries(flagsOf(ours)).some(([id, f]) => f === "error" && !rules.own(id) && !rules.deliberate.has(id) && !skip.has(id));
  return offFails === ourFails ? undefined : { official: offFails, ours: ourFails };
}
