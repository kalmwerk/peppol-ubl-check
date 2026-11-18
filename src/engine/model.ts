/**
 * EN16931 semantic invoice model. Both UBL and CII are mapped into this shape
 * so that business rules and the inspection view work for every syntax.
 * Field comments reference the EN16931 business term (BT/BG) numbers.
 */

export interface Loc {
  line: number;
  col: number;
  xpath: string;
  /**
   * The element's text exactly as written, only when it has leading or trailing whitespace (values in
   * the model are trimmed). Some official rules compare the text as is, e.g. `udt:Indicator = 'false'`.
   */
  raw?: string;
}

export type LocMap = Record<string, Loc>;

export interface Identifier {
  id: string;
  scheme?: string;
  loc?: Loc;
}

export interface Address {
  line1?: string;
  line2?: string;
  line3?: string;
  city?: string;
  postalCode?: string;
  subdivision?: string;
  country?: string;
}

export interface Party {
  name?: string; // BT-27 / BT-44
  tradingName?: string; // BT-28 / BT-45
  identifiers: Identifier[]; // BT-29 / BT-46
  legalId?: Identifier; // BT-30 / BT-47
  vatId?: string; // BT-31 / BT-48
  taxRegistrationId?: string; // BT-32
  legalForm?: string; // BT-33 seller additional legal information
  endpoint?: Identifier; // BT-34 / BT-49
  address?: Address; // BG-5 / BG-8
  contact?: { name?: string; phone?: string; email?: string }; // BG-6 / BG-9
  /**
   * Every tax registration the party carries, as the official VAT category rules read them: UBL each
   * PartyTaxScheme with a CompanyID (`scheme` = its TaxScheme/ID), CII each SpecifiedTaxRegistration/ID
   * (`scheme` = its schemeID attribute, VA or FC). vatId / taxRegistrationId above pick one of each.
   */
  taxRegistrations?: { scheme?: string; loc: Loc }[];
  locs: LocMap;
  loc?: Loc;
}

export interface AllowanceCharge {
  isCharge: boolean;
  amount?: number; // BT-92 / BT-99 / BT-136 / BT-141
  baseAmount?: number;
  percent?: number;
  reason?: string;
  reasonCode?: string;
  vatCategory?: string;
  vatRate?: number;
  /** Tax scheme of the VAT category (UBL TaxCategory/TaxScheme/ID, CII CategoryTradeTax/TypeCode) */
  vatScheme?: string;
  /** UBL TaxCategory/TaxExemptionReasonCode (PEPPOL-EN16931-P0104 … P0111 check every TaxCategory) */
  vatExemptionCode?: string;
  rawIndicator?: string;
  locs: LocMap;
  loc?: Loc;
}

export interface InvoiceLine {
  id?: string; // BT-126
  note?: string; // BT-127
  quantity?: number; // BT-129
  unitCode?: string; // BT-130
  netAmount?: number; // BT-131
  orderLineRef?: string; // BT-132
  periodStart?: string; // BT-134
  periodEnd?: string; // BT-135
  allowances: AllowanceCharge[];
  charges: AllowanceCharge[];
  priceAmount?: number; // BT-146
  priceDiscount?: number; // BT-147
  grossPrice?: number; // BT-148
  baseQuantity?: number; // BT-149
  baseQuantityUnit?: string; // BT-150
  /** A price-level allowance/charge whose ChargeIndicator isn't exactly "false" (UBL, PEPPOL-EN16931-R044) */
  hasPriceCharge?: boolean;
  /** CII gross-price base quantity (Peppol R121/R130 also check it) */
  grossBaseQuantity?: number;
  grossBaseQuantityUnit?: string;
  /** CII price-level allowances/charges (AppliedTradeAllowanceCharge): raw ChargeIndicator, for PEPPOL-EN16931-R043 */
  priceIndicators?: { raw?: string; loc: Loc }[];
  /**
   * UBL price-level allowances/charges (Price/AllowanceCharge), read for the rules that look at every
   * cac:AllowanceCharge (reason code lists, VAT category of any TaxCategory). Their amounts are BT-147/148 above.
   */
  priceAllowanceCharges?: AllowanceCharge[];
  /** Line object references (UBL cac:DocumentReference, CII line AdditionalReferencedDocument) with their type code as written */
  documentRefs?: { typeCode?: string; loc: Loc }[];
  vatCategory?: string; // BT-151
  vatRate?: number; // BT-152
  /** Tax scheme of the line VAT category (UBL ClassifiedTaxCategory/TaxScheme/ID, CII ApplicableTradeTax/TypeCode) */
  vatScheme?: string;
  itemName?: string; // BT-153
  description?: string; // BT-154
  sellerItemId?: string; // BT-155
  standardItemId?: Identifier; // BT-157
  classification?: Identifier[]; // BT-158
  originCountry?: string; // BT-159
  attributes: { name?: string; value?: string }[]; // BG-32
  locs: LocMap;
  loc?: Loc;
}

