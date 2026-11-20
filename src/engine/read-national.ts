import type { KositPeppolFacts, Loc, NlciusFacts, NlDiscouragedRule, Syntax, XrechnungFacts, XrechnungTmpFacts } from "./model";
import type { ReadCtx } from "./read-utils";
import { kids as childrenNamed, type XNode } from "./xml";
import { normalizeSpace, xmlTrim } from "./xpath-text";

/**
 * Reads what the SI-UBL 2.0 / NLCIUS and XRechnung rules look at, the way the official Schematron files do:
 * contexts are element patterns that match wherever the element sits, presence counts whether the element is
 * filled or not, and text is kept as written for the tests that compare it exactly. The rules themselves are
 * in rules-national.ts; this module only collects (see NlciusFacts and XrechnungFacts in model.ts).
 */

/* ---------- XPath-style helpers on the tree (the UBL and CII namespaces, matched like the official steps) ---------- */

/**
 * The namespaces the official contexts and steps name: UBL's document, aggregate and basic components (`ubl:`/`cn:`,
 * `cac:`, `cbc:`) and CII's (`rsm:`, `ram:`, `udt:`, `qdt:`). An element of any other namespace never matches a step,
 * even with the same local name (a `TaxCurrencyCode` of an extension's own namespace inside a UBL extension, say),
 * while a UBL element inside an extension does, as in the official patterns.
 */
const INVOICE_NS = new Set([
  "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
  "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2",
  "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
  "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
  "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100",
  "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100",
  "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100",
  "urn:un:unece:uncefact:data:standard:QualifiedDataType:100",
]);
/** The element is the invoice-namespace element with this local name (see INVOICE_NS). */
const is = (n: XNode | null | undefined, local: string): boolean => !!n && n.local === local && INVOICE_NS.has(n.ns);
/** The invoice-namespace children with this local name (an XPath child step `cbc:X` / `ram:X`). */
const kids = (n: XNode | null | undefined, local: string): XNode[] => childrenNamed(n, local).filter((c) => INVOICE_NS.has(c.ns));

/** Text exactly as written (the tree trims; `raw` keeps the original when trimming changed it). */
const exact = (n: XNode | null | undefined): string => (n ? (n.raw ?? n.text) : "");
/** XPath normalize-space() of an element's text. */
const norm = (n: XNode | null | undefined): string => normalizeSpace(exact(n));
/** `[boolean(normalize-space(.))]`: the element has text after normalize-space(). */
const filled = (n: XNode) => norm(n) !== "";
/**
 * The XPath string value: a leaf's text as written; an element with children, its own text and its
 * descendants' in document order (only BR-DE-16's CII `CategoryTradeTax = 'VAT'` reads it on such an element).
 */
const stringValue = (n: XNode): string => (n.children.length ? n.text + n.children.map(stringValue).join("") : exact(n));

/** A relative location path of child steps, fanning out at every step like XPath (`a/b/c`). */
function path(from: XNode | XNode[] | null | undefined, steps: string): XNode[] {
  let cur: XNode[] = from ? (Array.isArray(from) ? from : [from]) : [];
  for (const step of steps.split("/")) cur = cur.flatMap((n) => kids(n, step));
  return cur;
}
/** Every element of the document in document order, the root included. */
function everyElement(root: XNode): XNode[] {
  const out: XNode[] = [];
  const stack = [root];
  while (stack.length) {
    const n = stack.pop()!;
    out.push(n);
    for (let i = n.children.length - 1; i >= 0; i--) stack.push(n.children[i]!);
  }
  return out;
}
/** True when the element matches the XSLT pattern `a/b/c`: its local name is the last step and its ancestors the ones before. */
function matches(n: XNode, pattern: string): boolean {
  const steps = pattern.split("/");
  let cur: XNode | null = n;
  for (let i = steps.length - 1; i >= 0; i--) {
    if (!cur || !is(cur, steps[i]!)) return false;
    cur = cur.parent;
  }
  return true;
}
/** A pattern rooted at the document element (`/*\/a/b`): the first step must be a child of the root. */
function matchesFromRoot(n: XNode, pattern: string, root: XNode): boolean {
  if (!matches(n, pattern)) return false;
  let top: XNode = n;
  for (let i = pattern.split("/").length - 1; i > 0; i--) top = top.parent!;
  return top.parent === root;
}
/** `contains(concat(' ', string-join(@schemeID, ' '), ' '), ' CODE ')` for 0106 or 0190. */
export const kvkOrOinToken = (schemes: string[]) => {
  const joined = ` ${schemes.join(" ")} `;
  return joined.includes(" 0106 ") || joined.includes(" 0190 ");
};
const schemesOf = (nodes: XNode[]) => nodes.map((n) => n.attrs["schemeID"]).filter((s): s is string => s !== undefined);
const isEmptyLeaf = (n: XNode) => n.children.length === 0 && normalizeSpace(exact(n)) === "";

/* ------------------------------------------- NLCIUS ------------------------------------------- */

