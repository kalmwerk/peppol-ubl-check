// End to end: runs the compiled dist/cli.js in a fresh `node` process.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/cli";
import { VERSION } from "../src/version";
import { FIXTURES, tempRepo } from "./helpers";

const CLI = resolve(__dirname, "../dist/cli.js");
const cli = (args: string[], cwd = FIXTURES) => {
  const p = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8", env: { PATH: process.env["PATH"] ?? "" } });
  return { code: p.status, stdout: p.stdout, stderr: p.stderr };
};

describe("the command-line tool (dist/cli.js)", () => {
  it("exits 0 for valid invoices and 1 for invalid ones", () => {
    const ok = cli(["valid"]);
    expect(ok.code).toBe(0);
    expect(ok.stdout.trim().split("\n").pop()).toBe("3 invoices checked, no errors (0 errors, 0 warnings).");
    const bad = cli(["invalid/*.xml"]);
    expect(bad.code).toBe(1);
    expect(bad.stdout).toContain("FAIL invalid/invalid-vat-calculation.xml");
    expect(bad.stdout).toContain("Fix: Calculate VAT per category");
    expect(bad.stdout).not.toContain("\x1b[");
  });

  it("prints only JSON with --json, and writes it with --json-file", () => {
    const out = tempRepo({});
    const r = cli(["--json", "--json-file", join(out, "r.json"), "invalid/be-endpoint-errors.xml"]);
    expect(r.code).toBe(1);
    const json = JSON.parse(r.stdout);
    expect(json.files[0].findings.map((f: { ruleId: string }) => f.ruleId)).toEqual(["PEPPOL-COMMON-R043", "BR-63"]);
    expect(JSON.parse(readFileSync(join(out, "r.json"), "utf8"))).toEqual(json);
  });

  it("honours --fail-on and --profile", () => {
    expect(cli(["warnings"]).code).toBe(0);
    expect(cli(["--fail-on", "warning", "warnings"]).code).toBe(1);
    expect(cli(["--fail-on=never", "invalid"]).code).toBe(0);
    expect(cli(["-p", "en16931", "--json", "valid/peppol-bis3-valid-be.xml"]).stdout).toContain('"profileApplied": "en16931"');
  });

  it("exits 2 on usage errors and when no invoices are found", () => {
    expect(cli(["--profile", "ubl"]).stderr).toContain("--profile must be one of peppol, auto, en16931, xrechnung, nlcius");
    expect(cli(["--profile", "ubl"]).code).toBe(2);
    expect(cli(["--wat"]).code).toBe(2);
    const none = cli(["other"]);
    expect(none.code).toBe(2);
    expect(none.stderr).toContain("no invoices found (1 matching files, none of them an invoice)");
  });

  it("prints its version and help", () => {
    expect(cli(["--version"]).stdout).toBe(`${VERSION}\n`);
    const help = cli(["--help"]).stdout;
    expect(help).toContain("Usage:");
    expect(help).toContain("Exit codes: 0");
    expect(help).toContain("partial version of the official Schematron");
  });
});

describe("argument parsing", () => {
  it("reads flags with values, repeated ignores and patterns after --", () => {
    const p = parseArgs(["--ignore", "a/**", "--ignore=b/**", "-q", "x.xml", "--", "--odd.xml"], true);
    expect(p).toMatchObject({ ignore: ["a/**", "b/**"], quiet: true, patterns: ["x.xml", "--odd.xml"], color: true });
    expect(parseArgs(["--no-color"], true).color).toBe(false);
    expect(() => parseArgs(["--json-file"], false)).toThrow(/needs a value/);
  });
});
