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

export const CII_NS = "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100";

const CREDIT_TYPE_CODES = new Set([
  "381",
  "81",
  "83",
  "261",
  "262",
  "296",
  "308",
  "396",
  "420",
  "458",
  "532",
]);

function readAddress(
  ctx: ReadCtx,
  node: XNode | null,
  locs: LocMap,
  prefix: string,
): Address | undefined {
  if (!node) return undefined;
  locs[prefix] = ctx.loc(node);
  return {
    line1: ctx.str(node, "LineOne", locs, `${prefix}.line1`),
    line2: ctx.str(node, "LineTwo", locs, `${prefix}.line2`),
    line3: ctx.str(node, "LineThree", locs, `${prefix}.line3`),
    city: ctx.str(node, "CityName", locs, `${prefix}.city`),
    postalCode: ctx.str(node, "PostcodeCode", locs, `${prefix}.postalCode`),
    subdivision: ctx.str(node, "CountrySubDivisionName", locs, `${prefix}.subdivision`),
    country: ctx.str(node, "CountryID", locs, `${prefix}.country`),
  };
}

function readParty(ctx: ReadCtx, node: XNode | null): Party {
  const p = emptyParty();
  if (!node) return p;
  const L = p.locs;
  p.loc = ctx.loc(node);
  for (const idn of kids(node, "ID")) {
    p.identifiers.push({ id: text(idn) ?? "", scheme: idn.attrs["schemeID"] });
    L["identifier"] ??= ctx.loc(idn);
  }
  for (const gid of kids(node, "GlobalID")) {
    p.identifiers.push({ id: text(gid) ?? "", scheme: gid.attrs["schemeID"] });
    L["identifier"] ??= ctx.loc(gid);
  }
  p.name = ctx.str(node, "Name", L, "name");
  const legal = at(node, "SpecifiedLegalOrganization");
  if (legal) {
    const lid = at(legal, "ID");
    if (lid) {
      p.legalId = { id: text(lid) ?? "", scheme: lid.attrs["schemeID"] };
      L["legalId"] = ctx.loc(lid);
    }
    p.tradingName = ctx.str(legal, "TradingBusinessName", L, "tradingName");
  }
  const contact = at(node, "DefinedTradeContact");
  if (contact) {
    L["contact"] = ctx.loc(contact);
    p.contact = {
      name: ctx.str(contact, "PersonName", L, "contact.name"),
      phone: ctx.str(contact, "TelephoneUniversalCommunication/CompleteNumber", L, "contact.phone"),
      email: ctx.str(contact, "EmailURIUniversalCommunication/URIID", L, "contact.email"),
    };
  }
  p.address = readAddress(ctx, at(node, "PostalTradeAddress"), L, "address");
  const uri = at(node, "URIUniversalCommunication/URIID");
  if (uri) {
    p.endpoint = { id: text(uri) ?? "", scheme: uri.attrs["schemeID"] };
    L["endpoint"] = ctx.loc(uri);
  }
  for (const reg of kids(node, "SpecifiedTaxRegistration")) {
    const id = at(reg, "ID");
    if (!id) continue;
    const scheme = id.attrs["schemeID"]?.toUpperCase();
    if (scheme === "FC") {
      p.taxRegistrationId = text(id);
      L["taxRegistrationId"] = ctx.loc(id);
    } else {
      p.vatId = text(id);
      L["vatId"] = ctx.loc(id);
    }
  }
  return p;
}

