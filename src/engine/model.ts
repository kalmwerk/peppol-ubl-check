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
  /** CII: every ram:URIUniversalCommunication/ram:URIID of the party (`endpoint` is the first group's); Peppol's R010 / R020 and CL008 read them all */
  endpointIds?: { id: string; scheme?: string; loc: Loc }[];
  address?: Address; // BG-5 / BG-8
  contact?: { name?: string; phone?: string; email?: string }; // BG-6 / BG-9
  /**
   * Every tax registration the party carries, as the official VAT category rules read them: UBL each
   * PartyTaxScheme with a CompanyID (`scheme` = its TaxScheme/ID), CII each SpecifiedTaxRegistration/ID
   * (`scheme` = its schemeID attribute, VA or FC). vatId / taxRegistrationId above pick one of each.
   */
  /** Every UBL PartyTaxScheme with a CompanyID (scheme: its TaxScheme/ID) or CII SpecifiedTaxRegistration/ID (scheme: schemeID as written); id: the text */
  taxRegistrations?: { scheme?: string; id: string; loc: Loc; /** UBL TaxScheme/ID exactly as written (Peppol's `cbc:ID = 'VAT'`) */ schemeAsWritten?: string }[];
  locs: LocMap;
  loc?: Loc;
}

/**
 * One VAT category group as written: UBL cac:TaxCategory (allowances and charges) or cac:ClassifiedTaxCategory
 * (lines), CII ram:CategoryTradeTax or ram:ApplicableTradeTax. The single VAT fields of a line or an allowance /
 * charge read the first group; the official rules take each group as a context or test them all (`exists(…)`),
 * so a repeated group counts there.
 */
