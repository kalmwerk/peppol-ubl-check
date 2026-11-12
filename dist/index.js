// Peppol UBL check by InvoiceVerify, GitHub Action (MIT). Built from src/ with `npm run build`; do not edit by hand.
// Bundled third-party code: saxes (ISC) and xmlchars (MIT), see THIRD_PARTY_LICENSES.md.
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/xmlchars/xml/1.0/ed5.js
var require_ed5 = __commonJS({
  "node_modules/xmlchars/xml/1.0/ed5.js"(exports2) {
    "use strict";
    /**
     * Character classes and associated utilities for the 5th edition of XML 1.0.
     *
     * @author Louis-Dominique Dubeau
     * @license MIT
     * @copyright Louis-Dominique Dubeau
     */
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CHAR = "	\n\r -퟿-�𐀀-􏿿";
    exports2.S = " 	\r\n";
    exports2.NAME_START_CHAR = ":A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�𐀀-󯿿";
    exports2.NAME_CHAR = "-" + exports2.NAME_START_CHAR + ".0-9·̀-ͯ‿-⁀";
    exports2.CHAR_RE = new RegExp("^[" + exports2.CHAR + "]$", "u");
    exports2.S_RE = new RegExp("^[" + exports2.S + "]+$", "u");
    exports2.NAME_START_CHAR_RE = new RegExp("^[" + exports2.NAME_START_CHAR + "]$", "u");
    exports2.NAME_CHAR_RE = new RegExp("^[" + exports2.NAME_CHAR + "]$", "u");
    exports2.NAME_RE = new RegExp("^[" + exports2.NAME_START_CHAR + "][" + exports2.NAME_CHAR + "]*$", "u");
    exports2.NMTOKEN_RE = new RegExp("^[" + exports2.NAME_CHAR + "]+$", "u");
    var TAB = 9;
    var NL = 10;
    var CR = 13;
    var SPACE = 32;
    exports2.S_LIST = [SPACE, NL, CR, TAB];
    function isChar(c) {
      return c >= SPACE && c <= 55295 || c === NL || c === CR || c === TAB || c >= 57344 && c <= 65533 || c >= 65536 && c <= 1114111;
    }
    exports2.isChar = isChar;
    function isS(c) {
      return c === SPACE || c === NL || c === CR || c === TAB;
    }
    exports2.isS = isS;
    function isNameStartChar(c) {
      return c >= 65 && c <= 90 || c >= 97 && c <= 122 || c === 58 || c === 95 || c === 8204 || c === 8205 || c >= 192 && c <= 214 || c >= 216 && c <= 246 || c >= 248 && c <= 767 || c >= 880 && c <= 893 || c >= 895 && c <= 8191 || c >= 8304 && c <= 8591 || c >= 11264 && c <= 12271 || c >= 12289 && c <= 55295 || c >= 63744 && c <= 64975 || c >= 65008 && c <= 65533 || c >= 65536 && c <= 983039;
    }
    exports2.isNameStartChar = isNameStartChar;
    function isNameChar(c) {
      return isNameStartChar(c) || c >= 48 && c <= 57 || c === 45 || c === 46 || c === 183 || c >= 768 && c <= 879 || c >= 8255 && c <= 8256;
    }
    exports2.isNameChar = isNameChar;
  }
});

// node_modules/xmlchars/xml/1.1/ed2.js
var require_ed2 = __commonJS({
  "node_modules/xmlchars/xml/1.1/ed2.js"(exports2) {
    "use strict";
    /**
     * Character classes and associated utilities for the 2nd edition of XML 1.1.
     *
     * @author Louis-Dominique Dubeau
     * @license MIT
     * @copyright Louis-Dominique Dubeau
     */
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CHAR = "-퟿-�𐀀-􏿿";
    exports2.RESTRICTED_CHAR = "-\b\v\f---";
    exports2.S = " 	\r\n";
    exports2.NAME_START_CHAR = ":A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�𐀀-󯿿";
    exports2.NAME_CHAR = "-" + exports2.NAME_START_CHAR + ".0-9·̀-ͯ‿-⁀";
    exports2.CHAR_RE = new RegExp("^[" + exports2.CHAR + "]$", "u");
    exports2.RESTRICTED_CHAR_RE = new RegExp("^[" + exports2.RESTRICTED_CHAR + "]$", "u");
    exports2.S_RE = new RegExp("^[" + exports2.S + "]+$", "u");
    exports2.NAME_START_CHAR_RE = new RegExp("^[" + exports2.NAME_START_CHAR + "]$", "u");
    exports2.NAME_CHAR_RE = new RegExp("^[" + exports2.NAME_CHAR + "]$", "u");
    exports2.NAME_RE = new RegExp("^[" + exports2.NAME_START_CHAR + "][" + exports2.NAME_CHAR + "]*$", "u");
    exports2.NMTOKEN_RE = new RegExp("^[" + exports2.NAME_CHAR + "]+$", "u");
    var TAB = 9;
    var NL = 10;
    var CR = 13;
    var SPACE = 32;
    exports2.S_LIST = [SPACE, NL, CR, TAB];
    function isChar(c) {
      return c >= 1 && c <= 55295 || c >= 57344 && c <= 65533 || c >= 65536 && c <= 1114111;
    }
    exports2.isChar = isChar;
    function isRestrictedChar(c) {
      return c >= 1 && c <= 8 || c === 11 || c === 12 || c >= 14 && c <= 31 || c >= 127 && c <= 132 || c >= 134 && c <= 159;
    }
    exports2.isRestrictedChar = isRestrictedChar;
    function isCharAndNotRestricted(c) {
      return c === 9 || c === 10 || c === 13 || c > 31 && c < 127 || c === 133 || c > 159 && c <= 55295 || c >= 57344 && c <= 65533 || c >= 65536 && c <= 1114111;
    }
    exports2.isCharAndNotRestricted = isCharAndNotRestricted;
    function isS(c) {
      return c === SPACE || c === NL || c === CR || c === TAB;
    }
    exports2.isS = isS;
    function isNameStartChar(c) {
      return c >= 65 && c <= 90 || c >= 97 && c <= 122 || c === 58 || c === 95 || c === 8204 || c === 8205 || c >= 192 && c <= 214 || c >= 216 && c <= 246 || c >= 248 && c <= 767 || c >= 880 && c <= 893 || c >= 895 && c <= 8191 || c >= 8304 && c <= 8591 || c >= 11264 && c <= 12271 || c >= 12289 && c <= 55295 || c >= 63744 && c <= 64975 || c >= 65008 && c <= 65533 || c >= 65536 && c <= 983039;
    }
    exports2.isNameStartChar = isNameStartChar;
    function isNameChar(c) {
      return isNameStartChar(c) || c >= 48 && c <= 57 || c === 45 || c === 46 || c === 183 || c >= 768 && c <= 879 || c >= 8255 && c <= 8256;
    }
    exports2.isNameChar = isNameChar;
  }
});

// node_modules/xmlchars/xmlns/1.0/ed3.js
var require_ed3 = __commonJS({
  "node_modules/xmlchars/xmlns/1.0/ed3.js"(exports2) {
    "use strict";
    /**
     * Character class utilities for XML NS 1.0 edition 3.
     *
     * @author Louis-Dominique Dubeau
     * @license MIT
     * @copyright Louis-Dominique Dubeau
     */
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.NC_NAME_START_CHAR = "A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌-‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�𐀀-󯿿";
    exports2.NC_NAME_CHAR = "-" + exports2.NC_NAME_START_CHAR + ".0-9·̀-ͯ‿-⁀";
    exports2.NC_NAME_START_CHAR_RE = new RegExp("^[" + exports2.NC_NAME_START_CHAR + "]$", "u");
    exports2.NC_NAME_CHAR_RE = new RegExp("^[" + exports2.NC_NAME_CHAR + "]$", "u");
    exports2.NC_NAME_RE = new RegExp("^[" + exports2.NC_NAME_START_CHAR + "][" + exports2.NC_NAME_CHAR + "]*$", "u");
    function isNCNameStartChar(c) {
      return c >= 65 && c <= 90 || c === 95 || c >= 97 && c <= 122 || c >= 192 && c <= 214 || c >= 216 && c <= 246 || c >= 248 && c <= 767 || c >= 880 && c <= 893 || c >= 895 && c <= 8191 || c >= 8204 && c <= 8205 || c >= 8304 && c <= 8591 || c >= 11264 && c <= 12271 || c >= 12289 && c <= 55295 || c >= 63744 && c <= 64975 || c >= 65008 && c <= 65533 || c >= 65536 && c <= 983039;
    }
    exports2.isNCNameStartChar = isNCNameStartChar;
    function isNCNameChar(c) {
      return isNCNameStartChar(c) || (c === 45 || c === 46 || c >= 48 && c <= 57 || c === 183 || c >= 768 && c <= 879 || c >= 8255 && c <= 8256);
    }
    exports2.isNCNameChar = isNCNameChar;
  }
});

