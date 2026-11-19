import type { CodedKind, CodedValue, Loc, LocMap, InvoiceModel, SchemeIdentifier } from "./model";
import { at, text, xpathOf, type XNode } from "./xml";
import { normalizeSpace, xmlTrim } from "./xpath-text";

export const DECIMAL_BTS = new Set([
  "BT-92",
  "BT-93",
  "BT-99",
  "BT-100",
  "BT-106",
  "BT-107",
  "BT-108",
  "BT-109",
  "BT-110",
  "BT-111",
  "BT-112",
  "BT-113",
  "BT-114",
  "BT-115",
  "BT-116",
  "BT-117",
  "BT-131",
  "BT-136",
  "BT-137",
  "BT-141",
  "BT-142",
]);

/** Shared reading context: tracks positions, decimals and type errors while mapping. */
export class ReadCtx {
  amountCurrencies: InvoiceModel["amountCurrencies"] = [];
  decimals: InvoiceModel["decimals"] = [];
  typeErrors: InvoiceModel["typeErrors"] = [];

  loc(node: XNode): Loc {
    const loc: Loc = { line: node.line, col: node.col, xpath: xpathOf(node) };
    if (node.raw !== undefined) loc.raw = node.raw;
    return loc;
  }

  /** Read a string and remember its location under `key` */
  str(node: XNode | null | undefined, path: string, locs: LocMap, key: string): string | undefined {
    const n = path ? at(node, path) : node;
    if (!n) return undefined;
    const v = text(n);
    locs[key] = this.loc(n);
    return v;
  }

  attr(node: XNode | null | undefined, path: string, name: string): string | undefined {
    const n = path ? at(node, path) : node;
    const raw = n?.attrs[name];
    const v = raw === undefined ? undefined : xmlTrim(raw);
    return v ? v : undefined;
  }

  num(
    node: XNode | null | undefined,
    path: string,
    locs: LocMap,
    key: string,
    bt: string,
    opts: { amount?: boolean } = {},
  ): number | undefined {
    const n = path ? at(node, path) : node;
    if (!n) return undefined;
    const loc = this.loc(n);
    locs[key] = loc;
    const raw = text(n);
    if (raw === undefined) return undefined;
    if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(raw)) {
      this.typeErrors.push({ bt, raw, expected: "a decimal number such as 1234.50", loc });
      return undefined;
    }
    if (opts.amount) {
      if (DECIMAL_BTS.has(bt)) this.decimals.push({ bt, raw, loc });
      const cur = n.attrs["currencyID"];
      this.amountCurrencies.push({ bt, currency: cur, loc });
    }
    return Number(raw);
  }

  /** ISO dates (UBL) */
  isoDate(node: XNode | null | undefined, path: string, locs: LocMap, key: string, bt: string) {
    const n = path ? at(node, path) : node;
    if (!n) return undefined;
    const loc = this.loc(n);
    locs[key] = loc;
    const raw = text(n);
    if (raw === undefined) return undefined;
    const m = /^(\d{4})-(\d{2})-(\d{2})(Z|[+-]\d{2}:\d{2})?$/.exec(raw);
    if (!m || !validYmd(m[1]!, m[2]!, m[3]!)) {
      this.typeErrors.push({ bt, raw, expected: "a date in YYYY-MM-DD format", loc });
      return undefined;
    }
    return `${m[1]}-${m[2]}-${m[3]}`;
  }

  /** CII udt:DateTimeString with format 102 (YYYYMMDD) */
  ciiDate(node: XNode | null | undefined, path: string, locs: LocMap, key: string, bt: string) {
    const holder = path ? at(node, path) : node;
    if (!holder) return undefined;
    const n =
      holder.children.find((c) => c.local === "DateTimeString" || c.local === "DateString") ??
      holder;
    const loc = this.loc(n);
    locs[key] = loc;
    const raw = text(n);
    if (raw === undefined) return undefined;
    const format = n.attrs["format"];
    const m = /^(\d{4})(\d{2})(\d{2})$/.exec(raw);
    if ((format && format !== "102") || !m || !validYmd(m[1]!, m[2]!, m[3]!)) {
      this.typeErrors.push({ bt, raw, expected: "a date in format 102 (YYYYMMDD)", loc });
      return undefined;
    }
    return `${m[1]}-${m[2]}-${m[3]}`;
  }
}

