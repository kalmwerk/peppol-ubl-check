import { FACTURX_BASIC_WL_RULES, FACTURX_BR_CO_25_PROFILES, FACTURX_MINIMUM_RULES } from "./facturx-profile-rules";

/**
 * Which FeRD Factur-X / ZUGFeRD profile a guideline ID (BT-24) declares, for the rules that differ per profile:
 * Factur-X 1.0 and ZUGFeRD 2.x spellings, as written (the guideline ID is matched exactly, as FACTURX_PROFILES does).
 */
export type FacturXProfile = "MINIMUM" | "BASIC-WL" | "BASIC" | "EN16931" | "EXTENDED";
const PROFILE_OF: Record<string, FacturXProfile> = {
  "urn:factur-x.eu:1p0:minimum": "MINIMUM",
  "urn:zugferd.de:2p0:minimum": "MINIMUM",
  "urn:factur-x.eu:1p0:basicwl": "BASIC-WL",
  "urn:zugferd.de:2p0:basicwl": "BASIC-WL",
  "urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic": "BASIC",
  "urn:cen.eu:en16931:2017#compliant#urn:zugferd.de:2p0:basic": "BASIC",
  "urn:cen.eu:en16931:2017": "EN16931",
  "urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended": "EXTENDED",
  "urn:cen.eu:en16931:2017#conformant#urn:zugferd.de:2p0:extended": "EXTENDED",
};
export const facturXProfile = (guidelineId: string | undefined): FacturXProfile | undefined => (guidelineId ? PROFILE_OF[guidelineId] : undefined);
export const isFacturXExtended = (guidelineId: string | undefined) => {
  const p = facturXProfile(guidelineId);
  return !!p && FACTURX_BR_CO_25_PROFILES.includes(p);
};
/** The rules a profile that isn't EN 16931 compliant runs (MINIMUM, BASIC WL), or undefined: the full EN 16931 set */
export function facturXSubset(guidelineId: string | undefined): ReadonlySet<string> | undefined {
  const p = facturXProfile(guidelineId);
  return p === "MINIMUM" ? FACTURX_MINIMUM_RULES : p === "BASIC-WL" ? FACTURX_BASIC_WL_RULES : undefined;
}
