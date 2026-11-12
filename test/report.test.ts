import { describe, expect, it } from "vitest";
import { checkFiles, type CheckResult } from "../src/check";
import { annotations, cell, coverageNote, headline, summaryMarkdown, textReport } from "../src/report";
import { FIXTURES } from "./helpers";

const run = (files: string[]) => checkFiles(files, { cwd: FIXTURES, profile: "peppol", failOn: "error", nonInvoice: "skip" });
const mixed = run(["invalid/invalid-vat-calculation.xml", "other/pom.xml", "valid/peppol-bis3-valid-be.xml"]);

describe("job summary", () => {
  const md = summaryMarkdown(mixed);

  it("leads with the verdict and one row per invoice", () => {
    expect(md.startsWith("## ❌ Peppol UBL check: 1 of 2 invoices has errors\n")).toBe(true);
    expect(md).toContain("| `invalid/invalid-vat-calculation.xml` | Peppol BIS Billing 3.0 (UBL 2.1) | 5 | 0 | ❌ Errors |");
    expect(md).toContain("| `valid/peppol-bis3-valid-be.xml` | Peppol BIS Billing 3.0 (UBL 2.1) | 0 | 0 | ✅ OK |");
  });

  it("lists each finding with its rule link, line, problem and fix", () => {
    expect(md).toContain(
      "| ❌ | [BR-CO-17](https://peppol-invoice-compass.lovable.app/rules/br-co-17) | 91 | **VAT amount does not match rate.** 1960.00 × 21% = 411.60, but the VAT amount is 392.00. | Calculate VAT per category on the taxable total (not per line) and round once to 2 decimals. |",
    );
    expect(md).toContain("Invoice **2026/0918** · Peppol BIS Billing 3.0 (UBL 2.1) · 140 rules checked");
  });

  it("lists skipped files and says honestly what wasn't checked", () => {
    expect(md).toContain("1 file skipped: not an invoice");
    expect(md).toContain("`other/pom.xml`: Not an invoice: the root element is &lt;project&gt;");
    expect(md).toContain("153 rules (101 EN 16931, 28 Peppol BIS Billing 3.0, 13 XRechnung, 11 extra checks");
    expect(md).toMatch(/partial version of the official\s+Schematron/);
    expect(md).toContain("without XSD schema validation or PDF/A checks. Nothing was sent anywhere.");
    expect(md).toContain("[InvoiceVerify validator](https://peppol-invoice-compass.lovable.app/validate)");
  });

  it("says so when everything passes", () => {
    expect(summaryMarkdown(run(["valid/peppol-bis3-valid-be.xml", "valid/peppol-credit-note.xml"]))).toMatch(
      /^## ✅ Peppol UBL check: 2 invoices checked, no errors\n/,
    );
    expect(headline(run([]))).toBe("No invoices checked");
  });

  it("keeps table cells intact whatever the message says", () => {
    expect(cell("a | b\n<cbc:ID> & c")).toBe("a \\| b &lt;cbc:ID&gt; &amp; c");
  });

  it("caps findings per file and the overall size", () => {
    const capped = summaryMarkdown(mixed, { maxFindingsPerFile: 2 });
    expect(capped).toContain("…and 3 more in the JSON report");
    const tiny = summaryMarkdown(mixed, { maxChars: 600 });
    expect(tiny).toContain("Findings for 1 more file left out");
  });
});

describe("annotations", () => {
  it("puts each finding on its file and line, errors first, with the fix", () => {
    const r = run(["warnings/due-date-before-issue-date.xml", "invalid/be-endpoint-errors.xml"]);
    const a = annotations(r);
    expect(a.map((x) => x.level)).toEqual(["error", "error", "warning"]);
    expect(a[0]).toMatchObject({ file: "invalid/be-endpoint-errors.xml", line: 16, title: "PEPPOL-COMMON-R043: Invalid Belgian enterprise number (0208)" });
    expect(a[0]!.message).toContain("\nHow to fix: Write the 10-digit KBO/BCE number");
    expect(annotations(r, 1)).toHaveLength(1);
  });
});

describe("console report", () => {
  it("prints one line per file, the findings and the totals, without colours when asked", () => {
    const text = textReport(mixed, { color: false });
    expect(text).not.toContain("\x1b[");
    expect(text).toContain("FAIL invalid/invalid-vat-calculation.xml");
    expect(text).toContain("SKIP other/pom.xml");
    expect(text).toContain("PASS valid/peppol-bis3-valid-be.xml");
    expect(text).toContain("error   BR-CO-17 VAT amount does not match rate  invalid/invalid-vat-calculation.xml:91:21");
    expect(text.trim().split("\n").pop()).toBe("1 of 2 invoices has errors (5 errors, 0 warnings, 1 skipped).");
  });

  it("leaves the findings out with quiet, and colours with color", () => {
    const quiet = textReport(mixed, { quiet: true });
    expect(quiet).not.toContain("BR-CO-17");
    expect(textReport(mixed, { color: true })).toContain("\x1b[31mFAIL\x1b[0m");
  });
});

describe("coverage note", () => {
  it("adds up to the engine's rule count", () => {
    const n = coverageNote().match(/(\d+) EN 16931, (\d+) Peppol BIS Billing 3\.0, (\d+) XRechnung, (\d+) extra/)!;
    const total = Number(coverageNote().match(/InvoiceVerify's (\d+) rules/)![1]);
    expect(n.slice(1).map(Number).reduce((a, b) => a + b, 0)).toBe(total);
    expect((mixed as CheckResult).rulesAvailable).toBe(total);
  });
});
