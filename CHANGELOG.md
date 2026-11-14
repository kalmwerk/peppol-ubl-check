# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-11-14

Netherlands: the Dutch SI-UBL 2.0 (NLCIUS) rules.

### Added
- 30 SI-UBL 2.0 / NLCIUS rules from the Schematron of the Dutch Peppol Authority's validation artefacts 2.0.3.13 (SI-V20-INV-R000, BR-NL-1 … BR-NL-35 and SI-UBL-2), in UBL and CII, checked against the authority's MIT-licensed test set: KvK (0106) and OIN (0190) identifiers, buyer reference or order reference, addresses of Dutch sellers and buyers, payment means, credit-note references and the SI-UBL specification identifier.
- `profile: nlcius` (and `--profile nlcius`), and `auto` picks it for files that declare SI-UBL 2.0.
- The Peppol Netherlands rules NL-R-001 … NL-R-009 for Dutch suppliers in Peppol BIS invoices.
- BR-20 (tax representative country) and BR-52 (supporting-document reference) of EN 16931.
- SI-UBL 2.0 test invoices in `test/fixtures/nlcius/`.

### Changed
- 214 rules in total (was 173).

## [1.1.0] - 2026-11-12

XRechnung: every business rule of the XRechnung 3.0 CIUS.

### Added
- 19 XRechnung rules from the KoSIT Schematron for XRechnung 3.0.2, so all 32 CIUS rules are checked (BR-DE-1 … BR-DE-31, BR-DE-TMP-32): deliver-to city and post code (BR-DE-10/11), VAT rate in every breakdown (BR-DE-14), the Skonto syntax in the payment terms (BR-DE-18), IBANs for SEPA transfer and direct debit (BR-DE-19/20), unique attachment names (BR-DE-22), the payment-means groups for transfer, card and direct debit (BR-DE-23 … 25), corrected invoices without a preceding invoice (BR-DE-26), plausible seller phone and email (BR-DE-27/28), SEPA creditor ID and debited account (BR-DE-30/31) and a missing delivery date or period (BR-DE-TMP-32, info).
- Leitweg-ID check (IV-DE-01, warning): structure and check digits of a buyer reference or 0204 address written as a Leitweg-ID.
- XRechnung test invoices (UBL and CII) in `test/fixtures/xrechnung/`.

### Changed
- BR-DE-21 accepts the identifiers of the XRechnung Extension and CVD as well as the CIUS; BR-DE-16 also looks at the VAT breakdown and accepts a tax representative.
- 173 rules in total (was 153).

### Fixed
- `npm ci` failed with "Unsupported platform for @esbuild/aix-ppc64" because the lockfile marked vitest's esbuild platform packages as required; the lockfile is regenerated.

## [1.0.1] - 2026-11-12

Full source included in the release. The rules and the results are unchanged.

### Changed
- The download now holds `src/` (with the copied rule engine), the tests and their sample invoices, the CI and release workflows and the build script, next to `action.yml` and `dist/`, so it matches the repository and can be reviewed and rebuilt (`npm ci && npm run check`).

## [1.0.0] - 2026-11-12

First release: InvoiceVerify's rule engine as a GitHub Action and a command-line tool, offline.

### Added
- Checks UBL 2.1 / Peppol BIS Billing 3.0 invoices and credit notes matching a glob against 153 rules: 101 EN 16931, 28 Peppol BIS Billing 3.0, 13 XRechnung and 11 extra checks (syntax, tax ID and IBAN check digits, dates).
- Fails the job on errors (`fail-on: error`, `warning` or `never`).
- Job summary with one row per invoice and a table per invoice of rule ID, line, what's wrong and how to fix it, with links to each rule's explanation.
- Annotations on the file and line of each finding (up to 50).
- Optional JSON report (`json-file`) and outputs for the result and counts.
- Profiles: `peppol` (default), `auto`, `en16931` and `xrechnung`.
- XML files that aren't invoices are listed as skipped (`non-invoice: skip`), or reported as errors (`fail`).
- Command-line tool `dist/cli.js` with the same options, text or JSON output and exit codes 0, 1 and 2.
- No network access and no dependencies at run time.
