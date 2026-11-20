# Peppol UBL check

Checks the UBL / Peppol BIS Billing 3.0 e-invoices your code generates against 332 EN 16931, Peppol, XRechnung and SI-UBL 2.0 rules, in GitHub Actions or on the command line, before they reach an access point. Every error comes with its rule ID, line and fix. It runs offline: no API key, no account, nothing sent anywhere.

## Quick start

Copy this into `.github/workflows/peppol-ubl-check.yml`:

```yaml
name: Peppol UBL check

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  invoices:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: kalmwerk/peppol-ubl-check@v1
        with:
          files: "invoices/**/*.xml"
```

Point `files` at the folder your invoices or test fixtures are in. Without it, every `*.xml` in the repository is checked; XML files that aren't invoices (a `pom.xml`, configs) are listed as skipped, not failed. More workflows: [invoices your tests generate](#check-the-invoices-your-code-generates), [a copy in your own repository](#use-a-copy-in-your-own-repository) and [`examples/`](examples/).

## Conformance

<!-- conformance:summary:start -->
**Conformance, checked 20 November 2026:** same verdict as the official EN 16931 and Peppol Schematron for every rule this tool checks, on all 1,919 official unit-test cases of the [CEN EN 16931 validation artefacts 1.3.17](https://github.com/ConnectingEurope/eInvoicing-EN16931/tree/validation-1.3.17/test) and the [Peppol BIS Billing 3.0 rules 3.0.22](https://github.com/OpenPEPPOL/peppol-bis-invoice-3/tree/3.0.22/rules): 1,277 verdicts compared, 0 different. Every EN 16931 business rule that can fail (219, plus 4 the official files define as always true) and every Peppol BIS core rule (47) is checked. Not checked: 1,343 of the 1,346 CEN syntax-binding and data-type rules (UBL-SR, UBL-CR, UBL-DT, CII-SR, CII-DT) and 104 of Peppol's 119 national rules. The 93 rules those tests exercise that aren't checked are all national (Denmark, Germany, Greece, Italy, Norway, Sweden and Peppol's identifier formats), listed in [`conformance.json`](conformance.json). Reproduce it with `npm run compare-official`; CI reruns it on every push and pull request.
<!-- conformance:summary:end -->

> **What it does not do.** The 332 rules are a partial version of the official EN 16931, Peppol, XRechnung and SI-UBL 2.0 Schematron rule sets, not all of them: they include every EN 16931 business rule and every Peppol BIS Billing 3.0 core rule that can fail, but not the CEN syntax-binding rules (UBL-SR, UBL-CR, CII-SR and most data-type rules) or Peppol's national rules apart from the Dutch ones and six identifier checks (GLNs, Belgian company numbers, Dutch KvK numbers and Norwegian, Danish and Swedish company numbers; the exact counts are in the conformance statement above). There is no XSD schema validation (element order and unknown elements are not checked) and no PDF/A check: it reads XML files only, not Factur-X / ZUGFeRD PDFs. A pass is a strong signal, not a guarantee; your access point still validates every invoice against the official rules before sending it. See [What it checks](#what-it-checks).

**Disclosure:** the links to peppol-invoice-compass.lovable.app in this README and in the job summary go to InvoiceVerify, the website of Kalmwerk, who also make this Action. Its free [online checker](https://peppol-invoice-compass.lovable.app/validate) runs the same rules on one invoice at a time and shows a visual report of it. The Action itself never contacts the site; the links are only links.

## What you get

- **332 rules:** 189 EN 16931 business rules, 62 Peppol BIS Billing 3.0 rules, 38 XRechnung rules, 31 Dutch SI-UBL 2.0 (NLCIUS) rules and 12 extra checks (syntax, VAT number, Belgian enterprise number and German Leitweg-ID check digits, IBAN, dates).
- **Job summary** with a table per invoice: rule ID (linked to its explanation), line, what's wrong and how to fix it.
- **Annotations** on the file and line, so findings show up in pull requests.
- **Optional JSON report** for your own tooling or an artifact.
- **No dependencies at run time.** `dist/` is one JavaScript file per entry point, built from `src/` and checked in CI.

The rule engine is InvoiceVerify's, copied into this repository (`src/engine/`), so the Action, the command line and the online checker apply the same rules.

## More workflows

### Check the invoices your code generates

Most teams don't commit invoices; they generate them in tests. Run your export first, then check its output and keep the JSON report:

```yaml
      - run: npm run export-test-invoices -- --out build/invoices
      - uses: kalmwerk/peppol-ubl-check@v1
        id: peppol
        with:
          files: "build/invoices/**/*.xml"
          json-file: build/peppol-report.json
      - uses: actions/upload-artifact@v7
        if: always()
        with:
          name: peppol-report
          path: build/peppol-report.json
```

### Use a copy in your own repository

Download the zip from the [tool's page](https://peppol-invoice-compass.lovable.app/tools/peppol-github-action) (it lists the SHA-256 checksum), unzip it into `.github/actions/` and use the local path:

```yaml
      - uses: actions/checkout@v7
      - uses: ./.github/actions/peppol-ubl-check
        with:
          files: "invoices/**/*.xml"
```

The zip holds this whole repository: `action.yml` and `dist/` are what runs; the source, tests and CI are there so you can review or rebuild it. Its test invoices end up under `.github/`, a hidden folder that the default `files` pattern skips.

These workflows are also in [`examples/`](examples/).

## Example

For `invalid-vat-calculation.xml` (one of the test invoices in `test/fixtures/`), the job summary shows:

| | Rule | Line | What's wrong | How to fix |
| --- | --- | ---: | --- | --- |
| ❌ | [BR-CO-14](https://peppol-invoice-compass.lovable.app/rules/br-co-14) | 88 | **VAT total does not match breakdown.** VAT breakdown adds up to 403.04, but the VAT total is 422.64. | Make cac:TaxTotal/cbc:TaxAmount equal to the sum of all cac:TaxSubtotal/cbc:TaxAmount values. |
| ❌ | [BR-CO-17](https://peppol-invoice-compass.lovable.app/rules/br-co-17) | 91 | **VAT amount does not match rate.** 1960.00 × 21% = 411.60, but the VAT amount is 392.00. | Calculate VAT per category on the taxable total (not per line) and round once to 2 decimals. |
| ❌ | [PEPPOL-EN16931-R120](https://peppol-invoice-compass.lovable.app/rules/peppol-en16931-r120) | 140 | **Line net amount calculation error.** Line 2: 8 × 95 = 760.00, but the line amount is 712.50. | Recalculate cbc:LineExtensionAmount = quantity × price / base quantity + charges − allowances, rounded to 2 decimals. |

(and three more rows), above an overview table with one row per invoice. Each rule ID links to a page that explains the rule in plain English, Dutch and French.

## Inputs

All inputs are optional.

| Input | Default | What it does |
| --- | --- | --- |
| `files` | `**/*.xml` | Invoice files, as globs relative to the repository root, one per line or comma separated. A folder means every `*.xml` in it; `!pattern` leaves files out. Hidden folders (`.github`) and `node_modules` are skipped unless the pattern names them. |
| `ignore` | | Globs to leave out, e.g. `test/fixtures/broken/**`. |
| `profile` | `peppol` | `peppol`: Peppol BIS Billing 3.0 and EN 16931 rules on every UBL file, and on CII files other than Factur-X / ZUGFeRD, XRechnung and SI-UBL 2.0 (those keep their own rules), so a wrong `CustomizationID` is reported instead of quietly checking less. `auto`: pick the rule set from each file's `CustomizationID` (use this for a mix of Peppol, XRechnung, SI-UBL 2.0 and plain EN 16931 files). `en16931`, `xrechnung` or `nlcius` (Dutch SI-UBL 2.0): force those. |
| `fail-on` | `error` | `error` fails the job when any invoice has errors, `warning` also on warnings, `never` only reports. |
| `non-invoice` | `skip` | XML files whose root element isn't `Invoice`, `CreditNote` or `CrossIndustryInvoice`: `skip` lists them as skipped, `fail` reports them as errors. An `Invoice` in the wrong namespace is always an error. |
| `if-no-files-found` | `error` | No invoice found: `error` fails the job, `warn` only warns, `ignore` says nothing. |
| `json-file` | | Also write the full report as JSON to this path. |
| `summary` | `true` | Write the results to the job summary. |
| `annotations` | `true` | Annotate each finding on its file and line (up to 50). |

## Outputs

| Output | What it holds |
| --- | --- |
| `result` | `passed` or `failed`. |
| `checked` | Number of invoices checked. |
| `failed` | Number of invoices with findings at or above `fail-on`. |
| `errors` | Number of errors across all invoices. |
| `warnings` | Number of warnings across all invoices. |
| `skipped` | Number of matching files that aren't invoices. |
| `json-file` | Absolute path of the JSON report (empty without `json-file`). |

## Command line

The same check runs on your machine or in any other CI with Node.js 20 or newer:

```sh
node .github/actions/peppol-ubl-check/dist/cli.js "invoices/**/*.xml"
node dist/cli.js --json build/invoices > peppol-report.json
node dist/cli.js --help
```

Exit codes: `0` no findings at or above `--fail-on`, `1` there are, `2` a usage error or no invoices found. `--profile`, `--fail-on`, `--non-invoice`, `--ignore` and `--json-file` work like the Action's inputs; `--quiet` prints one line per file. An npm package, so `npx peppol-ubl-check` works without a download, is planned.

## JSON report

`json-file` (or `--json`) writes everything the summary shows, without limits. For two valid invoices, the VAT test invoice and a `pom.xml` (one of the six findings shown):

```json
{
  "tool": "peppol-ubl-check",
  "version": "1.5.3",
  "rulesAvailable": 332,
  "profile": "peppol",
  "failOn": "error",
  "result": "failed",
  "totals": { "matched": 4, "checked": 3, "ok": 2, "withWarnings": 0, "withErrors": 1, "skipped": 1, "errors": 6, "warnings": 0, "info": 0 },
  "files": [
    {
      "path": "invoices/invalid-vat-calculation.xml",
      "status": "errors",
      "format": "Peppol BIS Billing 3.0 (UBL 2.1)",
      "formatId": "peppol-bis-3",
      "document": "Invoice",
      "profileApplied": "peppol",
      "invoiceNumber": "2026/0918",
      "rulesChecked": 261,
      "counts": { "error": 6, "warning": 0, "info": 0 },
      "findings": [
        {
          "ruleId": "BR-CO-17",
          "severity": "error",
          "source": "EN16931",
          "section": "vat",
          "title": "VAT amount does not match rate",
          "message": "1960.00 × 21% = 411.60, but the VAT amount is 392.00.",
          "line": 91,
          "col": 21,
          "xpath": "/Invoice/cac:TaxTotal/cac:TaxSubtotal[1]/cbc:TaxAmount",
          "businessTerms": ["BT-117", "BT-116", "BT-119"],
          "expected": "411.60",
          "actual": "392.00",
          "fix": "Calculate VAT per category on the taxable total (not per line) and round once to 2 decimals.",
          "url": "https://peppol-invoice-compass.lovable.app/rules/br-co-17"
        }
      ]
    }
  ]
}
```

`status` is `ok`, `warnings`, `errors` or `skipped` (with a `skipped` reason). `rulesChecked` is the part of the 332 rules that applies to that file's format and profile.

## What it checks

- **Syntax:** well-formed XML, with the line and column of the first problem; UBL 2.1 `Invoice` / `CreditNote` (and UN/CEFACT CII) in the right namespace; dates and amounts in the right format.
- **EN 16931 (189 rules):** every business rule of the CEN EN 16931 validation artefacts 1.3.17 that can fail, in UBL and CII (BR-CO-05 … BR-CO-08 are defined there as always true): mandatory content (BR-01…), VAT categories and exemption reasons, including the VAT details of document-level allowances and charges and the VAT amount per category (BR-S, BR-AE, BR-E, BR-Z, BR-IC, BR-G, BR-O, BR-IG, BR-IP, BR-B), calculations of lines, totals and the VAT breakdown (BR-CO), reasons for allowances and charges, decimals, and every code list (BR-CL: currencies, countries, units, VAT categories and exemption codes, payment means, identifier and address schemes, note subjects, item classifications), plus three UBL data-type rules (UBL-DT-01, -06, -07). 44 official IDs are merged into three here (see below).
- **Peppol BIS Billing 3.0 (62 rules)**: all 47 core rules of Peppol BIS Billing 3.0.22 (PEPPOL-EN16931-*), in UBL and, from OpenPeppol's CII rules, in CII (a few exist in one syntax only, such as R008, R044, R046 and R051 in UBL and R006 in CII): business process and specification IDs, buyer reference, buyer and seller endpoint IDs and their schemes, empty elements, allowance, charge and line calculations, invoice periods, currencies and date formats, one invoiced object and one project reference, VAT exemption codes that match their category, Peppol's code lists for allowance and charge reasons and VAT dates, and the invoice and credit note type codes Peppol allows. Plus 15 identifier and country rules: GLN check digits (PEPPOL-COMMON-R040), Norwegian 0192 organisation numbers (PEPPOL-COMMON-R041, mod-11 check digit), Danish 0184 CVR numbers (PEPPOL-COMMON-R042, 8 digits or DK and 8 digits, read exactly as written), Belgian 0208 enterprise numbers (PEPPOL-COMMON-R043), Swedish 0007 organisation numbers (PEPPOL-COMMON-R049, Luhn check digit), Dutch 0106 KvK numbers (PEPPOL-COMMON-R054, a warning: 8 digits), each in every element that carries the scheme, and the Netherlands rules (NL-R-001 … NL-R-009) for Dutch suppliers.
- **XRechnung (38 rules)** with `profile: xrechnung`, or `auto` for files that declare XRechnung: every business rule of the XRechnung 3.0 CIUS (BR-DE-1 … BR-DE-31 and BR-DE-TMP-32) and KoSIT's temporary rules (BR-TMP-2 … BR-TMP-7) from the KoSIT XRechnung Schematron 2.6.0, in UBL and CII: buyer reference / Leitweg-ID, seller contact, addresses, payment instructions and the payment-means groups, the Skonto syntax, attachments (absolute links, one description and one file per supporting document), price base quantities, date formats and the specification identifier. Each is tested as KoSIT's file tests it (values compared as written where it compares them as written), and the Peppol rules KoSIT copies into its file also run on every XRechnung, with KoSIT's own exceptions (R008, R120 as a warning, R053, R055). BR-DE-TMP-32 is an information-only notice there, so it is shown but never fails a file. Not the rules of the XRechnung Extension (BR-DEX) or CVD, and no ZUGFeRD PDFs (XML files only).
- **SI-UBL 2.0 / NLCIUS (31 rules)** with `profile: nlcius`, or `auto` for files that declare SI-UBL 2.0: the Dutch rules of the official SI-UBL 2.0 and NLCIUS CII Schematron (validation artefacts 2.0.3.13 / 1.0.3.13 of the Dutch Peppol Authority, release 2026-05-21, BR-NL-* and SI-UBL warnings), in UBL and CII: KvK and OIN identifiers, buyer reference or order reference, addresses of Dutch parties, payment means, credit-note references, the elements NLCIUS asks Dutch suppliers to leave out and the specification identifier. Each syntax follows its own file: SI-UBL compares type codes and countries as written, NLCIUS CII compares codes as numbers. Not the UBL syntax rules (UBL-SR) of that set.
- **Extra checks (12):** well-formed XML and document type, data types, Factur-X profiles below EN 16931, VAT number format and check digits, VAT prefix versus the seller's country, Belgian enterprise number check digits, German Leitweg-ID structure and check digits (KoSIT format specification 2.0.2), IBAN check digits, due date before issue date, uncommon unit codes.

Calculations are judged the way the official Schematron judges them, with exact decimals (no floating point) and the same margins: none for the totals (BR-CO-10 … BR-CO-16); for the VAT breakdown less than 1.00 per rate in UBL and none in CII (BR-S-08; the other categories as their own rules say); for the VAT amount less than 1.00 in UBL and up to 1.00 in CII (BR-CO-17); and up to 0.02 for Peppol's allowance, charge and line calculations (R040, R120). The CEN unit tests for these rules are in `test/fixtures/en16931-cen/`.

### Compared with the official rules

<!-- conformance:details:start -->
`npm run compare-official` downloads the official unit tests of the [CEN EN 16931 validation artefacts 1.3.17](https://github.com/ConnectingEurope/eInvoicing-EN16931/tree/validation-1.3.17/test) and the [Peppol BIS Billing 3.0 rules 3.0.22](https://github.com/OpenPEPPOL/peppol-bis-invoice-3/tree/3.0.22/rules) (1,919 test cases in UBL and CII: 913 from CEN, 1,006 from Peppol; the Peppol files may not be redistributed, so they aren't in this repository), compares every expected verdict of a rule this tool checks, and writes the result to [`conformance.json`](conformance.json) and the statement at the top of this README. Last run, 20 November 2026: 1,277 verdicts compared, 0 different. It also counts every rule in the official Schematron files, tested or not: every EN 16931 business rule that can fail (219, plus 4 the official files define as always true) and every Peppol BIS core rule (47) is checked. Not checked: 1,343 of the 1,346 CEN syntax-binding and data-type rules (UBL-SR, UBL-CR, UBL-DT, CII-SR, CII-DT) and 104 of Peppol's 119 national rules. Every EN 16931 and Peppol BIS core rule those tests exercise is checked. The 93 they exercise that aren't checked here are national rules (Denmark, Germany, Greece, Italy, Norway, Sweden and Peppol's identifier formats); `conformance.json` lists every one, and `--list-uncovered` prints them. `npm run compare-official -- --check` (run in CI) fails when the committed result no longer matches a fresh run or the engine.
<!-- conformance:details:end -->

`test/official-peppol.test.ts` restates the Peppol cases the tool once got wrong.

Deliberate differences:

- **BR-CO-25** (no due date or payment terms) is a warning on invoices, not an error: EN 16931 still states it, but the official CEN rules stopped checking it in 1.3.16. Credit notes aren't checked, as in the official tests; Factur-X / ZUGFeRD keeps it as an error.
- **BR-S-01** asks for a VAT breakdown entry for every standard rate used, not only one standard-rated entry overall (the same for IGIC and IPSI under BR-VAT-01).
- **IV-VAT-01** (VAT number format) and the file checks are errors of this tool's own, not in any official rule set; the other extra checks are warnings or notes.
- Several official rules share one ID here: BR-VAT-01 (BR-Z-01 … BR-IP-01), BR-VAT-08 (BR-Z-08 … BR-IP-08) and BR-DEC (BR-DEC-01 … 28). Same verdicts, different ID.
- With `profile: peppol`, Factur-X / ZUGFeRD, XRechnung and SI-UBL 2.0 CII files keep their own rules instead of Peppol's.

Not checked: XSD schema validation, the official rule sets in full, PDF/A and Factur-X / ZUGFeRD PDFs, digital signatures, and whether the buyer can actually receive invoices on Peppol (that needs a network lookup; the website's free [Peppol ID lookup](https://peppol-invoice-compass.lovable.app/tools/peppol-lookup) does it).

For a visual report of one invoice (header, parties, lines, VAT breakdown, with the lines highlighted), drop the file into the [InvoiceVerify validator](https://peppol-invoice-compass.lovable.app/validate). That one runs on the website: uploading a file there is your choice, and the site doesn't store invoice contents.

## Privacy and security

- Everything runs in your runner. The Action reads the files that match `files` and writes the summary, annotations, outputs and the optional JSON file. It makes no network requests at all: no InvoiceVerify account, API key, analytics or telemetry. The links in the summary are only links.
- No dependencies are installed when it runs. `dist/index.js` (Action) and `dist/cli.js` (CLI) are built from `src/` with esbuild; the only third-party code in them is the XML reader saxes and its helper xmlchars ([licenses](THIRD_PARTY_LICENSES.md)). CI fails if `dist/` doesn't match the source.
- It reads files up to 5 MB and stops after looking at 200,000 files and folders, so a broad pattern can't run away.

## Related tools

Free tools on [InvoiceVerify](https://peppol-invoice-compass.lovable.app), Kalmwerk's website (see the disclosure above), for the parts of e-invoicing this Action leaves out. You don't need any of them to use the Action.

- **[Online e-invoice validator](https://peppol-invoice-compass.lovable.app/validate):** the same rules on one UBL, Peppol BIS, XRechnung or Factur-X invoice at a time, with a visual report of the invoice and its recalculated totals. Three checks a month without an account.
- **[Peppol and EN 16931 error codes](https://peppol-invoice-compass.lovable.app/rules):** a page for every rule ID in the job summary, with what it means and how to fix it, some with a worked before/after XML example. Most are also explained in Dutch ([foutcodes](https://peppol-invoice-compass.lovable.app/nl/foutcodes)) and French ([codes d’erreur](https://peppol-invoice-compass.lovable.app/fr/codes-erreur)).
- **[SI-UBL 2.0 / NLCIUS checker](https://peppol-invoice-compass.lovable.app/tools/si-ubl-nlcius-checker):** one Dutch SimplerInvoicing invoice against the 30 Dutch rules plus EN 16931 and Peppol, in your browser; the file isn't uploaded.
- **[Factur-X / ZUGFeRD generator](https://peppol-invoice-compass.lovable.app/tools/factur-x-generator):** makes a PDF/A-3 invoice with the CII XML embedded (MINIMUM, BASIC or EN 16931 profile) in your browser and checks it straight away. This Action reads XML only, so it doesn't check those PDFs.
- **Is the buyer on Peppol?** Search the official Peppol Directory by company name, VAT or company number, or Peppol ID: [Peppol ID lookup](https://peppol-invoice-compass.lovable.app/tools/peppol-lookup), in Dutch [Peppol-ID opzoeken](https://peppol-invoice-compass.lovable.app/nl/peppol-id-opzoeken), in French [recherche d’identifiant Peppol](https://peppol-invoice-compass.lovable.app/fr/recherche-identifiant-peppol). It shows each Peppol ID a company has and whether it receives BIS Billing 3.0 invoices, which this Action can't tell you because it makes no network requests.
- **Belgian client lists:** up to 500 Belgian company or VAT numbers checked at once under both of their Peppol IDs (0208 and 9925), because a company registered under only one of them can't receive invoices sent to the other; the first 10 results are free. [Peppol check for a whole client list](https://peppol-invoice-compass.lovable.app/peppol-client-list-check), in Dutch [Peppol-controle voor uw hele klantenbestand](https://peppol-invoice-compass.lovable.app/nl/peppol-controle-klantenbestand), in French [contrôle Peppol de tout votre portefeuille clients](https://peppol-invoice-compass.lovable.app/fr/controle-peppol-portefeuille-clients).

## Development

```sh
npm ci
npm test          # unit tests, plus end-to-end runs of dist/index.js and dist/cli.js on the test invoices
npm run build     # rebuild dist/; commit it with the source
```

`src/engine/` is a copy of InvoiceVerify's rule engine; see [its README](src/engine/README.md). `test/fixtures/` holds valid and deliberately broken invoices from the website's [sample library](https://peppol-invoice-compass.lovable.app/samples).

## License

[MIT](LICENSE) © 2026 Kalmwerk
