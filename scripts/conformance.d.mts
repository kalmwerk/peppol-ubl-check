// Types for conformance.mjs, so TypeScript callers (the tests, the InvoiceVerify site) can import it.
export interface OfficialSource {
  name: string;
  version: string;
  repo: string;
  archive: string;
  /** The folder of the official unit tests the comparison runs */
  tests: string;
}
export interface RuleSetCount {
  /** Distinct official rule IDs in the family */
  official: number;
  /** How many of them the engine checks */
  checked: number;
}
export interface Conformance {
  /** Day of the run that wrote this result (UTC, YYYY-MM-DD) */
  checkedOn: string;
  command: string;
  sources: { cen: OfficialSource; peppol: OfficialSource };
  /** Official unit-test cases run, per source */
  cases: { cen: number; peppol: number };
  /** Expected verdicts of rules this tool checks, compared one by one */
  compared: number;
  /** Every verdict that differs: "<set> <file> #<test> <rule>: official <x>, engine <y>" */
  differences: string[];
  /** Official rule IDs the tests exercise that this tool doesn't check, by family */
  uncovered: { en16931: string[]; peppol: string[]; national: string[] };
  /**
   * Every rule of the official Schematron files (CEN UBL + CII, Peppol UBL + CII), tested or not, by
   * family: how many there are and how many the engine checks; for the business and Peppol core
   * rules also the ones it doesn't, split into always-true assertions and real gaps.
   */
  ruleSets: {
    business: RuleSetCount & { alwaysTrue: string[]; notChecked: string[] };
    peppol: RuleSetCount & { alwaysTrue: string[]; notChecked: string[] };
    /**
     * `fatal`: the syntax rules that block an invoice (flag="fatal"), the rest being warning-level notes;
     * `fatalChecked`: how many of those the engine checks; `fatalNotChecked`: the blocking ones it doesn't
     */
    syntax: RuleSetCount & { fatal: number; fatalChecked: number; fatalNotChecked: string[] };
    /**
     * `countries`: ID prefixes (ISO country codes) of the national rules not checked; `notChecked`:
     * every national rule not checked, tested or not, including Peppol's identifier formats
     */
    national: RuleSetCount & { countries: string[]; notChecked: string[] };
  };
  /** fingerprint() of the engine and comparison script the result belongs to */
  fingerprint: string;
}
export const CONFORMANCE_FILE: string;
export const COMMAND: string;
export const REPO_URL: string;
export function fingerprintFiles(root: string): string[];
export function fingerprint(root: string): string;
export function readConformance(root: string): Conformance;
export function conformanceJson(c: Conformance): string;
export function sameResult(a: Conformance, b: Conformance): boolean;
export function longDate(iso: string): string;
export function num(n: number): string;
export function nationalCountries(c: Conformance): string[];
/** Blocking CEN syntax rules no invoice reaches: an earlier rule of the same pattern takes every node they name */
export const UNREACHED_SYNTAX_RULES: readonly string[];
/** "Every blocking CEN syntax-binding rule …" or the blocking ones that aren't checked, one sentence */
export function syntaxCoverage(c: Conformance): string;
/** What the uncovered national rules are about: "Denmark, Germany … and Peppol's identifier formats" */
export function nationalScope(c: Conformance): string;
/** True when every EN 16931 and Peppol BIS core rule the official tests exercise is checked */
export function coreComplete(c: Conformance): boolean;
/** The sentence on how much of the official rule sets in full the engine checks */
export function ruleSetsMarkdown(c: Conformance): string;
export function totals(c: Conformance): { cases: number; compared: number; different: number; uncovered: number };
export function summaryMarkdown(c: Conformance): string;
export function detailsMarkdown(c: Conformance): string;
export function withReadmeBlocks(readme: string, c: Conformance): string;