export interface VatBreakdown {
  taxableAmount?: number; // BT-116
  taxAmount?: number; // BT-117
  category?: string; // BT-118
  rate?: number; // BT-119
  exemptionReason?: string; // BT-120
  exemptionCode?: string; // BT-121
  /** Tax scheme (UBL TaxCategory/TaxScheme/ID, CII TypeCode); the category rules only read VAT rows */
  scheme?: string;
  locs: LocMap;
  loc?: Loc;
}

export type CodedKind =
  | "country"
  | "originCountry"
  | "classificationScheme"
  | "taxCategory"
  | "itemTaxCategory"
  /** UBL: every cbc:IdentificationCode (BR-B-01) */
  | "identificationCode"
  /** CII: every ram:CategoryCode (BR-B-01, BR-B-02) */
  | "categoryCode"
  /** UBL cac:InvoicePeriod/cbc:DescriptionCode (BR-CL-06, PEPPOL-EN16931-CL006) */
  | "periodDescriptionCode"
  /** CII ram:DueDateTypeCode (BR-CL-06) */
  | "dueDateTypeCode"
  /** UBL: a cbc:Note directly under the root, its string value (BR-CL-08 reads "#CODE#" at its start) */
  | "rootNote"
  /** CII ram:SubjectCode (BR-CL-08) */
  | "subjectCode"
  /** schemeID of UBL cac:PartyIdentification/cbc:ID, or of a CII ram:GlobalID outside products and ship-to parties (BR-CL-10) */
  | "partyIdScheme"
  /** schemeID of UBL cac:StandardItemIdentification/cbc:ID or CII ram:SpecifiedTradeProduct/ram:GlobalID (BR-CL-21) */
  | "itemIdScheme"
  /** schemeID of UBL cac:DeliveryLocation/cbc:ID or the CII header ship-to party's ram:GlobalID (BR-CL-26) */
  | "deliveryIdScheme"
  /** UBL cbc:TaxExemptionReasonCode, CII ram:ExemptionReasonCode (BR-CL-22) */
  | "exemptionCode"
  /** The payee account of a credit-transfer payment means (code 30 or 58): its identifier(s), normalised (BR-50) */
  | "creditTransferAccount";

export interface CodedValue {
  kind: CodedKind;
  value: string;
  owner: string;
  loc: Loc;
  /** UBL TaxCategory: in a TaxTotal/TaxSubtotal or an AllowanceCharge directly under the root (BR-B-02) */
  docLevel?: boolean;
  /** UBL PartyIdentification inside the seller or payee party, where BR-CL-10 also accepts SEPA */
  sellerOrPayee?: boolean;
}

export interface PaymentMeans {
  code?: string; // BT-81
  text?: string; // BT-82
  paymentId?: string; // BT-83
  account?: string; // BT-84
  accountName?: string; // BT-85
  bic?: string; // BT-86
  cardPan?: string; // BT-87
  mandateRef?: string; // BT-89
  debitedAccount?: string; // BT-91
  /** BG-17 credit transfer group present (UBL PayeeFinancialAccount, CII creditor account) */
  hasCreditTransfer?: boolean;
  /** BG-18 payment card group present */
  hasCard?: boolean;
  /** BG-19 direct debit group present (UBL PaymentMandate; CII mandate, creditor ID or debtor IBAN) */
  hasDirectDebit?: boolean;
  locs: LocMap;
  loc?: Loc;
}

