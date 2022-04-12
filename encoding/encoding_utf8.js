// see https://github.com/inexorabletash/text-encoding/blob/master/lib/encoding-indexes.js
// If we're in node require encoding-indexes and attach it to the global.
// if (typeof module !== "undefined" && module.exports &&
//   !global["encoding-indexes"]) {
//   global["encoding-indexes"] =
//     require("./encoding-indexes.js")["encoding-indexes"];
// }
//
// Utilities
//
/**
 * @param {number} a The number to test.
 * @param {number} min The minimum value in the range, inclusive.
 * @param {number} max The maximum value in the range, inclusive.
 * @return {boolean} True if a >= min and a <= max.
 */
function inRange(a, min, max) {
    return min <= a && a <= max;
}

/**
 * @param {!Array.<*>} array The array to check.
 * @param {*} item The item to look for in the array.
 * @return {boolean} True if the item appears in the array.
 */
function includes(array, item) {
    return array.indexOf(item) !== -1;
}

var floor = Math.floor;

/**
 * @param {*} o
 * @return {Object}
 */
function ToDictionary(o) {
    if (o === undefined) return {};
    if (o === Object(o)) return o;
    throw TypeError('Could not convert argument to dictionary');
}

/**
 * @param {string} string Input string of UTF-16 code units.
 * @return {!Array.<number>} Code points.
 */
function stringToCodePoints(string) {
    // https://heycam.github.io/webidl/#dfn-obtain-unicode

    // 1. Let S be the DOMString value.
    var s = String(string);

    // 2. Let n be the length of S.
    var n = s.length;

    // 3. Initialize i to 0.
    var i = 0;

    // 4. Initialize U to be an empty sequence of Unicode characters.
    var u = [];

    // 5. While i < n:
    while (i < n) {

        // 1. Let c be the code unit in S at index i.
        var c = s.charCodeAt(i);

        // 2. Depending on the value of c:

        // c < 0xD800 or c > 0xDFFF
        if (c < 0xD800 || c > 0xDFFF) {
            // Append to U the Unicode character with code point c.
            u.push(c);
        }

        // 0xDC00 ≤ c ≤ 0xDFFF
        else if (0xDC00 <= c && c <= 0xDFFF) {
            // Append to U a U+FFFD REPLACEMENT CHARACTER.
            u.push(0xFFFD);
        }

        // 0xD800 ≤ c ≤ 0xDBFF
        else if (0xD800 <= c && c <= 0xDBFF) {
            // 1. If i = n−1, then append to U a U+FFFD REPLACEMENT
            // CHARACTER.
            if (i === n - 1) {
                u.push(0xFFFD);
            }
            // 2. Otherwise, i < n−1:
            else {
                // 1. Let d be the code unit in S at index i+1.
                var d = s.charCodeAt(i + 1);

                // 2. If 0xDC00 ≤ d ≤ 0xDFFF, then:
                if (0xDC00 <= d && d <= 0xDFFF) {
                    // 1. Let a be c & 0x3FF.
                    var a = c & 0x3FF;

                    // 2. Let b be d & 0x3FF.
                    var b = d & 0x3FF;

                    // 3. Append to U the Unicode character with code point
                    // 2^16+2^10*a+b.
                    u.push(0x10000 + (a << 10) + b);

                    // 4. Set i to i+1.
                    i += 1;
                }

                // 3. Otherwise, d < 0xDC00 or d > 0xDFFF. Append to U a
                // U+FFFD REPLACEMENT CHARACTER.
                else {
                    u.push(0xFFFD);
                }
            }
        }

        // 3. Set i to i+1.
        i += 1;
    }

    // 6. Return U.
    return u;
}

/**
 * @param {!Array.<number>} code_points Array of code points.
 * @return {string} string String of UTF-16 code units.
 */
function codePointsToString(code_points) {
    var s = '';
    for (var i = 0; i < code_points.length; ++i) {
        var cp = code_points[i];
        if (cp <= 0xFFFF) {
            s += String.fromCharCode(cp);
        } else {
            cp -= 0x10000;
            s += String.fromCharCode((cp >> 10) + 0xD800, (cp & 0x3FF) + 0xDC00);
        }
    }
    return s;
}


