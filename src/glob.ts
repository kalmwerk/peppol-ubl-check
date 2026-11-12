// File matching for the `files` input and the CLI's arguments, written out so
// the bundle needs no glob package. Supports `*`, `**`, `?`, `[abc]`, `[!abc]`,
// `{a,b}` and `!pattern` exclusions, with the usual dotfile rule: wildcards
// never match a name that starts with "." unless the pattern spells the dot
// out, so `**/*.xml` stays out of `.github/` and other hidden folders.
import { existsSync, readdirSync, statSync, type Dirent } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

/** Folders never walked into by a wildcard, whatever the pattern. */
export const SKIPPED_DIRS: readonly string[] = ["node_modules", ".git"];

/** Most directory entries one run looks at, so a pattern like `/**` can't walk a whole disk. */
export const MAX_ENTRIES = 200_000;

const SPECIAL = /[*?[\]{}]/;

/**
 * Splits a list input into patterns: one per line, or comma separated.
 * Commas inside `{a,b}` belong to the pattern.
 */
export function splitPatterns(raw: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of raw) {
    if (ch === "{") depth++;
    if (ch === "}" && depth > 0) depth--;
    if (ch === "\n" || ch === "\r" || (ch === "," && depth === 0)) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out.map((p) => p.trim()).filter(Boolean);
}

/** `a/{b,c}/*.{xml,XML}` → four patterns. Nested braces work; at most 256 results. */
export function expandBraces(pattern: string): string[] {
  let depth = 0;
  let open = -1;
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === "{") {
      if (depth === 0) open = i;
      depth++;
    } else if (ch === "}" && depth > 0) {
      depth--;
      if (depth === 0) {
        const body = pattern.slice(open + 1, i);
        const options = splitTopLevel(body);
        const head = pattern.slice(0, open);
        const tail = pattern.slice(i + 1);
        if (options.length < 2) {
          // "{a}" isn't an alternation: keep it as written and carry on after it.
          return expandBraces(tail).map((t) => `${head}{${body}}${t}`);
        }
        const out: string[] = [];
        for (const o of options) for (const e of expandBraces(head + o + tail)) if (!out.includes(e)) out.push(e);
        if (out.length > 256) throw new Error(`The pattern "${pattern}" expands to more than 256 patterns.`);
        return out;
      }
    }
  }
  return [pattern];
}

function splitTopLevel(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]!;
    if (ch === "\\") {
      current += ch + (body[i + 1] ?? "");
      i++;
      continue;
    }
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

/** One path segment (no "/", braces already expanded) as a regular expression source. */
function segmentSource(seg: string): string {
  let out = seg.startsWith(".") ? "" : "(?!\\.)";
  for (let i = 0; i < seg.length; i++) {
    const ch = seg[i]!;
    if (ch === "\\") {
      out += escapeRe(seg[i + 1] ?? "\\");
      i++;
    } else if (ch === "*") {
      while (seg[i + 1] === "*") i++;
      out += "[^/]*";
    } else if (ch === "?") {
      out += "[^/]";
    } else if (ch === "[") {
      const close = seg.indexOf("]", i + 2);
      if (close === -1) {
        out += "\\[";
        continue;
      }
      let cls = seg.slice(i + 1, close);
      const negate = cls.startsWith("!") || cls.startsWith("^");
      if (negate) cls = cls.slice(1);
      out += `[${negate ? "^/" : ""}${cls.replace(/\\/g, "\\\\").replace(/\]/g, "\\]")}]`;
      i = close;
    } else {
      out += escapeRe(ch);
    }
  }
  return out;
}

/** Turns a slash-separated pattern without braces into a regular expression for relative paths. */
export function patternToRegExp(pattern: string): RegExp {
  const segments = normalisePattern(pattern).split("/");
  let src = "^";
  segments.forEach((seg, i) => {
    const last = i === segments.length - 1;
    if (seg === "**") {
      src += last ? "(?:(?!\\.)[^/]+)(?:/(?!\\.)[^/]+)*" : "(?:(?!\\.)[^/]+/)*";
      return;
    }
    src += segmentSource(seg) + (last ? "" : "/");
  });
  return new RegExp(`${src}$`);
}