// node_modules/saxes/saxes.js
var require_saxes = __commonJS({
  "node_modules/saxes/saxes.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.SaxesParser = exports2.EVENTS = void 0;
    var ed5 = require_ed5();
    var ed2 = require_ed2();
    var NSed3 = require_ed3();
    var isS = ed5.isS;
    var isChar10 = ed5.isChar;
    var isNameStartChar = ed5.isNameStartChar;
    var isNameChar = ed5.isNameChar;
    var S_LIST = ed5.S_LIST;
    var NAME_RE = ed5.NAME_RE;
    var isChar11 = ed2.isChar;
    var isNCNameStartChar = NSed3.isNCNameStartChar;
    var isNCNameChar = NSed3.isNCNameChar;
    var NC_NAME_RE = NSed3.NC_NAME_RE;
    var XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
    var XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
    var rootNS = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      __proto__: null,
      xml: XML_NAMESPACE,
      xmlns: XMLNS_NAMESPACE
    };
    var XML_ENTITIES = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      __proto__: null,
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'"
    };
    var EOC = -1;
    var NL_LIKE = -2;
    var S_BEGIN = 0;
    var S_BEGIN_WHITESPACE = 1;
    var S_DOCTYPE = 2;
    var S_DOCTYPE_QUOTE = 3;
    var S_DTD = 4;
    var S_DTD_QUOTED = 5;
    var S_DTD_OPEN_WAKA = 6;
    var S_DTD_OPEN_WAKA_BANG = 7;
    var S_DTD_COMMENT = 8;
    var S_DTD_COMMENT_ENDING = 9;
    var S_DTD_COMMENT_ENDED = 10;
    var S_DTD_PI = 11;
    var S_DTD_PI_ENDING = 12;
    var S_TEXT = 13;
    var S_ENTITY = 14;
    var S_OPEN_WAKA = 15;
    var S_OPEN_WAKA_BANG = 16;
    var S_COMMENT = 17;
    var S_COMMENT_ENDING = 18;
    var S_COMMENT_ENDED = 19;
    var S_CDATA = 20;
    var S_CDATA_ENDING = 21;
    var S_CDATA_ENDING_2 = 22;
    var S_PI_FIRST_CHAR = 23;
    var S_PI_REST = 24;
    var S_PI_BODY = 25;
    var S_PI_ENDING = 26;
    var S_XML_DECL_NAME_START = 27;
    var S_XML_DECL_NAME = 28;
    var S_XML_DECL_EQ = 29;
    var S_XML_DECL_VALUE_START = 30;
    var S_XML_DECL_VALUE = 31;
    var S_XML_DECL_SEPARATOR = 32;
    var S_XML_DECL_ENDING = 33;
    var S_OPEN_TAG = 34;
    var S_OPEN_TAG_SLASH = 35;
    var S_ATTRIB = 36;
    var S_ATTRIB_NAME = 37;
    var S_ATTRIB_NAME_SAW_WHITE = 38;
    var S_ATTRIB_VALUE = 39;
    var S_ATTRIB_VALUE_QUOTED = 40;
    var S_ATTRIB_VALUE_CLOSED = 41;
    var S_ATTRIB_VALUE_UNQUOTED = 42;
    var S_CLOSE_TAG = 43;
    var S_CLOSE_TAG_SAW_WHITE = 44;
    var TAB = 9;
    var NL = 10;
    var CR = 13;
    var SPACE = 32;
    var BANG = 33;
    var DQUOTE = 34;
    var AMP = 38;
    var SQUOTE = 39;
    var MINUS = 45;
    var FORWARD_SLASH = 47;
    var SEMICOLON = 59;
    var LESS = 60;
    var EQUAL = 61;
    var GREATER = 62;
    var QUESTION = 63;
    var OPEN_BRACKET = 91;
    var CLOSE_BRACKET = 93;
    var NEL = 133;
    var LS = 8232;
    var isQuote = (c) => c === DQUOTE || c === SQUOTE;
    var QUOTES = [DQUOTE, SQUOTE];
    var DOCTYPE_TERMINATOR = [...QUOTES, OPEN_BRACKET, GREATER];
    var DTD_TERMINATOR = [...QUOTES, LESS, CLOSE_BRACKET];
    var XML_DECL_NAME_TERMINATOR = [EQUAL, QUESTION, ...S_LIST];
    var ATTRIB_VALUE_UNQUOTED_TERMINATOR = [...S_LIST, GREATER, AMP, LESS];
    function nsPairCheck(parser, prefix, uri) {
      switch (prefix) {
        case "xml":
          if (uri !== XML_NAMESPACE) {
            parser.fail(`xml prefix must be bound to ${XML_NAMESPACE}.`);
          }
          break;
        case "xmlns":
          if (uri !== XMLNS_NAMESPACE) {
            parser.fail(`xmlns prefix must be bound to ${XMLNS_NAMESPACE}.`);
          }
          break;
        default:
      }
      switch (uri) {
        case XMLNS_NAMESPACE:
          parser.fail(prefix === "" ? `the default namespace may not be set to ${uri}.` : `may not assign a prefix (even "xmlns") to the URI ${XMLNS_NAMESPACE}.`);
          break;
        case XML_NAMESPACE:
          switch (prefix) {
            case "xml":
              break;
            case "":
              parser.fail(`the default namespace may not be set to ${uri}.`);
              break;
            default:
              parser.fail("may not assign the xml namespace to another prefix.");
          }
          break;
        default:
      }
    }
    function nsMappingCheck(parser, mapping) {
      for (const local of Object.keys(mapping)) {
        nsPairCheck(parser, local, mapping[local]);
      }
    }
    var isNCName = (name) => NC_NAME_RE.test(name);
    var isName = (name) => NAME_RE.test(name);
    var FORBIDDEN_START = 0;
    var FORBIDDEN_BRACKET = 1;
    var FORBIDDEN_BRACKET_BRACKET = 2;
    exports2.EVENTS = [
      "xmldecl",
      "text",
      "processinginstruction",
      "doctype",
      "comment",
      "opentagstart",
      "attribute",
      "opentag",
      "closetag",
      "cdata",
      "error",
      "end",
      "ready"
    ];
    var EVENT_NAME_TO_HANDLER_NAME = {
      xmldecl: "xmldeclHandler",
      text: "textHandler",
      processinginstruction: "piHandler",
      doctype: "doctypeHandler",
      comment: "commentHandler",
      opentagstart: "openTagStartHandler",
      attribute: "attributeHandler",
      opentag: "openTagHandler",
      closetag: "closeTagHandler",
      cdata: "cdataHandler",
      error: "errorHandler",
      end: "endHandler",
      ready: "readyHandler"
    };
    var SaxesParser2 = class {
      /**
       * @param opt The parser options.
       */
      constructor(opt) {
        this.opt = opt !== null && opt !== void 0 ? opt : {};
        this.fragmentOpt = !!this.opt.fragment;
        const xmlnsOpt = this.xmlnsOpt = !!this.opt.xmlns;
        this.trackPosition = this.opt.position !== false;
        this.fileName = this.opt.fileName;
        if (xmlnsOpt) {
          this.nameStartCheck = isNCNameStartChar;
          this.nameCheck = isNCNameChar;
          this.isName = isNCName;
          this.processAttribs = this.processAttribsNS;
          this.pushAttrib = this.pushAttribNS;
          this.ns = Object.assign({ __proto__: null }, rootNS);
          const additional = this.opt.additionalNamespaces;
          if (additional != null) {
            nsMappingCheck(this, additional);
            Object.assign(this.ns, additional);
          }
        } else {
          this.nameStartCheck = isNameStartChar;
          this.nameCheck = isNameChar;
          this.isName = isName;
          this.processAttribs = this.processAttribsPlain;
          this.pushAttrib = this.pushAttribPlain;
        }
        this.stateTable = [
          /* eslint-disable @typescript-eslint/unbound-method */
          this.sBegin,
          this.sBeginWhitespace,
          this.sDoctype,
          this.sDoctypeQuote,
          this.sDTD,
          this.sDTDQuoted,
          this.sDTDOpenWaka,
          this.sDTDOpenWakaBang,
          this.sDTDComment,
          this.sDTDCommentEnding,
          this.sDTDCommentEnded,
          this.sDTDPI,
          this.sDTDPIEnding,
          this.sText,
          this.sEntity,
          this.sOpenWaka,
          this.sOpenWakaBang,
          this.sComment,
          this.sCommentEnding,
          this.sCommentEnded,
          this.sCData,
          this.sCDataEnding,
          this.sCDataEnding2,
          this.sPIFirstChar,
          this.sPIRest,
          this.sPIBody,
          this.sPIEnding,
          this.sXMLDeclNameStart,
          this.sXMLDeclName,
          this.sXMLDeclEq,
          this.sXMLDeclValueStart,
          this.sXMLDeclValue,
          this.sXMLDeclSeparator,
          this.sXMLDeclEnding,
          this.sOpenTag,
          this.sOpenTagSlash,
          this.sAttrib,
          this.sAttribName,
          this.sAttribNameSawWhite,
          this.sAttribValue,
          this.sAttribValueQuoted,
          this.sAttribValueClosed,
          this.sAttribValueUnquoted,
          this.sCloseTag,
          this.sCloseTagSawWhite
          /* eslint-enable @typescript-eslint/unbound-method */
        ];
        this._init();
      }
      /**
       * Indicates whether or not the parser is closed. If ``true``, wait for
       * the ``ready`` event to write again.
       */
      get closed() {
        return this._closed;
      }
      _init() {
        var _a;
        this.openWakaBang = "";
        this.text = "";
        this.name = "";
        this.piTarget = "";
        this.entity = "";
        this.q = null;
        this.tags = [];
        this.tag = null;
        this.topNS = null;
        this.chunk = "";
        this.chunkPosition = 0;
        this.i = 0;
        this.prevI = 0;
        this.carriedFromPrevious = void 0;
        this.forbiddenState = FORBIDDEN_START;
        this.attribList = [];
        const { fragmentOpt } = this;
        this.state = fragmentOpt ? S_TEXT : S_BEGIN;
        this.reportedTextBeforeRoot = this.reportedTextAfterRoot = this.closedRoot = this.sawRoot = fragmentOpt;
        this.xmlDeclPossible = !fragmentOpt;
        this.xmlDeclExpects = ["version"];
        this.entityReturnState = void 0;
        let { defaultXMLVersion } = this.opt;
        if (defaultXMLVersion === void 0) {
          if (this.opt.forceXMLVersion === true) {
            throw new Error("forceXMLVersion set but defaultXMLVersion is not set");
          }
          defaultXMLVersion = "1.0";
        }
        this.setXMLVersion(defaultXMLVersion);
        this.positionAtNewLine = 0;
        this.doctype = false;
        this._closed = false;
        this.xmlDecl = {
          version: void 0,
          encoding: void 0,
          standalone: void 0
        };
        this.line = 1;
        this.column = 0;
        this.ENTITIES = Object.create(XML_ENTITIES);
        (_a = this.readyHandler) === null || _a === void 0 ? void 0 : _a.call(this);
      }
      /**
       * The stream position the parser is currently looking at. This field is
       * zero-based.
       *
       * This field is not based on counting Unicode characters but is to be
       * interpreted as a plain index into a JavaScript string.
       */
      get position() {
        return this.chunkPosition + this.i;
      }
      /**
       * The column number of the next character to be read by the parser.  *
       * This field is zero-based. (The first column in a line is 0.)
       *
       * This field reports the index at which the next character would be in the
       * line if the line were represented as a JavaScript string.  Note that this
       * *can* be different to a count based on the number of *Unicode characters*
       * due to how JavaScript handles astral plane characters.
       *
       * See [[column]] for a number that corresponds to a count of Unicode
       * characters.
       */
      get columnIndex() {
        return this.position - this.positionAtNewLine;
      }
      /**
       * Set an event listener on an event. The parser supports one handler per
       * event type. If you try to set an event handler over an existing handler,
       * the old handler is silently overwritten.
       *
       * @param name The event to listen to.
       *
       * @param handler The handler to set.
       */
      on(name, handler) {
        this[EVENT_NAME_TO_HANDLER_NAME[name]] = handler;
      }
      /**
       * Unset an event handler.
       *
       * @parma name The event to stop listening to.
       */
      off(name) {
        this[EVENT_NAME_TO_HANDLER_NAME[name]] = void 0;
      }
      /**
       * Make an error object. The error object will have a message that contains
       * the ``fileName`` option passed at the creation of the parser. If position
       * tracking was turned on, it will also have line and column number
       * information.
       *
       * @param message The message describing the error to report.
       *
       * @returns An error object with a properly formatted message.
       */
      makeError(message) {
        var _a;
        let msg = (_a = this.fileName) !== null && _a !== void 0 ? _a : "";
        if (this.trackPosition) {
          if (msg.length > 0) {
            msg += ":";
          }
          msg += `${this.line}:${this.column}`;
        }
        if (msg.length > 0) {
          msg += ": ";
        }
        return new Error(msg + message);
      }
      /**
       * Report a parsing error. This method is made public so that client code may
       * check for issues that are outside the scope of this project and can report
       * errors.
       *
       * @param message The error to report.
       *
       * @returns this
       */
      fail(message) {
        const err = this.makeError(message);
        const handler = this.errorHandler;
        if (handler === void 0) {
          throw err;
        } else {
          handler(err);
        }
        return this;
      }
      /**
       * Write a XML data to the parser.
       *
       * @param chunk The XML data to write.
       *
       * @returns this
       */
      // We do need object for the type here. Yes, it often causes problems
      // but not in this case.
      write(chunk) {
        if (this.closed) {
          return this.fail("cannot write after close; assign an onready handler.");
        }
        let end = false;
        if (chunk === null) {
          end = true;
          chunk = "";
        } else if (typeof chunk === "object") {
          chunk = chunk.toString();
        }
        if (this.carriedFromPrevious !== void 0) {
          chunk = `${this.carriedFromPrevious}${chunk}`;
          this.carriedFromPrevious = void 0;
        }
        let limit = chunk.length;
        const lastCode = chunk.charCodeAt(limit - 1);
        if (!end && // A trailing CR or surrogate must be carried over to the next
        // chunk.
        (lastCode === CR || lastCode >= 55296 && lastCode <= 56319)) {
          this.carriedFromPrevious = chunk[limit - 1];
          limit--;
          chunk = chunk.slice(0, limit);
        }
        const { stateTable } = this;
        this.chunk = chunk;
        this.i = 0;
        while (this.i < limit) {
          stateTable[this.state].call(this);
        }
        this.chunkPosition += limit;
        return end ? this.end() : this;
      }
      /**
       * Close the current stream. Perform final well-formedness checks and reset
       * the parser tstate.
       *
       * @returns this
       */
      close() {
        return this.write(null);
      }
      /**
       * Get a single code point out of the current chunk. This updates the current
       * position if we do position tracking.
       *
       * This is the algorithm to use for XML 1.0.
       *
       * @returns The character read.
       */
      getCode10() {
        const { chunk, i } = this;
        this.prevI = i;
        this.i = i + 1;
        if (i >= chunk.length) {
          return EOC;
        }
        const code2 = chunk.charCodeAt(i);
        this.column++;
        if (code2 < 55296) {
          if (code2 >= SPACE || code2 === TAB) {
            return code2;
          }
          switch (code2) {
            case NL:
              this.line++;
              this.column = 0;
              this.positionAtNewLine = this.position;
              return NL;
            case CR:
              if (chunk.charCodeAt(i + 1) === NL) {
                this.i = i + 2;
              }
              this.line++;
              this.column = 0;
              this.positionAtNewLine = this.position;
              return NL_LIKE;
            default:
              this.fail("disallowed character.");
              return code2;
          }
        }
        if (code2 > 56319) {
          if (!(code2 >= 57344 && code2 <= 65533)) {
            this.fail("disallowed character.");
          }
          return code2;
        }
        const final = 65536 + (code2 - 55296) * 1024 + (chunk.charCodeAt(i + 1) - 56320);
        this.i = i + 2;
        if (final > 1114111) {
          this.fail("disallowed character.");
        }
        return final;
      }
      /**
       * Get a single code point out of the current chunk. This updates the current
       * position if we do position tracking.
       *
       * This is the algorithm to use for XML 1.1.
       *
       * @returns {number} The character read.
       */
      getCode11() {
        const { chunk, i } = this;
        this.prevI = i;
        this.i = i + 1;
        if (i >= chunk.length) {
          return EOC;
        }
        const code2 = chunk.charCodeAt(i);
        this.column++;
        if (code2 < 55296) {
          if (code2 > 31 && code2 < 127 || code2 > 159 && code2 !== LS || code2 === TAB) {
            return code2;
          }
          switch (code2) {
            case NL:
              this.line++;
              this.column = 0;
              this.positionAtNewLine = this.position;
              return NL;
            case CR: {
              const next = chunk.charCodeAt(i + 1);
              if (next === NL || next === NEL) {
                this.i = i + 2;
              }
            }
            /* yes, fall through */
            case NEL:
            // 0x85
            case LS:
              this.line++;
              this.column = 0;
              this.positionAtNewLine = this.position;
              return NL_LIKE;
            default:
              this.fail("disallowed character.");
              return code2;
          }
        }
        if (code2 > 56319) {
          if (!(code2 >= 57344 && code2 <= 65533)) {
            this.fail("disallowed character.");
          }
          return code2;
        }
        const final = 65536 + (code2 - 55296) * 1024 + (chunk.charCodeAt(i + 1) - 56320);
        this.i = i + 2;
        if (final > 1114111) {
          this.fail("disallowed character.");
        }
        return final;
      }
      /**
       * Like ``getCode`` but with the return value normalized so that ``NL`` is
       * returned for ``NL_LIKE``.
       */
      getCodeNorm() {
        const c = this.getCode();
        return c === NL_LIKE ? NL : c;
      }
      unget() {
        this.i = this.prevI;
        this.column--;
      }
      /**
       * Capture characters into a buffer until encountering one of a set of
       * characters.
       *
       * @param chars An array of codepoints. Encountering a character in the array
       * ends the capture. (``chars`` may safely contain ``NL``.)
       *
       * @return The character code that made the capture end, or ``EOC`` if we hit
       * the end of the chunk. The return value cannot be NL_LIKE: NL is returned
       * instead.
       */
      captureTo(chars) {
        let { i: start } = this;
        const { chunk } = this;
        while (true) {
          const c = this.getCode();
          const isNLLike = c === NL_LIKE;
          const final = isNLLike ? NL : c;
          if (final === EOC || chars.includes(final)) {
            this.text += chunk.slice(start, this.prevI);
            return final;
          }
          if (isNLLike) {
            this.text += `${chunk.slice(start, this.prevI)}
`;
            start = this.i;
          }
        }
      }
      /**
       * Capture characters into a buffer until encountering a character.
       *
       * @param char The codepoint that ends the capture. **NOTE ``char`` MAY NOT
       * CONTAIN ``NL``.** Passing ``NL`` will result in buggy behavior.
       *
       * @return ``true`` if we ran into the character. Otherwise, we ran into the
       * end of the current chunk.
       */
      captureToChar(char) {
        let { i: start } = this;
        const { chunk } = this;
        while (true) {
          let c = this.getCode();
          switch (c) {
            case NL_LIKE:
              this.text += `${chunk.slice(start, this.prevI)}
`;
              start = this.i;
              c = NL;
              break;
            case EOC:
              this.text += chunk.slice(start);
              return false;
            default:
          }
          if (c === char) {
            this.text += chunk.slice(start, this.prevI);
            return true;
          }
        }
      }
      /**
       * Capture characters that satisfy ``isNameChar`` into the ``name`` field of
       * this parser.
       *
       * @return The character code that made the test fail, or ``EOC`` if we hit
       * the end of the chunk. The return value cannot be NL_LIKE: NL is returned
       * instead.
       */
      captureNameChars() {
        const { chunk, i: start } = this;
        while (true) {
          const c = this.getCode();
          if (c === EOC) {
            this.name += chunk.slice(start);
            return EOC;
          }
          if (!isNameChar(c)) {
            this.name += chunk.slice(start, this.prevI);
            return c === NL_LIKE ? NL : c;
          }
        }
      }
      /**
       * Skip white spaces.
       *
       * @return The character that ended the skip, or ``EOC`` if we hit
       * the end of the chunk. The return value cannot be NL_LIKE: NL is returned
       * instead.
       */
      skipSpaces() {
        while (true) {
          const c = this.getCodeNorm();
          if (c === EOC || !isS(c)) {
            return c;
          }
        }
      }
      setXMLVersion(version) {
        this.currentXMLVersion = version;
        if (version === "1.0") {
          this.isChar = isChar10;
          this.getCode = this.getCode10;
        } else {
          this.isChar = isChar11;
          this.getCode = this.getCode11;
        }
      }
      // STATE ENGINE METHODS
      // This needs to be a state separate from S_BEGIN_WHITESPACE because we want
      // to be sure never to come back to this state later.
      sBegin() {
        if (this.chunk.charCodeAt(0) === 65279) {
          this.i++;
          this.column++;
        }
        this.state = S_BEGIN_WHITESPACE;
      }
      sBeginWhitespace() {
        const iBefore = this.i;
        const c = this.skipSpaces();
        if (this.prevI !== iBefore) {
          this.xmlDeclPossible = false;
        }
        switch (c) {
          case LESS:
            this.state = S_OPEN_WAKA;
            if (this.text.length !== 0) {
              throw new Error("no-empty text at start");
            }
            break;
          case EOC:
            break;
          default:
            this.unget();
            this.state = S_TEXT;
            this.xmlDeclPossible = false;
        }
      }
      sDoctype() {
        var _a;
        const c = this.captureTo(DOCTYPE_TERMINATOR);
        switch (c) {
          case GREATER: {
            (_a = this.doctypeHandler) === null || _a === void 0 ? void 0 : _a.call(this, this.text);
            this.text = "";
            this.state = S_TEXT;
            this.doctype = true;
            break;
          }
          case EOC:
            break;
          default:
            this.text += String.fromCodePoint(c);
            if (c === OPEN_BRACKET) {
              this.state = S_DTD;
            } else if (isQuote(c)) {
              this.state = S_DOCTYPE_QUOTE;
              this.q = c;
            }
        }
      }
      sDoctypeQuote() {
        const q = this.q;
        if (this.captureToChar(q)) {
          this.text += String.fromCodePoint(q);
          this.q = null;
          this.state = S_DOCTYPE;
        }
      }
      sDTD() {
        const c = this.captureTo(DTD_TERMINATOR);
        if (c === EOC) {
          return;
        }
        this.text += String.fromCodePoint(c);
        if (c === CLOSE_BRACKET) {
          this.state = S_DOCTYPE;
        } else if (c === LESS) {
          this.state = S_DTD_OPEN_WAKA;
        } else if (isQuote(c)) {
          this.state = S_DTD_QUOTED;
          this.q = c;
        }
      }
      sDTDQuoted() {
        const q = this.q;
        if (this.captureToChar(q)) {
          this.text += String.fromCodePoint(q);
          this.state = S_DTD;
          this.q = null;
        }
      }
      sDTDOpenWaka() {
        const c = this.getCodeNorm();
        this.text += String.fromCodePoint(c);
        switch (c) {
          case BANG:
            this.state = S_DTD_OPEN_WAKA_BANG;
            this.openWakaBang = "";
            break;
          case QUESTION:
            this.state = S_DTD_PI;
            break;
          default:
            this.state = S_DTD;
        }
      }
      sDTDOpenWakaBang() {
        const char = String.fromCodePoint(this.getCodeNorm());
        const owb = this.openWakaBang += char;
        this.text += char;
        if (owb !== "-") {
          this.state = owb === "--" ? S_DTD_COMMENT : S_DTD;
          this.openWakaBang = "";
        }
      }
      sDTDComment() {
        if (this.captureToChar(MINUS)) {
          this.text += "-";
          this.state = S_DTD_COMMENT_ENDING;
        }
      }
      sDTDCommentEnding() {
        const c = this.getCodeNorm();
        this.text += String.fromCodePoint(c);
        this.state = c === MINUS ? S_DTD_COMMENT_ENDED : S_DTD_COMMENT;
      }
      sDTDCommentEnded() {
        const c = this.getCodeNorm();
        this.text += String.fromCodePoint(c);
        if (c === GREATER) {
          this.state = S_DTD;
        } else {
          this.fail("malformed comment.");
          this.state = S_DTD_COMMENT;
        }
      }
      sDTDPI() {
        if (this.captureToChar(QUESTION)) {
          this.text += "?";
          this.state = S_DTD_PI_ENDING;
        }
      }
      sDTDPIEnding() {
        const c = this.getCodeNorm();
        this.text += String.fromCodePoint(c);
        if (c === GREATER) {
          this.state = S_DTD;
        }
      }
      sText() {
        if (this.tags.length !== 0) {
          this.handleTextInRoot();
        } else {
          this.handleTextOutsideRoot();
        }
      }
      sEntity() {
        let { i: start } = this;
        const { chunk } = this;
        loop:
          while (true) {
            switch (this.getCode()) {
              case NL_LIKE:
                this.entity += `${chunk.slice(start, this.prevI)}
`;
                start = this.i;
                break;
              case SEMICOLON: {
                const { entityReturnState } = this;
                const entity = this.entity + chunk.slice(start, this.prevI);
                this.state = entityReturnState;
                let parsed;
                if (entity === "") {
                  this.fail("empty entity name.");
                  parsed = "&;";
                } else {
                  parsed = this.parseEntity(entity);
                  this.entity = "";
                }
                if (entityReturnState !== S_TEXT || this.textHandler !== void 0) {
                  this.text += parsed;
                }
                break loop;
              }
              case EOC:
                this.entity += chunk.slice(start);
                break loop;
              default:
            }
          }
      }
      sOpenWaka() {
        const c = this.getCode();
        if (isNameStartChar(c)) {
          this.state = S_OPEN_TAG;
          this.unget();
          this.xmlDeclPossible = false;
        } else {
          switch (c) {
            case FORWARD_SLASH:
              this.state = S_CLOSE_TAG;
              this.xmlDeclPossible = false;
              break;
            case BANG:
              this.state = S_OPEN_WAKA_BANG;
              this.openWakaBang = "";
              this.xmlDeclPossible = false;
              break;
            case QUESTION:
              this.state = S_PI_FIRST_CHAR;
              break;
            default:
              this.fail("disallowed character in tag name");
              this.state = S_TEXT;
              this.xmlDeclPossible = false;
          }
        }
      }
      sOpenWakaBang() {
        this.openWakaBang += String.fromCodePoint(this.getCodeNorm());
        switch (this.openWakaBang) {
          case "[CDATA[":
            if (!this.sawRoot && !this.reportedTextBeforeRoot) {
              this.fail("text data outside of root node.");
              this.reportedTextBeforeRoot = true;
            }
            if (this.closedRoot && !this.reportedTextAfterRoot) {
              this.fail("text data outside of root node.");
              this.reportedTextAfterRoot = true;
            }
            this.state = S_CDATA;
            this.openWakaBang = "";
            break;
          case "--":
            this.state = S_COMMENT;
            this.openWakaBang = "";
            break;
          case "DOCTYPE":
            this.state = S_DOCTYPE;
            if (this.doctype || this.sawRoot) {
              this.fail("inappropriately located doctype declaration.");
            }
            this.openWakaBang = "";
            break;
          default:
            if (this.openWakaBang.length >= 7) {
              this.fail("incorrect syntax.");
            }
        }
      }
      sComment() {
        if (this.captureToChar(MINUS)) {
          this.state = S_COMMENT_ENDING;
        }
      }
      sCommentEnding() {
        var _a;
        const c = this.getCodeNorm();
        if (c === MINUS) {
          this.state = S_COMMENT_ENDED;
          (_a = this.commentHandler) === null || _a === void 0 ? void 0 : _a.call(this, this.text);
          this.text = "";
        } else {
          this.text += `-${String.fromCodePoint(c)}`;
          this.state = S_COMMENT;
        }
      }
      sCommentEnded() {
        const c = this.getCodeNorm();
        if (c !== GREATER) {
          this.fail("malformed comment.");
          this.text += `--${String.fromCodePoint(c)}`;
          this.state = S_COMMENT;
        } else {
          this.state = S_TEXT;
        }
      }
      sCData() {
        if (this.captureToChar(CLOSE_BRACKET)) {
          this.state = S_CDATA_ENDING;
        }
      }
      sCDataEnding() {
        const c = this.getCodeNorm();
        if (c === CLOSE_BRACKET) {
          this.state = S_CDATA_ENDING_2;
        } else {
          this.text += `]${String.fromCodePoint(c)}`;
          this.state = S_CDATA;
        }
      }
      sCDataEnding2() {
        var _a;
        const c = this.getCodeNorm();
        switch (c) {
          case GREATER: {
            (_a = this.cdataHandler) === null || _a === void 0 ? void 0 : _a.call(this, this.text);
            this.text = "";
            this.state = S_TEXT;
            break;
          }
          case CLOSE_BRACKET:
            this.text += "]";
            break;
          default:
            this.text += `]]${String.fromCodePoint(c)}`;
            this.state = S_CDATA;
        }
      }
      // We need this separate state to check the first character fo the pi target
      // with this.nameStartCheck which allows less characters than this.nameCheck.
      sPIFirstChar() {
        const c = this.getCodeNorm();
        if (this.nameStartCheck(c)) {
          this.piTarget += String.fromCodePoint(c);
          this.state = S_PI_REST;
        } else if (c === QUESTION || isS(c)) {
          this.fail("processing instruction without a target.");
          this.state = c === QUESTION ? S_PI_ENDING : S_PI_BODY;
        } else {
          this.fail("disallowed character in processing instruction name.");
          this.piTarget += String.fromCodePoint(c);
          this.state = S_PI_REST;
        }
      }
      sPIRest() {
        const { chunk, i: start } = this;
        while (true) {
          const c = this.getCodeNorm();
          if (c === EOC) {
            this.piTarget += chunk.slice(start);
            return;
          }
          if (!this.nameCheck(c)) {
            this.piTarget += chunk.slice(start, this.prevI);
            const isQuestion = c === QUESTION;
            if (isQuestion || isS(c)) {
              if (this.piTarget === "xml") {
                if (!this.xmlDeclPossible) {
                  this.fail("an XML declaration must be at the start of the document.");
                }
                this.state = isQuestion ? S_XML_DECL_ENDING : S_XML_DECL_NAME_START;
              } else {
                this.state = isQuestion ? S_PI_ENDING : S_PI_BODY;
              }
            } else {
              this.fail("disallowed character in processing instruction name.");
              this.piTarget += String.fromCodePoint(c);
            }
            break;
          }
        }
      }
      sPIBody() {
        if (this.text.length === 0) {
          const c = this.getCodeNorm();
          if (c === QUESTION) {
            this.state = S_PI_ENDING;
          } else if (!isS(c)) {
            this.text = String.fromCodePoint(c);
          }
        } else if (this.captureToChar(QUESTION)) {
          this.state = S_PI_ENDING;
        }
      }
      sPIEnding() {
        var _a;
        const c = this.getCodeNorm();
        if (c === GREATER) {
          const { piTarget } = this;
          if (piTarget.toLowerCase() === "xml") {
            this.fail("the XML declaration must appear at the start of the document.");
          }
          (_a = this.piHandler) === null || _a === void 0 ? void 0 : _a.call(this, {
            target: piTarget,
            body: this.text
          });
          this.piTarget = this.text = "";
          this.state = S_TEXT;
        } else if (c === QUESTION) {
          this.text += "?";
        } else {
          this.text += `?${String.fromCodePoint(c)}`;
          this.state = S_PI_BODY;
        }
        this.xmlDeclPossible = false;
      }
      sXMLDeclNameStart() {
        const c = this.skipSpaces();
        if (c === QUESTION) {
          this.state = S_XML_DECL_ENDING;
          return;
        }
        if (c !== EOC) {
          this.state = S_XML_DECL_NAME;
          this.name = String.fromCodePoint(c);
        }
      }
      sXMLDeclName() {
        const c = this.captureTo(XML_DECL_NAME_TERMINATOR);
        if (c === QUESTION) {
          this.state = S_XML_DECL_ENDING;
          this.name += this.text;
          this.text = "";
          this.fail("XML declaration is incomplete.");
          return;
        }
        if (!(isS(c) || c === EQUAL)) {
          return;
        }
        this.name += this.text;
        this.text = "";
        if (!this.xmlDeclExpects.includes(this.name)) {
          switch (this.name.length) {
            case 0:
              this.fail("did not expect any more name/value pairs.");
              break;
            case 1:
              this.fail(`expected the name ${this.xmlDeclExpects[0]}.`);
              break;
            default:
              this.fail(`expected one of ${this.xmlDeclExpects.join(", ")}`);
          }
        }
        this.state = c === EQUAL ? S_XML_DECL_VALUE_START : S_XML_DECL_EQ;
      }
      sXMLDeclEq() {
        const c = this.getCodeNorm();
        if (c === QUESTION) {
          this.state = S_XML_DECL_ENDING;
          this.fail("XML declaration is incomplete.");
          return;
        }
        if (isS(c)) {
          return;
        }
        if (c !== EQUAL) {
          this.fail("value required.");
        }
        this.state = S_XML_DECL_VALUE_START;
      }
      sXMLDeclValueStart() {
        const c = this.getCodeNorm();
        if (c === QUESTION) {
          this.state = S_XML_DECL_ENDING;
          this.fail("XML declaration is incomplete.");
          return;
        }
        if (isS(c)) {
          return;
        }
        if (!isQuote(c)) {
          this.fail("value must be quoted.");
          this.q = SPACE;
        } else {
          this.q = c;
        }
        this.state = S_XML_DECL_VALUE;
      }
      sXMLDeclValue() {
        const c = this.captureTo([this.q, QUESTION]);
        if (c === QUESTION) {
          this.state = S_XML_DECL_ENDING;
          this.text = "";
          this.fail("XML declaration is incomplete.");
          return;
        }
        if (c === EOC) {
          return;
        }
        const value = this.text;
        this.text = "";
        switch (this.name) {
          case "version": {
            this.xmlDeclExpects = ["encoding", "standalone"];
            const version = value;
            this.xmlDecl.version = version;
            if (!/^1\.[0-9]+$/.test(version)) {
              this.fail("version number must match /^1\\.[0-9]+$/.");
            } else if (!this.opt.forceXMLVersion) {
              this.setXMLVersion(version);
            }
            break;
          }
          case "encoding":
            if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(value)) {
              this.fail("encoding value must match /^[A-Za-z0-9][A-Za-z0-9._-]*$/.");
            }
            this.xmlDeclExpects = ["standalone"];
            this.xmlDecl.encoding = value;
            break;
          case "standalone":
            if (value !== "yes" && value !== "no") {
              this.fail('standalone value must match "yes" or "no".');
            }
            this.xmlDeclExpects = [];
            this.xmlDecl.standalone = value;
            break;
          default:
        }
        this.name = "";
        this.state = S_XML_DECL_SEPARATOR;
      }
      sXMLDeclSeparator() {
        const c = this.getCodeNorm();
        if (c === QUESTION) {
          this.state = S_XML_DECL_ENDING;
          return;
        }
        if (!isS(c)) {
          this.fail("whitespace required.");
          this.unget();
        }
        this.state = S_XML_DECL_NAME_START;
      }
      sXMLDeclEnding() {
        var _a;
        const c = this.getCodeNorm();
        if (c === GREATER) {
          if (this.piTarget !== "xml") {
            this.fail("processing instructions are not allowed before root.");
          } else if (this.name !== "version" && this.xmlDeclExpects.includes("version")) {
            this.fail("XML declaration must contain a version.");
          }
          (_a = this.xmldeclHandler) === null || _a === void 0 ? void 0 : _a.call(this, this.xmlDecl);
          this.name = "";
          this.piTarget = this.text = "";
          this.state = S_TEXT;
        } else {
          this.fail("The character ? is disallowed anywhere in XML declarations.");
        }
        this.xmlDeclPossible = false;
      }
      sOpenTag() {
        var _a;
        const c = this.captureNameChars();
        if (c === EOC) {
          return;
        }
        const tag = this.tag = {
          name: this.name,
          attributes: /* @__PURE__ */ Object.create(null)
        };
        this.name = "";
        if (this.xmlnsOpt) {
          this.topNS = tag.ns = /* @__PURE__ */ Object.create(null);
        }
        (_a = this.openTagStartHandler) === null || _a === void 0 ? void 0 : _a.call(this, tag);
        this.sawRoot = true;
        if (!this.fragmentOpt && this.closedRoot) {
          this.fail("documents may contain only one root.");
        }
        switch (c) {
          case GREATER:
            this.openTag();
            break;
          case FORWARD_SLASH:
            this.state = S_OPEN_TAG_SLASH;
            break;
          default:
            if (!isS(c)) {
              this.fail("disallowed character in tag name.");
            }
            this.state = S_ATTRIB;
        }
      }
      sOpenTagSlash() {
        if (this.getCode() === GREATER) {
          this.openSelfClosingTag();
        } else {
          this.fail("forward-slash in opening tag not followed by >.");
          this.state = S_ATTRIB;
        }
      }
      sAttrib() {
        const c = this.skipSpaces();
        if (c === EOC) {
          return;
        }
        if (isNameStartChar(c)) {
          this.unget();
          this.state = S_ATTRIB_NAME;
        } else if (c === GREATER) {
          this.openTag();
        } else if (c === FORWARD_SLASH) {
          this.state = S_OPEN_TAG_SLASH;
        } else {
          this.fail("disallowed character in attribute name.");
        }
      }
      sAttribName() {
        const c = this.captureNameChars();
        if (c === EQUAL) {
          this.state = S_ATTRIB_VALUE;
        } else if (isS(c)) {
          this.state = S_ATTRIB_NAME_SAW_WHITE;
        } else if (c === GREATER) {
          this.fail("attribute without value.");
          this.pushAttrib(this.name, this.name);
          this.name = this.text = "";
          this.openTag();
        } else if (c !== EOC) {
          this.fail("disallowed character in attribute name.");
        }
      }
      sAttribNameSawWhite() {
        const c = this.skipSpaces();
        switch (c) {
          case EOC:
            return;
          case EQUAL:
            this.state = S_ATTRIB_VALUE;
            break;
          default:
            this.fail("attribute without value.");
            this.text = "";
            this.name = "";
            if (c === GREATER) {
              this.openTag();
            } else if (isNameStartChar(c)) {
              this.unget();
              this.state = S_ATTRIB_NAME;
            } else {
              this.fail("disallowed character in attribute name.");
              this.state = S_ATTRIB;
            }
        }
      }
      sAttribValue() {
        const c = this.getCodeNorm();
        if (isQuote(c)) {
          this.q = c;
          this.state = S_ATTRIB_VALUE_QUOTED;
        } else if (!isS(c)) {
          this.fail("unquoted attribute value.");
          this.state = S_ATTRIB_VALUE_UNQUOTED;
          this.unget();
        }
      }
      sAttribValueQuoted() {
        const { q, chunk } = this;
        let { i: start } = this;
        while (true) {
          switch (this.getCode()) {
            case q:
              this.pushAttrib(this.name, this.text + chunk.slice(start, this.prevI));
              this.name = this.text = "";
              this.q = null;
              this.state = S_ATTRIB_VALUE_CLOSED;
              return;
            case AMP:
              this.text += chunk.slice(start, this.prevI);
              this.state = S_ENTITY;
              this.entityReturnState = S_ATTRIB_VALUE_QUOTED;
              return;
            case NL:
            case NL_LIKE:
            case TAB:
              this.text += `${chunk.slice(start, this.prevI)} `;
              start = this.i;
              break;
            case LESS:
              this.text += chunk.slice(start, this.prevI);
              this.fail("disallowed character.");
              return;
            case EOC:
              this.text += chunk.slice(start);
              return;
            default:
          }
        }
      }
      sAttribValueClosed() {
        const c = this.getCodeNorm();
        if (isS(c)) {
          this.state = S_ATTRIB;
        } else if (c === GREATER) {
          this.openTag();
        } else if (c === FORWARD_SLASH) {
          this.state = S_OPEN_TAG_SLASH;
        } else if (isNameStartChar(c)) {
          this.fail("no whitespace between attributes.");
          this.unget();
          this.state = S_ATTRIB_NAME;
        } else {
          this.fail("disallowed character in attribute name.");
        }
      }
      sAttribValueUnquoted() {
        const c = this.captureTo(ATTRIB_VALUE_UNQUOTED_TERMINATOR);
        switch (c) {
          case AMP:
            this.state = S_ENTITY;
            this.entityReturnState = S_ATTRIB_VALUE_UNQUOTED;
            break;
          case LESS:
            this.fail("disallowed character.");
            break;
          case EOC:
            break;
          default:
            if (this.text.includes("]]>")) {
              this.fail('the string "]]>" is disallowed in char data.');
            }
            this.pushAttrib(this.name, this.text);
            this.name = this.text = "";
            if (c === GREATER) {
              this.openTag();
            } else {
              this.state = S_ATTRIB;
            }
        }
      }
      sCloseTag() {
        const c = this.captureNameChars();
        if (c === GREATER) {
          this.closeTag();
        } else if (isS(c)) {
          this.state = S_CLOSE_TAG_SAW_WHITE;
        } else if (c !== EOC) {
          this.fail("disallowed character in closing tag.");
        }
      }
      sCloseTagSawWhite() {
        switch (this.skipSpaces()) {
          case GREATER:
            this.closeTag();
            break;
          case EOC:
            break;
          default:
            this.fail("disallowed character in closing tag.");
        }
      }
      // END OF STATE ENGINE METHODS
      handleTextInRoot() {
        let { i: start, forbiddenState } = this;
        const { chunk, textHandler: handler } = this;
        scanLoop:
          while (true) {
            switch (this.getCode()) {
              case LESS: {
                this.state = S_OPEN_WAKA;
                if (handler !== void 0) {
                  const { text: text2 } = this;
                  const slice = chunk.slice(start, this.prevI);
                  if (text2.length !== 0) {
                    handler(text2 + slice);
                    this.text = "";
                  } else if (slice.length !== 0) {
                    handler(slice);
                  }
                }
                forbiddenState = FORBIDDEN_START;
                break scanLoop;
              }
              case AMP:
                this.state = S_ENTITY;
                this.entityReturnState = S_TEXT;
                if (handler !== void 0) {
                  this.text += chunk.slice(start, this.prevI);
                }
                forbiddenState = FORBIDDEN_START;
                break scanLoop;
              case CLOSE_BRACKET:
                switch (forbiddenState) {
                  case FORBIDDEN_START:
                    forbiddenState = FORBIDDEN_BRACKET;
                    break;
                  case FORBIDDEN_BRACKET:
                    forbiddenState = FORBIDDEN_BRACKET_BRACKET;
                    break;
                  case FORBIDDEN_BRACKET_BRACKET:
                    break;
                  default:
                    throw new Error("impossible state");
                }
                break;
              case GREATER:
                if (forbiddenState === FORBIDDEN_BRACKET_BRACKET) {
                  this.fail('the string "]]>" is disallowed in char data.');
                }
                forbiddenState = FORBIDDEN_START;
                break;
              case NL_LIKE:
                if (handler !== void 0) {
                  this.text += `${chunk.slice(start, this.prevI)}
`;
                }
                start = this.i;
                forbiddenState = FORBIDDEN_START;
                break;
              case EOC:
                if (handler !== void 0) {
                  this.text += chunk.slice(start);
                }
                break scanLoop;
              default:
                forbiddenState = FORBIDDEN_START;
            }
          }
        this.forbiddenState = forbiddenState;
      }
      handleTextOutsideRoot() {
        let { i: start } = this;
        const { chunk, textHandler: handler } = this;
        let nonSpace = false;
        outRootLoop:
          while (true) {
            const code2 = this.getCode();
            switch (code2) {
              case LESS: {
                this.state = S_OPEN_WAKA;
                if (handler !== void 0) {
                  const { text: text2 } = this;
                  const slice = chunk.slice(start, this.prevI);
                  if (text2.length !== 0) {
                    handler(text2 + slice);
                    this.text = "";
                  } else if (slice.length !== 0) {
                    handler(slice);
                  }
                }
                break outRootLoop;
              }
              case AMP:
                this.state = S_ENTITY;
                this.entityReturnState = S_TEXT;
                if (handler !== void 0) {
                  this.text += chunk.slice(start, this.prevI);
                }
                nonSpace = true;
                break outRootLoop;
              case NL_LIKE:
                if (handler !== void 0) {
                  this.text += `${chunk.slice(start, this.prevI)}
`;
                }
                start = this.i;
                break;
              case EOC:
                if (handler !== void 0) {
                  this.text += chunk.slice(start);
                }
                break outRootLoop;
              default:
                if (!isS(code2)) {
                  nonSpace = true;
                }
            }
          }
        if (!nonSpace) {
          return;
        }
        if (!this.sawRoot && !this.reportedTextBeforeRoot) {
          this.fail("text data outside of root node.");
          this.reportedTextBeforeRoot = true;
        }
        if (this.closedRoot && !this.reportedTextAfterRoot) {
          this.fail("text data outside of root node.");
          this.reportedTextAfterRoot = true;
        }
      }
      pushAttribNS(name, value) {
        var _a;
        const { prefix, local } = this.qname(name);
        const attr = { name, prefix, local, value };
        this.attribList.push(attr);
        (_a = this.attributeHandler) === null || _a === void 0 ? void 0 : _a.call(this, attr);
        if (prefix === "xmlns") {
          const trimmed = value.trim();
          if (this.currentXMLVersion === "1.0" && trimmed === "") {
            this.fail("invalid attempt to undefine prefix in XML 1.0");
          }
          this.topNS[local] = trimmed;
          nsPairCheck(this, local, trimmed);
        } else if (name === "xmlns") {
          const trimmed = value.trim();
          this.topNS[""] = trimmed;
          nsPairCheck(this, "", trimmed);
        }
      }
      pushAttribPlain(name, value) {
        var _a;
        const attr = { name, value };
        this.attribList.push(attr);
        (_a = this.attributeHandler) === null || _a === void 0 ? void 0 : _a.call(this, attr);
      }
      /**
       * End parsing. This performs final well-formedness checks and resets the
       * parser to a clean state.
       *
       * @returns this
       */
      end() {
        var _a, _b;
        if (!this.sawRoot) {
          this.fail("document must contain a root element.");
        }
        const { tags } = this;
        while (tags.length > 0) {
          const tag = tags.pop();
          this.fail(`unclosed tag: ${tag.name}`);
        }
        if (this.state !== S_BEGIN && this.state !== S_TEXT) {
          this.fail("unexpected end.");
        }
        const { text: text2 } = this;
        if (text2.length !== 0) {
          (_a = this.textHandler) === null || _a === void 0 ? void 0 : _a.call(this, text2);
          this.text = "";
        }
        this._closed = true;
        (_b = this.endHandler) === null || _b === void 0 ? void 0 : _b.call(this);
        this._init();
        return this;
      }
      /**
       * Resolve a namespace prefix.
       *
       * @param prefix The prefix to resolve.
       *
       * @returns The namespace URI or ``undefined`` if the prefix is not defined.
       */
      resolve(prefix) {
        var _a, _b;
        let uri = this.topNS[prefix];
        if (uri !== void 0) {
          return uri;
        }
        const { tags } = this;
        for (let index = tags.length - 1; index >= 0; index--) {
          uri = tags[index].ns[prefix];
          if (uri !== void 0) {
            return uri;
          }
        }
        uri = this.ns[prefix];
        if (uri !== void 0) {
          return uri;
        }
        return (_b = (_a = this.opt).resolvePrefix) === null || _b === void 0 ? void 0 : _b.call(_a, prefix);
      }
      /**
       * Parse a qname into its prefix and local name parts.
       *
       * @param name The name to parse
       *
       * @returns
       */
      qname(name) {
        const colon = name.indexOf(":");
        if (colon === -1) {
          return { prefix: "", local: name };
        }
        const local = name.slice(colon + 1);
        const prefix = name.slice(0, colon);
        if (prefix === "" || local === "" || local.includes(":")) {
          this.fail(`malformed name: ${name}.`);
        }
        return { prefix, local };
      }
      processAttribsNS() {
        var _a;
        const { attribList } = this;
        const tag = this.tag;
        {
          const { prefix, local } = this.qname(tag.name);
          tag.prefix = prefix;
          tag.local = local;
          const uri = tag.uri = (_a = this.resolve(prefix)) !== null && _a !== void 0 ? _a : "";
          if (prefix !== "") {
            if (prefix === "xmlns") {
              this.fail('tags may not have "xmlns" as prefix.');
            }
            if (uri === "") {
              this.fail(`unbound namespace prefix: ${JSON.stringify(prefix)}.`);
              tag.uri = prefix;
            }
          }
        }
        if (attribList.length === 0) {
          return;
        }
        const { attributes } = tag;
        const seen = /* @__PURE__ */ new Set();
        for (const attr of attribList) {
          const { name, prefix, local } = attr;
          let uri;
          let eqname;
          if (prefix === "") {
            uri = name === "xmlns" ? XMLNS_NAMESPACE : "";
            eqname = name;
          } else {
            uri = this.resolve(prefix);
            if (uri === void 0) {
              this.fail(`unbound namespace prefix: ${JSON.stringify(prefix)}.`);
              uri = prefix;
            }
            eqname = `{${uri}}${local}`;
          }
          if (seen.has(eqname)) {
            this.fail(`duplicate attribute: ${eqname}.`);
          }
          seen.add(eqname);
          attr.uri = uri;
          attributes[name] = attr;
        }
        this.attribList = [];
      }
      processAttribsPlain() {
        const { attribList } = this;
        const attributes = this.tag.attributes;
        for (const { name, value } of attribList) {
          if (attributes[name] !== void 0) {
            this.fail(`duplicate attribute: ${name}.`);
          }
          attributes[name] = value;
        }
        this.attribList = [];
      }
      /**
       * Handle a complete open tag. This parser code calls this once it has seen
       * the whole tag. This method checks for well-formeness and then emits
       * ``onopentag``.
       */
      openTag() {
        var _a;
        this.processAttribs();
        const { tags } = this;
        const tag = this.tag;
        tag.isSelfClosing = false;
        (_a = this.openTagHandler) === null || _a === void 0 ? void 0 : _a.call(this, tag);
        tags.push(tag);
        this.state = S_TEXT;
        this.name = "";
      }
      /**
       * Handle a complete self-closing tag. This parser code calls this once it has
       * seen the whole tag. This method checks for well-formeness and then emits
       * ``onopentag`` and ``onclosetag``.
       */
      openSelfClosingTag() {
        var _a, _b, _c;
        this.processAttribs();
        const { tags } = this;
        const tag = this.tag;
        tag.isSelfClosing = true;
        (_a = this.openTagHandler) === null || _a === void 0 ? void 0 : _a.call(this, tag);
        (_b = this.closeTagHandler) === null || _b === void 0 ? void 0 : _b.call(this, tag);
        const top = this.tag = (_c = tags[tags.length - 1]) !== null && _c !== void 0 ? _c : null;
        if (top === null) {
          this.closedRoot = true;
        }
        this.state = S_TEXT;
        this.name = "";
      }
      /**
       * Handle a complete close tag. This parser code calls this once it has seen
       * the whole tag. This method checks for well-formeness and then emits
       * ``onclosetag``.
       */
      closeTag() {
        const { tags, name } = this;
        this.state = S_TEXT;
        this.name = "";
        if (name === "") {
          this.fail("weird empty close tag.");
          this.text += "</>";
          return;
        }
        const handler = this.closeTagHandler;
        let l = tags.length;
        while (l-- > 0) {
          const tag = this.tag = tags.pop();
          this.topNS = tag.ns;
          handler === null || handler === void 0 ? void 0 : handler(tag);
          if (tag.name === name) {
            break;
          }
          this.fail("unexpected close tag.");
        }
        if (l === 0) {
          this.closedRoot = true;
        } else if (l < 0) {
          this.fail(`unmatched closing tag: ${name}.`);
          this.text += `</${name}>`;
        }
      }
      /**
       * Resolves an entity. Makes any necessary well-formedness checks.
       *
       * @param entity The entity to resolve.
       *
       * @returns The parsed entity.
       */
      parseEntity(entity) {
        if (entity[0] !== "#") {
          const defined = this.ENTITIES[entity];
          if (defined !== void 0) {
            return defined;
          }
          this.fail(this.isName(entity) ? "undefined entity." : "disallowed character in entity name.");
          return `&${entity};`;
        }
        let num = NaN;
        if (entity[1] === "x" && /^#x[0-9a-f]+$/i.test(entity)) {
          num = parseInt(entity.slice(2), 16);
        } else if (/^#[0-9]+$/.test(entity)) {
          num = parseInt(entity.slice(1), 10);
        }
        if (!this.isChar(num)) {
          this.fail("malformed character entity.");
          return `&${entity};`;
        }
        return String.fromCodePoint(num);
      }
    };
    exports2.SaxesParser = SaxesParser2;
  }
});

// src/action.ts
var import_node_fs4 = require("node:fs");
var import_node_path3 = require("node:path");

// src/check.ts
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");