//
// Implementation of Encoding specification
// https://encoding.spec.whatwg.org/
//

//
// 4. Terminology
//

/**
 * An ASCII byte is a byte in the range 0x00 to 0x7F, inclusive.
 * @param {number} a The number to test.
 * @return {boolean} True if a is in the range 0x00 to 0x7F, inclusive.
 */
function isASCIIByte(a) {
    return 0x00 <= a && a <= 0x7F;
}

/**
 * An ASCII code point is a code point in the range U+0000 to
 * U+007F, inclusive.
 */
var isASCIICodePoint = isASCIIByte;


/**
 * End-of-stream is a special token that signifies no more tokens
 * are in the stream.
 * @const
 */
var end_of_stream = -1;

/**
 * A stream represents an ordered sequence of tokens.
 *
 * @constructor
 * @param {!(Array.<number>|Uint8Array)} tokens Array of tokens that provide
 * the stream.
 */
function Stream(tokens) {
    /** @type {!Array.<number>} */
    this.tokens = [].slice.call(tokens);
    // Reversed as push/pop is more efficient than shift/unshift.
    this.tokens.reverse();
}

Stream.prototype = {
    /**
     * @return {boolean} True if end-of-stream has been hit.
     */
    endOfStream: function () {
            return !this.tokens.length;
        },

        /**
         * When a token is read from a stream, the first token in the
         * stream must be returned and subsequently removed, and
         * end-of-stream must be returned otherwise.
         *
         * @return {number} Get the next token from the stream, or
         * end_of_stream.
         */
        read: function () {
            if (!this.tokens.length)
                return end_of_stream;
            return this.tokens.pop();
        },

        /**
         * When one or more tokens are prepended to a stream, those tokens
         * must be inserted, in given order, before the first token in the
         * stream.
         *
         * @param {(number|!Array.<number>)} token The token(s) to prepend to the
         * stream.
         */
        prepend: function (token) {
            if (Array.isArray(token)) {
                var tokens = /**@type {!Array.<number>}*/ (token);
                while (tokens.length)
                    this.tokens.push(tokens.pop());
            } else {
                this.tokens.push(token);
            }
        },

        /**
         * When one or more tokens are pushed to a stream, those tokens
         * must be inserted, in given order, after the last token in the
         * stream.
         *
         * @param {(number|!Array.<number>)} token The tokens(s) to push to the
         * stream.
         */
        push: function (token) {
            if (Array.isArray(token)) {
                var tokens = /**@type {!Array.<number>}*/ (token);
                while (tokens.length)
                    this.tokens.unshift(tokens.shift());
            } else {
                this.tokens.unshift(token);
            }
        }
};

//
// 5. Encodings
//

// 5.1 Encoders and decoders

/** @const */
var finished = -1;

/**
 * @param {boolean} fatal If true, decoding errors raise an exception.
 * @param {number=} opt_code_point Override the standard fallback code point.
 * @return {number} The code point to insert on a decoding error.
 */
function decoderError(fatal, opt_code_point) {
    if (fatal)
        throw TypeError('Decoder error');
    return opt_code_point || 0xFFFD;
}

/**
 * @param {number} code_point The code point that could not be encoded.
 * @return {number} Always throws, no value is actually returned.
 */
function encoderError(code_point) {
    throw TypeError('The code point ' + code_point + ' could not be encoded.');
}

/** @interface */
function Decoder() {}
Decoder.prototype = {
    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point, or |finished|.
     */
    handler: function (stream, bite) {}
};

/** @interface */
function Encoder() {}
Encoder.prototype = {
    /**
     * @param {Stream} stream The stream of code points being encoded.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit, or |finished|.
     */
    handler: function (stream, code_point) {}
};

// 5.2 Names and labels

// TODO: Define @typedef for Encoding: {name:string,labels:Array.<string>}
// https://github.com/google/closure-compiler/issues/247

/**
 * @param {string} label The encoding label.
 * @return {?{name:string,labels:Array.<string>}}
 */
function getEncoding(label) {
    // 1. Remove any leading and trailing ASCII whitespace from label.
    label = String(label).trim().toLowerCase();

    // 2. If label is an ASCII case-insensitive match for any of the
    // labels listed in the table below, return the corresponding
    // encoding, and failure otherwise.
    if (Object.prototype.hasOwnProperty.call(label_to_encoding, label)) {
        return label_to_encoding[label];
    }
    return null;
}