function validYmd(y: string, m: string, d: string) {
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return (
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() === Number(m) - 1 &&
    date.getUTCDate() === Number(d)
  );
}

export function collectEmptyElements(root: XNode, ctx: ReadCtx): Loc[] {
  const out: Loc[] = [];
  const visit = (n: XNode) => {
    // PEPPOL-EN16931-R008: //*[not(*) and not(normalize-space())] (a non-breaking space is not empty)
    if (n.children.length === 0 && n.text === "") out.push(ctx.loc(n));
    for (const c of n.children) visit(c);
  };
  visit(root);
  return out;
}

function walk(root: XNode, visit: (n: XNode) => void) {
  const stack = [root];
  while (stack.length) {
    const n = stack.pop()!;
    visit(n);
    for (let i = n.children.length - 1; i >= 0; i--) stack.push(n.children[i]!);
  }
}

/** The nearest ancestor (or the node itself) whose local name is in `owners`. */
function ownerOf(n: XNode, owners: Record<string, string>, fallback: string): string {
  for (let cur: XNode | null = n.parent; cur; cur = cur.parent) {
    const o = owners[cur.local];
    if (o) return o;
  }
  return fallback;
}

const UBL_CBC = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2";
const UBL_OWNERS: Record<string, string> = {
  AccountingSupplierParty: "Seller",
  AccountingCustomerParty: "Buyer",
  PayeeParty: "Payee",
  TaxRepresentativeParty: "Tax representative",
  DeliveryParty: "Deliver-to party",
  Item: "Item",
};

/**
 * Every UBL identifier the Peppol identifier rules look at: cbc:EndpointID, cac:PartyIdentification/cbc:ID
 * and cbc:CompanyID with a schemeID, anywhere in the document (PEPPOL-COMMON-R040/R043, CL008).
 */
export function collectUblSchemeIds(root: XNode, ctx: ReadCtx): SchemeIdentifier[] {
  const out: SchemeIdentifier[] = [];
  walk(root, (n) => {
    const scheme = n.attrs["schemeID"];
    if (scheme === undefined || n.ns !== UBL_CBC) return;
    const parent = n.parent?.local;
    let kind: string | undefined;
    if (n.local === "EndpointID") kind = "EndpointID";
    else if (n.local === "ID" && parent === "PartyIdentification") kind = "party identifier";
    else if (n.local === "CompanyID")
      kind =
        parent === "PartyLegalEntity"
          ? "legal registration number"
          : parent === "PartyTaxScheme"
            ? "tax registration number"
            : "CompanyID";
    if (!kind) return;
    const owner = ownerOf(n, UBL_OWNERS, n.parent?.local === "Party" ? "Party" : "Document");
    const grand = n.parent?.parent?.local;
    out.push({
      element: kind === "party identifier" ? "PartyIdentification/ID" : n.local,
      scheme,
      id: n.text,
      owner,
      kind,
      endpoint:
        n.local === "EndpointID" &&
        parent === "Party" &&
        (grand === "AccountingSupplierParty" || grand === "AccountingCustomerParty"),
      loc: ctx.loc(n),
    });
  });
  return out;
}

const CII_OWNERS: Record<string, string> = {
  SellerTradeParty: "Seller",
  BuyerTradeParty: "Buyer",
  PayeeTradeParty: "Payee",
  SellerTaxRepresentativeTradeParty: "Tax representative",
  ShipToTradeParty: "Deliver-to party",
  SpecifiedTradeProduct: "Item",
};

