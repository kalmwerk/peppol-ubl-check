import type { Loc, LocMap, InvoiceModel } from "./model";
import { at, text, xpathOf, type XNode } from "./xml";

export const DECIMAL_BTS = new Set([
  "BT-92",
  "BT-93",
  "BT-99",
  "BT-100",
  "BT-106",
  "BT-107",
  "BT-108",
  "BT-109",
  "BT-110",
  "BT-111",
  "BT-112",
  "BT-113",
  "BT-114",
  "BT-115",
  "BT-116",
  "BT-117",
  "BT-131",
  "BT-136",
  "BT-137",
  "BT-141",
  "BT-142",
]);

/** Shared reading context: tracks positions, decimals and type errors while mapping. */
export class ReadCtx {
  amountCurrencies: InvoiceModel["amountCurrencies"] = [];
  decimals: InvoiceModel["decimals"] = [];
  typeErrors: InvoiceModel["typeErrors"] = [];

  loc(node: XNode): Loc {
    return { line: node.line, col: node.col, xpath: xpathOf(node) };
  }

  /** Read a string and remember its location under `key` */
  str(node: XNode | null | undefined, path: string, locs: LocMap, key: string): string | undefined {
    const n = path ? at(node, path) : node;
    if (!n) return undefined;
    const v = text(n);
    locs[key] = this.loc(n);
    return v;
  }

  attr(node: XNode | null | undefined, path: string, name: string): string | undefined {
    const n = path ? at(node, path) : node;
    const v = n?.attrs[name]?.trim();
    return v ? v : undefined;
  }

  num(
    node: XNode | null | undefined,
    path: string,
    locs: LocMap,
    key: string,
    bt: string,
    opts: { amount?: boolean } = {},
  ): number | undefined {
    const n = path ? at(node, path) : node;
    if (!n) return undefined;
    const loc = this.loc(n);
    locs[key] = loc;
    const raw = text(n);
    if (raw === undefined) return undefined;
    if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(raw)) {
      this.typeErrors.push({ bt, raw, expected: "a decimal number such as 1234.50", loc });
      return undefined;
    }
    if (opts.amount) {
      if (DECIMAL_BTS.has(bt)) this.decimals.push({ bt, raw, loc });
      const cur = n.attrs["currencyID"];
      this.amountCurrencies.push({ bt, currency: cur, loc });
    }
    return Number(raw);
  }

  /** ISO dates (UBL) */
  isoDate(node: XNode | null | undefined, path: string, locs: LocMap, key: string, bt: string) {
    const n = path ? at(node, path) : node;
    if (!n) return undefined;
    const loc = this.loc(n);
    locs[key] = loc;
    const raw = text(n);
    if (raw === undefined) return undefined;
    const m = /^(\d{4})-(\d{2})-(\d{2})(Z|[+-]\d{2}:\d{2})?$/.exec(raw);
    if (!m || !validYmd(m[1]!, m[2]!, m[3]!)) {
      this.typeErrors.push({ bt, raw, expected: "a date in YYYY-MM-DD format", loc });
      return undefined;
    }
    return `${m[1]}-${m[2]}-${m[3]}`;
  }

  /** CII udt:DateTimeString with format 102 (YYYYMMDD) */
  ciiDate(node: XNode | null | undefined, path: string, locs: LocMap, key: string, bt: string) {
    const holder = path ? at(node, path) : node;
    if (!holder) return undefined;
    const n =
      holder.children.find((c) => c.local === "DateTimeString" || c.local === "DateString") ??
      holder;
    const loc = this.loc(n);
    locs[key] = loc;
    const raw = text(n);
    if (raw === undefined) return undefined;
    const format = n.attrs["format"];
    const m = /^(\d{4})(\d{2})(\d{2})$/.exec(raw);
    if ((format && format !== "102") || !m || !validYmd(m[1]!, m[2]!, m[3]!)) {
      this.typeErrors.push({ bt, raw, expected: "a date in format 102 (YYYYMMDD)", loc });
      return undefined;
    }
    return `${m[1]}-${m[2]}-${m[3]}`;
  }
}

function validYmd(y: string, m: string, d: string) {
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return (
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() === Number(m) - 1 &&
    date.getUTCDate() === Number(d)
  );
}

export function collectEmptyElements(root: XNode, ctx: ReadCtx): Loc[] {
  const out: Loc[] = [];
  const visit = (n: XNode) => {
    if (n.children.length === 0 && n.text.trim() === "") out.push(ctx.loc(n));
    for (const c of n.children) visit(c);
  };
  visit(root);
  return out;
}