// src/engine/rules-catalog.ts
var R = (id, source, severity, section, bt, title, description, fix) => ({ id, source, severity, section, bt, title, description, fix });
var RULES = [
  // ---------- Syntax & structure ----------
  R(
    "IV-SYN-01",
    "InvoiceVerify",
    "error",
    "document",
    void 0,
    "XML is not well-formed",
    "The file must be well-formed XML: every element closed, attributes quoted and only one root element.",
    "Open the file at the reported line. Typical causes are an unclosed tag, an unescaped '&' (write &amp;) or text pasted outside the root element."
  ),
  R(
    "IV-SYN-02",
    "InvoiceVerify",
    "error",
    "document",
    void 0,
    "Unsupported document type",
    "The root element must be a UBL 2.1 Invoice or CreditNote, or a UN/CEFACT CrossIndustryInvoice, in the correct namespace.",
    "Check the root element and its xmlns declaration. UBL invoices use urn:oasis:names:specification:ubl:schema:xsd:Invoice-2; CII uses urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100."
  ),
  R(
    "IV-SYN-03",
    "InvoiceVerify",
    "error",
    "document",
    void 0,
    "Invalid data type",
    "Amounts, quantities and percentages must be decimal numbers; dates must use the syntax date format (YYYY-MM-DD in UBL, YYYYMMDD with format 102 in CII).",
    "Remove thousands separators and currency symbols, use a dot as decimal separator and write dates without time components."
  ),
  R(
    "IV-SYN-04",
    "InvoiceVerify",
    "warning",
    "document",
    void 0,
    "Profile below EN 16931",
    "Factur-X / ZUGFeRD MINIMUM and BASIC WL profiles do not carry line items and are not valid EN 16931 invoices.",
    "Export the invoice with the BASIC, EN 16931 (Comfort) or EXTENDED profile if your buyer needs a compliant e-invoice — Germany does not accept MINIMUM or BASIC WL as e-invoices."
  ),
  // ---------- Mandatory content ----------
  R(
    "BR-01",
    "EN16931",
    "error",
    "header",
    ["BT-24"],
    "Specification identifier missing",
    "An Invoice shall have a Specification identifier (BT-24).",
    "Add cbc:CustomizationID (UBL) or GuidelineSpecifiedDocumentContextParameter/ID (CII). For Peppol use urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0."
  ),
  R(
    "BR-02",
    "EN16931",
    "error",
    "header",
    ["BT-1"],
    "Invoice number missing",
    "An Invoice shall have an Invoice number (BT-1).",
    "Add the unique sequential invoice number from your accounting system as cbc:ID."
  ),
  R(
    "BR-03",
    "EN16931",
    "error",
    "header",
    ["BT-2"],
    "Issue date missing",
    "An Invoice shall have an Invoice issue date (BT-2).",
    "Add cbc:IssueDate in YYYY-MM-DD format."
  ),
  R(
    "BR-04",
    "EN16931",
    "error",
    "header",
    ["BT-3"],
    "Invoice type code missing",
    "An Invoice shall have an Invoice type code (BT-3).",
    "Add cbc:InvoiceTypeCode — 380 for a commercial invoice, 381 for a credit note."
  ),
  R(
    "BR-05",
    "EN16931",
    "error",
    "header",
    ["BT-5"],
    "Invoice currency code missing",
    "An Invoice shall have an Invoice currency code (BT-5).",
    "Add cbc:DocumentCurrencyCode with an ISO 4217 code such as EUR."
  ),
  R(
    "BR-06",
    "EN16931",
    "error",
    "parties",
    ["BT-27"],
    "Seller name missing",
    "An Invoice shall contain the Seller name (BT-27).",
    "Add the registered legal name under cac:PartyLegalEntity/cbc:RegistrationName of the supplier party."
  ),
  R(
    "BR-07",
    "EN16931",
    "error",
    "parties",
    ["BT-44"],
    "Buyer name missing",
    "An Invoice shall contain the Buyer name (BT-44).",
    "Add the buyer's legal name under cac:PartyLegalEntity/cbc:RegistrationName of the customer party."
  ),
  R(
    "BR-08",
    "EN16931",
    "error",
    "parties",
    ["BG-5"],
    "Seller postal address missing",
    "An Invoice shall contain the Seller postal address (BG-5).",
    "Add cac:PostalAddress to the supplier party with at least the country code."
  ),
  R(
    "BR-09",
    "EN16931",
    "error",
    "parties",
    ["BT-40"],
    "Seller country code missing",
    "The Seller postal address (BG-5) shall contain a Seller country code (BT-40).",
    "Add cac:Country/cbc:IdentificationCode with an ISO 3166-1 alpha-2 code, e.g. DE."
  ),
  R(
    "BR-10",
    "EN16931",
    "error",
    "parties",
    ["BG-8"],
    "Buyer postal address missing",
    "An Invoice shall contain the Buyer postal address (BG-8).",
    "Add cac:PostalAddress to the customer party with at least the country code."
  ),
  R(
    "BR-11",
    "EN16931",
    "error",
    "parties",
    ["BT-55"],
    "Buyer country code missing",
    "The Buyer postal address shall contain a Buyer country code (BT-55).",
    "Add cac:Country/cbc:IdentificationCode to the buyer address."
  ),
  R(
    "BR-12",
    "EN16931",
    "error",
    "totals",
    ["BT-106"],
    "Sum of line net amounts missing",
    "An Invoice shall have the Sum of Invoice line net amount (BT-106).",
    "Add cbc:LineExtensionAmount to cac:LegalMonetaryTotal."
  ),
  R(
    "BR-13",
    "EN16931",
    "error",
    "totals",
    ["BT-109"],
    "Total without VAT missing",
    "An Invoice shall have the Invoice total amount without VAT (BT-109).",
    "Add cbc:TaxExclusiveAmount to cac:LegalMonetaryTotal."
  ),
  R(
    "BR-14",
    "EN16931",
    "error",
    "totals",
    ["BT-112"],
    "Total with VAT missing",
    "An Invoice shall have the Invoice total amount with VAT (BT-112).",
    "Add cbc:TaxInclusiveAmount to cac:LegalMonetaryTotal."
  ),
  R(
    "BR-15",
    "EN16931",
    "error",
    "totals",
    ["BT-115"],
    "Amount due for payment missing",
    "An Invoice shall have the Amount due for payment (BT-115).",
    "Add cbc:PayableAmount to cac:LegalMonetaryTotal."
  ),
  R(
    "BR-16",
    "EN16931",
    "error",
    "lines",
    ["BG-25"],
    "No invoice lines",
    "An Invoice shall have at least one Invoice line (BG-25).",
    "Add at least one cac:InvoiceLine (or cac:CreditNoteLine)."
  ),
  R(
    "BR-17",
    "EN16931",
    "error",
    "parties",
    ["BT-59"],
    "Payee name missing",
    "The Payee name (BT-59) shall be provided if the Payee (BG-10) is different from the Seller.",
    "Add cac:PartyName/cbc:Name inside cac:PayeeParty, or remove the payee group."
  ),
  R(
    "BR-18",
    "EN16931",
    "error",
    "parties",
    ["BT-62"],
    "Tax representative name missing",
    "The Seller tax representative name (BT-62) shall be provided if the Seller has a tax representative.",
    "Add cac:PartyName/cbc:Name inside cac:TaxRepresentativeParty."
  ),
  R(
    "BR-19",
    "EN16931",
    "error",
    "parties",
    ["BG-12"],
    "Tax representative address missing",
    "The Seller tax representative postal address (BG-12) shall be provided if the Seller has a tax representative.",
    "Add cac:PostalAddress to the tax representative party."
  ),
  R(
    "BR-21",
    "EN16931",
    "error",
    "lines",
    ["BT-126"],
    "Line identifier missing",
    "Each Invoice line shall have an Invoice line identifier (BT-126).",
    "Give every line a unique cbc:ID, e.g. 1, 2, 3."
  ),
  R(
    "BR-22",
    "EN16931",
    "error",
    "lines",
    ["BT-129"],
    "Invoiced quantity missing",
    "Each Invoice line shall have an Invoiced quantity (BT-129).",
    "Add cbc:InvoicedQuantity with a unitCode attribute."
  ),
  R(
    "BR-23",
    "EN16931",
    "error",
    "lines",
    ["BT-130"],
    "Unit of measure missing",
    "An Invoice line shall have an Invoiced quantity unit of measure code (BT-130).",
    'Add the unitCode attribute, e.g. unitCode="C62" for pieces or "HUR" for hours.'
  ),
  R(
    "BR-24",
    "EN16931",
    "error",
    "lines",
    ["BT-131"],
    "Line net amount missing",
    "Each Invoice line shall have an Invoice line net amount (BT-131).",
    "Add cbc:LineExtensionAmount to every line."
  ),
  R(
    "BR-25",
    "EN16931",
    "error",
    "lines",
    ["BT-153"],
    "Item name missing",
    "Each Invoice line shall contain the Item name (BT-153).",
    "Add cac:Item/cbc:Name describing the product or service."
  ),
  R(
    "BR-26",
    "EN16931",
    "error",
    "lines",
    ["BT-146"],
    "Item net price missing",
    "Each Invoice line shall contain the Item net price (BT-146).",
    "Add cac:Price/cbc:PriceAmount."
  ),
  R(
    "BR-27",
    "EN16931",
    "error",
    "lines",
    ["BT-146"],
    "Negative item net price",
    "The Item net price (BT-146) shall NOT be negative.",
    "Use a positive price with a negative quantity for returns, or a line allowance for discounts."
  ),
  R(
    "BR-28",
    "EN16931",
    "error",
    "lines",
    ["BT-148"],
    "Negative item gross price",
    "The Item gross price (BT-148) shall NOT be negative.",
    "Use a positive gross price; express discounts as price allowances."
  ),
  R(
    "BR-29",
    "EN16931",
    "error",
    "header",
    ["BT-73", "BT-74"],
    "Invoice period ends before it starts",
    "If both Invoicing period start date (BT-73) and end date (BT-74) are given, the end date shall be later or equal to the start date.",
    "Swap or correct the dates in cac:InvoicePeriod."
  ),
  R(
    "BR-30",
    "EN16931",
    "error",
    "lines",
    ["BT-134", "BT-135"],
    "Line period ends before it starts",
    "If both Invoice line period start date (BT-134) and end date (BT-135) are given, the end date shall be later or equal to the start date.",
    "Correct the dates in the line cac:InvoicePeriod."
  ),
  R(
    "BR-31",
    "EN16931",
    "error",
    "totals",
    ["BT-92"],
    "Document allowance amount missing",
    "Each Document level allowance (BG-20) shall have a Document level allowance amount (BT-92).",
    "Add cbc:Amount to the cac:AllowanceCharge with ChargeIndicator false."
  ),
  R(
    "BR-32",
    "EN16931",
    "error",
    "vat",
    ["BT-95"],
    "Document allowance VAT category missing",
    "Each Document level allowance (BG-20) shall have a Document level allowance VAT category code (BT-95).",
    "Add cac:TaxCategory/cbc:ID (e.g. S) to the allowance."
  ),
  R(
    "BR-33",
    "EN16931",
    "error",
    "totals",
    ["BT-97", "BT-98"],
    "Document allowance reason missing",
    "Each Document level allowance (BG-20) shall have a Document level allowance reason (BT-97) or reason code (BT-98).",
    "Add cbc:AllowanceChargeReason (free text) or cbc:AllowanceChargeReasonCode (UNCL5189, e.g. 95 Discount)."
  ),
  R(
    "BR-36",
    "EN16931",
    "error",
    "totals",
    ["BT-99"],
    "Document charge amount missing",
    "Each Document level charge (BG-21) shall have a Document level charge amount (BT-99).",
    "Add cbc:Amount to the cac:AllowanceCharge with ChargeIndicator true."
  ),
  R(
    "BR-37",
    "EN16931",
    "error",
    "vat",
    ["BT-102"],
    "Document charge VAT category missing",
    "Each Document level charge (BG-21) shall have a Document level charge VAT category code (BT-102).",
    "Add cac:TaxCategory/cbc:ID to the charge."
  ),
  R(
    "BR-38",
    "EN16931",
    "error",
    "totals",
    ["BT-104", "BT-105"],
    "Document charge reason missing",
    "Each Document level charge (BG-21) shall have a Document level charge reason (BT-104) or reason code (BT-105).",
    "Add cbc:AllowanceChargeReason or cbc:AllowanceChargeReasonCode (UNCL7161, e.g. FC freight)."
  ),
  R(
    "BR-41",
    "EN16931",
    "error",
    "lines",
    ["BT-136"],
    "Line allowance amount missing",
    "Each Invoice line allowance (BG-27) shall have an Invoice line allowance amount (BT-136).",
    "Add cbc:Amount to the line-level allowance."
  ),
  R(
    "BR-42",
    "EN16931",
    "error",
    "lines",
    ["BT-139", "BT-140"],
    "Line allowance reason missing",
    "Each Invoice line allowance (BG-27) shall have a reason (BT-139) or reason code (BT-140).",
    "Add cbc:AllowanceChargeReason or a reason code to the line allowance."
  ),
  R(
    "BR-43",
    "EN16931",
    "error",
    "lines",
    ["BT-141"],
    "Line charge amount missing",
    "Each Invoice line charge (BG-28) shall have an Invoice line charge amount (BT-141).",
    "Add cbc:Amount to the line-level charge."
  ),
  R(
    "BR-44",
    "EN16931",
    "error",
    "lines",
    ["BT-144", "BT-145"],
    "Line charge reason missing",
    "Each Invoice line charge (BG-28) shall have a reason (BT-144) or reason code (BT-145).",
    "Add cbc:AllowanceChargeReason or a reason code to the line charge."
  ),
  R(
    "BR-45",
    "EN16931",
    "error",
    "vat",
    ["BT-116"],
    "VAT taxable amount missing",
    "Each VAT breakdown (BG-23) shall have a VAT category taxable amount (BT-116).",
    "Add cbc:TaxableAmount to every cac:TaxSubtotal."
  ),
  R(
    "BR-46",
    "EN16931",
    "error",
    "vat",
    ["BT-117"],
    "VAT category tax amount missing",
    "Each VAT breakdown (BG-23) shall have a VAT category tax amount (BT-117).",
    "Add cbc:TaxAmount to every cac:TaxSubtotal."
  ),
  R(
    "BR-47",
    "EN16931",
    "error",
    "vat",
    ["BT-118"],
    "VAT category code missing",
    "Each VAT breakdown (BG-23) shall be defined through a VAT category code (BT-118).",
    "Add cac:TaxCategory/cbc:ID with a UNCL5305 code (S, Z, E, AE, K, G, O, L, M)."
  ),
  R(
    "BR-48",
    "EN16931",
    "error",
    "vat",
    ["BT-119"],
    "VAT category rate missing",
    "Each VAT breakdown (BG-23) shall have a VAT category rate (BT-119), except if the Invoice is not subject to VAT.",
    "Add cac:TaxCategory/cbc:Percent (use 0 for zero rated, exempt and reverse charge)."
  ),
  R(
    "BR-49",
    "EN16931",
    "error",
    "payment",
    ["BT-81"],
    "Payment means code missing",
    "A Payment instruction (BG-16) shall specify the Payment means type code (BT-81).",
    "Add cbc:PaymentMeansCode, e.g. 58 for SEPA credit transfer or 30 for credit transfer."
  ),
  R(
    "BR-53",
    "EN16931",
    "error",
    "totals",
    ["BT-111"],
    "VAT total in accounting currency missing",
    "If the VAT accounting currency code (BT-6) is present, the Invoice total VAT amount in accounting currency (BT-111) shall be provided.",
    "Add a second cac:TaxTotal with cbc:TaxAmount in the accounting currency, or remove cbc:TaxCurrencyCode."
  ),
  R(
    "BR-54",
    "EN16931",
    "error",
    "lines",
    ["BT-160", "BT-161"],
    "Item attribute incomplete",
    "Each Item attribute (BG-32) shall contain an Item attribute name (BT-160) and an Item attribute value (BT-161).",
    "Fill both cbc:Name and cbc:Value in cac:AdditionalItemProperty."
  ),
  R(
    "BR-55",
    "EN16931",
    "error",
    "header",
    ["BT-25"],
    "Preceding invoice reference incomplete",
    "Each Preceding Invoice reference (BG-3) shall contain a Preceding Invoice reference (BT-25).",
    "Add the original invoice number in cac:BillingReference/cac:InvoiceDocumentReference/cbc:ID."
  ),
  R(
    "BR-56",
    "EN16931",
    "error",
    "parties",
    ["BT-63"],
    "Tax representative VAT number missing",
    "Each Seller tax representative party (BG-11) shall have a Seller tax representative VAT identifier (BT-63).",
    "Add cac:PartyTaxScheme/cbc:CompanyID to the tax representative."
  ),
  R(
    "BR-57",
    "EN16931",
    "error",
    "parties",
    ["BT-80"],
    "Deliver-to country code missing",
    "Each Deliver to address (BG-15) shall contain a Deliver to country code (BT-80).",
    "Add cac:Country/cbc:IdentificationCode to the delivery address."
  ),
  R(
    "BR-61",
    "EN16931",
    "error",
    "payment",
    ["BT-84"],
    "Payment account missing for credit transfer",
    "If the Payment means type code (BT-81) means SEPA credit transfer, Local credit transfer or Non-SEPA international credit transfer, the Payment account identifier (BT-84) shall be present.",
    "Add the IBAN in cac:PayeeFinancialAccount/cbc:ID."
  ),
  R(
    "BR-62",
    "EN16931",
    "error",
    "parties",
    ["BT-34"],
    "Seller electronic address scheme missing",
    "The Seller electronic address (BT-34) shall have a Scheme identifier.",
    'Add the schemeID attribute to cbc:EndpointID, e.g. schemeID="9930" for a German VAT number or "0208" for a Belgian enterprise number.'
  ),
  R(
    "BR-63",
    "EN16931",
    "error",
    "parties",
    ["BT-49"],
    "Buyer electronic address scheme missing",
    "The Buyer electronic address (BT-49) shall have a Scheme identifier.",
    "Add the schemeID attribute to the buyer cbc:EndpointID."
  ),
  R(
    "BR-64",
    "EN16931",
    "error",
    "lines",
    ["BT-157"],
    "Item standard identifier scheme missing",
    "The Item standard identifier (BT-157) shall have a Scheme identifier.",
    "Add schemeID (e.g. 0160 for GTIN) to cac:StandardItemIdentification/cbc:ID."
  ),
  R(
    "BR-65",
    "EN16931",
    "error",
    "lines",
    ["BT-158"],
    "Item classification scheme missing",
    "The Item classification identifier (BT-158) shall have a Scheme identifier.",
    "Add listID (e.g. STI, CPV) to cbc:ItemClassificationCode."
  ),
  // ---------- Conditions & calculations ----------
  R(
    "BR-CO-03",
    "EN16931",
    "error",
    "header",
    ["BT-7", "BT-8"],
    "Both tax point date and code present",
    "Value added tax point date (BT-7) and Value added tax point date code (BT-8) are mutually exclusive.",
    "Keep either cbc:TaxPointDate or InvoicePeriod/cbc:DescriptionCode, not both."
  ),
  R(
    "BR-CO-04",
    "EN16931",
    "error",
    "lines",
    ["BT-151"],
    "Line without VAT category",
    "Each Invoice line (BG-25) shall be categorized with an Invoiced item VAT category code (BT-151).",
    "Add cac:Item/cac:ClassifiedTaxCategory/cbc:ID to every line."
  ),
  R(
    "BR-CO-09",
    "EN16931",
    "error",
    "parties",
    ["BT-31", "BT-48", "BT-63"],
    "VAT identifier without country prefix",
    "The Seller VAT identifier (BT-31), the Seller tax representative VAT identifier (BT-63) and the Buyer VAT identifier (BT-48) shall have a prefix in accordance with ISO code ISO 3166-1 alpha-2 by which the country of issue may be identified. Nevertheless, Greece may use the prefix 'EL'.",
    "Write the VAT number with its two-letter country prefix and no spaces, e.g. DE123456789 or NL123456782B01."
  ),
  R(
    "BR-CO-10",
    "EN16931",
    "error",
    "totals",
    ["BT-106", "BT-131"],
    "Sum of line amounts does not match",
    "Sum of Invoice line net amount (BT-106) = Σ Invoice line net amount (BT-131).",
    "Recalculate cbc:LineExtensionAmount in LegalMonetaryTotal as the exact sum of all line amounts, rounded to 2 decimals per line before summing."
  ),
  R(
    "BR-CO-11",
    "EN16931",
    "error",
    "totals",
    ["BT-107", "BT-92"],
    "Allowance total does not match",
    "Sum of allowances on document level (BT-107) = Σ Document level allowance amount (BT-92).",
    "Set cbc:AllowanceTotalAmount to the sum of document-level allowances."
  ),
  R(
    "BR-CO-12",
    "EN16931",
    "error",
    "totals",
    ["BT-108", "BT-99"],
    "Charge total does not match",
    "Sum of charges on document level (BT-108) = Σ Document level charge amount (BT-99).",
    "Set cbc:ChargeTotalAmount to the sum of document-level charges."
  ),
  R(
    "BR-CO-13",
    "EN16931",
    "error",
    "totals",
    ["BT-109"],
    "Total without VAT does not match",
    "Invoice total amount without VAT (BT-109) = Σ Invoice line net amount (BT-131) − Sum of allowances on document level (BT-107) + Sum of charges on document level (BT-108).",
    "Recalculate cbc:TaxExclusiveAmount from line totals, allowances and charges."
  ),
  R(
    "BR-CO-14",
    "EN16931",
    "error",
    "vat",
    ["BT-110", "BT-117"],
    "VAT total does not match breakdown",
    "Invoice total VAT amount (BT-110) = Σ VAT category tax amount (BT-117).",
    "Make cac:TaxTotal/cbc:TaxAmount equal to the sum of all cac:TaxSubtotal/cbc:TaxAmount values."
  ),
  R(
    "BR-CO-15",
    "EN16931",
    "error",
    "totals",
    ["BT-112", "BT-109", "BT-110"],
    "Total with VAT does not match",
    "Invoice total amount with VAT (BT-112) = Invoice total amount without VAT (BT-109) + Invoice total VAT amount (BT-110).",
    "Set cbc:TaxInclusiveAmount to TaxExclusiveAmount plus the total VAT amount."
  ),
  R(
    "BR-CO-16",
    "EN16931",
    "error",
    "totals",
    ["BT-115"],
    "Amount due does not match",
    "Amount due for payment (BT-115) = Invoice total amount with VAT (BT-112) − Paid amount (BT-113) + Rounding amount (BT-114).",
    "Recalculate cbc:PayableAmount, taking prepaid and rounding amounts into account."
  ),
  R(
    "BR-CO-17",
    "EN16931",
    "error",
    "vat",
    ["BT-117", "BT-116", "BT-119"],
    "VAT amount does not match rate",
    "VAT category tax amount (BT-117) = VAT category taxable amount (BT-116) × (VAT category rate (BT-119) / 100), rounded to two decimals.",
    "Calculate VAT per category on the taxable total (not per line) and round once to 2 decimals."
  ),
  R(
    "BR-CO-18",
    "EN16931",
    "error",
    "vat",
    ["BG-23"],
    "No VAT breakdown",
    "An Invoice shall at least have one VAT breakdown group (BG-23).",
    "Add cac:TaxTotal with at least one cac:TaxSubtotal."
  ),
  R(
    "BR-CO-19",
    "EN16931",
    "error",
    "header",
    ["BG-14"],
    "Empty invoice period",
    "If Invoicing period (BG-14) is used, the Invoicing period start date (BT-73) or the end date (BT-74) shall be filled, or both.",
    "Add cbc:StartDate and/or cbc:EndDate or remove cac:InvoicePeriod."
  ),
  R(
    "BR-CO-20",
    "EN16931",
    "error",
    "lines",
    ["BG-26"],
    "Empty line period",
    "If Invoice line period (BG-26) is used, the start date (BT-134) or end date (BT-135) shall be filled, or both.",
    "Add the dates or remove the line cac:InvoicePeriod."
  ),
  R(
    "BR-CO-25",
    "EN16931",
    "error",
    "payment",
    ["BT-9", "BT-20"],
    "No due date or payment terms",
    "In case the Amount due for payment (BT-115) is positive, either the Payment due date (BT-9) or the Payment terms (BT-20) shall be present.",
    'Add cbc:DueDate or cac:PaymentTerms/cbc:Note, e.g. "Net 30 days".'
  ),
  R(
    "BR-CO-26",
    "EN16931",
    "error",
    "parties",
    ["BT-29", "BT-30", "BT-31"],
    "Seller cannot be identified",
    "In order for the buyer to automatically identify a supplier, the Seller identifier (BT-29), the Seller legal registration identifier (BT-30) and/or the Seller VAT identifier (BT-31) shall be present.",
    "Add at least the seller VAT number, a company registration number or a party identifier."
  ),
  // ---------- VAT categories ----------
  R(
    "BR-S-01",
    "EN16931",
    "error",
    "vat",
    ["BT-118"],
    "Standard rated items without S breakdown",
    "An Invoice that contains a line, allowance or charge where the VAT category code is 'Standard rated' shall contain in the VAT breakdown at least one VAT category code equal to 'Standard rated'.",
    "Add a cac:TaxSubtotal with category S for each standard rate used."
  ),
  R(
    "BR-S-02",
    "EN16931",
    "error",
    "parties",
    ["BT-31", "BT-32", "BT-63"],
    "Standard rated without seller VAT number",
    "An Invoice that contains a line where the VAT category is 'Standard rated' shall contain the Seller VAT identifier (BT-31), the Seller tax registration identifier (BT-32) and/or the Seller tax representative VAT identifier (BT-63).",
    "Add the seller VAT number in cac:PartyTaxScheme with TaxScheme ID VAT."
  ),
  R(
    "BR-S-05",
    "EN16931",
    "error",
    "lines",
    ["BT-152"],
    "Standard rate must be greater than zero",
    "In an Invoice line where the VAT category code is 'Standard rated' the invoiced item VAT rate (BT-152) shall be greater than zero.",
    "Use the real standard or reduced rate, or switch to category Z, E, AE, K, G or O."
  ),
  R(
    "BR-S-08",
    "EN16931",
    "error",
    "vat",
    ["BT-116"],
    "Standard rate taxable amount mismatch",
    "For each different value of VAT category rate (BT-119) where the category is 'Standard rated', the taxable amount (BT-116) shall equal the sum of line net amounts plus charges minus allowances with that category and rate.",
    "Group lines, allowances and charges per VAT rate and use the net total of each group as TaxableAmount."
  ),
  R(
    "BR-S-10",
    "EN16931",
    "error",
    "vat",
    ["BT-120", "BT-121"],
    "Exemption reason on standard rate",
    "A VAT breakdown with VAT category code 'Standard rated' shall not have a VAT exemption reason code (BT-121) or text (BT-120).",
    "Remove TaxExemptionReason / TaxExemptionReasonCode from the S subtotal."
  ),
  R(
    "BR-Z-05",
    "EN16931",
    "error",
    "lines",
    ["BT-152"],
    "Zero rated line with non-zero rate",
    "In an Invoice line where the VAT category code is 'Zero rated' the invoiced item VAT rate (BT-152) shall be 0.",
    "Set cbc:Percent to 0 for Z lines."
  ),
  R(
    "BR-Z-10",
    "EN16931",
    "error",
    "vat",
    ["BT-120", "BT-121"],
    "Exemption reason on zero rate",
    "A VAT breakdown with category 'Zero rated' shall not have a VAT exemption reason code or text.",
    "Remove the exemption reason from the Z subtotal."
  ),
  R(
    "BR-E-05",
    "EN16931",
    "error",
    "lines",
    ["BT-152"],
    "Exempt line with non-zero rate",
    "In an Invoice line where the VAT category code is 'Exempt from VAT', the invoiced item VAT rate (BT-152) shall be 0.",
    "Set cbc:Percent to 0 for E lines."
  ),
  R(
    "BR-E-10",
    "EN16931",
    "error",
    "vat",
    ["BT-120", "BT-121"],
    "Exemption reason missing",
    "A VAT breakdown with VAT category code 'Exempt from VAT' shall have a VAT exemption reason code (BT-121) or a VAT exemption reason text (BT-120).",
    "Add cbc:TaxExemptionReasonCode (e.g. VATEX-EU-132) or a free-text reason."
  ),
  R(
    "BR-AE-02",
    "EN16931",
    "error",
    "parties",
    ["BT-31", "BT-48"],
    "Reverse charge without both VAT numbers",
    "An Invoice that contains a line where the VAT category code is 'Reverse charge' shall contain the Seller VAT identifier (or tax representative VAT identifier) and the Buyer VAT identifier (or Buyer legal registration identifier).",
    "Add the VAT numbers of both seller and buyer — reverse charge requires them."
  ),
  R(
    "BR-AE-05",
    "EN16931",
    "error",
    "lines",
    ["BT-152"],
    "Reverse charge line with non-zero rate",
    "In an Invoice line where the VAT category code is 'Reverse charge' the invoiced item VAT rate (BT-152) shall be 0.",
    "Set cbc:Percent to 0 for AE lines — the buyer self-accounts for VAT."
  ),
  R(
    "BR-AE-10",
    "EN16931",
    "error",
    "vat",
    ["BT-120", "BT-121"],
    "Reverse charge reason missing",
    "A VAT breakdown with VAT category code 'Reverse charge' shall have a VAT exemption reason code (BT-121), meaning 'Reverse charge', or the VAT exemption reason text (BT-120) 'Reverse charge'.",
    'Add cbc:TaxExemptionReasonCode VATEX-EU-AE or the text "Reverse charge".'
  ),
  R(
    "BR-IC-02",
    "EN16931",
    "error",
    "parties",
    ["BT-31", "BT-48"],
    "Intra-community supply without VAT numbers",
    "An Invoice that contains a line where the VAT category code is 'Intra-community supply' shall contain the Seller VAT identifier (or tax representative VAT identifier) and the Buyer VAT identifier.",
    "Add both VAT numbers; intra-EU supplies are only exempt when the buyer is VAT registered in another member state."
  ),
  R(
    "BR-IC-05",
    "EN16931",
    "error",
    "lines",
    ["BT-152"],
    "Intra-community line with non-zero rate",
    "In an Invoice line where the VAT category code is 'Intra-community supply' the invoiced item VAT rate (BT-152) shall be 0.",
    "Set cbc:Percent to 0 for K lines."
  ),
  R(
    "BR-IC-10",
    "EN16931",
    "error",
    "vat",
    ["BT-120", "BT-121"],
    "Intra-community exemption reason missing",
    "A VAT breakdown with VAT category code 'Intra-community supply' shall have a VAT exemption reason code (BT-121) or text (BT-120).",
    "Add cbc:TaxExemptionReasonCode VATEX-EU-IC or an equivalent reason text."
  ),
  R(
    "BR-IC-11",
    "EN16931",
    "error",
    "header",
    ["BT-72", "BG-14"],
    "Intra-community supply without delivery date",
    "In an Invoice with a VAT breakdown where the category is 'Intra-community supply' the Actual delivery date (BT-72) or the Invoicing period (BG-14) shall not be blank.",
    "Add cac:Delivery/cbc:ActualDeliveryDate or an invoice period."
  ),
  R(
    "BR-IC-12",
    "EN16931",
    "error",
    "parties",
    ["BT-80"],
    "Intra-community supply without delivery country",
    "In an Invoice with a VAT breakdown where the category is 'Intra-community supply' the Deliver to country code (BT-80) shall not be blank.",
    "Add cac:Delivery/cac:DeliveryLocation/cac:Address/cac:Country/cbc:IdentificationCode."
  ),
  R(
    "BR-G-02",
    "EN16931",
    "error",
    "parties",
    ["BT-31", "BT-63"],
    "Export without seller VAT number",
    "An Invoice that contains a line where the VAT category code is 'Export outside the EU' shall contain the Seller VAT identifier (BT-31) or the Seller tax representative VAT identifier (BT-63).",
    "Add the seller VAT number."
  ),
  R(
    "BR-G-05",
    "EN16931",
    "error",
    "lines",
    ["BT-152"],
    "Export line with non-zero rate",
    "In an Invoice line where the VAT category code is 'Export outside the EU' the invoiced item VAT rate (BT-152) shall be 0.",
    "Set cbc:Percent to 0 for G lines."
  ),
  R(
    "BR-O-02",
    "EN16931",
    "error",
    "parties",
    ["BT-31", "BT-48", "BT-63"],
    "VAT numbers on out-of-scope invoice",
    "An Invoice that contains a line where the VAT category code is 'Not subject to VAT' shall not contain the Seller VAT identifier, the Seller tax representative VAT identifier or the Buyer VAT identifier.",
    "Remove the VAT identifiers, or use another VAT category if the supply is in scope of VAT."
  ),
  R(
    "BR-O-05",
    "EN16931",
    "error",
    "lines",
    ["BT-152"],
    "Out-of-scope line with VAT rate",
    "An Invoice line where the VAT category code is 'Not subject to VAT' shall not contain an invoiced item VAT rate (BT-152).",
    "Remove cbc:Percent from O lines."
  ),
  R(
    "BR-O-10",
    "EN16931",
    "error",
    "vat",
    ["BT-120", "BT-121"],
    "Out-of-scope exemption reason missing",
    "A VAT breakdown with VAT category code 'Not subject to VAT' shall have a VAT exemption reason code (BT-121) or text (BT-120).",
    "Add cbc:TaxExemptionReasonCode VATEX-EU-O or a reason text."
  ),
  R(
    "BR-VAT-08",
    "EN16931",
    "error",
    "vat",
    ["BT-116"],
    "Taxable amount per category mismatch",
    "For each VAT category and rate, the VAT category taxable amount (BT-116) shall equal the sum of Invoice line net amounts minus document level allowances plus document level charges with that category and rate (BR-Z-08, BR-E-08, BR-AE-08, BR-IC-08, BR-G-08, BR-O-08).",
    "Recalculate TaxableAmount per category from the lines, allowances and charges that carry that category."
  ),
  R(
    "BR-VAT-01",
    "EN16931",
    "error",
    "vat",
    ["BT-118"],
    "VAT category used but missing in breakdown",
    "An Invoice that contains a line, allowance or charge with a given VAT category code shall contain a VAT breakdown group with the same category (BR-Z-01, BR-E-01, BR-AE-01, BR-IC-01, BR-G-01, BR-O-01).",
    "Add a cac:TaxSubtotal for every VAT category and rate used on lines, allowances and charges."
  ),
  // ---------- Code lists ----------
  R(
    "BR-CL-01",
    "EN16931",
    "error",
    "header",
    ["BT-3"],
    "Unknown invoice type code",
    "The document type code MUST be coded by the invoice and credit note related code lists of UNTDID 1001.",
    "Use 380 (commercial invoice), 381 (credit note), 384 (corrected invoice), 389 (self-billed) or another UNTDID 1001 code."
  ),
  R(
    "BR-CL-04",
    "EN16931",
    "error",
    "header",
    ["BT-5", "BT-6"],
    "Unknown currency code",
    "Invoice currency code (BT-5) and VAT accounting currency code (BT-6) MUST be coded using ISO 4217 alpha-3.",
    "Use an uppercase three-letter ISO 4217 code such as EUR, USD, GBP or PLN."
  ),
  R(
    "BR-CL-14",
    "EN16931",
    "error",
    "parties",
    ["BT-40", "BT-55", "BT-80"],
    "Unknown country code",
    "Country codes in an invoice MUST be coded using ISO code list 3166-1 alpha-2.",
    "Use a two-letter uppercase code: DE, FR, BE, NL… Note that the United Kingdom is GB, not UK."
  ),
  R(
    "BR-CL-16",
    "EN16931",
    "error",
    "payment",
    ["BT-81"],
    "Unknown payment means code",
    "Payment means in an invoice MUST be coded using UNCL4461 code list.",
    "Use e.g. 30 (credit transfer), 58 (SEPA credit transfer), 59 (SEPA direct debit), 48 (bank card)."
  ),
  R(
    "BR-CL-17",
    "EN16931",
    "error",
    "vat",
    ["BT-118", "BT-151"],
    "Unknown VAT category code",
    "Invoice tax categories MUST be coded using UNCL5305 code list (S, Z, E, AE, K, G, O, L, M).",
    "Replace the value with one of S, Z, E, AE, K, G, O, L or M."
  ),
  R(
    "BR-CL-25",
    "EN16931",
    "error",
    "parties",
    ["BT-34", "BT-49"],
    "Unknown electronic address scheme",
    "Endpoint identifier scheme identifier MUST belong to the CEF EAS code list.",
    "Use a valid EAS code, e.g. 0088 (GLN), 0208 (BE enterprise no.), 9930 (DE VAT), 0204 (Leitweg-ID), 0106 (NL KvK)."
  ),
  // ---------- Decimals ----------
  R(
    "BR-DEC",
    "EN16931",
    "error",
    "totals",
    void 0,
    "Too many decimals in amount",
    "Document and line amounts (BT-92, 93, 99, 100, 106–117, 131, 136, 137, 141, 142) shall have a maximum of two decimals (BR-DEC-01 … BR-DEC-28).",
    "Round amounts to two decimals. Unit prices (BT-146) may have more decimals, totals may not."
  ),
  // ---------- Peppol BIS 3 ----------
  R(
    "PEPPOL-EN16931-R001",
    "Peppol",
    "error",
    "header",
    ["BT-23"],
    "Business process missing",
    "Business process MUST be provided.",
    "Add cbc:ProfileID with urn:fdc:peppol.eu:2017:poacc:billing:01:1.0."
  ),
  R(
    "PEPPOL-EN16931-R002",
    "Peppol",
    "error",
    "header",
    ["BT-22"],
    "More than one invoice note",
    "No more than one note is allowed on document level, unless both supplier and buyer are German organisations.",
    "Merge the notes into a single cbc:Note."
  ),
  R(
    "PEPPOL-EN16931-R003",
    "Peppol",
    "error",
    "header",
    ["BT-10", "BT-13"],
    "Buyer reference or order reference missing",
    "A buyer reference or purchase order reference MUST be provided.",
    "Add cbc:BuyerReference (the reference your customer gave you, e.g. a cost centre or Leitweg-ID) or cac:OrderReference/cbc:ID."
  ),
  R(
    "PEPPOL-EN16931-R004",
    "Peppol",
    "error",
    "header",
    ["BT-24"],
    "Wrong Peppol specification identifier",
    "Specification identifier MUST have the value 'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0'.",
    "Set cbc:CustomizationID to the exact Peppol BIS Billing 3.0 identifier."
  ),
  R(
    "PEPPOL-EN16931-R005",
    "Peppol",
    "error",
    "header",
    ["BT-6"],
    "Accounting currency equals invoice currency",
    "VAT accounting currency code MUST be different from invoice currency code when provided.",
    "Remove cbc:TaxCurrencyCode when it equals the document currency."
  ),
  R(
    "PEPPOL-EN16931-R007",
    "Peppol",
    "error",
    "header",
    ["BT-23"],
    "Invalid business process format",
    "Business process MUST be in the format 'urn:fdc:peppol.eu:2017:poacc:billing:NN:1.0' where NN indicates the process number.",
    "Use urn:fdc:peppol.eu:2017:poacc:billing:01:1.0 for the standard billing process."
  ),
  R(
    "PEPPOL-EN16931-R008",
    "Peppol",
    "error",
    "document",
    void 0,
    "Empty element",
    "Document MUST not contain empty elements.",
    "Remove elements that have no value instead of sending them empty."
  ),
  R(
    "PEPPOL-EN16931-R010",
    "Peppol",
    "error",
    "parties",
    ["BT-49"],
    "Buyer electronic address missing",
    "Buyer electronic address MUST be provided.",
    "Add cbc:EndpointID with schemeID to the customer party — it is the buyer's Peppol participant ID."
  ),
  R(
    "PEPPOL-EN16931-R020",
    "Peppol",
    "error",
    "parties",
    ["BT-34"],
    "Seller electronic address missing",
    "Seller electronic address MUST be provided.",
    "Add cbc:EndpointID with schemeID to the supplier party."
  ),
  R(
    "PEPPOL-EN16931-R040",
    "Peppol",
    "error",
    "totals",
    ["BT-92", "BT-93", "BT-94"],
    "Allowance/charge amount does not match percentage",
    "Allowance/charge amount must equal base amount × percentage / 100 if base amount and percentage exists.",
    "Recalculate cbc:Amount = BaseAmount × MultiplierFactorNumeric / 100, rounded to 2 decimals."
  ),
  R(
    "PEPPOL-EN16931-R041",
    "Peppol",
    "error",
    "totals",
    ["BT-93"],
    "Base amount missing for percentage",
    "Allowance/charge base amount MUST be provided when allowance/charge percentage is provided.",
    "Add cbc:BaseAmount whenever cbc:MultiplierFactorNumeric is used."
  ),
  R(
    "PEPPOL-EN16931-R042",
    "Peppol",
    "error",
    "totals",
    ["BT-94"],
    "Percentage missing for base amount",
    "Allowance/charge percentage MUST be provided when allowance/charge base amount is provided.",
    "Add cbc:MultiplierFactorNumeric whenever cbc:BaseAmount is used."
  ),
  R(
    "PEPPOL-EN16931-R043",
    "Peppol",
    "error",
    "totals",
    void 0,
    "Invalid charge indicator",
    "Allowance/charge ChargeIndicator value MUST equal 'true' or 'false'.",
    "Use lowercase true or false."
  ),
  R(
    "PEPPOL-EN16931-R044",
    "Peppol",
    "error",
    "lines",
    void 0,
    "Charge on price level",
    "Charge on price level is NOT allowed. Only value 'false' allowed.",
    "Move price-level charges to a line-level cac:AllowanceCharge."
  ),
  R(
    "PEPPOL-EN16931-R046",
    "Peppol",
    "error",
    "lines",
    ["BT-146", "BT-147", "BT-148"],
    "Net price ≠ gross price − discount",
    "Item net price MUST equal (Gross price − Allowance amount) when gross price is provided.",
    "Set PriceAmount = BaseAmount − Amount of the price allowance."
  ),
  R(
    "PEPPOL-EN16931-R051",
    "Peppol",
    "error",
    "totals",
    void 0,
    "Amount in a different currency",
    "All currencyID attributes MUST have the same value as the invoice currency code (BT-5), except for the invoice total VAT amount in accounting currency (BT-111).",
    "Set currencyID on every amount to the document currency."
  ),
  R(
    "PEPPOL-EN16931-R053",
    "Peppol",
    "error",
    "vat",
    void 0,
    "Multiple tax totals with subtotals",
    "Only one tax total with tax subtotals MUST be provided.",
    "Merge the VAT breakdowns into one cac:TaxTotal."
  ),
  R(
    "PEPPOL-EN16931-R055",
    "Peppol",
    "error",
    "vat",
    ["BT-110", "BT-111"],
    "VAT totals with different signs",
    "Invoice total VAT amount and Invoice total VAT amount in accounting currency MUST have the same operational sign.",
    "Make both tax totals either positive or negative."
  ),
  R(
    "PEPPOL-EN16931-R061",
    "Peppol",
    "error",
    "payment",
    ["BT-89"],
    "Mandate reference missing",
    "Mandate reference MUST be provided for direct debit.",
    "Add cac:PaymentMandate/cbc:ID when PaymentMeansCode is 49 or 59."
  ),
  R(
    "PEPPOL-EN16931-R110",
    "Peppol",
    "error",
    "lines",
    ["BT-134"],
    "Line period starts before invoice period",
    "Start date of line period MUST be within invoice period.",
    "Align the line period with the invoice period."
  ),
  R(
    "PEPPOL-EN16931-R111",
    "Peppol",
    "error",
    "lines",
    ["BT-135"],
    "Line period ends after invoice period",
    "End date of line period MUST be within invoice period.",
    "Align the line period with the invoice period."
  ),
  R(
    "PEPPOL-EN16931-R120",
    "Peppol",
    "error",
    "lines",
    ["BT-131", "BT-129", "BT-146"],
    "Line net amount calculation error",
    "Invoice line net amount MUST equal (Invoiced quantity × (Item net price / item price base quantity) + Sum of invoice line charge amount − sum of invoice line allowance amount.",
    "Recalculate cbc:LineExtensionAmount = quantity × price / base quantity + charges − allowances, rounded to 2 decimals."
  ),
  R(
    "PEPPOL-EN16931-R121",
    "Peppol",
    "error",
    "lines",
    ["BT-149"],
    "Base quantity not positive",
    "Base quantity MUST be a positive number above zero.",
    "Use cbc:BaseQuantity of 1 or more, or omit it."
  ),
  R(
    "PEPPOL-EN16931-R130",
    "Peppol",
    "error",
    "lines",
    ["BT-150", "BT-130"],
    "Base quantity unit differs",
    "Unit code of price base quantity MUST be same as invoiced quantity.",
    "Use the same unitCode on cbc:BaseQuantity and cbc:InvoicedQuantity."
  ),
  R(
    "PEPPOL-EN16931-P0100",
    "Peppol",
    "error",
    "header",
    ["BT-3"],
    "Invoice type code not allowed in Peppol",
    "Invoice type code MUST be set according to the Peppol BIS 3 subset (e.g. 380, 383, 386, 393, 82, 80, 84, 395, 575, 623, 780 …).",
    "Use 380 for a normal invoice. Use a CreditNote document for credit notes."
  ),
  R(
    "PEPPOL-EN16931-P0101",
    "Peppol",
    "error",
    "header",
    ["BT-3"],
    "Credit note type code not allowed in Peppol",
    "Credit note type code MUST be set according to the Peppol BIS 3 subset (81, 83, 261, 262, 296, 308, 381, 396, 420, 458, 532).",
    "Use 381 for a normal credit note."
  ),
  R(
    "PEPPOL-COMMON-R040",
    "Peppol",
    "error",
    "parties",
    ["BT-34", "BT-49", "BT-29"],
    "Invalid GLN",
    "GLN must have a valid format according to GS1 rules (13 digits with a valid check digit).",
    "Check the Global Location Number with your GS1 member organisation."
  ),
  R(
    "PEPPOL-COMMON-R043",
    "Peppol",
    "error",
    "parties",
    ["BT-29", "BT-30", "BT-34", "BT-46", "BT-47", "BT-49"],
    "Invalid Belgian enterprise number (0208)",
    "Belgian enterprise number MUST be stated in the correct format: every EndpointID, party identifier or CompanyID with schemeID 0208 must be exactly 10 digits and pass the mod-97 check.",
    'Write the 10-digit KBO/BCE number without BE, dots or spaces, e.g. <cbc:EndpointID schemeID="0208">0403170701</cbc:EndpointID>. The VAT number BE0403170701 belongs under scheme 9925 or in PartyTaxScheme.'
  ),
  // ---------- InvoiceVerify extended checks ----------
  R(
    "IV-VAT-01",
    "InvoiceVerify",
    "error",
    "parties",
    ["BT-31", "BT-48", "BT-63"],
    "VAT number has invalid format",
    "The VAT identifier does not match the national format of its country prefix, so tax authorities and VIES will reject it.",
    "Correct the number using the national pattern shown, and remove spaces, dots and dashes."
  ),
  R(
    "IV-VAT-02",
    "InvoiceVerify",
    "warning",
    "parties",
    ["BT-31", "BT-48", "BT-63"],
    "VAT number check digit mismatch",
    "The VAT identifier has the right shape but its check digit does not match the national algorithm — it is most likely a typo.",
    "Verify the number in VIES or with your customer and correct the digits."
  ),
  R(
    "IV-VAT-03",
    "InvoiceVerify",
    "warning",
    "parties",
    ["BT-31", "BT-40"],
    "VAT prefix differs from address country",
    "The seller VAT prefix differs from the seller country. This is legitimate for foreign VAT registrations but is a frequent copy-paste error.",
    "Confirm that the VAT number belongs to the country of the invoicing entity."
  ),
  R(
    "IV-DATE-01",
    "InvoiceVerify",
    "warning",
    "payment",
    ["BT-9", "BT-2"],
    "Due date before issue date",
    "The payment due date is earlier than the invoice issue date.",
    "Check the due date — buyers' AP systems often reject invoices that are overdue on arrival."
  ),
  R(
    "IV-IBAN-01",
    "InvoiceVerify",
    "warning",
    "payment",
    ["BT-84"],
    "IBAN check digits invalid",
    "The payment account looks like an IBAN but its ISO 13616 check digits are invalid.",
    "Re-copy the IBAN from your bank statement."
  ),
  R(
    "IV-UNIT-01",
    "InvoiceVerify",
    "info",
    "lines",
    ["BT-130"],
    "Uncommon unit code",
    "The unit of measure code is not in our list of common UN/ECE Recommendation 20/21 codes. It may still be valid.",
    "Prefer common codes such as C62 (piece), HUR (hour), DAY, MON, KGM, MTR or LTR."
  ),
  R(
    "IV-BE-01",
    "InvoiceVerify",
    "warning",
    "parties",
    ["BT-34", "BT-49"],
    "Belgian enterprise number check failed",
    "The Belgian enterprise number (scheme 0208) does not pass its mod-97 check.",
    "Check the 10-digit KBO/BCE number of the party."
  ),
  // ---------- XRechnung 3.0 (German CIUS, KoSIT) ----------
  R(
    "BR-DE-1",
    "XRechnung",
    "error",
    "payment",
    ["BG-16"],
    "Payment instructions missing",
    "An XRechnung must contain payment instructions (BG-16), i.e. at least a payment means code.",
    "Add a payment means (e.g. 58 SEPA credit transfer with the IBAN, or 59 SEPA direct debit with the mandate reference)."
  ),
  R(
    "BR-DE-2",
    "XRechnung",
    "error",
    "parties",
    ["BG-6"],
    "Seller contact missing",
    "An XRechnung must contain the seller contact group (BG-6).",
    "Add a seller contact with name, telephone number and email address."
  ),
  R(
    "BR-DE-3",
    "XRechnung",
    "error",
    "parties",
    ["BT-37"],
    "Seller city missing",
    "The seller postal address must contain the city (BT-37).",
    "Fill in the seller's city in the postal address."
  ),
  R(
    "BR-DE-4",
    "XRechnung",
    "error",
    "parties",
    ["BT-38"],
    "Seller post code missing",
    "The seller postal address must contain the post code (BT-38).",
    "Fill in the seller's post code in the postal address."
  ),
  R(
    "BR-DE-5",
    "XRechnung",
    "error",
    "parties",
    ["BT-41"],
    "Seller contact name missing",
    "The seller contact must contain a contact point (BT-41), e.g. a person or department name.",
    "Add a contact name such as the person or the accounts receivable department."
  ),
  R(
    "BR-DE-6",
    "XRechnung",
    "error",
    "parties",
    ["BT-42"],
    "Seller contact telephone missing",
    "The seller contact must contain a telephone number (BT-42).",
    "Add the seller contact's telephone number."
  ),
  R(
    "BR-DE-7",
    "XRechnung",
    "error",
    "parties",
    ["BT-43"],
    "Seller contact email missing",
    "The seller contact must contain an email address (BT-43).",
    "Add the seller contact's email address."
  ),
  R(
    "BR-DE-8",
    "XRechnung",
    "error",
    "parties",
    ["BT-52"],
    "Buyer city missing",
    "The buyer postal address must contain the city (BT-52).",
    "Fill in the buyer's city in the postal address."
  ),
  R(
    "BR-DE-9",
    "XRechnung",
    "error",
    "parties",
    ["BT-53"],
    "Buyer post code missing",
    "The buyer postal address must contain the post code (BT-53).",
    "Fill in the buyer's post code in the postal address."
  ),
  R(
    "BR-DE-15",
    "XRechnung",
    "error",
    "header",
    ["BT-10"],
    "Buyer reference (Leitweg-ID) missing",
    "An XRechnung must contain the buyer reference (BT-10). For German public buyers this is the Leitweg-ID.",
    "Ask the buyer for their Leitweg-ID (public sector) or order/reference number and enter it as the buyer reference."
  ),
  R(
    "BR-DE-16",
    "XRechnung",
    "error",
    "parties",
    ["BT-31", "BT-32", "BT-63"],
    "Seller VAT or tax number missing",
    "When VAT categories S, Z, E, AE, K, G, L or M are used, the seller VAT identifier (BT-31), the seller tax registration number (BT-32) or the tax representative VAT identifier (BT-63) must be given.",
    "Add the seller's USt-IdNr. (VAT number) or Steuernummer."
  ),
  R(
    "BR-DE-17",
    "XRechnung",
    "warning",
    "header",
    ["BT-3"],
    "Invoice type code not used in XRechnung",
    "XRechnung expects one of the type codes 326 (partial invoice), 380 (commercial invoice), 384 (corrected invoice), 389 (self-billed invoice), 381 (credit note), 875, 876 or 877 (construction invoices).",
    "Use 380 for a normal invoice or 381 for a credit note."
  ),
  R(
    "BR-DE-21",
    "XRechnung",
    "warning",
    "document",
    ["BT-24"],
    "Specification identifier is not XRechnung",
    "The specification identifier (BT-24) should match the XRechnung standard identifier, e.g. urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0.",
    "Set the CustomizationID / guideline ID to the XRechnung 3.0 identifier when you send an XRechnung."
  )
];
var RULE_INDEX = Object.fromEntries(RULES.map((r) => [r.id, r]));
function ruleSlug(id) {
  return id.toLowerCase();
}

