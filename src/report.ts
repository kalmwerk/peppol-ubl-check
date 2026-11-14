// Turns a CheckResult into the job summary (Markdown), the console report and
// the annotations shown on pull requests. Pure: no file system, no network.
import type { CheckedFinding, CheckResult, FileResult } from "./check";
import { ruleCounts } from "./check";
import { TOOL_NAME, TOOL_PAGE_URL, VALIDATOR_URL, VERSION } from "./version";

const ICON: Record<CheckedFinding["severity"], string> = { error: "❌", warning: "⚠️", info: "ℹ️" };
const STATUS: Record<FileResult["status"], string> = {
  ok: "✅ OK",
  warnings: "⚠️ Warnings",
  errors: "❌ Errors",
  skipped: "⏭️ Skipped",
};

/** Text for a Markdown table cell: no line breaks, pipes or raw HTML. */
export function cell(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

/** A path in backticks, safe inside a table cell. */
function code(path: string): string {
  const clean = path.replace(/\|/g, "\\|").replace(/`/g, "'");
  return `\`${clean}\``;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The one-line verdict used as the summary heading and the CLI's last line. */
export function headline(r: CheckResult): string {
  const t = r.totals;
  if (t.checked === 0) return "No invoices checked";
  const bad = t.withErrors;
  if (bad > 0) return `${bad} of ${plural(t.checked, "invoice")} ${bad === 1 ? "has" : "have"} errors`;
  if (t.withWarnings > 0) return `${plural(t.checked, "invoice")} checked, ${t.withWarnings} with warnings`;
  return t.checked === 1 ? "1 invoice checked, no errors" : `${t.checked} invoices checked, no errors`;
}

/** Rules, coverage and privacy in one paragraph, for the summary footer and the CLI help. */
export function coverageNote(): string {
  const c = ruleCounts();
  return (
    `Checked offline with InvoiceVerify's ${c.total} rules (${c.EN16931} EN 16931, ${c.Peppol} Peppol BIS Billing 3.0, ` +
    `${c.XRechnung} XRechnung, ${c.NLCIUS} SI-UBL 2.0, ${c.InvoiceVerify} extra checks for tax IDs, IBANs and syntax): a partial version of the official ` +
    "Schematron rule sets, without XSD schema validation or PDF/A checks. Nothing was sent anywhere."
  );
}

export interface SummaryOptions {
  /** Most findings listed per file (the JSON report always has all of them) */
  maxFindingsPerFile?: number;
  /** Most files in the overview table */
  maxFiles?: number;
  /** Stop adding file sections past this many characters (GitHub allows 1 MiB per step) */
  maxChars?: number;
}

function findingRow(f: CheckedFinding): string {
  const rule = `[${cell(f.ruleId)}](${f.url})`;
  const where = f.line !== undefined ? String(f.line) : "–";
  const what = `**${cell(f.title)}.** ${cell(f.message)}`;
  return `| ${ICON[f.severity]} | ${rule} | ${where} | ${what} | ${cell(f.fix) || "See the rule page."} |`;
}

function fileSection(f: FileResult, max: number): string {
  const head = `### ${STATUS[f.status].split(" ")[0]} ${code(f.path)}`;
  const facts = [
    f.invoiceNumber ? `${f.document === "Credit note" ? "Credit note" : "Invoice"} **${cell(f.invoiceNumber)}**` : undefined,
    f.format ? cell(f.format) : undefined,
    f.rulesChecked ? `${f.rulesChecked} rules checked` : undefined,
  ].filter(Boolean);
  const rows = f.findings.slice(0, max).map(findingRow);
  const more = f.findings.length > max ? `\n\n…and ${f.findings.length - max} more in the JSON report (\`json-file\`).` : "";
  return [
    head,
    "",
    facts.join(" · "),
    "",
    "| | Rule | Line | What's wrong | How to fix |",
    "| --- | --- | ---: | --- | --- |",
    ...rows,
  ].join("\n") + more;
}

/** The job summary: verdict, one row per file, then each file's findings with how to fix them. */
export function summaryMarkdown(r: CheckResult, options: SummaryOptions = {}): string {
  const maxFindings = options.maxFindingsPerFile ?? 50;
  const maxFiles = options.maxFiles ?? 200;
  const maxChars = options.maxChars ?? 900_000;
  const failed = r.result === "failed";
  const icon = r.totals.checked === 0 ? "⚠️" : failed ? "❌" : r.totals.withErrors || r.totals.withWarnings ? "⚠️" : "✅";
  const out: string[] = [`## ${icon} Peppol UBL check: ${headline(r)}`, ""];

  const checked = r.files.filter((f) => f.status !== "skipped");
  const skipped = r.files.filter((f) => f.status === "skipped");
  if (checked.length) {
    out.push("| Invoice file | Format | Errors | Warnings | Result |", "| --- | --- | ---: | ---: | --- |");
    for (const f of checked.slice(0, maxFiles))
      out.push(`| ${code(f.path)} | ${cell(f.format ?? "–")} | ${f.counts.error} | ${f.counts.warning} | ${STATUS[f.status]} |`);
    if (checked.length > maxFiles) out.push("", `…and ${checked.length - maxFiles} more files in the JSON report (\`json-file\`).`);
    out.push("");
  }

  let size = out.join("\n").length;
  let cut = 0;
  for (const f of checked.filter((x) => x.findings.length > 0)) {
    const section = fileSection(f, maxFindings);
    if (size + section.length > maxChars) {
      cut++;
      continue;
    }
    out.push(section, "");
    size += section.length + 1;
  }
  if (cut) out.push(`Findings for ${plural(cut, "more file")} left out to stay within GitHub's summary size; the JSON report (\`json-file\`) has them all.`, "");

  if (skipped.length) {
    out.push(
      `<details><summary>${plural(skipped.length, "file")} skipped: not an invoice</summary>`,
      "",
      ...skipped.slice(0, maxFiles).map((f) => `- ${code(f.path)}: ${cell(f.skipped ?? "skipped")}`),
      "",
      "</details>",
      "",
    );
  }

  out.push(
    "---",
    "",
    coverageNote(),
    "",
    `For a visual report of one invoice (header, parties, lines, VAT breakdown, with the lines highlighted), drop the file into the [InvoiceVerify validator](${VALIDATOR_URL}). Each rule ID above links to its explanation.`,
    "",
    `<sub>[${TOOL_NAME}](${TOOL_PAGE_URL}) ${VERSION} · MIT · by Kalmwerk</sub>`,
    "",
  );
  return out.join("\n");
}

export interface Annotation {
  level: "error" | "warning" | "notice";
  message: string;
  title: string;
  file: string;
  line?: number;
  col?: number;
}

/** One annotation per finding (errors first), at most `max`: GitHub shows them on the changed lines of a pull request. */
export function annotations(r: CheckResult, max = 50): Annotation[] {
  const all: Annotation[] = [];
  for (const f of r.files) {
    for (const x of f.findings) {
      const a: Annotation = {
        level: x.severity === "info" ? "notice" : x.severity,
        title: `${x.ruleId}: ${x.title}`,
        message: x.fix ? `${x.message}\nHow to fix: ${x.fix}` : x.message,
        file: f.path,
      };
      if (x.line !== undefined) a.line = x.line;
      if (x.col !== undefined) a.col = x.col;
      all.push(a);
    }
  }
  const order = { error: 0, warning: 1, notice: 2 } as const;
  return all.sort((a, b) => order[a.level] - order[b.level]).slice(0, max);
}

// ───────────────────────── console ─────────────────────────

export interface TextOptions {
  color?: boolean;
  /** Totals only, no findings */
  quiet?: boolean;
}

const ANSI = { red: "\x1b[31m", yellow: "\x1b[33m", green: "\x1b[32m", dim: "\x1b[2m", bold: "\x1b[1m", reset: "\x1b[0m" };

/** The report as plain text, for the terminal and the Action log. */
export function textReport(r: CheckResult, options: TextOptions = {}): string {
  const c = (code: keyof typeof ANSI, s: string) => (options.color ? `${ANSI[code]}${s}${ANSI.reset}` : s);
  const lines: string[] = [];
  const mark = { ok: c("green", "PASS"), warnings: c("yellow", "WARN"), errors: c("red", "FAIL"), skipped: c("dim", "SKIP") };
  for (const f of r.files) {
    const detail =
      f.status === "skipped"
        ? c("dim", f.skipped ?? "")
        : c("dim", [f.format, plural(f.counts.error, "error"), plural(f.counts.warning, "warning")].filter(Boolean).join(" · "));
    lines.push(`${mark[f.status]} ${f.path}  ${detail}`);
    if (options.quiet) continue;
    for (const x of f.findings) {
      const sev = x.severity === "error" ? c("red", "error  ") : x.severity === "warning" ? c("yellow", "warning") : c("dim", "info   ");
      const at = x.line !== undefined ? `${f.path}:${x.line}${x.col !== undefined ? `:${x.col}` : ""}` : f.path;
      lines.push(`  ${sev} ${c("bold", x.ruleId)} ${x.title}  ${c("dim", at)}`);
      lines.push(`          ${x.message}`);
      if (x.fix) lines.push(`          ${c("dim", `Fix: ${x.fix}`)}`);
      lines.push(`          ${c("dim", x.url)}`);
    }
  }
  if (r.files.length) lines.push("");
  const t = r.totals;
  const verdict = r.result === "failed" ? c("red", headline(r)) : t.withWarnings ? c("yellow", headline(r)) : c("green", headline(r));
  lines.push(
    `${verdict} (${plural(t.errors, "error")}, ${plural(t.warnings, "warning")}${t.skipped ? `, ${t.skipped} skipped` : ""}).`,
  );
  return lines.join("\n");
}
