/* Reference code lists used by the EN16931 / Peppol rules. */

/**
 * ISO 4217 alpha-3 currency codes exactly as the official rules list them (CEN validation artefacts
 * 1.3.17 for BR-CL-03/04/05; Peppol BIS 3.0.22 $ISO4217 for PEPPOL-EN16931-CL007 is the same 178 codes).
 * Withdrawn codes such as HRK and BGN are not in it, so an invoice in them fails the official check too.
 */
export const ISO_4217: ReadonlySet<string> = new Set(
  (
    "AED AFN ALL AMD AOA ARS AUD AWG AZN BAM BBD BDT BHD BIF BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF " +
    "CHE CHF CHW CLF CLP CNH CNY COP COU CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS " +
    "GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD " +
    "KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK " +
    "NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP " +
    "STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VED VES VND VUV WST " +
    "XAF XAG XAU XBA XBB XBC XBD XCD XCG XDR XOF XPD XPF XPT XSU XTS XUA XXX YER ZAR ZMW ZWG"
  ).split(" "),
);

export const ISO_3166: Record<string, string> = {
  AD: "Andorra",
  AE: "United Arab Emirates",
  AF: "Afghanistan",
  AG: "Antigua and Barbuda",
  AI: "Anguilla",
  AL: "Albania",
  AM: "Armenia",
  AO: "Angola",
  AQ: "Antarctica",
  AR: "Argentina",
  AS: "American Samoa",
  AT: "Austria",
  AU: "Australia",
  AW: "Aruba",
  AX: "Åland Islands",
  AZ: "Azerbaijan",
  BA: "Bosnia and Herzegovina",
  BB: "Barbados",
  BD: "Bangladesh",
  BE: "Belgium",
  BF: "Burkina Faso",
  BG: "Bulgaria",
  BH: "Bahrain",
  BI: "Burundi",
  BJ: "Benin",
  BL: "Saint Barthélemy",
  BM: "Bermuda",
  BN: "Brunei",
  BO: "Bolivia",
  BQ: "Bonaire",
  BR: "Brazil",
  BS: "Bahamas",
  BT: "Bhutan",
  BV: "Bouvet Island",
  BW: "Botswana",
  BY: "Belarus",
  BZ: "Belize",
  CA: "Canada",
  CC: "Cocos Islands",
  CD: "Congo (DRC)",
  CF: "Central African Republic",
  CG: "Congo",
  CH: "Switzerland",
  CI: "Côte d'Ivoire",
  CK: "Cook Islands",
  CL: "Chile",
  CM: "Cameroon",
  CN: "China",
  CO: "Colombia",
  CR: "Costa Rica",
  CU: "Cuba",
  CV: "Cabo Verde",
  CW: "Curaçao",
  CX: "Christmas Island",
  CY: "Cyprus",
  CZ: "Czechia",
  DE: "Germany",
  DJ: "Djibouti",
  DK: "Denmark",
  DM: "Dominica",
  DO: "Dominican Republic",
  DZ: "Algeria",
  EC: "Ecuador",
  EE: "Estonia",
  EG: "Egypt",
  EH: "Western Sahara",
  ER: "Eritrea",
  ES: "Spain",
  ET: "Ethiopia",
  FI: "Finland",
  FJ: "Fiji",
  FK: "Falkland Islands",
  FM: "Micronesia",
  FO: "Faroe Islands",
  FR: "France",
  GA: "Gabon",
  GB: "United Kingdom",
  GD: "Grenada",
  GE: "Georgia",
  GF: "French Guiana",
  GG: "Guernsey",
  GH: "Ghana",
  GI: "Gibraltar",
  GL: "Greenland",
  GM: "Gambia",
  GN: "Guinea",
  GP: "Guadeloupe",
  GQ: "Equatorial Guinea",
  GR: "Greece",
  GS: "South Georgia",
  GT: "Guatemala",
  GU: "Guam",
  GW: "Guinea-Bissau",
  GY: "Guyana",
  HK: "Hong Kong",
  HM: "Heard and McDonald Islands",
  HN: "Honduras",
  HR: "Croatia",
  HT: "Haiti",
  HU: "Hungary",
  ID: "Indonesia",
  IE: "Ireland",
  IL: "Israel",
  IM: "Isle of Man",
  IN: "India",
  IO: "British Indian Ocean Territory",
  IQ: "Iraq",
  IR: "Iran",
  IS: "Iceland",
  IT: "Italy",
  JE: "Jersey",
  JM: "Jamaica",
  JO: "Jordan",
  JP: "Japan",
  KE: "Kenya",
  KG: "Kyrgyzstan",
  KH: "Cambodia",
  KI: "Kiribati",
  KM: "Comoros",
  KN: "Saint Kitts and Nevis",
  KP: "North Korea",
  KR: "South Korea",
  KW: "Kuwait",
  KY: "Cayman Islands",
  KZ: "Kazakhstan",
  LA: "Laos",
  LB: "Lebanon",
  LC: "Saint Lucia",
  LI: "Liechtenstein",
  LK: "Sri Lanka",
  LR: "Liberia",
  LS: "Lesotho",
  LT: "Lithuania",
  LU: "Luxembourg",
  LV: "Latvia",
  LY: "Libya",
  MA: "Morocco",
  MC: "Monaco",
  MD: "Moldova",
  ME: "Montenegro",
  MF: "Saint Martin",
  MG: "Madagascar",
  MH: "Marshall Islands",
  MK: "North Macedonia",
  ML: "Mali",
  MM: "Myanmar",
  MN: "Mongolia",
  MO: "Macao",
  MP: "Northern Mariana Islands",
  MQ: "Martinique",
  MR: "Mauritania",
  MS: "Montserrat",
  MT: "Malta",
  MU: "Mauritius",
  MV: "Maldives",
  MW: "Malawi",
  MX: "Mexico",
  MY: "Malaysia",
  MZ: "Mozambique",
  NA: "Namibia",
  NC: "New Caledonia",
  NE: "Niger",
  NF: "Norfolk Island",
  NG: "Nigeria",
  NI: "Nicaragua",
  NL: "Netherlands",
  NO: "Norway",
  NP: "Nepal",
  NR: "Nauru",
  NU: "Niue",
  NZ: "New Zealand",
  OM: "Oman",
  PA: "Panama",
  PE: "Peru",
  PF: "French Polynesia",
  PG: "Papua New Guinea",
  PH: "Philippines",
  PK: "Pakistan",
  PL: "Poland",
  PM: "Saint Pierre and Miquelon",
  PN: "Pitcairn",
  PR: "Puerto Rico",
  PS: "Palestine",
  PT: "Portugal",
  PW: "Palau",
  PY: "Paraguay",
  QA: "Qatar",
  RE: "Réunion",
  RO: "Romania",
  RS: "Serbia",
  RU: "Russia",
  RW: "Rwanda",
  SA: "Saudi Arabia",
  SB: "Solomon Islands",
  SC: "Seychelles",
  SD: "Sudan",
  SE: "Sweden",
  SG: "Singapore",
  SH: "Saint Helena",
  SI: "Slovenia",
  SJ: "Svalbard and Jan Mayen",
  SK: "Slovakia",
  SL: "Sierra Leone",
  SM: "San Marino",
  SN: "Senegal",
  SO: "Somalia",
  SR: "Suriname",
  SS: "South Sudan",
  ST: "São Tomé and Príncipe",
  SV: "El Salvador",
  SX: "Sint Maarten",
  SY: "Syria",
  SZ: "Eswatini",
  TC: "Turks and Caicos Islands",
  TD: "Chad",
  TF: "French Southern Territories",
  TG: "Togo",
  TH: "Thailand",
  TJ: "Tajikistan",
  TK: "Tokelau",
  TL: "Timor-Leste",
  TM: "Turkmenistan",
  TN: "Tunisia",
  TO: "Tonga",
  TR: "Türkiye",
  TT: "Trinidad and Tobago",
  TV: "Tuvalu",
  TW: "Taiwan",
  TZ: "Tanzania",
  UA: "Ukraine",
  UG: "Uganda",
  UM: "US Minor Outlying Islands",
  US: "United States",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VA: "Holy See",
  VC: "Saint Vincent and the Grenadines",
  VE: "Venezuela",
  VG: "British Virgin Islands",
  VI: "US Virgin Islands",
  VN: "Vietnam",
  VU: "Vanuatu",
  WF: "Wallis and Futuna",
  WS: "Samoa",
  XI: "Northern Ireland",
  YE: "Yemen",
  YT: "Mayotte",
  ZA: "South Africa",
  ZM: "Zambia",
  ZW: "Zimbabwe",
};

export const EU_COUNTRIES = [
  "AT",
  "BE",
  "BG",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
] as const;

