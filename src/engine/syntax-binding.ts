// The CEN syntax-binding rules (UBL-SR, UBL-CR, CII-SR, CII-DT) whose official flag is fatal. They decide whether an
// invoice passes just as the business rules do (UBL-SR-08: one invoice period; CII-DT-037: a tax type code other than
// VAT), so the checker runs every one of them, read straight off the XML tree because they are about the XML itself.
// The warning-level ones (about 1,170 "should not be used" notes) stay out, except the six that KoSIT's XRechnung
// configuration makes errors (UBL-CR-646, CII-SR-452/453/454/465/466), which are reported as CEN's warnings
// everywhere and as errors in XRechnung (kosit-levels.ts); the coverage page says so.
//
// Each rule copies its official assert (CEN EN 16931 validation artefacts 1.3.17, EN16931-UBL/CII-validation.sch,
// patterns UBL-syntax and EN16931-CII-Syntax): the same context, the same element names in their own namespace, the
// same counting, string comparison as written. Within one official pattern a node is checked only by the first rule
// whose context matches it, which matters in CII: the four IDs of rule 21 (CII-DT-001…007) never reach the generic ID
// rule (CII-DT-101…104), every ram:TypeCode is taken by CII-DT-008/009 so CII-DT-010…012 never fire, and the header's
// AdditionalReferencedDocument is taken by a warning-only rule, so CII-DT-015…030 check every other referenced document
// (in 1.3.17; the 1.3.16 copy Peppol BIS 3.0.22 ships has no such rule, so there they check that one too).
// Pure: only the XML tree; the readers call it, and the rule texts live in rules-catalog.ts.
import type { XNode } from "./xml";

export interface SyntaxViolation {
  id: string;
  /** The element the official rule's context matched */
  node: XNode;
  /** What was found, for the report (counts, values) */
  detail?: string;
  /**
   * Set when only one CEN version has the rule this way: "1.3.17" (UBL-SR-57/58/59, CII-DT-105/106, CII-SR-495…497 and
   * UBL-SR-25 for a deliver-to party without a name, which 1.3.17 and Peppol BIS 3.1.0 add) or "1.3.16" (CII-SR-471,
   * which 1.3.17 drops, and CII-DT-015…030 on the header's AdditionalReferencedDocument, which 1.3.17 routes to a
   * warning-only rule). Peppol BIS 3.0.22 ships CEN 1.3.16, so its profile takes the "1.3.16" set.
   */
  cen?: CenVersion;
}
export type CenVersion = "1.3.16" | "1.3.17";
/** The rules whose verdict depends on the CEN version (see SyntaxViolation.cen) */
export const CEN_1317_ONLY = ["UBL-SR-57", "UBL-SR-58", "UBL-SR-59", "CII-DT-105", "CII-DT-106", "CII-SR-495", "CII-SR-496", "CII-SR-497"] as const;
export const CEN_1316_ONLY = ["CII-SR-471"] as const;

const NS = {
  cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
  cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
  rsm: "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100",
  ram: "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100",
  udt: "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100",
} as const;
type Prefix = keyof typeof NS;

/* ---------------------------------------------------------------- a small XPath subset over the tree */

const is = (n: XNode | null | undefined, qname: string): boolean => {
  if (!n) return false;
  const i = qname.indexOf(":");
  return n.ns === NS[qname.slice(0, i) as Prefix] && n.local === qname.slice(i + 1);
};
/** Child steps, every match at every step (XPath node-set semantics): "cac:Party/cac:PartyName/cbc:Name" */
function path(from: XNode | XNode[], p: string): XNode[] {
  let cur = Array.isArray(from) ? from : [from];
  for (const step of p.split("/")) cur = cur.flatMap((n) => n.children.filter((c) => is(c, step)));
  return cur;
}
const count = (n: XNode, p: string) => path(n, p).length;
const has = (n: XNode, p: string) => path(n, p).length > 0;
/** Every element below `root` (not root itself), document order */
function descendants(root: XNode): XNode[] {
  const out: XNode[] = [];
  const walk = (n: XNode) => {
    for (const c of n.children) {
      out.push(c);
      walk(c);
    }
  };
  walk(root);
  return out;
}
/** `//q`: every element of that name in the document */
const anywhere = (all: readonly XNode[], qname: string) => all.filter((n) => is(n, qname));
/** XPath string value of a leaf as written (whitespace kept) */
const sv = (n: XNode) => n.raw ?? n.text;
const attr = (n: XNode, name: string): string | undefined => (Object.prototype.hasOwnProperty.call(n.attrs, name) ? n.attrs[name] : undefined);
const hasAttr = (n: XNode, name: string) => attr(n, name) !== undefined;
/** XPath normalize-space(): space, tab, CR and LF collapsed */
const normalizeSpace = (s: string) => s.replace(/[ \t\r\n]+/g, " ").replace(/^ | $/g, "");
/** `cbc:ChargeIndicator = false()`: untyped values cast to xs:boolean; one that isn't a boolean is an error (no match) */
function indicatorMatches(n: XNode, want: boolean): boolean {
  const values = path(n, "cbc:ChargeIndicator").map((c) => normalizeSpace(sv(c)));
  const cast = values.map((v) => (v === "true" || v === "1" ? true : v === "false" || v === "0" ? false : undefined));
  if (cast.some((v) => v === undefined)) return false;
  return cast.some((v) => v === want);
}
/** The element's ancestry from the root matches these names exactly (an absolute XPath context) */
function absolute(n: XNode, qnames: readonly string[]): boolean {
  let cur: XNode | null = n;
  for (let i = qnames.length - 1; i >= 0; i--) {
    if (!is(cur, qnames[i]!)) return false;
    cur = cur!.parent;
  }
  return cur === null;
}
const CII = "rsm:CrossIndustryInvoice";
const SCTT = [CII, "rsm:SupplyChainTradeTransaction"] as const;
const LINE = [...SCTT, "ram:IncludedSupplyChainTradeLineItem"] as const;
const AGREEMENT = [...SCTT, "ram:ApplicableHeaderTradeAgreement"] as const;
const SETTLEMENT = [...SCTT, "ram:ApplicableHeaderTradeSettlement"] as const;

