// Types for build.mjs, so TypeScript callers (the InvoiceVerify site's checks) can import it.
export interface BundleOutput {
  entry: string;
  out: string;
  shebang: boolean;
  what: string;
}
export const OUTPUTS: BundleOutput[];
export function bundleOne(output: BundleOutput): string;
export function bundle(): { out: string; code: string }[];