/**
 * Encodings table: https://encoding.spec.whatwg.org/encodings.json
 * @const
 * @type {!Array.<{
 *          heading: string,
 *          encodings: Array.<{name:string,labels:Array.<string>}>
 *        }>}
 */
var encodings = [{
    "encodings": [{
        "labels": [
            "unicode-1-1-utf-8",
            "utf-8",
            "utf8"
        ],
        "name": "UTF-8"
    }],
    "heading": "The Encoding"
}, ];

// Label to encoding registry.
/** @type {Object.<string,{name:string,labels:Array.<string>}>} */
var label_to_encoding = {};
encodings.forEach(function (category) {
    category.encodings.forEach(function (encoding) {
        encoding.labels.forEach(function (label) {
            label_to_encoding[label] = encoding;
        });
    });
});

// Registry of of encoder/decoder factories, by encoding name.
/** @type {Object.<string, function({fatal:boolean}): Encoder>} */
var encoders = {};
/** @type {Object.<string, function({fatal:boolean}): Decoder>} */
var decoders = {};

//
// 6. Indexes
//

/**
 * @param {number} pointer The |pointer| to search for.
 * @param {(!Array.<?number>|undefined)} index The |index| to search within.
 * @return {?number} The code point corresponding to |pointer| in |index|,
 *     or null if |code point| is not in |index|.
 */
function indexCodePointFor(pointer, index) {
    if (!index) return null;
    return index[pointer] || null;
}

/**
 * @param {number} code_point The |code point| to search for.
 * @param {!Array.<?number>} index The |index| to search within.
 * @return {?number} The first pointer corresponding to |code point| in
 *     |index|, or null if |code point| is not in |index|.
 */
function indexPointerFor(code_point, index) {
    var pointer = index.indexOf(code_point);
    return pointer === -1 ? null : pointer;
}

/**
 * @param {string} name Name of the index.
 * @return {(!Array.<number>|!Array.<Array.<number>>)}
 *  */
function index(name) {
    if (!('encoding-indexes' in global)) {
        throw Error("Indexes missing." +
            " Did you forget to include encoding-indexes.js first?");
    }
    return global['encoding-indexes'][name];
}

/**
 * @param {number} pointer The |pointer| to search for in the gb18030 index.
 * @return {?number} The code point corresponding to |pointer| in |index|,
 *     or null if |code point| is not in the gb18030 index.
 */
function indexGB18030RangesCodePointFor(pointer) {
    // 1. If pointer is greater than 39419 and less than 189000, or
    // pointer is greater than 1237575, return null.
    if ((pointer > 39419 && pointer < 189000) || (pointer > 1237575))
        return null;

    // 2. If pointer is 7457, return code point U+E7C7.
    if (pointer === 7457) return 0xE7C7;

    // 3. Let offset be the last pointer in index gb18030 ranges that
    // is equal to or less than pointer and let code point offset be
    // its corresponding code point.
    var offset = 0;
    var code_point_offset = 0;
    var idx = index('gb18030-ranges');
    var i;
    for (i = 0; i < idx.length; ++i) {
        /** @type {!Array.<number>} */
        var entry = idx[i];
        if (entry[0] <= pointer) {
            offset = entry[0];
            code_point_offset = entry[1];
        } else {
            break;
        }
    }

    // 4. Return a code point whose value is code point offset +
    // pointer − offset.
    return code_point_offset + pointer - offset;
}

/**
 * @param {number} code_point The |code point| to locate in the gb18030 index.
 * @return {number} The first pointer corresponding to |code point| in the
 *     gb18030 index.
 */
function indexGB18030RangesPointerFor(code_point) {
    // 1. If code point is U+E7C7, return pointer 7457.
    if (code_point === 0xE7C7) return 7457;

    // 2. Let offset be the last code point in index gb18030 ranges
    // that is equal to or less than code point and let pointer offset
    // be its corresponding pointer.
    var offset = 0;
    var pointer_offset = 0;
    var idx = index('gb18030-ranges');
    var i;
    for (i = 0; i < idx.length; ++i) {
        /** @type {!Array.<number>} */
        var entry = idx[i];
        if (entry[1] <= code_point) {
            offset = entry[1];
            pointer_offset = entry[0];
        } else {
            break;
        }
    }

    // 3. Return a pointer whose value is pointer offset + code point
    // − offset.
    return pointer_offset + code_point - offset;
}

