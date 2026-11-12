# Peppol UBL check

A free GitHub Action and command-line tool that checks the UBL / Peppol BIS Billing 3.0 invoices your code generates, before they reach an access point. It fails the job on errors and tells you, per finding, the rule ID, the line and how to fix it.

It runs entirely offline: no API key, no account, and nothing is sent anywhere. The rules are the same engine that runs the [InvoiceVerify validator](https://peppol-invoice-compass.lovable.app/validate), copied into this repository.

- **153 rules:** 101 EN 16931 business rules, 28 Peppol BIS Billing 3.0 rules, 13 XRechnung rules and 11 extra checks (syntax, VAT number and Belgian enterprise number check digits, IBAN, dates).
- **Job summary** with a table per invoice: rule ID (linked to its explanation), line, what's wrong and how to fix it.
- **Annotations** on the file and line, so findings show up in pull requests.
- **Optional JSON report** for your own tooling or an artifact.
- **No dependencies at run time.** `dist/` is one JavaScript file per entry point, built from `src/` and checked in CI.

> **What it does not do.** The 153 rules are a partial version of the official EN 16931 and Peppol Schematron rule sets, not all of them. There is no XSD schema validation (element order and unknown elements are not checked) and no PDF/A check: it reads XML files only, not Factur-X / ZUGFeRD PDFs. A pass is a strong signal, not a guarantee; your access point still validates every invoice against the official rules before sending it. See [What it checks](#what-it-checks).

## Quick start

Save this as `.github/workflows/peppol-ubl-check.yml`:

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

Point `files` at the folder your invoices or test fixtures are in. Without it, every `*.xml` in the repository is checked; XML files that aren't invoices (a `pom.xml`, configs) are listed as skipped, not failed.

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

(and two more rows), above an overview table with one row per invoice. Each rule ID links to a page that explains the rule in plain English, Dutch and French.

## Inputs

All inputs are optional.

| Input | Default | What it does |
| --- | --- | --- |
| `files` | `**/*.xml` | Invoice files, as globs relative to the repository root, one per line or comma separated. A folder means every `*.xml` in it; `!pattern` leaves files out. Hidden folders (`.github`) and `node_modules` are skipped unless the pattern names them. |
| `ignore` | | Globs to leave out, e.g. `test/fixtures/broken/**`. |
| `profile` | `peppol` | `peppol`: Peppol BIS Billing 3.0 and EN 16931 rules on every UBL file, so a wrong `CustomizationID` is reported instead of quietly checking less. `auto`: pick the rule set from each file's `CustomizationID` (use this for a mix of Peppol, XRechnung and plain EN 16931 files). `en16931` or `xrechnung`: force those. |
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

`json-file` (or `--json`) writes everything the summary shows, without limits. For two valid invoices, the VAT test invoice and a `pom.xml` (one of the five findings shown):

```json
{
  "tool": "peppol-ubl-check",
  "version": "1.0.1",
  "rulesAvailable": 153,
  "profile": "peppol",
  "failOn": "error",
  "result": "failed",
  "totals": { "matched": 4, "checked": 3, "ok": 2, "withWarnings": 0, "withErrors": 1, "skipped": 1, "errors": 5, "warnings": 0, "info": 0 },
  "files": [
    {
      "path": "invoices/invalid-vat-calculation.xml",
      "status": "errors",
      "format": "Peppol BIS Billing 3.0 (UBL 2.1)",
      "formatId": "peppol-bis-3",
      "document": "Invoice",
      "profileApplied": "peppol",
      "invoiceNumber": "2026/0918",
      "rulesChecked": 140,
      "counts": { "error": 5, "warning": 0, "info": 0 },
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

`status` is `ok`, `warnings`, `errors` or `skipped` (with a `skipped` reason). `rulesChecked` is the part of the 153 rules that applies to that file's format and profile.

## What it checks

- **Syntax:** well-formed XML, with the line and column of the first problem; UBL 2.1 `Invoice` / `CreditNote` (and UN/CEFACT CII) in the right namespace; dates and amounts in the right format.
- **EN 16931 (101 rules):** mandatory content (BR-01…), VAT categories and exemption reasons (BR-S, BR-AE, BR-E, BR-Z, BR-O…), calculations of lines, totals and the VAT breakdown (BR-CO), decimals, and code lists for currencies, countries, units, VAT categories, payment means and electronic address schemes.
- **Peppol BIS Billing 3.0 (28 rules):** business process and specification IDs, buyer reference, buyer and seller endpoint IDs, GLNs and Belgian 0208 enterprise numbers, empty elements, allowance, charge and line calculations, invoice periods, currencies, and the invoice and credit note type codes Peppol allows.
- **XRechnung (13 rules)** with `profile: xrechnung`, or `auto` for files that declare XRechnung.
- **Extra checks (11):** well-formed XML and document type, data types, Factur-X profiles below EN 16931, VAT number format and check digits, VAT prefix versus the seller's country, Belgian enterprise number check digits, IBAN check digits, due date before issue date, uncommon unit codes.

Not checked: XSD schema validation, the official rule sets in full, PDF/A and Factur-X / ZUGFeRD PDFs, digital signatures, and whether the buyer can actually receive invoices on Peppol (that needs a network lookup; the website's free [Peppol ID lookup](https://peppol-invoice-compass.lovable.app/tools/peppol-lookup) does it).

For a visual report of one invoice (header, parties, lines, VAT breakdown, with the lines highlighted), drop the file into the [InvoiceVerify validator](https://peppol-invoice-compass.lovable.app/validate). That one runs on the website: uploading a file there is your choice, and the site doesn't store invoice contents.

## Privacy and security

- Everything runs in your runner. The Action reads the files that match `files` and writes the summary, annotations, outputs and the optional JSON file. It makes no network requests at all: no InvoiceVerify account, API key, analytics or telemetry. The links in the summary are only links.
- No dependencies are installed when it runs. `dist/index.js` (Action) and `dist/cli.js` (CLI) are built from `src/` with esbuild; the only third-party code in them is the XML reader saxes and its helper xmlchars ([licenses](THIRD_PARTY_LICENSES.md)). CI fails if `dist/` doesn't match the source.
- It reads files up to 5 MB and stops after looking at 200,000 files and folders, so a broad pattern can't run away.

## Development

```sh
npm ci
npm test          # unit tests, plus end-to-end runs of dist/index.js and dist/cli.js on the test invoices
npm run build     # rebuild dist/; commit it with the source
```

`src/engine/` is a copy of InvoiceVerify's rule engine; see [its README](src/engine/README.md). `test/fixtures/` holds valid and deliberately broken invoices from the website's [sample library](https://peppol-invoice-compass.lovable.app/samples).

Need to know whether your customers can receive Peppol invoices at all? [InvoiceVerify](https://peppol-invoice-compass.lovable.app) checks Belgian companies under both of their Peppol IDs (0208 and 9925), free for single lookups.

## License

[MIT](LICENSE) © 2026 Kalmwerk
