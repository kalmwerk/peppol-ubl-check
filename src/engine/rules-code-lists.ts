import { CEN_VATEX_CODES, CII_DUE_DATE_TYPE_CODES, EAS_CODES, ICD_CODES, UBL_VAT_DATE_CODES, UNTDID_4451_CODES, UNTDID_4451_TEXT } from "./codes";
import type { CodedKind, CodedValue, InvoiceModel } from "./model";
import { normSpace, type Emit } from "./rules-vat-categories";

/**
 * The CEN code-list and payment rules the official unit tests leave untested (BR-CL-06, -08, -10, -21, -22,
 * -26, BR-50, BR-B-01, BR-B-02) and Peppol's PEPPOL-EN16931-CL006, written as the official Schematron
 * (CEN 1.3.17, Peppol BIS 3.0.22) tests them, from the values collectCodedValues gathers wherever they sit.
 */

/** `not(contains(normalize-space(.), ' ')) and contains(' A B … ', concat(' ', normalize-space(.), ' '))` */
const listed = (set: ReadonlySet<string>, raw: string) => {
  const v = normSpace(raw);
  return !v.includes(" ") && set.has(v);
};
const shown = (raw: string) => (normSpace(raw) === "" ? "(empty)" : `"${normSpace(raw)}"`);

