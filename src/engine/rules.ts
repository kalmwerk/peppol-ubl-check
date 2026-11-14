import {
  CREDIT_TRANSFER_CODES,
  DIRECT_DEBIT_CODES,
  EAS_CODES,
  INVOICE_TYPE_CODES,
  isNlciusId,
  ISO_3166,
  NLCIUS_CUSTOMIZATION_ID,
  ISO_4217,
  PAYMENT_MEANS,
  PEPPOL_CREDIT_NOTE_TYPE_CODES,
  PEPPOL_CUSTOMIZATION_ID,
  PEPPOL_INVOICE_TYPE_CODES,
  UNIT_CODES,
  VAT_CATEGORIES,
} from "./codes";
import type { FormatInfo } from "./detect";
import {
  round2,
  sameAmount,
  sum,
  type AllowanceCharge,
  type Identifier,
  type InvoiceModel,
  type Loc,
  type Party,
} from "./model";
import { RULE_INDEX, type RuleSource, type Section, type Severity } from "./rules-catalog";
import {
  checkBelgianEnterprise,
  checkGln,
  checkIban,
  checkLeitwegId,
  checkVatId,
  isPeppol0208,
  looksLikeLeitwegId,
  type LeitwegProblem,
} from "./vat-id";

export interface Finding {
  ruleId: string;
  source: RuleSource;
  severity: Severity;
  section: Section;
  title: string;
  message: string;
  line?: number;
  col?: number;
  xpath?: string;
  bt?: string[];
  expected?: string;
  actual?: string;
}

export interface RuleOptions {
  peppol: boolean;
  en16931: boolean;
  /** Apply the German XRechnung CIUS (BR-DE rules) */
  xrechnung?: boolean;
  /** Apply the Dutch SI-UBL 2.0 / NLCIUS rules (BR-NL rules) */
  nlcius?: boolean;
}

/** Payment means codes NLCIUS (BR-NL-12) and Peppol's Dutch rules (NL-R-008) allow. */
const NL_PAYMENT_MEANS = new Set(["30", "48", "49", "57", "58", "59"]);
const NLCIUS_TYPE_CODES = new Set(["380", "381", "384", "389"]);
/** KvK (0106) or OIN (0190): the legal registration identifiers Dutch rules accept. */
const isKvkOrOin = (id: Identifier | undefined) =>
  !!id && (id.scheme?.trim() === "0106" || id.scheme?.trim() === "0190") && id.id.trim() !== "";
const isNL = (country: string | undefined) => country?.trim().toUpperCase() === "NL";
/** Street, city and post code (BT-35/37/38 and their buyer / representative twins) — the ones missing. */
function missingAddressParts(a: { line1?: string; city?: string; postalCode?: string }): string[] {
  return [!a.line1 && "street name", !a.city && "city", !a.postalCode && "post code"].filter((x): x is string => !!x);
}

const XRECHNUNG_TYPE_CODES = new Set(["326", "380", "384", "389", "381", "875", "876", "877"]);

/** BT-24 values XRechnung 3.0 accepts (BR-DE-21): the CIUS, the Extension and the CVD. */
const XRECHNUNG_CIUS_ID = "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0";
const XRECHNUNG_SPEC_IDS = new Set([
  XRECHNUNG_CIUS_ID,
  `${XRECHNUNG_CIUS_ID}#conformant#urn:xeinkauf.de:kosit:extension:xrechnung_3.0`,
  `${XRECHNUNG_CIUS_ID}#compliant#urn:xeinkauf.de:kosit:xrechnung:cvd_0.9`,
]);
/** Regular expressions from the KoSIT XRechnung Schematron (common.sch). */
const XR_SKONTO = /^#SKONTO#TAGE=[0-9]+#PROZENT=[0-9]+\.[0-9]{2}(#BASISBETRAG=-?[0-9]+\.[0-9]{2})?#$/;
const XR_EMAIL = /^[^@\s]+@([^@.\s]+\.)+[^@.\s]+$/;
const XR_PHONE = /([0-9].*){3,}/;
const CREDIT_TRANSFER = new Set(["30", "58"]);
const CARD = new Set(["48", "54", "55"]);
const LEITWEG_PROBLEM: Record<LeitwegProblem, string> = {
  format: "is not built as coarse address, optional fine address and two check digits separated by hyphens",
  coarse: "has a coarse address that is not 2, 3, 5, 8, 9 or 12 digits starting with 01–16 or 99",
  fine: "has a fine address longer than 30 characters",
  "check-digit": "has check digits that don't match (ISO/IEC 7064 MOD 97-10)",
};

const f2 = (n: number | undefined) =>
  n === undefined || Number.isNaN(n) ? "—" : round2(n).toFixed(2);

const rateKey = (rate: number | undefined) => (rate === undefined ? "" : String(round2(rate)));

