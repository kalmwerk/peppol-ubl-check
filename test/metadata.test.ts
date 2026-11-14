// Keeps action.yml, the README, the changelog, the examples and the compiled
// bundles in step with the source.
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkFiles, ruleCounts } from "../src/check";
import { summaryMarkdown } from "../src/report";
import { REPO, SITE_URL, VERSION } from "../src/version";
import { FIXTURES } from "./helpers";

const root = resolve(__dirname, "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const actionYml = read("action.yml");
const readme = read("README.md");

/** Names under `inputs:` / `outputs:` in action.yml (its fixed, simple layout). */
function names(section: "inputs" | "outputs"): string[] {
  const block = actionYml.split(`\n${section}:\n`)[1]!.split(/\n\S/)[0]!;
  return [...block.matchAll(/^ {2}([\w-]+):\s*$/gm)].map((m) => m[1]!);
}

describe("version", () => {
  it("is the same in package.json, src/version.ts and the newest changelog section", () => {
    expect(JSON.parse(read("package.json")).version).toBe(VERSION);
    expect(read("CHANGELOG.md").match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1]).toBe(VERSION);
  });
});

describe("action.yml", () => {
  it("reads exactly the inputs the Action uses, and sets exactly its outputs", () => {
    const source = read("src/action.ts");
    const used = [...source.matchAll(/get(?:Boolean|Choice)?Input\("([\w-]+)"/g)].map((m) => m[1]);
    expect(names("inputs").sort()).toEqual([...new Set(used)].sort());
    const set = [...source.matchAll(/setOutput\("([\w-]+)"/g)].map((m) => m[1]);
    expect(names("outputs").sort()).toEqual([...set].sort());
  });

  it("runs dist/index.js on Node 24 and has Marketplace branding", () => {
    expect(actionYml).toMatch(/^runs:\n {2}using: node24\n {2}main: dist\/index\.js$/m);
    expect(actionYml).toMatch(/^branding:\n {2}icon: [\w-]+\n {2}color: \w+$/m);
    const description = actionYml.match(/^description: (.+)$/m)![1]!;
    expect(description.length).toBeLessThanOrEqual(125);
    expect(description).toContain(`${ruleCounts().total} `);
  });
});

describe("README", () => {
  it("documents every input and output", () => {
    for (const n of names("inputs")) expect(readme, n).toContain(`| \`${n}\` |`);
    for (const n of names("outputs")) expect(readme, n).toContain(`| \`${n}\` |`);
  });

  it("states the rule count and what isn't covered", () => {
    const c = ruleCounts();
    expect(readme).toContain(`**${c.total} rules:** ${c.EN16931} EN 16931 business rules, ${c.Peppol} Peppol BIS Billing 3.0 rules, ${c.XRechnung} XRechnung rules, ${c.NLCIUS} Dutch SI-UBL 2.0 (NLCIUS) rules and ${c.InvoiceVerify} extra checks`);
    expect(readme).toContain("partial version of the official EN 16931, Peppol, XRechnung and SI-UBL 2.0 Schematron rule sets");
    expect(readme).toContain("no XSD schema validation");
    expect(readme).toContain("no PDF/A check");
    expect(readme).toContain(`${SITE_URL}/validate`);
  });

  it("and the examples use the published reference", () => {
    expect(readme).toContain(`uses: ${REPO}@v${VERSION.split(".")[0]}`);
    for (const f of ["peppol-ubl-check.yml", "json-report.yml"]) expect(read(`examples/${f}`), f).toContain(`uses: ${REPO}@v1`);
    expect(read("examples/downloaded-copy.yml")).toContain("uses: ./.github/actions/peppol-ubl-check");
  });
});

describe("dist/", () => {
  const bundles = readdirSync(resolve(root, "dist")).filter((f) => f.endsWith(".js"));

  it("has the Action and the CLI, the CLI runnable with a shebang", () => {
    expect(bundles.sort()).toEqual(["cli.js", "index.js"]);
    expect(read("dist/cli.js").startsWith("#!/usr/bin/env node\n")).toBe(true);
    expect(JSON.parse(read("package.json")).bin["peppol-ubl-check"]).toBe("dist/cli.js");
  });

  it("contains no network code: nothing in it can send an invoice anywhere", () => {
    for (const f of bundles) {
      const code = read(`dist/${f}`);
      expect(code, f).not.toMatch(/require\(["'](?:node:)?(?:https?|http2|net|tls|dgram|dns|child_process)["']\)/);
      expect(code, f).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon/);
    }
  });

  it("names its bundled packages without machine-specific paths", () => {
    for (const f of bundles) expect(read(`dist/${f}`), f).not.toMatch(/\.\.\/[\w./-]*node_modules|\/(?:home|Users|tmp)\//);
  });
});

describe("README examples", () => {
  const run = checkFiles(["invalid/invalid-vat-calculation.xml"], { cwd: FIXTURES, profile: "peppol", failOn: "error", nonInvoice: "skip" });

  it("show summary rows the Action really writes", () => {
    const example = readme.split("## Example")[1]!.split("\n## ")[0]!;
    const rows = example.split("\n").filter((l) => l.startsWith("| ❌ |"));
    expect(rows.length).toBe(3);
    const md = summaryMarkdown(run);
    for (const row of rows) expect(md, row).toContain(row);
    const total = run.files[0]!.findings.length;
    expect(example).toContain(`(and ${["no", "one", "two", "three"][total - rows.length]} more rows)`);
  });

  it("show a JSON finding exactly as the report has it", () => {
    const json = JSON.parse(readme.split("## JSON report")[1]!.split("```json\n")[1]!.split("\n```")[0]!);
    const shown = json.files[0].findings[0];
    expect(run.files[0]!.findings.find((f) => f.ruleId === shown.ruleId)).toEqual(shown);
    expect(json.version).toBe(VERSION);
    expect(json.rulesAvailable).toBe(ruleCounts().total);
    expect(json.files[0].rulesChecked).toBe(run.files[0]!.rulesChecked);
  });
});