/**
 * @param {number} code_point The |code_point| to search for in the Shift_JIS
 *     index.
 * @return {?number} The code point corresponding to |pointer| in |index|,
 *     or null if |code point| is not in the Shift_JIS index.
 */
function indexShiftJISPointerFor(code_point) {
    // 1. Let index be index jis0208 excluding all entries whose
    // pointer is in the range 8272 to 8835, inclusive.
    shift_jis_index = shift_jis_index ||
        index('jis0208').map(function (code_point, pointer) {
            return inRange(pointer, 8272, 8835) ? null : code_point;
        });
    var index_ = shift_jis_index;

    // 2. Return the index pointer for code point in index.
    return index_.indexOf(code_point);
}
var shift_jis_index;

/**
 * @param {number} code_point The |code_point| to search for in the big5
 *     index.
 * @return {?number} The code point corresponding to |pointer| in |index|,
 *     or null if |code point| is not in the big5 index.
 */
function indexBig5PointerFor(code_point) {
    // 1. Let index be index Big5 excluding all entries whose pointer
    big5_index_no_hkscs = big5_index_no_hkscs ||
        index('big5').map(function (code_point, pointer) {
            return (pointer < (0xA1 - 0x81) * 157) ? null : code_point;
        });
    var index_ = big5_index_no_hkscs;

    // 2. If code point is U+2550, U+255E, U+2561, U+256A, U+5341, or
    // U+5345, return the last pointer corresponding to code point in
    // index.
    if (code_point === 0x2550 || code_point === 0x255E ||
        code_point === 0x2561 || code_point === 0x256A ||
        code_point === 0x5341 || code_point === 0x5345) {
        return index_.lastIndexOf(code_point);
    }

    // 3. Return the index pointer for code point in index.
    return indexPointerFor(code_point, index_);
}
var big5_index_no_hkscs;

//
// 8. API
//

/** @const */
var DEFAULT_ENCODING = 'utf-8';

// 8.1 Interface TextDecoder

/**
 * @constructor
 * @param {string=} label The label of the encoding;
 *     defaults to 'utf-8'.
 * @param {Object=} options
 */
function TextDecoder(label, options) {
    // Web IDL conventions
    if (!(this instanceof TextDecoder))
        throw TypeError('Called as a function. Did you forget \'new\'?');
    label = label !== undefined ? String(label) : DEFAULT_ENCODING;
    options = ToDictionary(options);

    // A TextDecoder object has an associated encoding, decoder,
    // stream, ignore BOM flag (initially unset), BOM seen flag
    // (initially unset), error mode (initially replacement), and do
    // not flush flag (initially unset).

    /** @private */
    this._encoding = null;
    /** @private @type {?Decoder} */
    this._decoder = null;
    /** @private @type {boolean} */
    this._ignoreBOM = false;
    /** @private @type {boolean} */
    this._BOMseen = false;
    /** @private @type {string} */
    this._error_mode = 'replacement';
    /** @private @type {boolean} */
    this._do_not_flush = false;


    // 1. Let encoding be the result of getting an encoding from
    // label.
    var encoding = getEncoding(label);

    // 2. If encoding is failure or replacement, throw a RangeError.
    if (encoding === null || encoding.name === 'replacement')
        throw RangeError('Unknown encoding: ' + label);
    if (!decoders[encoding.name]) {
        throw Error('Decoder not present.' +
            ' Did you forget to include encoding-indexes.js first?');
    }

    // 3. Let dec be a new TextDecoder object.
    var dec = this;

    // 4. Set dec's encoding to encoding.
    dec._encoding = encoding;

    // 5. If options's fatal member is true, set dec's error mode to
    // fatal.
    if (Boolean(options['fatal']))
        dec._error_mode = 'fatal';

    // 6. If options's ignoreBOM member is true, set dec's ignore BOM
    // flag.
    if (Boolean(options['ignoreBOM']))
        dec._ignoreBOM = true;

    // For pre-ES5 runtimes:
    if (!Object.defineProperty) {
        this.encoding = dec._encoding.name.toLowerCase();
        this.fatal = dec._error_mode === 'fatal';
        this.ignoreBOM = dec._ignoreBOM;
    }

    // 7. Return dec.
    return dec;
}

