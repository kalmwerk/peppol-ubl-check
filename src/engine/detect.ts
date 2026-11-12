import {
  EN16931_ID,
  FACTURX_PROFILES,
  PEPPOL_CUSTOMIZATION_ID,
  XRECHNUNG_CUSTOMIZATION_PREFIX,
} from "./codes";
import { CII_NS } from "./read-cii";
import { UBL_CREDITNOTE_NS, UBL_INVOICE_NS } from "./read-ubl";
import { text, at, type XNode } from "./xml";

export type FormatId =
  | "peppol-bis-3"
  | "xrechnung-ubl"
  | "xrechnung-cii"
  | "ubl-en16931"
  | "ubl-generic"
  | "factur-x"
  | "cii-en16931"
  | "cii-generic"
  | "unknown";

export interface FormatInfo {
  id: FormatId;
  label: string;
  syntax: "UBL" | "CII" | "unknown";
  document: "Invoice" | "Credit note" | "Unknown";
  customizationId?: string;
  profileLabel?: string;
  /** Whether EN16931 business rules apply in full */
  en16931: boolean;
  peppol: boolean;
  rootNamespace?: string;
}

export function detectFormat(root: XNode): FormatInfo {
  const ns = root.ns;
  if (
    (root.local === "Invoice" && ns === UBL_INVOICE_NS) ||
    (root.local === "CreditNote" && ns === UBL_CREDITNOTE_NS)
  ) {
    const cid = text(root, "CustomizationID");
    const document = root.local === "Invoice" ? "Invoice" : "Credit note";
    const base = {
      syntax: "UBL" as const,
      document,
      customizationId: cid,
      rootNamespace: ns,
    } as const;
    if (cid === PEPPOL_CUSTOMIZATION_ID || cid?.startsWith(PEPPOL_CUSTOMIZATION_ID)) {
      return {
        ...base,
        id: "peppol-bis-3",
        label: "Peppol BIS Billing 3.0 (UBL 2.1)",
        en16931: true,
        peppol: true,
      };
    }
    if (cid?.startsWith(XRECHNUNG_CUSTOMIZATION_PREFIX)) {
      return {
        ...base,
        id: "xrechnung-ubl",
        label: "XRechnung 3.0 (UBL 2.1)",
        en16931: true,
        peppol: false,
      };
    }
    if (cid?.startsWith(EN16931_ID)) {
      return {
        ...base,
        id: "ubl-en16931",
        label: "UBL 2.1 · EN 16931",
        en16931: true,
        peppol: false,
      };
    }
    return { ...base, id: "ubl-generic", label: "UBL 2.1", en16931: true, peppol: false };
  }
  if (root.local === "CrossIndustryInvoice" && ns === CII_NS) {
    const cid = text(
      at(root, "ExchangedDocumentContext"),
      "GuidelineSpecifiedDocumentContextParameter/ID",
    );
    const typeCode = text(at(root, "ExchangedDocument"), "TypeCode");
    const document = typeCode === "381" ? "Credit note" : "Invoice";
    const base = {
      syntax: "CII" as const,
      document,
      customizationId: cid,
      rootNamespace: ns,
    } as const;
    if (cid?.startsWith(XRECHNUNG_CUSTOMIZATION_PREFIX)) {
      return {
        ...base,
        id: "xrechnung-cii",
        label: "XRechnung 3.0 (UN/CEFACT CII)",
        en16931: true,
        peppol: false,
      };
    }
    const profile = cid ? FACTURX_PROFILES[cid] : undefined;
    if (profile) {
      return {
        ...base,
        id: "factur-x",
        label: profile.label,
        profileLabel: profile.label,
        en16931: profile.en16931,
        peppol: false,
      };
    }
    if (cid?.startsWith(EN16931_ID)) {
      return {
        ...base,
        id: "cii-en16931",
        label: "UN/CEFACT CII · EN 16931",
        en16931: true,
        peppol: false,
      };
    }
    return {
      ...base,
      id: "cii-generic",
      label: "UN/CEFACT CII D16B",
      en16931: true,
      peppol: false,
    };
  }
  return {
    id: "unknown",
    label: root.local ? `Unsupported document <${root.name}>` : "Unknown",
    syntax: "unknown",
    document: "Unknown",
    en16931: false,
    peppol: false,
    rootNamespace: ns,
  };
}
