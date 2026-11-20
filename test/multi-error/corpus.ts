// The multi-error corpus: valid sample invoices with 2–8 known faults at once, drawn from a seeded
// random sequence, so the same seed always gives the same invoices. Real broken invoices often have
// several problems together, and a checker can then disagree with the official Schematron where it
// doesn't on single faults (a rule that reads a value another fault removed, one error hiding another).
//
// The faults are the single-change corpus's own (scripts/compare-altered-invoices.ts: an element or
// attribute removed, emptied, hollowed, padded with spaces or line breaks, a non-breaking space, the
// case changed) plus value changes that break business rules: amounts moved or given more decimals,
// codes swapped for other (valid or invalid) codes, dates moved, a group repeated, two values swapped.
//
// Used by scripts/compare-multi-error-invoices.ts (runs the official files) and by
// multi-error-parity.test.ts and next/multi-error-3-1-0.test.ts (hold the checker to the recorded official
// verdicts). Pure: only saxes
// (to read the XML) and node:crypto; the website's build script copies this file into the GitHub
// Action's tests unchanged.
import { createHash } from "node:crypto";
import { SaxesParser } from "saxes";

/* ------------------------------------------------------------------ a small mutable XML tree */

interface MText {
  kind: "text";
  text: string;
}
interface MEl {
  kind: "el";
  name: string;
  attrs: [string, string][];
  children: (MEl | MText)[];
  parent: MEl | null;
}

function parse(xml: string): MEl {
  const parser = new SaxesParser({ xmlns: false });
  const stack: MEl[] = [];
  let root: MEl | null = null;
  parser.on("opentag", (tag) => {
    const el: MEl = {
      kind: "el",
      name: tag.name,
      attrs: Object.entries(tag.attributes as Record<string, string>).map(([k, v]) => [k, v]),
      children: [],
      parent: stack[stack.length - 1] ?? null,
    };
    if (el.parent) el.parent.children.push(el);
    else root = el;
    stack.push(el);
  });
  const addText = (text: string) => {
    const cur = stack[stack.length - 1];
    if (cur) cur.children.push({ kind: "text", text });
  };
  parser.on("text", addText);
  parser.on("cdata", addText);
  parser.on("closetag", () => void stack.pop());
  parser.on("error", (e) => {
    throw e;
  });
  parser.write(xml.charCodeAt(0) === 0xfeff ? xml.slice(1) : xml).close();
  if (!root) throw new Error("no root element");
  return root;
}