export interface TaxGroup {
  category?: string;
  rate?: number;
  /** UBL TaxScheme/ID, CII TypeCode */
  scheme?: string;
  /** UBL TaxExemptionReasonCode */
  exemptionCode?: string;
  /** category, rate, scheme, exemptionCode: the elements (loc.raw keeps the text as written) */
  locs: LocMap;
  loc: Loc;
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
  /** CII: every ram:ActualAmount as a number (undefined when not one); Peppol's R120 sums them all, EN 16931 reads the first */
  actualAmounts?: (number | undefined)[];
  /** Every VAT category group (the vat* fields above read the first) */
  taxes?: TaxGroup[];
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
  /** CII BR-30: the period's end and start dates with format exactly "102", compared as written, are in order (or one is missing) */
  periodInOrder?: boolean;
  periodEnd?: string; // BT-135
  /**
   * CII PEPPOL-EN16931-R110 / R111: the line period's start (end) DateTimeStrings compared as written, as strings,
   * with the invoice period's (`>=` / `<=`, any pair matching). Unset when the rule doesn't run: the line or the
   * invoice period has no StartDateTime (EndDateTime) element.
   */
  periodWithinInvoice?: { start?: { ok: boolean; line: string; invoice: string }; end?: { ok: boolean; line: string; invoice: string } };
  /** UBL: every cac:InvoicePeriod of the line (periodStart / periodEnd read the first); locs: start, end */
  periods?: { start?: string; end?: string; locs: LocMap; loc: Loc }[];
  allowances: AllowanceCharge[];
  charges: AllowanceCharge[];
  /** Every VAT category group (vatCategory, vatRate and vatScheme read the first) */
  taxes?: TaxGroup[];
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
  /** CII: every NetPriceProductTradePrice/ChargeAmount and GrossPriceProductTradePrice/ChargeAmount (the elements may
   * repeat; BR-27 and BR-28 compare all of them at once, `(…/ram:ChargeAmount) >= 0`) */
  netPrices?: (number | undefined)[];
  grossPrices?: (number | undefined)[];
  /** Line object references (UBL cac:DocumentReference, CII line AdditionalReferencedDocument) with their type code as written */
  /** idGiven (CII): a filled-in IssuerAssignedID (BR-52 reads every AdditionalReferencedDocument) */
  documentRefs?: { typeCode?: string; idGiven?: boolean; loc: Loc }[];
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
  /** BG-32; hasName/hasValue: the elements are there, filled or not (BR-54) */
  attributes: { name?: string; value?: string; hasName?: boolean; hasValue?: boolean }[];
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
  /** schemeID of UBL cac:PartyLegalEntity/cbc:CompanyID, or of any CII ram:ID outside ram:SpecifiedTaxRegistration (BR-CL-11) */
  | "legalIdScheme"
  /** schemeID of every UBL cbc:EndpointID, or of every CII ram:URIUniversalCommunication/ram:URIID (BR-CL-25) */
  | "endpointScheme"
  /** A VAT identifier as BR-CO-09 reads it: UBL each cac:PartyTaxScheme with TaxScheme VAT (its CompanyID as written, "" without one); CII each ram:SpecifiedTaxRegistration/ram:ID with schemeID exactly "VA" */
  | "vatIdentifier"
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
  /** CII: a PayeePartyCreditorFinancialAccount has an IBANID or ProprietaryID element (BR-61) */
  accountIdGiven?: boolean;
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
  /** CII BR-03: an issue date with format exactly "102" whose text isn't empty after normalize-space() */
  issueDateFilled?: boolean;
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
  /** BG-3; idGiven: the element BR-55 asks for (UBL InvoiceDocumentReference/ID, filled or not; CII a filled-in IssuerAssignedID) */
  precedingInvoices: { id?: string; date?: string; idGiven?: boolean; loc?: Loc }[];
  periodStart?: string; // BT-73
  periodEnd?: string; // BT-74
  hasPeriod: boolean;
  /** CII BR-29: the invoice period's end and start dates with format exactly "102", compared as written, are in order (or one is missing) */
  periodInOrder?: boolean;
  /** BG-14 carries something the official rules accept: UBL any child element, CII a start or end date element */
  periodHasContent?: boolean;
  /**
   * UBL: every BG-14 (cac:InvoicePeriod may repeat), for the rules that check each one (BR-CO-19, BR-29);
   * periodStart/periodEnd/taxPointCode above come from the first copy that has them.
   */
  invoicePeriods?: { start?: string; end?: string; startGiven: boolean; endGiven: boolean; codeGiven: boolean; locs: LocMap; loc?: Loc }[];
  /** An actual delivery date is written (UBL: longer than one character; CII: a DateTimeString element) */
  deliveryDateGiven?: boolean;
  /** UBL: a deliver-to country code longer than one character is written in some delivery (BR-IC-12, as written) */
  deliveryCountryGiven?: boolean;
  /** UBL: every deliver-to address (cac:Delivery may repeat), with whether it has a country code element (BR-57) */
  deliveryAddresses?: { countryGiven: boolean; loc?: Loc }[];
  /** CII: first document note with a subject code (PEPPOL-EN16931-R002 forbids them) */
  noteSubjectCode?: Loc;
  seller: Party; // BG-4
  buyer: Party; // BG-7
  payee?: Party; // BG-10
  /**
   * BR-17's second half: what the payee repeats from the seller, as the official XPath general comparison
   * finds it (any equal pair of strings as written): UBL PartyName/Name or PartyIdentification/ID; CII
   * ram:Name, ram:ID or SpecifiedLegalOrganization/ram:ID. Undefined when the payee repeats none of them.
   */
  payeeRepeatsSeller?: "name" | "identifier" | "legal registration identifier";
  taxRepresentative?: Party; // BG-11
  delivery?: { date?: string; partyName?: string; address?: Address; locs: LocMap; loc?: Loc }; // BG-13
  paymentMeans: PaymentMeans[]; // BG-16
  allowances: AllowanceCharge[]; // BG-20
  charges: AllowanceCharge[]; // BG-21
  vat: VatBreakdown[]; // BG-23
  /** UBL: every cac:TaxTotal, with its own TaxSubtotal tax amounts (BR-CO-14 runs per TaxTotal); CII: every TaxTotalAmount */
  taxTotals: { amount?: number; currency?: string; hasSubtotals: boolean; subtotalTaxAmounts?: (number | undefined)[]; loc?: Loc }[];
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
  /**
   * The fatal CEN syntax-binding violations (UBL-SR, UBL-CR, CII-SR, CII-DT), read off the XML tree (syntax-binding.ts);
   * `cen` marks the ones only one CEN version reports (1.3.16 as Peppol BIS 3.0.22 ships it, or 1.3.17)
   */
  syntaxViolations?: { id: string; detail?: string; loc: Loc; cen?: "1.3.16" | "1.3.17" }[];
  binaryObjects?: {
    element: string;
    mime?: string;
    filename?: string;
    /** cbc:EmbeddedDocumentBinaryObject (UBL) or ram:AttachmentBinaryObject (CII) in its own namespace: what BR-CL-24 and CL001 name; UBL-DT-06/07 match any `*BinaryObject` by name() */
    attachment: boolean;
    loc: Loc;
  }[];
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
  /** What the SI-UBL 2.0 / NLCIUS rules read, exactly as the official Schematron does (see NlciusFacts) */
  nlcius?: NlciusFacts;
  /** What the XRechnung rules read, exactly as KoSIT's Schematron does (see XrechnungFacts) */
  xrechnung?: XrechnungFacts;
  locs: LocMap;
  loc: Loc;
}

