# Rule engine (copy)

These files are InvoiceVerify's validation engine, copied byte for byte from
the website's source (`src/lib/einvoice/`), so this tool, its CLI and the
validator at https://peppol-invoice-compass.lovable.app/validate check
invoices with exactly the same rules.

Don't edit them here: changes go into the website first and are copied over
by its build script. `validate.ts` is the entry point
(`validateInvoiceXml(xml, profile)`); `rules-catalog.ts` lists every rule with
its fix text.
