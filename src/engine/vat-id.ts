/**
 * EU VAT identification number checks: normalisation, per-country format and,
 * where the public algorithm is well documented, check-digit verification.
 */

export type VatCheckStatus = "valid" | "invalid_format" | "invalid_checksum" | "unknown_country";

export interface VatCheckResult {
  input: string;
  normalized: string;
  country: string;
  number: string;
  status: VatCheckStatus;
  formatOk: boolean;
  /** true / false when we can verify the check digit, null when no public algorithm is applied */
  checksumOk: boolean | null;
  pattern?: string;
  example?: string;
  message: string;
}

interface CountryRule {
  name: string;
  re: RegExp;
  pattern: string;
  example: string;
  checksum?: (n: string) => boolean;
}

const dg = (s: string, i: number) => Number(s[i]);

function mod11_10(n: string): boolean {
  // ISO 7064 MOD 11,10 — used by DE and HR
  let p = 10;
  for (let i = 0; i < n.length - 1; i++) {
    let s = (dg(n, i) + p) % 10;
    if (s === 0) s = 10;
    p = (2 * s) % 11;
  }
  let check = 11 - p;
  if (check === 10) check = 0;
  return check === dg(n, n.length - 1);
}

function luhn(n: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let v = Number(n[i]);
    if (dbl) {
      v *= 2;
      if (v > 9) v -= 9;
    }
    sum += v;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function weighted(n: string, weights: number[]): number {
  let s = 0;
  weights.forEach((w, i) => {
    s += dg(n, i) * w;
  });
  return s;
}

function mod97(numeric: string): number {
  let r = 0;
  for (const ch of numeric) r = (r * 10 + Number(ch)) % 97;
  return r;
}

const RULES: Record<string, CountryRule> = {
  AT: {
    name: "Austria",
    re: /^U\d{8}$/,
    pattern: "ATU + 8 digits",
    example: "ATU13585627",
    checksum: (n) => {
      const d = n.slice(1);
      let r = 0;
      for (let i = 0; i < 7; i++) {
        if (i % 2 === 0) r += dg(d, i);
        else {
          const x = dg(d, i) * 2;
          r += x > 9 ? x - 9 : x;
        }
      }
      return (10 - ((r + 4) % 10)) % 10 === dg(d, 7);
    },
  },
  BE: {
    name: "Belgium",
    re: /^[01]\d{9}$/,
    pattern: "BE + 10 digits starting with 0 or 1",
    example: "BE0477472701",
    checksum: (n) => 97 - (Number(n.slice(0, 8)) % 97) === Number(n.slice(8)),
  },
  BG: {
    name: "Bulgaria",
    re: /^\d{9,10}$/,
    pattern: "BG + 9 or 10 digits",
    example: "BG175074752",
  },
  CY: {
    name: "Cyprus",
    re: /^\d{8}[A-Z]$/,
    pattern: "CY + 8 digits + 1 letter",
    example: "CY10259033P",
  },
  CZ: {
    name: "Czechia",
    re: /^\d{8,10}$/,
    pattern: "CZ + 8, 9 or 10 digits",
    example: "CZ25123891",
  },
  DE: {
    name: "Germany",
    re: /^\d{9}$/,
    pattern: "DE + 9 digits",
    example: "DE136695976",
    checksum: mod11_10,
  },
  DK: {
    name: "Denmark",
    re: /^\d{8}$/,
    pattern: "DK + 8 digits",
    example: "DK13585628",
    checksum: (n) => weighted(n, [2, 7, 6, 5, 4, 3, 2, 1]) % 11 === 0,
  },
  EE: { name: "Estonia", re: /^\d{9}$/, pattern: "EE + 9 digits", example: "EE100931558" },
  EL: {
    name: "Greece",
    re: /^\d{9}$/,
    pattern: "EL + 9 digits (Greece uses EL, not GR)",
    example: "EL094259216",
    checksum: (n) => {
      const s = weighted(n, [256, 128, 64, 32, 16, 8, 4, 2]);
      return (s % 11) % 10 === Number(n[8]);
    },
  },
  ES: {
    name: "Spain",
    re: /^[A-Z0-9]\d{7}[A-Z0-9]$/,
    pattern: "ES + letter/digit + 7 digits + letter/digit",
    example: "ESA28015865",
  },
  FI: {
    name: "Finland",
    re: /^\d{8}$/,
    pattern: "FI + 8 digits",
    example: "FI20774740",
    checksum: (n) => {
      const r = weighted(n, [7, 9, 10, 5, 8, 4, 2]) % 11;
      if (r === 1) return false;
      return (r === 0 ? 0 : 11 - r) === Number(n[7]);
    },
  },
  FR: {
    name: "France",
    re: /^[0-9A-HJ-NP-Z]{2}\d{9}$/,
    pattern: "FR + 2 key characters + 9-digit SIREN",
    example: "FR40303265045",
    checksum: (n) => {
      const key = n.slice(0, 2);
      if (!/^\d{2}$/.test(key)) return true; // alphanumeric keys use a different, rarely published scheme
      const siren = Number(n.slice(2));
      return (12 + 3 * (siren % 97)) % 97 === Number(key);
    },
  },
  HR: {
    name: "Croatia",
    re: /^\d{11}$/,
    pattern: "HR + 11 digits",
    example: "HR33392005961",
    checksum: mod11_10,
  },
  HU: { name: "Hungary", re: /^\d{8}$/, pattern: "HU + 8 digits", example: "HU12892312" },
  IE: {
    name: "Ireland",
    re: /^(\d{7}[A-W][A-IW]?|\d[A-Z+*]\d{5}[A-W])$/,
    pattern: "IE + 7 digits + 1–2 letters",
    example: "IE6388047V",
  },
  IT: {
    name: "Italy",
    re: /^\d{11}$/,
    pattern: "IT + 11 digits",
    example: "IT00743110157",
    checksum: luhn,
  },
  LT: {
    name: "Lithuania",
    re: /^(\d{9}|\d{12})$/,
    pattern: "LT + 9 or 12 digits",
    example: "LT119511515",
  },
  LU: {
    name: "Luxembourg",
    re: /^\d{8}$/,
    pattern: "LU + 8 digits",
    example: "LU15027442",
    checksum: (n) => Number(n.slice(0, 6)) % 89 === Number(n.slice(6)),
  },
  LV: { name: "Latvia", re: /^\d{11}$/, pattern: "LV + 11 digits", example: "LV40003521600" },
  MT: { name: "Malta", re: /^\d{8}$/, pattern: "MT + 8 digits", example: "MT11679112" },
  NL: {
    name: "Netherlands",
    re: /^\d{9}B\d{2}$/,
    pattern: "NL + 9 digits + B + 2 digits",
    example: "NL123456782B01",
    checksum: (n) => {
      const nine = n.slice(0, 9);
      const s = weighted(nine, [9, 8, 7, 6, 5, 4, 3, 2]) - dg(nine, 8);
      if (s % 11 === 0) return true;
      // Since 2020 sole-trader numbers use ISO 7064 MOD 97-10 over "NL" + number
      const numeric = ("NL" + n)
        .split("")
        .map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c))
        .join("");
      return mod97(numeric) === 1;
    },
  },
  PL: {
    name: "Poland",
    re: /^\d{10}$/,
    pattern: "PL + 10 digits",
    example: "PL5260250995",
    checksum: (n) => {
      const r = weighted(n, [6, 5, 7, 2, 3, 4, 5, 6, 7]) % 11;
      return r !== 10 && r === Number(n[9]);
    },
  },
  PT: {
    name: "Portugal",
    re: /^\d{9}$/,
    pattern: "PT + 9 digits",
    example: "PT501964843",
    checksum: (n) => {
      let r = 11 - (weighted(n, [9, 8, 7, 6, 5, 4, 3, 2]) % 11);
      if (r >= 10) r = 0;
      return r === Number(n[8]);
    },
  },
  RO: { name: "Romania", re: /^\d{2,10}$/, pattern: "RO + 2 to 10 digits", example: "RO18547290" },
  SE: {
    name: "Sweden",
    re: /^\d{10}01$/,
    pattern: "SE + 10 digits + 01",
    example: "SE556188840401",
    checksum: (n) => luhn(n.slice(0, 10)),
  },
  SI: {
    name: "Slovenia",
    re: /^[1-9]\d{7}$/,
    pattern: "SI + 8 digits",
    example: "SI50223054",
    checksum: (n) => {
      const r = 11 - (weighted(n, [8, 7, 6, 5, 4, 3, 2]) % 11);
      if (r === 11) return false;
      return (r === 10 ? 0 : r) === Number(n[7]);
    },
  },
  SK: {
    name: "Slovakia",
    re: /^[1-9]\d{9}$/,
    pattern: "SK + 10 digits",
    example: "SK2022749619",
    checksum: (n) => Number(n) % 11 === 0,
  },
  XI: {
    name: "Northern Ireland",
    re: /^(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/,
    pattern: "XI + 9 or 12 digits",
    example: "XI980780684",
  },
  GB: {
    name: "United Kingdom",
    re: /^(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/,
    pattern: "GB + 9 or 12 digits",
    example: "GB980780684",
  },
  CH: {
    name: "Switzerland",
    re: /^E\d{9}(MWST|TVA|IVA)?$/,
    pattern: "CHE + 9 digits (+ MWST/TVA/IVA)",
    example: "CHE116281710MWST",
  },
  NO: {
    name: "Norway",
    re: /^\d{9}(MVA)?$/,
    pattern: "NO + 9 digits + MVA",
    example: "NO974760673MVA",
  },
};

export const VAT_COUNTRIES = Object.entries(RULES).map(([code, r]) => ({
  code,
  name: r.name,
  pattern: r.pattern,
  example: r.example,
  hasChecksum: Boolean(r.checksum),
}));

export const VIES_COUNTRIES = new Set([
  "AT",
  "BE",
  "BG",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "EL",
  "ES",
  "FI",
  "FR",
  "HR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
  "XI",
]);

export function normalizeVatId(input: string): string {
  return input.toUpperCase().replace(/[\s.\-_/]/g, "");
}

export function checkVatId(input: string): VatCheckResult {
  const normalized = normalizeVatId(input);
  let country = normalized.slice(0, 2);
  const number = normalized.slice(2);
  const base = { input, normalized, country, number };

  if (country === "GR") {
    return {
      ...base,
      status: "invalid_format",
      formatOk: false,
      checksumOk: null,
      pattern: RULES["EL"]?.pattern,
      example: RULES["EL"]?.example,
      message: "Greek VAT numbers use the prefix EL, not GR.",
    };
  }
  if (!/^[A-Z]{2}$/.test(country)) {
    country = "";
    return {
      ...base,
      country,
      status: "unknown_country",
      formatOk: false,
      checksumOk: null,
      message: "A VAT number must start with a two-letter country prefix, e.g. DE or NL.",
    };
  }
  const rule = RULES[country];
  if (!rule) {
    return {
      ...base,
      status: "unknown_country",
      formatOk: false,
      checksumOk: null,
      message: `No VAT number format is registered for prefix ${country}.`,
    };
  }
  if (!rule.re.test(number)) {
    return {
      ...base,
      status: "invalid_format",
      formatOk: false,
      checksumOk: null,
      pattern: rule.pattern,
      example: rule.example,
      message: `Does not match the ${rule.name} format (${rule.pattern}).`,
    };
  }
  if (rule.checksum) {
    const ok = rule.checksum(number);
    return {
      ...base,
      status: ok ? "valid" : "invalid_checksum",
      formatOk: true,
      checksumOk: ok,
      pattern: rule.pattern,
      example: rule.example,
      message: ok
        ? `Format and check digit are valid for ${rule.name}.`
        : `Format is correct but the check digit does not match the ${rule.name} algorithm — likely a typo.`,
    };
  }
  return {
    ...base,
    status: "valid",
    formatOk: true,
    checksumOk: null,
    pattern: rule.pattern,
    example: rule.example,
    message: `Format is valid for ${rule.name}. Check digits are not publicly specified for this country.`,
  };
}

export function vatCountryName(code: string): string | undefined {
  return RULES[code]?.name;
}

/** IBAN mod-97 check */
export function checkIban(input: string): boolean {
  const iban = input.toUpperCase().replace(/\s/g, "");
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged
    .split("")
    .map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c))
    .join("");
  return mod97(numeric) === 1;
}

/** GS1 GLN check digit (13 digits) */
export function checkGln(gln: string): boolean {
  if (!/^\d{13}$/.test(gln)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += dg(gln, i) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10 === dg(gln, 12);
}

/** Belgian enterprise number (KBO/BCE, scheme 0208) */
export function checkBelgianEnterprise(id: string): boolean {
  const n = id.replace(/\D/g, "");
  if (!/^[01]\d{9}$/.test(n)) return false;
  return 97 - (Number(n.slice(0, 8)) % 97) === Number(n.slice(8));
}

/**
 * The exact Peppol test behind PEPPOL-COMMON-R043 for any identifier with scheme
 * 0208: after trimming, exactly 10 digits (no BE prefix, dots or spaces) and
 * the last two digits equal 97 − (first eight mod 97).
 */
export function isPeppol0208(id: string): boolean {
  const n = id.trim();
  if (!/^[0-9]{10}$/.test(n)) return false;
  return 97 - (Number(n.slice(0, 8)) % 97) === Number(n.slice(8));
}
