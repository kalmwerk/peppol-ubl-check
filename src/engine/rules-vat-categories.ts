import * as D from "./decimal";
import type { AllowanceCharge, InvoiceLine, InvoiceModel, Loc, LocMap, Party, VatBreakdown } from "./model";
import type { Severity } from "./rules-catalog";
import { normalizeSpace } from "./xpath-text";

/**
 * The per-category VAT rules of EN 16931 that look at allowances and charges, the VAT breakdown and the
 * parties' VAT identifiers (BR-S/Z/E/AE/IC/G/O/IG/IP -03, -04, -06, -07, -09, -10, BR-IG-02, -05,
 * BR-IP-02, -05 and BR-O-11 … -14), written as the official CEN Schematron (1.3.17) tests them.
 *
 * The two syntaxes differ in ways that change verdicts, so each check follows its own syntax:
 * - UBL reads `normalize-space(cbc:ID)` and needs TaxScheme VAT; CII compares CategoryCode as written,
 *   and its S and Z breakdown rules don't look at TypeCode.
 * - UBL looks at every cac:AllowanceCharge (document, line and price level), CII at every
 *   SpecifiedTradeAllowanceCharge (document and line level); BR-O-03/04 in UBL at document level only.
 * - The CEN CII artefacts swap the IGIC and IPSI rule IDs: in CII, BR-IG-* check category M and BR-IP-*
 *   category L (and BR-IP-05/06/07 ask for a rate above zero), the reverse of UBL.
 * - A missing rate or amount fails a comparison test (`xs:decimal(()) = 0` is false).
 */

export type Emit = (
  ruleId: string,
  message: string,
  loc?: Loc,
  extra?: { expected?: string; actual?: string; severity?: Severity },
) => void;

/** XPath normalize-space(): trimmed, inner whitespace runs collapsed to one space. */
/** XPath normalize-space() (XML whitespace only; a non-breaking space stays). */
export const normSpace = normalizeSpace;
/** An element's text exactly as written (model values are trimmed; the loc keeps the original when it differs). */
export const exactText = (value: string | undefined, loc: Loc | undefined) => loc?.raw ?? value ?? "";

/** The xs:boolean value of a ChargeIndicator (`cbc:ChargeIndicator = false()`): true/1 or false/0; anything else matches neither. */
export function xsBoolean(raw: string | undefined): boolean | undefined {
  const v = normSpace(raw);
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return undefined;
}

/** The line and allowance/charge keys that hold the first VAT category group's elements. */
const GROUP_LOC_KEYS = ["vatCategory", "vatCategoryCode", "vatRate", "vatScheme", "vatExemptionCode"];
const withoutGroupLocs = (locs: LocMap): LocMap => {
  const out = { ...locs };
  for (const k of GROUP_LOC_KEYS) delete out[k];
  return out;
};

/**
 * One view of a line per VAT category group (UBL cac:ClassifiedTaxCategory, CII ram:ApplicableTradeTax), its VAT
 * fields and their locs set to that group's; the first view is the line itself. The official rules take each group
 * as a context or test them all (`exists(…)`, a path compared to a value), so a repeated group counts there: per-group
 * rules check every view, existence tests take any. A line without groups (or a hand-built model) is its only view.
 */
export function lineTaxViews(ln: InvoiceLine): InvoiceLine[] {
  const groups = ln.taxes ?? [];
  if (groups.length <= 1) return [ln];
  return [
    ln,
    ...groups.slice(1).map((g) => {
      const locs = withoutGroupLocs(ln.locs);
      if (g.locs["category"]) locs["vatCategory"] = locs["vatCategoryCode"] = g.locs["category"];
      else locs["vatCategory"] = g.loc;
      if (g.locs["rate"]) locs["vatRate"] = g.locs["rate"];
      if (g.locs["scheme"]) locs["vatScheme"] = g.locs["scheme"];
      return { ...ln, vatCategory: g.category, vatRate: g.rate, vatScheme: g.scheme, locs };
    }),
  ];
}