const escText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string) => escText(s).replace(/"/g, "&quot;").replace(/\n/g, "&#10;").replace(/\r/g, "&#13;").replace(/\t/g, "&#9;");
function serializeEl(e: MEl): string {
  const attrs = e.attrs.map(([k, v]) => ` ${k}="${escAttr(v)}"`).join("");
  if (!e.children.length) return `<${e.name}${attrs}/>`;
  return `<${e.name}${attrs}>${e.children.map((c) => (c.kind === "text" ? escText(c.text) : serializeEl(c))).join("")}</${e.name}>`;
}
const serialize = (root: MEl) => `<?xml version="1.0" encoding="UTF-8"?>\n${serializeEl(root)}\n`;

const local = (e: MEl) => e.name.slice(e.name.indexOf(":") + 1);
const elementKids = (e: MEl) => e.children.filter((c): c is MEl => c.kind === "el");
const isLeaf = (e: MEl) => elementKids(e).length === 0;
const textOf = (e: MEl) => e.children.map((c) => (c.kind === "text" ? c.text : "")).join("");
function setText(e: MEl, t: string) {
  e.children = t === "" ? [] : [{ kind: "text", text: t }];
}
function clone(e: MEl, parent: MEl | null): MEl {
  const c: MEl = { kind: "el", name: e.name, attrs: e.attrs.map(([k, v]) => [k, v]), children: [], parent };
  c.children = e.children.map((x) => (x.kind === "text" ? { kind: "text", text: x.text } : clone(x, c)));
  return c;
}
function pathOf(e: MEl): string {
  const parts: string[] = [];
  for (let n: MEl | null = e; n; n = n.parent) {
    const p: MEl | null = n.parent;
    if (!p) {
      parts.unshift(local(n));
      continue;
    }
    const same = elementKids(p).filter((c) => c.name === n!.name);
    parts.unshift(same.length > 1 ? `${local(n)}[${same.indexOf(n) + 1}]` : local(n));
  }
  return parts.join("/");
}
/** Base64 attachments and extensions carry no business data the rules read. */
const SKIP = /^(EmbeddedDocumentBinaryObject|AttachmentBinaryObject|UBLExtensions|IncludedBinaryObject)$/;
function elements(root: MEl): MEl[] {
  const out: MEl[] = [];
  const walk = (e: MEl) => {
    for (const c of elementKids(e)) {
      if (SKIP.test(local(c))) continue;
      out.push(c);
      walk(c);
    }
  };
  walk(root);
  return out;
}

/* ------------------------------------------------------------------ seeded randomness */

/** mulberry32: a small, fast, seedable generator; the same seed gives the same sequence everywhere. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rng = () => number;
const pick = <T>(rng: Rng, list: readonly T[]): T => list[Math.floor(rng() * list.length)]!;

/* ------------------------------------------------------------------ the faults */

const NBSP = "\u00a0";
const NUMBER = /^-?\d+(\.\d+)?$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_102 = /^(\d{4})(\d{2})(\d{2})$/;

/** Other values for coded elements and attributes, valid and invalid, by local name (parent/name first). */
const CODES: Record<string, readonly string[]> = {
  "TaxCategory/ID": ["S", "Z", "E", "AE", "K", "G", "O", "L", "M", "B", "X"],
  "ClassifiedTaxCategory/ID": ["S", "Z", "E", "AE", "K", "G", "O", "L", "M", "X"],
  "TaxScheme/ID": ["VAT", "GST", "vat"],
  CategoryCode: ["S", "Z", "E", "AE", "K", "G", "O", "L", "M", "X"],
  TypeCode: ["VAT", "380", "381", "384", "389", "751", "30", "58", "1", "ZZZ"],
  InvoiceTypeCode: ["380", "381", "383", "384", "386", "389", "326", "751", "999"],
  CreditNoteTypeCode: ["381", "380", "396", "261", "999"],
  DocumentCurrencyCode: ["EUR", "USD", "SEK", "NOK", "GBP", "XXX", "EU"],
  TaxCurrencyCode: ["EUR", "USD", "SEK", "NOK", "XXX"],
  InvoiceCurrencyCode: ["EUR", "USD", "SEK", "NOK", "XXX"],
  TaxCurrencyCodeCII: ["EUR", "SEK"],
  IdentificationCode: ["BE", "NL", "DE", "FR", "NO", "SE", "DK", "GR", "EL", "ES", "IT", "XX"],
  CountryID: ["BE", "NL", "DE", "FR", "NO", "SE", "DK", "GR", "ES", "XX"],
  PaymentMeansCode: ["1", "30", "31", "42", "48", "49", "58", "59", "ZZZ", "999"],
  Percent: ["0", "6", "12", "21", "25", "19.6", "-5"],
  RateApplicablePercent: ["0", "6", "12", "21", "25", "-5"],
  CalculationPercent: ["0", "5", "10", "100", "-1"],
  MultiplierFactorNumeric: ["0", "5", "10", "100"],
  TaxExemptionReasonCode: ["VATEX-EU-AE", "VATEX-EU-IC", "VATEX-EU-O", "VATEX-EU-G", "VATEX-EU-79-C", "VATEX-EU-132", "vatex-eu-ae", "XX"],
  ExemptionReasonCode: ["VATEX-EU-AE", "VATEX-EU-IC", "VATEX-EU-O", "VATEX-EU-G", "VATEX-EU-79-C", "XX"],
  AllowanceChargeReasonCode: ["95", "100", "102", "104", "ZZZ", "FC", "ABL", "AA", "XX"],
  ReasonCode: ["95", "100", "102", "ZZZ", "FC", "ABL", "XX"],
  ChargeIndicator: ["true", "false", "TRUE", "1", "0"],
  Indicator: ["true", "false"],
  TaxPointDate: ["2026-01-01"],
  DueDateTimeString: ["20260101"],
  DocumentTypeCode: ["130", "50", "916", "380"],
  ItemClassificationCode: ["12345678", "", "ABC"],
  DateTimeString: ["20260101", "2026-01-01"],
  TaxExemptionReason: ["Exempt", ""],
  ProfileID: ["urn:fdc:peppol.eu:2017:poacc:billing:01:1.0", "urn:fdc:peppol.eu:2017:poacc:billing:02:1.0", "billing"],
  CustomizationID: [
    "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0",
    "urn:cen.eu:en16931:2017",
    "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:2.0",
  ],
};
const ATTR_CODES: Record<string, readonly string[]> = {
  currencyID: ["EUR", "USD", "SEK", "NOK", "XXX"],
  unitCode: ["C62", "EA", "H87", "HUR", "KGM", "XX"],
  schemeID: ["0208", "9925", "0088", "0192", "0007", "0184", "0106", "9930", "9944", "VA", "SEPA", "ZZZ"],
  listID: ["UNCL7143", "STI", "UNCL1001", "XX"],
  mimeCode: ["application/pdf", "image/png", "text/csv", "application/zip"],
  format: ["102", "203", "610"],
  unitCodeListID: ["UNECERec20"],
};
const codesFor = (e: MEl) => CODES[`${e.parent ? local(e.parent) : ""}/${local(e)}`] ?? CODES[local(e)];

function moveDate(text: string, days: number): string | undefined {
  const m = DATE.exec(text) ?? DATE_102.exec(text);
  if (!m) return undefined;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) + days * 86_400_000);
  const iso = d.toISOString().slice(0, 10);
  return DATE.test(text) ? iso : iso.replace(/-/g, "");
}
/** Decimal-safe changes to a number as written (no floating point surprises in the corpus). */
function moveNumber(text: string, rng: Rng): string {
  const n = Number(text);
  const decimals = (text.split(".")[1] ?? "").length;
  const fix = (v: number, d = Math.max(2, decimals)) => (Math.round(v * 10 ** d) / 10 ** d).toFixed(d);
  switch (Math.floor(rng() * 9)) {
    case 0:
      return fix(n + 0.01);
    case 1:
      return fix(n - 0.01);
    case 2:
      return fix(n + 1);
    case 3:
      return fix(n * 2);
    case 4:
      return fix(-n);
    case 5:
      return "0";
    case 6:
      return fix(n + 0.005, 3);
    case 7:
      return String(Math.trunc(n));
    default:
      return fix(n + 100);
  }
}

