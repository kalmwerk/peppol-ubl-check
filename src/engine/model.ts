/**
 * EN16931 semantic invoice model. Both UBL and CII are mapped into this shape
 * so that business rules and the inspection view work for every syntax.
 * Field comments reference the EN16931 business term (BT/BG) numbers.
 */

export interface Loc {
  line: number;
  col: number;
  xpath: string;
}

export type LocMap = Record<string, Loc>;

export interface Identifier {
  id: string;
  scheme?: string;
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
  endpoint?: Identifier; // BT-34 / BT-49
  address?: Address; // BG-5 / BG-8
  contact?: { name?: string; phone?: string; email?: string }; // BG-6 / BG-9
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
  hasPriceCharge?: boolean;
  vatCategory?: string; // BT-151
  vatRate?: number; // BT-152
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
  locs: LocMap;
  loc?: Loc;
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
  notes: string[]; // BT-22
  precedingInvoices: { id?: string; date?: string; loc?: Loc }[]; // BG-3
  periodStart?: string; // BT-73
  periodEnd?: string; // BT-74
  hasPeriod: boolean;
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
  attachments: { id?: string; description?: string; filename?: string; mime?: string }[]; // BG-24
  /** Amount nodes with their currencyID attribute, for currency consistency checks */
  amountCurrencies: { bt: string; currency?: string; loc: Loc }[];
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