// src/engine/codes.ts
var ISO_4217 = new Set(
  "AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY COP COU CRC CUC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VED VES VND VUV WST XAF XAG XAU XBA XBB XBC XBD XCD XCG XDR XOF XPD XPF XPT XSU XTS XUA XXX YER ZAR ZMW ZWG ZWL".split(" ")
);
var ISO_3166 = {
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
  ZW: "Zimbabwe"
};
var VAT_CATEGORIES = {
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
    short: "IPSI"
  }
};
var INVOICE_TYPE_CODES = {
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
  "935": "Customs invoice"
};
var PEPPOL_INVOICE_TYPE_CODES = /* @__PURE__ */ new Set([
  "71",
  "80",
  "82",
  "84",
  "102",
  "218",
  "219",
  "331",
  "380",
  "382",
  "383",
  "386",
  "388",
  "393",
  "395",
  "553",
  "575",
  "623",
  "780",
  "817",
  "870",
  "875",
  "876",
  "877"
]);
var PEPPOL_CREDIT_NOTE_TYPE_CODES = /* @__PURE__ */ new Set([
  "81",
  "83",
  "261",
  "262",
  "296",
  "308",
  "381",
  "396",
  "420",
  "458",
  "532"
]);
var PAYMENT_MEANS = {
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
  ZZZ: "Mutually defined"
};
var CREDIT_TRANSFER_CODES = /* @__PURE__ */ new Set(["30", "58"]);
var DIRECT_DEBIT_CODES = /* @__PURE__ */ new Set(["49", "59"]);
var EAS_CODES = {
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
  "0240": "Register of legal persons (Wallonia)",
  "0242": "OpenPeppol Service Provider ID",
  "0244": "BE ESAD",
  "9901": "DK Ministry of Taxation",
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
  AN: "O.F.T.P. (ODETTE)",
  AQ: "X.400 address",
  AS: "AS2 exchange",
  AU: "File Transfer Protocol",
  EM: "Email"
};
var UNIT_CODES = {
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
  DMQ: "Cubic decimetre"
};
var PEPPOL_CUSTOMIZATION_ID = "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0";
var XRECHNUNG_CUSTOMIZATION_PREFIX = "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0";
var EN16931_ID = "urn:cen.eu:en16931:2017";
var FACTURX_PROFILES = {
  "urn:factur-x.eu:1p0:minimum": { label: "Factur-X MINIMUM", en16931: false },
  "urn:factur-x.eu:1p0:basicwl": { label: "Factur-X BASIC WL", en16931: false },
  "urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic": {
    label: "Factur-X BASIC",
    en16931: true
  },
  "urn:cen.eu:en16931:2017": { label: "Factur-X / ZUGFeRD EN 16931 (Comfort)", en16931: true },
  "urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended": {
    label: "Factur-X EXTENDED",
    en16931: true
  },
  "urn:cen.eu:en16931:2017#conformant#urn:zugferd.de:2p0:extended": {
    label: "ZUGFeRD EXTENDED",
    en16931: true
  },
  "urn:cen.eu:en16931:2017#compliant#urn:zugferd.de:2p0:basic": {
    label: "ZUGFeRD BASIC",
    en16931: true
  },
  "urn:zugferd.de:2p0:minimum": { label: "ZUGFeRD MINIMUM", en16931: false },
  "urn:zugferd.de:2p0:basicwl": { label: "ZUGFeRD BASIC WL", en16931: false }
};

// src/engine/model.ts
function emptyParty() {
  return { identifiers: [], locs: {} };
}
function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function sameAmount(a, b) {
  if (a === void 0 || b === void 0) return false;
  return Math.abs(round2(a) - round2(b)) < 1e-4;
}
function sum(values) {
  return round2(values.reduce((acc, v) => acc + (v ?? 0), 0));
}

// src/engine/xml.ts
var import_saxes = __toESM(require_saxes());
var XmlSyntaxError = class extends Error {
  line;
  col;
  constructor(message, line, col) {
    super(message);
    this.name = "XmlSyntaxError";
    this.line = line;
    this.col = col;
  }
};
var MAX_XML_BYTES = 5 * 1024 * 1024;
function parseXml(input) {
  const source = input.charCodeAt(0) === 65279 ? input.slice(1) : input;
  if (!source.trim()) throw new XmlSyntaxError("The document is empty.", 1, 1);
  if (source.length > MAX_XML_BYTES) {
    throw new XmlSyntaxError("The document is larger than 5 MB.", 1, 1);
  }
  const parser = new import_saxes.SaxesParser({ xmlns: true, position: true });
  const stack = [];
  const starts = [];
  let root = null;
  parser.on("error", (err) => {
    const clean = err.message.replace(/^[^:]*?:?(\d+):(\d+):\s*/, "");
    throw new XmlSyntaxError(capitalize(clean), parser.line, parser.column);
  });
  parser.on("opentagstart", () => {
    starts.push({ line: parser.line, col: Math.max(1, parser.column) });
  });
  parser.on("opentag", (tag) => {
    const pos = starts.pop() ?? { line: parser.line, col: parser.column };
    const attrs = {};
    for (const [key, attr] of Object.entries(tag.attributes)) {
      const a = attr;
      attrs[key] = a.value;
      if (a.local && !(a.local in attrs)) attrs[a.local] = a.value;
    }
    const t = tag;
    const node = {
      name: t.name,
      local: t.local ?? t.name.split(":").pop() ?? t.name,
      prefix: t.prefix ?? "",
      ns: t.uri ?? "",
      attrs,
      children: [],
      text: "",
      line: pos.line,
      col: pos.col,
      parent: stack[stack.length - 1] ?? null
    };
    if (node.parent) node.parent.children.push(node);
    else root = node;
    stack.push(node);
  });
  parser.on("text", (text2) => {
    const current = stack[stack.length - 1];
    if (current) current.text += text2;
  });
  parser.on("cdata", (text2) => {
    const current = stack[stack.length - 1];
    if (current) current.text += text2;
  });
  parser.on("closetag", () => {
    const node = stack.pop();
    if (node) node.text = node.text.trim();
  });
  try {
    parser.write(source).close();
  } catch (e) {
    if (e instanceof XmlSyntaxError) throw e;
    throw new XmlSyntaxError(
      e instanceof Error ? e.message : "Unreadable XML",
      parser.line,
      parser.column
    );
  }
  if (!root) throw new XmlSyntaxError("No root element found.", 1, 1);
  return root;
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function kids(node, local) {
  if (!node) return [];
  return node.children.filter((c) => c.local === local);
}
function kid(node, local) {
  if (!node) return null;
  for (const c of node.children) if (c.local === local) return c;
  return null;
}
function at(node, path) {
  let cur = node;
  for (const part of path.split("/")) {
    if (!cur) return null;
    cur = kid(cur, part);
  }
  return cur ?? null;
}
function all(node, path) {
  const parts = path.split("/");
  const last = parts.pop();
  const parent = parts.length ? at(node, parts.join("/")) : node;
  return kids(parent, last);
}
function text(node, path) {
  const n = path ? at(node, path) : node;
  if (!n) return void 0;
  const t = n.text.trim();
  return t === "" ? void 0 : t;
}
function xpathOf(node) {
  const parts = [];
  let cur = node;
  while (cur) {
    const parent = cur.parent;
    if (parent) {
      const same = parent.children.filter((c) => c.name === cur.name);
      parts.unshift(same.length > 1 ? `${cur.name}[${same.indexOf(cur) + 1}]` : cur.name);
    } else {
      parts.unshift(cur.name);
    }
    cur = parent;
  }
  return "/" + parts.join("/");
}

// src/engine/read-utils.ts
var DECIMAL_BTS = /* @__PURE__ */ new Set([
  "BT-92",
  "BT-93",
  "BT-99",
  "BT-100",
  "BT-106",
  "BT-107",
  "BT-108",
  "BT-109",
  "BT-110",
  "BT-111",
  "BT-112",
  "BT-113",
  "BT-114",
  "BT-115",
  "BT-116",
  "BT-117",
  "BT-131",
  "BT-136",
  "BT-137",
  "BT-141",
  "BT-142"
]);
var ReadCtx = class {
  amountCurrencies = [];
  decimals = [];
  typeErrors = [];
  loc(node) {
    return { line: node.line, col: node.col, xpath: xpathOf(node) };
  }
  /** Read a string and remember its location under `key` */
  str(node, path, locs, key) {
    const n = path ? at(node, path) : node;
    if (!n) return void 0;
    const v = text(n);
    locs[key] = this.loc(n);
    return v;
  }
  attr(node, path, name) {
    const n = path ? at(node, path) : node;
    const v = n?.attrs[name]?.trim();
    return v ? v : void 0;
  }
  num(node, path, locs, key, bt, opts = {}) {
    const n = path ? at(node, path) : node;
    if (!n) return void 0;
    const loc = this.loc(n);
    locs[key] = loc;
    const raw = text(n);
    if (raw === void 0) return void 0;
    if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(raw)) {
      this.typeErrors.push({ bt, raw, expected: "a decimal number such as 1234.50", loc });
      return void 0;
    }
    if (opts.amount) {
      if (DECIMAL_BTS.has(bt)) this.decimals.push({ bt, raw, loc });
      const cur = n.attrs["currencyID"];
      this.amountCurrencies.push({ bt, currency: cur, loc });
    }
    return Number(raw);
  }
  /** ISO dates (UBL) */
  isoDate(node, path, locs, key, bt) {
    const n = path ? at(node, path) : node;
    if (!n) return void 0;
    const loc = this.loc(n);
    locs[key] = loc;
    const raw = text(n);
    if (raw === void 0) return void 0;
    const m = /^(\d{4})-(\d{2})-(\d{2})(Z|[+-]\d{2}:\d{2})?$/.exec(raw);
    if (!m || !validYmd(m[1], m[2], m[3])) {
      this.typeErrors.push({ bt, raw, expected: "a date in YYYY-MM-DD format", loc });
      return void 0;
    }
    return `${m[1]}-${m[2]}-${m[3]}`;
  }
  /** CII udt:DateTimeString with format 102 (YYYYMMDD) */
  ciiDate(node, path, locs, key, bt) {
    const holder = path ? at(node, path) : node;
    if (!holder) return void 0;
    const n = holder.children.find((c) => c.local === "DateTimeString" || c.local === "DateString") ?? holder;
    const loc = this.loc(n);
    locs[key] = loc;
    const raw = text(n);
    if (raw === void 0) return void 0;
    const format = n.attrs["format"];
    const m = /^(\d{4})(\d{2})(\d{2})$/.exec(raw);
    if (format && format !== "102" || !m || !validYmd(m[1], m[2], m[3])) {
      this.typeErrors.push({ bt, raw, expected: "a date in format 102 (YYYYMMDD)", loc });
      return void 0;
    }
    return `${m[1]}-${m[2]}-${m[3]}`;
  }
};
function validYmd(y, m, d) {
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return date.getUTCFullYear() === Number(y) && date.getUTCMonth() === Number(m) - 1 && date.getUTCDate() === Number(d);
}
function collectEmptyElements(root, ctx) {
  const out = [];
  const visit = (n) => {
    if (n.children.length === 0 && n.text.trim() === "") out.push(ctx.loc(n));
    for (const c of n.children) visit(c);
  };
  visit(root);
  return out;
}

