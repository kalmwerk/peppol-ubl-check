import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

export const FIXTURES = resolve(__dirname, "fixtures");

/** A fresh folder with the given files (path → contents, or a fixture to copy with "fixture:<path>"). */
export function tempRepo(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "peppol-ubl-check-"));
  for (const [path, content] of Object.entries(files)) {
    const abs = join(dir, path);
    mkdirSync(dirname(abs), { recursive: true });
    if (content.startsWith("fixture:")) cpSync(join(FIXTURES, content.slice("fixture:".length)), abs);
    else writeFileSync(abs, content);
  }
  return dir;
}
