# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-11-20

Each rule set is now checked against the exact official files it is published as, including on invoices with several mistakes at once, and CEN's syntax-binding rules are checked too: 180 new rules, 512 in total. Peppol BIS Billing 3.0.22 ships its own copy of CEN EN 16931 1.3.16, not 1.3.17, and so do KoSIT's XRechnung validator configuration (release 2026-08-31, what German recipients run) and the Dutch SI-UBL 2.0 / NLCIUS files (2026-05-21); plain EN 16931 runs CEN 1.3.17 from its release tag. Seeded corpora with 2–8 faults per invoice, and with every element repeated once plus a fault in either copy, were checked under Saxon-HE with each stack: 8,039 + 3,467 Peppol invoices (also against the Peppol BIS 3.1.0 draft, which only the website runs), 1,451 + 4,810 EN 16931, 1,551 + 904 SI-UBL / NLCIUS and 1,399 + 733 XRechnung, with 0 rule and 0 verdict differences on the rules this tool checks, apart from the documented ones. `test/multi-error-families.test.ts` replays 1,799 of them, rebuilt from the stored bases, in CI; the official unit tests still give 0 differences.

What that comparison leaves out, by design: the deliberate differences and own checks listed in the README, and official rules this tool doesn't check. So the overall pass/fail can still differ there: mostly an invoice failing here on IV-VAT-01 alone (a VAT number in the wrong format, which the official files let through), now and then one failing in the official files only on a Danish or Swedish national rule. Factur-X / ZUGFeRD XML keeps CEN's EN 16931 rules, not FeRD's own Schematron, which also checks the structure each profile allows; see the README.

### Added
- CEN's syntax-binding rules (179): the blocking UBL-SR, CII-SR and data-type (CII-DT) rules and the two UBL-CR rules CEN marks fatal, which say where each business term may appear and how often, plus six warning-level notes (UBL-CR-646, CII-SR-452, 453, 454, 465, 466) that KoSIT raises to errors for XRechnung. They run in every profile, in the CEN version the profile's files ship. If your invoices repeat an element EN 16931 allows once, this release can report errors that 1.5.3 didn't.
- IV-DE-02 (error, `xrechnung`): KoSIT's validator picks its scenario by the exact specification identifier and rejects an invoice none matches (an older XRechnung version, a space around the identifier, an Extension identifier on a credit note) without running any rule; this check stands for that rejection, so the verdict is KoSIT's.
- `test/multi-error-families.test.ts` and its fixtures (`test/fixtures/schematron-parity/repeated/`, `national-multi/`).

### Changed
- `peppol` checks with CEN 1.3.16, the copy Peppol BIS 3.0.22 ships: its code lists (Greek VAT numbers may start with EL, BR-CO-09), its syntax rules, its IGIC / IPSI rule names and its CII totals comparison (xs:double). `xrechnung` and `nlcius` use 1.3.16 too; `en16931` stays on 1.3.17.
- `xrechnung` applies the levels KoSIT's validator configuration sets per scenario (invoice, credit note, Extension, CVD; UBL and CII): CII-SR-475 / 476 are notes, BR-CL-21 / 23 warnings in the plain and CVD scenarios, and UBL-CR-646, CII-SR-452, 453, 454, 465 and 466 errors.
- Factur-X / ZUGFeRD MINIMUM and BASIC WL, which aren't EN 16931 compliant, get only the EN 16931 rules FeRD's official Factur-X 1.09 / ZUGFeRD 2.5 Schematron includes for the profile (BASIC WL: VAT breakdown included), so a valid MINIMUM invoice no longer fails BR-10, BR-11, BR-12 or BR-CO-13. Choosing `en16931`, `xrechnung` or `nlcius` checks them against all of EN 16931, lines and VAT included, as those official files do; before, that choice skipped the line and VAT rules on these two profiles.
- BR-CO-25 is an error only for Factur-X / ZUGFeRD EXTENDED, the one profile FeRD's 1.09 files still check it for; elsewhere it is the warning it is for other invoices.
- The rule count in the summary, the CLI help and the README names the CEN syntax rules apart from the EN 16931 business rules.

## [1.5.3] - 2026-11-20

