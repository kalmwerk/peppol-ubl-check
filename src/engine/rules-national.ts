import type { InvoiceModel } from "./model";
import { kvkOrOinToken, xsDecimal, xsDouble } from "./read-national";
import type { Emit } from "./rules-vat-categories";
import { normalizeSpace } from "./xpath-text";

/**
 * The SI-UBL 2.0 / NLCIUS rules (Dutch Peppol Authority validation set 2026-05-21: SI-UBL 2.0.3.13 and
 * NLCIUS-CII 1.0.3.13) and the XRechnung rules (KoSIT XRechnung Schematron 2.6.0, XRechnung 3.0.2), each
 * written as its official assertion tests it, on the facts read-national.ts collects. Where the two
 * syntaxes' official files differ, each syntax follows its own file:
 *
 * - SI-UBL compares the type code as text (`. = '380'`), NLCIUS-CII as a number (`. = 380`), and the
 *   country in BR-NL-4/5/10 exactly as written (`!= 'NL'`), while the supplier test normalises it.
 * - Within one official pattern an element is checked only by the first rule whose context matches: in
 *   NLCIUS-CII that keeps BR-NL-9 and BR-NL-31 from ever firing (BR-NL-7 and BR-NL-12 share their
 *   contexts), in SI-UBL it reports every allowance or charge reason code as BR-NL-32 (the BR-NL-34 rules
 *   repeat BR-NL-32's contexts), and in both it keeps the empty-element check off elements an earlier rule
 *   takes as context.
 * - BR-NL-1 runs per seller cac:Party in UBL but only where a ram:SpecifiedLegalOrganization exists in CII;
 *   NLCIUS-CII's BR-NL-10 asks every buyer of a Dutch supplier for a filled-in legal ID.
 * - KoSIT's IBAN check removes only XML whitespace and reads lower-case letters as they are.
 */

const NL_TYPE_CODES = ["380", "381", "384", "389"];
const NL_PAYMENT_CODES = ["30", "48", "49", "57", "58", "59"];
const shown = (v: string | undefined) => (v === undefined ? "(missing)" : normalizeSpace(v) === "" ? "(empty)" : `"${v}"`);