/** Every CII ram:URIID, ram:ID and ram:GlobalID with a schemeID, anywhere (PEPPOL-COMMON-R040/R043). */
export function collectCiiSchemeIds(root: XNode, ctx: ReadCtx): SchemeIdentifier[] {
  const out: SchemeIdentifier[] = [];
  walk(root, (n) => {
    const scheme = n.attrs["schemeID"];
    if (scheme === undefined || (n.local !== "URIID" && n.local !== "ID" && n.local !== "GlobalID")) return;
    const parent = n.parent?.local ?? "";
    const owner = ownerOf(n, CII_OWNERS, "Document");
    const kind =
      n.local === "URIID"
        ? parent === "URIUniversalCommunication"
          ? "electronic address"
          : "URIID"
        : n.local === "GlobalID"
          ? owner === "Item"
            ? "standard item identifier"
            : "global identifier"
          : parent === "SpecifiedLegalOrganization"
            ? "legal registration number"
            : parent === "SpecifiedTaxRegistration"
              ? "tax registration number"
              : CII_OWNERS[parent]
                ? "party identifier"
                : "ID";
    const partyNode = n.parent?.parent?.local;
    out.push({
      element: n.local,
      scheme,
      id: n.text,
      owner,
      kind,
      endpoint:
        kind === "electronic address" && (partyNode === "SellerTradeParty" || partyNode === "BuyerTradeParty"),
      loc: ctx.loc(n),
    });
  });
  return out;
}

/** The amounts PEPPOL-EN16931-R051 checks, with the business term each one carries. */
const R051_AMOUNTS = new Set([
  "Amount",
  "BaseAmount",
  "PriceAmount",
  "TaxableAmount",
  "LineExtensionAmount",
  "TaxExclusiveAmount",
  "TaxInclusiveAmount",
  "AllowanceTotalAmount",
  "ChargeTotalAmount",
  "PrepaidAmount",
  "PayableRoundingAmount",
  "PayableAmount",
]);
const TOTAL_TERMS: Record<string, string> = {
  LineExtensionAmount: "BT-106",
  TaxExclusiveAmount: "BT-109",
  TaxInclusiveAmount: "BT-112",
  AllowanceTotalAmount: "BT-107",
  ChargeTotalAmount: "BT-108",
  PrepaidAmount: "BT-113",
  PayableRoundingAmount: "BT-114",
  PayableAmount: "BT-115",
};

function ublAmountTerm(n: XNode): string | undefined {
  const parent = n.parent;
  const p = parent?.local;
  if (p === "LegalMonetaryTotal") return TOTAL_TERMS[n.local];
  if (n.local === "LineExtensionAmount" && (p === "InvoiceLine" || p === "CreditNoteLine")) return "BT-131";
  if (n.local === "TaxAmount") return p === "TaxSubtotal" ? "BT-117" : p === "TaxTotal" ? "BT-110" : undefined;
  if (n.local === "TaxableAmount" && p === "TaxSubtotal") return "BT-116";
  if (n.local === "PriceAmount" && p === "Price") return "BT-146";
  if (p === "AllowanceCharge" && (n.local === "Amount" || n.local === "BaseAmount")) {
    const where = parent?.parent?.local;
    const charge = parent!.children.find((c) => c.local === "ChargeIndicator")?.text.toLowerCase() === "true";
    if (where === "Price") return n.local === "Amount" ? "BT-147" : "BT-148";
    if (where === "InvoiceLine" || where === "CreditNoteLine")
      return n.local === "Amount" ? (charge ? "BT-141" : "BT-136") : charge ? "BT-142" : "BT-137";
    if (where === "Invoice" || where === "CreditNote")
      return n.local === "Amount" ? (charge ? "BT-99" : "BT-92") : charge ? "BT-100" : "BT-93";
  }
  return undefined;
}

/**
 * Every UBL amount PEPPOL-EN16931-R051 checks: the listed cbc amounts anywhere, plus the TaxAmount of a
 * TaxSubtotal and of a TaxTotal that has subtotals (BT-111, the accounting-currency total, is exempt).
 */