interface Fault {
  /** Weight in the draw */
  weight: number;
  /** Whether the fault can change this element (`els`: every element of the invoice, in document order) */
  applies: (e: MEl, els: readonly MEl[]) => boolean;
  /** Applies the fault and returns its label, or undefined when it changed nothing */
  apply: (e: MEl, rng: Rng, els: readonly MEl[]) => string | undefined;
}
/** Leaves with the same name as `e` and other text: the partners a swap can use. */
const swapPartners = (e: MEl, els: readonly MEl[]) => els.filter((o) => o !== e && o.name === e.name && isLeaf(o) && textOf(o) !== textOf(e));
const leafText = (e: MEl) => isLeaf(e);
/** Cheap pre-check for the swap: another leaf of the same name exists (per invoice state, cached). */
const leafNames = new WeakMap<readonly MEl[], Map<string, number>>();
function repeatedLeafName(e: MEl, els: readonly MEl[]): boolean {
  let m = leafNames.get(els);
  if (!m) {
    m = new Map();
    for (const o of els) if (isLeaf(o)) m.set(o.name, (m.get(o.name) ?? 0) + 1);
    leafNames.set(els, m);
  }
  return (m.get(e.name) ?? 0) > 1;
}
const FAULTS: Fault[] = [
  { weight: 6, applies: () => true, apply: (e) => (e.parent!.children = e.parent!.children.filter((c) => c !== e), "removed") },
  {
    weight: 3,
    applies: (e) => !isLeaf(e),
    apply: (e) => {
      e.children = [];
      return "hollow";
    },
  },
  {
    weight: 4,
    applies: leafText,
    apply: (e, rng) => {
      const t = textOf(e);
      const [label, v] = pick(rng, [
        ["empty", ""],
        ["a space", " "],
        ["only a non-breaking space", NBSP],
        ["padded with spaces", ` ${t} `],
        ["between line breaks", `\n${t}\n`],
        ["+ non-breaking space", `${t}${NBSP}`],
        ["lower case", t.toLowerCase()],
        ["upper case", t.toUpperCase()],
      ] as const);
      if (v === t) return undefined;
      setText(e, v);
      return label;
    },
  },
  {
    weight: 4,
    applies: (e) => e.attrs.some(([k]) => !k.startsWith("xmlns")),
    apply: (e, rng) => {
      const attrs = e.attrs.filter(([k]) => !k.startsWith("xmlns"));
      const [name, value] = pick(rng, attrs);
      const codes = ATTR_CODES[name];
      const op = Math.floor(rng() * (codes ? 6 : 5));
      const set = (v: string) => (e.attrs = e.attrs.map(([k, old]) => [k, k === name ? v : old]));
      if (op === 0) {
        e.attrs = e.attrs.filter(([k]) => k !== name);
        return `@${name} removed`;
      }
      const v = op === 1 ? "" : op === 2 ? ` ${value} ` : op === 3 ? `${value}${NBSP}` : op === 4 ? value.toLowerCase() : pick(rng, codes!);
      if (v === value) return undefined;
      set(v);
      return `@${name} = ${JSON.stringify(v)} (was ${JSON.stringify(value)})`;
    },
  },
  {
    weight: 6,
    applies: (e) => isLeaf(e) && NUMBER.test(textOf(e)),
    apply: (e, rng) => {
      const t = textOf(e);
      const v = moveNumber(t, rng);
      if (v === t) return undefined;
      setText(e, v);
      return `= ${v} (was ${t})`;
    },
  },
  {
    weight: 6,
    applies: (e) => isLeaf(e) && !!codesFor(e),
    apply: (e, rng) => {
      const t = textOf(e);
      const v = pick(rng, codesFor(e)!);
      if (v === t) return undefined;
      setText(e, v);
      return `= ${JSON.stringify(v)} (was ${JSON.stringify(t)})`;
    },
  },
  {
    weight: 3,
    applies: (e) => isLeaf(e) && (DATE.test(textOf(e)) || (local(e) === "DateTimeString" && DATE_102.test(textOf(e)))),
    apply: (e, rng) => {
      const t = textOf(e);
      const days = pick(rng, [-400, -40, -1, 1, 30, 365]);
      const v = moveDate(t, days);
      if (!v || v === t) return undefined;
      setText(e, v);
      return `= ${v} (was ${t})`;
    },
  },
  {
    weight: 2,
    applies: (e) => e.parent !== null,
    apply: (e) => {
      const p = e.parent!;
      const i = p.children.indexOf(e);
      p.children.splice(i + 1, 0, { kind: "text", text: "\n" }, clone(e, p));
      return "repeated";
    },
  },
  {
    weight: 2,
    applies: (e, els) => isLeaf(e) && repeatedLeafName(e, els),
    apply: (e, rng, els) => {
      const partners = swapPartners(e, els);
      if (!partners.length) return undefined;
      const other = pick(rng, partners);
      const a = textOf(e);
      setText(e, textOf(other));
      setText(other, a);
      return `swapped with ${pathOf(other)}`;
    },
  },
];
const TOTAL_WEIGHT = FAULTS.reduce((n, f) => n + f.weight, 0);
function drawFault(rng: Rng): Fault {
  let r = rng() * TOTAL_WEIGHT;
  for (const f of FAULTS) if ((r -= f.weight) < 0) return f;
  return FAULTS[FAULTS.length - 1]!;
}

