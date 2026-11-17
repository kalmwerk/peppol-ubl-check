# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.3] - 2026-11-17

No rule changes: the same verdicts as 1.3.2.

### Added
- A dated conformance statement at the top of this README, written by `npm run compare-official` with the numbers of its run, the official rule-set versions and links to their test files.
- `conformance.json`: that run's result (date, rule-set versions, test cases per source, verdicts compared, every difference, and every official rule the tests exercise that this tool doesn't check, by family).
- `npm run compare-official -- --check` writes nothing and fails when the committed result isn't what a fresh run finds; CI runs it on every push and pull request.
- `test/conformance.test.ts`: `conformance.json` belongs to the current engine, and the README says what it says.

## [1.3.2] - 2026-11-17

The official verdict on every official unit test of the rules this tool checks: 1,919 CEN 1.3.17 and Peppol BIS 3.0.22 test invoices, 929 expected verdicts, 0 different (`npm run compare-official`). 1.3.1 differed on 66 of them.

### Fixed
- BR-CO-15: the VAT total must be stated exactly once in the invoice currency; a second VAT total in that currency, or one in another currency only, is an error. In CII a grand total equal to the tax basis without a VAT total passes, as the official CII rule allows.
- BR-CO-19: an invoice period with only a period description code (BT-8) counts as an invoice period in UBL.
- BR-IC-11: an intra-community supply needs an actual delivery date or an invoice period with a start or end date; an empty period no longer counts.
- BR-CO-25 is not checked on credit notes, as in the official tests. On invoices it is a warning: EN 16931 still states it, but the official CEN rules stopped checking it in 1.3.16. Factur-X / ZUGFeRD keeps it as an error, because its own rules still check it.
- BR-AE-10 no longer warns about an exemption reason code other than VATEX-EU-AE: any code or text meets the rule.
- BR-VAT-01 (BR-Z-01, BR-E-01, BR-AE-01, BR-IC-01, BR-G-01, BR-O-01): exactly one VAT breakdown entry per category; two entries for one category are an error, and in CII so is an entry that no line, allowance or charge uses.
- PEPPOL-EN16931-R001, R003 and R061 ask for the element, as the official rules do: an empty ProfileID, buyer reference, order reference or mandate ID passes them (R008 still reports empty elements).
- R043 also checks line-level allowances and charges; R044 accepts only the literal `false` at price level; R051 covers every amount it lists, including the line price, and leaves a VAT total in the accounting currency alone; R053 needs exactly one VAT total with a breakdown, so none fails too.
- P0100 and P0101 only apply under an approved Peppol business process, as officially.
- CL008 checks every `EndpointID` with a `schemeID`, wherever it sits; COMMON-R040 (GLN) and COMMON-R043 (Belgian enterprise number) check every identifier with that scheme, not only the seller's and buyer's.

### Added
- Peppol BIS Billing 3.0 on CII, from OpenPeppol's CII rules: CII files that declare Peppol BIS 3.0 are recognised as "Peppol BIS Billing 3.0 (CII)" and get the Peppol rules that exist for CII, including the Dutch NL-R-001 … 009. The UBL-only rules (R008, R044, R046, R051, P0101) don't run on CII.
- `npm run compare-official` (`scripts/compare-official-tests.mjs`): downloads the official CEN and Peppol unit tests and compares every verdict; `--list-uncovered` lists the 177 rules they exercise that this tool doesn't check.
- `test/official-peppol.test.ts`: the Peppol cases above, restated in our own invoices (the Peppol test files may not be redistributed), and the CEN unit tests for BR-CO-19, BR-IC-11, BR-AE-10, BR-CO-25 on credit notes and the BR-*-01 rules in `test/fixtures/en16931-cen/`.

### Changed
- With `profile: peppol` (the default), CII files other than Factur-X / ZUGFeRD, XRechnung and SI-UBL 2.0 are checked as Peppol too, like UBL files; those three keep their own rules.
- The README lists the deliberate differences from the official rules.

## [1.3.1] - 2026-11-17

