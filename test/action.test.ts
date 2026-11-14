// End to end: runs the compiled dist/index.js the way GitHub does, in a fresh
// `node` process with INPUT_* variables and the GITHUB_* environment files.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { VERSION } from "../src/version";
import { tempRepo } from "./helpers";

const DIST = resolve(__dirname, "../dist/index.js");

function runAction(inputs: Record<string, string>, files: Record<string, string>) {
  const workspace = tempRepo(files);
  const out = tempRepo({ "output.txt": "", "summary.md": "" });
  const env: Record<string, string> = {
    PATH: process.env["PATH"] ?? "",
    GITHUB_WORKSPACE: workspace,
    GITHUB_OUTPUT: join(out, "output.txt"),
    GITHUB_STEP_SUMMARY: join(out, "summary.md"),
  };
  for (const [k, v] of Object.entries(inputs)) env[`INPUT_${k.toUpperCase()}`] = v;
  const p = spawnSync(process.execPath, [DIST], { env, cwd: workspace, encoding: "utf8" });
  const outputs: Record<string, string> = {};
  for (const m of readFileSync(env["GITHUB_OUTPUT"]!, "utf8").matchAll(/^([\w-]+)<<(\S+)\n([\s\S]*?)\n\2$/gm)) outputs[m[1]!] = m[3]!;
  return { code: p.status, stdout: p.stdout, summary: readFileSync(env["GITHUB_STEP_SUMMARY"]!, "utf8"), outputs, workspace };
}

const repo = {
  "invoices/good.xml": "fixture:valid/peppol-bis3-valid-be.xml",
  "invoices/credit.xml": "fixture:valid/peppol-credit-note.xml",
  "invoices/bad-vat.xml": "fixture:invalid/invalid-vat-calculation.xml",
  "pom.xml": "fixture:other/pom.xml",
};

describe("the Action (dist/index.js)", () => {
  it("fails the job on errors, with a summary, annotations and outputs", () => {
    const r = runAction({}, repo);
    expect(r.code).toBe(1);
    expect(r.outputs).toMatchObject({ result: "failed", checked: "3", failed: "1", errors: "5", warnings: "0", skipped: "1", "json-file": "" });
    expect(r.summary).toContain("## ❌ Peppol UBL check: 1 of 3 invoices has errors");
    expect(r.summary).toContain("[BR-CO-17](https://peppol-invoice-compass.lovable.app/rules/br-co-17)");
    expect(r.stdout).toContain("::error title=BR-CO-17%3A VAT amount does not match rate,file=invoices/bad-vat.xml,line=91,col=21::");
    expect(r.stdout).toContain(`::group::Peppol UBL check ${VERSION}: 4 matching files (**/*.xml)`);
    expect(r.stdout).toMatch(/::error::1 of 3 invoices has errors\. The job summary lists each problem/);
  });

  it("passes valid invoices and writes the JSON report", () => {
    const r = runAction({ files: "invoices/good.xml\ninvoices/credit.xml", "json-file": "reports/peppol.json" }, repo);
    expect(r.code).toBe(0);
    expect(r.outputs["result"]).toBe("passed");
    expect(r.outputs["json-file"]).toBe(join(r.workspace, "reports/peppol.json"));
    const json = JSON.parse(readFileSync(r.outputs["json-file"]!, "utf8"));
    expect(json.totals).toMatchObject({ checked: 2, ok: 2, errors: 0 });
    expect(json.files.map((f: { path: string }) => f.path)).toEqual(["invoices/credit.xml", "invoices/good.xml"]);
  });

  it("only reports with fail-on: never, and leaves out ignored files", () => {
    const r = runAction({ "fail-on": "never", annotations: "false", ignore: "invoices/bad-*.xml" }, repo);
    expect(r.code).toBe(0);
    expect(r.outputs["checked"]).toBe("2");
    expect(r.stdout).not.toContain("::error title=");
    const all = runAction({ "fail-on": "never", annotations: "false" }, repo);
    expect(all.code).toBe(0);
    expect(all.outputs["result"]).toBe("passed");
    expect(all.outputs["errors"]).toBe("5");
  });

  it("fails when no invoice is found, unless told otherwise", () => {
    const none = runAction({ files: "invoices/*.ubl" }, repo);
    expect(none.code).toBe(1);
    expect(none.stdout).toContain('::error::No invoices found: nothing matches "invoices/*.ubl"');
    const onlyPom = runAction({ files: "pom.xml", "if-no-files-found": "warn" }, repo);
    expect(onlyPom.code).toBe(0);
    expect(onlyPom.stdout).toContain("::warning::No invoices found: 1 matching file isn't an invoice");
  });

  it("fails clearly on a wrong input value", () => {
    const r = runAction({ profile: "ubl" }, repo);
    expect(r.code).toBe(1);
    expect(r.stdout).toContain('::error::Input "profile" must be one of peppol, auto, en16931, xrechnung, nlcius, not "ubl".');
  });

  it("writes no summary when summary is false", () => {
    const r = runAction({ summary: "false", files: "invoices/good.xml" }, repo);
    expect(r.code).toBe(0);
    expect(r.summary).toBe("");
  });

  it("writes no JSON file unless json-file names one", () => {
    const r = runAction({ files: "invoices/good.xml" }, repo);
    expect(readdirSync(r.workspace).sort()).toEqual(["invoices", "pom.xml"]);
    expect(existsSync(join(r.workspace, "invoices/good.xml"))).toBe(true);
  });
});
