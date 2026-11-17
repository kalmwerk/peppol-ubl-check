# EN 16931 unit tests (CEN)

Unchanged copies of the official CEN/TC 434 unit tests for the VAT-breakdown (`BR-*-08`) and
totals (`BR-CO-10` … `BR-CO-17`) rules, for the one-breakdown-row rules of the
other VAT categories (`BR-Z-01`, `BR-E-01`, `BR-AE-01`, `BR-IC-01`, `BR-G-01`, `BR-O-01`), and for
BR-CO-19, BR-IC-11, BR-AE-10 and BR-CO-25 (credit notes), whose official verdicts the checker follows since 1.3.2, from
[ConnectingEurope/eInvoicing-EN16931](https://github.com/ConnectingEurope/eInvoicing-EN16931)
(`ubl/test/` and `cii/test/` at commit `b17b269`, the validation artefacts 1.3.17).
Licensed under the European Union Public Licence 1.2 (`LICENSE.txt`); the rest of this
repository is MIT.

Each `<test>` names the rules that must pass (`<success>`) or fail (`<error>`) for the invoice
it contains; `test/official-margins.test.ts` runs every one of them.