/** UNCL5305 VAT category codes allowed by EN16931 */
export const VAT_CATEGORIES: Record<string, { label: string; short: string }> = {
  S: { label: "Standard rate", short: "Standard" },
  Z: { label: "Zero rated goods", short: "Zero rated" },
  E: { label: "Exempt from tax", short: "Exempt" },
  AE: { label: "VAT reverse charge", short: "Reverse charge" },
  K: { label: "Intra-community supply (VAT exempt, EEA)", short: "Intra-EU" },
  G: { label: "Free export item, VAT not charged", short: "Export" },
  O: { label: "Services outside scope of tax", short: "Out of scope" },
  L: { label: "Canary Islands general indirect tax (IGIC)", short: "IGIC" },
  M: {
    label: "Tax for production, services and importation in Ceuta and Melilla (IPSI)",
    short: "IPSI",
  },
};

/** UNCL1001 document type codes accepted by EN16931 */
export const INVOICE_TYPE_CODES: Record<string, string> = {
  "71": "Request for payment",
  "80": "Debit note related to goods or services",
  "81": "Credit note related to goods or services",
  "82": "Metered services invoice",
  "83": "Credit note related to financial adjustments",
  "84": "Debit note related to financial adjustments",
  "102": "Tax notification",
  "130": "Invoicing data sheet",
  "202": "Direct payment valuation",
  "203": "Provisional payment valuation",
  "204": "Payment valuation",
  "211": "Interim application for payment",
  "218": "Final payment request based on completion of work",
  "219": "Payment request for completed units",
  "261": "Self billed credit note",
  "262": "Consolidated credit note - goods and services",
  "295": "Price variation invoice",
  "296": "Credit note for price variation",
  "308": "Delcredere credit note",
  "325": "Proforma invoice",
  "326": "Partial invoice",
  "331": "Commercial invoice which includes a packing list",
  "380": "Commercial invoice",
  "381": "Credit note",
  "382": "Commission note",
  "383": "Debit note",
  "384": "Corrected invoice",
  "385": "Consolidated invoice",
  "386": "Prepayment invoice",
  "387": "Hire invoice",
  "388": "Tax invoice",
  "389": "Self-billed invoice",
  "390": "Delcredere invoice",
  "393": "Factored invoice",
  "394": "Lease invoice",
  "395": "Consignment invoice",
  "396": "Factored credit note",
  "420": "Optical Character Reading (OCR) payment credit note",
  "456": "Debit advice",
  "457": "Reversal of debit",
  "458": "Reversal of credit",
  "527": "Self billed debit note",
  "532": "Forwarder's credit note",
  "553": "Forwarder's invoice discrepancy report",
  "575": "Insurer's invoice",
  "623": "Forwarder's invoice",
  "633": "Port charges documents",
  "751": "Invoice information for accounting purposes",
  "780": "Freight invoice",
  "817": "Claim notification",
  "870": "Consular invoice",
  "875": "Partial construction invoice",
  "876": "Partial final construction invoice",
  "877": "Final construction invoice",
  "935": "Customs invoice",
};

export const PEPPOL_INVOICE_TYPE_CODES = new Set([
  // Peppol BIS Billing 3.0.22, PEPPOL-EN16931-P0100 (326 and 384 need two German parties, P0112)
  "71", "80", "82", "84", "102", "218", "219", "326", "331", "380", "382", "383", "384",
  "386", "388", "393", "395", "553", "575", "623", "780", "817", "870", "875", "876", "877",
]);
export const PEPPOL_CREDIT_NOTE_TYPE_CODES = new Set([
  // Peppol BIS Billing 3.0.22, PEPPOL-EN16931-P0101
  "81", "83", "381", "396", "532",
]);

/** UNCL4461 payment means */
export const PAYMENT_MEANS: Record<string, string> = {
  "1": "Instrument not defined",
  "2": "ACH credit",
  "3": "ACH debit",
  "4": "ACH demand debit reversal",
  "5": "ACH demand credit reversal",
  "6": "ACH demand credit",
  "7": "ACH demand debit",
  "8": "Hold",
  "9": "National or regional clearing",
  "10": "In cash",
  "11": "ACH savings credit reversal",
  "12": "ACH savings debit reversal",
  "13": "ACH savings credit",
  "14": "ACH savings debit",
  "15": "Bookentry credit",
  "16": "Bookentry debit",
  "17": "ACH demand CCD credit",
  "18": "ACH demand CCD debit",
  "19": "ACH demand CTP credit",
  "20": "Cheque",
  "21": "Banker's draft",
  "22": "Certified banker's draft",
  "23": "Bank cheque",
  "24": "Bill of exchange awaiting acceptance",
  "25": "Certified cheque",
  "26": "Local cheque",
  "27": "ACH demand CTP debit",
  "28": "ACH demand CTX credit",
  "29": "ACH demand CTX debit",
  "30": "Credit transfer",
  "31": "Debit transfer",
  "32": "ACH demand CCD+ credit",
  "33": "ACH demand CCD+ debit",
  "34": "ACH prearranged payment",
  "35": "ACH savings CCD credit",
  "36": "ACH savings CCD debit",
  "37": "ACH savings CTP credit",
  "38": "ACH savings CTP debit",
  "39": "ACH savings CTX credit",
  "40": "ACH savings CTX debit",
  "41": "ACH savings CCD+ credit",
  "42": "Payment to bank account",
  "43": "ACH savings CCD+ debit",
  "44": "Accepted bill of exchange",
  "45": "Referenced home-banking credit transfer",
  "46": "Interbank debit transfer",
  "47": "Home-banking debit transfer",
  "48": "Bank card",
  "49": "Direct debit",
  "50": "Payment by postgiro",
  "51": "FR, norme 6 97-Telereglement CFONB",
  "52": "Urgent commercial payment",
  "53": "Urgent Treasury Payment",
  "54": "Credit card",
  "55": "Debit card",
  "56": "Bankgiro",
  "57": "Standing agreement",
  "58": "SEPA credit transfer",
  "59": "SEPA direct debit",
  "60": "Promissory note",
  "61": "Promissory note signed by the debtor",
  "62": "Promissory note signed by the debtor and endorsed by a bank",
  "63": "Promissory note signed by the debtor and endorsed by a third party",
  "64": "Promissory note signed by a bank",
  "65": "Promissory note signed by a bank and endorsed by another bank",
  "66": "Promissory note signed by a third party",
  "67": "Promissory note signed by a third party and endorsed by a bank",
  "68": "Online payment service",
  "69": "Transfer Advice",
  "70": "Bill drawn by the creditor on the debtor",
  "74": "Bill drawn by the creditor on a bank",
  "75": "Bill drawn by the creditor, endorsed by another bank",
  "76": "Bill drawn by the creditor on a bank and endorsed by a third party",
  "77": "Bill drawn by the creditor on a third party",
  "78": "Bill drawn by creditor on third party, accepted and endorsed by bank",
  "91": "Not transferable banker's draft",
  "92": "Not transferable local cheque",
  "93": "Reference giro",
  "94": "Urgent giro",
  "95": "Free format giro",
  "96": "Requested method for payment was not used",
  "97": "Clearing between partners",
  "98": "JP, Electronically Recorded Monetary Claims",
  ZZZ: "Mutually defined",
};

export const CREDIT_TRANSFER_CODES = new Set(["30", "58"]);
export const DIRECT_DEBIT_CODES = new Set(["49", "59"]);