/** One view of an allowance or charge per VAT category group (UBL cac:TaxCategory, CII ram:CategoryTradeTax); see lineTaxViews. */
export function acTaxViews(ac: AllowanceCharge): AllowanceCharge[] {
  const groups = ac.taxes ?? [];
  if (groups.length <= 1) return [ac];
  return [
    ac,
    ...groups.slice(1).map((g) => {
      const locs = withoutGroupLocs(ac.locs);
      if (g.locs["category"]) locs["vatCategory"] = g.locs["category"];
      if (g.locs["rate"]) locs["vatRate"] = g.locs["rate"];
      if (g.locs["scheme"]) locs["vatScheme"] = g.locs["scheme"];
      if (g.locs["exemptionCode"]) locs["vatExemptionCode"] = g.locs["exemptionCode"];
      return { ...ac, vatCategory: g.category, vatRate: g.rate, vatScheme: g.scheme, vatExemptionCode: g.exemptionCode, locs };
    }),
  ];
}

export type AcLevel = "document" | "line" | "price";

/** Every allowance or charge the official rules may look at, with where it sits (UBL price level included). */
export function everyAllowanceCharge(m: InvoiceModel): { ac: AllowanceCharge; level: AcLevel }[] {
  const out: { ac: AllowanceCharge; level: AcLevel }[] = [];
  const docLevel = [...m.allowances, ...m.charges].sort((a, b) => (a.loc?.line ?? 0) - (b.loc?.line ?? 0));
  for (const ac of docLevel) out.push({ ac, level: "document" });
  for (const ln of m.lines) {
    for (const ac of [...ln.allowances, ...ln.charges]) out.push({ ac, level: "line" });
    for (const ac of ln.priceAllowanceCharges ?? []) out.push({ ac, level: "price" });
  }
  return out;
}

const CATEGORY_NAME: Record<string, string> = {
  S: "S (standard rated)",
  Z: "Z (zero rated)",
  E: "E (exempt from VAT)",
  AE: "AE (reverse charge)",
  K: "K (intra-community supply)",
  G: "G (export outside the EU)",
  O: "O (not subject to VAT)",
  L: "L (IGIC, Canary Islands)",
  M: "M (IPSI, Ceuta and Melilla)",
};
const catName = (c: string) => CATEGORY_NAME[c] ?? c;

type Prefix = "S" | "Z" | "E" | "AE" | "IC" | "G" | "O" | "IG" | "IP";
const PREFIXES: readonly Prefix[] = ["S", "Z", "E", "AE", "IC", "G", "O", "IG", "IP"];

/** The category code each rule prefix checks, per syntax (IG and IP swap in the CEN CII artefacts). */
function categoryOf(prefix: Prefix, cii: boolean): string {
  switch (prefix) {
    case "IC":
      return "K";
    case "IG":
      return cii ? "M" : "L";
    case "IP":
      return cii ? "L" : "M";
    default:
      return prefix;
  }
}

type RateTest = "positive" | "zero" | "non-negative" | "absent";
/** BR-x-06/07: what a document allowance's or charge's VAT rate must be, per rule prefix and syntax. */
function allowanceRateTest(prefix: Prefix, cii: boolean): RateTest {
  if (prefix === "S") return "positive";
  if (prefix === "O") return "absent";
  if (prefix === "IG") return "non-negative";
  if (prefix === "IP") return cii ? "positive" : "non-negative";
  return "zero";
}

function rateOk(test: RateTest, present: boolean, rate: number | undefined): boolean {
  if (test === "absent") return !present;
  if (rate === undefined || Number.isNaN(rate)) return false;
  if (test === "zero") return rate === 0;
  if (test === "positive") return rate > 0;
  return rate >= 0;
}

const RATE_EXPECTED: Record<RateTest, string> = {
  positive: "a rate above 0",
  zero: "0",
  "non-negative": "0 or more",
  absent: "no rate",
};