/* ---------------------------------------------------------------- UBL (pattern UBL-syntax) */

function ubl(root: XNode): SyntaxViolation[] {
  const out: SyntaxViolation[] = [];
  const fail = (id: string, node: XNode, detail?: string, cen?: CenVersion) =>
    out.push({ id, node, detail, ...(cen ?? ONLY_IN[id] ? { cen: cen ?? ONLY_IN[id] } : {}) });
  const atMost = (id: string, node: XNode, p: string, max = 1) => {
    const k = count(node, p);
    if (k > max) fail(id, node, `${k}× ${p}`);
  };
  const all = descendants(root);

  // The whole document (/ubl:Invoice | /cn:CreditNote)
  const objectRefs = path(root, "cac:AdditionalDocumentReference").filter((d) => path(d, "cbc:DocumentTypeCode").some((c) => sv(c) === "130"));
  const anyObjectRefs = anywhere(all, "cac:AdditionalDocumentReference").filter((d) => path(d, "cbc:DocumentTypeCode").some((c) => sv(c) === "130"));
  if (anyObjectRefs.some((d) => has(d, "cac:Attachment"))) fail("UBL-CR-666", root);
  if (anyObjectRefs.some((d) => has(d, "cbc:DocumentDescription"))) fail("UBL-CR-673", root);
  // A warning in CEN, reported as one, that KoSIT's XRechnung configuration makes an error (kosit-levels.ts)
  if (path(root, "cac:InvoiceLine/cac:SubInvoiceLine").length + path(root, "cac:CreditNoteLine/cac:SubInvoiceLine").length) fail("UBL-CR-646", root);
  atMost("UBL-SR-01", root, "cac:ContractDocumentReference/cbc:ID");
  atMost("UBL-SR-02", root, "cac:ReceiptDocumentReference/cbc:ID");
  atMost("UBL-SR-03", root, "cac:DespatchDocumentReference/cbc:ID");
  if (path(objectRefs, "cbc:ID").length > 1) fail("UBL-SR-04", root, `${path(objectRefs, "cbc:ID").length}× invoiced object identifier`);
  atMost("UBL-SR-05", root, "cac:PaymentTerms/cbc:Note");
  atMost("UBL-SR-08", root, "cac:InvoicePeriod");
  atMost("UBL-SR-09", root, "cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName");
  atMost("UBL-SR-10", root, "cac:AccountingSupplierParty/cac:Party/cac:PartyName/cbc:Name");
  atMost("UBL-SR-11", root, "cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:CompanyID");
  // PartyTaxScheme[cac:TaxScheme/upper-case(cbc:ID)='VAT'] / [… != 'VAT']: general comparisons, any tax scheme ID
  const schemeIds = (pts: XNode) => path(pts, "cac:TaxScheme/cbc:ID").map((c) => sv(c).toUpperCase());
  const vatIds = (party: string, vat: boolean) =>
    path(path(root, `${party}/cac:Party/cac:PartyTaxScheme`).filter((pts) => schemeIds(pts).some((s) => (s === "VAT") === vat)), "cbc:CompanyID").length;
  if (vatIds("cac:AccountingSupplierParty", true) > 1) fail("UBL-SR-12", root, `${vatIds("cac:AccountingSupplierParty", true)}× seller VAT identifier`);
  if (vatIds("cac:AccountingSupplierParty", false) > 1) fail("UBL-SR-13", root, `${vatIds("cac:AccountingSupplierParty", false)}× seller tax registration`);
  atMost("UBL-SR-14", root, "cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:CompanyLegalForm");
  atMost("UBL-SR-15", root, "cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName");
  atMost("UBL-SR-16", root, "cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID");
  atMost("UBL-SR-17", root, "cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:CompanyID");
  if (vatIds("cac:AccountingCustomerParty", true) > 1) fail("UBL-SR-18", root, `${vatIds("cac:AccountingCustomerParty", true)}× buyer VAT identifier`);
  atMost("UBL-SR-24", root, "cac:Delivery");
  const sepa = path(anywhere(all, "cac:PartyIdentification"), "cbc:ID").filter((c) => (attr(c, "schemeID") ?? "").toUpperCase() === "SEPA");
  if (sepa.length > 1) fail("UBL-SR-29", root, `${sepa.length}× SEPA creditor identifier`);
  atMost("UBL-SR-39", root, "cac:ProjectReference/cbc:ID");
  atMost("UBL-SR-40", root, "cac:AccountingCustomerParty/cac:Party/cac:PartyName/cbc:Name");
  const paymentIds = new Set(anywhere(all, "cbc:PaymentID").map(sv));
  if (paymentIds.size > 1) fail("UBL-SR-44", root, [...paymentIds].map((v) => JSON.stringify(v)).join(", "));
  atMost("UBL-SR-45", root, "cac:PaymentMeans/cbc:PaymentDueDate");
  const meansNames = path(root, "cac:PaymentMeans/cbc:PaymentMeansCode").filter((c) => hasAttr(c, "name")).length;
  if (meansNames > 1) fail("UBL-SR-46", root, `${meansNames}× payment means text`);
  const meansCodes = new Set(anywhere(all, "cbc:PaymentMeansCode").map(sv));
  if (meansCodes.size > 1) fail("UBL-SR-47", root, [...meansCodes].map((v) => JSON.stringify(v)).join(", "));
  atMost("UBL-SR-49", root, "cac:InvoicePeriod/cbc:DescriptionCode");
  atMost("UBL-SR-54", root, "cac:PaymentMeans/cac:CardAccount");
  atMost("UBL-SR-55", root, "cac:PaymentMeans/cac:PaymentMandate");
  atMost("UBL-SR-56", root, "cac:OriginatorDocumentReference/cbc:ID");
  const legal = ["cac:AccountingSupplierParty/cac:Party", "cac:AccountingCustomerParty/cac:Party", "cac:PayeeParty", "cac:TaxRepresentativeParty"]
    .map((p) => [p, count(root, `${p}/cac:PartyLegalEntity`)] as const)
    .filter(([, k]) => k > 1);
  if (legal.length) fail("UBL-SR-57", root, legal.map(([p, k]) => `${k}× cac:PartyLegalEntity in ${p.split("/")[0]}`).join(", "));

  const supplierName = path(root, "cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName").map(sv);
  for (const n of all) {
    if (is(n, "cac:PostalAddress") || is(n, "cac:Address")) {
      // not(cac:AddressLine) or count(cac:AddressLine) = 1
      atMost("UBL-SR-51", n, "cac:AddressLine");
    } else if (is(n, "cac:Party") && is(n.parent, "cac:AccountingSupplierParty")) atMost("UBL-SR-42", n, "cac:PartyTaxScheme", 2);
    else if (is(n, "cac:AdditionalDocumentReference")) {
      atMost("UBL-SR-33", n, "cbc:DocumentDescription");
      const codes = path(n, "cbc:DocumentTypeCode").map(sv);
      const ok =
        codes.includes("130") ||
        (root.local === "CreditNote" && codes.includes("50")) ||
        (!path(n, "cbc:ID").some((c) => hasAttr(c, "schemeID")) && codes.length === 0);
      if (!ok) fail("UBL-SR-43", n);
    } else if (is(n, "cac:Delivery")) {
      // 1.3.17: exactly one name when there is a deliver-to party; 1.3.16 (Peppol BIS 3.0.22): at most one
      const names = count(n, "cac:DeliveryParty/cac:PartyName/cbc:Name");
      if (names > 1) fail("UBL-SR-25", n, `${names}× deliver-to party name`);
      else if (names === 0 && has(n, "cac:DeliveryParty")) fail("UBL-SR-25", n, "0× deliver-to party name", "1.3.17");
    } else if (is(n, "cac:AllowanceCharge")) {
      // two rules in this order: an allowance (indicator false) first, then a charge
      if (indicatorMatches(n, false)) atMost("UBL-SR-30", n, "cbc:AllowanceChargeReason");
      else if (indicatorMatches(n, true)) atMost("UBL-SR-31", n, "cbc:AllowanceChargeReason");
    } else if (is(n, "cac:PartyTaxScheme")) {
      if (!has(n, "cac:TaxScheme/cbc:ID") || !has(n, "cbc:CompanyID")) fail("UBL-SR-53", n);
    } else if (is(n, "cac:InvoiceLine") || is(n, "cac:CreditNoteLine")) {
      atMost("UBL-SR-34", n, "cbc:Note");
      atMost("UBL-SR-35", n, "cac:OrderLineReference/cbc:LineID");
      atMost("UBL-SR-36", n, "cac:InvoicePeriod");
      atMost("UBL-SR-37", n, "cac:Price/cac:AllowanceCharge/cbc:Amount");
      const cats = count(n, "cac:Item/cac:ClassifiedTaxCategory");
      if (cats !== 1) fail("UBL-SR-48", n, `${cats}× cac:ClassifiedTaxCategory`);
      atMost("UBL-SR-50", n, "cac:Item/cbc:Description");
      atMost("UBL-SR-52", n, "cac:DocumentReference");
    } else if (is(n, "cac:PayeeParty")) {
      // (count(…) <= 1) and ((cac:PartyName/cbc:Name) != (../cac:AccountingSupplierParty/…/cbc:RegistrationName)):
      // the general comparison is false when either side is empty or every pair is equal, so all three fail then
      const names = path(n, "cac:PartyName/cbc:Name").map(sv);
      const seller = n.parent ? path(n.parent, "cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName").map(sv) : supplierName;
      const differs = names.some((a) => seller.some((b) => a !== b));
      const ids = path(n, "cac:PartyIdentification/cbc:ID").filter((c) => (attr(c, "schemeID") ?? "").toUpperCase() !== "SEPA").length;
      if (!(names.length <= 1 && differs)) fail("UBL-SR-19", n, differs ? `${names.length}× payee name` : "payee name missing or equal to the seller name");
      if (!(ids <= 1 && differs)) fail("UBL-SR-20", n, differs ? `${ids}× payee identifier` : "payee name missing or equal to the seller name");
      const legalIds = count(n, "cac:PartyLegalEntity/cbc:CompanyID");
      if (!(legalIds <= 1 && differs)) fail("UBL-SR-21", n, differs ? `${legalIds}× payee legal registration identifier` : "payee name missing or equal to the seller name");
    } else if (is(n, "cac:PaymentMeans")) {
      atMost("UBL-SR-26", n, "cbc:PaymentID");
      atMost("UBL-SR-27", n, "cbc:PaymentMeansCode");
      atMost("UBL-SR-28", n, "cac:PaymentMandate/cbc:ID");
      if (has(n, "cac:PayeeFinancialAccount/cac:FinancialInstitutionBranch") && count(n, "cac:PayeeFinancialAccount/cac:FinancialInstitutionBranch/cbc:ID") !== 1)
        fail("UBL-SR-58", n, `${count(n, "cac:PayeeFinancialAccount/cac:FinancialInstitutionBranch/cbc:ID")}× branch identifier`);
      if (has(n, "cac:PayeeFinancialAccount") && count(n, "cac:PayeeFinancialAccount/cbc:ID") !== 1) fail("UBL-SR-59", n, `${count(n, "cac:PayeeFinancialAccount/cbc:ID")}× account identifier`);
    } else if (is(n, "cac:BillingReference")) {
      atMost("UBL-SR-06", n, "cac:InvoiceDocumentReference");
      if (!has(n, "cac:InvoiceDocumentReference/cbc:ID")) fail("UBL-SR-07", n);
    } else if (is(n, "cac:TaxRepresentativeParty")) {
      atMost("UBL-SR-22", n, "cac:PartyName/cbc:Name");
      atMost("UBL-SR-23", n, "cac:PartyTaxScheme/cbc:CompanyID");
    } else if (is(n, "cac:TaxSubtotal")) atMost("UBL-SR-32", n, "cac:TaxCategory/cbc:TaxExemptionReason");
  }
  return out;
}