export function nlciusRules(m: InvoiceModel, emit: Emit): void {
  const f = m.nlcius;
  if (!f) return;
  const ubl = m.syntax === "UBL";
  const si = f.declared;
  const s = f.dutchSupplier;

  // SI-V20-INV-R000 (SI-UBL only): every CustomizationID must start with the SI-UBL 2.0 / NLCIUS identifier
  if (ubl)
    for (const c of f.customizationIds)
      if (!c.value.startsWith("urn:cen.eu:en16931:2017#compliant#urn:fdc:nen.nl:nlcius:v1.0"))
        emit("SI-V20-INV-R000", `Specification identifier is ${shown(c.value)}, not SI-UBL 2.0 / NLCIUS.`, c.loc, {
          expected: "urn:cen.eu:en16931:2017#compliant#urn:fdc:nen.nl:nlcius:v1.0",
          actual: c.value,
        });

  if (s) {
    // BR-NL-1: the seller's legal ID is a KvK (0106) or OIN (0190) number with text
    for (const c of f.sellerLegal)
      if (!(kvkOrOinToken(c.schemes) && c.filled))
        emit(
          "BR-NL-1",
          c.id !== undefined
            ? `The seller legal ID ${shown(c.id)} has scheme ${c.scheme === undefined ? "none" : `"${c.scheme}"`}, not 0106 (KvK) or 0190 (OIN)${c.filled ? "" : ", and it is empty"}.`
            : "The seller has no KvK or OIN number (BT-30).",
          c.loc,
          { expected: "schemeID 0106 (KvK) or 0190 (OIN)", actual: c.id !== undefined ? `${c.scheme ?? "no schemeID"} ${c.id}`.trim() : undefined },
        );
    // BR-NL-2: a buyer reference or an order reference element
    for (const c of f.references)
      if (!c.given) emit("BR-NL-2", "Neither a buyer reference (BT-10) nor a purchase order reference (BT-13) is given.", m.locs["buyerReference"] ?? c.loc);
    // BR-NL-3/4/5: street, city and post code elements (BR-NL-4/5 only when the country isn't exactly NL)
    for (const a of f.addresses) {
      if (a.missing.length === 0 || (a.party !== "seller" && a.countryNotNl)) continue;
      if (a.party === "seller") emit("BR-NL-3", `The seller address has no ${a.missing.join(", ")}.`, a.loc);
      else if (a.party === "buyer") emit("BR-NL-4", `The Dutch buyer's address has no ${a.missing.join(", ")}.`, a.loc);
      else emit("BR-NL-5", `The Dutch tax representative's address has no ${a.missing.join(", ")}.`, a.loc);
    }
  }

  // BR-NL-7 (any supplier in CII, Dutch suppliers in UBL), BR-NL-8 and BR-NL-9 (UBL)
  if (ubl ? s : si)
    for (const t of f.typeCodes) {
      const ok = ubl ? NL_TYPE_CODES.includes(t.text) : NL_TYPE_CODES.some((c) => xsDouble(t.text) === Number(c));
      if (!ok)
        emit("BR-NL-7", `Type code ${shown(t.text)} is not one of 380, 381, 384 or 389.`, t.loc, { expected: "380, 381, 384 or 389", actual: t.text });
      if (!ubl) continue;
      if (t.text === "381" && m.kind === "invoice")
        emit("BR-NL-8", "Type code 381 (credit note) is sent as a UBL Invoice; it must be a UBL CreditNote.", t.loc, { expected: "<CreditNote>", actual: "<Invoice>" });
      if (t.text !== "381" && m.kind === "creditnote")
        emit("BR-NL-8", `A UBL CreditNote has type code ${shown(t.text)}; credit notes use 381, codes 380, 384 and 389 the UBL Invoice.`, t.loc, { expected: "381", actual: t.text });
      if (t.text === "384" && !f.invoiceReferenceGiven)
        emit("BR-NL-9", "This corrected invoice (type 384) doesn't reference the invoice it corrects (BT-25).", t.loc);
    }

  if (s) {
    // BR-NL-10: a Dutch buyer's legal ID is KvK or OIN; an ID that is there must have text (CII: must be there)
    for (const b of f.buyerLegal) {
      const schemeOk = !b.countryNl || kvkOrOinToken(b.schemes);
      const idOk = b.idRequired ? b.filled : b.ids === 0 || b.filled;
      if (schemeOk && idOk) continue;
      emit(
        "BR-NL-10",
        !schemeOk
          ? b.ids
            ? "The Dutch buyer's legal ID (BT-47) has no KvK (0106) or OIN (0190) scheme."
            : "The Dutch buyer has no KvK or OIN number (BT-47)."
          : b.ids
            ? "The buyer legal ID (BT-47) is empty."
            : "The buyer has no legal registration identifier (BT-47), which the NLCIUS CII rules ask for.",
        b.loc,
        { expected: "schemeID 0106 (KvK) or 0190 (OIN)" },
      );
    }
    // BR-NL-11: an amount due needs payment means (CII: also fine for type code 381)
    for (const t of f.totals) {
      if (t.paymentGiven || (!ubl && f.creditNoteType)) continue;
      const due = t.payable === undefined ? undefined : xsDecimal(t.payable);
      if (t.payable !== undefined && due === undefined) continue; // the official cast fails; IV-SYN-03 reports the value
      if (due !== undefined && due <= 0) continue;
      emit("BR-NL-11", due === undefined ? "There is no amount due (BT-115) and no payment instructions." : `There is an amount due of ${normalizeSpace(t.payable)} but no payment instructions.`, t.loc);
    }
    // BR-NL-12: payment means code; BR-NL-31 (UBL): no BIC for SEPA payments
    for (const pm of f.paymentMeans) {
      const code = pm.codes[0];
      const ok = ubl
        ? NL_PAYMENT_CODES.includes(normalizeSpace(code))
        : pm.codes.some((c) => NL_PAYMENT_CODES.some((n) => xsDouble(c) === Number(n)));
      if (!ok)
        emit("BR-NL-12", `Payment means code ${shown(code)} is not one of 30, 48, 49, 57, 58 or 59.`, pm.codeLoc ?? pm.loc, { expected: "30, 48, 49, 57, 58 or 59", actual: code });
      if (ubl && (normalizeSpace(code) === "58" || normalizeSpace(code) === "59") && pm.branchIdGiven)
        emit("BR-NL-31", `A payment service provider identifier (BIC) is given for SEPA payment means ${normalizeSpace(code)}.`, pm.branchLoc ?? pm.loc);
    }
  }

  // BR-NL-13 (any SI-UBL supplier): an order line reference needs the document's order reference
  if (si && !f.orderReferenceGiven)
    for (const r of f.orderLineRefs.slice(0, 25))
      emit("BR-NL-13", `A line references order line ${shown(r.text)}, but the invoice has no order reference (BT-13).`, r.loc);

  if (s) {
    // Recommendations: elements NLCIUS asks Dutch suppliers to leave out (warnings)
    const MESSAGES: Record<string, string> = {
      "BR-NL-19": "A VAT accounting currency (BT-6) is given.",
      "BR-NL-20": "A VAT point date (BT-7) is given.",
      "BR-NL-21": "A VAT point date code (BT-8) is given.",
      "BR-NL-22": "An invoice note subject code (BT-21) is given.",
      "BR-NL-23": "A business process type (BT-23) is given.",
      "BR-NL-24": "A preceding invoice issue date (BT-26) is given.",
      "BR-NL-26": "Seller additional legal information (BT-33) is given.",
      "BR-NL-27": "A third address line is given.",
      "BR-NL-28": "A country subdivision is given.",
      "BR-NL-29": "A payment means text (BT-82) is given.",
      "BR-NL-30": "A payment account name (BT-85) is given.",
      "BR-NL-35": "A VAT exemption reason code (BT-121) is given.",
    };
    for (const d of f.discouraged) {
      if (d.rule === "BR-NL-32") {
        // SI-UBL reports every reason code as BR-NL-32; NLCIUS-CII's one rule covers both, reported by kind here
        const charge = !ubl && d.charge;
        emit(charge ? "BR-NL-34" : "BR-NL-32", `${charge ? "A charge" : ubl ? "An allowance or charge" : "An allowance"} reason code (${shown(d.value)}) is given.`, d.loc, { actual: d.value });
      } else emit(d.rule, MESSAGES[d.rule]!.replace(/\.$/, d.value !== undefined && normalizeSpace(d.value) !== "" ? ` ("${normalizeSpace(d.value)}").` : "."), d.loc, { actual: d.value });
    }
    // BR-NL-25: a seller tax registration other than VAT
    for (const t of f.sellerTaxSchemes)
      if (t.hasId && !t.vat)
        emit("BR-NL-25", `A tax registration number other than VAT (${shown(t.id)}) is given.`, t.loc, { actual: t.id });
    // BR-NL-33: a VAT total in another currency than the invoice currency, compared as written
    for (const t of f.taxTotalCurrencies)
      if (t.currency === undefined || !t.documentCurrencies.includes(t.currency))
        emit(
          "BR-NL-33",
          t.currency === undefined
            ? "A VAT total amount has no currencyID, so it isn't in the invoice currency."
            : `A VAT total in ${shown(t.currency)} is given next to the invoice currency ${t.documentCurrencies.length ? shown(t.documentCurrencies[0]) : "(missing)"}.`,
          t.loc,
          { actual: t.currency },
        );
  }

  // SI-UBL-2 / empty-element-check (no predicate: every document), except elements an earlier rule takes
  const shadowed = (by?: "s" | "si") => (by === "s" && s) || (by === "si" && si);
  for (const e of f.emptyElements.filter((x) => !shadowed(x.shadowedBy)).slice(0, 25))
    emit("SI-UBL-2", `Element ${e.loc.xpath.split("/").pop()} is empty.`, e.loc);
}

