import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkFile, checkFiles, reachesThreshold, ruleCounts, type CheckOptions } from "../src/check";
import { FIXTURES, tempRepo } from "./helpers";

const opts: CheckOptions = { cwd: FIXTURES, profile: "peppol", failOn: "error", nonInvoice: "skip" };
const ids = (path: string, o: Partial<CheckOptions> = {}) => checkFile(path, { ...opts, ...o }).findings.map((f) => f.ruleId);

describe("the rule engine", () => {
  it("has 214 rules: 103 EN 16931, 37 Peppol, 32 XRechnung, 30 NLCIUS, 12 extra checks", () => {
    expect(ruleCounts()).toEqual({ total: 214, EN16931: 103, Peppol: 37, XRechnung: 32, NLCIUS: 30, InvoiceVerify: 12 });
  });
});

describe("Dutch SI-UBL 2.0 test invoices", () => {
  it("passes the valid SI-UBL 2.0 invoice with profile auto and nlcius", () => {
    for (const profile of ["auto", "nlcius"] as const) {
      const r = checkFile("nlcius/si-ubl-valid.xml", { ...opts, profile });
      expect(r.status, profile).toBe("ok");
      expect(r.profileApplied, profile).toBe("nlcius");
      expect(r.findings, profile).toEqual([]);
    }
  });

  it("finds the Dutch NLCIUS errors", () => {
    expect(ids("nlcius/si-ubl-errors.xml", { profile: "auto" })).toEqual(
      expect.arrayContaining(["BR-NL-1", "BR-NL-2", "BR-NL-4", "BR-NL-12"]),
    );
  });

  it("reports the SI-UBL ID under the default peppol profile instead of checking less", () => {
    expect(checkFile("nlcius/si-ubl-valid.xml", opts).status).toBe("errors");
  });
});

describe("XRechnung test invoices", () => {
  it("passes the valid XRechnung in UBL and CII with profile auto and xrechnung", () => {
    for (const f of ["xrechnung/xrechnung-ubl-valid.xml", "xrechnung/xrechnung-cii-valid.xml"])
      for (const profile of ["auto", "xrechnung"] as const) {
        const r = checkFile(f, { ...opts, profile });
        expect(r.status, `${f} ${profile}`).toBe("ok");
        expect(r.findings, `${f} ${profile}`).toEqual([]);
      }
  });

  it("finds the XRechnung errors in UBL and CII", () => {
    expect(ids("xrechnung/xrechnung-ubl-errors.xml", { profile: "auto" })).toEqual(["BR-DE-15", "BR-DE-6", "BR-DE-18"]);
    expect(ids("xrechnung/xrechnung-cii-errors.xml", { profile: "auto" })).toEqual(
      expect.arrayContaining(["IV-DE-01", "BR-DE-7", "BR-DE-23-a", "BR-DE-19"]),
    );
  });

  it("reports the XRechnung ID under the default peppol profile instead of checking less", () => {
    expect(checkFile("xrechnung/xrechnung-ubl-valid.xml", opts).status).toBe("errors");
  });
});