// src/engine/read-cii.ts
var CII_NS = "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100";
var CREDIT_TYPE_CODES = /* @__PURE__ */ new Set([
  "381",
  "81",
  "83",
  "261",
  "262",
  "296",
  "308",
  "396",
  "420",
  "458",
  "532"
]);
function readAddress(ctx, node, locs, prefix) {
  if (!node) return void 0;
  locs[prefix] = ctx.loc(node);
  return {
    line1: ctx.str(node, "LineOne", locs, `${prefix}.line1`),
    line2: ctx.str(node, "LineTwo", locs, `${prefix}.line2`),
    line3: ctx.str(node, "LineThree", locs, `${prefix}.line3`),
    city: ctx.str(node, "CityName", locs, `${prefix}.city`),
    postalCode: ctx.str(node, "PostcodeCode", locs, `${prefix}.postalCode`),
    subdivision: ctx.str(node, "CountrySubDivisionName", locs, `${prefix}.subdivision`),
    country: ctx.str(node, "CountryID", locs, `${prefix}.country`)
  };
}
function readParty(ctx, node) {
  const p = emptyParty();
  if (!node) return p;
  const L = p.locs;
  p.loc = ctx.loc(node);
  for (const idn of kids(node, "ID")) {
    p.identifiers.push({ id: text(idn) ?? "", scheme: idn.attrs["schemeID"] });
    L["identifier"] ??= ctx.loc(idn);
  }
  for (const gid of kids(node, "GlobalID")) {
    p.identifiers.push({ id: text(gid) ?? "", scheme: gid.attrs["schemeID"] });
    L["identifier"] ??= ctx.loc(gid);
  }
  p.name = ctx.str(node, "Name", L, "name");
  const legal = at(node, "SpecifiedLegalOrganization");
  if (legal) {
    const lid = at(legal, "ID");
    if (lid) {
      p.legalId = { id: text(lid) ?? "", scheme: lid.attrs["schemeID"] };
      L["legalId"] = ctx.loc(lid);
    }
    p.tradingName = ctx.str(legal, "TradingBusinessName", L, "tradingName");
  }
  const contact = at(node, "DefinedTradeContact");
  if (contact) {
    L["contact"] = ctx.loc(contact);
    p.contact = {
      name: ctx.str(contact, "PersonName", L, "contact.name"),
      phone: ctx.str(contact, "TelephoneUniversalCommunication/CompleteNumber", L, "contact.phone"),
      email: ctx.str(contact, "EmailURIUniversalCommunication/URIID", L, "contact.email")
    };
  }
  p.address = readAddress(ctx, at(node, "PostalTradeAddress"), L, "address");
  const uri = at(node, "URIUniversalCommunication/URIID");
  if (uri) {
    p.endpoint = { id: text(uri) ?? "", scheme: uri.attrs["schemeID"] };
    L["endpoint"] = ctx.loc(uri);
  }
  for (const reg of kids(node, "SpecifiedTaxRegistration")) {
    const id = at(reg, "ID");
    if (!id) continue;
    const scheme = id.attrs["schemeID"]?.toUpperCase();
    if (scheme === "FC") {
      p.taxRegistrationId = text(id);
      L["taxRegistrationId"] = ctx.loc(id);
    } else {
      p.vatId = text(id);
      L["vatId"] = ctx.loc(id);
    }
  }
  return p;
}
function readAllowanceCharge(ctx, node, level) {
  const locs = {};
  const rawIndicator = ctx.str(node, "ChargeIndicator/Indicator", locs, "indicator");
  const isCharge = rawIndicator?.toLowerCase() === "true";
  const amountBt = level === "doc" ? isCharge ? "BT-99" : "BT-92" : isCharge ? "BT-141" : "BT-136";
  const baseBt = level === "doc" ? isCharge ? "BT-100" : "BT-93" : isCharge ? "BT-142" : "BT-137";
  return {
    isCharge,
    rawIndicator,
    amount: ctx.num(node, "ActualAmount", locs, "amount", amountBt, { amount: true }),
    baseAmount: ctx.num(node, "BasisAmount", locs, "baseAmount", baseBt, { amount: true }),
    percent: ctx.num(node, "CalculationPercent", locs, "percent", "BT-94"),
    reason: ctx.str(node, "Reason", locs, "reason"),
    reasonCode: ctx.str(node, "ReasonCode", locs, "reasonCode"),
    vatCategory: ctx.str(node, "CategoryTradeTax/CategoryCode", locs, "vatCategory"),
    vatRate: ctx.num(node, "CategoryTradeTax/RateApplicablePercent", locs, "vatRate", "BT-96"),
    locs,
    loc: ctx.loc(node)
  };
}
function readCii(root) {
  const ctx = new ReadCtx();
  const locs = {};
  const context = at(root, "ExchangedDocumentContext");
  const doc = at(root, "ExchangedDocument");
  const tx = at(root, "SupplyChainTradeTransaction");
  const agreement = at(tx, "ApplicableHeaderTradeAgreement");
  const deliveryNode = at(tx, "ApplicableHeaderTradeDelivery");
  const settlement = at(tx, "ApplicableHeaderTradeSettlement");
  const typeCode = ctx.str(doc, "TypeCode", locs, "typeCode");
  const model = {
    syntax: "CII",
    kind: typeCode && CREDIT_TYPE_CODES.has(typeCode) ? "creditnote" : "invoice",
    customizationId: ctx.str(
      context,
      "GuidelineSpecifiedDocumentContextParameter/ID",
      locs,
      "customizationId"
    ),
    profileId: ctx.str(
      context,
      "BusinessProcessSpecifiedDocumentContextParameter/ID",
      locs,
      "profileId"
    ),
    number: ctx.str(doc, "ID", locs, "number"),
    issueDate: ctx.ciiDate(doc, "IssueDateTime", locs, "issueDate", "BT-2"),
    typeCode,
    currency: ctx.str(settlement, "InvoiceCurrencyCode", locs, "currency"),
    taxCurrency: ctx.str(settlement, "TaxCurrencyCode", locs, "taxCurrency"),
    dueDate: ctx.ciiDate(
      settlement,
      "SpecifiedTradePaymentTerms/DueDateDateTime",
      locs,
      "dueDate",
      "BT-9"
    ),
    buyerReference: ctx.str(agreement, "BuyerReference", locs, "buyerReference"),
    projectRef: ctx.str(agreement, "SpecifiedProcuringProject/ID", locs, "projectRef"),
    contractRef: ctx.str(
      agreement,
      "ContractReferencedDocument/IssuerAssignedID",
      locs,
      "contractRef"
    ),
    orderRef: ctx.str(agreement, "BuyerOrderReferencedDocument/IssuerAssignedID", locs, "orderRef"),
    salesOrderRef: ctx.str(
      agreement,
      "SellerOrderReferencedDocument/IssuerAssignedID",
      locs,
      "salesOrderRef"
    ),
    receivingAdviceRef: ctx.str(
      deliveryNode,
      "ReceivingAdviceReferencedDocument/IssuerAssignedID",
      locs,
      "receivingAdviceRef"
    ),
    despatchAdviceRef: ctx.str(
      deliveryNode,
      "DespatchAdviceReferencedDocument/IssuerAssignedID",
      locs,
      "despatchAdviceRef"
    ),
    accountingCost: ctx.str(
      settlement,
      "ReceivableSpecifiedTradeAccountingAccount/ID",
      locs,
      "accountingCost"
    ),
    paymentTerms: ctx.str(
      settlement,
      "SpecifiedTradePaymentTerms/Description",
      locs,
      "paymentTerms"
    ),
    notes: all(doc, "IncludedNote").map((n) => text(n, "Content") ?? ""),
    precedingInvoices: kids(settlement, "InvoiceReferencedDocument").map((r) => ({
      id: text(r, "IssuerAssignedID"),
      date: text(r, "FormattedIssueDateTime/DateTimeString"),
      loc: ctx.loc(r)
    })),
    hasPeriod: false,
    seller: readParty(ctx, at(agreement, "SellerTradeParty")),
    buyer: readParty(ctx, at(agreement, "BuyerTradeParty")),
    paymentMeans: [],
    allowances: [],
    charges: [],
    vat: [],
    taxTotals: [],
    totals: { locs: {} },
    lines: [],
    attachments: kids(agreement, "AdditionalReferencedDocument").map((d) => ({
      id: text(d, "IssuerAssignedID"),
      description: text(d, "Name"),
      filename: at(d, "AttachmentBinaryObject")?.attrs["filename"],
      mime: at(d, "AttachmentBinaryObject")?.attrs["mimeCode"]
    })),
    amountCurrencies: [],
    decimals: [],
    typeErrors: [],
    emptyElements: [],
    locs,
    loc: ctx.loc(root)
  };
  const firstNote = at(doc, "IncludedNote");
  if (firstNote) locs["notes"] = ctx.loc(firstNote);
  const taxRep = at(agreement, "SellerTaxRepresentativeTradeParty");
  if (taxRep) model.taxRepresentative = readParty(ctx, taxRep);
  const payee = at(settlement, "PayeeTradeParty");
  if (payee) model.payee = readParty(ctx, payee);
  if (deliveryNode) {
    const dl = {};
    model.delivery = {
      date: ctx.ciiDate(
        deliveryNode,
        "ActualDeliverySupplyChainEvent/OccurrenceDateTime",
        dl,
        "date",
        "BT-72"
      ),
      partyName: ctx.str(deliveryNode, "ShipToTradeParty/Name", dl, "partyName"),
      address: readAddress(
        ctx,
        at(deliveryNode, "ShipToTradeParty/PostalTradeAddress"),
        dl,
        "address"
      ),
      locs: dl,
      loc: ctx.loc(deliveryNode)
    };
    if (!model.delivery.date && !model.delivery.partyName && !model.delivery.address) {
      model.delivery = void 0;
    }
  }
  const period = at(settlement, "BillingSpecifiedPeriod");
  if (period) {
    model.hasPeriod = true;
    locs["period"] = ctx.loc(period);
    model.periodStart = ctx.ciiDate(period, "StartDateTime", locs, "periodStart", "BT-73");
    model.periodEnd = ctx.ciiDate(period, "EndDateTime", locs, "periodEnd", "BT-74");
  }
  const paymentRef = ctx.str(settlement, "PaymentReference", locs, "paymentRef");
  const terms = at(settlement, "SpecifiedTradePaymentTerms");
  const mandate = text(terms, "DirectDebitMandateID");
  for (const pm of kids(settlement, "SpecifiedTradeSettlementPaymentMeans")) {
    const pl = {};
    const means = {
      code: ctx.str(pm, "TypeCode", pl, "code"),
      text: ctx.str(pm, "Information", pl, "text"),
      paymentId: paymentRef,
      account: ctx.str(pm, "PayeePartyCreditorFinancialAccount/IBANID", pl, "account") ?? ctx.str(pm, "PayeePartyCreditorFinancialAccount/ProprietaryID", pl, "account"),
      accountName: ctx.str(pm, "PayeePartyCreditorFinancialAccount/AccountName", pl, "accountName"),
      bic: ctx.str(pm, "PayeeSpecifiedCreditorFinancialInstitution/BICID", pl, "bic"),
      cardPan: ctx.str(pm, "ApplicableTradeSettlementFinancialCard/ID", pl, "cardPan"),
      mandateRef: mandate,
      debitedAccount: ctx.str(pm, "PayerPartyDebtorFinancialAccount/IBANID", pl, "debitedAccount"),
      locs: pl,
      loc: ctx.loc(pm)
    };
    if (!pl["account"]) {
      const acct = at(pm, "PayeePartyCreditorFinancialAccount");
      if (acct) pl["account"] = ctx.loc(acct);
    }
    model.paymentMeans.push(means);
  }
  for (const tax of kids(settlement, "ApplicableTradeTax")) {
    const sl = {};
    const vb = {
      taxAmount: ctx.num(tax, "CalculatedAmount", sl, "taxAmount", "BT-117", { amount: true }),
      taxableAmount: ctx.num(tax, "BasisAmount", sl, "taxableAmount", "BT-116", { amount: true }),
      category: ctx.str(tax, "CategoryCode", sl, "category"),
      rate: ctx.num(tax, "RateApplicablePercent", sl, "rate", "BT-119"),
      exemptionReason: ctx.str(tax, "ExemptionReason", sl, "exemptionReason"),
      exemptionCode: ctx.str(tax, "ExemptionReasonCode", sl, "exemptionCode"),
      locs: sl,
      loc: ctx.loc(tax)
    };
    if (!model.taxPointDate) {
      model.taxPointDate = ctx.ciiDate(tax, "TaxPointDate", locs, "taxPointDate", "BT-7");
    }
    if (!model.taxPointCode)
      model.taxPointCode = ctx.str(tax, "DueDateTypeCode", locs, "taxPointCode");
    model.vat.push(vb);
  }
  for (const ac of kids(settlement, "SpecifiedTradeAllowanceCharge")) {
    const item = readAllowanceCharge(ctx, ac, "doc");
    (item.isCharge ? model.charges : model.allowances).push(item);
  }
  const sum2 = at(settlement, "SpecifiedTradeSettlementHeaderMonetarySummation");
  const T = model.totals;
  if (sum2) {
    T.loc = ctx.loc(sum2);
    T.lineExtension = ctx.num(sum2, "LineTotalAmount", T.locs, "lineExtension", "BT-106", {
      amount: true
    });
    T.chargeTotal = ctx.num(sum2, "ChargeTotalAmount", T.locs, "chargeTotal", "BT-108", {
      amount: true
    });
    T.allowanceTotal = ctx.num(sum2, "AllowanceTotalAmount", T.locs, "allowanceTotal", "BT-107", {
      amount: true
    });
    T.taxExclusive = ctx.num(sum2, "TaxBasisTotalAmount", T.locs, "taxExclusive", "BT-109", {
      amount: true
    });
    const taxTotals = kids(sum2, "TaxTotalAmount");
    for (const tt of taxTotals) {
      const cur = tt.attrs["currencyID"];
      const isAccounting = Boolean(
        model.taxCurrency && cur === model.taxCurrency && model.taxCurrency !== model.currency
      );
      const v = ctx.num(
        tt,
        "",
        T.locs,
        isAccounting ? "taxAmountAccounting" : "taxAmount",
        isAccounting ? "BT-111" : "BT-110",
        { amount: true }
      );
      if (isAccounting) T.taxAmountAccounting = v;
      else T.taxAmount = v;
      model.taxTotals.push({
        amount: v,
        currency: cur,
        hasSubtotals: !isAccounting,
        loc: ctx.loc(tt)
      });
    }
    T.rounding = ctx.num(sum2, "RoundingAmount", T.locs, "rounding", "BT-114", { amount: true });
    T.taxInclusive = ctx.num(sum2, "GrandTotalAmount", T.locs, "taxInclusive", "BT-112", {
      amount: true
    });
    T.prepaid = ctx.num(sum2, "TotalPrepaidAmount", T.locs, "prepaid", "BT-113", { amount: true });
    T.payable = ctx.num(sum2, "DuePayableAmount", T.locs, "payable", "BT-115", { amount: true });
  }
  model.amountCurrencies = ctx.amountCurrencies.filter((a) => a.currency !== void 0);
  for (const li of kids(tx, "IncludedSupplyChainTradeLineItem")) {
    const L = {};
    const docLine = at(li, "AssociatedDocumentLineDocument");
    const product = at(li, "SpecifiedTradeProduct");
    const la = at(li, "SpecifiedLineTradeAgreement");
    const ld = at(li, "SpecifiedLineTradeDelivery");
    const ls = at(li, "SpecifiedLineTradeSettlement");
    const qtyNode = at(ld, "BilledQuantity");
    const line = {
      id: ctx.str(docLine, "LineID", L, "id"),
      note: ctx.str(docLine, "IncludedNote/Content", L, "note"),
      quantity: ctx.num(ld, "BilledQuantity", L, "quantity", "BT-129"),
      unitCode: qtyNode?.attrs["unitCode"],
      netAmount: ctx.num(
        ls,
        "SpecifiedTradeSettlementLineMonetarySummation/LineTotalAmount",
        L,
        "netAmount",
        "BT-131",
        { amount: true }
      ),
      orderLineRef: ctx.str(la, "BuyerOrderReferencedDocument/LineID", L, "orderLineRef"),
      allowances: [],
      charges: [],
      attributes: [],
      locs: L,
      loc: ctx.loc(li)
    };
    if (qtyNode) L["unitCode"] = ctx.loc(qtyNode);
    if (product) {
      L["item"] = ctx.loc(product);
      line.itemName = ctx.str(product, "Name", L, "itemName");
      line.description = ctx.str(product, "Description", L, "description");
      line.sellerItemId = ctx.str(product, "SellerAssignedID", L, "sellerItemId");
      const gid = at(product, "GlobalID");
      if (gid) {
        line.standardItemId = { id: text(gid) ?? "", scheme: gid.attrs["schemeID"] };
        L["standardItemId"] = ctx.loc(gid);
      }
      line.classification = all(product, "DesignatedProductClassification").map((c) => {
        const code2 = at(c, "ClassCode");
        return { id: text(code2) ?? "", scheme: code2?.attrs["listID"] };
      });
      line.originCountry = ctx.str(product, "OriginTradeCountry/ID", L, "originCountry");
      line.attributes = kids(product, "ApplicableProductCharacteristic").map((c) => ({
        name: text(c, "Description"),
        value: text(c, "Value")
      }));
    }
    const net = at(la, "NetPriceProductTradePrice");
    if (net) {
      L["price"] = ctx.loc(net);
      line.priceAmount = ctx.num(net, "ChargeAmount", L, "priceAmount", "BT-146");
      const bq = at(net, "BasisQuantity");
      if (bq) {
        line.baseQuantity = ctx.num(bq, "", L, "baseQuantity", "BT-149");
        line.baseQuantityUnit = bq.attrs["unitCode"];
      }
    }
    const gross = at(la, "GrossPriceProductTradePrice");
    if (gross) {
      line.grossPrice = ctx.num(gross, "ChargeAmount", L, "grossPrice", "BT-148");
      for (const ac of kids(gross, "AppliedTradeAllowanceCharge")) {
        if (text(ac, "ChargeIndicator/Indicator")?.toLowerCase() === "true") {
          line.hasPriceCharge = true;
          L["priceCharge"] = ctx.loc(ac);
        } else {
          line.priceDiscount = ctx.num(ac, "ActualAmount", L, "priceDiscount", "BT-147");
        }
      }
    }
    const lineTax = at(ls, "ApplicableTradeTax");
    if (lineTax) {
      line.vatCategory = ctx.str(lineTax, "CategoryCode", L, "vatCategory");
      line.vatRate = ctx.num(lineTax, "RateApplicablePercent", L, "vatRate", "BT-152");
      if (!L["vatCategory"]) L["vatCategory"] = ctx.loc(lineTax);
    }
    const lp = at(ls, "BillingSpecifiedPeriod");
    if (lp) {
      L["period"] = ctx.loc(lp);
      line.periodStart = ctx.ciiDate(lp, "StartDateTime", L, "periodStart", "BT-134");
      line.periodEnd = ctx.ciiDate(lp, "EndDateTime", L, "periodEnd", "BT-135");
    }
    for (const ac of kids(ls, "SpecifiedTradeAllowanceCharge")) {
      const item = readAllowanceCharge(ctx, ac, "line");
      (item.isCharge ? line.charges : line.allowances).push(item);
    }
    model.lines.push(line);
  }
  model.decimals = ctx.decimals;
  model.typeErrors = ctx.typeErrors;
  model.emptyElements = collectEmptyElements(root, ctx);
  return model;
}

// src/engine/read-ubl.ts
var UBL_INVOICE_NS = "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
var UBL_CREDITNOTE_NS = "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2";
function readAddress2(ctx, node, locs, prefix) {
  if (!node) return void 0;
  locs[prefix] = ctx.loc(node);
  return {
    line1: ctx.str(node, "StreetName", locs, `${prefix}.line1`),
    line2: ctx.str(node, "AdditionalStreetName", locs, `${prefix}.line2`),
    line3: ctx.str(node, "AddressLine/Line", locs, `${prefix}.line3`),
    city: ctx.str(node, "CityName", locs, `${prefix}.city`),
    postalCode: ctx.str(node, "PostalZone", locs, `${prefix}.postalCode`),
    subdivision: ctx.str(node, "CountrySubentity", locs, `${prefix}.subdivision`),
    country: ctx.str(node, "Country/IdentificationCode", locs, `${prefix}.country`)
  };
}
function readParty2(ctx, partyNode) {
  const p = emptyParty();
  if (!partyNode) return p;
  p.loc = ctx.loc(partyNode);
  const L = p.locs;
  const endpoint = at(partyNode, "EndpointID");
  if (endpoint) {
    p.endpoint = { id: text(endpoint) ?? "", scheme: endpoint.attrs["schemeID"] };
    L["endpoint"] = ctx.loc(endpoint);
  }
  for (const idn of all(partyNode, "PartyIdentification/ID")) {
    p.identifiers.push({ id: text(idn) ?? "", scheme: idn.attrs["schemeID"] });
    L["identifier"] ??= ctx.loc(idn);
  }
  p.tradingName = ctx.str(partyNode, "PartyName/Name", L, "tradingName");
  p.address = readAddress2(ctx, at(partyNode, "PostalAddress"), L, "address");
  for (const pts of kids(partyNode, "PartyTaxScheme")) {
    const scheme = text(pts, "TaxScheme/ID");
    const company = at(pts, "CompanyID");
    if (!company) continue;
    if (scheme?.toUpperCase() === "VAT") {
      p.vatId = text(company);
      L["vatId"] = ctx.loc(company);
    } else {
      p.taxRegistrationId = text(company);
      L["taxRegistrationId"] = ctx.loc(company);
    }
  }
  const legal = at(partyNode, "PartyLegalEntity");
  if (legal) {
    p.name = ctx.str(legal, "RegistrationName", L, "name");
    const cid = at(legal, "CompanyID");
    if (cid) {
      p.legalId = { id: text(cid) ?? "", scheme: cid.attrs["schemeID"] };
      L["legalId"] = ctx.loc(cid);
    }
  }
  const contact = at(partyNode, "Contact");
  if (contact) {
    L["contact"] = ctx.loc(contact);
    p.contact = {
      name: ctx.str(contact, "Name", L, "contact.name"),
      phone: ctx.str(contact, "Telephone", L, "contact.phone"),
      email: ctx.str(contact, "ElectronicMail", L, "contact.email")
    };
  }
  return p;
}
function readAllowanceCharge2(ctx, node, level) {
  const locs = {};
  const rawIndicator = ctx.str(node, "ChargeIndicator", locs, "indicator");
  const isCharge = rawIndicator?.toLowerCase() === "true";
  const amountBt = level === "doc" ? isCharge ? "BT-99" : "BT-92" : isCharge ? "BT-141" : "BT-136";
  const baseBt = level === "doc" ? isCharge ? "BT-100" : "BT-93" : isCharge ? "BT-142" : "BT-137";
  return {
    isCharge,
    rawIndicator,
    amount: ctx.num(node, "Amount", locs, "amount", amountBt, { amount: true }),
    baseAmount: ctx.num(node, "BaseAmount", locs, "baseAmount", baseBt, { amount: true }),
    percent: ctx.num(node, "MultiplierFactorNumeric", locs, "percent", "BT-94"),
    reason: ctx.str(node, "AllowanceChargeReason", locs, "reason"),
    reasonCode: ctx.str(node, "AllowanceChargeReasonCode", locs, "reasonCode"),
    vatCategory: ctx.str(node, "TaxCategory/ID", locs, "vatCategory"),
    vatRate: ctx.num(node, "TaxCategory/Percent", locs, "vatRate", "BT-96"),
    locs,
    loc: ctx.loc(node)
  };
}
function readUbl(root) {
  const ctx = new ReadCtx();
  const isCredit = root.local === "CreditNote";
  const locs = {};
  const linesTag = isCredit ? "CreditNoteLine" : "InvoiceLine";
  const qtyTag = isCredit ? "CreditedQuantity" : "InvoicedQuantity";
  const model = {
    syntax: "UBL",
    kind: isCredit ? "creditnote" : "invoice",
    customizationId: ctx.str(root, "CustomizationID", locs, "customizationId"),
    profileId: ctx.str(root, "ProfileID", locs, "profileId"),
    number: ctx.str(root, "ID", locs, "number"),
    issueDate: ctx.isoDate(root, "IssueDate", locs, "issueDate", "BT-2"),
    typeCode: ctx.str(root, isCredit ? "CreditNoteTypeCode" : "InvoiceTypeCode", locs, "typeCode"),
    currency: ctx.str(root, "DocumentCurrencyCode", locs, "currency"),
    taxCurrency: ctx.str(root, "TaxCurrencyCode", locs, "taxCurrency"),
    taxPointDate: ctx.isoDate(root, "TaxPointDate", locs, "taxPointDate", "BT-7"),
    dueDate: isCredit ? ctx.isoDate(at(root, "PaymentMeans"), "PaymentDueDate", locs, "dueDate", "BT-9") : ctx.isoDate(root, "DueDate", locs, "dueDate", "BT-9"),
    buyerReference: ctx.str(root, "BuyerReference", locs, "buyerReference"),
    projectRef: ctx.str(root, "ProjectReference/ID", locs, "projectRef"),
    contractRef: ctx.str(root, "ContractDocumentReference/ID", locs, "contractRef"),
    orderRef: ctx.str(root, "OrderReference/ID", locs, "orderRef"),
    salesOrderRef: ctx.str(root, "OrderReference/SalesOrderID", locs, "salesOrderRef"),
    receivingAdviceRef: ctx.str(root, "ReceiptDocumentReference/ID", locs, "receivingAdviceRef"),
    despatchAdviceRef: ctx.str(root, "DespatchDocumentReference/ID", locs, "despatchAdviceRef"),
    accountingCost: ctx.str(root, "AccountingCost", locs, "accountingCost"),
    paymentTerms: ctx.str(root, "PaymentTerms/Note", locs, "paymentTerms"),
    notes: kids(root, "Note").map((n) => text(n) ?? ""),
    precedingInvoices: all(root, "BillingReference").map((br) => {
      const ref = at(br, "InvoiceDocumentReference") ?? at(br, "CreditNoteDocumentReference");
      return { id: text(ref, "ID"), date: text(ref, "IssueDate"), loc: ctx.loc(br) };
    }),
    hasPeriod: false,
    seller: readParty2(ctx, at(root, "AccountingSupplierParty/Party")),
    buyer: readParty2(ctx, at(root, "AccountingCustomerParty/Party")),
    paymentMeans: [],
    allowances: [],
    charges: [],
    vat: [],
    taxTotals: [],
    totals: { locs: {} },
    lines: [],
    attachments: kids(root, "AdditionalDocumentReference").map((d) => ({
      id: text(d, "ID"),
      description: text(d, "DocumentDescription"),
      filename: at(d, "Attachment/EmbeddedDocumentBinaryObject")?.attrs["filename"],
      mime: at(d, "Attachment/EmbeddedDocumentBinaryObject")?.attrs["mimeCode"]
    })),
    amountCurrencies: [],
    decimals: [],
    typeErrors: [],
    emptyElements: [],
    locs,
    loc: ctx.loc(root)
  };
  const noteNode = at(root, "Note");
  if (noteNode) locs["notes"] = ctx.loc(noteNode);
  const period = at(root, "InvoicePeriod");
  if (period) {
    model.hasPeriod = true;
    locs["period"] = ctx.loc(period);
    model.periodStart = ctx.isoDate(period, "StartDate", locs, "periodStart", "BT-73");
    model.periodEnd = ctx.isoDate(period, "EndDate", locs, "periodEnd", "BT-74");
    model.taxPointCode = ctx.str(period, "DescriptionCode", locs, "taxPointCode");
  }
  const payee = at(root, "PayeeParty");
  if (payee) {
    const p = readParty2(ctx, payee);
    p.name = p.tradingName;
    p.locs["name"] = p.locs["tradingName"] ?? p.loc;
    model.payee = p;
  }
  const taxRep = at(root, "TaxRepresentativeParty");
  if (taxRep) {
    const p = readParty2(ctx, taxRep);
    p.name = p.tradingName;
    p.locs["name"] = p.locs["tradingName"] ?? p.loc;
    model.taxRepresentative = p;
  }
  const delivery = at(root, "Delivery");
  if (delivery) {
    const dl = {};
    model.delivery = {
      date: ctx.isoDate(delivery, "ActualDeliveryDate", dl, "date", "BT-72"),
      partyName: ctx.str(delivery, "DeliveryParty/PartyName/Name", dl, "partyName"),
      address: readAddress2(ctx, at(delivery, "DeliveryLocation/Address"), dl, "address"),
      locs: dl,
      loc: ctx.loc(delivery)
    };
  }
  for (const pm of kids(root, "PaymentMeans")) {
    const pl = {};
    const codeNode = at(pm, "PaymentMeansCode");
    const means = {
      code: ctx.str(pm, "PaymentMeansCode", pl, "code"),
      text: codeNode?.attrs["name"],
      paymentId: ctx.str(pm, "PaymentID", pl, "paymentId"),
      account: ctx.str(pm, "PayeeFinancialAccount/ID", pl, "account"),
      accountName: ctx.str(pm, "PayeeFinancialAccount/Name", pl, "accountName"),
      bic: ctx.str(pm, "PayeeFinancialAccount/FinancialInstitutionBranch/ID", pl, "bic"),
      cardPan: ctx.str(pm, "CardAccount/PrimaryAccountNumberID", pl, "cardPan"),
      mandateRef: ctx.str(pm, "PaymentMandate/ID", pl, "mandateRef"),
      debitedAccount: ctx.str(pm, "PaymentMandate/PayerFinancialAccount/ID", pl, "debitedAccount"),
      locs: pl,
      loc: ctx.loc(pm)
    };
    model.paymentMeans.push(means);
  }
  for (const ac of kids(root, "AllowanceCharge")) {
    const item = readAllowanceCharge2(ctx, ac, "doc");
    (item.isCharge ? model.charges : model.allowances).push(item);
  }
  const taxTotalNodes = kids(root, "TaxTotal");
  for (const tt of taxTotalNodes) {
    const amountNode = at(tt, "TaxAmount");
    const subtotals = kids(tt, "TaxSubtotal");
    const rawAmount = text(amountNode);
    model.taxTotals.push({
      amount: rawAmount !== void 0 && !Number.isNaN(Number(rawAmount)) ? Number(rawAmount) : void 0,
      currency: amountNode?.attrs["currencyID"],
      hasSubtotals: subtotals.length > 0,
      loc: amountNode ? ctx.loc(amountNode) : ctx.loc(tt)
    });
    for (const st of subtotals) {
      const sl = {};
      const vb = {
        taxableAmount: ctx.num(st, "TaxableAmount", sl, "taxableAmount", "BT-116", {
          amount: true
        }),
        taxAmount: ctx.num(st, "TaxAmount", sl, "taxAmount", "BT-117", { amount: true }),
        category: ctx.str(st, "TaxCategory/ID", sl, "category"),
        rate: ctx.num(st, "TaxCategory/Percent", sl, "rate", "BT-119"),
        exemptionReason: ctx.str(st, "TaxCategory/TaxExemptionReason", sl, "exemptionReason"),
        exemptionCode: ctx.str(st, "TaxCategory/TaxExemptionReasonCode", sl, "exemptionCode"),
        locs: sl,
        loc: ctx.loc(st)
      };
      model.vat.push(vb);
    }
  }
  const currencyOf = (tt) => at(tt, "TaxAmount")?.attrs["currencyID"];
  const docTotal = taxTotalNodes.find((tt) => model.currency && currencyOf(tt) === model.currency) ?? taxTotalNodes.find((tt) => kids(tt, "TaxSubtotal").length > 0) ?? taxTotalNodes[0];
  const acctTotal = model.taxCurrency && model.taxCurrency !== model.currency ? taxTotalNodes.find((tt) => tt !== docTotal && currencyOf(tt) === model.taxCurrency) : void 0;
  const lmt = at(root, "LegalMonetaryTotal");
  const T = model.totals;
  if (lmt) {
    T.loc = ctx.loc(lmt);
    T.lineExtension = ctx.num(lmt, "LineExtensionAmount", T.locs, "lineExtension", "BT-106", {
      amount: true
    });
    T.taxExclusive = ctx.num(lmt, "TaxExclusiveAmount", T.locs, "taxExclusive", "BT-109", {
      amount: true
    });
    T.taxInclusive = ctx.num(lmt, "TaxInclusiveAmount", T.locs, "taxInclusive", "BT-112", {
      amount: true
    });
    T.allowanceTotal = ctx.num(lmt, "AllowanceTotalAmount", T.locs, "allowanceTotal", "BT-107", {
      amount: true
    });
    T.chargeTotal = ctx.num(lmt, "ChargeTotalAmount", T.locs, "chargeTotal", "BT-108", {
      amount: true
    });
    T.prepaid = ctx.num(lmt, "PrepaidAmount", T.locs, "prepaid", "BT-113", { amount: true });
    T.rounding = ctx.num(lmt, "PayableRoundingAmount", T.locs, "rounding", "BT-114", {
      amount: true
    });
    T.payable = ctx.num(lmt, "PayableAmount", T.locs, "payable", "BT-115", { amount: true });
  }
  if (docTotal) {
    T.taxAmount = ctx.num(docTotal, "TaxAmount", T.locs, "taxAmount", "BT-110", { amount: true });
  }
  if (acctTotal) {
    T.taxAmountAccounting = ctx.num(
      acctTotal,
      "TaxAmount",
      T.locs,
      "taxAmountAccounting",
      "BT-111",
      { amount: true }
    );
  }
  for (const ln of kids(root, linesTag)) {
    const L = {};
    const qtyNode = at(ln, qtyTag);
    const line = {
      id: ctx.str(ln, "ID", L, "id"),
      note: ctx.str(ln, "Note", L, "note"),
      quantity: ctx.num(ln, qtyTag, L, "quantity", "BT-129"),
      unitCode: qtyNode?.attrs["unitCode"],
      netAmount: ctx.num(ln, "LineExtensionAmount", L, "netAmount", "BT-131", { amount: true }),
      orderLineRef: ctx.str(ln, "OrderLineReference/LineID", L, "orderLineRef"),
      allowances: [],
      charges: [],
      attributes: [],
      locs: L,
      loc: ctx.loc(ln)
    };
    if (qtyNode) L["unitCode"] = ctx.loc(qtyNode);
    const lp = at(ln, "InvoicePeriod");
    if (lp) {
      L["period"] = ctx.loc(lp);
      line.periodStart = ctx.isoDate(lp, "StartDate", L, "periodStart", "BT-134");
      line.periodEnd = ctx.isoDate(lp, "EndDate", L, "periodEnd", "BT-135");
    }
    for (const ac of kids(ln, "AllowanceCharge")) {
      const item2 = readAllowanceCharge2(ctx, ac, "line");
      (item2.isCharge ? line.charges : line.allowances).push(item2);
    }
    const item = at(ln, "Item");
    if (item) {
      L["item"] = ctx.loc(item);
      line.itemName = ctx.str(item, "Name", L, "itemName");
      line.description = ctx.str(item, "Description", L, "description");
      line.sellerItemId = ctx.str(item, "SellersItemIdentification/ID", L, "sellerItemId");
      const sid = at(item, "StandardItemIdentification/ID");
      if (sid) {
        line.standardItemId = { id: text(sid) ?? "", scheme: sid.attrs["schemeID"] };
        L["standardItemId"] = ctx.loc(sid);
      }
      line.classification = all(item, "CommodityClassification").map((cc) => {
        const code2 = at(cc, "ItemClassificationCode");
        return { id: text(code2) ?? "", scheme: code2?.attrs["listID"] };
      });
      line.originCountry = ctx.str(item, "OriginCountry/IdentificationCode", L, "originCountry");
      line.vatCategory = ctx.str(item, "ClassifiedTaxCategory/ID", L, "vatCategory");
      line.vatRate = ctx.num(item, "ClassifiedTaxCategory/Percent", L, "vatRate", "BT-152");
      if (!L["vatCategory"] && at(item, "ClassifiedTaxCategory"))
        L["vatCategory"] = ctx.loc(at(item, "ClassifiedTaxCategory"));
      line.attributes = kids(item, "AdditionalItemProperty").map((ap) => ({
        name: text(ap, "Name"),
        value: text(ap, "Value")
      }));
    }
    const price = at(ln, "Price");
    if (price) {
      L["price"] = ctx.loc(price);
      line.priceAmount = ctx.num(price, "PriceAmount", L, "priceAmount", "BT-146");
      const bq = at(price, "BaseQuantity");
      if (bq) {
        line.baseQuantity = ctx.num(bq, "", L, "baseQuantity", "BT-149");
        line.baseQuantityUnit = bq.attrs["unitCode"];
      }
      for (const pac of kids(price, "AllowanceCharge")) {
        const ind = text(pac, "ChargeIndicator")?.toLowerCase();
        if (ind === "true") {
          line.hasPriceCharge = true;
          L["priceCharge"] = ctx.loc(pac);
        } else {
          line.priceDiscount = ctx.num(pac, "Amount", L, "priceDiscount", "BT-147");
          line.grossPrice = ctx.num(pac, "BaseAmount", L, "grossPrice", "BT-148");
        }
      }
    }
    model.lines.push(line);
  }
  model.amountCurrencies = ctx.amountCurrencies;
  model.decimals = ctx.decimals;
  model.typeErrors = ctx.typeErrors;
  model.emptyElements = collectEmptyElements(root, ctx);
  return model;
}