const NLCIUS_MARK = "#compliant#urn:fdc:nen.nl:nlcius:v1.0";
const GACCOUNT_MARK = "#conformant#urn:fdc:nen.nl:gaccount:v1.0";
const NLCIUS_ID = "urn:cen.eu:en16931:2017#compliant#urn:fdc:nen.nl:nlcius:v1.0";
const NLCIUS_GACCOUNT_ID = `${NLCIUS_ID}#conformant#urn:fdc:nen.nl:gaccount:v1.0`;

/** The four addresses BR-NL-27/28 look at, per syntax. */
const UBL_ADDRESSES = [
  "AccountingSupplierParty/Party/PostalAddress",
  "AccountingCustomerParty/Party/PostalAddress",
  "TaxRepresentativeParty/PostalAddress",
  "Delivery/DeliveryLocation/Address",
];
const CII_ADDRESSES = [
  "SellerTradeParty/PostalTradeAddress",
  "BuyerTradeParty/PostalTradeAddress",
  "SellerTaxRepresentativeTradeParty/PostalTradeAddress",
  "ShipToTradeParty/PostalTradeAddress",
];

/**
 * The official discouraged-element rules (`test="false"`), each with the element patterns of its context, in
 * the order of the official pattern. UBL BR-NL-29 fires only when PaymentMeansCode carries a name attribute.
 */
const UBL_DISCOURAGED: [NlDiscouragedRule, string[]][] = [
  ["BR-NL-19", ["TaxCurrencyCode"]],
  ["BR-NL-20", ["TaxPointDate"]],
  ["BR-NL-21", ["InvoicePeriod/DescriptionCode"]],
  ["BR-NL-24", ["BillingReference/InvoiceDocumentReference/IssueDate"]],
  ["BR-NL-26", ["AccountingSupplierParty/Party/PartyLegalEntity/CompanyLegalForm"]],
  ["BR-NL-27", UBL_ADDRESSES.map((a) => `${a}/AddressLine/Line`)],
  ["BR-NL-28", UBL_ADDRESSES.map((a) => `${a}/CountrySubentity`)],
  ["BR-NL-30", ["PaymentMeans/PayeeFinancialAccount/Name"]],
  ["BR-NL-32", ["AllowanceCharge/AllowanceChargeReasonCode"]],
  ["BR-NL-35", ["TaxTotal/TaxSubtotal/TaxCategory/TaxExemptionReasonCode"]],
];
const CII_DISCOURAGED: [NlDiscouragedRule, string[]][] = [
  ["BR-NL-19", ["TaxCurrencyCode"]],
  ["BR-NL-20", ["TaxPointDate/DateString"]],
  ["BR-NL-21", ["DueDateTypeCode"]],
  ["BR-NL-22", ["SubjectCode"]],
  ["BR-NL-23", ["BusinessProcessSpecifiedDocumentContextParameter/ID"]],
  ["BR-NL-24", ["InvoiceReferencedDocument/FormattedIssueDateTime/DateTimeString"]],
  ["BR-NL-26", ["SellerTradeParty/Description"]],
  ["BR-NL-27", CII_ADDRESSES.map((a) => `${a}/LineThree`)],
  ["BR-NL-28", CII_ADDRESSES.map((a) => `${a}/CountrySubDivisionName`)],
  ["BR-NL-29", ["SpecifiedTradeSettlementPaymentMeans/Information"]],
  ["BR-NL-30", ["PayeePartyCreditorFinancialAccount/AccountName"]],
  ["BR-NL-32", ["SpecifiedTradeAllowanceCharge/ReasonCode"]],
  ["BR-NL-35", ["ApplicableTradeTax/ExemptionReasonCode"]],
];

/**
 * Every rule context of the official NLCIUS pattern other than the empty-element check, by the predicate it
 * carries ($s: Dutch supplier, $si: any SI-UBL supplier). Within one Schematron pattern an element is checked
 * by the first rule whose context matches, so the empty-element check never sees these elements while the
 * predicate holds (an empty InvoiceTypeCode is a BR-NL-7 error, not an empty-element warning).
 */
const UBL_S_CONTEXTS = [
  "AccountingSupplierParty/Party",
  "AccountingSupplierParty/Party/PostalAddress",
  "AccountingCustomerParty/Party/PostalAddress",
  "TaxRepresentativeParty/PostalAddress",
  "InvoiceTypeCode",
  "CreditNoteTypeCode",
  "AccountingCustomerParty/Party/PartyLegalEntity",
  "PaymentMeans",
  "AccountingSupplierParty/Party/PartyTaxScheme",
  "PaymentMeans/PaymentMeansCode",
  "TaxTotal/TaxAmount",
  ...UBL_DISCOURAGED.flatMap(([, p]) => p),
];
const CII_S_CONTEXTS = [
  "SellerTradeParty/SpecifiedLegalOrganization",
  "ApplicableHeaderTradeAgreement",
  "SellerTradeParty/PostalTradeAddress",
  "BuyerTradeParty/PostalTradeAddress",
  "SellerTaxRepresentativeTradeParty/PostalTradeAddress",
  "BuyerTradeParty",
  "SpecifiedTradeSettlementHeaderMonetarySummation",
  "SpecifiedTradeSettlementPaymentMeans",
  "SellerTradeParty/SpecifiedTaxRegistration",
  "SpecifiedTradeSettlementHeaderMonetarySummation/TaxTotalAmount",
  ...CII_DISCOURAGED.flatMap(([, p]) => p),
];