Verdicts now match the official files on invoices with several mistakes at once, too. 36,273 invoices with 2–8 faults each, drawn from four seeded random sequences (the Peppol BIS examples and the website's samples, in UBL and CII), were checked with the official CEN EN 16931 1.3.17 and Peppol BIS Billing 3.0.22 Schematron under Saxon-HE: 768 of them got a different finding for at least one rule and 7 a different overall verdict. Now none do. Most came from a rule running where the official one has no context (a tax scheme or TypeCode that isn't VAT, a repeated group whose first copy lacks the element), which an invoice with a single mistake can't show. 1,143 of those invoices, rebuilt from the seed by `test/multi-error-parity.test.ts`, and 21 new edge cases, most with two changes, now hold the checker to the recorded official verdicts; the official unit tests still give 0 differences. No rules were added or removed.

### Fixed
- VAT category rules run only where the official context matches. On UBL, BR-S-08, BR-S-09 and the other categories' -08 rules (BR-VAT-08 here) check a VAT breakdown row only under tax scheme VAT, as do BR-IC-11 and BR-IC-12; on CII, the rows' TypeCode decides as each official rule asks, and the IGIC and IPSI rows (categories L and M) never fail BR-IG-08 / BR-IP-08, which read the rate from a parent that has none.
- BR-CO-14 compares each UBL TaxTotal with its own TaxSubtotals, so a repeated TaxTotal no longer fails it (Peppol's R053 still does).
- Repeated groups are read the way the official rules read them: every ClassifiedTaxCategory of a UBL line and every ApplicableTradeTax of a CII line (BR-CO-04 finds the VAT one, the category rules such as BR-S-05 and BR-E-05 check each, BR-E-01 and the like count each use), every CategoryTradeTax of a CII allowance or charge (BR-32, BR-S-06 …), every InvoicePeriod of a UBL line (BR-CO-20, BR-30, R110, R111) and every URIUniversalCommunication of a CII seller or buyer (PEPPOL-EN16931-R010, R020 and CL008).
- PEPPOL-EN16931-R120 sums only line allowances and charges whose indicator reads `true` or `false` (a `1` or `0` is neither) and, on CII, every ActualAmount of each, rounding each sum to cents as the official test does.
- PEPPOL-EN16931-R110 and R111 on CII compare the line and invoice period DateTimeStrings as written, as the official file does, so a date written another way or left empty fails there; BR-CO-20 on CII only asks that a start or end date element is there, whatever it holds.
- CII decimals (BR-DEC) of allowance and charge amounts are only checked under an indicator written exactly `true` or `false`, the official context (`1` or `true ` isn't).
- PEPPOL-EN16931-R055 on CII matches the VAT totals' currency with TaxCurrencyCode as written, so a padded ` SEK` finds no VAT total in that currency and fails, as officially.
- BR-CO-18 on CII runs per invoice line, as the official file does, so an invoice without lines isn't failed for a missing VAT breakdown.
- A repeated BusinessProcessSpecifiedDocumentContextParameter or GuidelineSpecifiedDocumentContextParameter in CII whose first copy has no ID no longer hides the ID of the next: PEPPOL-EN16931-R001 and R007 (and the profile detection) read it there, as the official file does.

## [1.5.2] - 2026-11-20

Every verdict follows the official files exactly, now for the Dutch and German rules too: the SI-UBL 2.0 / NLCIUS CII Schematron of the Dutch Peppol Authority (release 2026-05-21) and KoSIT's XRechnung Schematron 2.6.0 (XRechnung 3.0.2), next to CEN EN 16931 1.3.17 and Peppol BIS Billing 3.0.22. 8 new rules, 332 in total. 100 national cases (`test/fixtures/schematron-parity/national/`) and 100 edge cases (49 more than 1.5.1) hold the checker to verdicts recorded from the compiled official files with Saxon-HE; the official unit tests still give 0 differences.

### Added
- KoSIT's temporary XRechnung rules BR-TMP-2 … BR-TMP-7, as KoSIT's Schematron 2.6.0 defines them: an external document location must be an absolute URL (BR-TMP-2, UBL, and CII supporting documents), gross and net price base quantities must be the same, compared as written (BR-TMP-3, CII), one description and one attached file per supporting document (BR-TMP-4, BR-TMP-5, CII, warnings), and date formats (BR-TMP-6, UBL `YYYY-MM-DD`; BR-TMP-7, CII format `102` / `YYYYMMDD`; warnings).
- The Peppol rules KoSIT copies into its XRechnung file now run on every XRechnung document (`profile: xrechnung`), with KoSIT's own exceptions: PEPPOL-EN16931-R001, R005, R008 (in CII too; an empty order reference ID or delivery block is allowed), R010, R020, R040 … R044, R046, R053 … R055, R061, R101, R110, R111, R120 (a warning, dividing by the gross base quantity), R121 and R130. A missing ProfileID, an empty note or a missing buyer endpoint no longer passes an XRechnung.
- PEPPOL-COMMON-R054 (warning): a Dutch KvK number (scheme 0106) must be 8 digits after `normalize-space()`, in every element that carries the scheme, as Peppol BIS Billing 3.0.22 defines it.
- BR-NL-22 (warning, NLCIUS CII): an invoice note subject code from a Dutch supplier.

### Changed
- Invoice type codes follow CEN 1.3.17's lists per document: the codes it added (such as 471, 472, 473, 500, 501, 502, 503) are accepted where its files accept them. On UBL the Invoice and the CreditNote each have their own list, so 381 on a UBL Invoice or 380 on a UBL CreditNote now fails BR-CL-01, and 502 and 503 pass on a CreditNote; CII accepts every code of both lists. Peppol's CII type-code rule (PEPPOL-EN16931-P0100) never fires in the official file (its context matches nothing), so it no longer fails 471 or 502 on CII.
- SI-UBL 2.0 rules compare as the official SI-UBL file does: the buyer's and tax representative's country exactly as written for BR-NL-4 and BR-NL-5 (`nl` or ` NL ` isn't NL, so those rules don't apply), an empty street counts as given, and the type code for BR-NL-7 as text (` 380 ` fails). NLCIUS CII compares type and payment means codes as numbers (`3.8E2` is 380, `30.0` is 30), doesn't require a payment means for credit notes (381) in BR-NL-11, asks every buyer of a Dutch supplier for a legal ID (BR-NL-10), and, like the official file, never reports BR-NL-9 or BR-NL-31 (their contexts are taken by BR-NL-7 and BR-NL-12). SI-UBL reports every allowance or charge reason code as BR-NL-32, and its empty-element warning (SI-UBL-2) skips elements an earlier rule takes.
- XRechnung rules compare as KoSIT's file does: BR-DE-5 accepts a department name as the seller contact in CII, BR-DE-19 uses KoSIT's IBAN check (only XML whitespace removed, lower-case letters read as written), BR-DE-21 reads the specification identifier as written, BR-DE-27 and BR-DE-28 use KoSIT's telephone and email patterns, and BR-DE-30 follows its direct-debit test. BR-DE-TMP-32 is information only in KoSIT's file and is shown as a notice.
- CEN and Peppol rules found the same way: currencies in BR-CO-15, PEPPOL-EN16931-R051 and R053 are compared as written (a padded ` EUR ` currency code fails), CII decimals (BR-DEC) count the value's decimals (756.950 passes; a trailing space counts as a decimal), CII dates for BR-03, BR-29 and BR-30 need `format="102"`, only `format="102"` dates are syntax-checked (` 102 ` isn't, as in the official files), CII totals rules don't run without a monetary summation, UBL's BR-S-01 also fails a standard-rated VAT breakdown row that no line, allowance or charge uses (CII's test has no such half), UBL's BR-IG-01 and BR-IP-01 (BR-VAT-01 here) follow the official test (an unused IGIC or IPSI row fails, uses count under the VAT scheme only, a padded row code doesn't count), CII header rows in categories L, M and O with TypeCode VAT are checked only by their own category's rules, as the official file's first matching rule decides (BR-45 … BR-48, BR-CO-03, BR-CO-17 and the decimals of their amounts don't run on them), CII's BR-O-01 only runs when there is an O row, and BR-CO-17, BR-Z-05 and BR-E-05 follow the official tests when the VAT breakdown or a line lacks the taxable amount, the rate or the VAT scheme.

### Fixed
- NL-R-003 and NL-R-005 (and SI-UBL's BR-NL-1) read the legal ID as the official test does: 0106 or 0190 as one of the schemeID's space-separated values, and a value that isn't empty after `normalize-space()`. A legal ID holding only a non-breaking space no longer fails NL-R-003, so that invoice now passes, as it does officially.
- The Dutch rules NL-R-001 … NL-R-009 read the seller's, buyer's and tax representative's country as `upper-case(normalize-space(…))`: a country code with a non-breaking space next to it is no longer read as NL, so those rules no longer fire on it (BR-CL-14 still reports the code).
- NL-R-008 compares the payment means code after `normalize-space()`, so a code with a non-breaking space next to it isn't one of the allowed codes.
- Elements of another namespace no longer stand in for UBL or CII elements of the same name: an extension of its own namespace holding, say, a `TaxCurrencyCode`, a `SubjectCode` or an `EmbeddedDocumentBinaryObject` no longer triggers BR-NL-19, BR-NL-22 or BR-CL-24 / PEPPOL-EN16931-CL001, as in the official files, while a `cbc:` element inside a UBL extension still counts where the official context matches it anywhere. Rules the official files test by `name()` (UBL-DT-01, UBL-DT-06, UBL-DT-07) still look at every element.
- PEPPOL-EN16931-R002 (more than one note only between two German parties) and PEPPOL-EN16931-P0112 (type codes 326, 384 and 389) read the postal country the same way, and P0112's Slovak exception reads the first two characters of the VAT identifier as written, so a leading space means it isn't Slovak.

## [1.5.1] - 2026-11-19

Fixes false errors where the checker was stricter than the official CEN EN 16931 1.3.17 and Peppol BIS Billing 3.0.22 Schematron, and the few places where it was more lenient. No new rules: still 324. Every change was checked against the compiled official files on single-change copies of the test invoices (`test/schematron-parity.test.ts`, 44 new edge cases); the official unit tests still give 0 differences.

### Fixed
- PEPPOL-COMMON-R040 (GLN, scheme 0088) no longer requires 13 digits. Like the official rule, it accepts digits only with a valid GS1 check digit, whatever the length, so a GLN-8, a 14-digit GTIN or an 18-digit number with the right check digit passes. A non-breaking space next to the number now fails, as it does officially.
- BR-65 (item classification scheme) only checks classification codes: a `cac:CommodityClassification` with just a `cbc:NatureCode`, or an empty one, no longer fails it (Peppol's PEPPOL-EN16931-R008 still reports the empty element), and a UBL `listID=""` is reported as BR-CL-13, not BR-65. In CII a blank `listID` still fails BR-65.
- Text handling follows XPath: only spaces, tabs and line breaks count as whitespace. A non-breaking space is no longer stripped, so codes, schemes and identifiers written with one fail their code-list or format rule (BR-CL-…, PEPPOL-COMMON-R043 and the other identifier formats), and an element holding only one isn't empty for R008.
- Elements that are there but empty now count as given wherever the official rule only asks for the element: BR-17, BR-23, BR-31 … BR-33, BR-36 … BR-38, BR-41 … BR-44, BR-47, BR-49, BR-54 … BR-57, BR-61, BR-CO-04, BR-CO-26, BR-S/Z/E/AE/IC/O-10 and the VAT identifier rules BR-S/Z/E/AE/IC/G/O-02. The code-list rules then report the empty value (BR-CL-01, -04, -16, -23, -25), as the official files do.
- Identifier schemes: an empty UBL `schemeID` counts as given for BR-62, BR-63 and BR-64 (BR-CL-25 reports it), a blank CII one fails them; BR-CL-25 checks every electronic address and accepts a padded scheme like `" 0208 "`; BR-CL-11 checks every legal registration identifier, and in CII every `ram:ID` with a schemeID outside a tax registration.
- VAT identifiers: BR-CO-09 reads every VAT identifier element as written (in CII only `schemeID="VA"`, so a leading space or an empty identifier fails and another scheme isn't a VAT number), and BR-S/Z/E/AE/IC/G/O-02 now follow the official tests (the line's category, the identifier elements, CII's VA and FC schemes).
- BR-17 also fails when the payee repeats the seller's name or identifier (CII: or legal registration identifier).
- CII: BR-09, BR-11 and BR-20 fail when the postal address itself is missing; BR-53 also needs the VAT accounting currency to differ from the invoice currency; BR-61 checks the payee account's IBAN or proprietary ID; BR-52 also reads line-level referenced documents; BR-CL-23 also reads the gross price's base quantity.
- Allowances and charges are told apart as each syntax's official rules read the indicator (UBL `1`/`0` as true/false, CII exactly `true`/`false`); BR-32, BR-37, BR-47, BR-48 and BR-CO-04 need the tax scheme VAT; BR-23 and BR-27 also fail when the line has no quantity or net price; BR-55 needs an `InvoiceDocumentReference` (a credit note reference alone doesn't count); BR-CL-24 and PEPPOL-EN16931-CL001 compare the MIME code exactly as written.

## [1.5.0] - 2026-11-18

Peppol's own format checks for Norwegian, Danish and Swedish company numbers: 3 new rules, 324 in total. The verdicts of the rules 1.4.0 already checked are unchanged, apart from invoices the new rules now flag.

### Added
- Peppol BIS Billing 3.0.22 identifier rules, in UBL and CII, for every element that carries the scheme (EndpointID, PartyIdentification/ID and CompanyID in UBL; URIID, ID and GlobalID in CII), as OpenPeppol's PEPPOL-EN16931-UBL.sch and -CII.sch state them:
  - PEPPOL-COMMON-R041, Norwegian organisation numbers (0192): 9 digits with the mod-11 check digit.
  - PEPPOL-COMMON-R042, Danish CVR numbers (0184): 8 digits, or DK and 8 digits. The official rule reads the text exactly as written, so spaces or a line break around the number fail too.
  - PEPPOL-COMMON-R049, Swedish organisation numbers (0007): 10 digits with the Luhn check digit (no SE, hyphen or spaces).
- `test/official-peppol.test.ts`: the official Peppol unit tests of the three rules restated on our own invoices (the R041 tests are orders, which the comparison can't run), plus our own pass and fail cases.
- `test/schematron-parity.test.ts`: 14 more invoices (UBL and CII) with valid and broken Nordic numbers in every place the rules look, each with the verdicts the official Schematron gave for them.

### Changed
- The Release workflow moves `v1` only when a release becomes a full release (`released`), so a new version can be published as a pre-release and checked first; the notes are still written on publishing.
- `conformance.json` lists every national rule that isn't checked (`ruleSets.national.notChecked`), tested or not. The official tests of R042 and R049 now count as compared verdicts; the remaining identifier formats (Danish P and SE numbers, Italian, Australian and Dutch numbers) are still listed as not covered.

## [1.4.0] - 2026-11-18

Every EN 16931 business rule and every Peppol BIS Billing 3.0 core rule that can fail is now checked: 99 new rules, 321 in total. The verdicts of the rules 1.3.4 already checked are unchanged, apart from invoices the new rules now flag.

### Added
- EN 16931 (81 rules, CEN validation artefacts 1.3.17, UBL and CII): the VAT identifiers and the VAT rate that document-level allowances and charges need in every VAT category (BR-S, -Z, -E, -AE, -IC, -G, -O, -IG and -IP-03, -04, -06, -07), the VAT amount per category (the -09 rules), the seller's VAT identifier and the rate of IGIC and IPSI lines (BR-IG-02, -05, BR-IP-02, -05), the exemption reason for exports and its absence for IGIC and IPSI (BR-G-10, BR-IG-10, BR-IP-10), "not subject to VAT" alone on an invoice (BR-O-11…14), reasons for allowances and charges (BR-CO-21…24), the account number for credit transfers (BR-50), payment card numbers (BR-51), Italian split payment (BR-B-01, BR-B-02), the remaining code lists (BR-CL-03, -05…08, -10, -13, -15, -18…22, -26) and the UBL data-type rules for amounts and attachments (UBL-DT-01, -06, -07).
- Peppol BIS Billing 3.0.22 (18 rules): one invoiced object on document level and per line (R006, CII only; R100, R101), one project reference (R080), the VAT total in accounting currency (R054), date formats (F001), Peppol's code lists for allowance and charge reasons, VAT dates and currencies (CL002, CL003, CL006, CL007) and VAT exemption codes that match their category (P0104…P0111).
- `test/schematron-parity.test.ts`: 85 invoices (UBL and CII) that break or pass the new rules, each with the verdicts the official Schematron gave for them, compiled from the CEN and Peppol files with Saxon-HE 12.9.
- 67 more official CEN unit tests in `test/fixtures/en16931-cen/` (UBL invoices and credit notes), now including warnings.

### Changed
- ISO 4217 currency codes follow the CEN 1.3.17 list exactly (CNH added; six codes the official list doesn't have removed).
- The conformance statement says when every EN 16931 and Peppol BIS core rule the official tests exercise is checked; the national rules (other countries and Peppol's identifier formats) are still listed as not covered.

## [1.3.4] - 2026-11-17

No rule changes: the same verdicts as 1.3.3. Ready for the GitHub Marketplace listing.

### Changed
- The README starts with the copy-paste workflow and the dated conformance statement, and says that InvoiceVerify, the website the README and the job summary link to, is Kalmwerk's own.
- The `action.yml` description names what people search GitHub Marketplace for (Peppol, UBL, EN 16931 / EN16931, e-invoice), within Marketplace's 125 characters.

### Added
- `test/metadata.test.ts` checks what a Marketplace listing needs: a single `action.yml`, at the root; an icon and colour GitHub supports; the search words in the description; the README's order and its disclosure. It also checks that every value in `action.yml` is YAML the Actions runner can load.

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
