# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