export function codeListRules(m: InvoiceModel, emit: Emit, peppol: boolean): void {
  const cii = m.syntax === "CII";
  const values = m.codedValues ?? [];
  const of = (kind: CodedKind): CodedValue[] => values.filter((v) => v.kind === kind);

  // BR-CL-06: UBL's VAT point date code (InvoicePeriod/DescriptionCode, UNTDID 2005 subset), CII's due date type code (UNTDID 2475 subset)
  for (const c of of(cii ? "dueDateTypeCode" : "periodDescriptionCode")) {
    if (listed(cii ? CII_DUE_DATE_TYPE_CODES : UBL_VAT_DATE_CODES, c.value)) continue;
    const expected = cii ? "5, 29 or 72" : "3, 35 or 432";
    emit("BR-CL-06", `${c.owner} VAT point date code (BT-8) ${shown(c.value)} is not ${expected}.`, c.loc, { actual: normSpace(c.value), expected });
  }
  // PEPPOL-EN16931-CL006 (UBL only): the same code, against Peppol's copy of the list
  if (peppol && !cii)
    for (const c of of("periodDescriptionCode")) {
      if (UBL_VAT_DATE_CODES.has(normSpace(c.value))) continue;
      emit("PEPPOL-EN16931-CL006", `${c.owner} VAT point date code (BT-8) ${shown(c.value)} is not 3, 35 or 432 (UNCL 2005).`, c.loc, {
        actual: normSpace(c.value),
        expected: "3, 35 or 432",
      });
    }

  // BR-CL-08: an invoice note's subject code (UBL: "#CODE#" at the start of a note under the root; CII: ram:SubjectCode)
  if (cii) {
    for (const c of of("subjectCode")) {
      if (listed(UNTDID_4451_CODES, c.value)) continue;
      emit("BR-CL-08", `Invoice note subject code (BT-21) ${shown(c.value)} is not a UNTDID 4451 code.`, c.loc, { actual: normSpace(c.value), expected: "AAI, SUR, REG, ABL, TXD …" });
    }
  } else {
    for (const c of of("rootNote")) {
      const first = c.value.indexOf("#");
      if (first < 0) continue;
      const rest = c.value.slice(first + 1);
      const second = rest.indexOf("#");
      const code = second < 0 ? "" : rest.slice(0, second);
      // Only a three-character code between the first two # is tested, by XPath contains() on the written-out list
      if ([...code].length !== 3 || UNTDID_4451_TEXT.includes(code)) continue;
      emit("BR-CL-08", `Invoice note subject code (BT-21) "#${code}#" is not a UNTDID 4451 code.`, c.loc, { actual: code, expected: "AAI, SUR, REG, ABL, TXD …" });
    }
  }

  // BR-CL-10 / BR-CL-21 / BR-CL-26: identifier schemes from ISO/IEC 6523 (UBL also accepts SEPA for seller and payee IDs)
  const ICD: { kind: CodedKind; id: string; what: string }[] = [
    { kind: "partyIdScheme", id: "BR-CL-10", what: cii ? "global identifier" : "party identifier" },
    { kind: "itemIdScheme", id: "BR-CL-21", what: "item standard identifier (BT-157)" },
    { kind: "deliveryIdScheme", id: "BR-CL-26", what: "deliver-to location identifier (BT-71)" },
  ];
  for (const { kind, id, what } of ICD)
    for (const c of of(kind)) {
      if (listed(ICD_CODES, c.value)) continue;
      if (kind === "partyIdScheme" && !cii && c.sellerOrPayee && normSpace(c.value) === "SEPA") continue;
      emit(id, `${c.owner} ${what} scheme ${shown(c.value)} is not an ISO/IEC 6523 ICD code.`, c.loc, {
        actual: normSpace(c.value),
        expected: kind === "partyIdScheme" && !cii ? "an ICD code such as 0088 (GLN), or SEPA for the seller or payee" : "an ICD code such as 0088 (GLN) or 0160 (GTIN)",
      });
    }

  // BR-CL-11: legal registration identifier schemes (UBL PartyLegalEntity/CompanyID; CII every ram:ID with a
  // schemeID outside a tax registration, party identifiers included) from ISO/IEC 6523
  for (const c of of("legalIdScheme")) {
    if (listed(ICD_CODES, c.value)) continue;
    emit("BR-CL-11", `${c.owner} ${cii ? "identifier" : "legal registration number"} scheme ${shown(c.value)} is not an ISO/IEC 6523 ICD code.`, c.loc, {
      actual: normSpace(c.value),
      expected: "an ICD code such as 0208 (Belgian enterprise number) or 0106 (KvK)",
    });
  }
  // BR-CL-25: every electronic address scheme (UBL EndpointID, CII URIUniversalCommunication/URIID) from the EAS list
  const EAS = new Set(Object.keys(EAS_CODES));
  for (const c of of("endpointScheme")) {
    if (listed(EAS, c.value)) continue;
    emit("BR-CL-25", `${c.owner} electronic address scheme ${shown(c.value)} is not in the EAS code list.`, c.loc, {
      actual: normSpace(c.value),
      expected: "0208, 9925, 0088 …",
    });
  }

  // BR-CL-22: VAT exemption reason codes from the VATEX list, compared in upper case
  for (const c of of("exemptionCode")) {
    const v = normSpace(c.value);
    if (!v.includes(" ") && CEN_VATEX_CODES.has(normSpace(c.value.toUpperCase()))) continue;
    emit("BR-CL-22", `${c.owner} VAT exemption reason code ${shown(c.value)} is not a VATEX code.`, c.loc, { actual: v, expected: "VATEX-EU-AE, VATEX-EU-IC, VATEX-EU-G …" });
  }

  // BR-50: a credit transfer's payee account needs its identifier (UBL cbc:ID; CII IBAN or proprietary ID)
  for (const c of of("creditTransferAccount")) {
    if (c.value !== "") continue;
    emit("BR-50", "A credit transfer (payment means 30 or 58) has a payee account without an account identifier (BT-84).", c.loc);
  }

  // BR-B-01 / BR-B-02: Italian split payment (category B) — only on Italian invoices, and never next to standard rate
  const hasCode = (kinds: CodedKind[], code: string, docLevelOnly = false) =>
    values.some((v) => kinds.includes(v.kind) && v.value === code && (!docLevelOnly || v.kind !== "taxCategory" || v.docLevel));
  const splitPayment = cii ? hasCode(["categoryCode"], "B") : hasCode(["taxCategory", "itemTaxCategory"], "B");
  if (splitPayment) {
    const foreign = values.find((v) => v.kind === (cii ? "country" : "identificationCode") && v.value !== "IT");
    if (foreign)
      emit("BR-B-01", `The invoice uses VAT category B (split payment), which is for Italian invoices only, but it has country code ${shown(foreign.value)}.`, foreign.loc, {
        actual: normSpace(foreign.value),
        expected: "IT",
      });
  }
  const splitAtDoc = cii ? splitPayment : hasCode(["taxCategory", "itemTaxCategory"], "B", true);
  const standard = cii ? hasCode(["categoryCode"], "S") : hasCode(["taxCategory", "itemTaxCategory"], "S", true);
  if (splitAtDoc && standard)
    emit("BR-B-02", "The invoice uses both VAT category B (split payment) and S (standard rated); a split-payment invoice can't contain standard-rated items.", values.find((v) => (v.kind === "taxCategory" || v.kind === "itemTaxCategory" || v.kind === "categoryCode") && v.value === "S")?.loc);
}