/* ---------------------------------------------------------------- CII (pattern EN16931-CII-Syntax) */

const REFERENCED_DOCUMENT_ELEMENTS: [id: string, child: string, allowed?: (n: XNode) => boolean][] = (() => {
  const ard = (n: XNode, ...codes: string[]) => is(n, "ram:AdditionalReferencedDocument") && path(n, "ram:TypeCode").some((c) => codes.includes(sv(c)));
  return [
    ["CII-DT-015", "ram:URIID", (n) => ard(n, "916")],
    ["CII-DT-016", "ram:StatusCode"],
    ["CII-DT-017", "ram:CopyIndicator"],
    ["CII-DT-018", "ram:TypeCode", (n) => ard(n, "50", "130", "916")],
    ["CII-DT-019", "ram:GlobalID"],
    ["CII-DT-020", "ram:RevisionID"],
    ["CII-DT-021", "ram:Name", (n) => ard(n, "916")],
    ["CII-DT-022", "ram:AttachmentBinaryObject", (n) => ard(n, "916")],
    ["CII-DT-023", "ram:Information"],
    ["CII-DT-024", "ram:ReferenceTypeCode", (n) => ard(n, "130")],
    ["CII-DT-025", "ram:SectionName"],
    ["CII-DT-026", "ram:PreviousRevisionID"],
    ["CII-DT-027", "ram:FormattedIssueDateTime", (n) => is(n, "ram:InvoiceReferencedDocument")],
    ["CII-DT-028", "ram:EffectiveSpecifiedPeriod"],
    ["CII-DT-029", "ram:IssuerTradeParty"],
    ["CII-DT-030", "ram:AttachedSpecifiedBinaryFile"],
  ];
})();
const BILLING_PERIOD_ELEMENTS: [string, string][] = [
  ["CII-DT-068", "ram:StartDateTime/udt:DateTime"],
  ["CII-DT-069", "ram:DurationMeasure"],
  ["CII-DT-070", "ram:InclusiveIndicator"],
  ["CII-DT-071", "ram:Description"],
  ["CII-DT-072", "ram:EndDateTime/udt:DateTime"],
  ["CII-DT-073", "ram:CompleteDateTime"],
  ["CII-DT-074", "ram:OpenIndicator"],
  ["CII-DT-075", "ram:SeasonCode"],
  ["CII-DT-076", "ram:ID"],
  ["CII-DT-077", "ram:Name"],
  ["CII-DT-078", "ram:SequenceNumeric"],
  ["CII-DT-079", "ram:StartDateFlexibilityCode"],
  ["CII-DT-080", "ram:ContinuousIndicator"],
  ["CII-DT-081", "ram:PurposeCode"],
];
const POSTAL_ADDRESS_ELEMENTS: [string, string][] = [
  ["CII-DT-082", "ram:ID"],
  ["CII-DT-083", "ram:PostOfficeBox"],
  ["CII-DT-084", "ram:BuildingName"],
  ["CII-DT-086", "ram:LineFour"],
  ["CII-DT-087", "ram:LineFive"],
  ["CII-DT-088", "ram:StreetName"],
  ["CII-DT-089", "ram:CitySubDivisionName"],
  ["CII-DT-090", "ram:CountryName"],
  ["CII-DT-091", "ram:CountrySubDivisionID"],
  ["CII-DT-092", "ram:AttentionOf"],
  ["CII-DT-093", "ram:CareOf"],
  ["CII-DT-094", "ram:BuildingNumber"],
  ["CII-DT-095", "ram:DepartmentName"],
  ["CII-DT-096", "ram:AdditionalStreetName"],
];
const MONETARY_SUMMATION_ELEMENTS: [string, string][] = [
  ["CII-SR-477", "ram:LineTotalAmount"],
  ["CII-SR-478", "ram:ChargeTotalAmount"],
  ["CII-SR-479", "ram:AllowanceTotalAmount"],
  ["CII-SR-480", "ram:TaxBasisTotalAmount"],
  ["CII-SR-481", "ram:RoundingAmount"],
  ["CII-SR-482", "ram:GrandTotalAmount"],
  ["CII-SR-483", "ram:InformationAmount"],
  ["CII-SR-484", "ram:TotalPrepaidAmount"],
  ["CII-SR-485", "ram:TotalDiscountAmount"],
  ["CII-SR-486", "ram:TotalAllowanceChargeAmount"],
  ["CII-SR-487", "ram:DuePayableAmount"],
  ["CII-SR-488", "ram:RetailValueExcludingTaxInformationAmount"],
  ["CII-SR-489", "ram:TotalDepositFeeInformationAmount"],
  ["CII-SR-490", "ram:ProductValueExcludingTobaccoTaxInformationAmount"],
  ["CII-SR-491", "ram:TotalRetailValueInformationAmount"],
  ["CII-SR-492", "ram:GrossLineTotalAmount"],
  ["CII-SR-493", "ram:NetLineTotalAmount"],
  ["CII-SR-494", "ram:NetIncludingTaxesLineTotalAmount"],
];
/** CII-DT-001…007 on the four IDs of the official rule 21; the same attributes' first four on every other ram:*ID */
const SCHEME_ATTRIBUTES: [string, string][] = [
  ["CII-DT-001", "schemeName"],
  ["CII-DT-002", "schemeAgencyName"],
  ["CII-DT-003", "schemeDataURI"],
  ["CII-DT-004", "schemeURI"],
  ["CII-DT-005", "schemeID"],
  ["CII-DT-006", "schemeAgencyID"],
  ["CII-DT-007", "schemeVersionID"],
];
const ID_ATTRIBUTES: [string, string][] = [
  ["CII-DT-101", "schemeName"],
  ["CII-DT-102", "schemeAgencyName"],
  ["CII-DT-103", "schemeDataURI"],
  ["CII-DT-104", "schemeURI"],
];
/** XPath's \d matches every Unicode decimal digit and \s only space, tab, CR and LF */
const DATE_102 = /^[ \t\r\n]*(\p{Nd}{4})(1[0-2]|0[1-9])(3[01]|[12][0-9]|0[1-9])[ \t\r\n]*$/u;

