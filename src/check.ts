// Runs the rule engine over a list of files and collects one result per file.
// Pure apart from reading the files: no network, no environment.
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { RULE_INDEX, RULES, ruleSlug, type RuleSource, type Section, type Severity } from "./engine/rules-catalog";
import { validateInvoiceXml, type ValidationProfile, type ValidationReport } from "./engine/validate";
import { MAX_XML_BYTES } from "./engine/xml";
import { SITE_URL, TOOL_NAME, VERSION } from "./version";

export const PROFILES = ["peppol", "auto", "en16931", "xrechnung", "nlcius"] as const satisfies readonly ValidationProfile[];
export type Profile = (typeof PROFILES)[number];
export const FAIL_ON = ["error", "warning", "never"] as const;
export type FailOn = (typeof FAIL_ON)[number];
export const NON_INVOICE = ["skip", "fail"] as const;
export type NonInvoice = (typeof NON_INVOICE)[number];

/** Root elements of the documents this tool checks; any other XML is "not an invoice". */
export const INVOICE_ROOTS = ["Invoice", "CreditNote", "CrossIndustryInvoice"] as const;

/** Rules in the engine, by source; the README and website quote these numbers. */
export function ruleCounts(): { total: number } & Record<RuleSource, number> {
  const counts = { total: RULES.length, EN16931: 0, Peppol: 0, XRechnung: 0, NLCIUS: 0, InvoiceVerify: 0 };
  for (const r of RULES) counts[r.source]++;
  return counts;
}

export interface CheckedFinding {
  ruleId: string;
  severity: Severity;
  source: RuleSource;
  section: Section;
  title: string;
  message: string;
  line?: number;
  col?: number;
  xpath?: string;
  businessTerms?: string[];
  expected?: string;
  actual?: string;
  /** How to fix it, from the rule catalog */
  fix: string;
  /** The rule's page on the website: what it means and how to fix it */
  url: string;
}

export type FileStatus = "ok" | "warnings" | "errors" | "skipped";

export interface FileResult {
  /** Relative path with forward slashes, as matched */
  path: string;
  status: FileStatus;
  /** Why a file was skipped */
  skipped?: string;
  /** e.g. "Peppol BIS Billing 3.0 (UBL 2.1)" */
  format?: string;
  formatId?: string;
  document?: string;
  /** Rule set applied: peppol, en16931, xrechnung, nlcius or none */
  profileApplied?: string;
  invoiceNumber?: string;
  rulesChecked: number;
  counts: { error: number; warning: number; info: number };
  findings: CheckedFinding[];
}

export interface CheckOptions {
  /** Folder the paths are relative to */
  cwd: string;
  profile: Profile;
  failOn: FailOn;
  nonInvoice: NonInvoice;
}

export interface CheckResult {
  tool: typeof TOOL_NAME;
  version: string;
  /** Rules the engine has; each file's rulesChecked is the part that applied to it */
  rulesAvailable: number;
  profile: Profile;
  failOn: FailOn;
  /** "failed" when any file has findings at or above failOn */
  result: "passed" | "failed";
  totals: {
    /** Files that matched the patterns */
    matched: number;
    /** Invoices checked (matched minus skipped) */
    checked: number;
    ok: number;
    withWarnings: number;
    withErrors: number;
    skipped: number;
    errors: number;
    warnings: number;
    info: number;
  };
  files: FileResult[];
}

export function ruleUrl(ruleId: string): string {
  return RULE_INDEX[ruleId] ? `${SITE_URL}/rules/${ruleSlug(ruleId)}` : `${SITE_URL}/rules`;
}

function toFinding(f: ValidationReport["findings"][number]): CheckedFinding {
  // Built in this order so the JSON report reads top to bottom: what, where, how to fix.
  return {
    ruleId: f.ruleId,
    severity: f.severity,
    source: f.source,
    section: f.section,
    title: f.title,
    message: f.message,
    ...(f.line !== undefined ? { line: f.line } : {}),
    // saxes reports column 0 at the end of a line: leave it out
    ...(f.col ? { col: f.col } : {}),
    ...(f.xpath ? { xpath: f.xpath } : {}),
    ...(f.bt?.length ? { businessTerms: f.bt } : {}),
    ...(f.expected !== undefined ? { expected: f.expected } : {}),
    ...(f.actual !== undefined ? { actual: f.actual } : {}),
    fix: RULE_INDEX[f.ruleId]?.fix ?? "",
    url: ruleUrl(f.ruleId),
  };
}