export function collectUblAmountCurrencies(root: XNode, ctx: ReadCtx): InvoiceModel["amountCurrencies"] {
  const out: InvoiceModel["amountCurrencies"] = [];
  walk(root, (n) => {
    if (n.ns !== UBL_CBC) return;
    const p = n.parent;
    const listed =
      R051_AMOUNTS.has(n.local) ||
      (n.local === "TaxAmount" &&
        (p?.local === "TaxSubtotal" || (p?.local === "TaxTotal" && p.children.some((c) => c.local === "TaxSubtotal"))));
    if (!listed) return;
    const term = ublAmountTerm(n);
    out.push({ bt: term ? `${term} (${n.local})` : `cbc:${n.local}`, currency: n.attrs["currencyID"], loc: ctx.loc(n) });
  });
  return out;
}

/** Every element whose name ends in BinaryObject, with its mimeCode and filename as written (BR-CL-24, PEPPOL-EN16931-CL001, UBL-DT-06/07). */
export function collectBinaryObjects(root: XNode, ctx: ReadCtx): NonNullable<InvoiceModel["binaryObjects"]> {
  const out: NonNullable<InvoiceModel["binaryObjects"]> = [];
  walk(root, (n) => {
    if (n.local.endsWith("BinaryObject"))
      out.push({ element: n.local, mime: n.attrs["mimeCode"], filename: n.attrs["filename"], loc: ctx.loc(n) });
  });
  return out;
}

/** An element's text exactly as written (`text()` trims). */
export const exactText = (n: XNode | null | undefined): string | undefined => (n ? (n.raw ?? n.text) : undefined);

/** XPath `A = B` on two node sets: true when any string value of one equals any of the other, exactly as written. */
export const anyEqual = (a: XNode[], b: XNode[]): boolean => {
  const right = new Set(b.map((n) => exactText(n) ?? ""));
  return a.some((n) => right.has(exactText(n) ?? ""));
};

const UBL_CAC = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2";
const CII_RAM = "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100";
const CII_UDT = "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100";

/** The thirteen cbc amount elements whose currencyID BR-CL-03 and PEPPOL-EN16931-CL007 check (UBL). */
const UBL_CURRENCY_AMOUNTS = new Set([...R051_AMOUNTS, "TaxAmount"]);

/**
 * The amounts BR-CL-03 and PEPPOL-EN16931-CL007 check, currencyID as written: UBL every listed cbc amount
 * element (BT-111 included), CII every TaxTotalAmount that carries a currencyID.
 */
export function collectCurrencyIds(root: XNode, ctx: ReadCtx, syntax: "UBL" | "CII"): NonNullable<InvoiceModel["currencyIds"]> {
  const out: NonNullable<InvoiceModel["currencyIds"]> = [];
  walk(root, (n) => {
    const listed =
      syntax === "UBL"
        ? n.ns === UBL_CBC && UBL_CURRENCY_AMOUNTS.has(n.local)
        : n.ns === CII_RAM && n.local === "TaxTotalAmount" && n.attrs["currencyID"] !== undefined;
    if (listed) out.push({ element: n.local, currency: n.attrs["currencyID"], loc: ctx.loc(n) });
  });
  return out;
}

/**
 * Invoiced object identifier schemes for BR-CL-07: UBL the schemeID of the ID of every (Additional)DocumentReference
 * whose DocumentTypeCode is exactly 130, CII the text of every ReferenceTypeCode.
 */
export function collectObjectIdSchemes(root: XNode, ctx: ReadCtx, syntax: "UBL" | "CII"): NonNullable<InvoiceModel["objectIdSchemes"]> {
  const out: NonNullable<InvoiceModel["objectIdSchemes"]> = [];
  walk(root, (n) => {
    if (syntax === "CII") {
      if (n.ns === CII_RAM && n.local === "ReferenceTypeCode") out.push({ scheme: exactText(n) ?? "", loc: ctx.loc(n) });
      return;
    }
    if (n.ns !== UBL_CAC || (n.local !== "AdditionalDocumentReference" && n.local !== "DocumentReference")) return;
    const is130 = n.children.some((c) => c.ns === UBL_CBC && c.local === "DocumentTypeCode" && exactText(c) === "130");
    if (!is130) return;
    for (const id of n.children)
      if (id.ns === UBL_CBC && id.local === "ID" && id.attrs["schemeID"] !== undefined)
        out.push({ scheme: id.attrs["schemeID"]!, loc: ctx.loc(id) });
  });
  return out;
}

