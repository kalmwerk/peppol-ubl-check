import {
  emptyParty,
  type Address,
  type AllowanceCharge,
  type InvoiceLine,
  type InvoiceModel,
  type LocMap,
  type Party,
  type PaymentMeans,
  type VatBreakdown,
} from "./model";
import { ReadCtx, collectEmptyElements } from "./read-utils";
import { all, at, kids, text, type XNode } from "./xml";

export const UBL_INVOICE_NS = "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
export const UBL_CREDITNOTE_NS = "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2";

function readAddress(
  ctx: ReadCtx,
  node: XNode | null,
  locs: LocMap,
  prefix: string,
): Address | undefined {
  if (!node) return undefined;
  locs[prefix] = ctx.loc(node);
  return {
    line1: ctx.str(node, "StreetName", locs, `${prefix}.line1`),
    line2: ctx.str(node, "AdditionalStreetName", locs, `${prefix}.line2`),
    line3: ctx.str(node, "AddressLine/Line", locs, `${prefix}.line3`),
    city: ctx.str(node, "CityName", locs, `${prefix}.city`),
    postalCode: ctx.str(node, "PostalZone", locs, `${prefix}.postalCode`),
    subdivision: ctx.str(node, "CountrySubentity", locs, `${prefix}.subdivision`),
    country: ctx.str(node, "Country/IdentificationCode", locs, `${prefix}.country`),
  };
}

function readParty(ctx: ReadCtx, partyNode: XNode | null): Party {
  const p = emptyParty();
  if (!partyNode) return p;
  p.loc = ctx.loc(partyNode);
  const L = p.locs;
  const endpoint = at(partyNode, "EndpointID");
  if (endpoint) {
    p.endpoint = { id: text(endpoint) ?? "", scheme: endpoint.attrs["schemeID"] };
    L["endpoint"] = ctx.loc(endpoint);
  }
  for (const idn of all(partyNode, "PartyIdentification/ID")) {
    p.identifiers.push({ id: text(idn) ?? "", scheme: idn.attrs["schemeID"] });
    L["identifier"] ??= ctx.loc(idn);
  }
  // Payee/tax representative use PartyName for their name; seller/buyer use it for trading name
  p.tradingName = ctx.str(partyNode, "PartyName/Name", L, "tradingName");
  p.address = readAddress(ctx, at(partyNode, "PostalAddress"), L, "address");
  for (const pts of kids(partyNode, "PartyTaxScheme")) {
    const scheme = text(pts, "TaxScheme/ID");
    const company = at(pts, "CompanyID");
    if (!company) continue;
    if (scheme?.toUpperCase() === "VAT") {
      p.vatId = text(company);
      L["vatId"] = ctx.loc(company);
    } else {
      p.taxRegistrationId = text(company);
      L["taxRegistrationId"] = ctx.loc(company);
    }
  }
  const legal = at(partyNode, "PartyLegalEntity");
  if (legal) {
    p.name = ctx.str(legal, "RegistrationName", L, "name");
    const cid = at(legal, "CompanyID");
    if (cid) {
      p.legalId = { id: text(cid) ?? "", scheme: cid.attrs["schemeID"] };
      L["legalId"] = ctx.loc(cid);
    }
    p.legalForm = ctx.str(legal, "CompanyLegalForm", L, "legalForm");
  }
  const contact = at(partyNode, "Contact");
  if (contact) {
    L["contact"] = ctx.loc(contact);
    p.contact = {
      name: ctx.str(contact, "Name", L, "contact.name"),
      phone: ctx.str(contact, "Telephone", L, "contact.phone"),
      email: ctx.str(contact, "ElectronicMail", L, "contact.email"),
    };
  }
  return p;
}