/* ------------------------------------------------------------------ the corpus */

export interface CorpusBase {
  name: string;
  xml: string;
}
export interface CorpusCase {
  /** `<base>--<n>`: n is the case's place in the seeded sequence */
  id: string;
  base: string;
  /** One label per fault, in the order applied: "<path> <what changed>" */
  faults: string[];
  xml: string;
}
export interface CorpusOptions {
  seed: number;
  /** How many invoices to draw (before any schema check) */
  count: number;
  /** Faults per invoice, both ends included (default 2–8) */
  min?: number;
  max?: number;
}

/** Applies `k` random faults to one invoice; each fault picks an element of the invoice as it is by then. */
function faulty(xml: string, k: number, rng: Rng): { xml: string; faults: string[] } {
  const root = parse(xml);
  const faults: string[] = [];
  for (let tries = 0; faults.length < k && tries < k * 20; tries++) {
    const fault = drawFault(rng);
    const els = elements(root);
    const candidates = els.filter((e) => fault.applies(e, els));
    if (!candidates.length) continue;
    const e = pick(rng, candidates);
    const path = pathOf(e);
    const label = fault.apply(e, rng, els);
    if (label) faults.push(`${path} ${label}`);
  }
  return { xml: serialize(root), faults };
}

/** The seeded sequence of invoices: the same bases, seed and count always give the same invoices. */
export function multiErrorCorpus(bases: readonly CorpusBase[], options: CorpusOptions): CorpusCase[] {
  const { seed, count, min = 2, max = 8 } = options;
  if (!bases.length) throw new Error("no bases");
  const rng = seededRandom(seed);
  const out: CorpusCase[] = [];
  for (let n = 0; n < count; n++) {
    const base = pick(rng, bases);
    const k = min + Math.floor(rng() * (max - min + 1));
    const { xml, faults } = faulty(base.xml, k, rng);
    out.push({ id: `${base.name}--${n}`, base: base.name, faults, xml });
  }
  return out;
}