/**
 * The inputs of the SI-UBL 2.0 (UBL) and NLCIUS-CII rules, read the way the Dutch Peppol Authority's
 * Schematron reads them (validation set 2026-05-21: si-ubl-2.0-nlcius.sch, NLCIUS-CII-validation.sch):
 * elements that are there count whether filled or not, text is compared as written unless the official
 * test normalises it, and each rule runs once per context element. Readers fill it for both syntaxes;
 * `src/lib/einvoice/rules-national.ts` evaluates the rules.
 */
export interface NlciusFacts {
  /** `$si`: the CustomizationID declares SI-UBL 2.0 / NLCIUS or its G-account extension (UBL: contains, CII: equals, after normalize-space) */
  declared: boolean;
  /** `$s`: `$si` and the seller's postal country is NL (`upper-case(normalize-space(…))`) */
  dutchSupplier: boolean;
  /** UBL: every cbc:CustomizationID, normalize-space()d (SI-V20-INV-R000 checks each); CII has no such rule */
  customizationIds: { value: string; loc: Loc }[];
  /** BR-NL-1 contexts (UBL each seller cac:Party, CII each seller ram:SpecifiedLegalOrganization): legal ID schemeIDs as written, and whether any legal ID has text after normalize-space() */
  sellerLegal: { loc: Loc; schemes: string[]; filled: boolean; idLoc?: Loc; id?: string; scheme?: string }[];
  /** BR-NL-2 contexts (UBL the root, CII each ram:ApplicableHeaderTradeAgreement): a buyer reference or order reference ID element is there */
  references: { loc: Loc; given: boolean }[];
  /** BR-NL-3/4/5 contexts: each seller, buyer and tax representative postal address; `countryNotNl` is the official `country != 'NL'` (as written, any of them); `missing` lists the street, city and post code elements that aren't there */
  addresses: { party: "seller" | "buyer" | "taxRepresentative"; loc: Loc; countryNotNl: boolean; missing: string[] }[];
  /** BR-NL-7/8/9 contexts: UBL every InvoiceTypeCode / CreditNoteTypeCode, CII /\*\/rsm:ExchangedDocument/ram:TypeCode; text as written */
  typeCodes: { text: string; loc: Loc }[];
  /** UBL: /\*\/cac:BillingReference/cac:InvoiceDocumentReference/cbc:ID is there (BR-NL-9) */
  invoiceReferenceGiven: boolean;
  /**
   * BR-NL-10 contexts (UBL each buyer cac:PartyLegalEntity, CII each ram:BuyerTradeParty): whether the buyer's
   * country is exactly NL, the legal ID schemeIDs as written, how many legal ID elements there are and whether
   * any has text. UBL passes without a CompanyID; CII requires a filled-in one (`idRequired`).
   */
  buyerLegal: { loc: Loc; countryNl: boolean; schemes: string[]; ids: number; filled: boolean; idRequired: boolean }[];
  /** BR-NL-11 contexts (UBL /ubl:Invoice/cac:LegalMonetaryTotal, CII each header monetary summation): amount due as written, and whether payment means count as given there */
  totals: { loc: Loc; payable?: string; paymentGiven: boolean }[];
  /** CII: the document type code equals 381 as a number (BR-NL-11 lets credit notes through) */
  creditNoteType: boolean;
  /** BR-NL-12 (and UBL BR-NL-31) contexts: each payment means, its code elements as written, and (UBL) whether a FinancialInstitutionBranch/ID is there */
  paymentMeans: { loc: Loc; codes: string[]; codeLoc?: Loc; branchIdGiven: boolean; branchLoc?: Loc }[];
  /** BR-NL-13: order line reference elements (UBL cac:OrderLineReference/cbc:LineID, CII ram:BuyerOrderReferencedDocument/ram:LineID) */
  orderLineRefs: { loc: Loc; text: string }[];
  /** BR-NL-13: the document-level order reference ID element is there */
  orderReferenceGiven: boolean;
  /** BR-NL-25 contexts: each seller tax registration (UBL PartyTaxScheme, CII SpecifiedTaxRegistration): it has an ID, and its scheme is exactly VAT (UBL TaxScheme/ID) / VA (CII schemeID) */
  sellerTaxSchemes: { loc: Loc; hasId: boolean; vat: boolean; id?: string }[];
  /** BR-NL-33 contexts (UBL every cac:TaxTotal/cbc:TaxAmount, CII every header TaxTotalAmount): currencyID as written and the document currency codes it is compared with */
  taxTotalCurrencies: { loc: Loc; currency?: string; documentCurrencies: string[] }[];
  /** Elements NLCIUS asks Dutch suppliers to leave out, wherever the official rule context finds them (BR-NL-19 … BR-NL-35); `charge`: a CII charge reason code (BR-NL-32-and-34) */
  discouraged: { rule: NlDiscouragedRule; loc: Loc; value?: string; charge?: boolean }[];
  /** SI-UBL-2 / empty-element-check: every empty element, and whether an earlier rule of the same official pattern takes it as context (`s`: a Dutch-supplier rule, `si`: an SI-UBL rule for any supplier), which keeps the empty-element check from reporting it */
  emptyElements: { loc: Loc; shadowedBy?: "s" | "si" }[];
}
export type NlDiscouragedRule =
  | "BR-NL-19"
  | "BR-NL-20"
  | "BR-NL-21"
  | "BR-NL-22"
  | "BR-NL-23"
  | "BR-NL-24"
  | "BR-NL-26"
  | "BR-NL-27"
  | "BR-NL-28"
  | "BR-NL-29"
  | "BR-NL-30"
  | "BR-NL-32"
  | "BR-NL-35";