function readAllowanceCharge(ctx: ReadCtx, node: XNode, level: "doc" | "line"): AllowanceCharge {
  const locs: LocMap = {};
  const rawIndicator = ctx.str(node, "ChargeIndicator", locs, "indicator");
  const isCharge = rawIndicator?.toLowerCase() === "true";
  const amountBt =
    level === "doc" ? (isCharge ? "BT-99" : "BT-92") : isCharge ? "BT-141" : "BT-136";
  const baseBt = level === "doc" ? (isCharge ? "BT-100" : "BT-93") : isCharge ? "BT-142" : "BT-137";
  return {
    isCharge,
    rawIndicator,
    amount: ctx.num(node, "Amount", locs, "amount", amountBt, { amount: true }),
    baseAmount: ctx.num(node, "BaseAmount", locs, "baseAmount", baseBt, { amount: true }),
    percent: ctx.num(node, "MultiplierFactorNumeric", locs, "percent", "BT-94"),
    reason: ctx.str(node, "AllowanceChargeReason", locs, "reason"),
    reasonCode: ctx.str(node, "AllowanceChargeReasonCode", locs, "reasonCode"),
    vatCategory: ctx.str(node, "TaxCategory/ID", locs, "vatCategory"),
    vatRate: ctx.num(node, "TaxCategory/Percent", locs, "vatRate", "BT-96"),
    locs,
    loc: ctx.loc(node),
  };
}