function readNlcius(root: XNode, ctx: ReadCtx, syntax: Syntax, els: XNode[]): NlciusFacts {
  const ubl = syntax === "UBL";
  const loc = (n: XNode) => ctx.loc(n);
  const where = (pattern: string) => els.filter((n) => matches(n, pattern));

  // $si and $s
  const spec = ubl ? norm(kids(root, "CustomizationID")[0]) : norm(path(root, "ExchangedDocumentContext/GuidelineSpecifiedDocumentContextParameter/ID")[0]);
  const declared = ubl ? spec.includes(NLCIUS_MARK) || spec.includes(GACCOUNT_MARK) : spec === NLCIUS_ID || spec === NLCIUS_GACCOUNT_ID;
  // CII: `if (//ram:ApplicableHeaderTradeAgreement/ram:SellerTradeParty/…/ram:CountryID) then upper-case(normalize-space(//ram:SellerTradeParty/…/ram:CountryID))`
  const sellerCountry = ubl
    ? path(root, "AccountingSupplierParty/Party/PostalAddress/Country/IdentificationCode")[0]
    : els.some((n) => matches(n, "ApplicableHeaderTradeAgreement/SellerTradeParty/PostalTradeAddress/CountryID"))
      ? els.find((n) => matches(n, "SellerTradeParty/PostalTradeAddress/CountryID"))
      : undefined;
  const dutchSupplier = declared && !!sellerCountry && norm(sellerCountry).toUpperCase() === "NL";

  const customizationIds = ubl ? els.filter((n) => is(n, "CustomizationID")).map((n) => ({ value: norm(n), loc: loc(n) })) : [];

  // BR-NL-1
  const sellerLegal = (ubl ? where("AccountingSupplierParty/Party") : where("SellerTradeParty/SpecifiedLegalOrganization")).map((c) => {
    const ids = ubl ? path(c, "PartyLegalEntity/CompanyID") : kids(c, "ID");
    const first = ids[0];
    return {
      loc: loc(first ?? c),
      schemes: schemesOf(ids),
      filled: ids.some((i) => norm(i) !== ""),
      idLoc: first ? loc(first) : undefined,
      id: first ? exact(first) : undefined,
      scheme: first?.attrs["schemeID"],
    };
  });

  // BR-NL-2
  const references = (ubl ? [root] : where("ApplicableHeaderTradeAgreement")).map((c) => ({
    loc: loc(c),
    given: ubl
      ? kids(c, "BuyerReference").length > 0 || path(c, "OrderReference/ID").length > 0
      : kids(c, "BuyerReference").length > 0 || path(c, "BuyerOrderReferencedDocument/IssuerAssignedID").length > 0,
  }));

  // BR-NL-3/4/5
  const parts = ubl ? ["StreetName", "CityName", "PostalZone"] : ["LineOne", "CityName", "PostcodeCode"];
  const partNames = ["street name", "city", "post code"];
  const addressOf = (party: "seller" | "buyer" | "taxRepresentative", pattern: string) =>
    where(pattern).map((a) => ({
      party,
      loc: loc(a),
      countryNotNl: path(a, ubl ? "Country/IdentificationCode" : "CountryID").some((c) => exact(c) !== "NL"),
      missing: parts.flatMap((p, i) => (kids(a, p).length ? [] : [partNames[i]!])),
    }));
  const addresses = ubl
    ? [
        ...addressOf("seller", "AccountingSupplierParty/Party/PostalAddress"),
        ...addressOf("buyer", "AccountingCustomerParty/Party/PostalAddress"),
        ...addressOf("taxRepresentative", "TaxRepresentativeParty/PostalAddress"),
      ]
    : [
        ...addressOf("seller", "SellerTradeParty/PostalTradeAddress"),
        ...addressOf("buyer", "BuyerTradeParty/PostalTradeAddress"),
        ...addressOf("taxRepresentative", "SellerTaxRepresentativeTradeParty/PostalTradeAddress"),
      ];

  // BR-NL-7/8/9
  const typeCodes = (ubl
    ? els.filter((n) => is(n, "InvoiceTypeCode") || is(n, "CreditNoteTypeCode"))
    : path(root, "ExchangedDocument/TypeCode")
  ).map((n) => ({ text: stringValue(n), loc: loc(n) }));
  const invoiceReferenceGiven = ubl && path(root, "BillingReference/InvoiceDocumentReference/ID").length > 0;

  // BR-NL-10
  const customerCountryNl = (nodes: XNode[]) => nodes.some((c) => exact(c) === "NL");
  const buyerLegal = ubl
    ? where("AccountingCustomerParty/Party/PartyLegalEntity").map((ple) => {
        const ids = kids(ple, "CompanyID");
        return {
          loc: loc(ple),
          countryNl: customerCountryNl(where("AccountingCustomerParty/Party/PostalAddress/Country/IdentificationCode")),
          schemes: schemesOf(where("AccountingCustomerParty/Party/PartyLegalEntity/CompanyID")),
          ids: ids.length,
          filled: ids.some((i) => norm(i) !== ""),
          idRequired: false,
        };
      })
    : els
        .filter((n) => is(n, "BuyerTradeParty"))
        .map((btp) => {
          const ids = path(btp, "SpecifiedLegalOrganization/ID");
          return {
            loc: loc(btp),
            countryNl: customerCountryNl(path(btp, "PostalTradeAddress/CountryID")),
            schemes: schemesOf(ids),
            ids: ids.length,
            filled: ids.some((i) => norm(i) !== ""),
            idRequired: true,
          };
        });

  // BR-NL-11
  const totals = ubl
    ? root.local === "Invoice"
      ? kids(root, "LegalMonetaryTotal").map((t) => ({
          loc: loc(kids(t, "PayableAmount")[0] ?? t),
          payable: kids(t, "PayableAmount")[0] ? exact(kids(t, "PayableAmount")[0]) : undefined,
          paymentGiven: els.some((n) => is(n, "PaymentMeans")),
        }))
      : []
    : els
        .filter((n) => is(n, "SpecifiedTradeSettlementHeaderMonetarySummation"))
        .map((t) => ({
          loc: loc(kids(t, "DuePayableAmount")[0] ?? t),
          payable: kids(t, "DuePayableAmount")[0] ? exact(kids(t, "DuePayableAmount")[0]) : undefined,
          paymentGiven: path(t.parent, "SpecifiedTradeSettlementPaymentMeans/TypeCode").length > 0,
        }));
  const creditNoteType = !ubl && declared && path(root, "ExchangedDocument/TypeCode").some((n) => xsDouble(stringValue(n)) === 381);

  // BR-NL-12 / BR-NL-31
  const paymentMeans = els
    .filter((n) => is(n, ubl ? "PaymentMeans" : "SpecifiedTradeSettlementPaymentMeans"))
    .map((pm) => {
      const codes = kids(pm, ubl ? "PaymentMeansCode" : "TypeCode");
      const branch = ubl ? path(pm, "PayeeFinancialAccount/FinancialInstitutionBranch/ID")[0] : undefined;
      return { loc: loc(pm), codes: codes.map(stringValue), codeLoc: codes[0] ? loc(codes[0]) : undefined, branchIdGiven: !!branch, branchLoc: branch ? loc(branch) : undefined };
    });

  // BR-NL-13
  const orderLineRefs = where(ubl ? "OrderLineReference/LineID" : "BuyerOrderReferencedDocument/LineID").map((n) => ({ loc: loc(n), text: exact(n) }));
  const orderReferenceGiven = ubl
    ? path(root, "OrderReference/ID").length > 0
    : els.some((n) => matches(n, "ApplicableHeaderTradeAgreement/BuyerOrderReferencedDocument/IssuerAssignedID"));

  // BR-NL-25
  const sellerTaxSchemes = ubl
    ? where("AccountingSupplierParty/Party/PartyTaxScheme").map((pts) => ({
        loc: loc(kids(pts, "CompanyID")[0] ?? pts),
        hasId: kids(pts, "CompanyID").length > 0,
        vat: path(pts, "TaxScheme/ID").some((i) => exact(i) === "VAT"),
        id: kids(pts, "CompanyID")[0] ? exact(kids(pts, "CompanyID")[0]) : undefined,
      }))
    : where("SellerTradeParty/SpecifiedTaxRegistration").map((reg) => ({
        loc: loc(kids(reg, "ID")[0] ?? reg),
        hasId: kids(reg, "ID").length > 0,
        vat: kids(reg, "ID").some((i) => i.attrs["schemeID"] === "VA"),
        id: kids(reg, "ID")[0] ? exact(kids(reg, "ID")[0]) : undefined,
      }));

  // BR-NL-33
  const documentCurrencies = els.filter((n) => is(n, "DocumentCurrencyCode")).map(stringValue);
  const taxTotalCurrencies = ubl
    ? where("TaxTotal/TaxAmount").map((a) => ({ loc: loc(a), currency: a.attrs["currencyID"], documentCurrencies }))
    : where("SpecifiedTradeSettlementHeaderMonetarySummation/TaxTotalAmount").map((a) => ({
        loc: loc(a),
        currency: a.attrs["currencyID"],
        documentCurrencies: kids(a.parent?.parent, "InvoiceCurrencyCode").map(stringValue),
      }));

  // BR-NL-19 … BR-NL-35 (discouraged elements)
  const discouraged: NlciusFacts["discouraged"] = [];
  for (const n of els) {
    for (const [rule, patterns] of ubl ? UBL_DISCOURAGED : CII_DISCOURAGED) {
      if (!patterns.some((p) => matches(n, p))) continue;
      discouraged.push({
        rule,
        loc: loc(n),
        value: exact(n),
        charge: !ubl && rule === "BR-NL-32" ? normalizeSpace(exact(path(n.parent, "ChargeIndicator/Indicator")[0])).toLowerCase() === "true" : undefined,
      });
      break;
    }
    // UBL BR-NL-29: cac:PaymentMeans/cbc:PaymentMeansCode with a name attribute
    if (ubl && matches(n, "PaymentMeans/PaymentMeansCode") && n.attrs["name"] !== undefined)
      discouraged.push({ rule: "BR-NL-29", loc: loc(n), value: n.attrs["name"] });
  }

  // SI-UBL-2 / empty-element-check, with the contexts that take an element first
  const sContexts = ubl ? UBL_S_CONTEXTS : CII_S_CONTEXTS;
  const legalTotals = (n: XNode) => ubl && root.local === "Invoice" && is(n, "LegalMonetaryTotal") && n.parent === root;
  const siContext = (n: XNode) =>
    ubl ? matches(n, "OrderLineReference/LineID") : matches(n, "BuyerOrderReferencedDocument/LineID") || matchesFromRoot(n, "ExchangedDocument/TypeCode", root);
  const emptyElements = els
    .filter((n) => n !== root && isEmptyLeaf(n))
    .map((n) => ({
      loc: loc(n),
      shadowedBy: sContexts.some((p) => matches(n, p)) || legalTotals(n) ? ("s" as const) : siContext(n) ? ("si" as const) : undefined,
    }));

  return {
    declared,
    dutchSupplier,
    customizationIds,
    sellerLegal,
    references,
    addresses,
    typeCodes,
    invoiceReferenceGiven,
    buyerLegal,
    totals,
    creditNoteType,
    paymentMeans,
    orderLineRefs,
    orderReferenceGiven,
    sellerTaxSchemes,
    taxTotalCurrencies,
    discouraged,
    emptyElements,
  };
}