/* ------------------------------------------ XRechnung ------------------------------------------ */

/**
 * The Peppol BIS rules KoSIT's XRechnung Schematron 2.6.0 copies into its peppol-ubl / peppol-cii patterns and
 * runs on every XRechnung document (the same IDs in both syntaxes; CII's R043-1/-2 are R043 here). Copies that
 * differ from Peppol's own 3.0.22 files are handled in rules.ts (`kosit`): R008 (both syntaxes, own exceptions),
 * R040 and R120 (0.5 slack for HUF; R120 a warning), CII R053 (`<= 1`), R055 (needs a total in the invoice
 * currency), R120's gross base quantity, and the CII-only R044 / R046.
 */
export const KOSIT_PEPPOL_RULES: ReadonlySet<string> = new Set(
  ["R001", "R005", "R008", "R010", "R020", "R040", "R041", "R042", "R043", "R044", "R046", "R053", "R054", "R055", "R061", "R101", "R110", "R111", "R120", "R121", "R130"].map(
    (r) => `PEPPOL-EN16931-${r}`,
  ),
);

const XR_CIUS_ID = "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0";
const XR_SPEC_IDS = [
  XR_CIUS_ID,
  `${XR_CIUS_ID}#conformant#urn:xeinkauf.de:kosit:extension:xrechnung_3.0`,
  `${XR_CIUS_ID}#compliant#urn:xeinkauf.de:kosit:xrechnung:cvd_0.9`,
];
const XR_TYPE_CODES = ["326", "380", "384", "389", "381", "875", "876", "877"];
/** KoSIT common.sch regular expressions; `\s` and `.` in XPath regexes cover XML whitespace / any character but CR and LF only. */
const XR_SKONTO = /(^|\r?\n)#(SKONTO)#TAGE=([0-9]+#PROZENT=[0-9]+\.[0-9]{2})(#BASISBETRAG=-?[0-9]+\.[0-9]{2})?#$/;
const XR_EMAIL = /^[^@\x20\x09\x0A\x0D]+@([^@.\x20\x09\x0A\x0D]+\.)+[^@.\x20\x09\x0A\x0D]+$/;
const XR_IBAN = /^[A-Z]{2}[0-9]{2}[a-zA-Z0-9]{0,30}$/;
const XR_LAST_SKONTO = /#[^\n\r]+#/;
const XR_LINE_BREAK_AFTER = /^[\x20\x09\x0A\x0D]*\n/;
/** $XR-URL-REGEX; matches() isn't anchored at the end */
const XR_URL = /^([a-zA-Z])([a-zA-Z0-9+.-])+:/;

