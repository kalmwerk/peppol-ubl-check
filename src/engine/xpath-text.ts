/**
 * Text handling exactly as the official Schematron reads it. XML whitespace (XML 1.0 S: space, tab, line
 * feed, carriage return) is the only whitespace XPath's normalize-space() and XSD's whitespace facet
 * remove. JavaScript's trim() and \s also strip non-breaking and other Unicode spaces, which the official
 * rules keep, so the engine never uses them on invoice text.
 */
const XML_WS_EDGES = /^[\x20\x09\x0A\x0D]+|[\x20\x09\x0A\x0D]+$/g;

/** Text with XML whitespace removed at both ends (a non-breaking space stays). */
export const xmlTrim = (value: string): string => value.replace(XML_WS_EDGES, "");

/** XPath normalize-space(): runs of XML whitespace become one space, none at either end. */
export const normalizeSpace = (value: string | undefined): string =>
  (value ?? "").replace(/[\x20\x09\x0A\x0D]+/g, " ").replace(/^ | $/g, "");