function statusOf(counts: FileResult["counts"]): FileStatus {
  return counts.error > 0 ? "errors" : counts.warning > 0 ? "warnings" : "ok";
}

/** The root element's local name from the "unsupported document" finding, e.g. "project" for a pom.xml. */
function rootLocalName(report: ValidationReport): string | undefined {
  const f = report.findings.find((x) => x.ruleId === "IV-SYN-02");
  return f?.xpath?.replace(/^\//, "").split(":").pop();
}

/** Checks one file. `path` is shown in reports; the file is read from `cwd`. */
export function checkFile(path: string, options: Pick<CheckOptions, "cwd" | "profile" | "nonInvoice">): FileResult {
  const abs = resolve(options.cwd, path);
  const size = statSync(abs).size;
  if (size > MAX_XML_BYTES) {
    const meta = RULE_INDEX["IV-SYN-01"]!;
    return {
      path,
      status: "errors",
      rulesChecked: 1,
      counts: { error: 1, warning: 0, info: 0 },
      findings: [
        {
          ruleId: meta.id,
          severity: "error",
          source: meta.source,
          section: meta.section,
          title: "File too large",
          message: `The file is ${(size / 1024 / 1024).toFixed(1)} MB; the check reads files up to 5 MB, the size Peppol access points commonly accept.`,
          fix: "Check that this is a single invoice. Large embedded attachments (base64 PDFs) are the usual cause; link them instead or compress them.",
          url: ruleUrl(meta.id),
        },
      ],
    };
  }
  const xml = readFileSync(abs, "utf8");
  const report = validateInvoiceXml(xml, options.profile);
  const root = report.format.id === "unknown" && !report.syntaxError ? rootLocalName(report) : undefined;
  if (root !== undefined && options.nonInvoice === "skip" && !(INVOICE_ROOTS as readonly string[]).includes(root)) {
    return {
      path,
      status: "skipped",
      skipped: `Not an invoice: the root element is <${root}>, not Invoice, CreditNote or CrossIndustryInvoice.`,
      rulesChecked: 0,
      counts: { error: 0, warning: 0, info: 0 },
      findings: [],
    };
  }
  return {
    path,
    status: statusOf(report.counts),
    format: report.format.label,
    formatId: report.format.id,
    document: report.format.document,
    profileApplied: report.profileApplied,
    ...(report.invoice?.number ? { invoiceNumber: report.invoice.number } : {}),
    rulesChecked: report.rulesChecked,
    counts: { ...report.counts },
    findings: report.findings.map(toFinding),
  };
}

/** Whether a set of counts reaches the fail-on threshold. */
export function reachesThreshold(counts: { error: number; warning: number }, failOn: FailOn): boolean {
  if (failOn === "never") return false;
  return counts.error > 0 || (failOn === "warning" && counts.warning > 0);
}

/** Checks every file and adds up the totals. */
export function checkFiles(paths: string[], options: CheckOptions): CheckResult {
  const files = paths.map((p) => checkFile(p, options));
  const totals = { matched: files.length, checked: 0, ok: 0, withWarnings: 0, withErrors: 0, skipped: 0, errors: 0, warnings: 0, info: 0 };
  for (const f of files) {
    if (f.status === "skipped") {
      totals.skipped++;
      continue;
    }
    totals.checked++;
    if (f.status === "ok") totals.ok++;
    if (f.status === "warnings") totals.withWarnings++;
    if (f.status === "errors") totals.withErrors++;
    totals.errors += f.counts.error;
    totals.warnings += f.counts.warning;
    totals.info += f.counts.info;
  }
  return {
    tool: TOOL_NAME,
    version: VERSION,
    rulesAvailable: RULES.length,
    profile: options.profile,
    failOn: options.failOn,
    result: reachesThreshold({ error: totals.errors, warning: totals.warnings }, options.failOn) ? "failed" : "passed",
    totals,
    files,
  };
}