const UBL_DATE_ELEMENTS = new Set(["IssueDate", "DueDate", "TaxPointDate", "StartDate", "EndDate", "ActualDeliveryDate"]);

/** Date elements as written, for PEPPOL-EN16931-F001: UBL the six cbc date elements, CII every udt:DateTimeString. */
export function collectDates(root: XNode, ctx: ReadCtx, syntax: "UBL" | "CII"): NonNullable<InvoiceModel["dates"]> {
  const out: NonNullable<InvoiceModel["dates"]> = [];
  walk(root, (n) => {
    const listed =
      syntax === "UBL" ? n.ns === UBL_CBC && UBL_DATE_ELEMENTS.has(n.local) : n.ns === CII_UDT && n.local === "DateTimeString";
    if (listed) out.push({ element: n.local, raw: exactText(n) ?? "", format: n.attrs["format"], loc: ctx.loc(n) });
  });
  return out;
}

/**
 * UBL-DT-01: every element whose name ends in Amount, text as written, except PriceAmount and anything inside a
 * cac:Price that has a cac:AllowanceCharge (the price allowance amounts may carry more decimals).
 */
export function collectUblAmountTexts(root: XNode, ctx: ReadCtx): NonNullable<InvoiceModel["amountTexts"]> {
  const out: NonNullable<InvoiceModel["amountTexts"]> = [];
  const inPriceWithAllowance = (n: XNode) => {
    for (let cur = n.parent; cur; cur = cur.parent)
      if (cur.ns === UBL_CAC && cur.local === "Price" && cur.children.some((c) => c.ns === UBL_CAC && c.local === "AllowanceCharge"))
        return true;
    return false;
  };
  walk(root, (n) => {
    if (!n.local.endsWith("Amount") || n.local.endsWith("PriceAmount") || inPriceWithAllowance(n)) return;
    out.push({ element: n.local, raw: exactText(n) ?? "", loc: ctx.loc(n) });
  });
  return out;
}

/** Whose coded value it is, in plain words, for code-list messages. */
const CODE_OWNERS: Record<string, string> = {
  ...UBL_OWNERS,
  ...CII_OWNERS,
  Delivery: "Deliver-to",
  ApplicableHeaderTradeDelivery: "Deliver-to",
  TaxSubtotal: "VAT breakdown",
  ApplicableHeaderTradeSettlement: "VAT breakdown",
  InvoiceLine: "Line",
  CreditNoteLine: "Line",
  IncludedSupplyChainTradeLineItem: "Line",
  AllowanceCharge: "Allowance or charge",
  SpecifiedTradeAllowanceCharge: "Allowance or charge",
  AppliedTradeAllowanceCharge: "Price allowance or charge",
};

/** A node's whole text (XPath string value), as written. */
function stringValue(n: XNode): string {
  if (n.children.length === 0) return exactText(n) ?? "";
  return n.children.map(stringValue).join("");
}
const hasAncestor = (n: XNode, ns: string, names: readonly string[]) => {
  for (let cur = n.parent; cur; cur = cur.parent) if (cur.ns === ns && names.includes(cur.local)) return true;
  return false;
};
const childrenNamed = (n: XNode, ns: string, local: string) => n.children.filter((c) => c.ns === ns && c.local === local);
const normalise = normalizeSpace;

