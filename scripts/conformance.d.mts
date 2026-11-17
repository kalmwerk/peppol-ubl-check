// Types for conformance.mjs, so TypeScript callers (the tests, the InvoiceVerify site) can import it.
export interface OfficialSource {
  name: string;
  version: string;
  repo: string;
  archive: string;
  /** The folder of the official unit tests the comparison runs */
  tests: string;
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
export function totals(c: Conformance): { cases: number; compared: number; different: number; uncovered: number };
export function summaryMarkdown(c: Conformance): string;
export function detailsMarkdown(c: Conformance): string;
export function withReadmeBlocks(readme: string, c: Conformance): string;
