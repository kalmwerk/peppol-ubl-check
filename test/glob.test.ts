import { describe, expect, it } from "vitest";
import { expandBraces, findFiles, normalisePattern, patternToRegExp, splitPatterns, staticBase } from "../src/glob";
import { tempRepo } from "./helpers";

describe("splitPatterns", () => {
  it("splits on lines and commas, but not on commas inside braces", () => {
    expect(splitPatterns("invoices/**/*.xml\n  out/*.{xml,XML} , !out/draft-*.xml\r\n\n")).toEqual([
      "invoices/**/*.xml",
      "out/*.{xml,XML}",
      "!out/draft-*.xml",
    ]);
    expect(splitPatterns("")).toEqual([]);
  });
});

describe("expandBraces", () => {
  it("expands alternatives, nested ones too, and keeps single-option braces as written", () => {
    expect(expandBraces("a/{b,c}/*.xml")).toEqual(["a/b/*.xml", "a/c/*.xml"]);
    expect(expandBraces("{x,{y,z}}.xml")).toEqual(["x.xml", "y.xml", "z.xml"]);
    expect(expandBraces("a{b}c")).toEqual(["a{b}c"]);
  });

  it("refuses patterns that expand to more than 256", () => {
    expect(() => expandBraces("{a,b,c,d}{a,b,c,d}{a,b,c,d}{a,b,c,d}{a,b}")).toThrow(/more than 256/);
  });
});

describe("patternToRegExp", () => {
  const m = (pattern: string, path: string) => patternToRegExp(pattern).test(path);

  it("matches * within one folder and ** across folders", () => {
    expect(m("*.xml", "a.xml")).toBe(true);
    expect(m("*.xml", "x/a.xml")).toBe(false);
    expect(m("**/*.xml", "a.xml")).toBe(true);
    expect(m("**/*.xml", "x/y/a.xml")).toBe(true);
    expect(m("invoices/**", "invoices/2026/a.xml")).toBe(true);
    expect(m("invoices/**/*.xml", "invoices/a.xml")).toBe(true);
    expect(m("invoices/**/*.xml", "other/a.xml")).toBe(false);
  });

  it("never lets a wildcard match a hidden name, unless the pattern spells the dot out", () => {
    expect(m("**/*.xml", ".github/actions/x.xml")).toBe(false);
    expect(m("*.xml", ".hidden.xml")).toBe(false);
    expect(m(".github/**/*.xml", ".github/actions/x.xml")).toBe(true);
  });

  it("supports ?, character classes and escapes", () => {
    expect(m("inv-?.xml", "inv-1.xml")).toBe(true);
    expect(m("inv-?.xml", "inv-12.xml")).toBe(false);
    expect(m("inv-[0-9].xml", "inv-7.xml")).toBe(true);
    expect(m("inv-[!0-9].xml", "inv-a.xml")).toBe(true);
    expect(m("inv-[!0-9].xml", "inv-7.xml")).toBe(false);
    expect(m("a\\*.xml", "a*.xml")).toBe(true);
    expect(m("a\\*.xml", "ab.xml")).toBe(false);
  });

  it("normalises ./, doubled and Windows slashes", () => {
    expect(normalisePattern("./invoices//x\\y.xml")).toBe("invoices/x/y.xml");
    expect(staticBase("invoices/2026/**/*.xml")).toBe("invoices/2026");
    expect(staticBase("*.xml")).toBe("");
  });
});

describe("findFiles", () => {
  const repo = () =>
    tempRepo({
      "invoices/a.xml": "<a/>",
      "invoices/2026/b.xml": "<b/>",
      "invoices/2026/notes.txt": "x",
      "invoices/draft-c.xml": "<c/>",
      "pom.xml": "<project/>",
      "node_modules/pkg/d.xml": "<d/>",
      ".github/actions/e.xml": "<e/>",
      "invoice.ubl": "<f/>",
    });

  it("finds matches sorted, skipping node_modules and hidden folders", () => {
    expect(findFiles(["**/*.xml"], { cwd: repo() })).toEqual(["invoices/2026/b.xml", "invoices/a.xml", "invoices/draft-c.xml", "pom.xml"]);
  });

  it("leaves out ! patterns and ignore globs", () => {
    const cwd = repo();
    expect(findFiles(["invoices/**/*.xml", "!invoices/draft-*.xml"], { cwd })).toEqual(["invoices/2026/b.xml", "invoices/a.xml"]);
    expect(findFiles(["**/*.xml"], { cwd, ignore: ["invoices/2026"] })).toEqual(["invoices/a.xml", "invoices/draft-c.xml", "pom.xml"]);
  });

  it("takes a plain file path as is, and a folder as every *.xml in it", () => {
    const cwd = repo();
    expect(findFiles(["invoice.ubl"], { cwd })).toEqual(["invoice.ubl"]);
    expect(findFiles(["invoices"], { cwd })).toEqual(["invoices/2026/b.xml", "invoices/a.xml", "invoices/draft-c.xml"]);
    expect(findFiles(["missing.xml"], { cwd })).toEqual([]);
  });

  it("walks hidden folders only when the pattern names them", () => {
    expect(findFiles([".github/**/*.xml"], { cwd: repo() })).toEqual([".github/actions/e.xml"]);
  });

  it("stops a runaway walk", () => {
    expect(() => findFiles(["**/*.xml"], { cwd: repo(), maxEntries: 3 })).toThrow(/Narrow the pattern/);
  });
});