if (Object.defineProperty) {
    // The encoding attribute's getter must return encoding's name.
    Object.defineProperty(TextDecoder.prototype, 'encoding', {
        /** @this {TextDecoder} */
        get: function () {
            return this._encoding.name.toLowerCase();
        }
    });

    // The fatal attribute's getter must return true if error mode
    // is fatal, and false otherwise.
    Object.defineProperty(TextDecoder.prototype, 'fatal', {
        /** @this {TextDecoder} */
        get: function () {
            return this._error_mode === 'fatal';
        }
    });

    // The ignoreBOM attribute's getter must return true if ignore
    // BOM flag is set, and false otherwise.
    Object.defineProperty(TextDecoder.prototype, 'ignoreBOM', {
        /** @this {TextDecoder} */
        get: function () {
            return this._ignoreBOM;
        }
    });
}

/**
 * @param {BufferSource=} input The buffer of bytes to decode.
 * @param {Object=} options
 * @return {string} The decoded string.
 */
TextDecoder.prototype.decode = function decode(input, options) {
    var bytes;
    if (typeof input === 'object' && input instanceof ArrayBuffer) {
        bytes = new Uint8Array(input);
    } else if (typeof input === 'object' && 'buffer' in input &&
        input.buffer instanceof ArrayBuffer) {
        bytes = new Uint8Array(input.buffer,
            input.byteOffset,
            input.byteLength);
    } else {
        bytes = new Uint8Array(0);
    }

    options = ToDictionary(options);

    // 1. If the do not flush flag is unset, set decoder to a new
    // encoding's decoder, set stream to a new stream, and unset the
    // BOM seen flag.
    if (!this._do_not_flush) {
        this._decoder = decoders[this._encoding.name]({
            fatal: this._error_mode === 'fatal'
        });
        this._BOMseen = false;
    }

    // 2. If options's stream is true, set the do not flush flag, and
    // unset the do not flush flag otherwise.
    this._do_not_flush = Boolean(options['stream']);

    // 3. If input is given, push a copy of input to stream.
    // TODO: Align with spec algorithm - maintain stream on instance.
    var input_stream = new Stream(bytes);

    // 4. Let output be a new stream.
    var output = [];

    /** @type {?(number|!Array.<number>)} */
    var result;

    // 5. While true:
    while (true) {
        // 1. Let token be the result of reading from stream.
        var token = input_stream.read();

        // 2. If token is end-of-stream and the do not flush flag is
        // set, return output, serialized.
        // TODO: Align with spec algorithm.
        if (token === end_of_stream)
            break;

        // 3. Otherwise, run these subsubsteps:

        // 1. Let result be the result of processing token for decoder,
        // stream, output, and error mode.
        result = this._decoder.handler(input_stream, token);

        // 2. If result is finished, return output, serialized.
        if (result === finished)
            break;

        if (result !== null) {
            if (Array.isArray(result))
                output.push.apply(output, /**@type {!Array.<number>}*/ (result));
            else
                output.push(result);
        }

        // 3. Otherwise, if result is error, throw a TypeError.
        // (Thrown in handler)

        // 4. Otherwise, do nothing.
    }
    // TODO: Align with spec algorithm.
    if (!this._do_not_flush) {
        do {
            result = this._decoder.handler(input_stream, input_stream.read());
            if (result === finished)
                break;
            if (result === null)
                continue;
            if (Array.isArray(result))
                output.push.apply(output, /**@type {!Array.<number>}*/ (result));
            else
                output.push(result);
        } while (!input_stream.endOfStream());
        this._decoder = null;
    }

    // A TextDecoder object also has an associated serialize stream
    // algorithm...
    /**
     * @param {!Array.<number>} stream
     * @return {string}
     * @this {TextDecoder}
     */
    function serializeStream(stream) {
        // 1. Let token be the result of reading from stream.
        // (Done in-place on array, rather than as a stream)

        // 2. If encoding is UTF-8, UTF-16BE, or UTF-16LE, and ignore
        // BOM flag and BOM seen flag are unset, run these subsubsteps:
        if (includes(['UTF-8', 'UTF-16LE', 'UTF-16BE'], this._encoding.name) &&
            !this._ignoreBOM && !this._BOMseen) {
            if (stream.length > 0 && stream[0] === 0xFEFF) {
                // 1. If token is U+FEFF, set BOM seen flag.
                this._BOMseen = true;
                stream.shift();
            } else if (stream.length > 0) {
                // 2. Otherwise, if token is not end-of-stream, set BOM seen
                // flag and append token to stream.
                this._BOMseen = true;
            } else {
                // 3. Otherwise, if token is not end-of-stream, append token
                // to output.
                // (no-op)
            }
        }
        // 4. Otherwise, return output.
        return codePointsToString(stream);
    }

    return serializeStream.call(this, output);
};