/** Peppol Electronic Address Scheme (EAS) codes with common labels */
export const EAS_CODES: Record<string, string> = {
  "0002": "FR SIRENE",
  "0007": "SE Organisationsnummer",
  "0009": "FR SIRET",
  "0037": "FI LY-tunnus",
  "0060": "DUNS number",
  "0088": "GLN (GS1)",
  "0096": "DK P-number",
  "0097": "IT FTI",
  "0106": "NL KvK number",
  "0130": "EU Directorates of the European Commission",
  "0135": "IT SIA",
  "0142": "IT SECETI",
  "0147": "Standard Company Code",
  "0151": "AU ABN",
  "0154": "Identification number of economic subjects (ICO)",
  "0158": "Identification number of economic subject (ICO) Act on State Statistics",
  "0170": "Teikoku Company Code",
  "0177": "Odette International",
  "0183": "CH UIDB",
  "0184": "DK CVR",
  "0188": "JP Corporate Number",
  "0190": "NL OIN",
  "0191": "EE Registry code",
  "0192": "NO Organisasjonsnummer",
  "0193": "UBL.BE party identifier",
  "0194": "KOIOS Open Technical Dictionary",
  "0195": "SG UEN",
  "0196": "IS Kennitala",
  "0198": "DK SE-number",
  "0199": "Legal Entity Identifier (LEI)",
  "0200": "LT Legal entity code",
  "0201": "IT Codice Univoco Ufficio",
  "0202": "DE Leitweg-ID (legacy)",
  "0203": "eDelivery network participant",
  "0204": "DE Leitweg-ID",
  "0205": "IT CODDEST",
  "0208": "BE Enterprise number",
  "0209": "GS1 identification keys",
  "0210": "IT Codice Fiscale",
  "0211": "IT Partita IVA",
  "0212": "FI Organization identifier",
  "0213": "FI VAT number",
  "0215": "FI Net service ID",
  "0216": "FI OVTcode",
  "0217": "NL Healthcare ID",
  "0218": "LV Unified registration number",
  "0221": "JP Registered Number of Qualified Invoice issuer",
  "0225": "FR Fiscal ID",
  "0230": "MY National e-Invoicing framework",
  "0235": "AE TIN",
  "0240": "LU Register of legal persons (MAT)",
  "0242": "OpenPeppol Service Provider ID",
  "0244": "NG Tax Identification Number",
  "0245": "SK Tax identification number (DIČ)",
  "0246": "DE German Electronic Business Address (GEBA)",
  "0248": "OM VAT identification number",
  "9910": "HU VAT number",
  "9913": "Business Registers Network",
  "9914": "AT VAT number (UID)",
  "9915": "AT Verwaltungskennzeichen",
  "9918": "SWIFT / IBAN",
  "9919": "AT Firmenbuchnummer",
  "9920": "ES VAT number",
  "9922": "AD VAT number",
  "9923": "AL VAT number",
  "9924": "BA VAT number",
  "9925": "BE VAT number",
  "9926": "BG VAT number",
  "9927": "CH VAT number",
  "9928": "CY VAT number",
  "9929": "CZ VAT number",
  "9930": "DE VAT number",
  "9931": "EE VAT number",
  "9932": "GB VAT number",
  "9933": "GR VAT number",
  "9934": "HR VAT number",
  "9935": "IE VAT number",
  "9936": "LI VAT number",
  "9937": "LT VAT number",
  "9938": "LU VAT number",
  "9939": "LV VAT number",
  "9940": "MC VAT number",
  "9941": "ME VAT number",
  "9942": "MK VAT number",
  "9943": "MT VAT number",
  "9944": "NL VAT number",
  "9945": "PL VAT number",
  "9946": "PT VAT number",
  "9947": "RO VAT number",
  "9948": "RS VAT number",
  "9949": "SI VAT number",
  "9950": "SK VAT number",
  "9951": "SM VAT number",
  "9952": "TR VAT number",
  "9953": "VA VAT number",
  "9957": "FR VAT number",
  "9959": "US EIN",
  "9960": "Temporary OpenPeppol SPIS scheme (replaced by 0242)",
  AN: "O.F.T.P. (ODETTE)",
  AQ: "X.400 address",
  AS: "AS2 exchange",
  AU: "File Transfer Protocol",
  EM: "Email",
};

/** Common UN/ECE Recommendation 20/21 unit codes */
export const UNIT_CODES: Record<string, string> = {
  C62: "One (unit)",
  EA: "Each",
  H87: "Piece",
  XPP: "Piece (package)",
  PCE: "Piece",
  SET: "Set",
  PR: "Pair",
  HUR: "Hour",
  MIN: "Minute",
  SEC: "Second",
  DAY: "Day",
  WEE: "Week",
  MON: "Month",
  ANN: "Year",
  QAN: "Quarter",
  KGM: "Kilogram",
  GRM: "Gram",
  TNE: "Tonne",
  MGM: "Milligram",
  LBR: "Pound",
  MTR: "Metre",
  CMT: "Centimetre",
  MMT: "Millimetre",
  KMT: "Kilometre",
  INH: "Inch",
  FOT: "Foot",
  MTK: "Square metre",
  MTQ: "Cubic metre",
  LTR: "Litre",
  MLT: "Millilitre",
  CLT: "Centilitre",
  KWH: "Kilowatt hour",
  MWH: "Megawatt hour",
  KWT: "Kilowatt",
  GWH: "Gigawatt hour",
  E48: "Service unit",
  ZZ: "Mutually defined",
  LS: "Lump sum",
  XBX: "Box",
  XPK: "Package",
  XPA: "Packet",
  XCT: "Carton",
  XPX: "Pallet",
  XBG: "Bag",
  XBO: "Bottle",
  XCR: "Crate",
  XRO: "Roll",
  XTU: "Tube",
  D64: "Thousand",
  MIL: "Thousand",
  "58": "Net kilogram",
  NAR: "Number of articles",
  NPR: "Number of pairs",
  E49: "Working day",
  E53: "Test",
  E54: "Trip",
  KTM: "Kilometre",
  KMH: "Kilometre per hour",
  A9: "Rate",
  AS: "Assortment",
  BX: "Box",
  CS: "Case",
  CT: "Carton",
  DZN: "Dozen",
  GLL: "Gallon (US)",
  GRO: "Gross",
  P1: "Percent",
  "11": "Outfit",
  "13": "Ration",
  "1I": "Fixed rate",
  "2N": "Decibel",
  "4K": "Milliampere",
  "5C": "Gallon (US) per thousand",
  B32: "Kilogram metre squared",
  BLL: "Barrel (US)",
  BG: "Bag",
  BO: "Bottle",
  CMQ: "Cubic centimetre",
  CEL: "Degree Celsius",
  DMT: "Decimetre",
  DTN: "Decitonne",
  GB: "Gigabyte",
  GBQ: "Gigabecquerel",
  HLT: "Hectolitre",
  KGS: "Kilogram per second",
  KTN: "Kilotonne",
  LM: "Linear metre",
  MAW: "Megawatt",
  MBR: "Millibar",
  MQH: "Cubic metre per hour",
  MTS: "Metre per second",
  NMP: "Number of packs",
  NIU: "Number of international units",
  PK: "Pack",
  PTN: "Portion",
  RO: "Roll",
  SMI: "Mile (statute mile)",
  ST: "Sheet",
  STK: "Stick",
  TU: "Tube",
  WTT: "Watt",
  XSA: "Sack",
  XST: "Sheet",
  Z5: "Lug",
  "4L": "Megabyte",
  E34: "Gigabyte",
  E35: "Terabyte",
  AD: "Byte",
  E36: "Petabyte",
  E37: "Pixel",
  E52: "Run foot",
  E55: "Use",
  E57: "Work order",
  E59: "Bit",
  E60: "Kilowatt hour per unit",
  EV: "Envelope",
  IE: "Person",
  KT: "Kit",
  LTN: "Long ton",
  OP: "Two pack",
  PA: "Packet",
  PL: "Pail",
  RM: "Ream",
  SA: "Sack",
  D97: "Pallet/unit load",
  DMQ: "Cubic decimetre",
};

/** VATEX exemption reason codes (CEF) */
export const VATEX_CODES: Record<string, string> = {
  "VATEX-EU-79-C": "Exempt based on article 79, point c of Council Directive 2006/112/EC",
  "VATEX-EU-132": "Exempt based on article 132 of Council Directive 2006/112/EC",
  "VATEX-EU-143": "Exempt based on article 143 of Council Directive 2006/112/EC",
  "VATEX-EU-148": "Exempt based on article 148 of Council Directive 2006/112/EC",
  "VATEX-EU-151": "Exempt based on article 151 of Council Directive 2006/112/EC",
  "VATEX-EU-309": "Exempt based on article 309 of Council Directive 2006/112/EC",
  "VATEX-EU-AE": "Reverse charge",
  "VATEX-EU-D": "Intra-Community acquisition from second hand means of transport",
  "VATEX-EU-F": "Intra-Community acquisition of second hand goods",
  "VATEX-EU-G": "Export outside the EU",
  "VATEX-EU-I": "Intra-Community acquisition of works of art",
  "VATEX-EU-IC": "Intra-Community supply",
  "VATEX-EU-O": "Not subject to VAT",
  "VATEX-EU-J": "Intra-Community acquisition of collectors items and antiques",
  "VATEX-FR-FRANCHISE": "France domestic VAT franchise in base",
  "VATEX-FR-CNWVAT":
    "France domestic Credit Notes without VAT, due to supplier forfeit of VAT for discount",
};

export const PEPPOL_CUSTOMIZATION_ID =
  "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0";
export const PEPPOL_PROFILE_ID = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";
export const XRECHNUNG_CUSTOMIZATION_PREFIX =
  "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0";
