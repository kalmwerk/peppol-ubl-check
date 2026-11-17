// Runs the rule engine over the official unit tests and compares verdicts, rule by rule:
//   npm run compare-official [-- --check] [-- --list-uncovered]
// Downloads the CEN EN 16931 validation artefacts and the Peppol BIS Billing 3.0 rules (pinned
// below) into a temporary folder; the Peppol test files may not be redistributed, so they are
// fetched here instead of kept in the repository. Every <success>, <error> and <warning> of a
// rule the engine checks is compared with the engine's worst finding for that rule; rules it
// doesn't check are counted (and listed with --list-uncovered).
// Writes the result to conformance.json and the dated statements into README.md
// (scripts/conformance.mjs). With --check it writes nothing and fails when the committed result
// isn't what this run found (CI runs it that way). Exits 1 when a verdict differs.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildSync } from "esbuild";
import {
  COMMAND,
  CONFORMANCE_FILE,
  conformanceJson,
  fingerprint,
  readConformance,
  sameResult,
  summaryMarkdown,
  withReadmeBlocks,
} from "./conformance.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const SOURCES = {
  cen: {
    name: "CEN EN 16931 validation artefacts",
    version: "1.3.17",
    repo: "https://github.com/ConnectingEurope/eInvoicing-EN16931",
    archive: "https://github.com/ConnectingEurope/eInvoicing-EN16931/archive/refs/tags/validation-1.3.17.tar.gz",
    tests: "https://github.com/ConnectingEurope/eInvoicing-EN16931/tree/validation-1.3.17/test",
    folder: "eInvoicing-EN16931-validation-1.3.17",
  },
  peppol: {
    name: "Peppol BIS Billing 3.0 rules",
    version: "3.0.22",
    repo: "https://github.com/OpenPEPPOL/peppol-bis-invoice-3",
    archive: "https://github.com/OpenPEPPOL/peppol-bis-invoice-3/archive/refs/tags/3.0.22.tar.gz",
    tests: "https://github.com/OpenPEPPOL/peppol-bis-invoice-3/tree/3.0.22/rules",
    folder: "peppol-bis-invoice-3-3.0.22",
  },
};
const label = (s) => `${s.name} ${s.version}`;

/**
 * The family of an official rule ID this tool doesn't check: EN 16931 (the CEN business,
 * datatype and syntax rules), the Peppol BIS core rules, or national rules (country rules and
 * Peppol's identifier formats).
 */
export function ruleFamily(id) {
  if (/^(BR-|UBL-|CII-)/.test(id)) return "en16931";
  if (id.startsWith("PEPPOL-EN16931-")) return "peppol";
  return "national";
}

/**
 * The engine ID that answers for an official rule ID: the per-category -01 and -08 rules of the
 * non-standard VAT categories are BR-VAT-01 and BR-VAT-08, the 28 decimal rules BR-DEC.
 */
export function engineRuleId(id) {
  if (/^BR-(Z|E|AE|IC|G|O|IG|IP)-08$/.test(id)) return "BR-VAT-08";
  if (/^BR-(Z|E|AE|IC|G|O|IG|IP)-01$/.test(id)) return "BR-VAT-01";
  if (/^BR-DEC-\d+$/.test(id)) return "BR-DEC";
  return id;
}

const work = resolve(tmpdir(), "peppol-ubl-check-official-tests");

async function fetchTree({ archive, folder }) {
  const dir = resolve(work, folder);
  if (existsSync(dir)) return dir;
  mkdirSync(work, { recursive: true });
  const res = await fetch(archive);
  if (!res.ok) throw new Error(`${archive}: HTTP ${res.status}`);
  const file = resolve(work, `${folder}.tar.gz`);
  writeFileSync(file, new Uint8Array(await res.arrayBuffer()));
  execFileSync("tar", ["-xzf", file, "-C", work]);
  return dir;
}

/** The engine as one ES module, so this script runs on plain Node without a TypeScript loader. */
async function loadEngine() {
  const out = buildSync({
    absWorkingDir: root,
    stdin: {
      contents:
        'export { validateInvoiceXml } from "./src/engine/validate";\nexport { RULE_INDEX } from "./src/engine/rules-catalog";\n',
      resolveDir: root,
      loader: "ts",
    },
    bundle: true,
    platform: "node",
    format: "esm",
    write: false,
    logLevel: "silent",
  });
  mkdirSync(work, { recursive: true });
  const file = resolve(work, "engine.mjs");
  writeFileSync(file, out.outputFiles[0].text);
  return import(pathToFileURL(file).href);
}

