// The GitHub Action: reads the `with:` inputs, checks the matching files and
// reports through the job summary, annotations, outputs and the exit code.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { checkFiles, FAIL_ON, NON_INVOICE, PROFILES } from "./check";
import { findFiles, splitPatterns } from "./glob";
import { annotations, headline, summaryMarkdown, textReport } from "./report";
import { appendSummary, getBooleanInput, getChoiceInput, getInput, log, setOutput, type Env } from "./toolkit";
import { VERSION } from "./version";

export const DEFAULT_FILES = "**/*.xml";
export const IF_NO_FILES = ["error", "warn", "ignore"] as const;

/** Runs the Action; returns the process exit code (1 when the job should fail). */
export function runAction(env: Env = process.env): number {
  try {
    const cwd = env["GITHUB_WORKSPACE"]?.trim() || process.cwd();
    const listed = splitPatterns(getInput("files", env));
    const patterns = listed.length ? listed : [DEFAULT_FILES];
    const ignore = splitPatterns(getInput("ignore", env));
    const profile = getChoiceInput("profile", PROFILES, "peppol", env);
    const failOn = getChoiceInput("fail-on", FAIL_ON, "error", env);
    const nonInvoice = getChoiceInput("non-invoice", NON_INVOICE, "skip", env);
    const ifNone = getChoiceInput("if-no-files-found", IF_NO_FILES, "error", env);
    const jsonFile = getInput("json-file", env);
    const summary = getBooleanInput("summary", true, env);
    const annotate = getBooleanInput("annotations", true, env);

    const paths = findFiles(patterns, { cwd, ignore });
    const result = checkFiles(paths, { cwd, profile, failOn, nonInvoice });

    log.group(`Peppol UBL check ${VERSION}: ${paths.length} matching ${paths.length === 1 ? "file" : "files"} (${patterns.join(", ")})`);
    for (const line of textReport(result).split("\n")) log.info(line);
    log.endGroup();

    if (annotate) {
      for (const a of annotations(result)) {
        const props = { title: a.title, file: a.file, ...(a.line !== undefined ? { line: a.line } : {}), ...(a.col !== undefined ? { col: a.col } : {}) };
        log[a.level](a.message, props);
      }
    }

    let exit = 0;
    if (result.totals.checked === 0) {
      const why = paths.length
        ? `${paths.length} matching ${paths.length === 1 ? "file isn't an invoice" : "files, none of them an invoice"}`
        : `nothing matches ${patterns.map((p) => `"${p}"`).join(", ")}`;
      const message = `No invoices found: ${why}. Set "files" to where your invoices are, e.g. "invoices/**/*.xml".`;
      if (ifNone === "error") {
        log.error(message);
        exit = 1;
      } else if (ifNone === "warn") log.warning(message);
      else log.info(message);
    }

    if (summary) appendSummary(summaryMarkdown(result), env);

    let jsonPath = "";
    if (jsonFile) {
      jsonPath = resolve(cwd, jsonFile);
      mkdirSync(dirname(jsonPath), { recursive: true });
      writeFileSync(jsonPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    }

    const t = result.totals;
    setOutput("result", result.result, env);
    setOutput("checked", t.checked, env);
    setOutput("failed", t.withErrors + (failOn === "warning" ? t.withWarnings : 0), env);
    setOutput("errors", t.errors, env);
    setOutput("warnings", t.warnings, env);
    setOutput("skipped", t.skipped, env);
    setOutput("json-file", jsonPath, env);

    if (result.result === "failed") {
      log.error(`${headline(result)}. The job summary lists each problem with how to fix it.`);
      exit = 1;
    } else if (t.checked > 0) {
      log.info(`${headline(result)}.`);
    }
    return exit;
  } catch (e) {
    log.error(e instanceof Error ? e.message : String(e));
    return 1;
  }
}
