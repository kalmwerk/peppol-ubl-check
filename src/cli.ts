// The command-line tool: `peppol-ubl-check [options] <file | folder | glob>...`
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { checkFiles, FAIL_ON, NON_INVOICE, PROFILES, type FailOn, type NonInvoice, type Profile } from "./check";
import { findFiles } from "./glob";
import { coverageNote, textReport } from "./report";
import { TOOL_NAME, TOOL_PAGE_URL, VALIDATOR_URL, VERSION } from "./version";

export interface CliIO {
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  /** Colours in the text report (the entry point decides from the terminal and NO_COLOR) */
  color: boolean;
}

export const EXIT = { passed: 0, failed: 1, usage: 2 } as const;

export function helpText(): string {
  return `${TOOL_NAME} ${VERSION}: check UBL / Peppol BIS Billing 3.0 e-invoices offline.

Usage:
  ${TOOL_NAME} [options] [file | folder | glob ...]

  With no files, every *.xml under the current folder is checked (hidden
  folders and node_modules are skipped). Quote globs so your shell leaves them
  alone: ${TOOL_NAME} "invoices/**/*.xml"

Options:
  -p, --profile <name>     peppol (default): Peppol BIS Billing 3.0 rules on every UBL file
                           auto: choose per file from its CustomizationID
                           en16931: EN 16931 rules only; xrechnung: EN 16931 + XRechnung
                           nlcius: EN 16931 + Dutch SI-UBL 2.0 (NLCIUS)
      --fail-on <level>    error (default), warning or never: when to exit with code 1
      --non-invoice <how>  skip (default) or fail: XML files whose root element isn't
                           Invoice, CreditNote or CrossIndustryInvoice
      --ignore <glob>      leave matching files out (repeatable)
      --json               print the full report as JSON instead of text
      --json-file <path>   also write the JSON report to a file
  -q, --quiet              one line per file, no findings
      --no-color           plain text
  -h, --help               this help
  -v, --version            the version

Exit codes: 0 no findings at or above --fail-on, 1 there are, 2 usage error or no invoices found.

${coverageNote()}
Visual report for one file: ${VALIDATOR_URL}
More: ${TOOL_PAGE_URL}
`;
}

class UsageError extends Error {}

interface Parsed {
  patterns: string[];
  profile: Profile;
  failOn: FailOn;
  nonInvoice: NonInvoice;
  ignore: string[];
  json: boolean;
  jsonFile: string;
  quiet: boolean;
  color: boolean;
  help: boolean;
  version: boolean;
}

function choice<T extends string>(flag: string, value: string | undefined, choices: readonly T[]): T {
  const v = (value ?? "").toLowerCase();
  const hit = choices.find((c) => c === v);
  if (!hit) throw new UsageError(`${flag} must be one of ${choices.join(", ")}${value ? `, not "${value}"` : ""}.`);
  return hit;
}

export function parseArgs(argv: string[], color: boolean): Parsed {
  const p: Parsed = {
    patterns: [],
    profile: "peppol",
    failOn: "error",
    nonInvoice: "skip",
    ignore: [],
    json: false,
    jsonFile: "",
    quiet: false,
    color,
    help: false,
    version: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i]!;
    if (raw === "--") {
      p.patterns.push(...argv.slice(i + 1));
      break;
    }
    const eq = raw.startsWith("--") ? raw.indexOf("=") : -1;
    const flag = eq > 0 ? raw.slice(0, eq) : raw;
    const inline = eq > 0 ? raw.slice(eq + 1) : undefined;
    const value = () => {
      if (inline !== undefined) return inline;
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("-")) throw new UsageError(`${flag} needs a value.`);
      i++;
      return next;
    };
    switch (flag) {
      case "-p":
      case "--profile":
        p.profile = choice(flag, value(), PROFILES);
        break;
      case "--fail-on":
        p.failOn = choice(flag, value(), FAIL_ON);
        break;
      case "--non-invoice":
        p.nonInvoice = choice(flag, value(), NON_INVOICE);
        break;
      case "--ignore":
        p.ignore.push(value());
        break;
      case "--json":
        p.json = true;
        break;
      case "--json-file":
        p.jsonFile = value();
        break;
      case "-q":
      case "--quiet":
        p.quiet = true;
        break;
      case "--no-color":
        p.color = false;
        break;
      case "-h":
      case "--help":
        p.help = true;
        break;
      case "-v":
      case "--version":
        p.version = true;
        break;
      default:
        if (raw.startsWith("-") && raw !== "-") throw new UsageError(`Unknown option ${flag}. Run ${TOOL_NAME} --help.`);
        p.patterns.push(raw);
    }
  }
  return p;
}

/** Runs the CLI; returns the exit code. */
export function runCli(argv: string[], io: CliIO): number {
  let args: Parsed;
  try {
    args = parseArgs(argv, io.color);
  } catch (e) {
    io.stderr(`${TOOL_NAME}: ${e instanceof Error ? e.message : String(e)}\n`);
    return EXIT.usage;
  }
  if (args.help) {
    io.stdout(helpText());
    return EXIT.passed;
  }
  if (args.version) {
    io.stdout(`${VERSION}\n`);
    return EXIT.passed;
  }
  try {
    const patterns = args.patterns.length ? args.patterns : ["**/*.xml"];
    const paths = findFiles(patterns, { cwd: io.cwd, ignore: args.ignore });
    const result = checkFiles(paths, { cwd: io.cwd, profile: args.profile, failOn: args.failOn, nonInvoice: args.nonInvoice });
    if (args.jsonFile) {
      const out = resolve(io.cwd, args.jsonFile);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    }
    if (args.json) io.stdout(`${JSON.stringify(result, null, 2)}\n`);
    else io.stdout(`${textReport(result, { color: args.color, quiet: args.quiet })}\n`);
    if (result.totals.checked === 0) {
      io.stderr(
        `${TOOL_NAME}: no invoices found (${paths.length ? `${paths.length} matching files, none of them an invoice` : `nothing matches ${patterns.join(" ")}`}).\n`,
      );
      return EXIT.usage;
    }
    return result.result === "failed" ? EXIT.failed : EXIT.passed;
  } catch (e) {
    io.stderr(`${TOOL_NAME}: ${e instanceof Error ? e.message : String(e)}\n`);
    return EXIT.usage;
  }
}
