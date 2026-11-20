// Keeps action.yml, the README, the changelog, the examples and the compiled
// bundles in step with the source.
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkFiles, ruleCounts } from "../src/check";
import { summaryMarkdown } from "../src/report";
import { REPO, SITE_URL, VALIDATOR_URL, VERSION } from "../src/version";
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
  // The runner refuses the whole file over one bad value ("Mapping values are not allowed in this
  // context"), which would break every workflow on @v1, so check what YAML allows in unquoted values.
  it("is YAML the Actions runner can load: unquoted values hold no ': ' or ' #', quoted ones are closed", () => {
    for (const [i, line] of actionYml.split("\n").entries()) {
      const m = line.match(/^ *[\w-]+: (.+)$/);
      if (!m) continue;
      const value = m[1]!;
      const where = `action.yml line ${i + 1}`;
      if (value.startsWith('"')) expect(value, where).toMatch(/^"(?:[^"\\]|\\.)*"$/);
      else if (value.startsWith("'")) expect(value, where).toMatch(/^'(?:[^']|'')*'$/);
      else {
        expect(value, where).not.toMatch(/: |:$| #/);
        expect(value, where).not.toMatch(/^[-?:,[\]{}#&*!|>%@`]/);
      }
    }
  });

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

describe("package.json", () => {
  it("names the real rule count in its description", () => {
    expect(JSON.parse(read("package.json")).description).toContain(`: ${ruleCounts().total} `);
  });
});

describe("README", () => {
  it("documents every input and output", () => {
    for (const n of names("inputs")) expect(readme, n).toContain(`| \`${n}\` |`);
    for (const n of names("outputs")) expect(readme, n).toContain(`| \`${n}\` |`);
  });

  it("states the rule count and what isn't covered", () => {
    const c = ruleCounts();
    expect(readme).toContain(`**${c.total} rules:** ${c.EN16931} EN 16931 business rules, ${c.syntax} CEN syntax rules (UBL-SR, UBL-CR, CII-SR, CII-DT), ${c.Peppol} Peppol BIS Billing 3.0 rules, ${c.XRechnung} XRechnung rules, ${c.NLCIUS} Dutch SI-UBL 2.0 (NLCIUS) rules and ${c.InvoiceVerify} extra checks`);
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

// What GitHub needs to list the Action on Marketplace, and what makes people find and trust it there
// (docs.github.com: "Publishing actions in GitHub Marketplace", "Metadata syntax", checked 17 Nov 2026).
describe("GitHub Marketplace listing", () => {
  it("has a single action metadata file, at the repository root", () => {
    const skip = /(^|\/)(node_modules|coverage|\.git)(\/|$)/;
    const files = (readdirSync(root, { recursive: true }) as string[]).map((f) => f.split("\\").join("/"));
    expect(files.filter((f) => !skip.test(f) && /(^|\/)action\.ya?ml$/.test(f))).toEqual(["action.yml"]);
  });

  it("has a description within Marketplace's 125 characters, with the words people search for", () => {
    const description = actionYml.match(/^description: (.+)$/m)![1]!;
    expect(description.length).toBeLessThanOrEqual(125);
    for (const term of ["Peppol", "UBL", "EN 16931", "EN16931", "e-invoice"]) expect(description, term).toContain(term);
  });

  it("uses a badge colour and icon GitHub supports", () => {
    const [, icon, color] = actionYml.match(/^branding:\n {2}icon: ([\w-]+)\n {2}color: ([\w-]+)$/m)!;
    expect(["white", "black", "yellow", "blue", "green", "orange", "red", "purple", "gray-dark"]).toContain(color);
    // Feather icons, minus the brand icons and these, which GitHub leaves out
    const omitted = ["coffee", "columns", "divide-circle", "divide-square", "divide", "frown", "hexagon", "key", "meh", "mouse-pointer", "smile", "tool", "x-octagon"];
    expect(omitted).not.toContain(icon);
    expect(icon).toBe("check-circle");
  });

  it("leads the README with the copy-paste workflow, then the conformance statement", () => {
    const sections = [...readme.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(sections.slice(0, 2)).toEqual(["Quick start", "Conformance"]);
    const quickStart = readme.split("\n## Quick start\n")[1]!.split("\n## ")[0]!;
    const workflow = quickStart.split("```yaml\n")[1]!.split("\n```")[0]!;
    const example = read("examples/peppol-ubl-check.yml").split("\n").filter((l) => !l.startsWith("#")).join("\n");
    expect(workflow + "\n").toBe(example);
    const conformance = readme.split("\n## Conformance\n")[1]!.split("\n## ")[0]!;
    expect(conformance.trimStart().startsWith("<!-- conformance:summary:start -->\n**Conformance, checked ")).toBe(true);
  });

  it("says the website it links to is Kalmwerk's own before the first link to it, and links its checker", () => {
    const disclosure = readme.indexOf("**Disclosure:**");
    expect(disclosure).toBeGreaterThan(-1);
    expect(disclosure).toBeLessThan(readme.indexOf(SITE_URL));
    expect(disclosure).toBeLessThan(readme.indexOf("\n## What you get\n"));
    const paragraph = readme.slice(disclosure).split("\n\n")[0]!;
    expect(paragraph).toContain("Kalmwerk");
    expect(paragraph).toContain(`](${VALIDATOR_URL})`);
    expect(paragraph).toContain("never contacts the site");
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