export const EN16931_ID = "urn:cen.eu:en16931:2017";
/**
 * SI-UBL 2.0 / NLCIUS, the Dutch CIUS (BT-24 starts with this). Published with the
 * validation artefacts of the Dutch Peppol Authority (github.com/peppolautoriteit-nl/validation).
 */
export const NLCIUS_CUSTOMIZATION_ID = "urn:cen.eu:en16931:2017#compliant#urn:fdc:nen.nl:nlcius:v1.0";
/** Suffix of the NLCIUS G-account extension (a second payment to a Dutch G-account). */
export const NLCIUS_GACCOUNT_SUFFIX = "#conformant#urn:fdc:nen.nl:gaccount:v1.0";

/** True when BT-24 marks the document as SI-UBL 2.0 / NLCIUS (or its G-account extension). */
export function isNlciusId(customizationId: string | undefined): boolean {
  const id = customizationId?.trim();
  return !!id && (id.includes("#compliant#urn:fdc:nen.nl:nlcius:v1.0") || id.includes(NLCIUS_GACCOUNT_SUFFIX));
}

export const FACTURX_PROFILES: Record<string, { label: string; en16931: boolean }> = {
  "urn:factur-x.eu:1p0:minimum": { label: "Factur-X MINIMUM", en16931: false },
  "urn:factur-x.eu:1p0:basicwl": { label: "Factur-X BASIC WL", en16931: false },
  "urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic": {
    label: "Factur-X BASIC",
    en16931: true,
  },
  "urn:cen.eu:en16931:2017": { label: "Factur-X / ZUGFeRD EN 16931 (Comfort)", en16931: true },
  "urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended": {
    label: "Factur-X EXTENDED",
    en16931: true,
  },
  "urn:cen.eu:en16931:2017#conformant#urn:zugferd.de:2p0:extended": {
    label: "ZUGFeRD EXTENDED",
    en16931: true,
  },
  "urn:cen.eu:en16931:2017#compliant#urn:zugferd.de:2p0:basic": {
    label: "ZUGFeRD BASIC",
    en16931: true,
  },
  "urn:zugferd.de:2p0:minimum": { label: "ZUGFeRD MINIMUM", en16931: false },
  "urn:zugferd.de:2p0:basicwl": { label: "ZUGFeRD BASIC WL", en16931: false },
};

/* ---------------- official code lists (copied from the validation artefacts) ---------------- */

/**
 * Unit codes EN 16931 accepts (BR-CL-23): UN/ECE Recommendation 20 with the Rec 21
 * extension, exactly as listed in the CEN validation artefacts 1.3.17 (EN16931-UBL-codes.sch).
 * `UNIT_CODES` above holds the common ones with names; this is the full list.
 */
