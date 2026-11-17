# EN 16931 unit tests (CEN)

Unchanged copies of the official CEN/TC 434 unit tests for the VAT-breakdown (`BR-*-08`) and
totals (`BR-CO-10` … `BR-CO-17`) rules, from
[ConnectingEurope/eInvoicing-EN16931](https://github.com/ConnectingEurope/eInvoicing-EN16931)
(`ubl/test/` and `cii/test/` at commit `b17b269`, the validation artefacts 1.3.17).
Licensed under the European Union Public Licence 1.2 (`LICENSE.txt`); the rest of this
repository is MIT.

Each `<test>` names the rules that must pass (`<success>`) or fail (`<error>`) for the invoice
it contains; `test/official-margins.test.ts` runs every one of them.