/**
 * Every coded value the official code-list rules read, wherever it sits (the official contexts are not tied
 * to a place): BR-CL-13, -14, -15, -17 and -18 (UBL cac:Country/cbc:IdentificationCode,
 * cac:OriginCountry/cbc:IdentificationCode, cac:CommodityClassification/cbc:ItemClassificationCode[@listID],
 * cac:TaxCategory/cbc:ID and cac:ClassifiedTaxCategory/cbc:ID; CII ram:CountryID, ram:OriginTradeCountry/ram:ID,
 * ram:ClassCode[@listID], ram:CategoryTradeTax/ram:CategoryCode and ram:ApplicableTradeTax/ram:CategoryCode), and
 * the values of BR-CL-06, -08, -10, -21, -22, -26, BR-50, BR-B-01/02 and PEPPOL-EN16931-CL006 (see CodedKind).
 */
export function collectCodedValues(root: XNode, ctx: ReadCtx, syntax: "UBL" | "CII"): NonNullable<InvoiceModel["codedValues"]> {
  const out: NonNullable<InvoiceModel["codedValues"]> = [];
  const push = (kind: CodedKind, n: XNode, value: string, extra: Partial<CodedValue> = {}) =>
    out.push({ kind, value, owner: ownerOf(n, CODE_OWNERS, "Document"), loc: ctx.loc(n), ...extra });
  walk(root, (n) => {
    const parent = n.parent?.local;
    const value = exactText(n) ?? "";
    if (syntax === "UBL") {
      if (n.ns === UBL_CAC && n.local === "PaymentMeans") {
        // BR-50: cac:PaymentMeans[cbc:PaymentMeansCode='30' or cbc:PaymentMeansCode='58']/cac:PayeeFinancialAccount
        const codes = childrenNamed(n, UBL_CBC, "PaymentMeansCode").map((c) => exactText(c) ?? "");
        if (codes.includes("30") || codes.includes("58"))
          for (const acc of childrenNamed(n, UBL_CAC, "PayeeFinancialAccount"))
            push("creditTransferAccount", acc, normalise(childrenNamed(acc, UBL_CBC, "ID").map(stringValue).join(" ")));
        return;
      }
      if (n.ns === UBL_CAC && n.local === "PartyTaxScheme") {
        // BR-CO-09: //cac:PartyTaxScheme[cac:TaxScheme/normalize-space(upper-case(cbc:ID))='VAT'], substring(cbc:CompanyID,1,2)
        const scheme = childrenNamed(n, UBL_CAC, "TaxScheme").flatMap((t) => childrenNamed(t, UBL_CBC, "ID"));
        if (scheme.some((id) => normalise((exactText(id) ?? "").toUpperCase()) === "VAT")) {
          const company = childrenNamed(n, UBL_CBC, "CompanyID")[0];
          push("vatIdentifier", company ?? n, company ? (exactText(company) ?? "") : "");
        }
        return;
      }
      if (n.ns !== UBL_CBC) return;
      if (n.local === "IdentificationCode") {
        push("identificationCode", n, value);
        if (parent === "Country") push("country", n, value);
        else if (parent === "OriginCountry") push("originCountry", n, value);
      } else if (n.local === "ItemClassificationCode" && parent === "CommodityClassification" && n.attrs["listID"] !== undefined) {
        push("classificationScheme", n, n.attrs["listID"]!);
      } else if (n.local === "ID" && parent === "TaxCategory") {
        const holder = n.parent?.parent;
        const docLevel =
          (holder?.local === "TaxSubtotal" && holder.parent?.local === "TaxTotal" && holder.parent.parent === root) ||
          (holder?.local === "AllowanceCharge" && holder.parent === root);
        push("taxCategory", n, value, { docLevel });
      } else if (n.local === "ID" && parent === "ClassifiedTaxCategory") push("itemTaxCategory", n, value);
      else if (n.local === "DescriptionCode" && parent === "InvoicePeriod") push("periodDescriptionCode", n, value);
      else if (n.local === "Note" && n.parent === root) push("rootNote", n, stringValue(n));
      else if (n.local === "TaxExemptionReasonCode") push("exemptionCode", n, value);
      else if (n.local === "ID" && n.attrs["schemeID"] !== undefined) {
        const scheme = n.attrs["schemeID"]!;
        if (parent === "PartyIdentification")
          push("partyIdScheme", n, scheme, { sellerOrPayee: hasAncestor(n, UBL_CAC, ["AccountingSupplierParty", "PayeeParty"]) });
        else if (parent === "StandardItemIdentification") push("itemIdScheme", n, scheme);
        else if (parent === "DeliveryLocation") push("deliveryIdScheme", n, scheme);
      } else if (n.local === "CompanyID" && parent === "PartyLegalEntity" && n.attrs["schemeID"] !== undefined)
        push("legalIdScheme", n, n.attrs["schemeID"]!);
      else if (n.local === "EndpointID" && n.attrs["schemeID"] !== undefined) push("endpointScheme", n, n.attrs["schemeID"]!);
    } else {
      if (n.ns !== CII_RAM) return;
      if (n.local === "SpecifiedTradeSettlementPaymentMeans") {
        // BR-50: //ram:SpecifiedTradeSettlementPaymentMeans[ram:TypeCode='30' or ram:TypeCode='58']/ram:PayeePartyCreditorFinancialAccount
        const codes = childrenNamed(n, CII_RAM, "TypeCode").map((c) => exactText(c) ?? "");
        if (codes.includes("30") || codes.includes("58"))
          for (const acc of childrenNamed(n, CII_RAM, "PayeePartyCreditorFinancialAccount")) {
            const iban = normalise(childrenNamed(acc, CII_RAM, "IBANID").map(stringValue).join(" "));
            const own = normalise(childrenNamed(acc, CII_RAM, "ProprietaryID").map(stringValue).join(" "));
            push("creditTransferAccount", acc, iban || own);
          }
        return;
      }
      // BR-CO-09: //ram:SpecifiedTaxRegistration/ram:ID[@schemeID='VA'], its text as written
      if (n.local === "ID" && parent === "SpecifiedTaxRegistration" && n.attrs["schemeID"] === "VA") push("vatIdentifier", n, value);
      // BR-CL-11: ram:ID[@schemeID][not(ancestor::ram:SpecifiedTaxRegistration)], wherever it sits
      if (n.local === "ID" && n.attrs["schemeID"] !== undefined && !hasAncestor(n, CII_RAM, ["SpecifiedTaxRegistration"]))
        push("legalIdScheme", n, n.attrs["schemeID"]!);
      if (n.local === "URIID" && parent === "URIUniversalCommunication" && n.attrs["schemeID"] !== undefined)
        push("endpointScheme", n, n.attrs["schemeID"]!);
      if (n.local === "CountryID") push("country", n, value);
      // An OriginTradeCountry/ID with a schemeID is BR-CL-11's (an earlier rule in the same official pattern)
      else if (n.local === "ID" && parent === "OriginTradeCountry" && n.attrs["schemeID"] === undefined) push("originCountry", n, value);
      else if (n.local === "ClassCode" && n.attrs["listID"] !== undefined) push("classificationScheme", n, n.attrs["listID"]!);
      else if (n.local === "CategoryCode") {
        push("categoryCode", n, value);
        if (parent === "CategoryTradeTax") push("taxCategory", n, value);
        else if (parent === "ApplicableTradeTax") push("itemTaxCategory", n, value);
      } else if (n.local === "DueDateTypeCode") push("dueDateTypeCode", n, value);
      else if (n.local === "SubjectCode") push("subjectCode", n, value);
      else if (n.local === "ExemptionReasonCode") push("exemptionCode", n, value);
      else if (n.local === "GlobalID" && n.attrs["schemeID"] !== undefined) {
        const scheme = n.attrs["schemeID"]!;
        if (hasAncestor(n, CII_RAM, ["SpecifiedTradeProduct"])) {
          if (parent === "SpecifiedTradeProduct") push("itemIdScheme", n, scheme);
        } else if (hasAncestor(n, CII_RAM, ["ShipToTradeParty"])) {
          if (parent === "ShipToTradeParty" && n.parent?.parent?.local === "ApplicableHeaderTradeDelivery") push("deliveryIdScheme", n, scheme);
        } else push("partyIdScheme", n, scheme);
      }
    }
  });
  return out;
}
