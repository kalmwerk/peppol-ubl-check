import type { Loc, LocMap, InvoiceModel, SchemeIdentifier } from "./model";
import { at, text, xpathOf, type XNode } from "./xml";

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
    return { line: node.line, col: node.col, xpath: xpathOf(node) };
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
    const v = n?.attrs[name]?.trim();
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
    if (n.children.length === 0 && n.text.trim() === "") out.push(ctx.loc(n));
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
      id: n.text.trim(),
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
      id: n.text.trim(),
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
    const charge = parent!.children.find((c) => c.local === "ChargeIndicator")?.text.trim().toLowerCase() === "true";
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

/** Every element named `local` that carries a mimeCode (UBL EmbeddedDocumentBinaryObject, CII AttachmentBinaryObject). */
export function collectBinaryObjects(root: XNode, local: string, ctx: ReadCtx): NonNullable<InvoiceModel["binaryObjects"]> {
  const out: NonNullable<InvoiceModel["binaryObjects"]> = [];
  walk(root, (n) => {
    const mime = n.attrs["mimeCode"];
    if (n.local === local && mime !== undefined) out.push({ mime, filename: n.attrs["filename"], loc: ctx.loc(n) });
  });
  return out;
}
