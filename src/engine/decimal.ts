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

export const ONE_UNIT: Dec = { n: 1n, d: 1n };
export const TWO_CENTS: Dec = { n: 2n, d: 100n };
