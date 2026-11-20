import { detectFormat, type FormatInfo } from "./detect";
import { round2, sum, type InvoiceModel } from "./model";
import { readCii } from "./read-cii";
import { readUbl } from "./read-ubl";
import { RULES, type Section } from "./rules-catalog";
import { runRules, type Finding } from "./rules";
import type { CenVersion } from "./syntax-binding";
import { kositExactScenario, kositLevel, kositScenario } from "./kosit-levels";
import { facturXSubset } from "./facturx-profile";
import { KOSIT_PEPPOL_RULES } from "./rules-national";
import { parseXml, XmlSyntaxError } from "./xml";

export type ValidationProfile = "auto" | "peppol" | "en16931" | "xrechnung" | "nlcius";

export interface SectionStatus {
  status: "pass" | "warn" | "fail";
  errors: number;
  warnings: number;
}

export interface ComputedTotals {
  lineSum: number;
  allowanceSum: number;
  chargeSum: number;
  taxExclusive: number;
  vatTotal: number;
  taxInclusive: number;
  payable: number;
  vat: { category: string; rate?: number; taxable: number; tax: number }[];
  lines: { id?: string; expectedNet?: number }[];
}

export interface ValidationReport {
  version: 1;
  valid: boolean;
  format: FormatInfo;
  profileApplied: "peppol" | "en16931" | "xrechnung" | "nlcius" | "none";
  invoice: InvoiceModel | null;
  computed: ComputedTotals | null;
  findings: Finding[];
  counts: { error: number; warning: number; info: number };
  sections: Record<Section, SectionStatus>;
  rulesChecked: number;
  sourceLines: number;
  durationMs: number;
  syntaxError?: { message: string; line: number; col: number };
}

const SECTIONS: Section[] = ["document", "header", "parties", "lines", "vat", "totals", "payment"];

function summarize(findings: Finding[]) {
  const counts = { error: 0, warning: 0, info: 0 };
  const sections = Object.fromEntries(
    SECTIONS.map((s) => [s, { status: "pass", errors: 0, warnings: 0 } as SectionStatus]),
  ) as Record<Section, SectionStatus>;
  for (const f of findings) {
    counts[f.severity]++;
    const s = sections[f.section];
    if (f.severity === "error") {
      s.errors++;
      s.status = "fail";
    } else if (f.severity === "warning") {
      s.warnings++;
      if (s.status === "pass") s.status = "warn";
    }
  }
  return { counts, sections };
}

function computeTotals(m: InvoiceModel): ComputedTotals {
  const lineSum = sum(m.lines.map((l) => l.netAmount));
  const allowanceSum = sum(m.allowances.map((a) => a.amount));
  const chargeSum = sum(m.charges.map((c) => c.amount));
  const taxExclusive = round2(lineSum - allowanceSum + chargeSum);
  const groups = new Map<string, { category: string; rate?: number; taxable: number }>();
  const add = (category: string | undefined, rate: number | undefined, amount: number) => {
    if (!category) return;
    const key = `${category}|${rate ?? ""}`;
    const g = groups.get(key) ?? { category, rate, taxable: 0 };
    g.taxable = round2(g.taxable + amount);
    groups.set(key, g);
  };
  m.lines.forEach((l) => add(l.vatCategory, l.vatRate, l.netAmount ?? 0));
  m.allowances.forEach((a) => add(a.vatCategory, a.vatRate, -(a.amount ?? 0)));
  m.charges.forEach((c) => add(c.vatCategory, c.vatRate, c.amount ?? 0));
  const vat = [...groups.values()].map((g) => ({
    ...g,
    tax: g.category === "O" || g.rate === undefined ? 0 : round2((g.taxable * g.rate) / 100),
  }));
  const vatTotal = sum(vat.map((v) => v.tax));
  const taxInclusive = round2(taxExclusive + vatTotal);
  const payable = round2(taxInclusive - (m.totals.prepaid ?? 0) + (m.totals.rounding ?? 0));
  const lines = m.lines.map((l) => {
    if (l.quantity === undefined || l.priceAmount === undefined) return { id: l.id };
    const base = l.baseQuantity && l.baseQuantity > 0 ? l.baseQuantity : 1;
    const expectedNet = round2(
      (l.quantity * l.priceAmount) / base +
        sum(l.charges.map((c) => c.amount)) -
        sum(l.allowances.map((a) => a.amount)),
    );
    return { id: l.id, expectedNet };
  });
  return {
    lineSum,
    allowanceSum,
    chargeSum,
    taxExclusive,
    vatTotal,
    taxInclusive,
    payable,
    vat,
    lines,
  };
}

