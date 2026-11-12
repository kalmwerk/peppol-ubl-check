// The few pieces of @actions/core the Action needs, written out so the bundle
// has no third-party dependencies. Behaviour follows GitHub's workflow-command
// and environment-file docs:
// https://docs.github.com/actions/reference/workflow-commands-for-github-actions
import { randomUUID } from "node:crypto";
import { appendFileSync } from "node:fs";
import { EOL } from "node:os";

export type Env = Record<string, string | undefined>;

/** The value of an `inputs:` entry: GitHub passes `with:` values as INPUT_<NAME> variables. */
export function getInput(name: string, env: Env = process.env): string {
  return (env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] ?? "").trim();
}

const TRUE = ["true", "True", "TRUE"];
const FALSE = ["false", "False", "FALSE"];

/** YAML 1.2 core-schema booleans only, like @actions/core; anything else is a mistake worth reporting. */
export function getBooleanInput(name: string, fallback: boolean, env: Env = process.env): boolean {
  const raw = getInput(name, env);
  if (!raw) return fallback;
  if (TRUE.includes(raw)) return true;
  if (FALSE.includes(raw)) return false;
  throw new Error(`Input "${name}" must be true or false, not "${raw}".`);
}

/** One of a fixed set of values (case-insensitive). */
export function getChoiceInput<T extends string>(name: string, choices: readonly T[], fallback: T, env: Env = process.env): T {
  const raw = getInput(name, env).toLowerCase();
  if (!raw) return fallback;
  const hit = choices.find((c) => c === raw);
  if (!hit) throw new Error(`Input "${name}" must be one of ${choices.join(", ")}, not "${raw}".`);
  return hit;
}

// ───────────────────────── workflow commands ─────────────────────────

export function escapeData(s: string): string {
  return s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

export function escapeProperty(s: string): string {
  return escapeData(s).replace(/:/g, "%3A").replace(/,/g, "%2C");
}

export type AnnotationProps = { title?: string; file?: string; line?: number; col?: number };

export function formatCommand(command: string, message: string, props: AnnotationProps = {}): string {
  const entries = Object.entries(props).filter(([, v]) => v !== undefined && v !== "");
  const params = entries.length ? ` ${entries.map(([k, v]) => `${k}=${escapeProperty(String(v))}`).join(",")}` : "";
  return `::${command}${params}::${escapeData(message)}`;
}

type Writer = (line: string) => void;
let write: Writer = (line) => process.stdout.write(line + EOL);

/** Tests capture log output through this. */
export function setWriter(w: Writer) {
  write = w;
}

export const log = {
  info: (message: string) => write(message),
  debug: (message: string) => write(formatCommand("debug", message)),
  notice: (message: string, props?: AnnotationProps) => write(formatCommand("notice", message, props)),
  warning: (message: string, props?: AnnotationProps) => write(formatCommand("warning", message, props)),
  error: (message: string, props?: AnnotationProps) => write(formatCommand("error", message, props)),
  group: (title: string) => write(`::group::${escapeData(title)}`),
  endGroup: () => write("::endgroup::"),
};

// ───────────────────────── environment files ─────────────────────────

/**
 * Appends `name<<delimiter` blocks to $GITHUB_OUTPUT, which handles multi-line
 * values. The delimiter is random so a value can never end the block early.
 */
export function formatOutput(name: string, value: string, delimiter = `ghadelimiter_${randomUUID()}`): string {
  if (name.includes(delimiter) || value.includes(delimiter)) throw new Error(`Output "${name}" contains its own delimiter.`);
  return `${name}<<${delimiter}${EOL}${value}${EOL}${delimiter}${EOL}`;
}

export function setOutput(name: string, value: string | number | boolean, env: Env = process.env) {
  const file = env["GITHUB_OUTPUT"];
  if (!file) {
    // Running outside Actions (e.g. locally): nothing to write to.
    log.debug(`output ${name}=${String(value).slice(0, 200)}`);
    return;
  }
  appendFileSync(file, formatOutput(name, String(value)), "utf8");
}

/** Appends Markdown to the job summary page; a no-op outside Actions. Returns whether it was written. */
export function appendSummary(markdown: string, env: Env = process.env): boolean {
  const file = env["GITHUB_STEP_SUMMARY"];
  if (!file) return false;
  appendFileSync(file, markdown.endsWith("\n") ? markdown : markdown + EOL, "utf8");
  return true;
}
