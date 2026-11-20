// What KoSIT's validator configuration for XRechnung (release 2026-08-31, XRechnung 3.0.2, the configuration German
// recipients and the KoSIT validator run) changes on top of the Schematron files: per scenario, the official rules
// whose level it sets with <customLevel> in scenarios.xml. It runs CEN 1.3.16 (as Peppol BIS 3.0.22 does) and
// XRechnung Schematron 2.6.0. The scenario is picked by the exact specification identifier, so the Extension and CVD
// identifiers get their own levels (their own BR-DEX / BR-DE-CVD rules are not checked here; the pages say so).
//
// The warning-level CEN syntax rules KoSIT raises to errors (KOSIT_RAISED) are implemented in syntax-binding.ts and
// run only with the XRechnung rules; elsewhere they are CEN warnings, which the checker doesn't report.
// scripts/compare-multi-error-invoices.ts reads the levels from the official scenarios.xml itself, so a table that
// drifts from KoSIT's shows up as differences. Pure: no imports beyond types.
import type { FormatInfo } from "./detect";

export const KOSIT_CONFIG_RELEASE = "2026-08-31";
export const KOSIT_CONFIG_URL = "https://github.com/itplr-kosit/validator-configuration-xrechnung/releases/tag/v2026-08-31";

type Level = "error" | "warning" | "info";
export type KositScenario =
  | "ubl-invoice"
  | "ubl-invoice-extension"
  | "ubl-invoice-cvd"
  | "ubl-creditnote"
  | "ubl-creditnote-cvd"
  | "cii"
  | "cii-extension"
  | "cii-cvd";

const CIUS = "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0";
const EXTENSION = `${CIUS}#conformant#urn:xeinkauf.de:kosit:extension:xrechnung_3.0`;
const CVD = `${CIUS}#compliant#urn:xeinkauf.de:kosit:xrechnung:cvd_0.9`;

/** Warnings in CEN that KoSIT makes errors in some scenarios: checked only with the XRechnung rules. */
export const KOSIT_RAISED: ReadonlySet<string> = new Set(["UBL-CR-646", "CII-SR-452", "CII-SR-453", "CII-SR-454", "CII-SR-465", "CII-SR-466"]);

const CII_RAISED: Record<string, Level> = { "CII-SR-452": "error", "CII-SR-453": "error", "CII-SR-454": "error", "CII-SR-465": "error", "CII-SR-466": "error", "CII-SR-475": "info", "CII-SR-476": "info" };
const CODE_LISTS: Record<string, Level> = { "BR-CL-21": "warning", "BR-CL-23": "warning" };
const EXTENSION_LISTS: Record<string, Level> = { "BR-CL-10": "info", "BR-CL-11": "info", "BR-CL-21": "info", "BR-CL-23": "warning", "BR-CL-24": "info", "BR-CL-25": "info", "BR-CL-26": "info" };

/** scenarios.xml's <customLevel> entries, per scenario. */
export const KOSIT_LEVELS: Record<KositScenario, Readonly<Record<string, Level>>> = {
  "ubl-invoice": { ...CODE_LISTS, "UBL-CR-646": "error" },
  "ubl-invoice-extension": { ...EXTENSION_LISTS, "BR-CO-16": "info", "UBL-CR-470": "info", "UBL-CR-646": "info" },
  "ubl-invoice-cvd": { ...CODE_LISTS, "BR-CL-13": "info", "UBL-CR-646": "error" },
  "ubl-creditnote": { ...CODE_LISTS },
  "ubl-creditnote-cvd": { ...CODE_LISTS, "BR-CL-13": "info", "UBL-CR-646": "error" },
  cii: { ...CODE_LISTS, ...CII_RAISED },
  "cii-extension": { ...EXTENSION_LISTS, ...CII_RAISED },
  "cii-cvd": { ...CODE_LISTS, "BR-CL-13": "info", ...CII_RAISED },
};

/**
 * KoSIT's scenario for a document checked with the XRechnung rules. A specification identifier KoSIT has no scenario
 * for (an older XRechnung, a typo; KoSIT rejects those outright, and BR-DE-21 reports it here) gets the plain CIUS
 * levels of its syntax, as does an Extension credit note, for which KoSIT has no scenario either.
 */
export function kositScenario(format: Pick<FormatInfo, "syntax" | "document" | "customizationId">): KositScenario {
  const id = format.customizationId;
  if (format.syntax === "CII") return id === EXTENSION ? "cii-extension" : id === CVD ? "cii-cvd" : "cii";
  if (format.document === "Credit note") return id === CVD ? "ubl-creditnote-cvd" : "ubl-creditnote";
  return id === EXTENSION ? "ubl-invoice-extension" : id === CVD ? "ubl-invoice-cvd" : "ubl-invoice";
}

/**
 * The scenario KoSIT itself picks: the one whose specification identifier equals one of the document's exactly (UBL:
 * any cbc:CustomizationID of the root, CII: any GuidelineSpecifiedDocumentContextParameter/ram:ID, as written), or
 * null when none does. KoSIT then rejects the invoice without running a rule (its default report: "no scenario
 * matched" is a reject); IV-DE-02 reports that.
 */
export function kositExactScenario(syntax: "UBL" | "CII", document: FormatInfo["document"], specIds: readonly string[]): KositScenario | null {
  const has = (id: string) => specIds.includes(id);
  if (syntax === "CII") return has(CIUS) ? "cii" : has(EXTENSION) ? "cii-extension" : has(CVD) ? "cii-cvd" : null;
  if (document === "Credit note") return has(CIUS) ? "ubl-creditnote" : has(CVD) ? "ubl-creditnote-cvd" : null;
  return has(CIUS) ? "ubl-invoice" : has(EXTENSION) ? "ubl-invoice-extension" : has(CVD) ? "ubl-invoice-cvd" : null;
}
/** The specification identifiers KoSIT has scenarios for, for messages */
export const KOSIT_SPEC_IDS = { cius: CIUS, extension: EXTENSION, cvd: CVD } as const;

/**
 * The level KoSIT gives a rule in a scenario, or undefined for the Schematron's own. A raised rule outside the
 * scenarios that raise it keeps CEN's level, a warning.
 */
export function kositLevel(ruleId: string, scenario: KositScenario): Level | undefined {
  return KOSIT_LEVELS[scenario][ruleId] ?? (KOSIT_RAISED.has(ruleId) ? "warning" : undefined);
}