function rulesApplicable(peppol: boolean, en16931: boolean, xrechnung: boolean, nlcius: boolean, syntax: "UBL" | "CII", cen: CenVersion, subset?: ReadonlySet<string>) {
  return RULES.filter((r) => {
    if (r.syntax && r.syntax !== syntax) return false;
    if (subset && r.source !== "InvoiceVerify" && !subset.has(r.id)) return false;
    // XRechnung also runs the Peppol rules KoSIT's Schematron copies
    if (r.source === "Peppol") return peppol || (xrechnung && KOSIT_PEPPOL_RULES.has(r.id));
    if (r.source === "NLCIUS") return nlcius;
    // IV-DE-* (Leitweg-ID) are our own checks but only run with the XRechnung rules
    if (r.source === "XRechnung" || r.id.startsWith("IV-DE-")) return xrechnung;
    if (!en16931 && (r.section === "lines" || r.section === "vat")) return false;
    // the fatal syntax-binding rules run with the EN 16931 rule set only (UBL-DT-01/06/07 always did), in the CEN
    // version of the profile's official files: 1.3.16 for Peppol BIS 3.0.22, 1.3.17 otherwise
    if (!en16931 && /^(UBL-SR|UBL-CR|CII-SR|CII-DT)-/.test(r.id)) return false;
    if (r.cen && r.cen !== cen) return false;
    return true;
  }).length;
}

/** CII formats with a rule set of their own, which the "peppol" profile leaves to it. */
const CII_WITH_OWN_RULES: ReadonlySet<string> = new Set(["factur-x", "xrechnung-cii", "nlcius-cii"]);

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** Options the site's own rule sets use; the profiles themselves never need them. */
export interface ValidateOptions {
  /**
   * The CEN version to run instead of the profile's own (1.3.16 for Peppol BIS 3.0.22, 1.3.17 otherwise): the Peppol
   * BIS 3.1.0 overlay runs today's Peppol rules on CEN 1.3.17, the version 3.1.0 ships.
   */
  cen?: CenVersion;
}

