// The dated conformance statement in README.md and conformance.json must belong to this engine:
// after a rule change, rerun `npm run compare-official` (it downloads the official tests).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type Conformance,
  fingerprint,
  readConformance,
  summaryMarkdown,
  withReadmeBlocks,
} from "../scripts/conformance.mjs";

const root = resolve(__dirname, "..");
const committed = readConformance(root);
const readme = readFileSync(resolve(root, "README.md"), "utf8");

describe("conformance.json", () => {
  it("belongs to the current engine and comparison script", () => {
    expect(committed.fingerprint, "rerun npm run compare-official and commit the result").toBe(fingerprint(root));
  });
  it("is what the README states", () => {
    expect(withReadmeBlocks(readme, committed)).toBe(readme);
  });
});

describe("the statement", () => {
  const withDifferences: Conformance = {
    ...committed,
    differences: ["CEN UBL invoice BR-CO-10.xml #0  BR-CO-10: official error, engine success"],
  };
  it("claims the same verdict only when nothing differs", () => {
    expect(summaryMarkdown({ ...committed, differences: [] })).toContain("same verdict as the official");
    const text = summaryMarkdown(withDifferences);
    expect(text).not.toContain("same verdict");
    expect(text).toContain(`${committed.compared - 1} of the ${committed.compared} verdicts`);
    expect(text).toContain("1 differ");
  });
  it("always names what isn't covered", () => {
    const n = committed.uncovered.en16931.length + committed.uncovered.peppol.length + committed.uncovered.national.length;
    expect(summaryMarkdown(committed)).toContain(`Not covered: ${n} rules`);
  });
});