export const REC20_UNIT_CODES: ReadonlySet<string> = new Set(
  (
    "10 11 13 14 15 20 21 22 23 24 25 27 28 33 34 35 37 38 40 41 56 57 58 59 60 61 74 77 80 81 85 87 " +
    "89 91 1I 2A 2B 2C 2G 2H 2I 2J 2K 2L 2M 2N 2P 2Q 2R 2U 2X 2Y 2Z 3B 3C 4C 4G 4H 4K 4L 4M 4N 4O 4P " +
    "4Q 4R 4T 4U 4W 4X 5A 5B 5E 5J A10 A11 A12 A13 A14 A15 A16 A17 A18 A19 A2 A20 A21 A22 A23 A24 A26 " +
    "A27 A28 A29 A3 A30 A31 A32 A33 A34 A35 A36 A37 A38 A39 A4 A40 A41 A42 A43 A44 A45 A47 A48 A49 A5 " +
    "A53 A54 A55 A56 A59 A6 A68 A69 A7 A70 A71 A73 A74 A75 A76 A8 A84 A85 A86 A87 A88 A89 A9 A90 A91 " +
    "A93 A94 A95 A96 A97 A98 A99 AA AB ACR ACT AD AE AH AI AK AL AMH AMP ANN APZ AQ AS ASM ASU ATM " +
    "AWG AY AZ B1 B10 B11 B12 B13 B14 B15 B16 B17 B18 B19 B20 B21 B22 B23 B24 B25 B26 B27 B28 B29 B3 " +
    "B30 B31 B32 B33 B34 B35 B4 B41 B42 B43 B44 B45 B46 B47 B48 B49 B50 B52 B53 B54 B55 B56 B57 B58 " +
    "B59 B60 B61 B62 B63 B64 B66 B67 B68 B69 B7 B70 B71 B72 B73 B74 B75 B76 B77 B78 B79 B8 B80 B81 " +
    "B82 B83 B84 B85 B86 B87 B88 B89 B90 B91 B92 B93 B94 B95 B96 B97 B98 B99 BAR BB BFT BHP BIL BLD " +
    "BLL BP BPM BQL BTU BUA BUI C0 C10 C11 C12 C13 C14 C15 C16 C17 C18 C19 C20 C21 C22 C23 C24 C25 " +
    "C26 C27 C28 C29 C3 C30 C31 C32 C33 C34 C35 C36 C37 C38 C39 C40 C41 C42 C43 C44 C45 C46 C47 C48 " +
    "C49 C50 C51 C52 C53 C54 C55 C56 C57 C58 C59 C60 C61 C62 C63 C64 C65 C66 C67 C68 C69 C7 C70 C71 " +
    "C72 C73 C74 C75 C76 C78 C79 C8 C80 C81 C82 C83 C84 C85 C86 C87 C88 C89 C9 C90 C91 C92 C93 C94 " +
    "C95 C96 C97 C99 CCT CDL CEL CEN CG CGM CKG CLF CLT CMK CMQ CMT CNP CNT COU CTG CTM CTN CUR CWA " +
    "CWI D03 D04 D1 D10 D11 D12 D13 D15 D16 D17 D18 D19 D2 D20 D21 D22 D23 D24 D25 D26 D27 D29 D30 " +
    "D31 D32 D33 D34 D36 D41 D42 D43 D44 D45 D46 D47 D48 D49 D5 D50 D51 D52 D53 D54 D55 D56 D57 D58 " +
    "D59 D6 D60 D61 D62 D63 D65 D68 D69 D73 D74 D77 D78 D80 D81 D82 D83 D85 D86 D87 D88 D89 D91 D93 " +
    "D94 D95 DAA DAD DAY DB DBM DBW DD DEC DG DJ DLT DMA DMK DMO DMQ DMT DN DPC DPR DPT DRA DRI DRL " +
    "DT DTN DWT DZN DZP E01 E07 E08 E09 E10 E12 E14 E15 E16 E17 E18 E19 E20 E21 E22 E23 E25 E27 E28 " +
    "E30 E31 E32 E33 E34 E35 E36 E37 E38 E39 E4 E40 E41 E42 E43 E44 E45 E46 E47 E48 E49 E50 E51 E52 " +
    "E53 E54 E55 E56 E57 E58 E59 E60 E61 E62 E63 E64 E65 E66 E67 E68 E69 E70 E71 E72 E73 E74 E75 E76 " +
    "E77 E78 E79 E80 E81 E82 E83 E84 E85 E86 E87 E88 E89 E90 E91 E92 E93 E94 E95 E96 E97 E98 E99 EA " +
    "EB EQ F01 F02 F03 F04 F05 F06 F07 F08 F10 F11 F12 F13 F14 F15 F16 F17 F18 F19 F20 F21 F22 F23 " +
    "F24 F25 F26 F27 F28 F29 F30 F31 F32 F33 F34 F35 F36 F37 F38 F39 F40 F41 F42 F43 F44 F45 F46 F47 " +
    "F48 F49 F50 F51 F52 F53 F54 F55 F56 F57 F58 F59 F60 F61 F62 F63 F64 F65 F66 F67 F68 F69 F70 F71 " +
    "F72 F73 F74 F75 F76 F77 F78 F79 F80 F81 F82 F83 F84 F85 F86 F87 F88 F89 F90 F91 F92 F93 F94 F95 " +
    "F96 F97 F98 F99 FAH FAR FBM FC FF FH FIT FL FNU FOT FP FR FS FTK FTQ G01 G04 G05 G06 G08 G09 G10 " +
    "G11 G12 G13 G14 G15 G16 G17 G18 G19 G2 G20 G21 G23 G24 G25 G26 G27 G28 G29 G3 G30 G31 G32 G33 " +
    "G34 G35 G36 G37 G38 G39 G40 G41 G42 G43 G44 G45 G46 G47 G48 G49 G50 G51 G52 G53 G54 G55 G56 G57 " +
    "G58 G59 G60 G61 G62 G63 G64 G65 G66 G67 G68 G69 G70 G71 G72 G73 G74 G75 G76 G77 G78 G79 G80 G81 " +
    "G82 G83 G84 G85 G86 G87 G88 G89 G90 G91 G92 G93 G94 G95 G96 G97 G98 G99 GB GBQ GDW GE GF GFI GGR " +
    "GIA GIC GII GIP GJ GL GLD GLI GLL GM GO GP GQ GRM GRN GRO GV GWH H03 H04 H05 H06 H07 H08 H09 H10 " +
    "H11 H12 H13 H14 H15 H16 H18 H19 H20 H21 H22 H23 H24 H25 H26 H27 H28 H29 H30 H31 H32 H33 H34 H35 " +
    "H36 H37 H38 H39 H40 H41 H42 H43 H44 H45 H46 H47 H48 H49 H50 H51 H52 H53 H54 H55 H56 H57 H58 H59 " +
    "H60 H61 H62 H63 H64 H65 H66 H67 H68 H69 H70 H71 H72 H73 H74 H75 H76 H77 H79 H80 H81 H82 H83 H84 " +
    "H85 H87 H88 H89 H90 H91 H92 H93 H94 H95 H96 H98 H99 HA HAD HBA HBX HC HDW HEA HGM HH HIU HKM HLT " +
    "HM HMO HMQ HMT HPA HTZ HUR HWE IA IE INH INK INQ ISD IU IUG IV J10 J12 J13 J14 J15 J16 J17 J18 " +
    "J19 J2 J20 J21 J22 J23 J24 J25 J26 J27 J28 J29 J30 J31 J32 J33 J34 J35 J36 J38 J39 J40 J41 J42 " +
    "J43 J44 J45 J46 J47 J48 J49 J50 J51 J52 J53 J54 J55 J56 J57 J58 J59 J60 J61 J62 J63 J64 J65 J66 " +
    "J67 J68 J69 J70 J71 J72 J73 J74 J75 J76 J78 J79 J81 J82 J83 J84 J85 J87 J90 J91 J92 J93 J95 J96 " +
    "J97 J98 J99 JE JK JM JNT JOU JPS JWL K1 K10 K11 K12 K13 K14 K15 K16 K17 K18 K19 K2 K20 K21 K22 " +
    "K23 K26 K27 K28 K3 K30 K31 K32 K33 K34 K35 K36 K37 K38 K39 K40 K41 K42 K43 K45 K46 K47 K48 K49 " +
    "K50 K51 K52 K53 K54 K55 K58 K59 K6 K60 K61 K62 K63 K64 K65 K66 K67 K68 K69 K70 K71 K73 K74 K75 " +
    "K76 K77 K78 K79 K80 K81 K82 K83 K84 K85 K86 K87 K88 K89 K90 K91 K92 K93 K94 K95 K96 K97 K98 K99 " +
    "KA KAT KB KBA KCC KDW KEL KGM KGS KHY KHZ KI KIC KIP KJ KJO KL KLK KLX KMA KMH KMK KMQ KMT KNI " +
    "KNM KNS KNT KO KPA KPH KPO KPP KR KSD KSH KT KTN KUR KVA KVR KVT KW KWH KWN KWO KWS KWT KWY KX " +
    "L10 L11 L12 L13 L14 L15 L16 L17 L18 L19 L2 L20 L21 L23 L24 L25 L26 L27 L28 L29 L30 L31 L32 L33 " +
    "L34 L35 L36 L37 L38 L39 L40 L41 L42 L43 L44 L45 L46 L47 L48 L49 L50 L51 L52 L53 L54 L55 L56 L57 " +
    "L58 L59 L60 L63 L64 L65 L66 L67 L68 L69 L70 L71 L72 L73 L74 L75 L76 L77 L78 L79 L80 L81 L82 L83 " +
    "L84 L85 L86 L87 L88 L89 L90 L91 L92 L93 L94 L95 L96 L98 L99 LA LAC LBR LBT LD LEF LF LH LK LM LN " +
    "LO LP LPA LR LS LTN LTR LUB LUM LUX LY M1 M10 M11 M12 M13 M14 M15 M16 M17 M18 M19 M20 M21 M22 " +
    "M23 M24 M25 M26 M27 M29 M30 M31 M32 M33 M34 M35 M36 M37 M38 M39 M4 M40 M41 M42 M43 M44 M45 M46 " +
    "M47 M48 M49 M5 M50 M51 M52 M53 M55 M56 M57 M58 M59 M60 M61 M62 M63 M64 M65 M66 M67 M68 M69 M7 " +
    "M70 M71 M72 M73 M74 M75 M76 M77 M78 M79 M80 M81 M82 M83 M84 M85 M86 M87 M88 M89 M9 M90 M91 M92 " +
    "M93 M94 M95 M96 M97 M98 M99 MAH MAL MAM MAR MAW MBE MBF MBR MC MCU MD MGM MHZ MIK MIL MIN MIO " +
    "MIU MKD MKM MKW MLD MLT MMK MMQ MMT MND MNJ MON MPA MQD MQH MQM MQS MQW MRD MRM MRW MSK MTK MTQ " +
    "MTR MTS MTZ MVA MWH N1 N10 N11 N12 N13 N14 N15 N16 N17 N18 N19 N20 N21 N22 N23 N24 N25 N26 N27 " +
    "N28 N29 N3 N30 N31 N32 N33 N34 N35 N36 N37 N38 N39 N40 N41 N42 N43 N44 N45 N46 N47 N48 N49 N50 " +
    "N51 N52 N53 N54 N55 N56 N57 N58 N59 N60 N61 N62 N63 N64 N65 N66 N67 N68 N69 N70 N71 N72 N73 N74 " +
    "N75 N76 N77 N78 N79 N80 N81 N82 N83 N84 N85 N86 N87 N88 N89 N90 N91 N92 N93 N94 N95 N96 N97 N98 " +
    "N99 NA NAR NCL NEW NF NIL NIU NL NM3 NMI NMP NPT NT NTU NU NX OA ODE ODG ODK ODM OHM ON ONZ OPM " +
    "OT OZA OZI P1 P10 P11 P12 P13 P14 P15 P16 P17 P18 P19 P2 P20 P21 P22 P23 P24 P25 P26 P27 P28 P29 " +
    "P30 P31 P32 P33 P34 P35 P36 P37 P38 P39 P40 P41 P42 P43 P44 P45 P46 P47 P48 P49 P5 P50 P51 P52 " +
    "P53 P54 P55 P56 P57 P58 P59 P60 P61 P62 P63 P64 P65 P66 P67 P68 P69 P70 P71 P72 P73 P74 P75 P76 " +
    "P77 P78 P79 P80 P81 P82 P83 P84 P85 P86 P87 P88 P89 P90 P91 P92 P93 P94 P95 P96 P97 P98 P99 PAL " +
    "PD PFL PGL PI PLA PO PQ PR PS PTD PTI PTL PTN Q10 Q11 Q12 Q13 Q14 Q15 Q16 Q17 Q18 Q19 Q20 Q21 " +
    "Q22 Q23 Q24 Q25 Q26 Q27 Q28 Q29 Q3 Q30 Q31 Q32 Q33 Q34 Q35 Q36 Q37 Q38 Q39 Q40 Q41 Q42 QA QAN QB " +
    "QR QTD QTI QTL QTR R1 R9 RH RM ROM RP RPM RPS RT S3 S4 SAN SCO SCR SEC SET SG SIE SM3 SMI SQ SQR " +
    "SR STC STI STK STL STN STW SW SX SYR T0 T3 TAH TAN TI TIC TIP TKM TMS TNE TP TPI TPR TQD TRL TST " +
    "TTS U1 U2 UB UC VA VLT VP W2 WA WB WCD WE WEB WEE WG WHR WM WSD WTT X1 YDK YDQ YRD Z11 Z9 ZP ZZ " +
    "X1A X1B X1D X1F X1G X1W X2C X3A X3H X43 X44 X4A X4B X4C X4D X4F X4G X4H X5H X5L X5M X6H X6P X7A " +
    "X7B X8A X8B X8C XAA XAB XAC XAD XAE XAF XAG XAH XAI XAJ XAL XAM XAP XAT XAV XB4 XBA XBB XBC XBD " +
    "XBE XBF XBG XBH XBI XBJ XBK XBL XBM XBN XBO XBP XBQ XBR XBS XBT XBU XBV XBW XBX XBY XBZ XCA XCB " +
    "XCC XCD XCE XCF XCG XCH XCI XCJ XCK XCL XCM XCN XCO XCP XCQ XCR XCS XCT XCU XCV XCW XCX XCY XCZ " +
    "XDA XDB XDC XDG XDH XDI XDJ XDK XDL XDM XDN XDP XDR XDS XDT XDU XDV XDW XDX XDY XEC XED XEE XEF " +
    "XEG XEH XEI XEN XFB XFC XFD XFE XFI XFL XFO XFP XFR XFT XFW XFX XGB XGI XGL XGR XGU XGY XGZ XHA " +
    "XHB XHC XHG XHN XHR XIA XIB XIC XID XIE XIF XIG XIH XIK XIL XIN XIZ XJB XJC XJG XJR XJT XJY XKG " +
    "XKI XLE XLG XLT XLU XLV XLZ XMA XMB XMC XME XMR XMS XMT XMW XMX XNA XNE XNF XNG XNS XNT XNU XNV " +
    "XO1 XO2 XO3 XO4 XO5 XO6 XO7 XO8 XO9 XOA XOB XOC XOD XOE XOF XOG XOH XOI XOJ XOK XOL XOM XON XOP " +
    "XOQ XOR XOS XOT XOU XOV XOW XOX XOY XOZ XP1 XP2 XP3 XP4 XPA XPB XPC XPD XPE XPF XPG XPH XPI XPJ " +
    "XPK XPL XPN XPO XPP XPR XPT XPU XPV XPX XPY XPZ XQA XQB XQC XQD XQF XQG XQH XQJ XQK XQL XQM XQN " +
    "XQP XQQ XQR XQS XRD XRG XRJ XRK XRL XRO XRT XRZ XSA XSB XSC XSD XSE XSH XSI XSK XSL XSM XSO XSP " +
    "XSS XST XSU XSV XSW XSX XSY XSZ XT1 XTB XTC XTD XTE XTG XTI XTK XTL XTN XTO XTR XTS XTT XTU XTV " +
    "XTW XTY XTZ XUC XUN XVA XVG XVI XVK XVL XVN XVO XVP XVQ XVR XVS XVY XWA XWB XWC XWD XWF XWG XWH " +
    "XWJ XWK XWL XWM XWN XWP XWQ XWR XWS XWT XWU XWV XWW XWX XWY XWZ XXA XXB XXC XXD XXF XXG XXH XXJ " +
    "XXK XYA XYB XYC XYD XYF XYG XYH XYJ XYK XYL XYM XYN XYP XYQ XYR XYS XYT XYV XYW XYX XYY XYZ XZA " +
    "XZB XZC XZD XZF XZG XZH XZJ XZK XZL XZM XZN XZP XZQ XZR XZS XZT XZU XZV XZW XZX XZY XZZ"
  ).split(" "),
);