function cii(root: XNode): SyntaxViolation[] {
  const out: SyntaxViolation[] = [];
  const fail = (id: string, node: XNode, detail?: string, cen?: CenVersion) =>
    out.push({ id, node, detail, ...(cen ?? ONLY_IN[id] ? { cen: cen ?? ONLY_IN[id] } : {}) });
  const atMost = (id: string, node: XNode, p: string, max = 1) => {
    const k = count(node, p);
    if (k > max) fail(id, node, `${k}× ${p}`);
  };
  const exactly = (id: string, node: XNode, p: string) => {
    const k = count(node, p);
    if (k !== 1) fail(id, node, `${k}× ${p}`);
  };
  const notAllowed = (id: string, node: XNode, p: string) => {
    if (has(node, p)) fail(id, node, p);
  };
  const noAttr = (id: string, node: XNode, a: string) => {
    if (hasAttr(node, a)) fail(id, node, `@${a}="${attr(node, a)}"`);
  };
  if (!is(root, CII)) return out;
  const all = descendants(root);
  const billedUnit = path(root, "rsm:SupplyChainTradeTransaction/ram:IncludedSupplyChainTradeLineItem/ram:SpecifiedLineTradeDelivery/ram:BilledQuantity").some((q) => hasAttr(q, "unitCode"));
  const endsWith = (n: XNode, suffix: string) => n.name.endsWith(suffix);
  const ram = (n: XNode) => n.ns === NS.ram;

  // The document (rule 18)
  noAttr("CII-DT-013", root, "languageID");
  noAttr("CII-DT-014", root, "languageLocaleID");
  const sameAsFirst = (id: string, child: string) => {
    const values = path(anywhere(all, "ram:SpecifiedTradeSettlementPaymentMeans"), child).map((c) => normalizeSpace(sv(c)));
    if (values.some((v) => v !== values[0])) fail(id, root, [...new Set(values)].map((v) => JSON.stringify(v)).join(", "));
  };
  sameAsFirst("CII-SR-467", "ram:TypeCode");
  sameAsFirst("CII-SR-468", "ram:Information");
  const refs = path(anywhere(all, "ram:ApplicableHeaderTradeSettlement"), "ram:PaymentReference").length;
  if (refs > 1) fail("CII-SR-469", root, `${refs}× ram:PaymentReference`);
  const cards = path(anywhere(all, "ram:SpecifiedTradeSettlementPaymentMeans"), "ram:ApplicableTradeSettlementFinancialCard").length;
  if (cards > 1) fail("CII-SR-495", root, `${cards}× ram:ApplicableTradeSettlementFinancialCard`);
  const debtors = path(anywhere(all, "ram:SpecifiedTradeSettlementPaymentMeans"), "ram:PayerPartyDebtorFinancialAccount").length;
  if (debtors > 1) fail("CII-SR-496", root, `${debtors}× ram:PayerPartyDebtorFinancialAccount`);
  // Warnings in CEN, reported as such, that KoSIT's XRechnung configuration makes errors (kosit-levels.ts). Their
  // contexts are absolute paths that no earlier rule of the pattern takes; 1.3.16 and 1.3.17 test them the same way.
  for (const s of path(root, "rsm:SupplyChainTradeTransaction/ram:IncludedSupplyChainTradeLineItem/ram:SpecifiedLineTradeSettlement"))
    exactly("CII-SR-454", s, "ram:ApplicableTradeTax");
  for (const a of path(root, "rsm:SupplyChainTradeTransaction/ram:ApplicableHeaderTradeAgreement"))
    for (const [id, party] of [["CII-SR-465", "ram:SellerTradeParty"], ["CII-SR-466", "ram:BuyerTradeParty"]] as const)
      if (has(a, `${party}/ram:DefinedTradeContact/ram:PersonName`) && has(a, `${party}/ram:DefinedTradeContact/ram:DepartmentName`)) fail(id, a);
  for (const s of path(root, "rsm:SupplyChainTradeTransaction/ram:ApplicableHeaderTradeSettlement")) {
    atMost("CII-SR-452", s, "ram:SpecifiedTradePaymentTerms");
    atMost("CII-SR-453", s, "ram:SpecifiedTradePaymentTerms/ram:Description");
  }

  for (const n of all) {
    // rules 0–20: fixed contexts (rule 0 and the warning-only rules check nothing fatal here, but they take their nodes)
    if (is(n, "ram:SpecifiedTradeSettlementPaymentMeans")) continue;
    if (absolute(n, [CII, "rsm:ExchangedDocumentContext"])) {
      exactly("CII-SR-009", n, "ram:GuidelineSpecifiedDocumentContextParameter");
      exactly("CII-SR-010", n, "ram:GuidelineSpecifiedDocumentContextParameter/ram:ID");
      continue;
    }
    if (absolute(n, [CII, "rsm:ExchangedDocument"])) {
      exactly("CII-SR-014", n, "ram:TypeCode");
      continue;
    }
    if (absolute(n, [CII, "rsm:ExchangedDocument", "ram:IncludedNote"]) || absolute(n, [...LINE, "ram:AssociatedDocumentLineDocument"])) continue;
    if (absolute(n, [...LINE, "ram:SpecifiedTradeProduct"])) {
      if (has(n, "ram:GlobalID") && !path(n, "ram:GlobalID").some((g) => hasAttr(g, "schemeID"))) fail("CII-SR-046", n);
      if (has(n, "ram:OriginTradeCountry") && count(n, "ram:OriginTradeCountry/ram:ID") !== 1) fail("CII-SR-090", n, `${count(n, "ram:OriginTradeCountry/ram:ID")}× ram:OriginTradeCountry/ram:ID`);
      continue;
    }
    if (absolute(n, [...LINE, "ram:SpecifiedTradeProduct", "ram:ApplicableProductCharacteristic"])) {
      exactly("CII-SR-069", n, "ram:Description");
      exactly("CII-SR-072", n, "ram:Value");
      continue;
    }
    if (absolute(n, [...LINE, "ram:SpecifiedLineTradeAgreement"])) {
      exactly("CII-SR-439", n, "ram:NetPriceProductTradePrice/ram:ChargeAmount");
      atMost("CII-SR-441", n, "ram:NetPriceProductTradePrice/ram:ChargeAmount");
      continue;
    }
    if (is(n, "ram:SpecifiedTradeAllowanceCharge")) {
      if (!has(n, "ram:ChargeIndicator")) fail("CII-SR-463", n);
      atMost("CII-SR-471", n, "ram:RateApplicablePercent");
      atMost("CII-SR-472", n, "ram:CategoryTradeTax");
      atMost("CII-SR-473", n, "ram:ActualAmount");
      continue;
    }
    if (is(n, "ram:AppliedTradeAllowanceCharge") && is(n.parent, "ram:GrossPriceProductTradePrice")) {
      atMost("CII-SR-440", n, "ram:ActualAmount");
      continue;
    }
    if (absolute(n, [...AGREEMENT, "ram:AdditionalReferencedDocument"])) {
      // 1.3.17 takes the header AdditionalReferencedDocument with a warning-only rule (CII-SR-475/476); the 1.3.16 copy
      // Peppol BIS 3.0.22 ships has no such rule, so there it reaches the generic referenced-document rule (CII-DT-015…030)
      for (const [id, child, allowed] of REFERENCED_DOCUMENT_ELEMENTS) if (has(n, child) && !allowed?.(n)) fail(id, n, child, "1.3.16");
      continue;
    }
    if (
      absolute(n, [...LINE, "ram:SpecifiedLineTradeDelivery"]) ||
      absolute(n, [...LINE, "ram:SpecifiedLineTradeSettlement"]) ||
      absolute(n, [...SCTT, "ram:ApplicableHeaderTradeDelivery"])
    )
      continue;
    if (absolute(n, AGREEMENT)) {
      atMost("CII-SR-455", n, "ram:SellerTradeParty/ram:DefinedTradeContact");
      atMost("CII-SR-456", n, "ram:BuyerTradeParty/ram:DefinedTradeContact");
      atMost("CII-SR-459", n, "ram:SellerTradeParty/ram:URIUniversalCommunication");
      atMost("CII-SR-460", n, "ram:BuyerTradeParty/ram:URIUniversalCommunication");
      continue;
    }
    if (absolute(n, SETTLEMENT)) {
      atMost("CII-SR-461", n, "ram:ApplicableTradeTax/ram:TaxPointDate");
      const dueCodes = path(anywhere(all, "ram:ApplicableTradeTax"), "ram:DueDateTypeCode").map(sv);
      if (dueCodes.length && new Set(dueCodes).size !== 1) fail("CII-SR-462", n, [...new Set(dueCodes)].map((v) => JSON.stringify(v)).join(", "));
      // normalize-space(ram:TypeCode) of a means with two type codes is an error in the official files (no verdict)
      const bad = path(n, "ram:SpecifiedTradeSettlementPaymentMeans").filter((pm) => {
        const types = path(pm, "ram:TypeCode").map((c) => normalizeSpace(sv(c)));
        const code = types[0] ?? "";
        return (code === "30" || code === "58") && !has(pm, "ram:PayeePartyCreditorFinancialAccount/ram:IBANID") && !has(pm, "ram:PayeePartyCreditorFinancialAccount/ram:ProprietaryID");
      });
      if (bad.length) fail("CII-SR-470", n, `${bad.length}× credit transfer without IBAN or proprietary account ID`);
      atMost("CII-SR-497", n, "ram:SpecifiedTradePaymentTerms/ram:DirectDebitMandateID");
      continue;
    }
    if (absolute(n, [...SETTLEMENT, "ram:SpecifiedTradeSettlementHeaderMonetarySummation"])) {
      for (const [id, child] of MONETARY_SUMMATION_ELEMENTS) atMost(id, n, child);
      continue;
    }
    if (endsWith(n, "DocumentContextParameter")) continue;
    if (absolute(n, [...AGREEMENT, "ram:AdditionalReferencedDocument", "ram:AttachmentBinaryObject"])) {
      if (!hasAttr(n, "mimeCode")) fail("CII-DT-105", n);
      if (!hasAttr(n, "filename")) fail("CII-DT-106", n);
      continue;
    }
    // rule 21: four IDs with every scheme attribute forbidden
    if (
      absolute(n, [CII, "rsm:ExchangedDocumentContext", "ram:GuidelineSpecifiedDocumentContextParameter", "ram:ID"]) ||
      absolute(n, [CII, "rsm:ExchangedDocument", "ram:ID"]) ||
      absolute(n, [...LINE, "ram:AssociatedDocumentLineDocument", "ram:LineID"]) ||
      absolute(n, [...LINE, "ram:SpecifiedTradeProduct", "ram:SellerAssignedID"])
    ) {
      for (const [id, a] of SCHEME_ATTRIBUTES) noAttr(id, n, a);
      continue;
    }
    if (!ram(n)) {
      // rule 32 is the only later context outside ram:
      if (is(n, "udt:DateTimeString") && attr(n, "format") === "102" && !DATE_102.test(sv(n))) fail("CII-DT-097", n, JSON.stringify(sv(n)));
      continue;
    }
    if (endsWith(n, "ID")) {
      for (const [id, a] of ID_ATTRIBUTES) noAttr(id, n, a);
      continue;
    }
    if (n.local === "TypeCode") {
      // rule 23 takes every ram:TypeCode, so rule 24 (CII-DT-010…012 on the document's type code) never runs
      noAttr("CII-DT-008", n, "name");
      noAttr("CII-DT-009", n, "listURI");
      continue;
    }
    if (absolute(n, [...LINE, "ram:SpecifiedLineTradeSettlement", "ram:ApplicableTradeTax", "ram:CategoryCode"])) continue;
    if (endsWith(n, "ReferencedDocument")) {
      for (const [id, child, allowed] of REFERENCED_DOCUMENT_ELEMENTS) if (has(n, child) && !allowed?.(n)) fail(id, n, child);
      continue;
    }
    if (endsWith(n, "Amount") && n.local !== "TaxTotalAmount") {
      noAttr("CII-DT-031", n, "currencyID");
      noAttr("CII-DT-032", n, "currencyCodeListVersionID");
      continue;
    }
    if (endsWith(n, "Quantity")) {
      if (hasAttr(n, "unitCode") && !billedUnit) fail("CII-DT-033", n, `@unitCode="${attr(n, "unitCode")}"`);
      noAttr("CII-DT-034", n, "unitCodeListID");
      noAttr("CII-DT-035", n, "unitCodeListAgencyID");
      noAttr("CII-DT-036", n, "unitCodeListAgencyName");
      continue;
    }
    if (endsWith(n, "TradeTax")) {
      const types = path(n, "ram:TypeCode").map(sv);
      if (types.length && !types.includes("VAT")) fail("CII-DT-037", n, types.map((t) => JSON.stringify(t)).join(", "));
      continue;
    }
    if (n.local === "BillingSpecifiedPeriod") {
      for (const [id, child] of BILLING_PERIOD_ELEMENTS) notAllowed(id, n, child);
      continue;
    }
    if (n.local === "PostalTradeAddress") for (const [id, child] of POSTAL_ADDRESS_ELEMENTS) notAllowed(id, n, child);
  }
  return out;
}

/** Every fatal syntax-binding violation in a UBL Invoice / CreditNote or a CII CrossIndustryInvoice. */
const ONLY_IN: Record<string, CenVersion> = {
  ...Object.fromEntries(CEN_1317_ONLY.map((id) => [id, "1.3.17"])),
  ...Object.fromEntries(CEN_1316_ONLY.map((id) => [id, "1.3.16"])),
};
/** Every violation of both CEN versions; filter with `forCen` for one of them. */
export function syntaxBindingViolations(root: XNode, syntax: "UBL" | "CII"): SyntaxViolation[] {
  return syntax === "UBL" ? ubl(root) : cii(root);
}
/** The violations one CEN version reports */
export const forCen = <T extends { cen?: CenVersion }>(vs: readonly T[], cen: CenVersion): T[] => vs.filter((v) => !v.cen || v.cen === cen);