describe("checkFile on the test invoices", () => {
  it("passes the valid invoices and the credit note", () => {
    for (const f of ["valid/peppol-bis3-valid-be.xml", "valid/peppol-credit-note.xml", "valid/reverse-charge-de-nl.xml"]) {
      const r = checkFile(f, opts);
      expect(r.status, f).toBe("ok");
      expect(r.findings, f).toEqual([]);
      expect(r.formatId).toBe("peppol-bis-3");
      expect(r.rulesChecked).toBeGreaterThan(100);
    }
    expect(checkFile("valid/peppol-credit-note.xml", opts).document).toBe("Credit note");
  });

  it("finds the VAT calculation errors, each with a fix and its rule page", () => {
    const r = checkFile("invalid/invalid-vat-calculation.xml", opts);
    expect(r.status).toBe("errors");
    expect(r.findings.map((f) => f.ruleId)).toEqual(["BR-CO-14", "BR-S-08", "BR-CO-17", "BR-CO-10", "PEPPOL-EN16931-R120"]);
    const vat = r.findings.find((f) => f.ruleId === "BR-CO-17")!;
    expect(vat).toMatchObject({ line: 91, expected: "411.60", actual: "392.00", url: "https://peppol-invoice-compass.lovable.app/rules/br-co-17" });
    expect(vat.fix).toMatch(/round once/);
    expect(r.invoiceNumber).toBe("2026/0918");
  });

  it("finds missing mandatory fields, Belgian endpoint errors and broken XML", () => {
    expect(ids("invalid/missing-mandatory-fields.xml")).toEqual(expect.arrayContaining(["BR-03", "BR-07", "PEPPOL-EN16931-R010", "BR-61", "BR-25"]));
    expect(ids("invalid/be-endpoint-errors.xml")).toEqual(["PEPPOL-COMMON-R043", "BR-63"]);
    const broken = checkFile("invalid/malformed.xml", opts);
    expect(broken.findings).toHaveLength(1);
    expect(broken.findings[0]).toMatchObject({ ruleId: "IV-SYN-01", severity: "error" });
    expect(broken.findings[0]!.line).toBeGreaterThan(1);
  });

  it("reports an Invoice in the wrong namespace instead of skipping it", () => {
    const r = checkFile("invalid/wrong-namespace.xml", opts);
    expect(r.status).toBe("errors");
    expect(r.findings[0]!.ruleId).toBe("IV-SYN-02");
  });

  it("skips XML that isn't an invoice, or fails it with non-invoice: fail", () => {
    const skipped = checkFile("other/pom.xml", opts);
    expect(skipped.status).toBe("skipped");
    expect(skipped.skipped).toMatch(/<project>/);
    expect(ids("other/pom.xml", { nonInvoice: "fail" })).toEqual(["IV-SYN-02"]);
  });

  it("only warns about a due date before the issue date", () => {
    const r = checkFile("warnings/due-date-before-issue-date.xml", opts);
    expect(r.status).toBe("warnings");
    expect(r.findings.map((f) => [f.ruleId, f.severity])).toEqual([["IV-DATE-01", "warning"]]);
  });

  it("applies Peppol rules to a plain UBL invoice by default, and only with auto when it says Peppol", async () => {
    const { readFileSync } = await import("node:fs");
    const xml = readFileSync(join(FIXTURES, "valid/peppol-bis3-valid-be.xml"), "utf8").replace(
      /<cbc:CustomizationID>[^<]+<\/cbc:CustomizationID>/,
      "<cbc:CustomizationID>urn:cen.eu:en16931:2017</cbc:CustomizationID>",
    );
    const cwd = tempRepo({ "plain.xml": xml });
    expect(checkFile("plain.xml", { ...opts, cwd }).findings.map((f) => f.ruleId)).toEqual(["PEPPOL-EN16931-R004"]);
    const auto = checkFile("plain.xml", { ...opts, cwd, profile: "auto" });
    expect(auto.status).toBe("ok");
    expect(auto.profileApplied).toBe("en16931");
  });

  it("refuses files over 5 MB without reading them into the engine", () => {
    const cwd = tempRepo({});
    writeFileSync(join(cwd, "big.xml"), Buffer.alloc(5 * 1024 * 1024 + 1, 32));
    const r = checkFile("big.xml", { ...opts, cwd });
    expect(r.status).toBe("errors");
    expect(r.findings[0]!.message).toMatch(/up to 5 MB/);
  });
});

describe("checkFiles", () => {
  const all = [
    "invalid/invalid-vat-calculation.xml",
    "other/pom.xml",
    "valid/peppol-bis3-valid-be.xml",
    "warnings/due-date-before-issue-date.xml",
  ];

  it("adds up the totals and fails on errors", () => {
    const r = checkFiles(all, opts);
    expect(r.totals).toEqual({ matched: 4, checked: 3, ok: 1, withWarnings: 1, withErrors: 1, skipped: 1, errors: 5, warnings: 1, info: 0 });
    expect(r.result).toBe("failed");
    expect(r).toMatchObject({ tool: "peppol-ubl-check", rulesAvailable: 214, profile: "peppol", failOn: "error" });
  });

  it("passes warnings unless fail-on is warning, and never fails with never", () => {
    const warn = ["warnings/due-date-before-issue-date.xml"];
    expect(checkFiles(warn, opts).result).toBe("passed");
    expect(checkFiles(warn, { ...opts, failOn: "warning" }).result).toBe("failed");
    expect(checkFiles(all, { ...opts, failOn: "never" }).result).toBe("passed");
    expect(reachesThreshold({ error: 0, warning: 0 }, "warning")).toBe(false);
  });
});