export interface Totals {
  lineExtension?: number; // BT-106
  allowanceTotal?: number; // BT-107
  chargeTotal?: number; // BT-108
  taxExclusive?: number; // BT-109
  taxAmount?: number; // BT-110
  taxAmountAccounting?: number; // BT-111
  taxInclusive?: number; // BT-112
  prepaid?: number; // BT-113
  rounding?: number; // BT-114
  payable?: number; // BT-115
  locs: LocMap;
  loc?: Loc;
}

export type Syntax = "UBL" | "CII";

/** An identifier element carrying a schemeID, wherever it sits (the Peppol identifier rules check them all). */
export interface SchemeIdentifier {
  /** UBL: EndpointID, PartyIdentification/ID or CompanyID; CII: URIID, ID or GlobalID */
  element: string;
  /** schemeID exactly as written */
  scheme: string;
  /** Element text, trimmed */
  id: string;
  /** Whose identifier it is in plain words: "Seller", "Buyer", "Payee", "Item" … */
  owner: string;
  /** What kind of identifier it is: "EndpointID", "party identifier", "legal registration number" … */
  kind: string;
  /** Seller or buyer electronic address (BT-34 / BT-49) */
  endpoint?: boolean;
  loc: Loc;
}

export interface InvoiceModel {
  syntax: Syntax;
  kind: "invoice" | "creditnote";
  customizationId?: string; // BT-24
  profileId?: string; // BT-23
  number?: string; // BT-1
  issueDate?: string; // BT-2 (ISO yyyy-mm-dd)
  typeCode?: string; // BT-3
  currency?: string; // BT-5
  taxCurrency?: string; // BT-6
  taxPointDate?: string; // BT-7
  taxPointCode?: string; // BT-8
  dueDate?: string; // BT-9
  buyerReference?: string; // BT-10
  projectRef?: string; // BT-11
  contractRef?: string; // BT-12
  orderRef?: string; // BT-13
  salesOrderRef?: string; // BT-14
  receivingAdviceRef?: string; // BT-15
  despatchAdviceRef?: string; // BT-16
  accountingCost?: string; // BT-19
  paymentTerms?: string; // BT-20
  /** BT-20 exactly as written (untrimmed), for the XRechnung Skonto syntax (BR-DE-18) */
  paymentTermsRaw?: string;
  /** BT-90 bank assigned creditor identifier (SEPA creditor ID) */
  creditorId?: string;
  notes: string[]; // BT-22
  precedingInvoices: { id?: string; date?: string; loc?: Loc }[]; // BG-3
  periodStart?: string; // BT-73
  periodEnd?: string; // BT-74
  hasPeriod: boolean;
  /** BG-14 carries something the official rules accept: UBL any child element, CII a start or end date element */
  periodHasContent?: boolean;
  /** An actual delivery date is written (UBL: longer than one character; CII: a DateTimeString element) */
  deliveryDateGiven?: boolean;
  /** CII: first document note with a subject code (PEPPOL-EN16931-R002 forbids them) */
  noteSubjectCode?: Loc;
  seller: Party; // BG-4
  buyer: Party; // BG-7
  payee?: Party; // BG-10
  taxRepresentative?: Party; // BG-11
  delivery?: { date?: string; partyName?: string; address?: Address; locs: LocMap; loc?: Loc }; // BG-13
  paymentMeans: PaymentMeans[]; // BG-16
  allowances: AllowanceCharge[]; // BG-20
  charges: AllowanceCharge[]; // BG-21
  vat: VatBreakdown[]; // BG-23
  taxTotals: { amount?: number; currency?: string; hasSubtotals: boolean; loc?: Loc }[];
  totals: Totals; // BG-22
  lines: InvoiceLine[]; // BG-25
  /** BG-24 and the other document references read with it (UBL AdditionalDocumentReference, CII header AdditionalReferencedDocument); typeCode as written */
  attachments: { id?: string; description?: string; filename?: string; mime?: string; typeCode?: string; loc?: Loc }[];
  /**
   * Amount nodes with their currencyID attribute, for currency consistency checks. UBL lists every
   * element PEPPOL-EN16931-R051 checks (`bt` names the term or element); CII only amounts that carry one.
   */
  amountCurrencies: { bt: string; currency?: string; loc: Loc }[];
  /** Every identifier with a schemeID (PEPPOL-COMMON-R040/R043, PEPPOL-EN16931-CL008) */
  schemeIds: SchemeIdentifier[];
  /**
   * Every element whose name ends in BinaryObject, wherever it sits, with its mimeCode and filename as written:
   * BR-CL-24 and PEPPOL-EN16931-CL001 read the attachments (UBL EmbeddedDocumentBinaryObject, CII
   * AttachmentBinaryObject) that have a mimeCode, UBL-DT-06/07 every one.
   */
  binaryObjects?: { element: string; mime?: string; filename?: string; loc: Loc }[];
  /**
   * Every amount whose currencyID the code-list rules check (BR-CL-03, PEPPOL-EN16931-CL007), attribute as
   * written: UBL the thirteen cbc amount elements anywhere, CII each TaxTotalAmount that carries one.
   */
  currencyIds?: { element: string; currency?: string; loc: Loc }[];
  /** Invoiced object identifier schemes (BR-CL-07): UBL the schemeID of a type-130 document reference's ID, CII every ReferenceTypeCode */
  objectIdSchemes?: { scheme: string; loc: Loc }[];
  /**
   * Every date element with its text as written, for PEPPOL-EN16931-F001: UBL the six cbc date elements
   * (IssueDate, DueDate, TaxPointDate, StartDate, EndDate, ActualDeliveryDate) anywhere, CII every
   * udt:DateTimeString with its format attribute.
   */
  dates?: { element: string; raw: string; format?: string; loc: Loc }[];
  /**
   * Coded values the official code-list rules read wherever they sit, text as written: country codes (BR-CL-14),
   * item countries of origin (BR-CL-15), item classification schemes (BR-CL-13), the VAT category of a
   * TaxCategory / CategoryTradeTax (BR-CL-17) and of a ClassifiedTaxCategory / ApplicableTradeTax (BR-CL-18),
   * and the values of BR-CL-06, -08, -10, -21, -22, -26, BR-50, BR-B-01/02 and PEPPOL-EN16931-CL006 (see CodedKind).
   */
  codedValues?: CodedValue[];
  /** UBL: every element whose name ends in Amount, text as written, for UBL-DT-01 (PriceAmount and price-level allowance amounts excepted) */
  amountTexts?: { element: string; raw: string; loc: Loc }[];
  /** Raw amount strings for decimal-precision checks */
  decimals: { bt: string; raw: string; loc: Loc }[];
  /** Fields that failed basic type parsing (bad dates, non-numeric amounts) */
  typeErrors: { bt: string; raw: string; expected: string; loc: Loc }[];
  /** Elements present but empty (Peppol R008) */
  emptyElements: Loc[];
  locs: LocMap;
  loc: Loc;
}

export function emptyParty(): Party {
  return { identifiers: [], locs: {} };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function sameAmount(a: number | undefined, b: number | undefined): boolean {
  if (a === undefined || b === undefined) return false;
  return Math.abs(round2(a) - round2(b)) < 0.0001;
}

export function sum(values: (number | undefined)[]): number {
  return round2(values.reduce<number>((acc, v) => acc + (v ?? 0), 0));
}

export function fmtAmount(n: number | undefined, currency?: string): string {
  if (n === undefined || Number.isNaN(n)) return "—";
  const s = n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `${s} ${currency}` : s;
}
