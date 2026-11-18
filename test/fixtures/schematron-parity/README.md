# Official verdicts on generated invoices

Invoices written by our own generator (random mixes of VAT categories, exemption reasons and
codes, allowances and charges, currencies, dates, document references and code-list values, in
UBL and CII), chosen so that each rule in `verdicts.json` fails in at least two of them where the
syntax can break it, plus a few that pass them all. They are not official test files.

`verdicts.json` records, per invoice, every rule of its `rules` list that the official artefacts
report (`error`, or `warning` for rules flagged as warnings), as produced by the CEN EN 16931
validation artefacts 1.3.17 (`EN16931-UBL-validation.xslt`, `EN16931-CII-validation.xslt`) and
Peppol BIS Billing 3.0.22 (`PEPPOL-EN16931-UBL.sch`, `PEPPOL-EN16931-CII.sch`, compiled with
SchXslt) under Saxon-HE 12.9. Rules not listed for an invoice passed.

`src/lib/einvoice/schematron-parity.test.ts` holds the checker to every one of these verdicts.