/**
 * ISO/IEC 6523 ICD scheme identifiers EN 16931 accepts for a legal registration number
 * (BR-CL-11, cac:PartyLegalEntity/cbc:CompanyID/@schemeID), CEN validation artefacts 1.3.17.
 */
export const ICD_CODES: ReadonlySet<string> = new Set(
  (
    "0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017 0018 0019 0020 " +
    "0021 0022 0023 0024 0025 0026 0027 0028 0029 0030 0031 0032 0033 0034 0035 0036 0037 0038 0039 " +
    "0040 0041 0042 0043 0044 0045 0046 0047 0048 0049 0050 0051 0052 0053 0054 0055 0056 0057 0058 " +
    "0059 0060 0061 0062 0063 0064 0065 0066 0067 0068 0069 0070 0071 0072 0073 0074 0075 0076 0077 " +
    "0078 0079 0080 0081 0082 0083 0084 0085 0086 0087 0088 0089 0090 0091 0093 0094 0095 0096 0097 " +
    "0098 0099 0100 0101 0102 0104 0105 0106 0107 0108 0109 0110 0111 0112 0113 0114 0115 0116 0117 " +
    "0118 0119 0120 0121 0122 0123 0124 0125 0126 0127 0128 0129 0130 0131 0132 0133 0134 0135 0136 " +
    "0137 0138 0139 0140 0141 0142 0143 0144 0145 0146 0147 0148 0149 0150 0151 0152 0153 0154 0155 " +
    "0156 0157 0158 0159 0160 0161 0162 0163 0164 0165 0166 0167 0168 0169 0170 0171 0172 0173 0174 " +
    "0175 0176 0177 0178 0179 0180 0183 0184 0185 0186 0187 0188 0189 0190 0191 0192 0193 0194 0195 " +
    "0196 0197 0198 0199 0200 0201 0202 0203 0204 0205 0206 0207 0208 0209 0210 0211 0212 0213 0214 " +
    "0215 0216 0217 0218 0219 0220 0221 0222 0223 0224 0225 0226 0227 0228 0229 0230 0231 0232 0233 " +
    "0234 0235 0236 0237 0238 0239 0240 0241 0242 0243 0244 0245 0246 0247 0248 0249 0250 0251"
  ).split(" "),
);

/**
 * Electronic address schemes Peppol accepts for an EndpointID (PEPPOL-EN16931-CL008), as listed in
 * Peppol BIS Billing 3.0.22 (PEPPOL-EN16931-UBL.sch, variable eaid). A subset of the EAS list
 * EN 16931 accepts (BR-CL-25, `EAS_CODES`).
 */
export const PEPPOL_EAS_CODES: ReadonlySet<string> = new Set(
  (
    "0002 0007 0009 0060 0088 0096 0097 0106 0130 0135 0142 0151 0158 0183 0184 0188 0190 0191 0192 " +
    "0195 0196 0198 0199 0200 0201 0204 0208 0209 0210 0211 0216 0218 0221 0225 0230 0235 0240 0242 " +
    "0244 0245 0246 0248 9910 9913 9914 9915 9918 9919 9920 9922 9923 9924 9925 9926 9927 9928 9929 " +
    "9930 9931 9932 9933 9934 9935 9936 9937 9938 9939 9940 9941 9942 9943 9944 9945 9946 9947 9948 " +
    "9949 9950 9951 9952 9953 9957 9959"
  ).split(" "),
);

/**
 * Attachment MIME codes EN 16931 (BR-CL-24) and Peppol (PEPPOL-EN16931-CL001) accept for an
 * embedded document (BT-125), CEN 1.3.17 and Peppol BIS 3.0.22 (same six codes).
 */
export const ATTACHMENT_MIME_CODES: ReadonlySet<string> = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.spreadsheet",
]);

/**
 * Business process identifiers (BT-23) Peppol BIS Billing 3.0.22 approves (PEPPOL-EN16931-R007):
 * the billing process, the two French reform processes and billing with response.
 */
export const PEPPOL_PROFILE_IDS: ReadonlySet<string> = new Set([
  PEPPOL_PROFILE_ID,
  "urn:peppol:france:billing:regulated",
  "urn:peppol:france:billing:non-regulated",
  "urn:peppol:bis:billing_with_response",
]);
/** Business processes Peppol BIS 3.0.22's CII rules approve (PEPPOL-EN16931-CII.sch): no French ones. */
export const PEPPOL_CII_PROFILE_IDS: ReadonlySet<string> = new Set([
  PEPPOL_PROFILE_ID,
  "urn:peppol:bis:billing_with_response",
]);