async function main() {
  const [{ validateInvoiceXml, RULE_INDEX }, cen, peppol] = await Promise.all([
    loadEngine(),
    fetchTree(SOURCES.cen),
    fetchTree(SOURCES.peppol),
  ]);
  const sets = [
    { dir: resolve(cen, "test/Invoice-unit-UBL"), label: "CEN UBL invoice", profile: "en16931", source: "cen" },
    { dir: resolve(cen, "test/CreditNote-unit-UBL"), label: "CEN UBL credit note", profile: "en16931", source: "cen" },
    { dir: resolve(cen, "test/cii"), label: "CEN CII", profile: "en16931", source: "cen" },
    ...readdirSync(resolve(peppol, "rules"))
      .filter((d) => d.startsWith("unit-") && d !== "unit-SBDH")
      .sort()
      .map((d) => ({ dir: resolve(peppol, "rules", d), label: `Peppol ${d}`, profile: "peppol", source: "peppol" })),
  ];

  const cases = { cen: 0, peppol: 0 };
  let compared = 0;
  const differences = [];
  const uncovered = new Map();
  for (const set of sets) {
    for (const file of readdirSync(set.dir).filter((f) => /\.xml?$/.test(f)).sort()) {
      const text = readFileSync(resolve(set.dir, file), "utf8");
      [...text.matchAll(/<test>([\s\S]*?)<\/test>/g)].forEach((m, i) => {
        const body = m[1];
        const doc = /(<((?:\w+:)?(?:Invoice|CreditNote|CrossIndustryInvoice))\b[\s\S]*<\/\2>)/.exec(body);
        if (!doc) return;
        cases[set.source]++;
        const head = body.slice(0, doc.index);
        const worst = new Map();
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${doc[1]}`;
        for (const f of validateInvoiceXml(xml, set.profile).findings) {
          if (f.severity === "info" || worst.get(f.ruleId) === "error") continue;
          worst.set(f.ruleId, f.severity);
        }
        for (const tag of ["success", "error", "warning", "fatal"]) {
          for (const x of head.matchAll(new RegExp(`<${tag}>\\s*([^<]+?)\\s*</${tag}>`, "g"))) {
            const id = x[1];
            const ours = engineRuleId(id);
            if (!RULE_INDEX[ours]) {
              uncovered.set(id, (uncovered.get(id) ?? 0) + 1);
              continue;
            }
            compared++;
            const want = tag === "fatal" ? "error" : tag;
            const got = worst.get(ours) ?? "success";
            if (got !== want) differences.push(`${set.label} ${file} #${i}  ${id}: official ${want}, engine ${got}`);
          }
        }
      });
    }
  }

  console.log(
    `${cases.cen + cases.peppol} official test cases (${label(SOURCES.cen)}; ${label(SOURCES.peppol)}): ` +
      `${compared} verdicts of rules the engine checks compared, ${differences.length} different; ` +
      `${uncovered.size} rules with official tests are not checked.`,
  );
  for (const d of differences) console.log(d);
  const ids = [...uncovered.keys()].sort();
  if (process.argv.includes("--list-uncovered")) console.log(ids.join("\n"));

  const source = ({ folder: _folder, ...s }) => s;
  const result = {
    checkedOn: new Date().toISOString().slice(0, 10),
    command: COMMAND,
    sources: { cen: source(SOURCES.cen), peppol: source(SOURCES.peppol) },
    cases,
    compared,
    differences,
    uncovered: {
      en16931: ids.filter((id) => ruleFamily(id) === "en16931"),
      peppol: ids.filter((id) => ruleFamily(id) === "peppol"),
      national: ids.filter((id) => ruleFamily(id) === "national"),
    },
    fingerprint: fingerprint(root),
  };
  const readmePath = resolve(root, "README.md");
  const readme = readFileSync(readmePath, "utf8");
  if (process.argv.includes("--check")) {
    const committed = existsSync(resolve(root, CONFORMANCE_FILE)) ? readConformance(root) : null;
    const stale = !committed || !sameResult(committed, result);
    const readmeStale = committed && withReadmeBlocks(readme, committed) !== readme;
    if (stale) console.log(`::error::${CONFORMANCE_FILE} isn't what this run found. Run ${COMMAND} and commit the result.`);
    if (readmeStale) console.log(`::error::README.md's conformance statement isn't ${CONFORMANCE_FILE}'s. Run ${COMMAND}.`);
    if (!stale && !readmeStale) console.log(`${CONFORMANCE_FILE} (checked ${committed.checkedOn}) matches this run.`);
    process.exitCode = differences.length || stale || readmeStale ? 1 : 0;
    return;
  }
  writeFileSync(resolve(root, CONFORMANCE_FILE), conformanceJson(result));
  writeFileSync(readmePath, withReadmeBlocks(readme, result));
  console.log(`Wrote ${CONFORMANCE_FILE} and README.md:\n${summaryMarkdown(result)}`);
  process.exitCode = differences.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