/**
 * The inputs of the XRechnung rules (BR-DE-*), read the way KoSIT's XRechnung Schematron 2.6.0 reads them
 * (XRechnung 3.0.2): each rule's context element, presence of elements filled or not, `[boolean(normalize-space(.))]`
 * filled-in tests, and values compared as written where the official test does. Filled for both syntaxes.
 */
export interface XrechnungFacts {
  /** BR-DE-1: a payment means element is there */
  paymentMeansGiven: boolean;
  /** BR-DE-15: a buyer reference with text after normalize-space() */
  buyerReferenceFilled: boolean;
  /** BR-DE-16: a VAT category code S, Z, E, AE, K, G, L or M is used where the official test looks (exactly as written) */
  vatCodeUsed?: string;
  /** BR-DE-16: a seller VAT or tax registration identifier with text (UBL any PartyTaxScheme/CompanyID, CII a SpecifiedTaxRegistration/ID with schemeID VA or FC), or a tax representative */
  sellerTaxIdGiven: boolean;
  /** BR-DE-17 / BR-DE-26: the document type code(s) after normalize-space(); "" when there is none */
  typeCodes: string[];
  /** BR-DE-26: UBL cac:BillingReference/cac:InvoiceDocumentReference, CII header ram:InvoiceReferencedDocument is there */
  invoiceReferenceGiven: boolean;
  /** BR-DE-18: the first payment terms note (UBL cac:PaymentTerms/cbc:Note[1], CII ram:SpecifiedTradePaymentTerms/ram:Description[1]), text as written */
  paymentTermsNote?: { text: string; loc: Loc };
  /** BR-DE-21 context (UBL the root, CII rsm:ExchangedDocumentContext): the specification identifiers as written */
  specIds?: { values: string[]; loc: Loc };
  /** BR-DE-22: a filename attribute repeated by a later sibling attachment, as written */
  duplicateFilename?: string;
  /**
   * BR-DE-30/31. UBL: `mandate` = a PaymentMeans/PaymentMandate is there, `creditorId` = a seller or payee
   * PartyIdentification/ID with schemeID exactly SEPA, `debitedAccount` = PaymentMandate/PayerFinancialAccount/ID.
   * CII: `mandate` = BT-89 (DirectDebitMandateID), `creditorId` = BT-90 (CreditorReferenceID), `debitedAccount` =
   * BT-91 (PayerPartyDebtorFinancialAccount/IBANID); elements that are there, filled or not.
   */
  directDebit: { mandate: boolean; creditorId: boolean; debitedAccount: boolean };
  /** BR-DE-2 contexts: each seller (UBL cac:AccountingSupplierParty, CII ram:SellerTradeParty) and whether it has a contact */
  sellers: { loc: Loc; contactGiven: boolean }[];
  /** BR-DE-3/4, 8/9, 10/11 contexts: each seller, buyer and deliver-to postal address, city and post code filled in */
  addresses: { party: "seller" | "buyer" | "delivery"; loc: Loc; cityFilled: boolean; postcodeFilled: boolean }[];
  /** BR-DE-5/6/7/27/28 contexts: each seller contact; name (CII: PersonName or DepartmentName), telephone and email filled in, and the normalize-space()d telephone and email the format rules read */
  contacts: { loc: Loc; nameFilled: boolean; phoneFilled: boolean; emailFilled: boolean; phone: string; email: string; phoneLoc?: Loc; emailLoc?: Loc }[];
  /**
   * BR-DE-19/20/23/24/25 contexts: each payment means with its code after normalize-space(), the groups it carries
   * (CII `directDebit`: BT-89, BT-90 or its own BT-91 is there; `institutions`: a payee or payer financial
   * institution), and the account identifiers the IBAN rules read (`string(…)` of the first one, as written).
   */
  paymentMeans: { loc: Loc; code: string; creditTransfer: boolean; card: boolean; directDebit: boolean; institutions: boolean; payeeAccount: string; payerAccount: string; payeeLoc?: Loc; payerLoc?: Loc }[];
  /** BR-DE-14 contexts: each document-level VAT breakdown, and whether its rate has text */
  vatRates: { loc: Loc; filled: boolean; category?: string }[];
  /** BR-DE-TMP-32: a delivery date, an invoicing period or a period on every line is there */
  deliveryDateOrPeriod: boolean;
  /** The Peppol rules KoSIT copies into its XRechnung files, where its copy differs from Peppol's own */
  kosit: KositPeppolFacts;
  /** KoSIT's temporary XRechnung rules BR-TMP-2 … BR-TMP-7 (Schematron 2.6.0) */
  tmp: XrechnungTmpFacts;
}

