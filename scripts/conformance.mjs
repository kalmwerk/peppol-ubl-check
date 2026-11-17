// The dated conformance statement. `npm run compare-official` writes its result to conformance.json
// and the two statements below into README.md, so the numbers people read are the ones the last run
// produced; test/conformance.test.ts and `npm run compare-official -- --check` (CI) fail when either
// no longer belongs to the engine. Pure Node (no dependencies), so the website's tests use it too.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const CONFORMANCE_FILE = "conformance.json";
export const COMMAND = "npm run compare-official";
export const REPO_URL = "https://github.com/kalmwerk/peppol-ubl-check";

/** The files whose contents decide the result: the engine copy and the comparison script. */
export function fingerprintFiles(root) {
  const engine = readdirSync(resolve(root, "src/engine"))
    .filter((f) => f.endsWith(".ts"))
    .sort()
    .map((f) => `src/engine/${f}`);
  return [...engine, "scripts/compare-official-tests.mjs"];
}

/** SHA-256 over those files (path and contents), so any rule or mapping change shows. */
export function fingerprint(root) {
  const hash = createHash("sha256");
  for (const f of fingerprintFiles(root)) hash.update(`${f}\0`).update(readFileSync(resolve(root, f))).update("\0");
  return hash.digest("hex");
}

export function readConformance(root) {
  return JSON.parse(readFileSync(resolve(root, CONFORMANCE_FILE), "utf8"));
}

export const conformanceJson = (c) => `${JSON.stringify(c, null, 2)}\n`;

/** The result without its date, to tell whether a fresh run found the same thing. */
export function sameResult(a, b) {
  const { checkedOn: _a, ...restA } = a;
  const { checkedOn: _b, ...restB } = b;
  return JSON.stringify(restA) === JSON.stringify(restB);
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** 2026-11-17 → 17 November 2026 */
export function longDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
/** 1919 → 1,919 */
export const num = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const COUNTRIES = { AU: "Australia", DE: "Germany", DK: "Denmark", GR: "Greece", IT: "Italy", NL: "the Netherlands", NO: "Norway", SE: "Sweden" };
/** Countries whose national rules are among the uncovered ones, in alphabetical order. */
export function nationalCountries(c) {
  const codes = new Set(c.uncovered.national.map((id) => /^([A-Z]{2})-/.exec(id)?.[1]).filter(Boolean));
  return [...codes].map((code) => COUNTRIES[code] ?? code).sort();
}

export function totals(c) {
  const uncovered = c.uncovered.en16931.length + c.uncovered.peppol.length + c.uncovered.national.length;
  return { cases: c.cases.cen + c.cases.peppol, compared: c.compared, different: c.differences.length, uncovered };
}

const link = (label, url) => `[${label}](${url})`;
const sourceLinks = (c) => `${link(`${c.sources.cen.name} ${c.sources.cen.version}`, c.sources.cen.tests)} and the ${link(`${c.sources.peppol.name} ${c.sources.peppol.version}`, c.sources.peppol.tests)}`;

/** The one-paragraph statement at the top of the README. */
export function summaryMarkdown(c) {
  const t = totals(c);
  const verdict =
    t.different === 0
      ? `same verdict as the official EN 16931 and Peppol Schematron for every rule this tool checks, on all ${num(t.cases)} official unit-test cases of the ${sourceLinks(c)}: ${num(t.compared)} verdicts compared, 0 different.`
      : `on the ${num(t.cases)} official unit-test cases of the ${sourceLinks(c)}, the official verdict on ${num(t.compared - t.different)} of the ${num(t.compared)} verdicts compared for the rules this tool checks; ${num(t.different)} differ, listed in [\`${CONFORMANCE_FILE}\`](${CONFORMANCE_FILE}).`;
  return [
    `**Conformance, checked ${longDate(c.checkedOn)}:** ${verdict}`,
    `Not covered: ${num(t.uncovered)} rules those tests exercise (${num(c.uncovered.en16931.length)} EN 16931, ${num(c.uncovered.peppol.length)} Peppol, ${num(c.uncovered.national.length)} national), listed in [\`${CONFORMANCE_FILE}\`](${CONFORMANCE_FILE}).`,
    `Reproduce it with \`${COMMAND}\`; CI reruns it on every push and pull request.`,
  ].join(" ");
}

/** The paragraph in "Compared with the official rules". */
export function detailsMarkdown(c) {
  const t = totals(c);
  const countries = nationalCountries(c);
  return [
    `\`${COMMAND}\` downloads the official unit tests of the ${sourceLinks(c)} (${num(t.cases)} test cases in UBL and CII: ${num(c.cases.cen)} from CEN, ${num(c.cases.peppol)} from Peppol; the Peppol files may not be redistributed, so they aren't in this repository), compares every expected verdict of a rule this tool checks, and writes the result to [\`${CONFORMANCE_FILE}\`](${CONFORMANCE_FILE}) and the statement at the top of this README.`,
    `Last run, ${longDate(c.checkedOn)}: ${num(t.compared)} verdicts compared, ${num(t.different)} different.`,
    `${num(t.uncovered)} rules those tests exercise aren't checked here: ${num(c.uncovered.en16931.length)} EN 16931 rules (mostly VAT details of allowances and charges and the VAT amount per category), ${num(c.uncovered.peppol.length)} Peppol BIS rules and ${num(c.uncovered.national.length)} national rules (${countries.join(", ")} and Peppol's identifier formats); \`${CONFORMANCE_FILE}\` lists every one, and \`--list-uncovered\` prints them.`,
    `\`${COMMAND} -- --check\` (run in CI) fails when the committed result no longer matches a fresh run or the engine.`,
  ].join(" ");
}

const BLOCKS = { summary: summaryMarkdown, details: detailsMarkdown };

/** README.md with both statement blocks rewritten from the result. */
export function withReadmeBlocks(readme, c) {
  let out = readme;
  for (const [name, render] of Object.entries(BLOCKS)) {
    const start = `<!-- conformance:${name}:start -->`;
    const end = `<!-- conformance:${name}:end -->`;
    const i = out.indexOf(start);
    const j = out.indexOf(end);
    if (i < 0 || j < i) throw new Error(`README.md has no ${start} … ${end} block`);
    out = `${out.slice(0, i + start.length)}\n${render(c)}\n${out.slice(j)}`;
  }
  return out;
}
