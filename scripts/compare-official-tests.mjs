// Runs the rule engine over the official unit tests and compares verdicts, rule by rule:
//   node scripts/compare-official-tests.mjs [--list-uncovered]
// Downloads the CEN EN 16931 validation artefacts and the Peppol BIS Billing 3.0 rules (pinned
// below) into a temporary folder; the Peppol test files may not be redistributed, so they are
// fetched here instead of kept in the repository. Every <success>, <error> and <warning> of a
// rule the engine checks is compared with the engine's worst finding for that rule; rules it
// doesn't check are counted (and listed with --list-uncovered). Exits 1 when a verdict differs.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildSync } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const SOURCES = {
  cen: {
    label: "CEN EN 16931 validation artefacts 1.3.17",
    archive: "https://github.com/ConnectingEurope/eInvoicing-EN16931/archive/refs/tags/validation-1.3.17.tar.gz",
    folder: "eInvoicing-EN16931-validation-1.3.17",
  },
  peppol: {
    label: "Peppol BIS Billing 3.0 rules 3.0.22",
    archive: "https://github.com/OpenPEPPOL/peppol-bis-invoice-3/archive/refs/tags/3.0.22.tar.gz",
    folder: "peppol-bis-invoice-3-3.0.22",
  },
};

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
    { dir: resolve(cen, "test/Invoice-unit-UBL"), label: "CEN UBL invoice", profile: "en16931" },
    { dir: resolve(cen, "test/CreditNote-unit-UBL"), label: "CEN UBL credit note", profile: "en16931" },
    { dir: resolve(cen, "test/cii"), label: "CEN CII", profile: "en16931" },
    ...readdirSync(resolve(peppol, "rules"))
      .filter((d) => d.startsWith("unit-") && d !== "unit-SBDH")
      .sort()
      .map((d) => ({ dir: resolve(peppol, "rules", d), label: `Peppol ${d}`, profile: "peppol" })),
  ];

  let cases = 0;
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
        cases++;
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
    `${cases} official test cases (${SOURCES.cen.label}; ${SOURCES.peppol.label}): ` +
      `${compared} verdicts of rules the engine checks compared, ${differences.length} different; ` +
      `${uncovered.size} rules with official tests are not checked.`,
  );
  for (const d of differences) console.log(d);
  if (process.argv.includes("--list-uncovered")) console.log([...uncovered.keys()].sort().join("\n"));
  process.exitCode = differences.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