function readAllowanceCharge(ctx: ReadCtx, node: XNode, level: "doc" | "line"): AllowanceCharge {
  const locs: LocMap = {};
  const rawIndicator = ctx.str(node, "ChargeIndicator/Indicator", locs, "indicator");
  const isCharge = rawIndicator?.toLowerCase() === "true";
  const amountBt =
    level === "doc" ? (isCharge ? "BT-99" : "BT-92") : isCharge ? "BT-141" : "BT-136";
  const baseBt = level === "doc" ? (isCharge ? "BT-100" : "BT-93") : isCharge ? "BT-142" : "BT-137";
  return {
    isCharge,
    rawIndicator,
    amount: ctx.num(node, "ActualAmount", locs, "amount", amountBt, { amount: true }),
    baseAmount: ctx.num(node, "BasisAmount", locs, "baseAmount", baseBt, { amount: true }),
    percent: ctx.num(node, "CalculationPercent", locs, "percent", "BT-94"),
    reason: ctx.str(node, "Reason", locs, "reason"),
    reasonCode: ctx.str(node, "ReasonCode", locs, "reasonCode"),
    vatCategory: ctx.str(node, "CategoryTradeTax/CategoryCode", locs, "vatCategory"),
    vatRate: ctx.num(node, "CategoryTradeTax/RateApplicablePercent", locs, "vatRate", "BT-96"),
    locs,
    loc: ctx.loc(node),
  };
}