/**
 * XPath's cast of untyped text to xs:double, as a general comparison with a number does it (`ram:TypeCode = 380`):
 * surrounding XML whitespace is allowed, anything that isn't a double literal fails the cast (undefined).
 */
export function xsDouble(text: string): number | undefined {
  const t = xmlTrim(text);
  if (t === "INF" || t === "+INF") return Infinity;
  if (t === "-INF") return -Infinity;
  if (t === "NaN") return Number.NaN;
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(t)) return undefined;
  return Number(t);
}
/** XPath's cast of text to xs:decimal (`xs:decimal(cbc:PayableAmount)`); undefined when the cast fails. */
export function xsDecimal(text: string): number | undefined {
  const t = xmlTrim(text);
  return /^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(t) ? Number(t) : undefined;
}

/* ------------------------------------------ XRechnung ------------------------------------------ */

const UBL_CBC_NS = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2";
const UBL_CAC_NS = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2";
const XR_VAT_CODES = new Set(["S", "Z", "E", "AE", "K", "G", "L", "M"]);
const CII_UDT_NS = "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100";
const CII_QDT_NS = "urn:un:unece:uncefact:data:standard:QualifiedDataType:100";
const UBL_TMP_DATES = new Set(["IssueDate", "DueDate", "StartDate", "EndDate", "ActualDeliveryDate", "TaxPointDate", "PaymentDueDate"]);
// XPath's \d is any Unicode decimal digit
const XS_DATE = /^\p{Nd}{4}-\p{Nd}{2}-\p{Nd}{2}$/u;
const CII_DATE = /^\p{Nd}{8}$/u;
/** text(): the element's own text, without that of child elements */
const directText = (n: XNode): string => (n.children.length ? n.text : exact(n));

