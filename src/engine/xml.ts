import { SaxesParser } from "saxes";

/**
 * Lightweight, namespace-aware XML tree with source positions.
 * Runs identically in the browser and in the edge worker (no DOM needed).
 */
export interface XNode {
  /** Qualified name as written, e.g. "cbc:ID" */
  name: string;
  /** Local name without prefix, e.g. "ID" */
  local: string;
  prefix: string;
  ns: string;
  attrs: Record<string, string>;
  children: XNode[];
  text: string;
  /** Text exactly as written, before trimming (BR-DE-18 needs the line break after a Skonto entry) */
  raw?: string;
  line: number;
  col: number;
  parent: XNode | null;
}

export class XmlSyntaxError extends Error {
  line: number;
  col: number;
  constructor(message: string, line: number, col: number) {
    super(message);
    this.name = "XmlSyntaxError";
    this.line = line;
    this.col = col;
  }
}

export const MAX_XML_BYTES = 5 * 1024 * 1024;

export function parseXml(input: string): XNode {
  const source = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  if (!source.trim()) throw new XmlSyntaxError("The document is empty.", 1, 1);
  if (source.length > MAX_XML_BYTES) {
    throw new XmlSyntaxError("The document is larger than 5 MB.", 1, 1);
  }

  const parser = new SaxesParser({ xmlns: true, position: true });
  const stack: XNode[] = [];
  const starts: { line: number; col: number }[] = [];
  let root: XNode | null = null;

  parser.on("error", (err) => {
    const clean = err.message.replace(/^[^:]*?:?(\d+):(\d+):\s*/, "");
    throw new XmlSyntaxError(capitalize(clean), parser.line, parser.column);
  });

  parser.on("opentagstart", () => {
    // position points just past the tag name; good enough for the start line
    starts.push({ line: parser.line, col: Math.max(1, parser.column) });
  });

  parser.on("opentag", (tag) => {
    const pos = starts.pop() ?? { line: parser.line, col: parser.column };
    const attrs: Record<string, string> = {};
    for (const [key, attr] of Object.entries(tag.attributes)) {
      const a = attr as { value: string; local?: string };
      attrs[key] = a.value;
      if (a.local && !(a.local in attrs)) attrs[a.local] = a.value;
    }
    const t = tag as unknown as { name: string; local?: string; prefix?: string; uri?: string };
    const node: XNode = {
      name: t.name,
      local: t.local ?? t.name.split(":").pop() ?? t.name,
      prefix: t.prefix ?? "",
      ns: t.uri ?? "",
      attrs,
      children: [],
      text: "",
      line: pos.line,
      col: pos.col,
      parent: stack[stack.length - 1] ?? null,
    };
    if (node.parent) node.parent.children.push(node);
    else root = node;
    stack.push(node);
  });

  parser.on("text", (text) => {
    const current = stack[stack.length - 1];
    if (current) current.text += text;
  });

  parser.on("cdata", (text) => {
    const current = stack[stack.length - 1];
    if (current) current.text += text;
  });

  parser.on("closetag", () => {
    const node = stack.pop();
    if (node) {
      const trimmed = node.text.trim();
      if (trimmed !== node.text && trimmed !== "" && node.children.length === 0) node.raw = node.text;
      node.text = trimmed;
    }
  });

  try {
    parser.write(source).close();
  } catch (e) {
    if (e instanceof XmlSyntaxError) throw e;
    throw new XmlSyntaxError(
      e instanceof Error ? e.message : "Unreadable XML",
      parser.line,
      parser.column,
    );
  }
  if (!root) throw new XmlSyntaxError("No root element found.", 1, 1);
  return root;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------- navigation helpers (match by local name) ---------- */

export function kids(node: XNode | null | undefined, local: string): XNode[] {
  if (!node) return [];
  return node.children.filter((c) => c.local === local);
}

export function kid(node: XNode | null | undefined, local: string): XNode | null {
  if (!node) return null;
  for (const c of node.children) if (c.local === local) return c;
  return null;
}

/** Follow a path of local names separated by "/" and return the first match. */
export function at(node: XNode | null | undefined, path: string): XNode | null {
  let cur: XNode | null | undefined = node;
  for (const part of path.split("/")) {
    if (!cur) return null;
    cur = kid(cur, part);
  }
  return cur ?? null;
}

/** All nodes matching the path; only the last segment may fan out. */
export function all(node: XNode | null | undefined, path: string): XNode[] {
  const parts = path.split("/");
  const last = parts.pop()!;
  const parent = parts.length ? at(node, parts.join("/")) : node;
  return kids(parent, last);
}

export function text(node: XNode | null | undefined, path?: string): string | undefined {
  const n = path ? at(node, path) : node;
  if (!n) return undefined;
  const t = n.text.trim();
  return t === "" ? undefined : t;
}

/** XPath-like location used in reports, e.g. /Invoice/cac:InvoiceLine[2]/cbc:ID */
export function xpathOf(node: XNode): string {
  const parts: string[] = [];
  let cur: XNode | null = node;
  while (cur) {
    const parent: XNode | null = cur.parent;
    if (parent) {
      const same = parent.children.filter((c) => c.name === cur!.name);
      parts.unshift(same.length > 1 ? `${cur.name}[${same.indexOf(cur) + 1}]` : cur.name);
    } else {
      parts.unshift(cur.name);
    }
    cur = parent;
  }
  return "/" + parts.join("/");
}

/** Depth-first walk */
export function walk(node: XNode, fn: (n: XNode) => void) {
  fn(node);
  for (const c of node.children) walk(c, fn);
}