export function readCii(root: XNode): InvoiceModel {
  const ctx = new ReadCtx();
  const locs: LocMap = {};
  const context = at(root, "ExchangedDocumentContext");
  const doc = at(root, "ExchangedDocument");
  const tx = at(root, "SupplyChainTradeTransaction");
  const agreement = at(tx, "ApplicableHeaderTradeAgreement");
  const deliveryNode = at(tx, "ApplicableHeaderTradeDelivery");
  const settlement = at(tx, "ApplicableHeaderTradeSettlement");
  const typeCode = ctx.str(doc, "TypeCode", locs, "typeCode");

  const model: InvoiceModel = {
    syntax: "CII",
    kind: typeCode && CREDIT_TYPE_CODES.has(typeCode) ? "creditnote" : "invoice",
    customizationId: ctx.str(
      context,
      "GuidelineSpecifiedDocumentContextParameter/ID",
      locs,
      "customizationId",
    ),
    profileId: ctx.str(
      context,
      "BusinessProcessSpecifiedDocumentContextParameter/ID",
      locs,
      "profileId",
    ),
    number: ctx.str(doc, "ID", locs, "number"),
    issueDate: ctx.ciiDate(doc, "IssueDateTime", locs, "issueDate", "BT-2"),
    typeCode,
    currency: ctx.str(settlement, "InvoiceCurrencyCode", locs, "currency"),
    taxCurrency: ctx.str(settlement, "TaxCurrencyCode", locs, "taxCurrency"),
    dueDate: ctx.ciiDate(
      settlement,
      "SpecifiedTradePaymentTerms/DueDateDateTime",
      locs,
      "dueDate",
      "BT-9",
    ),
    buyerReference: ctx.str(agreement, "BuyerReference", locs, "buyerReference"),
    projectRef: ctx.str(agreement, "SpecifiedProcuringProject/ID", locs, "projectRef"),
    contractRef: ctx.str(
      agreement,
      "ContractReferencedDocument/IssuerAssignedID",
      locs,
      "contractRef",
    ),
    orderRef: ctx.str(agreement, "BuyerOrderReferencedDocument/IssuerAssignedID", locs, "orderRef"),
    salesOrderRef: ctx.str(
      agreement,
      "SellerOrderReferencedDocument/IssuerAssignedID",
      locs,
      "salesOrderRef",
    ),
    receivingAdviceRef: ctx.str(
      deliveryNode,
      "ReceivingAdviceReferencedDocument/IssuerAssignedID",
      locs,
      "receivingAdviceRef",
    ),
    despatchAdviceRef: ctx.str(
      deliveryNode,
      "DespatchAdviceReferencedDocument/IssuerAssignedID",
      locs,
      "despatchAdviceRef",
    ),
    accountingCost: ctx.str(
      settlement,
      "ReceivableSpecifiedTradeAccountingAccount/ID",
      locs,
      "accountingCost",
    ),
    paymentTerms: ctx.str(
      settlement,
      "SpecifiedTradePaymentTerms/Description",
      locs,
      "paymentTerms",
    ),
    notes: all(doc, "IncludedNote").map((n) => text(n, "Content") ?? ""),
    precedingInvoices: kids(settlement, "InvoiceReferencedDocument").map((r) => ({
      id: text(r, "IssuerAssignedID"),
      date: text(r, "FormattedIssueDateTime/DateTimeString"),
      loc: ctx.loc(r),
    })),
    hasPeriod: false,
    seller: readParty(ctx, at(agreement, "SellerTradeParty")),
    buyer: readParty(ctx, at(agreement, "BuyerTradeParty")),
    paymentMeans: [],
    allowances: [],
    charges: [],
    vat: [],
    taxTotals: [],
    totals: { locs: {} },
    lines: [],
    attachments: kids(agreement, "AdditionalReferencedDocument").map((d) => ({
      id: text(d, "IssuerAssignedID"),
      description: text(d, "Name"),
      filename: at(d, "AttachmentBinaryObject")?.attrs["filename"],
      mime: at(d, "AttachmentBinaryObject")?.attrs["mimeCode"],
    })),
    amountCurrencies: [],
    decimals: [],
    typeErrors: [],
    emptyElements: [],
    locs,
    loc: ctx.loc(root),
  };
  const firstNote = at(doc, "IncludedNote");
  if (firstNote) locs["notes"] = ctx.loc(firstNote);

  const taxRep = at(agreement, "SellerTaxRepresentativeTradeParty");
  if (taxRep) model.taxRepresentative = readParty(ctx, taxRep);
  const payee = at(settlement, "PayeeTradeParty");
  if (payee) model.payee = readParty(ctx, payee);

  if (deliveryNode) {
    const dl: LocMap = {};
    model.delivery = {
      date: ctx.ciiDate(
        deliveryNode,
        "ActualDeliverySupplyChainEvent/OccurrenceDateTime",
        dl,
        "date",
        "BT-72",
      ),
      partyName: ctx.str(deliveryNode, "ShipToTradeParty/Name", dl, "partyName"),
      address: readAddress(
        ctx,
        at(deliveryNode, "ShipToTradeParty/PostalTradeAddress"),
        dl,
        "address",
      ),
      locs: dl,
      loc: ctx.loc(deliveryNode),
    };
    if (!model.delivery.date && !model.delivery.partyName && !model.delivery.address) {
      model.delivery = undefined;
    }
  }

  const period = at(settlement, "BillingSpecifiedPeriod");
  if (period) {
    model.hasPeriod = true;
    locs["period"] = ctx.loc(period);
    model.periodStart = ctx.ciiDate(period, "StartDateTime", locs, "periodStart", "BT-73");
    model.periodEnd = ctx.ciiDate(period, "EndDateTime", locs, "periodEnd", "BT-74");
  }

  const paymentRef = ctx.str(settlement, "PaymentReference", locs, "paymentRef");
  const terms = at(settlement, "SpecifiedTradePaymentTerms");
  const mandate = text(terms, "DirectDebitMandateID");
  for (const pm of kids(settlement, "SpecifiedTradeSettlementPaymentMeans")) {
    const pl: LocMap = {};
    const means: PaymentMeans = {
      code: ctx.str(pm, "TypeCode", pl, "code"),
      text: ctx.str(pm, "Information", pl, "text"),
      paymentId: paymentRef,
      account:
        ctx.str(pm, "PayeePartyCreditorFinancialAccount/IBANID", pl, "account") ??
        ctx.str(pm, "PayeePartyCreditorFinancialAccount/ProprietaryID", pl, "account"),
      accountName: ctx.str(pm, "PayeePartyCreditorFinancialAccount/AccountName", pl, "accountName"),
      bic: ctx.str(pm, "PayeeSpecifiedCreditorFinancialInstitution/BICID", pl, "bic"),
      cardPan: ctx.str(pm, "ApplicableTradeSettlementFinancialCard/ID", pl, "cardPan"),
      mandateRef: mandate,
      debitedAccount: ctx.str(pm, "PayerPartyDebtorFinancialAccount/IBANID", pl, "debitedAccount"),
      locs: pl,
      loc: ctx.loc(pm),
    };
    if (!pl["account"]) {
      const acct = at(pm, "PayeePartyCreditorFinancialAccount");
      if (acct) pl["account"] = ctx.loc(acct);
    }
    model.paymentMeans.push(means);
  }

  for (const tax of kids(settlement, "ApplicableTradeTax")) {
    const sl: LocMap = {};
    const vb: VatBreakdown = {
      taxAmount: ctx.num(tax, "CalculatedAmount", sl, "taxAmount", "BT-117", { amount: true }),
      taxableAmount: ctx.num(tax, "BasisAmount", sl, "taxableAmount", "BT-116", { amount: true }),
      category: ctx.str(tax, "CategoryCode", sl, "category"),
      rate: ctx.num(tax, "RateApplicablePercent", sl, "rate", "BT-119"),
      exemptionReason: ctx.str(tax, "ExemptionReason", sl, "exemptionReason"),
      exemptionCode: ctx.str(tax, "ExemptionReasonCode", sl, "exemptionCode"),
      locs: sl,
      loc: ctx.loc(tax),
    };
    if (!model.taxPointDate) {
      model.taxPointDate = ctx.ciiDate(tax, "TaxPointDate", locs, "taxPointDate", "BT-7");
    }
    if (!model.taxPointCode)
      model.taxPointCode = ctx.str(tax, "DueDateTypeCode", locs, "taxPointCode");
    model.vat.push(vb);
  }

  for (const ac of kids(settlement, "SpecifiedTradeAllowanceCharge")) {
    const item = readAllowanceCharge(ctx, ac, "doc");
    (item.isCharge ? model.charges : model.allowances).push(item);
  }

  const sum = at(settlement, "SpecifiedTradeSettlementHeaderMonetarySummation");
  const T = model.totals;
  if (sum) {
    T.loc = ctx.loc(sum);
    T.lineExtension = ctx.num(sum, "LineTotalAmount", T.locs, "lineExtension", "BT-106", {
      amount: true,
    });
    T.chargeTotal = ctx.num(sum, "ChargeTotalAmount", T.locs, "chargeTotal", "BT-108", {
      amount: true,
    });
    T.allowanceTotal = ctx.num(sum, "AllowanceTotalAmount", T.locs, "allowanceTotal", "BT-107", {
      amount: true,
    });
    T.taxExclusive = ctx.num(sum, "TaxBasisTotalAmount", T.locs, "taxExclusive", "BT-109", {
      amount: true,
    });
    const taxTotals = kids(sum, "TaxTotalAmount");
    for (const tt of taxTotals) {
      const cur = tt.attrs["currencyID"];
      const isAccounting = Boolean(
        model.taxCurrency && cur === model.taxCurrency && model.taxCurrency !== model.currency,
      );
      const v = ctx.num(
        tt,
        "",
        T.locs,
        isAccounting ? "taxAmountAccounting" : "taxAmount",
        isAccounting ? "BT-111" : "BT-110",
        { amount: true },
      );
      if (isAccounting) T.taxAmountAccounting = v;
      else T.taxAmount = v;
      model.taxTotals.push({
        amount: v,
        currency: cur,
        hasSubtotals: !isAccounting,
        loc: ctx.loc(tt),
      });
    }
    T.rounding = ctx.num(sum, "RoundingAmount", T.locs, "rounding", "BT-114", { amount: true });
    T.taxInclusive = ctx.num(sum, "GrandTotalAmount", T.locs, "taxInclusive", "BT-112", {
      amount: true,
    });
    T.prepaid = ctx.num(sum, "TotalPrepaidAmount", T.locs, "prepaid", "BT-113", { amount: true });
    T.payable = ctx.num(sum, "DuePayableAmount", T.locs, "payable", "BT-115", { amount: true });
  }
  // currencyID is optional on CII amounts — only TaxTotalAmount carries it
  model.amountCurrencies = ctx.amountCurrencies.filter((a) => a.currency !== undefined);

  for (const li of kids(tx, "IncludedSupplyChainTradeLineItem")) {
    const L: LocMap = {};
    const docLine = at(li, "AssociatedDocumentLineDocument");
    const product = at(li, "SpecifiedTradeProduct");
    const la = at(li, "SpecifiedLineTradeAgreement");
    const ld = at(li, "SpecifiedLineTradeDelivery");
    const ls = at(li, "SpecifiedLineTradeSettlement");
    const qtyNode = at(ld, "BilledQuantity");
    const line: InvoiceLine = {
      id: ctx.str(docLine, "LineID", L, "id"),
      note: ctx.str(docLine, "IncludedNote/Content", L, "note"),
      quantity: ctx.num(ld, "BilledQuantity", L, "quantity", "BT-129"),
      unitCode: qtyNode?.attrs["unitCode"],
      netAmount: ctx.num(
        ls,
        "SpecifiedTradeSettlementLineMonetarySummation/LineTotalAmount",
        L,
        "netAmount",
        "BT-131",
        { amount: true },
      ),
      orderLineRef: ctx.str(la, "BuyerOrderReferencedDocument/LineID", L, "orderLineRef"),
      allowances: [],
      charges: [],
      attributes: [],
      locs: L,
      loc: ctx.loc(li),
    };
    if (qtyNode) L["unitCode"] = ctx.loc(qtyNode);
    if (product) {
      L["item"] = ctx.loc(product);
      line.itemName = ctx.str(product, "Name", L, "itemName");
      line.description = ctx.str(product, "Description", L, "description");
      line.sellerItemId = ctx.str(product, "SellerAssignedID", L, "sellerItemId");
      const gid = at(product, "GlobalID");
      if (gid) {
        line.standardItemId = { id: text(gid) ?? "", scheme: gid.attrs["schemeID"] };
        L["standardItemId"] = ctx.loc(gid);
      }
      line.classification = all(product, "DesignatedProductClassification").map((c) => {
        const code = at(c, "ClassCode");
        return { id: text(code) ?? "", scheme: code?.attrs["listID"] };
      });
      line.originCountry = ctx.str(product, "OriginTradeCountry/ID", L, "originCountry");
      line.attributes = kids(product, "ApplicableProductCharacteristic").map((c) => ({
        name: text(c, "Description"),
        value: text(c, "Value"),
      }));
    }
    const net = at(la, "NetPriceProductTradePrice");
    if (net) {
      L["price"] = ctx.loc(net);
      line.priceAmount = ctx.num(net, "ChargeAmount", L, "priceAmount", "BT-146");
      const bq = at(net, "BasisQuantity");
      if (bq) {
        line.baseQuantity = ctx.num(bq, "", L, "baseQuantity", "BT-149");
        line.baseQuantityUnit = bq.attrs["unitCode"];
      }
    }
    const gross = at(la, "GrossPriceProductTradePrice");
    if (gross) {
      line.grossPrice = ctx.num(gross, "ChargeAmount", L, "grossPrice", "BT-148");
      for (const ac of kids(gross, "AppliedTradeAllowanceCharge")) {
        if (text(ac, "ChargeIndicator/Indicator")?.toLowerCase() === "true") {
          line.hasPriceCharge = true;
          L["priceCharge"] = ctx.loc(ac);
        } else {
          line.priceDiscount = ctx.num(ac, "ActualAmount", L, "priceDiscount", "BT-147");
        }
      }
    }
    const lineTax = at(ls, "ApplicableTradeTax");
    if (lineTax) {
      line.vatCategory = ctx.str(lineTax, "CategoryCode", L, "vatCategory");
      line.vatRate = ctx.num(lineTax, "RateApplicablePercent", L, "vatRate", "BT-152");
      if (!L["vatCategory"]) L["vatCategory"] = ctx.loc(lineTax);
    }
    const lp = at(ls, "BillingSpecifiedPeriod");
    if (lp) {
      L["period"] = ctx.loc(lp);
      line.periodStart = ctx.ciiDate(lp, "StartDateTime", L, "periodStart", "BT-134");
      line.periodEnd = ctx.ciiDate(lp, "EndDateTime", L, "periodEnd", "BT-135");
    }
    for (const ac of kids(ls, "SpecifiedTradeAllowanceCharge")) {
      const item = readAllowanceCharge(ctx, ac, "line");
      (item.isCharge ? line.charges : line.allowances).push(item);
    }
    model.lines.push(line);
  }

  model.decimals = ctx.decimals;
  model.typeErrors = ctx.typeErrors;
  model.emptyElements = collectEmptyElements(root, ctx);
  return model;
}