Calculation margins exactly as in the official Schematron.

### Fixed
- BR-S-08 in UBL accepts a difference of less than 1.00 per VAT rate, as CEN's UBL Schematron does; it flagged any difference from 0.01. In CII it stays exact, with each sum rounded to the cent first, as CEN's CII Schematron requires. The other VAT categories' taxable-amount rules (reported as BR-VAT-08) follow their own official margins: exact in UBL except categories L and M (less than 1.00), less than 1.00 in CII for Z, E, AE, K and G.
- BR-S-08 and BR-VAT-08 check every VAT breakdown entry, as the official rules do, so a standard-rate entry whose rate no line, allowance or charge uses is reported.
- BR-CO-17 compares the size of the VAT amount with the rounded size of taxable amount × rate, as the official rule does: in CII a difference of exactly 1.00 now passes (the official CII rule allows it), in UBL it still fails. Negative amounts round like the official check (−13.775 → −13.77), and at a 0 % rate the VAT amount must round to 0. The "within the ±1.00 tolerance but not correctly rounded" warning is gone: the official rule has no such warning.
- PEPPOL-EN16931-R040 and R120 allow a difference of up to 0.02 inclusive, judged exactly (1.02 against 1.00 failed through floating point). R040 compares with the unrounded base × percentage; R120 counts a missing quantity as 1, a missing price or line amount as 0, and a missing or zero base quantity as 1, as the official rule does.
- PEPPOL-EN16931-R046 (net price = gross price − price discount) is compared exactly, without a margin.
- BR-CO-10 … BR-CO-16 are compared in exact decimals, with the rounding each official rule applies; BR-CO-16 in UBL rounds both sides when a prepaid or rounding amount is present.
- The package description named an old rule count.

### Added
- `test/official-margins.test.ts` runs the CEN unit tests for BR-S-08, the other categories' -08 rules and BR-CO-10 … BR-CO-17 (UBL invoices, credit notes and CII; EUPL-1.2, in `test/fixtures/en16931-cen/`), plus boundary cases for each margin.

## [1.3.0] - 2026-11-16

Official code lists: units, MIME types, legal-ID and endpoint schemes, business processes.

### Added
- BR-CL-23: a unit code (BT-130, BT-150) that is not on the full UN/ECE Recommendation 20/21 list of the CEN validation artefacts 1.3.17 is an error.
- BR-CL-24 and PEPPOL-EN16931-CL001: the MIME code of an embedded attachment must be one of the six codes EN 16931 and Peppol allow (PDF, PNG, JPEG, CSV, XLSX, ODS).
- BR-CL-11: the schemeID of a legal registration number must be an ISO/IEC 6523 ICD code.
- PEPPOL-EN16931-CL008: Peppol's own, shorter list of electronic address schemes (Peppol BIS Billing 3.0.22); `EM` (e-mail) and other schemes EN 16931 still accepts are rejected in Peppol.
- PEPPOL-EN16931-P0112: invoice type codes 326, 384 and 389 only between two German parties (384 also between two Slovak parties).
- BR-E-02 and BR-Z-02: exempt and zero-rated lines need a seller VAT number, tax registration number or tax representative.

### Changed
- PEPPOL-EN16931-R007 accepts exactly the four business processes Peppol BIS Billing 3.0.22 approves (billing 01, billing with response and the two French reform processes) instead of any `billing:NN:1.0`.
- PEPPOL-EN16931-R004 also flags a CustomizationID with an empty segment (`::`), and files whose CustomizationID merely contains the Peppol billing identifier are checked as Peppol, so R004 explains them.
- Peppol invoice and credit-note type codes follow Peppol BIS Billing 3.0.22 (P0100/P0101): 326 and 384 are invoice codes, 261, 262, 296, 308, 420 and 458 are no longer credit-note codes.
- BR-CO-09 compares the VAT prefix case-sensitively and accepts EL, XI and 1A besides ISO country codes.
- Files that declare an older XRechnung version are checked as XRechnung, so BR-DE-21 names the version to use.
- 222 rules in total (was 214).

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