/** A short content hash, recorded with each verdict so a changed sample or generator can't go unnoticed. */
export const corpusHash = (xml: string) => createHash("sha256").update(xml).digest("hex").slice(0, 16);

/** The Factur-X EN 16931 sample declared as a Peppol BIS CII invoice (as in the edge-case recorder). */
export function asPeppolCii(facturX: string): string {
  const swap = (xml: string, from: string, to: string) => {
    if (!xml.includes(from)) throw new Error(`the Factur-X sample no longer contains ${JSON.stringify(from)}`);
    return xml.replace(from, to);
  };
  let xml = swap(
    facturX,
    "    <ram:GuidelineSpecifiedDocumentContextParameter>",
    "    <ram:BusinessProcessSpecifiedDocumentContextParameter>\n      <ram:ID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</ram:ID>\n    </ram:BusinessProcessSpecifiedDocumentContextParameter>\n    <ram:GuidelineSpecifiedDocumentContextParameter>",
  );
  xml = swap(xml, "<ram:ID>urn:cen.eu:en16931:2017</ram:ID>", "<ram:ID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</ram:ID>");
  return swap(xml, "      <ram:SubjectCode>PMT</ram:SubjectCode>\n", "");
}

/* ------------------------------------------------------------------ repeated groups, one copy broken */

/**
 * The repeated-group corpus: deterministic, not random. Every element of a base is repeated in place (the copy right
 * after the original); `repeatedGroups` gives those invoices for a schema check, and `repeatedGroupFaults` then breaks
 * one thing inside either copy of each repetition the schema allows: an element removed, emptied or hollowed, a code
 * set to another code, a number moved by 1. The official rules read every copy of a repeated group (or stop on
 * several), so a checker that reads only the first copy shows up here, where random draws rarely hit it.
 * Cases whose structure an earlier base already gave (same syntax, paths without positions, copy and fault) are
 * left out after `perKey` of them, so many similar bases don't multiply one case.
 */
export interface RepeatOptions {
  /** Keep at most this many cases per structural key (default 2) */
  perKey?: number;
}
const plainPath = (e: MEl) => pathOf(e).replace(/\[\d+\]/g, "");
/** The element and everything below it (attachments and extensions skipped), document order */
const subtree = (e: MEl): MEl[] => [e, ...elements(e)];
const syntaxKey = (xml: string) => (/CrossIndustryInvoice/.test(xml.slice(0, 2000)) ? "cii" : "ubl");

/** Every element of every base repeated once: `<base>--r<n>`, n = the element's place in document order. */
export function repeatedGroups(bases: readonly CorpusBase[]): CorpusCase[] {
  const out: CorpusCase[] = [];
  for (const b of bases) {
    const count = elements(parse(b.xml)).length;
    for (let n = 0; n < count; n++) {
      const root = parse(b.xml);
      const e = elements(root)[n]!;
      const p = e.parent!;
      p.children.splice(p.children.indexOf(e) + 1, 0, { kind: "text", text: "\n" }, clone(e, p));
      out.push({ id: `${b.name}--r${n}`, base: b.name, faults: [`${pathOf(e)} repeated`], xml: serialize(root) });
    }
  }
  return out;
}

/**
 * One fault inside either copy of each repetition in `allowed` (ids from `repeatedGroups` the schema accepts):
 * `<base>--r<n>-<copy>-<m>-<fault>`, copy 1 = the original, 2 = the copy, m = the element's place inside that copy.
 */
