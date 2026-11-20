# Official verdicts on generated invoices

Invoices written by our own generator (random mixes of VAT categories, exemption reasons and
codes, allowances and charges, currencies, dates, document references and code-list values, in
UBL and CII), chosen so that each rule in `verdicts.json` fails in at least two of them where the
syntax can break it, plus a few that pass them all. The `nordic-*` invoices carry Norwegian (0192), Danish (0184) and
Swedish (0007) organisation numbers, valid and broken, in every place Peppol's identifier rules
PEPPOL-COMMON-R041, R042 and R049 look (party, legal, address and delivery identifiers, a tax
representative, a payee, a CII product) and pass every other listed rule. They are not official
test files.

`verdicts.json` records, per invoice, every rule of its `rules` list that the official artefacts
report (`error`, or `warning` for rules flagged as warnings), as produced by the CEN EN 16931
validation artefacts 1.3.17 (`EN16931-UBL-validation.xslt`, `EN16931-CII-validation.xslt`) and
Peppol BIS Billing 3.0.22 (`PEPPOL-EN16931-UBL.sch`, `PEPPOL-EN16931-CII.sch`, compiled with
SchXslt) under Saxon-HE 12.9. Rules not listed for an invoice passed.

`src/lib/einvoice/schematron-parity.test.ts` holds the checker to every one of these verdicts.

## Edge cases (`edge/`, `edge-verdicts.json`)

Single-change copies of the library's valid samples (`peppol-valid` in UBL, `factur-x-en16931` turned
into a Peppol BIS CII invoice), written by `bun scripts/record-official-edge-cases.ts`: an element that
is there but empty or only partly filled in (a classification without a code, an empty name, reason
or code), and identifiers written in unusual but valid forms (GLNs of other lengths, schemeIDs with
spaces, non-breaking spaces, VAT identifiers under another CII scheme). `edge-verdicts.json` records,
per invoice, what it changes, the rules it is about and every failed assert of the CEN artefacts
(`cen`) and of the Peppol rules (`peppol`), produced by the same artefacts and the same Saxon run as
`verdicts.json`. `schematron-parity.test.ts` checks each one under the en16931 profile against the
CEN verdicts and under the peppol profile against both, on its rules and on the overall verdict.
Since 1.5.3 the list ends with two-change cases: the smallest reproductions of what the multi-error
corpus below found (one change takes an official rule's context away, the other breaks the value that
rule would test). A case's `outOfScope` lists the CEN syntax-binding asserts it can't avoid and the
checker leaves out by its documented scope (such as UBL-SR-48 on a repeated ClassifiedTaxCategory);
only the overall verdict leaves them out.

## Multi-error corpus (`multi-error/`, `multi-error-verdicts.json`)

The four valid bases in `multi-error/` (the library's `peppol-valid`, `credit-note-valid` and
`reverse-charge-valid` UBL samples, and `factur-x-en16931` declared as a Peppol BIS CII invoice) with 2–8
faults at once, drawn from a seeded random sequence by `src/test/multi-error/corpus.ts`: elements
removed, emptied, padded or repeated, amounts, codes and dates changed, values swapped. Real broken
invoices often have several problems together, and a rule can then run where the official one doesn't
(or the other way round), which no single-change case shows. `bun scripts/compare-multi-error-invoices.ts
--record` keeps the schema-valid invoices the official files give a verdict on and records, per invoice,
its content hash and every failed assert of CEN EN 16931 1.3.17 + Peppol BIS Billing 3.0.22 and of the
Peppol BIS 3.1.0 draft (left out when it equals 3.0.22), as rule IDs the catalog names (warnings as
`w:ID`). `multi-error-parity.test.ts` rebuilds every invoice from the bases and the seed and holds the
checker to those verdicts rule by rule and on the overall verdict, with the documented deliberate
differences apart.

## National rules (`national/`, `national-verdicts.json`)

Single-change copies of the library's Dutch SI-UBL 2.0 and NLCIUS CII samples and its XRechnung samples
(UBL and CII), written by `bun scripts/record-official-national-cases.ts`: values the official national
files compare exactly as written (codes and identifiers with spaces, line breaks or a non-breaking space,
upper and lower case), elements that are there but empty, KoSIT's temporary rules (BR-TMP-2 … BR-TMP-7)
and dates in other formats. `national-verdicts.json` records every failed assert of the Dutch Peppol
Authority's SI-UBL 2.0 / NLCIUS Schematron (release 2026-05-21) or KoSIT's XRechnung Schematron 2.6.0
(with its copies of Peppol rules), together with CEN EN 16931 1.3.17, under Saxon-HE; KoSIT's
information-only notices are kept as `info`. `schematron-parity.test.ts` checks each one under the
nlcius or xrechnung profile on its rules and on the overall verdict.
