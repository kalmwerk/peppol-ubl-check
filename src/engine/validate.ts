import { detectFormat, type FormatInfo } from "./detect";
import { round2, sum, type InvoiceModel } from "./model";
import { readCii } from "./read-cii";
import { readUbl } from "./read-ubl";
import { RULES, type Section } from "./rules-catalog";
import { runRules, type Finding } from "./rules";
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

function rulesApplicable(peppol: boolean, en16931: boolean, xrechnung: boolean, nlcius: boolean) {
  return RULES.filter((r) => {
    if (r.source === "Peppol") return peppol;
    if (r.source === "NLCIUS") return nlcius;
    // IV-DE-* (Leitweg-ID) are our own checks but only run with the XRechnung rules
    if (r.source === "XRechnung" || r.id.startsWith("IV-DE-")) return xrechnung;
    if (!en16931 && (r.section === "lines" || r.section === "vat")) return false;
    return true;
  }).length;
}

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export function validateInvoiceXml(
  xml: string,
  profile: ValidationProfile = "auto",
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
  const peppol =
    profile === "peppol"
      ? format.syntax === "UBL"
      : profile === "en16931" || profile === "xrechnung" || profile === "nlcius"
        ? false
        : format.peppol;
  const xrechnung =
    profile === "xrechnung" ||
    (profile === "auto" && (format.id === "xrechnung-ubl" || format.id === "xrechnung-cii"));
  const nlcius =
    profile === "nlcius" || (profile === "auto" && (format.id === "si-ubl-2" || format.id === "nlcius-cii"));
  const en16931 = format.en16931;
  const findings = runRules(model, format, { peppol, en16931, xrechnung, nlcius });
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
    rulesChecked: rulesApplicable(peppol, en16931, xrechnung, nlcius),
  });
}