export function repeatedGroupFaults(bases: readonly CorpusBase[], allowed: ReadonlySet<string>, options: RepeatOptions = {}): CorpusCase[] {
  const perKey = options.perKey ?? 2;
  const seen = new Map<string, number>();
  const out: CorpusCase[] = [];
  for (const b of bases) {
    const syntax = syntaxKey(b.xml);
    const count = elements(parse(b.xml)).length;
    for (let n = 0; n < count; n++) {
      if (!allowed.has(`${b.name}--r${n}`)) continue;
      const repeat = (): { root: MEl; copies: [MEl, MEl]; label: string } => {
        const root = parse(b.xml);
        const e = elements(root)[n]!;
        const p = e.parent!;
        const c = clone(e, p);
        p.children.splice(p.children.indexOf(e) + 1, 0, { kind: "text", text: "\n" }, c);
        return { root, copies: [e, c], label: `${pathOf(e)} repeated` };
      };
      const probe = repeat();
      for (const copy of [0, 1] as const) {
        const inside = subtree(probe.copies[copy]);
        for (let m = 0; m < inside.length; m++) {
          const d = inside[m]!;
          const faults: [string, (x: MEl) => string | undefined][] = [];
          if (m > 0) faults.push(["removed", (x) => ((x.parent!.children = x.parent!.children.filter((k) => k !== x)), "removed")]);
          if (!isLeaf(d)) faults.push(["hollow", (x) => ((x.children = []), "hollow")]);
          else {
            const t = textOf(d);
            if (t !== "") faults.push(["empty", (x) => (setText(x, ""), "empty")]);
            const codes = codesFor(d)?.filter((c) => c !== t);
            if (codes?.length) {
              const v = codes[codes.length - 1]!;
              faults.push(["code", (x) => (setText(x, v), `= ${JSON.stringify(v)} (was ${JSON.stringify(t)})`)]);
            } else if (NUMBER.test(t)) {
              const decimals = (t.split(".")[1] ?? "").length;
              const v = (Math.round((Number(t) + 1) * 10 ** decimals) / 10 ** decimals).toFixed(decimals);
              faults.push(["number", (x) => (setText(x, v), `= ${v} (was ${t})`)]);
              const flipped = t.startsWith("-") ? t.slice(1) : `-${t}`;
              if (Number(t) !== 0) faults.push(["sign", (x) => (setText(x, flipped), `= ${flipped} (was ${t})`)]);
            } else if (/^[A-Z][A-Z0-9]{0,5}$/.test(t)) faults.push(["code", (x) => (setText(x, "XX9"), `= "XX9" (was ${JSON.stringify(t)})`)]);
            const moved = moveDate(t, -400);
            if (moved) faults.push(["date", (x) => (setText(x, moved), `= ${moved} (was ${t})`)]);
          }
          const attr = d.attrs.find(([k]) => !k.startsWith("xmlns"));
          if (attr) {
            const [name, value] = attr;
            const other = ATTR_CODES[name]?.filter((c) => c !== value);
            const v = other?.length ? other[other.length - 1]! : "";
            faults.push(["attr", (x) => ((x.attrs = x.attrs.map(([k, old]) => [k, k === name ? v : old])), `@${name} = ${JSON.stringify(v)} (was ${JSON.stringify(value)})`)]);
            faults.push(["attr-removed", (x) => ((x.attrs = x.attrs.filter(([k]) => k !== name)), `@${name} removed`)]);
          }
          for (const [name, apply] of faults) {
            const key = `${syntax}|${plainPath(probe.copies[0])}|${copy}|${plainPath(d).slice(plainPath(probe.copies[copy]).length)}|${name}`;
            const k = seen.get(key) ?? 0;
            if (k >= perKey) continue;
            seen.set(key, k + 1);
            const fresh = repeat();
            const target = subtree(fresh.copies[copy])[m]!;
            const where = pathOf(target);
            const label = apply(target);
            if (!label) continue;
            out.push({ id: `${b.name}--r${n}-${copy + 1}-${m}-${name}`, base: b.name, faults: [fresh.label, `${where} ${label}`], xml: serialize(fresh.root) });
          }
        }
      }
    }
  }
  return out;
}
