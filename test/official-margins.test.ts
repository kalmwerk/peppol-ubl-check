// Calculation margins, held to the official rule sets:
//   1. the CEN unit tests (EN 16931 validation artefacts 1.3.17, EUPL-1.2, unchanged in
//      fixtures/en16931-cen/): every <test> names the rules its invoice must pass or fail;
//   2. boundary cases for each margin, built from the test invoices in fixtures/.
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { validateInvoiceXml } from "../src/engine/validate";

const FIXTURES = resolve(__dirname, "fixtures");
const CEN = resolve(FIXTURES, "en16931-cen");

/** The engine checks every non-S category's -08 rule as BR-VAT-08. */
const ourId = (id: string) => (/^BR-(Z|E|AE|IC|G|O|IG|IP)-08$/.test(id) ? "BR-VAT-08" : id);

/**
 * Official cases still answered differently, for a reason other than a margin (BR-CO-15 also
 * counts the VAT totals in the invoice currency). Each must still differ, so a fix shows up here.
 */
const NOT_A_MARGIN: Record<string, string> = {
  "ubl-invoice/BR-CO-15.xml#7": "two VAT totals in the invoice currency",
  "ubl-credit-note/BR-CO-15.xml#7": "two VAT totals in the invoice currency",
  "cii/BR-CO-15-2.xml#2": "the VAT total is in another currency than the invoice",
};

interface OfficialCase {
  key: string;
  description: string;
  xml: string;
  success: string[];
  error: string[];
}

function readCases(folder: string): OfficialCase[] {
  const out: OfficialCase[] = [];
  for (const file of readdirSync(resolve(CEN, folder)).filter((f) => f.endsWith(".xml")).sort()) {
    const text = readFileSync(resolve(CEN, folder, file), "utf8");
    const scope = new Set([...text.matchAll(/<scope>\s*([^<]+?)\s*<\/scope>/g)].map((m) => m[1]!));
    [...text.matchAll(/<test>([\s\S]*?)<\/test>/g)].forEach((m, i) => {
      const body = m[1]!;
      const doc = /(<(Invoice|CreditNote|rsm:CrossIndustryInvoice)\b[\s\S]*<\/\2>)/.exec(body);
      if (!doc) return;
      const head = body.slice(0, doc.index);
      const ids = (tag: string) =>
        [...head.matchAll(new RegExp(`<${tag}>\\s*([^<]+?)\\s*</${tag}>`, "g"))]
          .map((x) => x[1]!)
          .filter((id) => scope.has(id));
      out.push({
        key: `${folder}/${file}#${i}`,
        description: (/<description>([\s\S]*?)<\/description>/.exec(head)?.[1] ?? "").replace(/\s+/g, " ").trim(),
        xml: `<?xml version="1.0" encoding="UTF-8"?>\n${doc[1]!}`,
        success: ids("success"),
        error: ids("error"),
      });
    });
  }
  return out;
}

const errorIds = (xml: string, profile: "en16931" | "peppol" = "en16931") =>
  validateInvoiceXml(xml, profile)
    .findings.filter((f) => f.severity === "error")
    .map((f) => f.ruleId);

describe.each(["ubl-invoice", "ubl-credit-note", "cii"])("CEN unit tests: %s", (folder) => {
  const cases = readCases(folder);

  it("finds the official test cases", () => {
    expect(cases.length).toBeGreaterThan(folder === "cii" ? 3 : 10);
  });

  it.each(cases.map((c) => [c.key, c] as const))("%s", (key, c) => {
    const errors = new Set(errorIds(c.xml));
    const verdict = (id: string) => (errors.has(ourId(id)) ? "error" : "success");
    const expected = [...c.success.map((id) => `${id}: success`), ...c.error.map((id) => `${id}: error`)];
    const actual = [...c.success, ...c.error].map((id) => `${id}: ${verdict(id)}`);
    if (NOT_A_MARGIN[key]) expect(actual, NOT_A_MARGIN[key]).not.toEqual(expected);
    else expect(actual, c.description).toEqual(expected);
  });
});

const fixture = (path: string) => readFileSync(resolve(FIXTURES, path), "utf8");
/** Swap one exact piece of a test invoice, failing loudly when the invoice changed. */
function swap(xml: string, from: string, to: string): string {
  if (!xml.includes(from)) throw new Error(`the test invoice no longer contains ${from}`);
  return xml.split(from).join(to);
}
const has = (xml: string, rule: string, profile: "en16931" | "peppol" = "en16931") =>
  errorIds(xml, profile).includes(rule);