/**
 * KoSIT's xr:checkIBAN: remove XML whitespace, match ^[A-Z]{2}[0-9]{2}[a-zA-Z0-9]{0,30}$, then mod 97 = 1 over the
 * code points of BBAN + upper-cased country + check digits (cp > 64 → cp − 55, else cp − 48), lower case included.
 */
export function xrCheckIban(iban: string): boolean {
  const n = normalizeSpace(iban.replace(/[\x20\x09\x0A\x0D]/g, ""));
  if (!XR_IBAN.test(n)) return false;
  const moved = n.slice(4) + n.slice(0, 2).toUpperCase() + n.slice(2, 4);
  const digits = [...moved].map((ch) => {
    const cp = ch.codePointAt(0)!;
    return String(cp > 64 ? cp - 55 : cp - 48);
  });
  return BigInt(digits.join("")) % 97n === 1n;
}
/** `.*([0-9].*){3,}.*` on normalize-space(): at least three digits. */
const threeDigits = (s: string) => (s.match(/[0-9]/g) ?? []).length >= 3;

export function xrechnungRules(m: InvoiceModel, emit: Emit): void {
  const f = m.xrechnung;
  if (!f) return;
  const ubl = m.syntax === "UBL";

  if (!f.paymentMeansGiven) emit("BR-DE-1", "Payment instructions (BG-16) are missing.");
  if (!f.buyerReferenceFilled) emit("BR-DE-15", "The buyer reference / Leitweg-ID (BT-10) is missing.", m.locs["buyerReference"]);
  if (f.vatCodeUsed !== undefined && !f.sellerTaxIdGiven)
    emit("BR-DE-16", `VAT category ${f.vatCodeUsed} is used, but neither the seller VAT number, a tax number nor a tax representative is given.`, m.seller.loc);

  const typeOk = f.typeCodes.some((c) => XR_TYPE_CODES.includes(c));
  if (!typeOk)
    emit("BR-DE-17", f.typeCodes[0] ? `Type code "${f.typeCodes[0]}" is not one of the codes XRechnung expects.` : "There is no invoice type code, so it isn't one of the codes XRechnung expects.", m.locs["typeCode"], {
      actual: f.typeCodes[0],
      expected: XR_TYPE_CODES.join(", "),
    });

  // BR-DE-18: every line starting with # (after normalize-space) follows the Skonto syntax, and the last entry ends with a line break
  const note = f.paymentTermsNote;
  if (note) {
    const skonto = note.text.split(/\r?\n/).filter((l) => normalizeSpace(l).startsWith("#"));
    const bad = skonto.find((l) => !XR_SKONTO.test(normalizeSpace(l)));
    const tail = note.text.split(XR_LAST_SKONTO).pop() ?? "";
    if (bad !== undefined)
      emit("BR-DE-18", `Payment terms line "${normalizeSpace(bad)}" doesn't follow the XRechnung Skonto syntax.`, note.loc, { expected: "#SKONTO#TAGE=14#PROZENT=2.00#", actual: normalizeSpace(bad) });
    else if (skonto.length && !XR_LINE_BREAK_AFTER.test(tail))
      emit("BR-DE-18", "The last Skonto entry in the payment terms is not followed by a line break.", note.loc);
  }

  // BR-DE-21: compared exactly as written
  if (f.specIds && !f.specIds.values.some((v) => XR_SPEC_IDS.includes(v)))
    emit("BR-DE-21", `Specification identifier is ${shown(f.specIds.values[0])}, not XRechnung 3.0.`, f.specIds.loc, { expected: XR_CIUS_ID, actual: f.specIds.values[0] });

  if (f.duplicateFilename !== undefined) emit("BR-DE-22", `Two attachments are both called "${f.duplicateFilename}".`);

  if (f.typeCodes.includes("384") && !f.invoiceReferenceGiven)
    emit("BR-DE-26", "A corrected invoice (type 384) should reference the invoice it corrects (BG-3).", m.locs["typeCode"]);

  // BR-DE-30/31: direct debit needs the creditor ID and the debited account
  const dd = f.directDebit;
  if (ubl) {
    if (dd.mandate && !dd.creditorId) emit("BR-DE-30", "Direct debit is used, but the SEPA creditor identifier (BT-90, a seller or payee identifier with schemeID SEPA) is missing.");
    if (dd.mandate && !dd.debitedAccount) emit("BR-DE-31", "Direct debit is used, but the debited account (BT-91) is missing.");
  } else {
    const any = dd.mandate || dd.creditorId || dd.debitedAccount;
    if (any && !(dd.creditorId && (dd.mandate || dd.debitedAccount))) emit("BR-DE-30", "Direct debit details are given, but the SEPA creditor identifier (BT-90) is missing.");
    if (any && !(dd.debitedAccount && (dd.mandate || dd.creditorId))) emit("BR-DE-31", "Direct debit details are given, but the debited account (BT-91) is missing.");
  }

  for (const sp of f.sellers) if (!sp.contactGiven) emit("BR-DE-2", "The seller contact (BG-6) is missing.", sp.loc);
  for (const c of f.contacts) {
    if (!c.nameFilled) emit("BR-DE-5", "The seller contact name (BT-41) is missing.", c.loc);
    if (!c.phoneFilled) emit("BR-DE-6", "The seller contact telephone (BT-42) is missing.", c.loc);
    if (!c.emailFilled) emit("BR-DE-7", "The seller contact email (BT-43) is missing.", c.loc);
    if (!threeDigits(c.phone))
      emit("BR-DE-27", c.phone ? `Seller telephone "${c.phone}" has fewer than three digits.` : "There is no seller telephone number with at least three digits.", c.phoneLoc ?? c.loc, { actual: c.phone });
    if (!XR_EMAIL.test(c.email))
      emit("BR-DE-28", c.email ? `Seller email "${c.email}" is not a valid address.` : "There is no seller email address.", c.emailLoc ?? c.loc, { actual: c.email });
  }
  for (const a of f.addresses) {
    const [cityRule, postRule, who] = a.party === "seller" ? ["BR-DE-3", "BR-DE-4", "seller"] : a.party === "buyer" ? ["BR-DE-8", "BR-DE-9", "buyer"] : ["BR-DE-10", "BR-DE-11", "deliver-to"];
    const [cityBt, postBt] = a.party === "seller" ? ["BT-37", "BT-38"] : a.party === "buyer" ? ["BT-52", "BT-53"] : ["BT-77", "BT-78"];
    if (!a.cityFilled) emit(cityRule, `The ${who} city (${cityBt}) is missing.`, a.loc);
    if (!a.postcodeFilled) emit(postRule, `The ${who} post code (${postBt}) is missing.`, a.loc);
  }

  // Payment instructions: exactly the group the payment means code asks for
  for (const pm of f.paymentMeans) {
    const code = pm.code;
    if (code === "30" || code === "58") {
      if (code === "58" && !xrCheckIban(pm.payeeAccount))
        emit("BR-DE-19", `Payment account ${shown(pm.payeeAccount || undefined)} is not a valid IBAN for SEPA credit transfer (58).`, pm.payeeLoc ?? pm.loc, { actual: pm.payeeAccount });
      if (!pm.creditTransfer) emit("BR-DE-23-a", `Payment means ${code} (credit transfer) has no credit transfer account (BG-17).`, pm.loc);
      if (pm.card || pm.directDebit) emit("BR-DE-23-b", `Payment means ${code} (credit transfer) also carries card or direct debit details.`, pm.loc);
    } else if (code === "48" || code === "54" || code === "55") {
      if (!pm.card) emit("BR-DE-24-a", `Payment means ${code} (card payment) has no card details (BG-18).`, pm.loc);
      if (pm.creditTransfer || pm.directDebit) emit("BR-DE-24-b", `Payment means ${code} (card payment) also carries an account or direct debit details.`, pm.loc);
    } else if (code === "59") {
      if (!xrCheckIban(pm.payerAccount))
        emit("BR-DE-20", `Debited account ${shown(pm.payerAccount || undefined)} is not a valid IBAN for SEPA direct debit (59).`, pm.payerLoc ?? pm.loc, { actual: pm.payerAccount });
      if (!pm.directDebit) emit("BR-DE-25-a", "Payment means 59 (SEPA direct debit) has no direct debit details (BG-19).", pm.loc);
      if (pm.creditTransfer || pm.card || pm.institutions)
        emit("BR-DE-25-b", "Payment means 59 (SEPA direct debit) also carries a credit transfer account, bank or card details.", pm.loc);
    }
  }

  for (const v of f.vatRates) if (!v.filled) emit("BR-DE-14", `The VAT breakdown for category ${v.category ?? "?"} has no rate (BT-119).`, v.loc);

  if (!f.deliveryDateOrPeriod) emit("BR-DE-TMP-32", "No delivery date (BT-72), invoicing period (BG-14) or line periods (BG-26) are given.");

  // KoSIT's temporary rules, which stand in for CEN rules until CEN fixes them (Schematron 2.6.0)
  for (const e of f.tmp.externalUris)
    if (e.uri === null || !XR_URL.test(e.uri))
      emit("BR-TMP-2", e.uri === null ? "An external document reference has no address (BT-124)." : `External document location "${e.uri}" is not an absolute URL with a scheme.`, e.loc, {
        actual: e.uri ?? undefined,
        expected: "an absolute URL such as https://…",
      });
  for (const line of f.tmp.baseQuantityMismatch)
    emit("BR-TMP-3", "The line's gross and net price base quantities (BT-149), or their units (BT-150), differ.", line);
  for (const d of f.tmp.supportingDocs) {
    if (d.names > 1) emit("BR-TMP-4", `A supporting document (BG-24) has ${d.names} descriptions (BT-123); at most one is allowed.`, d.loc);
    if (d.attachments > 1) emit("BR-TMP-5", `A supporting document (BG-24) has ${d.attachments} attached files (BT-125); at most one is allowed.`, d.loc);
  }
  for (const d of f.tmp.badDates) {
    if (ubl) emit("BR-TMP-6", `Date "${normalizeSpace(d.text)}" is not written as YYYY-MM-DD.`, d.loc, { actual: d.text, expected: "YYYY-MM-DD" });
    else
      emit("BR-TMP-7", `Date "${normalizeSpace(d.text)}"${d.format === undefined ? " has no format attribute" : ` with format "${d.format}"`} is not written as format="102" YYYYMMDD.`, d.loc, {
        actual: d.text,
        expected: 'format="102", YYYYMMDD',
      });
  }
}