/** UNTDID 1153 reference codes (818) the official BR-CL-07 accepts as the invoiced object identifier scheme (BT-18), as listed in the CEN validation artefacts 1.3.17. */
export const UNTDID_1153_CODES: ReadonlySet<string> = new Set(
  (
    "AAA AAB AAC AAD AAE AAF AAG AAH AAI AAJ AAK AAL AAM AAN AAO AAP AAQ AAR AAS AAT AAU AAV AAW AAX AAY " +
    "AAZ ABA ABB ABC ABD ABE ABF ABG ABH ABI ABJ ABK ABL ABM ABN ABO ABP ABQ ABR ABS ABT ABU ABV ABW ABX " +
    "ABY ABZ AC ACA ACB ACC ACD ACE ACF ACG ACH ACI ACJ ACK ACL ACN ACO ACP ACQ ACR ACT ACU ACV ACW ACX " +
    "ACY ACZ ADA ADB ADC ADD ADE ADF ADG ADI ADJ ADK ADL ADM ADN ADO ADP ADQ ADT ADU ADV ADW ADX ADY ADZ " +
    "AE AEA AEB AEC AED AEE AEF AEG AEH AEI AEJ AEK AEL AEM AEN AEO AEP AEQ AER AES AET AEU AEV AEW AEX " +
    "AEY AEZ AF AFA AFB AFC AFD AFE AFF AFG AFH AFI AFJ AFK AFL AFM AFN AFO AFP AFQ AFR AFS AFT AFU AFV " +
    "AFW AFX AFY AFZ AGA AGB AGC AGD AGE AGF AGG AGH AGI AGJ AGK AGL AGM AGN AGO AGP AGQ AGR AGS AGT AGU " +
    "AGV AGW AGX AGY AGZ AHA AHB AHC AHD AHE AHF AHG AHH AHI AHJ AHK AHL AHM AHN AHO AHP AHQ AHR AHS AHT " +
    "AHU AHV AHX AHY AHZ AIA AIB AIC AID AIE AIF AIG AIH AII AIJ AIK AIL AIM AIN AIO AIP AIQ AIR AIS AIT " +
    "AIU AIV AIW AIX AIY AIZ AJA AJB AJC AJD AJE AJF AJG AJH AJI AJJ AJK AJL AJM AJN AJO AJP AJQ AJR AJS " +
    "AJT AJU AJV AJW AJX AJY AJZ AKA AKB AKC AKD AKE AKF AKG AKH AKI AKJ AKK AKL AKM AKN AKO AKP AKQ AKR " +
    "AKS AKT AKU AKV AKW AKX AKY AKZ ALA ALB ALC ALD ALE ALF ALG ALH ALI ALJ ALK ALL ALM ALN ALO ALP ALQ " +
    "ALR ALS ALT ALU ALV ALW ALX ALY ALZ AMA AMB AMC AMD AME AMF AMG AMH AMI AMJ AMK AML AMM AMN AMO AMP " +
    "AMQ AMR AMS AMT AMU AMV AMW AMX AMY AMZ ANA ANB ANC AND ANE ANF ANG ANH ANI ANJ ANK ANL ANM ANN ANO " +
    "ANP ANQ ANR ANS ANT ANU ANV ANW ANX ANY AOA AOD AOE AOF AOG AOH AOI AOJ AOK AOL AOM AON AOO AOP AOQ " +
    "AOR AOS AOT AOU AOV AOW AOX AOY AOZ AP APA APB APC APD APE APF APG APH API APJ APK APL APM APN APO " +
    "APP APQ APR APS APT APU APV APW APX APY APZ AQA AQB AQC AQD AQE AQF AQG AQH AQI AQJ AQK AQL AQM AQN " +
    "AQO AQP AQQ AQR AQS AQT AQU AQV AQW AQX AQY AQZ ARA ARB ARC ARD ARE ARF ARG ARH ARI ARJ ARK ARL ARM " +
    "ARN ARO ARP ARQ ARR ARS ART ARU ARV ARW ARX ARY ARZ ASA ASB ASC ASD ASE ASF ASG ASH ASI ASJ ASK ASL " +
    "ASM ASN ASO ASP ASQ ASR ASS AST ASU ASV ASW ASX ASY ASZ ATA ATB ATC ATD ATE ATF ATG ATH ATI ATJ ATK " +
    "ATL ATM ATN ATO ATP ATQ ATR ATS ATT ATU ATV ATW ATX ATY ATZ AU AUA AUB AUC AUD AUE AUF AUG AUH AUI " +
    "AUJ AUK AUL AUM AUN AUO AUP AUQ AUR AUS AUT AUU AUV AUW AUX AUY AUZ AV AVA AVB AVC AVD AVE AVF AVG " +
    "AVH AVI AVJ AVK AVL AVM AVN AVO AVP AVQ AVR AVS AVT AVU AVV AVW AVX AVY AVZ AWA AWB AWC AWD AWE AWF " +
    "AWG AWH AWI AWJ AWK AWL AWM AWN AWO AWP AWQ AWR AWS AWT AWU AWV AWW AWX AWY AWZ AXA AXB AXC AXD AXE " +
    "AXF AXG AXH AXI AXJ AXK AXL AXM AXN AXO AXP AXQ AXR AXS AXU BA BC BD BE BH BM BN BO BR BT BTP BW CAS " +
    "CAT CAU CAV CAW CAX CAY CAZ CBA CBB CD CEC CED CFE CFF CFO CG CH CK CKN CM CMR CN CNO COF CP CR CRN " +
    "CS CST CT CU CV CW CZ DA DAN DB DI DL DM DQ DR EA EB ED EE EEP EI EN EQ ER ERN ET EX FC FF FI FLW FN " +
    "FO FS FT FV FX GA GC GD GDN GN HS HWB IA IB ICA ICE ICO II IL INB INN INO IP IS IT IV JB JE LA LAN " +
    "LAR LB LC LI LO LRC LS MA MB MF MG MH MR MRN MS MSS MWB NA NF OH OI ON OP OR PB PC PD PE PF PI PK PL " +
    "POR PP PQ PR PS PW PY RA RC RCN RE REN RF RR RT SA SB SD SE SEA SF SH SI SM SN SP SQ SRN SS STA SW " +
    "SZ TB TCR TE TF TI TIN TL TN TP UAR UC UCN UN UO URI VA VC VGR VM VN VON VOR VP VR VS VT VV WE WM WN " +
    "WR WS WY XA XC XP ZZZ"
  ).split(" "),
);

/** UNTDID 7143 item classification schemes (185) the official BR-CL-13 accepts as listID (BT-158), as listed in the CEN validation artefacts 1.3.17. */
export const UNTDID_7143_CODES: ReadonlySet<string> = new Set(
  (
    "AA AB AC AD AE AF AG AH AI AJ AK AL AM AN AO AP AQ AR AS AT AU AV AW AX AY AZ BA BB BC BD BE BF BG " +
    "BH BI BJ BK BL BM BN BO BP BQ BR BS BT BU BV BW BX BY BZ CC CG CL CR CV DR DW EC EF EMD EN FS GB GN " +
    "GMN GS HS IB IN IS IT IZ MA MF MN MP NB ON PD PL PO PPI PV QS RC RN RU RY SA SG SK SN SRS SRT SRU " +
    "SRV SRW SRX SRY SRZ SS SSA SSB SSC SSD SSE SSF SSG SSH SSI SSJ SSK SSL SSM SSN SSO SSP SSQ SSR SSS " +
    "SST SSU SSV SSW SSX SSY SSZ ST STA STB STC STD STE STF STG STH STI STJ STK STL STM STN STO STP STQ " +
    "STR STS STT STU STV STW STX STY STZ SUA SUB SUC SUD SUE SUF SUG SUH SUI SUJ SUK SUL SUM TG TSN TSO " +
    "TSP TSQ TSR TSS TST TSU UA UP VN VP VS VX ZZZ"
  ).split(" "),
);

/** UNCL 5189 allowance reason codes (19) BR-CL-19 and PEPPOL-EN16931-CL002 accept (CEN 1.3.17 and Peppol BIS 3.0.22 list the same codes). */
export const UNCL_5189_CODES: ReadonlySet<string> = new Set(
  (
    "41 42 60 62 63 64 65 66 67 68 70 71 88 95 100 102 103 104 105"
  ).split(" "),
);

/** UNCL 7161 charge reason codes (178) BR-CL-20 and PEPPOL-EN16931-CL003 accept (CEN 1.3.17 and Peppol BIS 3.0.22 list the same codes). */
export const UNCL_7161_CODES: ReadonlySet<string> = new Set(
  (
    "AA AAA AAC AAD AAE AAF AAH AAI AAS AAT AAV AAY AAZ ABA ABB ABC ABD ABF ABK ABL ABN ABR ABS ABT ABU " +
    "ACF ACG ACH ACI ACJ ACK ACL ACM ACS ADC ADE ADJ ADK ADL ADM ADN ADO ADP ADQ ADR ADT ADW ADY ADZ AEA " +
    "AEB AEC AED AEF AEH AEI AEJ AEK AEL AEM AEN AEO AEP AES AET AEU AEV AEW AEX AEY AEZ AJ AU CA CAB CAD " +
    "CAE CAF CAI CAJ CAK CAL CAM CAN CAO CAP CAQ CAR CAS CAT CAU CAV CAW CAX CAY CAZ CD CG CS CT DAB DAD " +
    "DAC DAF DAG DAH DAI DAJ DAK DAL DAM DAN DAO DAP DAQ DL EG EP ER FAA FAB FAC FC FH FI GAA HAA HD HH " +
    "IAA IAB ID IF IR IS KO L1 LA LAA LAB LF MAE MI ML NAA OA PA PAA PC PL PRV RAB RAC RAD RAF RE RF RH " +
    "RV SA SAA SAD SAE SAI SG SH SM SU TAB TAC TT TV V1 V2 WH XAA YY ZZZ"
  ).split(" "),
);

/**
 * Country codes BR-CL-14 and BR-CL-15 accept: ISO 3166-1 alpha-2 plus 1A (Kosovo), exactly the 251 codes the
 * CEN validation artefacts 1.3.17 list. ISO_3166 above stays the named list the forms and labels use.
 */
export const CEN_COUNTRY_CODES: ReadonlySet<string> = new Set([...Object.keys(ISO_3166), "1A"]);

