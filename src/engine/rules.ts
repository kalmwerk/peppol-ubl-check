import {
  ATTACHMENT_MIME_CODES,
  CEN_COUNTRY_CODES,
  CREDIT_TRANSFER_CODES,
  DIRECT_DEBIT_CODES,
  EAS_CODES,
  ICD_CODES,
  INVOICE_TYPE_CODES,
  isNlciusId,
  ISO_3166,
  NLCIUS_CUSTOMIZATION_ID,
  ISO_4217,
  PAYMENT_MEANS,
  PEPPOL_CII_PROFILE_IDS,
  PEPPOL_CREDIT_NOTE_TYPE_CODES,
  PEPPOL_CUSTOMIZATION_ID,
  PEPPOL_EAS_CODES,
  PEPPOL_INVOICE_TYPE_CODES,
  PEPPOL_PROFILE_ID,
  PEPPOL_PROFILE_IDS,
  REC20_UNIT_CODES,
  UNCL_5189_CODES,
  UNCL_5305_CODES,
  UNCL_7161_CODES,
  UNIT_CODES,
  UNTDID_1153_CODES,
  UNTDID_7143_CODES,
  VAT_CATEGORIES,
} from "./codes";
import * as D from "./decimal";
import type { FormatInfo } from "./detect";
import {
  round2,
  type AllowanceCharge,
  type Identifier,
  type InvoiceModel,
  type Loc,
  type Party,
} from "./model";
import { RULE_INDEX, type RuleSource, type Section, type Severity } from "./rules-catalog";
import { codeListRules } from "./rules-code-lists";
import { everyAllowanceCharge, exactText, vatCategoryRules, xsBoolean } from "./rules-vat-categories";
import {
  checkBelgianEnterprise,
  checkGln,
  checkIban,
  checkLeitwegId,
  checkVatId,
  isPeppol0007,
  isPeppol0184,
  isPeppol0192,
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
/** XPath normalize-space(): trimmed, inner whitespace runs collapsed to one space. */
const normSpace = (v: string | undefined) => (v ?? "").replace(/\s+/g, " ").trim();
/** The party's postal country, as the Peppol national rules read it (upper-case, trimmed). */
const countryIs = (p: Party | undefined, code: string) => p?.address?.country?.trim().toUpperCase() === code;
/** Street, city and post code elements that are missing (present but empty still counts as given). */
function missingAddressElements(locs: Record<string, Loc>): string[] {
  return [
    !locs["address.line1"] && "street name",
    !locs["address.city"] && "city",
    !locs["address.postalCode"] && "post code",
  ].filter((x): x is string => !!x);
}
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
/** An exact value for a message: two decimals, or up to four when it has more */
const fd = (x: D.Dec) => {
  const v = D.toNumber(x);
  return D.eq(D.round2(x), x) ? v.toFixed(2) : String(Math.round(v * 10000) / 10000);
};

/** VAT prefixes BR-CO-09 accepts besides ISO 3166-1 alpha-2 country codes. */
const VAT_PREFIX_EXTRAS = new Set(["EL", "XI", "1A"]);

/** VAT categories whose -08 rule groups by rate (standard rate, IGIC, IPSI); the others group by category */
const PER_RATE_CATEGORIES = new Set(["S", "L", "M"]);

/** VAT categories whose -01 rule asks for exactly one VAT breakdown row (BR-VAT-01 here). */
const ONE_BREAKDOWN_ROW: ReadonlySet<string> = new Set(["Z", "E", "AE", "K", "G", "O"]);
const rateKey = (rate: number | undefined) => (rate === undefined ? "" : String(round2(rate)));

/** PEPPOL-EN16931-P0104 … P0111: the VAT category each EU exemption reason code (VATEX-EU-…) requires. */
const VATEX_CATEGORY_RULES: Record<string, { id: string; category: string }> = {
  "VATEX-EU-G": { id: "PEPPOL-EN16931-P0104", category: "G" },
  "VATEX-EU-O": { id: "PEPPOL-EN16931-P0105", category: "O" },
  "VATEX-EU-IC": { id: "PEPPOL-EN16931-P0106", category: "K" },
  "VATEX-EU-AE": { id: "PEPPOL-EN16931-P0107", category: "AE" },
  "VATEX-EU-D": { id: "PEPPOL-EN16931-P0108", category: "E" },
  "VATEX-EU-F": { id: "PEPPOL-EN16931-P0109", category: "E" },
  "VATEX-EU-I": { id: "PEPPOL-EN16931-P0110", category: "E" },
  "VATEX-EU-J": { id: "PEPPOL-EN16931-P0111", category: "E" },
};

/**
 * PEPPOL-EN16931-F001. UBL: `string-length(text()) = 10 and (string(.) castable as xs:date)`, so YYYY-MM-DD
 * with a real day and no time zone. CII: format 102, exactly 8 characters, `20[0-9]{6}` in the normalized text.
 */
function peppolDateOk(d: { raw: string; format?: string }, cii: boolean): boolean {
  if (cii) return normSpace(d.format) === "102" && d.raw.length === 8 && /20[0-9]{6}/.test(normSpace(d.raw));
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.raw);
  if (!m) return false;
  const [y, mo, da] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(2000, mo - 1, da));
  date.setUTCFullYear(y);
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === da;
}

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
  // R008 exists in Peppol's UBL rules only
  if (opts.peppol && m.syntax === "UBL") {
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
  if (m.locs["taxCurrency"] && !ISO_4217.has(normSpace(m.taxCurrency)))
    emit(
      "BR-CL-05",
      `VAT accounting currency "${m.taxCurrency ?? ""}" (BT-6) is not an ISO 4217 code.`,
      at(m.locs, "taxCurrency"),
      { actual: m.taxCurrency, expected: "EUR, USD, GBP …" },
    );
  // BR-CL-03 (normalized) and PEPPOL-EN16931-CL007 (exactly as written): every listed amount's currencyID is ISO 4217
  {
    const bad = (m.currencyIds ?? []).filter((c) => !ISO_4217.has(normSpace(c.currency)));
    for (const c of bad.slice(0, 25))
      emit(
        "BR-CL-03",
        c.currency === undefined
          ? `${c.element} has no currencyID; it must be an ISO 4217 code.`
          : `${c.element} has currencyID "${c.currency}", which is not an ISO 4217 code.`,
        c.loc,
        { actual: c.currency, expected: "EUR, USD, GBP …" },
      );
    if (opts.peppol)
      for (const c of (m.currencyIds ?? []).filter((x) => !ISO_4217.has(x.currency ?? "")).slice(0, 25))
        emit(
          "PEPPOL-EN16931-CL007",
          c.currency === undefined
            ? `${c.element} has no currencyID; Peppol needs an ISO 4217 code.`
            : `${c.element} has currencyID "${c.currency}"; Peppol needs an ISO 4217 code written exactly, without spaces.`,
          c.loc,
          { actual: c.currency, expected: "EUR, USD, GBP …" },
        );
  }
  // BR-CL-06, -08, -10, -21, -22, -26, BR-50, BR-B-01/02 and PEPPOL-EN16931-CL006
  codeListRules(m, emit, !!opts.peppol);
  // BR-CL-07: the scheme of an invoiced object identifier (BT-18) is a UNTDID 1153 code
  for (const o of m.objectIdSchemes ?? [])
    if (!UNTDID_1153_CODES.has(normSpace(o.scheme)))
      emit("BR-CL-07", `The invoiced object identifier (BT-18) uses scheme "${o.scheme}", which is not a UNTDID 1153 reference code.`, o.loc, {
        actual: o.scheme,
        expected: "AAA, AJS, ATS …",
      });
  // BR-CL-13, -14, -15, -17, -18: coded values wherever they sit (normalize-space, empty elements fail)
  const CODE_LISTS = {
    country: { id: "BR-CL-14", ok: (v: string) => CEN_COUNTRY_CODES.has(v), what: "country code", list: "an ISO 3166-1 alpha-2 code", example: "DE, FR, NL …" },
    originCountry: { id: "BR-CL-15", ok: (v: string) => CEN_COUNTRY_CODES.has(v), what: "item country of origin (BT-159)", list: "an ISO 3166-1 alpha-2 code", example: "DE, FR, CN …" },
    classificationScheme: { id: "BR-CL-13", ok: (v: string) => UNTDID_7143_CODES.has(v), what: "item classification scheme (listID, BT-158-1)", list: "a UNTDID 7143 scheme", example: "STI, TST, HS …" },
    taxCategory: { id: "BR-CL-17", ok: (v: string) => UNCL_5305_CODES.has(v), what: "VAT category", list: "a UNCL 5305 code", example: "S, Z, E, AE, K, G, O, L, M" },
    itemTaxCategory: { id: "BR-CL-18", ok: (v: string) => UNCL_5305_CODES.has(v), what: "VAT category", list: "a UNCL 5305 code", example: "S, Z, E, AE, K, G, O, L, M" },
  } as const;
  for (const c of m.codedValues ?? []) {
    if (!(c.kind in CODE_LISTS)) continue;
    const spec = CODE_LISTS[c.kind as keyof typeof CODE_LISTS];
    const v = normSpace(c.value);
    if (spec.ok(v)) continue;
    emit(spec.id, `${c.owner} ${spec.what} "${c.value.trim()}" is not ${spec.list}${c.kind === "country" && v === "UK" ? " (use GB)" : ""}.`, c.loc, {
      actual: c.value.trim(),
      expected: c.kind === "country" && v === "UK" ? "GB" : spec.example,
    });
  }
  if (m.syntax === "UBL") {
    // UBL-DT-01: at most two decimals in every amount element (price amounts excepted)
    const long = (m.amountTexts ?? []).filter((a) => (a.raw.includes(".") ? a.raw.slice(a.raw.indexOf(".") + 1) : "").length > 2);
    for (const a of long.slice(0, 25))
      emit("UBL-DT-01", `${a.element} is "${a.raw.trim()}"; amounts may have at most two decimals.`, a.loc, { actual: a.raw.trim() });
    // UBL-DT-06 / UBL-DT-07: every binary object carries a mimeCode and a filename attribute
    for (const b of m.binaryObjects ?? []) {
      if (b.mime === undefined) emit("UBL-DT-06", `${b.element}${b.filename ? ` "${b.filename}"` : ""} has no mimeCode attribute.`, b.loc);
      if (b.filename === undefined) emit("UBL-DT-07", `${b.element} has no filename attribute.`, b.loc);
    }
  }
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
  for (const a of m.attachments) {
    if (!a.id) emit("BR-52", "A supporting document (BG-24) has no document reference (BT-122).", a.loc);
  }
  // BR-CL-24 (EN 16931) and PEPPOL-EN16931-CL001 check the same six MIME codes, on every embedded
  // binary object with a mimeCode
  const attachmentElement = m.syntax === "UBL" ? "EmbeddedDocumentBinaryObject" : "AttachmentBinaryObject";
  for (const b of m.binaryObjects ?? []) {
    if (b.element !== attachmentElement || b.mime === undefined || ATTACHMENT_MIME_CODES.has(b.mime.trim())) continue;
    const what = `Attachment ${b.filename ? `"${b.filename}" ` : ""}has mimeCode "${b.mime}", which is not an allowed MIME code.`;
    emit("BR-CL-24", what, b.loc, { actual: b.mime, expected: "application/pdf" });
    if (opts.peppol) emit("PEPPOL-EN16931-CL001", what, b.loc, { actual: b.mime, expected: "application/pdf" });
  }
  if (m.taxPointDate && m.taxPointCode)
    emit(
      "BR-CO-03",
      "Both a VAT point date and a VAT point date code are present.",
      at(m.locs, "taxPointDate"),
    );
  if (m.hasPeriod) {
    // BR-CO-19 asks for a start or end date element; UBL also accepts the VAT point date code (BT-8)
    // on its own in the period, the official UBL binding's exception for partial invoices
    if (
      !m.locs["periodStart"] &&
      !m.locs["periodEnd"] &&
      !(m.syntax === "UBL" && m.locs["taxPointCode"])
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
    const cii = m.syntax === "CII";
    // The official $profile: an approved business process, else "Unknown". R001 asks for the element,
    // R007 for an approved value, so a missing ProfileID breaks both, as in the official rules.
    const profileApproved = (cii ? PEPPOL_CII_PROFILE_IDS : PEPPOL_PROFILE_IDS).has(normSpace(m.profileId));
    if (!m.locs["profileId"])
      emit(
        "PEPPOL-EN16931-R001",
        cii
          ? "The business process (BusinessProcessSpecifiedDocumentContextParameter/ID) is missing."
          : "cbc:ProfileID (business process) is missing.",
      );
    if (!profileApproved)
      emit(
        "PEPPOL-EN16931-R007",
        m.profileId
          ? `ProfileID "${m.profileId}" is not an approved Peppol business process${cii ? " for CII invoices" : ""}.`
          : "No business process is given, so it is not an approved Peppol one.",
        at(m.locs, "profileId"),
        {
          actual: m.profileId,
          expected: PEPPOL_PROFILE_ID,
        },
      );
    const cid = normSpace(m.customizationId);
    if (!cid.startsWith(PEPPOL_CUSTOMIZATION_ID) || cid.includes("::"))
      emit(
        "PEPPOL-EN16931-R004",
        m.customizationId ? `CustomizationID is "${m.customizationId}".` : "No CustomizationID is given.",
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
    // UBL allows more notes between two German parties (postal countries); CII never, and no subject code
    const bothGerman = !cii && countryIs(m.seller, "DE") && countryIs(m.buyer, "DE");
    if (m.notes.length > 1 && !bothGerman)
      emit(
        "PEPPOL-EN16931-R002",
        `The invoice has ${m.notes.length} notes; Peppol allows one.`,
        at(m.locs, "notes"),
      );
    else if (cii && m.noteSubjectCode)
      emit("PEPPOL-EN16931-R002", "The document note has a subject code, which Peppol doesn't allow in CII.", m.noteSubjectCode);
    // Both rules ask for the element, empty or not (PEPPOL-EN16931-R008 reports empty ones)
    if (!m.locs["buyerReference"] && !m.locs["orderRef"])
      emit(
        "PEPPOL-EN16931-R003",
        "Neither a buyer reference nor a purchase order reference is present.",
      );
    const tc = normSpace(m.typeCode);
    // P0100/P0101 only apply under an approved business process ($profile 01 or 02)
    if (m.locs["typeCode"] && profileApproved) {
      if (cii) {
        if (!PEPPOL_INVOICE_TYPE_CODES.has(tc) && !PEPPOL_CREDIT_NOTE_TYPE_CODES.has(tc))
          emit("PEPPOL-EN16931-P0100", `Document type code ${m.typeCode ?? "(empty)"} is not allowed in Peppol BIS 3.`, at(m.locs, "typeCode"));
      } else if (m.kind === "invoice" && !PEPPOL_INVOICE_TYPE_CODES.has(tc))
        emit(
          "PEPPOL-EN16931-P0100",
          `Invoice type code ${m.typeCode ?? "(empty)"} is not allowed in Peppol BIS 3.`,
          at(m.locs, "typeCode"),
        );
      else if (m.kind === "creditnote" && !PEPPOL_CREDIT_NOTE_TYPE_CODES.has(tc))
        emit(
          "PEPPOL-EN16931-P0101",
          `Credit note type code ${m.typeCode ?? "(empty)"} is not allowed in Peppol BIS 3.`,
          at(m.locs, "typeCode"),
        );
    }
    if (m.typeCode) {
      // P0112: 326 and 389 only between two German parties; 384 also between two Slovak ones.
      // "German" reads the postal address only; "Slovak" the VAT prefix first (Peppol BIS 3.0.22).
      if (m.kind === "invoice" && m.syntax === "UBL" && ["326", "384", "389"].includes(m.typeCode)) {
        const addressCountry = (p: Party | undefined) => p?.address?.country?.trim().toUpperCase();
        const vatCountry = (p: Party | undefined) => (p?.vatId ? p.vatId.trim().slice(0, 2).toUpperCase() : undefined);
        const bothGerman = addressCountry(m.seller) === "DE" && addressCountry(m.buyer) === "DE";
        const sellerCountry = vatCountry(m.seller) ?? vatCountry(m.taxRepresentative) ?? addressCountry(m.seller);
        const buyerCountry = vatCountry(m.buyer) ?? addressCountry(m.buyer);
        const bothSlovak = sellerCountry === "SK" && buyerCountry === "SK";
        if (!bothGerman && !(m.typeCode === "384" && bothSlovak))
          emit(
            "PEPPOL-EN16931-P0112",
            m.typeCode === "384"
              ? "Invoice type code 384 (corrected invoice) is only allowed between two German or two Slovak parties."
              : `Invoice type code ${m.typeCode} is only allowed when seller and buyer are both in Germany.`,
            at(m.locs, "typeCode"),
            { actual: m.typeCode, expected: "380" },
          );
      }
    }
    // R053: exactly one TaxTotal with subtotals (UBL); exactly one VAT total in the invoice currency (CII)
    if (cii) {
      const inCurrency = m.taxTotals.filter((t) => m.currency !== undefined && t.currency === m.currency);
      if (inCurrency.length !== 1)
        emit(
          "PEPPOL-EN16931-R053",
          inCurrency.length === 0
            ? `No VAT total (TaxTotalAmount) is in the invoice currency${m.currency ? ` ${m.currency}` : ""}.`
            : `${inCurrency.length} VAT totals (TaxTotalAmount) are in the invoice currency ${m.currency}; Peppol allows one.`,
          inCurrency[1]?.loc ?? tLoc("taxAmount"),
        );
    } else {
      const withSub = m.taxTotals.filter((t) => t.hasSubtotals);
      if (withSub.length !== 1)
        emit(
          "PEPPOL-EN16931-R053",
          withSub.length === 0
            ? "No TaxTotal contains VAT subtotals (TaxSubtotal); Peppol needs exactly one."
            : `${withSub.length} TaxTotal groups contain subtotals.`,
          withSub[1]?.loc,
        );
    }
    // R054: one VAT total without a breakdown (UBL) or in another currency than the invoice's (CII) exactly
    // when TaxCurrencyCode is given, and none otherwise
    {
      const docCurrency = m.locs["currency"] ? exactText(m.currency, m.locs["currency"]) : undefined;
      const extra = cii
        ? m.taxTotals.filter((t) => t.currency !== undefined && docCurrency !== undefined && t.currency !== docCurrency)
        : m.taxTotals.filter((t) => !t.hasSubtotals);
      const want = m.locs["taxCurrency"] ? 1 : 0;
      if (extra.length !== want)
        emit(
          "PEPPOL-EN16931-R054",
          want === 1
            ? `TaxCurrencyCode is given, so there must be exactly one VAT total in the accounting currency${cii ? "" : " (a TaxTotal without TaxSubtotal)"}; found ${extra.length}.`
            : `There is ${extra.length === 1 ? "a VAT total" : `${extra.length} VAT totals`} ${cii ? "in another currency than the invoice currency" : "without a VAT breakdown (TaxSubtotal)"}, but no TaxCurrencyCode (BT-6).`,
          extra[want]?.loc ?? extra[0]?.loc ?? at(m.locs, "taxCurrency", tLoc("taxAmount")),
          { expected: String(want), actual: String(extra.length) },
        );
    }
    // R006 (CII) and R080 (UBL credit notes, every CII document): at most one invoiced object (130) and one
    // tender or lot reference (50) at document level
    const docRefs = (code: string) => m.attachments.filter((a) => a.typeCode === code);
    if (cii && docRefs("130").length > 1)
      emit("PEPPOL-EN16931-R006", `The invoice has ${docRefs("130").length} invoiced object references (type code 130); Peppol allows one.`, docRefs("130")[1]!.loc);
    if ((cii || m.kind === "creditnote") && docRefs("50").length > 1)
      emit("PEPPOL-EN16931-R080", `The ${cii ? "invoice" : "credit note"} has ${docRefs("50").length} tender or lot references (type code 50); Peppol allows one.`, docRefs("50")[1]!.loc);
    // F001: dates in the syntax's own format (UBL YYYY-MM-DD, CII format 102 YYYYMMDD in this century)
    for (const d of (m.dates ?? []).filter((x) => !peppolDateOk(x, cii)).slice(0, 25))
      emit(
        "PEPPOL-EN16931-F001",
        cii
          ? `Date "${d.raw}"${normSpace(d.format) !== "102" ? ` has format ${d.format === undefined ? "missing" : `"${d.format}"`}, not 102,` : ""} must be 8 digits YYYYMMDD starting with 20.`
          : `${d.element} "${d.raw}" is not a date written as YYYY-MM-DD.`,
        d.loc,
        { actual: d.raw, expected: cii ? "20250131 (format 102)" : "2025-01-31" },
      );
    // R055: when TaxCurrencyCode is given, the VAT totals in both currencies share a sign. UBL treats
    // zero as either sign, CII as positive; a missing total in either currency fails the test.
    if (m.locs["taxCurrency"]) {
      const amounts = (c: string | undefined) =>
        m.taxTotals.filter((t) => c !== undefined && t.currency === c && t.amount !== undefined).map((t) => t.amount!);
      const inTax = amounts(m.taxCurrency);
      const inDoc = amounts(m.currency);
      const some = (xs: number[], ok: (x: number) => boolean) => xs.some(ok);
      const same = cii
        ? (some(inTax, (x) => x < 0) && some(inDoc, (x) => x < 0)) || (some(inTax, (x) => x >= 0) && some(inDoc, (x) => x >= 0))
        : (some(inTax, (x) => x <= 0) && some(inDoc, (x) => x <= 0)) || (some(inTax, (x) => x >= 0) && some(inDoc, (x) => x >= 0));
      if (!same)
        emit(
          "PEPPOL-EN16931-R055",
          inTax.length === 0 || inDoc.length === 0
            ? `TaxCurrencyCode ${m.taxCurrency ?? ""} is given, but there is no VAT total in ${inTax.length === 0 ? "that currency" : "the invoice currency"} to compare signs with.`.replace("  ", " ")
            : `The VAT total (${f2(inDoc[0])} ${m.currency}) and the VAT total in accounting currency (${f2(inTax[0])} ${m.taxCurrency}) have different signs.`,
          tLoc("taxAmountAccounting"),
        );
    }
    // R051 (UBL only; obsolete in CII): every listed amount carries the invoice currency
    if (!cii) {
      if (!m.currency) {
        if (m.amountCurrencies.length > 0)
          emit(
            "PEPPOL-EN16931-R051",
            `No invoice currency (BT-5) is given, so none of the ${m.amountCurrencies.length} amounts' currencyID can match it.`,
            m.amountCurrencies[0]!.loc,
          );
      } else {
        const wrong = m.amountCurrencies.filter((ac) => ac.currency !== m.currency);
        for (const ac of wrong.slice(0, 25))
          emit(
            "PEPPOL-EN16931-R051",
            ac.currency === undefined
              ? `${ac.bt} has no currencyID; it must be the invoice currency ${m.currency}.`
              : `${ac.bt} uses currencyID="${ac.currency}" but the invoice currency is ${m.currency}.`,
            ac.loc,
            {
              actual: ac.currency,
              expected: m.currency,
            },
          );
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
    else if (p.endpoint.scheme === "0208" && !opts.peppol && !checkBelgianEnterprise(p.endpoint.id))
      // Outside Peppol only our own warning; Peppol has the fatal PEPPOL-COMMON-R043 below.
      emit("IV-BE-01", `${who} enterprise number "${p.endpoint.id}" fails the mod-97 check.`, loc, {
        actual: p.endpoint.id,
      });
    // CII: Peppol's own, shorter list for the seller and buyer address, schemeID or not (CL008).
    // UBL checks every EndpointID with a schemeID, below.
    if (opts.peppol && m.syntax === "CII" && !PEPPOL_EAS_CODES.has(p.endpoint.scheme ?? ""))
      emit(
        "PEPPOL-EN16931-CL008",
        p.endpoint.scheme === undefined
          ? `${who} electronic address "${p.endpoint.id}" has no schemeID from the list Peppol accepts.`
          : `${who} endpoint scheme "${p.endpoint.scheme}" is not an electronic address scheme Peppol accepts.`,
        loc,
        { actual: p.endpoint.scheme, expected: "0208, 9925, 0088 …" },
      );
  }
  // BR-CL-11: the scheme of a legal registration number (any PartyLegalEntity/CompanyID) is an ISO 6523 ICD
  for (const [p, who] of [
    [seller, "Seller"],
    [buyer, "Buyer"],
    [m.payee, "Payee"],
  ] as const) {
    const scheme = p?.legalId?.scheme?.trim();
    if (p && scheme !== undefined && !ICD_CODES.has(scheme))
      emit(
        "BR-CL-11",
        `${who} legal registration number "${p.legalId!.id}" has schemeID "${scheme}", which is not an ISO 6523 ICD code.`,
        at(p.locs, "legalId", p.loc),
        { actual: scheme, expected: "0208, 0106, 0002 …" },
      );
  }
  // Peppol's identifier rules look at every identifier with that scheme, wherever it sits: GLN (0088),
  // Norwegian (0192), Danish CVR (0184), Belgian (0208) and Swedish (0007) organisation numbers in
  // EndpointID / party identifiers / CompanyID (UBL) or URIID / ID / GlobalID (CII), and the Peppol
  // address scheme list for each UBL EndpointID (CL008)
  if (opts.peppol) {
    for (const sid of m.schemeIds) {
      const what = `${sid.owner} ${sid.kind}`;
      if (sid.scheme === "0088" && !checkGln(sid.id))
        emit("PEPPOL-COMMON-R040", `${what} GLN "${sid.id}" has an invalid check digit.`, sid.loc, {
          actual: sid.id,
        });
      if (sid.scheme === "0208" && !isPeppol0208(sid.id))
        emit(
          "PEPPOL-COMMON-R043",
          `${what} "${sid.id}" uses scheme 0208 but is not a 10-digit Belgian enterprise number with valid check digits (no BE, dots or spaces).`,
          sid.loc,
          { actual: sid.id, expected: "0123456749" },
        );
      if (sid.scheme === "0192" && !isPeppol0192(exactText(sid.id, sid.loc)))
        emit(
          "PEPPOL-COMMON-R041",
          `${what} "${sid.id}" uses scheme 0192 but is not a 9-digit Norwegian organisation number with a valid check digit (no NO, MVA or spaces).`,
          sid.loc,
          { actual: sid.id, expected: "987654325" },
        );
      if (sid.scheme === "0184" && !isPeppol0184(exactText(sid.id, sid.loc)))
        emit(
          "PEPPOL-COMMON-R042",
          isPeppol0184(sid.id)
            ? `${what} "${sid.id}" uses scheme 0184 and has spaces or line breaks around it; Peppol reads the Danish CVR number exactly as written.`
            : `${what} "${sid.id}" uses scheme 0184 but is not a Danish CVR number: 8 digits, or DK and 8 digits, with no spaces.`,
          sid.loc,
          { actual: sid.id, expected: "12345678" },
        );
      if (sid.scheme === "0007" && !isPeppol0007(exactText(sid.id, sid.loc)))
        emit(
          "PEPPOL-COMMON-R049",
          `${what} "${sid.id}" uses scheme 0007 but is not a 10-digit Swedish organisation number with a valid check digit (no SE, hyphen or spaces).`,
          sid.loc,
          { actual: sid.id, expected: "2021005489" },
        );
      if (m.syntax === "UBL" && sid.element === "EndpointID" && !PEPPOL_EAS_CODES.has(sid.scheme))
        emit(
          "PEPPOL-EN16931-CL008",
          `${sid.owner} endpoint scheme "${sid.scheme}" is not an electronic address scheme Peppol accepts.`,
          sid.loc,
          { actual: sid.scheme, expected: "0208, 9925, 0088 …" },
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
    // BR-CO-09 compares the first two characters exactly (lowercase "be" fails), against
    // ISO 3166-1 alpha-2 plus EL (Greece), XI (Northern Ireland) and 1A, as CEN 1.3.16 lists them
    const prefix = p.vatId.slice(0, 2);
    if (!/^[A-Z1][A-Z]$/.test(prefix) || (!ISO_3166[prefix] && !VAT_PREFIX_EXTRAS.has(prefix))) {
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
    // BR-51: at most 10 characters of the card number (first 6 and last 4 digits); a warning in UBL, fatal in CII
    if (pm.locs["cardPan"] && normSpace(pm.cardPan).length > 10)
      emit("BR-51", `The payment card number (BT-87) has ${normSpace(pm.cardPan).length} characters; show at most the first 6 and last 4 digits.`, pm.locs["cardPan"], {
        severity: m.syntax === "CII" ? "error" : "warning",
        actual: `${normSpace(pm.cardPan).length} characters`,
        expected: "at most 10",
      });
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
    // The mandate reference element must be there (an empty one is PEPPOL-EN16931-R008's concern)
    if (opts.peppol && DIRECT_DEBIT_CODES.has(pm.code) && !pm.locs["mandateRef"])
      emit(
        "PEPPOL-EN16931-R061",
        "Direct debit is used but no mandate reference is given.",
        codeLoc,
      );
  }
  // BR-CO-25 is still in the EN 16931 text, but the official CEN rules dropped it in 1.3.16 (CEN
  // issues #232/#477), and Peppol, XRechnung and SI-UBL 2.0 run those rules: a warning on invoices.
  // Factur-X's own rule packs still check it on every document, so it stays an error there.
  const facturx = fmt.id === "factur-x";
  if ((T.payable ?? 0) > 0 && !m.dueDate && !m.paymentTerms && (facturx || m.kind === "invoice"))
    emit(
      "BR-CO-25",
      `Amount due is ${f2(T.payable)} but there is no due date and no payment terms.`,
      tLoc("payable"),
      { severity: facturx ? "error" : "warning" },
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
    peppolIndicator(ac.rawIndicator, at(ac.locs, "indicator", ac.loc), "A document allowance/charge");
    if (ac.amount === undefined)
      emit(ac.isCharge ? "BR-36" : "BR-31", `A document ${kind} has no amount.`, ac.loc);
    if (!ac.vatCategory)
      emit(ac.isCharge ? "BR-37" : "BR-32", `A document ${kind} has no VAT category.`, ac.loc);
    if (!ac.reason && !ac.reasonCode)
      emit(
        ac.isCharge ? "BR-38" : "BR-33",
        `A document ${kind} has neither a reason nor a reason code.`,
        ac.loc,
      );
    // BR-CO-21 / BR-CO-22 ask for the reason or reason code element (an empty one counts). UBL reads the
    // indicator as a boolean; CII compares Indicator with 'false' / 'true' exactly as written.
    const indicator = m.syntax === "CII" ? exactText(ac.rawIndicator, ac.locs["indicator"]) : xsBoolean(ac.rawIndicator);
    const isAllowance = m.syntax === "CII" ? indicator === "false" : indicator === false;
    const isChargeExact = m.syntax === "CII" ? indicator === "true" : indicator === true;
    if ((isAllowance || isChargeExact) && !ac.locs["reason"] && !ac.locs["reasonCode"])
      emit(
        isAllowance ? "BR-CO-21" : "BR-CO-22",
        `A document-level ${isAllowance ? "allowance" : "charge"} has neither a reason (${isAllowance ? "BT-97" : "BT-104"}) nor a reason code (${isAllowance ? "BT-98" : "BT-105"}).`,
        ac.loc,
      );
    peppolPercent(ac);
  };
  // PEPPOL-EN16931-R043: exactly "true" or "false" (a missing indicator fails too)
  const peppolIndicator = (raw: string | undefined, loc: Loc, what: string) => {
    if (opts.peppol && raw !== "true" && raw !== "false")
      emit(
        "PEPPOL-EN16931-R043",
        raw === undefined ? `${what} has no ChargeIndicator.` : `${what} has ChargeIndicator "${raw}"; use true or false.`,
        loc,
        { actual: raw, expected: "true or false" },
      );
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
    if (ac.baseAmount !== undefined && ac.percent !== undefined) {
      // Official: u:slack(Amount (or 0), BaseAmount × percentage div 100, 0.02) — unrounded, 0.02 itself passes
      const expected = D.div(D.mul(D.dec(ac.baseAmount), D.dec(ac.percent)), D.dec(100));
      if (!D.withinOrEqual(D.dec(ac.amount ?? 0), expected, D.TWO_CENTS))
        emit(
          "PEPPOL-EN16931-R040",
          `Amount ${f2(ac.amount ?? 0)} ≠ ${f2(ac.baseAmount)} × ${ac.percent}% = ${fd(expected)}.`,
          at(ac.locs, "amount", ac.loc),
          {
            expected: fd(expected),
            actual: f2(ac.amount ?? 0),
          },
        );
    }
  };
  m.allowances.forEach(docAc);
  m.charges.forEach(docAc);

  // Reason code lists for every allowance and charge, wherever it sits (UBL also price level; CII document
  // and line level): BR-CL-19 / BR-CL-20 read the indicator as a boolean, PEPPOL-EN16931-CL002 / CL003 as
  // exactly "false" / "true" in UBL and normalized in CII
  for (const { ac, level } of everyAllowanceCharge(m)) {
    if (level === "price" && m.syntax === "CII") continue;
    const where = level === "document" ? "A document-level" : level === "line" ? "A line" : "A price-level";
    if (!ac.locs["reasonCode"]) continue;
    const code = normSpace(ac.reasonCode);
    const flag = xsBoolean(ac.rawIndicator);
    if (flag === false && !UNCL_5189_CODES.has(code))
      emit("BR-CL-19", `${where} allowance has reason code "${code}", which is not a UNCL 5189 allowance reason code.`, ac.locs["reasonCode"], { actual: code, expected: "95, 100, 41 …" });
    if (flag === true && !UNCL_7161_CODES.has(code))
      emit("BR-CL-20", `${where} charge has reason code "${code}", which is not a UNCL 7161 charge reason code.`, ac.locs["reasonCode"], { actual: code, expected: "FC, ABL, ADR …" });
    if (opts.peppol) {
      const raw = m.syntax === "CII" ? normSpace(ac.rawIndicator) : exactText(ac.rawIndicator, ac.locs["indicator"]);
      if (raw === "false" && !UNCL_5189_CODES.has(code))
        emit("PEPPOL-EN16931-CL002", `${where} allowance has reason code "${code}", which is not a UNCL 5189 allowance reason code.`, ac.locs["reasonCode"], { actual: code, expected: "95, 100, 41 …" });
      if (raw === "true" && !UNCL_7161_CODES.has(code))
        emit("PEPPOL-EN16931-CL003", `${where} charge has reason code "${code}", which is not a UNCL 7161 charge reason code.`, ac.locs["reasonCode"], { actual: code, expected: "FC, ABL, ADR …" });
    }
  }

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
      if (ln.baseQuantityUnit && !REC20_UNIT_CODES.has(ln.baseQuantityUnit.trim()))
        emit("BR-CL-23", `${label} base quantity unit "${ln.baseQuantityUnit}" is not a UN/ECE Recommendation 20 or 21 code.`, L("baseQuantity"), {
          actual: ln.baseQuantityUnit,
        });
      if (ln.unitCode && !REC20_UNIT_CODES.has(ln.unitCode.trim()))
        emit("BR-CL-23", `${label} unit code "${ln.unitCode}" is not a UN/ECE Recommendation 20 or 21 code.`, L("unitCode"), {
          actual: ln.unitCode,
          expected: "C62, HUR, KGM …",
        });
      else if (ln.unitCode && !UNIT_CODES[ln.unitCode] && !unitWarned.has(ln.unitCode)) {
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
      // BR-CO-23 / BR-CO-24: each line allowance or charge has a reason or reason code element
      for (const ac of [...ln.allowances, ...ln.charges]) {
        const ind = m.syntax === "CII" ? exactText(ac.rawIndicator, ac.locs["indicator"]) : xsBoolean(ac.rawIndicator);
        const allowance = m.syntax === "CII" ? ind === "false" : ind === false;
        const charge = m.syntax === "CII" ? ind === "true" : ind === true;
        if ((allowance || charge) && !ac.locs["reason"] && !ac.locs["reasonCode"])
          emit(
            allowance ? "BR-CO-23" : "BR-CO-24",
            `${label} has ${allowance ? "an allowance" : "a charge"} with neither a reason (${allowance ? "BT-139" : "BT-144"}) nor a reason code (${allowance ? "BT-140" : "BT-145"}).`,
            ac.loc,
          );
      }
      if (opts.peppol) {
        // R100: at most one invoiced object per line (UBL: one document reference at all); R101: only type 130
        const refs = ln.documentRefs ?? [];
        const objects = m.syntax === "CII" ? refs.filter((r) => r.typeCode === "130") : refs;
        if (objects.length > 1)
          emit("PEPPOL-EN16931-R100", `${label} has ${objects.length} ${m.syntax === "CII" ? "invoiced object references (type code 130)" : "document references"}; Peppol allows one per line.`, objects[1]!.loc);
        if (refs.length > 0 && !refs.some((r) => r.typeCode === "130"))
          emit("PEPPOL-EN16931-R101", `${label} has a document reference with type code ${refs[0]!.typeCode ?? "(none)"}; on a line it may only be an invoiced object (130).`, refs[0]!.loc, {
            actual: refs[0]!.typeCode,
            expected: "130",
          });
      }
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

      for (const ac of [...ln.allowances, ...ln.charges])
        peppolIndicator(ac.rawIndicator, at(ac.locs, "indicator", ac.loc), `${label}: an allowance/charge`);
      for (const pi of ln.priceIndicators ?? []) peppolIndicator(pi.raw, pi.loc, `${label}: a price allowance/charge`);
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
        const ubl = m.syntax === "UBL";
        // R044 and R046 exist in the UBL rules only (CII has no element for them)
        if (ubl && ln.hasPriceCharge)
          emit("PEPPOL-EN16931-R044", `${label} has a price-level allowance/charge whose ChargeIndicator isn't "false" (a charge on price level).`, L("priceCharge"));
        // R121: a base quantity above zero; CII checks the gross price's base quantity as well
        const bases: [number | undefined, string | undefined, string, string][] = [
          [ln.baseQuantity, ln.baseQuantityUnit, "baseQuantity", "base quantity"],
          ...(ubl ? [] : [[ln.grossBaseQuantity, ln.grossBaseQuantityUnit, "grossBaseQuantity", "gross price base quantity"] as [number | undefined, string | undefined, string, string]]),
        ];
        for (const [qty, , key, what] of bases)
          if (qty !== undefined && qty <= 0) emit("PEPPOL-EN16931-R121", `${label} ${what} is ${qty}.`, L(key));
        // R130: a base quantity with a unit code uses the invoiced quantity's unit (UBL only when the
        // line has a quantity; CII always, so a quantity without unit code fails)
        for (const [, unit, key, what] of bases) {
          if (unit === undefined || (ubl && !ln.locs["quantity"]) || unit === ln.unitCode) continue;
          emit(
            "PEPPOL-EN16931-R130",
            ln.unitCode === undefined
              ? `${label} ${what} has unit ${unit}, but the invoiced quantity has no unit code.`
              : `${label} ${what} unit ${unit} differs from ${ln.unitCode}.`,
            L(key),
          );
        }
        if (ubl && ln.grossPrice !== undefined && ln.priceAmount !== undefined) {
          // Official: PriceAmount = BaseAmount − Amount, compared exactly
          const expectedNet = D.sub(D.dec(ln.grossPrice), D.dec(ln.priceDiscount ?? 0));
          if (!D.eq(expectedNet, D.dec(ln.priceAmount)))
            emit(
              "PEPPOL-EN16931-R046",
              `${label} net price ${ln.priceAmount} ≠ gross ${ln.grossPrice} − discount ${ln.priceDiscount ?? 0}.`,
              L("priceAmount"),
              {
                expected: fd(expectedNet),
                actual: String(ln.priceAmount),
              },
            );
        }
        {
          // Official: u:slack(line amount, quantity × (price ÷ base quantity) + charges − allowances, 0.02),
          // with quantity 1, price 0, line amount 0 and base quantity 1 when absent (base also when 0),
          // and each sum of line allowances / charges rounded to two decimals; 0.02 itself passes.
          const quantity = ln.quantity ?? 1;
          const price = ln.priceAmount ?? 0;
          const base = ln.baseQuantity !== undefined && ln.baseQuantity !== 0 ? ln.baseQuantity : 1;
          const expected = D.sub(
            D.add(
              D.mul(D.dec(quantity), D.div(D.dec(price), D.dec(base))),
              D.round2(D.total(ln.charges.map((c) => c.amount))),
            ),
            D.round2(D.total(ln.allowances.map((a) => a.amount))),
          );
          if (!D.withinOrEqual(D.dec(ln.netAmount ?? 0), expected, D.TWO_CENTS))
            emit(
              "PEPPOL-EN16931-R120",
              `${label}: ${quantity} × ${price}${base !== 1 ? ` / ${base}` : ""} = ${f2(D.toNumber(expected))}, but the line amount is ${f2(ln.netAmount ?? 0)}.`,
              L("netAmount"),
              { expected: f2(D.toNumber(expected)), actual: f2(ln.netAmount ?? 0) },
            );
        }
      }
    }
  }

  /* ---------------- totals: calculations ---------------- */
  // As the official Schematron: exact decimals, the declared amount against the computed one
  // rounded to two decimals (`round(x * 10 * 10) div 100`), with no margin on either side.
  const lineTotal = D.total(m.lines.map((l) => l.netAmount));
  const allowanceTotal = D.total(m.allowances.map((a) => a.amount));
  const chargeTotal = D.total(m.charges.map((c) => c.amount));
  const is = (declared: number, computed: D.Dec) => D.eq(D.dec(declared), computed);
  const fa = (n: number | undefined) => (n === undefined || Number.isNaN(n) ? "—" : fd(D.dec(n)));
  if (opts.en16931 && T.lineExtension !== undefined && !is(T.lineExtension, D.round2(lineTotal)))
    emit(
      "BR-CO-10",
      `Sum of line amounts is ${fd(lineTotal)}, but LineExtensionAmount is ${fa(T.lineExtension)}.`,
      tLoc("lineExtension"),
      {
        expected: fd(D.round2(lineTotal)),
        actual: fa(T.lineExtension),
      },
    );
  if (m.allowances.length > 0 || T.allowanceTotal !== undefined) {
    if (T.allowanceTotal === undefined || !is(T.allowanceTotal, D.round2(allowanceTotal)))
      emit(
        "BR-CO-11",
        `Document allowances add up to ${fd(allowanceTotal)}, but AllowanceTotalAmount is ${fa(T.allowanceTotal)}.`,
        tLoc("allowanceTotal"),
        {
          expected: fd(D.round2(allowanceTotal)),
          actual: fa(T.allowanceTotal),
        },
      );
  }
  if (m.charges.length > 0 || T.chargeTotal !== undefined) {
    if (T.chargeTotal === undefined || !is(T.chargeTotal, D.round2(chargeTotal)))
      emit(
        "BR-CO-12",
        `Document charges add up to ${fd(chargeTotal)}, but ChargeTotalAmount is ${fa(T.chargeTotal)}.`,
        tLoc("chargeTotal"),
        {
          expected: fd(D.round2(chargeTotal)),
          actual: fa(T.chargeTotal),
        },
      );
  }
  if (T.taxExclusive !== undefined && T.lineExtension !== undefined) {
    // UBL compares the plain line total unrounded when there are no allowance or charge totals
    const plain = T.allowanceTotal === undefined && T.chargeTotal === undefined && m.syntax === "UBL";
    const raw = D.add(D.sub(D.dec(T.lineExtension), D.dec(T.allowanceTotal ?? 0)), D.dec(T.chargeTotal ?? 0));
    const expected = plain ? raw : D.round2(raw);
    if (!is(T.taxExclusive, expected))
      emit(
        "BR-CO-13",
        `${f2(T.lineExtension)} − ${f2(T.allowanceTotal ?? 0)} + ${f2(T.chargeTotal ?? 0)} = ${fd(expected)}, but TaxExclusiveAmount is ${fa(T.taxExclusive)}.`,
        tLoc("taxExclusive"),
        {
          expected: fd(expected),
          actual: fa(T.taxExclusive),
        },
      );
  }
  const vatTotal = D.total(m.vat.map((v) => v.taxAmount));
  if (T.taxAmount !== undefined && m.vat.length > 0 && !is(T.taxAmount, D.round2(vatTotal)))
    emit(
      "BR-CO-14",
      `VAT breakdown adds up to ${fd(vatTotal)}, but the VAT total is ${fa(T.taxAmount)}.`,
      tLoc("taxAmount"),
      {
        expected: fd(D.round2(vatTotal)),
        actual: fa(T.taxAmount),
      },
    );
  // BR-CO-15 as the official rules: exactly one VAT total in the invoice currency (BT-110), and
  // BT-112 = round(BT-109 + BT-110); CII also accepts BT-112 = BT-109 (an invoice without VAT).
  // Without an invoice currency there is nothing to compare (`every $Currency in ()` holds).
  if (m.currency !== undefined) {
    const inCurrency = m.taxTotals.filter((t) => t.currency === m.currency);
    const vat = inCurrency.length === 1 ? inCurrency[0]!.amount : undefined;
    const sumOk =
      vat !== undefined &&
      T.taxInclusive !== undefined &&
      T.taxExclusive !== undefined &&
      is(T.taxInclusive, D.round2(D.add(D.dec(T.taxExclusive), D.dec(vat))));
    const noVatOk =
      m.syntax === "CII" &&
      T.taxInclusive !== undefined &&
      T.taxExclusive !== undefined &&
      is(T.taxInclusive, D.dec(T.taxExclusive));
    if (!sumOk && !noVatOk) {
      const where = tLoc("taxInclusive");
      if (T.taxInclusive === undefined || T.taxExclusive === undefined)
        emit("BR-CO-15", `${T.taxInclusive === undefined ? "TaxInclusiveAmount (BT-112)" : "TaxExclusiveAmount (BT-109)"} is missing, so the VAT total can't be added up.`, where);
      else if (inCurrency.length !== 1)
        emit(
          "BR-CO-15",
          inCurrency.length === 0
            ? `No VAT total (BT-110) is in the invoice currency ${m.currency}${m.taxTotals.length ? ` (found: ${m.taxTotals.map((t) => t.currency ?? "no currencyID").join(", ")})` : ""}.`
            : `${inCurrency.length} VAT totals are in the invoice currency ${m.currency}; there must be exactly one.`,
          inCurrency[1]?.loc ?? m.taxTotals[0]?.loc ?? where,
          { expected: `one VAT total in ${m.currency}`, actual: String(inCurrency.length) },
        );
      else {
        const expected = D.round2(D.add(D.dec(T.taxExclusive), D.dec(vat ?? 0)));
        emit(
          "BR-CO-15",
          `${f2(T.taxExclusive)} + VAT ${f2(vat ?? 0)} = ${fd(expected)}, but TaxInclusiveAmount is ${fa(T.taxInclusive)}.`,
          where,
          {
            expected: fd(expected),
            actual: fa(T.taxInclusive),
          },
        );
      }
    }
  }
  if (T.payable !== undefined && T.taxInclusive !== undefined) {
    const payable = D.dec(T.payable);
    const inclusive = D.dec(T.taxInclusive);
    const prepaid = D.dec(T.prepaid ?? 0);
    const rounding = D.dec(T.rounding ?? 0);
    // CII: due = grand total − prepaid + rounding, exactly. UBL rounds each side to two decimals
    // when a prepaid or rounding amount is present: round(payable − rounding) = round(total − prepaid).
    const ok =
      m.syntax === "CII"
        ? D.eq(payable, D.add(D.sub(inclusive, prepaid), rounding))
        : D.eq(
            T.rounding === undefined ? payable : D.round2(D.sub(payable, rounding)),
            T.prepaid === undefined ? inclusive : D.round2(D.sub(inclusive, prepaid)),
          );
    const expected = D.round2(D.add(D.sub(inclusive, prepaid), rounding));
    if (!ok)
      emit(
        "BR-CO-16",
        `${f2(T.taxInclusive)} − prepaid ${f2(T.prepaid ?? 0)} + rounding ${f2(T.rounding ?? 0)} = ${fd(expected)}, but PayableAmount is ${fa(T.payable)}.`,
        tLoc("payable"),
        {
          expected: fd(expected),
          actual: fa(T.payable),
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
      if (v.category && v.category !== "O" && v.rate === undefined)
        emit("BR-48", `${label} has no rate.`, V("category"));
      if (v.taxableAmount !== undefined && v.taxAmount !== undefined && v.rate !== undefined) {
        // Official BR-CO-17: when the rate rounds to 0 the VAT amount must round to 0; otherwise
        // |VAT amount| must be within 1.00 of round(|taxable amount| × rate ÷ 100) to the cent —
        // strictly within in UBL, 1.00 itself still passes in CII.
        const rate = D.dec(v.rate);
        const tax = D.dec(v.taxAmount);
        const zeroRate = D.isZero(D.round(rate));
        const expected = zeroRate
          ? D.ZERO
          : D.round2(D.div(D.mul(D.abs(D.dec(v.taxableAmount)), rate), D.dec(100)));
        const ok = zeroRate
          ? D.isZero(D.round(tax))
          : m.syntax === "CII"
            ? D.withinOrEqual(D.abs(tax), expected, D.ONE_UNIT)
            : D.within(D.abs(tax), expected, D.ONE_UNIT);
        if (!ok) {
          const shown = v.taxableAmount < 0 ? D.neg(expected) : expected;
          emit(
            "BR-CO-17",
            `${f2(v.taxableAmount)} × ${v.rate}% = ${fd(shown)}, but the VAT amount is ${f2(v.taxAmount)}.`,
            V("taxAmount"),
            {
              expected: fd(shown),
              actual: f2(v.taxAmount),
            },
          );
        }
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
      if (ONE_BREAKDOWN_ROW.has(u.category)) continue;
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
      }
    }

    // BR-Z-01, BR-E-01, BR-AE-01, BR-IC-01, BR-G-01 and BR-O-01 (BR-VAT-01 here): a category that
    // is used needs exactly one VAT breakdown row, whatever the rates. In UBL a breakdown row
    // counts as use; in CII a row needs a line, allowance or charge with that category.
    for (const category of ONE_BREAKDOWN_ROW) {
      const usedBy = [...m.lines, ...m.allowances, ...m.charges].find((x) => x.vatCategory === category);
      const rows = m.vat.filter((v) => v.category === category);
      const loc = rows[1]?.loc ?? usedBy?.loc ?? rows[0]?.loc ?? m.loc;
      if (rows.length > 1)
        emit("BR-VAT-01", `Category ${category} has ${rows.length} VAT breakdown rows; it must have exactly one.`, loc, {
          expected: `one TaxSubtotal ${category}`,
          actual: String(rows.length),
        });
      else if (rows.length === 0 && usedBy)
        emit("BR-VAT-01", `Category ${category} is used but has no VAT breakdown.`, loc, {
          expected: `TaxSubtotal ${category}`,
        });
      else if (rows.length === 1 && !usedBy && m.syntax === "CII")
        emit(
          "BR-VAT-01",
          `The VAT breakdown has category ${category}, but no line, allowance or charge uses it.`,
          loc,
          { expected: `a line, allowance or charge with category ${category}` },
        );
    }

    // BR-S-08 and the other categories' -08 rules (BR-VAT-08 here): one check per VAT breakdown
    // row, as in the official Schematron. S, L and M sum the lines, document allowances and
    // charges at the row's rate, the other categories at the row's category. The margin depends
    // on the syntax: UBL allows a difference of less than 1.00 for S, L and M and none for the
    // others; CII sums are rounded to the cent first, S, L, M and O must then match exactly and
    // Z, E, AE, K and G may differ by less than 1.00.
    for (const v of m.vat) {
      if (!v.category || !VAT_CATEGORIES[v.category] || v.taxableAmount === undefined) continue;
      const perRate = PER_RATE_CATEGORIES.has(v.category);
      if (perRate && v.rate === undefined) continue; // `every $rate in ()` holds; BR-48 reports the rate
      const rate = perRate ? D.dec(v.rate) : undefined;
      const inRow = (category: string | undefined, r: number | undefined) =>
        category === v.category && (!rate || (r !== undefined && D.eq(D.dec(r), rate)));
      const lines = m.lines.filter((l) => inRow(l.vatCategory, l.vatRate));
      const charges = m.charges.filter((c) => inRow(c.vatCategory, c.vatRate));
      const allowances = m.allowances.filter((a) => inRow(a.vatCategory, a.vatRate));
      const cii = m.syntax === "CII";
      const part = (xs: (number | undefined)[]) => (cii ? D.round2(D.total(xs)) : D.total(xs));
      const computed = D.sub(
        D.add(part(lines.map((l) => l.netAmount)), part(charges.map((c) => c.amount))),
        part(allowances.map((a) => a.amount)),
      );
      const declared = D.dec(v.taxableAmount);
      const margin = cii ? !perRate && v.category !== "O" : perRate;
      const hasUse = lines.length + charges.length + allowances.length > 0;
      // UBL also needs the row's rate to be used (S, L, M), or any invoice line (the others)
      const used = cii || (perRate ? hasUse : m.lines.length > 0);
      if (used && (margin ? D.within(declared, computed, D.ONE_UNIT) : D.eq(declared, computed)))
        continue;
      const label = `${v.category}${v.rate !== undefined ? ` ${v.rate}%` : ""}`;
      emit(
        v.category === "S" ? "BR-S-08" : "BR-VAT-08",
        hasUse
          ? `Lines, allowances and charges in ${label} add up to ${fd(computed)}, but the taxable amount is ${f2(v.taxableAmount)}.`
          : `No line, document allowance or charge uses ${label}, but its VAT breakdown has a taxable amount of ${f2(v.taxableAmount)}.`,
        at(v.locs, "taxableAmount", v.loc),
        { expected: fd(computed), actual: f2(v.taxableAmount) },
      );
    }

    vatCategoryRules(m, emit);

    // PEPPOL-EN16931-P0104 … P0111 (UBL): an EU exemption reason code fixes the TaxCategory's category
    if (opts.peppol && m.syntax === "UBL") {
      const taxCategories = [
        ...m.vat.map((v) => ({ id: v.category, code: v.exemptionCode, codeLoc: v.locs["exemptionCode"], loc: v.locs["category"] ?? v.loc })),
        ...everyAllowanceCharge(m).map(({ ac }) => ({ id: ac.vatCategory, code: ac.vatExemptionCode, codeLoc: ac.locs["vatExemptionCode"], loc: ac.locs["vatCategory"] ?? ac.loc })),
      ];
      for (const tc of taxCategories) {
        if (!tc.codeLoc) continue;
        const rule = VATEX_CATEGORY_RULES[exactText(tc.code, tc.codeLoc).toUpperCase()];
        if (!rule || normSpace(tc.id) === rule.category) continue;
        emit(rule.id, `Exemption reason code ${tc.code} belongs with VAT category ${rule.category}, but the category is ${tc.id ? `"${tc.id}"` : "missing"}.`, tc.loc, {
          actual: tc.id,
          expected: rule.category,
        });
      }
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
    // BR-E-02 / BR-Z-02 look at the invoice lines only (BT-151), as the CEN Schematron does
    const lineCats = new Set(m.lines.map((l) => l.vatCategory));
    if (lineCats.has("E") && !sellerVat && !seller.taxRegistrationId)
      emit(
        "BR-E-02",
        "Lines exempt from VAT (category E) require the seller VAT number, tax registration number or tax representative VAT number.",
        seller.loc,
      );
    if (lineCats.has("Z") && !sellerVat && !seller.taxRegistrationId)
      emit(
        "BR-Z-02",
        "Zero-rated lines (category Z) require the seller VAT number, tax registration number or tax representative VAT number.",
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
    }
    // BR-IC-11 and BR-IC-12 start from a VAT breakdown row with category K, as the official rules do
    if (m.vat.some((v) => v.category === "K")) {
      // A delivery date, or an invoice period that isn't blank (UBL: any child; CII: a start or end date)
      if (!m.deliveryDateGiven && !m.periodHasContent)
        emit(
          "BR-IC-11",
          m.hasPeriod
            ? "Intra-community supply needs an actual delivery date or invoice period dates; the invoice period is empty."
            : "Intra-community supply needs an actual delivery date or invoice period.",
          m.hasPeriod ? at(m.locs, "period") : undefined,
        );
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
  // OpenPeppol PEPPOL-EN16931-UBL.sch and -CII.sch, "NETHERLANDS" pattern (NL-R-001 … NL-R-009).
  // "Dutch" reads the postal country; the address rules ask for the elements, filled or not.
  if (opts.peppol && isNL(m.seller.address?.country)) {
    const s = m.seller;
    const b = m.buyer;
    const cii = m.syntax === "CII";
    const buyerNl = isNL(b.address?.country);
    const tc = normSpace(m.typeCode);
    // UBL: a CreditNote; CII: type codes 81, 83, 381, 396 and 532
    const isCreditNote = cii ? ["81", "83", "381", "396", "532"].includes(tc) : m.kind === "creditnote" && !!m.locs["typeCode"];
    if (isCreditNote && !m.precedingInvoices.some((p) => p.id))
      emit("NL-R-001", "This credit note from a Dutch supplier doesn't reference the invoice it corrects (BT-25).", at(m.locs, "typeCode"));
    if (s.address) {
      const miss = missingAddressElements(s.locs);
      if (miss.length) emit("NL-R-002", `The seller address has no ${miss.join(", ")}.`, at(s.locs, "address", s.loc));
    }
    if (s.legalId && !isKvkOrOin(s.legalId))
      emit("NL-R-003", `The seller legal ID "${s.legalId.id}" has scheme ${s.legalId.scheme ?? "none"}, not 0106 (KvK) or 0190 (OIN).`, at(s.locs, "legalId", s.loc), {
        expected: "schemeID 0106 (KvK) or 0190 (OIN)",
        actual: s.legalId.scheme ?? "no schemeID",
      });
    if (buyerNl && b.address) {
      const miss = missingAddressElements(b.locs);
      if (miss.length) emit("NL-R-004", `The Dutch buyer's address has no ${miss.join(", ")}.`, at(b.locs, "address", b.loc));
    }
    if (buyerNl && b.legalId && !isKvkOrOin(b.legalId))
      emit("NL-R-005", `The buyer legal ID "${b.legalId.id}" has scheme ${b.legalId.scheme ?? "none"}, not 0106 (KvK) or 0190 (OIN).`, at(b.locs, "legalId", b.loc), {
        expected: "schemeID 0106 (KvK) or 0190 (OIN)",
        actual: b.legalId.scheme ?? "no schemeID",
      });
    const rep = m.taxRepresentative;
    if (rep?.address && isNL(rep.address.country)) {
      const miss = missingAddressElements(rep.locs);
      if (miss.length) emit("NL-R-006", `The Dutch tax representative's address has no ${miss.join(", ")}.`, at(rep.locs, "address", rep.loc));
    }
    // NL-R-007: payment instructions unless nothing is due from the buyer (invoice ≤ 0, credit note ≥ 0;
    // in CII only type 381 counts as a credit note here). A missing amount due needs them too.
    if (T.loc && m.paymentMeans.length === 0) {
      const credit = cii ? tc === "381" : m.kind === "creditnote";
      const due = T.payable;
      if (due === undefined || (credit ? due < 0 : due > 0))
        emit(
          "NL-R-007",
          due === undefined
            ? "The amount due (BT-115) is missing and there are no payment instructions."
            : `There is an amount due of ${f2(due)} but no payment instructions.`,
          tLoc("payable"),
        );
    }
    if (buyerNl)
      for (const pm of m.paymentMeans) {
        const code = pm.code?.trim();
        if (!code || !NL_PAYMENT_MEANS.has(code))
          emit("NL-R-008", `Payment means code ${code ?? "(missing)"} is not allowed between Dutch parties.`, at(pm.locs, "code", pm.loc), {
            expected: "30, 48, 49, 57, 58 or 59",
            actual: code,
          });
      }
    if (!m.locs["orderRef"])
      for (const ln of m.lines.filter((l) => l.locs["orderLineRef"]).slice(0, 25))
        emit("NL-R-009", `Line ${ln.id ?? "?"} references order line ${ln.orderLineRef ?? "(empty)"}, but the invoice has no order reference (BT-13).`, at(ln.locs, "orderLineRef", ln.loc));
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
