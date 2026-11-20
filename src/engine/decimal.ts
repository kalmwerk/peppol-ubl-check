/**
 * Exact decimal arithmetic for the calculation rules.
 *
 * The official Schematron compares `xs:decimal` values, so a margin such as "less than 1.00"
 * must not be judged on binary floating point: 100.10 − 99.10 is 0.9999999999999858 as a
 * double but exactly 1.00 in the official check. Values are kept as exact fractions of
 * bigints; a JS number converts through its shortest decimal string, which is the text the
 * reader parsed it from.
 */
export interface Dec {
  /** numerator */
  readonly n: bigint;
  /** denominator, always > 0 */
  readonly d: bigint;
}

const ZERO_N = 0n;
const ONE = 1n;

function gcd(a: bigint, b: bigint): bigint {
  let x = a < ZERO_N ? -a : a;
  let y = b < ZERO_N ? -b : b;
  while (y !== ZERO_N) [x, y] = [y, x % y];
  return x === ZERO_N ? ONE : x;
}

function make(n: bigint, d: bigint): Dec {
  if (d < ZERO_N) [n, d] = [-n, -d];
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

export const ZERO: Dec = { n: 0n, d: 1n };

/** A JS number as an exact decimal (via its shortest round-trip string). Non-finite → 0. */
export function dec(x: number | undefined): Dec {
  if (x === undefined || !Number.isFinite(x)) return ZERO;
  const m = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(x));
  if (!m) return ZERO;
  const frac = m[3] ?? "";
  let n = BigInt(`${m[2]}${frac}`);
  let d = 10n ** BigInt(frac.length);
  const exp = Number(m[4] ?? 0);
  if (exp > 0) n *= 10n ** BigInt(exp);
  else if (exp < 0) d *= 10n ** BigInt(-exp);
  return make(m[1] ? -n : n, d);
}

export const add = (a: Dec, b: Dec): Dec => make(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Dec, b: Dec): Dec => make(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Dec, b: Dec): Dec => make(a.n * b.n, a.d * b.d);
/** a ÷ b; b must not be zero */
export const div = (a: Dec, b: Dec): Dec => make(a.n * b.d, a.d * b.n);
export const abs = (a: Dec): Dec => (a.n < ZERO_N ? { n: -a.n, d: a.d } : a);
export const neg = (a: Dec): Dec => ({ n: -a.n, d: a.d });
export const isZero = (a: Dec): boolean => a.n === ZERO_N;

/** −1, 0 or 1 */
export function cmp(a: Dec, b: Dec): number {
  const l = a.n * b.d;
  const r = b.n * a.d;
  return l < r ? -1 : l > r ? 1 : 0;
}
export const eq = (a: Dec, b: Dec): boolean => cmp(a, b) === 0;

/** floor(a) as an integer Dec */
function floor(a: Dec): Dec {
  let q = a.n / a.d; // truncates towards zero
  if (a.n < ZERO_N && q * a.d !== a.n) q -= ONE;
  return { n: q, d: ONE };
}

/** XPath fn:round: nearest integer, halves towards positive infinity (round(-2.5) = -2). */
export const round = (a: Dec): Dec => floor(add(a, { n: 1n, d: 2n }));

/** `round(x * 10 * 10) div 100`, the official way of rounding to two decimals */
export const round2 = (a: Dec): Dec => div(round(mul(a, { n: 100n, d: 1n })), { n: 100n, d: 1n });

/** Exact sum; missing values count as nothing, as `sum()` over absent elements does. */
export function total(values: (number | undefined)[]): Dec {
  return values.reduce<Dec>((acc, v) => (v === undefined ? acc : add(acc, dec(v))), ZERO);
}

/** For messages only. */
export const toNumber = (a: Dec): number => Number(a.n) / Number(a.d);

