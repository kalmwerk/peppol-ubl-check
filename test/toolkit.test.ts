import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { appendSummary, formatCommand, formatOutput, getBooleanInput, getChoiceInput, getInput, setOutput } from "../src/toolkit";

describe("inputs", () => {
  const env = { INPUT_FILES: "  a/*.xml ", "INPUT_FAIL-ON": "Warning", INPUT_SUMMARY: "false", INPUT_ANNOTATIONS: "nope" };

  it("reads INPUT_<NAME> variables, trimmed", () => {
    expect(getInput("files", env)).toBe("a/*.xml");
    expect(getInput("ignore", env)).toBe("");
  });

  it("accepts a fixed set of choices, case-insensitively", () => {
    expect(getChoiceInput("fail-on", ["error", "warning", "never"] as const, "error", env)).toBe("warning");
    expect(getChoiceInput("profile", ["peppol", "auto"] as const, "peppol", env)).toBe("peppol");
    expect(() => getChoiceInput("fail-on", ["error", "never"] as const, "error", env)).toThrow(/must be one of error, never/);
  });

  it("accepts only YAML booleans", () => {
    expect(getBooleanInput("summary", true, env)).toBe(false);
    expect(getBooleanInput("missing", true, env)).toBe(true);
    expect(() => getBooleanInput("annotations", true, env)).toThrow(/true or false/);
  });
});

describe("workflow commands and files", () => {
  it("escapes annotation properties and messages", () => {
    expect(formatCommand("error", "50%\nnext", { title: "BR-CO-17: a, b", file: "x.xml", line: 9 })).toBe(
      "::error title=BR-CO-17%3A a%2C b,file=x.xml,line=9::50%25%0Anext",
    );
  });

  it("writes multi-line outputs with a delimiter, and the summary", () => {
    expect(formatOutput("json-file", "a\nb", "D")).toBe("json-file<<D\na\nb\nD\n");
    const dir = mkdtempSync(join(tmpdir(), "toolkit-"));
    const env = { GITHUB_OUTPUT: join(dir, "out"), GITHUB_STEP_SUMMARY: join(dir, "summary") };
    setOutput("result", "passed", env);
    expect(readFileSync(env.GITHUB_OUTPUT, "utf8")).toMatch(/^result<<ghadelimiter_[\w-]+\npassed\n/);
    expect(appendSummary("## Hi", env)).toBe(true);
    expect(readFileSync(env.GITHUB_STEP_SUMMARY, "utf8")).toBe("## Hi\n");
    expect(appendSummary("x", {})).toBe(false);
  });
});