// 8.2 Interface TextEncoder

/**
 * @constructor
 * @param {string=} label The label of the encoding. NONSTANDARD.
 * @param {Object=} options NONSTANDARD.
 */
function TextEncoder(label, options) {
    // Web IDL conventions
    if (!(this instanceof TextEncoder))
        throw TypeError('Called as a function. Did you forget \'new\'?');
    options = ToDictionary(options);

    // A TextEncoder object has an associated encoding and encoder.

    /** @private */
    this._encoding = null;
    /** @private @type {?Encoder} */
    this._encoder = null;

    // Non-standard
    /** @private @type {boolean} */
    this._do_not_flush = false;
    /** @private @type {string} */
    this._fatal = Boolean(options['fatal']) ? 'fatal' : 'replacement';

    // 1. Let enc be a new TextEncoder object.
    var enc = this;

    // 2. Set enc's encoding to UTF-8's encoder.
    if (Boolean(options['NONSTANDARD_allowLegacyEncoding'])) {
        // NONSTANDARD behavior.
        label = label !== undefined ? String(label) : DEFAULT_ENCODING;
        var encoding = getEncoding(label);
        if (encoding === null || encoding.name === 'replacement')
            throw RangeError('Unknown encoding: ' + label);
        if (!encoders[encoding.name]) {
            throw Error('Encoder not present.' +
                ' Did you forget to include encoding-indexes.js first?');
        }
        enc._encoding = encoding;
    } else {
        // Standard behavior.
        enc._encoding = getEncoding('utf-8');

        if (label !== undefined && 'console' in global) {
            console.warn('TextEncoder constructor called with encoding label, ' + 'which is ignored.');
        }
    }

    // For pre-ES5 runtimes:
    if (!Object.defineProperty)
        this.encoding = enc._encoding.name.toLowerCase();

    // 3. Return enc.
    return enc;
}

if (Object.defineProperty) {
    // The encoding attribute's getter must return encoding's name.
    Object.defineProperty(TextEncoder.prototype, 'encoding', {
        /** @this {TextEncoder} */
        get: function () {
            return this._encoding.name.toLowerCase();
        }
    });
}

/**
 * @param {string=} opt_string The string to encode.
 * @param {Object=} options
 * @return {!Uint8Array} Encoded bytes, as a Uint8Array.
 */
TextEncoder.prototype.encode = function encode(opt_string, options) {
    opt_string = opt_string === undefined ? '' : String(opt_string);
    options = ToDictionary(options);

    // NOTE: This option is nonstandard. None of the encodings
    // permitted for encoding (i.e. UTF-8, UTF-16) are stateful when
    // the input is a USVString so streaming is not necessary.
    if (!this._do_not_flush)
        this._encoder = encoders[this._encoding.name]({
            fatal: this._fatal === 'fatal'
        });
    this._do_not_flush = Boolean(options['stream']);

    // 1. Convert input to a stream.
    var input = new Stream(stringToCodePoints(opt_string));

    // 2. Let output be a new stream
    var output = [];

    /** @type {?(number|!Array.<number>)} */
    var result;
    // 3. While true, run these substeps:
    while (true) {
        // 1. Let token be the result of reading from input.
        var token = input.read();
        if (token === end_of_stream)
            break;
        // 2. Let result be the result of processing token for encoder,
        // input, output.
        result = this._encoder.handler(input, token);
        if (result === finished)
            break;
        if (Array.isArray(result))
            output.push.apply(output, /**@type {!Array.<number>}*/ (result));
        else
            output.push(result);
    }
    // TODO: Align with spec algorithm.
    if (!this._do_not_flush) {
        while (true) {
            result = this._encoder.handler(input, input.read());
            if (result === finished)
                break;
            if (Array.isArray(result))
                output.push.apply(output, /**@type {!Array.<number>}*/ (result));
            else
                output.push(result);
        }
        this._encoder = null;
    }
    // 3. If result is finished, convert output into a byte sequence,
    // and then return a Uint8Array object wrapping an ArrayBuffer
    // containing output.
    return new Uint8Array(output);
};


