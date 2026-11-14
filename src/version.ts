// Names and links the Action, the CLI and their reports print.
// test/metadata.test.ts keeps VERSION equal to package.json and CHANGELOG.md.

export const TOOL_NAME = "peppol-ubl-check";
export const VERSION = "1.2.0";
export const REPO = "kalmwerk/peppol-ubl-check";

/** InvoiceVerify, the website this rule engine comes from. Only ever linked, never called. */
export const SITE_URL = "https://peppol-invoice-compass.lovable.app";
/** The website's validator: the same rules as a visual report, for one file at a time. */
export const VALIDATOR_URL = `${SITE_URL}/validate`;
/** This tool's page on the website. */
export const TOOL_PAGE_URL = `${SITE_URL}/tools/peppol-github-action`;