export function vatCategoryRules(m: InvoiceModel, emit: Emit): void {
  const cii = m.syntax === "CII";
  const isVat = (scheme: string | undefined, loc: Loc | undefined) =>
    cii ? exactText(scheme, loc).toUpperCase() === "VAT" : normSpace(scheme).toUpperCase() === "VAT";

  /* ------------ allowances and charges: category, scheme and rate as each syntax reads them ------------ */
  const acs = everyAllowanceCharge(m)
    // CII: SpecifiedTradeAllowanceCharge only (price-level AppliedTradeAllowanceCharge are not read)
    .filter((x) => !cii || x.level !== "price")
    // one entry per VAT category group: each is a context of BR-x-06/07, and BR-x-03/04 ask for any
    .flatMap(({ ac, level }) => acTaxViews(ac).map((view) => ({ ac: view, level })))
    .map(({ ac, level }) => {
      const catLoc = ac.locs["vatCategory"];
      const category = catLoc ? (cii ? exactText(ac.vatCategory, catLoc) : normSpace(ac.vatCategory)) : undefined;
      return {
        ac,
        level,
        charge: xsBoolean(ac.rawIndicator),
        category,
        vat: category !== undefined && isVat(ac.vatScheme, ac.locs["vatScheme"]),
      };
    });
  const kindOf = (charge: boolean) => (charge ? "charge" : "allowance");
  const where = (level: AcLevel, charge: boolean) =>
    level === "document" ? `A document-level ${kindOf(charge)}` : level === "line" ? `A line ${kindOf(charge)}` : `A price-level ${kindOf(charge)}`;

  // BR-x-06 (allowances) and BR-x-07 (charges): the VAT rate of an allowance or charge in that category
  for (const prefix of PREFIXES) {
    const category = categoryOf(prefix, cii);
    const test = allowanceRateTest(prefix, cii);
    for (const x of acs) {
      if (x.charge === undefined || !x.vat || x.category !== category) continue;
      const present = !!x.ac.locs["vatRate"];
      if (rateOk(test, present, x.ac.vatRate)) continue;
      const shown = present ? (x.ac.vatRate !== undefined ? `${x.ac.vatRate}%` : "not a number") : "missing";
      emit(
        `BR-${prefix}-${x.charge ? "07" : "06"}`,
        test === "absent"
          ? `${where(x.level, x.charge)} with VAT category ${catName(category)} carries a VAT rate (${shown}); it must not have one.`
          : `${where(x.level, x.charge)} with VAT category ${catName(category)} has VAT rate ${shown}; it must be ${RATE_EXPECTED[test]}.`,
        x.ac.locs["vatRate"] ?? x.ac.locs["vatCategory"] ?? x.ac.loc,
        { expected: RATE_EXPECTED[test], actual: shown },
      );
    }
  }

  // BR-x-03 (allowances) and BR-x-04 (charges): the VAT identifiers an invoice with such an allowance or charge needs
  const ublParty = (p: Party | undefined, vatOnly: boolean) =>
    (p?.taxRegistrations ?? []).some((r) => !vatOnly || normSpace(r.scheme).toUpperCase() === "VAT");
  const ciiParty = (p: Party | undefined, schemes: readonly string[]) =>
    (p?.taxRegistrations ?? []).some((r) => schemes.includes(r.scheme ?? ""));
  const seller = m.seller;
  const buyer = m.buyer;
  const rep = m.taxRepresentative;
  // UBL: whether the identifiers are there, per rule prefix; CII reads its own schemeIDs (VA = VAT, FC = tax number)
  const identifiersOk = (prefix: Prefix): boolean => {
    if (cii) {
      const sellerVat = ciiParty(seller, ["VA"]) || ciiParty(rep, ["VA"]);
      const sellerAny = ciiParty(seller, ["VA", "FC"]) || ciiParty(rep, ["VA"]);
      if (prefix === "S" || prefix === "Z" || prefix === "E" || prefix === "IG" || prefix === "IP") return sellerAny;
      if (prefix === "AE") return sellerAny && (ciiParty(buyer, ["VA"]) || !!buyer.locs["legalId"]);
      if (prefix === "G") return sellerVat;
      if (prefix === "IC") return sellerVat && ciiParty(buyer, ["VA"]);
      return !sellerVat && !ciiParty(buyer, ["VA"]); // O: none of them
    }
    const sellerVat = ublParty(seller, true) || ublParty(rep, true);
    const sellerAny = ublParty(seller, false) || ublParty(rep, true);
    if (prefix === "S" || prefix === "Z" || prefix === "E" || prefix === "IG" || prefix === "IP") return sellerAny;
    if (prefix === "AE") return sellerAny && (ublParty(buyer, true) || !!buyer.locs["legalId"]);
    if (prefix === "G") return sellerVat;
    if (prefix === "IC") return sellerVat && ublParty(buyer, true);
    return !sellerVat && !ublParty(buyer, true); // O
  };
  const SELLER_IDS = "the seller's VAT identifier (BT-31), tax registration number (BT-32) or a tax representative's VAT identifier (BT-63)";
  const NEEDS: Partial<Record<Prefix, string>> = {
    S: SELLER_IDS,
    Z: SELLER_IDS,
    E: SELLER_IDS,
    IG: SELLER_IDS,
    IP: SELLER_IDS,
    AE: `${SELLER_IDS}, and the buyer's VAT identifier (BT-48) or legal registration identifier (BT-47)`,
    G: "the seller's VAT identifier (BT-31) or a tax representative's VAT identifier (BT-63)",
    IC: "the seller's (BT-31) or tax representative's (BT-63) VAT identifier and the buyer's VAT identifier (BT-48)",
  };
  for (const prefix of PREFIXES) {
    const category = categoryOf(prefix, cii);
    for (const charge of [false, true]) {
      // UBL's BR-IG-04 tests its "no such charge" half on cbc:ID = 'L' as written (not normalised), so only those fail
      const rawOnly = !cii && prefix === "IG" && charge;
      const hits = acs.filter(
        (x) =>
          x.charge === charge &&
          x.vat &&
          x.category === category &&
          (cii || prefix !== "O" || x.level === "document") &&
          (!rawOnly || exactText(x.ac.vatCategory, x.ac.locs["vatCategory"]) === category),
      );
      if (hits.length === 0 || identifiersOk(prefix)) continue;
      emit(
        `BR-${prefix}-${charge ? "04" : "03"}`,
        prefix === "O"
          ? `The invoice has a ${kindOf(charge)} with VAT category ${catName(category)}, so it must not carry the seller's, tax representative's or buyer's VAT identifier.`
          : `The invoice has a ${kindOf(charge)} with VAT category ${catName(category)}, so it needs ${NEEDS[prefix]}.`,
        prefix === "O" ? (seller.locs["vatId"] ?? buyer.locs["vatId"] ?? hits[0]!.ac.loc) : hits[0]!.ac.loc,
      );
    }
  }

  /* ------------ VAT breakdown ------------ */
  const rows = m.vat.map((v) => {
    const catLoc = v.locs["category"];
    return {
      v,
      category: catLoc ? (cii ? exactText(v.category, catLoc) : normSpace(v.category)) : undefined,
      vat: isVat(v.scheme, v.locs["scheme"]),
    };
  });
  const label = (v: VatBreakdown, category: string) => `The VAT breakdown for ${catName(category)}${v.rate !== undefined ? ` at ${v.rate}%` : ""}`;
  const at = (v: VatBreakdown, key: string): Loc | undefined => v.locs[key] ?? v.loc;

  // BR-x-09: the VAT amount of a breakdown row
  for (const prefix of PREFIXES) {
    const category = categoryOf(prefix, cii);
    // CII's S and Z rules match the CategoryCode whatever the TypeCode; its IGIC/IPSI rules test true()
    if (cii && (prefix === "IG" || prefix === "IP")) continue;
    const needsVat = !(cii && (prefix === "S" || prefix === "Z"));
    const calculated = prefix === "S" || (!cii && (prefix === "IG" || prefix === "IP"));
    for (const { v, category: c, vat } of rows) {
      if (c !== category || (needsVat && !vat)) continue;
      if (!calculated) {
        if (v.taxAmount !== undefined && v.taxAmount === 0) continue;
        emit(
          `BR-${prefix}-09`,
          v.taxAmount === undefined
            ? `${label(v, category)} has no VAT amount (BT-117); it must be 0.`
            : `${label(v, category)} has VAT amount ${v.taxAmount}; it must be 0.`,
          at(v, "taxAmount"),
          { expected: "0", actual: v.taxAmount === undefined ? undefined : String(v.taxAmount) },
        );
        continue;
      }
      // |VAT amount| within (not equal to) 1.00 of round(|taxable amount| × rate ÷ 100) to the cent
      if (v.taxAmount === undefined || v.taxableAmount === undefined || v.rate === undefined) {
        const missing = [v.taxableAmount === undefined && "taxable amount (BT-116)", v.taxAmount === undefined && "VAT amount (BT-117)", v.rate === undefined && "rate (BT-119)"].filter(Boolean);
        emit(`BR-${prefix}-09`, `${label(v, category)} has no ${missing.join(" or ")}, so its VAT amount can't be checked.`, at(v, v.taxAmount === undefined ? "taxAmount" : "taxableAmount"));
        continue;
      }
      const expected = D.round2(D.div(D.mul(D.abs(D.dec(v.taxableAmount)), D.dec(v.rate)), D.dec(100)));
      if (D.within(D.abs(D.dec(v.taxAmount)), expected, D.ONE_UNIT)) continue;
      const shown = v.taxableAmount < 0 ? D.neg(expected) : expected;
      emit(
        `BR-${prefix}-09`,
        `${v.taxableAmount} × ${v.rate}% = ${D.toNumber(shown).toFixed(2)}, but ${label(v, category).replace(/^The /, "the ")} has VAT amount ${v.taxAmount}.`,
        at(v, "taxAmount"),
        { expected: D.toNumber(shown).toFixed(2), actual: String(v.taxAmount) },
      );
    }
  }

  // BR-G-10: an export row needs an exemption reason; BR-IG-10 / BR-IP-10: IGIC and IPSI rows must not have one
  for (const prefix of ["G", "IG", "IP"] as const) {
    const category = categoryOf(prefix, cii);
    for (const { v, category: c, vat } of rows) {
      if (c !== category || !vat) continue;
      const hasReason = !!(v.locs["exemptionReason"] || v.locs["exemptionCode"]);
      if (prefix === "G" ? hasReason : !hasReason) continue;
      emit(
        `BR-${prefix}-10`,
        prefix === "G"
          ? `${label(v, category)} has no VAT exemption reason (BT-120) or reason code (BT-121).`
          : `${label(v, category)} has a VAT exemption reason; IGIC and IPSI are taxed, so it must not have one.`,
        prefix === "G" ? at(v, "category") : at(v, v.locs["exemptionCode"] ? "exemptionCode" : "exemptionReason"),
        prefix === "G" ? { expected: "VATEX-EU-G or the text 'Export outside the EU'" } : {},
      );
    }
  }

  // BR-O-11 … BR-O-14: a "not subject to VAT" invoice has no other category anywhere
  const oRows = rows.filter((r) => r.category === "O" && r.vat);
  if (oRows.length > 0) {
    const first = oRows[0]!.v;
    const oLoc = at(first, "category");
    if (cii) {
      // Each test reads every ApplicableTradeTax (O-11, O-12) or CategoryTradeTax (O-13, O-14) with a CategoryCode
      const lineCat = (ln: InvoiceLine) => (ln.locs["vatCategoryCode"] ? exactText(ln.vatCategory, ln.locs["vatCategoryCode"]) : undefined);
      const otherTax =
        rows.some((r) => r.category !== undefined && r.category !== "O") ||
        m.lines.flatMap(lineTaxViews).some((ln) => {
          const c = lineCat(ln);
          return c !== undefined && c !== "O";
        });
      const otherAc = acs.some((x) => x.category !== undefined && x.category !== "O");
      for (const id of ["BR-O-11", "BR-O-12"]) if (otherTax) emit(id, `The invoice has a VAT breakdown in category ${catName("O")}, but also a VAT breakdown or invoice line in another category.`, oLoc);
      for (const id of ["BR-O-13", "BR-O-14"]) if (otherAc) emit(id, `The invoice has a VAT breakdown in category ${catName("O")}, but an allowance or charge in another VAT category.`, oLoc);
    } else {
      const other = rows.find((r) => r.vat && r.category !== "O");
      if (other)
        emit("BR-O-11", `The invoice has a VAT breakdown in category ${catName("O")}, so it can't have other VAT breakdowns (found ${other.category ? catName(other.category) : "one without a category"}).`, at(other.v, "category"));
      const otherLine = m.lines.flatMap(lineTaxViews).find((ln) => ln.locs["vatCategory"] && isVat(ln.vatScheme, ln.locs["vatScheme"]) && normSpace(ln.vatCategory) !== "O");
      if (otherLine)
        emit("BR-O-12", `The invoice has a VAT breakdown in category ${catName("O")}, so every line must be in category O too (line ${otherLine.id ?? "?"} is ${otherLine.vatCategory ?? "without a category"}).`, otherLine.locs["vatCategory"] ?? otherLine.loc);
      for (const charge of [false, true]) {
        // A TaxCategory with TaxScheme VAT whose ID isn't O, even one without an ID (normalize-space('') != 'O')
        const hit = acs.find((x) => x.charge === charge && isVat(x.ac.vatScheme, x.ac.locs["vatScheme"]) && normSpace(x.ac.vatCategory) !== "O");
        if (hit)
          emit(
            charge ? "BR-O-14" : "BR-O-13",
            `The invoice has a VAT breakdown in category ${catName("O")}, so a ${kindOf(charge)} can't be in VAT category ${hit.category ? catName(hit.category) : "(empty)"}.`,
            hit.ac.locs["vatCategory"] ?? hit.ac.loc,
          );
      }
    }
  }

  /* ------------ lines: BR-x-02, the VAT identifiers an invoice with lines in a category needs ------------ */
  // UBL tests the document once for any cac:ClassifiedTaxCategory in the category (normalize-space) with
  // TaxScheme VAT; CII each line's ApplicableTradeTax with that CategoryCode and TypeCode VAT as written.
  // Only the elements count, filled or not: an empty CompanyID (UBL) or ID with the right schemeID (CII) is there.
  const lineCategory = (ln: InvoiceLine) => {
    const codeLoc = ln.locs["vatCategoryCode"];
    if (!codeLoc) return undefined;
    return cii ? exactText(ln.vatCategory, codeLoc) : normSpace(ln.vatCategory);
  };
  for (const prefix of PREFIXES) {
    const category = categoryOf(prefix, cii);
    // each VAT category group of a line counts (CII: each is a context of its own)
    const groups = m.lines.flatMap(lineTaxViews);
    const inCategory = groups.filter((ln) => lineCategory(ln) === category && isVat(ln.vatScheme, ln.locs["vatScheme"]));
    // UBL's BR-S-02 alone tests "no S line" without TaxScheme: an S line without VAT and no S line with VAT fails
    const sWithoutVat = !cii && prefix === "S" && inCategory.length === 0 ? groups.find((ln) => lineCategory(ln) === "S") : undefined;
    if (sWithoutVat) {
      emit("BR-S-02", `Line ${sWithoutVat.id ?? "?"} is in VAT category ${catName("S")}, but its tax scheme isn't VAT, so the official rule can't find a standard-rated VAT line to accept.`, sWithoutVat.locs["vatScheme"] ?? sWithoutVat.locs["vatCategoryCode"] ?? sWithoutVat.loc);
      continue;
    }
    if (inCategory.length === 0 || identifiersOk(prefix)) continue;
    for (const ln of cii ? inCategory : inCategory.slice(0, 1))
      emit(
        `BR-${prefix}-02`,
        prefix === "O"
          ? `${cii ? `Line ${ln.id ?? "?"} is` : "The invoice has lines"} in VAT category ${catName(category)}, so it must not carry the seller's, tax representative's or buyer's VAT identifier.`
          : `${cii ? `Line ${ln.id ?? "?"} is` : "The invoice has lines"} in VAT category ${catName(category)}, so it needs ${NEEDS[prefix]}.`,
        prefix === "O" ? (m.seller.locs["vatId"] ?? m.buyer.locs["vatId"] ?? ln.locs["vatCategoryCode"] ?? ln.loc) : (ln.locs["vatCategoryCode"] ?? ln.loc),
      );
  }
  /* ------------ lines: BR-IG-05, BR-IP-05 ------------ */
  for (const prefix of ["IG", "IP"] as const) {
    const category = categoryOf(prefix, cii);
    const test: RateTest = cii && prefix === "IP" ? "positive" : "non-negative";
    for (const ln of m.lines.flatMap(lineTaxViews)) {
      const codeLoc = ln.locs["vatCategoryCode"];
      if (!codeLoc) continue;
      const c = cii ? exactText(ln.vatCategory, codeLoc) : normSpace(ln.vatCategory);
      if (c !== category || !isVat(ln.vatScheme, ln.locs["vatScheme"])) continue;
      if (rateOk(test, !!ln.locs["vatRate"], ln.vatRate)) continue;
      emit(
        `BR-${prefix}-05`,
        `Line ${ln.id ?? "?"} in VAT category ${catName(category)} has VAT rate ${ln.vatRate ?? "missing"}; it must be ${RATE_EXPECTED[test]}.`,
        ln.locs["vatRate"] ?? codeLoc,
        { expected: RATE_EXPECTED[test], actual: ln.vatRate === undefined ? undefined : String(ln.vatRate) },
      );
    }
  }
}