export interface XrechnungTmpFacts {
  /**
   * BR-TMP-2: UBL each cac:AdditionalDocumentReference/cac:Attachment/cac:ExternalReference with its first cbc:URI
   * as written (`null` when there is none, which fails like a bad one); CII each header AdditionalReferencedDocument
   * with a TypeCode exactly "916" that has a URIID, with the first URIID as written
   */
  externalUris: { loc: Loc; uri: string | null }[];
  /** BR-TMP-4 / BR-TMP-5 (CII): each of those "916" documents with its number of ram:Name and ram:AttachmentBinaryObject */
  supportingDocs: { loc: Loc; names: number; attachments: number }[];
  /** BR-TMP-3 (CII): lines whose gross and net price base quantities, or their unit codes, differ as written */
  baseQuantityMismatch: Loc[];
  /**
   * BR-TMP-6 (UBL: cbc:IssueDate, DueDate, StartDate, EndDate, ActualDeliveryDate, TaxPointDate, PaymentDueDate
   * anywhere) / BR-TMP-7 (CII: every udt:DateTimeString, qdt:DateTimeString and udt:DateString): dates not written
   * as YYYY-MM-DD / format="102" with YYYYMMDD after normalize-space(), with the text as written
   */
  badDates: { loc: Loc; text: string; format?: string }[];
}

export interface KositPeppolFacts {
  /**
   * PEPPOL-EN16931-R008 (both syntaxes, unlike Peppol's own files): every element without child elements whose
   * normalize-space() is empty, except UBL cbc:ID under cac:OrderReference and CII elements whose name as
   * written is exactly ram:ApplicableHeaderTradeDelivery
   */
  emptyElements: Loc[];
  /** `$slackValue` is 0.5 instead of 0.02 when a document currency code is exactly "HUF" (R040, R120) */
  huf: boolean;
  /**
   * CII R044 / R046 contexts (KoSIT only): each line's GrossPriceProductTradePrice. `discounts` holds the
   * first ActualAmount of each AppliedTradeAllowanceCharge; amounts are xs:decimal values, `null` where the
   * official cast would fail.
   */
  grossPrices: {
    loc: Loc;
    actualGiven: boolean;
    indicatorFalse: boolean;
    chargeAmounts: (number | null)[];
    netChargeAmounts: (number | null)[];
    discounts: (number | null)[];
  }[];
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
