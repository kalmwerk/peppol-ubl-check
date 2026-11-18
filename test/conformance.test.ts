// The dated conformance statement in README.md and conformance.json must belong to this engine:
// after a rule change, rerun `npm run compare-official` (it downloads the official tests).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type Conformance,
  fingerprint,
  num,
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
    expect(text).toContain(`${num(committed.compared - 1)} of the ${num(committed.compared)} verdicts`);
    expect(text).toContain("1 differ");
  });
  it("always names what isn't covered", () => {
    const national = ["DK-R-002", "PEPPOL-COMMON-R041"];
    const complete: Conformance = { ...committed, uncovered: { en16931: [], peppol: [], national } };
    expect(summaryMarkdown(complete)).toContain("The 2 rules those tests exercise that aren't checked are all national (Denmark and Peppol's identifier formats)");
    const partial: Conformance = { ...committed, uncovered: { en16931: ["BR-CO-21"], peppol: [], national } };
    const text = summaryMarkdown(partial);
    expect(text).not.toContain("are all national");
    expect(text).toContain("Not covered: 3 rules those tests exercise (1 EN 16931, 0 Peppol, 2 national)");
  });
  it("claims every business and Peppol core rule only when the full count found no gap", () => {
    const { business, peppol } = committed.ruleSets;
    const full = business.notChecked.length === 0 && peppol.notChecked.length === 0;
    expect(summaryMarkdown(committed).includes("Every EN 16931 business rule that can fail")).toBe(full);
    const gap: Conformance = { ...committed, ruleSets: { ...committed.ruleSets, peppol: { ...peppol, checked: peppol.checked - 1, notChecked: ["PEPPOL-EN16931-R006"] } } };
    expect(summaryMarkdown(gap)).not.toContain("Every EN 16931 business rule");
    expect(summaryMarkdown(gap)).toContain(`${peppol.checked - 1} of the ${peppol.official} Peppol BIS core rules`);
  });
  it("counts only always-true assertions as nothing to check", () => {
    for (const set of [committed.ruleSets.business, committed.ruleSets.peppol]) {
      expect(set.checked + set.alwaysTrue.length + set.notChecked.length).toBe(set.official);
    }
    expect(committed.ruleSets.business.alwaysTrue).toEqual(["BR-CO-05", "BR-CO-06", "BR-CO-07", "BR-CO-08"]);
  });
});