export function validateInvoiceXml(
  xml: string,
  profile: ValidationProfile = "auto",
  options: ValidateOptions = {},
): ValidationReport {
  const started = now();
  const sourceLines = xml.split(/\r\n|\r|\n/).length;
  const finish = (
    r: Omit<ValidationReport, "durationMs" | "sourceLines" | "version">,
  ): ValidationReport => ({
    version: 1,
    ...r,
    sourceLines,
    durationMs: Math.max(1, Math.round(now() - started)),
  });

  let root;
  try {
    root = parseXml(xml);
  } catch (e) {
    const err = e instanceof XmlSyntaxError ? e : new XmlSyntaxError(String(e), 1, 1);
    const finding: Finding = {
      ruleId: "IV-SYN-01",
      source: "InvoiceVerify",
      severity: "error",
      section: "document",
      title: "XML is not well-formed",
      message: err.message,
      line: err.line,
      col: err.col,
    };
    const { counts, sections } = summarize([finding]);
    return finish({
      valid: false,
      format: {
        id: "unknown",
        label: "Unreadable XML",
        syntax: "unknown",
        document: "Unknown",
        en16931: false,
        peppol: false,
      },
      profileApplied: "none",
      invoice: null,
      computed: null,
      findings: [finding],
      counts,
      sections,
      rulesChecked: 1,
      syntaxError: { message: err.message, line: err.line, col: err.col },
    });
  }

  const format = detectFormat(root);
  if (format.id === "unknown") {
    const finding: Finding = {
      ruleId: "IV-SYN-02",
      source: "InvoiceVerify",
      severity: "error",
      section: "document",
      title: "Unsupported document type",
      message: `Root element <${root.name}>${root.ns ? ` in namespace ${root.ns}` : " without a namespace"} is not a UBL Invoice/CreditNote or a CII CrossIndustryInvoice.`,
      line: root.line,
      col: root.col,
      xpath: `/${root.name}`,
    };
    const { counts, sections } = summarize([finding]);
    return finish({
      valid: false,
      format,
      profileApplied: "none",
      invoice: null,
      computed: null,
      findings: [finding],
      counts,
      sections,
      rulesChecked: 2,
    });
  }

  const model = format.syntax === "UBL" ? readUbl(root) : readCii(root);
  // "peppol" applies Peppol BIS 3.0 to every UBL file and to CII files other than Factur-X /
  // ZUGFeRD, XRechnung and NLCIUS (those CII documents follow their own rules), so a wrong
  // CustomizationID is reported instead of quietly checking less; "auto" only to files that declare it.
  const peppol =
    profile === "peppol"
      ? format.syntax === "UBL" || !CII_WITH_OWN_RULES.has(format.id)
      : profile === "en16931" || profile === "xrechnung" || profile === "nlcius"
        ? false
        : format.peppol;
  const xrechnung =
    profile === "xrechnung" ||
    (profile === "auto" && (format.id === "xrechnung-ubl" || format.id === "xrechnung-cii"));
  const nlcius =
    profile === "nlcius" || (profile === "auto" && (format.id === "si-ubl-2" || format.id === "nlcius-cii"));
  // Factur-X MINIMUM / BASIC WL (not EN 16931 compliant) with their own rule set: the EN 16931 rules FeRD's official
  // Schematron runs for the profile, header and VAT breakdown included. Choosing EN 16931, XRechnung or SI-UBL / NLCIUS
  // runs every EN 16931 rule on any invoice, lines and VAT included, as those official files do on a MINIMUM file too
  const explicitEn16931 = profile === "en16931" || profile === "xrechnung" || profile === "nlcius";
  const subset = format.id === "factur-x" && !explicitEn16931 ? facturXSubset(format.customizationId) : undefined;
  const en16931 = format.en16931 || !!subset || explicitEn16931;
  // The CEN version each rule set's official files run: Peppol BIS 3.0.22, KoSIT's XRechnung configuration and the
  // Dutch SI-UBL 2.0 / NLCIUS files all build on CEN 1.3.16; plain EN 16931 is CEN's current release, 1.3.17
  const cen: CenVersion = options.cen ?? (peppol || xrechnung || nlcius ? "1.3.16" : "1.3.17");
  const ruled = runRules(model, format, { peppol, en16931, xrechnung, nlcius, cen, ...(subset ? { subset } : {}) });
  // XRechnung: the levels KoSIT's validator configuration sets per scenario (kosit-levels.ts); with no scenario
  // matching exactly (IV-DE-02, rules.ts) the plain CIUS levels of the syntax
  const exact = xrechnung ? kositExactScenario(model.syntax, format.document, model.xrechnung?.specIds?.values ?? []) : null;
  const scenario = xrechnung ? (exact ?? kositScenario(format)) : null;
  const findings = scenario
    ? ruled.map((f) => {
        const level = kositLevel(f.ruleId, scenario);
        return level && level !== f.severity ? { ...f, severity: level } : f;
      })
    : ruled;
  const order = { error: 0, warning: 1, info: 2 } as const;
  findings.sort((a, b) => order[a.severity] - order[b.severity] || (a.line ?? 0) - (b.line ?? 0));
  const { counts, sections } = summarize(findings);
  return finish({
    valid: counts.error === 0,
    format,
    profileApplied: peppol ? "peppol" : xrechnung ? "xrechnung" : nlcius ? "nlcius" : "en16931",
    invoice: model,
    computed: computeTotals(model),
    findings,
    counts,
    sections,
    rulesChecked: rulesApplicable(peppol, en16931, xrechnung, nlcius, model.syntax, cen, subset),
  });
}