/**
 * UNCL 5305 VAT category codes BR-CL-17 and BR-CL-18 accept (CEN 1.3.17): the nine EN 16931 categories plus B
 * (transferred VAT, Italy). VAT_CATEGORIES above has the nine with their labels.
 */
export const UNCL_5305_CODES: ReadonlySet<string> = new Set(["AE", "L", "M", "E", "S", "Z", "G", "O", "K", "B"]);

/**
 * UNTDID 4451 text subject qualifiers EN 16931 accepts for an invoice note's subject code (BR-CL-08), in the
 * UBL order of the CEN validation artefacts 1.3.17 (CII lists the same codes). UBL's test runs XPath
 * contains() on the list written out with single spaces (UNTDID_4451_TEXT).
 */
export const UNTDID_4451_LIST: readonly string[] = (
    "AAA AAB AAC AAD AAE AAF AAG AAI AAJ AAK AAL AAM AAN AAO AAP AAQ AAR AAS AAT AAU AAV AAW AAX AAY " +
    "AAZ ABA ABB ABC ABD ABE ABF ABG ABH ABI ABJ ABK ABL ABM ABN ABO ABP ABQ ABR ABS ABT ABU ABV ABW " +
    "ABX ABZ ACA ACB ACC ACD ACE ACF ACG ACH ACI ACJ ACK ACL ACM ACN ACO ACP ACQ ACR ACS ACT ACU ACV " +
    "ACW ACX ACY ACZ ADA ADB ADC ADD ADE ADF ADG ADH ADI ADJ ADK ADL ADM ADN ADO ADP ADQ ADR ADS ADT " +
    "ADU ADV ADW ADX ADY ADZ AEA AEB AEC AED AEE AEF AEG AEH AEI AEJ AEK AEL AEM AEN AEO AEP AEQ AER " +
    "AES AET AEU AEV AEW AEX AEY AEZ AFA AFB AFC AFD AFE AFF AFG AFH AFI AFJ AFK AFL AFM AFN AFO AFP " +
    "AFQ AFR AFS AFT AFU AFV AFW AFX AFY AFZ AGA AGB AGC AGD AGE AGF AGG AGH AGI AGJ AGK AGL AGM AGN " +
    "AGO AGP AGQ AGR AGS AGT AGU AGV AGW AGX AGY AGZ AHA AHB AHC AHD AHE AHF AHG AHH AHI AHJ AHK AHL " +
    "AHM AHN AHO AHP AHQ AHR AHS AHT AHU AHV AHW AHX AHY AHZ AIA AIB AIC AID AIE AIF AIG AIH AII AIJ " +
    "AIK AIL AIM AIN AIO AIP AIQ AIR AIS AIT AIU AIV AIW AIX AIY AIZ AJA AJB ALC ALD ALE ALF ALG ALH " +
    "ALI ALJ ALK ALL ALM ALN ALO ALP ALQ ARR ARS AUT AUU AUV AUW AUX AUY AUZ AVA AVB AVC AVD AVE AVF " +
    "BAG BAH BAI BAJ BAK BAL BAM BAN BAO BAP BAQ BAR BAS BAT BAU BAV BAW BAX BAY BAZ BBA BBB BLC BLD " +
    "BLE BLF BLG BLH BLI BLJ BLK BLL BLM BLN BLO BLP BLQ BLR BLS BLT BLU BLV BLW BLX BLY BLZ BMA BMB " +
    "BMC BMD BME BMF BMG BMH CCJ CCK CCL CCM CCN CCO CCI CEX CHG CIP CLP CLR COI CUR CUS DAR DCL DEL " +
    "DIN DOC DUT EUR FBC GBL GEN GS7 HAN HAZ ICN IIN IMI IND INS INV IRP ITR ITS LAN LIN LOI MCO MDH " +
    "MKS ORI OSI PAC PAI PAY PKG PKT PMD PMT PRD PRF PRI PUR QIN QQD QUT RAH REG RET REV RQR SAF SIC " +
    "SIN SLR SPA SPG SPH SPP SPT SRN SSR SUR TCA TDT TRA TRR TXD WHI ZZZ"
).split(" ");
export const UNTDID_4451_CODES: ReadonlySet<string> = new Set(UNTDID_4451_LIST);
/** The CEN list as the UBL Schematron writes it (" AAA AAB … "), for BR-CL-08's substring test. */
export const UNTDID_4451_TEXT = ` ${UNTDID_4451_LIST.join(" ")} `;

/** VATEX exemption reason codes EN 16931 accepts (BR-CL-22, compared in upper case), CEN validation artefacts 1.3.17. */
export const CEN_VATEX_CODES: ReadonlySet<string> = new Set(
  (
    "VATEX-EU-79-C VATEX-EU-132 VATEX-EU-132-1A VATEX-EU-132-1B VATEX-EU-132-1C VATEX-EU-132-1D " +
    "VATEX-EU-132-1E VATEX-EU-132-1F VATEX-EU-132-1G VATEX-EU-132-1H VATEX-EU-132-1I VATEX-EU-132-1J " +
    "VATEX-EU-132-1K VATEX-EU-132-1L VATEX-EU-132-1M VATEX-EU-132-1N VATEX-EU-132-1O VATEX-EU-132-1P " +
    "VATEX-EU-132-1Q VATEX-EU-135-1 VATEX-EU-143 VATEX-EU-143-1A VATEX-EU-143-1B VATEX-EU-143-1C " +
    "VATEX-EU-143-1D VATEX-EU-143-1E VATEX-EU-143-1F VATEX-EU-143-1FA VATEX-EU-143-1G VATEX-EU-143-1H " +
    "VATEX-EU-143-1I VATEX-EU-143-1J VATEX-EU-143-1K VATEX-EU-143-1L VATEX-EU-144 VATEX-EU-146-1E " +
    "VATEX-EU-159 VATEX-EU-309 VATEX-EU-148 VATEX-EU-148-A VATEX-EU-148-B VATEX-EU-148-C " +
    "VATEX-EU-148-D VATEX-EU-148-E VATEX-EU-148-F VATEX-EU-148-G VATEX-EU-151 VATEX-EU-151-1A " +
    "VATEX-EU-151-1AA VATEX-EU-151-1B VATEX-EU-151-1C VATEX-EU-151-1D VATEX-EU-151-1E VATEX-EU-G " +
    "VATEX-EU-O VATEX-EU-IC VATEX-EU-AE VATEX-EU-D VATEX-EU-F VATEX-EU-I VATEX-EU-J " +
    "VATEX-FR-FRANCHISE VATEX-FR-CNWVAT VATEX-EU-153 VATEX-FR-CGI261-1 VATEX-FR-CGI261-2 " +
    "VATEX-FR-CGI261-3 VATEX-FR-CGI261-4 VATEX-FR-CGI261-5 VATEX-FR-CGI261-7 VATEX-FR-CGI261-8 " +
    "VATEX-FR-CGI261A VATEX-FR-CGI261B VATEX-FR-CGI261C-1 VATEX-FR-CGI261C-2 VATEX-FR-CGI261C-3 " +
    "VATEX-FR-CGI261D-1 VATEX-FR-CGI261D-1BIS VATEX-FR-CGI261D-2 VATEX-FR-CGI261D-3 " +
    "VATEX-FR-CGI261D-4 VATEX-FR-CGI261E-1 VATEX-FR-CGI261E-2 VATEX-FR-CGI277A VATEX-FR-CGI275 " +
    "VATEX-FR-298SEXDECIESA VATEX-FR-CGI295 VATEX-FR-AE VATEX-ES-N1 VATEX-ES-N2 VATEX-ES-IVA20 " +
    "VATEX-ES-IVA21 VATEX-ES-IVA22 VATEX-ES-IVA23/24 VATEX-ES-IVA25 VATEX-ES-IVA140BIS VATEX-ES-OTROS " +
    "VATEX-ES-IGIC1TR VATEX-ES-IGIC11 VATEX-ES-IGIC12 VATEX-ES-IGIC13 VATEX-ES-IGIC25 VATEX-ES-IGIC47 " +
    "VATEX-ES-IGIC90 VATEX-ES-IPSI7 VATEX-ES-IPSI8"
  ).split(" "),
);

/** UNTDID 2005 value-added-tax point date codes for UBL's invoice period description code (BR-CL-06, PEPPOL-EN16931-CL006). */
export const UBL_VAT_DATE_CODES: ReadonlySet<string> = new Set(["3", "35", "432"]);
/** UNTDID 2475 codes for CII's VAT due date type code (BR-CL-06: 5 invoice date, 29 delivery date, 72 paid to date). */
export const CII_DUE_DATE_TYPE_CODES: ReadonlySet<string> = new Set(["5", "29", "72"]);