/** Forward slashes, no leading "./", no doubled or trailing slashes. */
export function normalisePattern(pattern: string): string {
  let p = pattern.trim().replace(/\\(?![*?[\]{}!\\])/g, "/");
  while (p.startsWith("./")) p = p.slice(2);
  p = p.replace(/\/{2,}/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

/** The folder a pattern can only match inside: its leading segments without wildcards. */
export function staticBase(pattern: string): string {
  const segments = normalisePattern(pattern).split("/");
  const base: string[] = [];
  for (const seg of segments.slice(0, -1)) {
    if (SPECIAL.test(seg)) break;
    base.push(seg);
  }
  return base.join("/");
}

const toPosix = (p: string) => p.split(sep).join("/");

export interface FindOptions {
  /** Folder patterns are relative to. */
  cwd: string;
  /** Extra exclusions (the `ignore` input / --ignore). */
  ignore?: string[];
  maxEntries?: number;
}

interface Compiled {
  regex: RegExp;
  base: string;
  /** Whether the pattern itself names a hidden folder, so walking into dot folders is needed. */
  dots: boolean;
}

function compile(pattern: string, cwd: string): Compiled[] {
  let p = pattern;
  if (isAbsolute(p)) p = toPosix(relative(cwd, p)) || ".";
  return expandBraces(normalisePattern(p)).map((e) => {
    const n = normalisePattern(e);
    return { regex: patternToRegExp(n), base: staticBase(n), dots: /(^|\/)\.[^./]/.test(n) };
  });
}

/**
 * Files matching the patterns, as sorted relative paths with forward slashes.
 * A pattern without wildcards names a file (or a folder: every *.xml in it).
 * Patterns starting with "!" leave matches out again.
 */
export function findFiles(patterns: string[], options: FindOptions): string[] {
  const cwd = resolve(options.cwd);
  const max = options.maxEntries ?? MAX_ENTRIES;
  const include: Compiled[] = [];
  const exclude: RegExp[] = [];
  const literal = new Set<string>();

  const excluded = (rel: string) => exclude.some((r) => r.test(rel));

  for (const raw of [...patterns, ...(options.ignore ?? []).map((i) => `!${i.replace(/^!/, "")}`)]) {
    const negated = raw.startsWith("!");
    const pattern = negated ? raw.slice(1) : raw;
    if (!pattern.trim()) continue;
    if (negated) {
      for (const c of compile(pattern, cwd)) {
        exclude.push(c.regex);
        // "!dir" also leaves out everything inside dir
        exclude.push(new RegExp(c.regex.source.replace(/\$$/, "/.*$")));
      }
      continue;
    }
    for (const c of compile(pattern, cwd)) {
      const text = normalisePattern(pattern);
      if (!SPECIAL.test(text) && expandBraces(text).length === 1) {
        // A plain path: a file, or a folder whose XML files are all wanted.
        const abs = resolve(cwd, text);
        if (existsSync(abs) && statSync(abs).isDirectory()) {
          const folder = toPosix(relative(cwd, abs));
          include.push(...compile(folder ? `${folder}/**/*.xml` : "**/*.xml", cwd));
        } else {
          literal.add(toPosix(relative(cwd, abs)));
        }
        continue;
      }
      include.push(c);
    }
  }

  const found = new Set<string>();
  for (const l of literal) {
    const abs = resolve(cwd, l);
    if (existsSync(abs) && statSync(abs).isFile() && !excluded(l)) found.add(l);
  }

  let seen = 0;
  const walked = new Set<string>();
  for (const c of include) {
    const startRel = c.base;
    const startAbs = resolve(cwd, startRel);
    const key = `${startAbs}|${c.dots}`;
    const matchers = include.filter((x) => x.base === c.base && x.dots === c.dots);
    if (walked.has(key)) continue;
    walked.add(key);
    if (!existsSync(startAbs) || !statSync(startAbs).isDirectory()) continue;

    const stack: string[] = [startAbs];
    while (stack.length) {
      const dir = stack.pop()!;
      let entries: Dirent[];
      try {
        entries = readdirSync(dir, { withFileTypes: true });
      } catch {
        continue; // unreadable folder: nothing to check there
      }
      for (const entry of entries) {
        if (++seen > max) throw new Error(`Stopped after looking at ${max} files and folders. Narrow the pattern (for example "invoices/**/*.xml").`);
        const abs = join(dir, entry.name);
        const rel = toPosix(relative(cwd, abs));
        if (entry.isDirectory()) {
          if (SKIPPED_DIRS.includes(entry.name)) continue;
          if (entry.name.startsWith(".") && !c.dots) continue;
          if (excluded(rel)) continue;
          stack.push(abs);
          continue;
        }
        let isFile = entry.isFile();
        if (entry.isSymbolicLink()) {
          try {
            isFile = statSync(abs).isFile();
          } catch {
            isFile = false;
          }
        }
        if (!isFile) continue;
        if (matchers.some((m) => m.regex.test(rel)) && !excluded(rel)) found.add(rel);
      }
    }
  }
  return [...found].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