/** |a − b| < limit (the strict "−1 < … < +1" form of the EN 16931 Schematron) */
export const within = (a: Dec, b: Dec, limit: Dec): boolean => cmp(abs(sub(a, b)), limit) < 0;
/** |a − b| ≤ limit (Peppol's `u:slack`, and the CII form of BR-CO-17) */
export const withinOrEqual = (a: Dec, b: Dec, limit: Dec): boolean =>
  cmp(abs(sub(a, b)), limit) <= 0;

/**
 * The exact value of a JS number (an IEEE double). XPath arithmetic on an untyped value, such as the official
 * `xs:decimal(cbc:TaxableAmount - 1)`, is done in xs:double, and Saxon casts the double result to xs:decimal exactly:
 * 909.91 − 1 is the double 908.9099999999999681…, which is less than 908.91. Rules written that way compare this value,
 * not the shortest decimal string `dec()` reads. Non-finite → 0.
 */
export function exactDouble(x: number): Dec {
  if (!Number.isFinite(x) || x === 0) return ZERO;
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, x);
  const bits = view.getBigUint64(0);
  const negative = bits >> 63n === 1n;
  const biased = Number((bits >> 52n) & 0x7ffn);
  let mantissa = bits & 0xfffffffffffffn;
  let exp: number;
  if (biased === 0) exp = -1074;
  else {
    mantissa |= 1n << 52n;
    exp = biased - 1075;
  }
  const n = exp >= 0 ? mantissa << BigInt(exp) : mantissa;
  const d = exp >= 0 ? ONE : ONE << BigInt(-exp);
  return make(negative ? -n : n, d);
}

/**
 * The double nearest to `a`, as XPath promotes an xs:decimal to xs:double when it is compared with a double (the
 * official CII `ram:BasisAmount + 1 > (… sum …)`). Exact for terminating decimals (every sum of amounts as written).
 */
export function nearestDouble(a: Dec): number {
  let k = 0;
  let scale = ONE;
  while (k <= 1100 && scale % a.d !== ZERO_N) {
    scale *= 10n;
    k++;
  }
  if (scale % a.d !== ZERO_N) return Number(a.n) / Number(a.d);
  const digits = ((a.n < ZERO_N ? -a.n : a.n) * (scale / a.d)).toString().padStart(k + 1, "0");
  const text = k ? `${digits.slice(0, digits.length - k)}.${digits.slice(digits.length - k)}` : digits;
  return Number(a.n < ZERO_N ? `-${text}` : text);
}

export const ONE_UNIT: Dec = { n: 1n, d: 1n };
export const TWO_CENTS: Dec = { n: 2n, d: 100n };

/** XPath fn:round on an xs:double, as Saxon computes it: the nearest whole number, halves toward +∞. */
export function roundDouble(x: number): number {
  if (!Number.isFinite(x)) return x;
  const f = Math.floor(x);
  return x - f >= 0.5 ? f + 1 : f;
}

/** XPath fn:sum over untyped amounts: each read as an xs:double and added in document order, in xs:double. */
export function sumDoubles(values: (number | undefined)[]): number {
  let s = 0;
  for (const v of values) if (v !== undefined) s += v;
  return s;
}

/**
 * CEN 1.3.16's CII `round(sum(<amounts>) * 10 * 10) div 100` (BR-CO-11, -12, -14): the amounts aren't cast to
 * xs:decimal there, so the sum, the scaling and the rounding all happen in xs:double (1.3.17 casts each amount).
 */
export const round2Doubles = (values: (number | undefined)[]): number => roundDouble(sumDoubles(values) * 10 * 10) / 100;

/** An xs:decimal as written (optional sign, digits, optional fraction; surrounding whitespace collapsed), exactly. */
export function parseDecimal(raw: string): Dec | undefined {
  const m = /^[ \t\r\n]*([+-]?)(\d*)(?:\.(\d*))?[ \t\r\n]*$/.exec(raw);
  if (!m || (m[2] === "" && (m[3] ?? "") === "")) return undefined;
  const frac = m[3] ?? "";
  const n = BigInt(`${m[2] || "0"}${frac}`);
  return make(m[1] === "-" ? -n : n, 10n ** BigInt(frac.length));
}