//
// 9. The encoding
//

// 9.1 utf-8

// 9.1.1 utf-8 decoder
/**
 * @constructor
 * @implements {Decoder}
 * @param {{fatal: boolean}} options
 */
function UTF8Decoder(options) {
    var fatal = options.fatal;

    // utf-8's decoder's has an associated utf-8 code point, utf-8
    // bytes seen, and utf-8 bytes needed (all initially 0), a utf-8
    // lower boundary (initially 0x80), and a utf-8 upper boundary
    // (initially 0xBF).
    var /** @type {number} */ utf8_code_point = 0,
        /** @type {number} */
        utf8_bytes_seen = 0,
        /** @type {number} */
        utf8_bytes_needed = 0,
        /** @type {number} */
        utf8_lower_boundary = 0x80,
        /** @type {number} */
        utf8_upper_boundary = 0xBF;

    /**
     * @param {Stream} stream The stream of bytes being decoded.
     * @param {number} bite The next byte read from the stream.
     * @return {?(number|!Array.<number>)} The next code point(s)
     *     decoded, or null if not enough data exists in the input
     *     stream to decode a complete code point.
     */
    this.handler = function (stream, bite) {
        // 1. If byte is end-of-stream and utf-8 bytes needed is not 0,
        // set utf-8 bytes needed to 0 and return error.
        if (bite === end_of_stream && utf8_bytes_needed !== 0) {
            utf8_bytes_needed = 0;
            return decoderError(fatal);
        }

        // 2. If byte is end-of-stream, return finished.
        if (bite === end_of_stream)
            return finished;

        // 3. If utf-8 bytes needed is 0, based on byte:
        if (utf8_bytes_needed === 0) {

            // 0x00 to 0x7F
            if (inRange(bite, 0x00, 0x7F)) {
                // Return a code point whose value is byte.
                return bite;
            }

            // 0xC2 to 0xDF
            else if (inRange(bite, 0xC2, 0xDF)) {
                // 1. Set utf-8 bytes needed to 1.
                utf8_bytes_needed = 1;

                // 2. Set UTF-8 code point to byte & 0x1F.
                utf8_code_point = bite & 0x1F;
            }

            // 0xE0 to 0xEF
            else if (inRange(bite, 0xE0, 0xEF)) {
                // 1. If byte is 0xE0, set utf-8 lower boundary to 0xA0.
                if (bite === 0xE0)
                    utf8_lower_boundary = 0xA0;
                // 2. If byte is 0xED, set utf-8 upper boundary to 0x9F.
                if (bite === 0xED)
                    utf8_upper_boundary = 0x9F;
                // 3. Set utf-8 bytes needed to 2.
                utf8_bytes_needed = 2;
                // 4. Set UTF-8 code point to byte & 0xF.
                utf8_code_point = bite & 0xF;
            }

            // 0xF0 to 0xF4
            else if (inRange(bite, 0xF0, 0xF4)) {
                // 1. If byte is 0xF0, set utf-8 lower boundary to 0x90.
                if (bite === 0xF0)
                    utf8_lower_boundary = 0x90;
                // 2. If byte is 0xF4, set utf-8 upper boundary to 0x8F.
                if (bite === 0xF4)
                    utf8_upper_boundary = 0x8F;
                // 3. Set utf-8 bytes needed to 3.
                utf8_bytes_needed = 3;
                // 4. Set UTF-8 code point to byte & 0x7.
                utf8_code_point = bite & 0x7;
            }

            // Otherwise
            else {
                // Return error.
                return decoderError(fatal);
            }

            // Return continue.
            return null;
        }

        // 4. If byte is not in the range utf-8 lower boundary to utf-8
        // upper boundary, inclusive, run these substeps:
        if (!inRange(bite, utf8_lower_boundary, utf8_upper_boundary)) {

            // 1. Set utf-8 code point, utf-8 bytes needed, and utf-8
            // bytes seen to 0, set utf-8 lower boundary to 0x80, and set
            // utf-8 upper boundary to 0xBF.
            utf8_code_point = utf8_bytes_needed = utf8_bytes_seen = 0;
            utf8_lower_boundary = 0x80;
            utf8_upper_boundary = 0xBF;

            // 2. Prepend byte to stream.
            stream.prepend(bite);

            // 3. Return error.
            return decoderError(fatal);
        }

        // 5. Set utf-8 lower boundary to 0x80 and utf-8 upper boundary
        // to 0xBF.
        utf8_lower_boundary = 0x80;
        utf8_upper_boundary = 0xBF;

        // 6. Set UTF-8 code point to (UTF-8 code point << 6) | (byte &
        // 0x3F)
        utf8_code_point = (utf8_code_point << 6) | (bite & 0x3F);

        // 7. Increase utf-8 bytes seen by one.
        utf8_bytes_seen += 1;

        // 8. If utf-8 bytes seen is not equal to utf-8 bytes needed,
        // continue.
        if (utf8_bytes_seen !== utf8_bytes_needed)
            return null;

        // 9. Let code point be utf-8 code point.
        var code_point = utf8_code_point;

        // 10. Set utf-8 code point, utf-8 bytes needed, and utf-8 bytes
        // seen to 0.
        utf8_code_point = utf8_bytes_needed = utf8_bytes_seen = 0;

        // 11. Return a code point whose value is code point.
        return code_point;
    };
}