const amount = (name: string, value: string) => `<cbc:${name} currencyID="EUR">${value}</cbc:${name}>`;

describe("margins at their boundaries", () => {
  // UBL: lines 1250.00 + 760.00 − allowance 50.00 = 1960.00 at 21 %, VAT 411.60
  const ubl = fixture("valid/peppol-bis3-valid-be.xml");
  // CII: lines 2910.00 + 340.00 = 3250.00 at 19 %, VAT 617.50
  const cii = fixture("xrechnung/xrechnung-cii-valid.xml");
  const basis = (value: string) =>
    swap(cii, "<ram:BasisAmount>3250.00</ram:BasisAmount>", `<ram:BasisAmount>${value}</ram:BasisAmount>`);
  const ciiVat = (value: string) =>
    swap(cii, "<ram:CalculatedAmount>617.50</ram:CalculatedAmount>", `<ram:CalculatedAmount>${value}</ram:CalculatedAmount>`);

  it("BR-S-08 in UBL: less than 1.00 passes, exactly 1.00 fails", () => {
    const taxable = (v: string) => swap(ubl, amount("TaxableAmount", "1960.00"), amount("TaxableAmount", v));
    expect(has(taxable("1960.99"), "BR-S-08")).toBe(false);
    expect(has(taxable("1959.01"), "BR-S-08")).toBe(false);
    expect(has(taxable("1961.00"), "BR-S-08")).toBe(true);
  });

  it("BR-S-08 in CII: one cent off fails", () => {
    expect(has(basis("3250.00"), "BR-S-08")).toBe(false);
    expect(has(basis("3250.01"), "BR-S-08")).toBe(true);
  });

  it("BR-VAT-08 in UBL: no margin for reverse charge", () => {
    const rc = fixture("valid/reverse-charge-de-nl.xml");
    expect(has(swap(rc, amount("TaxableAmount", "5670.00"), amount("TaxableAmount", "5670.01")), "BR-VAT-08")).toBe(true);
  });

  it("BR-CO-17: less than 1.00 off passes in UBL, exactly 1.00 fails; CII also accepts exactly 1.00", () => {
    const vat = (v: string) => swap(ubl, amount("TaxAmount", "411.60"), amount("TaxAmount", v));
    expect(validateInvoiceXml(vat("412.59"), "en16931").findings.filter((f) => f.ruleId === "BR-CO-17")).toEqual([]);
    expect(has(vat("412.60"), "BR-CO-17")).toBe(true);
    expect(has(ciiVat("618.50"), "BR-CO-17")).toBe(false);
    expect(has(ciiVat("618.51"), "BR-CO-17")).toBe(true);
  });

  it("PEPPOL-EN16931-R120: 0.02 off passes, exactly (1.02 against 1.00 too), more fails", () => {
    const line = (v: string) => swap(ubl, amount("LineExtensionAmount", "760.00"), amount("LineExtensionAmount", v));
    expect(has(line("760.02"), "PEPPOL-EN16931-R120", "peppol")).toBe(false);
    expect(has(line("760.03"), "PEPPOL-EN16931-R120", "peppol")).toBe(true);
    const one = swap(
      swap(
        swap(ubl, '<cbc:InvoicedQuantity unitCode="HUR">8</cbc:InvoicedQuantity>', '<cbc:InvoicedQuantity unitCode="HUR">1</cbc:InvoicedQuantity>'),
        amount("PriceAmount", "95"),
        amount("PriceAmount", "1"),
      ),
      amount("LineExtensionAmount", "760.00"),
      amount("LineExtensionAmount", "1.02"),
    );
    expect(has(one, "PEPPOL-EN16931-R120", "peppol")).toBe(false);
  });

  it("PEPPOL-EN16931-R040: 0.02 off the unrounded base × percentage passes, more fails", () => {
    const allowance = (base: string) =>
      swap(ubl, amount("Amount", "50.00"), `<cbc:MultiplierFactorNumeric>2.5</cbc:MultiplierFactorNumeric>${amount("Amount", "50.00")}${amount("BaseAmount", base)}`);
    expect(has(allowance("2000.80"), "PEPPOL-EN16931-R040", "peppol")).toBe(false);
    expect(has(allowance("2001.00"), "PEPPOL-EN16931-R040", "peppol")).toBe(true);
  });
});