export function readUbl(root: XNode): InvoiceModel {
  const ctx = new ReadCtx();
  const isCredit = root.local === "CreditNote";
  const locs: LocMap = {};
  const linesTag = isCredit ? "CreditNoteLine" : "InvoiceLine";
  const qtyTag = isCredit ? "CreditedQuantity" : "InvoicedQuantity";

  const model: InvoiceModel = {
    syntax: "UBL",
    kind: isCredit ? "creditnote" : "invoice",
    customizationId: ctx.str(root, "CustomizationID", locs, "customizationId"),
    profileId: ctx.str(root, "ProfileID", locs, "profileId"),
    number: ctx.str(root, "ID", locs, "number"),
    issueDate: ctx.isoDate(root, "IssueDate", locs, "issueDate", "BT-2"),
    typeCode: ctx.str(root, isCredit ? "CreditNoteTypeCode" : "InvoiceTypeCode", locs, "typeCode"),
    currency: ctx.str(root, "DocumentCurrencyCode", locs, "currency"),
    taxCurrency: ctx.str(root, "TaxCurrencyCode", locs, "taxCurrency"),
    taxPointDate: ctx.isoDate(root, "TaxPointDate", locs, "taxPointDate", "BT-7"),
    dueDate: isCredit
      ? ctx.isoDate(at(root, "PaymentMeans"), "PaymentDueDate", locs, "dueDate", "BT-9")
      : ctx.isoDate(root, "DueDate", locs, "dueDate", "BT-9"),
    buyerReference: ctx.str(root, "BuyerReference", locs, "buyerReference"),
    projectRef: ctx.str(root, "ProjectReference/ID", locs, "projectRef"),
    contractRef: ctx.str(root, "ContractDocumentReference/ID", locs, "contractRef"),
    orderRef: ctx.str(root, "OrderReference/ID", locs, "orderRef"),
    salesOrderRef: ctx.str(root, "OrderReference/SalesOrderID", locs, "salesOrderRef"),
    receivingAdviceRef: ctx.str(root, "ReceiptDocumentReference/ID", locs, "receivingAdviceRef"),
    despatchAdviceRef: ctx.str(root, "DespatchDocumentReference/ID", locs, "despatchAdviceRef"),
    accountingCost: ctx.str(root, "AccountingCost", locs, "accountingCost"),
    paymentTerms: ctx.str(root, "PaymentTerms/Note", locs, "paymentTerms"),
    paymentTermsRaw: at(root, "PaymentTerms/Note")?.raw,
    notes: kids(root, "Note").map((n) => text(n) ?? ""),
    precedingInvoices: all(root, "BillingReference").map((br) => {
      const ref = at(br, "InvoiceDocumentReference") ?? at(br, "CreditNoteDocumentReference");
      return { id: text(ref, "ID"), date: text(ref, "IssueDate"), loc: ctx.loc(br) };
    }),
    hasPeriod: false,
    seller: readParty(ctx, at(root, "AccountingSupplierParty/Party")),
    buyer: readParty(ctx, at(root, "AccountingCustomerParty/Party")),
    paymentMeans: [],
    allowances: [],
    charges: [],
    vat: [],
    taxTotals: [],
    totals: { locs: {} },
    lines: [],
    attachments: kids(root, "AdditionalDocumentReference").map((d) => ({
      id: text(d, "ID"),
      description: text(d, "DocumentDescription"),
      filename: at(d, "Attachment/EmbeddedDocumentBinaryObject")?.attrs["filename"],
      mime: at(d, "Attachment/EmbeddedDocumentBinaryObject")?.attrs["mimeCode"],
      loc: ctx.loc(d),
    })),
    amountCurrencies: [],
    decimals: [],
    typeErrors: [],
    emptyElements: [],
    locs,
    loc: ctx.loc(root),
  };
  const noteNode = at(root, "Note");
  if (noteNode) locs["notes"] = ctx.loc(noteNode);

  const period = at(root, "InvoicePeriod");
  if (period) {
    model.hasPeriod = true;
    locs["period"] = ctx.loc(period);
    model.periodStart = ctx.isoDate(period, "StartDate", locs, "periodStart", "BT-73");
    model.periodEnd = ctx.isoDate(period, "EndDate", locs, "periodEnd", "BT-74");
    model.taxPointCode = ctx.str(period, "DescriptionCode", locs, "taxPointCode");
  }

  // Payee and tax representative
  const payee = at(root, "PayeeParty");
  if (payee) {
    const p = readParty(ctx, payee);
    p.name = p.tradingName;
    p.locs["name"] = p.locs["tradingName"] ?? p.loc!;
    model.payee = p;
  }
  const taxRep = at(root, "TaxRepresentativeParty");
  if (taxRep) {
    const p = readParty(ctx, taxRep);
    p.name = p.tradingName;
    p.locs["name"] = p.locs["tradingName"] ?? p.loc!;
    model.taxRepresentative = p;
  }

  // BT-90: the SEPA creditor ID is a seller (or payee) identifier with scheme "SEPA"
  const sepa = (p: { identifiers: { id: string; scheme?: string }[] } | undefined) =>
    p?.identifiers.find((i) => i.scheme?.toUpperCase() === "SEPA" && i.id)?.id;
  model.creditorId = sepa(model.seller) ?? sepa(model.payee);

  const delivery = at(root, "Delivery");
  if (delivery) {
    const dl: LocMap = {};
    model.delivery = {
      date: ctx.isoDate(delivery, "ActualDeliveryDate", dl, "date", "BT-72"),
      partyName: ctx.str(delivery, "DeliveryParty/PartyName/Name", dl, "partyName"),
      address: readAddress(ctx, at(delivery, "DeliveryLocation/Address"), dl, "address"),
      locs: dl,
      loc: ctx.loc(delivery),
    };
  }

  for (const pm of kids(root, "PaymentMeans")) {
    const pl: LocMap = {};
    const codeNode = at(pm, "PaymentMeansCode");
    const means: PaymentMeans = {
      code: ctx.str(pm, "PaymentMeansCode", pl, "code"),
      text: codeNode?.attrs["name"],
      paymentId: ctx.str(pm, "PaymentID", pl, "paymentId"),
      account: ctx.str(pm, "PayeeFinancialAccount/ID", pl, "account"),
      accountName: ctx.str(pm, "PayeeFinancialAccount/Name", pl, "accountName"),
      bic: ctx.str(pm, "PayeeFinancialAccount/FinancialInstitutionBranch/ID", pl, "bic"),
      cardPan: ctx.str(pm, "CardAccount/PrimaryAccountNumberID", pl, "cardPan"),
      mandateRef: ctx.str(pm, "PaymentMandate/ID", pl, "mandateRef"),
      debitedAccount: ctx.str(pm, "PaymentMandate/PayerFinancialAccount/ID", pl, "debitedAccount"),
      hasCreditTransfer: !!at(pm, "PayeeFinancialAccount"),
      hasCard: !!at(pm, "CardAccount"),
      hasDirectDebit: !!at(pm, "PaymentMandate"),
      locs: pl,
      loc: ctx.loc(pm),
    };
    model.paymentMeans.push(means);
  }

  for (const ac of kids(root, "AllowanceCharge")) {
    const item = readAllowanceCharge(ctx, ac, "doc");
    (item.isCharge ? model.charges : model.allowances).push(item);
  }

  const taxTotalNodes = kids(root, "TaxTotal");
  for (const tt of taxTotalNodes) {
    const amountNode = at(tt, "TaxAmount");
    const subtotals = kids(tt, "TaxSubtotal");
    const rawAmount = text(amountNode);
    model.taxTotals.push({
      amount:
        rawAmount !== undefined && !Number.isNaN(Number(rawAmount)) ? Number(rawAmount) : undefined,
      currency: amountNode?.attrs["currencyID"],
      hasSubtotals: subtotals.length > 0,
      loc: amountNode ? ctx.loc(amountNode) : ctx.loc(tt),
    });
    for (const st of subtotals) {
      const sl: LocMap = {};
      const vb: VatBreakdown = {
        taxableAmount: ctx.num(st, "TaxableAmount", sl, "taxableAmount", "BT-116", {
          amount: true,
        }),
        taxAmount: ctx.num(st, "TaxAmount", sl, "taxAmount", "BT-117", { amount: true }),
        category: ctx.str(st, "TaxCategory/ID", sl, "category"),
        rate: ctx.num(st, "TaxCategory/Percent", sl, "rate", "BT-119"),
        exemptionReason: ctx.str(st, "TaxCategory/TaxExemptionReason", sl, "exemptionReason"),
        exemptionCode: ctx.str(st, "TaxCategory/TaxExemptionReasonCode", sl, "exemptionCode"),
        locs: sl,
        loc: ctx.loc(st),
      };
      model.vat.push(vb);
    }
  }
  // BT-110 lives in the document-currency TaxTotal, BT-111 in the accounting-currency one
  const currencyOf = (tt: XNode) => at(tt, "TaxAmount")?.attrs["currencyID"];
  const docTotal =
    taxTotalNodes.find((tt) => model.currency && currencyOf(tt) === model.currency) ??
    taxTotalNodes.find((tt) => kids(tt, "TaxSubtotal").length > 0) ??
    taxTotalNodes[0];
  const acctTotal =
    model.taxCurrency && model.taxCurrency !== model.currency
      ? taxTotalNodes.find((tt) => tt !== docTotal && currencyOf(tt) === model.taxCurrency)
      : undefined;

  const lmt = at(root, "LegalMonetaryTotal");
  const T = model.totals;
  if (lmt) {
    T.loc = ctx.loc(lmt);
    T.lineExtension = ctx.num(lmt, "LineExtensionAmount", T.locs, "lineExtension", "BT-106", {
      amount: true,
    });
    T.taxExclusive = ctx.num(lmt, "TaxExclusiveAmount", T.locs, "taxExclusive", "BT-109", {
      amount: true,
    });
    T.taxInclusive = ctx.num(lmt, "TaxInclusiveAmount", T.locs, "taxInclusive", "BT-112", {
      amount: true,
    });
    T.allowanceTotal = ctx.num(lmt, "AllowanceTotalAmount", T.locs, "allowanceTotal", "BT-107", {
      amount: true,
    });
    T.chargeTotal = ctx.num(lmt, "ChargeTotalAmount", T.locs, "chargeTotal", "BT-108", {
      amount: true,
    });
    T.prepaid = ctx.num(lmt, "PrepaidAmount", T.locs, "prepaid", "BT-113", { amount: true });
    T.rounding = ctx.num(lmt, "PayableRoundingAmount", T.locs, "rounding", "BT-114", {
      amount: true,
    });
    T.payable = ctx.num(lmt, "PayableAmount", T.locs, "payable", "BT-115", { amount: true });
  }
  if (docTotal) {
    T.taxAmount = ctx.num(docTotal, "TaxAmount", T.locs, "taxAmount", "BT-110", { amount: true });
  }
  if (acctTotal) {
    T.taxAmountAccounting = ctx.num(
      acctTotal,
      "TaxAmount",
      T.locs,
      "taxAmountAccounting",
      "BT-111",
      { amount: true },
    );
  }

  for (const ln of kids(root, linesTag)) {
    const L: LocMap = {};
    const qtyNode = at(ln, qtyTag);
    const line: InvoiceLine = {
      id: ctx.str(ln, "ID", L, "id"),
      note: ctx.str(ln, "Note", L, "note"),
      quantity: ctx.num(ln, qtyTag, L, "quantity", "BT-129"),
      unitCode: qtyNode?.attrs["unitCode"],
      netAmount: ctx.num(ln, "LineExtensionAmount", L, "netAmount", "BT-131", { amount: true }),
      orderLineRef: ctx.str(ln, "OrderLineReference/LineID", L, "orderLineRef"),
      allowances: [],
      charges: [],
      attributes: [],
      locs: L,
      loc: ctx.loc(ln),
    };
    if (qtyNode) L["unitCode"] = ctx.loc(qtyNode);
    const lp = at(ln, "InvoicePeriod");
    if (lp) {
      L["period"] = ctx.loc(lp);
      line.periodStart = ctx.isoDate(lp, "StartDate", L, "periodStart", "BT-134");
      line.periodEnd = ctx.isoDate(lp, "EndDate", L, "periodEnd", "BT-135");
    }
    for (const ac of kids(ln, "AllowanceCharge")) {
      const item = readAllowanceCharge(ctx, ac, "line");
      (item.isCharge ? line.charges : line.allowances).push(item);
    }
    const item = at(ln, "Item");
    if (item) {
      L["item"] = ctx.loc(item);
      line.itemName = ctx.str(item, "Name", L, "itemName");
      line.description = ctx.str(item, "Description", L, "description");
      line.sellerItemId = ctx.str(item, "SellersItemIdentification/ID", L, "sellerItemId");
      const sid = at(item, "StandardItemIdentification/ID");
      if (sid) {
        line.standardItemId = { id: text(sid) ?? "", scheme: sid.attrs["schemeID"] };
        L["standardItemId"] = ctx.loc(sid);
      }
      line.classification = all(item, "CommodityClassification").map((cc) => {
        const code = at(cc, "ItemClassificationCode");
        return { id: text(code) ?? "", scheme: code?.attrs["listID"] };
      });
      line.originCountry = ctx.str(item, "OriginCountry/IdentificationCode", L, "originCountry");
      line.vatCategory = ctx.str(item, "ClassifiedTaxCategory/ID", L, "vatCategory");
      line.vatRate = ctx.num(item, "ClassifiedTaxCategory/Percent", L, "vatRate", "BT-152");
      if (!L["vatCategory"] && at(item, "ClassifiedTaxCategory"))
        L["vatCategory"] = ctx.loc(at(item, "ClassifiedTaxCategory")!);
      line.attributes = kids(item, "AdditionalItemProperty").map((ap) => ({
        name: text(ap, "Name"),
        value: text(ap, "Value"),
      }));
    }
    const price = at(ln, "Price");
    if (price) {
      L["price"] = ctx.loc(price);
      line.priceAmount = ctx.num(price, "PriceAmount", L, "priceAmount", "BT-146");
      const bq = at(price, "BaseQuantity");
      if (bq) {
        line.baseQuantity = ctx.num(bq, "", L, "baseQuantity", "BT-149");
        line.baseQuantityUnit = bq.attrs["unitCode"];
      }
      for (const pac of kids(price, "AllowanceCharge")) {
        const ind = text(pac, "ChargeIndicator")?.toLowerCase();
        if (ind === "true") {
          line.hasPriceCharge = true;
          L["priceCharge"] = ctx.loc(pac);
        } else {
          line.priceDiscount = ctx.num(pac, "Amount", L, "priceDiscount", "BT-147");
          line.grossPrice = ctx.num(pac, "BaseAmount", L, "grossPrice", "BT-148");
        }
      }
    }
    model.lines.push(line);
  }

  model.amountCurrencies = ctx.amountCurrencies;
  model.decimals = ctx.decimals;
  model.typeErrors = ctx.typeErrors;
  model.emptyElements = collectEmptyElements(root, ctx);
  return model;
}
