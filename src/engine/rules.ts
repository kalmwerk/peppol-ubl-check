import {
  ATTACHMENT_MIME_CODES,
  CEN_COUNTRY_CODES,
  CREDIT_TRANSFER_CODES,
  DIRECT_DEBIT_CODES,
  EAS_CODES,
  ICD_CODES,
  EN16931_CII_TYPE_CODES,
  EN16931_UBL_CREDIT_NOTE_TYPE_CODES,
  EN16931_UBL_INVOICE_TYPE_CODES,
  ISO_3166,
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
import { KOSIT_PEPPOL_RULES, nlciusRules, xrechnungRules } from "./rules-national";
import { codeListRules } from "./rules-code-lists";
import { everyAllowanceCharge, exactText, vatCategoryRules, xsBoolean } from "./rules-vat-categories";
import { normalizeSpace, xmlTrim } from "./xpath-text";
import {
  checkBelgianEnterprise,
  checkIban,
  checkLeitwegId,
  checkVatId,
  isPeppol0007,
  isPeppol0184,
  isPeppol0192,
  isPeppol0208,
  isPeppolGln,
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
/** XPath normalize-space(): XML whitespace only, so a non-breaking space stays. */
const normSpace = normalizeSpace;
/**
 * KvK (0106) or OIN (0190), as NL-R-003/005 test the legal ID (BR-NL-1 lives in rules-national.ts):
 * `contains(concat(' ', @schemeID, ' '), ' 0106 ')` (a space-separated token of the schemeID as written)
 * and `normalize-space(.) != ''`, so a value of only a non-breaking space still counts as filled in.
 */
const isKvkOrOin = (id: Identifier | undefined) =>
  !!id && (id.scheme ?? "").split(" ").some((t) => t === "0106" || t === "0190") && normSpace(id.id) !== "";
/** `upper-case(normalize-space(country)) = 'NL'`, the Peppol NL pattern's and SI-UBL 2.0's supplier test. */
const isNL = (country: string | undefined) => normSpace(country).toUpperCase() === "NL";
/** The party's postal country as the Peppol rules read it: `upper-case(normalize-space(…))`. */
const postalCountry = (p: Party | undefined) => normSpace(p?.address?.country).toUpperCase();
const countryIs = (p: Party | undefined, code: string) => postalCountry(p) === code;
/**
 * Peppol's `$supplierCountry` / `$customerCountry` VAT part: the first two characters of the CompanyID as
 * written, of a PartyTaxScheme whose TaxScheme/ID is exactly "VAT", upper-cased after normalize-space().
 * Undefined when there is none or it is empty, so the caller falls back as the official `if` does.
 */
const vatPrefixCountry = (p: Party | undefined): string | undefined => {
  const reg = p?.taxRegistrations?.find((r) => (r.schemeAsWritten ?? r.scheme) === "VAT");
  if (!reg) return undefined;
  const two = (reg.loc.raw ?? reg.id).slice(0, 2);
  return two === "" ? undefined : normSpace(two).toUpperCase();
};
/** Street, city and post code elements that are missing (present but empty still counts as given). */
function missingAddressElements(locs: Record<string, Loc>): string[] {
  return [
    !locs["address.line1"] && "street name",
    !locs["address.city"] && "city",
    !locs["address.postalCode"] && "post code",
  ].filter((x): x is string => !!x);
}

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

/**
 * CII: the official model pattern matches a header ram:ApplicableTradeTax whose CategoryCode is 'L', 'M' or 'O'
 * (as written) and whose upper-case(ram:TypeCode) is 'VAT' (no normalize-space) by its IGIC / IPSI / not-subject
 * rule first, so the generic VAT breakdown rule (BR-45 … BR-48, BR-CO-03, BR-CO-17, BR-DEC-19, BR-DEC-20) never
 * runs on that row; the other categories' rules take the CategoryCode element as context and leave the row free.
 */
function ciiRowTakenByCategoryRule(m: InvoiceModel, v: InvoiceModel["vat"][number]): boolean {
  if (m.syntax !== "CII" || !v.locs["category"] || !v.locs["scheme"]) return false;
  return ["L", "M", "O"].includes(exactText(v.category, v.locs["category"])) && exactText(v.scheme, v.locs["scheme"]).toUpperCase() === "VAT";
}
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
  // KoSIT's XRechnung Schematron copies a subset of Peppol's rules (some with its own changes, marked
  // `kosit` below) and runs them on every XRechnung document, so XRechnung runs the Peppol rule code
  // with every other Peppol rule filtered out at emit
  const kosit = !!opts.xrechnung && !opts.peppol;
  const peppolOn = !!opts.peppol || kosit;
  const slack = kosit && m.xrechnung?.kosit.huf ? D.dec(0.5) : D.TWO_CENTS;
  const emit = (
    ruleId: string,
    message: string,
    loc?: Loc,
    extra: { expected?: string; actual?: string; severity?: Severity } = {},
  ) => {
    const meta = RULE_INDEX[ruleId];
    if (!meta) throw new Error(`Unknown rule ${ruleId}`);
    // XRechnung runs only the Peppol rules KoSIT's Schematron copies
    if (kosit && meta.source === "Peppol" && !KOSIT_PEPPOL_RULES.has(ruleId)) return;
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
  // R008 exists in Peppol's UBL rules only; KoSIT runs it on both syntaxes, with its own exceptions
  if (peppolOn && (m.syntax === "UBL" || kosit)) {
    for (const loc of (kosit ? (m.xrechnung?.kosit.emptyElements ?? []) : m.emptyElements).slice(0, 25)) {
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
  // BR-03: UBL normalize-space(cbc:IssueDate) != ''; CII the same of the DateTimeString with format exactly "102"
  if (m.syntax === "CII" ? !m.issueDateFilled : !m.issueDate && !m.typeErrors.some((t) => t.bt === "BT-2"))
    emit(
      "BR-03",
      m.syntax === "CII" && m.locs["issueDate"] && !m.typeErrors.some((t) => t.bt === "BT-2") && m.issueDate
        ? 'The invoice issue date has no format="102", so it doesn\'t count as given.'
        : "The invoice issue date is missing.",
      m.locs["issueDate"],
    );
  // BR-04/BR-05 ask for a value (normalize-space() != ''); BR-CL-01/BR-CL-04 check any element that is
  // there, so an empty code fails both, as in the official rules
  if (!m.typeCode) emit("BR-04", "The invoice type code is missing.", m.locs["typeCode"]);
  // BR-CL-01: UBL invoices and credit notes have their own lists (CEN 1.3.17), CII one list for both
  if (m.locs["typeCode"]) {
    const list = m.syntax === "CII" ? EN16931_CII_TYPE_CODES : m.kind === "creditnote" ? EN16931_UBL_CREDIT_NOTE_TYPE_CODES : EN16931_UBL_INVOICE_TYPE_CODES;
    const code = normSpace(m.typeCode);
    if (code.includes(" ") || !list.has(code)) {
      const other = m.syntax === "UBL" && code !== "" && (m.kind === "creditnote" ? EN16931_UBL_INVOICE_TYPE_CODES : EN16931_UBL_CREDIT_NOTE_TYPE_CODES).has(code);
      emit(
        "BR-CL-01",
        !m.typeCode
          ? "The invoice type code is empty, so it is not a UNTDID 1001 code."
          : other
            ? `Type code "${m.typeCode}" is a ${m.kind === "creditnote" ? "invoice" : "credit note"} code, but the document is a UBL ${m.kind === "creditnote" ? "CreditNote" : "Invoice"}.`
            : `Type code "${m.typeCode}" is not in UNTDID 1001.`,
        at(m.locs, "typeCode"),
        { actual: m.typeCode, expected: m.syntax === "UBL" ? (m.kind === "creditnote" ? "381, 396, 261 …" : "380, 384, 389 …") : "380, 381, 384, 389 …" },
      );
    }
  }
  if (!m.currency) emit("BR-05", "The invoice currency code is missing.", m.locs["currency"]);
  if (m.locs["currency"] && !ISO_4217.has(normSpace(m.currency)))
    emit("BR-CL-04", m.currency ? `Currency "${m.currency}" is not an ISO 4217 code.` : "The invoice currency code is empty, so it is not an ISO 4217 code.", at(m.locs, "currency"), {
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
    if (peppolOn)
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
  codeListRules(m, emit, !!peppolOn);
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
  // BR-53: a VAT total whose currencyID equals TaxCurrencyCode as written (UBL any TaxTotal/TaxAmount,
  // the same currency as the invoice's still counts). CII tests it in the totals group, and there the
  // accounting currency must also differ from the invoice currency.
  if (m.locs["taxCurrency"]) {
    const written = exactText(m.taxCurrency, m.locs["taxCurrency"]);
    const found = m.taxTotals.some((t) => t.currency === written);
    const sameAsInvoice = m.syntax === "CII" && m.locs["currency"] !== undefined && written === exactText(m.currency, m.locs["currency"]);
    if ((m.syntax === "UBL" || T.loc) && (!found || sameAsInvoice))
      emit(
        "BR-53",
        !found
          ? `Tax currency ${m.taxCurrency ?? "(empty)"} is set, but no VAT total in that currency was found.`
          : `Tax currency ${m.taxCurrency} is the invoice currency; give a VAT accounting currency only when it differs.`,
        at(m.locs, "taxCurrency"),
      );
  }
  // BR-52: normalize-space(ID) != '' on every supporting document (CII: every AdditionalReferencedDocument, line ones too)
  for (const a of m.attachments) {
    if (!a.id) emit("BR-52", "A supporting document (BG-24) has no document reference (BT-122).", a.loc);
  }
  if (m.syntax === "CII")
    for (const ln of m.lines)
      for (const d of ln.documentRefs ?? [])
        if (d.idGiven === false) emit("BR-52", `Line ${ln.id ?? "?"} has a referenced document without an identifier (IssuerAssignedID).`, d.loc);
  // BR-CL-24 (EN 16931) and PEPPOL-EN16931-CL001 check the same six MIME codes, on every embedded
  // binary object with a mimeCode (cbc:EmbeddedDocumentBinaryObject / ram:AttachmentBinaryObject, so an
  // extension's own element of that name doesn't count)
  const attachmentElement = m.syntax === "UBL" ? "EmbeddedDocumentBinaryObject" : "AttachmentBinaryObject";
  for (const b of m.binaryObjects ?? []) {
    // @mimeCode = 'application/pdf' or …: compared exactly as written, so surrounding spaces fail
    if (!b.attachment || b.element !== attachmentElement || b.mime === undefined || ATTACHMENT_MIME_CODES.has(b.mime)) continue;
    const what = `Attachment ${b.filename ? `"${b.filename}" ` : ""}has mimeCode "${b.mime}", which is not an allowed MIME code.`;
    emit("BR-CL-24", what, b.loc, { actual: b.mime, expected: "application/pdf" });
    if (peppolOn) emit("PEPPOL-EN16931-CL001", what, b.loc, { actual: b.mime, expected: "application/pdf" });
  }
  // CII's BR-CO-03 sits in the generic VAT breakdown rule, so it runs only when some header row reaches that rule
  if (m.taxPointDate && m.taxPointCode && (m.syntax !== "CII" || m.vat.some((v) => !ciiRowTakenByCategoryRule(m, v))))
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
    // BR-29: UBL compares xs:date values; CII the format-102 date strings as written (periodInOrder)
    if (m.syntax === "CII" ? m.periodInOrder === false : m.periodStart && m.periodEnd && m.periodEnd < m.periodStart)
      emit(
        "BR-29",
        m.periodStart && m.periodEnd && m.periodEnd < m.periodStart
          ? `Invoice period ends (${m.periodEnd}) before it starts (${m.periodStart}).`
          : 'The invoice period\'s start and end dates can\'t be compared: both must be written as YYYYMMDD with format="102".',
        at(m.locs, "periodEnd"),
      );
  }
  for (const pi of m.precedingInvoices) {
    if (!pi.idGiven) emit("BR-55", "A preceding invoice reference has no invoice number (InvoiceDocumentReference/ID).", pi.loc);
  }
  if (m.dueDate && m.issueDate && m.dueDate < m.issueDate)
    emit(
      "IV-DATE-01",
      `Due date ${m.dueDate} is before the issue date ${m.issueDate}.`,
      at(m.locs, "dueDate"),
    );

  if (peppolOn) {
    const cii = m.syntax === "CII";
    // The official $profile: an approved business process, else "Unknown". R001 asks for the element,
    // R007 for an approved value, so a missing ProfileID breaks both, as in the official rules.
    const profileApproved = (cii ? PEPPOL_CII_PROFILE_IDS : PEPPOL_PROFILE_IDS).has(normSpace(m.profileId));
    // R001's CII context is rsm:ExchangedDocumentContext, so it needs that element
    if (!m.locs["profileId"] && (!cii || m.locs["documentContext"]))
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
    // P0100/P0101 only apply under an approved business process ($profile 01 or 02), and only in UBL: Peppol's
    // CII P0100 sits on the context ram:ExchangedDocument/ram:TypeCode, which no CII document has (the element is
    // rsm:ExchangedDocument), so the official files never raise it on CII; BR-CL-01 still checks the CII code
    if (m.locs["typeCode"] && profileApproved && !cii) {
      if (m.kind === "invoice" && !PEPPOL_INVOICE_TYPE_CODES.has(tc))
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
        const bothGerman = countryIs(m.seller, "DE") && countryIs(m.buyer, "DE");
        const sellerCountry = vatPrefixCountry(m.seller) ?? vatPrefixCountry(m.taxRepresentative) ?? postalCountry(m.seller);
        const buyerCountry = vatPrefixCountry(m.buyer) ?? postalCountry(m.buyer);
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
    // R053: exactly one TaxTotal with subtotals (UBL); exactly one VAT total in the invoice currency (CII),
    // currencyID matched against $documentCurrencyCode as written
    const writtenCurrency = m.locs["currency"] ? exactText(m.currency, m.locs["currency"]) : undefined;
    if (cii) {
      const inCurrency = m.taxTotals.filter((t) => writtenCurrency !== undefined && t.currency === writtenCurrency);
      // KoSIT: at most one (`<= 1`), so none passes
      if (kosit ? inCurrency.length > 1 : inCurrency.length !== 1)
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
    // KoSIT's CII copy also passes when there is no VAT total in the invoice currency
    const kositNoDocTotal = kosit && cii && !m.taxTotals.some((t) => m.currency !== undefined && t.currency === m.currency);
    if (m.locs["taxCurrency"] && !kositNoDocTotal) {
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
        // `@currencyID = $documentCurrencyCode` compares with the code as written, so a padded code matches nothing
        const wrong = m.amountCurrencies.filter((ac) => ac.currency !== writtenCurrency);
        const padded = wrong.filter((ac) => ac.currency === m.currency);
        if (padded.length)
          emit(
            "PEPPOL-EN16931-R051",
            `The invoice currency code (BT-5) is written with spaces or line breaks around "${m.currency}", so the currencyID of ${padded.length} amount${padded.length === 1 ? "" : "s"} doesn't match it; write it without them.`,
            m.locs["currency"],
            { actual: writtenCurrency, expected: m.currency },
          );
        for (const ac of wrong.filter((x) => x.currency !== m.currency).slice(0, 25))
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
  // BR-09/BR-11/BR-20: UBL tests the country inside a postal address that is there; CII tests the
  // country from the document root, so a missing address fails both the address and the country rule
  const cii = m.syntax === "CII";
  if (!seller.address) emit("BR-08", "The seller has no postal address.", seller.loc);
  if ((seller.address || cii) && !seller.address?.country)
    emit("BR-09", seller.address ? "The seller address has no country code." : "The seller has no postal address, so it has no country code.", at(seller.locs, "address", seller.loc));
  if (!buyer.address) emit("BR-10", "The buyer has no postal address.", buyer.loc);
  if ((buyer.address || cii) && !buyer.address?.country)
    emit("BR-11", buyer.address ? "The buyer address has no country code." : "The buyer has no postal address, so it has no country code.", at(buyer.locs, "address", buyer.loc));
  // BR-17: the payee name element is there (filled or not) and the payee repeats no seller name or identifier
  if (m.payee && !m.payee.locs["name"]) emit("BR-17", "A payee is present without a name.", m.payee.loc);
  else if (m.payee && m.payeeRepeatsSeller)
    emit("BR-17", `The payee has the same ${m.payeeRepeatsSeller} as the seller; give a payee only when someone other than the seller is paid.`, m.payee.locs[m.payeeRepeatsSeller === "name" ? "name" : m.payeeRepeatsSeller === "identifier" ? "identifier" : "legalId"] ?? m.payee.loc);
  if (m.taxRepresentative) {
    const tr = m.taxRepresentative;
    if (!tr.name) emit("BR-18", "The tax representative has no name.", tr.loc);
    if (!tr.address) emit("BR-19", "The tax representative has no postal address.", tr.loc);
    if ((tr.address || cii) && !tr.address?.country)
      emit("BR-20", "The tax representative's postal address has no country code.", at(tr.locs, "address", tr.loc));
    // BR-56: UBL exists(PartyTaxScheme[TaxScheme VAT]/CompanyID), filled or not; CII
    // normalize-space(SpecifiedTaxRegistration/ID[@schemeID='VA']) != ''
    const regs = tr.taxRegistrations ?? [];
    const hasVat = cii
      ? regs.some((r) => r.scheme === "VA" && normSpace(exactText(r.id, r.loc)) !== "")
      : regs.some((r) => normSpace(r.scheme).toUpperCase() === "VAT");
    if (!hasVat) emit("BR-56", "The tax representative has no VAT identifier.", tr.loc);
  }
  // BR-57: UBL exists(Country/IdentificationCode) in the deliver-to address; CII a filled-in CountryID
  if (m.delivery?.address && (m.syntax === "UBL" ? !m.delivery.locs["address.country"] : !m.delivery.address.country))
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
    // BR-62/63: UBL exists(@schemeID) (an empty schemeID is there; BR-CL-25 then fails it); CII
    // normalize-space(URIUniversalCommunication[1]/URIID/@schemeID) != '' once the party has a
    // URIUniversalCommunication, so a blank schemeID or a group without URIID fails
    if (m.syntax === "CII" && p.locs["endpointGroup"] && !p.endpoint)
      emit(schemeRule, `${who} electronic address (URIUniversalCommunication) has no URIID with a schemeID.`, p.locs["endpointGroup"]);
    if (!p.endpoint) {
      // R010/R020 have the party as context, so they only fire when the party element is there
      if (peppolOn && p.loc)
        emit(peppolRule, `${who} electronic address (EndpointID) is missing.`, p.loc);
      continue;
    }
    const loc = at(p.locs, "endpoint", p.loc);
    const noScheme = m.syntax === "UBL" ? p.endpoint.scheme === undefined : normSpace(p.endpoint.scheme) === "";
    if (noScheme)
      emit(schemeRule, `${who} EndpointID "${p.endpoint.id}" has no ${p.endpoint.scheme === undefined ? "schemeID" : "filled-in schemeID"}.`, loc);
    // BR-CL-25 (the EAS list) checks every electronic address, in codeListRules
    else if (normSpace(p.endpoint.scheme) === "0208" && !opts.peppol && !checkBelgianEnterprise(p.endpoint.id))
      // Outside Peppol only our own warning; Peppol has the fatal PEPPOL-COMMON-R043 below.
      emit("IV-BE-01", `${who} enterprise number "${p.endpoint.id}" fails the mod-97 check.`, loc, {
        actual: p.endpoint.id,
      });
    // CII: Peppol's own, shorter list for the seller and buyer address, schemeID or not (CL008).
    // UBL checks every EndpointID with a schemeID, below.
    if (peppolOn && m.syntax === "CII" && !PEPPOL_EAS_CODES.has(p.endpoint.scheme ?? ""))
      emit(
        "PEPPOL-EN16931-CL008",
        p.endpoint.scheme === undefined
          ? `${who} electronic address "${p.endpoint.id}" has no schemeID from the list Peppol accepts.`
          : `${who} endpoint scheme "${p.endpoint.scheme}" is not an electronic address scheme Peppol accepts.`,
        loc,
        { actual: p.endpoint.scheme, expected: "0208, 9925, 0088 …" },
      );
  }
  // BR-CL-11 (legal registration identifier schemes, wherever they sit) is in codeListRules
  // Peppol's identifier rules look at every identifier with that scheme, wherever it sits: GLN (0088),
  // Norwegian (0192), Danish CVR (0184), Belgian (0208), Swedish (0007) organisation numbers and Dutch KvK numbers (0106) in
  // EndpointID / party identifiers / CompanyID (UBL) or URIID / ID / GlobalID (CII), and the Peppol
  // address scheme list for each UBL EndpointID (CL008)
  if (peppolOn) {
    for (const sid of m.schemeIds) {
      const what = `${sid.owner} ${sid.kind}`;
      if (sid.scheme === "0088" && !isPeppolGln(exactText(sid.id, sid.loc)))
        emit(
          "PEPPOL-COMMON-R040",
          /^[0-9]+$/.test(normSpace(exactText(sid.id, sid.loc)))
            ? `${what} GLN "${sid.id}" has an invalid GS1 check digit.`
            : `${what} GLN "${sid.id}" must be digits only, with a valid GS1 check digit (no spaces, letters or other characters).`,
          sid.loc,
          { actual: sid.id },
        );
      if (sid.scheme === "0208" && !isPeppol0208(exactText(sid.id, sid.loc)))
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
      // R054 (warning): matches(normalize-space(), '^[0-9]{8}$') for every identifier with schemeID exactly "0106"
      if (sid.scheme === "0106" && !/^[0-9]{8}$/.test(normSpace(exactText(sid.id, sid.loc))))
        emit(
          "PEPPOL-COMMON-R054",
          `${what} "${sid.id}" uses scheme 0106 but is not an 8-digit Dutch KvK number (no letters, spaces or branch number).`,
          sid.loc,
          { actual: sid.id, expected: "12345678" },
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
  // BR-CO-09 reads every VAT identifier element (UBL any PartyTaxScheme with TaxScheme VAT, CII any
  // SpecifiedTaxRegistration/ID with schemeID "VA"), filled or not, and compares its first two characters
  // as written (lowercase "be" or a leading space fails) against ISO 3166-1 alpha-2 plus XI and 1A, and EL
  // (Greece) as CEN 1.3.16 and Peppol BIS 3.0.22 list it (CEN 1.3.17 dropped EL; see official-parity.ts)
  const vatPrefixOk = (value: string) => {
    const prefix = Array.from(value).slice(0, 2).join("");
    return /^[A-Z1][A-Z]$/.test(prefix) && (!!ISO_3166[prefix] || VAT_PREFIX_EXTRAS.has(prefix));
  };
  const VAT_BT: Record<string, string> = { Seller: "BT-31", Buyer: "BT-48", "Tax representative": "BT-63" };
  for (const c of (m.codedValues ?? []).filter((x) => x.kind === "vatIdentifier")) {
    if (vatPrefixOk(c.value)) continue;
    const bt = VAT_BT[c.owner];
    emit(
      "BR-CO-09",
      c.value === ""
        ? `${c.owner} VAT identifier${bt ? ` (${bt})` : ""} is empty, so it has no country prefix.`
        : `${c.owner} VAT identifier "${xmlTrim(c.value)}"${bt ? ` (${bt})` : ""} does not start with a country prefix${xmlTrim(c.value) !== c.value && vatPrefixOk(xmlTrim(c.value)) ? " (it starts with a space or line break)" : ""}.`,
      c.loc,
      { actual: c.value, expected: "DE123456789" },
    );
  }
  for (const [p, who] of vatParties) {
    if (!p?.vatId) continue;
    const loc = at(p.locs, "vatId", p.loc);
    // Our own number checks only run on a VAT identifier with a country prefix (BR-CO-09 reports the rest)
    if (!vatPrefixOk(p.vatId)) continue;
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
  // BR-CO-26: one of the seller's identifier elements, filled or not. UBL: a PartyTaxScheme[TaxScheme VAT]
  // CompanyID, a PartyIdentification/ID whose schemeID isn't SEPA, or PartyLegalEntity/CompanyID. CII: ram:ID,
  // ram:GlobalID, SpecifiedLegalOrganization/ram:ID or SpecifiedTaxRegistration/ram:ID with schemeID "VA".
  const sellerIdentified =
    !!seller.locs["legalId"] ||
    (m.syntax === "CII"
      ? seller.identifiers.length > 0 || (seller.taxRegistrations ?? []).some((r) => r.scheme === "VA")
      : seller.identifiers.some((i) => i.scheme !== "SEPA") || (seller.taxRegistrations ?? []).some((r) => normSpace(r.scheme).toUpperCase() === "VAT"));
  // CII's context is //ram:SellerTradeParty, so without the seller party the rule doesn't run (BR-06 reports it)
  if (!sellerIdentified && (m.syntax === "UBL" || seller.loc))
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
    // BR-49 asks for the code element; BR-CL-16 checks any code element, so an empty one fails BR-CL-16 only
    if (!pm.locs["code"]) {
      emit("BR-49", "A payment instruction has no payment means code.", pm.loc);
      continue;
    }
    const codeLoc = at(pm.locs, "code", pm.loc);
    if (!PAYMENT_MEANS[normSpace(pm.code)])
      emit("BR-CL-16", pm.code ? `Payment means code "${pm.code}" is not in UNCL4461.` : "The payment means code is empty, so it is not a UNCL 4461 code.", codeLoc, {
        actual: pm.code,
      });
    // BR-61: UBL a PayeeFinancialAccount/ID element for code 30 or 58 (normalize-space); CII, for TypeCode
    // '30' or '58' as written, each PayeePartyCreditorFinancialAccount needs an IBANID or ProprietaryID
    const transferCode = m.syntax === "CII" ? exactText(pm.code, pm.locs["code"]) : normSpace(pm.code);
    if (
      CREDIT_TRANSFER_CODES.has(transferCode) &&
      (m.syntax === "CII" ? pm.hasCreditTransfer && !pm.accountIdGiven : !pm.locs["account"])
    )
      emit(
        "BR-61",
        `Payment means ${pm.code} (credit transfer) has no payee account / IBAN.`,
        codeLoc,
      );
    if (
      pm.code &&
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
    if (peppolOn && DIRECT_DEBIT_CODES.has(pm.code ?? "") && !pm.locs["mandateRef"])
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
  // BR-12 … BR-15, BR-CO-10 … BR-CO-13 and BR-CO-16 run on the totals element (UBL cac:LegalMonetaryTotal, CII
  // SpecifiedTradeSettlementHeaderMonetarySummation): without it they don't run. They test the elements
  // (exists()), so a total that isn't a number still counts as given.
  const totalsCtx = T.loc !== undefined;
  if (totalsCtx) {
    if (!T.locs["lineExtension"]) emit("BR-12", "LineExtensionAmount (BT-106) is missing.", T.loc);
    if (!T.locs["taxExclusive"]) emit("BR-13", "TaxExclusiveAmount (BT-109) is missing.", T.loc);
    if (!T.locs["taxInclusive"]) emit("BR-14", "TaxInclusiveAmount (BT-112) is missing.", T.loc);
    if (!T.locs["payable"]) emit("BR-15", "PayableAmount (BT-115) is missing.", T.loc);
  }

  // BR-DEC-*: string-length(substring-after(., '.')) <= 2 on the text as written, so spaces or a line break
  // after the digits count as decimals too
  for (const d of m.decimals) {
    // BR-DEC-13 / BR-DEC-15 (the VAT totals BT-110 / BT-111) read the value, not the text (below); UBL's two
    // assertions compare currencyID with a DocumentCurrencyCode / TaxCurrencyCode child of the TaxAmount itself,
    // which never exists, so they can't fail (UBL-DT-01 still counts the decimals)
    if (d.bt === "BT-110" || d.bt === "BT-111") continue;
    if ((d.bt === "BT-116" || d.bt === "BT-117") && m.vat.some((v) => ciiRowTakenByCategoryRule(m, v) && (v.locs["taxableAmount"] === d.loc || v.locs["taxAmount"] === d.loc))) continue;
    const written = exactText(d.raw, d.loc);
    const dot = written.indexOf(".");
    const dec = dot < 0 ? "" : written.slice(dot + 1);
    if (dec.length > 2)
      emit(
        "BR-DEC",
        dec.trim().length > 2 || xmlTrim(dec) === dec
          ? `${d.bt} has ${dec.length} decimals ("${d.raw}"); at most 2 are allowed.`
          : `${d.bt} is written with spaces or a line break after its decimals ("${written}"), which count as decimals; at most 2 are allowed.`,
        d.loc,
        {
          actual: d.raw,
          expected: Number(d.raw).toFixed(2),
        },
      );
  }

  // CII BR-DEC-13 / BR-DEC-15: not(ram:TaxTotalAmount) or ram:TaxTotalAmount[(@currencyID = <invoice / tax currency>
  // and xs:decimal(.) = round(xs:decimal(.) * 100) div 100) or not(<same currency test>)]: some VAT total in another
  // currency, or one in that currency with at most two decimals of value (trailing zeros don't count)
  if (m.syntax === "CII" && m.taxTotals.length) {
    const valueOf = (t: { loc?: Loc }) => m.decimals.find((d) => (d.bt === "BT-110" || d.bt === "BT-111") && d.loc.xpath === t.loc?.xpath)?.raw;
    const twoDecimals = (t: { loc?: Loc }) => {
      const raw = valueOf(t);
      return raw !== undefined && (/^[+-]?\d*(?:\.(\d*))?$/.exec(raw)?.[1] ?? "").replace(/0+$/, "").length <= 2;
    };
    const inv = m.locs["currency"] ? exactText(m.currency, m.locs["currency"]) : undefined;
    if (!m.taxTotals.some((t) => (t.currency === inv ? twoDecimals(t) : true))) {
      const bad = m.taxTotals.find((t) => t.currency === inv)!;
      emit("BR-DEC", `The VAT total (BT-110) is ${valueOf(bad)}; at most 2 decimals are allowed.`, bad.loc, { actual: valueOf(bad) });
    }
    // BR-DEC-15 holds when there is no TaxCurrencyCode; with one, a VAT total in that currency must have at most two
    if (m.locs["taxCurrency"]) {
      const tcc = exactText(m.taxCurrency, m.locs["taxCurrency"]);
      if (!m.taxTotals.some((t) => t.currency === tcc && twoDecimals(t))) {
        const bad = m.taxTotals.find((t) => t.currency === tcc);
        emit(
          "BR-DEC",
          bad ? `The VAT total in accounting currency (BT-111) is ${valueOf(bad)}; at most 2 decimals are allowed.` : `There is no VAT total in the accounting currency "${tcc}" (BT-111) with at most 2 decimals.`,
          bad?.loc ?? m.locs["taxCurrency"],
          { actual: bad ? valueOf(bad) : undefined },
        );
      }
    }
  }

  /* ---------------- allowances & charges (document level) ---------------- */
  // The totals and -08 rules pick document allowances and charges with `ChargeIndicator = false()` / `true()`
  // (cast to xs:boolean: "false"/"0", "true"/"1", whitespace trimmed): one without an indicator is neither
  const docAllowances = [...m.allowances, ...m.charges].filter((ac) => xsBoolean(ac.rawIndicator) === false);
  const docCharges = [...m.allowances, ...m.charges].filter((ac) => xsBoolean(ac.rawIndicator) === true);
  /** An allowance or charge as the official contexts read its indicator: UBL `cbc:ChargeIndicator = false()`
   * (xs:boolean), CII `udt:Indicator = 'false'` (as written); anything else is neither. */
  const acKind = (ac: AllowanceCharge): "allowance" | "charge" | undefined => {
    const v = m.syntax === "CII" ? exactText(ac.rawIndicator, ac.locs["indicator"]) : xsBoolean(ac.rawIndicator);
    return v === false || v === "false" ? "allowance" : v === true || v === "true" ? "charge" : undefined;
  };
  /** UBL exists(cac:TaxCategory[TaxScheme VAT]/cbc:ID); CII (ram:CategoryTradeTax[upper-case(ram:TypeCode) = 'VAT']/ram:CategoryCode) */
  const acHasVatCategory = (ac: AllowanceCharge) =>
    !!ac.locs["vatCategory"] &&
    (m.syntax === "CII"
      ? exactText(ac.vatScheme, ac.locs["vatScheme"]).toUpperCase() === "VAT"
      : normSpace(ac.vatScheme).toUpperCase() === "VAT");
  const docAc = (ac: AllowanceCharge) => {
    peppolIndicator(ac.rawIndicator, at(ac.locs, "indicator", ac.loc), "A document allowance/charge");
    // BR-31 … BR-38 and BR-CO-21/22 read an allowance (indicator false) or charge (true) as each syntax
    // tests it: UBL as xs:boolean (true/1, false/0), CII Indicator as written. They ask for the elements,
    // filled or not; the VAT category one needs a TaxCategory with TaxScheme VAT (CII TypeCode VAT).
    const official = acKind(ac);
    if (official) {
      const charge = official === "charge";
      if (!ac.locs["amount"]) emit(charge ? "BR-36" : "BR-31", `A document ${official} has no amount.`, ac.loc);
      if (!acHasVatCategory(ac)) emit(charge ? "BR-37" : "BR-32", `A document ${official} has no VAT category (with tax scheme VAT).`, ac.locs["vatCategory"] ?? ac.loc);
      if (!ac.locs["reason"] && !ac.locs["reasonCode"])
        emit(charge ? "BR-38" : "BR-33", `A document ${official} has neither a reason nor a reason code.`, ac.loc);
    }
    const isAllowance = official === "allowance";
    const isChargeExact = official === "charge";
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
    if (peppolOn && raw !== "true" && raw !== "false")
      emit(
        "PEPPOL-EN16931-R043",
        raw === undefined ? `${what} has no ChargeIndicator.` : `${what} has ChargeIndicator "${raw}"; use true or false.`,
        loc,
        { actual: raw, expected: "true or false" },
      );
  };
  const peppolPercent = (ac: AllowanceCharge) => {
    if (!peppolOn) return;
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
      // (KoSIT: 0.5 for HUF invoices)
      const expected = D.div(D.mul(D.dec(ac.baseAmount), D.dec(ac.percent)), D.dec(100));
      if (!D.withinOrEqual(D.dec(ac.amount ?? 0), expected, slack))
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
    if (peppolOn) {
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
      // BR-23: exists(InvoicedQuantity/@unitCode), so a line without a quantity fails it too and an empty
      // unitCode passes (BR-CL-23 then fails it)
      if (ln.unitCode === undefined)
        emit("BR-23", ln.locs["quantity"] ? `${label} quantity has no unit code.` : `${label} has no quantity, so it has no unit code.`, L("quantity"));
      // BR-CL-23 checks every quantity unitCode (UBL InvoicedQuantity/BaseQuantity; CII BilledQuantity and
      // both price BasisQuantity elements)
      for (const [unit, key] of [[ln.baseQuantityUnit, "baseQuantity"], [ln.grossBaseQuantityUnit, "grossBaseQuantity"]] as const)
        if (unit !== undefined && !REC20_UNIT_CODES.has(normSpace(unit)))
          emit("BR-CL-23", `${label} base quantity unit "${unit}" is not a UN/ECE Recommendation 20 or 21 code.`, L(key), {
            actual: unit,
          });
      if (ln.unitCode !== undefined && !REC20_UNIT_CODES.has(normSpace(ln.unitCode)))
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
      // BR-27: (Price/PriceAmount) >= 0 — a missing net price can't be compared, so it fails too
      if (ln.priceAmount !== undefined ? ln.priceAmount < 0 : !ln.locs["priceAmount"])
        emit("BR-27", ln.priceAmount !== undefined ? `${label} net price is negative (${ln.priceAmount}).` : `${label} has no net price, so it can't be checked for a negative value.`, L("priceAmount"));
      if (ln.grossPrice !== undefined && ln.grossPrice < 0)
        emit("BR-28", `${label} gross price is negative (${ln.grossPrice}).`, L("grossPrice"));
      if (ln.locs["period"]) {
        if (!ln.periodStart && !ln.periodEnd)
          emit("BR-CO-20", `${label} has an empty period.`, L("period"));
        if (m.syntax === "CII" ? ln.periodInOrder === false : ln.periodStart && ln.periodEnd && ln.periodEnd < ln.periodStart)
          emit(
            "BR-30",
            ln.periodStart && ln.periodEnd && ln.periodEnd < ln.periodStart
              ? `${label} period ends before it starts.`
              : `${label} period's start and end dates can't be compared: both must be written as YYYYMMDD with format="102".`,
            L("periodEnd"),
          );
        if (peppolOn && m.periodStart && ln.periodStart && ln.periodStart < m.periodStart)
          emit(
            "PEPPOL-EN16931-R110",
            `${label} period starts ${ln.periodStart}, before the invoice period (${m.periodStart}).`,
            L("periodStart"),
          );
        if (peppolOn && m.periodEnd && ln.periodEnd && ln.periodEnd > m.periodEnd)
          emit(
            "PEPPOL-EN16931-R111",
            `${label} period ends ${ln.periodEnd}, after the invoice period (${m.periodEnd}).`,
            L("periodEnd"),
          );
      }
      // BR-CO-04: UBL ClassifiedTaxCategory[TaxScheme VAT]/cbc:ID, CII ApplicableTradeTax[upper-case(TypeCode)
      // = 'VAT']/CategoryCode — the element, filled or not (BR-CL-18 checks the code itself)
      const lineVatCategory =
        !!ln.locs["vatCategoryCode"] &&
        (m.syntax === "CII" ? exactText(ln.vatScheme, ln.locs["vatScheme"]).toUpperCase() === "VAT" : normSpace(ln.vatScheme).toUpperCase() === "VAT");
      if (!lineVatCategory) emit("BR-CO-04", `${label} has no VAT category (with tax scheme VAT).`, L("vatCategory"));
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
      if (peppolOn) {
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
      // rate rules per category, on the official contexts: the line's VAT category (UBL normalize-space(cbc:ID),
      // CII ram:CategoryCode as written) under the VAT tax scheme (UBL normalize-space(upper-case(..)), CII
      // upper-case(ram:TypeCode)). A missing rate fails every "= 0" and "> 0" test (xs:decimal(()) = 0 is false).
      const lineVat =
        m.syntax === "CII"
          ? exactText(ln.vatScheme, ln.locs["vatScheme"]).toUpperCase() === "VAT"
          : normalizeSpace(ln.vatScheme).toUpperCase() === "VAT";
      const cat = !lineVat ? undefined : m.syntax === "CII" ? exactText(ln.vatCategory, ln.locs["vatCategoryCode"]) : normalizeSpace(ln.vatCategory);
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
      if (zr && rate !== 0)
        emit(zr, rate === undefined ? `${label} has category ${cat} but no VAT rate; it must be 0.` : `${label} has category ${cat} with rate ${rate}%; it must be 0.`, L("vatRate"), {
          expected: "0",
          actual: rate === undefined ? undefined : String(rate),
        });
      // BR-O-05: not(cbc:Percent) / not(ram:RateApplicablePercent), a test of presence
      if (cat === "O" && ln.locs["vatRate"])
        emit("BR-O-05", `${label} is out of scope of VAT but carries rate ${rate}%.`, L("vatRate"));

      for (const ac of [...ln.allowances, ...ln.charges])
        peppolIndicator(ac.rawIndicator, at(ac.locs, "indicator", ac.loc), `${label}: an allowance/charge`);
      for (const pi of ln.priceIndicators ?? []) peppolIndicator(pi.raw, pi.loc, `${label}: a price allowance/charge`);
      // BR-41 … BR-44: the amount and reason elements of a line allowance (indicator false) or charge (true)
      for (const ac of [...ln.allowances, ...ln.charges]) {
        const official = acKind(ac);
        if (official) {
          const charge = official === "charge";
          if (!ac.locs["amount"]) emit(charge ? "BR-43" : "BR-41", `${label} has ${charge ? "a charge" : "an allowance"} without amount.`, ac.loc);
          if (!ac.locs["reason"] && !ac.locs["reasonCode"])
            emit(charge ? "BR-44" : "BR-42", `${label} has ${charge ? "a charge" : "an allowance"} without reason.`, ac.loc);
        }
        peppolPercent(ac);
      }
      // BR-54: each item attribute has a name and a value element (UBL Name/Value, CII Description/Value), filled or not
      for (const a of ln.attributes) {
        if (!a.hasName || !a.hasValue)
          emit("BR-54", `${label} has an item attribute without ${!a.hasName ? "name" : "value"}.`, L("item"));
      }
      // BR-64: UBL exists(@schemeID); CII normalize-space(GlobalID/@schemeID) != ''
      if (ln.standardItemId && (m.syntax === "UBL" ? ln.standardItemId.scheme === undefined : normSpace(ln.standardItemId.scheme) === ""))
        emit("BR-64", `${label} standard item identifier has no ${ln.standardItemId.scheme === undefined ? "scheme" : "filled-in scheme"} (schemeID).`, L("standardItemId"));
      // BR-65 reads each classification code: UBL exists(@listID), so listID="" passes (BR-CL-13 then
      // fails it); CII normalize-space(ram:ClassCode/@listID) != '', so a blank listID fails
      const noListId = ln.classification?.find((c) => (m.syntax === "UBL" ? c.scheme === undefined : normSpace(c.scheme) === ""));
      if (noListId)
        emit(
          "BR-65",
          `${label} item classification code${noListId.id ? ` "${noListId.id}"` : ""} has no ${m.syntax === "UBL" || noListId.scheme === undefined ? "listID" : "filled-in listID"} (classification scheme).`,
          noListId.loc ?? L("item"),
        );

      if (peppolOn) {
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
          // KoSIT's CII copy falls back to the gross price's base quantity before 1
          const base =
            ln.baseQuantity !== undefined && ln.baseQuantity !== 0
              ? ln.baseQuantity
              : kosit && !ubl && ln.grossBaseQuantity !== undefined && ln.grossBaseQuantity !== 0
                ? ln.grossBaseQuantity
                : 1;
          const expected = D.sub(
            D.add(
              D.mul(D.dec(quantity), D.div(D.dec(price), D.dec(base))),
              D.round2(D.total(ln.charges.map((c) => c.amount))),
            ),
            D.round2(D.total(ln.allowances.map((a) => a.amount))),
          );
          // KoSIT: a warning, with 0.5 slack for HUF invoices
          if (!D.withinOrEqual(D.dec(ln.netAmount ?? 0), expected, slack))
            emit(
              "PEPPOL-EN16931-R120",
              `${label}: ${quantity} × ${price}${base !== 1 ? ` / ${base}` : ""} = ${f2(D.toNumber(expected))}, but the line amount is ${f2(ln.netAmount ?? 0)}.`,
              L("netAmount"),
              { expected: f2(D.toNumber(expected)), actual: f2(ln.netAmount ?? 0), severity: kosit ? "warning" : undefined },
            );
        }
      }
    }
  }

  // KoSIT's CII copies of R044 and R046 (Peppol's own CII rules have neither), per GrossPriceProductTradePrice:
  // a price-level ActualAmount needs an Indicator written exactly "false"; with a gross ChargeAmount, the net
  // price is the gross price minus the first ActualAmount of the price-level allowance (a failing cast or more
  // than one allowance amount stops the official run, so those are left to the type checks)
  if (kosit && m.syntax === "CII")
    for (const g of m.xrechnung?.kosit.grossPrices ?? []) {
      if (g.actualGiven && !g.indicatorFalse)
        emit("PEPPOL-EN16931-R044", 'A line has a price-level allowance whose ChargeIndicator isn\'t "false" (a charge on price level).', g.loc);
      if (g.chargeAmounts.length === 0) continue;
      const gross = g.chargeAmounts[0];
      const discount = g.discounts.length === 0 ? 0 : g.discounts.length === 1 ? g.discounts[0] : null;
      if (g.chargeAmounts.length > 1 || gross === null || discount === null || g.netChargeAmounts.length > 1 || g.netChargeAmounts[0] === null) continue;
      const net = g.netChargeAmounts[0];
      const expectedNet = D.sub(D.dec(gross), D.dec(discount));
      if (net === undefined || !D.eq(expectedNet, D.dec(net)))
        emit(
          "PEPPOL-EN16931-R046",
          net === undefined
            ? "A line has a gross price but no net price (NetPriceProductTradePrice/ChargeAmount)."
            : `A line's net price ${net} ≠ gross ${gross} − discount ${discount}.`,
          g.loc,
          { expected: fd(expectedNet), actual: net === undefined ? undefined : String(net) },
        );
    }

  /* ---------------- totals: calculations ---------------- */
  // As the official Schematron: exact decimals, the declared amount against the computed one
  // rounded to two decimals (`round(x * 10 * 10) div 100`), with no margin on either side.
  const lineTotal = D.total(m.lines.map((l) => l.netAmount));
  const allowanceTotal = D.total(docAllowances.map((a) => a.amount));
  const chargeTotal = D.total(docCharges.map((c) => c.amount));
  const is = (declared: number, computed: D.Dec) => D.eq(D.dec(declared), computed);
  const fa = (n: number | undefined) => (n === undefined || Number.isNaN(n) ? "—" : fd(D.dec(n)));
  // A missing total fails the official equations too (`xs:decimal(()) = …` is false); one that isn't a
  // number stops the official files, so it is left to IV-SYN-03
  const missingTotal = (key: string) => totalsCtx && !T.locs[key];
  if (opts.en16931 && (T.lineExtension !== undefined ? !is(T.lineExtension, D.round2(lineTotal)) : missingTotal("lineExtension")))
    emit(
      "BR-CO-10",
      T.lineExtension === undefined
        ? `LineExtensionAmount (BT-106) is missing, so it can't match the sum of line amounts (${fd(lineTotal)}).`
        : `Sum of line amounts is ${fd(lineTotal)}, but LineExtensionAmount is ${fa(T.lineExtension)}.`,
      tLoc("lineExtension"),
      {
        expected: fd(D.round2(lineTotal)),
        actual: fa(T.lineExtension),
      },
    );
  if (totalsCtx && (docAllowances.length > 0 || T.allowanceTotal !== undefined)) {
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
  if (totalsCtx && (docCharges.length > 0 || T.chargeTotal !== undefined)) {
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
  if (T.taxExclusive === undefined || T.lineExtension === undefined) {
    if (missingTotal("taxExclusive") || missingTotal("lineExtension"))
      emit(
        "BR-CO-13",
        `${missingTotal("taxExclusive") ? "TaxExclusiveAmount (BT-109)" : "LineExtensionAmount (BT-106)"} is missing, so the total without VAT can't be checked.`,
        tLoc(missingTotal("taxExclusive") ? "taxInclusive" : "taxExclusive"),
      );
  } else {
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
  // CII's BR-CO-14 runs on every TaxTotalAmount in the invoice currency (as written) and needs it to equal the
  // breakdown's sum even when there is no breakdown (the sum is then 0); UBL's passes without TaxSubtotal
  if (m.syntax === "CII") {
    const inv = m.locs["currency"] ? exactText(m.currency, m.locs["currency"]) : undefined;
    for (const t of m.taxTotals)
      if (inv !== undefined && t.currency === inv && t.amount !== undefined && !is(t.amount, D.round2(vatTotal)))
        emit("BR-CO-14", m.vat.length ? `VAT breakdown adds up to ${fd(vatTotal)}, but the VAT total is ${fa(t.amount)}.` : `The VAT total is ${fa(t.amount)}, but there is no VAT breakdown to add up to it.`, t.loc ?? tLoc("taxAmount"), {
          expected: fd(D.round2(vatTotal)),
          actual: fa(t.amount),
        });
  } else if (T.taxAmount !== undefined && m.vat.length > 0 && !is(T.taxAmount, D.round2(vatTotal)))
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
  // Without an invoice currency there is nothing to compare (`every $Currency in ()` holds). The currency
  // code is matched against currencyID exactly as written, so a padded or empty code finds no VAT total.
  const invoiceCurrency = m.locs["currency"] ? exactText(m.currency, m.locs["currency"]) : undefined;
  if (invoiceCurrency !== undefined) {
    const inCurrency = m.taxTotals.filter((t) => t.currency === invoiceCurrency);
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
            ? `No VAT total (BT-110) is in the invoice currency "${invoiceCurrency}"${m.taxTotals.length ? ` (found: ${m.taxTotals.map((t) => (t.currency === undefined ? "no currencyID" : `"${t.currency}"`)).join(", ")})` : ""}.`
            : `${inCurrency.length} VAT totals are in the invoice currency ${invoiceCurrency}; there must be exactly one.`,
          inCurrency[1]?.loc ?? m.taxTotals[0]?.loc ?? where,
          { expected: `one VAT total in "${invoiceCurrency}"`, actual: String(inCurrency.length) },
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
  if (T.payable === undefined || T.taxInclusive === undefined) {
    if (missingTotal("payable") || missingTotal("taxInclusive"))
      emit(
        "BR-CO-16",
        `${missingTotal("payable") ? "PayableAmount (BT-115)" : "TaxInclusiveAmount (BT-112)"} is missing, so the amount due can't be checked.`,
        tLoc(missingTotal("payable") ? "taxInclusive" : "payable"),
      );
  } else {
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
      const generic = !ciiRowTakenByCategoryRule(m, v);
      if (generic && v.taxableAmount === undefined && !v.locs["taxableAmount"])
        emit("BR-45", `${label} has no taxable amount.`, v.loc);
      if (generic && v.taxAmount === undefined && !v.locs["taxAmount"])
        emit("BR-46", `${label} has no tax amount.`, v.loc);
      // BR-47/BR-48 and the BR-x-10 exemption reason rules read a breakdown row with tax scheme VAT
      // (UBL normalize-space(upper-case(TaxScheme/ID)), CII upper-case(TypeCode) as written) and ask for
      // the elements, filled or not; UBL compares the category normalized, CII as written
      const ciiRow = m.syntax === "CII";
      const vatRow = !!v.locs["scheme"] && (ciiRow ? exactText(v.scheme, v.locs["scheme"]).toUpperCase() === "VAT" : normSpace(v.scheme).toUpperCase() === "VAT");
      const rowCategory = v.locs["category"] ? (ciiRow ? exactText(v.category, v.locs["category"]) : normSpace(v.category)) : undefined;
      if (generic && !(vatRow && rowCategory !== undefined))
        emit("BR-47", rowCategory === undefined ? "A VAT breakdown has no category code." : "A VAT breakdown has a category code but its tax scheme isn't VAT.", v.locs["category"] ?? v.loc);
      if (generic && !(vatRow && (v.locs["rate"] || rowCategory === "O")))
        emit("BR-48", `${label} has no rate.`, V("category"));
      // Official BR-CO-17 reads the rate of a row whose tax scheme is VAT (normalize-space(upper-case(..)) in
      // both syntaxes). Rate rounding to 0, or no such rate: the VAT amount must round to 0. Otherwise
      // |VAT amount| must be within 1.00 of round(|taxable amount| × rate ÷ 100) to the cent — strictly within
      // in UBL, 1.00 itself still passes in CII. A missing amount fails (xs:decimal(()) compares false); a value
      // that isn't a number stops the official files, so it is left to IV-SYN-03.
      const notNumber = (key: "rate" | "taxAmount" | "taxableAmount") => !!v.locs[key] && v[key] === undefined;
      if (generic && !notNumber("rate") && !notNumber("taxAmount") && !notNumber("taxableAmount")) {
        const schemeVat = !!v.locs["scheme"] && normSpace(v.scheme).toUpperCase() === "VAT";
        const rateGiven = schemeVat && v.rate !== undefined;
        const rate = rateGiven ? D.dec(v.rate) : undefined;
        const taxRoundsToZero = v.taxAmount !== undefined && D.isZero(D.round(D.dec(v.taxAmount)));
        if (!rate || D.isZero(D.round(rate))) {
          if (!taxRoundsToZero)
            emit(
              "BR-CO-17",
              v.taxAmount === undefined
                ? `${label} has no VAT amount, so it can't be checked against its rate.`
                : rate
                  ? `${label}: the rate rounds to 0, so the VAT amount must round to 0, but it is ${f2(v.taxAmount)}.`
                  : `${label} has ${schemeVat ? "no rate" : "no rate under the VAT tax scheme"}, so its VAT amount must round to 0, but it is ${f2(v.taxAmount)}.`,
              V("taxAmount"),
              { expected: "0.00", actual: v.taxAmount === undefined ? undefined : f2(v.taxAmount) },
            );
        } else if (v.taxAmount === undefined || v.taxableAmount === undefined) {
          emit(
            "BR-CO-17",
            `${label} has no ${v.taxAmount === undefined ? "VAT amount" : "taxable amount"}, so its VAT amount can't be checked against its rate.`,
            V(v.taxAmount === undefined ? "taxableAmount" : "taxAmount"),
          );
        } else {
          const tax = D.dec(v.taxAmount);
          const expected = D.round2(D.div(D.mul(D.abs(D.dec(v.taxableAmount)), rate), D.dec(100)));
          const ok = m.syntax === "CII" ? D.withinOrEqual(D.abs(tax), expected, D.ONE_UNIT) : D.within(D.abs(tax), expected, D.ONE_UNIT);
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
      }
      const hasReason = !!(v.locs["exemptionCode"] || v.locs["exemptionReason"]);
      // CII's BR-S-10/BR-Z-10 match the CategoryCode whatever the TypeCode
      if ((rowCategory === "S" || rowCategory === "Z") && (vatRow || ciiRow) && hasReason)
        emit(
          rowCategory === "S" ? "BR-S-10" : "BR-Z-10",
          `${label} has an exemption reason.`,
          V(v.locs["exemptionCode"] ? "exemptionCode" : "exemptionReason"),
        );
      const needReason: Record<string, string> = {
        E: "BR-E-10",
        AE: "BR-AE-10",
        K: "BR-IC-10",
        O: "BR-O-10",
      };
      const nr = rowCategory !== undefined && vatRow ? needReason[rowCategory] : undefined;
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
    // CII's -01 rules match ram:CategoryCode exactly as written ([ram:CategoryCode='S']), so a padded code is
    // neither a use nor a breakdown row there; UBL's normalize-space(cbc:ID) reads the trimmed value
    const cat = (value: string | undefined, loc: Loc | undefined) => (m.syntax === "CII" ? exactText(value, loc) : value);
    const lineCat = (ln: (typeof m.lines)[number]) => cat(ln.vatCategory, ln.locs["vatCategoryCode"]);
    const acCat = (ac: AllowanceCharge) => cat(ac.vatCategory, ac.locs["vatCategory"]);
    const rowCat = (v: (typeof m.vat)[number]) => cat(v.category, v.locs["category"]);
    // UBL's BR-IG-01 / BR-IP-01 count IGIC (L) and IPSI (M) uses under the VAT tax scheme only
    const counts = (category: string | undefined, scheme: string | undefined) =>
      !(m.syntax === "UBL" && (category === "L" || category === "M")) || normSpace(scheme).toUpperCase() === "VAT";
    for (const ln of m.lines)
      if (counts(lineCat(ln), ln.vatScheme)) addUse(lineCat(ln), ln.vatRate, ln.netAmount ?? 0, ln.loc ?? m.loc);
    for (const a of m.allowances)
      if (counts(acCat(a), a.vatScheme)) addUse(acCat(a), a.vatRate, -(a.amount ?? 0), a.loc ?? m.loc);
    for (const c of m.charges) if (counts(acCat(c), c.vatScheme)) addUse(acCat(c), c.vatRate, c.amount ?? 0, c.loc ?? m.loc);

    for (const [key, u] of used) {
      if (ONE_BREAKDOWN_ROW.has(u.category)) continue;
      const breakdown = m.vat.find((v) => `${rowCat(v)}|${rateKey(v.rate ?? 0)}` === key);
      const label = `${u.category}${u.rate !== undefined ? ` ${u.rate}%` : ""}`;
      if (!breakdown) {
        // BR-S-01 & co. ask for the category in the breakdown; a rate whose lines, allowances and
        // charges net to zero needs no breakdown row of its own (CEN Schematron behaviour)
        if (u.taxable === 0 && m.vat.some((v) => rowCat(v) === u.category)) continue;
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

    // UBL's BR-S-01 also fails the other way round: `(uses > 0 and rows > 0) or (uses = 0 and rows = 0)`, where uses
    // are every cac:ClassifiedTaxCategory and every cac:AllowanceCharge/cac:TaxCategory (line and price level
    // included) with normalize-space(cbc:ID) = 'S', whatever the tax scheme. CII's test has no such half.
    if (m.syntax === "UBL") {
      const isS = (v: string | undefined) => normSpace(v) === "S";
      const sRow = m.vat.find((v) => isS(v.category));
      const sUsed = m.lines.some((ln) => isS(ln.vatCategory)) || everyAllowanceCharge(m).some(({ ac }) => isS(ac.vatCategory));
      if (sRow && !sUsed)
        emit("BR-S-01", "The VAT breakdown has a standard-rated row (S), but no line, allowance or charge is standard rated.", sRow.loc ?? m.loc, {
          expected: "a line, allowance or charge with category S",
        });
      // BR-IG-01 (L) and BR-IP-01 (M), BR-VAT-01 here: `(uses > 0 and count(TaxSubtotal/TaxCategory[cbc:ID = 'L']) > 0)
      // or (uses = 0 and count(TaxSubtotal/TaxCategory[normalize-space(cbc:ID) = 'L'][VAT scheme]) = 0)`: uses under the
      // VAT scheme, the first row count compares the code exactly as written (BR-IP-01 also asks the VAT scheme)
      const vatScheme = (scheme: string | undefined) => normSpace(scheme).toUpperCase() === "VAT";
      for (const [category, name, exactNeedsVat] of [["L", "IGIC", false], ["M", "IPSI", true]] as const) {
        const uses =
          m.lines.filter((ln) => normSpace(ln.vatCategory) === category && vatScheme(ln.vatScheme)).length +
          everyAllowanceCharge(m).filter(({ ac }) => normSpace(ac.vatCategory) === category && vatScheme(ac.vatScheme)).length;
        const asWritten = m.vat.filter((v) => !!v.locs["category"] && exactText(v.category, v.locs["category"]) === category && (!exactNeedsVat || vatScheme(v.scheme)));
        const normalized = m.vat.filter((v) => normSpace(v.category) === category && vatScheme(v.scheme));
        if ((uses > 0 && asWritten.length > 0) || (uses === 0 && normalized.length === 0)) continue;
        emit(
          "BR-VAT-01",
          uses === 0
            ? `The VAT breakdown has an ${name} row (${category}), but no line, allowance or charge uses category ${category} under the VAT tax scheme.`
            : `Category ${category} (${name}) is used, but no VAT breakdown row has the category code "${category}" exactly as written.`,
          (uses === 0 ? normalized[0]?.loc : undefined) ?? m.loc,
          { expected: uses === 0 ? `a line, allowance or charge with category ${category}` : `TaxSubtotal ${category}` },
        );
      }
    }

    // BR-Z-01, BR-E-01, BR-AE-01, BR-IC-01, BR-G-01 and BR-O-01 (BR-VAT-01 here): a category that
    // is used needs exactly one VAT breakdown row, whatever the rates. In UBL a breakdown row
    // counts as use; in CII a row needs a line, allowance or charge with that category.
    // UBL counts only tax categories under the VAT scheme (cac:TaxScheme/normalize-space(upper-case(cbc:ID)) =
    // 'VAT'), breakdown rows included; CII reads the category codes alone
    const ublVat = (scheme: string | undefined) => m.syntax === "CII" || normSpace(scheme).toUpperCase() === "VAT";
    for (const category of ONE_BREAKDOWN_ROW) {
      const usedBy =
        m.lines.find((ln) => lineCat(ln) === category && ublVat(ln.vatScheme)) ??
        [...m.allowances, ...m.charges].find((ac) => acCat(ac) === category && ublVat(ac.vatScheme));
      const rows = m.vat.filter((v) => rowCat(v) === category && ublVat(v.scheme));
      const loc = rows[1]?.loc ?? usedBy?.loc ?? rows[0]?.loc ?? m.loc;
      if (rows.length > 1)
        emit("BR-VAT-01", `Category ${category} has ${rows.length} VAT breakdown rows; it must have exactly one.`, loc, {
          expected: `one TaxSubtotal ${category}`,
          actual: String(rows.length),
        });
      // CII's BR-O-01 only runs when there is an O row: `not(header ApplicableTradeTax[CategoryCode='O']) or (…)`
      else if (rows.length === 0 && usedBy && !(m.syntax === "CII" && category === "O"))
        emit("BR-VAT-01", m.vat.some((v) => rowCat(v) === category) ? `Category ${category} is used, but its VAT breakdown row isn't under the VAT tax scheme (TaxScheme/ID "VAT"), so it doesn't count.` : `Category ${category} is used but has no VAT breakdown.`, loc, {
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
      // A taxable amount that isn't a number stops the official files; a missing one fails the equation
      if (!v.category || !VAT_CATEGORIES[v.category] || (v.taxableAmount === undefined && v.locs["taxableAmount"])) continue;
      const cii = m.syntax === "CII";
      // CII compares the category codes exactly as written (`ram:CategoryCode[.='S']`, `ram:CategoryCode = 'S'`),
      // UBL after normalize-space(): in CII a padded code neither opens the row's check nor counts toward it
      const written = (value: string | undefined, loc: Loc | undefined) => (cii ? exactText(value, loc) : value);
      if (cii && written(v.category, v.locs["category"]) !== v.category) continue;
      const perRate = PER_RATE_CATEGORIES.has(v.category);
      if (perRate && v.rate === undefined) continue; // `every $rate in ()` holds; BR-48 reports the rate
      const rate = perRate ? D.dec(v.rate) : undefined;
      const inRow = (category: string | undefined, r: number | undefined) =>
        category === v.category && (!rate || (r !== undefined && D.eq(D.dec(r), rate)));
      const lines = m.lines.filter((l) => inRow(written(l.vatCategory, l.locs["vatCategoryCode"]), l.vatRate));
      const charges = docCharges.filter((c) => inRow(written(c.vatCategory, c.locs["vatCategory"]), c.vatRate));
      const allowances = docAllowances.filter((a) => inRow(written(a.vatCategory, a.locs["vatCategory"]), a.vatRate));
      const part = (xs: (number | undefined)[]) => (cii ? D.round2(D.total(xs)) : D.total(xs));
      const computed = D.sub(
        D.add(part(lines.map((l) => l.netAmount)), part(charges.map((c) => c.amount))),
        part(allowances.map((a) => a.amount)),
      );
      const label = `${v.category}${v.rate !== undefined ? ` ${v.rate}%` : ""}`;
      if (v.taxableAmount === undefined) {
        emit(v.category === "S" ? "BR-S-08" : "BR-VAT-08", `The VAT breakdown for ${label} has no taxable amount, so it can't match its lines, allowances and charges (${fd(computed)}).`, v.loc, {
          expected: fd(computed),
        });
        continue;
      }
      const declared = D.dec(v.taxableAmount);
      const margin = cii ? !perRate && v.category !== "O" : perRate;
      const hasUse = lines.length + charges.length + allowances.length > 0;
      // UBL also needs the row's rate to be used (S, L, M), or any invoice line (the others)
      const used = cii || (perRate ? hasUse : m.lines.length > 0);
      if (used && (margin ? D.within(declared, computed, D.ONE_UNIT) : D.eq(declared, computed)))
        continue;
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
    if (peppolOn && m.syntax === "UBL") {
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

    // BR-x-02 (the VAT identifiers each line category needs) are in vatCategoryRules
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
  }

  /* ---------------- Peppol BIS 3.0: national rules for Dutch suppliers ---------------- */
  // OpenPeppol PEPPOL-EN16931-UBL.sch and -CII.sch, "NETHERLANDS" pattern (NL-R-001 … NL-R-009).
  // "Dutch" reads the postal country; the address rules ask for the elements, filled or not.
  if (peppolOn && isNL(m.seller.address?.country)) {
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
        // normalize-space(PaymentMeansCode): a non-breaking space next to the code makes it another code
        const code = normSpace(pm.code);
        if (!NL_PAYMENT_MEANS.has(code))
          emit("NL-R-008", `Payment means code ${code || "(missing)"} is not allowed between Dutch parties.`, at(pm.locs, "code", pm.loc), {
            expected: "30, 48, 49, 57, 58 or 59",
            actual: code || undefined,
          });
      }
    if (!m.locs["orderRef"])
      for (const ln of m.lines.filter((l) => l.locs["orderLineRef"]).slice(0, 25))
        emit("NL-R-009", `Line ${ln.id ?? "?"} references order line ${ln.orderLineRef ?? "(empty)"}, but the invoice has no order reference (BT-13).`, at(ln.locs, "orderLineRef", ln.loc));
  }

  /* ---------------- SI-UBL 2.0 / NLCIUS ---------------- */
  // The Dutch Peppol Authority's si-ubl-2.0-nlcius.sch (2.0.3.13) and NLCIUS-CII-validation.sch (1.0.3.13), as
  // their assertions test them (rules-national.ts): most rules only for suppliers in the Netherlands, BR-NL-13
  // for any SI-UBL supplier, the empty-element check for every document.
  if (opts.nlcius) nlciusRules(m, emit);

  /* ---------------- XRechnung CIUS ---------------- */
  // KoSIT's XRechnung Schematron 2.6.0 (XRechnung 3.0.2), as its assertions test them (rules-national.ts),
  // plus our own Leitweg-ID check (IV-DE-01) on the buyer reference and a 0204 buyer address.
  if (opts.xrechnung) {
    const b = m.buyer;
    xrechnungRules(m, emit);
    if (m.buyerReference && looksLikeLeitwegId(m.buyerReference)) {
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
  }

  return out;
}