// src/engine/detect.ts
function detectFormat(root) {
  const ns = root.ns;
  if (root.local === "Invoice" && ns === UBL_INVOICE_NS || root.local === "CreditNote" && ns === UBL_CREDITNOTE_NS) {
    const cid = text(root, "CustomizationID");
    const document = root.local === "Invoice" ? "Invoice" : "Credit note";
    const base = {
      syntax: "UBL",
      document,
      customizationId: cid,
      rootNamespace: ns
    };
    if (cid === PEPPOL_CUSTOMIZATION_ID || cid?.startsWith(PEPPOL_CUSTOMIZATION_ID)) {
      return {
        ...base,
        id: "peppol-bis-3",
        label: "Peppol BIS Billing 3.0 (UBL 2.1)",
        en16931: true,
        peppol: true
      };
    }
    if (cid?.startsWith(XRECHNUNG_CUSTOMIZATION_PREFIX)) {
      return {
        ...base,
        id: "xrechnung-ubl",
        label: "XRechnung 3.0 (UBL 2.1)",
        en16931: true,
        peppol: false
      };
    }
    if (cid?.startsWith(EN16931_ID)) {
      return {
        ...base,
        id: "ubl-en16931",
        label: "UBL 2.1 · EN 16931",
        en16931: true,
        peppol: false
      };
    }
    return { ...base, id: "ubl-generic", label: "UBL 2.1", en16931: true, peppol: false };
  }
  if (root.local === "CrossIndustryInvoice" && ns === CII_NS) {
    const cid = text(
      at(root, "ExchangedDocumentContext"),
      "GuidelineSpecifiedDocumentContextParameter/ID"
    );
    const typeCode = text(at(root, "ExchangedDocument"), "TypeCode");
    const document = typeCode === "381" ? "Credit note" : "Invoice";
    const base = {
      syntax: "CII",
      document,
      customizationId: cid,
      rootNamespace: ns
    };
    if (cid?.startsWith(XRECHNUNG_CUSTOMIZATION_PREFIX)) {
      return {
        ...base,
        id: "xrechnung-cii",
        label: "XRechnung 3.0 (UN/CEFACT CII)",
        en16931: true,
        peppol: false
      };
    }
    const profile = cid ? FACTURX_PROFILES[cid] : void 0;
    if (profile) {
      return {
        ...base,
        id: "factur-x",
        label: profile.label,
        profileLabel: profile.label,
        en16931: profile.en16931,
        peppol: false
      };
    }
    if (cid?.startsWith(EN16931_ID)) {
      return {
        ...base,
        id: "cii-en16931",
        label: "UN/CEFACT CII · EN 16931",
        en16931: true,
        peppol: false
      };
    }
    return {
      ...base,
      id: "cii-generic",
      label: "UN/CEFACT CII D16B",
      en16931: true,
      peppol: false
    };
  }
  return {
    id: "unknown",
    label: root.local ? `Unsupported document <${root.name}>` : "Unknown",
    syntax: "unknown",
    document: "Unknown",
    en16931: false,
    peppol: false,
    rootNamespace: ns
  };
}