function readXrechnung(root: XNode, ctx: ReadCtx, syntax: Syntax, els: XNode[]): XrechnungFacts {
  const ubl = syntax === "UBL";
  const loc = (n: XNode) => ctx.loc(n);
  const fromRoot = (pattern: string) => els.filter((n) => matchesFromRoot(n, pattern, root));
  const tx = ubl ? [root] : kids(root, "SupplyChainTradeTransaction");
  const settlement = path(tx, "ApplicableHeaderTradeSettlement");
  const agreement = path(tx, "ApplicableHeaderTradeAgreement");

  // BR-DE-16: the VAT category codes the official test reads, exactly as written
  let vatCodeUsed: string | undefined;
  let sellerTaxIdGiven: boolean;
  if (ubl) {
    const docAc = kids(root, "AllowanceCharge");
    const indicator = (ac: XNode) => kids(ac, "ChargeIndicator").map(stringValue);
    const acIds = (want: string) => docAc.filter((ac) => indicator(ac).includes(want)).flatMap((ac) => path(ac, "TaxCategory/ID"));
    const lineIds = path(root.children.filter((c) => is(c, "InvoiceLine") || is(c, "CreditNoteLine")), "Item/ClassifiedTaxCategory/ID");
    vatCodeUsed = [...acIds("false"), ...acIds("true"), ...lineIds].map(stringValue).find((c) => XR_VAT_CODES.has(c));
    sellerTaxIdGiven =
      kids(root, "TaxRepresentativeParty").length > 0 || path(root, "AccountingSupplierParty/Party/PartyTaxScheme/CompanyID").some(filled);
  } else {
    const lineTax = path(tx, "IncludedSupplyChainTradeLineItem/SpecifiedLineTradeSettlement/ApplicableTradeTax");
    const lineVat = path(lineTax, "TypeCode").some((n) => stringValue(n) === "VAT");
    const lineCode = path(lineTax, "CategoryCode").map(stringValue).find((c) => XR_VAT_CODES.has(c));
    const acTax = path(settlement, "SpecifiedTradeAllowanceCharge/CategoryTradeTax");
    const acVat = acTax.some((n) => stringValue(n) === "VAT");
    const acCode = path(acTax, "CategoryCode").map(stringValue).find((c) => XR_VAT_CODES.has(c));
    vatCodeUsed = lineVat && lineCode ? lineCode : acVat && acCode ? acCode : undefined;
    sellerTaxIdGiven =
      path(agreement, "SellerTaxRepresentativeTradeParty").length > 0 ||
      path(agreement, "SellerTradeParty/SpecifiedTaxRegistration/ID").some((n) => {
        const s = normalizeSpace(n.attrs["schemeID"]);
        return (s === "VA" || s === "FC") && filled(n);
      });
  }

  // BR-DE-17 / BR-DE-26
  const typeCodes = (ubl ? [...kids(root, "InvoiceTypeCode"), ...kids(root, "CreditNoteTypeCode")] : path(root, "ExchangedDocument/TypeCode")).map(norm);
  const invoiceReferenceGiven = ubl ? path(root, "BillingReference/InvoiceDocumentReference").length > 0 : path(settlement, "InvoiceReferencedDocument").length > 0;

  // BR-DE-18
  const notes = ubl
    ? kids(root, "PaymentTerms").flatMap((t) => kids(t, "Note").slice(0, 1))
    : path(settlement, "SpecifiedTradePaymentTerms").flatMap((t) => kids(t, "Description").slice(0, 1));
  const paymentTermsNote = notes[0] ? { text: stringValue(notes[0]), loc: loc(notes[0]) } : undefined;

  // BR-DE-21
  const specContext = ubl ? root : kids(root, "ExchangedDocumentContext")[0];
  const specIds = specContext
    ? { values: (ubl ? kids(root, "CustomizationID") : path(specContext, "GuidelineSpecifiedDocumentContextParameter/ID")).map(stringValue), loc: loc((ubl ? kids(root, "CustomizationID")[0] : path(specContext, "GuidelineSpecifiedDocumentContextParameter/ID")[0]) ?? specContext) }
    : undefined;

  // BR-DE-22: a filename that a preceding sibling attachment already has (UBL root references, CII every one)
  let duplicateFilename: string | undefined;
  const docs = ubl ? kids(root, "AdditionalDocumentReference") : els.filter((n) => is(n, "AdditionalReferencedDocument"));
  const fileNames = (d: XNode) =>
    path(d, ubl ? "Attachment/EmbeddedDocumentBinaryObject" : "AttachmentBinaryObject")
      .map((b) => b.attrs["filename"])
      .filter((f): f is string => f !== undefined);
  for (const d of docs) {
    const before = (d.parent?.children ?? []).slice(0, d.parent!.children.indexOf(d)).filter((s) => s.local === d.local && s.ns === d.ns).flatMap(fileNames);
    const dup = fileNames(d).find((f) => before.includes(f));
    if (dup !== undefined) {
      duplicateFilename = dup;
      break;
    }
  }

  // BR-DE-30/31
  const pmNodes = ubl ? kids(root, "PaymentMeans") : path(settlement, "SpecifiedTradeSettlementPaymentMeans");
  const bt89 = path(settlement, "SpecifiedTradePaymentTerms/DirectDebitMandateID").length > 0;
  const bt90 = path(settlement, "CreditorReferenceID").length > 0;
  const directDebit = ubl
    ? {
        mandate: path(pmNodes, "PaymentMandate").length > 0,
        creditorId: [...path(root, "AccountingSupplierParty/Party/PartyIdentification/ID"), ...path(root, "PayeeParty/PartyIdentification/ID")].some(
          (i) => i.attrs["schemeID"] === "SEPA",
        ),
        debitedAccount: path(pmNodes, "PaymentMandate/PayerFinancialAccount/ID").length > 0,
      }
    : { mandate: bt89, creditorId: bt90, debitedAccount: path(pmNodes, "PayerPartyDebtorFinancialAccount/IBANID").length > 0 };

  // BR-DE-2
  const sellers = (ubl ? fromRoot("AccountingSupplierParty") : fromRoot("SupplyChainTradeTransaction/ApplicableHeaderTradeAgreement/SellerTradeParty")).map((s) => ({
    loc: loc(s),
    contactGiven: (ubl ? path(s, "Party/Contact") : kids(s, "DefinedTradeContact")).length > 0,
  }));

  // BR-DE-3/4, 8/9, 10/11
  const cityPost = ubl ? ["CityName", "PostalZone"] : ["CityName", "PostcodeCode"];
  const addressOf = (party: "seller" | "buyer" | "delivery", pattern: string) =>
    fromRoot(pattern).map((a) => ({ party, loc: loc(a), cityFilled: kids(a, cityPost[0]!).some(filled), postcodeFilled: kids(a, cityPost[1]!).some(filled) }));
  const addresses = ubl
    ? [
        ...addressOf("seller", "AccountingSupplierParty/Party/PostalAddress"),
        ...addressOf("buyer", "AccountingCustomerParty/Party/PostalAddress"),
        ...addressOf("delivery", "Delivery/DeliveryLocation/Address"),
      ]
    : [
        ...addressOf("seller", "SupplyChainTradeTransaction/ApplicableHeaderTradeAgreement/SellerTradeParty/PostalTradeAddress"),
        ...addressOf("buyer", "SupplyChainTradeTransaction/ApplicableHeaderTradeAgreement/BuyerTradeParty/PostalTradeAddress"),
        ...addressOf("delivery", "SupplyChainTradeTransaction/ApplicableHeaderTradeDelivery/ShipToTradeParty/PostalTradeAddress"),
      ];

  // BR-DE-5/6/7/27/28
  const contacts = (ubl ? fromRoot("AccountingSupplierParty/Party/Contact") : fromRoot("SupplyChainTradeTransaction/ApplicableHeaderTradeAgreement/SellerTradeParty/DefinedTradeContact")).map((c) => {
    const names = ubl ? kids(c, "Name") : [...kids(c, "PersonName"), ...kids(c, "DepartmentName")];
    const phones = ubl ? kids(c, "Telephone") : path(c, "TelephoneUniversalCommunication/CompleteNumber");
    const emails = ubl ? kids(c, "ElectronicMail") : path(c, "EmailURIUniversalCommunication/URIID");
    return {
      loc: loc(c),
      nameFilled: names.some(filled),
      phoneFilled: phones.some(filled),
      emailFilled: emails.some(filled),
      phone: norm(phones[0]),
      email: norm(emails[0]),
      phoneLoc: phones[0] ? loc(phones[0]) : undefined,
      emailLoc: emails[0] ? loc(emails[0]) : undefined,
    };
  });

  // BR-DE-19/20/23/24/25
  const paymentMeans = pmNodes.map((pm) => {
    const payee = ubl ? path(pm, "PayeeFinancialAccount/ID")[0] : path(pm, "PayeePartyCreditorFinancialAccount/IBANID")[0];
    const payer = ubl ? path(pm, "PaymentMandate/PayerFinancialAccount/ID")[0] : path(pm, "PayerPartyDebtorFinancialAccount/IBANID")[0];
    return {
      loc: loc(pm),
      code: norm(kids(pm, ubl ? "PaymentMeansCode" : "TypeCode")[0]),
      creditTransfer: kids(pm, ubl ? "PayeeFinancialAccount" : "PayeePartyCreditorFinancialAccount").length > 0,
      card: kids(pm, ubl ? "CardAccount" : "ApplicableTradeSettlementFinancialCard").length > 0,
      directDebit: ubl ? kids(pm, "PaymentMandate").length > 0 : bt89 || bt90 || !!payer,
      institutions: !ubl && (kids(pm, "PayeeSpecifiedCreditorFinancialInstitution").length > 0 || kids(pm, "PayerSpecifiedDebtorFinancialInstitution").length > 0),
      payeeAccount: payee ? stringValue(payee) : "",
      payerAccount: payer ? stringValue(payer) : "",
      payeeLoc: payee ? loc(payee) : undefined,
      payerLoc: payer ? loc(payer) : undefined,
    };
  });

  // BR-DE-14
  const vatRates = (ubl ? fromRoot("TaxTotal/TaxSubtotal") : fromRoot("SupplyChainTradeTransaction/ApplicableHeaderTradeSettlement/ApplicableTradeTax")).map((t) => ({
    loc: loc(t),
    filled: path(t, ubl ? "TaxCategory/Percent" : "RateApplicablePercent").some(filled),
    category: norm(path(t, ubl ? "TaxCategory/ID" : "CategoryCode")[0]) || undefined,
  }));

  // BR-DE-TMP-32
  const lines = ubl ? root.children.filter((c) => is(c, "InvoiceLine") || is(c, "CreditNoteLine")) : path(tx, "IncludedSupplyChainTradeLineItem");
  const deliveryDateOrPeriod = ubl
    ? path(root, "Delivery/ActualDeliveryDate").length > 0 || kids(root, "InvoicePeriod").length > 0 || lines.every((l) => kids(l, "InvoicePeriod").length > 0)
    : path(tx, "ApplicableHeaderTradeDelivery/ActualDeliverySupplyChainEvent/OccurrenceDateTime").length > 0 ||
      path(settlement, "BillingSpecifiedPeriod").length > 0 ||
      lines.every((l) => path(l, "SpecifiedLineTradeSettlement/BillingSpecifiedPeriod").length > 0);

  // KoSIT's copies of Peppol rules: R008 with its own exceptions, the HUF slack, CII R044 / R046
  const decimals = (nodes: XNode[]) => nodes.map((n) => xsDecimal(stringValue(n)) ?? null);
  const kosit: KositPeppolFacts = {
    emptyElements: els
      .filter((n) => isEmptyLeaf(n))
      .filter((n) =>
        ubl
          ? !(is(n, "ID") && n.ns === UBL_CBC_NS && n.parent?.local === "OrderReference" && n.parent.ns === UBL_CAC_NS)
          : n.name !== "ram:ApplicableHeaderTradeDelivery",
      )
      .map(loc),
    huf: (ubl ? kids(root, "DocumentCurrencyCode") : path(settlement, "InvoiceCurrencyCode")).some((c) => stringValue(c) === "HUF"),
    grossPrices: ubl
      ? []
      : path(tx, "IncludedSupplyChainTradeLineItem/SpecifiedLineTradeAgreement/GrossPriceProductTradePrice").map((g) => ({
          loc: loc(g),
          actualGiven: path(g, "AppliedTradeAllowanceCharge/ActualAmount").length > 0,
          indicatorFalse: path(g, "AppliedTradeAllowanceCharge/ChargeIndicator/Indicator").some((i) => stringValue(i) === "false"),
          chargeAmounts: decimals(kids(g, "ChargeAmount")),
          netChargeAmounts: decimals(g.parent ? path(g.parent, "NetPriceProductTradePrice/ChargeAmount") : []),
          discounts: decimals(kids(g, "AppliedTradeAllowanceCharge").flatMap((ac) => kids(ac, "ActualAmount").slice(0, 1))),
        })),
  };

  // KoSIT's temporary rules (BR-TMP-2 … BR-TMP-7)
  const tmp: XrechnungTmpFacts = { externalUris: [], supportingDocs: [], baseQuantityMismatch: [], badDates: [] };
  if (ubl) {
    for (const ext of path(root, "AdditionalDocumentReference/Attachment/ExternalReference"))
      tmp.externalUris.push({ loc: loc(ext), uri: kids(ext, "URI")[0] ? stringValue(kids(ext, "URI")[0]!) : null });
    for (const d of els)
      if (d.ns === UBL_CBC_NS && UBL_TMP_DATES.has(d.local) && !XS_DATE.test(normalizeSpace(directText(d)))) tmp.badDates.push({ loc: loc(d), text: directText(d) });
  } else {
    for (const doc of path(agreement, "AdditionalReferencedDocument").filter((d) => kids(d, "TypeCode").some((t) => stringValue(t) === "916"))) {
      const uri = kids(doc, "URIID")[0];
      if (uri) tmp.externalUris.push({ loc: loc(uri), uri: stringValue(uri) });
      tmp.supportingDocs.push({ loc: loc(doc), names: kids(doc, "Name").length, attachments: kids(doc, "AttachmentBinaryObject").length });
    }
    for (const line of path(tx, "IncludedSupplyChainTradeLineItem")) {
      const gross = path(line, "SpecifiedLineTradeAgreement/GrossPriceProductTradePrice/BasisQuantity");
      const net = path(line, "SpecifiedLineTradeAgreement/NetPriceProductTradePrice/BasisQuantity");
      if (!gross.length || !net.length) continue;
      // XPath general comparisons of untyped values compare them as strings, any pair matching
      const same = (a: string[], b: string[]) => a.some((x) => b.includes(x));
      const units = (ns: XNode[]) => ns.map((n) => n.attrs["unitCode"]).filter((u): u is string => u !== undefined);
      const unitsOk = !(units(net).length && units(gross).length) || same(units(gross), units(net));
      if (!(same(gross.map(stringValue), net.map(stringValue)) && unitsOk)) tmp.baseQuantityMismatch.push(loc(line));
    }
    for (const d of els) {
      const dated = (d.ns === CII_UDT_NS && (is(d, "DateTimeString") || is(d, "DateString"))) || (d.ns === CII_QDT_NS && is(d, "DateTimeString"));
      if (dated && !(normalizeSpace(d.attrs["format"]) === "102" && CII_DATE.test(normalizeSpace(directText(d)))))
        tmp.badDates.push({ loc: loc(d), text: directText(d), format: d.attrs["format"] });
    }
  }

  return {
    kosit,
    tmp,
    paymentMeansGiven: ubl ? kids(root, "PaymentMeans").length > 0 : pmNodes.length > 0,
    buyerReferenceFilled: (ubl ? kids(root, "BuyerReference") : path(agreement, "BuyerReference")).some(filled),
    vatCodeUsed,
    sellerTaxIdGiven,
    typeCodes: typeCodes.length ? typeCodes : [""],
    invoiceReferenceGiven,
    paymentTermsNote,
    specIds,
    duplicateFilename,
    directDebit,
    sellers,
    addresses,
    contacts,
    paymentMeans,
    vatRates,
    deliveryDateOrPeriod,
  };
}

/** The national facts of a document; readers call this once after building the rest of the model. */
export function readNationalFacts(root: XNode, ctx: ReadCtx, syntax: Syntax): { nlcius: NlciusFacts; xrechnung: XrechnungFacts } {
  const els = everyElement(root);
  return { nlcius: readNlcius(root, ctx, syntax, els), xrechnung: readXrechnung(root, ctx, syntax, els) };
}