// 9.1.2 utf-8 encoder
/**
 * @constructor
 * @implements {Encoder}
 * @param {{fatal: boolean}} options
 */
function UTF8Encoder(options) {
    var fatal = options.fatal;
    /**
     * @param {Stream} stream Input stream.
     * @param {number} code_point Next code point read from the stream.
     * @return {(number|!Array.<number>)} Byte(s) to emit.
     */
    this.handler = function (stream, code_point) {
        // 1. If code point is end-of-stream, return finished.
        if (code_point === end_of_stream)
            return finished;

        // 2. If code point is an ASCII code point, return a byte whose
        // value is code point.
        if (isASCIICodePoint(code_point))
            return code_point;

        // 3. Set count and offset based on the range code point is in:
        var count, offset;
        // U+0080 to U+07FF, inclusive:
        if (inRange(code_point, 0x0080, 0x07FF)) {
            // 1 and 0xC0
            count = 1;
            offset = 0xC0;
        }
        // U+0800 to U+FFFF, inclusive:
        else if (inRange(code_point, 0x0800, 0xFFFF)) {
            // 2 and 0xE0
            count = 2;
            offset = 0xE0;
        }
        // U+10000 to U+10FFFF, inclusive:
        else if (inRange(code_point, 0x10000, 0x10FFFF)) {
            // 3 and 0xF0
            count = 3;
            offset = 0xF0;
        }

        // 4. Let bytes be a byte sequence whose first byte is (code
        // point >> (6 × count)) + offset.
        var bytes = [(code_point >> (6 * count)) + offset];

        // 5. Run these substeps while count is greater than 0:
        while (count > 0) {

            // 1. Set temp to code point >> (6 × (count − 1)).
            var temp = code_point >> (6 * (count - 1));

            // 2. Append to bytes 0x80 | (temp & 0x3F).
            bytes.push(0x80 | (temp & 0x3F));

            // 3. Decrease count by one.
            count -= 1;
        }

        // 6. Return bytes bytes, in order.
        return bytes;
    };
}

/** @param {{fatal: boolean}} options */
encoders['UTF-8'] = function (options) {
    return new UTF8Encoder(options);
};
/** @param {{fatal: boolean}} options */
decoders['UTF-8'] = function (options) {
    return new UTF8Decoder(options);
};