// src/engine/vat-id.ts
var dg = (s, i) => Number(s[i]);
function mod11_10(n) {
  let p = 10;
  for (let i = 0; i < n.length - 1; i++) {
    let s = (dg(n, i) + p) % 10;
    if (s === 0) s = 10;
    p = 2 * s % 11;
  }
  let check = 11 - p;
  if (check === 10) check = 0;
  return check === dg(n, n.length - 1);
}
function luhn(n) {
  let sum2 = 0;
  let dbl = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let v = Number(n[i]);
    if (dbl) {
      v *= 2;
      if (v > 9) v -= 9;
    }
    sum2 += v;
    dbl = !dbl;
  }
  return sum2 % 10 === 0;
}
function weighted(n, weights) {
  let s = 0;
  weights.forEach((w, i) => {
    s += dg(n, i) * w;
  });
  return s;
}
function mod97(numeric) {
  let r = 0;
  for (const ch of numeric) r = (r * 10 + Number(ch)) % 97;
  return r;
}
var RULES2 = {
  AT: {
    name: "Austria",
    re: /^U\d{8}$/,
    pattern: "ATU + 8 digits",
    example: "ATU13585627",
    checksum: (n) => {
      const d = n.slice(1);
      let r = 0;
      for (let i = 0; i < 7; i++) {
        if (i % 2 === 0) r += dg(d, i);
        else {
          const x = dg(d, i) * 2;
          r += x > 9 ? x - 9 : x;
        }
      }
      return (10 - (r + 4) % 10) % 10 === dg(d, 7);
    }
  },
  BE: {
    name: "Belgium",
    re: /^[01]\d{9}$/,
    pattern: "BE + 10 digits starting with 0 or 1",
    example: "BE0477472701",
    checksum: (n) => 97 - Number(n.slice(0, 8)) % 97 === Number(n.slice(8))
  },
  BG: {
    name: "Bulgaria",
    re: /^\d{9,10}$/,
    pattern: "BG + 9 or 10 digits",
    example: "BG175074752"
  },
  CY: {
    name: "Cyprus",
    re: /^\d{8}[A-Z]$/,
    pattern: "CY + 8 digits + 1 letter",
    example: "CY10259033P"
  },
  CZ: {
    name: "Czechia",
    re: /^\d{8,10}$/,
    pattern: "CZ + 8, 9 or 10 digits",
    example: "CZ25123891"
  },
  DE: {
    name: "Germany",
    re: /^\d{9}$/,
    pattern: "DE + 9 digits",
    example: "DE136695976",
    checksum: mod11_10
  },
  DK: {
    name: "Denmark",
    re: /^\d{8}$/,
    pattern: "DK + 8 digits",
    example: "DK13585628",
    checksum: (n) => weighted(n, [2, 7, 6, 5, 4, 3, 2, 1]) % 11 === 0
  },
  EE: { name: "Estonia", re: /^\d{9}$/, pattern: "EE + 9 digits", example: "EE100931558" },
  EL: {
    name: "Greece",
    re: /^\d{9}$/,
    pattern: "EL + 9 digits (Greece uses EL, not GR)",
    example: "EL094259216",
    checksum: (n) => {
      const s = weighted(n, [256, 128, 64, 32, 16, 8, 4, 2]);
      return s % 11 % 10 === Number(n[8]);
    }
  },
  ES: {
    name: "Spain",
    re: /^[A-Z0-9]\d{7}[A-Z0-9]$/,
    pattern: "ES + letter/digit + 7 digits + letter/digit",
    example: "ESA28015865"
  },
  FI: {
    name: "Finland",
    re: /^\d{8}$/,
    pattern: "FI + 8 digits",
    example: "FI20774740",
    checksum: (n) => {
      const r = weighted(n, [7, 9, 10, 5, 8, 4, 2]) % 11;
      if (r === 1) return false;
      return (r === 0 ? 0 : 11 - r) === Number(n[7]);
    }
  },
  FR: {
    name: "France",
    re: /^[0-9A-HJ-NP-Z]{2}\d{9}$/,
    pattern: "FR + 2 key characters + 9-digit SIREN",
    example: "FR40303265045",
    checksum: (n) => {
      const key = n.slice(0, 2);
      if (!/^\d{2}$/.test(key)) return true;
      const siren = Number(n.slice(2));
      return (12 + 3 * (siren % 97)) % 97 === Number(key);
    }
  },
  HR: {
    name: "Croatia",
    re: /^\d{11}$/,
    pattern: "HR + 11 digits",
    example: "HR33392005961",
    checksum: mod11_10
  },
  HU: { name: "Hungary", re: /^\d{8}$/, pattern: "HU + 8 digits", example: "HU12892312" },
  IE: {
    name: "Ireland",
    re: /^(\d{7}[A-W][A-IW]?|\d[A-Z+*]\d{5}[A-W])$/,
    pattern: "IE + 7 digits + 1–2 letters",
    example: "IE6388047V"
  },
  IT: {
    name: "Italy",
    re: /^\d{11}$/,
    pattern: "IT + 11 digits",
    example: "IT00743110157",
    checksum: luhn
  },
  LT: {
    name: "Lithuania",
    re: /^(\d{9}|\d{12})$/,
    pattern: "LT + 9 or 12 digits",
    example: "LT119511515"
  },
  LU: {
    name: "Luxembourg",
    re: /^\d{8}$/,
    pattern: "LU + 8 digits",
    example: "LU15027442",
    checksum: (n) => Number(n.slice(0, 6)) % 89 === Number(n.slice(6))
  },
  LV: { name: "Latvia", re: /^\d{11}$/, pattern: "LV + 11 digits", example: "LV40003521600" },
  MT: { name: "Malta", re: /^\d{8}$/, pattern: "MT + 8 digits", example: "MT11679112" },
  NL: {
    name: "Netherlands",
    re: /^\d{9}B\d{2}$/,
    pattern: "NL + 9 digits + B + 2 digits",
    example: "NL123456782B01",
    checksum: (n) => {
      const nine = n.slice(0, 9);
      const s = weighted(nine, [9, 8, 7, 6, 5, 4, 3, 2]) - dg(nine, 8);
      if (s % 11 === 0) return true;
      const numeric = ("NL" + n).split("").map((c) => /[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c).join("");
      return mod97(numeric) === 1;
    }
  },
  PL: {
    name: "Poland",
    re: /^\d{10}$/,
    pattern: "PL + 10 digits",
    example: "PL5260250995",
    checksum: (n) => {
      const r = weighted(n, [6, 5, 7, 2, 3, 4, 5, 6, 7]) % 11;
      return r !== 10 && r === Number(n[9]);
    }
  },
  PT: {
    name: "Portugal",
    re: /^\d{9}$/,
    pattern: "PT + 9 digits",
    example: "PT501964843",
    checksum: (n) => {
      let r = 11 - weighted(n, [9, 8, 7, 6, 5, 4, 3, 2]) % 11;
      if (r >= 10) r = 0;
      return r === Number(n[8]);
    }
  },
  RO: { name: "Romania", re: /^\d{2,10}$/, pattern: "RO + 2 to 10 digits", example: "RO18547290" },
  SE: {
    name: "Sweden",
    re: /^\d{10}01$/,
    pattern: "SE + 10 digits + 01",
    example: "SE556188840401",
    checksum: (n) => luhn(n.slice(0, 10))
  },
  SI: {
    name: "Slovenia",
    re: /^[1-9]\d{7}$/,
    pattern: "SI + 8 digits",
    example: "SI50223054",
    checksum: (n) => {
      const r = 11 - weighted(n, [8, 7, 6, 5, 4, 3, 2]) % 11;
      if (r === 11) return false;
      return (r === 10 ? 0 : r) === Number(n[7]);
    }
  },
  SK: {
    name: "Slovakia",
    re: /^[1-9]\d{9}$/,
    pattern: "SK + 10 digits",
    example: "SK2022749619",
    checksum: (n) => Number(n) % 11 === 0
  },
  XI: {
    name: "Northern Ireland",
    re: /^(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/,
    pattern: "XI + 9 or 12 digits",
    example: "XI980780684"
  },
  GB: {
    name: "United Kingdom",
    re: /^(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/,
    pattern: "GB + 9 or 12 digits",
    example: "GB980780684"
  },
  CH: {
    name: "Switzerland",
    re: /^E\d{9}(MWST|TVA|IVA)?$/,
    pattern: "CHE + 9 digits (+ MWST/TVA/IVA)",
    example: "CHE116281710MWST"
  },
  NO: {
    name: "Norway",
    re: /^\d{9}(MVA)?$/,
    pattern: "NO + 9 digits + MVA",
    example: "NO974760673MVA"
  }
};
var VAT_COUNTRIES = Object.entries(RULES2).map(([code2, r]) => ({
  code: code2,
  name: r.name,
  pattern: r.pattern,
  example: r.example,
  hasChecksum: Boolean(r.checksum)
}));
function normalizeVatId(input) {
  return input.toUpperCase().replace(/[\s.\-_/]/g, "");
}
function checkVatId(input) {
  const normalized = normalizeVatId(input);
  let country = normalized.slice(0, 2);
  const number = normalized.slice(2);
  const base = { input, normalized, country, number };
  if (country === "GR") {
    return {
      ...base,
      status: "invalid_format",
      formatOk: false,
      checksumOk: null,
      pattern: RULES2["EL"]?.pattern,
      example: RULES2["EL"]?.example,
      message: "Greek VAT numbers use the prefix EL, not GR."
    };
  }
  if (!/^[A-Z]{2}$/.test(country)) {
    country = "";
    return {
      ...base,
      country,
      status: "unknown_country",
      formatOk: false,
      checksumOk: null,
      message: "A VAT number must start with a two-letter country prefix, e.g. DE or NL."
    };
  }
  const rule = RULES2[country];
  if (!rule) {
    return {
      ...base,
      status: "unknown_country",
      formatOk: false,
      checksumOk: null,
      message: `No VAT number format is registered for prefix ${country}.`
    };
  }
  if (!rule.re.test(number)) {
    return {
      ...base,
      status: "invalid_format",
      formatOk: false,
      checksumOk: null,
      pattern: rule.pattern,
      example: rule.example,
      message: `Does not match the ${rule.name} format (${rule.pattern}).`
    };
  }
  if (rule.checksum) {
    const ok = rule.checksum(number);
    return {
      ...base,
      status: ok ? "valid" : "invalid_checksum",
      formatOk: true,
      checksumOk: ok,
      pattern: rule.pattern,
      example: rule.example,
      message: ok ? `Format and check digit are valid for ${rule.name}.` : `Format is correct but the check digit does not match the ${rule.name} algorithm — likely a typo.`
    };
  }
  return {
    ...base,
    status: "valid",
    formatOk: true,
    checksumOk: null,
    pattern: rule.pattern,
    example: rule.example,
    message: `Format is valid for ${rule.name}. Check digits are not publicly specified for this country.`
  };
}
function checkIban(input) {
  const iban = input.toUpperCase().replace(/\s/g, "");
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.split("").map((c) => /[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c).join("");
  return mod97(numeric) === 1;
}
function checkGln(gln) {
  if (!/^\d{13}$/.test(gln)) return false;
  let sum2 = 0;
  for (let i = 0; i < 12; i++) sum2 += dg(gln, i) * (i % 2 === 0 ? 1 : 3);
  return (10 - sum2 % 10) % 10 === dg(gln, 12);
}
function checkBelgianEnterprise(id) {
  const n = id.replace(/\D/g, "");
  if (!/^[01]\d{9}$/.test(n)) return false;
  return 97 - Number(n.slice(0, 8)) % 97 === Number(n.slice(8));
}
function isPeppol0208(id) {
  const n = id.trim();
  if (!/^[0-9]{10}$/.test(n)) return false;
  return 97 - Number(n.slice(0, 8)) % 97 === Number(n.slice(8));
}

// src/engine/rules.ts
var XRECHNUNG_TYPE_CODES = /* @__PURE__ */ new Set(["326", "380", "384", "389", "381", "875", "876", "877"]);
var f2 = (n) => n === void 0 || Number.isNaN(n) ? "—" : round2(n).toFixed(2);
var rateKey = (rate) => rate === void 0 ? "" : String(round2(rate));
function runRules(m, fmt, opts) {
  const out = [];
  const emit = (ruleId, message, loc, extra = {}) => {
    const meta = RULE_INDEX[ruleId];
    if (!meta) throw new Error(`Unknown rule ${ruleId}`);
    const where = loc ?? m.loc;
    out.push({
      ruleId,
      source: meta.source,
      severity: extra.severity ?? meta.severity,
      section: meta.section,
      title: meta.title,
      message,
      line: where.line,
      col: where.col,
      xpath: where.xpath,
      bt: meta.bt,
      expected: extra.expected,
      actual: extra.actual
    });
  };
  const at2 = (locs, key, fallback) => locs[key] ?? fallback ?? m.loc;
  const T = m.totals;
  const tLoc = (key) => at2(T.locs, key, T.loc);
  for (const te of m.typeErrors) {
    emit("IV-SYN-03", `${te.bt} has value "${te.raw}" but must be ${te.expected}.`, te.loc, {
      expected: te.expected,
      actual: te.raw
    });
  }
  if (opts.peppol) {
    for (const loc of m.emptyElements.slice(0, 25)) {
      emit("PEPPOL-EN16931-R008", `Element ${loc.xpath.split("/").pop()} is empty.`, loc);
    }
  }
  if (!opts.en16931) {
    emit(
      "IV-SYN-04",
      `${fmt.label} carries only header data. It is not an EN 16931 compliant e-invoice; line and VAT checks were skipped.`,
      at2(m.locs, "customizationId")
    );
  }
  if (!m.customizationId)
    emit("BR-01", "The specification identifier (CustomizationID) is missing.");
  if (!m.number) emit("BR-02", "The invoice number is missing.", m.locs["number"]);
  if (!m.issueDate && !m.typeErrors.some((t) => t.bt === "BT-2"))
    emit("BR-03", "The invoice issue date is missing.", m.locs["issueDate"]);
  if (!m.typeCode) emit("BR-04", "The invoice type code is missing.", m.locs["typeCode"]);
  else if (!INVOICE_TYPE_CODES[m.typeCode])
    emit("BR-CL-01", `Type code "${m.typeCode}" is not in UNTDID 1001.`, at2(m.locs, "typeCode"), {
      actual: m.typeCode,
      expected: "380, 381, 384, 389 …"
    });
  if (!m.currency) emit("BR-05", "The invoice currency code is missing.", m.locs["currency"]);
  else if (!ISO_4217.has(m.currency))
    emit("BR-CL-04", `Currency "${m.currency}" is not an ISO 4217 code.`, at2(m.locs, "currency"), {
      actual: m.currency,
      expected: "EUR, USD, GBP …"
    });
  if (m.taxCurrency && !ISO_4217.has(m.taxCurrency))
    emit(
      "BR-CL-04",
      `VAT accounting currency "${m.taxCurrency}" is not an ISO 4217 code.`,
      at2(m.locs, "taxCurrency")
    );
  if (m.taxCurrency && T.taxAmountAccounting === void 0)
    emit(
      "BR-53",
      `Tax currency ${m.taxCurrency} is set, but no VAT total in that currency was found.`,
      at2(m.locs, "taxCurrency")
    );
  if (m.taxPointDate && m.taxPointCode)
    emit(
      "BR-CO-03",
      "Both a VAT point date and a VAT point date code are present.",
      at2(m.locs, "taxPointDate")
    );
  if (m.hasPeriod) {
    if (!m.periodStart && !m.periodEnd && !m.typeErrors.some((t) => t.bt === "BT-73" || t.bt === "BT-74"))
      emit(
        "BR-CO-19",
        "The invoice period has neither a start nor an end date.",
        at2(m.locs, "period")
      );
    if (m.periodStart && m.periodEnd && m.periodEnd < m.periodStart)
      emit(
        "BR-29",
        `Invoice period ends (${m.periodEnd}) before it starts (${m.periodStart}).`,
        at2(m.locs, "periodEnd")
      );
  }
  for (const pi of m.precedingInvoices) {
    if (!pi.id) emit("BR-55", "A preceding invoice reference has no invoice number.", pi.loc);
  }
  if (m.dueDate && m.issueDate && m.dueDate < m.issueDate)
    emit(
      "IV-DATE-01",
      `Due date ${m.dueDate} is before the issue date ${m.issueDate}.`,
      at2(m.locs, "dueDate")
    );
  if (opts.peppol) {
    if (!m.profileId) emit("PEPPOL-EN16931-R001", "cbc:ProfileID (business process) is missing.");
    else if (!/^urn:fdc:peppol\.eu:2017:poacc:billing:\d{2}:1\.0$/.test(m.profileId))
      emit(
        "PEPPOL-EN16931-R007",
        `ProfileID "${m.profileId}" does not follow the Peppol format.`,
        at2(m.locs, "profileId"),
        {
          actual: m.profileId,
          expected: "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0"
        }
      );
    if (m.customizationId && !m.customizationId.startsWith(PEPPOL_CUSTOMIZATION_ID))
      emit(
        "PEPPOL-EN16931-R004",
        `CustomizationID is "${m.customizationId}".`,
        at2(m.locs, "customizationId"),
        {
          actual: m.customizationId,
          expected: PEPPOL_CUSTOMIZATION_ID
        }
      );
    if (m.taxCurrency && m.taxCurrency === m.currency)
      emit(
        "PEPPOL-EN16931-R005",
        `TaxCurrencyCode equals the invoice currency (${m.currency}).`,
        at2(m.locs, "taxCurrency")
      );
    const bothGerman = m.seller.address?.country === "DE" && m.buyer.address?.country === "DE";
    if (m.notes.length > 1 && !bothGerman)
      emit(
        "PEPPOL-EN16931-R002",
        `The invoice has ${m.notes.length} notes; Peppol allows one.`,
        at2(m.locs, "notes")
      );
    if (!m.buyerReference && !m.orderRef)
      emit(
        "PEPPOL-EN16931-R003",
        "Neither a buyer reference nor a purchase order reference is present."
      );
    if (m.typeCode) {
      if (m.kind === "invoice" && m.syntax === "UBL" && !PEPPOL_INVOICE_TYPE_CODES.has(m.typeCode))
        emit(
          "PEPPOL-EN16931-P0100",
          `Invoice type code ${m.typeCode} is not allowed in Peppol BIS 3.`,
          at2(m.locs, "typeCode")
        );
      if (m.kind === "creditnote" && m.syntax === "UBL" && !PEPPOL_CREDIT_NOTE_TYPE_CODES.has(m.typeCode))
        emit(
          "PEPPOL-EN16931-P0101",
          `Credit note type code ${m.typeCode} is not allowed in Peppol BIS 3.`,
          at2(m.locs, "typeCode")
        );
    }
    const withSub = m.taxTotals.filter((t) => t.hasSubtotals);
    if (withSub.length > 1)
      emit(
        "PEPPOL-EN16931-R053",
        `${withSub.length} TaxTotal groups contain subtotals.`,
        withSub[1]?.loc
      );
    if (T.taxAmount !== void 0 && T.taxAmountAccounting !== void 0 && Math.sign(T.taxAmount) !== Math.sign(T.taxAmountAccounting) && T.taxAmount !== 0 && T.taxAmountAccounting !== 0)
      emit(
        "PEPPOL-EN16931-R055",
        "The VAT total and the VAT total in accounting currency have different signs.",
        tLoc("taxAmountAccounting")
      );
    if (m.currency) {
      for (const ac of m.amountCurrencies) {
        if (ac.bt === "BT-111") continue;
        if (ac.currency && ac.currency !== m.currency) {
          emit(
            "PEPPOL-EN16931-R051",
            `${ac.bt} uses currencyID="${ac.currency}" but the invoice currency is ${m.currency}.`,
            ac.loc,
            {
              actual: ac.currency,
              expected: m.currency
            }
          );
        }
      }
    }
  }
  const seller = m.seller;
  const buyer = m.buyer;
  if (!seller.name)
    emit("BR-06", "The seller's legal name is missing.", seller.locs["name"] ?? seller.loc);
  if (!buyer.name)
    emit("BR-07", "The buyer's legal name is missing.", buyer.locs["name"] ?? buyer.loc);
  if (!seller.address) emit("BR-08", "The seller has no postal address.", seller.loc);
  else if (!seller.address.country)
    emit("BR-09", "The seller address has no country code.", at2(seller.locs, "address"));
  if (!buyer.address) emit("BR-10", "The buyer has no postal address.", buyer.loc);
  else if (!buyer.address.country)
    emit("BR-11", "The buyer address has no country code.", at2(buyer.locs, "address"));
  if (m.payee && !m.payee.name) emit("BR-17", "A payee is present without a name.", m.payee.loc);
  if (m.taxRepresentative) {
    const tr = m.taxRepresentative;
    if (!tr.name) emit("BR-18", "The tax representative has no name.", tr.loc);
    if (!tr.address) emit("BR-19", "The tax representative has no postal address.", tr.loc);
    if (!tr.vatId) emit("BR-56", "The tax representative has no VAT identifier.", tr.loc);
  }
  if (m.delivery?.address && !m.delivery.address.country)
    emit(
      "BR-57",
      "The deliver-to address has no country code.",
      at2(m.delivery.locs, "address", m.delivery.loc)
    );
  const countryChecks = [
    [seller.address?.country, seller.locs["address.country"], "Seller"],
    [buyer.address?.country, buyer.locs["address.country"], "Buyer"],
    [m.delivery?.address?.country, m.delivery?.locs["address.country"], "Deliver-to"],
    [
      m.taxRepresentative?.address?.country,
      m.taxRepresentative?.locs["address.country"],
      "Tax representative"
    ]
  ];
  for (const [code2, loc, who] of countryChecks) {
    if (code2 && !ISO_3166[code2])
      emit(
        "BR-CL-14",
        `${who} country "${code2}" is not an ISO 3166-1 alpha-2 code${code2 === "UK" ? " (use GB)" : ""}.`,
        loc,
        {
          actual: code2,
          expected: code2 === "UK" ? "GB" : "DE, FR, NL …"
        }
      );
  }
  const endpointChecks = [
    [seller, "Seller", "BR-62", "PEPPOL-EN16931-R020"],
    [buyer, "Buyer", "BR-63", "PEPPOL-EN16931-R010"]
  ];
  for (const [p, who, schemeRule, peppolRule] of endpointChecks) {
    if (!p.endpoint) {
      if (opts.peppol)
        emit(peppolRule, `${who} electronic address (EndpointID) is missing.`, p.loc);
      continue;
    }
    const loc = at2(p.locs, "endpoint", p.loc);
    if (!p.endpoint.scheme)
      emit(schemeRule, `${who} EndpointID "${p.endpoint.id}" has no schemeID.`, loc);
    else if (!EAS_CODES[p.endpoint.scheme])
      emit(
        "BR-CL-25",
        `${who} endpoint scheme "${p.endpoint.scheme}" is not in the EAS code list.`,
        loc,
        {
          actual: p.endpoint.scheme
        }
      );
    else if (p.endpoint.scheme === "0088" && !checkGln(p.endpoint.id))
      emit("PEPPOL-COMMON-R040", `${who} GLN "${p.endpoint.id}" has an invalid check digit.`, loc, {
        actual: p.endpoint.id
      });
    else if (p.endpoint.scheme === "0208" && !opts.peppol && !checkBelgianEnterprise(p.endpoint.id))
      emit("IV-BE-01", `${who} enterprise number "${p.endpoint.id}" fails the mod-97 check.`, loc, {
        actual: p.endpoint.id
      });
  }
  for (const [p, who] of [
    [seller, "Seller"],
    [buyer, "Buyer"]
  ]) {
    for (const idn of p.identifiers) {
      if (idn.scheme === "0088" && !checkGln(idn.id))
        emit(
          "PEPPOL-COMMON-R040",
          `${who} identifier GLN "${idn.id}" has an invalid check digit.`,
          p.locs["identifier"]
        );
    }
    if (!opts.peppol) continue;
    const belgianIds = [
      [p.endpoint, "EndpointID", at2(p.locs, "endpoint", p.loc)],
      ...p.identifiers.map((i) => [i, "party identifier", p.locs["identifier"] ?? p.loc]),
      [p.legalId, "legal registration number", at2(p.locs, "legalId", p.loc)]
    ];
    for (const [idn, what, loc] of belgianIds) {
      if (idn?.scheme !== "0208" || isPeppol0208(idn.id)) continue;
      emit(
        "PEPPOL-COMMON-R043",
        `${who} ${what} "${idn.id}" uses scheme 0208 but is not a 10-digit Belgian enterprise number with valid check digits (no BE, dots or spaces).`,
        loc,
        { actual: idn.id, expected: "0123456749" }
      );
    }
  }
  const vatParties = [
    [seller, "Seller", "BT-31"],
    [buyer, "Buyer", "BT-48"],
    [m.taxRepresentative, "Tax representative", "BT-63"]
  ];
  for (const [p, who, bt] of vatParties) {
    if (!p?.vatId) continue;
    const loc = at2(p.locs, "vatId", p.loc);
    const prefix = p.vatId.slice(0, 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(prefix) || !ISO_3166[prefix] && prefix !== "EL") {
      emit(
        "BR-CO-09",
        `${who} VAT identifier "${p.vatId}" (${bt}) does not start with a country prefix.`,
        loc,
        {
          actual: p.vatId,
          expected: "DE123456789"
        }
      );
      continue;
    }
    const res = checkVatId(p.vatId);
    if (res.status === "invalid_format") {
      emit("IV-VAT-01", `${who} VAT number "${p.vatId}": ${res.message}`, loc, {
        actual: p.vatId,
        expected: res.example ?? res.pattern ?? ""
      });
    } else if (res.status === "invalid_checksum") {
      emit("IV-VAT-02", `${who} VAT number "${p.vatId}": ${res.message}`, loc, { actual: p.vatId });
    }
  }
  if (seller.vatId && seller.address?.country) {
    const prefix = seller.vatId.slice(0, 2).toUpperCase();
    const country = seller.address.country;
    const matches = prefix === country || prefix === "EL" && country === "GR" || prefix === "XI" && country === "GB";
    if (/^[A-Z]{2}$/.test(prefix) && !matches)
      emit(
        "IV-VAT-03",
        `Seller VAT prefix ${prefix} differs from seller country ${country}.`,
        at2(seller.locs, "vatId"),
        {
          severity: "info"
        }
      );
  }
  if (!seller.vatId && !seller.legalId && seller.identifiers.length === 0)
    emit(
      "BR-CO-26",
      "The seller has no VAT number, legal registration number or identifier.",
      seller.loc
    );
  for (const pm of m.paymentMeans) {
    if (!pm.code) {
      emit("BR-49", "A payment instruction has no payment means code.", pm.loc);
      continue;
    }
    const codeLoc = at2(pm.locs, "code", pm.loc);
    if (!PAYMENT_MEANS[pm.code])
      emit("BR-CL-16", `Payment means code "${pm.code}" is not in UNCL4461.`, codeLoc, {
        actual: pm.code
      });
    if (CREDIT_TRANSFER_CODES.has(pm.code) && !pm.account)
      emit(
        "BR-61",
        `Payment means ${pm.code} (credit transfer) has no payee account / IBAN.`,
        codeLoc
      );
    if (pm.account && /^[A-Z]{2}\d{2}/.test(pm.account.replace(/\s/g, "")) && !checkIban(pm.account))
      emit(
        "IV-IBAN-01",
        `"${pm.account}" fails the IBAN check digit test.`,
        at2(pm.locs, "account", pm.loc),
        {
          actual: pm.account
        }
      );
    if (opts.peppol && DIRECT_DEBIT_CODES.has(pm.code) && !pm.mandateRef)
      emit(
        "PEPPOL-EN16931-R061",
        "Direct debit is used but no mandate reference is given.",
        codeLoc
      );
  }
  if ((T.payable ?? 0) > 0 && !m.dueDate && !m.paymentTerms)
    emit(
      "BR-CO-25",
      `Amount due is ${f2(T.payable)} but there is no due date and no payment terms.`,
      tLoc("payable")
    );
  if (T.lineExtension === void 0)
    emit("BR-12", "LineExtensionAmount (BT-106) is missing.", T.loc);
  if (T.taxExclusive === void 0) emit("BR-13", "TaxExclusiveAmount (BT-109) is missing.", T.loc);
  if (T.taxInclusive === void 0) emit("BR-14", "TaxInclusiveAmount (BT-112) is missing.", T.loc);
  if (T.payable === void 0) emit("BR-15", "PayableAmount (BT-115) is missing.", T.loc);
  for (const d of m.decimals) {
    const dec = d.raw.split(".")[1];
    if (dec && dec.length > 2)
      emit(
        "BR-DEC",
        `${d.bt} has ${dec.length} decimals ("${d.raw}"); at most 2 are allowed.`,
        d.loc,
        {
          actual: d.raw,
          expected: Number(d.raw).toFixed(2)
        }
      );
  }
  const docAc = (ac) => {
    const kind = ac.isCharge ? "charge" : "allowance";
    if (ac.rawIndicator && ac.rawIndicator !== "true" && ac.rawIndicator !== "false" && opts.peppol)
      emit(
        "PEPPOL-EN16931-R043",
        `ChargeIndicator is "${ac.rawIndicator}".`,
        at2(ac.locs, "indicator", ac.loc)
      );
    if (ac.amount === void 0)
      emit(ac.isCharge ? "BR-36" : "BR-31", `A document ${kind} has no amount.`, ac.loc);
    if (!ac.vatCategory)
      emit(ac.isCharge ? "BR-37" : "BR-32", `A document ${kind} has no VAT category.`, ac.loc);
    else if (!VAT_CATEGORIES[ac.vatCategory])
      emit(
        "BR-CL-17",
        `VAT category "${ac.vatCategory}" on a document ${kind} is not in UNCL5305.`,
        at2(ac.locs, "vatCategory")
      );
    if (!ac.reason && !ac.reasonCode)
      emit(
        ac.isCharge ? "BR-38" : "BR-33",
        `A document ${kind} has neither a reason nor a reason code.`,
        ac.loc
      );
    peppolPercent(ac);
  };
  const peppolPercent = (ac) => {
    if (!opts.peppol) return;
    if (ac.percent !== void 0 && ac.baseAmount === void 0)
      emit(
        "PEPPOL-EN16931-R041",
        "A percentage is given without a base amount.",
        at2(ac.locs, "percent", ac.loc)
      );
    if (ac.baseAmount !== void 0 && ac.percent === void 0)
      emit(
        "PEPPOL-EN16931-R042",
        "A base amount is given without a percentage.",
        at2(ac.locs, "baseAmount", ac.loc)
      );
    if (ac.amount !== void 0 && ac.baseAmount !== void 0 && ac.percent !== void 0) {
      const expected = round2(ac.baseAmount * ac.percent / 100);
      if (Math.abs(expected - ac.amount) > 0.02)
        emit(
          "PEPPOL-EN16931-R040",
          `Amount ${f2(ac.amount)} ≠ ${f2(ac.baseAmount)} × ${ac.percent}% = ${f2(expected)}.`,
          at2(ac.locs, "amount", ac.loc),
          {
            expected: f2(expected),
            actual: f2(ac.amount)
          }
        );
    }
  };
  m.allowances.forEach(docAc);
  m.charges.forEach(docAc);
  if (opts.en16931) {
    if (m.lines.length === 0) emit("BR-16", "The invoice has no lines.");
    const unitWarned = /* @__PURE__ */ new Set();
    for (const [idx, ln] of m.lines.entries()) {
      const label = `Line ${ln.id ?? idx + 1}`;
      const L = (key) => at2(ln.locs, key, ln.loc);
      if (!ln.id) emit("BR-21", `Line #${idx + 1} has no identifier.`, ln.loc);
      if (ln.quantity === void 0 && !ln.locs["quantity"])
        emit("BR-22", `${label} has no invoiced quantity.`, ln.loc);
      if (ln.locs["quantity"] && !ln.unitCode)
        emit("BR-23", `${label} quantity has no unit code.`, L("quantity"));
      if (ln.unitCode && !UNIT_CODES[ln.unitCode] && !unitWarned.has(ln.unitCode)) {
        unitWarned.add(ln.unitCode);
        emit(
          "IV-UNIT-01",
          `Unit code "${ln.unitCode}" is uncommon — please double check it.`,
          L("unitCode")
        );
      }
      if (ln.netAmount === void 0 && !ln.locs["netAmount"])
        emit("BR-24", `${label} has no net amount.`, ln.loc);
      if (!ln.itemName) emit("BR-25", `${label} has no item name.`, L("item"));
      if (ln.priceAmount === void 0 && !ln.locs["priceAmount"])
        emit("BR-26", `${label} has no net price.`, L("price"));
      if (ln.priceAmount !== void 0 && ln.priceAmount < 0)
        emit("BR-27", `${label} net price is negative (${ln.priceAmount}).`, L("priceAmount"));
      if (ln.grossPrice !== void 0 && ln.grossPrice < 0)
        emit("BR-28", `${label} gross price is negative (${ln.grossPrice}).`, L("grossPrice"));
      if (ln.locs["period"]) {
        if (!ln.periodStart && !ln.periodEnd)
          emit("BR-CO-20", `${label} has an empty period.`, L("period"));
        if (ln.periodStart && ln.periodEnd && ln.periodEnd < ln.periodStart)
          emit("BR-30", `${label} period ends before it starts.`, L("periodEnd"));
        if (opts.peppol && m.periodStart && ln.periodStart && ln.periodStart < m.periodStart)
          emit(
            "PEPPOL-EN16931-R110",
            `${label} period starts ${ln.periodStart}, before the invoice period (${m.periodStart}).`,
            L("periodStart")
          );
        if (opts.peppol && m.periodEnd && ln.periodEnd && ln.periodEnd > m.periodEnd)
          emit(
            "PEPPOL-EN16931-R111",
            `${label} period ends ${ln.periodEnd}, after the invoice period (${m.periodEnd}).`,
            L("periodEnd")
          );
      }
      if (!ln.vatCategory) emit("BR-CO-04", `${label} has no VAT category.`, L("vatCategory"));
      else if (!VAT_CATEGORIES[ln.vatCategory])
        emit(
          "BR-CL-17",
          `${label} VAT category "${ln.vatCategory}" is not in UNCL5305.`,
          L("vatCategory"),
          {
            actual: ln.vatCategory,
            expected: "S, Z, E, AE, K, G, O"
          }
        );
      const cat = ln.vatCategory;
      const rate = ln.vatRate;
      if (cat === "S" && (rate === void 0 || rate <= 0))
        emit("BR-S-05", `${label} is standard rated with rate ${rate ?? "missing"}.`, L("vatRate"));
      const zeroRules = {
        Z: "BR-Z-05",
        E: "BR-E-05",
        AE: "BR-AE-05",
        K: "BR-IC-05",
        G: "BR-G-05"
      };
      const zr = cat ? zeroRules[cat] : void 0;
      if (zr && rate !== void 0 && rate !== 0)
        emit(zr, `${label} has category ${cat} with rate ${rate}%; it must be 0.`, L("vatRate"), {
          expected: "0",
          actual: String(rate)
        });
      if (cat === "O" && rate !== void 0)
        emit("BR-O-05", `${label} is out of scope of VAT but carries rate ${rate}%.`, L("vatRate"));
      for (const ac of ln.allowances) {
        if (ac.amount === void 0)
          emit("BR-41", `${label} has an allowance without amount.`, ac.loc);
        if (!ac.reason && !ac.reasonCode)
          emit("BR-42", `${label} has an allowance without reason.`, ac.loc);
        peppolPercent(ac);
      }
      for (const ac of ln.charges) {
        if (ac.amount === void 0) emit("BR-43", `${label} has a charge without amount.`, ac.loc);
        if (!ac.reason && !ac.reasonCode)
          emit("BR-44", `${label} has a charge without reason.`, ac.loc);
        peppolPercent(ac);
      }
      for (const a of ln.attributes) {
        if (!a.name || !a.value)
          emit("BR-54", `${label} has an item attribute without name or value.`, L("item"));
      }
      if (ln.standardItemId && !ln.standardItemId.scheme)
        emit("BR-64", `${label} standard item identifier has no scheme.`, L("standardItemId"));
      if (ln.classification?.some((c) => !c.scheme))
        emit("BR-65", `${label} item classification has no listID.`, L("item"));
      if (opts.peppol) {
        if (ln.hasPriceCharge)
          emit("PEPPOL-EN16931-R044", `${label} has a charge on price level.`, L("priceCharge"));
        if (ln.baseQuantity !== void 0 && ln.baseQuantity <= 0)
          emit(
            "PEPPOL-EN16931-R121",
            `${label} base quantity is ${ln.baseQuantity}.`,
            L("baseQuantity")
          );
        if (ln.baseQuantityUnit && ln.unitCode && ln.baseQuantityUnit !== ln.unitCode)
          emit(
            "PEPPOL-EN16931-R130",
            `${label} base quantity unit ${ln.baseQuantityUnit} differs from ${ln.unitCode}.`,
            L("baseQuantity")
          );
        if (ln.grossPrice !== void 0 && ln.priceAmount !== void 0) {
          const expectedNet = ln.grossPrice - (ln.priceDiscount ?? 0);
          if (Math.abs(expectedNet - ln.priceAmount) > 1e-4)
            emit(
              "PEPPOL-EN16931-R046",
              `${label} net price ${ln.priceAmount} ≠ gross ${ln.grossPrice} − discount ${ln.priceDiscount ?? 0}.`,
              L("priceAmount"),
              {
                expected: String(round2(expectedNet)),
                actual: String(ln.priceAmount)
              }
            );
        }
        if (ln.quantity !== void 0 && ln.priceAmount !== void 0 && ln.netAmount !== void 0) {
          const base = ln.baseQuantity && ln.baseQuantity > 0 ? ln.baseQuantity : 1;
          const expected = ln.quantity * ln.priceAmount / base + sum(ln.charges.map((c) => c.amount)) - sum(ln.allowances.map((a) => a.amount));
          if (Math.abs(round2(expected) - ln.netAmount) > 0.02)
            emit(
              "PEPPOL-EN16931-R120",
              `${label}: ${ln.quantity} × ${ln.priceAmount}${base !== 1 ? ` / ${base}` : ""} = ${f2(expected)}, but the line amount is ${f2(ln.netAmount)}.`,
              L("netAmount"),
              { expected: f2(expected), actual: f2(ln.netAmount) }
            );
        }
      }
    }
  }
  const lineSum = sum(m.lines.map((l) => l.netAmount));
  const allowanceSum = sum(m.allowances.map((a) => a.amount));
  const chargeSum = sum(m.charges.map((c) => c.amount));
  if (opts.en16931 && T.lineExtension !== void 0 && m.lines.length > 0 && !sameAmount(T.lineExtension, lineSum))
    emit(
      "BR-CO-10",
      `Sum of line amounts is ${f2(lineSum)}, but LineExtensionAmount is ${f2(T.lineExtension)}.`,
      tLoc("lineExtension"),
      {
        expected: f2(lineSum),
        actual: f2(T.lineExtension)
      }
    );
  if (m.allowances.length > 0 || T.allowanceTotal !== void 0) {
    if ((T.allowanceTotal ?? 0) !== allowanceSum && !sameAmount(T.allowanceTotal ?? 0, allowanceSum))
      emit(
        "BR-CO-11",
        `Document allowances add up to ${f2(allowanceSum)}, but AllowanceTotalAmount is ${f2(T.allowanceTotal)}.`,
        tLoc("allowanceTotal"),
        {
          expected: f2(allowanceSum),
          actual: f2(T.allowanceTotal)
        }
      );
  }
  if (m.charges.length > 0 || T.chargeTotal !== void 0) {
    if (!sameAmount(T.chargeTotal ?? 0, chargeSum))
      emit(
        "BR-CO-12",
        `Document charges add up to ${f2(chargeSum)}, but ChargeTotalAmount is ${f2(T.chargeTotal)}.`,
        tLoc("chargeTotal"),
        {
          expected: f2(chargeSum),
          actual: f2(T.chargeTotal)
        }
      );
  }
  if (T.taxExclusive !== void 0 && T.lineExtension !== void 0) {
    const expected = round2(T.lineExtension - (T.allowanceTotal ?? 0) + (T.chargeTotal ?? 0));
    if (!sameAmount(T.taxExclusive, expected))
      emit(
        "BR-CO-13",
        `${f2(T.lineExtension)} − ${f2(T.allowanceTotal ?? 0)} + ${f2(T.chargeTotal ?? 0)} = ${f2(expected)}, but TaxExclusiveAmount is ${f2(T.taxExclusive)}.`,
        tLoc("taxExclusive"),
        {
          expected: f2(expected),
          actual: f2(T.taxExclusive)
        }
      );
  }
  const vatSum = sum(m.vat.map((v) => v.taxAmount));
  if (T.taxAmount !== void 0 && m.vat.length > 0 && !sameAmount(T.taxAmount, vatSum))
    emit(
      "BR-CO-14",
      `VAT breakdown adds up to ${f2(vatSum)}, but the VAT total is ${f2(T.taxAmount)}.`,
      tLoc("taxAmount"),
      {
        expected: f2(vatSum),
        actual: f2(T.taxAmount)
      }
    );
  if (T.taxInclusive !== void 0 && T.taxExclusive !== void 0) {
    const expected = round2(T.taxExclusive + (T.taxAmount ?? 0));
    if (!sameAmount(T.taxInclusive, expected))
      emit(
        "BR-CO-15",
        `${f2(T.taxExclusive)} + VAT ${f2(T.taxAmount ?? 0)} = ${f2(expected)}, but TaxInclusiveAmount is ${f2(T.taxInclusive)}.`,
        tLoc("taxInclusive"),
        {
          expected: f2(expected),
          actual: f2(T.taxInclusive)
        }
      );
  }
  if (T.payable !== void 0 && T.taxInclusive !== void 0) {
    const expected = round2(T.taxInclusive - (T.prepaid ?? 0) + (T.rounding ?? 0));
    if (!sameAmount(T.payable, expected))
      emit(
        "BR-CO-16",
        `${f2(T.taxInclusive)} − prepaid ${f2(T.prepaid ?? 0)} + rounding ${f2(T.rounding ?? 0)} = ${f2(expected)}, but PayableAmount is ${f2(T.payable)}.`,
        tLoc("payable"),
        {
          expected: f2(expected),
          actual: f2(T.payable)
        }
      );
  }
  if (opts.en16931) {
    if (m.vat.length === 0) emit("BR-CO-18", "The invoice has no VAT breakdown (TaxSubtotal).");
    for (const v of m.vat) {
      const V = (key) => at2(v.locs, key, v.loc);
      const label = `VAT ${v.category ?? "?"}${v.rate !== void 0 ? ` ${v.rate}%` : ""}`;
      if (v.taxableAmount === void 0 && !v.locs["taxableAmount"])
        emit("BR-45", `${label} has no taxable amount.`, v.loc);
      if (v.taxAmount === void 0 && !v.locs["taxAmount"])
        emit("BR-46", `${label} has no tax amount.`, v.loc);
      if (!v.category) emit("BR-47", "A VAT breakdown has no category code.", v.loc);
      else if (!VAT_CATEGORIES[v.category])
        emit("BR-CL-17", `VAT category "${v.category}" is not in UNCL5305.`, V("category"), {
          actual: v.category
        });
      if (v.category && v.category !== "O" && v.rate === void 0)
        emit("BR-48", `${label} has no rate.`, V("category"));
      if (v.taxableAmount !== void 0 && v.taxAmount !== void 0 && v.rate !== void 0 && v.category !== "O") {
        const expected = round2(v.taxableAmount * v.rate / 100);
        const diff = Math.abs(expected - v.taxAmount);
        if (diff >= 1)
          emit(
            "BR-CO-17",
            `${f2(v.taxableAmount)} × ${v.rate}% = ${f2(expected)}, but the VAT amount is ${f2(v.taxAmount)}.`,
            V("taxAmount"),
            {
              expected: f2(expected),
              actual: f2(v.taxAmount)
            }
          );
        else if (diff >= 5e-3)
          emit(
            "BR-CO-17",
            `${f2(v.taxableAmount)} × ${v.rate}% = ${f2(expected)}; ${f2(v.taxAmount)} is within the ±1.00 tolerance of the standard but not correctly rounded.`,
            V("taxAmount"),
            {
              expected: f2(expected),
              actual: f2(v.taxAmount),
              severity: "warning"
            }
          );
      }
      const hasReason = Boolean(v.exemptionCode || v.exemptionReason);
      if ((v.category === "S" || v.category === "Z") && hasReason)
        emit(
          v.category === "S" ? "BR-S-10" : "BR-Z-10",
          `${label} has an exemption reason.`,
          V(v.exemptionCode ? "exemptionCode" : "exemptionReason")
        );
      const needReason = {
        E: "BR-E-10",
        AE: "BR-AE-10",
        K: "BR-IC-10",
        O: "BR-O-10"
      };
      const nr = v.category ? needReason[v.category] : void 0;
      if (nr && !hasReason)
        emit(nr, `${label} needs an exemption reason code or text.`, V("category"));
      if (v.category === "AE" && hasReason && v.exemptionCode !== "VATEX-EU-AE" && !/reverse charge/i.test(v.exemptionReason ?? ""))
        emit(
          "BR-AE-10",
          `${label} reason should be VATEX-EU-AE or "Reverse charge".`,
          V("exemptionReason"),
          { severity: "warning" }
        );
    }
    const used = /* @__PURE__ */ new Map();
    const addUse = (category, rate, amount, loc) => {
      if (!category || !VAT_CATEGORIES[category]) return;
      const key = `${category}|${rateKey(rate)}`;
      const cur = used.get(key) ?? { category, rate, taxable: 0, loc };
      cur.taxable = round2(cur.taxable + amount);
      used.set(key, cur);
    };
    for (const ln of m.lines)
      addUse(ln.vatCategory, ln.vatRate, ln.netAmount ?? 0, ln.loc ?? m.loc);
    for (const a of m.allowances)
      addUse(a.vatCategory, a.vatRate, -(a.amount ?? 0), a.loc ?? m.loc);
    for (const c of m.charges) addUse(c.vatCategory, c.vatRate, c.amount ?? 0, c.loc ?? m.loc);
    for (const [key, u] of used) {
      const breakdown = m.vat.find((v) => `${v.category}|${rateKey(v.rate)}` === key);
      const label = `${u.category}${u.rate !== void 0 ? ` ${u.rate}%` : ""}`;
      if (!breakdown) {
        emit(
          u.category === "S" ? "BR-S-01" : "BR-VAT-01",
          `Category ${label} is used but has no VAT breakdown.`,
          u.loc,
          {
            expected: `TaxSubtotal ${label}`
          }
        );
        continue;
      }
      if (breakdown.taxableAmount !== void 0 && !sameAmount(breakdown.taxableAmount, u.taxable))
        emit(
          u.category === "S" ? "BR-S-08" : "BR-VAT-08",
          `Lines, allowances and charges in ${label} add up to ${f2(u.taxable)}, but the taxable amount is ${f2(breakdown.taxableAmount)}.`,
          at2(breakdown.locs, "taxableAmount", breakdown.loc),
          { expected: f2(u.taxable), actual: f2(breakdown.taxableAmount) }
        );
    }
    const cats = new Set([...used.values()].map((u) => u.category));
    for (const v of m.vat) if (v.category) cats.add(v.category);
    const sellerVat = Boolean(seller.vatId || m.taxRepresentative?.vatId);
    if (cats.has("S") && !sellerVat && !seller.taxRegistrationId)
      emit(
        "BR-S-02",
        "Standard-rated items require the seller VAT number or tax registration number.",
        seller.loc
      );
    if (cats.has("AE") && (!sellerVat || !(buyer.vatId || buyer.legalId)))
      emit(
        "BR-AE-02",
        `Reverse charge requires both VAT numbers (seller: ${seller.vatId ?? "missing"}, buyer: ${buyer.vatId ?? "missing"}).`,
        buyer.vatId ? seller.loc : buyer.loc
      );
    if (cats.has("K")) {
      if (!sellerVat || !buyer.vatId)
        emit(
          "BR-IC-02",
          `Intra-community supply requires both VAT numbers (seller: ${seller.vatId ?? "missing"}, buyer: ${buyer.vatId ?? "missing"}).`,
          buyer.vatId ? seller.loc : buyer.loc
        );
      if (!m.delivery?.date && !m.hasPeriod)
        emit("BR-IC-11", "Intra-community supply needs an actual delivery date or invoice period.");
      if (!m.delivery?.address?.country)
        emit("BR-IC-12", "Intra-community supply needs a deliver-to country.", m.delivery?.loc);
    }
    if (cats.has("G") && !sellerVat)
      emit("BR-G-02", "Export invoices require the seller VAT number.", seller.loc);
    if (cats.has("O") && cats.size === 1 && (seller.vatId || buyer.vatId || m.taxRepresentative?.vatId))
      emit(
        "BR-O-02",
        "Invoices not subject to VAT must not carry VAT identifiers.",
        at2(seller.locs, "vatId", buyer.locs["vatId"])
      );
  }
  if (opts.xrechnung) {
    const s = m.seller;
    const b = m.buyer;
    if (m.paymentMeans.length === 0 || !m.paymentMeans.some((p) => p.code))
      emit("BR-DE-1", "Payment instructions (BG-16) are missing.");
    if (!s.contact) emit("BR-DE-2", "The seller contact (BG-6) is missing.", s.loc);
    if (!s.address?.city) emit("BR-DE-3", "The seller city (BT-37) is missing.", at2(s.locs, "address", s.loc));
    if (!s.address?.postalCode)
      emit("BR-DE-4", "The seller post code (BT-38) is missing.", at2(s.locs, "address", s.loc));
    if (s.contact) {
      if (!s.contact.name) emit("BR-DE-5", "The seller contact name (BT-41) is missing.", at2(s.locs, "contact", s.loc));
      if (!s.contact.phone)
        emit("BR-DE-6", "The seller contact telephone (BT-42) is missing.", at2(s.locs, "contact", s.loc));
      if (!s.contact.email)
        emit("BR-DE-7", "The seller contact email (BT-43) is missing.", at2(s.locs, "contact", s.loc));
    }
    if (!b.address?.city) emit("BR-DE-8", "The buyer city (BT-52) is missing.", at2(b.locs, "address", b.loc));
    if (!b.address?.postalCode)
      emit("BR-DE-9", "The buyer post code (BT-53) is missing.", at2(b.locs, "address", b.loc));
    if (!m.buyerReference)
      emit("BR-DE-15", "The buyer reference / Leitweg-ID (BT-10) is missing.", at2(m.locs, "buyerReference"));
    const cats = /* @__PURE__ */ new Set();
    for (const v of m.vat) if (v.category) cats.add(v.category);
    for (const ln of m.lines) if (ln.vatCategory) cats.add(ln.vatCategory);
    const needsTaxId = [...cats].some((c) => ["S", "Z", "E", "AE", "K", "G", "L", "M"].includes(c));
    if (needsTaxId && !s.vatId && !s.taxRegistrationId && !m.taxRepresentative?.vatId)
      emit("BR-DE-16", "Neither the seller VAT number nor a tax number is given.", s.loc);
    if (m.typeCode && !XRECHNUNG_TYPE_CODES.has(m.typeCode))
      emit("BR-DE-17", `Type code ${m.typeCode} is not one of the codes XRechnung expects.`, at2(m.locs, "typeCode"), {
        actual: m.typeCode
      });
    if (!m.customizationId?.includes("urn:xeinkauf.de:kosit:xrechnung_3"))
      emit(
        "BR-DE-21",
        `Specification identifier is ${m.customizationId ?? "missing"}, not XRechnung 3.0.`,
        at2(m.locs, "customizationId"),
        { expected: "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0", actual: m.customizationId }
      );
  }
  return out;
}

// src/engine/validate.ts
var SECTIONS = ["document", "header", "parties", "lines", "vat", "totals", "payment"];
function summarize(findings) {
  const counts = { error: 0, warning: 0, info: 0 };
  const sections = Object.fromEntries(
    SECTIONS.map((s) => [s, { status: "pass", errors: 0, warnings: 0 }])
  );
  for (const f of findings) {
    counts[f.severity]++;
    const s = sections[f.section];
    if (f.severity === "error") {
      s.errors++;
      s.status = "fail";
    } else if (f.severity === "warning") {
      s.warnings++;
      if (s.status === "pass") s.status = "warn";
    }
  }
  return { counts, sections };
}
function computeTotals(m) {
  const lineSum = sum(m.lines.map((l) => l.netAmount));
  const allowanceSum = sum(m.allowances.map((a) => a.amount));
  const chargeSum = sum(m.charges.map((c) => c.amount));
  const taxExclusive = round2(lineSum - allowanceSum + chargeSum);
  const groups = /* @__PURE__ */ new Map();
  const add = (category, rate, amount) => {
    if (!category) return;
    const key = `${category}|${rate ?? ""}`;
    const g = groups.get(key) ?? { category, rate, taxable: 0 };
    g.taxable = round2(g.taxable + amount);
    groups.set(key, g);
  };
  m.lines.forEach((l) => add(l.vatCategory, l.vatRate, l.netAmount ?? 0));
  m.allowances.forEach((a) => add(a.vatCategory, a.vatRate, -(a.amount ?? 0)));
  m.charges.forEach((c) => add(c.vatCategory, c.vatRate, c.amount ?? 0));
  const vat = [...groups.values()].map((g) => ({
    ...g,
    tax: g.category === "O" || g.rate === void 0 ? 0 : round2(g.taxable * g.rate / 100)
  }));
  const vatTotal = sum(vat.map((v) => v.tax));
  const taxInclusive = round2(taxExclusive + vatTotal);
  const payable = round2(taxInclusive - (m.totals.prepaid ?? 0) + (m.totals.rounding ?? 0));
  const lines = m.lines.map((l) => {
    if (l.quantity === void 0 || l.priceAmount === void 0) return { id: l.id };
    const base = l.baseQuantity && l.baseQuantity > 0 ? l.baseQuantity : 1;
    const expectedNet = round2(
      l.quantity * l.priceAmount / base + sum(l.charges.map((c) => c.amount)) - sum(l.allowances.map((a) => a.amount))
    );
    return { id: l.id, expectedNet };
  });
  return {
    lineSum,
    allowanceSum,
    chargeSum,
    taxExclusive,
    vatTotal,
    taxInclusive,
    payable,
    vat,
    lines
  };
}
function rulesApplicable(peppol, en16931, xrechnung) {
  return RULES.filter((r) => {
    if (r.source === "Peppol") return peppol;
    if (r.source === "XRechnung") return xrechnung;
    if (!en16931 && (r.section === "lines" || r.section === "vat")) return false;
    return true;
  }).length;
}
var now = () => typeof performance !== "undefined" ? performance.now() : Date.now();
function validateInvoiceXml(xml, profile = "auto") {
  const started = now();
  const sourceLines = xml.split(/\r\n|\r|\n/).length;
  const finish = (r) => ({
    version: 1,
    ...r,
    sourceLines,
    durationMs: Math.max(1, Math.round(now() - started))
  });
  let root;
  try {
    root = parseXml(xml);
  } catch (e) {
    const err = e instanceof XmlSyntaxError ? e : new XmlSyntaxError(String(e), 1, 1);
    const finding = {
      ruleId: "IV-SYN-01",
      source: "InvoiceVerify",
      severity: "error",
      section: "document",
      title: "XML is not well-formed",
      message: err.message,
      line: err.line,
      col: err.col
    };
    const { counts: counts2, sections: sections2 } = summarize([finding]);
    return finish({
      valid: false,
      format: {
        id: "unknown",
        label: "Unreadable XML",
        syntax: "unknown",
        document: "Unknown",
        en16931: false,
        peppol: false
      },
      profileApplied: "none",
      invoice: null,
      computed: null,
      findings: [finding],
      counts: counts2,
      sections: sections2,
      rulesChecked: 1,
      syntaxError: { message: err.message, line: err.line, col: err.col }
    });
  }
  const format = detectFormat(root);
  if (format.id === "unknown") {
    const finding = {
      ruleId: "IV-SYN-02",
      source: "InvoiceVerify",
      severity: "error",
      section: "document",
      title: "Unsupported document type",
      message: `Root element <${root.name}>${root.ns ? ` in namespace ${root.ns}` : " without a namespace"} is not a UBL Invoice/CreditNote or a CII CrossIndustryInvoice.`,
      line: root.line,
      col: root.col,
      xpath: `/${root.name}`
    };
    const { counts: counts2, sections: sections2 } = summarize([finding]);
    return finish({
      valid: false,
      format,
      profileApplied: "none",
      invoice: null,
      computed: null,
      findings: [finding],
      counts: counts2,
      sections: sections2,
      rulesChecked: 2
    });
  }
  const model = format.syntax === "UBL" ? readUbl(root) : readCii(root);
  const peppol = profile === "peppol" ? format.syntax === "UBL" : profile === "en16931" || profile === "xrechnung" ? false : format.peppol;
  const xrechnung = profile === "xrechnung" || profile === "auto" && (format.id === "xrechnung-ubl" || format.id === "xrechnung-cii");
  const en16931 = format.en16931;
  const findings = runRules(model, format, { peppol, en16931, xrechnung });
  const order = { error: 0, warning: 1, info: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity] || (a.line ?? 0) - (b.line ?? 0));
  const { counts, sections } = summarize(findings);
  return finish({
    valid: counts.error === 0,
    format,
    profileApplied: peppol ? "peppol" : xrechnung ? "xrechnung" : "en16931",
    invoice: model,
    computed: computeTotals(model),
    findings,
    counts,
    sections,
    rulesChecked: rulesApplicable(peppol, en16931, xrechnung)
  });
}

// src/version.ts
var TOOL_NAME = "peppol-ubl-check";
var VERSION = "1.0.1";
var SITE_URL = "https://peppol-invoice-compass.lovable.app";
var VALIDATOR_URL = `${SITE_URL}/validate`;
var TOOL_PAGE_URL = `${SITE_URL}/tools/peppol-github-action`;

// src/check.ts
var PROFILES = ["peppol", "auto", "en16931", "xrechnung"];
var FAIL_ON = ["error", "warning", "never"];
var NON_INVOICE = ["skip", "fail"];
var INVOICE_ROOTS = ["Invoice", "CreditNote", "CrossIndustryInvoice"];
function ruleCounts() {
  const counts = { total: RULES.length, EN16931: 0, Peppol: 0, XRechnung: 0, InvoiceVerify: 0 };
  for (const r of RULES) counts[r.source]++;
  return counts;
}
function ruleUrl(ruleId) {
  return RULE_INDEX[ruleId] ? `${SITE_URL}/rules/${ruleSlug(ruleId)}` : `${SITE_URL}/rules`;
}
function toFinding(f) {
  return {
    ruleId: f.ruleId,
    severity: f.severity,
    source: f.source,
    section: f.section,
    title: f.title,
    message: f.message,
    ...f.line !== void 0 ? { line: f.line } : {},
    // saxes reports column 0 at the end of a line: leave it out
    ...f.col ? { col: f.col } : {},
    ...f.xpath ? { xpath: f.xpath } : {},
    ...f.bt?.length ? { businessTerms: f.bt } : {},
    ...f.expected !== void 0 ? { expected: f.expected } : {},
    ...f.actual !== void 0 ? { actual: f.actual } : {},
    fix: RULE_INDEX[f.ruleId]?.fix ?? "",
    url: ruleUrl(f.ruleId)
  };
}
function statusOf(counts) {
  return counts.error > 0 ? "errors" : counts.warning > 0 ? "warnings" : "ok";
}
function rootLocalName(report) {
  const f = report.findings.find((x) => x.ruleId === "IV-SYN-02");
  return f?.xpath?.replace(/^\//, "").split(":").pop();
}
function checkFile(path, options) {
  const abs = (0, import_node_path.resolve)(options.cwd, path);
  const size = (0, import_node_fs.statSync)(abs).size;
  if (size > MAX_XML_BYTES) {
    const meta = RULE_INDEX["IV-SYN-01"];
    return {
      path,
      status: "errors",
      rulesChecked: 1,
      counts: { error: 1, warning: 0, info: 0 },
      findings: [
        {
          ruleId: meta.id,
          severity: "error",
          source: meta.source,
          section: meta.section,
          title: "File too large",
          message: `The file is ${(size / 1024 / 1024).toFixed(1)} MB; the check reads files up to 5 MB, the size Peppol access points commonly accept.`,
          fix: "Check that this is a single invoice. Large embedded attachments (base64 PDFs) are the usual cause; link them instead or compress them.",
          url: ruleUrl(meta.id)
        }
      ]
    };
  }
  const xml = (0, import_node_fs.readFileSync)(abs, "utf8");
  const report = validateInvoiceXml(xml, options.profile);
  const root = report.format.id === "unknown" && !report.syntaxError ? rootLocalName(report) : void 0;
  if (root !== void 0 && options.nonInvoice === "skip" && !INVOICE_ROOTS.includes(root)) {
    return {
      path,
      status: "skipped",
      skipped: `Not an invoice: the root element is <${root}>, not Invoice, CreditNote or CrossIndustryInvoice.`,
      rulesChecked: 0,
      counts: { error: 0, warning: 0, info: 0 },
      findings: []
    };
  }
  return {
    path,
    status: statusOf(report.counts),
    format: report.format.label,
    formatId: report.format.id,
    document: report.format.document,
    profileApplied: report.profileApplied,
    ...report.invoice?.number ? { invoiceNumber: report.invoice.number } : {},
    rulesChecked: report.rulesChecked,
    counts: { ...report.counts },
    findings: report.findings.map(toFinding)
  };
}
function reachesThreshold(counts, failOn) {
  if (failOn === "never") return false;
  return counts.error > 0 || failOn === "warning" && counts.warning > 0;
}
function checkFiles(paths, options) {
  const files = paths.map((p) => checkFile(p, options));
  const totals = { matched: files.length, checked: 0, ok: 0, withWarnings: 0, withErrors: 0, skipped: 0, errors: 0, warnings: 0, info: 0 };
  for (const f of files) {
    if (f.status === "skipped") {
      totals.skipped++;
      continue;
    }
    totals.checked++;
    if (f.status === "ok") totals.ok++;
    if (f.status === "warnings") totals.withWarnings++;
    if (f.status === "errors") totals.withErrors++;
    totals.errors += f.counts.error;
    totals.warnings += f.counts.warning;
    totals.info += f.counts.info;
  }
  return {
    tool: TOOL_NAME,
    version: VERSION,
    rulesAvailable: RULES.length,
    profile: options.profile,
    failOn: options.failOn,
    result: reachesThreshold({ error: totals.errors, warning: totals.warnings }, options.failOn) ? "failed" : "passed",
    totals,
    files
  };
}

// src/glob.ts
var import_node_fs2 = require("node:fs");
var import_node_path2 = require("node:path");
var SKIPPED_DIRS = ["node_modules", ".git"];
var MAX_ENTRIES = 2e5;
var SPECIAL = /[*?[\]{}]/;
function splitPatterns(raw) {
  const out = [];
  let depth = 0;
  let current = "";
  for (const ch of raw) {
    if (ch === "{") depth++;
    if (ch === "}" && depth > 0) depth--;
    if (ch === "\n" || ch === "\r" || ch === "," && depth === 0) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out.map((p) => p.trim()).filter(Boolean);
}
function expandBraces(pattern) {
  let depth = 0;
  let open = -1;
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === "{") {
      if (depth === 0) open = i;
      depth++;
    } else if (ch === "}" && depth > 0) {
      depth--;
      if (depth === 0) {
        const body = pattern.slice(open + 1, i);
        const options = splitTopLevel(body);
        const head = pattern.slice(0, open);
        const tail = pattern.slice(i + 1);
        if (options.length < 2) {
          return expandBraces(tail).map((t) => `${head}{${body}}${t}`);
        }
        const out = [];
        for (const o of options) for (const e of expandBraces(head + o + tail)) if (!out.includes(e)) out.push(e);
        if (out.length > 256) throw new Error(`The pattern "${pattern}" expands to more than 256 patterns.`);
        return out;
      }
    }
  }
  return [pattern];
}
function splitTopLevel(body) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "\\") {
      current += ch + (body[i + 1] ?? "");
      i++;
      continue;
    }
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts;
}
var escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
function segmentSource(seg) {
  let out = seg.startsWith(".") ? "" : "(?!\\.)";
  for (let i = 0; i < seg.length; i++) {
    const ch = seg[i];
    if (ch === "\\") {
      out += escapeRe(seg[i + 1] ?? "\\");
      i++;
    } else if (ch === "*") {
      while (seg[i + 1] === "*") i++;
      out += "[^/]*";
    } else if (ch === "?") {
      out += "[^/]";
    } else if (ch === "[") {
      const close = seg.indexOf("]", i + 2);
      if (close === -1) {
        out += "\\[";
        continue;
      }
      let cls = seg.slice(i + 1, close);
      const negate = cls.startsWith("!") || cls.startsWith("^");
      if (negate) cls = cls.slice(1);
      out += `[${negate ? "^/" : ""}${cls.replace(/\\/g, "\\\\").replace(/\]/g, "\\]")}]`;
      i = close;
    } else {
      out += escapeRe(ch);
    }
  }
  return out;
}
function patternToRegExp(pattern) {
  const segments = normalisePattern(pattern).split("/");
  let src = "^";
  segments.forEach((seg, i) => {
    const last = i === segments.length - 1;
    if (seg === "**") {
      src += last ? "(?:(?!\\.)[^/]+)(?:/(?!\\.)[^/]+)*" : "(?:(?!\\.)[^/]+/)*";
      return;
    }
    src += segmentSource(seg) + (last ? "" : "/");
  });
  return new RegExp(`${src}$`);
}
function normalisePattern(pattern) {
  let p = pattern.trim().replace(/\\(?![*?[\]{}!\\])/g, "/");
  while (p.startsWith("./")) p = p.slice(2);
  p = p.replace(/\/{2,}/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}
function staticBase(pattern) {
  const segments = normalisePattern(pattern).split("/");
  const base = [];
  for (const seg of segments.slice(0, -1)) {
    if (SPECIAL.test(seg)) break;
    base.push(seg);
  }
  return base.join("/");
}
var toPosix = (p) => p.split(import_node_path2.sep).join("/");
function compile(pattern, cwd) {
  let p = pattern;
  if ((0, import_node_path2.isAbsolute)(p)) p = toPosix((0, import_node_path2.relative)(cwd, p)) || ".";
  return expandBraces(normalisePattern(p)).map((e) => {
    const n = normalisePattern(e);
    return { regex: patternToRegExp(n), base: staticBase(n), dots: /(^|\/)\.[^./]/.test(n) };
  });
}
function findFiles(patterns, options) {
  const cwd = (0, import_node_path2.resolve)(options.cwd);
  const max = options.maxEntries ?? MAX_ENTRIES;
  const include = [];
  const exclude = [];
  const literal = /* @__PURE__ */ new Set();
  const excluded = (rel) => exclude.some((r) => r.test(rel));
  for (const raw of [...patterns, ...(options.ignore ?? []).map((i) => `!${i.replace(/^!/, "")}`)]) {
    const negated = raw.startsWith("!");
    const pattern = negated ? raw.slice(1) : raw;
    if (!pattern.trim()) continue;
    if (negated) {
      for (const c of compile(pattern, cwd)) {
        exclude.push(c.regex);
        exclude.push(new RegExp(c.regex.source.replace(/\$$/, "/.*$")));
      }
      continue;
    }
    for (const c of compile(pattern, cwd)) {
      const text2 = normalisePattern(pattern);
      if (!SPECIAL.test(text2) && expandBraces(text2).length === 1) {
        const abs = (0, import_node_path2.resolve)(cwd, text2);
        if ((0, import_node_fs2.existsSync)(abs) && (0, import_node_fs2.statSync)(abs).isDirectory()) {
          const folder = toPosix((0, import_node_path2.relative)(cwd, abs));
          include.push(...compile(folder ? `${folder}/**/*.xml` : "**/*.xml", cwd));
        } else {
          literal.add(toPosix((0, import_node_path2.relative)(cwd, abs)));
        }
        continue;
      }
      include.push(c);
    }
  }
  const found = /* @__PURE__ */ new Set();
  for (const l of literal) {
    const abs = (0, import_node_path2.resolve)(cwd, l);
    if ((0, import_node_fs2.existsSync)(abs) && (0, import_node_fs2.statSync)(abs).isFile() && !excluded(l)) found.add(l);
  }
  let seen = 0;
  const walked = /* @__PURE__ */ new Set();
  for (const c of include) {
    const startRel = c.base;
    const startAbs = (0, import_node_path2.resolve)(cwd, startRel);
    const key = `${startAbs}|${c.dots}`;
    const matchers = include.filter((x) => x.base === c.base && x.dots === c.dots);
    if (walked.has(key)) continue;
    walked.add(key);
    if (!(0, import_node_fs2.existsSync)(startAbs) || !(0, import_node_fs2.statSync)(startAbs).isDirectory()) continue;
    const stack = [startAbs];
    while (stack.length) {
      const dir = stack.pop();
      let entries;
      try {
        entries = (0, import_node_fs2.readdirSync)(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (++seen > max) throw new Error(`Stopped after looking at ${max} files and folders. Narrow the pattern (for example "invoices/**/*.xml").`);
        const abs = (0, import_node_path2.join)(dir, entry.name);
        const rel = toPosix((0, import_node_path2.relative)(cwd, abs));
        if (entry.isDirectory()) {
          if (SKIPPED_DIRS.includes(entry.name)) continue;
          if (entry.name.startsWith(".") && !c.dots) continue;
          if (excluded(rel)) continue;
          stack.push(abs);
          continue;
        }
        let isFile = entry.isFile();
        if (entry.isSymbolicLink()) {
          try {
            isFile = (0, import_node_fs2.statSync)(abs).isFile();
          } catch {
            isFile = false;
          }
        }
        if (!isFile) continue;
        if (matchers.some((m) => m.regex.test(rel)) && !excluded(rel)) found.add(rel);
      }
    }
  }
  return [...found].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
}

// src/report.ts
var ICON = { error: "❌", warning: "⚠️", info: "ℹ️" };
var STATUS = {
  ok: "✅ OK",
  warnings: "⚠️ Warnings",
  errors: "❌ Errors",
  skipped: "⏭️ Skipped"
};
function cell(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}
function code(path) {
  const clean = path.replace(/\|/g, "\\|").replace(/`/g, "'");
  return `\`${clean}\``;
}
var plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
function headline(r) {
  const t = r.totals;
  if (t.checked === 0) return "No invoices checked";
  const bad = t.withErrors;
  if (bad > 0) return `${bad} of ${plural(t.checked, "invoice")} ${bad === 1 ? "has" : "have"} errors`;
  if (t.withWarnings > 0) return `${plural(t.checked, "invoice")} checked, ${t.withWarnings} with warnings`;
  return t.checked === 1 ? "1 invoice checked, no errors" : `${t.checked} invoices checked, no errors`;
}
function coverageNote() {
  const c = ruleCounts();
  return `Checked offline with InvoiceVerify's ${c.total} rules (${c.EN16931} EN 16931, ${c.Peppol} Peppol BIS Billing 3.0, ${c.XRechnung} XRechnung, ${c.InvoiceVerify} extra checks for tax IDs, IBANs and syntax): a partial version of the official Schematron rule sets, without XSD schema validation or PDF/A checks. Nothing was sent anywhere.`;
}
function findingRow(f) {
  const rule = `[${cell(f.ruleId)}](${f.url})`;
  const where = f.line !== void 0 ? String(f.line) : "–";
  const what = `**${cell(f.title)}.** ${cell(f.message)}`;
  return `| ${ICON[f.severity]} | ${rule} | ${where} | ${what} | ${cell(f.fix) || "See the rule page."} |`;
}
function fileSection(f, max) {
  const head = `### ${STATUS[f.status].split(" ")[0]} ${code(f.path)}`;
  const facts = [
    f.invoiceNumber ? `${f.document === "Credit note" ? "Credit note" : "Invoice"} **${cell(f.invoiceNumber)}**` : void 0,
    f.format ? cell(f.format) : void 0,
    f.rulesChecked ? `${f.rulesChecked} rules checked` : void 0
  ].filter(Boolean);
  const rows = f.findings.slice(0, max).map(findingRow);
  const more = f.findings.length > max ? `

…and ${f.findings.length - max} more in the JSON report (\`json-file\`).` : "";
  return [
    head,
    "",
    facts.join(" · "),
    "",
    "| | Rule | Line | What's wrong | How to fix |",
    "| --- | --- | ---: | --- | --- |",
    ...rows
  ].join("\n") + more;
}
function summaryMarkdown(r, options = {}) {
  const maxFindings = options.maxFindingsPerFile ?? 50;
  const maxFiles = options.maxFiles ?? 200;
  const maxChars = options.maxChars ?? 9e5;
  const failed = r.result === "failed";
  const icon = r.totals.checked === 0 ? "⚠️" : failed ? "❌" : r.totals.withErrors || r.totals.withWarnings ? "⚠️" : "✅";
  const out = [`## ${icon} Peppol UBL check: ${headline(r)}`, ""];
  const checked = r.files.filter((f) => f.status !== "skipped");
  const skipped = r.files.filter((f) => f.status === "skipped");
  if (checked.length) {
    out.push("| Invoice file | Format | Errors | Warnings | Result |", "| --- | --- | ---: | ---: | --- |");
    for (const f of checked.slice(0, maxFiles))
      out.push(`| ${code(f.path)} | ${cell(f.format ?? "–")} | ${f.counts.error} | ${f.counts.warning} | ${STATUS[f.status]} |`);
    if (checked.length > maxFiles) out.push("", `…and ${checked.length - maxFiles} more files in the JSON report (\`json-file\`).`);
    out.push("");
  }
  let size = out.join("\n").length;
  let cut = 0;
  for (const f of checked.filter((x) => x.findings.length > 0)) {
    const section = fileSection(f, maxFindings);
    if (size + section.length > maxChars) {
      cut++;
      continue;
    }
    out.push(section, "");
    size += section.length + 1;
  }
  if (cut) out.push(`Findings for ${plural(cut, "more file")} left out to stay within GitHub's summary size; the JSON report (\`json-file\`) has them all.`, "");
  if (skipped.length) {
    out.push(
      `<details><summary>${plural(skipped.length, "file")} skipped: not an invoice</summary>`,
      "",
      ...skipped.slice(0, maxFiles).map((f) => `- ${code(f.path)}: ${cell(f.skipped ?? "skipped")}`),
      "",
      "</details>",
      ""
    );
  }
  out.push(
    "---",
    "",
    coverageNote(),
    "",
    `For a visual report of one invoice (header, parties, lines, VAT breakdown, with the lines highlighted), drop the file into the [InvoiceVerify validator](${VALIDATOR_URL}). Each rule ID above links to its explanation.`,
    "",
    `<sub>[${TOOL_NAME}](${TOOL_PAGE_URL}) ${VERSION} · MIT · by Kalmwerk</sub>`,
    ""
  );
  return out.join("\n");
}
function annotations(r, max = 50) {
  const all2 = [];
  for (const f of r.files) {
    for (const x of f.findings) {
      const a = {
        level: x.severity === "info" ? "notice" : x.severity,
        title: `${x.ruleId}: ${x.title}`,
        message: x.fix ? `${x.message}
How to fix: ${x.fix}` : x.message,
        file: f.path
      };
      if (x.line !== void 0) a.line = x.line;
      if (x.col !== void 0) a.col = x.col;
      all2.push(a);
    }
  }
  const order = { error: 0, warning: 1, notice: 2 };
  return all2.sort((a, b) => order[a.level] - order[b.level]).slice(0, max);
}
var ANSI = { red: "\x1B[31m", yellow: "\x1B[33m", green: "\x1B[32m", dim: "\x1B[2m", bold: "\x1B[1m", reset: "\x1B[0m" };
function textReport(r, options = {}) {
  const c = (code2, s) => options.color ? `${ANSI[code2]}${s}${ANSI.reset}` : s;
  const lines = [];
  const mark = { ok: c("green", "PASS"), warnings: c("yellow", "WARN"), errors: c("red", "FAIL"), skipped: c("dim", "SKIP") };
  for (const f of r.files) {
    const detail = f.status === "skipped" ? c("dim", f.skipped ?? "") : c("dim", [f.format, plural(f.counts.error, "error"), plural(f.counts.warning, "warning")].filter(Boolean).join(" · "));
    lines.push(`${mark[f.status]} ${f.path}  ${detail}`);
    if (options.quiet) continue;
    for (const x of f.findings) {
      const sev = x.severity === "error" ? c("red", "error  ") : x.severity === "warning" ? c("yellow", "warning") : c("dim", "info   ");
      const at2 = x.line !== void 0 ? `${f.path}:${x.line}${x.col !== void 0 ? `:${x.col}` : ""}` : f.path;
      lines.push(`  ${sev} ${c("bold", x.ruleId)} ${x.title}  ${c("dim", at2)}`);
      lines.push(`          ${x.message}`);
      if (x.fix) lines.push(`          ${c("dim", `Fix: ${x.fix}`)}`);
      lines.push(`          ${c("dim", x.url)}`);
    }
  }
  if (r.files.length) lines.push("");
  const t = r.totals;
  const verdict = r.result === "failed" ? c("red", headline(r)) : t.withWarnings ? c("yellow", headline(r)) : c("green", headline(r));
  lines.push(
    `${verdict} (${plural(t.errors, "error")}, ${plural(t.warnings, "warning")}${t.skipped ? `, ${t.skipped} skipped` : ""}).`
  );
  return lines.join("\n");
}

// src/toolkit.ts
var import_node_crypto = require("node:crypto");
var import_node_fs3 = require("node:fs");
var import_node_os = require("node:os");
function getInput(name, env = process.env) {
  return (env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] ?? "").trim();
}
var TRUE = ["true", "True", "TRUE"];
var FALSE = ["false", "False", "FALSE"];
function getBooleanInput(name, fallback, env = process.env) {
  const raw = getInput(name, env);
  if (!raw) return fallback;
  if (TRUE.includes(raw)) return true;
  if (FALSE.includes(raw)) return false;
  throw new Error(`Input "${name}" must be true or false, not "${raw}".`);
}
function getChoiceInput(name, choices, fallback, env = process.env) {
  const raw = getInput(name, env).toLowerCase();
  if (!raw) return fallback;
  const hit = choices.find((c) => c === raw);
  if (!hit) throw new Error(`Input "${name}" must be one of ${choices.join(", ")}, not "${raw}".`);
  return hit;
}
function escapeData(s) {
  return s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}
function escapeProperty(s) {
  return escapeData(s).replace(/:/g, "%3A").replace(/,/g, "%2C");
}
function formatCommand(command, message, props = {}) {
  const entries = Object.entries(props).filter(([, v]) => v !== void 0 && v !== "");
  const params = entries.length ? ` ${entries.map(([k, v]) => `${k}=${escapeProperty(String(v))}`).join(",")}` : "";
  return `::${command}${params}::${escapeData(message)}`;
}
var write = (line) => process.stdout.write(line + import_node_os.EOL);
var log = {
  info: (message) => write(message),
  debug: (message) => write(formatCommand("debug", message)),
  notice: (message, props) => write(formatCommand("notice", message, props)),
  warning: (message, props) => write(formatCommand("warning", message, props)),
  error: (message, props) => write(formatCommand("error", message, props)),
  group: (title) => write(`::group::${escapeData(title)}`),
  endGroup: () => write("::endgroup::")
};
function formatOutput(name, value, delimiter = `ghadelimiter_${(0, import_node_crypto.randomUUID)()}`) {
  if (name.includes(delimiter) || value.includes(delimiter)) throw new Error(`Output "${name}" contains its own delimiter.`);
  return `${name}<<${delimiter}${import_node_os.EOL}${value}${import_node_os.EOL}${delimiter}${import_node_os.EOL}`;
}
function setOutput(name, value, env = process.env) {
  const file = env["GITHUB_OUTPUT"];
  if (!file) {
    log.debug(`output ${name}=${String(value).slice(0, 200)}`);
    return;
  }
  (0, import_node_fs3.appendFileSync)(file, formatOutput(name, String(value)), "utf8");
}
function appendSummary(markdown, env = process.env) {
  const file = env["GITHUB_STEP_SUMMARY"];
  if (!file) return false;
  (0, import_node_fs3.appendFileSync)(file, markdown.endsWith("\n") ? markdown : markdown + import_node_os.EOL, "utf8");
  return true;
}

// src/action.ts
var DEFAULT_FILES = "**/*.xml";
var IF_NO_FILES = ["error", "warn", "ignore"];
function runAction(env = process.env) {
  try {
    const cwd = env["GITHUB_WORKSPACE"]?.trim() || process.cwd();
    const listed = splitPatterns(getInput("files", env));
    const patterns = listed.length ? listed : [DEFAULT_FILES];
    const ignore = splitPatterns(getInput("ignore", env));
    const profile = getChoiceInput("profile", PROFILES, "peppol", env);
    const failOn = getChoiceInput("fail-on", FAIL_ON, "error", env);
    const nonInvoice = getChoiceInput("non-invoice", NON_INVOICE, "skip", env);
    const ifNone = getChoiceInput("if-no-files-found", IF_NO_FILES, "error", env);
    const jsonFile = getInput("json-file", env);
    const summary = getBooleanInput("summary", true, env);
    const annotate = getBooleanInput("annotations", true, env);
    const paths = findFiles(patterns, { cwd, ignore });
    const result = checkFiles(paths, { cwd, profile, failOn, nonInvoice });
    log.group(`Peppol UBL check ${VERSION}: ${paths.length} matching ${paths.length === 1 ? "file" : "files"} (${patterns.join(", ")})`);
    for (const line of textReport(result).split("\n")) log.info(line);
    log.endGroup();
    if (annotate) {
      for (const a of annotations(result)) {
        const props = { title: a.title, file: a.file, ...a.line !== void 0 ? { line: a.line } : {}, ...a.col !== void 0 ? { col: a.col } : {} };
        log[a.level](a.message, props);
      }
    }
    let exit = 0;
    if (result.totals.checked === 0) {
      const why = paths.length ? `${paths.length} matching ${paths.length === 1 ? "file isn't an invoice" : "files, none of them an invoice"}` : `nothing matches ${patterns.map((p) => `"${p}"`).join(", ")}`;
      const message = `No invoices found: ${why}. Set "files" to where your invoices are, e.g. "invoices/**/*.xml".`;
      if (ifNone === "error") {
        log.error(message);
        exit = 1;
      } else if (ifNone === "warn") log.warning(message);
      else log.info(message);
    }
    if (summary) appendSummary(summaryMarkdown(result), env);
    let jsonPath = "";
    if (jsonFile) {
      jsonPath = (0, import_node_path3.resolve)(cwd, jsonFile);
      (0, import_node_fs4.mkdirSync)((0, import_node_path3.dirname)(jsonPath), { recursive: true });
      (0, import_node_fs4.writeFileSync)(jsonPath, `${JSON.stringify(result, null, 2)}
`, "utf8");
    }
    const t = result.totals;
    setOutput("result", result.result, env);
    setOutput("checked", t.checked, env);
    setOutput("failed", t.withErrors + (failOn === "warning" ? t.withWarnings : 0), env);
    setOutput("errors", t.errors, env);
    setOutput("warnings", t.warnings, env);
    setOutput("skipped", t.skipped, env);
    setOutput("json-file", jsonPath, env);
    if (result.result === "failed") {
      log.error(`${headline(result)}. The job summary lists each problem with how to fix it.`);
      exit = 1;
    } else if (t.checked > 0) {
      log.info(`${headline(result)}.`);
    }
    return exit;
  } catch (e) {
    log.error(e instanceof Error ? e.message : String(e));
    return 1;
  }
}

// src/main.ts
process.exitCode = runAction(process.env);