export function runRules(m: InvoiceModel, fmt: FormatInfo, opts: RuleOptions): Finding[] {
  const out: Finding[] = [];
  const emit = (
    ruleId: string,
    message: string,
    loc?: Loc,
    extra: { expected?: string; actual?: string; severity?: Severity } = {},
  ) => {
    const meta = RULE_INDEX[ruleId];
    if (!meta) throw new Error(`Unknown rule ${ruleId}`);
    const where = loc ?? m.loc;
    out.push({
      ruleId,
      source: meta.source,
      severity: extra.severity ?? meta.severity,
      section: meta.section,
      title: meta.title,
      message,
      line: where.line,
      col: where.col,
      xpath: where.xpath,
      bt: meta.bt,
      expected: extra.expected,
      actual: extra.actual,
    });
  };
  const at = (locs: Record<string, Loc>, key: string, fallback?: Loc): Loc =>
    locs[key] ?? fallback ?? m.loc;
  const T = m.totals;
  const tLoc = (key: string) => at(T.locs, key, T.loc);

  /* ---------------- document level ---------------- */
  for (const te of m.typeErrors) {
    emit("IV-SYN-03", `${te.bt} has value "${te.raw}" but must be ${te.expected}.`, te.loc, {
      expected: te.expected,
      actual: te.raw,
    });
  }
  if (opts.peppol) {
    for (const loc of m.emptyElements.slice(0, 25)) {
      emit("PEPPOL-EN16931-R008", `Element ${loc.xpath.split("/").pop()} is empty.`, loc);
    }
  }
  if (!opts.en16931) {
    emit(
      "IV-SYN-04",
      `${fmt.label} carries only header data. It is not an EN 16931 compliant e-invoice; line and VAT checks were skipped.`,
      at(m.locs, "customizationId"),
    );
  }

  /* ---------------- header ---------------- */
  if (!m.customizationId)
    emit("BR-01", "The specification identifier (CustomizationID) is missing.");
  if (!m.number) emit("BR-02", "The invoice number is missing.", m.locs["number"]);
  if (!m.issueDate && !m.typeErrors.some((t) => t.bt === "BT-2"))
    emit("BR-03", "The invoice issue date is missing.", m.locs["issueDate"]);
  if (!m.typeCode) emit("BR-04", "The invoice type code is missing.", m.locs["typeCode"]);
  else if (!INVOICE_TYPE_CODES[m.typeCode])
    emit("BR-CL-01", `Type code "${m.typeCode}" is not in UNTDID 1001.`, at(m.locs, "typeCode"), {
      actual: m.typeCode,
      expected: "380, 381, 384, 389 …",
    });
  if (!m.currency) emit("BR-05", "The invoice currency code is missing.", m.locs["currency"]);
  else if (!ISO_4217.has(m.currency))
    emit("BR-CL-04", `Currency "${m.currency}" is not an ISO 4217 code.`, at(m.locs, "currency"), {
      actual: m.currency,
      expected: "EUR, USD, GBP …",
    });
  if (m.taxCurrency && !ISO_4217.has(m.taxCurrency))
    emit(
      "BR-CL-04",
      `VAT accounting currency "${m.taxCurrency}" is not an ISO 4217 code.`,
      at(m.locs, "taxCurrency"),
    );
  // BR-53 is met by any VAT total in the accounting currency, even when that equals the invoice currency
  if (
    m.taxCurrency &&
    T.taxAmountAccounting === undefined &&
    !m.taxTotals.some((t) => t.amount !== undefined && t.currency?.trim() === m.taxCurrency?.trim())
  )
    emit(
      "BR-53",
      `Tax currency ${m.taxCurrency} is set, but no VAT total in that currency was found.`,
      at(m.locs, "taxCurrency"),
    );
  for (const a of m.attachments)
    if (!a.id) emit("BR-52", "A supporting document (BG-24) has no document reference (BT-122).", a.loc);
  if (m.taxPointDate && m.taxPointCode)
    emit(
      "BR-CO-03",
      "Both a VAT point date and a VAT point date code are present.",
      at(m.locs, "taxPointDate"),
    );
  if (m.hasPeriod) {
    if (
      !m.periodStart &&
      !m.periodEnd &&
      !m.typeErrors.some((t) => t.bt === "BT-73" || t.bt === "BT-74")
    )
      emit(
        "BR-CO-19",
        "The invoice period has neither a start nor an end date.",
        at(m.locs, "period"),
      );
    if (m.periodStart && m.periodEnd && m.periodEnd < m.periodStart)
      emit(
        "BR-29",
        `Invoice period ends (${m.periodEnd}) before it starts (${m.periodStart}).`,
        at(m.locs, "periodEnd"),
      );
  }
  for (const pi of m.precedingInvoices) {
    if (!pi.id) emit("BR-55", "A preceding invoice reference has no invoice number.", pi.loc);
  }
  if (m.dueDate && m.issueDate && m.dueDate < m.issueDate)
    emit(
      "IV-DATE-01",
      `Due date ${m.dueDate} is before the issue date ${m.issueDate}.`,
      at(m.locs, "dueDate"),
    );

  if (opts.peppol) {
    if (!m.profileId) emit("PEPPOL-EN16931-R001", "cbc:ProfileID (business process) is missing.");
    else if (!/^urn:fdc:peppol\.eu:2017:poacc:billing:\d{2}:1\.0$/.test(m.profileId))
      emit(
        "PEPPOL-EN16931-R007",
        `ProfileID "${m.profileId}" does not follow the Peppol format.`,
        at(m.locs, "profileId"),
        {
          actual: m.profileId,
          expected: "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0",
        },
      );
    if (m.customizationId && !m.customizationId.startsWith(PEPPOL_CUSTOMIZATION_ID))
      emit(
        "PEPPOL-EN16931-R004",
        `CustomizationID is "${m.customizationId}".`,
        at(m.locs, "customizationId"),
        {
          actual: m.customizationId,
          expected: PEPPOL_CUSTOMIZATION_ID,
        },
      );
    if (m.taxCurrency && m.taxCurrency === m.currency)
      emit(
        "PEPPOL-EN16931-R005",
        `TaxCurrencyCode equals the invoice currency (${m.currency}).`,
        at(m.locs, "taxCurrency"),
      );
    const bothGerman = m.seller.address?.country === "DE" && m.buyer.address?.country === "DE";
    if (m.notes.length > 1 && !bothGerman)
      emit(
        "PEPPOL-EN16931-R002",
        `The invoice has ${m.notes.length} notes; Peppol allows one.`,
        at(m.locs, "notes"),
      );
    if (!m.buyerReference && !m.orderRef)
      emit(
        "PEPPOL-EN16931-R003",
        "Neither a buyer reference nor a purchase order reference is present.",
      );
    if (m.typeCode) {
      if (m.kind === "invoice" && m.syntax === "UBL" && !PEPPOL_INVOICE_TYPE_CODES.has(m.typeCode))
        emit(
          "PEPPOL-EN16931-P0100",
          `Invoice type code ${m.typeCode} is not allowed in Peppol BIS 3.`,
          at(m.locs, "typeCode"),
        );
      if (
        m.kind === "creditnote" &&
        m.syntax === "UBL" &&
        !PEPPOL_CREDIT_NOTE_TYPE_CODES.has(m.typeCode)
      )
        emit(
          "PEPPOL-EN16931-P0101",
          `Credit note type code ${m.typeCode} is not allowed in Peppol BIS 3.`,
          at(m.locs, "typeCode"),
        );
    }
    const withSub = m.taxTotals.filter((t) => t.hasSubtotals);
    if (withSub.length > 1)
      emit(
        "PEPPOL-EN16931-R053",
        `${withSub.length} TaxTotal groups contain subtotals.`,
        withSub[1]?.loc,
      );
    if (
      T.taxAmount !== undefined &&
      T.taxAmountAccounting !== undefined &&
      Math.sign(T.taxAmount) !== Math.sign(T.taxAmountAccounting) &&
      T.taxAmount !== 0 &&
      T.taxAmountAccounting !== 0
    )
      emit(
        "PEPPOL-EN16931-R055",
        "The VAT total and the VAT total in accounting currency have different signs.",
        tLoc("taxAmountAccounting"),
      );
    if (m.currency) {
      for (const ac of m.amountCurrencies) {
        if (ac.bt === "BT-111") continue;
        if (ac.currency && ac.currency !== m.currency) {
          emit(
            "PEPPOL-EN16931-R051",
            `${ac.bt} uses currencyID="${ac.currency}" but the invoice currency is ${m.currency}.`,
            ac.loc,
            {
              actual: ac.currency,
              expected: m.currency,
            },
          );
        }
      }
    }
  }

  /* ---------------- parties ---------------- */
  const seller = m.seller;
  const buyer = m.buyer;
  if (!seller.name)
    emit("BR-06", "The seller's legal name is missing.", seller.locs["name"] ?? seller.loc);
  if (!buyer.name)
    emit("BR-07", "The buyer's legal name is missing.", buyer.locs["name"] ?? buyer.loc);
  if (!seller.address) emit("BR-08", "The seller has no postal address.", seller.loc);
  else if (!seller.address.country)
    emit("BR-09", "The seller address has no country code.", at(seller.locs, "address"));
  if (!buyer.address) emit("BR-10", "The buyer has no postal address.", buyer.loc);
  else if (!buyer.address.country)
    emit("BR-11", "The buyer address has no country code.", at(buyer.locs, "address"));
  if (m.payee && !m.payee.name) emit("BR-17", "A payee is present without a name.", m.payee.loc);
  if (m.taxRepresentative) {
    const tr = m.taxRepresentative;
    if (!tr.name) emit("BR-18", "The tax representative has no name.", tr.loc);
    if (!tr.address) emit("BR-19", "The tax representative has no postal address.", tr.loc);
    else if (!tr.address.country)
      emit("BR-20", "The tax representative's postal address has no country code.", at(tr.locs, "address", tr.loc));
    if (!tr.vatId) emit("BR-56", "The tax representative has no VAT identifier.", tr.loc);
  }
  if (m.delivery?.address && !m.delivery.address.country)
    emit(
      "BR-57",
      "The deliver-to address has no country code.",
      at(m.delivery.locs, "address", m.delivery.loc),
    );

  const countryChecks: [string | undefined, Loc | undefined, string][] = [
    [seller.address?.country, seller.locs["address.country"], "Seller"],
    [buyer.address?.country, buyer.locs["address.country"], "Buyer"],
    [m.delivery?.address?.country, m.delivery?.locs["address.country"], "Deliver-to"],
    [
      m.taxRepresentative?.address?.country,
      m.taxRepresentative?.locs["address.country"],
      "Tax representative",
    ],
  ];
  for (const [code, loc, who] of countryChecks) {
    if (code && !ISO_3166[code])
      emit(
        "BR-CL-14",
        `${who} country "${code}" is not an ISO 3166-1 alpha-2 code${code === "UK" ? " (use GB)" : ""}.`,
        loc,
        {
          actual: code,
          expected: code === "UK" ? "GB" : "DE, FR, NL …",
        },
      );
  }

  const endpointChecks: [Party, string, string, string][] = [
    [seller, "Seller", "BR-62", "PEPPOL-EN16931-R020"],
    [buyer, "Buyer", "BR-63", "PEPPOL-EN16931-R010"],
  ];
  for (const [p, who, schemeRule, peppolRule] of endpointChecks) {
    if (!p.endpoint) {
      if (opts.peppol)
        emit(peppolRule, `${who} electronic address (EndpointID) is missing.`, p.loc);
      continue;
    }
    const loc = at(p.locs, "endpoint", p.loc);
    if (!p.endpoint.scheme)
      emit(schemeRule, `${who} EndpointID "${p.endpoint.id}" has no schemeID.`, loc);
    else if (!EAS_CODES[p.endpoint.scheme])
      emit(
        "BR-CL-25",
        `${who} endpoint scheme "${p.endpoint.scheme}" is not in the EAS code list.`,
        loc,
        {
          actual: p.endpoint.scheme,
        },
      );
    else if (p.endpoint.scheme === "0088" && !checkGln(p.endpoint.id))
      emit("PEPPOL-COMMON-R040", `${who} GLN "${p.endpoint.id}" has an invalid check digit.`, loc, {
        actual: p.endpoint.id,
      });
    else if (p.endpoint.scheme === "0208" && !opts.peppol && !checkBelgianEnterprise(p.endpoint.id))
      // Outside Peppol only our own warning; Peppol has the fatal PEPPOL-COMMON-R043 below.
      emit("IV-BE-01", `${who} enterprise number "${p.endpoint.id}" fails the mod-97 check.`, loc, {
        actual: p.endpoint.id,
      });
  }
  for (const [p, who] of [
    [seller, "Seller"],
    [buyer, "Buyer"],
  ] as const) {
    for (const idn of p.identifiers) {
      if (idn.scheme === "0088" && !checkGln(idn.id))
        emit(
          "PEPPOL-COMMON-R040",
          `${who} identifier GLN "${idn.id}" has an invalid check digit.`,
          p.locs["identifier"],
        );
    }
    if (!opts.peppol) continue;
    // PEPPOL-COMMON-R043: every identifier with scheme 0208 (EndpointID, party
    // identifier, CompanyID) must be exactly 10 digits and pass the mod-97 test.
    const belgianIds: [Identifier | undefined, string, Loc | undefined][] = [
      [p.endpoint, "EndpointID", at(p.locs, "endpoint", p.loc)],
      ...p.identifiers.map((i): [Identifier, string, Loc | undefined] => [i, "party identifier", p.locs["identifier"] ?? p.loc]),
      [p.legalId, "legal registration number", at(p.locs, "legalId", p.loc)],
    ];
    for (const [idn, what, loc] of belgianIds) {
      if (idn?.scheme !== "0208" || isPeppol0208(idn.id)) continue;
      emit(
        "PEPPOL-COMMON-R043",
        `${who} ${what} "${idn.id}" uses scheme 0208 but is not a 10-digit Belgian enterprise number with valid check digits (no BE, dots or spaces).`,
        loc,
        { actual: idn.id, expected: "0123456749" },
      );
    }
  }

  const vatParties: [Party | undefined, string, string][] = [
    [seller, "Seller", "BT-31"],
    [buyer, "Buyer", "BT-48"],
    [m.taxRepresentative, "Tax representative", "BT-63"],
  ];
  for (const [p, who, bt] of vatParties) {
    if (!p?.vatId) continue;
    const loc = at(p.locs, "vatId", p.loc);
    const prefix = p.vatId.slice(0, 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(prefix) || (!ISO_3166[prefix] && prefix !== "EL")) {
      emit(
        "BR-CO-09",
        `${who} VAT identifier "${p.vatId}" (${bt}) does not start with a country prefix.`,
        loc,
        {
          actual: p.vatId,
          expected: "DE123456789",
        },
      );
      continue;
    }
    const res = checkVatId(p.vatId);
    if (res.status === "invalid_format") {
      emit("IV-VAT-01", `${who} VAT number "${p.vatId}": ${res.message}`, loc, {
        actual: p.vatId,
        expected: res.example ?? res.pattern ?? "",
      });
    } else if (res.status === "invalid_checksum") {
      emit("IV-VAT-02", `${who} VAT number "${p.vatId}": ${res.message}`, loc, { actual: p.vatId });
    }
  }
  if (seller.vatId && seller.address?.country) {
    const prefix = seller.vatId.slice(0, 2).toUpperCase();
    const country = seller.address.country;
    const matches =
      prefix === country ||
      (prefix === "EL" && country === "GR") ||
      (prefix === "XI" && country === "GB");
    if (/^[A-Z]{2}$/.test(prefix) && !matches)
      emit(
        "IV-VAT-03",
        `Seller VAT prefix ${prefix} differs from seller country ${country}.`,
        at(seller.locs, "vatId"),
        {
          severity: "info",
        },
      );
  }
  if (!seller.vatId && !seller.legalId && seller.identifiers.length === 0)
    emit(
      "BR-CO-26",
      "The seller has no VAT number, legal registration number or identifier.",
      seller.loc,
    );

  /* ---------------- payment ---------------- */
  for (const pm of m.paymentMeans) {
    if (!pm.code) {
      emit("BR-49", "A payment instruction has no payment means code.", pm.loc);
      continue;
    }
    const codeLoc = at(pm.locs, "code", pm.loc);
    if (!PAYMENT_MEANS[pm.code])
      emit("BR-CL-16", `Payment means code "${pm.code}" is not in UNCL4461.`, codeLoc, {
        actual: pm.code,
      });
    if (CREDIT_TRANSFER_CODES.has(pm.code) && !pm.account)
      emit(
        "BR-61",
        `Payment means ${pm.code} (credit transfer) has no payee account / IBAN.`,
        codeLoc,
      );
    if (
      pm.account &&
      /^[A-Z]{2}\d{2}/.test(pm.account.replace(/\s/g, "")) &&
      !checkIban(pm.account)
    )
      emit(
        "IV-IBAN-01",
        `"${pm.account}" fails the IBAN check digit test.`,
        at(pm.locs, "account", pm.loc),
        {
          actual: pm.account,
        },
      );
    if (opts.peppol && DIRECT_DEBIT_CODES.has(pm.code) && !pm.mandateRef)
      emit(
        "PEPPOL-EN16931-R061",
        "Direct debit is used but no mandate reference is given.",
        codeLoc,
      );
  }
  if ((T.payable ?? 0) > 0 && !m.dueDate && !m.paymentTerms)
    emit(
      "BR-CO-25",
      `Amount due is ${f2(T.payable)} but there is no due date and no payment terms.`,
      tLoc("payable"),
    );

  /* ---------------- totals: presence ---------------- */
  if (T.lineExtension === undefined)
    emit("BR-12", "LineExtensionAmount (BT-106) is missing.", T.loc);
  if (T.taxExclusive === undefined) emit("BR-13", "TaxExclusiveAmount (BT-109) is missing.", T.loc);
  if (T.taxInclusive === undefined) emit("BR-14", "TaxInclusiveAmount (BT-112) is missing.", T.loc);
  if (T.payable === undefined) emit("BR-15", "PayableAmount (BT-115) is missing.", T.loc);

  for (const d of m.decimals) {
    const dec = d.raw.split(".")[1];
    if (dec && dec.length > 2)
      emit(
        "BR-DEC",
        `${d.bt} has ${dec.length} decimals ("${d.raw}"); at most 2 are allowed.`,
        d.loc,
        {
          actual: d.raw,
          expected: Number(d.raw).toFixed(2),
        },
      );
  }

  /* ---------------- allowances & charges (document level) ---------------- */
  const docAc = (ac: AllowanceCharge) => {
    const kind = ac.isCharge ? "charge" : "allowance";
    if (ac.rawIndicator && ac.rawIndicator !== "true" && ac.rawIndicator !== "false" && opts.peppol)
      emit(
        "PEPPOL-EN16931-R043",
        `ChargeIndicator is "${ac.rawIndicator}".`,
        at(ac.locs, "indicator", ac.loc),
      );
    if (ac.amount === undefined)
      emit(ac.isCharge ? "BR-36" : "BR-31", `A document ${kind} has no amount.`, ac.loc);
    if (!ac.vatCategory)
      emit(ac.isCharge ? "BR-37" : "BR-32", `A document ${kind} has no VAT category.`, ac.loc);
    else if (!VAT_CATEGORIES[ac.vatCategory])
      emit(
        "BR-CL-17",
        `VAT category "${ac.vatCategory}" on a document ${kind} is not in UNCL5305.`,
        at(ac.locs, "vatCategory"),
      );
    if (!ac.reason && !ac.reasonCode)
      emit(
        ac.isCharge ? "BR-38" : "BR-33",
        `A document ${kind} has neither a reason nor a reason code.`,
        ac.loc,
      );
    peppolPercent(ac);
  };
  const peppolPercent = (ac: AllowanceCharge) => {
    if (!opts.peppol) return;
    if (ac.percent !== undefined && ac.baseAmount === undefined)
      emit(
        "PEPPOL-EN16931-R041",
        "A percentage is given without a base amount.",
        at(ac.locs, "percent", ac.loc),
      );
    if (ac.baseAmount !== undefined && ac.percent === undefined)
      emit(
        "PEPPOL-EN16931-R042",
        "A base amount is given without a percentage.",
        at(ac.locs, "baseAmount", ac.loc),
      );
    if (ac.amount !== undefined && ac.baseAmount !== undefined && ac.percent !== undefined) {
      const expected = round2((ac.baseAmount * ac.percent) / 100);
      if (Math.abs(expected - ac.amount) > 0.02)
        emit(
          "PEPPOL-EN16931-R040",
          `Amount ${f2(ac.amount)} ≠ ${f2(ac.baseAmount)} × ${ac.percent}% = ${f2(expected)}.`,
          at(ac.locs, "amount", ac.loc),
          {
            expected: f2(expected),
            actual: f2(ac.amount),
          },
        );
    }
  };
  m.allowances.forEach(docAc);
  m.charges.forEach(docAc);

  /* ---------------- lines ---------------- */
  if (opts.en16931) {
    if (m.lines.length === 0) emit("BR-16", "The invoice has no lines.");
    const unitWarned = new Set<string>();
    for (const [idx, ln] of m.lines.entries()) {
      const label = `Line ${ln.id ?? idx + 1}`;
      const L = (key: string) => at(ln.locs, key, ln.loc);
      if (!ln.id) emit("BR-21", `Line #${idx + 1} has no identifier.`, ln.loc);
      if (ln.quantity === undefined && !ln.locs["quantity"])
        emit("BR-22", `${label} has no invoiced quantity.`, ln.loc);
      if (ln.locs["quantity"] && !ln.unitCode)
        emit("BR-23", `${label} quantity has no unit code.`, L("quantity"));
      if (ln.unitCode && !UNIT_CODES[ln.unitCode] && !unitWarned.has(ln.unitCode)) {
        unitWarned.add(ln.unitCode);
        emit(
          "IV-UNIT-01",
          `Unit code "${ln.unitCode}" is uncommon — please double check it.`,
          L("unitCode"),
        );
      }
      if (ln.netAmount === undefined && !ln.locs["netAmount"])
        emit("BR-24", `${label} has no net amount.`, ln.loc);
      if (!ln.itemName) emit("BR-25", `${label} has no item name.`, L("item"));
      if (ln.priceAmount === undefined && !ln.locs["priceAmount"])
        emit("BR-26", `${label} has no net price.`, L("price"));
      if (ln.priceAmount !== undefined && ln.priceAmount < 0)
        emit("BR-27", `${label} net price is negative (${ln.priceAmount}).`, L("priceAmount"));
      if (ln.grossPrice !== undefined && ln.grossPrice < 0)
        emit("BR-28", `${label} gross price is negative (${ln.grossPrice}).`, L("grossPrice"));
      if (ln.locs["period"]) {
        if (!ln.periodStart && !ln.periodEnd)
          emit("BR-CO-20", `${label} has an empty period.`, L("period"));
        if (ln.periodStart && ln.periodEnd && ln.periodEnd < ln.periodStart)
          emit("BR-30", `${label} period ends before it starts.`, L("periodEnd"));
        if (opts.peppol && m.periodStart && ln.periodStart && ln.periodStart < m.periodStart)
          emit(
            "PEPPOL-EN16931-R110",
            `${label} period starts ${ln.periodStart}, before the invoice period (${m.periodStart}).`,
            L("periodStart"),
          );
        if (opts.peppol && m.periodEnd && ln.periodEnd && ln.periodEnd > m.periodEnd)
          emit(
            "PEPPOL-EN16931-R111",
            `${label} period ends ${ln.periodEnd}, after the invoice period (${m.periodEnd}).`,
            L("periodEnd"),
          );
      }
      if (!ln.vatCategory) emit("BR-CO-04", `${label} has no VAT category.`, L("vatCategory"));
      else if (!VAT_CATEGORIES[ln.vatCategory])
        emit(
          "BR-CL-17",
          `${label} VAT category "${ln.vatCategory}" is not in UNCL5305.`,
          L("vatCategory"),
          {
            actual: ln.vatCategory,
            expected: "S, Z, E, AE, K, G, O",
          },
        );
      // rate rules per category
      const cat = ln.vatCategory;
      const rate = ln.vatRate;
      if (cat === "S" && (rate === undefined || rate <= 0))
        emit("BR-S-05", `${label} is standard rated with rate ${rate ?? "missing"}.`, L("vatRate"));
      const zeroRules: Record<string, string> = {
        Z: "BR-Z-05",
        E: "BR-E-05",
        AE: "BR-AE-05",
        K: "BR-IC-05",
        G: "BR-G-05",
      };
      const zr = cat ? zeroRules[cat] : undefined;
      if (zr && rate !== undefined && rate !== 0)
        emit(zr, `${label} has category ${cat} with rate ${rate}%; it must be 0.`, L("vatRate"), {
          expected: "0",
          actual: String(rate),
        });
      if (cat === "O" && rate !== undefined)
        emit("BR-O-05", `${label} is out of scope of VAT but carries rate ${rate}%.`, L("vatRate"));

      for (const ac of ln.allowances) {
        if (ac.amount === undefined)
          emit("BR-41", `${label} has an allowance without amount.`, ac.loc);
        if (!ac.reason && !ac.reasonCode)
          emit("BR-42", `${label} has an allowance without reason.`, ac.loc);
        peppolPercent(ac);
      }
      for (const ac of ln.charges) {
        if (ac.amount === undefined) emit("BR-43", `${label} has a charge without amount.`, ac.loc);
        if (!ac.reason && !ac.reasonCode)
          emit("BR-44", `${label} has a charge without reason.`, ac.loc);
        peppolPercent(ac);
      }
      for (const a of ln.attributes) {
        if (!a.name || !a.value)
          emit("BR-54", `${label} has an item attribute without name or value.`, L("item"));
      }
      if (ln.standardItemId && !ln.standardItemId.scheme)
        emit("BR-64", `${label} standard item identifier has no scheme.`, L("standardItemId"));
      if (ln.classification?.some((c) => !c.scheme))
        emit("BR-65", `${label} item classification has no listID.`, L("item"));

      if (opts.peppol) {
        if (ln.hasPriceCharge)
          emit("PEPPOL-EN16931-R044", `${label} has a charge on price level.`, L("priceCharge"));
        if (ln.baseQuantity !== undefined && ln.baseQuantity <= 0)
          emit(
            "PEPPOL-EN16931-R121",
            `${label} base quantity is ${ln.baseQuantity}.`,
            L("baseQuantity"),
          );
        if (ln.baseQuantityUnit && ln.unitCode && ln.baseQuantityUnit !== ln.unitCode)
          emit(
            "PEPPOL-EN16931-R130",
            `${label} base quantity unit ${ln.baseQuantityUnit} differs from ${ln.unitCode}.`,
            L("baseQuantity"),
          );
        if (ln.grossPrice !== undefined && ln.priceAmount !== undefined) {
          const expectedNet = ln.grossPrice - (ln.priceDiscount ?? 0);
          if (Math.abs(expectedNet - ln.priceAmount) > 0.0001)
            emit(
              "PEPPOL-EN16931-R046",
              `${label} net price ${ln.priceAmount} ≠ gross ${ln.grossPrice} − discount ${ln.priceDiscount ?? 0}.`,
              L("priceAmount"),
              {
                expected: String(round2(expectedNet)),
                actual: String(ln.priceAmount),
              },
            );
        }
        if (
          ln.quantity !== undefined &&
          ln.priceAmount !== undefined &&
          ln.netAmount !== undefined
        ) {
          const base = ln.baseQuantity && ln.baseQuantity > 0 ? ln.baseQuantity : 1;
          const expected =
            (ln.quantity * ln.priceAmount) / base +
            sum(ln.charges.map((c) => c.amount)) -
            sum(ln.allowances.map((a) => a.amount));
          if (Math.abs(round2(expected) - ln.netAmount) > 0.02)
            emit(
              "PEPPOL-EN16931-R120",
              `${label}: ${ln.quantity} × ${ln.priceAmount}${base !== 1 ? ` / ${base}` : ""} = ${f2(expected)}, but the line amount is ${f2(ln.netAmount)}.`,
              L("netAmount"),
              { expected: f2(expected), actual: f2(ln.netAmount) },
            );
        }
      }
    }
  }

  /* ---------------- totals: calculations ---------------- */
  const lineSum = sum(m.lines.map((l) => l.netAmount));
  const allowanceSum = sum(m.allowances.map((a) => a.amount));
  const chargeSum = sum(m.charges.map((c) => c.amount));
  if (
    opts.en16931 &&
    T.lineExtension !== undefined &&
    m.lines.length > 0 &&
    !sameAmount(T.lineExtension, lineSum)
  )
    emit(
      "BR-CO-10",
      `Sum of line amounts is ${f2(lineSum)}, but LineExtensionAmount is ${f2(T.lineExtension)}.`,
      tLoc("lineExtension"),
      {
        expected: f2(lineSum),
        actual: f2(T.lineExtension),
      },
    );
  if (m.allowances.length > 0 || T.allowanceTotal !== undefined) {
    if (
      (T.allowanceTotal ?? 0) !== allowanceSum &&
      !sameAmount(T.allowanceTotal ?? 0, allowanceSum)
    )
      emit(
        "BR-CO-11",
        `Document allowances add up to ${f2(allowanceSum)}, but AllowanceTotalAmount is ${f2(T.allowanceTotal)}.`,
        tLoc("allowanceTotal"),
        {
          expected: f2(allowanceSum),
          actual: f2(T.allowanceTotal),
        },
      );
  }
  if (m.charges.length > 0 || T.chargeTotal !== undefined) {
    if (!sameAmount(T.chargeTotal ?? 0, chargeSum))
      emit(
        "BR-CO-12",
        `Document charges add up to ${f2(chargeSum)}, but ChargeTotalAmount is ${f2(T.chargeTotal)}.`,
        tLoc("chargeTotal"),
        {
          expected: f2(chargeSum),
          actual: f2(T.chargeTotal),
        },
      );
  }
  if (T.taxExclusive !== undefined && T.lineExtension !== undefined) {
    const expected = round2(T.lineExtension - (T.allowanceTotal ?? 0) + (T.chargeTotal ?? 0));
    if (!sameAmount(T.taxExclusive, expected))
      emit(
        "BR-CO-13",
        `${f2(T.lineExtension)} − ${f2(T.allowanceTotal ?? 0)} + ${f2(T.chargeTotal ?? 0)} = ${f2(expected)}, but TaxExclusiveAmount is ${f2(T.taxExclusive)}.`,
        tLoc("taxExclusive"),
        {
          expected: f2(expected),
          actual: f2(T.taxExclusive),
        },
      );
  }
  const vatSum = sum(m.vat.map((v) => v.taxAmount));
  if (T.taxAmount !== undefined && m.vat.length > 0 && !sameAmount(T.taxAmount, vatSum))
    emit(
      "BR-CO-14",
      `VAT breakdown adds up to ${f2(vatSum)}, but the VAT total is ${f2(T.taxAmount)}.`,
      tLoc("taxAmount"),
      {
        expected: f2(vatSum),
        actual: f2(T.taxAmount),
      },
    );
  if (T.taxInclusive !== undefined && T.taxExclusive !== undefined) {
    const expected = round2(T.taxExclusive + (T.taxAmount ?? 0));
    if (!sameAmount(T.taxInclusive, expected))
      emit(
        "BR-CO-15",
        `${f2(T.taxExclusive)} + VAT ${f2(T.taxAmount ?? 0)} = ${f2(expected)}, but TaxInclusiveAmount is ${f2(T.taxInclusive)}.`,
        tLoc("taxInclusive"),
        {
          expected: f2(expected),
          actual: f2(T.taxInclusive),
        },
      );
  }
  if (T.payable !== undefined && T.taxInclusive !== undefined) {
    const expected = round2(T.taxInclusive - (T.prepaid ?? 0) + (T.rounding ?? 0));
    if (!sameAmount(T.payable, expected))
      emit(
        "BR-CO-16",
        `${f2(T.taxInclusive)} − prepaid ${f2(T.prepaid ?? 0)} + rounding ${f2(T.rounding ?? 0)} = ${f2(expected)}, but PayableAmount is ${f2(T.payable)}.`,
        tLoc("payable"),
        {
          expected: f2(expected),
          actual: f2(T.payable),
        },
      );
  }

  /* ---------------- VAT breakdown ---------------- */
  if (opts.en16931) {
    if (m.vat.length === 0) emit("BR-CO-18", "The invoice has no VAT breakdown (TaxSubtotal).");
    for (const v of m.vat) {
      const V = (key: string) => at(v.locs, key, v.loc);
      const label = `VAT ${v.category ?? "?"}${v.rate !== undefined ? ` ${v.rate}%` : ""}`;
      if (v.taxableAmount === undefined && !v.locs["taxableAmount"])
        emit("BR-45", `${label} has no taxable amount.`, v.loc);
      if (v.taxAmount === undefined && !v.locs["taxAmount"])
        emit("BR-46", `${label} has no tax amount.`, v.loc);
      if (!v.category) emit("BR-47", "A VAT breakdown has no category code.", v.loc);
      else if (!VAT_CATEGORIES[v.category])
        emit("BR-CL-17", `VAT category "${v.category}" is not in UNCL5305.`, V("category"), {
          actual: v.category,
        });
      if (v.category && v.category !== "O" && v.rate === undefined)
        emit("BR-48", `${label} has no rate.`, V("category"));
      if (
        v.taxableAmount !== undefined &&
        v.taxAmount !== undefined &&
        v.rate !== undefined &&
        v.category !== "O"
      ) {
        const expected = round2((v.taxableAmount * v.rate) / 100);
        const diff = Math.abs(expected - v.taxAmount);
        if (diff >= 1)
          emit(
            "BR-CO-17",
            `${f2(v.taxableAmount)} × ${v.rate}% = ${f2(expected)}, but the VAT amount is ${f2(v.taxAmount)}.`,
            V("taxAmount"),
            {
              expected: f2(expected),
              actual: f2(v.taxAmount),
            },
          );
        else if (diff >= 0.005)
          emit(
            "BR-CO-17",
            `${f2(v.taxableAmount)} × ${v.rate}% = ${f2(expected)}; ${f2(v.taxAmount)} is within the ±1.00 tolerance of the standard but not correctly rounded.`,
            V("taxAmount"),
            {
              expected: f2(expected),
              actual: f2(v.taxAmount),
              severity: "warning",
            },
          );
      }
      const hasReason = Boolean(v.exemptionCode || v.exemptionReason);
      if ((v.category === "S" || v.category === "Z") && hasReason)
        emit(
          v.category === "S" ? "BR-S-10" : "BR-Z-10",
          `${label} has an exemption reason.`,
          V(v.exemptionCode ? "exemptionCode" : "exemptionReason"),
        );
      const needReason: Record<string, string> = {
        E: "BR-E-10",
        AE: "BR-AE-10",
        K: "BR-IC-10",
        O: "BR-O-10",
      };
      const nr = v.category ? needReason[v.category] : undefined;
      if (nr && !hasReason)
        emit(nr, `${label} needs an exemption reason code or text.`, V("category"));
      if (
        v.category === "AE" &&
        hasReason &&
        v.exemptionCode !== "VATEX-EU-AE" &&
        !/reverse charge/i.test(v.exemptionReason ?? "")
      )
        emit(
          "BR-AE-10",
          `${label} reason should be VATEX-EU-AE or "Reverse charge".`,
          V("exemptionReason"),
          { severity: "warning" },
        );
    }

    // Category usage vs. breakdown
    const used = new Map<
      string,
      { category: string; rate: number | undefined; taxable: number; loc: Loc }
    >();
    const addUse = (
      category: string | undefined,
      rate: number | undefined,
      amount: number,
      loc: Loc,
    ) => {
      if (!category || !VAT_CATEGORIES[category]) return;
      // An absent rate and 0% group together (category O lines carry no rate, its breakdown may say 0)
      const key = `${category}|${rateKey(rate ?? 0)}`;
      const cur = used.get(key) ?? { category, rate, taxable: 0, loc };
      cur.taxable = round2(cur.taxable + amount);
      used.set(key, cur);
    };
    for (const ln of m.lines)
      addUse(ln.vatCategory, ln.vatRate, ln.netAmount ?? 0, ln.loc ?? m.loc);
    for (const a of m.allowances)
      addUse(a.vatCategory, a.vatRate, -(a.amount ?? 0), a.loc ?? m.loc);
    for (const c of m.charges) addUse(c.vatCategory, c.vatRate, c.amount ?? 0, c.loc ?? m.loc);

    for (const [key, u] of used) {
      const breakdown = m.vat.find((v) => `${v.category}|${rateKey(v.rate ?? 0)}` === key);
      const label = `${u.category}${u.rate !== undefined ? ` ${u.rate}%` : ""}`;
      if (!breakdown) {
        // BR-S-01 & co. ask for the category in the breakdown; a rate whose lines, allowances and
        // charges net to zero needs no breakdown row of its own (CEN Schematron behaviour)
        if (u.taxable === 0 && m.vat.some((v) => v.category === u.category)) continue;
        emit(
          u.category === "S" ? "BR-S-01" : "BR-VAT-01",
          `Category ${label} is used but has no VAT breakdown.`,
          u.loc,
          {
            expected: `TaxSubtotal ${label}`,
          },
        );
        continue;
      }
      if (breakdown.taxableAmount !== undefined && !sameAmount(breakdown.taxableAmount, u.taxable))
        emit(
          u.category === "S" ? "BR-S-08" : "BR-VAT-08",
          `Lines, allowances and charges in ${label} add up to ${f2(u.taxable)}, but the taxable amount is ${f2(breakdown.taxableAmount)}.`,
          at(breakdown.locs, "taxableAmount", breakdown.loc),
          { expected: f2(u.taxable), actual: f2(breakdown.taxableAmount) },
        );
    }

    // party VAT requirements per category
    const cats = new Set([...used.values()].map((u) => u.category));
    for (const v of m.vat) if (v.category) cats.add(v.category);
    const sellerVat = Boolean(seller.vatId || m.taxRepresentative?.vatId);
    if (cats.has("S") && !sellerVat && !seller.taxRegistrationId)
      emit(
        "BR-S-02",
        "Standard-rated items require the seller VAT number or tax registration number.",
        seller.loc,
      );
    if (cats.has("AE") && (!sellerVat || !(buyer.vatId || buyer.legalId)))
      emit(
        "BR-AE-02",
        `Reverse charge requires both VAT numbers (seller: ${seller.vatId ?? "missing"}, buyer: ${buyer.vatId ?? "missing"}).`,
        buyer.vatId ? seller.loc : buyer.loc,
      );
    if (cats.has("K")) {
      if (!sellerVat || !buyer.vatId)
        emit(
          "BR-IC-02",
          `Intra-community supply requires both VAT numbers (seller: ${seller.vatId ?? "missing"}, buyer: ${buyer.vatId ?? "missing"}).`,
          buyer.vatId ? seller.loc : buyer.loc,
        );
      if (!m.delivery?.date && !m.hasPeriod)
        emit("BR-IC-11", "Intra-community supply needs an actual delivery date or invoice period.");
      if (!m.delivery?.address?.country)
        emit("BR-IC-12", "Intra-community supply needs a deliver-to country.", m.delivery?.loc);
    }
    if (cats.has("G") && !sellerVat)
      emit("BR-G-02", "Export invoices require the seller VAT number.", seller.loc);
    if (
      cats.has("O") &&
      cats.size === 1 &&
      (seller.vatId || buyer.vatId || m.taxRepresentative?.vatId)
    )
      emit(
        "BR-O-02",
        "Invoices not subject to VAT must not carry VAT identifiers.",
        at(seller.locs, "vatId", buyer.locs["vatId"]),
      );
  }

  /* ---------------- Peppol BIS 3.0: national rules for Dutch suppliers ---------------- */
  // OpenPeppol PEPPOL-EN16931-UBL.sch, "NETHERLANDS" pattern (NL-R-001 … NL-R-009).
  if (opts.peppol && m.syntax === "UBL" && isNL(m.seller.address?.country)) {
    const s = m.seller;
    const b = m.buyer;
    const buyerNl = isNL(b.address?.country);
    if (m.kind === "creditnote" && !m.precedingInvoices.some((p) => p.id))
      emit("NL-R-001", "This credit note from a Dutch supplier doesn't reference the invoice it corrects (BT-25).", at(m.locs, "typeCode"));
    if (s.address) {
      const miss = missingAddressParts(s.address);
      if (miss.length) emit("NL-R-002", `The seller address has no ${miss.join(", ")}.`, at(s.locs, "address", s.loc));
    }
    if (s.legalId && !isKvkOrOin(s.legalId))
      emit("NL-R-003", `The seller legal ID "${s.legalId.id}" has scheme ${s.legalId.scheme ?? "none"}, not 0106 (KvK) or 0190 (OIN).`, at(s.locs, "legalId", s.loc), {
        expected: "schemeID 0106 (KvK) or 0190 (OIN)",
        actual: s.legalId.scheme ?? "no schemeID",
      });
    if (buyerNl && b.address) {
      const miss = missingAddressParts(b.address);
      if (miss.length) emit("NL-R-004", `The Dutch buyer's address has no ${miss.join(", ")}.`, at(b.locs, "address", b.loc));
    }
    if (buyerNl && b.legalId && !isKvkOrOin(b.legalId))
      emit("NL-R-005", `The buyer legal ID "${b.legalId.id}" has scheme ${b.legalId.scheme ?? "none"}, not 0106 (KvK) or 0190 (OIN).`, at(b.locs, "legalId", b.loc), {
        expected: "schemeID 0106 (KvK) or 0190 (OIN)",
        actual: b.legalId.scheme ?? "no schemeID",
      });
    const rep = m.taxRepresentative;
    if (rep?.address && isNL(rep.address.country)) {
      const miss = missingAddressParts(rep.address);
      if (miss.length) emit("NL-R-006", `The Dutch tax representative's address has no ${miss.join(", ")}.`, at(rep.locs, "address", rep.loc));
    }
    const due = m.totals.payable;
    if (due !== undefined && m.paymentMeans.length === 0 && ((m.kind === "invoice" && due > 0) || (m.kind === "creditnote" && due < 0)))
      emit("NL-R-007", `There is an amount due of ${f2(due)} but no payment instructions.`, tLoc("payable"));
    if (buyerNl)
      for (const pm of m.paymentMeans) {
        const code = pm.code?.trim();
        if (!code || !NL_PAYMENT_MEANS.has(code))
          emit("NL-R-008", `Payment means code ${code ?? "(missing)"} is not allowed between Dutch parties.`, at(pm.locs, "code", pm.loc), {
            expected: "30, 48, 49, 57, 58 or 59",
            actual: code,
          });
      }
    if (!m.orderRef)
      for (const ln of m.lines.filter((l) => l.orderLineRef).slice(0, 25))
        emit("NL-R-009", `Line ${ln.id ?? "?"} references order line ${ln.orderLineRef}, but the invoice has no order reference (BT-13).`, at(ln.locs, "orderLineRef", ln.loc));
  }

  /* ---------------- SI-UBL 2.0 / NLCIUS ---------------- */
  // Follows the Dutch Peppol Authority's si-ubl-2.0-nlcius.sch (2.0.3.13) and NLCIUS-CII-validation.sch.
  // Most rules apply only to suppliers in the Netherlands; BR-NL-13 and the empty-element check apply to all.
  if (opts.nlcius) {
    const s = m.seller;
    const b = m.buyer;
    const ubl = m.syntax === "UBL";
    const nl = isNL(s.address?.country);
    if (!isNlciusId(m.customizationId))
      emit("SI-V20-INV-R000", `Specification identifier is ${m.customizationId ?? "missing"}, not SI-UBL 2.0 / NLCIUS.`, at(m.locs, "customizationId"), {
        expected: NLCIUS_CUSTOMIZATION_ID,
        actual: m.customizationId,
      });

    const tc = m.typeCode?.trim();
    // BR-NL-7 and -9 cover every supplier in CII, Dutch suppliers in UBL
    if (tc && (nl || !ubl)) {
      if (!NLCIUS_TYPE_CODES.has(tc))
        emit("BR-NL-7", `Type code ${tc} is not one of 380, 381, 384 or 389.`, at(m.locs, "typeCode"), { expected: "380, 381, 384 or 389", actual: tc });
      if (tc === "384" && !m.precedingInvoices.some((p) => p.id))
        emit("BR-NL-9", "This corrected invoice (type 384) doesn't reference the invoice it corrects (BT-25).", at(m.locs, "typeCode"));
    }
    if (ubl && nl && tc) {
      if (tc === "381" && m.kind === "invoice")
        emit("BR-NL-8", "Type code 381 (credit note) is sent as a UBL Invoice; it must be a UBL CreditNote.", at(m.locs, "typeCode"), { expected: "<CreditNote>", actual: "<Invoice>" });
      else if (tc !== "381" && m.kind === "creditnote")
        emit("BR-NL-8", `A UBL CreditNote has type code ${tc}; credit notes use 381, codes 380, 384 and 389 the UBL Invoice.`, at(m.locs, "typeCode"), { expected: "381", actual: tc });
    }
    if (!m.orderRef)
      for (const ln of m.lines.filter((l) => l.orderLineRef).slice(0, 25))
        emit("BR-NL-13", `Line ${ln.id ?? "?"} references order line ${ln.orderLineRef}, but the invoice has no order reference (BT-13).`, at(ln.locs, "orderLineRef", ln.loc));

    if (nl) {
      if (s.loc && !isKvkOrOin(s.legalId))
        emit(
          "BR-NL-1",
          s.legalId
            ? `The seller legal ID "${s.legalId.id}" has scheme ${s.legalId.scheme ?? "none"}, not 0106 (KvK) or 0190 (OIN).`
            : "The seller has no KvK or OIN number (BT-30).",
          at(s.locs, "legalId", s.loc),
          { expected: "schemeID 0106 (KvK) or 0190 (OIN)", actual: s.legalId ? `${s.legalId.scheme ?? "no schemeID"} ${s.legalId.id}`.trim() : undefined },
        );
      if (!m.buyerReference && !m.orderRef)
        emit("BR-NL-2", "Neither a buyer reference (BT-10) nor a purchase order reference (BT-13) is given.", at(m.locs, "buyerReference"));
      if (s.address) {
        const miss = missingAddressParts(s.address);
        if (miss.length) emit("BR-NL-3", `The seller address has no ${miss.join(", ")}.`, at(s.locs, "address", s.loc));
      }
      const buyerNl = !b.address?.country || isNL(b.address.country);
      if (b.address && buyerNl) {
        const miss = missingAddressParts(b.address);
        if (miss.length) emit("BR-NL-4", `The Dutch buyer's address has no ${miss.join(", ")}.`, at(b.locs, "address", b.loc));
      }
      const rep = m.taxRepresentative;
      if (rep?.address && (!rep.address.country || isNL(rep.address.country))) {
        const miss = missingAddressParts(rep.address);
        if (miss.length) emit("BR-NL-5", `The Dutch tax representative's address has no ${miss.join(", ")}.`, at(rep.locs, "address", rep.loc));
      }
      if (b.loc) {
        if (isNL(b.address?.country) && !isKvkOrOin(b.legalId))
          emit(
            "BR-NL-10",
            b.legalId
              ? `The buyer legal ID "${b.legalId.id}" has scheme ${b.legalId.scheme ?? "none"}, not 0106 (KvK) or 0190 (OIN).`
              : "The Dutch buyer has no KvK or OIN number (BT-47).",
            at(b.locs, "legalId", b.loc),
            { expected: "schemeID 0106 (KvK) or 0190 (OIN)", actual: b.legalId ? `${b.legalId.scheme ?? "no schemeID"} ${b.legalId.id}`.trim() : undefined },
          );
        else if (!isNL(b.address?.country) && b.legalId && !b.legalId.id.trim())
          emit("BR-NL-10", "The buyer legal ID (BT-47) is empty.", at(b.locs, "legalId", b.loc));
      }
      const due = m.totals.payable;
      if ((!ubl || m.kind === "invoice") && due !== undefined && due > 0 && m.paymentMeans.length === 0)
        emit("BR-NL-11", `There is an amount due of ${f2(due)} but no payment instructions.`, tLoc("payable"));
      for (const pm of m.paymentMeans) {
        const code = pm.code?.trim();
        if (!code || !NL_PAYMENT_MEANS.has(code))
          emit("BR-NL-12", `Payment means code ${code ?? "(missing)"} is not one of 30, 48, 49, 57, 58 or 59.`, at(pm.locs, "code", pm.loc), {
            expected: "30, 48, 49, 57, 58 or 59",
            actual: code,
          });
        if ((code === "58" || code === "59") && pm.bic)
          emit("BR-NL-31", `A BIC (${pm.bic}) is given for SEPA payment means ${code}.`, at(pm.locs, "bic", pm.loc), { actual: pm.bic });
        if (pm.text) emit("BR-NL-29", `Payment means text "${pm.text}" is given.`, at(pm.locs, ubl ? "code" : "text", pm.loc), { actual: pm.text });
        if (pm.accountName) emit("BR-NL-30", `Payment account name "${pm.accountName}" is given.`, at(pm.locs, "accountName", pm.loc), { actual: pm.accountName });
      }

      // Recommendations: fields NLCIUS asks Dutch suppliers to leave out (warnings)
      if (m.taxCurrency) emit("BR-NL-19", `A VAT accounting currency (${m.taxCurrency}) is given.`, at(m.locs, "taxCurrency"), { actual: m.taxCurrency });
      if (m.taxPointDate || m.locs["taxPointDate"]) emit("BR-NL-20", "A VAT point date (BT-7) is given.", at(m.locs, "taxPointDate"));
      if (m.taxPointCode) emit("BR-NL-21", `A VAT point date code (${m.taxPointCode}) is given.`, at(m.locs, "taxPointCode"), { actual: m.taxPointCode });
      if (!ubl && m.profileId) emit("BR-NL-23", `A business process type (${m.profileId}) is given.`, at(m.locs, "profileId"), { actual: m.profileId });
      for (const p of m.precedingInvoices.filter((x) => x.date))
        emit("BR-NL-24", `The preceding invoice ${p.id ?? ""} carries an issue date (${p.date}).`.replace("  ", " "), p.loc);
      if (s.taxRegistrationId)
        emit("BR-NL-25", `A tax registration number other than VAT (${s.taxRegistrationId}) is given.`, at(s.locs, "taxRegistrationId", s.loc), { actual: s.taxRegistrationId });
      if (s.legalForm) emit("BR-NL-26", `Additional legal information "${s.legalForm}" is given.`, at(s.locs, "legalForm", s.loc), { actual: s.legalForm });
      const addresses = [
        ["seller", s.address, s.locs],
        ["buyer", b.address, b.locs],
        ["tax representative", m.taxRepresentative?.address, m.taxRepresentative?.locs ?? {}],
        ["deliver-to", m.delivery?.address, m.delivery?.locs ?? {}],
      ] as const;
      for (const [who, a, locs] of addresses) {
        if (!a) continue;
        if (a.line3) emit("BR-NL-27", `The ${who} address has a third address line ("${a.line3}").`, at(locs, "address.line3", at(locs, "address")), { actual: a.line3 });
        if (a.subdivision) emit("BR-NL-28", `The ${who} address has a country subdivision ("${a.subdivision}").`, at(locs, "address.subdivision", at(locs, "address")), { actual: a.subdivision });
      }
      const acs = [
        ...m.allowances.map((a) => ({ a, line: undefined as string | undefined })),
        ...m.charges.map((a) => ({ a, line: undefined as string | undefined })),
        ...m.lines.flatMap((l) => [...l.allowances, ...l.charges].map((a) => ({ a, line: l.id ?? "?" }))),
      ];
      for (const { a, line } of acs) {
        if (!a.reasonCode) continue;
        const where = line ? ` on line ${line}` : "";
        emit(a.isCharge ? "BR-NL-34" : "BR-NL-32", `${a.isCharge ? "Charge" : "Allowance"} reason code ${a.reasonCode} is given${where}.`, at(a.locs, "reasonCode", a.loc), { actual: a.reasonCode });
      }
      for (const tt of m.taxTotals)
        if (tt.currency && m.currency && tt.currency.trim() !== m.currency.trim())
          emit("BR-NL-33", `A VAT total in ${tt.currency} is given next to the invoice currency ${m.currency}.`, tt.loc, { actual: tt.currency });
      for (const v of m.vat)
        if (v.exemptionCode) emit("BR-NL-35", `VAT exemption reason code ${v.exemptionCode} is given.`, at(v.locs, "exemptionCode", v.loc), { actual: v.exemptionCode });
    }
    for (const loc of m.emptyElements.slice(0, 25)) emit("SI-UBL-2", `Element ${loc.xpath.split("/").pop()} is empty.`, loc);
  }

  /* ---------------- XRechnung CIUS ---------------- */
  // Follows the KoSIT XRechnung Schematron (XRechnung 3.0.2); rules that need a
  // context element (BR-DE-3, -5, -10 …) only run when that element is present.
  if (opts.xrechnung) {
    const s = m.seller;
    const b = m.buyer;
    if (m.paymentMeans.length === 0) emit("BR-DE-1", "Payment instructions (BG-16) are missing.");
    if (!m.buyerReference)
      emit("BR-DE-15", "The buyer reference / Leitweg-ID (BT-10) is missing.", at(m.locs, "buyerReference"));
    else if (looksLikeLeitwegId(m.buyerReference)) {
      const lw = checkLeitwegId(m.buyerReference);
      if (!lw.ok)
        emit("IV-DE-01", `Leitweg-ID "${m.buyerReference}" ${LEITWEG_PROBLEM[lw.problem]}.`, at(m.locs, "buyerReference"), {
          actual: m.buyerReference,
        });
    }
    if (b.endpoint?.scheme === "0204" && b.endpoint.id) {
      const lw = checkLeitwegId(b.endpoint.id);
      if (!lw.ok)
        emit("IV-DE-01", `Buyer electronic address "${b.endpoint.id}" (scheme 0204) ${LEITWEG_PROBLEM[lw.problem]}.`, at(b.locs, "endpoint", b.loc), {
          actual: b.endpoint.id,
        });
    }

    const cats = new Set<string>();
    for (const ln of m.lines) if (ln.vatCategory) cats.add(ln.vatCategory);
    for (const ac of [...m.allowances, ...m.charges]) if (ac.vatCategory) cats.add(ac.vatCategory);
    for (const v of m.vat) if (v.category) cats.add(v.category);
    const needsTaxId = [...cats].some((c) => ["S", "Z", "E", "AE", "K", "G", "L", "M"].includes(c));
    if (needsTaxId && !s.vatId && !s.taxRegistrationId && !m.taxRepresentative)
      emit("BR-DE-16", "Neither the seller VAT number, a tax number nor a tax representative is given.", s.loc);

    if (m.typeCode && !XRECHNUNG_TYPE_CODES.has(m.typeCode))
      emit("BR-DE-17", `Type code ${m.typeCode} is not one of the codes XRechnung expects.`, at(m.locs, "typeCode"), {
        actual: m.typeCode,
      });

    const terms = m.paymentTermsRaw ?? m.paymentTerms;
    if (terms) {
      const skonto = terms.split(/\r?\n/).filter((l) => l.trim().startsWith("#"));
      const bad = skonto.find((l) => !XR_SKONTO.test(l.trim()));
      if (bad)
        emit("BR-DE-18", `Payment terms line "${bad.trim()}" doesn't follow the XRechnung Skonto syntax.`, at(m.locs, "paymentTerms"), {
          expected: "#SKONTO#TAGE=14#PROZENT=2.00#",
          actual: bad.trim(),
        });
      else if (skonto.length && !/^\s*\n/.test(terms.split(/#.+#/).pop() ?? ""))
        emit("BR-DE-18", "The last Skonto entry in the payment terms is not followed by a line break.", at(m.locs, "paymentTerms"));
    }

    if (!m.customizationId || !XRECHNUNG_SPEC_IDS.has(m.customizationId))
      emit("BR-DE-21", `Specification identifier is ${m.customizationId ?? "missing"}, not XRechnung 3.0.`, at(m.locs, "customizationId"), {
        expected: XRECHNUNG_CIUS_ID,
        actual: m.customizationId,
      });

    const names = m.attachments.map((a) => a.filename).filter((n): n is string => !!n);
    const dup = names.find((n, i) => names.indexOf(n) !== i);
    if (dup) emit("BR-DE-22", `Two attachments are both called "${dup}".`);

    if (m.typeCode === "384" && m.precedingInvoices.length === 0)
      emit("BR-DE-26", "A corrected invoice (type 384) should reference the invoice it corrects (BG-3).", at(m.locs, "typeCode"));

    // Seller: contact and address
    if (!s.contact) emit("BR-DE-2", "The seller contact (BG-6) is missing.", s.loc);
    else {
      const cl = at(s.locs, "contact", s.loc);
      if (!s.contact.name) emit("BR-DE-5", "The seller contact name (BT-41) is missing.", cl);
      if (!s.contact.phone) emit("BR-DE-6", "The seller contact telephone (BT-42) is missing.", cl);
      else if (!XR_PHONE.test(s.contact.phone))
        emit("BR-DE-27", `Seller telephone "${s.contact.phone}" has fewer than three digits.`, at(s.locs, "contact.phone", cl), {
          actual: s.contact.phone,
        });
      if (!s.contact.email) emit("BR-DE-7", "The seller contact email (BT-43) is missing.", cl);
      else if (!XR_EMAIL.test(s.contact.email.trim()))
        emit("BR-DE-28", `Seller email "${s.contact.email}" is not a valid address.`, at(s.locs, "contact.email", cl), {
          actual: s.contact.email,
        });
    }
    if (s.address) {
      const al = at(s.locs, "address", s.loc);
      if (!s.address.city) emit("BR-DE-3", "The seller city (BT-37) is missing.", al);
      if (!s.address.postalCode) emit("BR-DE-4", "The seller post code (BT-38) is missing.", al);
    }
    if (b.address) {
      const al = at(b.locs, "address", b.loc);
      if (!b.address.city) emit("BR-DE-8", "The buyer city (BT-52) is missing.", al);
      if (!b.address.postalCode) emit("BR-DE-9", "The buyer post code (BT-53) is missing.", al);
    }
    const dlv = m.delivery;
    if (dlv?.address) {
      const al = at(dlv.locs, "address", dlv.loc);
      if (!dlv.address.city) emit("BR-DE-10", "The deliver-to city (BT-77) is missing.", al);
      if (!dlv.address.postalCode) emit("BR-DE-11", "The deliver-to post code (BT-78) is missing.", al);
    }

    // Payment instructions: exactly the group the payment means code asks for
    for (const pm of m.paymentMeans) {
      const code = pm.code?.trim();
      if (!code) continue;
      const pl = pm.loc ?? m.loc;
      if (CREDIT_TRANSFER.has(code)) {
        if (code === "58" && !(pm.account && checkIban(pm.account)))
          emit("BR-DE-19", `Payment account "${pm.account ?? "—"}" is not a valid IBAN for SEPA credit transfer (58).`, at(pm.locs, "account", pl), {
            actual: pm.account,
          });
        if (!pm.hasCreditTransfer)
          emit("BR-DE-23-a", `Payment means ${code} (credit transfer) has no credit transfer account (BG-17).`, pl);
        if (pm.hasCard || pm.hasDirectDebit)
          emit("BR-DE-23-b", `Payment means ${code} (credit transfer) also carries card or direct debit details.`, pl);
      } else if (CARD.has(code)) {
        if (!pm.hasCard) emit("BR-DE-24-a", `Payment means ${code} (card payment) has no card details (BG-18).`, pl);
        if (pm.hasCreditTransfer || pm.hasDirectDebit)
          emit("BR-DE-24-b", `Payment means ${code} (card payment) also carries an account or direct debit details.`, pl);
      } else if (code === "59") {
        if (!(pm.debitedAccount && checkIban(pm.debitedAccount)))
          emit("BR-DE-20", `Debited account "${pm.debitedAccount ?? "—"}" is not a valid IBAN for SEPA direct debit (59).`, at(pm.locs, "debitedAccount", pl), {
            actual: pm.debitedAccount,
          });
        if (!pm.hasDirectDebit) emit("BR-DE-25-a", "Payment means 59 (SEPA direct debit) has no direct debit details (BG-19).", pl);
        if (pm.hasCreditTransfer || pm.hasCard)
          emit("BR-DE-25-b", "Payment means 59 (SEPA direct debit) also carries a credit transfer account or card details.", pl);
      }
    }
    if (m.paymentMeans.some((p) => p.hasDirectDebit)) {
      if (!m.creditorId) emit("BR-DE-30", "Direct debit is used, but the SEPA creditor identifier (BT-90) is missing.");
      if (!m.paymentMeans.some((p) => p.debitedAccount))
        emit("BR-DE-31", "Direct debit is used, but the debited account (BT-91) is missing.");
    }

    for (const v of m.vat)
      if (v.rate === undefined && !m.typeErrors.some((t) => t.bt === "BT-119" && t.loc.line === v.locs["rate"]?.line))
        emit("BR-DE-14", `The VAT breakdown for category ${v.category ?? "?"} has no rate (BT-119).`, v.loc);

    const lineDates = m.lines.length > 0 && m.lines.every((l) => l.periodStart || l.periodEnd);
    if (!m.delivery?.date && !m.hasPeriod && !lineDates)
      emit("BR-DE-TMP-32", "No delivery date (BT-72), invoicing period (BG-14) or line periods (BG-26) are given.");
  }

  return out;
}
